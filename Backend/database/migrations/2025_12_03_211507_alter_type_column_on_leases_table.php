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
            DB::statement("ALTER TABLE leases MODIFY COLUMN type ENUM('nu', 'meuble') NOT NULL DEFAULT 'nu'");
        } else {
            Schema::table('leases', function (Blueprint $table) {
                $table->string('type', 50)->default('nu')->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE leases MODIFY COLUMN type VARCHAR(50) NOT NULL");
        } else {
            Schema::table('leases', function (Blueprint $table) {
                $table->string('type', 50)->nullable()->change();
            });
        }
    }
};
