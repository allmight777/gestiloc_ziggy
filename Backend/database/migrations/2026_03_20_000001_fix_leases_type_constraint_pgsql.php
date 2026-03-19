<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE leases DROP CONSTRAINT IF EXISTS leases_type_check");
            DB::statement("ALTER TABLE leases ADD CONSTRAINT leases_type_check CHECK (type IN ('nu', 'meuble', 'residential', 'commercial', 'professional', 'seasonal'))");
        }
    }

    public function down(): void {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE leases DROP CONSTRAINT IF EXISTS leases_type_check");
            DB::statement("ALTER TABLE leases ADD CONSTRAINT leases_type_check CHECK (type IN ('residential', 'commercial', 'professional', 'seasonal'))");
        }
    }
};
