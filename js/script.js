/* ============================================================
   SPOTIFY WEB PLAYER CLONE — script.js
   Frontend Interactions: Player, Navigation, Search, Animations
   ============================================================ */

'use strict';

/* ============================================================
   1. CONSTANTS & STATE
   ============================================================ */

/** App state object — single source of truth */
const State = {
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0, // 0 = off, 1 = repeat all, 2 = repeat one
  isLiked: false,
  isMuted: false,
  volume: 70,
  progress: 0, // 0–100
  currentPage: 'home',
  currentSong: {
    name: 'Blush EP',
    artist: 'Nova Hayes',
    img: 'assets/images/album_pop.png',
    duration: 204, // seconds
  },
  progressInterval: null,
  progressElapsed: 0,
};

/* Track library — used for cycling through songs */
const TRACKS = [
  { name: 'Blush EP',     artist: 'Nova Hayes',   img: 'assets/images/album_pop.png',    duration: 204 },
  { name: 'Neon City',    artist: 'Nova Hayes',   img: 'assets/images/album_hiphop.png', duration: 231 },
  { name: 'PULSE',        artist: 'Luna Wave',    img: 'assets/images/album_edm.png',    duration: 185 },
  { name: 'Velvet Soul',  artist: 'River Soul',   img: 'assets/images/album_rnb.png',    duration: 247 },
  { name: 'Wildwood',     artist: 'Kai Sterling', img: 'assets/images/album_indie.png',  duration: 198 },
  { name: 'Voltage',      artist: 'The Echoes',   img: 'assets/images/album_rock.png',   duration: 219 },
];

let currentTrackIndex = 0;

/* ============================================================
   2. DOM REFERENCES
   ============================================================ */

const $ = id => document.getElementById(id);

const DOM = {
  loadingScreen:   $('loading-screen'),
  app:             $('app'),
  sidebar:         $('sidebar'),
  sidebarOverlay:  $('sidebar-overlay'),

  // Top nav
  topNav:          $('top-nav'),
  backBtn:         $('back-btn'),
  forwardBtn:      $('forward-btn'),
  topSearchWrap:   $('top-search-wrapper'),
  mainSearchInput: $('main-search-input'),
  searchClearBtn:  $('search-clear-btn'),
  userAvatar:      $('user-avatar'),
  avatarDropdown:  $('avatar-dropdown'),
  premiumBtn:      $('premium-btn'),
  installBtn:      $('install-btn'),

  // Sidebar nav
  navHome:    $('nav-home'),
  navSearch:  $('nav-search'),
  navLibrary: $('nav-library'),

  // Pages
  homePage:    $('home-page'),
  searchPage:  $('search-page'),
  libraryPage: $('library-page'),
  categoryGrid: $('category-grid'),

  // Library
  createBtn:         $('create-btn'),
  createBanner:      $('create-playlist-banner'),
  libraryList:       $('library-list'),
  libraryFullList:   $('library-full-list'),
  librarySearch:     $('library-search'),

  // Player
  musicPlayer:     $('music-player'),
  playPauseBtn:    $('play-pause-btn'),
  playIcon:        $('play-icon'),
  prevBtn:         $('prev-btn'),
  nextBtn:         $('next-btn'),
  shuffleBtn:      $('shuffle-btn'),
  repeatBtn:       $('repeat-btn'),
  likeBtn:         $('like-btn'),
  playerImg:       $('player-img'),
  playerTrackName: $('player-track-name'),
  playerTrackArtist: $('player-track-artist'),
  progressFill:    $('progress-fill'),
  progressThumb:   $('progress-thumb'),
  progressWrapper: $('progress-bar-wrapper'),
  currentTime:     $('current-time'),
  totalTime:       $('total-time'),
  volumeSlider:    $('volume-slider'),
  volumeIconBtn:   $('volume-icon-btn'),
  volumeIcon:      $('volume-icon'),

  // Mobile nav
  mobileBottomNav: $('mobile-bottom-nav'),
  mobNavHome:      $('mob-nav-home'),
  mobNavSearch:    $('mob-nav-search'),
  mobNavLibrary:   $('mob-nav-library'),

  // Library filter tabs
  filterTabs:    document.querySelectorAll('.filter-tab'),
  libFullItems:  document.querySelectorAll('.lib-full-item'),
  libSortBtn:    $('lib-sort-btn'),
  libSortLabel:  $('lib-sort-label'),

  // Content area
  contentArea:   $('content-area'),
};

