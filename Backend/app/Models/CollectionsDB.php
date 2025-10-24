<?php

namespace App\Models;

use Illuminate\Support\Facades\Log;
use MongoDB\Client;
use MongoDB\Exception\Exception; // Importar la clase de excepción de Mongo
use MongoDB\BSON\ObjectId;

class CollectionsDB
{
    /**
     * Establece la conexión con MongoDB y selecciona la base de datos.
     * @param array|object $connection Configuración de la conexión.
     * @return \MongoDB\Database
     */
    public function connect($connection)
    {

        // 🔍 DEBUG DETALLADO
        Log::error("MONGO_DEBUG: Configuración completa recibida:", (array)$connection);
        Log::error("MONGO_DEBUG: Host: " . ($connection['host'] ?? $connection->host ?? 'NO DEFINIDO'));
        Log::error("MONGO_DEBUG: ENV MONGO_HOST: " . env('MONGO_HOST', 'NO DEFINIDO'));

        $host     = $connection['host'] ?? $connection->host;
        $port     = $connection['port'] ?? $connection->port;
        $user     = $connection['user'] ?? $connection->user;
        $password = $connection['password'] ?? null;
        $authDb   = $connection['auth_db'] ?? $connection->auth_db;
        $dbName   = $connection['name_db'] ?? $connection->name_db;

        $uri = "mongodb://{$user}:{$password}@{$host}:{$port}/?authSource={$authDb}";
        // $uri = "mongodb+srv://{$user}:{$password}@{$host}";
        Log::error("MONGO_DEBUG: URI de conexión utilizada: " . $uri);
            // 🤝 Conexión a Mongo
        $client = new Client($uri);

        try {
            $client->selectDatabase('admin')->command(['ping' => 1]);
        } catch (\Exception $e) {
             throw new \Exception("Error al conectar al host ($host:$port): " . $e->getMessage());
        }


        return $client->selectDatabase($dbName);
    }

// ---

    /**
     * Obtiene una lista de todas las colecciones en la base de datos.
     * @param array|object $connection Configuración de la conexión.
     * @return array
     */
    public function getCollections($connection)
    {
        try {
            $db = $this->connect($connection);

            $collections = [];
            foreach ($db->listCollections() as $collection) {
                $collections[] = $collection->getName();
                Log::info("Colección encontrada: " . $collection->getName());
            }

            return $collections;

        } catch (\Exception $e) {
            // --- 🚨 REGISTRO MEJORADO (Añadido) ---
            // Registra el error en el log de Laravel para facilitar la depuración.
            Log::error("Error al obtener collections. Mensaje: " . $e->getMessage());
            error_log("Error al obtener collections: " . $e->getMessage());
            // ------------------------------------
            return [];
        }
    }

// ---

    public function getCollectionData($connection, $collectionName)
    {
        $db = $this->connect($connection);
        return $db->selectCollection($collectionName)->find()->toArray();
    }

// ---

    // public function getDocument($connection, $collectionName, $documentId)
    // {
    //     $db = $this->connect($connection);

    //     // ⚠️ sin usar ObjectId, lo tratamos como string
    //     return $db->selectCollection($collectionName)->findOne(['_id' => $documentId]);
    // }

    // public function getDocument($connection, $collectionName, $documentId)
    // {
    //     $db = $this->connect($connection);
        
    //     try {
    //         // 🎯 CLAVE: Convertir la cadena $documentId al tipo ObjectId de MongoDB
    //         $objectId = new ObjectId($documentId);
    //     } catch (\InvalidArgumentException $e) {
    //         // Esto podría ocurrir si $documentId no es una cadena hexadecimal válida de 24 caracteres.
    //         // Manejar el error o devolver null si el ID es inválido.
    //         error_log("ID de documento inválido: " . $documentId);
    //         return null; 
    //     }

    //     // Usar el objeto ObjectId para la consulta
    //     return $db->selectCollection($collectionName)->findOne(['_id' => $objectId]);
    // }

    public function getDocument($connection, $collectionName, $documentId)
    {
        $db = $this->connect($connection);
        
        // La conversión es necesaria para que la búsqueda funcione en MongoDB:
        $objectId = new ObjectId($documentId);
        
        return $db->selectCollection($collectionName)->findOne(['_id' => $objectId]);
    }
}