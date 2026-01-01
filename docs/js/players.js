/**
 * Players Page
 * Display all players with their video counts and rankings
 */

const Players = {
  allVideos: [],
  playersList: [],
  filteredPlayers: [],

  /**
   * Initialize the page
   */
  async init() {
    try {
      // Fetch all videos
      this.allVideos = await window.API.fetchAllVideos();

      if (this.allVideos.length === 0) {
        this.showError('לא נמצאו סרטונים');
        return;
      }

      // Aggregate players data
      this.aggregatePlayers();

      // Render the page
      this.render();

      // Setup search
      this.setupSearch();
    } catch (error) {
      console.error('Error loading players:', error);
      this.showError('שגיאה בטעינת הנתונים');
    }
  },

  /**
   * Aggregate all players from videos
   */
  aggregatePlayers() {
    const playersMap = {};

    this.allVideos.forEach(video => {
      // Process current player
      if (video.currentPlayer) {
        if (!playersMap[video.currentPlayer]) {
          playersMap[video.currentPlayer] = {
            name: video.currentPlayer,
            videoCount: 0,
            videos: [],
            clubs: {}
          };
        }
        playersMap[video.currentPlayer].videoCount++;
        playersMap[video.currentPlayer].videos.push({
          date: new Date(video.updatedAt || video.createdAt || 0),
          ranking: video.currentPlayerRanking,
          club: video.currentPlayerClub,
          video: video
        });
        // Track club occurrences
        if (video.currentPlayerClub) {
          playersMap[video.currentPlayer].clubs[video.currentPlayerClub] =
            (playersMap[video.currentPlayer].clubs[video.currentPlayerClub] || 0) + 1;
        }
      }

      // Process opponent player
      if (video.opponentPlayer) {
        if (!playersMap[video.opponentPlayer]) {
          playersMap[video.opponentPlayer] = {
            name: video.opponentPlayer,
            videoCount: 0,
            videos: [],
            clubs: {}
          };
        }
        playersMap[video.opponentPlayer].videoCount++;
        playersMap[video.opponentPlayer].videos.push({
          date: new Date(video.updatedAt || video.createdAt || 0),
          ranking: video.opponentRanking,
          club: video.opponentClub,
          video: video
        });
        // Track club occurrences
        if (video.opponentClub) {
          playersMap[video.opponentPlayer].clubs[video.opponentClub] =
            (playersMap[video.opponentPlayer].clubs[video.opponentClub] || 0) + 1;
        }
      }
    });

    // Convert to array and find most recent ranking for each player
    this.playersList = Object.values(playersMap).map(player => {
      // Sort videos by date (most recent first)
      player.videos.sort((a, b) => b.date - a.date);

      // Get most recent ranking
      const mostRecentVideo = player.videos[0];
      player.mostRecentRanking = mostRecentVideo.ranking;
      player.mostRecentDate = mostRecentVideo.date;

      // Get most common club
      let mostCommonClub = '';
      let maxCount = 0;
      Object.entries(player.clubs).forEach(([club, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonClub = club;
        }
      });
      player.club = mostCommonClub;

      return player;
    });

    // Sort players by ranking
    // Players with rankings come first (sorted by ranking number DESCENDING - higher numbers first)
    // Players without rankings come last (sorted alphabetically)
    this.playersList.sort((a, b) => {
      const hasRankingA = a.mostRecentRanking != null && a.mostRecentRanking !== '';
      const hasRankingB = b.mostRecentRanking != null && b.mostRecentRanking !== '';

      if (hasRankingA && hasRankingB) {
        // Both have rankings - sort by ranking number DESCENDING (higher first)
        return parseInt(b.mostRecentRanking) - parseInt(a.mostRecentRanking);
      } else if (hasRankingA) {
        // Only A has ranking - A comes first
        return -1;
      } else if (hasRankingB) {
        // Only B has ranking - B comes first
        return 1;
      } else {
        // Neither has ranking - sort alphabetically
        return a.name.localeCompare(b.name, 'he');
      }
    });

    this.filteredPlayers = [...this.playersList];
  },

  /**
   * Render the page
   */
  render() {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('playersContent').style.display = 'block';

    // Update stats
    const rankedPlayers = this.playersList.filter(p => p.mostRecentRanking != null && p.mostRecentRanking !== '').length;
    document.getElementById('totalPlayers').textContent = this.playersList.length;
    document.getElementById('totalVideos').textContent = this.allVideos.length;
    document.getElementById('rankedPlayers').textContent = rankedPlayers;

    // Render players list
    this.renderPlayersList();
  },

  /**
   * Render the players list
   */
  renderPlayersList() {
    const container = document.getElementById('playersList');

    if (this.filteredPlayers.length === 0) {
      container.innerHTML = '<div class="no-data">לא נמצאו שחקנים</div>';
      return;
    }

    let html = '';
    this.filteredPlayers.forEach((player, index) => {
      const displayRank = index + 1;
      const ranking = player.mostRecentRanking ? `דירוג: ${player.mostRecentRanking}` : 'ללא דירוג';
      const clubText = player.club ? ` <span class="club">(${window.Utils.escapeHtml(player.club)})</span>` : '';

      html += `
        <div class="player-row" onclick="window.location.href='player-stats.html?player=${encodeURIComponent(player.name)}'">
          <div class="player-rank">#${displayRank}</div>
          <div class="player-name">${window.Utils.escapeHtml(player.name)}${clubText}</div>
          <div class="player-videos">${player.videoCount} סרטונים</div>
          <div class="player-ranking">${ranking}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  /**
   * Setup search functionality
   */
  setupSearch() {
    const searchInput = document.getElementById('playerSearch');
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();

      if (searchTerm === '') {
        this.filteredPlayers = [...this.playersList];
      } else {
        this.filteredPlayers = this.playersList.filter(player =>
          player.name.toLowerCase().includes(searchTerm)
        );
      }

      this.renderPlayersList();
    });
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
  Players.init();
});
