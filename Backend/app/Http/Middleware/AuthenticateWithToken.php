<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class AuthenticateWithToken
{
    public function handle(Request $request, Closure $next)
    {
        // 1. Deja authentifie par session
        if (auth()->check()) {
            return $next($request);
        }

        // 2. Token en GET ou POST
        $rawToken = $request->input('api_token') ?? $request->query('api_token');
        if ($rawToken) {
            $token = PersonalAccessToken::findToken($rawToken);
            if ($token) {
                auth()->login($token->tokenable, true);
                session()->put('api_token', $rawToken);
                session()->put('auth_token', $rawToken);
                session()->save();
                return $next($request);
            }
        }

        // 3. Token en session
        $sessionToken = session('api_token') ?? session('auth_token');
        if ($sessionToken) {
            $token = PersonalAccessToken::findToken($sessionToken);
            if ($token) {
                auth()->login($token->tokenable, true);
                return $next($request);
            }
        }

        // 4. Bearer token
        if ($request->bearerToken()) {
            $token = PersonalAccessToken::findToken($request->bearerToken());
            if ($token) {
                auth()->login($token->tokenable, true);
                session()->put('api_token', $request->bearerToken());
                session()->save();
                return $next($request);
            }
        }

        // 5. Cookie
        if ($request->cookie('token')) {
            $token = PersonalAccessToken::findToken($request->cookie('token'));
            if ($token) {
                auth()->login($token->tokenable, true);
                session()->put('api_token', $request->cookie('token'));
                session()->save();
                return $next($request);
            }
        }

        return redirect()->route('login')->with('error', 'Session expiree. Veuillez vous reconnecter.');
    }
}
