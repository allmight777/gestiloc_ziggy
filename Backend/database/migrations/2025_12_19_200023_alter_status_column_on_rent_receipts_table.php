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
        Schema::table('rent_receipts', function (Blueprint $table) {
            $table->string('status', 20)->default('issued')->change();
        });
        DB::statement('PRAGMA legacy_alter_table = OFF');
    }
    public function down(): void
    {
        DB::statement('PRAGMA legacy_alter_table = ON');
        Schema::table('rent_receipts', function (Blueprint $table) {
            $table->string('status', 10)->change();
        });
        DB::statement('PRAGMA legacy_alter_table = OFF');
    }
};
