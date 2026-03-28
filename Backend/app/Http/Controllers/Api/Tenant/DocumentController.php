<?php
// app/Http/Controllers/Api/Tenant/DocumentController.php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Tenant;
use App\Models\Property;
use App\Models\Lease;
use App\Models\User;
use App\Models\PropertyDelegation;
use App\Models\PropertyConditionReport;
use App\Mail\DocumentSharedMail;
use App\Mail\ContractSignatureRequestMail;
use App\Mail\ContractSignedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\ValidationException;

class DocumentController extends Controller
{
    /**
     * Récupérer le locataire connecté
     *
     * @return Tenant|null
     */
    private function getTenant()
    {
        $user = auth()->user();

        if (!$user || !$user->hasRole('tenant')) {
            Log::warning('getTenant: Utilisateur non trouvé ou non locataire', [
                'user_id' => $user ? $user->id : null,
                'has_role' => $user ? $user->hasRole('tenant') : false
            ]);
            return null;
        }

        // Récupérer le tenant via user_id
        $tenant = Tenant::where('user_id', $user->id)->first();

        Log::info('getTenant: Tenant trouvé', [
            'user_id' => $user->id,
            'tenant_id' => $tenant ? $tenant->id : null,
            'tenant_name' => $tenant ? trim($tenant->first_name . ' ' . $tenant->last_name) : null
        ]);

        return $tenant;
    }

    /**
     * GET /api/tenant/documents - Liste des documents
     */
    public function index(Request $request)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $query = Document::where('tenant_id', $tenant->id)
                ->with(['property', 'lease']);

            // Filtres
            if ($request->has('status')) {
                if ($request->status === 'actifs') {
                    $query->where('status', 'actif');
                } elseif ($request->status === 'archives') {
                    $query->where('status', 'archive');
                }
            } else {
                $query->where('status', '!=', 'archive');
            }

            if ($request->has('category') && $request->category === 'templates') {
                $query->where('category', 'template');
            } else {
                $query->whereNull('category')->orWhere('category', '!=', 'template');
            }

            if ($request->has('type') && !empty($request->type)) {
                $query->where('type', $request->type);
            }

            if ($request->has('property_id') && !empty($request->property_id)) {
                $query->where('property_id', $request->property_id);
            }

            if ($request->has('shared')) {
                $query->where('is_shared', $request->shared === 'true');
            }

