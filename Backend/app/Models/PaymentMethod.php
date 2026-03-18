<?php
// app/Models/PaymentMethod.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentMethod extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'beneficiary_name',
        'country',
        'currency',
        'is_default',
        'is_active',
        'mobile_operator',
        'mobile_number',
        'card_token',
        'card_last4',
        'card_brand',
        'bank_name',
        'bank_account_number',
        'bank_iban',
        'bank_swift',
        'metadata',
        'verified_at',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'verified_at' => 'datetime',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Accesseurs
    public function getDisplayNameAttribute()
    {
        return match($this->type) {
            'mobile_money' => $this->mobile_operator . ' - ' . $this->maskNumber($this->mobile_number),
            'card' => $this->card_brand . ' **** ' . $this->card_last4,
            'bank_transfer' => $this->bank_name . ' - ' . $this->maskNumber($this->bank_account_number),
            'cash' => 'Espèces',
            default => 'Méthode de paiement',
        };
    }

    public function getIconAttribute()
    {
        return match($this->type) {
            'mobile_money' => 'fas fa-mobile-alt',
            'card' => 'fas fa-credit-card',
            'bank_transfer' => 'fas fa-university',
            'cash' => 'fas fa-money-bill-wave',
            default => 'fas fa-wallet',
        };
    }

    public function getColorAttribute()
    {
        return match($this->type) {
            'mobile_money' => '#70AE48', // Vert
            'card' => '#FF9800', // Orange
            'bank_transfer' => '#2196F3', // Bleu
            'cash' => '#4CAF50', // Vert clair
            default => '#9E9E9E', // Gris
        };
    }

    public function getTypeLabelAttribute()
    {
        return match($this->type) {
            'mobile_money' => 'Mobile Money',
            'card' => 'Carte bancaire',
            'bank_transfer' => 'Virement bancaire',
            'cash' => 'Espèces',
            default => 'Autre',
        };
    }

    // Méthodes
    private function maskNumber($number)
    {
        if (!$number) return '';
        if (strlen($number) <= 4) return $number;

        $visible = substr($number, -4);
        $masked = str_repeat('*', strlen($number) - 4);

        return $masked . $visible;
    }

    public function markAsVerified()
    {
        $this->update([
            'verified_at' => now(),
            'is_active' => true,
        ]);
    }

    public function setAsDefault()
    {
        // Retirer le statut par défaut des autres méthodes
        self::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }

    
}
