const GOAL = 8;
const WEEKS = 16;
const LOG_KEY = 'waterLog';
const UNDO_KEY = 'waterUndoStack';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || {}; }
  catch { return {}; }
}

function saveLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

function loadUndoStack() {
  try { return JSON.parse(localStorage.getItem(UNDO_KEY)) || []; }
  catch { return []; }
}

function saveUndoStack(stack) {
  localStorage.setItem(UNDO_KEY, JSON.stringify(stack));
}

function logWater(amount) {
  const log = loadLog();
  const key = todayKey();
  log[key] = (log[key] || 0) + amount;
  saveLog(log);

  const stack = loadUndoStack();
  stack.push(amount);
  saveUndoStack(stack);

  renderToday(log[key]);
  renderHeatmap(log);
}

function undo() {
  const stack = loadUndoStack();
  if (!stack.length) return;

  const last = stack.pop();
  saveUndoStack(stack);

  const log = loadLog();
  const key = todayKey();
  log[key] = Math.max(0, (log[key] || 0) - last);
  if (log[key] === 0) delete log[key];
  saveLog(log);

  renderToday(log[key] || 0);
  renderHeatmap(log);
}

function renderToday(cups) {
  const fill = document.getElementById('bottle-fill');
  const label = document.getElementById('bottle-label');
  const motivation = document.getElementById('motivation');

  const pct = Math.min((cups / GOAL) * 100, 100);
  fill.style.height = pct + '%';
  fill.classList.toggle('goal-met', cups >= GOAL);
  label.textContent = `${cups} / ${GOAL} cups`;

  if (cups === 0)        motivation.textContent = 'Start drinking!';
  else if (cups < 3)     motivation.textContent = 'Good start, keep it up!';
  else if (cups < 6)     motivation.textContent = 'Halfway there, nice work!';
  else if (cups < GOAL)  motivation.textContent = 'Almost there!';
  else if (cups === GOAL) motivation.textContent = 'Goal reached! Great job!';
  else                   motivation.textContent = `${cups} cups — crushing it!`;
}

function cupsToLevel(cups) {
  if (cups === 0) return '0';
  if (cups >= GOAL) return 'goal';
  if (cups >= 6) return '4';
  if (cups >= 4) return '3';
  if (cups >= 2) return '2';
  return '1';
}

function renderHeatmap(log) {
  const heatmap = document.getElementById('heatmap');
  const monthLabels = document.getElementById('month-labels');
  heatmap.innerHTML = '';
  monthLabels.innerHTML = '';

  // Build array of dates: WEEKS*7 days ending today, aligned to Sun
  const today = new Date();
  // Find the Sunday on or after today to close the grid
  const endDay = new Date(today);
  endDay.setDate(endDay.getDate() + (6 - today.getDay()));

  const startDay = new Date(endDay);
  startDay.setDate(startDay.getDate() - (WEEKS * 7 - 1));

  const tooltip = document.getElementById('tooltip');
  const monthSeen = {};

  for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const cups = log[key] || 0;
    const level = d > today ? '' : cupsToLevel(cups);

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    if (level) cell.setAttribute('data-level', level);

    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const pct = Math.round((cups / GOAL) * 100);
    cell.addEventListener('mousemove', (e) => {
      tooltip.textContent = d > today
        ? label
        : `${label} — ${cups} cup${cups !== 1 ? 's' : ''} (${pct}%)`;
      tooltip.classList.add('visible');
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top  = (e.clientY - 28) + 'px';
    });
    cell.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));

    heatmap.appendChild(cell);

    // Month label: place on first day of each month
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const colIndex = Math.floor((d - startDay) / (1000 * 60 * 60 * 24 * 7));
    if (d.getDate() === 1 && !monthSeen[month]) {
      monthSeen[month] = true;
      const span = document.createElement('span');
      span.className = 'month-label';
      span.textContent = month;
      // each column = 14px cell + 2px gap = 16px, offset by day-labels width (36px)
      span.style.left = (colIndex * 16) + 'px';
      monthLabels.appendChild(span);
    }
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const log = loadLog();
  const todayCups = log[todayKey()] || 0;
  renderToday(todayCups);
  renderHeatmap(log);
});
