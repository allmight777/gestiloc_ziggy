<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('active','suspended','deactivated','pending') NOT NULL DEFAULT 'active'");
        } elseif ($driver === 'pgsql') {
            // Supprimer l ancienne contrainte CHECK et en creer une nouvelle
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','suspended','deactivated','pending'))");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 50)->default('active')->change();
            });
        }
    }

    public function down(): void {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('active','suspended','deactivated') NOT NULL DEFAULT 'active'");
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','suspended','deactivated'))");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 50)->default('active')->change();
            });
        }
    }
};
