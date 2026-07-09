<?php
// ============================================================
// api/chat.php
// GET  → vrátí posledních 50 zpráv z chatu
// POST → přidá novou zprávu
// ============================================================

require_once __DIR__ . '/config.php';

// Dynamické vytvoření tabulky, pokud neexistuje
$pdo = getDB();
$pdo->exec("
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        message VARCHAR(500) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: načíst zprávy ───────────────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT c.id, c.message, c.created_at, u.name, u.avatar_url, u.id AS user_id
        FROM chat_messages c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.created_at DESC
        LIMIT 50
    ");
    $messages = $stmt->fetchAll();
    
    // Obrátit pořadí, aby nejnovější byly dole
    $messages = array_reverse($messages);
    
    // Převod času na localized formát
    foreach ($messages as &$msg) {
        try {
            $dt = new DateTimeImmutable($msg['created_at'], new DateTimeZone('UTC'));
            $dt = $dt->setTimezone(new DateTimeZone('Europe/Prague'));
            $msg['time_formatted'] = $dt->format('H:i');
        } catch (Exception $e) {
            $msg['time_formatted'] = substr($msg['created_at'], 11, 5);
        }
        $msg['user_id'] = (int)$msg['user_id'];
    }
    unset($msg);
    
    jsonResponse(['messages' => $messages]);
}

// ── POST: poslat zprávu ──────────────────────────────────────
if ($method === 'POST') {
    $user = requireAuth();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $message = trim($body['message'] ?? '');
    
    if ($message === '') {
        jsonResponse(['error' => 'Zpráva nesmí být prázdná.'], 422);
    }
    
    if (mb_strlen($message) > 500) {
        jsonResponse(['error' => 'Zpráva může mít maximálně 500 znaků.'], 422);
    }
    
    $stmt = $pdo->prepare("INSERT INTO chat_messages (user_id, message, created_at) VALUES (?, ?, UTC_TIMESTAMP())");
    $stmt->execute([$user['id'], $message]);
    
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Metoda nepovolena.'], 405);
