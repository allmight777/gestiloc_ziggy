<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        DB::unprepared('DROP TRIGGER IF EXISTS property_user_ai');
        DB::unprepared('DROP TRIGGER IF EXISTS property_user_au');
        DB::unprepared('DROP TRIGGER IF EXISTS property_user_ad');

        if ($driver === 'mysql') {
            DB::unprepared('
                CREATE TRIGGER property_user_ai
                AFTER INSERT ON property_user
                FOR EACH ROW
                BEGIN
                    DECLARE landlord_id_val BIGINT;
                    SELECT landlord_id INTO landlord_id_val FROM properties WHERE id = NEW.property_id;
                    INSERT INTO property_user_audit (
                        property_id, user_id, tenant_id, lease_id, action, role,
                        share_percentage, start_date, end_date, old_status, new_status,
                        changes, performed_by, performed_by_role, created_at, updated_at
                    ) VALUES (
                        NEW.property_id, NEW.user_id, NEW.tenant_id, NEW.lease_id,
                        "assigned", NEW.role, NEW.share_percentage, NEW.start_date,
                        NEW.end_date, NULL, NEW.status, NULL,
                        landlord_id_val, "system", NOW(), NOW()
                    );
                END
            ');

            DB::unprepared('
                CREATE TRIGGER property_user_au
                AFTER UPDATE ON property_user
                FOR EACH ROW
                BEGIN
                    DECLARE landlord_id_val BIGINT;
                    SELECT landlord_id INTO landlord_id_val FROM properties WHERE id = NEW.property_id;
                    INSERT INTO property_user_audit (
                        property_id, user_id, tenant_id, lease_id, action, role,
                        share_percentage, start_date, end_date, old_status, new_status,
                        changes, performed_by, performed_by_role, created_at, updated_at
                    ) VALUES (
                        NEW.property_id, NEW.user_id, NEW.tenant_id, NEW.lease_id,
                        "updated", NEW.role, NEW.share_percentage, NEW.start_date,
                        NEW.end_date, OLD.status, NEW.status,
                        JSON_OBJECT("status", JSON_OBJECT("old", OLD.status, "new", NEW.status)),
                        landlord_id_val, "system", NOW(), NOW()
                    );
                END
            ');

            DB::unprepared('
                CREATE TRIGGER property_user_ad
                AFTER DELETE ON property_user
                FOR EACH ROW
                BEGIN
                    DECLARE landlord_id_val BIGINT;
                    SELECT landlord_id INTO landlord_id_val FROM properties WHERE id = OLD.property_id;
                    INSERT INTO property_user_audit (
                        property_id, user_id, tenant_id, lease_id, action, role,
                        share_percentage, start_date, end_date, old_status, new_status,
                        changes, performed_by, performed_by_role, created_at, updated_at
                    ) VALUES (
                        OLD.property_id, OLD.user_id, OLD.tenant_id, OLD.lease_id,
                        "terminated", OLD.role, OLD.share_percentage, OLD.start_date,
                        OLD.end_date, OLD.status, NULL, NULL,
                        landlord_id_val, "system", NOW(), NOW()
                    );
                END
            ');
        } else {
            // SQLite - triggers simplifies sans DECLARE ni JSON_OBJECT ni NOW()
            DB::unprepared("
                CREATE TRIGGER property_user_ai
                AFTER INSERT ON property_user
                FOR EACH ROW
                BEGIN
                    INSERT INTO property_user_audit (
                        property_id, user_id, tenant_id, lease_id, action, role,
                        share_percentage, start_date, end_date, old_status, new_status,
                        changes, performed_by, performed_by_role, created_at, updated_at
                    ) VALUES (
                        NEW.property_id, NEW.user_id, NEW.tenant_id, NEW.lease_id,
                        'assigned', NEW.role, NEW.share_percentage, NEW.start_date,
                        NEW.end_date, NULL, NEW.status, NULL,
                        (SELECT landlord_id FROM properties WHERE id = NEW.property_id),
                        'system', datetime('now'), datetime('now')
                    );
                END
            ");

            DB::unprepared("
                CREATE TRIGGER property_user_au
                AFTER UPDATE ON property_user
                FOR EACH ROW
                BEGIN
                    INSERT INTO property_user_audit (
                        property_id, user_id, tenant_id, lease_id, action, role,
                        share_percentage, start_date, end_date, old_status, new_status,
                        changes, performed_by, performed_by_role, created_at, updated_at
                    ) VALUES (
                        NEW.property_id, NEW.user_id, NEW.tenant_id, NEW.lease_id,
                        'updated', NEW.role, NEW.share_percentage, NEW.start_date,
                        NEW.end_date, OLD.status, NEW.status, NULL,
                        (SELECT landlord_id FROM properties WHERE id = NEW.property_id),
                        'system', datetime('now'), datetime('now')
                    );
                END
            ");

            DB::unprepared("
                CREATE TRIGGER property_user_ad
                AFTER DELETE ON property_user
                FOR EACH ROW
                BEGIN
                    INSERT INTO property_user_audit (
                        property_id, user_id, tenant_id, lease_id, action, role,
                        share_percentage, start_date, end_date, old_status, new_status,
                        changes, performed_by, performed_by_role, created_at, updated_at
                    ) VALUES (
                        OLD.property_id, OLD.user_id, OLD.tenant_id, OLD.lease_id,
                        'terminated', OLD.role, OLD.share_percentage, OLD.start_date,
                        OLD.end_date, OLD.status, NULL, NULL,
                        (SELECT landlord_id FROM properties WHERE id = OLD.property_id),
                        'system', datetime('now'), datetime('now')
                    );
                END
            ");
        }
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS property_user_ai');
        DB::unprepared('DROP TRIGGER IF EXISTS property_user_au');
        DB::unprepared('DROP TRIGGER IF EXISTS property_user_ad');
        Schema::dropIfExists('property_user_audit');
    }
};
