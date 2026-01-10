/**
 * YouTube API Integration
 * Handles fetching video statistics from YouTube Data API v3
 */

const YouTubeAPI = {
  // Cache for video statistics to avoid repeated API calls
  cache: new Map(),
  
  // Batch request queue
  batchQueue: [],
  batchTimeout: null,

  /**
   * Check if YouTube API is enabled and configured
   */
  isEnabled() {
    const config = window.APP_CONFIG?.YOUTUBE_CONFIG;
    return config?.enabled && config?.apiKey && config.apiKey !== 'YOUR_YOUTUBE_API_KEY_HERE';
  },

  /**
   * Format view count with proper number formatting
   */
  formatViewCount(count) {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('he-IL');
  },

  /**
   * Fetch statistics for a single video
   */
  async fetchVideoStats(videoId) {
    if (!this.isEnabled()) {
      return null;
    }

    // Check cache first
    if (this.cache.has(videoId)) {
      return this.cache.get(videoId);
    }

    try {
      const apiKey = window.APP_CONFIG.YOUTUBE_CONFIG.apiKey;
      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('YouTube API error:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const stats = data.items[0].statistics;
        const result = {
          viewCount: stats.viewCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount
        };
        
        // Cache the result
        this.cache.set(videoId, result);
        return result;
      }
    } catch (error) {
      console.error('Error fetching YouTube stats:', error);
    }

    return null;
  },

  /**
   * Fetch statistics for multiple videos in batch
   */
  async fetchBatchVideoStats(videoIds) {
    if (!this.isEnabled() || !videoIds || videoIds.length === 0) {
      return {};
    }

    // Filter out cached videos
    const uncachedIds = videoIds.filter(id => !this.cache.has(id));
    
    if (uncachedIds.length === 0) {
      // All videos are cached
      console.log(`📊 YouTube API: All ${videoIds.length} videos loaded from cache (0 units used)`);
      const results = {};
      videoIds.forEach(id => {
        results[id] = this.cache.get(id);
      });
      return results;
    }

    try {
      const apiKey = window.APP_CONFIG.YOUTUBE_CONFIG.apiKey;
      // YouTube API allows up to 50 video IDs per request
      const batchSize = 50;
      const results = {};
      const totalRequests = Math.ceil(uncachedIds.length / batchSize);
      let requestCount = 0;

      console.log(`📊 YouTube API Debug:`);
      console.log(`   Total videos: ${videoIds.length}`);
      console.log(`   Cached videos: ${videoIds.length - uncachedIds.length}`);
      console.log(`   Videos to fetch: ${uncachedIds.length}`);
      console.log(`   API requests needed: ${totalRequests}`);
      console.log(`   Estimated units: ${totalRequests} (1 unit per request)`);

      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize);
        const ids = batch.join(',');
        const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${apiKey}`;
        
        requestCount++;
        console.log(`   Making request ${requestCount}/${totalRequests} for ${batch.length} videos...`);
        
        const response = await fetch(url);
        if (!response.ok) {
          console.error('YouTube API batch error:', response.status);
          continue;
        }

        const data = await response.json();
        if (data.items) {
          data.items.forEach(item => {
            const stats = {
              viewCount: item.statistics.viewCount,
              likeCount: item.statistics.likeCount,
              commentCount: item.statistics.commentCount
            };
            
            // Cache the result
            this.cache.set(item.id, stats);
            results[item.id] = stats;
          });
        }
      }

      console.log(`✅ YouTube API: Successfully fetched ${Object.keys(results).length} videos`);
      console.log(`📊 Total API units used this session: ${requestCount}`);
      console.log(`💰 Remaining daily quota (approximate): ${10000 - requestCount} units`);


      return results;
    } catch (error) {
      console.error('Error fetching YouTube batch stats:', error);
      return {};
    }
  },

  /**
   * Update view count display for a specific video card
   */
  updateViewCountDisplay(videoId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const viewCountElement = container.querySelector('.youtube-view-count');
    if (!viewCountElement) return;

    const stats = this.cache.get(videoId);
    if (stats && stats.viewCount) {
      viewCountElement.textContent = `${this.formatViewCount(stats.viewCount)} צפיות`;
      viewCountElement.style.display = 'flex';
    }
  },

  /**
   * Clear the cache (useful for refreshing data)
   */
  clearCache() {
    this.cache.clear();
  }
};

// Export for other modules
window.YouTubeAPI = YouTubeAPI;