/* ============================================================
   3. LOADING SCREEN
   ============================================================ */

/**
 * Handles the loading screen fade-out and app reveal.
 * Uses requestAnimationFrame for smooth display.
 */
function initLoadingScreen() {
  // CSS animation handles the fade at 1.8s; we show the app slightly earlier
  setTimeout(() => {
    DOM.app.style.display = 'grid';
    DOM.musicPlayer.style.display = 'flex';

    requestAnimationFrame(() => {
      // Trigger staggered fade-in of content sections
      document.querySelectorAll('.content-section').forEach((section, i) => {
        section.style.animationDelay = `${0.05 * i}s`;
      });
    });
  }, 1600);

  // Remove loading screen from DOM after animation completes
  setTimeout(() => {
    if (DOM.loadingScreen) {
      DOM.loadingScreen.style.display = 'none';
    }
  }, 2500);
}

/* ============================================================
   4. PAGE NAVIGATION
   ============================================================ */

/**
 * Navigate to a specific page view.
 * @param {string} page - 'home' | 'search' | 'library'
 */
function navigateTo(page) {
  if (State.currentPage === page) return;

  // Hide all pages
  [DOM.homePage, DOM.searchPage, DOM.libraryPage].forEach(p => {
    if (p) {
      p.style.display = 'none';
      p.classList.remove('active-page');
    }
  });

  // Update nav link states
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

  // Show selected page
  switch (page) {
    case 'home':
      DOM.homePage.style.display = 'block';
      DOM.homePage.classList.add('active-page');
      DOM.navHome?.classList.add('active');
      DOM.topSearchWrap.style.display = 'none';
      break;

    case 'search':
      DOM.searchPage.style.display = 'block';
      DOM.searchPage.classList.add('active-page');
      DOM.navSearch?.classList.add('active');
      DOM.topSearchWrap.style.display = 'flex';
      setTimeout(() => DOM.mainSearchInput?.focus(), 200);
      break;

    case 'library':
      DOM.libraryPage.style.display = 'block';
      DOM.libraryPage.classList.add('active-page');
      DOM.navLibrary?.classList.add('active');
      DOM.topSearchWrap.style.display = 'none';
      break;
  }

  // Update mobile nav active state
  document.querySelectorAll('.mob-nav-item').forEach(item => item.classList.remove('active'));
  const activeMobLink = document.querySelector(`.mob-nav-item[data-page="${page}"]`);
  if (activeMobLink) activeMobLink.classList.add('active');

  State.currentPage = page;

  // Scroll content to top
  DOM.contentArea.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Set up all navigation link listeners.
 */
function initNavigation() {
  // Sidebar nav links
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Mobile bottom nav
  document.querySelectorAll('.mob-nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page === 'premium') {
        showPremiumModal();
        return;
      }
      navigateTo(page);
    });
  });

  // Back / Forward buttons (basic history)
  DOM.backBtn?.addEventListener('click', () => {
    window.history.back();
    showToast('Going back…');
  });
  DOM.forwardBtn?.addEventListener('click', () => {
    window.history.forward();
    showToast('Going forward…');
  });
}

/* ============================================================
   5. MUSIC PLAYER — CONTROLS
   ============================================================ */

/**
 * Load and display a track in the player bar.
 * @param {Object} track
 */
function loadTrack(track) {
  State.currentSong = track;
  State.progressElapsed = 0;
  State.progress = 0;

  DOM.playerImg.src = track.img;
  DOM.playerImg.alt = track.name;
  DOM.playerTrackName.textContent = track.name;
  DOM.playerTrackArtist.textContent = track.artist;
  DOM.totalTime.textContent = formatTime(track.duration);
  DOM.progressFill.style.width = '0%';
  DOM.currentTime.textContent = '0:00';

  // Animate player image swap
  DOM.playerImg.classList.add('img-swap');
  setTimeout(() => DOM.playerImg.classList.remove('img-swap'), 300);

  showToast(`Now playing: ${track.name}`);
}

/**
 * Play a track by clicking any card or quick-access button.
 * @param {string} name - Song name
 * @param {string} artist - Artist name
 * @param {string} img - Image path
 */
