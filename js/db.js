/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Database Layer (Supabase)
   Handles all data persistence, queries, and CRUD operations.

   MIGRATION CHANGES:
   - All tables now use user_id (UUID) instead of username as FK.
   - Auth is handled by supabase.auth, not the users table.
   - The users table is now a profile table (id, username, clan, etc.).
   - scores, attempts reference user_id.
   - clans.members stores UUIDs.
   - RLS is enabled; only anon key is used.
   ──────────────────────────────────────────────────────────────── */

const _sb = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
);

/* Clan cache for reducing redundant lookups */
let clanCache = {};

async function getClanCached(code) {
  if (clanCache[code]) return clanCache[code];
  const clan = await DB.getClan(code);
  if (clan) clanCache[code] = clan;
  return clan;
}

/* ═══════════════════════════════════════════════════════════════════
   DB — Supabase-backed data layer

   BREAKING CHANGES from old version:
   - getUser() now fetches by UUID (id), not username.
   - getUserByUsername() added for username lookups.
   - createUser() removed — profile creation happens in auth.js after signUp.
   - All score/attempt/clan methods use user_id (UUID) instead of username.
   - upsertScore uses (user_id, level_id) as conflict key.
   - Clan members array stores UUIDs.
════════════════════════════════════════════════════════════════════ */
const DB = {

  /* ─── PROFILE QUERIES ─────────────────────────────────────── */

  /* Get profile by UUID (primary lookup) */
  async getUser(userId) {
    const { data, error } = await _sb
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) { console.error('[DB.getUser]', error.message); return null; }
    return data;
  },

  /* Get profile by username (for display/leaderboards) */
  async getUserByUsername(username) {
    const { data, error } = await _sb
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) { console.error('[DB.getUserByUsername]', error.message); return null; }
    return data;
  },

  /* Check if username is already taken (for registration) */
  async usernameExists(username) {
    const { data, error } = await _sb
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (error) { console.error('[DB.usernameExists]', error.message); return true; }
    return !!data;
  },

  /* Create profile row after Supabase Auth signUp.
     Called from auth.js register() after successful auth signUp(). */
  async createProfile(userId, username) {
    const { error } = await _sb
      .from('users')
      .insert({
        id: userId,
        username: username,
        clan: null,
        total_score: 0,
        best_level: 0
      });
    if (error) { console.error('[DB.createProfile]', error.message); return false; }
    return true;
  },

  /* Update profile by UUID */
  async updateUser(userId, fields) {
    const { error } = await _sb
      .from('users')
      .update(fields)
      .eq('id', userId);
    if (error) console.error('[DB.updateUser]', error.message);
  },

  /* ─── SCORE QUERIES (UUID-based) ──────────────────────────── */

  async getTotalScore(userId) {
    const { data, error } = await _sb
      .from('scores')
      .select('score')
      .eq('user_id', userId);
    if (error) { console.error('[DB.getTotalScore]', error.message); return 0; }
    return (data || []).reduce((sum, r) => sum + r.score, 0);
  },

  async getScores(userId) {
    const { data, error } = await _sb
      .from('scores')
      .select('level_id, score')
      .eq('user_id', userId);
    if (error) { console.error('[DB.getScores]', error.message); return {}; }
    const map = {};
    (data || []).forEach(r => { map[r.level_id] = r.score; });
    return map;
  },

  async upsertScore(userId, levelId, score) {
    const { data: existing } = await _sb
      .from('scores')
      .select('score')
      .eq('user_id', userId)
      .eq("level_id", levelId)
      .maybeSingle();
    if (existing && existing.score >= score) return;
    const { error } = await _sb
      .from('scores')
      .upsert(
        { user_id: userId, level_id: levelId, score: score },
        { onConflict: 'user_id,level_id' }
      );
    if (error) console.error('[DB.upsertScore]', error.message);
  },

  /* ─── ATTEMPT QUERIES (UUID-based) ────────────────────────── */

  async insertAttempt(userId, levelId, puzzleIndex, isCorrect, timeTaken, attemptsCount) {
    const { error } = await _sb
      .from('attempts')
      .insert({
        user_id: userId,
        level_id: levelId,
        puzzle_index: puzzleIndex,
        is_correct: isCorrect,
        time_taken: timeTaken,
        attempts_count: attemptsCount,
        created_at: new Date().toISOString()
      });
    if (error) console.error('[DB.insertAttempt]', error.message);
  },

  async getUserAttempts(userId) {
    const { data, error } = await _sb
      .from('attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) { console.error('[DB.getUserAttempts]', error.message); return []; }
    return data || [];
  },

  /* ─── CLAN QUERIES ────────────────────────────────────────── */

  async syncClans() {
    // Fetch every clan
    const { data: clans, error: clanError } = await _sb
        .from("clans")
        .select("*");

    if (clanError) {
        console.error("[DB.syncClans]", clanError.message);
        return;
    }

    // Fetch every user
    const { data: users, error: userError } = await _sb
        .from("users")
        .select("id, clan, total_score");

    if (userError) {
        console.error("[DB.syncClans users]", userError.message);
        return;
    }

    for (const clan of clans) {
        // Build the real member list from users table
        const clanUsers = users.filter(
            u => u.clan === clan.code
        );
        const members = clanUsers.map(
            u => u.id
        );
        const totalScore = clanUsers.reduce(
            (sum, u) => sum + (u.total_score || 0),
            0
        );
        // Delete empty clans
        if (members.length === 0) {
            const { error: deleteError } = await _sb
            .from("clans")
            .delete()
            .eq("code", clan.code);

        if (deleteError) {
            console.error("[SYNC DELETE ERROR]", deleteError);
        }
            continue;
        }

        // Update cache
        await _sb
            .from("clans")
            .update({
                members,
                total_score: totalScore
            })
            .eq("code", clan.code);
    }
},

  async getClan(code){

      const {data:clan,error}=await _sb
          .from("clans")
          .select("*")
          .eq("code",code)
          .maybeSingle();

      if(error){
          console.error(error);
          return null;
      }

      if(!clan) return null;

      const {data:users}=await _sb
          .from("users")
          .select("id")
          .eq("clan",code);

      clan.members=(users||[]).map(u=>u.id);

      return clan;

  },

  async getAllClans() {

      await this.syncClans();

      const { data, error } = await _sb
          .from("clans")
          .select("*")
          .order("total_score", {
              ascending: false
          });

      if (error) {
          console.error(error);
          return [];
      }

      return data || [];
  },

  /* Clan members now stores UUIDs. */
  async addMemberToClan(code, userId) {
    const user = await this.getUser(userId);
    if (user?.clan && user.clan !== code) {
      await this.removeMemberFromClan(user.clan, userId);
    }
    const clan = await this.getClan(code);
    if (!clan) return false;
    if (clan.members.includes(userId)) return true;
    const newMembers = [...clan.members, userId];
    const { error } = await _sb
      .from('clans')
      .update({ members: newMembers })
      .eq('code', code);
    if (error) { console.error('[DB.addMemberToClan]', error.message); return false; }
    return true;
  },

  async removeMemberFromClan(code, userId) {
    const clan = await this.getClan(code);
    if (!clan) return;
    const newMembers = clan.members.filter(m => m !== userId);
    if (newMembers.length === 0) {
      await _sb.from('clans').delete().eq('code', code);
    } else {
      await _sb.from('clans').update({ members: newMembers }).eq('code', code);
    }
  },

  async createClan(code, name, creatorUserId) {
    const { error } = await _sb
      .from('clans')
      .insert({ code, name, total_score: 0, members: [creatorUserId] });
    if (error) {
      if(error.code==="23505"){
        toast("Clan name already exists","error");
    }else{
        toast(error.message,"error");
    }
    return false;
  }
    return true;
  },

  async recalcClanScore(code) {

    const { data, error } = await _sb
        .from("users")
        .select("total_score")
        .eq("clan", code);

    if (error) {
        console.error("[DB.recalcClanScore]", error.message);
        return;
    }

    const total = (data || [])
        .reduce((sum, u) => sum + (u.total_score || 0), 0);

    await _sb
        .from("clans")
        .update({ total_score: total })
        .eq("code", code);
  },

  /* ─── LEADERBOARD QUERIES ─────────────────────────────────── */

  /* Returns all users ordered by total_score, with clan name resolution.
     Used by global, speed, and accuracy leaderboards. */
  async getAllUsersOrdered() {
    const { data, error } = await _sb
      .from('users')
      .select('id, username, total_score, best_level, clan')
      .order('total_score', { ascending: false });
    if (error) { console.error('[DB.getAllUsersOrdered]', error.message); return []; }

    const clans = await this.getAllClans();
    const clanMap = {};
    clans.forEach(c => { clanMap[c.code] = c.name; });

    return (data || []).map(u => ({
      userId:    u.id,
      username:  u.username,
      total:     u.total_score || 0,
      bestLevel: Number(u.best_level) || 0,
      clanName:  u.clan ? (clanMap[u.clan] || '—') : '—',
      clanCode:  u.clan || null
    }));
  },

  /* Global leaderboard with current user rank card support.
     userId parameter is the logged-in user's UUID. */
  async getGlobalLeaderboard(userId) {
    const players = await this.getAllUsersOrdered();
    const currentIndex = players.findIndex(p => p.userId === userId);
    return {
      topPlayers: players.slice(0, 5),
      currentUser: currentIndex >= 0
        ? { ...players[currentIndex], rank: currentIndex + 1 }
        : null
    };
  },

  async getSpeedLeaderboard() {
    const { data, error } = await _sb
      .from('attempts')
      .select('user_id, time_taken')
      .eq('is_correct', true);
    if (error) { console.error('[DB.getSpeedLeaderboard]', error.message); return []; }

    const totals = {};
    const counts = {};
    (data || []).forEach(r => {
      totals[r.user_id] = (totals[r.user_id] || 0) + r.time_taken;
      counts[r.user_id] = (counts[r.user_id] || 0) + 1;
    });

    const userRows = await this.getAllUsersOrdered();
    const userMap  = {};
    userRows.forEach(u => { userMap[u.userId] = u; });

    return Object.keys(totals)
      .map(uid => ({
        ...(userMap[uid] || { userId: uid, username: '—', total: 0, bestLevel: 0, clanName: '—' }),
        avgSpeed: Math.round(totals[uid] / counts[uid])
      }))
      .sort((a, b) => a.avgSpeed - b.avgSpeed)
      .slice(0, 5);
  },

  async getAccuracyLeaderboard() {
    const { data, error } = await _sb
      .from('attempts')
      .select('user_id, is_correct');
    if (error) { console.error('[DB.getAccuracyLeaderboard]', error.message); return []; }

    const correct = {};
    const total   = {};
    (data || []).forEach(r => {
      total[r.user_id]   = (total[r.user_id]   || 0) + 1;
      if (r.is_correct) correct[r.user_id] = (correct[r.user_id] || 0) + 1;
    });

    const userRows = await this.getAllUsersOrdered();
    const userMap  = {};
    userRows.forEach(u => { userMap[u.userId] = u; });

    return Object.keys(total)
      .map(uid => ({
        ...(userMap[uid] || { userId: uid, username: '—', total: 0, bestLevel: 0, clanName: '—' }),
        accuracy: Math.round(((correct[uid] || 0) / total[uid]) * 100)
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);
  },

  /* Batch get profiles by UUID array (for clan member lists) */
  async getBatchUsers(userIds) {
    if (!userIds || !userIds.length) return [];
    const { data, error } = await _sb
      .from('users')
      .select('id, username, total_score')
      .in('id', userIds);
    if (error) { console.error('[DB.getBatchUsers]', error.message); return []; }
    return data || [];
  }
};

window.DB = DB;
