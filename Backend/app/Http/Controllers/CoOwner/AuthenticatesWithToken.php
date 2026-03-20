<?php

namespace App\Http\Controllers\CoOwner;

use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Http\Request;

trait AuthenticatesWithToken
{
    protected function getAuthenticatedUser(Request $request)
    {
        // 1. Bearer token header
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $token = PersonalAccessToken::findToken($bearerToken);
            if ($token) {
                $user = $token->tokenable;
                auth('web')->login($user);
                session(['api_token' => $bearerToken]);
                return $user;
            }
        }

        // 2. api_token dans GET ou POST
        $apiToken = $request->get('api_token') ?? $request->post('api_token');
        if ($apiToken) {
            $token = PersonalAccessToken::findToken($apiToken);
            if ($token) {
                $user = $token->tokenable;
                auth('web')->login($user);
                session(['api_token' => $apiToken]);
                return $user;
            }
        }

        // 3. Token stocke en session
        $sessionToken = session('api_token');
        if ($sessionToken) {
            $token = PersonalAccessToken::findToken($sessionToken);
            if ($token) {
                $user = $token->tokenable;
                auth('web')->login($user);
                return $user;
            }
        }

        // 4. Session web classique
        if (auth('web')->check()) {
            return auth('web')->user();
        }

        return null;
    }

    protected function redirectToLogin()
    {
        return redirect('https://gestiloc-front.vercel.app/login');
    }
}