function playSong(name, artist, img) {
  const track = { name, artist, img, duration: 204 + Math.floor(Math.random() * 80) };
  const trackIndex = TRACKS.findIndex(t => t.name === name);
  if (trackIndex !== -1) {
    currentTrackIndex = trackIndex;
    loadTrack(TRACKS[currentTrackIndex]);
  } else {
    loadTrack(track);
  }
  startPlayback();
}

/**
 * Toggle play/pause state.
 */
function togglePlayPause() {
  State.isPlaying = !State.isPlaying;

  if (State.isPlaying) {
    startPlayback();
  } else {
    pausePlayback();
  }
}

/**
 * Start or resume progress bar animation.
 */
function startPlayback() {
  State.isPlaying = true;

  // Update play icon to pause
  DOM.playIcon.className = 'fas fa-pause';
  DOM.playPauseBtn.setAttribute('aria-label', 'Pause');

  // Clear existing interval
  if (State.progressInterval) clearInterval(State.progressInterval);

  // Animate progress bar every second
  State.progressInterval = setInterval(() => {
    if (!State.isPlaying) return;

    State.progressElapsed++;

    const duration = State.currentSong.duration;
    const pct = Math.min((State.progressElapsed / duration) * 100, 100);

    DOM.progressFill.style.width = pct + '%';
    DOM.currentTime.textContent = formatTime(State.progressElapsed);

    // Update volume slider visual fill
    updateVolumeSliderFill();

    // Auto-advance when track ends
    if (State.progressElapsed >= duration) {
      playNext();
    }
  }, 1000);
}

/**
 * Pause playback.
 */
function pausePlayback() {
  State.isPlaying = false;
  clearInterval(State.progressInterval);
  DOM.playIcon.className = 'fas fa-play';
  DOM.playPauseBtn.setAttribute('aria-label', 'Play');
}

/**
 * Play next track.
 */
function playNext() {
  if (State.repeatMode === 2) {
    // Repeat one
    State.progressElapsed = 0;
    startPlayback();
    return;
  }

  if (State.isShuffle) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * TRACKS.length);
    } while (nextIndex === currentTrackIndex && TRACKS.length > 1);
    currentTrackIndex = nextIndex;
  } else {
    currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
  }

  loadTrack(TRACKS[currentTrackIndex]);
  if (State.isPlaying) startPlayback();
}

/**
 * Play previous track or restart current.
 */
function playPrev() {
  if (State.progressElapsed > 3) {
    // If >3s elapsed, restart current track
    State.progressElapsed = 0;
    DOM.progressFill.style.width = '0%';
    DOM.currentTime.textContent = '0:00';
    if (State.isPlaying) startPlayback();
    return;
  }

  currentTrackIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
  loadTrack(TRACKS[currentTrackIndex]);
  if (State.isPlaying) startPlayback();
}

/**
 * Toggle shuffle mode.
 */
function toggleShuffle() {
  State.isShuffle = !State.isShuffle;
  DOM.shuffleBtn.classList.toggle('active', State.isShuffle);
  showToast(State.isShuffle ? 'Shuffle: On' : 'Shuffle: Off');
}

/**
 * Cycle through repeat modes: off → all → one → off.
 */
function cycleRepeat() {
  State.repeatMode = (State.repeatMode + 1) % 3;
  DOM.repeatBtn.classList.toggle('active', State.repeatMode > 0);

  const repeatIcon = DOM.repeatBtn.querySelector('i');
  if (State.repeatMode === 2) {
    repeatIcon.className = 'fas fa-redo';
    // Show "1" badge
    DOM.repeatBtn.setAttribute('title', 'Repeat: One');
    showToast('Repeat: One');
  } else if (State.repeatMode === 1) {
    DOM.repeatBtn.setAttribute('title', 'Repeat: All');
    showToast('Repeat: All');
  } else {
    DOM.repeatBtn.setAttribute('title', 'Repeat: Off');
    showToast('Repeat: Off');
  }
}

/**
 * Toggle like/save state on current track.
 */
function toggleLike() {
  State.isLiked = !State.isLiked;
  const icon = DOM.likeBtn.querySelector('i');
  icon.className = State.isLiked ? 'fas fa-heart' : 'far fa-heart';
  DOM.likeBtn.classList.toggle('liked', State.isLiked);
  showToast(State.isLiked ? `Saved to Liked Songs` : `Removed from Liked Songs`);
}

