<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_condition_reports', function (Blueprint $table) {
            // Renommer les existantes pour clarifier que c'est côté propriétaire
            $table->renameColumn('signature_data', 'landlord_signature_data');
            $table->renameColumn('signed_by',      'landlord_signed_by');
            $table->renameColumn('signed_at',      'landlord_signed_at');

            // Nouvelles colonnes pour la signature locataire
            $table->json('tenant_signature_data')->nullable()->after('landlord_signed_at');
            $table->unsignedBigInteger('tenant_signed_by')->nullable()->after('tenant_signature_data');
            $table->timestamp('tenant_signed_at')->nullable()->after('tenant_signed_by');

            // Statut global de l'EDL
            $table->string('status')->default('draft')->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('property_condition_reports', function (Blueprint $table) {
            $table->renameColumn('landlord_signature_data', 'signature_data');
            $table->renameColumn('landlord_signed_by',      'signed_by');
            $table->renameColumn('landlord_signed_at',      'signed_at');

            $table->dropColumn([
                'tenant_signature_data',
                'tenant_signed_by',
                'tenant_signed_at',
                'status',
            ]);
        });
    }
};
