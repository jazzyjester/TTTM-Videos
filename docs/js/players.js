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

    // Helper function to process a player (handles both singles and doubles)
    const processPlayer = (playerName, ranking, club, video) => {
      if (!playerName) return;

      // Check if this is a doubles game (player name contains ":" or "/")
      const isDoubles = playerName.includes(':') || playerName.includes('/');

      if (isDoubles) {
        // Split the player names and process each separately
        // Use ":" as primary delimiter, fallback to "/"
        const delimiter = playerName.includes(':') ? ':' : '/';
        const players = playerName.split(delimiter).map(p => p.trim());

        players.forEach(individualPlayer => {
          if (!individualPlayer) return;

          if (!playersMap[individualPlayer]) {
            playersMap[individualPlayer] = {
              name: individualPlayer,
              videoCount: 0,
              videos: [],
              clubs: {}
            };
          }

          playersMap[individualPlayer].videoCount++;
          playersMap[individualPlayer].videos.push({
            date: new Date(video.updatedAt || video.createdAt || 0),
            ranking: null, // Ignore ranking for doubles
            club: club,
            video: video,
            isDoubles: true
          });

          // Track club occurrences
          if (club) {
            playersMap[individualPlayer].clubs[club] =
              (playersMap[individualPlayer].clubs[club] || 0) + 1;
          }
        });
      } else {
        // Singles game - process as normal
        if (!playersMap[playerName]) {
          playersMap[playerName] = {
            name: playerName,
            videoCount: 0,
            videos: [],
            clubs: {}
          };
        }

        playersMap[playerName].videoCount++;
        playersMap[playerName].videos.push({
          date: new Date(video.updatedAt || video.createdAt || 0),
          ranking: ranking,
          club: club,
          video: video,
          isDoubles: false
        });

        // Track club occurrences
        if (club) {
          playersMap[playerName].clubs[club] =
            (playersMap[playerName].clubs[club] || 0) + 1;
        }
      }
    };

    this.allVideos.forEach(video => {
      // Process current player (or players in doubles)
      processPlayer(video.currentPlayer, video.currentPlayerRanking, video.currentPlayerClub, video);

      // Process opponent player (or players in doubles)
      processPlayer(video.opponentPlayer, video.opponentRanking, video.opponentClub, video);
    });

    // Convert to array and find most recent ranking for each player
    this.playersList = Object.values(playersMap).map(player => {
      // Sort videos by date (most recent first)
      player.videos.sort((a, b) => b.date - a.date);

      // Get most recent ranking from singles games only (ignore doubles)
      const mostRecentSinglesVideo = player.videos.find(v => !v.isDoubles && v.ranking != null && v.ranking !== '');
      player.mostRecentRanking = mostRecentSinglesVideo ? mostRecentSinglesVideo.ranking : null;
      player.mostRecentDate = player.videos[0].date;

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
