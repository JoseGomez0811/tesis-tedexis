<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\DatabaseConnection;
use Illuminate\Http\Client\RequestException;

class CollectionsDBController extends Controller
{
    private $mongoBridgeBaseUrl;

    public function __construct()
    {
        $this->mongoBridgeBaseUrl = env('MONGO_BRIDGE_URL', 'http://tedexis_mongo_bridge:8081');
    }

    /**
     * 🔹 Obtener todas las colecciones de una base de datos Mongo específica.
     */
    public function getCollections($id)
    {
        try {
            Log::info("📡 [MongoBridge] Iniciando solicitud de colecciones para la DB ID={$id}");

            $dbConnection = DatabaseConnection::findOrFail($id);

            $query = http_build_query([
                'host' => $dbConnection->host,
                'port' => $dbConnection->port,
                'user' => $dbConnection->user,
                'pass' => $dbConnection->password,
                'auth_db' => $dbConnection->auth_db,
                'name_db' => $dbConnection->name_db,
            ]);

            $url = "{$this->mongoBridgeBaseUrl}/collections?$query";
            Log::info("➡️ Enviando solicitud a MongoBridge: {$url}");

            $response = Http::timeout(15)->get($url);
            $response->throw();

            Log::info("✅ [MongoBridge] Respuesta exitosa (status {$response->status()})");

            $data = $response->json();
            $collectionsCount = is_array($data) && isset($data['collections']) && is_array($data['collections'])
                ? count($data['collections'])
                : 0;
            $keys = is_array($data) ? implode(',', array_keys($data)) : 'no-array';
            Log::info("📦 [MongoBridge] Cuerpo recibido (keys={$keys}, collections={$collectionsCount})");

            return response()->json($data, $response->status());

        } catch (RequestException $e) {
            $this->logHttpError($e, 'getCollections');
            return response()->json([
                'error' => 'Error al comunicarse con MongoBridge',
                'details' => $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            Log::error("🔥 [MongoBridge] Error inesperado en getCollections: " . $e->getMessage());
            return response()->json([
                'error' => 'Error interno al obtener colecciones',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔹 Obtener los primeros documentos de una colección específica.
     */
    public function getCollectionData($id, $collection)
    {
        try {
            Log::info("📄 [MongoBridge] Solicitando documentos de la colección '{$collection}' (DB ID={$id})");

            $dbConnection = DatabaseConnection::findOrFail($id);

            $query = http_build_query([
                'host' => $dbConnection->host,
                'port' => $dbConnection->port,
                'user' => $dbConnection->user,
                'pass' => $dbConnection->password,
                'auth_db' => $dbConnection->auth_db,
                'name_db' => $dbConnection->name_db,
            ]);

            $url = "{$this->mongoBridgeBaseUrl}/collection/{$collection}?$query";
            Log::info("➡️ Enviando solicitud a MongoBridge: {$url}");

            $response = Http::timeout(20)->get($url);
            $response->throw();

            Log::info("✅ [MongoBridge] Documentos recibidos correctamente ({$response->status()})");

            $data = $response->json();
            $count = is_array($data)
                ? ($data['count'] ?? (is_array($data['data'] ?? null) ? count($data['data']) : null))
                : null;
            $keys = is_array($data) ? implode(',', array_keys($data)) : 'no-array';
            Log::info("📦 [MongoBridge] Cuerpo recibido (keys={$keys}, count=" . ($count === null ? 'null' : $count) . ")");

            return response()->json($data, $response->status());

        } catch (RequestException $e) {
            $this->logHttpError($e, 'getCollectionData');
            return response()->json([
                'error' => 'Error al comunicarse con MongoBridge',
                'details' => $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            Log::error("🔥 [MongoBridge] Error inesperado en getCollectionData: " . $e->getMessage());
            return response()->json([
                'error' => 'Error interno al obtener documentos',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔹 Obtener un documento específico por su ID.
     */
    public function getDocument($id, $collection, $docId)
    {
        try {
            Log::info("🔍 [MongoBridge] Solicitando documento '{$docId}' en colección '{$collection}' (DB ID={$id})");

            $dbConnection = DatabaseConnection::findOrFail($id);

            $query = http_build_query([
                'host' => $dbConnection->host,
                'port' => $dbConnection->port,
                'user' => $dbConnection->user,
                'pass' => $dbConnection->password,
                'auth_db' => $dbConnection->auth_db,
                'name_db' => $dbConnection->name_db,
            ]);

            $url = "{$this->mongoBridgeBaseUrl}/collection/{$collection}/{$docId}?$query";
            Log::info("➡️ Enviando solicitud a MongoBridge: {$url}");

            $response = Http::timeout(15)->get($url);
            $response->throw();

            Log::info("✅ [MongoBridge] Documento recibido correctamente ({$response->status()})");

            $data = $response->json();
            $hasDoc = is_array($data) && array_key_exists('document', $data);
            $docKeys = $hasDoc && is_array($data['document']) ? implode(',', array_keys($data['document'])) : 'n/a';
            Log::info("📦 [MongoBridge] Cuerpo recibido (hasDocument=" . ($hasDoc ? 'yes' : 'no') . ", docKeys={$docKeys})");

            return response()->json($data, $response->status());

        } catch (RequestException $e) {
            $this->logHttpError($e, 'getDocument');
            return response()->json([
                'error' => 'Error al comunicarse con MongoBridge',
                'details' => $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            Log::error("🔥 [MongoBridge] Error inesperado en getDocument: " . $e->getMessage());
            return response()->json([
                'error' => 'Error interno al obtener documento',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🧩 Función auxiliar para registrar errores HTTP sin causar exceptions
     */
    private function logHttpError(RequestException $e, string $context)
    {
        $status = optional($e->response)->status() ?? 'sin status';
        $url = optional($e->response)->effectiveUri() ?? 'URL no disponible';
        $body = optional($e->response)->body() ?? 'sin cuerpo';

        Log::error("❌ [MongoBridge][$context] HTTP Error:
            • Código: {$status}
            • URL: {$url}
            • Mensaje: {$e->getMessage()}
            • Cuerpo: {$body}");
    }
}
