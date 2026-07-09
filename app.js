// ============================================================
// app.js — MS 2026 Tipovací aplikace
// Komunikuje s PHP API backendem
// ============================================================

const APP_VERSION = '1.2';

// Country flag mapping (English team names → flagcdn.com codes)
const teamFlagCodes = {
  "Mexico": "mx", "South Africa": "za", "South Korea": "kr", "Czech Republic": "cz",
  "Canada": "ca", "Bosnia and Herzegovina": "ba", "Qatar": "qa", "Switzerland": "ch",
  "United States": "us", "Paraguay": "py", "Australia": "au", "Turkey": "tr",
  "Germany": "de", "Curaçao": "cw", "Ivory Coast": "ci", "Ecuador": "ec",
  "Netherlands": "nl", "Japan": "jp", "Sweden": "se", "Tunisia": "tn",
  "Belgium": "be", "Egypt": "eg", "Iran": "ir", "New Zealand": "nz",
  "Spain": "es", "Cabo Verde": "cv", "Saudi Arabia": "sa", "Uruguay": "uy",
  "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no",
  "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
  "Portugal": "pt", "DR Congo": "cd", "Uzbekistan": "uz", "Colombia": "co",
  "England": "gb-eng", "Croatia": "hr", "Ghana": "gh", "Panama": "pa",
  "Brazil": "br", "Morocco": "ma", "Haiti": "ht", "Scotland": "gb-sct"
};

// App State
let matches = [];
let currentUser = null;
let currentFilter = "all";
let currentGroupFilter = "all-groups";
let currentDayIndex = 0;   // index into uniqueDays array
let uniqueDays = [];        // sorted array of 'YYYY-MM-DD' strings
let isLoading = false;
let isError = false;
let fetchChatMessages = null;
let isFirstLoad = true;

// DOM Elements
const matchCardsList    = document.getElementById("match-cards-list");
const leaderboardList   = document.getElementById("leaderboard-list");
const themeToggleBtn    = document.getElementById("theme-toggle-btn");
const tabButtons        = document.querySelectorAll(".tab-btn");
const groupSubfilter    = document.getElementById("group-subfilter");
const groupSubBtns      = document.querySelectorAll(".group-sub-btn");
const toast             = document.getElementById("toast");
const toastMessage      = document.getElementById("toast-message");
const userDisplayName   = document.getElementById("user-display-name");
const userDisplayPoints = document.getElementById("user-display-points");
const userDisplayAvatar = document.getElementById("user-display-avatar");
const logoutBtn         = document.getElementById("logout-btn");

// ── API helpers ──────────────────────────────────────────────

async function apiGet(endpoint) {
  const res = await fetch(endpoint, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.version && data.version !== APP_VERSION) {
    console.log("Detecting new app version, reloading...");
    window.location.reload();
    return new Promise(() => {}); // Stop caller execution
  }
  return data;
}

async function apiPost(endpoint, data) {
  const res = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const dataJson = await res.json();
  if (dataJson && dataJson.version && dataJson.version !== APP_VERSION) {
    console.log("Detecting new app version, reloading...");
    window.location.reload();
    return new Promise(() => {}); // Stop caller execution
  }
  return dataJson;
}

// ── Auth ─────────────────────────────────────────────────────

async function checkAuth() {
  try {
    const data = await apiGet('api/auth.php?action=me');
    if (!data.user) {
      window.location.href = 'login';
      return false;
    }
    currentUser = data.user;
    updateUserHeader();
    return true;
  } catch (e) {
    window.location.href = 'login';
    return false;
  }
}

function updateUserHeader() {
  if (!currentUser) return;
  if (userDisplayName)   userDisplayName.textContent  = currentUser.name;
  if (userDisplayAvatar && currentUser.avatar_url) {
    userDisplayAvatar.src = currentUser.avatar_url;
  }
  // Points shown after leaderboard loads
}

