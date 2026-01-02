/**
 * Filter Management
 * Handles filter state and operations
 */

const Filters = {
  // Filter state
  state: {
    players: new Set(),
    clubs: new Set(),
    events: new Set(),
    dateRange: null
  },

  // Player search query
  playerSearch: '',

  /**
   * Add or toggle a filter
   */
  addFilter(type, value) {
    if (!value) return;

    // Toggle: if already in filter, remove it; otherwise add it
    if (this.state[type].has(value)) {
      this.state[type].delete(value);
    } else {
      this.state[type].add(value);
    }

    // Notify that filters changed
    if (window.UI) {
      window.UI.updateFilterDisplay();
      window.UI.renderContent();
    }
  },

  /**
   * Remove a filter
   */
  removeFilter(type, value) {
    this.state[type].delete(value);

    if (window.UI) {
      window.UI.updateFilterDisplay();
      window.UI.renderContent();
    }
  },

  /**
   * Set date filter (toggle)
   */
  setDateFilter(range) {
    // Toggle: if clicking same filter, remove it
    if (this.state.dateRange === range) {
      this.state.dateRange = null;
    } else {
      this.state.dateRange = range;
    }

    if (window.UI) {
      window.UI.updateFilterDisplay();
      window.UI.renderContent();
    }
  },

  /**
   * Clear all filters
   */
  clearAll() {
    this.state.players.clear();
    this.state.clubs.clear();
    this.state.events.clear();
    this.state.dateRange = null;

    if (window.UI) {
      window.UI.updateFilterDisplay();
      window.UI.renderContent();
    }
  },

  /**
   * Check if player matches filter (supports doubles)
   */
  matchesPlayerFilter(playerNames) {
    if (!playerNames) return false;

    // Check if it's a doubles game (contains ':')
    if (playerNames.includes(':')) {
      // Split and check if any player is in the filter
      const names = playerNames.split(':').map(n => n.trim());
      return names.some(name => this.state.players.has(name));
    }

    // Single player - direct check
    return this.state.players.has(playerNames);
  },

  /**
   * Apply filters to videos
   */
  applyFilters(videos) {
    if (this.state.players.size === 0 &&
        this.state.clubs.size === 0 &&
        this.state.events.size === 0 &&
        !this.state.dateRange) {
      return videos;
    }

    return videos.filter(video => {
      // Check player filter (supports doubles)
      if (this.state.players.size > 0) {
        const hasPlayer = this.matchesPlayerFilter(video.currentPlayer) ||
                         this.matchesPlayerFilter(video.opponentPlayer);
        if (!hasPlayer) return false;
      }

      // Check club filter
      if (this.state.clubs.size > 0) {
        const hasClub = this.state.clubs.has(video.currentPlayerClub) ||
                       this.state.clubs.has(video.opponentClub);
        if (!hasClub) return false;
      }

      // Check event filter
      if (this.state.events.size > 0) {
        if (!this.state.events.has(video.event)) return false;
      }

      // Check date range filter
      if (this.state.dateRange) {
        if (!window.Data.isVideoInDateRange(video, this.state.dateRange)) return false;
      }

      return true;
    });
  },

  /**
   * Filter players by search query
   */
  filterPlayersBySearch(players) {
    if (!this.playerSearch) return players;

    const searchLower = this.playerSearch.toLowerCase();
    return players.filter(player => {
      const playerName = (player.name || '').toLowerCase();
      const playerClub = (player.club || '').toLowerCase();
      return playerName.includes(searchLower) || playerClub.includes(searchLower);
    });
  },

  /**
   * Set player search query
   */
  setPlayerSearch(query) {
    this.playerSearch = query;
  }
};

// Export to window
window.Filters = Filters;
