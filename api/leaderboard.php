<?php
// ============================================================
// api/leaderboard.php
// GET → žebříček hráčů s dynamicky vypočítanými body
// Bodovací systém:
//   Přesný výsledek (oba góly) → 3 body
//   Správný vítěz/remíza       → 1 bod
//   Špatně                     → 0 bodů
// ============================================================

require_once __DIR__ . '/config.php';

$pdo = getDB();

$sql = "
    SELECT
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        COALESCE(SUM(
            CASE
                WHEN m.status = 'FT' AND t.home_score IS NOT NULL THEN
                    CASE
                        -- Přesný výsledek (100)
                        WHEN t.home_score = m.result_home AND t.away_score = m.result_away THEN 100
                        -- Správný rozdíl / správná remíza (50)
                        WHEN (CAST(t.home_score AS SIGNED) - CAST(t.away_score AS SIGNED)) = (CAST(m.result_home AS SIGNED) - CAST(m.result_away AS SIGNED)) THEN 50
                        -- Správný vítěz (20)
                        WHEN SIGN(CAST(t.home_score AS SIGNED) - CAST(t.away_score AS SIGNED)) = SIGN(CAST(m.result_home AS SIGNED) - CAST(m.result_away AS SIGNED)) THEN 20
                        ELSE 0
                    END
                ELSE 0
            END
        ), 0) AS points,
        COUNT(t.id) AS tips_count
    FROM users u
    LEFT JOIN tips t ON t.user_id = u.id
    LEFT JOIN matches m ON m.id = t.match_id
    GROUP BY u.id
    ORDER BY points DESC, u.name ASC
";

$stmt = $pdo->query($sql);
$players = $stmt->fetchAll();

foreach ($players as &$p) {
    $p['points']     = (int)$p['points'];
    $p['tips_count'] = (int)$p['tips_count'];
    $p['is_admin']   = null; // don't leak
}
unset($p);

jsonResponse(['leaderboard' => $players]);
