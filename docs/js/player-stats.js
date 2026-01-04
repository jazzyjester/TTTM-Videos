/**
 * Player Statistics Page
 * Calculate and display detailed player statistics
 */

const PlayerStats = {
  playerName: null,
  playerVideos: [],
  allVideos: [],

  /**
   * Initialize the page
   */
  async init() {
    // Get player name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    this.playerName = urlParams.get('player');

    if (!this.playerName) {
      this.showError('לא צוין שם שחקן');
      return;
    }

    try {
      // Fetch all videos
      this.allVideos = await window.API.fetchAllVideos();

      // Filter videos for this player (including doubles games)
      this.playerVideos = this.allVideos.filter(video => {
        // Check if player name matches exactly (singles) or is part of a team (doubles)
        const currentPlayers = video.currentPlayer ? video.currentPlayer.split(/[:\/]/).map(p => p.trim()) : [];
        const opponentPlayers = video.opponentPlayer ? video.opponentPlayer.split(/[:\/]/).map(p => p.trim()) : [];

        return currentPlayers.includes(this.playerName) || opponentPlayers.includes(this.playerName);
      });

      if (this.playerVideos.length === 0) {
        this.showError(`לא נמצאו משחקים עבור ${this.playerName}`);
        return;
      }

      // Calculate and render statistics
      this.renderStats();
    } catch (error) {
      console.error('Error loading player stats:', error);
      this.showError('שגיאה בטעינת הנתונים');
    }
  },

  /**
   * Check if player is on the current player side (handles singles and doubles)
   */
  isPlayerOnCurrentSide(video) {
    const currentPlayers = video.currentPlayer ? video.currentPlayer.split(/[:\/]/).map(p => p.trim()) : [];
    return currentPlayers.includes(this.playerName);
  },

  /**
   * Calculate match result (win/loss/unknown)
   */
  getMatchResult(video) {
    if (!video.score || video.score === '') {
      return 'unknown';
    }

    // Parse score (format: "3-1", "3-2", etc.)
    const parts = video.score.split('-').map(s => parseInt(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      return 'unknown';
    }

    const [score1, score2] = parts;

    // Determine if player is current or opponent (handles doubles)
    const isCurrentPlayer = this.isPlayerOnCurrentSide(video);

    // Player won if their score is higher
    if (isCurrentPlayer) {
      return score1 > score2 ? 'loss' : 'win';
    } else {
      return score2 > score1 ? 'loss' : 'win';
    }
  },

  /**
   * Get opponent name for a video (handles singles and doubles)
   */
  getOpponentName(video) {
    return this.isPlayerOnCurrentSide(video)
      ? video.opponentPlayer
      : video.currentPlayer;
  },

  /**
   * Calculate overall statistics
   */
  calculateOverallStats() {
    const stats = {
      totalMatches: this.playerVideos.length,
      wins: 0,
      losses: 0,
      unknown: 0
    };

    this.playerVideos.forEach(video => {
      const result = this.getMatchResult(video);
      if (result === 'win') stats.wins++;
      else if (result === 'loss') stats.losses++;
      else stats.unknown++;
    });

    stats.winRate = stats.wins + stats.losses > 0
      ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
      : 0;

    return stats;
  },

  /**
   * Calculate performance by event
   */
  calculateEventPerformance() {
    const eventStats = {};

    this.playerVideos.forEach(video => {
      if (!eventStats[video.event]) {
        eventStats[video.event] = {
          name: video.event,
          total: 0,
          wins: 0,
          losses: 0,
          unknown: 0
        };
      }

      const result = this.getMatchResult(video);
      eventStats[video.event].total++;
      if (result === 'win') eventStats[video.event].wins++;
      else if (result === 'loss') eventStats[video.event].losses++;
      else eventStats[video.event].unknown++;
    });

    // Convert to array and sort by total matches
    return Object.values(eventStats).sort((a, b) => b.total - a.total);
  },

  /**
   * Calculate record against opponents
   */
  calculateOpponentsRecord() {
    const opponentStats = {};

    this.playerVideos.forEach(video => {
      const opponent = this.getOpponentName(video);

      if (!opponentStats[opponent]) {
        opponentStats[opponent] = {
          name: opponent,
          total: 0,
          wins: 0,
          losses: 0,
          unknown: 0
        };
      }

      const result = this.getMatchResult(video);
      opponentStats[opponent].total++;
      if (result === 'win') opponentStats[opponent].wins++;
      else if (result === 'loss') opponentStats[opponent].losses++;
      else opponentStats[opponent].unknown++;
    });

    // Convert to array and sort by total matches
    return Object.values(opponentStats).sort((a, b) => b.total - a.total);
  },

  /**
   * Get most common club for player (handles singles and doubles)
   */
  getMostCommonClub() {
    const clubCounts = {};

    this.playerVideos.forEach(video => {
      const club = this.isPlayerOnCurrentSide(video)
        ? video.currentPlayerClub
        : video.opponentClub;

      if (club) {
        clubCounts[club] = (clubCounts[club] || 0) + 1;
      }
    });

    // Find club with highest count
    let mostCommonClub = '';
    let maxCount = 0;
    Object.entries(clubCounts).forEach(([club, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonClub = club;
      }
    });

    return mostCommonClub;
  },

  /**
   * Get player ID and ranking (only from singles games, not doubles)
   */
  getPlayerIdAndRanking() {
    // Check if a video is a doubles game
    const isDoublesGame = (video) => {
      return (video.currentPlayer && video.currentPlayer.match(/[:\/]/)) ||
             (video.opponentPlayer && video.opponentPlayer.match(/[:\/]/));
    };

    // Find the most recent singles game with player ID and ranking
    const videoWithData = this.playerVideos.find(video => {
      // Skip doubles games for ranking
      if (isDoublesGame(video)) return false;

      const isCurrentPlayer = this.isPlayerOnCurrentSide(video);
      const playerId = isCurrentPlayer ? video.currentPlayerId : video.opponentPlayerId;
      const ranking = isCurrentPlayer ? video.currentPlayerRanking : video.opponentRanking;
      return playerId || ranking;
    });

    if (!videoWithData) {
      return { playerId: null, ranking: null };
    }

    const isCurrentPlayer = this.isPlayerOnCurrentSide(videoWithData);
    return {
      playerId: isCurrentPlayer ? videoWithData.currentPlayerId : videoWithData.opponentPlayerId,
      ranking: isCurrentPlayer ? videoWithData.currentPlayerRanking : videoWithData.opponentRanking
    };
  },

  /**
   * Render all statistics
   */
  renderStats() {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('statsContent').style.display = 'block';

    // Player header
    const club = this.getMostCommonClub();
    const { playerId, ranking } = this.getPlayerIdAndRanking();

    document.getElementById('playerName').textContent = this.playerName;
    document.getElementById('playerClub').textContent = club || 'מועדון לא ידוע';
    document.getElementById('playerSubtitle').textContent = `נתונים מבוססים על ${this.playerVideos.length} משחקים`;

    // Display ranking if available
    let rankingText = '';
    if (ranking) {
      rankingText = `דירוג: ${ranking}`;
    }
    document.getElementById('playerIdRanking').textContent = rankingText;

    // Overall stats
    const overallStats = this.calculateOverallStats();
    document.getElementById('totalMatches').textContent = overallStats.totalMatches;
    document.getElementById('totalWins').textContent = overallStats.wins;
    document.getElementById('totalLosses').textContent = overallStats.losses;
    document.getElementById('winRate').textContent = overallStats.winRate + '%';

    // Event performance
    this.renderEventPerformance();

    // Opponents record
    this.renderOpponentsRecord();

    // Recent matches
    this.renderRecentMatches();
  },

  /**
   * Render performance by event
   */
  renderEventPerformance() {
    const container = document.getElementById('eventPerformance');
    const eventPerformance = this.calculateEventPerformance();

    if (eventPerformance.length === 0) {
      container.innerHTML = '<div class="no-data">אין נתונים</div>';
      return;
    }

    let html = '';
    eventPerformance.forEach(event => {
      const winRate = event.wins + event.losses > 0
        ? ((event.wins / (event.wins + event.losses)) * 100).toFixed(0)
        : 0;

      html += `
        <div class="performance-row">
          <div class="performance-name">${window.Utils.escapeHtml(event.name)}</div>
          <div class="performance-stats">
            <div class="performance-count">${event.total} משחקים</div>
            <div class="performance-record">${event.wins}-${event.losses}</div>
            <div class="win-bar">
              <div class="win-bar-fill" style="width: ${winRate}%"></div>
            </div>
            <div class="performance-count">${winRate}%</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  /**
   * Format opponent name(s) for display - handles doubles by splitting and making each name clickable
   */
  formatOpponentName(opponentName) {
    // Check if it's a doubles team
    if (opponentName.match(/[:\/]/)) {
      const delimiter = opponentName.includes(':') ? ':' : '/';
      const players = opponentName.split(delimiter).map(p => p.trim());

      // Create clickable links for each player, separated by " / "
      return players.map(player =>
        `<span class="opponent-link" onclick="window.location.href='player-stats.html?player=${encodeURIComponent(player)}'">${window.Utils.escapeHtml(player)}</span>`
      ).join(' / ');
    } else {
      // Singles - return clickable link
      return `<span class="opponent-link" onclick="window.location.href='player-stats.html?player=${encodeURIComponent(opponentName)}'">${window.Utils.escapeHtml(opponentName)}</span>`;
    }
  },

  /**
   * Render record against opponents
   */
  renderOpponentsRecord() {
    const container = document.getElementById('opponentsRecord');
    const opponentsRecord = this.calculateOpponentsRecord();

    if (opponentsRecord.length === 0) {
      container.innerHTML = '<div class="no-data">אין נתונים</div>';
      return;
    }

    // Show top 10 opponents
    const topOpponents = opponentsRecord.slice(0, 10);

    let html = '';
    topOpponents.forEach(opponent => {
      const winRate = opponent.wins + opponent.losses > 0
        ? ((opponent.wins / (opponent.wins + opponent.losses)) * 100).toFixed(0)
        : 0;

      html += `
        <div class="performance-row">
          <div class="performance-name">${this.formatOpponentName(opponent.name)}</div>
          <div class="performance-stats">
            <div class="performance-count">${opponent.total} משחקים</div>
            <div class="performance-record">${opponent.wins}-${opponent.losses}</div>
            <div class="win-bar">
              <div class="win-bar-fill" style="width: ${winRate}%"></div>
            </div>
            <div class="performance-count">${winRate}%</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  /**
   * Render recent matches
   */
  renderRecentMatches() {
    const container = document.getElementById('recentMatches');

    // Sort by date (most recent first)
    const sortedVideos = [...this.playerVideos].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    // Show last 10 matches
    const recentMatches = sortedVideos.slice(0, 10);

    if (recentMatches.length === 0) {
      container.innerHTML = '<div class="no-data">אין משחקים</div>';
      return;
    }

    let html = '';
    recentMatches.forEach(video => {
      const result = this.getMatchResult(video);
      const opponent = this.getOpponentName(video);
      const date = new Date(video.updatedAt || video.createdAt);
      const dateStr = date.toLocaleDateString('he-IL');

      const resultClass = result === 'win' ? 'win' : result === 'loss' ? 'loss' : 'unknown';
      const resultText = result === 'win' ? 'ניצחון' : result === 'loss' ? 'הפסד' : 'לא ידוע';
      const scoreText = video.score || '?';

      // Determine who is who in this match (handles doubles)
      const isCurrentPlayer = this.isPlayerOnCurrentSide(video);

      // Get player info
      const playerName = this.playerName;
      const playerRanking = isCurrentPlayer ? video.currentPlayerRanking : video.opponentRanking;

      // Get opponent info
      const opponentRanking = isCurrentPlayer ? video.opponentRanking : video.currentPlayerRanking;

      // Build player details text
      let playerDetails = '';
      if (playerRanking) {
        playerDetails = '<div style="font-size: 11px; color: #666; margin-top: 4px;">';
        playerDetails += `${window.Utils.escapeHtml(playerName)}: דירוג ${playerRanking}`;
        playerDetails += '</div>';
      }

      // Build opponent details text
      let opponentDetails = '';
      if (opponentRanking) {
        if (!playerDetails) {
          opponentDetails = '<div style="font-size: 11px; color: #666; margin-top: 4px;">';
        } else {
          opponentDetails = '<div style="font-size: 11px; color: #666;">';
        }
        opponentDetails += `${window.Utils.escapeHtml(opponent)}: דירוג ${opponentRanking}`;
        opponentDetails += '</div>';
      }

      // Get video thumbnail
      const thumbnail = window.Utils.getYouTubeThumbnail(video.url);
      const thumbnailHtml = thumbnail ? `
        <a href="${window.Utils.escapeHtml(video.url)}" target="_blank" class="match-thumbnail-link">
          <img src="${thumbnail}" alt="Video thumbnail" class="match-thumbnail" onerror="this.style.display='none'">
        </a>
      ` : '';

      html += `
        <div class="recent-match">
          <div class="match-date-badge">${dateStr}</div>
          <div class="match-info">
            <div class="match-opponent">מול: ${this.formatOpponentName(opponent)}</div>
            <div class="match-event">${window.Utils.escapeHtml(video.event)}</div>
            ${playerDetails}
            ${opponentDetails}
          </div>
          <div class="match-result ${resultClass}">
            ${resultText}<br>
            <small style="font-size: 12px;">${scoreText}</small>
          </div>
          ${thumbnailHtml}
        </div>
      `;
    });

    container.innerHTML = html;
  },

  /**
   * Show error message
   */
  showError(message) {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('errorContainer').innerHTML = `
      <div class="error" style="margin: 40px auto; max-width: 600px; text-align: center; padding: 24px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;">
        <h2 style="color: #856404; margin-bottom: 12px;">${window.Utils.escapeHtml(message)}</h2>
        <a href="index.html" class="back-button" style="margin-top: 16px;">חזרה לדף הראשי</a>
      </div>
    `;
  }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  PlayerStats.init();
});
