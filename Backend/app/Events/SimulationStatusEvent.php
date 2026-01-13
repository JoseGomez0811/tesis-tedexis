<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;

class SimulationStatusEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Canal donde se emitirá el evento
     */
    public function broadcastOn(): Channel
    {
        return new Channel('simulation-status');
    }

    /**
     * Nombre del evento (explícito para frontend)
     */
    public function broadcastAs(): string
    {
        return 'simulation.status';
    }
}
