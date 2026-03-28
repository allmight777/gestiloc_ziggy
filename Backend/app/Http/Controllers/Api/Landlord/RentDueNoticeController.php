<?php

namespace App\Http\Controllers\Api\Landlord;

use App\Http\Controllers\Controller;
use App\Models\RentDueNotice;
use App\Models\Lease;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class RentDueNoticeController extends Controller
{
    /**
     * Liste des avis d'échéance pour le propriétaire
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $propertyIds = Property::where('user_id', $user->id)
            ->orWhere('landlord_id', $user->id)
            ->pluck('id')
            ->toArray();

        if (empty($propertyIds)) {
            $propertyIds = [0];
        }

        $query = RentDueNotice::whereIn('property_id', $propertyIds)
            ->with(['lease', 'property', 'tenant.user']);

        // Filtres
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('tenant', function($tenantQuery) use ($search) {
                      $tenantQuery->where('first_name', 'like', "%{$search}%")
                                  ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 15);
        $notices = $query->orderBy('due_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Formater les dates
        $notices->getCollection()->transform(function ($notice) {
            $notice->due_date_formatted = Carbon::parse($notice->due_date)->format('d/m/Y');
            $notice->month_year_formatted = Carbon::parse($notice->month_year . '-01')->translatedFormat('F Y');
            $notice->sent_at_formatted = $notice->sent_at ? Carbon::parse($notice->sent_at)->format('d/m/Y H:i') : null;
            $notice->paid_at_formatted = $notice->paid_at ? Carbon::parse($notice->paid_at)->format('d/m/Y H:i') : null;
            $notice->created_at_formatted = Carbon::parse($notice->created_at)->format('d/m/Y');
            return $notice;
        });

        return response()->json($notices);
    }

    /**
     * Statistiques
     */
    public function stats(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $propertyIds = Property::where('user_id', $user->id)
            ->orWhere('landlord_id', $user->id)
            ->pluck('id')
            ->toArray();

        if (empty($propertyIds)) {
            $propertyIds = [0];
        }

        $query = RentDueNotice::whereIn('property_id', $propertyIds);

        return response()->json([
            'total' => $query->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'sent' => (clone $query)->where('status', 'sent')->count(),
            'paid' => (clone $query)->where('status', 'paid')->count(),
        ]);
    }

    /**
     * Propriétés pour le filtre
     */
    public function getProperties(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $properties = Property::where('user_id', $user->id)
            ->orWhere('landlord_id', $user->id)
            ->select('id', 'name', 'address', 'city')
            ->get();

        return response()->json($properties);
    }

    /**
     * Baux pour le formulaire
     */
    public function getLeasesForForm(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $propertyIds = Property::where('user_id', $user->id)
            ->orWhere('landlord_id', $user->id)
            ->pluck('id')
            ->toArray();

        if (empty($propertyIds)) {
            $propertyIds = [0];
        }

        $leases = Lease::whereIn('property_id', $propertyIds)
            ->where('status', 'active')
            ->with(['property', 'tenant.user'])
            ->get();

        // S'assurer que les montants sont bien des nombres
        $leases->transform(function ($lease) {
            $lease->rent_amount = (float) $lease->rent_amount;
            $lease->charges_amount = (float) $lease->charges_amount;
            return $lease;
        });

        return response()->json($leases);
    }

    /**
     * Créer un avis d'échéance
     */
/**
 * Créer un avis d'échéance
 */
public function store(Request $request)
{
    $user = Auth::user();

    if (!$user || !$user->hasRole('landlord')) {
        return response()->json(['message' => 'Non autorisé'], 403);
    }

    $validated = $request->validate([
        'lease_id' => 'required|exists:leases,id',
        'type' => 'required|in:rent,charges,deposit,repair,other',
        'period_start' => 'nullable|date',
        'period_end' => 'nullable|date',
        'due_date' => 'required|date',
        'amount' => 'required|numeric|min:0',
        'payment_method' => 'nullable|string|max:100',
        'notes' => 'nullable|string|max:1000',
        'send_email' => 'nullable|boolean',
    ]);

    try {
        DB::beginTransaction();

        $lease = Lease::with(['property', 'tenant.user'])->find($validated['lease_id']);

        // Vérifier que le bail appartient au propriétaire
        $property = Property::find($lease->property_id);
        if ($property->user_id != $user->id && $property->landlord_id != $user->id) {
            throw new \Exception('Cette propriété ne vous appartient pas');
        }

        $monthYear = Carbon::parse($validated['due_date'])->format('Y-m');

        // Vérifier si un avis existe déjà
        $existing = RentDueNotice::where('lease_id', $lease->id)
            ->where('month_year', $monthYear)
            ->first();

        if ($existing) {
            throw new \Exception('Un avis existe déjà pour ce mois');
        }

        // Récupérer les valeurs du bail
        $rentAmount = (float) ($lease->rent_amount ?? 0);
        $chargesAmount = (float) ($lease->charges_amount ?? 0);
        $totalMensuel = $rentAmount + $chargesAmount; // 25 + 25 = 50

        // Déterminer les montants selon le type
        $rentAmountFinal = 0;
        $chargesAmountFinal = 0;
        $totalAmountFinal = 0;

        if ($validated['type'] === 'rent') {
            // 🔥 POUR LE LOYER : total = loyer + charges
            $rentAmountFinal = $rentAmount;
            $chargesAmountFinal = $chargesAmount;
            $totalAmountFinal = $totalMensuel; // 50
        } elseif ($validated['type'] === 'charges') {
            // Pour les charges, on ne prend que les charges
            $rentAmountFinal = 0;
            $chargesAmountFinal = $chargesAmount;
            $totalAmountFinal = $chargesAmount; // 25
        } else {
            // Pour les autres types (deposit, repair, other)
            $totalAmountFinal = (float) $validated['amount'];
            $rentAmountFinal = $totalAmountFinal;
            $chargesAmountFinal = 0;
        }

        // Créer l'avis
        $notice = RentDueNotice::create([
            'lease_id' => $lease->id,
            'property_id' => $lease->property_id,
            'tenant_id' => $lease->tenant_id,
            'landlord_id' => $user->id,
            'co_owner_id' => null,
            'due_date' => $validated['due_date'],
            'rent_amount' => $rentAmountFinal,
            'charges_amount' => $chargesAmountFinal,
            'total_amount' => $totalAmountFinal,
            'month_year' => $monthYear,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
            'meta' => [
                'type' => $validated['type'],
                'period_start' => $validated['period_start'] ?? null,
                'period_end' => $validated['period_end'] ?? null,
                'payment_method' => $validated['payment_method'] ?? 'Virement bancaire',
            ],
        ]);

        DB::commit();

        // Envoyer l'email si demandé
        if ($request->has('send_email') && $request->send_email) {
            try {
                $paymentLink = $notice->generatePaymentLink();
                $this->sendDueNoticeEmail($notice, $paymentLink);
                $notice->markAsSent();
            } catch (\Exception $e) {
                Log::error('Erreur envoi email', ['error' => $e->getMessage()]);
            }
        }

        return response()->json($notice, 201);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Erreur création avis', ['error' => $e->getMessage()]);
        return response()->json(['message' => $e->getMessage()], 500);
    }
}

    /**
     * Envoyer un avis par email
     */
    public function send($id)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $notice = RentDueNotice::with(['lease', 'property', 'tenant.user'])->findOrFail($id);

        try {
            $paymentLink = $notice->generatePaymentLink();
            $this->sendDueNoticeEmail($notice, $paymentLink);
            $notice->markAsSent();

            return response()->json(['message' => 'Avis envoyé avec succès']);
        } catch (\Exception $e) {
            Log::error('Erreur envoi', ['error' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Renvoyer un avis
     */
    public function resend($id)
    {
        return $this->send($id);
    }

    /**
     * Supprimer un avis
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $notice = RentDueNotice::findOrFail($id);

        if ($notice->status === 'paid') {
            return response()->json(['message' => 'Impossible de supprimer un avis déjà payé'], 400);
        }

        $notice->delete();

        return response()->json(['message' => 'Avis supprimé avec succès']);
    }

    /**
     * Envoyer l'email
     */
    private function sendDueNoticeEmail($notice, $paymentLink)
    {
        $tenant = $notice->tenant;
        $property = $notice->property;
        $tenantEmail = $tenant->user->email ?? null;

        if (!$tenantEmail) {
            throw new \Exception('Email du locataire non trouvé');
        }

        $data = [
            'tenant_name' => $tenant->first_name . ' ' . $tenant->last_name,
            'property_name' => $property->name,
            'property_address' => $property->address,
            'due_date' => Carbon::parse($notice->due_date)->format('d/m/Y'),
            'month_year' => Carbon::parse($notice->month_year . '-01')->format('F Y'),
            'rent_amount' => number_format($notice->rent_amount, 0, ',', ' ') . ' FCFA',
            'charges_amount' => number_format($notice->charges_amount, 0, ',', ' ') . ' FCFA',
            'total_amount' => number_format($notice->total_amount, 0, ',', ' ') . ' FCFA',
            'reference' => $notice->reference,
            'payment_link' => $paymentLink,
        ];

        $html = view('emails.rent-due-notice', $data)->render();

        Mail::html($html, function ($message) use ($tenantEmail, $data) {
            $message->to($tenantEmail)
                ->subject('Avis d\'échéance - ' . $data['property_name'] . ' - ' . $data['month_year']);
        });
    }
}