async function logout() {
  await apiPost('api/auth.php?action=logout', {});
  window.location.href = 'login';
}

// Helper checking if any match score input is currently focused by the user
function isAnyScoreInputFocused() {
  const active = document.activeElement;
  return active && active.classList && active.classList.contains("score-input");
}

// Helper checking if there are unsaved score changes in the UI compared to the loaded matches state
function hasUnsavedChanges() {
  if (!matches || matches.length === 0) return false;
  for (const m of matches) {
    const homeInput = document.getElementById(`home-tip-${m.id}`);
    const awayInput = document.getElementById(`away-tip-${m.id}`);
    if (homeInput && awayInput) {
      const currentHome = homeInput.value.trim();
      const currentAway = awayInput.value.trim();
      const savedHome = m.tip_home !== null ? m.tip_home.toString() : "";
      const savedAway = m.tip_away !== null ? m.tip_away.toString() : "";
      if (currentHome !== savedHome || currentAway !== savedAway) {
        return true;
      }
    }
  }
  return false;
}

// ── Fetch Matches from API ───────────────────────────────────

async function fetchMatches(isSilent = false) {
  if (!isSilent) {
    isLoading = true;
    isError   = false;
    renderLoading();
  }

  try {
    const data = await apiGet('api/matches.php');
    matches = data.matches.map(m => {
      const homeCode = teamFlagCodes[m.home_team] || "un";
      const awayCode = teamFlagCodes[m.away_team] || "un";
      m.teams = {
        home: { name: m.home_team, logo: `https://flagcdn.com/w40/${homeCode}.png` },
        away: { name: m.away_team, logo: `https://flagcdn.com/w40/${awayCode}.png` }
      };
      if (m.group === 'R') m.stage = "Šestnáctifinále";
      else if (m.group === 'O') m.stage = "Osmifinále";
      else if (m.group === 'Q') m.stage = "Čtvrtfinále";
      else if (m.group === 'S') m.stage = "Semifinále";
      else if (m.group === '3') m.stage = "O 3. místo";
      else if (m.group === 'N') m.stage = "Finále";
      else m.stage = `Skupinová fáze – Skupina ${m.group}`;
      return m;
    });

    // Build sorted unique match days
    uniqueDays = [...new Set(matches.map(m => m.date))].sort();

    // Default to today or nearest upcoming day on first load
    if (isFirstLoad) {
      const todayStr = new Date().toISOString().slice(0, 10);
      let idx = uniqueDays.findIndex(d => d >= todayStr);
      if (idx === -1) idx = uniqueDays.length - 1; // if past the last match, show last day
      currentDayIndex = idx >= 0 ? idx : 0;
      isFirstLoad = false;
    }

    // Skip rendering matches if user is typing or has unsaved changes, to avoid erasing input
    if (isSilent && (hasUnsavedChanges() || isAnyScoreInputFocused())) {
      console.log("Skipping matches render to preserve unsaved user input");
      // Still refresh the leaderboard silently
      fetchLeaderboard();
      return;
    }

    updateDayNav();
    renderMatches();
    fetchLeaderboard();
  } catch (err) {
    console.error('fetchMatches error:', err);
    if (!isSilent) {
      isError = true;
      renderError();
    }
  } finally {
    if (!isSilent) {
      isLoading = false;
    }
  }
}

// ── Day Navigation ───────────────────────────────────────────

