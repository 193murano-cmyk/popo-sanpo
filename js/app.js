/* ============================================================
   ポポさんぽ — 動き（v0.2 風がとおる）
   セリフは js/lines.js、見た目は css/style.css
   ============================================================ */
(() => {
'use strict';

/* ===== 設定 ===== */
const GOAL_BONUS  = 500;   // 目標達成ボーナス（ご縁）
const STEP_THRESH = 1.1;   // さんぽモード：これ以上の揺れで1歩 (m/s²)
const STEP_MIN_MS = 280;   // さんぽモード：歩と歩の最短間隔
const QUIET_DAYS  = 3;     // この日数、風がとおらないと町の色が抜ける
const SAVE_KEY    = 'popo_sanpo_v1';
const L = window.POPO_LINES;

/* ===== 保存データ ===== */
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = () => dateKey(new Date());
let data = { days: {}, bonus: {}, goal: 3000 };
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) data = Object.assign(data, JSON.parse(raw)); } catch (e) {}
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {} };

/* ===== 画面の部品 ===== */
const $ = (id) => document.getElementById(id);
const el = {
  frame: $('frame'), kanade: $('kanade-line'), bubble: $('bubble'), stage: $('stage'),
  steps: $('steps'), fill: $('bar-fill'), goalText: $('goal-text'),
  streakNum: $('streak-num'), streakLabel: $('streak-label'), coins: $('coins'),
  todayPts: $('today-pts'), totalPts: $('total-pts'),
  sync: $('sync'), syncNote: $('sync-note'), syncInput: $('sync-input'), syncBtn: $('sync-btn'),
  start: $('start'), status: $('status'), manual: $('manual'), goal: $('goal'), toast: $('toast'),
  pvSteps: $('pv-steps'), pvStepsVal: $('pv-steps-val'), pvTime: $('pv-time'), pvStreak: $('pv-streak'), pvReset: $('pv-reset'),
};
const popoImgs = Array.from(document.querySelectorAll('.popo'));
el.goal.value = String(data.goal);

/* ===== 計算 ===== */
const stepsToday  = () => data.days[today()] || 0;
const pointsFor   = (day) => (data.days[day] || 0) + (data.bonus[day] ? GOAL_BONUS : 0);
const totalPoints = () => Object.keys(data.days).reduce((s, d) => s + pointsFor(d), 0);
const fmt = (n) => n.toLocaleString('ja-JP');
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
const dayIndex = () => Math.floor(Date.now() / 86400000);
const fill = (s) => s.replace('{steps}', fmt(stepsToday())).replace('{left}', fmt(Math.max(0, data.goal - stepsToday()))).replace('{streak}', String(streak()));

/* 連続日数：今日（達成済みなら含む）から過去へ、目標達成が続いた日数 */
function streak() {
  let n = 0; const d = new Date();
  if ((data.days[dateKey(d)] || 0) < data.goal) d.setDate(d.getDate() - 1); // 今日が未達なら昨日から数える
  while ((data.days[dateKey(d)] || 0) >= data.goal) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
/* 最後に風がとおってから何日たったか（一度も無ければ null） */
function daysSinceLastHit() {
  const hits = Object.keys(data.days).filter(k => data.days[k] >= data.goal).sort();
  if (!hits.length) return null;
  const last = new Date(hits[hits.length - 1] + 'T00:00:00');
  return Math.floor((new Date(today() + 'T00:00:00') - last) / 86400000);
}

/* ===== 時間帯（確認用パネルで上書きできる） ===== */
let forcedTime = null;
function timeOfDay() {
  if (forcedTime) return forcedTime;
  const h = new Date().getHours();
  return h < 11 ? 'morning' : (h >= 17 ? 'evening' : 'day');
}

/* ===== ポポの表情 =====
   idle / walking / done / yay / goal */
let mood = 'idle', yayTimer = null;
function setMood(m) {
  mood = m;
  popoImgs.forEach(img => img.classList.toggle('active', img.dataset.mood === m));
  el.stage.classList.toggle('walking', m === 'walking');
}
function autoMood() {
  if (mood === 'yay') return;
  if (tracking) setMood('walking');
  else if (stepsToday() >= data.goal) setMood('goal');
  else if (mood === 'done') setMood('done');
  else setMood('idle');
}

/* ===== セリフ ===== */
function say(text) {
  el.bubble.textContent = text;
  el.bubble.classList.remove('pop'); void el.bubble.offsetWidth; el.bubble.classList.add('pop');
}
function stateLine() {
  const s = stepsToday(), seed = dayIndex();
  const quiet = daysSinceLastHit();
  if (s >= data.goal) {
    const n = streak();
    return n >= 2 ? fill(pick(L.state.streak, seed)) : fill(pick(L.state.done, seed));
  }
  if (s === 0 && quiet !== null && quiet >= QUIET_DAYS) return fill(pick(L.state.quiet, seed));
  if (s === 0) return fill(pick(L.state.zero, seed));
  if (s < data.goal / 2) return fill(pick(L.state.early, seed));
  return fill(pick(L.state.late, seed));
}
function dailyLine() { return pick(L.daily, dayIndex()); }
/* 開いたとき：日替わり → 数秒後に状態のセリフ */
let lineTimer = null;
function showOpeningLines() {
  say(dailyLine());
  clearTimeout(lineTimer);
  lineTimer = setTimeout(() => say(stateLine()), 6000);
}

/* ===== 画面を更新 ===== */
function render() {
  const s = stepsToday(), goalHit = s >= data.goal;
  el.steps.textContent = fmt(s);
  el.fill.style.width = Math.min(100, s / data.goal * 100) + '%';
  el.goalText.textContent = goalHit ? '🌬️ きょうの風、とおった！' : `風がとおるまで あと ${fmt(data.goal - s)} 歩`;
  el.todayPts.textContent = fmt(pointsFor(today()));
  el.totalPts.textContent = fmt(totalPoints());
  el.stage.classList.toggle('goal', goalHit);
  // 連続
  const n = streak();
  el.streakNum.textContent = String(n);
  el.streakLabel.textContent = n === 0 ? 'きょうから、つなげよう' : (goalHit ? 'つづいてる！' : 'きょうとおせば つながる');
  renderCoins();
  // 零：風が止まると色が抜ける
  const quiet = daysSinceLastHit();
  document.body.classList.toggle('quiet', !goalHit && quiet !== null && quiet >= QUIET_DAYS);
  // カナデ
  el.kanade.textContent = L.kanade[timeOfDay()];
  if (el.pvSteps && document.activeElement !== el.pvSteps) { el.pvSteps.value = String(s); el.pvStepsVal.textContent = fmt(s); }
  autoMood();
}
function renderCoins() {
  const names = ['日','月','火','水','木','金','土'];
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dateKey(d), hit = (data.days[key] || 0) >= data.goal;
    out.push(`<div class="coin ${hit ? 'hit' : ''} ${i === 0 ? 'today' : ''}" title="${fmt(data.days[key] || 0)}歩"><small>${names[d.getDay()]}</small></div>`);
  }
  el.coins.innerHTML = out.join('');
}

