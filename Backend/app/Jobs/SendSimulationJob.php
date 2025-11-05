<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;

class SendSimulationJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    protected $simData;
    protected $url;

    public function __construct(array $simData, string $url)
    {
        $this->simData = $simData;
        $this->url = $url;
    }

    public function handle()
    {
        try {
            // Http::timeout(60)->post($this->url, $this->simData);
            $response = Http::timeout(60)
                ->retry(1, 1000, function ($exception, $request) {
                    return !($exception instanceof ConnectionException);
                })
                ->post($this->url, $this->simData);

            if (!$response->successful()) {
                return response()->json([
                    'message' => '❌ El Web Service Java respondió con error.',
                    'status' => $response->status(),
                    'body' => $response->body(),
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error("Error enviando simulación al Web Service Java: ".$e->getMessage());
        }
    }
}
