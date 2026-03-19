<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE tenants MODIFY COLUMN `status` ENUM('candidate', 'active', 'inactive', 'archived', 'pending', 'rejected', 'suspended') DEFAULT 'candidate'");
            DB::statement("ALTER TABLE tenants MODIFY COLUMN `status` ENUM('candidate', 'active', 'inactive', 'archived', 'pending', 'rejected', 'suspended') DEFAULT 'candidate' COMMENT 'candidate: Candidat, active: Actif, inactive: Inactif, archived: Archivé, pending: En attente, rejected: Rejeté, suspended: Suspendu'");
        } else {
            DB::statement('PRAGMA legacy_alter_table = ON');
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('status', 50)->default('candidate')->change();
            });
            DB::statement('PRAGMA legacy_alter_table = OFF');
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE tenants MODIFY COLUMN `status` ENUM('candidate', 'active', 'inactive') DEFAULT 'candidate'");
        } else {
            DB::statement('PRAGMA legacy_alter_table = ON');
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('status', 50)->default('candidate')->change();
            });
            DB::statement('PRAGMA legacy_alter_table = OFF');
        }
    }
};
