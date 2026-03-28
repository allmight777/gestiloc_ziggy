<?php
// database/migrations/2024_01_01_000000_create_payment_methods_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Type de retrait
            $table->enum('type', ['mobile_money', 'card', 'bank_transfer', 'cash'])->default('mobile_money');

            // Informations générales
            $table->string('beneficiary_name');
            $table->string('country', 2)->default('BJ');
            $table->string('currency', 3)->default('XOF');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            // Mobile Money
            $table->string('mobile_operator')->nullable(); // MTN, MOOV, CELTIS
            $table->string('mobile_number')->nullable();

            // Carte (token uniquement, jamais de numéro)
            $table->string('card_token')->nullable();
            $table->string('card_last4')->nullable();
            $table->string('card_brand')->nullable(); // Visa, Mastercard

            // Virement bancaire
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_iban')->nullable();
            $table->string('bank_swift')->nullable();

            // Métadonnées
            $table->json('metadata')->nullable();
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->index(['user_id', 'is_default']);
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('payment_methods');
    }
};