function updateDayNav() {
  const label   = document.getElementById('day-nav-label');
  const btnPrev = document.getElementById('day-prev');
  const btnNext = document.getElementById('day-next');
  if (!label || !uniqueDays.length) return;

  const dateStr = uniqueDays[currentDayIndex];
  const d = new Date(dateStr + 'T12:00:00'); // noon to avoid DST issues
  const dayName = d.toLocaleDateString('cs-CZ', { weekday: 'long' });
  const dayDate = d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday  = dateStr === todayStr;

  label.innerHTML = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayDate}${isToday ? ' <small>dnes</small>' : ''}`;

  if (btnPrev) btnPrev.disabled = currentDayIndex === 0;
  if (btnNext) btnNext.disabled = currentDayIndex === uniqueDays.length - 1;
}

function changeDay(dir) {
  const newIdx = currentDayIndex + dir;
  if (newIdx < 0 || newIdx >= uniqueDays.length) return;
  currentDayIndex = newIdx;
  updateDayNav();
  renderMatches();
}

// ── Fetch Leaderboard ────────────────────────────────────────

async function fetchLeaderboard() {
  try {
    const data = await apiGet('api/leaderboard.php');
    renderLeaderboard(data.leaderboard);
    // Update header points for current user
    const me = data.leaderboard.find(p => p.id == currentUser?.id);
    if (me && userDisplayPoints) {
      userDisplayPoints.textContent = `${me.points} ${getPointsWord(me.points)}`;
    }
    // Update last-refresh timestamp
    const ts = document.getElementById('leaderboard-refresh-time');
    if (ts) ts.textContent = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error('fetchLeaderboard error:', e);
  }
}

// ── Save Tip ─────────────────────────────────────────────────

async function saveTip(matchId) {
  const homeInput = document.getElementById(`home-tip-${matchId}`);
  const awayInput = document.getElementById(`away-tip-${matchId}`);
  const homeVal   = homeInput?.value.trim();
  const awayVal   = awayInput?.value.trim();

  if (homeVal === "" || awayVal === "") {
    showToast("Prosím vyplňte obě skóre!");
    return;
  }

  const btn = document.querySelector(`button[onclick="saveTip(${matchId})"]`);
  if (btn) { btn.disabled = true; btn.textContent = "Ukládám…"; }

  try {
    const result = await apiPost('api/tips.php', {
      match_id: matchId,
      home_score: parseInt(homeVal),
      away_score: parseInt(awayVal)
    });

    if (result.error) {
      showToast(result.error, true);
    } else {
      showToast("Tip úspěšně uložen!");
      // Update match tip in local state
      const m = matches.find(x => x.id == matchId);
      if (m) { m.tip_home = parseInt(homeVal); m.tip_away = parseInt(awayVal); }
      renderMatches();
      fetchLeaderboard();
    }
  } catch (e) {
    showToast("Chyba při ukládání tipu.", true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Uložit tip"; }
  }
}

// ── Rendering ────────────────────────────────────────────────

function renderLoading() {
  matchCardsList.innerHTML = `
    <div class="loading-container" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <div class="loading-text">Načítám zápasy…</div>
    </div>
  `;
}

function renderError() {
  matchCardsList.innerHTML = `
    <div class="error-container" style="grid-column: 1 / -1;">
      <svg class="error-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div class="error-title">Chyba při načítání dat</div>
      <div class="error-desc">Nepodařilo se načíst zápasy ze serveru.</div>
      <button class="btn-retry" onclick="fetchMatches()">Zkusit znovu</button>
    </div>
  `;
}

function renderMatches() {
  matchCardsList.innerHTML = "";

  const selectedDay = uniqueDays[currentDayIndex] || null;

  const filtered = matches.filter(m => {
    // 1. Groups tab ignores day filter — shows all matches in the selected group
    if (currentFilter === "groups") {
      return m.group === currentGroupFilter;
    }

    // 2. "predicted" (Natipované) tab ignores day filter — shows all tipped matches
    if (currentFilter === "predicted") return m.tip_home !== null;

    // 3. "all" (Vše) tab: filter by selected day
    if (selectedDay && m.date !== selectedDay) return false;

    return true; // "Vše"
  });

  if (filtered.length === 0) {
    matchCardsList.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-secondary);background:var(--bg-card);border:1px dashed var(--border-card);border-radius:var(--border-radius-md);grid-column:1/-1;">
        Žádné zápasy neodpovídají vybranému filtru.
      </div>
    `;
    return;
  }

  filtered.forEach(m => {
    const isCompleted  = m.status === 'FT';
    const isLive       = m.status === 'LIVE';
    const isLocked     = m.tips_locked || isCompleted || isLive;
    const hasTip       = m.tip_home !== null;

    let pointsHtml      = "";
    let resultBadgeHtml = "";

    if (isCompleted) {
      const pts = getMatchPoints(
        hasTip ? { home: m.tip_home, away: m.tip_away } : null,
        { home: m.result_home, away: m.result_away }
      );
      pointsHtml      = `<span class="points-awarded">+${pts} ${getPointsWord(pts)}</span>`;
      resultBadgeHtml = `<span class="actual-result-badge">Konec: ${m.result_home} – ${m.result_away}</span>`;
    } else if (isLive) {
      const homeScore = m.result_home !== null ? m.result_home : 0;
      const awayScore = m.result_away !== null ? m.result_away : 0;
      resultBadgeHtml = `<span class="actual-result-badge" style="color: #f87171; border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.05)">LIVE: ${homeScore} – ${awayScore}</span>`;
    }

    const card = document.createElement("div");
    card.className = `match-card ${isLive ? 'live-match' : ''}`;
    card.innerHTML = `
      <div class="match-info-top">
        <span class="match-date-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${m.formatted_date}
        </span>
        ${isLive 
          ? `<span class="live-badge"><span class="live-pulse"></span>LIVE</span>` 
          : `<span class="match-stage-badge">${m.stage}</span>`
        }
      </div>

      <div class="match-teams-grid">
        <div class="team home">
          <span class="team-name">${escapeHtml(m.teams.home.name)}</span>
          <img src="${escapeHtml(m.teams.home.logo)}" alt="${escapeHtml(m.teams.home.name)}" class="team-flag">
        </div>

        <div class="score-inputs-container">
          <div class="score-input-wrapper">
            <input type="number" min="0" max="99" class="score-input"
              id="home-tip-${m.id}"
              value="${hasTip ? m.tip_home : ''}"
              ${isLocked ? 'disabled' : ''}
              placeholder="-">
          </div>
          <span class="score-divider">:</span>
          <div class="score-input-wrapper">
            <input type="number" min="0" max="99" class="score-input"
              id="away-tip-${m.id}"
              value="${hasTip ? m.tip_away : ''}"
              ${isLocked ? 'disabled' : ''}
              placeholder="-">
          </div>
        </div>

        <div class="team away">
          <img src="${escapeHtml(m.teams.away.logo)}" alt="${escapeHtml(m.teams.away.name)}" class="team-flag">
          <span class="team-name">${escapeHtml(m.teams.away.name)}</span>
        </div>
      </div>

      <div class="prediction-status">
        <div class="status-label ${hasTip ? 'predicted' : ''}">
          ${hasTip
            ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Natipováno`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Bez tipu`
          }
        </div>

        <div style="display:flex;align-items:center;gap:0.75rem;">
          ${resultBadgeHtml}
          ${isCompleted
            ? pointsHtml
            : isLocked
              ? `<span style="font-size:0.75rem;color:var(--text-muted)">🔒 Uzavřeno</span>`
              : `<button class="btn-save-tip" onclick="saveTip(${m.id})">Uložit tip</button>`
          }
        </div>
      </div>
    `;

    matchCardsList.appendChild(card);
  });
}

