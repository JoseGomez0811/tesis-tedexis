<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\User;

class AccessDecisionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $user;      // ← CAMBIO: public en lugar de protected
    public $status;    // ← CAMBIO: public en lugar de protected

    public function __construct(User $user, string $status)
    {
        $this->user = $user;
        $this->status = $status;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $frontendUrl = config('app.frontend_url', 'https://localhost');
        
        $subject = $this->status === 'authorized'
            ? '✅ Tu solicitud ha sido aprobada'
            : '❌ Tu solicitud ha sido rechazada';

        $message = (new MailMessage)
            ->subject($subject)
            ->greeting('Hola ' . $this->user->name . ',')
            ->line(
                $this->status === 'authorized'
                    ? 'Tu solicitud de acceso ha sido aprobada. Ya puedes ingresar a la plataforma.'
                    : 'Tu solicitud de acceso ha sido rechazada. Si crees que se trata de un error, contacta a un administrador.'
            );

        if ($this->status === 'authorized') {
            $message->action('Ingresar a la plataforma', $frontendUrl);
        }

        return $message->line('Gracias por tu interés.');
    }
}