/* ===== 歩数を足す ===== */
function addSteps(n, silent) {
  const key = today(), before = data.days[key] || 0;
  data.days[key] = before + n;
  const justHit = before < data.goal && data.days[key] >= data.goal;
  if (justHit && !data.bonus[key]) {
    data.bonus[key] = true;
    toast(`🌬️ 風がとおった！ ご縁 +${GOAL_BONUS}`);
    if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 160]);
    chime(true);
    setMood('yay'); clearTimeout(yayTimer);
    yayTimer = setTimeout(() => { mood = 'idle'; autoMood(); }, 3500);
    setTimeout(() => say(stateLine()), 600);
  }
  save(); render();
  el.stage.classList.remove('step'); void el.stage.offsetWidth; el.stage.classList.add('step');
  if (!silent && !justHit && n >= 10) say(pick(L.react.added, Math.floor(Math.random() * 100)));
}
function setStepsTo(v, silent) {
  const diff = v - stepsToday();
  if (diff > 0) addSteps(diff, silent);
}

let toastTimer = null;
function toast(msg) {
  el.toast.textContent = msg; el.toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2600);
}

/* ===== チリン（カナデの風鈴） ===== */
let audioCtx = null;
function chime(big) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const notes = big ? [2093, 2637, 3136] : [2637, 3136];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.09);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.09 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.09 + 1.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1.3);
    });
  } catch (e) {}
  el.frame.classList.remove('ring'); void el.frame.offsetWidth; el.frame.classList.add('ring');
}
// 最初のタップで一度だけ鳴らす（スマホは操作がないと音が出せない）
let chimed = false;
document.addEventListener('pointerdown', () => { if (!chimed) { chimed = true; chime(false); } }, { once: true });

/* ===== 歩数アプリの数字に合わせる ===== */
el.syncBtn.addEventListener('click', () => {
  const v = Math.floor(Number(el.syncInput.value));
  if (!Number.isFinite(v) || v <= 0) { say(pick(L.react.empty, 0)); return; }
  if (v <= stepsToday()) { say(pick(L.react.same, 0)); return; }
  setStepsTo(v);
  el.syncInput.value = '';
});

