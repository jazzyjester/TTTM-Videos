/**
 * Configuration and Constants
 * Contains Firebase config and application constants
 */

// Firebase configuration
const FIREBASE_CONFIG = {
  projectId: "tttm-extension",
  apiKey: "AIzaSyAfJSJ8JuiVyTQKSFsBd9kITDxHJ946rXA"
};

// Date range labels
const DATE_LABELS = {
  'today': 'היום',
  'yesterday': 'אתמול',
  'week': '7 ימים אחרונים',
  'month': '30 ימים אחרונים',
  '2026': '2026',
  '2025': '2025',
  '2024': '2024'
};

// Event sorting priority
const EVENT_SORT_PRIORITY = ['ליגת על', 'ליגה לאומית', 'ליגה ארצית', 'ליגה א', 'ליגת קדטים', 'ליגת מיני קדטים', 'ליגת נוער'];

// Export for other modules
window.APP_CONFIG = {
  FIREBASE_CONFIG,
  DATE_LABELS,
  EVENT_SORT_PRIORITY
};
