<?php

namespace App\Http\Controllers\Api\Landlord;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyConditionReport;
use App\Models\PropertyConditionPhoto;
use App\Models\Lease;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Pagination\LengthAwarePaginator;

class LandlordConditionReportController extends Controller
{


    /**
     * API: Liste tous les états des lieux (pour React)
     */
    public function apiIndex(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Récupérer les IDs des biens du propriétaire
        $propertyIds = Property::where('landlord_id', $user->id)
            ->orWhere('user_id', $user->id)
            ->pluck('id')
            ->toArray();

        if (empty($propertyIds)) {
            return response()->json([]);
        }

        // Query de base
        $query = PropertyConditionReport::whereIn('property_id', $propertyIds)
            ->with(['photos', 'lease.tenant', 'property']);

        // Filtres optionnels
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('property_id') && $request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('lease.tenant', function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                })->orWhereHas('property', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                })->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $reports = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Transformer les données pour React
        $formattedReports = $reports->map(function($report) {
            $tenantName = $report->lease && $report->lease->tenant
                ? trim(($report->lease->tenant->first_name ?? '') . ' ' . ($report->lease->tenant->last_name ?? ''))
                : 'Sans locataire';

            return [
                'id' => $report->id,
                'type' => $report->type,
                'type_label' => $this->getTypeLabel($report->type),
                'type_color' => $this->getTypeColor($report->type),
                'title' => 'EDL - ' . $tenantName,
                'property_name' => $report->property->name ?? $report->property->address ?? 'Bien inconnu',
                'property_address' => $report->property->address ?? '',
                'tenant_name' => $tenantName,
                'report_date' => $report->report_date,
                'report_date_formatted' => \Carbon\Carbon::parse($report->report_date)->format('d M Y'),
                'notes' => $report->notes,
                'general_condition' => $this->getGeneralCondition($report),
                'is_signed' => !is_null($report->signed_at),
                'signed_at' => $report->signed_at,
                'signed_at_formatted' => $report->signed_at ? \Carbon\Carbon::parse($report->signed_at)->format('d/m/Y H:i') : null,
                'photos_count' => $report->photos->count(),
                'photos' => $report->photos->map(function($photo) {
                    return [
                        'id' => $photo->id,
                        'url' => Storage::url($photo->path),
                        'condition_status' => $photo->condition_status,
                        'condition_notes' => $photo->condition_notes,
                    ];
                }),
                'created_at' => $report->created_at,
                'created_at_formatted' => $report->created_at->format('d M Y'),
            ];
        });

        return response()->json([
            'data' => $formattedReports,
            'pagination' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ]
        ]);
    }

    /**
     * API: Récupère les détails d'un état des lieux
     */
    public function apiShow($id)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $report = PropertyConditionReport::with(['photos', 'lease.tenant', 'property', 'creator'])
            ->findOrFail($id);

        // Vérifier l'accès
        $hasAccess = Property::where('id', $report->property_id)
            ->where(function($query) use ($user) {
                $query->where('landlord_id', $user->id)
                      ->orWhere('user_id', $user->id);
            })
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        $tenantName = $report->lease && $report->lease->tenant
            ? trim(($report->lease->tenant->first_name ?? '') . ' ' . ($report->lease->tenant->last_name ?? ''))
            : 'Sans locataire';

        return response()->json([
            'id' => $report->id,
            'type' => $report->type,
            'type_label' => $this->getTypeLabel($report->type),
            'type_color' => $this->getTypeColor($report->type),
            'title' => 'EDL - ' . $tenantName,
            'property' => [
                'id' => $report->property->id,
                'name' => $report->property->name,
                'address' => $report->property->address,
                'city' => $report->property->city,
                'postal_code' => $report->property->postal_code,
            ],
            'lease' => [
                'id' => $report->lease->id,
                'lease_number' => $report->lease->lease_number,
                'start_date' => $report->lease->start_date,
                'end_date' => $report->lease->end_date,
            ],
            'tenant' => [
                'id' => $report->lease->tenant->id ?? null,
                'first_name' => $report->lease->tenant->first_name ?? '',
                'last_name' => $report->lease->tenant->last_name ?? '',
                'email' => $report->lease->tenant->email ?? '',
                'phone' => $report->lease->tenant->phone ?? '',
            ],
            'report_date' => $report->report_date,
            'report_date_formatted' => \Carbon\Carbon::parse($report->report_date)->format('d/m/Y'),
            'notes' => $report->notes,
            'general_condition' => $this->getGeneralCondition($report),
            'is_signed' => !is_null($report->signed_at),
            'signed_at' => $report->signed_at,
            'signed_at_formatted' => $report->signed_at ? \Carbon\Carbon::parse($report->signed_at)->format('d/m/Y H:i') : null,
            'signed_by' => $report->signed_by,
            'signature_data' => $report->signature_data,
            'photos' => $report->photos->map(function($photo) {
                return [
                    'id' => $photo->id,
                    'url' => Storage::url($photo->path),
                    'original_filename' => $photo->original_filename,
                    'condition_status' => $photo->condition_status,
                    'condition_status_label' => $this->getConditionStatusLabel($photo->condition_status),
                    'condition_notes' => $photo->condition_notes,
                    'taken_at' => $photo->taken_at,
                ];
            }),
            'created_by' => $report->creator ? $report->creator->name : null,
            'created_at' => $report->created_at,
            'created_at_formatted' => $report->created_at->format('d/m/Y H:i'),
        ]);
    }

   /**
 * API: Liste des propriétés pour le filtre
 */
