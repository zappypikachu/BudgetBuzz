/**
 * Main Controller for DayWise Dashboard & Financial Analysis Hub
 * Connects authentication, user profile with permanent base salary,
 * dynamic day budget overrides (more/less money days) with auto-rebalancing,
 * weekly fixed recurring deductions, daily tracking, over-limit warnings,
 * multi-period analysis, and automated daily savings vault.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Current date context (Oct 23, 2026 or real system date)
  const systemNow = new Date();
  let currentYear = systemNow.getFullYear();
  let currentMonth = systemNow.getMonth() + 1; // 1-12
  let currentDay = systemNow.getDate();

  // Selected date state
  let selectedDateStr = formatDate(currentYear, currentMonth, currentDay);
  let activeYearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // View state: 'dashboard' or 'analysis'
  let activeView = 'dashboard';
  // Analysis period state: 'this_month', '7_days', '30_days', '90_days'
  let activeAnalysisPeriod = 'this_month';

  // Navigation View Elements
  const navTabDashboard = document.getElementById('navTabDashboard');
  const navTabAnalysis = document.getElementById('navTabAnalysis');
  const dashboardView = document.getElementById('dashboardView');
  const analysisView = document.getElementById('analysisView');

  // DOM Elements: Header & User
  const userNameDisplay = document.getElementById('userNameDisplay');
  const userAvatar = document.getElementById('userAvatar');
  const userBadge = document.getElementById('userBadge');
  const btnOpenProfile = document.getElementById('btnOpenProfile');
  const btnLogout = document.getElementById('btnLogout');
  const btnLoadDemo = document.getElementById('btnLoadDemo');

  // Modals
  const authModal = document.getElementById('authModal');
  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const authUsernameInput = document.getElementById('authUsernameInput');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const authErrorMsg = document.getElementById('authErrorMsg');
  const btnAuthSubmit = document.getElementById('btnAuthSubmit');
  const btnQuickDemoLogin = document.getElementById('btnQuickDemoLogin');

  const salaryModal = document.getElementById('salaryModal');
  const salaryForm = document.getElementById('salaryForm');
  const salaryAmountInput = document.getElementById('salaryAmountInput');
  const salaryCurrencySelect = document.getElementById('salaryCurrencySelect');
  const salaryCurrencySymbol = document.getElementById('salaryCurrencySymbol');
  const previewDailyLimit = document.getElementById('previewDailyLimit');
  const previewDaysCount = document.getElementById('previewDaysCount');
  const btnCancelSalaryModal = document.getElementById('btnCancelSalaryModal');

  // Custom Day Budget Modal
  const customDayBudgetModal = document.getElementById('customDayBudgetModal');
  const customDayBudgetForm = document.getElementById('customDayBudgetForm');
  const customDayDateLabel = document.getElementById('customDayDateLabel');
  const customDayAmountInput = document.getElementById('customDayAmountInput');
  const rebalanceMathText = document.getElementById('rebalanceMathText');
  const btnResetDayBudget = document.getElementById('btnResetDayBudget');
  const btnCancelCustomDayModal = document.getElementById('btnCancelCustomDayModal');
  const btnOpenCustomDayBudget = document.getElementById('btnOpenCustomDayBudget');

  // Profile Modal
  const profileModal = document.getElementById('profileModal');
  const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
  const tabProfileSalary = document.getElementById('tabProfileSalary');
  const tabProfileFixed = document.getElementById('tabProfileFixed');
  const panelProfileSalary = document.getElementById('panelProfileSalary');
  const panelProfileFixed = document.getElementById('panelProfileFixed');
  const profileForm = document.getElementById('profileForm');
  const profileFullNameInput = document.getElementById('profileFullNameInput');
  const profileBaseSalaryInput = document.getElementById('profileBaseSalaryInput');
  const profileCurrencySelect = document.getElementById('profileCurrencySelect');

  // Fixed Expense Elements
  const addFixedExpenseForm = document.getElementById('addFixedExpenseForm');
  const fixedExpenseTitle = document.getElementById('fixedExpenseTitle');
  const fixedExpenseAmount = document.getElementById('fixedExpenseAmount');
  const fixedExpenseDowChips = document.getElementById('fixedExpenseDowChips');
  const fixedExpensesListContainer = document.getElementById('fixedExpensesListContainer');

  // Warning Banner
  const warningBanner = document.getElementById('warningBanner');
  const warningTitle = document.getElementById('warningTitle');
  const warningDesc = document.getElementById('warningDesc');
  const btnDismissWarning = document.getElementById('btnDismissWarning');

  // Stat displays
  const statSalaryDisplay = document.getElementById('statSalaryDisplay');
  const statMonthDays = document.getElementById('statMonthDays');
  const statCurrentMonthName = document.getElementById('statCurrentMonthName');
  const statDailyLimitDisplay = document.getElementById('statDailyLimitDisplay');
  const statDailyFormula = document.getElementById('statDailyFormula');
  const statTodaySpentDisplay = document.getElementById('statTodaySpentDisplay');
  const statTodayRemainingDisplay = document.getElementById('statTodayRemainingDisplay');
  const statSelectedDateTitle = document.getElementById('statSelectedDateTitle');
  const statSavingsVaultDisplay = document.getElementById('statSavingsVaultDisplay');
  const statSavingsRate = document.getElementById('statSavingsRate');
  const statDaysBanked = document.getElementById('statDaysBanked');
  const statProjectedSavings = document.getElementById('statProjectedSavings');

  // Tracker elements
  const trackerHeaderDay = document.getElementById('trackerHeaderDay');
  const badgeSelectedDate = document.getElementById('badgeSelectedDate');
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnTodayQuick = document.getElementById('btnTodayQuick');
  const btnNextDay = document.getElementById('btnNextDay');
  const gaugeSpentText = document.getElementById('gaugeSpentText');
  const gaugeLimitText = document.getElementById('gaugeLimitText');
  const gaugeStatusBadge = document.getElementById('gaugeStatusBadge');
  const gaugeProgressBar = document.getElementById('gaugeProgressBar');
  const gaugePercentText = document.getElementById('gaugePercentText');
  const gaugeRemainingText = document.getElementById('gaugeRemainingText');
  const dayBudgetBreakdownText = document.getElementById('dayBudgetBreakdownText');
  const badgeCustomIndicator = document.getElementById('badgeCustomIndicator');
  const badgeFixedDeductionIndicator = document.getElementById('badgeFixedDeductionIndicator');

  const expenseForm = document.getElementById('expenseForm');
  const expenseTitleInput = document.getElementById('expenseTitleInput');
  const expenseAmountInput = document.getElementById('expenseAmountInput');
  const expenseCategorySelect = document.getElementById('expenseCategorySelect');
  const expenseItemsList = document.getElementById('expenseItemsList');
  const expenseCountText = document.getElementById('expenseCountText');
  const btnBankTodaySavings = document.getElementById('btnBankTodaySavings');
  const bankSavingsBtnLabel = document.getElementById('bankSavingsBtnLabel');

  const calendarMonthTitle = document.getElementById('calendarMonthTitle');
  const monthCalendarGrid = document.getElementById('monthCalendarGrid');
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');

  // Analysis Elements
  const analysisSubtitle = document.getElementById('analysisSubtitle');
  const analysisPeriodTabs = document.getElementById('analysisPeriodTabs');
  const kpiTotalSpent = document.getElementById('kpiTotalSpent');
  const kpiTotalSpentSub = document.getElementById('kpiTotalSpentSub');
  const kpiTotalBudget = document.getElementById('kpiTotalBudget');
  const kpiTotalBudgetSub = document.getElementById('kpiTotalBudgetSub');
  const kpiTotalSaved = document.getElementById('kpiTotalSaved');
  const kpiSavingsRateSub = document.getElementById('kpiSavingsRateSub');
  const kpiAvgSpent = document.getElementById('kpiAvgSpent');
  const kpiAvgLimitSub = document.getElementById('kpiAvgLimitSub');
  const kpiLimitDiscipline = document.getElementById('kpiLimitDiscipline');
  const kpiExceededSub = document.getElementById('kpiExceededSub');
  const kpiPeakDay = document.getElementById('kpiPeakDay');
  const kpiPeakDayDate = document.getElementById('kpiPeakDayDate');
  const timelineChartSubtitle = document.getElementById('timelineChartSubtitle');
  const analysisCategoryContainer = document.getElementById('analysisCategoryContainer');
  const analysisHighlightsText = document.getElementById('analysisHighlightsText');
  const analysisTableBody = document.getElementById('analysisTableBody');
  const analysisTableSub = document.getElementById('analysisTableSub');

  let isRegisterMode = false;
  let isWarningDismissedForDate = {};

  // Selected DOW for Fixed Expense
  let selectedFixedDows = [1]; // default Monday

  // Initialize
  initApp();

  function initApp() {
    setupEventListeners();
    checkAuthSession();
  }

  function checkAuthSession() {
    const user = window.storage.getActiveUser();
    if (!user) {
      showAuthModal(false);
    } else {
      hideAuthModal();
      updateUserNavbar(user);
      checkMonthlySalaryPrompt();
    }
  }

  function checkMonthlySalaryPrompt() {
    const user = window.storage.getActiveUser();
    if (!user) return;

    // Checks user baseSalary or month salary
    const currentSalary = window.storage.getSalary(activeYearMonth);
    if (!currentSalary || currentSalary <= 0) {
      showSalaryModal(true);
    } else {
      hideSalaryModal();
      refreshActiveView();
    }
  }

  // View Switcher: Dashboard vs Analysis
  function switchView(viewName) {
    activeView = viewName;
    if (viewName === 'dashboard') {
      navTabDashboard.classList.add('active');
      navTabAnalysis.classList.remove('active');
      dashboardView.classList.remove('hidden');
      analysisView.classList.add('hidden');
      refreshDashboard();
    } else if (viewName === 'analysis') {
      navTabAnalysis.classList.add('active');
      navTabDashboard.classList.remove('active');
      dashboardView.classList.add('hidden');
      analysisView.classList.remove('hidden');
      renderAnalysisView();
    }
  }

  function refreshActiveView() {
    if (activeView === 'analysis') {
      renderAnalysisView();
    } else {
      refreshDashboard();
    }
  }

  // --- Auth Handlers ---
  function showAuthModal(registerMode = false) {
    isRegisterMode = registerMode;
    authModal.classList.add('active');
    authErrorMsg.style.display = 'none';

    if (isRegisterMode) {
      authTitle.textContent = 'Create New Account';
      authSubtitle.textContent = 'Start tracking your daily expenses in Rupees and grow your savings';
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      btnAuthSubmit.textContent = 'Create Account';
    } else {
      authTitle.textContent = 'Welcome to DayWise';
      authSubtitle.textContent = 'Login with your username and password';
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      btnAuthSubmit.textContent = 'Sign In';
    }
  }

  function hideAuthModal() {
    authModal.classList.remove('active');
    authForm.reset();
  }

  function updateUserNavbar(user) {
    if (!user) return;
    const displayName = user.name || user.username;
    userNameDisplay.textContent = capitalize(displayName);
    userAvatar.textContent = displayName.charAt(0).toUpperCase();
  }

  // --- Profile & Rules Modal ---
  function openProfileModal(tab = 'salary') {
    const user = window.storage.getActiveUser();
    if (!user) return;

    profileFullNameInput.value = user.name || user.username;
    profileBaseSalaryInput.value = user.baseSalary || 60000;
    profileCurrencySelect.value = user.currency || '₹';

    if (tab === 'salary') {
      tabProfileSalary.classList.add('active');
      tabProfileFixed.classList.remove('active');
      panelProfileSalary.style.display = 'block';
      panelProfileFixed.style.display = 'none';
    } else {
      tabProfileFixed.classList.add('active');
      tabProfileSalary.classList.remove('active');
      panelProfileFixed.style.display = 'block';
      panelProfileSalary.style.display = 'none';
      renderFixedExpensesList();
    }

    profileModal.classList.add('active');
  }

  function hideProfileModal() {
    profileModal.classList.remove('active');
  }

  function renderFixedExpensesList() {
    const user = window.storage.getActiveUser();
    const currency = user ? user.currency : '₹';
    const fixedList = window.storage.getFixedExpenses();
    const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (fixedList.length === 0) {
      fixedExpensesListContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.84rem;">
          No fixed weekly deductions added yet. Use the form above to add recurring deductions (e.g. Metro pass, Gym).
        </div>
      `;
      return;
    }

    let html = '';
    fixedList.forEach(item => {
      const daysStr = item.daysOfWeek.map(d => dowNames[d]).join(', ');
      html += `
        <div class="fixed-item-card ${item.active ? '' : 'inactive'}">
          <div class="fixed-item-info">
            <h4>${escapeHtml(item.title)} — ${currency}${item.amount.toFixed(2)}</h4>
            <p>Deducted every: <strong style="color: #cbd5e1;">${daysStr}</strong> • ${item.active ? '<span style="color: #34d399;">Active</span>' : '<span style="color: var(--text-muted);">Paused</span>'}</p>
          </div>
          <div class="fixed-item-actions">
            <button type="button" class="btn btn-ghost btn-sm btn-toggle-fixed" data-id="${item.id}">
              ${item.active ? 'Pause' : 'Activate'}
            </button>
            <button type="button" class="btn-delete-expense btn-delete-fixed" data-id="${item.id}" title="Delete deduction">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    fixedExpensesListContainer.innerHTML = html;

    // Attach listeners
    fixedExpensesListContainer.querySelectorAll('.btn-toggle-fixed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        window.storage.toggleFixedExpense(id);
        renderFixedExpensesList();
        refreshActiveView();
      });
    });

    fixedExpensesListContainer.querySelectorAll('.btn-delete-fixed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        window.storage.deleteFixedExpense(id);
        renderFixedExpensesList();
        showToast('Fixed deduction removed', 'warning');
        refreshActiveView();
      });
    });
  }

  // --- Custom Day Budget (Need More / Less Money) Modal ---
  function openCustomDayBudgetModal() {
    const user = window.storage.getActiveUser();
    const currency = user ? user.currency : '₹';

    customDayDateLabel.textContent = formatReadableDate(selectedDateStr);

    const existingOverride = window.storage.getDayBudgetOverride(selectedDateStr);
    const standardBudget = window.storage.getStandardDayBudget(activeYearMonth);

    customDayAmountInput.value = existingOverride !== null ? existingOverride : Math.round(standardBudget);
    updateRebalancePreviewMath();

    customDayBudgetModal.classList.add('active');
    setTimeout(() => customDayAmountInput.focus(), 100);
  }

  function hideCustomDayBudgetModal() {
    customDayBudgetModal.classList.remove('active');
  }

  function updateRebalancePreviewMath() {
    const user = window.storage.getActiveUser();
    const currency = user ? user.currency : '₹';
    const customAmt = Number(customDayAmountInput.value) || 0;
    const salary = window.storage.getSalary(activeYearMonth);

    const [y, m] = activeYearMonth.split('-').map(Number);
    const totalDays = window.storage.getDaysInMonth(y, m);
    const todayStr = getTodayDateStr();

    // 1. Calculate committed budget for past days (locked)
    let pastDaysCount = 0;
    let pastBudgetCommitted = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${activeYearMonth}-${String(d).padStart(2, '0')}`;
      if (dStr < todayStr) {
        pastDaysCount++;
        pastBudgetCommitted += window.storage.getHistoricalBaseBudget(dStr);
      }
    }

    // 2. Pool for today and future days
    const futurePool = Math.max(0, salary - pastBudgetCommitted);

    // 3. Custom amounts among today and future days (including the pending customAmt for selectedDateStr)
    let sumFutureCustom = 0;
    let futureCustomCount = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${activeYearMonth}-${String(d).padStart(2, '0')}`;
      if (dStr >= todayStr) {
        if (dStr === selectedDateStr) {
          sumFutureCustom += customAmt;
          futureCustomCount++;
        } else {
          const ov = window.storage.getDayBudgetOverride(dStr);
          if (ov !== null) {
            sumFutureCustom += ov;
            futureCustomCount++;
          }
        }
      }
    }

    const totalFutureDays = totalDays - pastDaysCount;
    const standardFutureDays = totalFutureDays - futureCustomCount;
    const remainingForStandard = Math.max(0, futurePool - sumFutureCustom);
    const newStandardDaily = standardFutureDays > 0 ? remainingForStandard / standardFutureDays : 0;

    rebalanceMathText.innerHTML = `
      <div style="margin-bottom: 6px;">
        🔒 <strong>Past Days (1 to ${pastDaysCount || 1}):</strong> Locked &amp; Protected (Historical savings &amp; loss unaffected).
      </div>
      <div>
        📅 <strong>Today &amp; Days to Come:</strong> Remaining pool of <strong>${currency}${futurePool.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong><br>
        Target for ${formatReadableDate(selectedDateStr)}: <strong style="color: #fbbf24;">${currency}${customAmt.toFixed(2)}</strong><br>
        Adjusted limit for other standard future days: <strong style="color: #38bdf8;">${currency}${newStandardDaily.toFixed(2)}/day</strong> (${standardFutureDays} days)
      </div>
    `;
  }


  // --- Initial Monthly Salary Modal Handlers ---
  function showSalaryModal(isMandatoryFirstTime = false) {
    const user = window.storage.getActiveUser();
    const existingSalary = window.storage.getSalary(activeYearMonth);
    const currency = (user && user.currency) || '₹';

    salaryCurrencySelect.value = currency;
    salaryCurrencySymbol.textContent = currency;
    salaryAmountInput.value = existingSalary > 0 ? existingSalary : '';

    const [y, m] = activeYearMonth.split('-').map(Number);
    const totalDays = window.storage.getDaysInMonth(y, m);
    previewDaysCount.textContent = totalDays;
    updateSalaryPreviewMath();

    if (isMandatoryFirstTime) {
      btnCancelSalaryModal.style.display = 'none';
      document.getElementById('salaryModalTitle').textContent = `Set Monthly Salary (${getMonthName(m)} ${y})`;
    } else {
      btnCancelSalaryModal.style.display = 'inline-flex';
      document.getElementById('salaryModalTitle').textContent = `Update Monthly Salary (${getMonthName(m)} ${y})`;
    }

    salaryModal.classList.add('active');
    setTimeout(() => salaryAmountInput.focus(), 100);
  }

  function hideSalaryModal() {
    salaryModal.classList.remove('active');
  }

  function updateSalaryPreviewMath() {
    const amount = Number(salaryAmountInput.value) || 0;
    const currency = salaryCurrencySelect.value;
    salaryCurrencySymbol.textContent = currency;

    const [y, m] = activeYearMonth.split('-').map(Number);
    const totalDays = window.storage.getDaysInMonth(y, m);
    previewDaysCount.textContent = totalDays;

    const daily = totalDays > 0 ? amount / totalDays : 0;
    previewDailyLimit.textContent = `${currency}${daily.toFixed(2)}`;
  }

  // --- Main Dashboard Refresh ---
  function refreshDashboard() {
    const user = window.storage.getActiveUser();
    if (!user) return;

    const currency = user.currency || '₹';
    const [y, m] = activeYearMonth.split('-').map(Number);
    const totalDaysInMonth = window.storage.getDaysInMonth(y, m);
    const salary = window.storage.getSalary(activeYearMonth);
    const standardDailyBudget = window.storage.getStandardDayBudget(activeYearMonth);

    // 1. Top Stat Cards
    statSalaryDisplay.textContent = `${currency}${salary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    statMonthDays.textContent = `${totalDaysInMonth} days`;
    statCurrentMonthName.textContent = `${getMonthName(m)} ${y}`;

    statDailyLimitDisplay.textContent = `${currency}${standardDailyBudget.toFixed(2)}`;
    statDailyFormula.textContent = `= ${currency}${standardDailyBudget.toFixed(2)}/day`;

    // 2. Day Summary for Selected Date
    const daySummary = window.storage.getDaySummary(selectedDateStr);
    const isToday = selectedDateStr === getTodayDateStr();

    statSelectedDateTitle.textContent = isToday ? "Today's Expense" : `Expense for ${formatReadableDate(selectedDateStr)}`;
    statTodaySpentDisplay.textContent = `${currency}${daySummary.totalSpent.toFixed(2)}`;

    if (daySummary.remaining >= 0) {
      statTodayRemainingDisplay.textContent = `${currency}${daySummary.remaining.toFixed(2)}`;
      statTodayRemainingDisplay.style.color = '#34d399';
    } else {
      statTodayRemainingDisplay.textContent = `-${currency}${Math.abs(daySummary.remaining).toFixed(2)} (Over)`;
      statTodayRemainingDisplay.style.color = '#f87171';
    }

    // 3. Savings Vault Calculations
    const todayStr = getTodayDateStr();
    const monthSavings = window.storage.getMonthSavings(activeYearMonth, todayStr);
    statSavingsVaultDisplay.textContent = `${currency}${monthSavings.totalSaved.toFixed(2)}`;
    statSavingsRate.textContent = `${monthSavings.savingsRate}% of budget saved`;
    statDaysBanked.textContent = `${monthSavings.daysBanked} / ${totalDaysInMonth} days`;

    const avgDailySaved = monthSavings.daysBanked > 0 ? monthSavings.totalSaved / monthSavings.daysBanked : Math.max(0, daySummary.remaining);
    const remainingDaysInMonth = totalDaysInMonth - monthSavings.daysBanked;
    const projectedTotal = monthSavings.totalSaved + (Math.max(0, avgDailySaved) * remainingDaysInMonth);
    statProjectedSavings.textContent = `${currency}${projectedTotal.toFixed(2)}`;

    // 4. Over-Limit Warning Check
    checkExpenseLimitWarning(daySummary, currency);

    // 5. Day Tracker & Gauge
    updateDayTrackerUI(daySummary, currency, isToday);

    // 6. Expense Items List
    renderExpenseItems(daySummary.expenses, currency);

    // 7. Monthly Calendar Grid
    renderCalendarGrid(y, m, standardDailyBudget, currency);

    // 8. Analytics & Charts
    renderAnalytics(activeYearMonth, standardDailyBudget, currency);
  }

  // --- Limit Warning Handler ---
  function checkExpenseLimitWarning(daySummary, currency) {
    if (daySummary.isExceeded) {
      warningTitle.textContent = `⚠️ Daily Limit Exceeded by ${currency}${daySummary.exceededAmount.toFixed(2)}!`;
      warningDesc.textContent = `Your spendable budget limit for ${formatReadableDate(daySummary.date)} is ${currency}${daySummary.dailyBudget.toFixed(2)}, but you have spent ${currency}${daySummary.totalSpent.toFixed(2)} (${Math.round(daySummary.percentSpent)}%).`;

      if (!isWarningDismissedForDate[daySummary.date]) {
        warningBanner.classList.add('active');
      } else {
        warningBanner.classList.remove('active');
      }

      document.getElementById('cardTodaySpent').style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else {
      warningBanner.classList.remove('active');
      document.getElementById('cardTodaySpent').style.borderColor = '';
    }
  }

  // --- Day Tracker UI ---
  function updateDayTrackerUI(daySummary, currency, isToday) {
    trackerHeaderDay.textContent = isToday ? "Today's Expenses" : `Day Expenses`;
    badgeSelectedDate.textContent = formatReadableDate(daySummary.date);

    gaugeSpentText.textContent = `${currency}${daySummary.totalSpent.toFixed(2)}`;
    gaugeLimitText.textContent = `/ ${currency}${daySummary.dailyBudget.toFixed(2)}`;

    const pct = Math.min(100, Math.round(daySummary.percentSpent));
    gaugeProgressBar.style.width = `${pct}%`;
    gaugePercentText.textContent = `${Math.round(daySummary.percentSpent)}% of spendable allowance`;

    if (daySummary.isExceeded) {
      gaugeStatusBadge.textContent = 'Exceeded Limit ⚠️';
      gaugeStatusBadge.className = 'gauge-status-tag danger';
      gaugeProgressBar.className = 'progress-fill danger';
      gaugeRemainingText.textContent = `Over limit by: ${currency}${daySummary.exceededAmount.toFixed(2)}`;
      gaugeRemainingText.style.color = 'var(--danger)';
    } else if (daySummary.percentSpent >= 80) {
      gaugeStatusBadge.textContent = 'Near Limit';
      gaugeStatusBadge.className = 'gauge-status-tag warning';
      gaugeProgressBar.className = 'progress-fill warning';
      gaugeRemainingText.textContent = `Remaining: ${currency}${daySummary.remaining.toFixed(2)}`;
      gaugeRemainingText.style.color = 'var(--warning)';
    } else {
      gaugeStatusBadge.textContent = 'Within Budget ✓';
      gaugeStatusBadge.className = 'gauge-status-tag safe';
      gaugeProgressBar.className = 'progress-fill safe';
      gaugeRemainingText.textContent = `Leftover for savings: ${currency}${daySummary.remaining.toFixed(2)}`;
      gaugeRemainingText.style.color = 'var(--success)';
    }

    // Breakdown text & badges
    let breakdownStr = `Base Day Budget: ${currency}${daySummary.baseBudget.toFixed(2)}`;
    if (daySummary.fixedDeductions > 0) {
      breakdownStr += ` - Fixed: ${currency}${daySummary.fixedDeductions.toFixed(2)} = Net Limit: ${currency}${daySummary.dailyBudget.toFixed(2)}`;
      badgeFixedDeductionIndicator.style.display = 'inline-flex';
      badgeFixedDeductionIndicator.textContent = `📌 Fixed Deductions: -${currency}${daySummary.fixedDeductions}`;
    } else {
      badgeFixedDeductionIndicator.style.display = 'none';
    }
    dayBudgetBreakdownText.textContent = breakdownStr;

    if (daySummary.isCustomBudget) {
      badgeCustomIndicator.style.display = 'inline-flex';
    } else {
      badgeCustomIndicator.style.display = 'none';
    }

    const isClosed = window.storage.isDayClosed(selectedDateStr);
    if (isClosed) {
      btnBankTodaySavings.disabled = true;
      btnBankTodaySavings.classList.remove('btn-success');
      btnBankTodaySavings.classList.add('btn-secondary');
      bankSavingsBtnLabel.textContent = 'Day Banked to Savings ✓';
      document.getElementById('endDayPromptTitle').textContent = 'Day Concluded & Savings Secured';
      document.getElementById('endDayPromptDesc').textContent = `Leftover balance for this day has been locked into your Savings Vault.`;
    } else {
      btnBankTodaySavings.disabled = false;
      btnBankTodaySavings.classList.remove('btn-secondary');
      btnBankTodaySavings.classList.add('btn-success');
      if (daySummary.remaining > 0) {
        bankSavingsBtnLabel.textContent = `Bank ${currency}${daySummary.remaining.toFixed(2)} to Savings`;
        document.getElementById('endDayPromptTitle').textContent = `Wrap Up Day & Secure Savings`;
        document.getElementById('endDayPromptDesc').textContent = `Lock today's unspent ${currency}${daySummary.remaining.toFixed(2)} into your Savings Vault!`;
      } else {
        bankSavingsBtnLabel.textContent = 'Close & Conclude Day';
        document.getElementById('endDayPromptTitle').textContent = 'Conclude Day';
        document.getElementById('endDayPromptDesc').textContent = 'No remaining savings to bank for this day, but you can mark it complete.';
      }
    }
  }

  // --- Expense List UI ---
  function renderExpenseItems(expenses, currency) {
    expenseCountText.textContent = `${expenses.length} ${expenses.length === 1 ? 'entry' : 'entries'}`;

    if (expenses.length === 0) {
      expenseItemsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">☕</div>
          <p style="font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">No discretionary expenses logged for this day yet.</p>
          <span style="font-size: 0.8rem;">Add your daily expenses above in Rupees (₹) to monitor your spending and protect your daily savings!</span>
        </div>
      `;
      return;
    }

    const catIcons = {
      Food: '🍔',
      Transport: '🚗',
      Bills: '💡',
      Shopping: '🛍️',
      Health: '💊',
      Entertainment: '🎬',
      Other: '🏷️'
    };

    let html = '';
    [...expenses].reverse().forEach(item => {
      const icon = catIcons[item.category] || '🏷️';
      const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      html += `
        <div class="expense-item" data-id="${item.id}">
          <div class="expense-left">
            <div class="expense-category-icon">${icon}</div>
            <div class="expense-info">
              <h4>${escapeHtml(item.title)}</h4>
              <span>${escapeHtml(item.category)} • ${timeStr}</span>
            </div>
          </div>
          <div class="expense-right">
            <span class="expense-amount">${currency}${item.amount.toFixed(2)}</span>
            <button class="btn-delete-expense" data-delete-id="${item.id}" title="Delete expense">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    expenseItemsList.innerHTML = html;

    expenseItemsList.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-id');
        window.storage.deleteExpense(id);
        showToast('Expense removed', 'warning');
        refreshActiveView();
      });
    });
  }

  // --- Monthly Calendar Grid ---
  function renderCalendarGrid(year, month, standardBudget, currency) {
    calendarMonthTitle.textContent = `${getMonthName(month)} ${year}`;

    const totalDays = window.storage.getDaysInMonth(year, month);
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const todayStr = getTodayDateStr();

    let html = '';

    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="cal-day-cell other-month"></div>`;
    }

    for (let d = 1; d <= totalDays; d++) {
      const cellDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daySummary = window.storage.getDaySummary(cellDateStr);
      const isToday = cellDateStr === todayStr;
      const isSelected = cellDateStr === selectedDateStr;
      const isPast = cellDateStr < todayStr;
      const isClosed = window.storage.isDayClosed(cellDateStr);

      let statusClass = '';
      let statusLabel = '';

      if (daySummary.totalSpent > 0 || isPast || isClosed) {
        if (daySummary.isExceeded) {
          statusClass = 'status-warning';
          statusLabel = `-${currency}${Math.round(daySummary.exceededAmount)}`;
        } else if (daySummary.dailyBudget > 0 && (isPast || isClosed)) {
          statusClass = 'status-saved';
          const saved = Math.max(0, daySummary.remaining);
          statusLabel = `+${currency}${Math.round(saved)}`;
        } else if (daySummary.totalSpent > 0) {
          statusClass = 'status-open';
          statusLabel = `${currency}${Math.round(daySummary.totalSpent)}`;
        }
      }

      const activeClass = isToday ? 'is-today' : '';
      const selectedClass = isSelected ? 'is-selected' : '';
      const customClass = daySummary.isCustomBudget ? 'is-custom-budget' : '';
      const fixedClass = daySummary.fixedDeductions > 0 ? 'has-fixed-deduction' : '';

      html += `
        <div class="cal-day-cell ${statusClass} ${activeClass} ${selectedClass} ${customClass} ${fixedClass}" data-date="${cellDateStr}" title="${cellDateStr}: Spent ${currency}${daySummary.totalSpent.toFixed(2)} | Limit: ${currency}${daySummary.dailyBudget.toFixed(2)}${daySummary.isCustomBudget ? ' (Custom Target)' : ''}">
          <div class="cal-day-num">${d}</div>
          <div class="cal-day-status">${statusLabel}</div>
        </div>
      `;
    }

    monthCalendarGrid.innerHTML = html;

    monthCalendarGrid.querySelectorAll('.cal-day-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const date = e.currentTarget.getAttribute('data-date');
        if (date) {
          selectedDateStr = date;
          refreshDashboard();
        }
      });
    });
  }

  // --- Analytics & Charts (Bottom Dashboard Widget) ---
  function renderAnalytics(yearMonth, dailyBudget, currency) {
    const expenses = window.storage.getExpensesForMonth(yearMonth);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const last7DaysData = [];
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);

    for (let i = 6; i >= 0; i--) {
      const past = new Date(targetDate);
      past.setDate(targetDate.getDate() - i);
      const str = formatDate(past.getFullYear(), past.getMonth() + 1, past.getDate());
      const sum = window.storage.getDaySummary(str);
      last7DaysData.push({
        date: str,
        spent: sum.totalSpent,
      });
    }

    window.visuals.renderBarChart('barChartContainer', last7DaysData, currency, dailyBudget);

    const catTotals = {};
    expenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    document.getElementById('categoryTotalText').textContent = `Total: ${currency}${totalSpent.toFixed(2)}`;
    window.visuals.renderCategoryBreakdown('categoryBreakdownContainer', catTotals, totalSpent, currency);
  }

  // --- FULL FINANCIAL ANALYSIS HUB CONTROLLER ---
  function renderAnalysisView() {
    const user = window.storage.getActiveUser();
    if (!user) return;

    const currency = user.currency || '₹';
    const analysis = window.storage.getAnalysisData(activeAnalysisPeriod, selectedDateStr);
    if (!analysis) return;

    const periodLabels = {
      'this_month': 'Daily Spend (This Month)',
      '7_days': 'Last 7 Days',
      '30_days': 'Last 1 Month (30 Days)',
      '90_days': 'Last 90 Days'
    };
    analysisSubtitle.textContent = `Analyzing ${periodLabels[activeAnalysisPeriod]} up to ${formatReadableDate(selectedDateStr)}`;

    // 1. KPI Cards
    kpiTotalSpent.textContent = `${currency}${analysis.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    kpiTotalSpentSub.textContent = `Across ${analysis.activeDaysCount} recorded days`;

    kpiTotalBudget.textContent = `${currency}${analysis.totalBudget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    kpiTotalBudgetSub.textContent = `Cumulative daily allowances`;

    kpiTotalSaved.textContent = `${currency}${analysis.totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    kpiSavingsRateSub.textContent = `${analysis.savingsRate}% overall savings rate`;

    kpiAvgSpent.textContent = `${currency}${analysis.avgDailySpent.toFixed(2)}`;
    kpiAvgLimitSub.textContent = `vs ${currency}${analysis.avgDailyBudget.toFixed(2)}/day budget`;

    kpiLimitDiscipline.textContent = `${analysis.underBudgetDaysCount} / ${analysis.activeDaysCount} Days`;
    kpiExceededSub.textContent = `${analysis.exceededDaysCount} days exceeded limit`;

    if (analysis.peakDay && analysis.peakDay.date) {
      kpiPeakDay.textContent = `${currency}${analysis.peakDay.amount.toFixed(2)}`;
      kpiPeakDayDate.textContent = `on ${formatReadableDate(analysis.peakDay.date)}`;
    } else {
      kpiPeakDay.textContent = `${currency}0.00`;
      kpiPeakDayDate.textContent = 'None';
    }

    // 2. Timeline Bars Chart
    timelineChartSubtitle.textContent = `Timeline of daily spending across ${periodLabels[activeAnalysisPeriod]}`;
    window.visuals.renderTimelineBars('analysisTimelineBars', analysis.days, currency, analysis.avgDailyBudget);

    // 3. Category Breakdown for Period
    window.visuals.renderCategoryBreakdown('analysisCategoryContainer', analysis.categoryTotals, analysis.totalSpent, currency);

    // 4. Performance Highlights Narrative
    const disciplinePct = Math.round((analysis.underBudgetDaysCount / (analysis.activeDaysCount || 1)) * 100);
    analysisHighlightsText.innerHTML = `
      In the selected <strong>${periodLabels[activeAnalysisPeriod]}</strong>, you spent a total of <strong>${currency}${analysis.totalSpent.toLocaleString('en-IN')}</strong> against an allocated budget of <strong>${currency}${analysis.totalBudget.toLocaleString('en-IN')}</strong>.<br><br>
      You maintained strict daily limit discipline <strong>${disciplinePct}%</strong> of the time (${analysis.underBudgetDaysCount} out of ${analysis.activeDaysCount} days under budget), which successfully banked <strong>${currency}${analysis.totalSaved.toLocaleString('en-IN')}</strong> into your <strong>Savings Vault</strong>!
    `;

    // 5. Day-by-Day Historical Audit Log Table
    analysisTableSub.textContent = `Displaying ${analysis.days.length} entries for ${periodLabels[activeAnalysisPeriod]}`;
    let tableHtml = '';

    [...analysis.days].reverse().forEach(row => {
      let statusBadge = '';
      if (row.isExceeded) {
        statusBadge = `<span class="badge-status exceeded">⚠️ Exceeded by ${currency}${row.exceededAmount.toFixed(2)}</span>`;
      } else if (row.isPastOrToday && row.savedAmount > 0) {
        statusBadge = `<span class="badge-status saved">+${currency}${row.savedAmount.toFixed(2)} Banked</span>`;
      } else if (row.spent > 0) {
        statusBadge = `<span class="badge-status neutral">${currency}${row.spent.toFixed(2)} Spent</span>`;
      } else {
        statusBadge = `<span class="badge-status neutral">No Expenses</span>`;
      }

      tableHtml += `
        <tr>
          <td style="font-weight: 600; font-family: var(--font-mono);">
            ${row.date} ${row.isCustomBudget ? '<span style="color: #fbbf24;" title="Custom Target">⭐</span>' : ''}
          </td>
          <td>${row.dayName}</td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: ${row.isExceeded ? '#f87171' : 'inherit'};">
            ${currency}${row.spent.toFixed(2)}
          </td>
          <td style="font-family: var(--font-mono); color: var(--text-muted);">
            ${currency}${row.dailyBudget.toFixed(2)} ${row.fixedDeductions > 0 ? `<small style="color: #c084fc;">(-₹${row.fixedDeductions})</small>` : ''}
          </td>
          <td>${statusBadge}</td>
          <td style="color: var(--text-secondary); font-size: 0.82rem;">${escapeHtml(row.topItem)}</td>
        </tr>
      `;
    });

    analysisTableBody.innerHTML = tableHtml;
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Nav View Switching
    navTabDashboard.addEventListener('click', () => switchView('dashboard'));
    navTabAnalysis.addEventListener('click', () => switchView('analysis'));

    // Profile & Rules Modal triggers
    btnOpenProfile.addEventListener('click', () => openProfileModal('salary'));
    userBadge.addEventListener('click', () => openProfileModal('salary'));
    btnCloseProfileModal.addEventListener('click', hideProfileModal);

    // Profile Modal Tabs
    tabProfileSalary.addEventListener('click', () => {
      tabProfileSalary.classList.add('active');
      tabProfileFixed.classList.remove('active');
      panelProfileSalary.style.display = 'block';
      panelProfileFixed.style.display = 'none';
    });

    tabProfileFixed.addEventListener('click', () => {
      tabProfileFixed.classList.add('active');
      tabProfileSalary.classList.remove('active');
      panelProfileFixed.style.display = 'block';
      panelProfileSalary.style.display = 'none';
      renderFixedExpensesList();
    });

    // Profile Form Submit (Permanent Base Salary)
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = profileFullNameInput.value.trim();
      const baseSalary = Number(profileBaseSalaryInput.value);
      const currency = profileCurrencySelect.value || '₹';

      if (!baseSalary || baseSalary <= 0) {
        showToast('Please enter a valid base salary greater than 0', 'error');
        return;
      }

      window.storage.updateProfile(name, baseSalary, currency);
      updateUserNavbar(window.storage.getActiveUser());
      hideProfileModal();
      showToast(`Profile updated! Base salary ₹${baseSalary.toLocaleString('en-IN')} saved permanently across months.`, 'success');
      window.visuals.triggerConfetti();
      refreshActiveView();
    });

    // Fixed Expense DOW chip selection
    fixedExpenseDowChips.querySelectorAll('.dow-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const day = Number(e.currentTarget.getAttribute('data-day'));
        if (selectedFixedDows.includes(day)) {
          selectedFixedDows = selectedFixedDows.filter(d => d !== day);
          e.currentTarget.classList.remove('selected');
        } else {
          selectedFixedDows.push(day);
          e.currentTarget.classList.add('selected');
        }
      });
    });

    // Add Fixed Recurring Expense
    addFixedExpenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = fixedExpenseTitle.value.trim();
      const amount = Number(fixedExpenseAmount.value);

      if (!title || !amount || amount <= 0) {
        showToast('Please provide a title and amount for the fixed deduction', 'error');
        return;
      }

      if (selectedFixedDows.length === 0) {
        showToast('Please select at least one day of the week for this deduction', 'error');
        return;
      }

      window.storage.addFixedExpense(title, amount, selectedFixedDows);
      fixedExpenseTitle.value = '';
      fixedExpenseAmount.value = '';
      renderFixedExpensesList();
      showToast(`Added recurring deduction "${title}" (₹${amount})!`, 'success');
      refreshActiveView();
    });

    // Custom Day Budget Modal triggers
    btnOpenCustomDayBudget.addEventListener('click', openCustomDayBudgetModal);
    btnCancelCustomDayModal.addEventListener('click', hideCustomDayBudgetModal);
    customDayAmountInput.addEventListener('input', updateRebalancePreviewMath);

    customDayBudgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = Number(customDayAmountInput.value);
      if (!amount || amount <= 0) {
        showToast('Please enter a valid target budget amount', 'error');
        return;
      }

      window.storage.setDayBudgetOverride(selectedDateStr, amount);
      hideCustomDayBudgetModal();
      showToast(`Custom target of ₹${amount.toLocaleString('en-IN')} saved for ${formatReadableDate(selectedDateStr)}. Month auto-rebalanced!`, 'success');
      window.visuals.triggerConfetti();
      refreshActiveView();
    });

    btnResetDayBudget.addEventListener('click', () => {
      window.storage.setDayBudgetOverride(selectedDateStr, null);
      hideCustomDayBudgetModal();
      showToast(`Reset ${formatReadableDate(selectedDateStr)} back to standard auto-balanced daily limit.`, 'warning');
      refreshActiveView();
    });

    // Analysis Period Tabs
    document.querySelectorAll('#analysisPeriodTabs .period-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('#analysisPeriodTabs .period-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeAnalysisPeriod = e.currentTarget.getAttribute('data-period');
        renderAnalysisView();
      });
    });

    // Auth Tab Switchers
    tabLogin.addEventListener('click', () => showAuthModal(false));
    tabRegister.addEventListener('click', () => showAuthModal(true));

    // Auth Form Submit
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const uname = authUsernameInput.value.trim();
      const pword = authPasswordInput.value;

      try {
        if (isRegisterMode) {
          window.storage.register(uname, pword, '₹', 60000);
          showToast(`Account created! Welcome, ${uname}!`, 'success');
        } else {
          window.storage.login(uname, pword);
          showToast(`Welcome back, ${uname}!`, 'success');
        }
        hideAuthModal();
        updateUserNavbar(window.storage.getActiveUser());
        checkMonthlySalaryPrompt();
      } catch (err) {
        authErrorMsg.textContent = err.message;
        authErrorMsg.style.display = 'block';
      }
    });

    // 1-Click Demo Login
    btnQuickDemoLogin.addEventListener('click', () => {
      window.storage.setActiveUsername('alex');
      const user = window.storage.getActiveUser();
      window.storage.loadDemoDataset('2026-10', 23);
      hideAuthModal();
      updateUserNavbar(user);
      showToast('Logged in as Alex with custom day targets & weekly fixed deductions pre-configured!', 'success');
      refreshActiveView();
    });

    // Logout
    btnLogout.addEventListener('click', () => {
      window.storage.logout();
      showToast('Logged out successfully.', 'warning');
      showAuthModal(false);
    });

    // Load Demo Data Button (90 Days)
    btnLoadDemo.addEventListener('click', () => {
      window.storage.loadDemoDataset(activeYearMonth, 23);
      showToast('Loaded realistic dataset with custom targets & fixed deductions!', 'success');
      window.visuals.playTone('success');
      refreshActiveView();
    });

    // Add Expense Form
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = expenseTitleInput.value.trim();
      const amount = parseFloat(expenseAmountInput.value);
      const category = expenseCategorySelect.value;

      if (!title || isNaN(amount) || amount <= 0) {
        showToast('Please provide a valid description and amount.', 'error');
        return;
      }

      const added = window.storage.addExpense(selectedDateStr, title, amount, category);
      if (added) {
        expenseTitleInput.value = '';
        expenseAmountInput.value = '';
        expenseTitleInput.focus();

        const updatedSummary = window.storage.getDaySummary(selectedDateStr);
        const user = window.storage.getActiveUser();
        const currency = user ? user.currency : '₹';

        if (updatedSummary.isExceeded) {
          isWarningDismissedForDate[selectedDateStr] = false;
          window.visuals.playTone('warning');
          showToast(`⚠️ Warning! Daily limit exceeded by ${currency}${updatedSummary.exceededAmount.toFixed(2)}`, 'error');
        } else {
          showToast(`Logged "${title}" (${currency}${amount.toFixed(2)})`, 'success');
        }

        refreshActiveView();
      }
    });

    // Category Quick Chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        expenseCategorySelect.value = cat;
        expenseTitleInput.focus();
      });
    });

    // Bank Today Leftover to Savings Vault Button
    btnBankTodaySavings.addEventListener('click', () => {
      const summary = window.storage.getDaySummary(selectedDateStr);
      const user = window.storage.getActiveUser();
      const currency = user ? user.currency : '₹';

      window.storage.markDayClosed(selectedDateStr);

      if (summary.remaining > 0) {
        showToast(`🎉 Banked ${currency}${summary.remaining.toFixed(2)} to your Savings Vault!`, 'success');
        window.visuals.playTone('success');
        window.visuals.triggerConfetti();
      } else {
        showToast(`Day closed and recorded.`, 'warning');
      }

      refreshActiveView();
    });

    // Warning Banner Dismiss
    btnDismissWarning.addEventListener('click', () => {
      isWarningDismissedForDate[selectedDateStr] = true;
      warningBanner.classList.remove('active');
    });

    // Date Navigation: Prev / Next / Today
    btnPrevDay.addEventListener('click', () => {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - 1);
      selectedDateStr = formatDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
      refreshActiveView();
    });

    btnNextDay.addEventListener('click', () => {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + 1);
      selectedDateStr = formatDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
      refreshActiveView();
    });

    btnTodayQuick.addEventListener('click', () => {
      selectedDateStr = getTodayDateStr();
      refreshActiveView();
    });

    // Month Navigation: Prev / Next Month
    btnPrevMonth.addEventListener('click', () => {
      let [y, m] = activeYearMonth.split('-').map(Number);
      m--;
      if (m < 1) {
        m = 12;
        y--;
      }
      activeYearMonth = `${y}-${String(m).padStart(2, '0')}`;
      selectedDateStr = `${activeYearMonth}-01`;
      checkMonthlySalaryPrompt();
    });

    btnNextMonth.addEventListener('click', () => {
      let [y, m] = activeYearMonth.split('-').map(Number);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
      activeYearMonth = `${y}-${String(m).padStart(2, '0')}`;
      selectedDateStr = `${activeYearMonth}-01`;
      checkMonthlySalaryPrompt();
    });

    // Initial Salary setup form submit
    salaryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = Number(salaryAmountInput.value);
      const currency = salaryCurrencySelect.value || '₹';

      if (!amount || amount <= 0) {
        alert('Please enter a valid monthly salary greater than 0.');
        return;
      }

      window.storage.setSalary(activeYearMonth, amount, currency);
      hideSalaryModal();
      showToast(`Monthly salary set to ${currency}${amount.toLocaleString('en-IN')}! Saved permanently in your profile.`, 'success');
      window.visuals.triggerConfetti();
      refreshActiveView();
    });
  }

  // --- Helper Functions ---
  function getTodayDateStr() {
    return formatDate(currentYear, currentMonth, currentDay);
  }

  function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function formatReadableDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getMonthName(monthNumber) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || '';
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '✓';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = 'ℹ️';

    toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
});
