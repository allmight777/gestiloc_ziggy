<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Lease;
use App\Models\Property;
use App\Models\PropertyDelegation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Services\PdfService;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentReminderMail;

class InvoiceController extends Controller
{
    /**
     * Affiche le formulaire de création de facture
     */
    public function create(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Vérifier le rôle
        if ($user->landlord) {
            // Bailleur - ses propres biens (filtrés par user_id)
            $leases = Lease::with(['property', 'tenant.user'])
                ->where('status', 'active')
                ->whereHas('property', function($q) use ($user) {
                    $q->where('user_id', $user->id); // ← FILTRE SUR user_id COMME DANS LEASECONTROLLER
                })
                ->get();

        } elseif ($user->coOwner) {
            // Copropriétaire - biens délégués
            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $user->coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            $leases = Lease::with(['property', 'tenant.user'])
                ->where('status', 'active')
                ->whereHas('property', function($q) use ($delegatedPropertyIds) {
                    $q->whereIn('id', $delegatedPropertyIds);
                })
                ->get();
        } else {
            return response()->json(['message' => 'Rôle non autorisé'], 403);
        }

        return response()->json([
            'leases' => $leases,
            'message' => 'Formulaire de création chargé'
        ]);
    }

    /**
     * Créer une nouvelle facture
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        // Vérifier que c'est un bailleur ou un co-propriétaire
        if (!$user->landlord && !$user->coOwner) {
            return response()->json(['message' => 'Seul un propriétaire ou un co-propriétaire peut créer une facture.'], 403);
        }

        $validated = $request->validate([
            'lease_id' => [
                'required',
                'exists:leases,id',
                function ($attribute, $value, $fail) use ($user) {
                    $lease = Lease::with('property')->find($value);

                    if (!$lease) {
                        $fail('Bail non trouvé.');
                        return;
                    }

                    if ($user->landlord) {
                        // Vérifier que le bailleur possède ce bien (via user_id)
                        if ($lease->property->user_id !== $user->id) { // ← FILTRE SUR user_id
                            $fail('Vous ne pouvez pas créer de facture pour ce bail.');
                        }
                    } elseif ($user->coOwner) {
                        // Vérifier que le co-propriétaire a accès à ce bien
                        $hasDelegation = PropertyDelegation::where('property_id', $lease->property_id)
                            ->where('co_owner_id', $user->coOwner->id)
                            ->where('status', 'active')
                            ->exists();

                        if (!$hasDelegation) {
                            $fail('Vous ne pouvez pas créer de facture pour ce bail.');
                        }
                    }
                }
            ],
            'type' => 'required|in:rent,deposit,charge,repair',
            'due_date' => 'required|date|after:today',
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date|after:period_start',
            'amount_total' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:card,mobile_money,virement,cheque,especes,fedapay',
            'description' => 'nullable|string|max:500',
            'create_payment_link' => 'nullable|boolean',
        ]);

        try {
            DB::beginTransaction();

            $lease = Lease::find($validated['lease_id']);

            // Générer un numéro de facture unique
            $invoiceNumber = 'FACT-' . date('Y') . '-' . str_pad(Invoice::count() + 1, 5, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'lease_id' => $validated['lease_id'],
                'type' => $validated['type'],
                'due_date' => $validated['due_date'],
                'period_start' => $validated['period_start'] ?? null,
                'period_end' => $validated['period_end'] ?? null,
                'amount_total' => $validated['amount_total'],
                'payment_method' => $validated['payment_method'],
                'status' => 'pending',
                'description' => $validated['description'] ?? null,
                'meta' => [
                    'created_by' => $user->id,
                    'created_by_type' => $user->landlord ? 'landlord' : 'co_owner',
                    'created_by_name' => $user->name,
                    'created_at' => now()->toDateTimeString(),
                ],
            ]);

            // Créer un lien de paiement si demandé
            if ($request->boolean('create_payment_link')) {
                try {
                    $token = Str::random(48);
                    $expires = now()->addHours(24);

                    \App\Models\PaymentLink::create([
                        'invoice_id' => $invoice->id,
                        'tenant_id' => $lease->tenant_id,
                        'token' => $token,
                        'expires_at' => $expires,
                    ]);

                    // Envoyer l'email au locataire
                    if ($lease->tenant && $lease->tenant->user && $lease->tenant->user->email) {
                        $url = rtrim(config('app.frontend_url', ''), '/') . '/pay-link/' . $token;
                        Mail::to($lease->tenant->user->email)
                            ->queue(new \App\Mail\PaymentLinkMail($invoice, $url));
                    }
                } catch (\Exception $e) {
                    Log::warning('Erreur création lien paiement', ['error' => $e->getMessage()]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Facture créée avec succès',
                'invoice' => new InvoiceResource($invoice->load(['lease.property', 'lease.tenant']))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Erreur création facture', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création de la facture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste les factures - CORRIGÉ AVEC FILTRE SUR user_id
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // 🔥 CORRECTION IMPORTANTE : Charger les relations lease.property et lease.tenant
        $query = Invoice::with(['lease.property', 'lease.tenant.user']);

        if ($user->landlord) {
            // FILTRER SUR user_id COMME DANS LEASECONTROLLER
            $query->whereHas('lease.property', function ($q) use ($user) {
                $q->where('user_id', $user->id); // ← FILTRE SUR user_id AU LIEU DE landlord_id
            });
        } elseif ($user->coOwner) {
            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $user->coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            $query->whereHas('lease.property', function ($q) use ($delegatedPropertyIds) {
                $q->whereIn('id', $delegatedPropertyIds);
            });
        } elseif ($user->tenant) {
            $query->whereHas('lease', function ($q) use ($user) {
                $q->where('tenant_id', $user->tenant->id);
            });
        } else {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('property_id')) {
            $query->whereHas('lease', function($q) use ($request) {
                $q->where('property_id', $request->property_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('lease.tenant.user', function($subQ) use ($search) {
                      $subQ->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('lease.property', function($subQ) use ($search) {
                      $subQ->where('name', 'like', "%{$search}%")
                            ->orWhere('address', 'like', "%{$search}%");
                  });
            });
        }

        // Récupérer les résultats
        $invoices = $query->latest('due_date')->paginate(20);

        // Retourner directement les données
        return response()->json($invoices);
    }

    /**
     * Détails d'une facture
     */
    public function show($id)
    {
        $invoice = $this->getSecureInvoice($id);
        return new InvoiceResource($invoice->load(['transactions', 'lease.property', 'lease.tenant']));
    }

