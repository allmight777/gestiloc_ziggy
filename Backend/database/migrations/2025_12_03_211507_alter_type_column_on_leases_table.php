<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('leases', function (Blueprint $table) {
            // Utiliser le Schema Builder pour la compatibilité SQLite/MySQL
            $table->enum('type', ['nu', 'meuble'])->default('nu')->change();
        });
    }

    public function down(): void
    {
        Schema::table('leases', function (Blueprint $table) {
            // Remets ici l'ancien type si tu veux être propre,
            // par ex :
            // DB::statement("ALTER TABLE leases MODIFY COLUMN type VARCHAR(50) NOT NULL");
        });
    }
};