/* ===== さんぽモード（加速度センサー・試し用） ===== */
let tracking = false, gravity = null, smooth = 0, above = false, lastStepAt = 0, gotSensor = false, sensorCheck = null, wakeLock = null;
function onMotion(e) {
  const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
  gotSensor = true;
  const mag = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
  if (gravity === null) gravity = mag;
  gravity += (mag - gravity) * 0.1;
  const hp = mag - gravity; smooth += (hp - smooth) * 0.5;
  const now = Date.now();
  if (!above && smooth > STEP_THRESH) { above = true; if (now - lastStepAt > STEP_MIN_MS) { lastStepAt = now; addSteps(1, true); } }
  else if (above && smooth < STEP_THRESH * 0.5) above = false;
}
async function requestWakeLock() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
async function startTracking() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try { if (await DeviceMotionEvent.requestPermission() !== 'granted') { el.status.textContent = 'センサーの許可がもらえなかったよ'; showManual(); return; } }
    catch (e) { el.status.textContent = 'センサーが使えないみたい'; showManual(); return; }
  }
  if (!('DeviceMotionEvent' in window)) { el.status.textContent = 'この端末はセンサーが使えないみたい'; showManual(); return; }
  gravity = null; smooth = 0; above = false; gotSensor = false;
  window.addEventListener('devicemotion', onMotion);
  tracking = true; el.start.textContent = 'ストップ'; el.start.classList.add('on');
  el.status.textContent = '画面をつけたまま歩いてね（アプリ版では自動になります）';
  autoMood(); requestWakeLock();
  sensorCheck = setTimeout(() => { if (!gotSensor) { el.status.textContent = 'センサーの反応がないみたい。下のボタンで足せるよ'; showManual(); } }, 4000);
}
function stopTracking() {
  window.removeEventListener('devicemotion', onMotion);
  tracking = false; clearTimeout(sensorCheck);
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  el.start.textContent = 'さんぽモードをためす'; el.start.classList.remove('on');
  el.status.textContent = '';
  if (mood !== 'yay') setMood(stepsToday() >= data.goal ? 'goal' : (stepsToday() > 0 ? 'done' : 'idle'));
  say(stateLine());
}
function showManual() { el.manual.classList.add('show'); }
el.start.addEventListener('click', () => tracking ? stopTracking() : startTracking());
el.manual.addEventListener('click', (e) => { const n = Number(e.target.dataset.add); if (n) addSteps(n); });
el.goal.addEventListener('change', () => { data.goal = Number(el.goal.value); save(); render(); say(stateLine()); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (tracking) requestWakeLock(); render(); } });

/* ===== 確認用パネル（URLに ?debug=1 を付けたときだけ表示） ===== */
const debugOn = /[?&]debug=1/.test(location.search);
if (el.pvSteps && !debugOn) { document.getElementById('preview').remove(); el.pvSteps = null; }
if (el.pvSteps) {
  el.pvSteps.max = String(Math.max(10000, data.goal * 2));
  el.pvSteps.value = String(stepsToday()); el.pvStepsVal.textContent = fmt(stepsToday());
  el.pvSteps.addEventListener('input', () => {
    const v = Number(el.pvSteps.value); el.pvStepsVal.textContent = fmt(v);
    const key = today();
    if (v < (data.days[key] || 0)) { data.days[key] = v; delete data.bonus[key]; save(); render(); say(stateLine()); }
    else setStepsTo(v, true);
    if (v >= data.goal) { /* 達成の演出は addSteps 内で */ } else { mood = 'idle'; autoMood(); }
  });
  el.pvTime.addEventListener('change', () => { forcedTime = el.pvTime.value || null; render(); chime(false); });
  el.pvStreak.addEventListener('click', () => {
    // 昨日から3日ぶん達成済みにする（連続の見た目を確認する用）
    for (let i = 1; i <= 3; i++) { const d = new Date(); d.setDate(d.getDate() - i); data.days[dateKey(d)] = data.goal; data.bonus[dateKey(d)] = true; }
    save(); render(); say(stateLine());
  });
  el.pvReset.addEventListener('click', () => { data = { days: {}, bonus: {}, goal: data.goal }; save(); el.pvSteps.value = '0'; el.pvStepsVal.textContent = '0'; mood = 'idle'; render(); showOpeningLines(); });
}

/* ===== Androidアプリ（箱）との連携 =====
   window.PopoNative があれば、スマホ本体の歩数センサー（電源オンからの累計）をもらう。
   前回もらった値との差分を「きょうの風」に足す。 */
const isApp = !!window.PopoNative;
let nativeTimer = null;
function nativeSync() {
  if (!isApp) return;
  try {
    if (!PopoNative.hasSensor()) { el.syncNote.textContent = 'この端末には歩数センサーがないみたい。手で入れてね'; el.sync.classList.remove('auto'); return; }
    if (!PopoNative.hasPermission()) { PopoNative.requestPermission(); return; }
    const c = Number(PopoNative.getStepCounter());
    if (!(c >= 0)) { clearTimeout(nativeTimer); nativeTimer = setTimeout(nativeSync, 1500); return; } // センサーの最初の値待ち
    const key = today(), last = data.native;
    if (!last) { data.native = { counter: c, date: key }; save(); el.syncNote.textContent = '自動で数えはじめたよ。ここからの歩数が風になる'; return; }
    let delta = c >= last.counter ? c - last.counter : c;   // 再起動でカウンタが戻ったら、起動後の分だけ
    data.native = { counter: c, date: key };
    if (delta > 0) addSteps(delta, true); else save();
    el.syncNote.textContent = '自動で数えているよ（' + new Date().toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'}) + ' に確認）';
  } catch (e) {}
}
window.onPopoNative = (kind, value) => {
  if (kind === 'steps' || kind === 'permission') nativeSync();
};
if (isApp) {
  document.body.classList.add('app');
  el.sync.classList.add('auto');
  el.syncNote.textContent = '自動で数えているよ';
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') nativeSync(); });
  setTimeout(nativeSync, 800);
}

/* ===== 起動 ===== */
render();
showOpeningLines();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
