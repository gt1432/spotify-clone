/* ============================================================
   SPOTIFY WEB PLAYER CLONE — script.js
   Frontend Interactions: Real Audio Playback + Full UI
   ============================================================ */

'use strict';

/* ============================================================
   1. CONSTANTS & STATE
   ============================================================ */

/** App state — single source of truth */
const State = {
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0,   // 0=off, 1=repeat-all, 2=repeat-one
  isLiked: false,
  isMuted: false,
  volume: 70,
  currentPage: 'home',
};

let currentTrackIndex = 0;

/* ============================================================
   TRACK LIBRARY — Free royalty-free audio via SoundHelix
   (Long-form ambient/electronic demo tracks, no copyright)
   ============================================================ */
const TRACKS = [
  {
    name:   'Blush EP',
    artist: 'Nova Hayes',
    img:    'assets/images/album_pop.png',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    name:   'Neon City',
    artist: 'Nova Hayes',
    img:    'assets/images/album_hiphop.png',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    name:   'PULSE',
    artist: 'Luna Wave',
    img:    'assets/images/album_edm.png',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    name:   'Velvet Soul',
    artist: 'River Soul',
    img:    'assets/images/album_rnb.png',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    name:   'Wildwood',
    artist: 'Kai Sterling',
    img:    'assets/images/album_indie.png',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    name:   'Voltage',
    artist: 'The Echoes',
    img:    'assets/images/album_rock.png',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
];

/* ============================================================
   2. HTML5 AUDIO ENGINE
   ============================================================ */

/** Single Audio instance reused for all tracks */
const audio = new Audio();
audio.crossOrigin = 'anonymous';
audio.volume = 0.7;
audio.preload = 'metadata';

/**
 * Load a track into the audio engine and update the player UI.
 * @param {number} index - index in TRACKS array
 * @param {boolean} autoPlay - whether to start playing immediately
 */
function loadTrack(index, autoPlay = false) {
  const track = TRACKS[index];
  currentTrackIndex = index;

  // Update audio source
  audio.src = track.src;
  audio.load();

  // Update player UI
  updatePlayerUI(track);

  // Reset progress display
  updateProgressDisplay(0, 0);

  if (autoPlay) {
    playAudio();
  } else {
    setPlayingState(false);
  }

  showToast(`Now playing: ${track.name}`);
}

/**
 * Start audio playback. Handles browser autoplay policy.
 */
function playAudio() {
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        setPlayingState(true);
      })
      .catch(err => {
        // Browser blocked autoplay — inform user to interact
        console.warn('Autoplay blocked:', err);
        setPlayingState(false);
        showToast('Click Play to start audio ▶');
      });
  }
}

/**
 * Pause audio playback.
 */
function pauseAudio() {
  audio.pause();
  setPlayingState(false);
}

/**
 * Toggle play/pause.
 */
function togglePlayPause() {
  if (audio.paused) {
    if (!audio.src || audio.src === window.location.href) {
      loadTrack(currentTrackIndex, true);
    } else {
      playAudio();
    }
  } else {
    pauseAudio();
  }
}

/* ============================================================
   3. AUDIO EVENT LISTENERS
   ============================================================ */

/** Track ended — advance to next */
audio.addEventListener('ended', () => {
  if (State.repeatMode === 2) {
    // Repeat one: restart
    audio.currentTime = 0;
    playAudio();
  } else {
    playNext();
  }
});

/** Update progress bar as audio plays */
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  updateProgressDisplay(audio.currentTime, audio.duration);

  // Sync progress fill
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';

  // Update progress bar aria value
  const wrapper = document.getElementById('progress-bar-wrapper');
  if (wrapper) wrapper.setAttribute('aria-valuenow', Math.round(pct));
});

/** When metadata loaded, update total duration */
audio.addEventListener('loadedmetadata', () => {
  const totalEl = document.getElementById('total-time');
  if (totalEl) totalEl.textContent = formatTime(audio.duration);
});

