<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class PropertyConditionReport extends Model
{
    protected $fillable = [
        'property_id',
        'lease_id',
        'created_by',
        'type',
        'report_date',
        'notes',
        'status',

        // Signature propriétaire
        'landlord_signature_data',
        'landlord_signed_by',
        'landlord_signed_at',

        // Signature locataire
        'tenant_signature_data',
        'tenant_signed_by',
        'tenant_signed_at',
    ];

    protected $casts = [
        'report_date'             => 'date',
        'landlord_signed_at'      => 'datetime',
        'landlord_signature_data' => 'array',
        'tenant_signed_at'        => 'datetime',
        'tenant_signature_data'   => 'array',
    ];

    // ──────────────────────────────────────────
    // Relations
    // ──────────────────────────────────────────

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(PropertyConditionPhoto::class, 'report_id');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeEntry(Builder $query): Builder
    {
        return $query->where('type', 'entry');
    }

    public function scopeExit(Builder $query): Builder
    {
        return $query->where('type', 'exit');
    }

    public function scopeForLease(Builder $query, $leaseId): Builder
    {
        return $query->where('lease_id', $leaseId);
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    /**
     * EDL totalement validé = les 2 parties ont signé
     */
    public function isSigned(): bool
    {
        return $this->landlord_signed_at !== null && $this->tenant_signed_at !== null;
    }

    public function isTenantSigned(): bool
    {
        return $this->tenant_signed_at !== null;
    }

    public function isLandlordSigned(): bool
    {
        return $this->landlord_signed_at !== null;
    }

    /**
     * Signature propriétaire — passe à 'signed' si le locataire a déjà signé
     */
    public function signAsLandlord(array $signatureData, int $userId): bool
    {
        $this->landlord_signature_data = $signatureData;
        $this->landlord_signed_by      = $userId;
        $this->landlord_signed_at      = now();
        $this->status = $this->isTenantSigned() ? 'signed' : 'pending_tenant';
        return $this->save();
    }

    /**
     * Signature locataire — passe à 'signed' si le propriétaire a déjà signé
     */
    public function signAsTenant(array $signatureData, int $userId): bool
    {
        $this->tenant_signature_data = $signatureData;
        $this->tenant_signed_by      = $userId;
        $this->tenant_signed_at      = now();
        $this->status = $this->isLandlordSigned() ? 'signed' : 'pending_landlord';
        return $this->save();
    }

    /**
     * Compatibilité rétro avec l'ancien sign()
     */
    public function sign(string $signatureData, string $signedBy): bool
    {
        return $this->signAsLandlord(['raw' => $signatureData], (int) $signedBy);
    }
}
