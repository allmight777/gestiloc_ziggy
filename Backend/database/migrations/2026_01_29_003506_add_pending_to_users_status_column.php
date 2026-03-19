<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('active','suspended','deactivated','pending') NOT NULL DEFAULT 'active'");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 50)->default('active')->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('active','suspended','deactivated') NOT NULL DEFAULT 'active'");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 50)->default('active')->change();
            });
        }
    }
};
