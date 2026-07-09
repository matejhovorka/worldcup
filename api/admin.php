<?php
// ============================================================
// api/admin.php
// POST ?action=result  → uloží výsledek zápasu + nastaví status FT
// POST ?action=setstatus → změní status (NS/LIVE/FT) bez výsledku
// GET                  → vrátí seznam zápasů pro admin panel
// ============================================================

require_once __DIR__ . '/config.php';

$adminUser = requireAdmin();
$method    = $_SERVER['REQUEST_METHOD'];
$action    = $_GET['action'] ?? '';

// ── GET: seznam zápasů ───────────────────────────────────────
if ($method === 'GET') {
    $pdo  = getDB();
    $stmt = $pdo->query('
        SELECT id, group_letter, home_team, away_team,
               match_date, time_cest, venue, city,
               result_home, result_away, status
        FROM matches
        ORDER BY match_date ASC, time_cest ASC
    ');
    $rows = $stmt->fetchAll();
    foreach ($rows as &$m) {
        try {
            $dt = new DateTimeImmutable($m['match_date'] . ' ' . $m['time_cest'], new DateTimeZone('UTC'));
            $dt = $dt->setTimezone(new DateTimeZone('Europe/Prague'));
            $m['match_date'] = $dt->format('Y-m-d');
            $m['time_cest']  = $dt->format('H:i:s');
        } catch (Exception $e) {
            // Keep original values
        }
    }
    unset($m);
    jsonResponse(['matches' => $rows]);
}

// ── POST /result ─────────────────────────────────────────────
if ($method === 'POST' && $action === 'result') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $matchId = (int)($body['match_id'] ?? 0);
    $home    = $body['result_home'] ?? null;
    $away    = $body['result_away'] ?? null;
    $status  = $body['status'] ?? 'FT';

    if ($matchId <= 0 || $home === null || $away === null) {
        jsonResponse(['error' => 'Chybí povinné hodnoty.'], 422);
    }
    if (!in_array($status, ['NS', 'LIVE', 'FT'], true)) {
        $status = 'FT';
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare("
        UPDATE matches
        SET result_home = ?, result_away = ?, status = ?
        WHERE id = ?
    ");
    $stmt->execute([(int)$home, (int)$away, $status, $matchId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Zápas nenalezen.'], 404);
    }

    jsonResponse(['ok' => true, 'match_id' => $matchId, 'status' => $status, 'result' => [(int)$home, (int)$away]]);
}

// ── POST /setstatus ──────────────────────────────────────────
if ($method === 'POST' && $action === 'setstatus') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $matchId = (int)($body['match_id'] ?? 0);
    $status  = $body['status'] ?? '';

    if (!in_array($status, ['NS', 'LIVE', 'FT'], true)) {
        jsonResponse(['error' => 'Neplatný status.'], 422);
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('UPDATE matches SET status = ? WHERE id = ?');
    $stmt->execute([$status, $matchId]);
    jsonResponse(['ok' => true]);
}

// ── POST /updatetime ─────────────────────────────────────────
if ($method === 'POST' && $action === 'updatetime') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $matchId   = (int)($body['match_id'] ?? 0);
    $localDate = $body['match_date'] ?? ''; // e.g. "2026-06-11"
    $localTime = $body['time_cest'] ?? '';  // e.g. "19:00"

    if ($matchId <= 0 || !$localDate || !$localTime) {
        jsonResponse(['error' => 'Chybí povinné hodnoty.'], 422);
    }

    try {
        // Convert input Europe/Prague time to UTC for db storage
        $dt = new DateTimeImmutable($localDate . ' ' . $localTime, new DateTimeZone('Europe/Prague'));
        $dt = $dt->setTimezone(new DateTimeZone('UTC'));
        $utcDate = $dt->format('Y-m-d');
        $utcTime = $dt->format('H:i:s');
    } catch (Exception $e) {
        jsonResponse(['error' => 'Neplatný formát data nebo času.'], 422);
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('
        UPDATE matches
        SET match_date = ?, time_cest = ?
        WHERE id = ?
    ');
    $stmt->execute([$utcDate, $utcTime, $matchId]);

    jsonResponse([
        'ok' => true,
        'match_id' => $matchId,
        'match_date' => $localDate,
        'time_cest' => $localTime
    ]);
}

jsonResponse(['error' => 'Neznámá akce.'], 400);