            // Recherche
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('bien', 'like', "%{$search}%");
                });
            }

            // Période
            if ($request->has('periode') && !empty($request->periode) && $request->periode !== 'Toutes') {
                $months = [
                    'janvier' => '01', 'février' => '02', 'mars' => '03',
                    'avril' => '04', 'mai' => '05', 'juin' => '06',
                    'juillet' => '07', 'août' => '08', 'septembre' => '09',
                    'octobre' => '10', 'novembre' => '11', 'décembre' => '12'
                ];

                $parts = explode(' ', $request->periode);
                if (count($parts) == 2) {
                    $monthName = strtolower($parts[0]);
                    $year = $parts[1];

                    if (isset($months[$monthName])) {
                        $month = $months[$monthName];
                        $startDate = "{$year}-{$month}-01";
                        $endDate = date('Y-m-t', strtotime($startDate));

                        $query->whereBetween('created_at', [$startDate, $endDate]);
                    }
                }
            }

            $documents = $query->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page', 100));

            // Ajouter les URLs des fichiers et les infos de partage
            $documents->getCollection()->transform(function ($doc) {
                $doc->file_url = $doc->file_url;
                $doc->file_size_formatted = $doc->file_size_formatted;
                $doc->shared_with_users = $doc->shared_with_users;
                $doc->icon = $doc->getFileIcon();
                return $doc;
            });

            return response()->json([
                'success' => true,
                'data' => $documents,
                'total' => $documents->total(),
                'actifs_count' => Document::where('tenant_id', $tenant->id)->where('status', 'actif')->count(),
                'archives_count' => Document::where('tenant_id', $tenant->id)->where('status', 'archive')->count(),
                'templates_count' => Document::where('category', 'template')->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur index documents: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des documents'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/leases - Liste des baux du locataire
     */
/**
 * GET /api/tenant/leases - Liste des baux du locataire
 */
public function getLeases(Request $request)
{
    try {
        $tenant = $this->getTenant();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux locataires'
            ], 403);
        }

        $query = Lease::where('tenant_id', $tenant->id)
            ->with(['property']);

        // Filtres
        if ($request->has('property_id') && !empty($request->property_id)) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('property', function($subQ) use ($search) {
                    $subQ->where('name', 'like', "%{$search}%")
                         ->orWhere('address', 'like', "%{$search}%");
                });
            });
        }

        $leases = $query->orderBy('created_at', 'desc')->get();

        // Transformer les données pour inclure signed_document et les signatures
        $formattedLeases = $leases->map(function($lease) {
            // Vérifier si un document signé existe
            $hasSignedDocument = !empty($lease->signed_document);

            // Si un document signé existe, les signatures sont considérées comme présentes
            $landlordSignature = $hasSignedDocument ? 'signed' : $lease->landlord_signature;
            $tenantSignature = $hasSignedDocument ? 'signed' : $lease->tenant_signature;

            return [
                'id' => $lease->id,
                'uuid' => $lease->uuid,
                'property_id' => $lease->property_id,
                'property' => $lease->property ? [
                    'id' => $lease->property->id,
                    'name' => $lease->property->name,
                    'address' => $lease->property->address,
                ] : null,
                'start_date' => $lease->start_date,
                'end_date' => $lease->end_date,
                'rent_amount' => $lease->rent_amount,
                'deposit' => $lease->guarantee_amount ?? 0,
                'type' => $lease->type,
                'status' => $lease->status,
                'tenant_id' => $lease->tenant_id,
                'created_at' => $lease->created_at,
                'landlord_signature' => $landlordSignature,
                'tenant_signature' => $tenantSignature,
                'signed_document' => $lease->signed_document,
                'signed_at' => $lease->signed_at,
                'has_signed_document' => $hasSignedDocument, // Ajout d'un flag explicite
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedLeases,
            'total' => $formattedLeases->count()
        ]);

    } catch (\Exception $e) {
        Log::error('Erreur getLeases: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors du chargement des baux'
        ], 500);
    }
}

    /**
     * GET /api/tenant/condition-reports
     */
    public function getConditionReports(Request $request)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $query = PropertyConditionReport::whereHas('lease', function ($q) use ($tenant) {
                    $q->where('tenant_id', $tenant->id);
                })
                ->with(['property', 'lease', 'creator']);

            if ($request->filled('property_id')) {
                $query->where('property_id', $request->property_id);
            }

            if ($request->filled('type') && $request->type !== 'all') {
                $query->where('type', $request->type);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->whereHas('property', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('address', 'like', "%{$search}%");
                    })->orWhere('notes', 'like', "%{$search}%");
                });
            }

            $reports = $query->orderBy('created_at', 'desc')->get();

            $data = $reports->map(function ($report) {
                return [
                    'id'                   => $report->id,
                    'uuid'                 => $report->uuid ?? $report->id,
                    'type'                 => $report->type,
                    'report_date'          => $report->report_date,
                    'status'               => $report->status ?? 'draft',
                    'notes'                => $report->notes,

                    // Infos propriété / bail
                    'property'             => $report->property ? [
                        'id'      => $report->property->id,
                        'name'    => $report->property->name,
                        'address' => $report->property->address,
                    ] : null,
                    'lease'                => $report->lease ? [
                        'id'   => $report->lease->id,
                        'uuid' => $report->lease->uuid,
                    ] : null,

                    // Créateur
                    'created_by'           => $report->created_by,
                    'created_by_name'      => $report->creator?->name ?? 'Propriétaire',

                    // Signature locataire
                    'signature_tenant'     => $report->isTenantSigned(),
                    'tenant_signed_at'     => $report->tenant_signed_at?->format('d/m/Y H:i'),

                    // Signature propriétaire
                    'signature_landlord'   => $report->isLandlordSigned(),
                    'landlord_signed_at'   => $report->landlord_signed_at?->format('d/m/Y H:i'),

                    // Validé = les 2 ont signé
                    'is_signed'            => $report->isSigned(),

                    // Photos
                    'photos'               => $report->photos->map(function ($photo) {
                        return [
                            'id'      => $photo->id,
                            'url'     => \Illuminate\Support\Facades\Storage::url($photo->path),
                            'caption' => $photo->original_filename,
                            'room'    => $photo->condition_status,
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $data,
                'total'   => $data->count(),
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur getConditionReports: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des états des lieux'
            ], 500);
        }
    }

    /**
     * POST /api/tenant/condition-reports/{id}/sign
     * Le locataire signe l'état des lieux.
     * L'EDL passe à 'signed' seulement si le propriétaire a déjà signé.
     */
    public function signConditionReport(Request $request, string $id)
    {
        try {
            $tenant = $this->getTenant();
            $user   = auth()->user();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            // Récupérer l'EDL appartenant au bail du locataire
            $report = PropertyConditionReport::where('id', $id)
                ->whereHas('lease', function ($q) use ($tenant) {
                    $q->where('tenant_id', $tenant->id);
                })
                ->with(['property', 'lease.tenant'])
                ->firstOrFail();

            // Déjà signé par le locataire
            if ($report->isTenantSigned()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà signé cet état des lieux'
                ], 400);
            }

            // Enregistrer la signature
            $signatureData = [
                'type'       => 'electronic',
                'signed_at'  => now()->toDateTimeString(),
                'ip'         => $request->ip(),
                'user_agent' => $request->userAgent(),
                'user_id'    => $user->id,
                'tenant_id'  => $tenant->id,
            ];

            $report->signAsTenant($signatureData, $user->id);

            // Notifier le propriétaire
            $this->sendConditionReportTenantSignedNotification($report);

            $message = $report->isSigned()
                ? 'État des lieux signé et validé par les deux parties'
                : 'Signature enregistrée. En attente de la signature du propriétaire.';

            return response()->json([
                'success'          => true,
                'message'          => $message,
                'status'           => $report->status,
                'signature_tenant' => true,
                'is_signed'        => $report->isSigned(),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'État des lieux non trouvé'
            ], 404);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur signature EDL locataire: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la signature'
            ], 500);
        }
    }

    /**
     * Notifie le propriétaire que le locataire a signé l'EDL
     */
    private function sendConditionReportTenantSignedNotification($report): void
    {
        try {
            $property = $report->property;
            $tenant   = $report->lease?->tenant;
            $landlord = $property?->user;

            if (!$landlord || !$landlord->email) return;

            $appName = config('app.name', 'Gestiloc');
            $type    = $report->type === 'entry' ? "d'entrée" : 'de sortie';
            $subject = "L'état des lieux a été signé par le locataire - {$appName}";

            $html = "
            <!DOCTYPE html><html><head><meta charset='utf-8'>
            <style>
                body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
                .container{max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px}
                .header{background:#70AE48;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0}
                .content{padding:20px}
                .footer{margin-top:20px;font-size:12px;color:#999;text-align:center}
            </style></head><body>
            <div class='container'>
                <div class='header'><h2>État des lieux signé par le locataire</h2></div>
                <div class='content'>
                    <p>Bonjour,</p>
                    <p>Le locataire <strong>{$tenant->first_name} {$tenant->last_name}</strong> a signé l'état des lieux <strong>{$type}</strong> pour le bien :</p>
                    <p><strong>{$property->name}</strong><br>{$property->address}</p>
                    " . ($report->isSigned()
                        ? "<p>✅ Les deux parties ont signé. L'état des lieux est maintenant <strong>validé</strong>.</p>"
                        : "<p>Il reste votre signature pour valider l'état des lieux. Connectez-vous à votre espace pour finaliser.</p>"
                    ) . "
                </div>
                <div class='footer'><p>Email automatique - {$appName}</p></div>
            </div></body></html>";

            \Illuminate\Support\Facades\Mail::html($html, function ($message) use ($landlord, $subject) {
                $message->to($landlord->email)->subject($subject);
            });

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur notification EDL signé: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/tenant/leases/{uuid}/contract - Télécharger le contrat de bail
     */
    public function downloadLeaseContract($uuid)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $lease = Lease::where('uuid', $uuid)
                ->where('tenant_id', $tenant->id)
                ->with(['property', 'tenant'])
                ->firstOrFail();

            // Vérifier si le bail a un fichier de contrat signé
            if ($lease->signed_document && Storage::disk('public')->exists($lease->signed_document)) {
                return Storage::disk('public')->download($lease->signed_document, 'contrat_bail_signe_' . ($lease->lease_number ?? $lease->uuid) . '.pdf');
            }

            // Vérifier si le bail a un fichier de contrat non signé
            if ($lease->contract_file_path && Storage::disk('public')->exists($lease->contract_file_path)) {
                return Storage::disk('public')->download($lease->contract_file_path, 'contrat_bail_' . ($lease->lease_number ?? $lease->uuid) . '.pdf');
            }

            // Sinon, générer un PDF à partir des données
            $pdf = Pdf::loadView('pdf.lease-contract', [
                'lease' => $lease,
                'tenant' => $tenant,
                'property' => $lease->property,
                'date' => now()->format('d/m/Y')
            ]);

            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true
            ]);

            $filename = 'contrat_bail_' . ($lease->property->name ?? 'bien') . '_' . date('Ymd') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement contrat de bail: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement du contrat'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/leases/{uuid}/signed - Voir le contrat signé
     */
    public function viewSignedLeaseContract($uuid)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $lease = Lease::where('uuid', $uuid)
                ->where('tenant_id', $tenant->id)
                ->with(['property', 'tenant'])
                ->firstOrFail();

            if (!$lease->signed_document || !Storage::disk('public')->exists($lease->signed_document)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun contrat signé trouvé'
                ], 404);
            }

            $file = Storage::disk('public')->get($lease->signed_document);
            $mimeType = Storage::disk('public')->mimeType($lease->signed_document);

            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="' . basename($lease->signed_document) . '"');

        } catch (\Exception $e) {
            Log::error('Erreur visualisation contrat signé: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la visualisation du contrat'
            ], 500);
        }
    }

    /**
     * POST /api/tenant/leases/{uuid}/sign - Signer un contrat de bail
     */
 /**
 * Signer un contrat de bail (locataire)
 */
