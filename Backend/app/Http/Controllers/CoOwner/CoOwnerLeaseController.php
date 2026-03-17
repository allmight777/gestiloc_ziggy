<?php

namespace App\Http\Controllers\CoOwner;

use App\Http\Controllers\Controller;
use App\Models\Lease;
use App\Models\CoOwner;
use App\Models\PropertyDelegation;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Mail;

class CoOwnerLeaseController extends Controller
{
    /**
     * Liste des baux
     */
    public function index(Request $request)
    {


        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return redirect()->route('login')->with('error', 'Veuillez vous connecter');
        }

        if (!$user->hasRole('co_owner')) {
            return redirect()->route('login')->with('error', 'Accès réservé aux co-propriétaires');
        }

        $coOwner = $user->coOwner;
        if (!$coOwner) {
            return redirect()->route('login')->with('error', 'Profil co-propriétaire non trouvé');
        }

        $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
            ->where('status', 'active')
            ->pluck('property_id')
            ->toArray();

        $properties = Property::whereIn('id', $delegatedPropertyIds)->orderBy('name')->get();

        $query = Lease::whereIn('property_id', $delegatedPropertyIds)
            ->with(['property', 'tenant.user']);

        if ($request->filled('property_id') && $request->property_id !== 'all') {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('tenant', function ($s) use ($search) {
                    $s->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                })->orWhereHas('property', function ($s) use ($search) {
                    $s->where('name', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            });
        }

        $leases = $query->orderBy('created_at', 'desc')->get();

       return view('co-owner.leases.index', compact('leases', 'properties', 'user'));
    }

