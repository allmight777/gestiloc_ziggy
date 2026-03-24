<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RentDueNotice extends Model
{
    protected $fillable = [
        'uuid',
        'lease_id',
        'property_id',
        'tenant_id',
        'landlord_id',
        'co_owner_id',
        'reference',
        'due_date',
        'rent_amount',
        'charges_amount',
        'total_amount',
        'month_year',
        'status',
        'sent_at',
        'paid_at',
        'payment_link',
        'payment_token',
        'payment_link_expires_at',
        'notes',
        'meta',
    ];

    protected $casts = [
        'due_date' => 'date',
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
        'payment_link_expires_at' => 'datetime',
        'meta' => 'array',
        'rent_amount' => 'decimal:2',
        'charges_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->reference)) {
                $model->reference = 'AVIS-' . date('Y') . '-' . str_pad(($model->id ?? 0) + 1, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function landlord(): BelongsTo
    {
        return $this->belongsTo(User::class, 'landlord_id');
    }

    public function coOwner(): BelongsTo
    {
        return $this->belongsTo(CoOwner::class);
    }

    public function markAsSent(): void
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function markAsPaid(): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }

    public function generatePaymentLink(): string
    {
        $token = Str::random(64);
        $expiresAt = now()->addDays(15);

        $this->update([
            'payment_token' => $token,
            'payment_link_expires_at' => $expiresAt,
            'payment_link' => config('app.frontend_url') . "/pay/" . $token,
        ]);

        return $this->payment_link;
    }
}
