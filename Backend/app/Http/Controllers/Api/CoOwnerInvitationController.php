<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoOwnerInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class CoOwnerInvitationController extends Controller
{
    /**
     * Renvoyer une invitation
     */
    public function resend($id)
    {
        try {
            $invitation = CoOwnerInvitation::findOrFail($id);

            // Vérifier que l'invitation n'a pas déjà été acceptée
            if ($invitation->accepted_at) {
                return response()->json([
                    'message' => 'Cette invitation a déjà été acceptée'
                ], 400);
            }

            // Générer un nouveau token
            $invitation->token = bin2hex(random_bytes(32));
            $invitation->expires_at = now()->addDays(7);
            $invitation->save();

            // Générer le lien d'invitation
            $acceptUrl = URL::temporarySignedRoute(
                'api.auth.accept-co-owner-invitation',
                now()->addDays(7),
                ['invitationId' => $invitation->id]
            );

            // Envoyer l'email
            $this->sendInvitationEmail($invitation, $acceptUrl);

            Log::info('Invitation renvoyée', ['invitation_id' => $id]);

            return response()->json([
                'message' => 'Invitation renvoyée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur renvoi invitation', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du renvoi de l\'invitation'
            ], 500);
        }
    }

    /**
     * Annuler une invitation
     */
    public function cancel($id)
    {
        try {
            $invitation = CoOwnerInvitation::findOrFail($id);

            // Supprimer l'invitation
            $invitation->delete();

            Log::info('Invitation annulée', ['invitation_id' => $id]);

            return response()->json([
                'message' => 'Invitation annulée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur annulation invitation', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'annulation de l\'invitation'
            ], 500);
        }
    }

    /**
     * Envoyer l'email d'invitation
     */
    private function sendInvitationEmail($invitation, $acceptUrl)
    {
        $meta = $invitation->meta ?? [];
        $name = trim(($meta['first_name'] ?? '') . ' ' . ($meta['last_name'] ?? ''));
        if (empty($name)) {
            $name = $invitation->email;
        }

        $appName = config('app.name', 'Gestiloc');
        $type = $invitation->invitation_type === 'agency' ? 'Agence' : 'Co-propriétaire';

        $subject = "Invitation à rejoindre $appName en tant que $type";

        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #70AE48, #8bc34a); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #70AE48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Invitation à rejoindre $appName</h2>
                </div>
                <div class='content'>
                    <p>Bonjour <strong>$name</strong>,</p>
                    <p>Vous avez été invité(e) à rejoindre la plateforme <strong>$appName</strong> en tant que <strong>$type</strong>.</p>
                    <p>Pour accepter cette invitation et créer votre compte, cliquez sur le bouton ci-dessous :</p>
                    <p style='text-align: center;'>
                        <a href='$acceptUrl' class='button'>Accepter l'invitation</a>
                    </p>
                    <p>Ce lien expirera le " . $invitation->expires_at->format('d/m/Y à H:i') . ".</p>
                    <p>Si vous n'êtes pas à l'origine de cette invitation, vous pouvez ignorer cet email.</p>
                </div>
                <div class='footer'>
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    <p>&copy; " . date('Y') . " $appName. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
        ";

        Mail::html($html, function ($message) use ($invitation, $subject) {
            $message->to($invitation->email)
                    ->subject($subject);
        });
    }
}
