/**
 * Upcoming Video Section
 * Uses YouTube IFrame API to fetch the newest video from the members playlist
 * and displays it as a "coming next" section above the regular videos.
 *
 * Technique: load a hidden YT player with the playlist, call getPlaylist(),
 * grab index 0 (newest), then fetch title/thumbnail via oEmbed (no API key).
 */

(function () {
  'use strict';

  var PLAYLIST_ID = 'UUMOch5FlPyO-E9fcYu3DIXoew';

  // Members-only videos that never get released publicly — never show these as "upcoming".
  var EXCLUDED_VIDEO_IDS = ['8HtlB6eXDWo', '1hGyl7A-H84'];

  var section = document.getElementById('upcomingSection');
  if (!section) return;

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function fetchVideoMeta(videoId) {
    var title = '';
    var thumbnail = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
    try {
      var res = await fetch(
        'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' +
          videoId +
          '&format=json'
      );
      if (res.ok) {
        var data = await res.json();
        title = data.title || '';
        thumbnail = data.thumbnail_url || thumbnail;
      }
    } catch (_) {}
    return { videoId: videoId, title: title, thumbnail: thumbnail };
  }

  var DAY_LABELS = ['מחר', 'מחרתיים'];

  async function renderUpcomingVideos(videoIds) {
    var videos = await Promise.all(videoIds.map(fetchVideoMeta));

    var cardsHtml = videos
      .map(function (video, index) {
        var dayLabel = DAY_LABELS[index];
        return (
          '<div class="upcoming-video-card">' +
            '<div class="upcoming-thumbnail-link">' +
              '<img src="' + video.thumbnail + '" alt="' + escapeHtml(video.title) + '" class="upcoming-thumbnail-img" onerror="this.src=\'https://img.youtube.com/vi/' + video.videoId + '/hqdefault.jpg\'">' +
            '</div>' +
            '<div class="upcoming-video-info">' +
              (dayLabel ? '<div class="upcoming-video-day-label">' + dayLabel + '</div>' : '') +
              (video.title ? '<div class="upcoming-video-title">' + escapeHtml(video.title) + '</div>' : '') +
            '</div>' +
          '</div>'
        );
      })
      .join('');

    section.innerHTML =
      '<div class="event-group" id="event-upcoming-video">' +
        '<div class="event-header upcoming-video-event-header" onclick="toggleEventGroup(\'upcoming-video\')">' +
          '<div class="event-header-left">' +
            '<span class="event-collapse-icon">▼</span>' +
            '<div class="event-name upcoming-video-event-name">הסרטונים הבאים שיפורסמו</div>' +
          '</div>' +
          '<div class="upcoming-video-new-badge">חדש</div>' +
        '</div>' +
        '<div class="video-list">' + cardsHtml + '</div>' +
      '</div>';

    section.style.display = 'block';
  }

  function initPlayer() {
    var container = document.createElement('div');
    container.style.cssText =
      'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
    var playerEl = document.createElement('div');
    playerEl.id = 'upcoming-yt-hidden-player';
    container.appendChild(playerEl);
    document.body.appendChild(container);

    new window.YT.Player('upcoming-yt-hidden-player', {
      width: '1',
      height: '1',
      playerVars: {
        listType: 'playlist',
        list: PLAYLIST_ID,
        autoplay: 0,
      },
      events: {
        onReady: function (event) {
          var player = event.target;
          var allVideoIds = player.getPlaylist();
          container.remove();
          if (!allVideoIds || allVideoIds.length === 0) return;

          var releaseOrderIds = allVideoIds.filter(function (id) {
            return EXCLUDED_VIDEO_IDS.indexOf(id) === -1;
          });
          if (releaseOrderIds.length === 0) return;

          // Playlist order is newest-first, so the end of the array is oldest = next to be released.
          var upcomingIds = releaseOrderIds.slice(-2).reverse();
          renderUpcomingVideos(upcomingIds);
        },
        onError: function () {
          container.remove();
        },
      },
    });
  }

  if (window.YT && window.YT.Player) {
    initPlayer();
  } else {
    var prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prevCallback) prevCallback();
      initPlayer();
    };
    var script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }
})();
