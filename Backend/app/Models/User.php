<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'authorization_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Scopes para filtrar usuarios por estado de autorización
    public function scopePending($query)
    {
        return $query->where('authorization_status', 'pending');
    }

    public function scopeAuthorized($query)
    {
        return $query->where('authorization_status', 'authorized');
    }

    public function scopeRejected($query)
    {
        return $query->where('authorization_status', 'rejected');
    }

    // Métodos helper
    public function isPending(): bool
    {
        return $this->authorization_status === 'pending';
    }

    public function isAuthorized(): bool
    {
        return $this->authorization_status === 'authorized';
    }

    public function isRejected(): bool
    {
        return $this->authorization_status === 'rejected';
    }

    public function authorize(): void
    {
        $this->update(['authorization_status' => 'authorized']);
    }

    public function reject(): void
    {
        $this->update(['authorization_status' => 'rejected']);
    }
}