<?php

namespace App\Http\Controllers\CoOwner;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyConditionReport;
use App\Models\PropertyConditionPhoto;
use App\Models\PropertyDelegation;
use App\Models\CoOwner;
use App\Models\Lease;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Mail;

class CoOwnerConditionReportController extends Controller
{
    /**
     * Affiche la liste des états des lieux
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        // Récupérer les biens délégués ACTIFS
        $propertyIds = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('status', 'active')
            ->pluck('property_id');

        // Récupérer les biens pour le filtre
        $properties = Property::whereIn('id', $propertyIds)->get();

        if ($propertyIds->isEmpty()) {
            $reports = new LengthAwarePaginator([], 0, 15, null, ['path' => request()->url()]);

            return view('co-owner.condition-reports.index', [
                'reports' => $reports,
                'properties' => $properties,
                'noProperties' => true
            ]);
        }

        // Query de base
        $query = PropertyConditionReport::whereIn('property_id', $propertyIds)
            ->with(['photos', 'lease.tenant', 'creator', 'property']);

        // Filtre par type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filtre par bien
        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('lease.tenant', function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                })->orWhereHas('property', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            });
        }

        $reports = $query->latest('report_date')->paginate(15);

        // Transformer les rapports
        $formattedReports = $reports->map(function($report) {
            return (object) [
                'id' => $report->id,
                'type' => $report->type,
                'tenant_name' => $report->lease->tenant->full_name ?? 'N/A',
                'property_name' => $report->property->name ?? 'Bien #' . $report->property_id,
                'report_date' => $report->report_date,
                'general_condition' => $this->getGeneralCondition($report),
                'is_signed' => $report->isSigned(),
                'photos_count' => $report->photos->count(),
                'created_at' => $report->created_at,
            ];
        });

        $reports->setCollection($formattedReports);

        return view('co-owner.condition-reports.index', compact('reports', 'properties'));
    }

    /**
     * Détermine l'état général basé sur les photos
     */
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

    /**
     * Affiche le formulaire de création
     */
    public function create()
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        // Récupérer les biens délégués ACTIFS
        $propertyIds = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('status', 'active')
            ->pluck('property_id');

        if ($propertyIds->isEmpty()) {
            return redirect()->route('co-owner.condition-reports.index')
                ->with('error', 'Aucun bien délégué. Vous ne pouvez pas créer d\'état des lieux.');
        }

        // Récupérer les biens avec leurs baux ACTIFS et locataires
        $properties = Property::whereIn('id', $propertyIds)
            ->with(['leases' => function($query) {
                $query->where('status', 'active')
                      ->with('tenant');
            }])
            ->get();

