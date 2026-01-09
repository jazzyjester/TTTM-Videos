/**
 * Utility Functions
 * Reusable helper functions for HTML escaping, date formatting, etc.
 */

const Utils = {
  /**
   * Escape HTML to prevent XSS attacks and properly handle attributes
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    // Also escape quotes for use in HTML attributes
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  /**
   * Extract YouTube video ID from URL
   */
  extractYouTubeId(url) {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  },

  /**
   * Get YouTube thumbnail URL
   */
  getYouTubeThumbnail(url) {
    const videoId = this.extractYouTubeId(url);
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  },

  /**
   * Format date
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  },

  /**
   * Format time
   */
  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Determine event type from event name
   * Returns: string or null
   */
  getEventType(eventName) {
    if (!eventName) return null;

    if (eventName.includes('על')) return 'ליגת על';
    if (eventName.includes('לאומית')) return 'ליגה לאומית';
    if (eventName.includes('ארצית')) return 'ליגה ארצית';
    if (eventName.includes('ליגת א')) return 'ליגה א';
    if (eventName.includes('נוער')) return 'ליגת נוער';
    if (eventName.includes('קדטים')) return 'ליגת קדטים';
    if (eventName.includes('מיני קדטים')) return 'ליגת מיני קדטים';

    return null;
  },

  /**
   * Get priority for event type (higher = more important)
   */
  getEventTypePriority(eventType) {
    const priorities = {
      'ליגת על': 7,
      'ליגה לאומית': 6,
      'ליגה ארצית': 5,
      'ליגה א': 4,
      'ליגת נוער': 3,
      'ליגת קדטים': 2,
      'ליגת מיני קדטים': 1
    };
    return priorities[eventType] || 0;
  },

  /**
   * Get date badge info for a video
   */
  getDateBadge(video) {
    const videoDate = new Date(video.updatedAt || video.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    if (videoDate >= today) {
      return { label: 'היום', className: 'video-date-badge-today' };
    } else if (videoDate >= yesterday && videoDate < today) {
      return { label: 'אתמול', className: 'video-date-badge-yesterday' };
    } 
    // else if (videoDate >= weekAgo) {
    //   return { label: 'שבוע', className: 'video-date-badge-week' };
    // } else if (videoDate >= monthAgo) {
    //   return { label: 'חודש', className: 'video-date-badge-month' };
    // }
    // If no filter matches, show the actual date
    const formattedDate = videoDate.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    return { label: formattedDate, className: 'video-date-badge-date' };
  }
};

// Export to window
window.Utils = Utils;