public function signLeaseContract(Request $request, $uuid)
{
    try {
        $tenant = $this->getTenant();
        $user = auth()->user();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux locataires'
            ], 403);
        }

        $lease = Lease::where('uuid', $uuid)
            ->where('tenant_id', $tenant->id)
            ->with(['property', 'property.user'])
            ->firstOrFail();

        // Vérifier que le bail est en attente de signature
        if ($lease->status !== 'pending_signature') {
            return response()->json([
                'success' => false,
                'message' => 'Ce contrat n\'est pas en attente de signature'
            ], 400);
        }

        // Vérifier que le locataire n'a pas déjà signé
        if (!empty($lease->tenant_signature)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà signé ce contrat'
            ], 400);
        }

        // Récupérer la signature image si fournie
        $signatureImage = $request->input('signature');
        $signaturePath = null;

        if ($signatureImage) {
            try {
                // Nettoyer et décoder l'image base64
                $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $signatureImage));

                // Créer le dossier si nécessaire
                $folder = 'lease-signatures/' . $lease->id;

                // Générer un nom de fichier unique
                $filename = \Illuminate\Support\Str::uuid() . '.png';
                $signaturePath = $folder . '/' . $filename;

                // Sauvegarder l'image
                \Illuminate\Support\Facades\Storage::disk('public')->put($signaturePath, $imageData);

                Log::info('Signature image sauvegardée', [
                    'lease_id' => $lease->id,
                    'path' => $signaturePath,
                    'size' => strlen($imageData)
                ]);

            } catch (\Exception $e) {
                Log::error('Erreur lors de la sauvegarde de la signature image', [
                    'error' => $e->getMessage(),
                    'lease_id' => $lease->id
                ]);
                // On continue même si l'image échoue, on enregistre juste la signature textuelle
            }
        }

        // Enregistrer la signature du locataire
        $lease->tenant_signature = json_encode([
            'signed_at' => now(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
            'signature_path' => $signaturePath, // Chemin de l'image si sauvegardée
            'has_image' => !is_null($signaturePath)
        ]);

        // Vérifier si le propriétaire a déjà signé
        if (!empty($lease->landlord_signature)) {
            $lease->status = 'active';
            $lease->signed_at = now();

            // Envoyer les notifications d'activation
            $this->sendContractActivatedNotifications($lease);
        } else {
            $lease->status = 'pending_signature';

            // Envoyer une notification au propriétaire que le locataire a signé
            $this->sendTenantSignedNotification($lease);
        }

        $lease->save();

        Log::info('Contrat signé par le locataire', [
            'lease_uuid' => $uuid,
            'tenant_id' => $tenant->id,
            'new_status' => $lease->status,
            'has_signature_image' => !is_null($signaturePath)
        ]);

        // Récupérer les signatures pour la réponse
        $tenantSignature = json_decode($lease->tenant_signature, true);
        $landlordSignature = $lease->landlord_signature ? json_decode($lease->landlord_signature, true) : null;

        // Ajouter l'URL de l'image si disponible
        if ($tenantSignature && isset($tenantSignature['signature_path'])) {
            $tenantSignature['signature_url'] = \Illuminate\Support\Facades\Storage::url($tenantSignature['signature_path']);
        }

        if ($landlordSignature && isset($landlordSignature['signature_path'])) {
            $landlordSignature['signature_url'] = \Illuminate\Support\Facades\Storage::url($landlordSignature['signature_path']);
        }

        return response()->json([
            'success' => true,
            'message' => $lease->status === 'active'
                ? 'Contrat signé et activé avec succès'
                : 'Signature enregistrée. En attente de la signature du propriétaire.',
            'data' => [
                'status' => $lease->status,
                'tenant_signature' => $tenantSignature,
                'landlord_signature' => $landlordSignature
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Erreur signature contrat: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
            'lease_uuid' => $uuid ?? null
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la signature du contrat: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * GET /api/tenant/condition-reports/{id}/download - Télécharger l'état des lieux
     */
    public function downloadConditionReport($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $report = PropertyConditionReport::where('id', $id)
                ->whereHas('lease', function($q) use ($tenant) {
                    $q->where('tenant_id', $tenant->id);
                })
                ->with(['property', 'lease', 'creator', 'photos'])
                ->firstOrFail();

            // Vérifier si l'état des lieux a un fichier
            if ($report->file_path && Storage::disk('public')->exists($report->file_path)) {
                return Storage::disk('public')->download($report->file_path, 'etat_des_lieux_' . $report->type . '_' . date('Ymd') . '.pdf');
            }

            // Ajouter les URLs des photos
            $report->photos = $report->photos->map(function ($photo) {
                $photo->url = Storage::url($photo->path);
                return $photo;
            });

            // Générer le PDF de l'état des lieux
            $pdf = Pdf::loadView('pdf.condition-report', [
                'report' => $report,
                'tenant' => $tenant,
                'property' => $report->property,
                'date' => now()->format('d/m/Y')
            ]);

            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true
            ]);

            $type = $report->type === 'entry' ? 'entree' : 'sortie';
            $filename = 'etat_des_lieux_' . $type . '_' . ($report->property->name ?? 'bien') . '_' . date('Ymd') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement état des lieux: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement de l\'état des lieux'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/condition-reports/{id}/view - Voir l'état des lieux
     */
    public function viewConditionReport($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $report = PropertyConditionReport::where('id', $id)
                ->whereHas('lease', function($q) use ($tenant) {
                    $q->where('tenant_id', $tenant->id);
                })
                ->with(['property', 'lease', 'creator'])
                ->firstOrFail();

            if (!$report->file_path || !Storage::disk('public')->exists($report->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier non trouvé'
                ], 404);
            }

            $file = Storage::disk('public')->get($report->file_path);
            $mimeType = Storage::disk('public')->mimeType($report->file_path);

            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="' . basename($report->file_path) . '"');

        } catch (\Exception $e) {
            Log::error('Erreur visualisation état des lieux: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la visualisation'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/documents/templates - Liste des templates
     */
    public function templates(Request $request)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $templates = Document::where('category', 'template')
                ->orderBy('name')
                ->get()
                ->map(function ($template) {
                    return [
                        'id' => $template->id,
                        'name' => $template->name,
                        'description' => $template->description,
                        'type' => $template->type,
                        'file_url' => $template->file_url,
                        'icon' => $template->getFileIcon(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur templates documents: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des templates'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/documents/shareable-contacts - Contacts partageables
     */
    public function getShareableContacts(Request $request)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $propertyId = $request->property_id;

            if (!$propertyId) {
                return response()->json([]);
            }

            $property = Property::find($propertyId);

            if (!$property) {
                return response()->json([]);
            }

            $activeLease = Lease::where('tenant_id', $tenant->id)
                ->where('property_id', $propertyId)
                ->where('status', 'active')
                ->first();

            if (!$activeLease) {
                return response()->json([]);
            }

            $contacts = [];
            $processedIds = [];

            // 1. LE CRÉATEUR DU BIEN
            if ($property->user_id) {
                $creatorUser = User::with('landlord', 'coOwner')->find($property->user_id);

                if ($creatorUser) {
                    $creatorName = '';
                    $creatorRole = '';

                    if ($creatorUser->isLandlord() && $creatorUser->landlord) {
                        $creatorName = ($creatorUser->landlord->first_name ?? '') . ' ' . ($creatorUser->landlord->last_name ?? '');
                        $creatorRole = 'Propriétaire (créateur)';
                    } elseif ($creatorUser->isCoOwner() && $creatorUser->coOwner) {
                        $creatorName = ($creatorUser->coOwner->first_name ?? '') . ' ' . ($creatorUser->coOwner->last_name ?? '');
                        $creatorRole = $creatorUser->coOwner->co_owner_type === 'agency' ? 'Agence (créateur)' : 'Copropriétaire (créateur)';
                    }

                    if (!empty($creatorName) && trim($creatorName) !== ' ') {
                        $contacts[] = [
                            'id' => $creatorUser->id,
                            'name' => trim($creatorName),
                            'email' => $creatorUser->email,
                            'role' => $creatorRole,
                            'type' => 'creator',
                        ];
                        $processedIds[] = $creatorUser->id;
                    }
                }
            }

            // 2. COPROPRIÉTAIRES
            $delegations = PropertyDelegation::where('property_id', $propertyId)
                ->where('status', 'active')
                ->with(['coOwner.user'])
                ->get();

            foreach ($delegations as $delegation) {
                if ($delegation->coOwner && $delegation->coOwner->user) {
                    $coOwnerUser = $delegation->coOwner->user;

                    if (in_array($coOwnerUser->id, $processedIds)) {
                        continue;
                    }

                    $role = $delegation->co_owner_type === 'agency' ? 'Agence' : 'Copropriétaire';
                    $name = ($delegation->coOwner->first_name ?? '') . ' ' . ($delegation->coOwner->last_name ?? '');

                    if (!empty(trim($name))) {
                        $contacts[] = [
                            'id' => $coOwnerUser->id,
                            'name' => trim($name),
                            'email' => $coOwnerUser->email,
                            'role' => $role,
                            'type' => 'co_owner',
                        ];

                        $processedIds[] = $coOwnerUser->id;
                    }
                }
            }

            return response()->json($contacts);

        } catch (\Exception $e) {
            Log::error('Erreur getShareableContacts documents: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }

    /**
     * GET /api/tenant/documents/{id} - Détail d'un document
     */
    public function show($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)
                ->with(['property', 'lease'])
                ->findOrFail($id);

            $document->file_url = $document->file_url;
            $document->file_size_formatted = $document->file_size_formatted;
            $document->shared_with_users = $document->shared_with_users;
            $document->icon = $document->getFileIcon();

            return response()->json([
                'success' => true,
                'data' => $document
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur show document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Document non trouvé'
            ], 404);
        }
    }

    /**
     * POST /api/tenant/documents - Créer un document
     */
    public function store(Request $request)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'type' => 'required|string|in:acte_vente,bail,quittance,dpe,diagnostic,etat_des_lieux,contrat_bail,autre',
                'bien' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'property_id' => 'nullable|exists:properties,id',
                'lease_id' => 'nullable|exists:leases,id',
                'is_shared' => 'nullable|in:true,false,1,0',
                'shared_with' => 'nullable|array',
                'shared_with.*' => 'exists:users,id',
                'shared_with_emails' => 'nullable|array',
                'shared_with_emails.*' => 'email',
                'document_date' => 'nullable|date',
                'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif|max:15360',
            ]);

            // Upload du fichier
            $file = $request->file('file');
            $path = $file->store('documents/' . $tenant->id, 'public');
            $fileSize = $file->getSize();
            $fileType = $file->getMimeType();

            $document = Document::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'property_id' => $validated['property_id'] ?? null,
                'lease_id' => $validated['lease_id'] ?? null,
                'created_by' => auth()->id(),
                'name' => $validated['name'] ?? $file->getClientOriginalName(),
                'type' => $validated['type'],
                'bien' => $validated['bien'] ?? null,
                'description' => $validated['description'] ?? null,
                'file_path' => $path,
                'file_size' => $fileSize,
                'file_type' => $fileType,
                'is_shared' => filter_var($validated['is_shared'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'shared_with' => $validated['shared_with'] ?? [],
                'shared_with_emails' => $validated['shared_with_emails'] ?? [],
                'status' => 'actif',
                'document_date' => $validated['document_date'] ?? null,
            ]);

            // Envoyer les emails si le document est partagé
            if ($document->is_shared && (!empty($document->shared_with) || !empty($document->shared_with_emails))) {
                $this->sendShareEmails($document);
            }

            Log::info('Document créé', [
                'document_id' => $document->id,
                'tenant_id' => $tenant->id
            ]);

            $document->load(['property', 'lease']);
            $document->file_url = $document->file_url;
            $document->file_size_formatted = $document->file_size_formatted;

            return response()->json([
                'success' => true,
                'message' => 'Document ajouté avec succès',
                'data' => $document
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur création document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du document'
            ], 500);
        }
    }

    /**
     * PUT /api/tenant/documents/{id} - Mettre à jour un document
     */
    public function update(Request $request, $id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)->findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'type' => 'sometimes|string|in:acte_vente,bail,quittance,dpe,diagnostic,etat_des_lieux,contrat_bail,autre',
                'bien' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'property_id' => 'nullable|exists:properties,id',
                'lease_id' => 'nullable|exists:leases,id',
                'is_shared' => 'sometimes|boolean',
                'shared_with' => 'nullable|array',
                'shared_with.*' => 'exists:users,id',
                'shared_with_emails' => 'nullable|array',
                'shared_with_emails.*' => 'email',
                'status' => 'sometimes|string|in:actif,archive',
            ]);

            $oldSharedWith = $document->shared_with;
            $document->update($validated);

            // Envoyer les emails si le partage a changé
            if ($document->is_shared &&
                (!empty($document->shared_with) && $document->shared_with != $oldSharedWith)) {
                $this->sendShareEmails($document);
            }

            $document->load(['property', 'lease']);
            $document->file_url = $document->file_url;
            $document->file_size_formatted = $document->file_size_formatted;

            return response()->json([
                'success' => true,
                'message' => 'Document mis à jour avec succès',
                'data' => $document
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour'
            ], 500);
        }
    }

    /**
     * DELETE /api/tenant/documents/{id} - Supprimer un document
     */
    public function destroy($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)->findOrFail($id);

            // Supprimer le fichier
            Storage::disk('public')->delete($document->file_path);

            $document->delete();

            Log::info('Document supprimé', [
                'document_id' => $id,
                'tenant_id' => $tenant->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression'
            ], 500);
        }
    }

    /**
     * POST /api/tenant/documents/{id}/archive - Archiver un document
     */
    public function archive($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)->findOrFail($id);
            $document->update(['status' => 'archive']);

            return response()->json([
                'success' => true,
                'message' => 'Document archivé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur archivage document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'archivage'
            ], 500);
        }
    }

    /**
     * POST /api/tenant/documents/{id}/restore - Restaurer un document
     */
    public function restore($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)->findOrFail($id);
            $document->update(['status' => 'actif']);

            return response()->json([
                'success' => true,
                'message' => 'Document restauré avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur restauration document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la restauration'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/documents/{id}/download - Télécharger un document
     */
    public function download($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)->findOrFail($id);

            if (!Storage::disk('public')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier non trouvé'
                ], 404);
            }

            $file = Storage::disk('public')->get($document->file_path);
            $mimeType = Storage::disk('public')->mimeType($document->file_path);
            $size = Storage::disk('public')->size($document->file_path);

            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'attachment; filename="' . $document->name . '"')
                ->header('Content-Length', $size)
                ->header('Cache-Control', 'private, no-transform, must-revalidate')
                ->header('Access-Control-Expose-Headers', 'Content-Disposition');

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/documents/{id}/view - Voir un document
     */
    public function view($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)->findOrFail($id);

            if (!Storage::disk('public')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier non trouvé'
                ], 404);
            }

            $file = Storage::disk('public')->get($document->file_path);
            $mimeType = Storage::disk('public')->mimeType($document->file_path);

            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="' . $document->name . '"');

        } catch (\Exception $e) {
            Log::error('Erreur visualisation document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la visualisation'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/documents/{id}/pdf - Télécharger le document en PDF avec ses informations
     */
    public function downloadPdf($id)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            $document = Document::where('tenant_id', $tenant->id)
                ->with(['property', 'lease'])
                ->findOrFail($id);

            if (!Storage::disk('public')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier non trouvé'
                ], 404);
            }

            // Charger la vue PDF
            $pdf = Pdf::loadView('pdf.document', [
                'document' => $document,
                'tenant' => $tenant,
                'date' => now()->format('d/m/Y H:i')
            ]);

            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true
            ]);

            $filename = 'document_' . $document->id . '_' . date('Ymd') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement PDF document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement'
            ], 500);
        }
    }

    /**
     * GET /api/tenant/documents/from-owners - Récupérer les documents uploadés par les propriétaires/copropriétaires
     */
    public function getDocumentsFromOwners(Request $request)
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            // Récupérer les baux actifs du locataire
            $activeLeases = Lease::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->with('property')
                ->get();

            $propertyIds = $activeLeases->pluck('property_id')->toArray();

            if (empty($propertyIds)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Récupérer les documents partagés avec le locataire par les propriétaires/copropriétaires
            // Ces documents sont ceux où le locataire est dans shared_with
            $documents = Document::whereIn('property_id', $propertyIds)
                ->where(function($query) use ($tenant) {
                    $query->whereJsonContains('shared_with', $tenant->user_id)
                          ->orWhereJsonContains('shared_with_emails', $tenant->email);
                })
                ->where('created_by', '!=', auth()->id()) // Pas créés par le locataire lui-même
                ->with(['property', 'lease', 'creator'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Ajouter les URLs des fichiers
            $documents->each(function($doc) {
                $doc->file_url = $doc->file_url;
                $doc->file_size_formatted = $doc->file_size_formatted;
                $doc->icon = $doc->getFileIcon();

                // Ajouter le nom du créateur
                if ($doc->creator) {
                    if ($doc->creator->hasRole('landlord')) {
                        $doc->created_by_name = 'Propriétaire';
                    } elseif ($doc->creator->hasRole('co_owner')) {
                        $doc->created_by_name = 'Copropriétaire';
                    } else {
                        $doc->created_by_name = $doc->creator->name ?? 'Inconnu';
                    }
                } else {
                    $doc->created_by_name = 'Propriétaire/Copropriétaire';
                }
            });

            return response()->json([
                'success' => true,
                'data' => $documents,
                'total' => $documents->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getDocumentsFromOwners: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des documents'
            ], 500);
        }
    }

    /**
     * Envoyer les emails de partage
     */
    private function sendShareEmails(Document $document)
    {
        try {
            $users = User::whereIn('id', $document->shared_with ?? [])->get();
            $tenant = auth()->user()->tenant;
            $frontendUrl = config('app.frontend_url', 'https://imona.app');

            foreach ($users as $user) {
                try {
                    Mail::to($user->email)->queue(new DocumentSharedMail($document, $tenant, $user, null, $frontendUrl));
                    Log::info('Email envoyé à', ['email' => $user->email]);
                } catch (\Exception $e) {
                    Log::error('Erreur envoi email à ' . $user->email . ': ' . $e->getMessage());
                }
            }

            foreach ($document->shared_with_emails ?? [] as $email) {
                try {
                    Mail::to($email)->queue(new DocumentSharedMail($document, $tenant, null, $email, $frontendUrl));
                    Log::info('Email externe envoyé à', ['email' => $email]);
                } catch (\Exception $e) {
                    Log::error('Erreur envoi email externe à ' . $email . ': ' . $e->getMessage());
                }
            }

            Log::info('Emails de partage envoyés', [
                'document_id' => $document->id,
                'recipients' => $document->shared_with,
                'external_recipients' => $document->shared_with_emails
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi emails partage: ' . $e->getMessage());
        }
    }

    /**
     * Envoyer une notification au propriétaire que le locataire a signé
     */
    private function sendTenantSignedNotification($lease)
    {
        try {
            $tenant = $lease->tenant;
            $property = $lease->property;
            $landlord = $lease->property->user;

            if (!$landlord || !$landlord->email) {
                Log::warning('Email du propriétaire non trouvé pour notification');
                return;
            }

            $appName = config('app.name', 'Gestiloc');
            $subject = "Le locataire a signé le contrat - $appName";

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
                        <h2>Signature reçue</h2>
                    </div>
                    <div class='content'>
                        <p>Bonjour,</p>
                        <p>Le locataire <strong>{$tenant->first_name} {$tenant->last_name}</strong> a signé le contrat pour le bien :</p>
                        <p><strong>{$property->name}</strong><br>
                        {$property->address}</p>
                        <p>Il reste votre signature pour activer le contrat.</p>
                        <p>Connectez-vous à votre espace pour finaliser la signature.</p>
                    </div>
                    <div class='footer'>
                        <p>Cet email a été envoyé automatiquement par {$appName}</p>
                    </div>
                </div>
            </body>
            </html>
            ";

            Mail::html($html, function ($message) use ($landlord, $subject) {
                $message->to($landlord->email)
                        ->subject($subject);
            });

            Log::info('Notification de signature envoyée au propriétaire', [
                'landlord_email' => $landlord->email,
                'lease_uuid' => $lease->uuid
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi email notification propriétaire: ' . $e->getMessage());
        }
    }

    /**
     * Envoyer une notification aux deux parties quand le contrat est activé
     */
    private function sendContractActivatedNotifications($lease)
    {
        try {
            $tenant = $lease->tenant;
            $property = $lease->property;
            $landlord = $lease->property->user;

            $appName = config('app.name', 'Gestiloc');
            $subject = "Contrat activé - $appName";

            // Envoyer au propriétaire
            if ($landlord && $landlord->email) {
                $landlordHtml = "
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
                            <h2>Contrat activé ✓</h2>
                        </div>
                        <div class='content'>
                            <p>Bonjour,</p>
                            <p>Le contrat pour le bien <strong>{$property->name}</strong> a été signé par les deux parties et est maintenant actif.</p>
                            <p>Locataire : <strong>{$tenant->first_name} {$tenant->last_name}</strong></p>
                            <p>Vous pouvez télécharger le contrat depuis votre espace.</p>
                        </div>
                        <div class='footer'>
                            <p>Cet email a été envoyé automatiquement par {$appName}</p>
                        </div>
                    </div>
                </body>
                </html>
                ";

                Mail::html($landlordHtml, function ($message) use ($landlord, $subject) {
                    $message->to($landlord->email)
                            ->subject($subject);
                });
            }

            // Envoyer au locataire
            if ($tenant && $tenant->email) {
                $tenantHtml = "
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
                            <h2>Contrat activé ✓</h2>
                        </div>
                        <div class='content'>
                            <p>Bonjour <strong>{$tenant->first_name} {$tenant->last_name}</strong>,</p>
                            <p>Le contrat pour le bien <strong>{$property->name}</strong> a été signé par les deux parties et est maintenant actif.</p>
                            <p>Vous pouvez télécharger le contrat depuis votre espace locataire.</p>
                        </div>
                        <div class='footer'>
                            <p>Cet email a été envoyé automatiquement par {$appName}</p>
                        </div>
                    </div>
                </body>
                </html>
                ";

                Mail::html($tenantHtml, function ($message) use ($tenant, $subject) {
                    $message->to($tenant->email)
                            ->subject($subject);
                });
            }

            // Envoyer aux copropriétaires
            $delegations = PropertyDelegation::where('property_id', $property->id)
                ->where('status', 'active')
                ->with(['coOwner.user'])
                ->get();

            foreach ($delegations as $delegation) {
                if ($delegation->coOwner && $delegation->coOwner->user && $delegation->coOwner->user->email) {
                    $coOwnerHtml = "
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
                                <h2>Contrat activé ✓</h2>
                            </div>
                            <div class='content'>
                                <p>Bonjour,</p>
                                <p>Le contrat pour le bien <strong>{$property->name}</strong> a été signé par les deux parties et est maintenant actif.</p>
                                <p>Locataire : <strong>{$tenant->first_name} {$tenant->last_name}</strong></p>
                                <p>Vous pouvez consulter le contrat depuis votre espace.</p>
                            </div>
                            <div class='footer'>
                                <p>Cet email a été envoyé automatiquement par {$appName}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    ";

                    Mail::html($coOwnerHtml, function ($message) use ($delegation, $subject) {
                        $message->to($delegation->coOwner->user->email)
                                ->subject($subject);
                    });
                }
            }

            Log::info('Notifications d\'activation envoyées', [
                'lease_uuid' => $lease->uuid
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi email activation: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/tenant/documents/filters/options - Options pour les filtres
     */
    public function getFilterOptions()
    {
        try {
            $tenant = $this->getTenant();

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès réservé aux locataires'
                ], 403);
            }

            // Récupérer les biens du locataire
            $properties = Property::whereHas('leases', function($q) use ($tenant) {
                $q->where('tenant_id', $tenant->id);
            })->get(['id', 'name']);

            // Récupérer les types de documents distincts
            $types = Document::where('tenant_id', $tenant->id)
                ->whereNotNull('type')
                ->distinct()
                ->pluck('type');

            // Types de baux
            $leaseTypes = ['residential', 'commercial', 'professional', 'furnished', 'empty'];

            // Types d'états des lieux
            $reportTypes = ['entry', 'exit'];

            // Statuts de bail pour les signatures
            $leaseStatuses = [
                'pending_signature' => 'En attente de signature',
                'active' => 'Actif',
                'terminated' => 'Terminé'
            ];

            // Générer les options de période (6 derniers mois)
            $periodes = ['Toutes'];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $periodes[] = $date->translatedFormat('F Y');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'properties' => $properties,
                    'types' => $types,
                    'periodes' => $periodes,
                    'lease_types' => $leaseTypes,
                    'report_types' => $reportTypes,
                    'lease_statuses' => $leaseStatuses,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur getFilterOptions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des options'
            ], 500);
        }
    }
}