/**
 * Initialize player controls event listeners.
 */
function initPlayerControls() {
  DOM.playPauseBtn?.addEventListener('click', togglePlayPause);
  DOM.nextBtn?.addEventListener('click', () => { playNext(); });
  DOM.prevBtn?.addEventListener('click', () => { playPrev(); });
  DOM.shuffleBtn?.addEventListener('click', toggleShuffle);
  DOM.repeatBtn?.addEventListener('click', cycleRepeat);
  DOM.likeBtn?.addEventListener('click', toggleLike);

  // Click on track name/artist to show toast
  DOM.playerTrackName?.addEventListener('click', () => {
    showToast(`Viewing: ${State.currentSong.name}`);
  });
}

/* ============================================================
   6. PROGRESS BAR
   ============================================================ */

/**
 * Format seconds to M:SS string.
 * @param {number} secs
 * @returns {string}
 */
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Initialize progress bar click and drag interactions.
 */
function initProgressBar() {
  let isDragging = false;

  /**
   * Seek to position based on click/touch X coordinate.
   * @param {MouseEvent|TouchEvent} e
   */
  function seekTo(e) {
    const rect = DOM.progressWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const duration = State.currentSong.duration;

    State.progressElapsed = Math.floor(ratio * duration);
    DOM.progressFill.style.width = (ratio * 100) + '%';
    DOM.currentTime.textContent = formatTime(State.progressElapsed);
  }

  DOM.progressWrapper?.addEventListener('mousedown', e => {
    isDragging = true;
    seekTo(e);
  });

  document.addEventListener('mousemove', e => {
    if (isDragging) seekTo(e);
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch support
  DOM.progressWrapper?.addEventListener('touchstart', seekTo, { passive: true });
  DOM.progressWrapper?.addEventListener('touchmove', seekTo, { passive: true });
}

/* ============================================================
   7. VOLUME SLIDER
   ============================================================ */

/**
 * Update the volume slider's visual fill gradient.
 */
function updateVolumeSliderFill() {
  const val = DOM.volumeSlider?.value || 70;
  if (DOM.volumeSlider) {
    DOM.volumeSlider.style.backgroundSize = `${val}% 100%`;
  }
}

/**
 * Update the volume icon based on current volume level.
 * @param {number} vol - 0 to 100
 */
function updateVolumeIcon(vol) {
  if (!DOM.volumeIcon) return;
  if (vol === 0 || State.isMuted) {
    DOM.volumeIcon.className = 'fas fa-volume-mute';
  } else if (vol < 40) {
    DOM.volumeIcon.className = 'fas fa-volume-down';
  } else {
    DOM.volumeIcon.className = 'fas fa-volume-up';
  }
}

/**
 * Initialize volume slider interactions.
 */
function initVolume() {
  DOM.volumeSlider?.addEventListener('input', e => {
    State.volume = parseInt(e.target.value);
    if (State.isMuted && State.volume > 0) {
      State.isMuted = false;
    }
    updateVolumeIcon(State.volume);
    updateVolumeSliderFill();
  });

  // Volume icon click toggles mute
  DOM.volumeIconBtn?.addEventListener('click', () => {
    State.isMuted = !State.isMuted;
    if (State.isMuted) {
      DOM.volumeSlider.value = 0;
      DOM.volumeSlider.style.backgroundSize = '0% 100%';
      updateVolumeIcon(0);
    } else {
      DOM.volumeSlider.value = State.volume || 70;
      updateVolumeSliderFill();
      updateVolumeIcon(State.volume || 70);
    }
  });

  // Initial fill
  updateVolumeSliderFill();
}

/* ============================================================
   8. MUSIC CARDS — CLICK TO PLAY
   ============================================================ */

/**
 * Attach click handlers to all music/artist cards and quick-access buttons.
 */
function initCardInteractions() {
  // All music cards and artist cards
  document.querySelectorAll('.music-card, .artist-card').forEach(card => {
    card.addEventListener('click', e => {
      // Ripple effect
      triggerRipple(card, e);

      const name   = card.dataset.song   || 'Unknown Track';
      const artist = card.dataset.artist || 'Unknown Artist';
      const img    = card.dataset.img    || 'assets/images/album_pop.png';

      playSong(name, artist, img);
    });

    // Keyboard support: Enter or Space to play
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Quick access cards (greeting grid)
  document.querySelectorAll('.quick-card').forEach(card => {
    card.addEventListener('click', e => {
      // Don't double-fire from nested button
      if (e.target.closest('.quick-play-btn') && e.target !== card) return;

      const name   = card.dataset.song   || 'Unknown Track';
      const artist = card.dataset.artist || 'Unknown Artist';
      const img    = card.dataset.img    || 'assets/images/album_pop.png';

      playSong(name, artist, img);
    });

    // Quick play button within card
    const playBtn = card.querySelector('.quick-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', e => {
        e.stopPropagation();
        const name   = card.dataset.song   || 'Unknown Track';
        const artist = card.dataset.artist || 'Unknown Artist';
        const img    = card.dataset.img    || 'assets/images/album_pop.png';
        playSong(name, artist, img);
      });
    }
  });

  // Library items
  document.querySelectorAll('.library-item, .lib-full-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        const name = item.querySelector('.lib-name, .lib-full-name')?.textContent || 'Unknown';
        const meta = item.querySelector('.lib-meta, .lib-full-meta')?.textContent || '';
        playSong(name, meta, img.src);
      }
    });
  });
}

