/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Clan System
   Join, leave, create, render clans, and manage clan scores.

   MIGRATION CHANGES:
   - All clan operations now use UUIDs (currentUser) instead of usernames.
   - DB.createClan(code, name, creatorUserId) takes UUID.
   - DB.addMemberToClan(code, userId) takes UUID.
   - DB.removeMemberFromClan(code, userId) takes UUID.
   - DB.updateUser(userId, fields) updates profile by UUID.
   - Clan members array stores UUIDs; isMember checks UUID inclusion.
   - getBatchUsers(userIds) fetches profiles by UUID array.
   - Member list renders usernames from profile lookups.
   - Leaderboard join buttons still work with clan codes.
   - No UI changes; only internal identifiers changed.
   ──────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────
   CLAN CODE GENERATION
───────────────────────────────────────────────────────────────── */
function generateClanCode(name) {
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return name.replace(/\s+/g, '').substring(0,5).toUpperCase() + '-' + suffix;
}

/* ─────────────────────────────────────────────────────────────────
   CREATE CLAN
   Uses currentUser (UUID) as creator and first member.
───────────────────────────────────────────────────────────────── */
async function createClan() {
  const name = document.getElementById('clan-name-input').value.trim();
  if (!name) { toast('Enter a clan name', 'error'); return; }

  await refreshCurrentUser();
  if (currentUserData?.clan) { toast('Already in a clan — leave first', 'error'); return; }

  const code = generateClanCode(name);
  const ok   = await DB.createClan(code, name, currentUser);
  if (!ok) return;

  await DB.updateUser(currentUser, { clan: code });
  await DB.syncClans();
  await refreshCurrentUser();

  toast(`Clan "${name}" created! Code: ${code}`, 'success');
  await renderClan();
  alert(`Your clan code is: ${code}\nShare this with teammates!`);
}

/* ─────────────────────────────────────────────────────────────────
   JOIN CLAN (by code input)
───────────────────────────────────────────────────────────────── */
async function joinClan() {
  const code = document.getElementById('clan-code-input').value.trim().toUpperCase();
  if (!code) { toast('Enter a clan code', 'error'); return; }
  await _joinByClanCode(code);
}

/* ─────────────────────────────────────────────────────────────────
   QUICK JOIN (from leaderboard)
───────────────────────────────────────────────────────────────── */
async function quickJoinClan(clanCode) {
  await _joinByClanCode(clanCode);
}

/* ─────────────────────────────────────────────────────────────────
   INTERNAL JOIN LOGIC
   Uses currentUser (UUID) for membership.
───────────────────────────────────────────────────────────────── */
async function _joinByClanCode(code) {
  await refreshCurrentUser();
  if (currentUserData?.clan) { toast('Leave your current clan first', 'error'); return; }

  const clan = await DB.getClan(code);
  if (!clan) { toast('Clan not found — check the code', 'error'); return; }
  if (clan.members.includes(currentUser)) { toast('Already a member', 'error'); return; }

  await DB.updateUser(currentUser, { clan: code });
  await DB.syncClans();
  await refreshCurrentUser();
  await renderLeaderboard();
  toast(`Joined clan "${clan.name}"!`, 'success');
  await renderClan();
  updateStatusBar();
}

/* ─────────────────────────────────────────────────────────────────
   LEAVE CLAN
   Uses currentUser (UUID) to remove from members array.
───────────────────────────────────────────────────────────────── */
async function leaveClan() {
    await refreshCurrentUser();
    if (!currentUserData?.clan) return;
    const code = currentUserData.clan;
    const clan = await DB.getClan(code);
    await DB.updateUser(currentUser, {
        clan: null
    });
    await DB.syncClans();
    toast(`Left clan "${clan?.name || code}"`, "success");
    await refreshCurrentUser();
    await renderClan();
    await renderLeaderboard();
    updateStatusBar();
}

/* ─────────────────────────────────────────────────────────────────
   RENDER CLAN SCREEN
   Fetches member usernames via UUID batch lookup for display.
───────────────────────────────────────────────────────────────── */
async function renderClan() {
  await refreshCurrentUser();
  const clanView   = document.getElementById('clan-view');
  const clanNoView = document.getElementById('clan-join-create');

  if (currentUserData?.clan) {
    const clan = await DB.getClan(currentUserData.clan);
    if (!clan) {
      clanView.style.display   = 'none';
      clanNoView.style.display = 'block';
      return;
    }

    clanView.style.display   = 'block';
    clanNoView.style.display = 'none';


    document.getElementById('my-clan-name').textContent    = clan.name.toUpperCase();
    document.getElementById('my-clan-code').textContent    = clan.code;
    document.getElementById('my-clan-code').onclick = function() {
      navigator.clipboard.writeText(clan.code);
      toast('Code copied!', 'success');
    };
    document.getElementById('my-clan-code').style.cursor = 'pointer';
    document.getElementById('my-clan-code').title = 'Click to copy';

    document.getElementById('my-clan-members').textContent = clan.members.length;
    document.getElementById('my-clan-score').textContent   = (clan.total_score||0).toLocaleString();

    const allClans = await DB.getAllClans();
    const rank = allClans.findIndex(c => c.code === clan.code) + 1;
    document.getElementById('my-clan-rank').textContent = `#${rank}`;

    /* Batch fetch profiles by UUID to get usernames for display */
    const batchUsers = await DB.getBatchUsers(clan.members);
    const userMap = {};
    batchUsers.forEach(u => { userMap[u.id] = { username: u.username, score: u.total_score }; });

    const membersList = document.getElementById('clan-members-list');
    membersList.innerHTML = '';
    const memberData = clan.members
      .map(m => ({ userId: m, name: (userMap[m]?.username) || '—', score: (userMap[m]?.score) || 0 }))
      .sort((a, b) => b.score - a.score);

    memberData.forEach(m => {
      const div = document.createElement('div');
      div.className = 'clan-member-row';
      div.innerHTML = `
        <span class="member-name">${m.name.toUpperCase()}${m.userId === currentUser ? ' ★' : ''}</span>
        <span class="member-score">${m.score.toLocaleString()} PTS</span>
      `;
      membersList.appendChild(div);
    });
  } else {
    clanView.style.display   = 'none';
    clanNoView.style.display = 'block';
  }
}
