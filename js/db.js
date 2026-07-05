/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Database Layer (Supabase)
   Handles all data persistence, queries, and CRUD operations.
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
════════════════════════════════════════════════════════════════════ */
const DB = {
  async getUser(username) {
    const { data, error } = await _sb
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) { console.error('[DB.getUser]', error.message); return null; }
    return data;
  },

  async createUser(username, pass) {
    const { error } = await _sb
      .from('users')
      .insert({ username, pass, clan: null, total_score: 0, best_level: 0 });
    if (error) { console.error('[DB.createUser]', error.message); return false; }
    return true;
  },

  async updateUser(username, fields) {
    const { error } = await _sb
      .from('users')
      .update(fields)
      .eq('username', username);
    if (error) console.error('[DB.updateUser]', error.message);
  },

  async getTotalScore(username) {
    const { data, error } = await _sb
      .from('scores')
      .select('score')
      .eq('username', username);
    if (error) { console.error('[DB.getTotalScore]', error.message); return 0; }
    return (data || []).reduce((sum, r) => sum + r.score, 0);
  },

  async getClan(code) {
    const { data, error } = await _sb
      .from('clans')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (error) { console.error('[DB.getClan]', error.message); return null; }
    return data;
  },

  async getAllClans() {
    const { data, error } = await _sb
      .from('clans')
      .select('*')
      .order('total_score', { ascending: false });
    if (error) { console.error('[DB.getAllClans]', error.message); return []; }
    return data || [];
  },

  async addMemberToClan(code, username) {
    const clan = await this.getClan(code);
    if (!clan) return false;
    if (clan.members.includes(username)) return true;
    const newMembers = [...clan.members, username];
    const { error } = await _sb
      .from('clans')
      .update({ members: newMembers })
      .eq('code', code);
    if (error) { console.error('[DB.addMemberToClan]', error.message); return false; }
    return true;
  },

  async removeMemberFromClan(code, username) {
    const clan = await this.getClan(code);
    if (!clan) return;
    const newMembers = clan.members.filter(m => m !== username);
    if (newMembers.length === 0) {
      await _sb.from('clans').delete().eq('code', code);
    } else {
      await _sb.from('clans').update({ members: newMembers }).eq('code', code);
    }
  },

  async getScores(username) {
    const { data, error } = await _sb
      .from('scores')
      .select('level_id, score')
      .eq('username', username);
    if (error) { console.error('[DB.getScores]', error.message); return {}; }
    const map = {};
    (data || []).forEach(r => { map[r.level_id] = r.score; });
    return map;
  },

  async upsertScore(username, levelId, score) {
    const { data: existing } = await _sb
      .from('scores')
      .select('score')
      .eq('username', username)
      .eq('level_id', levelId)
      .maybeSingle();
    if (existing && existing.score >= score) return;
    const { error } = await _sb
      .from('scores')
      .upsert(
        { username, level_id: levelId, score },
        { onConflict: 'username,level_id' }
      );
    if (error) console.error('[DB.upsertScore]', error.message);
  },

  async insertAttempt(username, levelId, puzzleIndex, isCorrect, timeTaken, attemptsCount) {
    const { error } = await _sb
      .from('attempts')
      .insert({
        username,
        level_id: levelId,
        puzzle_index: puzzleIndex,
        is_correct: isCorrect,
        time_taken: timeTaken,
        attempts_count: attemptsCount,
        ts: Date.now()
      });
    if (error) console.error('[DB.insertAttempt]', error.message);
  },

  async getUserAttempts(username) {
    const { data, error } = await _sb
      .from('attempts')
      .select('*')
      .eq('username', username)
      .order('ts', { ascending: true });
    if (error) { console.error('[DB.getUserAttempts]', error.message); return []; }
    return data || [];
  },

  async createClan(code, name, creatorUsername) {
    const { error } = await _sb
      .from('clans')
      .insert({ code, name, total_score: 0, members: [creatorUsername] });
    if (error) { console.error('[DB.createClan]', error.message); return false; }
    return true;
  },

  async recalcClanScore(code) {
    const clan = await this.getClan(code);
    if (!clan) return;
    const { data, error } = await _sb
      .from('users')
      .select('total_score')
      .in('username', clan.members);
    if (error) { console.error('[DB.recalcClanScore]', error.message); return; }
    const total = (data || []).reduce((s, r) => s + (r.total_score || 0), 0);
    await _sb.from('clans').update({ total_score: total }).eq('code', code);
  },

  async getGlobalLeaderboard() {
    const { data, error } = await _sb
      .from('users')
      .select('username, total_score, best_level, clan')
      .order('total_score', { ascending: false })
      .limit(20);
    if (error) { console.error('[DB.getGlobalLeaderboard]', error.message); return []; }
    const clans = await this.getAllClans();
    const clanMap = {};
    clans.forEach(c => { clanMap[c.code] = c.name; });
    return (data || []).map(u => ({
      username:  u.username,
      total:     u.total_score || 0,
      bestLevel: Number(u.best_level) || 0,
      clanName:  u.clan ? (clanMap[u.clan] || '—') : '—',
      clanCode:  u.clan || null
    }));
  },

  async getSpeedLeaderboard() {
    const { data, error } = await _sb
      .from('attempts')
      .select('username, time_taken')
      .eq('is_correct', true);
    if (error) { console.error('[DB.getSpeedLeaderboard]', error.message); return []; }
    const totals = {};
    const counts = {};
    (data || []).forEach(r => {
      totals[r.username] = (totals[r.username] || 0) + r.time_taken;
      counts[r.username] = (counts[r.username] || 0) + 1;
    });
    const userRows = await this.getGlobalLeaderboard();
    const userMap  = {};
    userRows.forEach(u => { userMap[u.username] = u; });
    return Object.keys(totals)
      .map(u => ({
        ...(userMap[u] || { username: u, total: 0, bestLevel: 0, clanName: '—' }),
        avgSpeed: Math.round(totals[u] / counts[u])
      }))
      .sort((a, b) => a.avgSpeed - b.avgSpeed)
      .slice(0, 15);
  },

  async getAccuracyLeaderboard() {
    const { data, error } = await _sb
      .from('attempts')
      .select('username, is_correct');
    if (error) { console.error('[DB.getAccuracyLeaderboard]', error.message); return []; }
    const correct = {};
    const total   = {};
    (data || []).forEach(r => {
      total[r.username]   = (total[r.username]   || 0) + 1;
      if (r.is_correct) correct[r.username] = (correct[r.username] || 0) + 1;
    });
    const userRows = await this.getGlobalLeaderboard();
    const userMap  = {};
    userRows.forEach(u => { userMap[u.username] = u; });
    return Object.keys(total)
      .map(u => ({
        ...(userMap[u] || { username: u, total: 0, bestLevel: 0, clanName: '—' }),
        accuracy: Math.round(((correct[u] || 0) / total[u]) * 100)
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 15);
  }
};

window.DB = DB;