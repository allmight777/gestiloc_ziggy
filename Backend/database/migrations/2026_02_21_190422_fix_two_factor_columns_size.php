<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('PRAGMA legacy_alter_table = ON');
        Schema::table('users', function (Blueprint $table) {
            $table->text('two_factor_secret')->nullable()->change();
            $table->text('two_factor_recovery_codes')->nullable()->change();
        });
        DB::statement('PRAGMA legacy_alter_table = OFF');
    }
    public function down(): void
    {
        DB::statement('PRAGMA legacy_alter_table = ON');
        Schema::table('users', function (Blueprint $table) {
            $table->string('two_factor_secret')->nullable()->change();
            $table->text('two_factor_recovery_codes')->nullable()->change();
        });
        DB::statement('PRAGMA legacy_alter_table = OFF');
    }
};