        return view('co-owner.condition-reports.create', compact('properties'));
    }

    /**
     * Enregistre un nouvel état des lieux
     */
    public function store(Request $request)
    {
        try {
            // Validation
            $validated = $request->validate([
                'property_id'   => 'required|exists:properties,id',
                'lease_id'      => 'required|exists:leases,id',
                'type'          => 'required|in:entry,exit,intermediate',
                'report_date'   => 'required|date',
                'notes'         => 'nullable|string',
                'photos'        => 'required|array|min:1',
                'photos.*'      => 'image|max:10240',
                'condition_statuses' => 'nullable|array',
                'condition_statuses.*' => 'nullable|in:good,satisfactory,poor,damaged',
                'condition_notes' => 'nullable|array',
                'condition_notes.*' => 'nullable|string|max:500',
            ]);

            $user = Auth::user();
            $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

            if (!$coOwnerProfile) {
                return redirect()->back()
                    ->with('error', 'Vous n\'avez pas de profil copropriétaire.')
                    ->withInput();
            }

            // Vérifier l'accès au bien
            $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
                ->where('property_id', $validated['property_id'])
                ->where('status', 'active')
                ->exists();

            if (!$hasAccess) {
                return redirect()->back()
                    ->with('error', 'Vous n\'avez pas accès à ce bien.')
                    ->withInput();
            }

            // Vérifier que le bail appartient au bien
            $leaseBelongs = Lease::where('id', $validated['lease_id'])
                ->where('property_id', $validated['property_id'])
                ->exists();

            if (!$leaseBelongs) {
                return redirect()->back()
                    ->with('error', 'Le bail sélectionné ne correspond pas au bien.')
                    ->withInput();
            }

            // Créer l'état des lieux dans une transaction
            DB::beginTransaction();

            try {
                // Créer le rapport
                $report = PropertyConditionReport::create([
                    'property_id'    => $validated['property_id'],
                    'lease_id'       => $validated['lease_id'],
                    'created_by'     => $user->id,
                    'type'           => $validated['type'],
                    'report_date'    => $validated['report_date'],
                    'notes'          => $validated['notes'] ?? null,
                    'status'         => 'draft',
                ]);

                // Enregistrer les photos
                if ($request->hasFile('photos')) {
                    foreach ($request->file('photos') as $index => $photo) {
                        if ($photo->isValid()) {
                            $this->storePhoto($photo, $report, [
                                'condition_status' => $request->input("condition_statuses.{$index}", 'good'),
                                'condition_notes'  => $request->input("condition_notes.{$index}", ''),
                            ]);
                        }
                    }
                }

                // Mettre à jour le statut du bail si nécessaire
                if ($validated['type'] === 'entry') {
                    Lease::where('id', $validated['lease_id'])
                        ->update(['status' => 'active']);
                } elseif ($validated['type'] === 'exit') {
                    Lease::where('id', $validated['lease_id'])
                        ->update(['status' => 'terminated']);
                }

                DB::commit();

                return redirect()->route('co-owner.condition-reports.show', $report->id)
                    ->with('success', 'État des lieux créé avec succès.');

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Erreur création état des lieux: ' . $e->getMessage());

                return redirect()->back()
                    ->with('error', 'Une erreur est survenue lors de la création : ' . $e->getMessage())
                    ->withInput();
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();

        } catch (\Exception $e) {
            Log::error('Erreur validation état des lieux: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Une erreur est survenue lors de la validation.')
                ->withInput();
        }
    }

    /**
     * Affiche un état des lieux spécifique
     */
    public function show($id)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        $report = PropertyConditionReport::with([
            'photos',
            'lease.tenant',
            'property',
            'creator'
        ])->findOrFail($id);

        // Vérifier l'accès
        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Accès non autorisé.');
        }

        return view('co-owner.condition-reports.show', compact('report'));
    }

    /**
     * Ajoute des photos à un état des lieux existant
     */
    public function addPhotos(Request $request, $id)
    {
        $validated = $request->validate([
            'photos' => 'required|array|min:1',
            'photos.*' => 'image|max:10240',
            'condition_statuses.*' => 'nullable|in:good,satisfactory,poor,damaged',
            'condition_notes.*'    => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $report = PropertyConditionReport::findOrFail($id);
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Accès non autorisé.');
        }

        DB::beginTransaction();

        try {
            foreach ($request->file('photos') as $index => $photo) {
                if ($photo->isValid()) {
                    $this->storePhoto($photo, $report, [
                        'condition_status' => $request->input("condition_statuses.{$index}", 'good'),
                        'condition_notes'  => $request->input("condition_notes.{$index}", ''),
                    ]);
                }
            }

            DB::commit();

            return redirect()->back()
                ->with('success', 'Photos ajoutées avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur ajout photos: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Erreur lors de l\'ajout des photos.');
        }
    }

    /**
     * Supprime un état des lieux
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $report = PropertyConditionReport::findOrFail($id);
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Accès non autorisé.');
        }

        if ($report->isSigned()) {
            return redirect()->back()
                ->with('error', 'Impossible de supprimer un état des lieux signé.');
        }

        DB::beginTransaction();

        try {
            // Supprimer les photos physiques
            foreach ($report->photos as $photo) {
                Storage::disk('public')->delete($photo->path);
                $photo->delete();
            }

            // Supprimer le rapport
            $report->delete();

            DB::commit();

            return redirect()->route('co-owner.condition-reports.index')
                ->with('success', 'État des lieux supprimé avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression état des lieux: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Erreur lors de la suppression.');
        }
    }

    /**
     * Télécharge un PDF de l'état des lieux
     */
    public function downloadPdf($id)
    {
        $user = Auth::user();
        $report = PropertyConditionReport::with([
            'photos',
            'lease.tenant',
            'property',
            'creator'
        ])->findOrFail($id);

        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Accès non autorisé.');
        }

        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('co-owner.condition-reports.pdf', compact('report'));
            return $pdf->download("etat-des-lieux-{$report->id}.pdf");

        } catch (\Exception $e) {
            Log::error('Erreur génération PDF: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Erreur lors de la génération du PDF.');
        }
    }

    /**
     * Méthode utilitaire pour stocker une photo
     */
    protected function storePhoto(UploadedFile $photo, PropertyConditionReport $report, array $attributes = [])
    {
        try {
            $filename = Str::uuid() . '.' . $photo->getClientOriginalExtension();

            $path = $photo->storeAs(
                'property_condition_photos/' . $report->id,
                $filename,
                'public'
            );

            return PropertyConditionPhoto::create([
                'report_id'          => $report->id,
                'path'              => $path,
                'original_filename' => $photo->getClientOriginalName(),
                'mime_type'         => $photo->getMimeType(),
                'size'              => $photo->getSize(),
                'taken_at'          => now(),
                'condition_status'  => $attributes['condition_status'] ?? 'good',
                'condition_notes'   => $attributes['condition_notes'] ?? null,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur stockage photo: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Édite un état des lieux
     */
    public function edit($id)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        $report = PropertyConditionReport::with(['photos', 'lease', 'property'])->findOrFail($id);

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Accès non autorisé.');
        }

        $propertyIds = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('status', 'active')
            ->pluck('property_id');

        $properties = Property::whereIn('id', $propertyIds)
            ->with(['leases' => function($query) {
                $query->where('status', 'active')->with('tenant');
            }])
            ->get();

        return view('co-owner.condition-reports.edit', compact('report', 'properties'));
    }

    /**
     * Met à jour un état des lieux
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'property_id'   => 'required|exists:properties,id',
            'lease_id'      => 'required|exists:leases,id',
            'type'          => 'required|in:entry,exit,intermediate',
            'report_date'   => 'required|date',
            'notes'         => 'nullable|string',
        ]);

        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Vous n\'avez pas de profil copropriétaire.');
        }

        $report = PropertyConditionReport::findOrFail($id);

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $validated['property_id'])
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            return redirect()->back()
                ->with('error', 'Vous n\'avez pas accès à ce bien.')
                ->withInput();
        }

        try {
            $report->update($validated);

            return redirect()->route('co-owner.condition-reports.show', $report->id)
                ->with('success', 'État des lieux mis à jour avec succès.');

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour état des lieux: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Erreur lors de la mise à jour.')
                ->withInput();
        }
    }

    /**
     * Ajoute une signature à l'état des lieux (signature électronique)
     * Pour le copropriétaire - signe en tant que propriétaire
     */
    public function sign(Request $request, $id)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            return response()->json(['error' => 'Profil co-propriétaire non trouvé'], 403);
        }

        $report = PropertyConditionReport::findOrFail($id);

        // Vérifier l'accès
        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        // Vérifier si déjà signé par le propriétaire
        if ($report->isLandlordSigned()) {
            return response()->json(['error' => 'Cet état des lieux est déjà signé par le propriétaire'], 400);
        }

        try {
            $signature = $request->input('signature');

            if (!$signature) {
                return response()->json(['error' => 'Signature manquante'], 400);
            }

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
                'user_agent' => $request->userAgent(),
                'user_id' => $user->id,
                'co_owner_id' => $coOwnerProfile->id,
            ];

            // Utiliser la méthode du modèle
            $report->signAsLandlord($signatureData, $user->id);

            // Envoyer une notification au locataire
            $this->sendSignedNotification($report);

            $message = $report->isSigned()
                ? 'État des lieux signé et validé par les deux parties'
                : 'État des lieux signé par le propriétaire. En attente de la signature du locataire.';

            return response()->json([
                'success' => true,
                'message' => $message,
                'signed_at' => $report->landlord_signed_at->format('d/m/Y H:i'),
                'is_signed' => $report->isSigned(),
                'status' => $report->status,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur signature état des lieux: ' . $e->getMessage());

            return response()->json(['error' => 'Erreur lors de la signature : ' . $e->getMessage()], 500);
        }
    }

    /**
     * Uploader un document signé (PDF) - pour le copropriétaire
     */
    public function uploadSignedDocument(Request $request, $id)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            return redirect()->back()->with('error', 'Profil co-propriétaire non trouvé');
        }

        $report = PropertyConditionReport::findOrFail($id);

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            return redirect()->back()->with('error', 'Accès non autorisé');
        }

        if ($report->isLandlordSigned()) {
            return redirect()->back()->with('error', 'Cet état des lieux est déjà signé par le propriétaire');
        }

        $request->validate([
            'signed_file' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        try {
            // Sauvegarder le fichier
            $path = $request->file('signed_file')->store(
                'condition-reports/' . $report->id . '/signed',
                'public'
            );

            // Préparer les données de signature
            $signatureData = [
                'type' => 'upload',
                'file_path' => $path,
                'file_name' => $request->file('signed_file')->getClientOriginalName(),
                'file_size' => $request->file('signed_file')->getSize(),
                'uploaded_at' => now()->toDateTimeString(),
                'user_id' => $user->id,
                'co_owner_id' => $coOwnerProfile->id,
            ];

            // Mettre à jour le rapport avec les informations de signature
            $report->signAsLandlord($signatureData, $user->id);

            // Envoyer une notification au locataire
            $this->sendSignedNotification($report);

            $message = $report->isSigned()
                ? 'Document signé et validé par les deux parties'
                : 'Document signé par le propriétaire. En attente de la signature du locataire.';

            return redirect()->route('co-owner.condition-reports.show', $report->id)
                ->with('success', $message);

        } catch (\Exception $e) {
            Log::error('Erreur upload document signé: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Erreur lors du téléchargement du document : ' . $e->getMessage());
        }
    }

    /**
     * Voir le document signé (PDF ou signature)
     */
    public function viewSignedDocument(Request $request, $id)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            abort(403, 'Profil co-propriétaire non trouvé');
        }

        $report = PropertyConditionReport::with(['photos', 'lease.tenant', 'property'])->findOrFail($id);

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Accès non autorisé');
        }

        // Si c'est un upload de PDF
        if ($report->landlord_signature_data && $report->landlord_signature_data['type'] === 'upload') {
            $path = storage_path('app/public/' . $report->landlord_signature_data['file_path']);

            if (file_exists($path)) {
                return response()->file($path, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="etat-des-lieux-' . $report->id . '-signe.pdf"',
                ]);
            }
        }

        // Sinon, générer un PDF avec la signature électronique
        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('co-owner.condition-reports.pdf-signed', compact('report'));
            return $pdf->stream("etat-des-lieux-{$report->id}.pdf");

        } catch (\Exception $e) {
            Log::error('Erreur génération PDF signé: ' . $e->getMessage());
            abort(404, 'Document signé non trouvé');
        }
    }

    /**
     * Envoyer une invitation à signer au locataire
     */
    public function sendSignatureInvitation(Request $request, $id)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            return redirect()->back()->with('error', 'Profil co-propriétaire non trouvé');
        }

        $report = PropertyConditionReport::with(['lease.tenant', 'property'])->findOrFail($id);

        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $report->property_id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            return redirect()->back()->with('error', 'Accès non autorisé');
        }

        // Vérifier si déjà signé
        if ($report->isSigned()) {
            return redirect()->back()->with('error', 'Cet état des lieux est déjà signé par les deux parties');
        }

        $tenant = $report->lease->tenant;
        $property = $report->property;

        if (!$tenant || !$tenant->email) {
            return redirect()->back()->with('error', 'Le locataire n\'a pas d\'email valide');
        }

        try {
            $appName = config('app.name', 'Gestiloc');
            $subject = "Invitation à signer l'état des lieux - $appName";

            // Générer un lien pour que le locataire puisse signer
            $signatureLink = config('app.frontend_url') . "/tenant/sign-condition-report/" . $report->id . "?token=" . ($request->get('api_token', ''));

            $type = $report->type === 'entry' ? "d'entrée" : ($report->type === 'exit' ? 'de sortie' : 'intermédiaire');

            $html = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                    .header { background: #70AE48; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .button { display: inline-block; background: #70AE48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>État des lieux à signer</h2>
                    </div>
                    <div class='content'>
                        <p>Bonjour <strong>{$tenant->first_name} {$tenant->last_name}</strong>,</p>
                        <p>Un état des lieux <strong>{$type}</strong> a été créé pour le bien :</p>
                        <p><strong>{$property->name}</strong><br>
                        {$property->address}</p>
                        <p>Vous êtes invité à consulter et signer ce document.</p>
                        <p>Pour le consulter et le signer, cliquez sur le bouton ci-dessous :</p>
                        <p style='text-align: center;'>
                            <a href='{$signatureLink}' class='button'>Signer l'état des lieux</a>
                        </p>
                        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                        <small>{$signatureLink}</small></p>
                    </div>
                    <div class='footer'>
                        <p>Cet email a été envoyé automatiquement par {$appName}</p>
                    </div>
                </div>
            </body>
            </html>
            ";

            Mail::html($html, function ($message) use ($tenant, $subject) {
                $message->to($tenant->email)
                        ->subject($subject);
            });

            Log::info('Invitation à signer envoyée', [
                'report_id' => $report->id,
                'tenant_email' => $tenant->email
            ]);

            return redirect()->back()
                ->with('success', 'Invitation à signer envoyée au locataire');

        } catch (\Exception $e) {
            Log::error('Erreur envoi invitation: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Erreur lors de l\'envoi de l\'invitation');
        }
    }

    /**
     * Envoyer une notification quand l'état des lieux est signé
     */
    private function sendSignedNotification($report)
    {
        try {
            $tenant = $report->lease->tenant;
            $property = $report->property;

            if (!$tenant || !$tenant->email) {
                return;
            }

            $appName = config('app.name', 'Gestiloc');
            $subject = "État des lieux signé - $appName";
            $type = $report->type === 'entry' ? "d'entrée" : ($report->type === 'exit' ? 'de sortie' : 'intermédiaire');

            $signStatus = '';
            if ($report->isSigned()) {
                $signStatus = "<p style='color: green;'><strong>✓ L'état des lieux a été signé par les deux parties.</strong></p>";
            } elseif ($report->isLandlordSigned()) {
                $signStatus = "<p>✓ Le propriétaire a signé. Il manque votre signature pour finaliser.</p>";
            } elseif ($report->isTenantSigned()) {
                $signStatus = "<p>✓ Vous avez signé. Il manque la signature du propriétaire pour finaliser.</p>";
            }

            $html = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                    .header { background: #70AE48; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>État des lieux signé ✓</h2>
                    </div>
                    <div class='content'>
                        <p>Bonjour <strong>{$tenant->first_name} {$tenant->last_name}</strong>,</p>
                        <p>L'état des lieux <strong>{$type}</strong> pour le bien <strong>{$property->name}</strong> a été signé.</p>
                        {$signStatus}
                        <p>Vous pouvez télécharger le document depuis votre espace locataire.</p>
                    </div>
                    <div class='footer'>
                        <p>Cet email a été envoyé automatiquement par {$appName}</p>
                    </div>
                </div>
            </body>
            </html>
            ";

            Mail::html($html, function ($message) use ($tenant, $subject) {
                $message->to($tenant->email)
                        ->subject($subject);
            });

        } catch (\Exception $e) {
            Log::error('Erreur envoi notification signature: ' . $e->getMessage());
        }
    }

    /**
     * Récupérer les baux d'une propriété (pour AJAX)
     */
    public function getLeases($propertyId)
    {
        $user = Auth::user();
        $coOwnerProfile = CoOwner::where('user_id', $user->id)->first();

        if (!$coOwnerProfile) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Vérifier l'accès au bien
        $hasAccess = PropertyDelegation::where('co_owner_id', $coOwnerProfile->id)
            ->where('property_id', $propertyId)
            ->where('status', 'active')
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        $leases = Lease::where('property_id', $propertyId)
            ->where('status', 'active')
            ->with('tenant')
            ->get();

        return response()->json($leases);
    }
}