/** Buffering state */
audio.addEventListener('waiting', () => {
  showToast('Buffering…');
});

/** Error handling */
audio.addEventListener('error', (e) => {
  console.error('Audio error:', e);
  showToast('Audio error — trying next track');
  setTimeout(() => playNext(), 1500);
});

/* ============================================================
   4. PLAYER NAVIGATION (Prev / Next / Shuffle / Repeat)
   ============================================================ */

function playNext() {
  let nextIndex;
  if (State.isShuffle) {
    do { nextIndex = Math.floor(Math.random() * TRACKS.length); }
    while (nextIndex === currentTrackIndex && TRACKS.length > 1);
  } else {
    nextIndex = (currentTrackIndex + 1) % TRACKS.length;
  }
  loadTrack(nextIndex, !audio.paused);
}

function playPrev() {
  // If >3s in, restart current; otherwise go to previous
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const prevIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
  loadTrack(prevIndex, !audio.paused);
}

function toggleShuffle() {
  State.isShuffle = !State.isShuffle;
  DOM.shuffleBtn?.classList.toggle('active', State.isShuffle);
  showToast(State.isShuffle ? 'Shuffle: On' : 'Shuffle: Off');
}

function cycleRepeat() {
  State.repeatMode = (State.repeatMode + 1) % 3;
  DOM.repeatBtn?.classList.toggle('active', State.repeatMode > 0);
  const labels = ['Repeat: Off', 'Repeat: All', 'Repeat: One'];
  showToast(labels[State.repeatMode]);
}

function toggleLike() {
  State.isLiked = !State.isLiked;
  const icon = DOM.likeBtn?.querySelector('i');
  if (icon) icon.className = State.isLiked ? 'fas fa-heart' : 'far fa-heart';
  DOM.likeBtn?.classList.toggle('liked', State.isLiked);
  showToast(State.isLiked ? 'Saved to Liked Songs' : 'Removed from Liked Songs');
}

/* ============================================================
   5. VOLUME
   ============================================================ */

function updateVolumeSliderFill() {
  const val = DOM.volumeSlider?.value ?? 70;
  if (DOM.volumeSlider) {
    DOM.volumeSlider.style.backgroundSize = `${val}% 100%`;
  }
}

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

function initVolume() {
  DOM.volumeSlider?.addEventListener('input', e => {
    const vol = parseInt(e.target.value);
    State.volume = vol;
    State.isMuted = (vol === 0);
    audio.volume = vol / 100;
    updateVolumeIcon(vol);
    updateVolumeSliderFill();
  });

  DOM.volumeIconBtn?.addEventListener('click', () => {
    State.isMuted = !State.isMuted;
    if (State.isMuted) {
      audio.volume = 0;
      if (DOM.volumeSlider) DOM.volumeSlider.value = 0;
      DOM.volumeSlider.style.backgroundSize = '0% 100%';
      updateVolumeIcon(0);
    } else {
      audio.volume = State.volume / 100;
      if (DOM.volumeSlider) DOM.volumeSlider.value = State.volume;
      updateVolumeSliderFill();
      updateVolumeIcon(State.volume);
    }
  });

  updateVolumeSliderFill();
  updateVolumeIcon(State.volume);
}

/* ============================================================
   6. PROGRESS BAR — Click / Drag to Seek
   ============================================================ */

function initProgressBar() {
  let isDragging = false;

  function seekTo(e) {
    if (!audio.duration) return;
    const rect = DOM.progressWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;

    // Immediately update fill
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = (ratio * 100) + '%';
    updateProgressDisplay(audio.currentTime, audio.duration);
  }

  DOM.progressWrapper?.addEventListener('mousedown', e => { isDragging = true; seekTo(e); });
  document.addEventListener('mousemove', e => { if (isDragging) seekTo(e); });
  document.addEventListener('mouseup', () => { isDragging = false; });
  DOM.progressWrapper?.addEventListener('touchstart', seekTo, { passive: true });
  DOM.progressWrapper?.addEventListener('touchmove', seekTo, { passive: true });
}