function renderLeaderboard(players) {
  leaderboardList.innerHTML = "";
  if (!players || players.length === 0) {
    leaderboardList.innerHTML = `<div style="padding:1rem;color:var(--text-muted);text-align:center;">Zatím žádní hráči.</div>`;
    return;
  }

  players.forEach((p, idx) => {
    const isMe = currentUser && p.id == currentUser.id;
    const item = document.createElement("div");
    item.className = `leaderboard-item ${isMe ? "current-user" : ""}`;
    const escapedName = escapeHtml(p.name);
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1e2d3d&color=38bdf8&size=80`;
    const escapedAvatar = p.avatar_url ? escapeHtml(p.avatar_url) : defaultAvatar;
    item.innerHTML = `
      <span class="rank">${idx + 1}.</span>
      <img src="${escapedAvatar}"
           alt="${escapedName}" class="player-avatar">
      <span class="player-name">${escapedName}${isMe ? " (Vy)" : ""}</span>
      <span class="player-points">${p.points} ${getPointsWord(p.points)}</span>
    `;
    leaderboardList.appendChild(item);
  });
}

// ── Helpers ──────────────────────────────────────────────────

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/`/g, "&#96;");
}

function getMatchPoints(prediction, actual) {
  if (!prediction || actual.home === null || actual.away === null) return 0;
  const ph = parseInt(prediction.home), pa = parseInt(prediction.away);
  const ah = parseInt(actual.home),    aa = parseInt(actual.away);
  if (isNaN(ph) || isNaN(pa) || isNaN(ah) || isNaN(aa)) return 0;
  // 1. Přesný výsledek (100 bodů)
  if (ph === ah && pa === aa) return 100;
  // 2. Správný rozdíl gólů / správná remíza (50 bodů)
  if ((ph - pa) === (ah - aa)) return 50;
  // 3. Správný vítěz bez rozdílu (20 bodů)
  if (Math.sign(ph - pa) === Math.sign(ah - aa)) return 20;
  return 0;
}

function getPointsWord(pts) {
  return "bodů";
}

function showToast(message, isError = false) {
  toastMessage.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ── Theme ────────────────────────────────────────────────────

function toggleTheme() {
  const current  = document.documentElement.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("wc_theme", newTheme);
  updateThemeToggleUI(newTheme);
  showToast(newTheme === "dark" ? "Tmavý režim aktivován" : "Světlý režim aktivován");
}

function updateThemeToggleUI(theme) {
  const sunIcon  = themeToggleBtn?.querySelector(".icon-sun");
  const moonIcon = themeToggleBtn?.querySelector(".icon-moon");
  if (!sunIcon || !moonIcon) return;
  sunIcon.style.display  = theme === "dark"  ? "none"  : "block";
  moonIcon.style.display = theme === "dark"  ? "block" : "none";
}

// ── Profile Modal ─────────────────────────────────────────────

function initProfileModal() {
  const profileTrigger      = document.getElementById("profile-trigger");
  const profileModal        = document.getElementById("profile-modal");
  const profileModalClose   = document.getElementById("profile-modal-close");
  const profileModalCancel  = document.getElementById("profile-modal-cancel");
  const profileForm         = document.getElementById("profile-form");
  const profileNameInput    = document.getElementById("profile-name-input");
  const profileAvatarInput  = document.getElementById("profile-avatar-input");
  const avatarPresetsContainer = document.getElementById("avatar-presets");

  if (!profileTrigger || !profileModal) return;

  const presets = [
    { bg: '0284c7', color: 'ffffff' },
    { bg: 'ef4444', color: 'ffffff' },
    { bg: '22c55e', color: 'ffffff' },
    { bg: 'eab308', color: '000000' },
    { bg: 'a855f7', color: 'ffffff' },
    { bg: 'f97316', color: 'ffffff' }
  ];

  // Open modal
  profileTrigger.addEventListener("click", () => {
    if (!currentUser) return;
    profileNameInput.value = currentUser.name;
    profileAvatarInput.value = currentUser.avatar_url || '';
    
    renderPresets();
    profileModal.classList.add("open");
  });

  // Close modal
  const closeModal = () => {
    profileModal.classList.remove("open");
  };
  profileModalClose?.addEventListener("click", closeModal);
  profileModalCancel?.addEventListener("click", closeModal);
  profileModal.addEventListener("click", (e) => {
    if (e.target === profileModal) closeModal();
  });

  // Render presets
  function renderPresets() {
    avatarPresetsContainer.innerHTML = '';
    const initial = profileNameInput.value.trim() ? profileNameInput.value.trim().charAt(0) : 'U';
    
    presets.forEach(p => {
      const presetUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${p.bg}&color=${p.color}&size=120`;
      const img = document.createElement("img");
      img.className = "avatar-preset-img";
      img.src = presetUrl;
      img.alt = "Avatar preset";
      
      if (profileAvatarInput.value === presetUrl) {
        img.classList.add("selected");
      }
      
      img.addEventListener("click", () => {
        document.querySelectorAll(".avatar-preset-img").forEach(el => el.classList.remove("selected"));
        img.classList.add("selected");
        profileAvatarInput.value = presetUrl;
      });
      
      avatarPresetsContainer.appendChild(img);
    });
  }

  // Live initials update on presets when name changes
  profileNameInput.addEventListener("input", () => {
    const presetImages = avatarPresetsContainer.querySelectorAll(".avatar-preset-img");
    const initial = profileNameInput.value.trim() ? profileNameInput.value.trim().charAt(0) : 'U';
    
    presets.forEach((p, idx) => {
      if (presetImages[idx]) {
        const newUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${p.bg}&color=${p.color}&size=120`;
        // If the current input has this preset, update the input value too
        if (presetImages[idx].classList.contains("selected")) {
          profileAvatarInput.value = newUrl;
        }
        presetImages[idx].src = newUrl;
      }
    });
  });

  // Clear preset selection if custom URL typed
  profileAvatarInput.addEventListener("input", () => {
    let matchesPreset = false;
    const presetImages = avatarPresetsContainer.querySelectorAll(".avatar-preset-img");
    
    presetImages.forEach(img => {
      if (img.src === profileAvatarInput.value) {
        img.classList.add("selected");
        matchesPreset = true;
      } else {
        img.classList.remove("selected");
      }
    });
  });

  // Form submit
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSubmit = profileForm.querySelector("button[type='submit']");
    const originalText = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Ukládám…";

    const name = profileNameInput.value.trim();
    const avatar_url = profileAvatarInput.value.trim();

    try {
      const res = await apiPost('api/auth.php?action=update_profile', { name, avatar_url });
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Profil úspěšně aktualizován!");
        currentUser.name = name;
        currentUser.avatar_url = avatar_url;
        updateUserHeader();
        
        // Refresh leaderboard to reflect name/avatar change
        fetchLeaderboard();
        closeModal();
      }
    } catch (err) {
      showToast("Chyba při ukládání profilu.", true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = originalText;
    }
  });
}

