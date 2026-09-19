const API_URL = "http://localhost:4000/api/leetcode/extension";

// Cohesive category palette — pairs a soft fill with a saturated stroke/accent
// so slices, legend dots, and the tooltip dot all read as the same color.
const CATEGORY_COLORS = [
  { fill: "#e0e7ff", stroke: "#6366f1" }, // indigo
  { fill: "#d1fae5", stroke: "#10b981" }, // emerald
  { fill: "#fef3c7", stroke: "#f59e0b" }, // amber
  { fill: "#fee2e2", stroke: "#ef4444" }, // red
  { fill: "#ede9fe", stroke: "#8b5cf6" }, // violet
  { fill: "#fce7f3", stroke: "#ec4899" }, // pink
  { fill: "#ccfbf1", stroke: "#14b8a6" }, // teal
  { fill: "#ffedd5", stroke: "#f97316" }  // orange
];

document.addEventListener('DOMContentLoaded', () => {
  const statusContainer = document.getElementById('status-container');
  const dashboardView = document.getElementById('dashboard-view');
  const settingsView = document.getElementById('settings-view');
  const missingLcState = document.getElementById('missing-lc-state');

  const lcUsername = document.getElementById('lc-username');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const backBtn = document.getElementById('back-btn');

  // Stats elements
  const streakCount = document.getElementById('streak-count');
  const donutTotal = document.getElementById('donut-total');
  const donutLabel = document.getElementById('donut-label');
  const donutContainer = document.getElementById('donut-container');
  const donutTooltip = document.getElementById('donut-tooltip');
  const tooltipDot = document.getElementById('tooltip-dot');
  const tooltipName = document.getElementById('tooltip-name');
  const tooltipCount = document.getElementById('tooltip-count');
  const countEasy = document.getElementById('count-easy');
  const countMedium = document.getElementById('count-medium');
  const countHard = document.getElementById('count-hard');
  const weeklyTracker = document.getElementById('weekly-tracker');

  // View Navigation
  settingsBtn.addEventListener('click', () => {
    dashboardView.style.display = 'none';
    settingsView.style.display = 'block';
  });

  backBtn.addEventListener('click', () => {
    settingsView.style.display = 'none';
    dashboardView.style.display = 'block';
  });

  disconnectBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('guestId');
    window.close();
  });

  // Check current status from background
  chrome.runtime.sendMessage({ type: 'CHECK_STATUS' }, async (response) => {
    statusContainer.style.display = 'none';

    if (!response || !response.leetCodeLinked) {
      missingLcState.style.display = 'block';
    } else {
      // Connected via LeetCode
      lcUsername.textContent = response.username || "Unknown";

      // Fetch stats from server
      await loadStats(response.guestId);

      dashboardView.style.display = 'block';
    }
  });

  function getCoordinatesForPercent(percent, radius) {
    const x = 50 + Math.cos(2 * Math.PI * percent) * radius;
    const y = 50 + Math.sin(2 * Math.PI * percent) * radius;
    return [x, y];
  }

  // Positions the custom tooltip above the hovered slice, clamped against the
  // full popup width (not just the small donut box) — this stays correct even
  // if future category names are longer than what fits in the donut alone.
  function showTooltip(evt, color, name, count) {
    tooltipDot.style.background = color.stroke;
    tooltipName.textContent = name;
    tooltipName.title = name; // full name still reachable if a future name gets truncated
    tooltipCount.textContent = `· ${count}`;

    const containerRect = donutContainer.getBoundingClientRect();
    const popupRect = document.body.getBoundingClientRect();
    const tooltipHalfWidth = 90; // matches .donut-tooltip's max-width / 2
    const edgeMargin = 6;

    const absoluteX = evt.clientX;
    const minAbsoluteX = popupRect.left + tooltipHalfWidth + edgeMargin;
    const maxAbsoluteX = popupRect.right - tooltipHalfWidth - edgeMargin;
    const clampedAbsoluteX = Math.max(minAbsoluteX, Math.min(maxAbsoluteX, absoluteX));

    const x = clampedAbsoluteX - containerRect.left;
    const y = evt.clientY - containerRect.top;

    donutTooltip.style.left = `${x}px`;
    donutTooltip.style.top = `${y}px`;
    donutTooltip.classList.add('visible');
  }

  function hideTooltip() {
    donutTooltip.classList.remove('visible');
  }

  async function loadStats(guestId) {
    if (!guestId) return;

    try {
      const res = await fetch(`${API_URL}/stats`, {
        headers: { "x-extension-guest-id": guestId }
      });
      const data = await res.json();

      if (data.success) {
        // Update Streak
        streakCount.textContent = `${data.currentStreak || 0} day streak!`;

        // Update Stats
        const stats = data.stats;
        donutTotal.textContent = stats.total;
        countEasy.textContent = stats.easy;
        countMedium.textContent = stats.medium;
        countHard.textContent = stats.hard;

        // SVG Donut Chart Logic
        const donutSvg = document.getElementById('donut-svg');
        const legendContainer = document.getElementById('category-legends-container');
        if (legendContainer) legendContainer.innerHTML = '';

        if (donutSvg && stats.total > 0 && data.categories) {
          let currentPct = 0;
          donutSvg.innerHTML = '';

          data.categories.forEach((cat, index) => {
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            let pct = cat.count / stats.total;
            if (pct >= 1) pct = 0.9999; // Prevent full circle overlap bug in SVG arcs

            const startPercent = currentPct;
            const endPercent = currentPct + pct;
            currentPct = endPercent;

            const outerRadius = 46;
            const innerRadius = 30;

            const [startX, startY] = getCoordinatesForPercent(startPercent, outerRadius);
            const [endX, endY] = getCoordinatesForPercent(endPercent, outerRadius);
            const [innerStartX, innerStartY] = getCoordinatesForPercent(startPercent, innerRadius);
            const [innerEndX, innerEndY] = getCoordinatesForPercent(endPercent, innerRadius);

            const largeArcFlag = pct > 0.5 ? 1 : 0;

            const pathData = [
              `M ${startX} ${startY}`,
              `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `L ${innerEndX} ${innerEndY}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
              `Z`
            ].join(' ');

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.setAttribute("fill", color.fill);
            path.setAttribute("stroke", color.stroke);
            path.setAttribute("stroke-width", "1");
            path.style.cursor = "pointer";

            // Hover: swap the donut-hole total for this category, and show
            // the custom tooltip instead of relying on a native title attr.
            path.addEventListener('mouseenter', () => {
              donutLabel.textContent = cat.name;
              donutTotal.textContent = cat.count;
            });

            path.addEventListener('mousemove', (evt) => {
              showTooltip(evt, color, cat.name, cat.count);
            });

            path.addEventListener('mouseleave', () => {
              donutLabel.textContent = 'Total';
              donutTotal.textContent = stats.total;
              hideTooltip();
            });

            donutSvg.appendChild(path);

            // Add to legends with a proportional bar
            if (legendContainer) {
              const item = document.createElement('div');
              item.className = 'legend-item';
              const barWidth = Math.round(pct * 100);
              item.innerHTML = `
                <div class="legend-item-top">
                  <div class="legend-color" style="background: ${color.fill}; border: 1px solid ${color.stroke};"></div>
                  <span class="legend-name">${cat.name}</span>
                  <span class="legend-count">${cat.count}</span>
                </div>
                <div class="legend-bar-track">
                  <div class="legend-bar-fill" style="width: ${barWidth}%; background: ${color.stroke};"></div>
                </div>
              `;
              legendContainer.appendChild(item);
            }
          });
        } else if (donutSvg) {
          // Empty state donut
          donutSvg.innerHTML = `<circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border-color, #e2e8f0)" stroke-width="16" />`;
        }

        // Render Weekly Tracker
        weeklyTracker.innerHTML = '';
        if (data.weeklyActivity) {
          data.weeklyActivity.forEach(day => {
            const col = document.createElement('div');
            col.className = 'day-col';

            const circle = document.createElement('div');
            circle.className = `day-circle ${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''}`;
            circle.textContent = day.active ? '✓' : '';

            const label = document.createElement('span');
            label.className = 'day-label';
            label.textContent = day.dayName;

            col.appendChild(circle);
            col.appendChild(label);
            weeklyTracker.appendChild(col);
          });
        }
      }
    } catch (err) {
      console.error("Failed to load extension stats:", err);
    }
  }
});