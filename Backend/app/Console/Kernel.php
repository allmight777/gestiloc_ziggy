<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Génération automatique des avis d'échéance - Tous les jours à 8h
        $schedule->command('notices:generate-rent-due')->dailyAt('08:00');

        // Alternative: toutes les heures
        // $schedule->command('notices:generate-rent-due')->hourly();

        // Alternative: tous les jours à minuit
        // $schedule->command('notices:generate-rent-due')->daily();

        // Alternative: tous les jours à 9h du matin
        // $schedule->command('notices:generate-rent-due')->dailyAt('09:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
