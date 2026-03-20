<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // Forcer HTTPS en production
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Helper pour generer l URL React
        app()->singleton('react_url', function () {
            return env('REACT_APP_URL', 'https://gestiloc-front.vercel.app');
        });

        // Partager avec toutes les vues
        view()->share('reactUrl', env('REACT_APP_URL', 'https://gestiloc-front.vercel.app'));

        // Helper pour determiner si un lien est React ou Laravel
        view()->share('isReactRoute', function ($path) {
            $reactRoutes = [
                '/coproprietaire/biens',
                '/coproprietaire/delegations',
                '/coproprietaire/baux',
                '/coproprietaire/quittances',
                '/coproprietaire/documents',
                '/coproprietaire/finances',
                '/coproprietaire/profile',
                '/coproprietaire/mes-delegations',
                '/coproprietaire/demandes-delegation',
                '/coproprietaire/inviter-proprietaire',
                '/coproprietaire/emettre-paiement',
                '/coproprietaire/retrait-methode',
                '/coproprietaire/dashboard',
            ];
            return in_array($path, $reactRoutes);
        });
    }
}
