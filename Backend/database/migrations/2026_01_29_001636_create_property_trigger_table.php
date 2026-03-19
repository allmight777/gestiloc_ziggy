<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::unprepared('DROP TRIGGER IF EXISTS property_user_ai');
            DB::unprepared('DROP TRIGGER IF EXISTS property_user_au');
            DB::unprepared('DROP TRIGGER IF EXISTS property_user_ad');

            DB::unprepared("
                CREATE TRIGGER property_user_ai AFTER INSERT ON property_user
                FOR EACH ROW BEGIN
                    INSERT INTO property_user_audit (property_id, user_id, tenant_id, lease_id, action, role, share_percentage, start_date, end_date, old_status, new_status, changes, performed_by, performed_by_role, created_at, updated_at)
                    VALUES (NEW.property_id, NEW.user_id, NEW.tenant_id, NEW.lease_id, 'assigned', NEW.role, NEW.share_percentage, NEW.start_date, NEW.end_date, NULL, NEW.status, NULL, (SELECT landlord_id FROM properties WHERE id = NEW.property_id), 'system', NOW(), NOW());
                END
            ");
        } else {
            // PostgreSQL et SQLite - skip les triggers complexes
            // Les triggers seront geres au niveau applicatif
        }
    }

    public function down(): void {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::unprepared('DROP TRIGGER IF EXISTS property_user_ai');
            DB::unprepared('DROP TRIGGER IF EXISTS property_user_au');
            DB::unprepared('DROP TRIGGER IF EXISTS property_user_ad');
        }
        Schema::dropIfExists('property_user_audit');
    }
};
