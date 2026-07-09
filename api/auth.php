<?php
// ============================================================
// api/auth.php
// GET  ?action=me       → vrátí přihlášeného uživatele
// POST ?action=register → registrace
// POST ?action=login    → přihlášení
// POST ?action=logout   → odhlášení
// ============================================================

require_once __DIR__ . '/config.php';

startSessionSecurely();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ── GET /me ──────────────────────────────────────────────────
if ($action === 'me') {
    $user = currentUser();
    if (!$user) {
        jsonResponse(['user' => null]);
    }
    // Refresh user data from DB (points may have changed)
    $pdo = getDB();
    $stmt = $pdo->prepare('SELECT id, name, email, avatar_url, is_admin FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $fresh = $stmt->fetch();
    if (!$fresh) {
        session_destroy();
        jsonResponse(['user' => null]);
    }
    jsonResponse(['user' => $fresh]);
}

// ── POST /register ───────────────────────────────────────────
if ($method === 'POST' && $action === 'register') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $name  = trim($body['name']  ?? '');
    $name  = strip_tags($name);
    $email = trim($body['email'] ?? '');
    $pass  = $body['password']   ?? '';

    if (mb_strlen($name) < 2)  jsonResponse(['error' => 'Jméno musí mít alespoň 2 znaky.'], 422);
    if (mb_strlen($name) > 50) jsonResponse(['error' => 'Jméno může mít maximálně 50 znaků.'], 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Neplatný e-mail.'], 422);
    if (strlen($pass) < 6)  jsonResponse(['error' => 'Heslo musí mít alespoň 6 znaků.'], 422);

    $pdo = getDB();
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        jsonResponse(['error' => 'Tento e-mail je již registrován.'], 409);
    }

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    $ins  = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    $ins->execute([$name, $email, $hash]);
    $userId = (int)$pdo->lastInsertId();

    $_SESSION['user'] = ['id' => $userId, 'name' => $name, 'email' => $email,
                         'avatar_url' => null, 'is_admin' => 0];
    jsonResponse(['user' => $_SESSION['user']]);
}

// ── POST /login ──────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = trim($body['email'] ?? '');
    $pass  = $body['password']   ?? '';

    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, name, email, password_hash, avatar_url, is_admin FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password_hash'])) {
        jsonResponse(['error' => 'Špatný e-mail nebo heslo.'], 401);
    }

    unset($user['password_hash']);
    $_SESSION['user'] = $user;
    jsonResponse(['user' => $user]);
}

// ── POST /logout ─────────────────────────────────────────────
if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    jsonResponse(['ok' => true]);
}

// ── POST /update_profile ─────────────────────────────────────
if ($method === 'POST' && $action === 'update_profile') {
    $user = requireAuth();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $name  = trim($body['name']  ?? '');
    $name  = strip_tags($name);
    $avatarUrl = trim($body['avatar_url'] ?? '');

    if (mb_strlen($name) < 2) {
        jsonResponse(['error' => 'Jméno musí mít alespoň 2 znaky.'], 422);
    }
    if (mb_strlen($name) > 50) {
        jsonResponse(['error' => 'Jméno může mít maximálně 50 znaků.'], 422);
    }
    
    if ($avatarUrl !== '') {
        if (!filter_var($avatarUrl, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//i', $avatarUrl)) {
            jsonResponse(['error' => 'Neplatná URL adresa avataru. Musí začínat http:// nebo https://.'], 422);
        }
        if (strlen($avatarUrl) > 2083) {
            jsonResponse(['error' => 'URL adresa avataru je příliš dlouhá.'], 422);
        }
    }
    
    $pdo = getDB();
    $stmt = $pdo->prepare('UPDATE users SET name = ?, avatar_url = ? WHERE id = ?');
    $stmt->execute([$name, $avatarUrl !== '' ? $avatarUrl : null, $user['id']]);

    // Update session
    $_SESSION['user']['name'] = $name;
    $_SESSION['user']['avatar_url'] = $avatarUrl !== '' ? $avatarUrl : null;

    jsonResponse(['ok' => true, 'name' => $name, 'avatar_url' => $avatarUrl !== '' ? $avatarUrl : null]);
}

jsonResponse(['error' => 'Neznámá akce.'], 400);
