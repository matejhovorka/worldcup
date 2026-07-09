# 🏆 MS ve fotbale 2026 – Tipovací Aplikace (Tipovačka)

Vítejte v projektu **MS 2026 Tipovačka**! Jedná se o moderní, rychlou a plně responzivní webovou aplikaci navrženou pro tipování zápasů Mistrovství světa ve fotbale 2026. Aplikace nabízí přehledné a čisté rozhraní (tmavý a světlý režim), hecovací chat pro hráče, dynamický žebříček a plnohodnotnou administraci.

Aplikace je postavena na odlehčené architektuře bez složitých závislostí a frameworků: frontend využívá čisté **HTML5, CSS3 a Vanilla JS**, zatímco backend běží na **PHP (s PDO pro MySQL)**.

---

## 🚀 Klíčové Funkce

*   **Pohodlné tipování:** Rychlé ukládání tipů pro jednotlivé hrací dny skupinové fáze i celého play-off.
*   **Dynamický žebříček hráčů:** Okamžité přepočítávání bodů po zadání výsledku zápasu administrátorem.
*   **Hecovací chat:** Live-like chat (pooling) pro interakci mezi hráči přímo na hlavní stránce.
*   **Přizpůsobení profilu:** Možnost nastavit si vlastní jméno, vybrat barvu výchozího avataru nebo vložit URL vlastního obrázku.
*   **Administrační rozhraní:** Speciální chráněný panel pro správu zápasů, zadávání výsledků, přepínání statusů (LIVE / FT) a úpravu časů zápasů.
*   **Moderní design:** Responzivní rozhraní s podporou tmavého a světlého režimu (uloženo v localStorage).

---

## 🛠️ Technologie a Architektura

Aplikace funguje jako **Single Page Application (SPA)** komunikující přes asynchronní HTTP požadavky (fetch) s REST API:

*   **Frontend:**
    *   `index.html` – Hlavní klientská zóna (zápasy, chat, žebříček).
    *   `login.html` – Registrační a přihlašovací obrazovka.
    *   `admin.html` – Rozhraní pro administrátora.
    *   `app.js` – Klientská logika, práce se stavem, renderování komponent, komunikace s API.
    *   `style.css` – CSS styly využívající CSS proměnné pro snadné přepínání témat.
*   **Backend (REST API):**
    *   PHP skripty v adresáři `api/` (čtení/zápis dat v JSON formátu, správa sezení (Session), CORS a CSRF ochrana).
    *   MySQL databáze uchovávající uživatele, zápasy, tipy a chat.

---

## 📦 Rychlá Instalace a Nastavení

### 1. Klonování a příprava souborů
Nahrajte obsah tohoto repozitáře do kořenového adresáře vašeho webového serveru (např. Apache, Nginx) nebo do lokálního vývojového prostředí (např. XAMPP, Laragon, MAMP).

### 2. Import databáze
1. Vytvořte novou MySQL databázi (např. s kódováním `utf8mb4_general_ci`).
2. Importujte strukturu a zápasy skupinové fáze ze souboru **[db_setup.sql](file:///Users/matejhovorka/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads%20-%20iCloud/%21vibecoding/wc/worldcup/db_setup.sql)**.
3. (Volitelně) Importujte zápasy play-off ze souboru **[playoffs.sql](file:///Users/matejhovorka/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads%20-%20iCloud/%21vibecoding/wc/worldcup/playoffs.sql)**.

### 3. Konfigurace API
Vytvořte nebo upravte soubor **[api/config.php](file:///Users/matejhovorka/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads%20-%20iCloud/%21vibecoding/wc/worldcup/api/config.php)** a doplňte přístupové údaje k databázi:

```php
define('DB_HOST', 'localhost');      // Hostitel databáze
define('DB_NAME', 'nazev_databaze'); // Název vaší databáze
define('DB_USER', 'uzivatel_db');    // Uživatel databáze
define('DB_PASS', 'heslo_db');       // Heslo k databázi

// Volitelně můžete změnit název session pro odlišení
define('SESSION_NAME', 'wc2026_session');

// Nastavení uzávěrky tipování (počet minut před výkopem zápasu)
define('TIP_DEADLINE_MINUTES', 30);
```

### 4. Nastavení serveru (URL přepisy)
Ujistěte se, že váš webový server podporuje přepisy URL. V projektu jsou předpřipravené soubory `.htaccess` pro Apache:
*   Kořenový **[.htaccess](file:///Users/matejhovorka/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads%20-%20iCloud/%21vibecoding/wc/worldcup/.htaccess)** – přesměrovává cesty bez přípony `.html` na správné soubory (např. `/login` -> `/login.html`).
*   **[api/.htaccess](file:///Users/matejhovorka/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads%20-%20iCloud/%21vibecoding/wc/worldcup/api/.htaccess)** – zakazuje přímý výpis adresáře a chání konfigurační soubory.

---

## 📈 Bodovací Pravidla

Tipování se automaticky uzavírá **30 minut před výkopem** každého konkrétního zápasu. Body se rozdělují následovně:

*   🥇 **100 bodů** – **Přesný výsledek** (např. tip 2:1, zápas skončí 2:1)
*   🥈 **50 bodů** – **Správný brankový rozdíl** nebo **správná remíza** (např. tip 2:1, konec 3:2; nebo tip 1:1, konec 2:2)
*   🥉 **20 bodů** – **Správný vítěz zápasu** s jiným brankovým rozdílem (např. tip 2:1, konec 3:1)
*   ❌ **0 bodů** – **Špatný tip** (netrefená tendence výsledku)

---

## 🔑 Administrace a První Spuštění

1. **Registrace administrátora:**
   * Zaregistrujte se klasicky přes přihlašovací/registrační stránku `/login`.
   * Přejděte do své MySQL databáze, vyhledejte tabulku `users` a u svého účtu změňte hodnotu ve sloupci `is_admin` z `0` na `1`.
2. **Přístup do administrace:**
   * Po přihlášení a udělení práv admina můžete přejít na adresu `/admin` (resp. `/admin.html`).
   * Zde uvidíte kompletní přehled zápasů, můžete je filtrovat, měnit čas výkopu (v lokálním čase Europe/Prague) a zadávat konečné výsledky.

---

## 📖 Podrobná Dokumentace

Detailní technické informace o API, struktuře databáze, bezpečnosti a postupech pro vývojáře naleznete v samostatném souboru **[DOCUMENTATION.md](file:///Users/matejhovorka/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads%20-%20iCloud/%21vibecoding/wc/worldcup/DOCUMENTATION.md)**.