/* ============================================================
   7. UI UPDATE HELPERS
   ============================================================ */

/**
 * Update bottom player bar with track info.
 * @param {Object} track
 */
function updatePlayerUI(track) {
  if (DOM.playerImg)         { DOM.playerImg.src = track.img; DOM.playerImg.alt = track.name; }
  if (DOM.playerTrackName)   DOM.playerTrackName.textContent  = track.name;
  if (DOM.playerTrackArtist) DOM.playerTrackArtist.textContent = track.artist;
}

/**
 * Set play/pause icon and state.
 * @param {boolean} playing
 */
function setPlayingState(playing) {
  State.isPlaying = playing;
  const icon = document.getElementById('play-icon');
  if (icon) icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
  DOM.playPauseBtn?.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

/**
 * Update current time and total time display.
 * @param {number} current - seconds
 * @param {number} total - seconds
 */
function updateProgressDisplay(current, total) {
  if (DOM.currentTime) DOM.currentTime.textContent = formatTime(current);
  if (DOM.totalTime && total)   DOM.totalTime.textContent   = formatTime(total);
}

/**
 * Format seconds → M:SS
 * @param {number} secs
 * @returns {string}
 */
function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ============================================================
   8. DOM REFERENCES
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
  homePage:     $('home-page'),
  searchPage:   $('search-page'),
  libraryPage:  $('library-page'),
  categoryGrid: $('category-grid'),

  // Library
  createBtn:    $('create-btn'),
  createBanner: $('create-playlist-banner'),
  libraryList:  $('library-list'),
  filterTabs:   document.querySelectorAll('.filter-tab'),
  libFullItems: document.querySelectorAll('.lib-full-item'),
  libSortBtn:   $('lib-sort-btn'),
  libSortLabel: $('lib-sort-label'),
  librarySearch: $('library-search'),

  // Player
  musicPlayer:       $('music-player'),
  playPauseBtn:      $('play-pause-btn'),
  prevBtn:           $('prev-btn'),
  nextBtn:           $('next-btn'),
  shuffleBtn:        $('shuffle-btn'),
  repeatBtn:         $('repeat-btn'),
  likeBtn:           $('like-btn'),
  playerImg:         $('player-img'),
  playerTrackName:   $('player-track-name'),
  playerTrackArtist: $('player-track-artist'),
  progressFill:      $('progress-fill'),
  progressWrapper:   $('progress-bar-wrapper'),
  currentTime:       $('current-time'),
  totalTime:         $('total-time'),
  volumeSlider:      $('volume-slider'),
  volumeIconBtn:     $('volume-icon-btn'),
  volumeIcon:        $('volume-icon'),

  // Mobile nav
  mobileBottomNav: $('mobile-bottom-nav'),

  // Content
  contentArea: $('content-area'),
};

/* ============================================================
   9. PAGE NAVIGATION
   ============================================================ */

function navigateTo(page) {
  if (State.currentPage === page) return;

  [DOM.homePage, DOM.searchPage, DOM.libraryPage].forEach(p => {
    if (p) { p.style.display = 'none'; p.classList.remove('active-page'); }
  });

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  switch (page) {
    case 'home':
      DOM.homePage.style.display = 'block';
      DOM.navHome?.classList.add('active');
      if (DOM.topSearchWrap) DOM.topSearchWrap.style.display = 'none';
      break;
    case 'search':
      DOM.searchPage.style.display = 'block';
      DOM.navSearch?.classList.add('active');
      if (DOM.topSearchWrap) DOM.topSearchWrap.style.display = 'flex';
      setTimeout(() => DOM.mainSearchInput?.focus(), 200);
      break;
    case 'library':
      DOM.libraryPage.style.display = 'block';
      DOM.navLibrary?.classList.add('active');
      if (DOM.topSearchWrap) DOM.topSearchWrap.style.display = 'none';
      break;
  }

  // Mobile nav
  document.querySelectorAll('.mob-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`.mob-nav-item[data-page="${page}"]`)?.classList.add('active');

  State.currentPage = page;
  DOM.contentArea?.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNavigation() {
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.page); });
  });
  document.querySelectorAll('.mob-nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page === 'premium') { showPremiumModal(); return; }
      navigateTo(page);
    });
  });
  DOM.backBtn?.addEventListener('click',    () => showToast('Going back…'));
  DOM.forwardBtn?.addEventListener('click', () => showToast('Going forward…'));
}

