<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CoOwnerUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'agoligansayajin@gmail.com';
        
        if (!DB::table('users')->where('email', $email)->exists()) {
            $userId = DB::table('users')->insertGetId([
                'email' => $email,
                'password' => '$2y$12$UMOCXxAshSXA/oKgEJZksumzipO60Ot1TY0H1kmLpQ4TEtfdfvee6',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $landlordId = DB::table('landlords')->first()?->id ?? 1;

            DB::table('co_owners')->insert([
                'user_id' => $userId,
                'landlord_id' => $landlordId,
                'first_name' => 'ANGE',
                'last_name' => 'AGOLIGAN',
                'is_professional' => false,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $roleId = DB::table('roles')->where('name', 'co_owner')->value('id');
            if ($roleId) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $roleId,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $userId,
                ]);
            }

            $this->command->info('CoOwner user created: ' . $email);
        } else {
            $this->command->info('CoOwner user already exists: ' . $email);
        }
    }
}
