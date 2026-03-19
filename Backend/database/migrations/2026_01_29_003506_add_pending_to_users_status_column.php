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
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('active','suspended','deactivated','pending') NOT NULL DEFAULT 'active'");
        } else {
            // SQLite : désactiver les triggers le temps de l'alter
            DB::statement('PRAGMA legacy_alter_table = ON');
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 50)->default('active')->change();
            });
            DB::statement('PRAGMA legacy_alter_table = OFF');
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('active','suspended','deactivated') NOT NULL DEFAULT 'active'");
        } else {
            DB::statement('PRAGMA legacy_alter_table = ON');
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 50)->default('active')->change();
            });
            DB::statement('PRAGMA legacy_alter_table = OFF');
        }
    }
};
