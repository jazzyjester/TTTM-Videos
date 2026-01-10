/**
 * Configuration and Constants
 * Contains Firebase config and application constants
 */

// Firebase configuration
const FIREBASE_CONFIG = {
  projectId: "tttm-extension",
  apiKey: "AIzaSyAfJSJ8JuiVyTQKSFsBd9kITDxHJ946rXA"
};

// YouTube Data API configuration
// IMPORTANT: Replace 'YOUR_YOUTUBE_API_KEY_HERE' with your actual YouTube Data API v3 key
const YOUTUBE_CONFIG = {
  apiKey: "AIzaSyCV_0aE8oGYzhpmvy1nKfKgXqEtHCKZ0WI",
  enabled: true // Set to true after adding your API key
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
const EVENT_SORT_PRIORITY = ['ליגת על', 'ליגה לאומית', 'ליגה ארצית', 'ליגה א', 'ליגת נוער', 'ליגת קדטים', 'ליגת מיני קדטים'];

// Export for other modules
window.APP_CONFIG = {
  FIREBASE_CONFIG,
  YOUTUBE_CONFIG,
  DATE_LABELS,
  EVENT_SORT_PRIORITY
};
