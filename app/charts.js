// ============================================================
// MaxIlmu — tiny dependency-free SVG trend chart, used for both
// the hafazan progress graph and the attendance graph
// (admin.html / parent.html).
//
// No CDN charting library: the portal needs to work on a phone
// with a weak or absent connection at demo time, so this renders
// a self-contained inline <svg> from plain data points. Colors
// reference the CSS custom properties from ../styles.css so the
// chart always matches the manuscript palette.
// ============================================================

// points: [{ x: string, y: number }] in chronological order.
// opts: {
//   yMax: top of the y-axis,
//   target: optional dashed reference line value,
//   targetLabel: label drawn next to the target line,
//   emptyMessage: shown instead of a chart when points is empty,
//   ariaLabel: accessible label for the <svg>,
//   formatXLabel(point, index): x-axis tick text,
//   formatTooltip(point): <title> text for each dot,
// }
function renderLineChart(mountEl, points, opts) {
  if (!points.length) {
    mountEl.innerHTML = `<p class="empty-note">${opts.emptyMessage}</p>`;
    return;
  }

  const width = 640;
  const height = 220;
  const padL = 34;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const yMax = opts.yMax;
  const n = points.length;

  const xAt = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v) => padT + plotH - (v / yMax) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.y).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${xAt(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${xAt(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  // Thin out x-axis labels so they never overlap: show at most ~6.
  const labelStep = Math.max(1, Math.ceil(n / 6));
  const xLabels = points.map((p, i) => {
    if (i !== 0 && i !== n - 1 && i % labelStep !== 0) return "";
    return `<text x="${xAt(i).toFixed(1)}" y="${height - 8}" class="chart-axis-label" text-anchor="middle">${opts.formatXLabel(p, i)}</text>`;
  }).join("");

  const dots = points.map((p, i) => `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(p.y).toFixed(1)}" r="3.2" class="chart-dot"><title>${opts.formatTooltip(p)}</title></circle>`).join("");

  const targetLine = typeof opts.target === "number" ? `
    <line x1="${padL}" y1="${yAt(opts.target).toFixed(1)}" x2="${width - padR}" y2="${yAt(opts.target).toFixed(1)}" class="chart-target-line"/>
    <text x="${width - padR}" y="${(yAt(opts.target) - 5).toFixed(1)}" class="chart-target-label" text-anchor="end">${opts.targetLabel}</text>
  ` : "";

  const gradientId = "trendFill" + Math.random().toString(36).slice(2, 8);

  mountEl.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="trend-chart" role="img" aria-label="${opts.ariaLabel}">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--malachite)" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="var(--malachite)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${targetLine}
      <path d="${areaPath}" fill="url(#${gradientId})"/>
      <path d="${linePath}" class="chart-line"/>
      ${dots}
      ${xLabels}
      <text x="${padL}" y="${padT + 4}" class="chart-axis-label" text-anchor="start">${yMax.toFixed(0)}</text>
      <text x="${padL}" y="${padT + plotH}" class="chart-axis-label" text-anchor="start">0</text>
    </svg>
  `;
}

// cumulativePoints: hafazanCumulativePoints(student) — [{date, cumulative, entry}].
// target: state.settings.hafazan.total. unitLabel: e.g. "Juzuk".
function renderHafazanChart(mountEl, cumulativePoints, target, unitLabel) {
  const last = cumulativePoints.length ? cumulativePoints[cumulativePoints.length - 1].cumulative : 0;
  renderLineChart(mountEl, cumulativePoints.map((p) => ({ x: p.date, y: p.cumulative })), {
    yMax: Math.max(target, last) * 1.08,
    target,
    targetLabel: `Sasaran: ${target} ${unitLabel}`,
    emptyMessage: "Belum ada rekod hafazan mingguan.",
    ariaLabel: `Graf kemajuan hafazan mingguan, ${last} daripada ${target} ${unitLabel}`,
    formatXLabel: (p) => formatDateShort(p.x),
    formatTooltip: (p) => `${formatDate(p.x)}: ${p.y} ${unitLabel}`,
  });
}

// ratePoints: attendanceRatePoints(student) — [{month, rate, entry}].
// target: state.settings.attendance.target (a percentage).
function renderAttendanceChart(mountEl, ratePoints, target) {
  const last = ratePoints.length ? ratePoints[ratePoints.length - 1].rate : 0;
  renderLineChart(mountEl, ratePoints.map((p) => ({ x: p.month, y: p.rate })), {
    yMax: 100,
    target,
    targetLabel: `Sasaran: ${target}%`,
    emptyMessage: "Belum ada rekod kehadiran bulanan.",
    ariaLabel: `Graf kehadiran bulanan, ${last}% bulan terkini berbanding sasaran ${target}%`,
    formatXLabel: (p) => formatMonthShort(p.x),
    formatTooltip: (p) => `${formatMonth(p.x)}: ${p.y}%`,
  });
}
