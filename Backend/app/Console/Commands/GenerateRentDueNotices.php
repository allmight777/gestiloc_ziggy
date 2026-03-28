<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\CoOwner\RentDueNoticeController;

class GenerateRentDueNotices extends Command
{
    protected $signature = 'notices:generate-rent-due';
    protected $description = 'Génère automatiquement les avis d\'échéance pour les loyers à venir';

    public function handle()
    {
        $this->info('Début de la génération des avis d\'échéance...');

        $result = RentDueNoticeController::generateAutomaticNotices();

        $this->info("Avis générés : {$result['generated']}");
        $this->info("Erreurs : {$result['errors']}");

        return Command::SUCCESS;
    }
}
