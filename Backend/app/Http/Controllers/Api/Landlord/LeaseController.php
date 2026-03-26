<?php

namespace App\Http\Controllers\Api\Landlord;

use App\Http\Controllers\Controller;
use App\Models\Lease;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Landlord;
use App\Models\PropertyUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;

class LeaseController extends Controller
{
    /**
     * Récupérer UNIQUEMENT les biens créés par le propriétaire lui-même
     * Filtre sur user_id = ID de l'utilisateur connecté
     */
    public function getAvailableProperties(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        Log::info('Récupération des biens pour propriétaire', [
            'user_id' => $user->id,
            'user_email' => $user->email,
        ]);

        // Vérifier si l'utilisateur est un propriétaire
        if (!$user->hasRole('landlord')) {
            return response()->json(['message' => 'Accès réservé aux propriétaires'], 403);
        }

        // 🔥 FILTRE SUR USER_ID : uniquement les biens créés par cet utilisateur
        $properties = Property::where('user_id', $user->id)
            ->whereIn('status', ['available', 'maintenance'])
            ->get();

        Log::info('Biens du propriétaire trouvés', [
            'count' => $properties->count(),
            'user_id' => $user->id,
            'properties' => $properties->map(function($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'status' => $p->status,
                    'landlord_id' => $p->landlord_id,
                ];
            })
        ]);

        return response()->json($properties);
    }

    /**
     * Récupérer les propriétés pour le filtre des baux
     */
    public function getPropertiesForFilter(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $properties = Property::where('user_id', $user->id)
            ->select('id', 'name', 'address', 'city', 'status')
            ->get();

        return response()->json($properties);
    }

    /**
     * Récupérer les locataires du propriétaire
     */
    public function getTenants(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $landlord = Landlord::where('user_id', $user->id)->first();

        if (!$landlord) {
            return response()->json([]);
        }

        // Récupérer les locataires qui appartiennent à ce landlord
        $tenants = Tenant::where('meta->landlord_id', $landlord->id)
            ->whereDoesntHave('leases', function($query) {
                $query->where('status', 'active');
            })
            ->with('user')
            ->get();

        return response()->json($tenants);
    }

    /**
     * Créer un nouveau bail
     */
/**
 * Créer un nouveau bail
 */
