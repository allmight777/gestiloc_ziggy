<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('rent_due_notices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('lease_id')->constrained('leases')->onDelete('cascade');
            $table->foreignId('property_id')->constrained('properties')->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('landlord_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('co_owner_id')->nullable()->constrained('co_owners')->onDelete('set null');

            $table->string('reference')->unique();
            $table->date('due_date');
            $table->decimal('rent_amount', 15, 2);
            $table->decimal('charges_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            $table->string('month_year'); // Format: YYYY-MM

            $table->string('status')->default('pending'); // pending, sent, paid, cancelled
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->text('payment_link')->nullable();
            $table->string('payment_token')->nullable()->unique();
            $table->timestamp('payment_link_expires_at')->nullable();

            $table->text('notes')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();

            // Index pour optimiser les recherches
            $table->index(['lease_id', 'month_year']);
            $table->index(['status', 'due_date']);
            $table->index('payment_token');
        });
    }

    public function down()
    {
        Schema::dropIfExists('rent_due_notices');
    }
};
