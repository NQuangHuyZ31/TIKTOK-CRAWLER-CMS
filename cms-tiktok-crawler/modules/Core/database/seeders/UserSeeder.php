<?php

namespace Modules\Core\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Core\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'System Administrator',
                'email' => 'admin@cms.com',
                'password' => Hash::make('password'),
                'phone' => '0901234567',
                'status' => 'active',
                'role' => 'admin',
            ],
            [
                'name' => 'Operations Manager',
                'email' => 'manager@cms.com',
                'password' => Hash::make('password'),
                'phone' => '0902345678',
                'status' => 'active',
                'role' => 'manager',
            ],
            [
                'name' => 'Crawler Specialist',
                'email' => 'editor@cms.com',
                'password' => Hash::make('password'),
                'phone' => '0903456789',
                'status' => 'active',
                'role' => 'editor',
            ],
            [
                'name' => 'Guest Auditor',
                'email' => 'viewer@cms.com',
                'password' => Hash::make('password'),
                'phone' => '0904567890',
                'status' => 'active',
                'role' => 'viewer',
            ],
        ];

        foreach ($users as $userData) {
            $roleSlug = $userData['role'];
            unset($userData['role']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            $role = Role::where('slug', $roleSlug)->first();
            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
        }
    }
}
