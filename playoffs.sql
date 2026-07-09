-- ============================================================
-- MS 2026 Tipovačka – zápasy playoff
-- Spusť tento soubor v phpMyAdmin nebo přes MySQL CLI
-- ============================================================

INSERT IGNORE INTO matches (id, group_letter, home_team, away_team, match_date, time_cest, venue, city) VALUES
  (73, 'R', 'South Africa', 'Canada', '2026-06-28', '19:00:00', 'Los Angeles Stadium', 'Los Angeles'),
  (74, 'R', 'Germany', 'Paraguay', '2026-06-29', '20:30:00', 'Boston Stadium', 'Foxborough'),
  (75, 'R', 'Netherlands', 'Morocco', '2026-06-30', '01:00:00', 'Estadio Monterrey', 'Guadalupe'),
  (76, 'R', 'Brazil', 'Japan', '2026-06-29', '17:00:00', 'Houston Stadium', 'Houston'),
  (77, 'R', 'France', 'Sweden', '2026-06-30', '21:00:00', 'New York New Jersey Stadium', 'East Rutherford'),
  (78, 'R', 'Ivory Coast', 'Norway', '2026-06-30', '17:00:00', 'Dallas Stadium', 'Arlington'),
  (79, 'R', 'Mexico', 'Ecuador', '2026-07-01', '01:00:00', 'Mexico City Stadium', 'Mexico City'),
  (80, 'R', 'England', 'DR Congo', '2026-07-01', '16:00:00', 'Atlanta Stadium', 'Atlanta'),
  (81, 'R', 'United States', 'Bosnia and Herzegovina', '2026-07-02', '00:00:00', 'San Francisco Bay Area Stadium', 'San Francisco'),
  (82, 'R', 'Belgium', 'Senegal', '2026-07-01', '20:00:00', 'Seattle Stadium', 'Seattle'),
  (83, 'R', 'Portugal', 'Croatia', '2026-07-02', '23:00:00', 'Toronto Stadium', 'Toronto'),
  (84, 'R', 'Spain', 'Austria', '2026-07-02', '19:00:00', 'Los Angeles Stadium', 'Los Angeles'),
  (85, 'R', 'Switzerland', 'Algeria', '2026-07-03', '03:00:00', 'BC Place', 'Vancouver'),
  (86, 'R', 'Argentina', 'Cabo Verde', '2026-07-03', '22:00:00', 'Miami Stadium', 'Miami Gardens'),
  (87, 'R', 'Colombia', 'Ghana', '2026-07-04', '01:30:00', 'Kansas City Stadium', 'Kansas City'),
  (88, 'R', 'Australia', 'Egypt', '2026-07-03', '18:00:00', 'Dallas Stadium', 'Arlington'),
  (89, 'O', 'Winner Match 74', 'Winner Match 77', '2026-07-04', '21:00:00', 'Philadelphia Stadium', 'Philadelphia'),
  (90, 'O', 'Winner Match 73', 'Winner Match 75', '2026-07-04', '17:00:00', 'Houston Stadium', 'Houston'),
  (91, 'O', 'Winner Match 76', 'Winner Match 78', '2026-07-05', '20:00:00', 'New York New Jersey Stadium', 'East Rutherford'),
  (92, 'O', 'Winner Match 79', 'Winner Match 80', '2026-07-06', '00:00:00', 'Mexico City Stadium', 'Mexico City'),
  (93, 'O', 'Winner Match 83', 'Winner Match 84', '2026-07-06', '19:00:00', 'Dallas Stadium', 'Arlington'),
  (94, 'O', 'Winner Match 81', 'Winner Match 82', '2026-07-07', '00:00:00', 'Seattle Stadium', 'Seattle'),
  (95, 'O', 'Winner Match 86', 'Winner Match 88', '2026-07-07', '16:00:00', 'Atlanta Stadium', 'Atlanta'),
  (96, 'O', 'Winner Match 85', 'Winner Match 87', '2026-07-07', '20:00:00', 'BC Place', 'Vancouver'),
  (97, 'Q', 'Winner Match 89', 'Winner Match 90', '2026-07-09', '20:00:00', 'Boston Stadium', 'Foxborough'),
  (98, 'Q', 'Winner Match 93', 'Winner Match 94', '2026-07-10', '19:00:00', 'Los Angeles Stadium', 'Los Angeles'),
  (99, 'Q', 'Winner Match 91', 'Winner Match 92', '2026-07-11', '21:00:00', 'Miami Stadium', 'Miami Gardens'),
  (100, 'Q', 'Winner Match 95', 'Winner Match 96', '2026-07-12', '01:00:00', 'Kansas City Stadium', 'Kansas City'),
  (101, 'S', 'Winner Match 97', 'Winner Match 98', '2026-07-14', '19:00:00', 'Dallas Stadium', 'Arlington'),
  (102, 'S', 'Winner Match 99', 'Winner Match 100', '2026-07-15', '19:00:00', 'Atlanta Stadium', 'Atlanta'),
  (103, '3', 'Loser Match 101', 'Loser Match 102', '2026-07-18', '21:00:00', 'Hard Rock Stadium', 'Miami'),
  (104, 'N', 'Winner Match 101', 'Winner Match 102', '2026-07-19', '19:00:00', 'MetLife Stadium', 'New York / New Jersey');
