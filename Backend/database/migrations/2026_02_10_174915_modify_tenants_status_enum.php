<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE tenants MODIFY COLUMN `status` ENUM('candidate','active','inactive','archived','pending','rejected','suspended') DEFAULT 'candidate'");
        } else {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('status', 50)->default('candidate')->change();
            });
        }
    }
    public function down(): void {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('status', 50)->default('candidate')->change();
        });
    }
};
