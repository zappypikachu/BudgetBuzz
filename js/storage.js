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

  // Pre-seed a default demo user if no users exist
  initDefaultUsers() {
    const existing = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existing) {
      const defaultUsers = {
        'alex': {
          username: 'alex',
          name: 'Alex Sharma',
          password: 'password123',
          currency: '₹',
          baseSalary: 62000, // Fixed base salary across all months
          salaries: {},
          expenses: [],
          closedDays: [],
          dayBudgetOverrides: {
            '2026-10-24': 4500, // Saturday: Needs more money for weekend event
            '2026-10-27': 800,  // Tuesday: Needs less money (quiet home day)
          },
          fixedExpenses: [
            {
              id: 'fix_1',
              title: 'Metro Pass Weekly Reload',
              amount: 400,
              daysOfWeek: [1], // Monday
              active: true,
            },
            {
              id: 'fix_2',
              title: 'Weekend Fitness / Sports Club',
              amount: 600,
              daysOfWeek: [6], // Saturday
              active: true,
            }
          ],
        }
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
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
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      throw new Error('Username and password are required');
    }
    const users = this.getAllUsers();
    if (users[cleanUser]) {
      throw new Error('Username already exists. Please choose another or sign in.');
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
    const cleanUser = username.trim().toLowerCase();
    const users = this.getAllUsers();
    const user = users[cleanUser];

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

  /**
   * Pre-load realistic 90-day demo dataset for the active user in Indian Rupees (₹)
   * with custom high/low budget days and fixed weekly deductions pre-configured!
   */
  loadDemoDataset(yearMonth = '2026-10', todayDay = 23) {
    const user = this.getActiveUser();
    if (!user) return;

    user.currency = '₹';
    user.baseSalary = 62000;
    user.salaries = user.salaries || {};

    // 4 months
    user.salaries['2026-07'] = 62000;
    user.salaries['2026-08'] = 62000;
    user.salaries['2026-09'] = 60000;
    user.salaries['2026-10'] = 62000;

    // Day budget overrides (more/less money days)
    user.dayBudgetOverrides = {
      '2026-10-24': 4500, // Saturday: Weekend party / celebration (needs more money)
      '2026-10-27': 800,  // Tuesday: Frugal day at home (needs less money)
    };

    // Fixed weekly recurring expenses
    user.fixedExpenses = [
      {
        id: 'fix_1',
        title: 'Metro Pass Weekly Reload',
        amount: 400,
        daysOfWeek: [1], // Monday
        active: true,
      },
      {
        id: 'fix_2',
        title: 'Weekend Sports & Club',
        amount: 600,
        daysOfWeek: [6], // Saturday
        active: true,
      }
    ];

    const samplePool = [
      { title: 'Morning Filter Coffee & Dosa', cat: 'Food', amount: 120 },
      { title: 'Metro Commute & Auto', cat: 'Transport', amount: 150 },
      { title: 'Weekly Vegetables & Supermarket', cat: 'Shopping', amount: 650 },
      { title: 'Team Thali Lunch', cat: 'Food', amount: 320 },
      { title: 'Broadband Fiber Bill', cat: 'Bills', amount: 899 },
      { title: 'Electricity Utility Bill', cat: 'Bills', amount: 1450 },
      { title: 'Pharmacy Vitamins & Medicines', cat: 'Health', amount: 380 },
      { title: 'Weekend Movie & Popcorn', cat: 'Entertainment', amount: 620 },
      { title: 'Dinner Zomato Takeout', cat: 'Food', amount: 480 },
      { title: 'Cab / Uber Ride', cat: 'Transport', amount: 260 },
      { title: 'Clothing & Apparel Shopping', cat: 'Shopping', amount: 1800 },
      { title: 'Mobile Postpaid Recharge', cat: 'Bills', amount: 499 },
      { title: 'Gym & Fitness Membership', cat: 'Health', amount: 1200 },
    ];

    user.expenses = [];
    user.closedDays = [];

    const refDate = new Date(2026, 9, todayDay); // Oct 23, 2026

    for (let i = 89; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() - i);
      const dateStr = this.formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const isPast = i > 0;

      const dayMod = (i * 7 + d.getDate()) % 11;

      if (dayMod === 3) {
        user.expenses.push({
          id: `demo_${i}_1`,
          date: dateStr,
          title: 'Electronics / Gadget Purchase',
          amount: 2200,
          category: 'Shopping',
          createdAt: d.toISOString()
        });
        user.expenses.push({
          id: `demo_${i}_2`,
          date: dateStr,
          title: 'Special Dinner Party',
          amount: 950,
          category: 'Food',
          createdAt: d.toISOString()
        });
      } else if (dayMod === 7) {
        user.expenses.push({
          id: `demo_${i}_1`,
          date: dateStr,
          title: samplePool[(i * 3) % samplePool.length].title,
          amount: 850,
          category: 'Shopping',
          createdAt: d.toISOString()
        });
        user.expenses.push({
          id: `demo_${i}_2`,
          date: dateStr,
          title: samplePool[(i * 2 + 1) % samplePool.length].title,
          amount: 550,
          category: 'Food',
          createdAt: d.toISOString()
        });
      } else {
        const item1 = samplePool[(i * 2) % samplePool.length];
        const item2 = samplePool[(i * 4 + 3) % samplePool.length];
        user.expenses.push({
          id: `demo_${i}_1`,
          date: dateStr,
          title: item1.title,
          amount: item1.amount,
          category: item1.cat,
          createdAt: d.toISOString()
        });
        user.expenses.push({
          id: `demo_${i}_2`,
          date: dateStr,
          title: item2.title,
          amount: item2.amount,
          category: item2.cat,
          createdAt: d.toISOString()
        });
      }

      if (isPast) {
        user.closedDays.push(dateStr);
      }
    }

    this.saveActiveUserData(user);
  }
}

// Global instance
window.storage = new DayWiseStorage();
