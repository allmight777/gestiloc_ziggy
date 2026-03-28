<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentReceipt;
use App\Models\Lease;
use App\Models\Property;
use App\Models\PropertyDelegation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class RentReceiptController extends Controller
{
    /**
     * Liste les quittances avec filtres
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        Log::info('[RentReceiptController@index] incoming', [
            'auth_id' => $user?->id,
            'roles'   => $user?->roles?->pluck('name'),
            'query'   => $request->query(),
        ]);

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $type = $request->query('type'); // independent | invoice | null
        $status = $request->query('status'); // issued | pending | all
        $propertyId = $request->query('property_id');
        $search = $request->query('search');
        $year = $request->query('year');

        $q = RentReceipt::query()->latest();

        // ✅ BAILLEUR
        if ($user->hasRole('landlord')) {
            $q->where('landlord_id', $user->id);
        }
        // ✅ CO-PROPRIÉTAIRE
        elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            // Récupérer les IDs des propriétés déléguées
            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            $q->whereIn('property_id', $delegatedPropertyIds);
        }
        // ✅ LOCATAIRE
        elseif ($user->hasRole('tenant')) {
            $tenant = $user->tenant;

            if (!$tenant) {
                return response()->json(['message' => 'Tenant profile not found'], 422);
            }

            $q->where('tenant_id', $tenant->id);
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // ✅ Filtres
        if ($type && Schema::hasColumn('rent_receipts', 'type')) {
            $q->where('type', $type);
        }

        if ($status && $status !== 'all') {
            if ($status === 'sent' || $status === 'issued') {
                $q->where('status', 'issued');
            } elseif ($status === 'pending') {
                $q->where('status', 'pending');
            } elseif ($status === 'year') {
                $q->whereYear('issued_date', now()->year);
            } else {
                $q->where('status', $status);
            }
        }

        if ($propertyId) {
            $q->where('property_id', $propertyId);
        }

        if ($year) {
            $q->whereYear('issued_date', $year);
        }

        if ($search) {
            $q->where(function($query) use ($search) {
                $query->where('reference', 'like', "%{$search}%")
                      ->orWhereHas('tenant', function($tenantQuery) use ($search) {
                          $tenantQuery->where('first_name', 'like', "%{$search}%")
                                      ->orWhere('last_name', 'like', "%{$search}%")
                                      ->orWhereHas('user', function($userQuery) use ($search) {
                                          $userQuery->where('name', 'like', "%{$search}%")
                                                    ->orWhere('email', 'like', "%{$search}%");
                                      });
                      })
                      ->orWhereHas('property', function($propertyQuery) use ($search) {
                          $propertyQuery->where('name', 'like', "%{$search}%")
                                        ->orWhere('address', 'like', "%{$search}%")
                                        ->orWhere('city', 'like', "%{$search}%");
                      });
            });
        }

        $perPage = $request->query('per_page', 12);
        $rows = $q->with([
            'property',
            'lease',
            'tenant.user',   // ✅ email/phone côté locataire
            'landlord',      // ✅ bailleur user
        ])->paginate($perPage);

        return response()->json($rows);
    }

    /**
     * Récupérer les propriétés pour le filtre
     */
    public function getPropertiesForFilter(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // ✅ BAILLEUR
        if ($user->hasRole('landlord')) {
            $properties = Property::where('landlord_id', $user->id)
                ->orWhere('user_id', $user->id)
                ->select('id', 'name', 'address', 'city')
                ->get();
        }
        // ✅ CO-PROPRIÉTAIRE
        elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            $properties = Property::whereIn('id', $delegatedPropertyIds)
                ->select('id', 'name', 'address', 'city')
                ->get();
        }
        // ✅ AUTRES
        else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($properties);
    }

    /**
     * Récupérer les baux pour le formulaire de création
     */
    public function getLeasesForForm(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // ✅ BAILLEUR
        if ($user->hasRole('landlord')) {
            $leases = Lease::with(['property', 'tenant.user'])
                ->where('status', 'active')
                ->whereHas('property', function($query) use ($user) {
                    $query->where('landlord_id', $user->id)
                          ->orWhere('user_id', $user->id);
                })
                ->get();
        }
        // ✅ CO-PROPRIÉTAIRE
        elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            $leases = Lease::with(['property', 'tenant.user'])
                ->where('status', 'active')
                ->whereIn('property_id', $delegatedPropertyIds)
                ->get();
        }
        // ✅ AUTRES
        else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($leases);
    }

    /**
     * ✅ Création réservée au bailleur ou co-propriétaire
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        Log::info('[RentReceiptController@store] incoming', [
            'auth_id' => $user?->id,
            'roles'   => $user?->roles?->pluck('name'),
            'payload' => $request->all(),
        ]);

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->hasRole('landlord') && !$user->hasRole('co_owner')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'lease_id'    => 'required|exists:leases,id',
            'type'        => 'required|in:independent,invoice',
            'paid_month'  => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'issued_date' => 'required|date',
            'amount_paid' => 'required|numeric|min:0',
            'notes'       => 'nullable|string|max:2000',
            'send_email'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $lease = Lease::with(['property', 'tenant.user'])->find($request->lease_id);
        if (!$lease) return response()->json(['message' => 'Lease not found'], 404);

        $property = $lease->property;
        if (!$property) return response()->json(['message' => 'Property not found'], 404);

        // ✅ Vérification des droits d'accès
        if ($user->hasRole('landlord')) {
            $ownerByUserId = isset($property->user_id) && ((int)$property->user_id === (int)$user->id);
            $ownerByLandlordId = isset($property->landlord_id) && ((int)$property->landlord_id === (int)$user->id);

            if (!$ownerByUserId && !$ownerByLandlordId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $hasDelegation = PropertyDelegation::where('property_id', $property->id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();

            if (!$hasDelegation) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        // ✅ Vérifier qu'une quittance n'existe pas déjà pour ce mois
        $existingReceipt = RentReceipt::where('lease_id', $lease->id)
            ->where('paid_month', $request->paid_month)
            ->first();

        if ($existingReceipt) {
            return response()->json([
                'message' => 'Une quittance existe déjà pour ce mois et ce bail',
                'errors' => ['paid_month' => ['Une quittance existe déjà pour ce mois']]
            ], 422);
        }

        [$yearStr, $monthStr] = explode('-', $request->paid_month);
        $year  = (int) $yearStr;
        $month = (int) $monthStr;

        $amount = (float) $request->amount_paid;

        // ✅ Générer une référence unique
        $receiptCount = RentReceipt::whereYear('issued_date', $year)
            ->whereMonth('issued_date', $month)
            ->count();
        $reference = 'RQ-' . $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' .
                    str_pad((string) ($receiptCount + 1), 4, '0', STR_PAD_LEFT);

        $data = [
            'lease_id'    => $lease->id,
            'property_id' => $lease->property_id,
            'landlord_id' => $user->id,          // users.id
            'tenant_id'   => $lease->tenant_id,  // tenants.id ✅
            'status'      => 'issued',
            'notes'       => $request->notes,
            'reference'   => $reference,
        ];

        if (Schema::hasColumn('rent_receipts', 'type')) {
            $data['type'] = $request->type;
        }
        if (Schema::hasColumn('rent_receipts', 'paid_month')) {
            $data['paid_month'] = $request->paid_month;
        }
        if (Schema::hasColumn('rent_receipts', 'month')) {
            $data['month'] = $month;
        }
        if (Schema::hasColumn('rent_receipts', 'year')) {
            $data['year'] = $year;
        }
        if (Schema::hasColumn('rent_receipts', 'issued_date')) {
            $data['issued_date'] = $request->issued_date;
        }
        if (Schema::hasColumn('rent_receipts', 'amount_paid')) {
            $data['amount_paid'] = $amount;
        }

        $receipt = RentReceipt::create($data);

        // ✅ Générer le PDF
        $pdfPath = $this->generatePdf($receipt);

        // ✅ Envoyer par email si demandé
        if ($request->has('send_email') && $request->send_email) {
            $this->sendReceiptEmail($receipt, $pdfPath);
        }

        return response()->json(
            $receipt->load([
                'property',
                'lease',
                'tenant.user',
                'landlord'
            ]), 201
        );
    }

    /**
     * ✅ Télécharger PDF quittance
     */
    public function pdf($id)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $receipt = RentReceipt::with(['property', 'lease', 'tenant.user', 'landlord'])->findOrFail($id);

        // ✅ Vérification des droits d'accès
        if ($user->hasRole('landlord')) {
            if ((int)$receipt->landlord_id !== (int)$user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $hasDelegation = PropertyDelegation::where('property_id', $receipt->property_id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();

            if (!$hasDelegation) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->hasRole('tenant')) {
            $tenant = $user->tenant;
            if (!$tenant) return response()->json(['message' => 'Tenant profile missing'], 422);

            if ((int)$receipt->tenant_id !== (int)$tenant->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // 1) Si le PDF est stocké
        if (Schema::hasColumn('rent_receipts', 'pdf_path') && $receipt->pdf_path) {
            if (Storage::disk('public')->exists($receipt->pdf_path)) {
                $filename = 'quittance-' . ($receipt->paid_month ?? $receipt->id) . '.pdf';
                return Storage::disk('public')->download($receipt->pdf_path, $filename);
            }
        }

        // 2) fallback : générer à la volée
        try {
            $pdfPath = $this->generatePdf($receipt);
            return response()->download($pdfPath, 'quittance_' . $receipt->reference . '.pdf');
        } catch (\Exception $e) {
            Log::error('Erreur génération PDF', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la génération du PDF'], 500);
        }
    }

    /**
     * Afficher une quittance spécifique
     */
    public function show($id)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $receipt = RentReceipt::with([
            'property',
            'lease',
            'tenant.user',
            'landlord'
        ])->findOrFail($id);

        // ✅ Vérification des droits d'accès
        if ($user->hasRole('landlord')) {
            if ((int)$receipt->landlord_id !== (int)$user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $hasDelegation = PropertyDelegation::where('property_id', $receipt->property_id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();

            if (!$hasDelegation) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->hasRole('tenant')) {
            $tenant = $user->tenant;
            if (!$tenant) return response()->json(['message' => 'Tenant profile missing'], 422);

            if ((int)$receipt->tenant_id !== (int)$tenant->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($receipt);
    }

    /**
     * Envoyer une quittance par email
     */
    public function sendByEmail(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $receipt = RentReceipt::with(['property', 'lease', 'tenant.user'])->findOrFail($id);

        // ✅ Vérification des droits d'accès
        if ($user->hasRole('landlord')) {
            if ((int)$receipt->landlord_id !== (int)$user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $hasDelegation = PropertyDelegation::where('property_id', $receipt->property_id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();

            if (!$hasDelegation) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        try {
            $pdfPath = $this->generatePdf($receipt);
            $emailSent = $this->sendReceiptEmail($receipt, $pdfPath);

            if ($emailSent) {
                return response()->json(['message' => 'Quittance envoyée par email avec succès']);
            } else {
                return response()->json(['message' => 'Email non envoyé (adresse non trouvée)'], 400);
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi email', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de l\'envoi'], 500);
        }
    }

    /**
     * Supprimer une quittance
     */
    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $receipt = RentReceipt::findOrFail($id);

        // ✅ Vérification des droits d'accès
        if ($user->hasRole('landlord')) {
            if ((int)$receipt->landlord_id !== (int)$user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $hasDelegation = PropertyDelegation::where('property_id', $receipt->property_id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();

            if (!$hasDelegation) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $receipt->delete();

        return response()->json(['message' => 'Quittance supprimée avec succès']);
    }

    /**
     * Statistiques pour le dashboard
     */
    public function stats(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $query = RentReceipt::query();

        // ✅ Filtrage par rôle
        if ($user->hasRole('landlord')) {
            $query->where('landlord_id', $user->id);
        } elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['message' => 'Co-owner profile not found'], 422);
            }

            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            $query->whereIn('property_id', $delegatedPropertyIds);
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $stats = [
            'total' => $query->count(),
            'total_amount' => $query->sum('amount_paid'),
            'this_month' => (clone $query)->whereMonth('issued_date', now()->month)
                ->whereYear('issued_date', now()->year)
                ->count(),
            'this_month_amount' => (clone $query)->whereMonth('issued_date', now()->month)
                ->whereYear('issued_date', now()->year)
                ->sum('amount_paid'),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'issued' => (clone $query)->where('status', 'issued')->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Générer le PDF de la quittance
     */
    private function generatePdf(RentReceipt $receipt)
    {
        try {
            $receipt->load(['property', 'lease', 'tenant.user', 'landlord']);

            $data = [
                'receipt' => $receipt,
                'property' => $receipt->property,
                'lease' => $receipt->lease,
                'tenant' => $receipt->tenant,
                'landlord' => $receipt->landlord,
                'date_emission' => Carbon::parse($receipt->issued_date)->format('d/m/Y'),
                'periode' => Carbon::parse($receipt->paid_month . '-01')->format('m/Y'),
                'montant_lettres' => $this->numberToWords($receipt->amount_paid),
            ];

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.quittance', $data)
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'defaultFont' => 'Arial',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                ]);

            $filename = 'quittance_' . $receipt->reference . '_' . time() . '.pdf';
            $path = storage_path('app/public/quittances/' . $filename);

            if (!file_exists(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }

            $pdf->save($path);

            // Sauvegarder le chemin dans la base de données
            if (Schema::hasColumn('rent_receipts', 'pdf_path')) {
                $receipt->update(['pdf_path' => 'quittances/' . $filename]);
            }

            return $path;

        } catch (\Exception $e) {
            Log::error('Erreur génération PDF quittance', [
                'error' => $e->getMessage(),
                'receipt_id' => $receipt->id,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Envoyer la quittance par email
     */
    private function sendReceiptEmail(RentReceipt $receipt, $pdfPath)
    {
        try {
            $receipt->load(['tenant.user', 'property']);
            $tenantEmail = $receipt->tenant->user->email ?? null;

            if (!$tenantEmail) {
                Log::warning('Email du locataire non trouvé', [
                    'receipt_id' => $receipt->id,
                    'tenant_id' => $receipt->tenant_id,
                ]);
                return false;
            }

            $data = [
                'tenant_name' => $receipt->tenant->first_name . ' ' . $receipt->tenant->last_name,
                'property_address' => $receipt->property->address,
                'periode' => Carbon::parse($receipt->paid_month . '-01')->format('m/Y'),
                'montant' => number_format($receipt->amount_paid, 0, ',', ' ') . ' FCFA',
                'reference' => $receipt->reference,
                'date_emission' => Carbon::parse($receipt->issued_date)->format('d/m/Y'),
            ];

            \Illuminate\Support\Facades\Mail::send('emails.quittance', $data, function ($message) use ($tenantEmail, $receipt, $pdfPath, $data) {
                $message->to($tenantEmail)
                    ->subject('Quittance de loyer - ' . ($receipt->property->name ?? 'Bien') . ' - ' . $data['periode'])
                    ->attach($pdfPath, [
                        'as' => 'quittance_' . $receipt->reference . '.pdf',
                        'mime' => 'application/pdf',
                    ]);
            });

            Log::info('Email quittance envoyé', [
                'receipt_id' => $receipt->id,
                'tenant_email' => $tenantEmail,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Erreur envoi email quittance', [
                'error' => $e->getMessage(),
                'receipt_id' => $receipt->id,
            ]);
            return false;
        }
    }

    /**
     * Convertir un nombre en lettres
     */
    private function numberToWords($number)
    {
        $intPart = (int) $number;
        $decimalPart = round(($number - $intPart) * 100);

        if ($intPart == 0) {
            $result = 'zéro';
        } else {
            $result = $this->convertNumberToFrench($intPart);
        }

        if ($decimalPart > 0) {
            $result .= ' virgule ' . $this->convertNumberToFrench($decimalPart);
        }

        return ucfirst($result) . ' francs CFA';
    }

    /**
     * Convertir un nombre en français (simplifié)
     */
    private function convertNumberToFrench($number)
    {
        if ($number < 1000) {
            return (string) $number;
        }

        $millions = floor($number / 1000000);
        $rest = $number % 1000000;

        if ($millions > 0) {
            return $millions . ' million' . ($millions > 1 ? 's' : '') .
                   ($rest > 0 ? ' ' . $this->convertNumberToFrench($rest) : '');
        }

        $thousands = floor($number / 1000);
        $rest = $number % 1000;

        if ($thousands > 0) {
            return $thousands . ' mille' . ($rest > 0 ? ' ' . $this->convertNumberToFrench($rest) : '');
        }

        return (string) $number;
    }
}