public function apiProperties(Request $request)
{
    $user = Auth::user();

    if (!$user || !$user->hasRole('landlord')) {
        return response()->json(['error' => 'Non autorisé'], 403);
    }

    $properties = Property::where('landlord_id', $user->id)
        ->orWhere('user_id', $user->id)
        ->orderBy('name')
        ->get(['id', 'name', 'address']);

    return response()->json($properties);
}

/**
 * API: Récupère les baux pour une propriété
 */
public function apiLeasesForProperty($propertyId)
{
    $user = Auth::user();

    if (!$user || !$user->hasRole('landlord')) {
        return response()->json(['error' => 'Non autorisé'], 403);
    }

    // Vérifier que la propriété appartient au propriétaire
    $property = Property::where('id', $propertyId)
        ->where(function($query) use ($user) {
            $query->where('landlord_id', $user->id)
                  ->orWhere('user_id', $user->id);
        })
        ->first();

    if (!$property) {
        return response()->json(['error' => 'Propriété non trouvée'], 404);
    }

    $leases = Lease::where('property_id', $propertyId)
        ->where('status', 'active')
        ->with('tenant')
        ->get();

    return response()->json($leases);
}

    /**
     * API: Créer un état des lieux
     */
    public function apiStore(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'lease_id' => 'required|exists:leases,id',
            'type' => 'required|in:entry,exit,intermediate',
            'report_date' => 'required|date',
            'notes' => 'nullable|string',
            'photos' => 'sometimes|array',
            'photos.*' => 'image|max:10240',
        ]);

        // Vérifier que le bien appartient au propriétaire
        $property = Property::find($validated['property_id']);
        if ($property->landlord_id != $user->id && $property->user_id != $user->id) {
            return response()->json(['error' => 'Ce bien ne vous appartient pas'], 403);
        }

        DB::beginTransaction();

        try {
            $report = PropertyConditionReport::create([
                'property_id' => $validated['property_id'],
                'lease_id' => $validated['lease_id'],
                'created_by' => $user->id,
                'type' => $validated['type'],
                'report_date' => $validated['report_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $index => $photo) {
                    $this->storePhoto($photo, $report, [
                        'condition_status' => $request->input("condition_statuses.{$index}", 'good'),
                        'condition_notes' => $request->input("condition_notes.{$index}", ''),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'État des lieux créé avec succès',
                'report_id' => $report->id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création état des lieux: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur lors de la création'], 500);
        }
    }

    /**
     * API: Signer un état des lieux
     */
    public function apiSign(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $report = PropertyConditionReport::findOrFail($id);

        // Vérifier l'accès
        $hasAccess = Property::where('id', $report->property_id)
            ->where(function($query) use ($user) {
                $query->where('landlord_id', $user->id)
                      ->orWhere('user_id', $user->id);
            })
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        if ($report->signed_at) {
            return response()->json(['error' => 'Déjà signé'], 400);
        }

        $signature = $request->input('signature');

        if (!$signature) {
            return response()->json(['error' => 'Signature manquante'], 400);
        }

        try {
            // Décoder la signature base64
            $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $signature));

            // Générer un nom de fichier unique
            $filename = 'signatures/' . $report->id . '/' . Str::uuid() . '.png';

            // Sauvegarder l'image
            Storage::disk('public')->put($filename, $imageData);

            // Préparer les données de signature
            $signatureData = [
                'type' => 'electronic',
                'image_path' => $filename,
                'signed_at' => now()->toDateTimeString(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ];

            $report->signature_data = $signatureData;
            $report->signed_at = now();
            $report->signed_by = $user->id;
            $report->save();

            return response()->json([
                'success' => true,
                'message' => 'État des lieux signé avec succès',
                'signed_at' => $report->signed_at->format('d/m/Y H:i')
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur signature: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur lors de la signature'], 500);
        }
    }

    /**
     * API: Uploader un document signé
     */
    public function apiUploadSigned(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $report = PropertyConditionReport::findOrFail($id);

        // Vérifier l'accès
        $hasAccess = Property::where('id', $report->property_id)
            ->where(function($query) use ($user) {
                $query->where('landlord_id', $user->id)
                      ->orWhere('user_id', $user->id);
            })
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        if ($report->signed_at) {
            return response()->json(['error' => 'Déjà signé'], 400);
        }

        $request->validate([
            'signed_file' => 'required|file|mimes:pdf|max:10240',
        ]);

        try {
            $path = $request->file('signed_file')->store(
                'condition-reports/' . $report->id . '/signed',
                'public'
            );

            $signatureData = [
                'type' => 'upload',
                'file_path' => $path,
                'file_name' => $request->file('signed_file')->getClientOriginalName(),
                'file_size' => $request->file('signed_file')->getSize(),
                'uploaded_at' => now()->toDateTimeString()
            ];

            $report->signature_data = $signatureData;
            $report->signed_at = now();
            $report->signed_by = $user->id;
            $report->save();

            return response()->json([
                'success' => true,
                'message' => 'Document signé téléchargé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur upload: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur lors du téléchargement'], 500);
        }
    }

    /**
     * API: Télécharger le PDF
     */
    public function apiDownloadPdf($id)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $report = PropertyConditionReport::with(['photos', 'lease.tenant', 'property'])
            ->findOrFail($id);

        // Vérifier l'accès
        $hasAccess = Property::where('id', $report->property_id)
            ->where(function($query) use ($user) {
                $query->where('landlord_id', $user->id)
                      ->orWhere('user_id', $user->id);
            })
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('landlord.condition-reports.pdf', compact('report'));
            return $pdf->download("etat-des-lieux-{$report->id}.pdf");

        } catch (\Exception $e) {
            Log::error('Erreur PDF: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur lors de la génération du PDF'], 500);
        }
    }

    /**
     * API: Supprimer un état des lieux
     */
    public function apiDestroy($id)
    {
        $user = Auth::user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $report = PropertyConditionReport::findOrFail($id);

        // Vérifier l'accès
        $hasAccess = Property::where('id', $report->property_id)
            ->where(function($query) use ($user) {
                $query->where('landlord_id', $user->id)
                      ->orWhere('user_id', $user->id);
            })
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        if ($report->signed_at) {
            return response()->json(['error' => 'Impossible de supprimer un document signé'], 400);
        }

        DB::beginTransaction();

        try {
            foreach ($report->photos as $photo) {
                Storage::disk('public')->delete($photo->path);
                $photo->delete();
            }

            if ($report->signature_data && isset($report->signature_data['image_path'])) {
                Storage::disk('public')->delete($report->signature_data['image_path']);
            }

            $report->delete();

            DB::commit();

            return response()->json(['success' => true, 'message' => 'État des lieux supprimé']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }

    // Méthodes utilitaires
    private function getTypeLabel($type)
    {
        return match($type) {
            'entry' => 'ÉTAT DES LIEUX D\'ENTRÉE',
            'exit' => 'ÉTAT DES LIEUX DE SORTIE',
            'intermediate' => 'ÉTAT DES LIEUX INTERMÉDIAIRE',
            default => strtoupper($type)
        };
    }

    private function getTypeColor($type)
    {
        return match($type) {
            'entry' => '#83C757',
            'exit' => '#ef4444',
            'intermediate' => '#3b82f6',
            default => '#6b7280'
        };
    }

    private function getConditionStatusLabel($status)
    {
        return match($status) {
            'good' => 'Bon',
            'satisfactory' => 'Correct',
            'poor' => 'Mauvais',
            'damaged' => 'Abîmé',
            default => 'Non défini'
        };
    }

    private function getGeneralCondition($report)
    {
        $photos = $report->photos;

        if ($photos->isEmpty()) {
            return 'Non évalué';
        }

        $statuses = $photos->pluck('condition_status');

        $goodCount = $statuses->filter(fn($s) => $s === 'good')->count();
        $satisfactoryCount = $statuses->filter(fn($s) => $s === 'satisfactory')->count();
        $poorCount = $statuses->filter(fn($s) => $s === 'poor')->count();
        $damagedCount = $statuses->filter(fn($s) => $s === 'damaged')->count();

        $total = $photos->count();

        if ($damagedCount > 0) {
            return 'Mauvais';
        } elseif ($poorCount > $total * 0.3) {
            return 'Passable';
        } elseif ($goodCount >= $total * 0.7) {
            return 'Excellent';
        } elseif ($goodCount + $satisfactoryCount >= $total * 0.7) {
            return 'Très bon';
        } else {
            return 'Bon';
        }
    }

    protected function storePhoto(UploadedFile $photo, PropertyConditionReport $report, array $attributes = [])
    {
        $filename = Str::uuid() . '.' . $photo->getClientOriginalExtension();

        $path = $photo->storeAs(
            'property_condition_photos/' . $report->id,
            $filename,
            'public'
        );

        return PropertyConditionPhoto::create([
            'report_id' => $report->id,
            'path' => $path,
            'original_filename' => $photo->getClientOriginalName(),
            'mime_type' => $photo->getMimeType(),
            'size' => $photo->getSize(),
            'taken_at' => now(),
            'condition_status' => $attributes['condition_status'] ?? 'good',
            'condition_notes' => $attributes['condition_notes'] ?? null,
        ]);
    }
}
