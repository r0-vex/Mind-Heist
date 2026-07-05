/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Clan System
   Join, leave, create, render clans, and manage clan scores.
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
───────────────────────────────────────────────────────────────── */
async function createClan() {
  const name = document.getElementById('clan-name-input').value.trim();
  if (!name) { toast('Enter a clan name', 'error'); return; }

  await refreshCurrentUser();
  if (currentUserData?.clan) { toast('Already in a clan — leave first', 'error'); return; }

  const code = generateClanCode(name);
  const ok   = await DB.createClan(code, name, currentUser);
  if (!ok) { toast('Failed to create clan', 'error'); return; }

  await DB.updateUser(currentUser, { clan: code });
  await DB.recalcClanScore(code);
  await refreshCurrentUser();

  toast(`Clan "${name}" created! Code: ${code}`, 'success');
  await renderClan();
  alert(`Your clan code is: ${code}
Share this with teammates!`);
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
───────────────────────────────────────────────────────────────── */
async function _joinByClanCode(code) {
  await refreshCurrentUser();
  if (currentUserData?.clan) { toast('Leave your current clan first', 'error'); return; }

  const clan = await DB.getClan(code);
  if (!clan) { toast('Clan not found — check the code', 'error'); return; }
  if (clan.members.includes(currentUser)) { toast('Already a member', 'error'); return; }

  const ok = await DB.addMemberToClan(code, currentUser);
  if (!ok) { toast('Failed to join clan', 'error'); return; }

  await DB.updateUser(currentUser, { clan: code });
  await DB.recalcClanScore(code);
  await refreshCurrentUser();

  toast(`Joined clan "${clan.name}"!`, 'success');
  await renderClan();
  updateStatusBar();
}

/* ─────────────────────────────────────────────────────────────────
   LEAVE CLAN
───────────────────────────────────────────────────────────────── */
async function leaveClan() {
  await refreshCurrentUser();
  if (!currentUserData?.clan) return;

  const code = currentUserData.clan;
  const clan = await DB.getClan(code);

  await DB.removeMemberFromClan(code, currentUser);
  await DB.updateUser(currentUser, { clan: null });

  if (clan) {
    if (clan.members.filter(m => m !== currentUser).length === 0) {
      toast('Clan disbanded (no members left)', 'error');
    } else {
      await DB.recalcClanScore(code);
      toast(`Left clan "${clan.name}"`, 'error');
    }
  }

  await refreshCurrentUser();
  await renderClan();
  updateStatusBar();
}

/* ─────────────────────────────────────────────────────────────────
   RENDER CLAN SCREEN
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
    await DB.recalcClanScore(currentUserData.clan);

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

    const batchUsers = await getBatchUsers(clan.members);
    const userMap = {};
    batchUsers.forEach(u => { userMap[u.username] = u.total_score; });

    const membersList = document.getElementById('clan-members-list');
    membersList.innerHTML = '';
    const memberData = clan.members
      .map(m => ({ name: m, score: userMap[m] || 0 }))
      .sort((a, b) => b.score - a.score);

    memberData.forEach(m => {
      const div = document.createElement('div');
      div.className = 'clan-member-row';
      div.innerHTML = `
        <span class="member-name">${m.name.toUpperCase()}${m.name === currentUser ? ' ★' : ''}</span>
        <span class="member-score">${m.score.toLocaleString()} PTS</span>
      `;
      membersList.appendChild(div);
    });
  } else {
    clanView.style.display   = 'none';
    clanNoView.style.display = 'block';
  }
}

/* ─────────────────────────────────────────────────────────────────
   BATCH GET USERS
───────────────────────────────────────────────────────────────── */
async function getBatchUsers(usernames) {
  if (!usernames.length) return [];
  const { data, error } = await _sb
    .from('users')
    .select('username, total_score')
    .in('username', usernames);
  if (error) { console.error('[getBatchUsers]', error.message); return []; }
  return data || [];
}
