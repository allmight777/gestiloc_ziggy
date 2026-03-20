<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TenantUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'agoligan@gmail.com';
        $password = '$2y$12$UMOCXxAshSXA/oKgEJZksumzipO60Ot1TY0H1kmLpQ4TEtfdfvee6';

        if (!DB::table('users')->where('email', $email)->exists()) {
            $userId = DB::table('users')->insertGetId([
                'email'      => $email,
                'password'   => $password,
                'status'     => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $coOwnerId = DB::table('co_owners')->where('user_id', 2)->value('id') ?? 1;
            $landlordId = DB::table('co_owners')->where('user_id', 2)->value('landlord_id') ?? 1;

            $tenantId = DB::table('tenants')->insertGetId([
                'user_id'    => $userId,
                'first_name' => 'ANGE',
                'last_name'  => 'AGOLIGAN',
                'status'     => 'active',
                'meta'       => json_encode([
                    'landlord_id'    => $landlordId,
                    'co_owner_id'    => $coOwnerId,
                    'invitation_email' => $email,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $roleId = DB::table('roles')->where('name', 'tenant')->value('id');
            if ($roleId) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id'    => $roleId,
                    'model_type' => 'App\\Models\\User',
                    'model_id'   => $userId,
                ]);
            }

            $this->command->info('Tenant user created: ' . $email);
        } else {
            $this->command->info('Tenant user already exists: ' . $email);
        }
    }
}
