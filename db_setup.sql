-- ============================================================
-- MS 2026 Tipovačka – databázové schéma
-- Spusť tento soubor jednou v phpMyAdmin nebo přes MySQL CLI
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Uživatelé
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500) DEFAULT NULL,
  is_admin      TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Zápasy (skupinová fáze)
CREATE TABLE IF NOT EXISTS matches (
  id            INT UNSIGNED PRIMARY KEY,
  group_letter  CHAR(1) NOT NULL,
  home_team     VARCHAR(100) NOT NULL,
  away_team     VARCHAR(100) NOT NULL,
  match_date    DATE NOT NULL,
  time_cest     TIME NOT NULL,
  venue         VARCHAR(200) DEFAULT NULL,
  city          VARCHAR(100) DEFAULT NULL,
  result_home   TINYINT UNSIGNED DEFAULT NULL,
  result_away   TINYINT UNSIGNED DEFAULT NULL,
  status        ENUM('NS','LIVE','FT') NOT NULL DEFAULT 'NS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tipy uživatelů (1 tip na zápas na uživatele)
CREATE TABLE IF NOT EXISTS tips (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  match_id    INT UNSIGNED NOT NULL,
  home_score  TINYINT UNSIGNED NOT NULL,
  away_score  TINYINT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_match (user_id, match_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Seed: všechny zápasy skupinové fáze (72 zápasů)
-- ============================================================
INSERT IGNORE INTO matches (id, group_letter, home_team, away_team, match_date, time_cest, venue, city) VALUES
  (1, 'A', 'Mexico', 'South Africa', '2026-06-11', '19:00', 'Mexico City Stadium', 'Mexico City'),
  (2, 'A', 'South Korea', 'Czech Republic', '2026-06-12', '02:00', 'Guadalajara Stadium', 'Guadalajara'),
  (3, 'B', 'Canada', 'Bosnia and Herzegovina', '2026-06-12', '19:00', 'Toronto Stadium', 'Toronto'),
  (4, 'D', 'United States', 'Paraguay', '2026-06-13', '01:00', 'Los Angeles Stadium', 'Los Angeles'),
  (5, 'B', 'Qatar', 'Switzerland', '2026-06-13', '19:00', 'San Francisco Bay Area Stadium', 'San Francisco'),
  (6, 'C', 'Brazil', 'Morocco', '2026-06-13', '22:00', 'New York New Jersey Stadium', 'East Rutherford'),
  (7, 'C', 'Haiti', 'Scotland', '2026-06-14', '01:00', 'Boston Stadium', 'Foxborough'),
  (8, 'D', 'Australia', 'Turkey', '2026-06-14', '04:00', 'BC Place', 'Vancouver'),
  (9, 'E', 'Germany', 'Curaçao', '2026-06-14', '17:00', 'Houston Stadium', 'Houston'),
  (10, 'F', 'Netherlands', 'Japan', '2026-06-14', '20:00', 'Dallas Stadium', 'Arlington'),
  (11, 'E', 'Ivory Coast', 'Ecuador', '2026-06-14', '23:00', 'Philadelphia Stadium', 'Philadelphia'),
  (12, 'F', 'Sweden', 'Tunisia', '2026-06-15', '02:00', 'Estadio Monterrey', 'Guadalupe'),
  (13, 'H', 'Spain', 'Cabo Verde', '2026-06-15', '16:00', 'Atlanta Stadium', 'Atlanta'),
  (14, 'G', 'Belgium', 'Egypt', '2026-06-15', '19:00', 'Seattle Stadium', 'Seattle'),
  (15, 'H', 'Saudi Arabia', 'Uruguay', '2026-06-15', '22:00', 'Miami Stadium', 'Miami Gardens'),
  (16, 'G', 'Iran', 'New Zealand', '2026-06-16', '01:00', 'Los Angeles Stadium', 'Los Angeles'),
  (17, 'I', 'France', 'Senegal', '2026-06-16', '19:00', 'New York New Jersey Stadium', 'East Rutherford'),
  (18, 'I', 'Iraq', 'Norway', '2026-06-16', '22:00', 'Boston Stadium', 'Foxborough'),
  (19, 'J', 'Argentina', 'Algeria', '2026-06-17', '01:00', 'Kansas City Stadium', 'Kansas City'),
  (20, 'J', 'Austria', 'Jordan', '2026-06-17', '04:00', 'San Francisco Bay Area Stadium', 'San Francisco'),
  (21, 'K', 'Portugal', 'DR Congo', '2026-06-17', '17:00', 'Houston Stadium', 'Houston'),
  (22, 'L', 'England', 'Croatia', '2026-06-17', '20:00', 'Dallas Stadium', 'Arlington'),
  (23, 'L', 'Ghana', 'Panama', '2026-06-17', '23:00', 'Toronto Stadium', 'Toronto'),
  (24, 'K', 'Uzbekistan', 'Colombia', '2026-06-18', '02:00', 'Mexico City Stadium', 'Mexico City'),
  (25, 'A', 'Czech Republic', 'South Africa', '2026-06-18', '16:00', 'Atlanta Stadium', 'Atlanta'),
  (26, 'B', 'Switzerland', 'Bosnia and Herzegovina', '2026-06-18', '19:00', 'Los Angeles Stadium', 'Los Angeles'),
  (27, 'B', 'Canada', 'Qatar', '2026-06-18', '22:00', 'BC Place', 'Vancouver'),
  (28, 'A', 'Mexico', 'South Korea', '2026-06-19', '01:00', 'Guadalajara Stadium', 'Guadalajara'),
  (29, 'D', 'United States', 'Australia', '2026-06-19', '19:00', 'Seattle Stadium', 'Seattle'),
  (30, 'C', 'Scotland', 'Morocco', '2026-06-19', '22:00', 'Boston Stadium', 'Foxborough'),
  (31, 'C', 'Brazil', 'Haiti', '2026-06-20', '00:30', 'Philadelphia Stadium', 'Philadelphia'),
  (32, 'D', 'Turkey', 'Paraguay', '2026-06-20', '03:00', 'San Francisco Bay Area Stadium', 'San Francisco'),
  (33, 'F', 'Netherlands', 'Sweden', '2026-06-20', '17:00', 'Houston Stadium', 'Houston'),
  (34, 'E', 'Germany', 'Ivory Coast', '2026-06-20', '20:00', 'Toronto Stadium', 'Toronto'),
  (35, 'E', 'Ecuador', 'Curaçao', '2026-06-21', '00:00', 'Kansas City Stadium', 'Kansas City'),
  (36, 'F', 'Tunisia', 'Japan', '2026-06-21', '04:00', 'Estadio Monterrey', 'Guadalupe'),
  (37, 'H', 'Spain', 'Saudi Arabia', '2026-06-21', '16:00', 'Atlanta Stadium', 'Atlanta'),
  (38, 'G', 'Belgium', 'Iran', '2026-06-21', '19:00', 'Los Angeles Stadium', 'Los Angeles'),
  (39, 'H', 'Uruguay', 'Cabo Verde', '2026-06-21', '22:00', 'Miami Stadium', 'Miami Gardens'),
  (40, 'G', 'New Zealand', 'Egypt', '2026-06-22', '01:00', 'BC Place', 'Vancouver'),
  (41, 'J', 'Argentina', 'Austria', '2026-06-22', '22:00', 'Dallas Stadium', 'Arlington'),
  (42, 'I', 'France', 'Iraq', '2026-06-23', '02:00', 'Philadelphia Stadium', 'Philadelphia'),
  (43, 'I', 'Norway', 'Senegal', '2026-06-23', '05:30', 'New York New Jersey Stadium', 'East Rutherford'),
  (44, 'J', 'Jordan', 'Algeria', '2026-06-23', '08:30', 'San Francisco Bay Area Stadium', 'San Francisco'),
  (45, 'K', 'Portugal', 'Uzbekistan', '2026-06-23', '22:00', 'Houston Stadium', 'Houston'),
  (46, 'L', 'England', 'Ghana', '2026-06-24', '01:30', 'Boston Stadium', 'Foxborough'),
  (47, 'L', 'Panama', 'Croatia', '2026-06-24', '04:30', 'Toronto Stadium', 'Toronto'),
  (48, 'K', 'Colombia', 'DR Congo', '2026-06-24', '07:30', 'Guadalajara Stadium', 'Guadalajara'),
  (49, 'B', 'Switzerland', 'Canada', '2026-06-25', '00:30', 'Los Angeles Stadium', 'Los Angeles'),
  (50, 'B', 'Bosnia and Herzegovina', 'Qatar', '2026-06-25', '00:30', 'BC Place', 'Vancouver'),
  (51, 'C', 'Morocco', 'Haiti', '2026-06-25', '03:30', 'Atlanta Stadium', 'Atlanta'),
  (52, 'C', 'Scotland', 'Brazil', '2026-06-25', '03:30', 'Miami Stadium', 'Miami Gardens'),
  (53, 'A', 'South Africa', 'South Korea', '2026-06-25', '06:30', 'Estadio Monterrey', 'Guadalupe'),
  (54, 'A', 'Czech Republic', 'Mexico', '2026-06-25', '06:30', 'Mexico City Stadium', 'Mexico City'),
  (55, 'E', 'Curaçao', 'Ivory Coast', '2026-06-26', '01:30', 'Philadelphia Stadium', 'Philadelphia'),
  (56, 'E', 'Ecuador', 'Germany', '2026-06-26', '01:30', 'New York New Jersey Stadium', 'East Rutherford'),
  (57, 'F', 'Tunisia', 'Netherlands', '2026-06-26', '04:30', 'Kansas City Stadium', 'Kansas City'),
  (58, 'F', 'Japan', 'Sweden', '2026-06-26', '04:30', 'Dallas Stadium', 'Arlington'),
  (59, 'D', 'Turkey', 'United States', '2026-06-26', '07:30', 'Los Angeles Stadium', 'Los Angeles'),
  (60, 'D', 'Paraguay', 'Australia', '2026-06-26', '07:30', 'BC Place', 'Vancouver'),
  (61, 'I', 'Norway', 'France', '2026-06-27', '00:30', 'New York New Jersey Stadium', 'East Rutherford'),
  (62, 'I', 'Senegal', 'Iraq', '2026-06-27', '00:30', 'Boston Stadium', 'Foxborough'),
  (63, 'H', 'Cabo Verde', 'Saudi Arabia', '2026-06-27', '05:30', 'Houston Stadium', 'Houston'),
  (64, 'H', 'Uruguay', 'Spain', '2026-06-27', '05:30', 'Guadalajara Stadium', 'Guadalajara'),
  (65, 'G', 'New Zealand', 'Belgium', '2026-06-27', '08:30', 'Seattle Stadium', 'Seattle'),
  (66, 'G', 'Egypt', 'Iran', '2026-06-27', '08:30', 'Los Angeles Stadium', 'Los Angeles'),
  (67, 'L', 'Panama', 'England', '2026-06-28', '02:30', 'Dallas Stadium', 'Arlington'),
  (68, 'L', 'Croatia', 'Ghana', '2026-06-28', '02:30', 'Philadelphia Stadium', 'Philadelphia'),
  (69, 'K', 'Colombia', 'Portugal', '2026-06-28', '05:00', 'Miami Stadium', 'Miami Gardens'),
  (70, 'K', 'DR Congo', 'Uzbekistan', '2026-06-28', '05:00', 'Atlanta Stadium', 'Atlanta'),
  (71, 'J', 'Algeria', 'Austria', '2026-06-28', '07:30', 'Kansas City Stadium', 'Kansas City'),
  (72, 'J', 'Jordan', 'Argentina', '2026-06-28', '07:30', 'Dallas Stadium', 'Arlington');
