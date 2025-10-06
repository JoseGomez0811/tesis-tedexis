<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CollectionsDB;
use App\Models\DatabaseConnection;

class CollectionsDBController extends Controller
{
    protected $db;

    public function __construct(CollectionsDB $db)
    {
        $this->db = $db;
    }

    public function getCollections($connectionId)
    {
        $connection = DatabaseConnection::findOrFail($connectionId);
        return response()->json($this->db->getCollections($connection));
    }

    public function getCollectionData($connectionId, $collectionName)
    {
        $connection = DatabaseConnection::findOrFail($connectionId);
        return response()->json($this->db->getCollectionData($connection, $collectionName));
    }

    public function getDocument($connectionId, $collectionName, $documentId)
    {
        $connection = DatabaseConnection::findOrFail($connectionId);
        $doc = $this->db->getDocument($connection, $collectionName, $documentId);

        if (!$doc) {
            return response()->json(['error' => 'Documento no encontrado'], 404);
        }

        return response()->json($doc);
    }
}
