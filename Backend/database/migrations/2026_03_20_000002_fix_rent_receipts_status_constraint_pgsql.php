<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE rent_receipts DROP CONSTRAINT IF EXISTS rent_receipts_status_check");
            DB::statement("ALTER TABLE rent_receipts ADD CONSTRAINT rent_receipts_status_check CHECK (status IN ('issued', 'draft', 'cancelled', 'paid'))");
        }
    }

    public function down(): void {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE rent_receipts DROP CONSTRAINT IF EXISTS rent_receipts_status_check");
        }
    }
};
