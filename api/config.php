<?php
// ============================================================
// api/config.php — Databázové připojení
// Vyplň hodnoty ze svého hostingového panelu (cPanel / Plesk)
// ============================================================

define('DB_HOST', 'localhost');      // většinou localhost
define('DB_NAME', 'tip_42186');   // název databáze
define('DB_USER', 'tip.42186');   // uživatel databáze
define('DB_PASS', 'z:aGy!E29wa8BH5w');   // heslo databáze
define('DB_CHARSET', 'utf8mb4');

// Session secret – změň na libovolný náhodný řetězec
define('SESSION_NAME', 'wc2026_session');

// Uzávěrka tipování: počet minut před výkopem
define('TIP_DEADLINE_MINUTES', 30);

// ============================================================

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function getAllowedOrigin(): string {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
        $originHost = parse_url($origin, PHP_URL_HOST);
        $serverHost = $_SERVER['HTTP_HOST'] ?? '';
        
        if ($originHost === $serverHost || 
            $originHost === 'localhost' || 
            $originHost === '127.0.0.1' || 
            $originHost === '0.0.0.0' || 
            (is_string($originHost) && preg_match('/\.local$/i', $originHost))) {
            return $origin;
        }
    }
    return '';
}

function startSessionSecurely(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_name(SESSION_NAME);
        $cookieParams = [
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => (isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] === 'on' || $_SERVER['HTTPS'] === 1)) || 
                        (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https'),
            'httponly' => true,
            'samesite' => 'Lax'
        ];
        session_set_cookie_params($cookieParams);
        session_start();
    }
}

function jsonResponse(mixed $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    
    // Prevent browser and proxy caching of API responses
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
    
    $allowedOrigin = getAllowedOrigin();
    if ($allowedOrigin !== '') {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if (is_array($data)) {
        $data['version'] = '1.2';
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function currentUser(): ?array {
    startSessionSecurely();
    return $_SESSION['user'] ?? null;
}

function requireAuth(): array {
    $user = currentUser();
    if (!$user) {
        jsonResponse(['error' => 'Nejste přihlášen.'], 401);
    }
    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    $pdo = getDB();
    $stmt = $pdo->prepare('SELECT is_admin FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $isAdmin = $stmt->fetchColumn();
    if (!$isAdmin) {
        jsonResponse(['error' => 'Nemáte oprávnění admina.'], 403);
    }
    return $user;
}

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $allowedOrigin = getAllowedOrigin();
    if ($allowedOrigin !== '') {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

// CSRF check for POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $allowed = false;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($origin !== '') {
        $originHost = parse_url($origin, PHP_URL_HOST);
        $serverHost = $_SERVER['HTTP_HOST'] ?? '';
        if ($originHost === $serverHost || 
            $originHost === 'localhost' || 
            $originHost === '127.0.0.1' || 
            $originHost === '0.0.0.0' || 
            (is_string($originHost) && preg_match('/\.local$/i', $originHost))) {
            $allowed = true;
        }
    } else {
        $allowed = true;
    }
    if (!$allowed) {
        jsonResponse(['error' => 'Nedovolený původ požadavku (CORS/CSRF).'], 403);
    }
}

