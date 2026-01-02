/**
 * UI Rendering
 * All functions for rendering UI components
 */

const UI = {
  // Store all videos for access by render functions
  allVideos: [],

  /**
   * Initialize with videos data
   */
  init(videos) {
    this.allVideos = videos;
  },

  /**
   * Render all content (main entry point)
   */
  renderContent() {
    const filteredVideos = window.Filters.applyFilters(this.allVideos);
    this.renderVideos(filteredVideos);
    this.updateStatistics(filteredVideos);
    // Re-render sidebars to update active states
    this.renderPlayerList(this.allVideos);
    this.renderClubList(this.allVideos);
    this.renderEventList(this.allVideos);
    this.renderDateRangeList(this.allVideos);
  },

  /**
   * Render videos grouped by event
   */
  renderVideos(videos) {
    const container = document.getElementById('videosContent');
    const loadingContainer = document.getElementById('loadingContainer');

    loadingContainer.style.display = 'none';

    if (videos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📹</div>
          <h3>אין סרטונים</h3>
          <p>לא נמצאו סרטונים התואמים את הסינון</p>
        </div>
      `;
      return;
    }

    const groupedVideos = window.Data.groupVideosByEvent(videos);
    let html = '';

    // Sort event names by most recent video in each event
    const sortedEventNames = Object.keys(groupedVideos).sort((a, b) => {
      const aMostRecent = groupedVideos[a][0]; // Already sorted by date in groupVideosByEvent
      const bMostRecent = groupedVideos[b][0];
      const dateA = new Date(aMostRecent.updatedAt || aMostRecent.createdAt || 0);
      const dateB = new Date(bMostRecent.updatedAt || bMostRecent.createdAt || 0);
      return dateB - dateA; // Newest first
    });

    sortedEventNames.forEach(eventName => {
      const eventVideos = groupedVideos[eventName];
      const eventId = eventName.replace(/\s/g, '-');

      html += `
        <div class="event-group" id="event-${eventId}">
          <div class="event-header" onclick="toggleEventGroup('${eventId}')">
            <div class="event-header-left">
              <span class="event-collapse-icon">▼</span>
              <div class="event-name">${window.Utils.escapeHtml(eventName)}</div>
            </div>
            <div class="event-count">${eventVideos.length} סרטונים</div>
          </div>
          <div class="video-list">
      `;

      eventVideos.forEach(video => {
        html += this.renderVideoCard(video);
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add event listeners for player names - show menu
    container.querySelectorAll('.player-name').forEach(element => {
      element.addEventListener('click', function(event) {
        const value = this.getAttribute('data-filter-value');
        if (value) {
          window.UI.showPlayerMenu(event, value);
        }
      });
    });

    // Add event listeners for club names and event tags
    container.querySelectorAll('.club-name, .event-tag').forEach(element => {
      element.addEventListener('click', function() {
        const type = this.getAttribute('data-filter-type');
        const value = this.getAttribute('data-filter-value');
        if (type && value) {
          window.Filters.addFilter(type, value);
        }
      });
    });
  },

  /**
   * Render a single video card
   */
  renderVideoCard(video) {
    const thumbnail = window.Utils.getYouTubeThumbnail(video.url);
    const matchUrl = `https://www.tttm.co.il/m/${window.Utils.escapeHtml(video.match)}/`;
    const dateBadge = window.Utils.getDateBadge(video);
    const videoId = video.id || video.match;
    const isWatched = window.Storage.isWatched(videoId);
    const isScoreRevealed = window.Storage.isScoreRevealed(videoId);

    // Check if fields match active filters for highlighting
    const isCurrentPlayerFiltered = window.Filters.state.players.has(video.currentPlayer);
    const isOpponentPlayerFiltered = window.Filters.state.players.has(video.opponentPlayer);
    const isCurrentClubFiltered = window.Filters.state.clubs.has(video.currentPlayerClub);
    const isOpponentClubFiltered = window.Filters.state.clubs.has(video.opponentClub);
    const isEventFiltered = window.Filters.state.events.has(video.event);

    return `
      <div class="video-card">
        ${dateBadge ? (dateBadge.className !== 'video-date-badge-date' ? `<span class="video-date-badge ${dateBadge.className}">${dateBadge.label}</span>` : `<span class="video-date-text">${dateBadge.label}</span>`) : ''}
        ${thumbnail ? `
          <div class="video-thumbnail-container">
            <a href="${window.Utils.escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer" onclick="window.Storage.markAsWatched('${videoId}')">
              <img src="${thumbnail}" alt="Video thumbnail" class="video-thumbnail" onerror="this.style.display='none'">
            </a>
            ${isWatched ? '<div class="video-watched-overlay"><div class="video-watched-icon">✓</div></div>' : ''}
          </div>
        ` : ''}
        <div class="video-card-content">
          <div class="match-details">
            <div class="player-info">
              ${video.currentPlayer ? `<div class="player-name" data-filter-type="players" data-filter-value="${window.Utils.escapeHtml(video.currentPlayer)}" data-player-id="${video.currentPlayerId || ''}">${isCurrentPlayerFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.currentPlayer)}</span>` : window.Utils.escapeHtml(video.currentPlayer)}</div>` : ''}
              ${video.currentPlayerClub ? `<div class="club-name" data-filter-type="clubs" data-filter-value="${window.Utils.escapeHtml(video.currentPlayerClub)}">${isCurrentClubFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.currentPlayerClub)}</span>` : window.Utils.escapeHtml(video.currentPlayerClub)}</div>` : ''}
              ${video.currentPlayerRanking ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">דירוג: ${window.Utils.escapeHtml(video.currentPlayerRanking)}</div>` : ''}
            </div>
            <div class="vs-divider">
              ${video.score ? `
                <div class="score-container" id="score-container-${videoId}">
                  <a href="${matchUrl}" target="_blank" rel="noopener noreferrer" class="score-display ${!isWatched && !isScoreRevealed ? 'score-blurred' : 'score-revealed'}" id="score-${videoId}" style="text-decoration: none; color: #0066cc;" onclick="window.UI.handleScoreClick(event, '${videoId}')">${window.Utils.escapeHtml(video.score)}</a>
                </div>
              ` : '<div>VS</div>'}
            </div>
            <div class="player-info">
              ${video.opponentPlayer ? `<div class="player-name" data-filter-type="players" data-filter-value="${window.Utils.escapeHtml(video.opponentPlayer)}" data-player-id="${video.opponentPlayerId || ''}">${isOpponentPlayerFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.opponentPlayer)}</span>` : window.Utils.escapeHtml(video.opponentPlayer)}</div>` : ''}
              ${video.opponentClub ? `<div class="club-name" data-filter-type="clubs" data-filter-value="${window.Utils.escapeHtml(video.opponentClub)}">${isOpponentClubFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.opponentClub)}</span>` : window.Utils.escapeHtml(video.opponentClub)}</div>` : ''}
              ${video.opponentRanking ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">דירוג: ${window.Utils.escapeHtml(video.opponentRanking)}</div>` : ''}
            </div>
          </div>
          <div class="video-footer">
            <div class="event-tag" data-filter-type="events" data-filter-value="${window.Utils.escapeHtml(video.event)}">${isEventFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.event)}</span>` : window.Utils.escapeHtml(video.event)}</div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render player list grouped by event type
   */
  renderPlayerList(videos) {
    const players = window.Data.extractPlayers(videos);
    const container = document.getElementById('playerList');

    // Filter players based on search query
    const filteredPlayers = window.Filters.filterPlayersBySearch(players);

    if (filteredPlayers.length === 0) {
      container.innerHTML = '<div style="color: #999; text-align: center; font-size: 12px;">אין שחקנים</div>';
      return;
    }

    // Group players by event type
    const grouped = {
      'ליגת על': [],
      'ליגה לאומית': [],
      'ליגה ארצית': [],
      'ליגה א': [],
      'other': []
    };

    filteredPlayers.forEach(player => {
      if (player.eventType && grouped[player.eventType]) {
        grouped[player.eventType].push(player);
      } else {
        grouped.other.push(player);
      }
    });

    let html = '';
    const eventTypes = ['ליגת על', 'ליגה לאומית', 'ליגה ארצית', 'ליגה א', 'other'];

    eventTypes.forEach(eventType => {
      if (grouped[eventType].length > 0) {
        // Add collapsible header for this event type
        const headerLabel = eventType === 'other' ? 'אחר' : eventType;
        const groupId = `player-group-${eventType}`;
        html += `
          <div class="filter-group" id="${groupId}" style="margin-top: 12px;">
            <div class="filter-group-header" onclick="toggleFilterGroup('${groupId}')">
              <span class="filter-collapse-icon">▼</span>
              <span style="font-size: 13px; font-weight: bold; color: #0066cc;">${headerLabel}</span>
            </div>
            <div class="filter-group-content">
        `;

        // Add players for this event type
        grouped[eventType].forEach(player => {
          const isActive = window.Filters.state.players.has(player.name);
          const playerDisplay = player.club
            ? `${window.Utils.escapeHtml(player.name)} <span class="player-club-info">(${window.Utils.escapeHtml(player.club)})</span>`
            : window.Utils.escapeHtml(player.name);

          html += `
            <div class="list-item ${isActive ? 'active' : ''}" data-filter-type="players" data-filter-value="${window.Utils.escapeHtml(player.name)}">
              <span>${playerDisplay}</span>
              <span class="item-count">${player.count}</span>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;

    // Add event listeners
    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', function() {
        const type = this.getAttribute('data-filter-type');
        const value = this.getAttribute('data-filter-value');
        window.Filters.addFilter(type, value);
      });
    });
  },

  /**
   * Render club list grouped by event type
   */
  renderClubList(videos) {
    const clubs = window.Data.extractClubs(videos);
    const container = document.getElementById('clubList');

    if (clubs.length === 0) {
      container.innerHTML = '<div style="color: #999; text-align: center; font-size: 12px;">אין מועדונים</div>';
      return;
    }

    // Group clubs by event type
    const grouped = {
      'ליגת על': [],
      'ליגה לאומית': [],
      'ליגה ארצית': [],
      'ליגה א': [],
      'other': []
    };

    clubs.forEach(club => {
      if (club.eventType && grouped[club.eventType]) {
        grouped[club.eventType].push(club);
      } else {
        grouped.other.push(club);
      }
    });

    let html = '';

    // Render each group with collapsible header
    const eventTypes = ['ליגת על', 'ליגה לאומית', 'ליגה ארצית', 'ליגה א', 'other'];
    eventTypes.forEach(eventType => {
      if (grouped[eventType].length > 0) {
        // Add collapsible header
        const headerLabel = eventType === 'other' ? 'אחר' : eventType;
        const groupId = `club-group-${eventType}`;
        html += `
          <div class="filter-group" id="${groupId}" style="margin-top: 12px;">
            <div class="filter-group-header" onclick="toggleFilterGroup('${groupId}')">
              <span class="filter-collapse-icon">▼</span>
              <span style="font-size: 13px; font-weight: bold; color: #0066cc;">${headerLabel}</span>
            </div>
            <div class="filter-group-content">
        `;

        // Add clubs in this group
        grouped[eventType].forEach(club => {
          const isActive = window.Filters.state.clubs.has(club.name);
          html += `
            <div class="list-item ${isActive ? 'active' : ''}" data-filter-type="clubs" data-filter-value="${window.Utils.escapeHtml(club.name)}">
              <span style="word-break: break-word;">${window.Utils.escapeHtml(club.name)}</span>
              <span class="item-count">${club.count}</span>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;

    // Add event listeners
    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', function() {
        const type = this.getAttribute('data-filter-type');
        const value = this.getAttribute('data-filter-value');
        window.Filters.addFilter(type, value);
      });
    });
  },

  /**
   * Render event list
   */
  renderEventList(videos) {
    const events = window.Data.extractEvents(videos);
    const container = document.getElementById('eventList');

    if (events.length === 0) {
      container.innerHTML = '<div style="color: #999; text-align: center; font-size: 12px;">אין אירועים</div>';
      return;
    }

    let html = '';
    events.forEach(event => {
      const isActive = window.Filters.state.events.has(event.name);
      html += `
        <div class="list-item ${isActive ? 'active' : ''}" data-filter-type="events" data-filter-value="${window.Utils.escapeHtml(event.name)}">
          <span style="word-break: break-word;">${window.Utils.escapeHtml(event.name)}</span>
          <span class="item-count">${event.count}</span>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add event listeners
    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', function() {
        const type = this.getAttribute('data-filter-type');
        const value = this.getAttribute('data-filter-value');
        window.Filters.addFilter(type, value);
      });
    });
  },

  /**
   * Render date range list
   */
  renderDateRangeList(videos) {
    const counts = window.Data.countVideosInDateRanges(videos);
    const container = document.getElementById('dateRangeList');

    const dateRanges = [
      { id: 'today', label: 'היום', count: counts.today },
      { id: 'yesterday', label: 'אתמול', count: counts.yesterday },
      { id: 'week', label: '7 ימים אחרונים', count: counts.week },
      { id: 'month', label: '30 ימים אחרונים', count: counts.month },
      { id: '2026', label: '2026', count: counts['2026'] },
      { id: '2025', label: '2025', count: counts['2025'] },
      { id: '2024', label: '2024', count: counts['2024'] }
    ];

    let html = '';
    dateRanges.forEach(range => {
      const isActive = window.Filters.state.dateRange === range.id;
      html += `
        <div class="date-filter-item ${isActive ? 'active' : ''}" onclick="window.Filters.setDateFilter('${range.id}')">
          <span>${range.label}</span>
          <span class="item-count">${range.count}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  /**
   * Update filter header indicators
   */
  updateFilterHeaderIndicators() {
    const playerIndicator = document.getElementById('playerFilterIndicator');
    const clubIndicator = document.getElementById('clubFilterIndicator');
    const eventIndicator = document.getElementById('eventFilterIndicator');
    const dateIndicator = document.getElementById('dateFilterIndicator');

    // Update player filter indicator
    if (playerIndicator) {
      playerIndicator.textContent = window.Filters.state.players.size > 0 ? window.Filters.state.players.size : '';
    }

    // Update club filter indicator
    if (clubIndicator) {
      clubIndicator.textContent = window.Filters.state.clubs.size > 0 ? window.Filters.state.clubs.size : '';
    }

    // Update event filter indicator
    if (eventIndicator) {
      eventIndicator.textContent = window.Filters.state.events.size > 0 ? window.Filters.state.events.size : '';
    }

    // Update date filter indicator
    if (dateIndicator) {
      dateIndicator.textContent = window.Filters.state.dateRange !== null ? '1' : '';
    }
  },

  /**
   * Update filter display
   */
  updateFilterDisplay() {
    const filterSection = document.getElementById('filterSection');
    const activeFilters = document.getElementById('activeFilters');

    const hasFilters = window.Filters.state.players.size > 0 ||
                      window.Filters.state.clubs.size > 0 ||
                      window.Filters.state.events.size > 0 ||
                      window.Filters.state.dateRange !== null;

    // Update filter header indicators
    this.updateFilterHeaderIndicators();

    if (!hasFilters) {
      filterSection.style.display = 'none';
      return;
    }

    filterSection.style.display = 'block';
    let html = '';

    // Date range filter
    if (window.Filters.state.dateRange) {
      const label = window.APP_CONFIG.DATE_LABELS[window.Filters.state.dateRange];
      html += `
        <div class="filter-tag" data-filter-type="dateRange" data-filter-value="${window.Filters.state.dateRange}">
          <span>תאריך: ${label}</span>
          <span class="remove-icon">×</span>
        </div>
      `;
    }

    // Player filters
    window.Filters.state.players.forEach(player => {
      html += `
        <div class="filter-tag" data-filter-type="players" data-filter-value="${window.Utils.escapeHtml(player)}">
          <span>שחקן: ${window.Utils.escapeHtml(player)}</span>
          <span class="remove-icon">×</span>
        </div>
      `;
    });

    // Club filters
    window.Filters.state.clubs.forEach(club => {
      html += `
        <div class="filter-tag" data-filter-type="clubs" data-filter-value="${window.Utils.escapeHtml(club)}">
          <span>מועדון: ${window.Utils.escapeHtml(club)}</span>
          <span class="remove-icon">×</span>
        </div>
      `;
    });

    // Event filters
    window.Filters.state.events.forEach(event => {
      html += `
        <div class="filter-tag" data-filter-type="events" data-filter-value="${window.Utils.escapeHtml(event)}">
          <span>אירוע: ${window.Utils.escapeHtml(event)}</span>
          <span class="remove-icon">×</span>
        </div>
      `;
    });

    activeFilters.innerHTML = html;

    // Add event listeners for filter tag removal
    activeFilters.querySelectorAll('.filter-tag').forEach(tag => {
      tag.addEventListener('click', function() {
        const type = this.getAttribute('data-filter-type');
        const value = this.getAttribute('data-filter-value');
        if (type === 'dateRange') {
          window.Filters.setDateFilter(value);
        } else {
          window.Filters.removeFilter(type, value);
        }
      });
    });
  },

  /**
   * Update statistics
   */
  updateStatistics(videos) {
    document.getElementById('totalVideos').textContent = videos.length;

    const players = new Set();
    const clubs = new Set();
    const events = new Set();

    videos.forEach(video => {
      if (video.currentPlayer) players.add(video.currentPlayer);
      if (video.opponentPlayer) players.add(video.opponentPlayer);
      if (video.currentPlayerClub) clubs.add(video.currentPlayerClub);
      if (video.opponentClub) clubs.add(video.opponentClub);
      if (video.event) events.add(video.event);
    });

    document.getElementById('totalPlayers').textContent = players.size;
    document.getElementById('totalEvents').textContent = events.size;
    document.getElementById('totalClubs').textContent = clubs.size;
  },

  /**
   * Show error message
   */
  showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error">${window.Utils.escapeHtml(message)}</div>`;
    document.getElementById('loadingContainer').style.display = 'none';
  },

  /**
   * Handle score click - reveal if blurred, otherwise allow link navigation
   */
  handleScoreClick(event, videoId) {
    const scoreElement = document.getElementById(`score-${videoId}`);

    if (scoreElement && scoreElement.classList.contains('score-blurred')) {
      // Prevent navigation when revealing
      event.preventDefault();
      event.stopPropagation();

      // Reveal the score
      scoreElement.classList.remove('score-blurred');
      scoreElement.classList.add('score-revealed');

      // Save to cache
      window.Storage.markScoreRevealed(videoId);
    }
    // If not blurred, allow normal link behavior
  },

  /**
   * Show player context menu
   */
  showPlayerMenu(event, playerName) {
    event.preventDefault();
    event.stopPropagation();

    // Get player ID from the clicked element
    const playerId = event.target.closest('.player-name')?.getAttribute('data-player-id') || '';

    // Remove any existing menu
    const existingMenu = document.querySelector('.player-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create menu
    const menu = document.createElement('div');
    menu.className = 'player-context-menu';

    // Build menu items
    let menuHTML = `
      <div class="player-menu-item" data-action="filter">
        <i class="fa-solid fa-filter"></i>
        <span>סינון לפי שחקן</span>
      </div>
      <div class="player-menu-item" data-action="stats">
        <i class="fa-solid fa-chart-simple"></i>
        <span>סטטיסטיקה של השחקן</span>
      </div>
    `;

    // Add TTTM link option if we have a player ID
    if (playerId) {
      menuHTML += `
      <div class="player-menu-item" data-action="tttm">
        <i class="fa-solid fa-external-link"></i>
        <span>פתח שחקן ב-TTTM</span>
      </div>
      `;
    }

    menu.innerHTML = menuHTML;

    // Position menu near click
    document.body.appendChild(menu);
    const rect = event.target.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;

    // Add event listeners to menu items
    menu.querySelectorAll('.player-menu-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = this.getAttribute('data-action');

        if (action === 'filter') {
          window.Filters.addFilter('players', playerName);
        } else if (action === 'stats') {
          // Navigate to player stats page
          window.location.href = `player-stats.html?player=${encodeURIComponent(playerName)}`;
        } else if (action === 'tttm') {
          // Open player page on TTTM
          const playerUrl = `https://www.tttm.co.il/p/${playerId}/${encodeURIComponent(playerName)}`;
          window.open(playerUrl, '_blank');
        }

        menu.remove();
      });
    });

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }
};

// Export to window
window.UI = UI;
