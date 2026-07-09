<?php
// ============================================================
// api/tips.php
// POST → uloží nebo přepíše tip (musí být přihlášen, zápas nesmí být uzamčen)
// GET  → vrátí všechny tipy přihlášeného uživatele
// ============================================================

require_once __DIR__ . '/config.php';

$user   = requireAuth();
$userId = (int)$user['id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: vrátí všechny tipy uživatele ────────────────────────
if ($method === 'GET') {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT match_id, home_score, away_score FROM tips WHERE user_id = ?');
    $stmt->execute([$userId]);
    $tips = [];
    foreach ($stmt->fetchAll() as $row) {
        $tips[$row['match_id']] = [
            'home' => (int)$row['home_score'],
            'away' => (int)$row['away_score'],
        ];
    }
    jsonResponse(['tips' => $tips]);
}

// ── POST: ulož tip ───────────────────────────────────────────
if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $matchId = (int)($body['match_id'] ?? 0);
    $home    = $body['home_score'] ?? null;
    $away    = $body['away_score'] ?? null;

    if ($matchId <= 0 || $home === null || $away === null) {
        jsonResponse(['error' => 'Chybí povinné hodnoty.'], 422);
    }
    if (!is_numeric($home) || !is_numeric($away) || (int)$home < 0 || (int)$away < 0 || (int)$home > 99 || (int)$away > 99) {
        jsonResponse(['error' => 'Neplatné skóre. Musí být mezi 0 a 99.'], 422);
    }

    $pdo = getDB();

    // Check match exists and deadline
    $stmt = $pdo->prepare('SELECT status, match_date, time_cest FROM matches WHERE id = ?');
    $stmt->execute([$matchId]);
    $match = $stmt->fetch();
    if (!$match) {
        jsonResponse(['error' => 'Zápas neexistuje.'], 404);
    }
    if ($match['status'] === 'FT') {
        jsonResponse(['error' => 'Zápas již skončil, tip nelze změnit.'], 403);
    }

    // Deadline check
    try {
        $now = new DateTimeImmutable('now', new DateTimeZone('Europe/Prague'));
        $kickoff  = new DateTimeImmutable($match['match_date'] . ' ' . $match['time_cest'], new DateTimeZone('UTC'));
        $kickoff  = $kickoff->setTimezone(new DateTimeZone('Europe/Prague'));
        $deadline = $kickoff->modify('-' . TIP_DEADLINE_MINUTES . ' minutes');
        if ($now >= $deadline) {
            jsonResponse(['error' => 'Uzávěrka tipů již proběhla (30 min před výkopem).'], 403);
        }
    } catch (Exception $e) {
        // If date parse fails, allow tip
    }

    // Upsert tip
    $upsert = $pdo->prepare('
        INSERT INTO tips (user_id, match_id, home_score, away_score)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE home_score = VALUES(home_score), away_score = VALUES(away_score), updated_at = NOW()
    ');
    $upsert->execute([$userId, $matchId, (int)$home, (int)$away]);

    jsonResponse(['ok' => true, 'match_id' => $matchId, 'home_score' => (int)$home, 'away_score' => (int)$away]);
}

jsonResponse(['error' => 'Metoda není povolena.'], 405);
