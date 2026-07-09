<?php
// ============================================================
// api/matches.php
// GET → vrátí všechny zápasy + tip přihlášeného uživatele
// ============================================================

require_once __DIR__ . '/config.php';

$user = currentUser();
$userId = $user['id'] ?? null;

$pdo = getDB();

// Fetch all matches with user's tip (if logged in)
$sql = '
    SELECT
        m.id,
        m.group_letter AS `group`,
        m.home_team,
        m.away_team,
        m.match_date   AS `date`,
        m.time_cest,
        m.venue,
        m.city,
        m.result_home,
        m.result_away,
        m.status,
        t.home_score   AS tip_home,
        t.away_score   AS tip_away
    FROM matches m
    LEFT JOIN tips t ON t.match_id = m.id AND t.user_id = :uid
    ORDER BY m.match_date ASC, m.time_cest ASC
';

$stmt = $pdo->prepare($sql);
$stmt->execute([':uid' => $userId]);
$rows = $stmt->fetchAll();

// Add computed fields
$now = new DateTimeImmutable('now', new DateTimeZone('Europe/Prague'));

foreach ($rows as &$m) {
    // Format datetime for display
    try {
        $dt = new DateTimeImmutable($m['date'] . ' ' . $m['time_cest'], new DateTimeZone('UTC'));
        $dt = $dt->setTimezone(new DateTimeZone('Europe/Prague'));
        $m['date'] = $dt->format('Y-m-d');
        $m['formatted_date'] = $dt->format('j. n. Y H:i');
        // Tip deadline: 30 min before kickoff
        $deadline = $dt->modify('-' . TIP_DEADLINE_MINUTES . ' minutes');
        $m['tips_locked'] = ($now >= $deadline);
    } catch (Exception $e) {
        $m['formatted_date'] = $m['date'] . ' ' . $m['time_cest'];
        $m['tips_locked'] = false;
    }

    // Nulls → proper types
    $m['result_home'] = $m['result_home'] !== null ? (int)$m['result_home'] : null;
    $m['result_away'] = $m['result_away'] !== null ? (int)$m['result_away'] : null;
    $m['tip_home']    = $m['tip_home'] !== null ? (int)$m['tip_home'] : null;
    $m['tip_away']    = $m['tip_away'] !== null ? (int)$m['tip_away'] : null;
}
unset($m);

jsonResponse(['matches' => $rows]);
