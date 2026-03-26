/**
 * API Layer
 * Handles Firebase Firestore API calls with local JSON fallback
 */

const API = {
  /**
   * Check if running on localhost
   */
  isLocalhost() {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname === '';
  },

  /**
   * Get current data source mode
   */
  getMode() {
    // Check if user manually set the mode
    const manualMode = localStorage.getItem('dataSource');
    if (manualMode) {
      return manualMode;
    }

    // Default to local if on localhost
    if (this.isLocalhost()) {
      return 'local';
    }

    // Default to firebase for production
    return 'firebase';
  },

  /**
   * Check if should use local mode
   */
  shouldUseLocal() {
    return this.getMode() === 'local';
  },

  /**
   * Get the latest backup file from the backups directory
   */
  async getLatestBackupFile() {
    const backupFiles = [
      'backups/tttm-backup-all-2026-01-02.json',
      'backups/tttm-backup-all-2026-01-01.json',
      'backups/tttm-backup-all-2025-12-29.json'
    ];

    // Return the first file (most recent)
    return backupFiles[0];
  },

  /**
   * Get the latest backup filename (for display)
   */
  getLatestBackupFilename() {
    return 'tttm-backup-all-2026-01-02.json';
  },

  /**
   * Fetch videos from local JSON backup file
   */
  async fetchVideosFromBackup() {
    try {
      const backupFile = await this.getLatestBackupFile();
      console.log('Loading videos from backup file:', backupFile);

      const response = await fetch(backupFile);

      if (!response.ok) {
        console.error('Failed to fetch backup file');
        return [];
      }

      const data = await response.json();
      const videos = data.videos || [];

      console.log('Loaded', videos.length, 'videos from backup file');
      return videos;
    } catch (error) {
      console.error('Error fetching videos from backup:', error);
      return [];
    }
  },

  /**
   * Parse a Firestore document into a video object
   */
  parseFirestoreDoc(doc) {
    const fields = doc.fields;
    return {
      id: doc.name.split('/').pop(),
      match: fields.match?.stringValue || '',
      url: fields.url?.stringValue || '',
      currentPlayer: fields.currentPlayer?.stringValue || '',
      currentPlayerClub: fields.currentPlayerClub?.stringValue || '',
      currentPlayerId: fields.currentPlayerId?.stringValue || '',
      currentPlayerRanking: fields.currentPlayerRanking?.stringValue || '',
      opponentPlayer: fields.opponentPlayer?.stringValue || '',
      opponentClub: fields.opponentClub?.stringValue || '',
      opponentPlayerId: fields.opponentPlayerId?.stringValue || '',
      opponentRanking: fields.opponentRanking?.stringValue || '',
      score: fields.score?.stringValue || '',
      event: fields.event?.stringValue || 'ללא אירוע',
      createdAt: fields.createdAt?.timestampValue || '',
      updatedAt: fields.updatedAt?.timestampValue || ''
    };
  },

  /**
   * Fetch videos from Firebase Firestore (handles pagination)
   */
  async fetchVideosFromFirebase() {
    try {
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${window.APP_CONFIG.FIREBASE_CONFIG.projectId}/databases/(default)/documents/videos`;
      const videos = [];
      let pageToken = null;

      do {
        const url = pageToken ? `${baseUrl}?pageToken=${pageToken}` : baseUrl;

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Failed to fetch videos from Firebase');
          return videos.length > 0 ? videos : null;
        }

        const data = await response.json();

        if (data.documents) {
          data.documents.forEach(doc => {
            videos.push(this.parseFirestoreDoc(doc));
          });
        }

        pageToken = data.nextPageToken || null;
        console.log(`Loaded ${videos.length} videos from Firebase so far...`);
      } while (pageToken);

      console.log('Total videos loaded from Firebase:', videos.length);
      return videos;
    } catch (error) {
      console.error('Error fetching videos from Firebase:', error);
      return null;
    }
  },

  /**
   * Fetch all videos - uses backup on localhost or when Firebase fails
   */
  async fetchAllVideos() {
    const mode = this.getMode();

    // Use backup file if in local mode
    if (this.shouldUseLocal()) {
      console.log(`Running in ${mode} mode - using backup file`);
      return await this.fetchVideosFromBackup();
    }

    // Try Firebase first
    console.log('Running in firebase mode - fetching from Firebase');
    const videos = await this.fetchVideosFromFirebase();

    // Fallback to backup if Firebase failed
    if (videos === null) {
      console.log('Firebase unavailable - falling back to backup file');
      return await this.fetchVideosFromBackup();
    }

    return videos;
  }
};

// Export to window
window.API = API;
