<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('leases', function (Blueprint $table) {
            $table->json('landlord_signature')->nullable()->after('terms');
            $table->json('tenant_signature')->nullable()->after('landlord_signature');
            $table->string('signed_document')->nullable()->after('tenant_signature');
            $table->timestamp('signed_at')->nullable()->after('signed_document');
        });
    }

    public function down()
    {
        Schema::table('leases', function (Blueprint $table) {
            $table->dropColumn(['landlord_signature', 'tenant_signature', 'signed_document', 'signed_at']);
        });
    }
};
