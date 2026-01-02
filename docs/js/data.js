/**
 * Data Processing
 * Functions for extracting, grouping, and sorting data
 */

const Data = {
  /**
   * Group videos by event
   */
  groupVideosByEvent(videos) {
    const groups = {};
    videos.forEach(video => {
      const event = video.event || 'ללא אירוע';
      if (!groups[event]) {
        groups[event] = [];
      }
      groups[event].push(video);
    });

    // Sort videos within each group by date (newest first)
    Object.keys(groups).forEach(event => {
      groups[event].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
    });

    return groups;
  },

  /**
   * Helper function to process a player (supports doubles)
   */
  processPlayer(playerName, club, eventType, playerMap) {
    // Check if it's a doubles game (contains ':')
    if (playerName && playerName.includes(':')) {
      // Split by ':' and process each player separately
      const playerNames = playerName.split(':').map(n => n.trim());
      playerNames.forEach(name => {
        this.addPlayerToMap(name, club, eventType, playerMap);
      });
    } else if (playerName) {
      // Single player
      this.addPlayerToMap(playerName, club, eventType, playerMap);
    }
  },

  /**
   * Helper function to add a single player to the map
   */
  addPlayerToMap(playerName, club, eventType, playerMap) {
    if (!playerMap.has(playerName)) {
      playerMap.set(playerName, { count: 0, clubs: new Map(), eventType: null });
    }
    const playerData = playerMap.get(playerName);
    playerData.count++;

    if (club) {
      const clubCount = playerData.clubs.get(club) || 0;
      playerData.clubs.set(club, clubCount + 1);
    }

    // Keep the highest priority event type
    if (eventType) {
      const currentPriority = window.Utils.getEventTypePriority(playerData.eventType);
      const newPriority = window.Utils.getEventTypePriority(eventType);
      if (newPriority > currentPriority) {
        playerData.eventType = eventType;
      }
    }
  },

  /**
   * Extract unique players with their clubs, video counts, and event type
   */
  extractPlayers(videos) {
    const playerMap = new Map();

    videos.forEach(video => {
      const eventType = window.Utils.getEventType(video.event);

      // Process current player(s) - supports doubles
      this.processPlayer(video.currentPlayer, video.currentPlayerClub, eventType, playerMap);

      // Process opponent player(s) - supports doubles
      this.processPlayer(video.opponentPlayer, video.opponentClub, eventType, playerMap);
    });

    // Convert to array and find most common club for each player
    return Array.from(playerMap.entries())
      .map(([name, data]) => {
        // Find the most common club for this player
        let mostCommonClub = '';
        let maxClubCount = 0;
        data.clubs.forEach((count, club) => {
          if (count > maxClubCount) {
            maxClubCount = count;
            mostCommonClub = club;
          }
        });

        return {
          name,
          count: data.count,
          club: mostCommonClub,
          eventType: data.eventType
        };
      })
      .sort((a, b) => {
        // Sort by event type first, then by count
        const aPriority = window.Utils.getEventTypePriority(a.eventType);
        const bPriority = window.Utils.getEventTypePriority(b.eventType);
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        return b.count - a.count; // Then by count
      });
  },

  /**
   * Extract unique clubs with video counts and event type
   */
  extractClubs(videos) {
    const clubMap = new Map();

    videos.forEach(video => {
      const eventType = window.Utils.getEventType(video.event);

      if (video.currentPlayerClub) {
        if (!clubMap.has(video.currentPlayerClub)) {
          clubMap.set(video.currentPlayerClub, { count: 0, eventType: null });
        }
        const clubData = clubMap.get(video.currentPlayerClub);
        clubData.count++;

        // Keep the highest priority event type
        if (eventType) {
          const currentPriority = window.Utils.getEventTypePriority(clubData.eventType);
          const newPriority = window.Utils.getEventTypePriority(eventType);
          if (newPriority > currentPriority) {
            clubData.eventType = eventType;
          }
        }
      }

      if (video.opponentClub) {
        if (!clubMap.has(video.opponentClub)) {
          clubMap.set(video.opponentClub, { count: 0, eventType: null });
        }
        const clubData = clubMap.get(video.opponentClub);
        clubData.count++;

        // Keep the highest priority event type
        if (eventType) {
          const currentPriority = window.Utils.getEventTypePriority(clubData.eventType);
          const newPriority = window.Utils.getEventTypePriority(eventType);
          if (newPriority > currentPriority) {
            clubData.eventType = eventType;
          }
        }
      }
    });

    return Array.from(clubMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        eventType: data.eventType
      }))
      .sort((a, b) => {
        // Sort by event type first, then by count
        const aPriority = window.Utils.getEventTypePriority(a.eventType);
        const bPriority = window.Utils.getEventTypePriority(b.eventType);
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        return b.count - a.count; // Then by count
      });
  },

  /**
   * Extract unique events with video counts
   */
  extractEvents(videos) {
    const eventMap = new Map();

    videos.forEach(video => {
      if (video.event) {
        const count = eventMap.get(video.event) || 0;
        eventMap.set(video.event, count + 1);
      }
    });

    // Convert to array and sort by custom order
    return Array.from(eventMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => this.sortEvents(a.name, b.name));
  },

  /**
   * Custom event sorting: ליגת על > לאומית > ארצית > alphabetical
   */
  sortEvents(a, b) {
    const priority = window.APP_CONFIG.EVENT_SORT_PRIORITY;

    const aHas = priority.map(p => a.includes(p));
    const bHas = priority.map(p => b.includes(p));

    for (let i = 0; i < priority.length; i++) {
      if (aHas[i] && !bHas[i]) return -1;
      if (!aHas[i] && bHas[i]) return 1;
      if (aHas[i] && bHas[i]) return a.localeCompare(b, 'he');
    }

    return a.localeCompare(b, 'he');
  },

  /**
   * Check if video is in date range
   */
  isVideoInDateRange(video, range) {
    const videoDate = new Date(video.updatedAt || video.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch(range) {
      case 'today':
        return videoDate >= today;
      case 'yesterday':
        const yesterdayEnd = new Date(today);
        return videoDate >= yesterday && videoDate < yesterdayEnd;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return videoDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return videoDate >= monthAgo;
      case '2024':
        return videoDate.getFullYear() === 2024;
      case '2025':
        return videoDate.getFullYear() === 2025;
      case '2026':
        return videoDate.getFullYear() === 2026;
      default:
        return true;
    }
  },

  /**
   * Count videos in each date range
   */
  countVideosInDateRanges(videos) {
    const counts = {
      today: 0,
      yesterday: 0,
      week: 0,
      month: 0,
      '2024': 0,
      '2025': 0,
      '2026': 0
    };

    videos.forEach(video => {
      if (this.isVideoInDateRange(video, 'today')) counts.today++;
      if (this.isVideoInDateRange(video, 'yesterday')) counts.yesterday++;
      if (this.isVideoInDateRange(video, 'week')) counts.week++;
      if (this.isVideoInDateRange(video, 'month')) counts.month++;
      if (this.isVideoInDateRange(video, '2024')) counts['2024']++;
      if (this.isVideoInDateRange(video, '2025')) counts['2025']++;
      if (this.isVideoInDateRange(video, '2026')) counts['2026']++;
    });

    return counts;
  }
};

// Export to window
window.Data = Data;
