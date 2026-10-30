/**
 * Storage & Data Model for DayWise
 * Handles multi-user authentication, persistent user profile with base salary,
 * dynamic budget overrides (more/less money days) with auto-rebalancing,
 * day-of-week fixed expense deductions, expense tracking, and savings vault computations.
 */

const STORAGE_KEYS = {
  USERS: 'daywise_users_db',
  ACTIVE_USER: 'daywise_active_session',
};

class DayWiseStorage {
  constructor() {
    this.initDefaultUsers();
  }

  // Initialize users storage cleanly without demo seed
  initDefaultUsers() {
    let existing = null;
    try {
      existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    } catch (e) {
      existing = null;
    }

    if (!existing) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify({}));
    } else if (existing['alex'] && existing['alex'].name === 'Alex Sharma') {
      // Remove any lingering default demo user
      delete existing['alex'];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existing));
      if (localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) === 'alex') {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
      }
    }
  }

  getAllUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || {};
    } catch (e) {
      return {};
    }
  }

  saveAllUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getActiveUsername() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || null;
  }

  setActiveUsername(username) {
    if (username) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, username);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }

  getActiveUser() {
    const uname = this.getActiveUsername();
    if (!uname) return null;
    const users = this.getAllUsers();
    const user = users[uname];
    if (user) {
      if (!user.currency) user.currency = '₹';
      if (!user.dayBudgetOverrides) user.dayBudgetOverrides = {};
      if (!user.fixedExpenses) user.fixedExpenses = [];
      if (!user.baseSalary) user.baseSalary = 60000;
      if (!user.name) user.name = uname.charAt(0).toUpperCase() + uname.slice(1);
    }
    return user || null;
  }

  saveActiveUserData(userData) {
    const users = this.getAllUsers();
    users[userData.username] = userData;
    this.saveAllUsers(users);
  }

  register(username, password, currency = '₹', baseSalary = 60000) {
    if (!username || typeof username !== 'string' || /\s/.test(username)) {
      throw new Error('Username must not contain any spaces.');
    }
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      throw new Error('Username and password are required.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }
    const users = this.getAllUsers();
    const isTaken = Object.keys(users).some(u => u.toLowerCase() === cleanUser);
    if (isTaken || users[cleanUser]) {
      throw new Error('A user with this username already exists. Please choose a different username.');
    }

    users[cleanUser] = {
      username: cleanUser,
      name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
      password: password,
      currency: currency || '₹',
      baseSalary: Number(baseSalary) || 60000,
      salaries: {},
      expenses: [],
      closedDays: [],
      dayBudgetOverrides: {},
      fixedExpenses: [],
    };

    this.saveAllUsers(users);
    this.setActiveUsername(cleanUser);
    return users[cleanUser];
  }

  login(username, password) {
    if (!username || typeof username !== 'string' || /\s/.test(username)) {
      throw new Error('Username must not contain any spaces.');
    }
    const cleanUser = username.trim().toLowerCase();
    const users = this.getAllUsers();
    const matchKey = Object.keys(users).find(u => u.toLowerCase() === cleanUser) || cleanUser;
    const user = users[matchKey];

    if (!user || user.password !== password) {
      throw new Error('Invalid username or password.');
    }

    if (!user.currency) user.currency = '₹';
    if (!user.dayBudgetOverrides) user.dayBudgetOverrides = {};
    if (!user.fixedExpenses) user.fixedExpenses = [];
    if (!user.baseSalary) user.baseSalary = 60000;

    this.saveAllUsers(users);
    this.setActiveUsername(cleanUser);
    return user;
  }

  logout() {
    this.setActiveUsername(null);
  }

  updateProfile(name, baseSalary, currency) {
    const user = this.getActiveUser();
    if (!user) return;
    if (name) user.name = name.trim();
    if (baseSalary) user.baseSalary = Number(baseSalary);
    if (currency) user.currency = currency;
    this.saveActiveUserData(user);
    return user;
  }

  getDaysInMonth(year, month1Indexed) {
    return new Date(year, month1Indexed, 0).getDate();
  }

  setSalary(yearMonth, amount, currency = '₹') {
    const user = this.getActiveUser();
    if (!user) return;
    if (!user.salaries) user.salaries = {};
    user.salaries[yearMonth] = Number(amount);
    user.baseSalary = Number(amount); // Also updates base salary so it persists forever
    if (currency) user.currency = currency;
    this.saveActiveUserData(user);
  }

  getSalary(yearMonth) {
    const user = this.getActiveUser();
    if (!user) return 0;
    // User does not need to enter salary every month. Defaults to user's baseSalary!
    if (user.salaries && user.salaries[yearMonth]) {
      return Number(user.salaries[yearMonth]);
    }
    return Number(user.baseSalary) || 0;
  }

  // --- Dynamic Budget Overrides (Need more/less money on specific days) ---
  setDayBudgetOverride(dateStr, customAmount) {
    const user = this.getActiveUser();
    if (!user) return;
    if (!user.dayBudgetOverrides) user.dayBudgetOverrides = {};

    if (customAmount === null || customAmount === undefined || isNaN(customAmount) || customAmount <= 0) {
      delete user.dayBudgetOverrides[dateStr];
    } else {
      user.dayBudgetOverrides[dateStr] = parseFloat(Number(customAmount).toFixed(2));
    }
    this.saveActiveUserData(user);
  }

  getDayBudgetOverride(dateStr) {
    const user = this.getActiveUser();
    if (!user || !user.dayBudgetOverrides) return null;
    return user.dayBudgetOverrides[dateStr] || null;
  }

  getTodayDateStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * For past days (d < today): returns their locked historical budget.
   * Never changes when new adjustments are made today or in future.
   */
  getHistoricalBaseBudget(dateStr) {
    const override = this.getDayBudgetOverride(dateStr);
    if (override !== null && override !== undefined) {
      return override;
    }
    const ym = dateStr.substring(0, 7);
    const salary = this.getSalary(ym);
    const [y, m] = ym.split('-').map(Number);
    const totalDays = this.getDaysInMonth(y, m);
    return totalDays > 0 ? (salary / totalDays) : 0;
  }

  /**
   * Calculates standard budget for current day and days to come.
   * Past days are locked so their savings/loss are never affected.
   * Any adjustment is absorbed only by today and future days in that month!
   */
  getStandardDayBudget(yearMonth, referenceTodayStr = null) {
    const user = this.getActiveUser();
    if (!user) return 0;
    const salary = this.getSalary(yearMonth);
    if (salary <= 0) return 0;

    const [y, m] = yearMonth.split('-').map(Number);
    const totalDays = this.getDaysInMonth(y, m);

    const todayStr = referenceTodayStr || this.getTodayDateStr();
    const currentYearMonth = todayStr.substring(0, 7);

    // If viewing a past month: all days are past, standard rate was salary / days
    if (yearMonth < currentYearMonth) {
      return salary / totalDays;
    }

    // If viewing a future month: today hasn't happened, all days are future
    if (yearMonth > currentYearMonth) {
      let sumCustom = 0;
      let customCount = 0;
      for (let d = 1; d <= totalDays; d++) {
        const dStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
        const ov = this.getDayBudgetOverride(dStr);
        if (ov !== null) {
          sumCustom += ov;
          customCount++;
        }
      }
      const remDays = totalDays - customCount;
      return remDays > 0 ? Math.max(0, salary - sumCustom) / remDays : 0;
    }

    // Current active month:
    // 1. Calculate past days' committed base budgets (locked)
    let pastBudgetCommitted = 0;
    let pastDaysCount = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
      if (dStr < todayStr) {
        pastDaysCount++;
        pastBudgetCommitted += this.getHistoricalBaseBudget(dStr);
      }
    }

    // 2. Remaining salary pool for today and days to come
    const futurePool = Math.max(0, salary - pastBudgetCommitted);

    // 3. Check for overrides on today and future days
    let sumFutureCustom = 0;
    let futureCustomCount = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
      if (dStr >= todayStr) {
        const ov = this.getDayBudgetOverride(dStr);
        if (ov !== null) {
          sumFutureCustom += ov;
          futureCustomCount++;
        }
      }
    }

    // 4. Standard days remaining in today + future
    const totalFutureDays = totalDays - pastDaysCount;
    const standardFutureDays = totalFutureDays - futureCustomCount;

    if (standardFutureDays <= 0) {
      return 0; // All remaining days have custom targets
    }

    const remainingForStandardFuture = Math.max(0, futurePool - sumFutureCustom);
    return remainingForStandardFuture / standardFutureDays;
  }

  /**
   * Base daily budget before deducting fixed recurring expenses:
   * - If day has custom target: returns custom target.
   * - If day is in past (d < today): returns locked historical budget (protects past savings/loss!).
   * - If day is today or future (d >= today): returns rebalanced standard future limit.
   */
  getBaseDailyBudget(dateStr, referenceTodayStr = null) {
    const override = this.getDayBudgetOverride(dateStr);
    if (override !== null && override !== undefined) {
      return override;
    }

    const todayStr = referenceTodayStr || this.getTodayDateStr();

    // Past days are locked to their historical budget!
    if (dateStr < todayStr) {
      return this.getHistoricalBaseBudget(dateStr);
    }

    // Today and future days absorb any adjustments and rebalance
    return this.getStandardDayBudget(dateStr.substring(0, 7), todayStr);
  }


  // --- Fixed Recurring Expenses per Day of Week ---
  getFixedExpenses() {
    const user = this.getActiveUser();
    if (!user || !user.fixedExpenses) return [];
    return user.fixedExpenses;
  }

  addFixedExpense(title, amount, daysOfWeek) {
    const user = this.getActiveUser();
    if (!user) return null;
    if (!user.fixedExpenses) user.fixedExpenses = [];

    const newFix = {
      id: 'fix_' + Date.now(),
      title: title.trim(),
      amount: parseFloat(Number(amount).toFixed(2)),
      daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek.map(Number) : [],
      active: true,
      createdAt: new Date().toISOString(),
    };

    user.fixedExpenses.push(newFix);
    this.saveActiveUserData(user);
    return newFix;
  }

  deleteFixedExpense(id) {
    const user = this.getActiveUser();
    if (!user || !user.fixedExpenses) return;
    user.fixedExpenses = user.fixedExpenses.filter(f => f.id !== id);
    this.saveActiveUserData(user);
  }

  toggleFixedExpense(id) {
    const user = this.getActiveUser();
    if (!user || !user.fixedExpenses) return;
    const fix = user.fixedExpenses.find(f => f.id === id);
    if (fix) {
      fix.active = !fix.active;
      this.saveActiveUserData(user);
    }
  }

  /**
   * Get active fixed expenses applicable on this date's day of the week
   */
  getFixedExpensesForDate(dateStr) {
    const user = this.getActiveUser();
    if (!user || !user.fixedExpenses) return [];

    const [y, m, d] = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0 is Sunday, 1 is Monday...

    return user.fixedExpenses.filter(f => f.active && f.daysOfWeek.includes(dayOfWeek));
  }

  getFixedDeductionsTotal(dateStr) {
    const matching = this.getFixedExpensesForDate(dateStr);
    return matching.reduce((sum, item) => sum + item.amount, 0);
  }

  /**
   * Net spendable budget limit for this day:
   * Base Day Budget (custom or standard) - Fixed Recurring Deductions for that day
   */
  getSpendableDailyBudget(dateStr) {
    const base = this.getBaseDailyBudget(dateStr);
    const fixedDeductions = this.getFixedDeductionsTotal(dateStr);
    return Math.max(0, base - fixedDeductions);
  }

  // --- Expenses & Day Tracking ---
  addExpense(dateStr, title, amount, category) {
    const user = this.getActiveUser();
    if (!user) return null;
    if (!user.expenses) user.expenses = [];

    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: dateStr,
      title: title.trim(),
      amount: parseFloat(Number(amount).toFixed(2)),
      category: category || 'Other',
      createdAt: new Date().toISOString(),
    };

    user.expenses.push(newExpense);
    this.saveActiveUserData(user);
    return newExpense;
  }

  deleteExpense(expenseId) {
    const user = this.getActiveUser();
    if (!user || !user.expenses) return;
    user.expenses = user.expenses.filter(e => e.id !== expenseId);
    this.saveActiveUserData(user);
  }

  getExpensesForDate(dateStr) {
    const user = this.getActiveUser();
    if (!user || !user.expenses) return [];
    return user.expenses.filter(e => e.date === dateStr);
  }

  getExpensesForMonth(yearMonth) {
    const user = this.getActiveUser();
    if (!user || !user.expenses) return [];
    return user.expenses.filter(e => e.date.startsWith(yearMonth));
  }

  /**
   * Full comprehensive summary for a single day
   */
  getDaySummary(dateStr) {
    const baseBudget = this.getBaseDailyBudget(dateStr);
    const isCustomBudget = this.getDayBudgetOverride(dateStr) !== null;
    const fixedExpenses = this.getFixedExpensesForDate(dateStr);
    const fixedDeductions = this.getFixedDeductionsTotal(dateStr);
    const spendableBudget = Math.max(0, baseBudget - fixedDeductions);

    const expenses = this.getExpensesForDate(dateStr);
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);

    const remaining = spendableBudget - totalSpent;
    const isExceeded = spendableBudget > 0 ? totalSpent > spendableBudget : totalSpent > 0;
    const percentSpent = spendableBudget > 0 ? (totalSpent / spendableBudget) * 100 : (totalSpent > 0 ? 100 : 0);

    return {
      date: dateStr,
      baseBudget,
      isCustomBudget,
      fixedExpenses,
      fixedDeductions,
      dailyBudget: spendableBudget, // The active spend limit
      totalSpent,
      remaining,
      isExceeded,
      exceededAmount: isExceeded ? totalSpent - spendableBudget : 0,
      percentSpent,
      expenses,
    };
  }

  markDayClosed(dateStr) {
    const user = this.getActiveUser();
    if (!user) return;
    if (!user.closedDays) user.closedDays = [];
    if (!user.closedDays.includes(dateStr)) {
      user.closedDays.push(dateStr);
      this.saveActiveUserData(user);
    }
  }

  isDayClosed(dateStr) {
    const user = this.getActiveUser();
    if (!user || !user.closedDays) return false;
    return user.closedDays.includes(dateStr);
  }

  getMonthSavings(yearMonth, todayStr) {
    const user = this.getActiveUser();
    if (!user) return { totalSaved: 0, daysBanked: 0, totalDaysInMonth: 31, savingsRate: 0 };

    const salary = this.getSalary(yearMonth);
    const [y, m] = yearMonth.split('-').map(Number);
    const totalDaysInMonth = this.getDaysInMonth(y, m);

    let totalSaved = 0;
    let daysBanked = 0;
    let totalPotentialBankedBudget = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
      const isPast = dayStr < todayStr;
      const isClosed = this.isDayClosed(dayStr);

      if (isPast || isClosed) {
        daysBanked++;
        const summary = this.getDaySummary(dayStr);
        totalPotentialBankedBudget += summary.dailyBudget;

        if (summary.remaining > 0) {
          totalSaved += summary.remaining;
        }
      }
    }

    const savingsRate = totalPotentialBankedBudget > 0 ? (totalSaved / totalPotentialBankedBudget) * 100 : 0;

    return {
      totalSaved,
      daysBanked,
      totalDaysInMonth,
      savingsRate: Math.round(savingsRate),
      dailyBudget: this.getStandardDayBudget(yearMonth),
      salary,
    };
  }

  /**
   * Analysis Engine supporting Custom Day Overrides and Fixed Deductions
   */
  getAnalysisData(periodType, referenceDateStr) {
    const user = this.getActiveUser();
    if (!user) return null;

    const [refY, refM, refD] = referenceDateStr.split('-').map(Number);
    const refDate = new Date(refY, refM - 1, refD);

    const datesList = [];

    if (periodType === 'this_month') {
      const yearMonth = referenceDateStr.substring(0, 7);
      const totalDays = this.getDaysInMonth(refY, refM);
      for (let d = 1; d <= totalDays; d++) {
        datesList.push(`${yearMonth}-${String(d).padStart(2, '0')}`);
      }
    } else if (periodType === '7_days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() - i);
        datesList.push(this.formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));
      }
    } else if (periodType === '30_days') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() - i);
        datesList.push(this.formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));
      }
    } else if (periodType === '90_days') {
      for (let i = 89; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() - i);
        datesList.push(this.formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));
      }
    }

    let totalSpent = 0;
    let totalBudget = 0;
    let totalSaved = 0;
    let exceededDaysCount = 0;
    let underBudgetDaysCount = 0;

    const categoryTotals = {};
    const daysData = [];

    let peakDay = { date: '', amount: -1 };
    let lowestDay = { date: '', amount: Infinity };

    datesList.forEach(dateStr => {
      const summary = this.getDaySummary(dateStr);
      const spent = summary.totalSpent;
      const dayBudget = summary.dailyBudget;

      summary.expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      });

      totalSpent += spent;
      totalBudget += dayBudget;

      const isPastOrToday = dateStr <= referenceDateStr;

      let saved = 0;
      if (isPastOrToday) {
        if (summary.isExceeded) {
          exceededDaysCount++;
        } else {
          underBudgetDaysCount++;
          saved = Math.max(0, summary.remaining);
          totalSaved += saved;
        }

        if (spent > peakDay.amount) {
          peakDay = { date: dateStr, amount: spent };
        }
        if (spent < lowestDay.amount) {
          lowestDay = { date: dateStr, amount: spent };
        }
      }

      let topItem = null;
      if (summary.expenses.length > 0) {
        topItem = [...summary.expenses].sort((a, b) => b.amount - a.amount)[0];
      }

      const [y, m, d] = dateStr.split('-').map(Number);
      const dayObj = new Date(y, m - 1, d);
      const dayName = dayObj.toLocaleDateString(undefined, { weekday: 'short' });

      daysData.push({
        date: dateStr,
        dayName,
        spent,
        dailyBudget: dayBudget,
        baseBudget: summary.baseBudget,
        fixedDeductions: summary.fixedDeductions,
        isCustomBudget: summary.isCustomBudget,
        isExceeded: summary.isExceeded,
        exceededAmount: summary.exceededAmount,
        savedAmount: saved,
        topItem: topItem ? `${topItem.title} (₹${topItem.amount})` : (summary.fixedDeductions > 0 ? `Fixed Deductions (-₹${summary.fixedDeductions})` : 'None'),
        expensesCount: summary.expenses.length,
        isPastOrToday,
      });
    });

    const activeDaysCount = daysData.filter(d => d.isPastOrToday).length || 1;
    const avgDailySpent = totalSpent / activeDaysCount;
    const avgDailyBudget = totalBudget / datesList.length;
    const savingsRate = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;

    return {
      periodType,
      referenceDateStr,
      datesCount: datesList.length,
      activeDaysCount,
      totalSpent,
      totalBudget,
      totalSaved,
      savingsRate: Math.round(savingsRate),
      avgDailySpent,
      avgDailyBudget,
      exceededDaysCount,
      underBudgetDaysCount,
      peakDay: peakDay.amount >= 0 ? peakDay : null,
      lowestDay: lowestDay.amount !== Infinity ? lowestDay : null,
      categoryTotals,
      days: daysData,
    };
  }

  formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }


}

// Global instance
window.storage = new DayWiseStorage();
