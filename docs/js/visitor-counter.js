/**
 * Visitor Counter
 * Global visitor tracking using Firebase Realtime Database
 * Fallback to localStorage for offline/testing
 */

(function() {
  // Firebase Configuration - Replace with your own Firebase project config
  const FIREBASE_CONFIG = {
    databaseURL: 'https://tttm-videos-default-rtdb.firebaseio.com/'
  };
  
  const USE_FIREBASE = true; // Set to true when Firebase is configured
  const STORAGE_KEY_PREFIX = 'tttm_visitor_';
  const TOTAL_KEY = 'total_visits';
  const GA_MEASUREMENT_ID = 'G-H0GG11C76Z';
  
  /**
   * Get today's date as a key (format: YYYY-MM-DD)
   */
  function getTodayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `daily_${year}_${month}_${day}`;
  }

  /**
   * Get counter value from localStorage
   */
  function getCounter(key) {
    try {
      const value = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return 0;
    }
  }

  /**
   * Increment counter in localStorage
   */
  function incrementCounter(key) {
    try {
      const currentValue = getCounter(key);
      const newValue = currentValue + 1;
      localStorage.setItem(STORAGE_KEY_PREFIX + key, newValue.toString());
      return newValue;
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return null;
    }
  }

  /**
   * Format number with commas for better readability
   */
  function formatNumber(num) {
    if (num === null || num === undefined) return '...';
    return num.toLocaleString('he-IL');
  }

  /**
   * Firebase: Increment counter using REST API
   */
  async function incrementFirebaseCounter(key) {
    if (!USE_FIREBASE || !FIREBASE_CONFIG.databaseURL) {
      return null;
    }

    try {
      const url = `${FIREBASE_CONFIG.databaseURL}/counters/${key}.json`;
      
      // Get current value
      const getResponse = await fetch(url);
      const currentValue = await getResponse.json();
      const newValue = (currentValue || 0) + 1;
      
      // Set new value
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newValue)
      });
      
      return newValue;
    } catch (error) {
      console.error('Firebase error:', error);
      return null;
    }
  }

  /**
   * Firebase: Get counter value using REST API
   */
  async function getFirebaseCounter(key) {
    if (!USE_FIREBASE || !FIREBASE_CONFIG.databaseURL) {
      return null;
    }

    try {
      const url = `${FIREBASE_CONFIG.databaseURL}/counters/${key}.json`;
      const response = await fetch(url);
      const value = await response.json();
      return value || 0;
    } catch (error) {
      console.error('Firebase error:', error);
      return null;
    }
  }

  /**
   * Check if we should count this visit (avoid counting page refreshes)
   */
  function shouldCountVisit() {
    const lastVisit = sessionStorage.getItem('tttm_visit_counted');
    if (!lastVisit) {
      sessionStorage.setItem('tttm_visit_counted', Date.now().toString());
      return true;
    }
    return false;
  }

  /**
   * Update the visitor counter display
   */
  async function updateVisitorCounter() {
    const totalViewsEl = document.getElementById('totalViews');
    const todayViewsEl = document.getElementById('todayViews');

    if (!totalViewsEl || !todayViewsEl) {
      console.warn('Visitor counter elements not found');
      return;
    }

    try {
      const todayKey = getTodayKey();
      let totalCount, todayCount;

      // Try Firebase first
      if (USE_FIREBASE && FIREBASE_CONFIG.databaseURL) {
        // Only increment on first visit in this session
        if (shouldCountVisit()) {
          console.log('📊 Counting visit in Firebase...');
          [totalCount, todayCount] = await Promise.all([
            incrementFirebaseCounter(TOTAL_KEY),
            incrementFirebaseCounter(todayKey)
          ]);
          
          if (totalCount !== null) {
            console.log('✅ Firebase - Total:', totalCount, 'Today:', todayCount);
          } else {
            console.log('⚠️ Firebase failed, using localStorage fallback');
            totalCount = incrementCounter(TOTAL_KEY);
            todayCount = incrementCounter(todayKey);
          }
        } else {
          console.log('📊 Fetching counts from Firebase...');
          [totalCount, todayCount] = await Promise.all([
            getFirebaseCounter(TOTAL_KEY),
            getFirebaseCounter(todayKey)
          ]);
          
          if (totalCount === null) {
            totalCount = getCounter(TOTAL_KEY);
            todayCount = getCounter(getTodayKey());
          }
        }
      } else {
        // Use localStorage fallback
        console.log('📊 Using localStorage (Firebase disabled)');
        if (shouldCountVisit()) {
          totalCount = incrementCounter(TOTAL_KEY);
          todayCount = incrementCounter(todayKey);
        } else {
          totalCount = getCounter(TOTAL_KEY);
          todayCount = getCounter(getTodayKey());
        }
      }
      
      // Display counts
      totalViewsEl.textContent = formatNumber(totalCount);
      todayViewsEl.textContent = formatNumber(todayCount);

      // Add tooltip
      const isLocal = !USE_FIREBASE || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocal) {
        totalViewsEl.title = 'מונה מקומי - רק למטרות בדיקה';
        todayViewsEl.title = 'מונה מקומי - רק למטרות בדיקה';
      }
    } catch (error) {
      console.error('Error updating visitor counter:', error);
      totalViewsEl.textContent = 'N/A';
      todayViewsEl.textContent = 'N/A';
    }
  }

  // Initialize counter when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateVisitorCounter);
  } else {
    updateVisitorCounter();
  }
})();
