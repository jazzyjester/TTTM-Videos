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

    // Custom sort event names
    const sortedEventNames = Object.keys(groupedVideos).sort((a, b) =>
      window.Data.sortEvents(a, b)
    );

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

    // Add event listeners for player names, club names, and event tags
    container.querySelectorAll('.player-name, .club-name, .event-tag').forEach(element => {
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
              ${video.currentPlayer ? `<div class="player-name" data-filter-type="players" data-filter-value="${window.Utils.escapeHtml(video.currentPlayer)}">${isCurrentPlayerFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.currentPlayer)}</span>` : window.Utils.escapeHtml(video.currentPlayer)}</div>` : ''}
              ${video.currentPlayerClub ? `<div class="club-name" data-filter-type="clubs" data-filter-value="${window.Utils.escapeHtml(video.currentPlayerClub)}">${isCurrentClubFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.currentPlayerClub)}</span>` : window.Utils.escapeHtml(video.currentPlayerClub)}</div>` : ''}
            </div>
            <div class="vs-divider">
              ${video.score ? `
                <div class="score-container" id="score-container-${videoId}">
                  <a href="${matchUrl}" target="_blank" rel="noopener noreferrer" class="score-display ${!isWatched && !isScoreRevealed ? 'score-blurred' : 'score-revealed'}" id="score-${videoId}" style="text-decoration: none; color: #0066cc;" onclick="window.UI.handleScoreClick(event, '${videoId}')">${window.Utils.escapeHtml(video.score)}</a>
                </div>
              ` : '<div>VS</div>'}
            </div>
            <div class="player-info">
              ${video.opponentPlayer ? `<div class="player-name" data-filter-type="players" data-filter-value="${window.Utils.escapeHtml(video.opponentPlayer)}">${isOpponentPlayerFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.opponentPlayer)}</span>` : window.Utils.escapeHtml(video.opponentPlayer)}</div>` : ''}
              ${video.opponentClub ? `<div class="club-name" data-filter-type="clubs" data-filter-value="${window.Utils.escapeHtml(video.opponentClub)}">${isOpponentClubFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.opponentClub)}</span>` : window.Utils.escapeHtml(video.opponentClub)}</div>` : ''}
            </div>
          </div>
          <div class="video-footer">
            <div class="event-tag" data-filter-type="events" data-filter-value="${window.Utils.escapeHtml(video.event)}">${isEventFiltered ? `<span class="filter-highlight">${window.Utils.escapeHtml(video.event)}</span>` : window.Utils.escapeHtml(video.event)}</div>
            <a href="${window.Utils.escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer" class="video-link" onclick="window.Storage.markAsWatched('${videoId}')">▶️ צפה בסרטון</a>
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
      'על': [],
      'לאומית': [],
      'ארצית': [],
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
    const eventTypes = ['על', 'לאומית', 'ארצית', 'other'];

    eventTypes.forEach(eventType => {
      if (grouped[eventType].length > 0) {
        // Add header for this event type
        const headerLabel = eventType === 'other' ? 'אחר' : eventType;
        html += `<div style="font-size: 13px; font-weight: bold; color: #0066cc; margin-top: 12px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0;">${headerLabel}</div>`;

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
      'על': [],
      'לאומית': [],
      'ארצית': [],
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

    // Render each group with header
    const eventTypes = ['על', 'לאומית', 'ארצית', 'other'];
    eventTypes.forEach(eventType => {
      if (grouped[eventType].length > 0) {
        // Add header
        const headerLabel = eventType === 'other' ? 'אחר' : eventType;
        html += `<div style="font-size: 13px; font-weight: bold; color: #0066cc; margin-top: 12px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0;">${headerLabel}</div>`;

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
   * Update filter display
   */
  updateFilterDisplay() {
    const filterSection = document.getElementById('filterSection');
    const activeFilters = document.getElementById('activeFilters');

    const hasFilters = window.Filters.state.players.size > 0 ||
                      window.Filters.state.clubs.size > 0 ||
                      window.Filters.state.events.size > 0 ||
                      window.Filters.state.dateRange !== null;

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
  }
};

// Export to window
window.UI = UI;
