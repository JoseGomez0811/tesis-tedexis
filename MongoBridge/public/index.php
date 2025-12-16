<?php
// ================================================
// MongoBridge - Compatible con MongoDB 3.4.1
// ================================================

require_once __DIR__ . '/../vendor/autoload.php';

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

header('Content-Type: application/json');

// --- CONFIGURAR LOG ---
$logPath = '/var/www/storage/logs/mongo_bridge.log';
if (!file_exists(dirname($logPath))) {
    mkdir(dirname($logPath), 0777, true);
}
$log = new Logger('MongoBridge');
$log->pushHandler(new StreamHandler($logPath, Logger::DEBUG));

// --- VALIDAR PARÁMETROS ---
$required = ['host', 'port', 'user', 'pass', 'auth_db', 'name_db'];
foreach ($required as $p) {
    if (empty($_GET[$p])) {
        http_response_code(400);
        echo json_encode(['error' => "Falta el parámetro '$p'"]);
        exit;
    }
}

$host = $_GET['host'];
$port = $_GET['port'];
$user = $_GET['user'];
$pass = $_GET['pass'];
$auth_db = $_GET['auth_db'];
$name_db = $_GET['name_db'];

// Construir URI con authSource
$uri = "mongodb://{$user}:{$pass}@{$host}:{$port}/?authSource={$auth_db}";
$log->info("Intentando conectar a {$uri}");

try {
    // Usar el driver de bajo nivel (ext-mongodb) a través de MongoDB\Driver\Manager
    $manager = new MongoDB\Driver\Manager($uri);
    // Probar conexión con ping
    $cmd = new MongoDB\Driver\Command(['ping' => 1]);
    $manager->executeCommand('admin', $cmd);
    $log->info("✅ Conectado correctamente a MongoDB");
} catch (Exception $e) {
    $log->error("❌ Error de conexión: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error al conectar a MongoDB', 'details' => $e->getMessage()]);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

try {
    // GET /collections → lista las colecciones
    if ($segments[0] === 'collections') {
        $collections = [];
        $command = new MongoDB\Driver\Command(['listCollections' => 1]);
        $cursor = $manager->executeCommand($name_db, $command);
        foreach ($cursor as $col) {
            if (is_object($col) && isset($col->name)) {
                $collections[] = $col->name;
            } elseif (is_array($col) && isset($col['name'])) {
                $collections[] = $col['name'];
            }
        }
        echo json_encode(['collections' => $collections]);
        exit;
    }

    // GET /collection/<nombre> → muestra documentos
    if ($segments[0] === 'collection' && isset($segments[1]) && !isset($segments[2])) {
        $collectionName = $segments[1];
        
        // Obtener el conteo total de documentos en la colección
        $countCommand = new MongoDB\Driver\Command(['count' => $collectionName]);
        $countResult = $manager->executeCommand($name_db, $countCommand);
        $totalCount = 0;
        foreach ($countResult as $result) {
            $totalCount = $result->n;
            break;
        }
        
        // Verificar si se solicita una muestra aleatoria (para reuso) o un límite específico
        $sampleSize = isset($_GET['sample']) ? (int)$_GET['sample'] : 0;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        
        $data = [];
        
        if ($sampleSize > 0) {
            // Usar $sample de MongoDB para obtener documentos aleatorios (más eficiente)
            $pipeline = [
                ['$sample' => ['size' => min($sampleSize, $totalCount)]]
            ];
            $command = new MongoDB\Driver\Command([
                'aggregate' => $collectionName,
                'pipeline' => $pipeline,
                'cursor' => new stdClass()
            ]);
            $cursor = $manager->executeCommand($name_db, $command);
            foreach ($cursor as $d) {
                $data[] = json_decode(json_encode($d), true);
            }
        } else {
            // Obtener documentos normales con límite
            $query = new MongoDB\Driver\Query([], ['limit' => $limit]);
            $cursor = $manager->executeQuery("{$name_db}.{$collectionName}", $query);
            foreach ($cursor as $d) {
                $data[] = json_decode(json_encode($d), true);
            }
        }
        
        echo json_encode([
            'count' => count($data), 
            'totalCount' => $totalCount,
            'data' => $data
        ]);
        exit;
    }

    // GET /collection/<nombre>/<id> → muestra un documento
    if ($segments[0] === 'collection' && isset($segments[1]) && isset($segments[2])) {
        $collectionName = $segments[1];
        $id = $segments[2];
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de documento inválido']);
            exit;
        }
        $query = new MongoDB\Driver\Query(['_id' => $objectId]);
        $cursor = $manager->executeQuery("{$name_db}.{$collectionName}", $query);
        $document = current($cursor->toArray());
        if ($document) {
            echo json_encode($document);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Documento no encontrado']);
        }
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Ruta no válida']);
    exit;

} catch (Exception $e) {
    $log->error("❌ Error interno: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno', 'details' => $e->getMessage()]);
}