/* ============================================================
   10. CARD INTERACTIONS — Click to Play
   ============================================================ */

/**
 * Find the best matching track index, or fallback to 0.
 * @param {string} name
 * @returns {number}
 */
function findTrackIndex(name) {
  const idx = TRACKS.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
  return idx !== -1 ? idx : 0;
}

/**
 * Play a song by name (looked up in TRACKS), or load track 0 as fallback.
 * @param {string} name
 * @param {string} artist
 * @param {string} img
 */
function playSong(name, artist, img) {
  const idx = findTrackIndex(name);
  // If no exact match, temporarily override track[0] with the clicked card info
  if (idx === 0 && TRACKS[0].name.toLowerCase() !== name.toLowerCase()) {
    TRACKS[0] = { ...TRACKS[0], name, artist, img };
  }
  loadTrack(idx, true);
}

function initCardInteractions() {
  // Music + Artist cards
  document.querySelectorAll('.music-card, .artist-card').forEach(card => {
    card.addEventListener('click', e => {
      triggerRipple(card, e);
      const name   = card.dataset.song   || TRACKS[0].name;
      const artist = card.dataset.artist || TRACKS[0].artist;
      const img    = card.dataset.img    || TRACKS[0].img;
      playSong(name, artist, img);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  // Quick-access cards
  document.querySelectorAll('.quick-card').forEach(card => {
    card.addEventListener('click', () => {
      const name   = card.dataset.song   || TRACKS[0].name;
      const artist = card.dataset.artist || TRACKS[0].artist;
      const img    = card.dataset.img    || TRACKS[0].img;
      playSong(name, artist, img);
    });
    card.querySelector('.quick-play-btn')?.addEventListener('click', e => {
      e.stopPropagation(); card.click();
    });
  });

  // Library items
  document.querySelectorAll('.library-item, .lib-full-item').forEach(item => {
    item.addEventListener('click', () => {
      const img  = item.querySelector('img');
      const name = item.querySelector('.lib-name, .lib-full-name')?.textContent || TRACKS[0].name;
      playSong(name, '', img?.src || TRACKS[0].img);
    });
  });
}

/* ============================================================
   11. RIPPLE EFFECT
   ============================================================ */

function triggerRipple(el) {
  el.classList.add('ripple');
  setTimeout(() => el.classList.remove('ripple'), 400);
}

/* ============================================================
   12. SEARCH
   ============================================================ */

function initSearch() {
  DOM.mainSearchInput?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (DOM.searchClearBtn) DOM.searchClearBtn.style.display = q ? 'block' : 'none';
    document.querySelectorAll('.category-card').forEach(card => {
      const label = (card.dataset.category || '').toLowerCase();
      card.style.opacity = (!q || label.includes(q)) ? '1' : '0.2';
    });
  });

  DOM.searchClearBtn?.addEventListener('click', () => {
    if (DOM.mainSearchInput) DOM.mainSearchInput.value = '';
    if (DOM.searchClearBtn)  DOM.searchClearBtn.style.display = 'none';
    document.querySelectorAll('.category-card').forEach(c => c.style.opacity = '1');
    DOM.mainSearchInput?.focus();
  });

  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => showToast(`Browsing: ${card.dataset.category}`));
  });
}

/* ============================================================
   13. LIBRARY TABS
   ============================================================ */