// ── Rules Modal ──────────────────────────────────────────────

function initRulesModal() {
  const rulesBtn        = document.getElementById("rules-btn");
  const rulesModal      = document.getElementById("rules-modal");
  const rulesModalClose = document.getElementById("rules-modal-close");
  const rulesModalOk    = document.getElementById("rules-modal-ok");

  if (!rulesBtn || !rulesModal) return;

  rulesBtn.addEventListener("click", () => {
    rulesModal.classList.add("open");
  });

  const closeRules = () => {
    rulesModal.classList.remove("open");
  };

  rulesModalClose?.addEventListener("click", closeRules);
  rulesModalOk?.addEventListener("click", closeRules);
  rulesModal.addEventListener("click", (e) => {
    if (e.target === rulesModal) closeRules();
  });
}

// ── Board Chat ───────────────────────────────────────────────

function initBoardChat() {
  const chatMessagesContainer = document.getElementById("chat-messages");
  const chatForm             = document.getElementById("chat-form");
  const chatInput            = document.getElementById("chat-input");

  if (!chatMessagesContainer || !chatForm) return;

  // Define global fetchChatMessages
  fetchChatMessages = async function() {
    try {
      const data = await apiGet('api/chat.php');
      const messages = data.messages || [];
      renderChatMessages(messages);
    } catch (err) {
      console.error("fetchChatMessages error:", err);
    }
  };

  function renderChatMessages(messages) {
    const isAtBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.clientHeight <= chatMessagesContainer.scrollTop + 60;
    
    chatMessagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
      chatMessagesContainer.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);font-size:0.8rem;">Zatím žádné zprávy. Napiš první!</div>`;
      return;
    }

    messages.forEach(msg => {
      const isMe = currentUser && msg.user_id === currentUser.id;
      const escapedName = escapeHtml(msg.name);
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.name)}&background=1e2d3d&color=38bdf8&size=80`;
      const escapedAvatar = msg.avatar_url ? escapeHtml(msg.avatar_url) : defaultAvatar;
      
      const div = document.createElement("div");
      div.className = `chat-msg ${isMe ? 'is-me' : ''}`;
      div.innerHTML = `
        <img src="${escapedAvatar}" alt="${escapedName}" class="chat-msg-avatar">
        <div>
          <div class="chat-msg-meta">
            <span class="chat-msg-user">${escapedName}</span>
            <span class="chat-msg-time">${escapeHtml(msg.time_formatted)}</span>
          </div>
          <div class="chat-msg-content">${escapeHtml(msg.message)}</div>
        </div>
      `;
      chatMessagesContainer.appendChild(div);
    });

    // Auto scroll down if user was already near bottom
    if (isAtBottom) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }

  // Submit new message
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message === '') return;

    chatInput.value = '';
    
    try {
      const res = await apiPost('api/chat.php', { message });
      if (res.error) {
        showToast(res.error, true);
      } else {
        await fetchChatMessages();
        // Force scroll to bottom on new own message
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
      }
    } catch (err) {
      showToast("Chyba při odesílání zprávy.", true);
    }
  });

  // Initial fetch
  fetchChatMessages().then(() => {
    // Scroll to bottom initially
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  });
}

// ── Init ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  // Theme
  const savedTheme = localStorage.getItem("wc_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeToggleUI(savedTheme);

  // Auth check
  const loggedIn = await checkAuth();
  if (!loggedIn) return;

  // Events
  themeToggleBtn?.addEventListener("click", toggleTheme);
  logoutBtn?.addEventListener("click", logout);
  initProfileModal();
  initRulesModal();
  initBoardChat();

  tabButtons.forEach(btn => {
    btn.addEventListener("click", e => {
      tabButtons.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;

      const dayNav = document.getElementById("day-nav");

      if (currentFilter === "groups") {
        groupSubfilter?.classList.add("open");
        currentGroupFilter = "A";
        groupSubBtns.forEach(b => b.classList.remove("active"));
        const btnA = Array.from(groupSubBtns).find(b => b.dataset.group === 'A');
        if (btnA) btnA.classList.add("active");
        if (dayNav) dayNav.style.display = "none";
      } else if (currentFilter === "predicted") {
        groupSubfilter?.classList.remove("open");
        currentGroupFilter = "all-groups";
        if (dayNav) dayNav.style.display = "none";
      } else {
        groupSubfilter?.classList.remove("open");
        currentGroupFilter = "all-groups";
        if (dayNav) dayNav.style.display = "flex";
      }

      if (!isLoading && !isError) renderMatches();
    });
  });

  groupSubBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      groupSubBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentGroupFilter = e.target.dataset.group;
      if (!isLoading && !isError) renderMatches();
    });
  });

  // Load data
  fetchMatches();

  // Auto-refresh leaderboard + matches every 15 seconds (silently to not interrupt user inputs)
  setInterval(() => {
    fetchMatches(true);
    if (fetchChatMessages) fetchChatMessages();
  }, 15000);
});