/* ============================================================
   9. RIPPLE EFFECT
   ============================================================ */

/**
 * Trigger a CSS ripple animation on a card.
 * @param {HTMLElement} el
 * @param {MouseEvent} e
 */
function triggerRipple(el, e) {
  el.classList.add('ripple');
  setTimeout(() => el.classList.remove('ripple'), 400);
}

/* ============================================================
   10. SEARCH FUNCTIONALITY
   ============================================================ */

/**
 * Filter category cards based on search input.
 * @param {string} query
 */
function filterCategories(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.category-card').forEach(card => {
    const label = card.dataset.category?.toLowerCase() || '';
    if (!q || label.includes(q)) {
      card.style.display = 'flex';
      card.style.opacity = '1';
    } else {
      card.style.opacity = '0.2';
    }
  });
}

/**
 * Initialize search input events.
 */
function initSearch() {
  DOM.mainSearchInput?.addEventListener('input', e => {
    const val = e.target.value;
    DOM.searchClearBtn.style.display = val ? 'block' : 'none';
    filterCategories(val);
  });

  DOM.searchClearBtn?.addEventListener('click', () => {
    DOM.mainSearchInput.value = '';
    DOM.searchClearBtn.style.display = 'none';
    filterCategories('');
    DOM.mainSearchInput.focus();
  });

  // Category card click
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.dataset.category;
      showToast(`Browsing: ${category}`);
    });
  });
}

/* ============================================================
   11. LIBRARY FILTER TABS
   ============================================================ */

/**
 * Initialize library tab filtering.
 */
function initLibraryTabs() {
  DOM.filterTabs?.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      DOM.filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      // Filter library items
      DOM.libFullItems?.forEach(item => {
        const type = item.dataset.type;
        if (filter === 'all' || type === filter) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Library search filter
  DOM.librarySearch?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    DOM.libFullItems?.forEach(item => {
      const name = item.querySelector('.lib-full-name')?.textContent.toLowerCase() || '';
      item.style.display = !q || name.includes(q) ? 'flex' : 'none';
    });
  });

  // Sort button cycle
  const sortOptions = ['Recents', 'Recently Added', 'Alphabetical', 'Creator'];
  let sortIndex = 0;
  DOM.libSortBtn?.addEventListener('click', () => {
    sortIndex = (sortIndex + 1) % sortOptions.length;
    if (DOM.libSortLabel) DOM.libSortLabel.textContent = sortOptions[sortIndex];
    showToast(`Sorted by: ${sortOptions[sortIndex]}`);
  });
}

/* ============================================================
   12. USER AVATAR DROPDOWN
   ============================================================ */

/**
 * Initialize avatar dropdown toggle.
 */
function initAvatarDropdown() {
  DOM.userAvatar?.addEventListener('click', e => {
    e.stopPropagation();
    DOM.avatarDropdown?.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', () => {
    DOM.avatarDropdown?.classList.remove('open');
  });

  // Keyboard: Enter to toggle
  DOM.userAvatar?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      DOM.avatarDropdown?.classList.toggle('open');
    }
    if (e.key === 'Escape') {
      DOM.avatarDropdown?.classList.remove('open');
    }
  });
}