    /**
     * Télécharger le PDF
     */
    public function downloadPdf($id, PdfService $pdfService)
    {
        $invoice = $this->getSecureInvoice($id);

        $type = $invoice->status === 'paid' ? 'quittance' : 'avis_echeance';

        try {
            $tempPath = $pdfService->generateInvoicePdf($invoice, $type);
            $pdfContent = Storage::get($tempPath);
            Storage::delete($tempPath);

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "attachment; filename={$type}_{$invoice->invoice_number}.pdf");
        } catch (\Exception $e) {
            Log::error('Erreur génération PDF', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la génération du PDF'], 500);
        }
    }

    /**
     * Envoyer un rappel
     */
    public function sendReminder($id)
    {
        $invoice = $this->getSecureInvoice($id);

        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Cette facture est déjà payée.'], 400);
        }

        $tenantEmail = $invoice->lease->tenant?->user?->email;

        if (!$tenantEmail) {
            return response()->json(['message' => 'Email du locataire non trouvé.'], 400);
        }

        Mail::to($tenantEmail)->queue(new PaymentReminderMail($invoice));
        $invoice->update(['reminder_sent_at' => now()]);

        return response()->json(['message' => 'Relance envoyée avec succès.']);
    }

    /**
     * Helper pour sécuriser l'accès
     */
    private function getSecureInvoice($id)
    {
        $invoice = Invoice::with(['lease.property', 'lease.tenant'])->findOrFail($id);
        $user = auth()->user();

        if ($user->landlord) {
            // Vérifier avec user_id au lieu de landlord_id
            $isOwner = $invoice->lease->property->user_id === $user->id;
            if (!$isOwner) abort(403);
        } elseif ($user->coOwner) {
            $hasAccess = PropertyDelegation::where('property_id', $invoice->lease->property_id)
                ->where('co_owner_id', $user->coOwner->id)
                ->where('status', 'active')
                ->exists();
            if (!$hasAccess) abort(403);
        } elseif ($user->tenant) {
            $isTenant = $invoice->lease->tenant_id === $user->tenant->id;
            if (!$isTenant) abort(403);
        } else {
            abort(403);
        }

        return $invoice;
    }

    /**
     * Récupérer les propriétés pour le filtre - CORRIGÉ AVEC user_id
     */
    public function getPropertiesForFilter(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if ($user->landlord) {
            // FILTRER SUR user_id COMME DANS LEASECONTROLLER
            $properties = Property::where('user_id', $user->id) // ← FILTRE SUR user_id
                ->select('id', 'name', 'address')
                ->get();
        } elseif ($user->coOwner) {
            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $user->coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            $properties = Property::whereIn('id', $delegatedPropertyIds)
                ->select('id', 'name', 'address')
                ->get();
        } else {
            return response()->json(['message' => 'Rôle non autorisé'], 403);
        }

        Log::info('Propriétés pour filtre factures', [
            'user_id' => $user->id,
            'count' => $properties->count(),
            'properties' => $properties->toArray()
        ]);

        return response()->json($properties);
    }
}
