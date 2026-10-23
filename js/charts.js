/**
 * Lightweight Visualizations & Effects for DayWise
 * - 7-day spend vs budget bar chart
 * - Category breakdown distribution
 * - Celebration canvas confetti
 * - Web Audio API feedback tones
 */

class DayWiseVisuals {
  constructor() {
    this.canvas = document.getElementById('confettiCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
    this.particles = [];
    this.animatingConfetti = false;
    this.audioCtx = null;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Play subtle UI tones using Web Audio API
  playTone(type = 'warning') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (type === 'warning') {
        // Subtle warning beep
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(370, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'success') {
        // Uplifting success arpeggio
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.09, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.32);
        });
      }
    } catch (e) {
      // Audio autoplay may be prevented before user interaction
    }
  }

  // Render 7-day spending vs daily budget bar chart
  renderBarChart(containerId, daysData, currency, dailyBudget) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!daysData || daysData.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem; margin: auto;">No recent data</div>';
      return;
    }

    const maxSpend = Math.max(dailyBudget * 1.3, ...daysData.map(d => d.spent));
    const maxHeight = 85; // px

    let html = '';
    daysData.forEach(item => {
      const heightPercent = maxSpend > 0 ? (item.spent / maxSpend) * 100 : 0;
      const heightPx = Math.max(4, (heightPercent / 100) * maxHeight);
      const isOver = dailyBudget > 0 && item.spent > dailyBudget;
      const barClass = isOver ? 'chart-bar over' : 'chart-bar';
      const label = item.date.split('-').slice(1).join('/'); // MM/DD

      html += `
        <div class="chart-bar-wrap" title="${label}: ${currency}${item.spent.toFixed(2)} (Limit: ${currency}${dailyBudget.toFixed(2)})">
          <div style="font-size: 0.65rem; color: ${isOver ? 'var(--danger)' : 'var(--text-secondary)'}; margin-bottom: 4px; font-family: var(--font-mono);">
            ${item.spent > 0 ? `${currency}${Math.round(item.spent)}` : ''}
          </div>
          <div class="${barClass}" style="height: ${heightPx}px;"></div>
          <span class="chart-bar-label">${label}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Render category breakdown with progress bars
  renderCategoryBreakdown(containerId, categoryTotals, totalMonthSpent, currency) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const categories = Object.keys(categoryTotals);
    if (categories.length === 0 || totalMonthSpent === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem; padding: 12px 0;">No expenses logged for this month yet.</div>';
      return;
    }

    // Sort descending by amount
    const sorted = categories.map(cat => ({
      name: cat,
      amount: categoryTotals[cat],
      percent: Math.round((categoryTotals[cat] / totalMonthSpent) * 100)
    })).sort((a, b) => b.amount - a.amount);

    const categoryIcons = {
      Food: '🍔',
      Transport: '🚗',
      Bills: '💡',
      Shopping: '🛍️',
      Health: '💊',
      Entertainment: '🎬',
      Other: '🏷️'
    };

    let html = '';
    sorted.slice(0, 5).forEach(item => {
      const icon = categoryIcons[item.name] || '🏷️';
      html += `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
            <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
              <span>${icon}</span> ${item.name}
            </span>
            <span style="font-family: var(--font-mono); font-weight: 600;">
              ${currency}${item.amount.toFixed(2)} <span style="color: var(--text-muted); font-size: 0.75rem;">(${item.percent}%)</span>
            </span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${item.percent}%; background: var(--brand-gradient); border-radius: 999px;"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Render multi-day Analysis timeline bars with budget target line
  renderTimelineBars(containerId, daysData, currency, avgBudget) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!daysData || daysData.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); margin: auto;">No records found for this period.</div>';
      return;
    }

    const maxSpend = Math.max(avgBudget * 1.35, ...daysData.map(d => d.spent));
    const maxHeight = 160; // px

    // Position of horizontal budget threshold line
    const thresholdHeightPx = maxSpend > 0 ? (avgBudget / maxSpend) * maxHeight : 0;
    const thresholdBottomPx = Math.max(10, thresholdHeightPx);

    let html = `
      <div class="budget-threshold-line" style="bottom: ${thresholdBottomPx}px;">
        <span class="budget-threshold-label">Daily Limit: ${currency}${Math.round(avgBudget)}</span>
      </div>
    `;

    daysData.forEach(d => {
      const heightPercent = maxSpend > 0 ? (d.spent / maxSpend) * 100 : 0;
      const heightPx = Math.max(2, (heightPercent / 100) * maxHeight);

      let coreClass = 'timeline-bar-core';
      if (d.isExceeded) {
        coreClass += ' over';
      } else if (d.spent > 0 && d.spent < d.dailyBudget * 0.6) {
        coreClass += ' frugal';
      }

      const dateParts = d.date.split('-');
      const shortDate = `${dateParts[1]}/${dateParts[2]}`; // MM/DD
      const tooltip = `${d.date} (${d.dayName}): Spent ${currency}${d.spent.toFixed(2)} | Budget: ${currency}${d.dailyBudget.toFixed(2)}${d.isExceeded ? ' [EXCEEDED]' : ` [Saved ${currency}${d.savedAmount.toFixed(2)}]`}`;

      html += `
        <div class="timeline-bar-column" title="${tooltip}">
          <div class="${coreClass}" style="height: ${heightPx}px;"></div>
          <span class="timeline-bar-date-label">${shortDate}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }


  // Confetti Animation
  triggerConfetti() {
    if (!this.canvas || !this.ctx) return;
    this.resizeCanvas();

    const colors = ['#10b981', '#34d399', '#6366f1', '#8b5cf6', '#fbbf24', '#f43f5e', '#38bdf8'];
    this.particles = [];

    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: window.innerWidth * (0.3 + Math.random() * 0.4),
        y: window.innerHeight * 0.5,
        w: 8 + Math.random() * 8,
        h: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: -8 - Math.random() * 12,
        gravity: 0.35,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    if (!this.animatingConfetti) {
      this.animatingConfetti = true;
      this.animateConfettiLoop();
    }
  }

  animateConfettiLoop() {
    if (!this.animatingConfetti) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let activeCount = 0;
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;
      p.opacity -= 0.012;

      if (p.opacity > 0 && p.y < this.canvas.height) {
        activeCount++;
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      }
    });

    if (activeCount > 0) {
      requestAnimationFrame(() => this.animateConfettiLoop());
    } else {
      this.animatingConfetti = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.visuals = new DayWiseVisuals();
