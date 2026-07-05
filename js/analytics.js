/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Analytics Dashboard
   User statistics, accuracy, average time, recent performance.
   ──────────────────────────────────────────────────────────────── */

async function renderAnalytics() {
  await refreshCurrentUser();

  const attempts = await DB.getUserAttempts(currentUser);
  const recent = attempts.slice(-10);

  const trend = recent.map(a =>
    a.is_correct
      ? '<span style="color:#00ff88;text-shadow:0 0 6px #00ff88">🟢</span>'
      : '<span style="color:#ff3366;text-shadow:0 0 6px #ff3366">🔴</span>'
  ).join(' ');

  const total = attempts.length;
  const correct = attempts.filter(a => a.is_correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const avgTime = total
    ? Math.round(attempts.reduce((s,a)=>s + Number(a.time_taken), 0) / total)
    : 0;

  document.getElementById("analytics-content").innerHTML = `
    <div>Total Games: ${total}</div>
    <div>Accuracy: ${accuracy}%</div>
    <div>Avg Time: ${avgTime}s</div>
    <div>Best Level: ${currentUserData.best_level || 0}</div>
    <div>Total Score: ${(currentUserData.total_score || 0).toLocaleString()}</div>
    <div class="analytics-trend">
      Recent Performance:<br>
      ${trend || 'No recent data'}
    </div>
  `;
}