function initLibraryTabs() {
  DOM.filterTabs?.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      DOM.libFullItems?.forEach(item => {
        item.style.display = (filter === 'all' || item.dataset.type === filter) ? 'flex' : 'none';
      });
    });
  });

  DOM.librarySearch?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    DOM.libFullItems?.forEach(item => {
      const name = item.querySelector('.lib-full-name')?.textContent.toLowerCase() || '';
      item.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
    });
  });

  const sortOptions = ['Recents', 'Recently Added', 'Alphabetical', 'Creator'];
  let sortIndex = 0;
  DOM.libSortBtn?.addEventListener('click', () => {
    sortIndex = (sortIndex + 1) % sortOptions.length;
    if (DOM.libSortLabel) DOM.libSortLabel.textContent = sortOptions[sortIndex];
    showToast(`Sorted by: ${sortOptions[sortIndex]}`);
  });
}

/* ============================================================
   14. AVATAR DROPDOWN
   ============================================================ */

function initAvatarDropdown() {
  DOM.userAvatar?.addEventListener('click', e => {
    e.stopPropagation();
    DOM.avatarDropdown?.classList.toggle('open');
  });
  document.addEventListener('click', () => DOM.avatarDropdown?.classList.remove('open'));
  DOM.userAvatar?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); DOM.avatarDropdown?.classList.toggle('open'); }
    if (e.key === 'Escape') DOM.avatarDropdown?.classList.remove('open');
  });
}

/* ============================================================
   15. SIDEBAR MOBILE TOGGLE
   ============================================================ */

function openSidebar()  {
  DOM.sidebar?.classList.add('open');
  DOM.sidebarOverlay?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  DOM.sidebar?.classList.remove('open');
  DOM.sidebarOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

function initSidebarToggle() {
  DOM.topNav?.addEventListener('click', e => {
    if (window.innerWidth > 768) return;
    const rect = DOM.topNav.getBoundingClientRect();
    if (e.clientX - rect.left < 48) openSidebar();
  });
  DOM.sidebarOverlay?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSidebar(); DOM.avatarDropdown?.classList.remove('open'); }
  });
}

/* ============================================================
   16. STICKY TOP NAV
   ============================================================ */

function initStickyNav() {
  DOM.contentArea?.addEventListener('scroll', () => {
    DOM.topNav?.classList.toggle('scrolled', DOM.contentArea.scrollTop > 10);
  });
}

/* ============================================================
   17. CREATE PLAYLIST
   ============================================================ */

function initCreatePlaylist() {
  DOM.createBtn?.addEventListener('click', () => {
    if (DOM.createBanner) DOM.createBanner.style.display = 'none';
    if (DOM.libraryList)  DOM.libraryList.style.display  = 'flex';
    showToast('Playlist created!');
  });
  $('browse-podcasts-btn')?.addEventListener('click', () => {
    navigateTo('search');
    showToast('Browse podcasts & shows');
  });
}

/* ============================================================
   18. PREMIUM MODAL
   ============================================================ */

function showPremiumModal() {
  document.querySelector('.modal-overlay')?.remove();
  document.querySelector('.premium-banner')?.remove();

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

  const closeModal = () => { overlay.remove(); modal.remove(); };
  overlay.addEventListener('click', closeModal);
  modal.querySelector('#premium-close-btn')?.addEventListener('click', closeModal);
  modal.querySelector('#premium-try-btn')?.addEventListener('click', () => {
    showToast('Redirecting to Spotify Premium…'); closeModal();
  });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', esc); }
  });
}

function initTopNavButtons() {
  DOM.premiumBtn?.addEventListener('click', showPremiumModal);
  DOM.installBtn?.addEventListener('click', () => showToast('Spotify App download started'));
}

/* ============================================================
   19. TOAST NOTIFICATIONS
   ============================================================ */

let _toastTimeout;
function showToast(message) {
  document.querySelector('.toast')?.remove();
  if (_toastTimeout) clearTimeout(_toastTimeout);
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  _toastTimeout = setTimeout(() => toast.remove(), 2500);
}

/* ============================================================
   20. LOADING SCREEN
   ============================================================ */

