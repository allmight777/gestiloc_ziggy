<?php

namespace App\Http\Controllers\Api\Landlord;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Lease;
use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AccountingController extends Controller
{
    /**
     * Obtenir les statistiques comptables du landlord
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $landlordId = $user->landlord->id;
            $year = $request->get('year', date('Y'));

            // Récupérer les biens du landlord
            $properties = Property::where('landlord_id', $landlordId)->get();
            $propertyIds = $properties->pluck('id')->toArray();

            if (empty($propertyIds)) {
                return response()->json($this->getEmptyStats());
            }

            // Revenus: paiements approuvés
            $revenus = Payment::whereHas('lease', function($q) use ($propertyIds) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->where('status', 'approved')
                ->whereYear('paid_at', $year)
                ->sum('amount_total');

            // Charges: factures payées
            $charges = Invoice::whereHas('lease', function($q) use ($propertyIds) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->whereYear('created_at', $year)
                ->where('status', 'paid')
                ->sum('amount_paid');

            // Coûts de maintenance
            $maintenanceCosts = MaintenanceRequest::whereIn('property_id', $propertyIds)
                ->whereYear('created_at', $year)
                ->sum('actual_cost');

            $totalCharges = $charges + $maintenanceCosts;
            $resultatNet = $revenus - $totalCharges;

            // Nombre de biens actifs
            $activeProperties = Lease::whereIn('property_id', $propertyIds)
                ->where('status', 'active')
                ->distinct('property_id')
                ->count('property_id');

            // Nombre de transactions
            $transactionsCount = Payment::whereHas('lease', function($q) use ($propertyIds) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->where('status', 'approved')
                ->whereYear('paid_at', $year)
                ->count();

            // Taux de rentabilité
            $rentabilite = $revenus > 0 ? ($resultatNet / $revenus) * 100 : 0;

            // Taux d'occupation
            $totalProperties = count($propertyIds);
            $occupiedProperties = Lease::whereIn('property_id', $propertyIds)
                ->where('status', 'active')
                ->distinct('property_id')
                ->count('property_id');
            $occupancyRate = $totalProperties > 0 ? ($occupiedProperties / $totalProperties) * 100 : 0;

            // Répartition par catégorie de revenus
            $revenusParCategorie = $this->getRevenusParCategorie($propertyIds, $year);

            // Répartition par catégorie de charges
            $chargesParCategorie = $this->getChargesParCategorie($propertyIds, $year, $maintenanceCosts, $charges);

            // Répartition par bien
            $repartitionParBien = $this->getRepartitionParBien($properties, $year);

            return response()->json([
                'resultat_net' => $resultatNet,
                'resultat_net_formatted' => number_format($resultatNet, 0, ',', ' ') . ' FCFA',
                'revenus' => $revenus,
                'revenus_formatted' => number_format($revenus, 0, ',', ' ') . ' FCFA',
                'charges' => $totalCharges,
                'charges_formatted' => number_format($totalCharges, 0, ',', ' ') . ' FCFA',
                'rentabilite' => round($rentabilite, 1),
                'active_properties' => $activeProperties,
                'transactions_count' => $transactionsCount,
                'occupancy_rate' => round($occupancyRate, 1),
                'occupied' => $occupiedProperties,
                'vacant' => $totalProperties - $occupiedProperties,
                'total_properties' => $totalProperties,
                'revenus_par_categorie' => $revenusParCategorie,
                'charges_par_categorie' => $chargesParCategorie,
                'repartition_par_bien' => $repartitionParBien,
                'variation' => $this->calculateVariation($propertyIds, $year),
                'available_years' => $this->getAvailableYears($propertyIds),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur stats comptables: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json($this->getEmptyStats(), 500);
        }
    }

    /**
     * Obtenir les transactions comptables
     */
    public function transactions(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $landlordId = $user->landlord->id;
            $year = $request->get('year', date('Y'));

            $propertyIds = Property::where('landlord_id', $landlordId)->pluck('id')->toArray();

            if (empty($propertyIds)) {
                return response()->json(['data' => []]);
            }

            // Récupérer les paiements (revenus)
            $payments = Payment::whereHas('lease', function($q) use ($propertyIds, $year) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->where('status', 'approved')
                ->whereYear('paid_at', $year)
                ->with(['lease.property', 'lease.tenant'])
                ->orderBy('paid_at', 'desc')
                ->take(50)
                ->get()
                ->map(function($payment) {
                    $propertyName = $payment->lease->property
                        ? ($payment->lease->property->name ?? $payment->lease->property->address)
                        : 'N/A';

                    return [
                        'id' => 'p_' . $payment->id,
                        'date' => $payment->paid_at,
                        'type' => 'REVENU',
                        'description' => 'Paiement de loyer' . ($payment->paid_at ? ' ' . Carbon::parse($payment->paid_at)->format('M Y') : ''),
                        'amount' => $payment->amount_total,
                        'category' => 'Loyer',
                        'property_name' => $propertyName,
                        'property_id' => $payment->lease->property_id,
                        'currency' => $payment->currency ?? 'FCFA'
                    ];
                });

            // Récupérer les factures payées (charges)
            $invoices = Invoice::whereHas('lease', function($q) use ($propertyIds, $year) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->with(['lease.property'])
                ->where('status', 'paid')
                ->whereYear('created_at', $year)
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get()
                ->map(function($invoice) {
                    $propertyName = $invoice->lease->property
                        ? ($invoice->lease->property->name ?? $invoice->lease->property->address)
                        : 'N/A';

                    $categoryMap = [
                        'rent' => 'Loyer',
                        'deposit' => 'Dépôt de garantie',
                        'charge' => 'Charges',
                        'repair' => 'Réparations',
                        'insurance' => 'Assurance',
                        'tax' => 'Taxes'
                    ];

                    return [
                        'id' => 'i_' . $invoice->id,
                        'date' => $invoice->created_at,
                        'type' => 'CHARGE',
                        'description' => ($invoice->invoice_number ?? 'Facture') . ' - ' . ($categoryMap[$invoice->type] ?? 'Autre'),
                        'amount' => $invoice->amount_paid,
                        'category' => $categoryMap[$invoice->type] ?? 'Autre',
                        'property_name' => $propertyName,
                        'property_id' => $invoice->lease->property_id,
                        'currency' => 'FCFA'
                    ];
                });

            // Récupérer les demandes de maintenance (charges)
            $maintenanceRequests = MaintenanceRequest::whereIn('property_id', $propertyIds)
                ->whereYear('created_at', $year)
                ->where('actual_cost', '>', 0)
                ->with(['property'])
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get()
                ->map(function($request) {
                    $propertyName = $request->property
                        ? ($request->property->name ?? $request->property->address)
                        : 'N/A';

                    return [
                        'id' => 'm_' . $request->id,
                        'date' => $request->created_at,
                        'type' => 'CHARGE',
                        'description' => $request->title ?? 'Travaux de maintenance',
                        'amount' => $request->actual_cost,
                        'category' => 'Travaux',
                        'property_name' => $propertyName,
                        'property_id' => $request->property_id,
                        'currency' => 'FCFA'
                    ];
                });

            // Fusionner et trier par date
            $allTransactions = collect()
                ->merge($payments)
                ->merge($invoices)
                ->merge($maintenanceRequests)
                ->sortByDesc('date')
                ->take(50)
                ->values();

            return response()->json([
                'data' => $allTransactions
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur chargement transactions: ' . $e->getMessage());
            return response()->json(['data' => []], 500);
        }
    }

    /**
     * Obtenir les données pour les graphiques mensuels
     */
    public function getChartData(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $landlordId = $user->landlord->id;
            $year = $request->get('year', date('Y'));

            $propertyIds = Property::where('landlord_id', $landlordId)->pluck('id')->toArray();

            if (empty($propertyIds)) {
                return response()->json(['data' => $this->getEmptyChartData()]);
            }

            $data = [];
            $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

            for ($i = 1; $i <= 12; $i++) {
                // Loyers reçus pour le mois
                $received = Payment::whereHas('lease', function($q) use ($propertyIds) {
                        $q->whereIn('property_id', $propertyIds);
                    })
                    ->where('status', 'approved')
                    ->whereYear('paid_at', $year)
                    ->whereMonth('paid_at', $i)
                    ->sum('amount_total');

                // Moyenne historique pour ce mois
                $average = $this->getAverageForMonth($propertyIds, $i);

                $data[] = [
                    'month' => $months[$i - 1],
                    'received' => round($received, 0),
                    'average' => round($average, 0),
                ];
            }

            return response()->json(['data' => $data]);

        } catch (\Exception $e) {
            Log::error('Erreur chart data: ' . $e->getMessage());
            return response()->json(['data' => $this->getEmptyChartData()], 500);
        }
    }

    /**
     * Créer une nouvelle transaction comptable - VERSION FINALE CORRIGÉE
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $landlordId = $user->landlord->id;

            $validated = $request->validate([
                'type' => 'required|in:REVENU,CHARGE',
                'property_id' => 'required|exists:properties,id',
                'lease_id' => 'nullable|exists:leases,id',
                'category' => 'required|string',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'date' => 'required|date',
                'payment_method' => 'nullable|string',
                'reference' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            // Vérifier que le bien appartient au landlord
            $property = Property::where('id', $validated['property_id'])
                ->where('landlord_id', $landlordId)
                ->first();

            if (!$property) {
                return response()->json(['message' => 'Propriété non trouvée ou non autorisée'], 403);
            }

            if ($validated['type'] === 'REVENU') {
                // Récupérer le bail pour obtenir le tenant_id
                $lease = Lease::find($validated['lease_id']);

                if (!$lease) {
                    return response()->json(['message' => 'Bail non trouvé'], 404);
                }

                // Créer un paiement pour les revenus avec tenant_id ET landlord_user_id
                $payment = Payment::create([
                    'lease_id' => $validated['lease_id'],
                    'tenant_id' => $lease->tenant_id,
                    'landlord_user_id' => $user->id, // ← AJOUTÉ : ID de l'utilisateur connecté
                    'amount_total' => $validated['amount'],
                    'amount' => $validated['amount'],
                    'paid_at' => $validated['date'],
                    'status' => 'approved',
                    'currency' => 'FCFA',
                    'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
                    'reference' => $validated['reference'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);

                return response()->json([
                    'message' => 'Revenu créé avec succès',
                    'data' => [
                        'id' => 'p_' . $payment->id,
                        'type' => 'REVENU',
                        'amount' => $payment->amount_total,
                        'date' => $payment->paid_at,
                        'property_id' => $validated['property_id'],
                        'lease_id' => $validated['lease_id'],
                    ]
                ], 201);
            }

            if ($validated['type'] === 'CHARGE') {
                // Récupérer le bail pour obtenir le tenant_id
                $lease = Lease::find($validated['lease_id']);

                if (!$lease) {
                    return response()->json(['message' => 'Bail non trouvé'], 404);
                }

                // Créer une facture pour les charges
                $invoice = Invoice::create([
                    'lease_id' => $validated['lease_id'],
                    'tenant_id' => $lease->tenant_id,
                    'landlord_id' => $landlordId, // ← AJOUTÉ si la table invoices a ce champ
                    'amount_due' => $validated['amount'],
                    'amount_paid' => $validated['amount'],
                    'type' => $this->mapCategoryToType($validated['category']),
                    'status' => 'paid',
                    'description' => $validated['description'],
                    'invoice_number' => $validated['reference'] ?? 'CHG-' . time(),
                    'due_date' => $validated['date'],
                ]);

                return response()->json([
                    'message' => 'Charge créée avec succès',
                    'data' => [
                        'id' => 'i_' . $invoice->id,
                        'type' => 'CHARGE',
                        'amount' => $invoice->amount_paid,
                        'date' => $invoice->created_at,
                        'property_id' => $validated['property_id'],
                        'lease_id' => $validated['lease_id'],
                    ]
                ], 201);
            }

            return response()->json(['message' => 'Type invalide'], 400);

        } catch (\Exception $e) {
            Log::error('Erreur création transaction: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['message' => 'Erreur lors de la création: ' . $e->getMessage()], 500);
        }
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private function getRevenusParCategorie($propertyIds, $year)
    {
        // Paiements de loyer - tous les paiements approuvés sont considérés comme loyers
        $loyers = Payment::whereHas('lease', function($q) use ($propertyIds) {
                $q->whereIn('property_id', $propertyIds);
            })
            ->where('status', 'approved')
            ->whereYear('paid_at', $year)
            ->sum('amount_total');

        // Pas de colonne description, donc on ne peut pas filtrer par dépôt
        // On considère que tous les paiements sont des loyers
        $deposits = 0;
        $others = 0;

        return [
            'Loyers perçus' => $loyers,
            'Dépôts de garantie' => $deposits,
            'Autres revenus' => $others,
        ];
    }

    private function getChargesParCategorie($propertyIds, $year, $maintenanceCosts, $charges)
    {
        // Factures par type
        $factures = Invoice::whereHas('lease', function($q) use ($propertyIds) {
                $q->whereIn('property_id', $propertyIds);
            })
            ->whereYear('created_at', $year)
            ->where('status', 'paid')
            ->selectRaw('type, sum(amount_paid) as total')
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        return [
            'Travaux et réparations' => $maintenanceCosts,
            'Factures payées' => $charges,
            'Assurances' => $factures['insurance']->total ?? 0,
            'Taxes' => $factures['tax']->total ?? 0,
        ];
    }

    private function getRepartitionParBien($properties, $year)
    {
        $repartition = [];

        foreach ($properties as $property) {
            $propertyRevenus = Payment::whereHas('lease', function($q) use ($property) {
                    $q->where('property_id', $property->id);
                })
                ->where('status', 'approved')
                ->whereYear('paid_at', $year)
                ->sum('amount_total');

            $propertyCharges = Invoice::whereHas('lease', function($q) use ($property) {
                    $q->where('property_id', $property->id);
                })
                ->whereYear('created_at', $year)
                ->where('status', 'paid')
                ->sum('amount_paid');

            $propertyMaintenance = MaintenanceRequest::where('property_id', $property->id)
                ->whereYear('created_at', $year)
                ->sum('actual_cost');

            $totalChargesProperty = $propertyCharges + $propertyMaintenance;
            $resultatProperty = $propertyRevenus - $totalChargesProperty;

            if ($propertyRevenus > 0 || $totalChargesProperty > 0) {
                $repartition[$property->name ?? $property->address] = [
                    'revenus' => $propertyRevenus,
                    'charges' => $totalChargesProperty,
                    'resultat' => $resultatProperty,
                ];
            }
        }

        return $repartition;
    }

    private function getAverageForMonth($propertyIds, $month)
    {
        $total = Payment::whereHas('lease', function($q) use ($propertyIds) {
                $q->whereIn('property_id', $propertyIds);
            })
            ->where('status', 'approved')
            ->whereMonth('paid_at', $month)
            ->sum('amount_total');

        $yearsCount = Payment::whereHas('lease', function($q) use ($propertyIds) {
                $q->whereIn('property_id', $propertyIds);
            })
            ->where('status', 'approved')
            ->whereMonth('paid_at', $month)
            ->selectRaw('YEAR(paid_at) as year')
            ->distinct()
            ->count();

        return $yearsCount > 0 ? ($total / $yearsCount) : 0;
    }

    private function calculateVariation($propertyIds, $currentYear)
    {
        try {
            $previousYear = $currentYear - 1;

            $currentRevenue = Payment::whereHas('lease', function($q) use ($propertyIds) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->where('status', 'approved')
                ->whereYear('paid_at', $currentYear)
                ->sum('amount_total');

            $previousRevenue = Payment::whereHas('lease', function($q) use ($propertyIds) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->where('status', 'approved')
                ->whereYear('paid_at', $previousYear)
                ->sum('amount_total');

            if ($previousRevenue == 0) {
                return $currentRevenue > 0 ? '+100%' : '0%';
            }

            $variation = (($currentRevenue - $previousRevenue) / $previousRevenue) * 100;
            $sign = $variation >= 0 ? '+' : '';

            return $sign . round($variation, 1) . '%';
        } catch (\Exception $e) {
            return '0%';
        }
    }

    private function getAvailableYears($propertyIds)
    {
        $years = Payment::whereHas('lease', function($q) use ($propertyIds) {
                $q->whereIn('property_id', $propertyIds);
            })
            ->whereNotNull('paid_at')
            ->selectRaw('YEAR(paid_at) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        if (empty($years)) {
            $years = [date('Y')];
        }

        return $years;
    }

    private function mapCategoryToType($category)
    {
        $map = [
            'Loyer' => 'rent',
            'Dépôt de garantie' => 'deposit',
            'Charges' => 'charge',
            'Réparations' => 'repair',
            'Travaux' => 'repair',
            'Assurance' => 'insurance',
            'Taxes' => 'tax',
        ];

        return $map[$category] ?? 'other';
    }

    private function getEmptyStats()
    {
        return [
            'resultat_net' => 0,
            'resultat_net_formatted' => '0 FCFA',
            'revenus' => 0,
            'revenus_formatted' => '0 FCFA',
            'charges' => 0,
            'charges_formatted' => '0 FCFA',
            'rentabilite' => 0,
            'active_properties' => 0,
            'transactions_count' => 0,
            'occupancy_rate' => 0,
            'occupied' => 0,
            'vacant' => 0,
            'total_properties' => 0,
            'revenus_par_categorie' => [
                'Loyers perçus' => 0,
                'Dépôts de garantie' => 0,
                'Autres revenus' => 0,
            ],
            'charges_par_categorie' => [
                'Travaux et réparations' => 0,
                'Factures payées' => 0,
                'Assurances' => 0,
                'Taxes' => 0,
            ],
            'repartition_par_bien' => [],
            'variation' => '0%',
            'available_years' => [date('Y')],
        ];
    }

    private function getEmptyChartData()
    {
        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        $data = [];

        for ($i = 1; $i <= 12; $i++) {
            $data[] = [
                'month' => $months[$i - 1],
                'received' => 0,
                'average' => 0,
            ];
        }

        return $data;
    }
}
