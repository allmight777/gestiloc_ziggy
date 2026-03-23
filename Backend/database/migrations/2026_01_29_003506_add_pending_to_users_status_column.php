<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->enum('status', ['active','suspended','deactivated','pending'])
                  ->default('active')
                  ->change();
        });
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE users
            MODIFY COLUMN status ENUM('active','suspended','deactivated') NOT NULL DEFAULT 'active'
        ");
    }
};