function initLoadingScreen() {
  setTimeout(() => {
    if (DOM.app)         DOM.app.style.display         = 'grid';
    if (DOM.musicPlayer) DOM.musicPlayer.style.display = 'flex';
    // Load first track silently (no autoplay until user interaction)
    loadTrack(0, false);
  }, 1600);
  setTimeout(() => {
    if (DOM.loadingScreen) DOM.loadingScreen.style.display = 'none';
  }, 2500);
}

/* ============================================================
   21. GREETING
   ============================================================ */

function initGreeting() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  if (DOM.homePage) {
    const h1 = document.createElement('h1');
    h1.textContent = greeting;
    h1.style.cssText = 'font-size:clamp(20px,3vw,32px);font-weight:800;margin-bottom:20px;letter-spacing:-0.5px;';
    DOM.homePage.insertBefore(h1, DOM.homePage.firstChild);
  }
}

/* ============================================================
   22. STAGGERED CARD ANIMATIONS
   ============================================================ */

function initCardAnimations() {
  document.querySelectorAll('.cards-grid').forEach(grid => {
    grid.querySelectorAll('.music-card, .artist-card').forEach((card, i) => {
      card.style.animationDelay = `${0.04 * i}s`;
    });
  });
  document.querySelectorAll('.category-card').forEach((card, i) => {
    card.style.animationDelay = `${0.03 * i}s`;
  });
}

/* ============================================================
   23. INTERSECTION OBSERVER
   ============================================================ */

function initIntersectionObserver() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.content-section').forEach(s => {
    s.style.opacity = '0';
    s.style.transform = 'translateY(20px)';
    s.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    obs.observe(s);
  });
}

/* ============================================================
   24. KEYBOARD SHORTCUTS
   ============================================================ */

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
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
          const v = Math.min(100, audio.volume * 100 + 10);
          audio.volume = v / 100;
          if (DOM.volumeSlider) DOM.volumeSlider.value = v;
          State.volume = v;
          updateVolumeIcon(v);
          updateVolumeSliderFill();
        }
        break;
      case 'ArrowDown':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const v = Math.max(0, audio.volume * 100 - 10);
          audio.volume = v / 100;
          if (DOM.volumeSlider) DOM.volumeSlider.value = v;
          State.volume = v;
          updateVolumeIcon(v);
          updateVolumeSliderFill();
        }
        break;
      case 'm': case 'M': if (!e.ctrlKey) DOM.volumeIconBtn?.click(); break;
      case 's': case 'S': if (!e.ctrlKey) toggleShuffle(); break;
      case 'r': case 'R': if (!e.ctrlKey) cycleRepeat();   break;
    }
  });
}

/* ============================================================
   25. PLAYER CONTROLS INIT
   ============================================================ */

function initPlayerControls() {
  DOM.playPauseBtn?.addEventListener('click', togglePlayPause);
  DOM.nextBtn?.addEventListener('click', playNext);
  DOM.prevBtn?.addEventListener('click', playPrev);
  DOM.shuffleBtn?.addEventListener('click', toggleShuffle);
  DOM.repeatBtn?.addEventListener('click', cycleRepeat);
  DOM.likeBtn?.addEventListener('click', toggleLike);
}

/* ============================================================
   26. MAIN INIT
   ============================================================ */

function init() {
  initLoadingScreen();
  initNavigation();
  initPlayerControls();
  initProgressBar();
  initVolume();
  initCardInteractions();
  initSearch();
  initLibraryTabs();
  initAvatarDropdown();
  initSidebarToggle();
  initStickyNav();
  initCreatePlaylist();
  initTopNavButtons();
  initCardAnimations();
  initGreeting();
  initKeyboardShortcuts();
  initIntersectionObserver();

  console.log('🎵 Spotify Clone ready | Audio: HTML5 Audio API + SoundHelix free tracks');
  console.log('⌨️  Shortcuts: Space=Play, Ctrl+←/→=Prev/Next, M=Mute, S=Shuffle, R=Repeat');
}

/* ============================================================
   27. DOM READY
   ============================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