/* ============================================================
   13. SIDEBAR MOBILE TOGGLE
   ============================================================ */

/**
 * Initialize sidebar toggle for mobile/tablet.
 */
function initSidebarToggle() {
  // Open sidebar from hamburger (top-nav pseudo-element trick → use a real button)
  // We detect clicks on the top-nav ::before area by adding a real button on mobile
  const hamburgerArea = document.querySelector('.top-nav');

  // We'll handle this via the top-nav click on the left ~40px
  hamburgerArea?.addEventListener('click', e => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    // If click is on left 48px of top nav (hamburger zone)
    const rect = hamburgerArea.getBoundingClientRect();
    if (e.clientX - rect.left < 48) {
      openSidebar();
    }
  });

  // Close via overlay
  DOM.sidebarOverlay?.addEventListener('click', closeSidebar);

  // Keyboard: Escape closes sidebar
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSidebar();
      DOM.avatarDropdown?.classList.remove('open');
    }
  });
}

function openSidebar() {
  DOM.sidebar?.classList.add('open');
  DOM.sidebarOverlay?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  DOM.sidebar?.classList.remove('open');
  DOM.sidebarOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

/* ============================================================
   14. STICKY TOP NAV — Scroll detection
   ============================================================ */

/**
 * Add scroll listener to change top-nav background on scroll.
 */
function initStickyNav() {
  DOM.contentArea?.addEventListener('scroll', () => {
    const scrolled = DOM.contentArea.scrollTop > 10;
    DOM.topNav?.classList.toggle('scrolled', scrolled);
  });
}

/* ============================================================
   15. CREATE PLAYLIST (Sidebar banner)
   ============================================================ */

/**
 * Handle create playlist button — show library list.
 */
function initCreatePlaylist() {
  DOM.createBtn?.addEventListener('click', () => {
    if (DOM.createBanner) DOM.createBanner.style.display = 'none';
    if (DOM.libraryList) DOM.libraryList.style.display = 'flex';
    showToast('Playlist created!');
  });

  // "Browse podcasts" button
  $('browse-podcasts-btn')?.addEventListener('click', () => {
    navigateTo('search');
    showToast('Browse podcasts & shows');
  });
}

/* ============================================================
   16. PREMIUM MODAL
   ============================================================ */

/**
 * Show a Premium upgrade modal overlay.
 */
function showPremiumModal() {
  // Remove existing if present
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'premium-banner';
  modal.innerHTML = `
    <svg viewBox="0 0 24 24" fill="#1DB954" width="48" height="48" style="margin:0 auto 16px">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
    <h2>Try Premium free for 3 months</h2>
    <p>Ad-free music, offline listening, and more. Only $9.99/month after. Cancel anytime.</p>
    <div style="display:flex;flex-direction:column;gap:12px;align-items:center">
      <button class="btn-green" id="premium-try-btn">Try free for 3 months</button>
      <button style="color:#b3b3b3;font-size:13px;font-weight:600;padding:8px;" id="premium-close-btn">Not now</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Close handlers
  const closeModal = () => {
    overlay.remove();
    modal.remove();
  };
  overlay.addEventListener('click', closeModal);
  modal.querySelector('#premium-close-btn')?.addEventListener('click', closeModal);
  modal.querySelector('#premium-try-btn')?.addEventListener('click', () => {
    showToast('Redirecting to Spotify Premium…');
    closeModal();
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
  });
}

/* ============================================================
   17. PREMIUM & INSTALL BUTTONS
   ============================================================ */

function initTopNavButtons() {
  DOM.premiumBtn?.addEventListener('click', showPremiumModal);
  DOM.installBtn?.addEventListener('click', () => showToast('Spotify App download started'));
}

/* ============================================================
   18. TOAST NOTIFICATIONS
   ============================================================ */

let toastTimeout;

/**
 * Show a temporary toast notification.
 * @param {string} message
 */
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);

  toastTimeout = setTimeout(() => {
    toast.remove();
  }, 2500);
}

/* ============================================================
   19. STAGGERED CARD ANIMATIONS
   ============================================================ */

/**
 * Apply staggered animation delays to all cards in each grid.
 */
function initCardAnimations() {
  document.querySelectorAll('.cards-grid').forEach(grid => {
    const cards = grid.querySelectorAll('.music-card, .artist-card');
    cards.forEach((card, i) => {
      card.style.animationDelay = `${0.04 * i}s`;
    });
  });

  document.querySelectorAll('.category-card').forEach((card, i) => {
    card.style.animationDelay = `${0.03 * i}s`;
  });
}

/* ============================================================
   20. GREETING — TIME-BASED MESSAGE
   ============================================================ */

/**
 * Set a dynamic greeting in the home page based on time of day.
 */
function initGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  // The greeting section doesn't have an h1 yet — we can prepend one
  const homePage = DOM.homePage;
  if (homePage) {
    const h1 = document.createElement('h1');
    h1.textContent = greeting;
    h1.style.cssText = `
      font-size: clamp(20px, 3vw, 32px);
      font-weight: 800;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    `;
    homePage.insertBefore(h1, homePage.firstChild);
  }
}

/* ============================================================
   21. KEYBOARD SHORTCUTS
   ============================================================ */

/**
 * Global keyboard shortcuts.
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Don't intercept when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); playNext(); }
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); playPrev(); }
        break;
      case 'ArrowUp':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const newVol = Math.min(100, (parseInt(DOM.volumeSlider?.value) || 70) + 10);
          if (DOM.volumeSlider) { DOM.volumeSlider.value = newVol; }
          State.volume = newVol;
          updateVolumeIcon(newVol);
          updateVolumeSliderFill();
        }
        break;
      case 'ArrowDown':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const newVol = Math.max(0, (parseInt(DOM.volumeSlider?.value) || 70) - 10);
          if (DOM.volumeSlider) { DOM.volumeSlider.value = newVol; }
          State.volume = newVol;
          updateVolumeIcon(newVol);
          updateVolumeSliderFill();
        }
        break;
      case 'm':
      case 'M':
        if (!e.ctrlKey && !e.metaKey) {
          DOM.volumeIconBtn?.click();
        }
        break;
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          toggleShuffle();
        }
        break;
      case 'r':
      case 'R':
        if (!e.ctrlKey && !e.metaKey) {
          cycleRepeat();
        }
        break;
    }
  });
}

/* ============================================================
   22. INTERSECTION OBSERVER — Lazy Animation
   ============================================================ */

/**
 * Observe content sections and cards, animate them as they enter viewport.
 */
function initIntersectionObserver() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  // Observe content sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    observer.observe(section);
  });
}

/* ============================================================
   23. EQUALIZER ANIMATION FOR NOW-PLAYING
   ============================================================ */

/**
 * Add equalizer animation bars to the currently playing library item.
 */
function updateNowPlayingIndicator() {
  document.querySelectorAll('.now-playing-indicator').forEach(el => el.remove());
}

/* ============================================================
   24. INIT — Entry Point
   ============================================================ */

/**
 * Main initialization function.
 * Called once DOM is ready.
 */
function init() {
  // 1. Loading screen
  initLoadingScreen();

  // 2. Navigation
  initNavigation();

  // 3. Player controls
  initPlayerControls();

  // 4. Progress bar
  initProgressBar();

  // 5. Volume
  initVolume();

  // 6. Card interactions
  initCardInteractions();

  // 7. Search
  initSearch();

  // 8. Library tabs
  initLibraryTabs();

  // 9. Avatar dropdown
  initAvatarDropdown();

  // 10. Sidebar toggle (mobile)
  initSidebarToggle();

  // 11. Sticky nav
  initStickyNav();

  // 12. Create playlist
  initCreatePlaylist();

  // 13. Top nav buttons
  initTopNavButtons();

  // 14. Staggered animations
  initCardAnimations();

  // 15. Greeting
  initGreeting();

  // 16. Keyboard shortcuts
  initKeyboardShortcuts();

  // 17. Intersection observer (lazy animations)
  initIntersectionObserver();

  // 18. Initial state
  updateVolumeSliderFill();
  updateVolumeIcon(State.volume);

  // 19. Default track loaded — show player after loading
  setTimeout(() => {
    loadTrack(TRACKS[currentTrackIndex]);
  }, 1700);

  console.log('🎵 Spotify Clone initialized. Keyboard shortcuts: Space=Play/Pause, Ctrl+→=Next, Ctrl+←=Prev, M=Mute, S=Shuffle, R=Repeat');
}

/* ============================================================
   25. DOM READY
   ============================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
