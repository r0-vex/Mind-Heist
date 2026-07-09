/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Leaderboard System
   Global, speed, accuracy, and clan leaderboards.

   MIGRATION CHANGES:
   - DB.getGlobalLeaderboard(userId) now takes UUID for current user rank lookup.
   - isYou comparison uses userId (UUID) instead of username string.
   - All leaderboard entries still display usernames (from profile lookups).
   - Clan leaderboard: isMember checks UUID against clan.members (UUID array).
   - No UI changes; only internal comparison logic updated.
   ──────────────────────────────────────────────────────────────── */

let currentLbTab = 'global';

/* ─────────────────────────────────────────────────────────────────
   TAB SWITCHING
───────────────────────────────────────────────────────────────── */
function switchLbTab(tab, btn) {
  currentLbTab = tab;
  document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderLeaderboard();
}

/* ─────────────────────────────────────────────────────────────────
   RENDER LEADERBOARD
───────────────────────────────────────────────────────────────── */
async function renderLeaderboard() {
  const tbody = document.getElementById('lb-body');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(0,255,136,0.3);padding:20px">FETCHING<span class="dots"></span></td></tr>';

  if (currentLbTab === 'clans') {
    document.querySelector('#lb-table thead tr').innerHTML =
      '<th>RANK</th><th>CLAN</th><th>TOTAL SCORE</th><th>MEMBERS</th><th>ACTION</th>';
    await renderClanLeaderboard(tbody);
    return;
  }

  document.querySelector('#lb-table thead tr').innerHTML =
    '<th>RANK</th><th>AGENT</th><th>SCORE</th><th>LEVEL</th><th>CLAN</th>';

  let entries = [];
  let currentRank = null;
  if (currentLbTab === "global") {
    const result = await DB.getGlobalLeaderboard(currentUser);
    entries = result.topPlayers;
    currentRank = result.currentUser;
  } else if (currentLbTab === 'speed') {
    entries = await DB.getSpeedLeaderboard();
    document.querySelector('#lb-table thead tr').innerHTML =
      '<th>RANK</th><th>AGENT</th><th>AVG TIME</th><th>LEVEL</th><th>CLAN</th>';
  } else if (currentLbTab === 'accuracy') {
    entries = await DB.getAccuracyLeaderboard();
    document.querySelector('#lb-table thead tr').innerHTML =
      '<th>RANK</th><th>AGENT</th><th>ACCURACY</th><th>LEVEL</th><th>CLAN</th>';
  }

  tbody.innerHTML = '';
  entries.forEach((e, i) => {
    const rank  = i + 1;
    /* Compare by UUID (userId) instead of username */
    const isYou = e.userId === currentUser;
    const tr    = document.createElement('tr');
    tr.className = (isYou ? 'you ' : '') + `rank-${rank}`;

    let thirdCol;
    if (currentLbTab === 'speed')         thirdCol = `${e.avgSpeed}s avg`;
    else if (currentLbTab === 'accuracy') thirdCol = `${e.accuracy}%`;
    else                                  thirdCol = e.total.toLocaleString();

    const userInClan = !!currentUserData?.clan;
    const clanCell = e.clanName !== '—' && !userInClan && !isYou
      ? `${e.clanName.toUpperCase()} <button class="join-btn" onclick="quickJoinClan('${e.clanCode}')">JOIN</button>`
      : e.clanName.toUpperCase();

    tr.innerHTML = `
      <td>#${rank}</td>
      <td>${e.username.toUpperCase()}${isYou ? ' ★' : ''}</td>
      <td>${thirdCol}</td>
      <td>LVL ${e.bestLevel || 0}</td>
      <td style="display:flex;align-items:center;gap:6px">${clanCell}</td>
    `;
    tbody.appendChild(tr);
  });

  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(0,255,136,0.3);padding:20px">NO DATA YET</td></tr>';
  }

  /* Current user rank card (global tab only) */
  const oldCard = document.getElementById("your-rank-card");
  if (oldCard) oldCard.remove();

  if (currentLbTab === "global" && currentRank) {
    const card = document.createElement("div");
    card.id = "your-rank-card";
    card.innerHTML = `
      <div class="your-rank-title">YOUR RANK</div>
      <div class="your-rank-row">
        <span>#${currentRank.rank}</span>
        <span>${currentRank.username.toUpperCase()}</span>
        <span>${currentRank.total.toLocaleString()}</span>
        <span>LVL ${currentRank.bestLevel}</span>
      </div>
    `;
    document.getElementById("lb-table").after(card);
  }
}

async function renderClanLeaderboard(tbody) {
  const clans    = await DB.getAllClans();
  const userInClan = !!currentUserData?.clan;

  tbody.innerHTML = '';
  clans.slice(0, 10).forEach((c, i) => {
    /* Clan members now stores UUIDs; check against currentUser (UUID) */
    const isMember  = c.members.includes(currentUser);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${i+1}</td>
      <td>${c.name.toUpperCase()}</td>
      <td>${(c.total_score||0).toLocaleString()}</td>
      <td>${c.members.length}</td>
      <td>
        ${isMember
          ? '<span class="clan-member-badge">★ MEMBER</span>'
          : userInClan
          ? '<span class="clan-locked-msg">leave clan first</span>'
          : `<button class="join-btn" onclick="quickJoinClan('${c.code}')">JOIN</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (!clans.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(0,255,136,0.3);padding:20px">NO CLANS YET</td></tr>';
  }
}
