/**
 * Main Application Entry Point
 * Initializes the app and sets up event listeners
 */

// Global function for event group collapse (called from onclick)
function toggleEventGroup(eventId) {
  const eventGroup = document.getElementById(`event-${eventId}`);
  if (eventGroup) {
    eventGroup.classList.toggle('collapsed');
  }
}

// Global function for filter group collapse (called from onclick)
function toggleFilterGroup(groupId) {
  const filterGroup = document.getElementById(groupId);
  if (filterGroup) {
    filterGroup.classList.toggle('collapsed');
  }
}

// Global function to show favorites modal
function addToFavorites() {
  const modal = document.getElementById('favoritesModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
  }
}

// Global function to close favorites modal
function closeFavoritesModal() {
  const modal = document.getElementById('favoritesModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('favoritesModal');
  if (modal && e.target === modal) {
    closeFavoritesModal();
  }
});

/**
 * Load and initialize the application
 */
async function loadPage() {
  try {
    // Fetch videos from Firebase
    const videos = await window.API.fetchAllVideos();

    // Initialize UI with videos
    window.UI.init(videos);

    // Render initial state
    window.UI.renderPlayerList(videos);
    window.UI.renderClubList(videos);
    window.UI.renderEventList(videos);
    window.UI.renderDateRangeList(videos);
    window.UI.renderContent();

  } catch (error) {
    console.error('Error loading page:', error);
    window.UI.showError('שגיאה בטעינת הסרטונים. אנא נסה שוב מאוחר יותר.');
  }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Player search input
  const playerSearchInput = document.getElementById('playerSearchInput');
  if (playerSearchInput) {
    playerSearchInput.addEventListener('input', (e) => {
      window.Filters.setPlayerSearch(e.target.value);
      window.UI.renderPlayerList(window.UI.allVideos);
    });
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      window.Filters.clearAll();
    });
  }
}

/**
 * Start the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadPage();
});
