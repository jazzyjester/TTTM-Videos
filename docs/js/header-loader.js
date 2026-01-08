/**
 * Header Loader - Dynamically loads the shared header component
 * This allows maintaining a single header across all pages
 */

// Configuration for page-specific header content
const PAGE_CONFIGS = {
  'index.html': {
    title: 'טנ"ש ישראלי - סרטונים',
    subtitle: 'כל הסרטונים שהועלו, ממוינים לפי אירוע ותאריך'
  },
  'players.html': {
    title: 'טנ"ש ישראלי - סרטונים',
    subtitle: 'כל הסרטונים שהועלו, ממוינים לפי אירוע ותאריך'
  },
  'player-stats.html': {
    title: 'טנ"ש ישראלי - סרטונים',
    subtitle: 'כל הסרטונים שהועלו, ממוינים לפי אירוע ותאריך'
  }
};

/**
 * Loads the shared header into the page
 */
async function loadHeader() {
  try {
    // Fetch the header HTML
    const response = await fetch('header.html');
    if (!response.ok) {
      throw new Error(`Failed to load header: ${response.status}`);
    }

    const headerHTML = await response.text();

    // Insert the header into the page
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = headerHTML;

      // Customize header based on current page
      customizeHeader();
    } else {
      console.error('Header container not found. Make sure you have a <div id="header-container"></div> in your page.');
    }
  } catch (error) {
    console.error('Error loading header:', error);
    // Fallback: show a basic header
    showFallbackHeader();
  }
}

/**
 * Customizes the header title and subtitle based on the current page
 */
function customizeHeader() {
  // Get the current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Get configuration for this page
  const config = PAGE_CONFIGS[currentPage] || PAGE_CONFIGS['index.html'];

  // Update title and subtitle
  const titleElement = document.getElementById('header-title');
  const subtitleElement = document.getElementById('header-subtitle');

  if (titleElement) {
    titleElement.textContent = config.title;
  }

  if (subtitleElement) {
    subtitleElement.textContent = config.subtitle;
  }

  // Show environment indicator if running locally
  showEnvironmentIndicator();
}

/**
 * Shows environment indicator when running on localhost
 */
function showEnvironmentIndicator() {
  const envBadge = document.getElementById('envBadge');
  if (!envBadge) return;

  // Only show badge on localhost
  const isLocalhost = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';

  if (!isLocalhost) {
    return; // Don't show badge on production
  }

  // Show the badge
  envBadge.classList.add('visible');

  // Update badge based on current mode
  updateEnvBadge();

  // Add click handler to toggle menu
  envBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('envMenu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    const menu = document.getElementById('envMenu');
    if (menu) {
      menu.style.display = 'none';
    }
  });
}

/**
 * Updates the environment badge appearance
 */
function updateEnvBadge() {
  const mode = window.API?.getMode() || 'local';
  const badge = document.getElementById('envBadge');
  const badgeText = document.getElementById('envBadgeText');

  if (!badge || !badgeText) return;

  if (mode === 'firebase') {
    badge.classList.add('firebase-mode');
    badgeText.textContent = 'אמיתי';
  } else {
    badge.classList.remove('firebase-mode');
    const filename = window.API?.getLatestBackupFilename() || 'backup file';
    badgeText.textContent = `מקומי (${filename})`;
  }
}

/**
 * Switch to local mode (backup files)
 */
function switchToLocal() {
  localStorage.setItem('dataSource', 'local');
  location.reload();
}

/**
 * Switch to Firebase mode (real data)
 */
function switchToFirebase() {
  localStorage.setItem('dataSource', 'firebase');
  location.reload();
}

/**
 * Shows a fallback header if the main header fails to load
 */
function showFallbackHeader() {
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="header">
        <div class="header-content">
          <h1>טנ"ש ישראלי - סרטונים</h1>
          <p class="subtitle">כל הסרטונים שהועלו, ממוינים לפי אירוע ותאריך</p>
        </div>
      </div>
    `;
  }
}

/**
 * Opens the favorites modal
 */
function addToFavorites() {
  const modal = document.getElementById('favoritesModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Closes the favorites modal
 */
function closeFavoritesModal() {
  const modal = document.getElementById('favoritesModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Toggles the mobile menu open/closed
 */
function toggleMobileMenu() {
  const headerLinks = document.getElementById('headerLinks');
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const backdrop = document.getElementById('mobileMenuBackdrop');
  
  if (headerLinks) {
    const isActive = headerLinks.classList.toggle('active');
    
    // Toggle backdrop
    if (backdrop) {
      backdrop.classList.toggle('active', isActive);
    }
    
    // Toggle body scroll
    document.body.classList.toggle('mobile-menu-open', isActive);
    
    // Update icon
    if (menuToggle) {
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.className = isActive ? 'fa-solid fa-times' : 'fa-solid fa-bars';
      }
    }
  }
}

/**
 * Closes the mobile menu when clicking a link
 */
function closeMobileMenu() {
  const headerLinks = document.getElementById('headerLinks');
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const backdrop = document.getElementById('mobileMenuBackdrop');
  
  if (headerLinks && headerLinks.classList.contains('active')) {
    headerLinks.classList.remove('active');
    
    // Hide backdrop
    if (backdrop) {
      backdrop.classList.remove('active');
    }
    
    // Re-enable body scroll
    document.body.classList.remove('mobile-menu-open');
    
    // Reset icon
    if (menuToggle) {
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.className = 'fa-solid fa-bars';
      }
    }
  }
}

// Load the header when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadHeader);
} else {
  // DOM is already ready
  loadHeader();
}

// Make functions globally available for onclick handlers
window.addToFavorites = addToFavorites;
window.closeFavoritesModal = closeFavoritesModal;
window.switchToLocal = switchToLocal;
window.switchToFirebase = switchToFirebase;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
