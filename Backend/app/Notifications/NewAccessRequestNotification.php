<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\User;

class NewAccessRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $newUser;  // ← CAMBIO: public en lugar de protected

    public function __construct(User $newUser)
    {
        $this->newUser = $newUser;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $frontendUrl = config('app.frontend_url', 'https://localhost');
        
        return (new MailMessage)
            ->subject('🆕 Nueva solicitud de acceso a la plataforma')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line('Se ha recibido una nueva solicitud de acceso a la plataforma.')
            ->line('👤 Nombre: ' . $this->newUser->name)
            ->line('📧 Correo: ' . $this->newUser->email)
            ->action('Revisar solicitudes', $frontendUrl . '/app/permisos')
            ->line('Por favor revisa la sección de permisos para aprobar o rechazar el acceso.');
    }
}