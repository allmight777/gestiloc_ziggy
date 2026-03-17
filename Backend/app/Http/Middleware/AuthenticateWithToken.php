<?php
// app/Http/Middleware/AuthenticateWithToken.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class AuthenticateWithToken
{
public function handle(Request $request, Closure $next)
{
    // 1. Déjà authentifié par session
    if (auth()->check()) {
        return $next($request);
    }

    // 2. Token en GET ou POST
    $rawToken = $request->input('api_token') ?? $request->query('api_token');
    if ($rawToken) {
        $token = PersonalAccessToken::findToken($rawToken);
        if ($token) {
            auth()->login($token->tokenable, true);
            session()->put('auth_token', $rawToken);
            session()->save();
            return $next($request);
        }
    }

    // 3. Bearer token
    if ($request->bearerToken()) {
        $token = PersonalAccessToken::findToken($request->bearerToken());
        if ($token) {
            auth()->login($token->tokenable, true);
            session()->save();
            return $next($request);
        }
    }

    // 4. Cookie
    if ($request->cookie('token')) {
        $token = PersonalAccessToken::findToken($request->cookie('token'));
        if ($token) {
            auth()->login($token->tokenable, true);
            session()->save();
            return $next($request);
        }
    }

    return redirect()->route('login')->with('error', 'Session expirée. Veuillez vous reconnecter.');
}
}