public function store(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->hasRole('landlord')) {
        return response()->json(['message' => 'Accès interdit'], 403);
    }

    $landlord = Landlord::where('user_id', $user->id)->first();

    if (!$landlord) {
        return response()->json(['message' => 'Profil propriétaire non trouvé'], 404);
    }

    $validated = $request->validate([
        'property_id' => [
            'required',
            'exists:properties,id',
            function ($attribute, $value, $fail) use ($user) {
                $property = Property::find($value);

                if (!$property || $property->user_id != $user->id) {
                    $fail('Ce bien ne vous appartient pas.');
                }
                if ($property->status === 'rented') {
                    $fail('Ce bien est déjà loué.');
                }
            }
        ],
        'tenant_id' => [
            'required',
            'exists:tenants,id',
            function ($attribute, $value, $fail) use ($landlord) {
                $tenant = Tenant::find($value);
                if (!$tenant || ($tenant->meta['landlord_id'] ?? null) != $landlord->id) {
                    $fail('Ce locataire ne vous est pas associé.');
                }
            }
        ],
        'lease_type' => 'required|in:nu,meuble',
        // LE STATUT EST RETIRÉ DE LA VALIDATION
        'start_date' => 'required|date',
        'duration_months' => 'required|integer|min:1|max:120',
        'end_date' => 'nullable|date',
        'rent_amount' => 'required|numeric|min:1',
        'charges_amount' => 'nullable|numeric|min:0',
        'guarantee_amount' => 'nullable|numeric|min:0',
        'billing_day' => 'required|integer|min:1|max:28',
        'payment_frequency' => 'required|in:monthly,quarterly,annually',
        'payment_mode' => 'nullable|string|max:100',
        'special_conditions' => 'nullable|string|max:5000',
        'tacit_renewal' => 'nullable|boolean', // NOUVEAU CHAMP
    ]);

    try {
        DB::beginTransaction();

        $property = Property::find($validated['property_id']);

        $leaseNumber = 'BAIL-' . date('Y') . '-' . str_pad(Lease::count() + 1, 4, '0', STR_PAD_LEFT);

        // Récupérer la valeur de tacit_renewal (true par défaut)
        $tacitRenewal = isset($validated['tacit_renewal']) ? (bool)$validated['tacit_renewal'] : true;

        $lease = Lease::create([
            'uuid' => Str::uuid(),
            'property_id' => $validated['property_id'],
            'tenant_id' => $validated['tenant_id'],
            'lease_number' => $leaseNumber,
            'type' => $validated['lease_type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'tacit_renewal' => $tacitRenewal, // NOUVEAU CHAMP
            'rent_amount' => $validated['rent_amount'],
            'charges_amount' => $validated['charges_amount'] ?? 0,
            'guarantee_amount' => $validated['guarantee_amount'] ?? 0,
            'prepaid_rent_months' => 0,
            'billing_day' => $validated['billing_day'],
            'payment_frequency' => $validated['payment_frequency'],
            'penalty_rate' => 0,
            'status' => 'pending_signature', // FORCÉ À pending_signature
            'terms' => [
                'payment_mode' => $validated['payment_mode'] ?? 'Espèce',
                'special_conditions' => $validated['special_conditions'] ?? null,
            ],
            'landlord_signature' => null,
            'tenant_signature' => null,
            'signed_at' => null,
        ]);

        $tenant = Tenant::find($validated['tenant_id']);

        PropertyUser::create([
            'property_id' => $validated['property_id'],
            'user_id' => $tenant->user_id,
            'tenant_id' => $validated['tenant_id'],
            'lease_id' => $lease->id,
            'role' => 'tenant',
            'share_percentage' => 100,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'status' => 'pending',
        ]);

        // Le bien reste disponible jusqu'à signature
        // NE PAS mettre à jour le statut du bien ici

        DB::commit();

        Log::info('=== BAIL CRÉÉ EN ATTENTE DE SIGNATURE ===', [
            'lease_id' => $lease->id,
            'lease_number' => $leaseNumber,
            'property_id' => $validated['property_id'],
            'tenant_id' => $validated['tenant_id'],
            'landlord_id' => $landlord->id,
            'tacit_renewal' => $tacitRenewal,
            'status' => 'pending_signature',
        ]);

        $this->sendSignatureInvitationToTenant($lease);

        return response()->json([
            'message' => 'Contrat de location créé avec succès. Un email a été envoyé au locataire pour signature.',
            'lease' => $lease->load(['property', 'tenant']),
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();

        Log::error('Erreur création bail', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'message' => 'Erreur lors de la création du contrat',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Afficher la liste des baux
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->hasRole('landlord')) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $leases = Lease::whereHas('property', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['property', 'tenant.user'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($leases);
    }

    /**
     * Afficher un bail spécifique
     */
    public function show($uuid)
    {
        $lease = Lease::where('uuid', $uuid)
            ->with(['property', 'tenant.user'])
            ->firstOrFail();

        return response()->json($lease);
    }

    /**
     * Télécharger le contrat de bail en PDF
     */
    public function downloadContract(Request $request, $uuid)
    {
        try {
            $lease = Lease::where('uuid', $uuid)
                ->with(['property', 'tenant'])
                ->firstOrFail();

            // Vérifier que l'utilisateur a le droit de voir ce bail
            $user = $request->user();
            if (!$user || ($user->id != $lease->property->user_id && !$user->hasRole('admin'))) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }

            // Générer le PDF
            $pdf = Pdf::loadView('pdfs.lease-contract', [
                'lease' => $lease,
                'landlord' => $user,
                'tenant' => $lease->tenant,
                'property' => $lease->property,
            ]);

            return $pdf->download('contrat-bail-' . $lease->lease_number . '.pdf');

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement PDF: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Signer le contrat électroniquement
     */
    public function signContract(Request $request, $uuid)
    {
        try {
            $lease = Lease::where('uuid', $uuid)->firstOrFail();
            $user = $request->user();

            // Déterminer qui signe
            if ($user->id == $lease->property->user_id) {
                // Le propriétaire signe
                $lease->landlord_signature = json_encode([
                    'signed_at' => now(),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                // ✅ ENVOYER UN EMAIL AU LOCATAIRE POUR L'INVITER À SIGNER
                $this->sendSignatureInvitationToTenant($lease);

            } else if ($user->id == $lease->tenant->user_id) {
                // Le locataire signe
                $lease->tenant_signature = json_encode([
                    'signed_at' => now(),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                // ✅ ENVOYER UN EMAIL AU PROPRIÉTAIRE POUR L'INFORMER
                $this->sendTenantSignedNotification($lease);

            } else {
                return response()->json(['message' => 'Non autorisé'], 403);
            }

            // Vérifier si les deux ont signé
            if ($lease->landlord_signature && $lease->tenant_signature) {
                $lease->status = 'active';
                $lease->signed_at = now();

                // ✅ ENVOYER UN EMAIL AUX DEUX POUR CONFIRMER L'ACTIVATION
                $this->sendContractActivatedNotification($lease);
            } else {
                $lease->status = 'pending_signature';
            }

            $lease->save();

            return response()->json([
                'message' => 'Signature enregistrée',
                'lease' => $lease,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur signature: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la signature',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Uploader un contrat signé manuellement
     */
    public function uploadSignedContract(Request $request, $uuid)
    {
        try {
            $lease = Lease::where('uuid', $uuid)->firstOrFail();

            $request->validate([
                'signed_file' => 'required|file|mimes:pdf|max:10240',
            ]);

            $path = $request->file('signed_file')->store('signed-contracts/' . $lease->id, 'public');

            $lease->signed_document = $path;
            $lease->status = 'active';
            $lease->signed_at = now();
            $lease->save();

            // ✅ ENVOYER UN EMAIL AUX DEUX POUR CONFIRMER L'ACTIVATION
            $this->sendContractActivatedNotification($lease);

            return response()->json([
                'message' => 'Contrat signé téléchargé',
                'path' => $path,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur upload contrat signé: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors du téléchargement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Voir le contrat signé
     */
    public function viewSignedContract($uuid)
    {
        $lease = Lease::where('uuid', $uuid)->firstOrFail();

        if (!$lease->signed_document) {
            abort(404, 'Aucun contrat signé trouvé');
        }

        $path = storage_path('app/public/' . $lease->signed_document);

        if (!file_exists($path)) {
            abort(404, 'Fichier non trouvé');
        }

        return response()->file($path);
    }

    /**
     * Envoyer une invitation au locataire pour signer le contrat
     */
    private function sendSignatureInvitationToTenant($lease)
    {
        try {
            $tenant = $lease->tenant;
            $property = $lease->property;

            if (!$tenant || !$tenant->email) {
                Log::warning('Email du locataire non trouvé pour invitation à signer');
                return;
            }

            $appName = config('app.name', 'Gestiloc');
            $subject = "Un contrat vous attend pour signature - $appName";

            // Générer un lien pour que le locataire puisse signer
            $signatureLink = config('app.frontend_url') . "/tenant/sign-contract/" . $lease->uuid;

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
                        <h2>Un contrat vous attend</h2>
                    </div>
                    <div class='content'>
                        <p>Bonjour <strong>{$tenant->first_name} {$tenant->last_name}</strong>,</p>
                        <p>Un contrat de location a été créé pour le bien :</p>
                        <p><strong>{$property->name}</strong><br>
                        {$property->address}</p>
                        <p>Le propriétaire vous invite à signer ce contrat électroniquement.</p>
                        <p>Pour le consulter et le signer, cliquez sur le bouton ci-dessous :</p>
                        <p style='text-align: center;'>
                            <a href='{$signatureLink}' class='button'>Signer le contrat</a>
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

            Log::info('Email d\'invitation à signer envoyé au locataire', [
                'tenant_email' => $tenant->email,
                'lease_uuid' => $lease->uuid
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi email invitation signature: ' . $e->getMessage());
        }
    }

    /**
     * Envoyer une notification au propriétaire quand le locataire signe
     */
    private function sendTenantSignedNotification($lease)
    {
        try {
            $tenant = $lease->tenant;
            $property = $lease->property;
            $landlord = $lease->property->user; // Le propriétaire

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
    private function sendContractActivatedNotification($lease)
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

            Log::info('Notifications d\'activation envoyées', [
                'lease_uuid' => $lease->uuid
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi email activation: ' . $e->getMessage());
        }
    }

    /**
 * Signature électronique avec canvas (signature dessinée)
 * POST /api/landlord/leases/{uuid}/sign-electronic
 */
public function signContractElectronic(Request $request, $uuid)
{
    try {
        $lease = Lease::where('uuid', $uuid)->firstOrFail();
        $user = $request->user();

        // Vérifier que l'utilisateur est bien le propriétaire
        if ($user->id != $lease->property->user_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Vérifier que le contrat n'est pas déjà signé
        if ($lease->landlord_signature) {
            return response()->json(['message' => 'Vous avez déjà signé ce contrat'], 400);
        }

        $signature = $request->input('signature');

        if (!$signature) {
            return response()->json(['message' => 'Signature manquante'], 400);
        }

        // Décoder la signature base64
        $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $signature));

        // Créer le dossier si nécessaire
        $signatureDir = storage_path('app/public/signatures/' . $lease->id);
        if (!file_exists($signatureDir)) {
            mkdir($signatureDir, 0755, true);
        }

        // Générer un nom de fichier unique
        $filename = 'signatures/' . $lease->id . '/' . Str::uuid() . '.png';

        // Sauvegarder l'image
        Storage::disk('public')->put($filename, $imageData);

        // Enregistrer la signature
        $lease->landlord_signature = json_encode([
            'type' => 'electronic',
            'image_path' => $filename,
            'signed_at' => now(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Vérifier si le locataire a déjà signé
        if ($lease->tenant_signature) {
            $lease->status = 'active';
            $lease->signed_at = now();

            // Notifier les deux parties
            $this->sendContractActivatedNotification($lease);
        } else {
            $lease->status = 'pending_signature';

            // Envoyer une invitation au locataire
            $this->sendSignatureInvitationToTenant($lease);
        }

        $lease->save();

        return response()->json([
            'message' => 'Signature enregistrée avec succès',
            'lease' => $lease->load(['property', 'tenant']),
        ]);

    } catch (\Exception $e) {
        Log::error('Erreur signature électronique: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur lors de la signature',
            'error' => $e->getMessage()
        ], 500);
    }
}
}