    /**
     * Signature électronique
     */
    public function signContract(Request $request, $uuid)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user || !$user->hasRole('co_owner')) {
            return redirect()->route('login')->with('error', 'Accès non autorisé');
        }

        $coOwner = $user->coOwner;
        if (!$coOwner) {
            return back()->with('error', 'Profil co-propriétaire non trouvé');
        }

        $lease = Lease::where('uuid', $uuid)->firstOrFail();

        $isDelegated = PropertyDelegation::where('property_id', $lease->property_id)
            ->where('co_owner_id', $coOwner->id)
            ->where('status', 'active')
            ->exists();

        if (!$isDelegated) {
            return back()->with('error', 'Vous n\'avez pas accès à ce bail');
        }

        if ($lease->status !== 'pending_signature') {
            return back()->with('error', 'Ce bail n\'est pas en attente de signature');
        }

        if (!empty($lease->landlord_signature)) {
            return back()->with('error', 'Vous avez déjà signé ce contrat');
        }

        try {
            $lease->landlord_signature = json_encode([
                'signed_at'   => now(),
                'ip'          => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'signed_by'   => 'co_owner',
                'co_owner_id' => $coOwner->id,
            ]);

            if (!empty($lease->tenant_signature)) {
                $lease->status    = 'active';
                $lease->signed_at = now();

                // ✅ ENVOYER UN EMAIL AUX DEUX POUR CONFIRMER L'ACTIVATION
                $this->sendContractActivatedNotification($lease);
            } else {
                // ✅ ENVOYER UN EMAIL AU LOCATAIRE POUR L'INVITER À SIGNER
                $this->sendSignatureInvitationToTenant($lease);
            }

            $lease->save();

            Log::info('Signature co-proprio enregistrée', [
                'lease_uuid'  => $uuid,
                'co_owner_id' => $coOwner->id,
                'new_status'  => $lease->status,
            ]);

            $msg = ($lease->status === 'active')
                ? 'Contrat activé — les deux parties ont signé.'
                : 'Signature enregistrée. En attente de la signature du locataire.';

            return redirect()
                ->route('co-owner.leases.index', ['api_token' => $request->get('api_token')])
                ->with('success', $msg);

        } catch (\Exception $e) {
            Log::error('Erreur signature co-proprio: ' . $e->getMessage());
            return back()->with('error', 'Erreur lors de la signature : ' . $e->getMessage());
        }
    }

    /**
     * Upload d'un contrat signé (PDF)
     */
    public function uploadSignedContract(Request $request, $uuid)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user || !$user->hasRole('co_owner')) {
            return redirect()->route('login')->with('error', 'Accès non autorisé');
        }

        $coOwner = $user->coOwner;
        if (!$coOwner) {
            return back()->with('error', 'Profil co-propriétaire non trouvé');
        }

        $lease = Lease::where('uuid', $uuid)->firstOrFail();

        $isDelegated = PropertyDelegation::where('property_id', $lease->property_id)
            ->where('co_owner_id', $coOwner->id)
            ->where('status', 'active')
            ->exists();

        if (!$isDelegated) {
            return back()->with('error', 'Vous n\'avez pas accès à ce bail');
        }

        $request->validate([
            'signed_file' => 'required|file|mimes:pdf|max:10240',
        ]);

        try {
            $path = $request->file('signed_file')->store('signed-contracts/' . $lease->id, 'public');

            $lease->signed_document = $path;
            $lease->status          = 'active';
            $lease->signed_at       = now();
            $lease->save();

            // ✅ ENVOYER UN EMAIL AUX DEUX POUR CONFIRMER L'ACTIVATION
            $this->sendContractActivatedNotification($lease);

            Log::info('Contrat signé uploadé (co-proprio)', [
                'lease_uuid'  => $uuid,
                'co_owner_id' => $coOwner->id,
                'path'        => $path,
            ]);

            return redirect()
                ->route('co-owner.leases.index', ['api_token' => $request->get('api_token')])
                ->with('success', 'Contrat signé téléchargé avec succès. Bail activé.');

        } catch (\Exception $e) {
            Log::error('Erreur upload contrat signé (co-proprio): ' . $e->getMessage());
            return back()->with('error', 'Erreur lors du téléchargement : ' . $e->getMessage());
        }
    }

    /**
     * Voir le contrat signé (stream PDF)
     */
    public function viewSignedContract(Request $request, $uuid)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user || !$user->hasRole('co_owner')) {
            return redirect()->route('login')->with('error', 'Accès non autorisé');
        }

        $coOwner = $user->coOwner;
        if (!$coOwner) {
            return redirect()->route('login')->with('error', 'Profil co-propriétaire non trouvé');
        }

        $lease = Lease::where('uuid', $uuid)->firstOrFail();

        $isDelegated = PropertyDelegation::where('property_id', $lease->property_id)
            ->where('co_owner_id', $coOwner->id)
            ->where('status', 'active')
            ->exists();

        if (!$isDelegated) {
            abort(403, 'Accès non autorisé');
        }

        if (!$lease->signed_document) {
            abort(404, 'Aucun contrat signé trouvé');
        }

        $path = storage_path('app/public/' . $lease->signed_document);

        if (!file_exists($path)) {
            abort(404, 'Fichier non trouvé');
        }

        return response()->file($path, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="contrat-signe-' . $lease->uuid . '.pdf"',
        ]);
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
                        <p>Le co-propriétaire vous invite à signer ce contrat électroniquement.</p>
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
     * Envoyer une notification aux deux parties quand le contrat est activé
     */
    private function sendContractActivatedNotification($lease)
    {
        try {
            $tenant = $lease->tenant;
            $property = $lease->property;
            $landlord = $lease->property->user;
            $coOwner = $lease->property->coOwners()->first(); // Récupérer le co-propriétaire

            $appName = config('app.name', 'Gestiloc');
            $subject = "Contrat activé - $appName";

            // Envoyer au propriétaire principal
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
     * Utilitaire auth — même pattern que CoOwnerTenantController
     */
    private function getAuthenticatedUser(Request $request)
    {
        if ($request->bearerToken()) {
            $sanctumToken = PersonalAccessToken::findToken($request->bearerToken());
            if ($sanctumToken) {
                $user = $sanctumToken->tokenable;
                auth('web')->login($user);
                return $user;
            }
        }

        if ($request->has('api_token')) {
            $sanctumToken = PersonalAccessToken::findToken($request->get('api_token'));
            if ($sanctumToken) {
                $user = $sanctumToken->tokenable;
                auth('web')->login($user);
                return $user;
            }
        }

        if (auth()->check()) {
            return auth()->user();
        }

        return null;
    }
}
