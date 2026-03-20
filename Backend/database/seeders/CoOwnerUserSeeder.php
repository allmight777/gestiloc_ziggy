<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CoOwnerUserSeeder extends Seeder
{
    public function run(): void
    {
        // Insert user seulement s'il n'existe pas
        $exists = DB::table('users')->where('email', 'agoligansayajin@gmail.com')->exists();
        if (!$exists) {
            $userId = DB::table('users')->insertGetId([
                'email' => 'agoligansayajin@gmail.com',
                'password' => '$2y$12$UMOCXxAshSXA/oKgEJZksumzipO60Ot1TY0H1kmLpQ4TEtfdfvee6',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('co_owners')->insert([
                'user_id' => $userId,
                'landlord_id' => 1,
                'first_name' => 'ANGE',
                'last_name' => 'AGOLIGAN',
                'is_professional' => false,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $roleId = DB::table('roles')->where('name', 'co_owner')->value('id');
            if ($roleId) {
                DB::table('model_has_roles')->insert([
                    'role_id' => $roleId,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $userId,
                ]);
            }
        }
    }
}
