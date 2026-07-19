/* ============================================================
   SPOTIFY WEB PLAYER CLONE — script.js
   Vanilla JS Frontend: 60 Songs + Dual Playback Engine (HTML5 + YT)
   ============================================================ */

'use strict';

/* ============================================================
   1. STATE & CONSTANTS
   ============================================================ */

const State = {
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0,   // 0=off, 1=repeat-all, 2=repeat-one
  isMuted: false,
  volume: 70,
  currentPage: 'home',
};

let currentTrackIndex = 0;
let LikedSongs = [];

function initLikedSongs() {
  const stored = localStorage.getItem('spotify_likes');
  if (stored) {
    LikedSongs = JSON.parse(stored);
  }
}

// Fallback engines
let ytPlayer = null;
let ytReady = false;
let ytErrorFallback = false;
let ytProgressInterval = null;

const audio = new Audio();
audio.crossOrigin = 'anonymous';
audio.volume = 0.7;
audio.preload = 'metadata';

function isUsingFallback() {
  return !ytReady || ytErrorFallback;
}

/* ============================================================
   2. YOUTUBE API LOADER & PLAYER SETUP
   =========================================================== */

function initYouTubePlayer() {
  // Inject script
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // Hidden container
  const container = document.createElement('div');
  container.id = 'yt-player-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.innerHTML = '<div id="yt-player"></div>';
  document.body.appendChild(container);

  window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new YT.Player('yt-player', {
      height: '100',
      width: '100',
      playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 },
      events: {
        onReady: () => {
          ytReady = true;
          // Apply initial volume
          if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
            ytPlayer.setVolume(State.volume);
          }
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            setPlayingState(true);
            startYTProgressTimer();
          } else if (event.data === YT.PlayerState.PAUSED) {
            setPlayingState(false);
            stopYTProgressTimer();
          } else if (event.data === YT.PlayerState.ENDED) {
            setPlayingState(false);
            stopYTProgressTimer();
            handleTrackEnded();
          }
        },
        onError: (err) => {
          console.warn("YouTube playback failed, using HTML5 Audio fallback instead.", err);
          ytErrorFallback = true;
          playFallbackAudio();
        }
      }
    });
  };
}

/* ============================================================
   3. AUDIO ROUTING CONTROLLERS
   ============================================================ */

function loadTrack(index, autoPlay = false) {
  const track = TRACKS[index];
  currentTrackIndex = index;
  ytErrorFallback = false;

  // Update UI
  updatePlayerUI(track);
  updateProgressDisplay(0, 0);

  // Sync heart like button
  const isLiked = LikedSongs.includes(track.id);
  const icon = DOM.likeBtn?.querySelector('i');
  if (icon) icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
  DOM.likeBtn?.classList.toggle('liked', isLiked);

  if (autoPlay) {
    if (ytReady && ytPlayer && track.ytId) {
      audio.pause();
      try {
        ytPlayer.loadVideoById(track.ytId);
        ytPlayer.playVideo();
      } catch (e) {
        console.warn("YT error, playing local fallback", e);
        ytErrorFallback = true;
        playFallbackAudio();
      }
    } else {
      playFallbackAudio();
    }
  } else {
    setPlayingState(false);
    // Preload fallback audio
    const songNum = (track.id % 16) + 1;
    audio.src = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNum}.mp3`;
    audio.load();
  }

  showToast(`Playing: ${track.name}`);
}

function playFallbackAudio() {
  if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
    try { ytPlayer.pauseVideo(); } catch (e) {}
  }
  const track = TRACKS[currentTrackIndex];
  const songNum = (track.id % 16) + 1;
  audio.src = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNum}.mp3`;
  audio.load();
  audio.play()
    .then(() => setPlayingState(true))
    .catch(e => {
      console.error("Autoplay block or missing fallback:", e);
      setPlayingState(false);
    });
}

function playAudio() {
  if (isUsingFallback()) {
    audio.play().then(() => setPlayingState(true)).catch(e => {
      console.warn("Autoplay block", e);
      setPlayingState(false);
    });
  } else {
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.playVideo();
    }
  }
}

function pauseAudio() {
  if (isUsingFallback()) {
    audio.pause();
    setPlayingState(false);
  } else {
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      ytPlayer.pauseVideo();
    }
  }
}

function togglePlayPause() {
  if (isUsingFallback()) {
    if (audio.paused) {
      playAudio();
    } else {
      pauseAudio();
    }
  } else {
    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
      const state = ytPlayer.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        pauseAudio();
      } else {
        playAudio();
      }
    } else {
      playAudio();
    }
  }
}

function seekTo(ratio) {
  if (isUsingFallback()) {
    if (audio.duration) {
      audio.currentTime = ratio * audio.duration;
    }
  } else {
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      const dur = ytPlayer.getDuration() || 0;
      ytPlayer.seekTo(ratio * dur, true);
    }
  }
}

/* ============================================================
   4. PROGRESS BAR & TIMER TIMING
   ============================================================ */

function startYTProgressTimer() {
  if (ytProgressInterval) clearInterval(ytProgressInterval);
  ytProgressInterval = setInterval(() => {
    if (!isUsingFallback() && ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
      const current = ytPlayer.getCurrentTime();
      const total = ytPlayer.getDuration() || 0;
      const pct = total > 0 ? (current / total) * 100 : 0;
      updateProgressDisplay(current, total);

      const fill = document.getElementById('progress-fill');
      if (fill) fill.style.width = pct + '%';
    }
  }, 500);
}

function stopYTProgressTimer() {
  if (ytProgressInterval) {
    clearInterval(ytProgressInterval);
    ytProgressInterval = null;
  }
}

// HTML5 audio event triggers
audio.addEventListener('timeupdate', () => {
  if (isUsingFallback() && audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    updateProgressDisplay(audio.currentTime, audio.duration);
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = pct + '%';
  }
});

audio.addEventListener('loadedmetadata', () => {
  if (isUsingFallback()) {
    const totalEl = document.getElementById('total-time');
    if (totalEl) totalEl.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('ended', () => {
  if (isUsingFallback()) {
    handleTrackEnded();
  }
});

audio.addEventListener('error', () => {
  if (isUsingFallback()) {
    console.warn("Local audio error fallback trigger.");
    playNext();
  }
});

function handleTrackEnded() {
  if (State.repeatMode === 2) {
    seekTo(0);
    playAudio();
  } else {
    playNext();
  }
}

/* ============================================================
   5. NAVIGATION (Prev / Next / Shuffle / Repeat)
   ============================================================ */

function playNext() {
  let nextIndex;
  if (State.isShuffle) {
    do { nextIndex = Math.floor(Math.random() * TRACKS.length); }
    while (nextIndex === currentTrackIndex && TRACKS.length > 1);
  } else {
    nextIndex = (currentTrackIndex + 1) % TRACKS.length;
  }
  loadTrack(nextIndex, true);
}

function playPrev() {
  const current = isUsingFallback() ? audio.currentTime : (ytPlayer?.getCurrentTime() || 0);
  if (current > 3) {
    seekTo(0);
    return;
  }
  const prevIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
  loadTrack(prevIndex, true);
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
  const track = TRACKS[currentTrackIndex];
  const idx = LikedSongs.indexOf(track.id);
  if (idx === -1) {
    LikedSongs.push(track.id);
    showToast('Saved to Liked Songs');
  } else {
    LikedSongs.splice(idx, 1);
    showToast('Removed from Liked Songs');
  }
  localStorage.setItem('spotify_likes', JSON.stringify(LikedSongs));

  const isLiked = LikedSongs.includes(track.id);
  const icon = DOM.likeBtn?.querySelector('i');
  if (icon) icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
  DOM.likeBtn?.classList.toggle('liked', isLiked);
}

/* ============================================================
   6. VOLUME CONTROLLER
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

    // Apply
    audio.volume = vol / 100;
    if (ytReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(vol);
    }

    updateVolumeIcon(vol);
    updateVolumeSliderFill();
  });

  DOM.volumeIconBtn?.addEventListener('click', () => {
    State.isMuted = !State.isMuted;
    if (State.isMuted) {
      audio.volume = 0;
      if (ytReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
        ytPlayer.setVolume(0);
      }
      if (DOM.volumeSlider) DOM.volumeSlider.value = 0;
      DOM.volumeSlider.style.backgroundSize = '0% 100%';
      updateVolumeIcon(0);
    } else {
      audio.volume = State.volume / 100;
      if (ytReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
        ytPlayer.setVolume(State.volume);
      }
      if (DOM.volumeSlider) DOM.volumeSlider.value = State.volume;
      updateVolumeSliderFill();
      updateVolumeIcon(State.volume);
    }
  });

  updateVolumeSliderFill();
  updateVolumeIcon(State.volume);
}

/* ============================================================
   7. PROGRESS BAR EVENTS
   ============================================================ */

function initProgressBar() {
  let isDragging = false;

  function seek(e) {
    const dur = isUsingFallback() ? audio.duration : (ytPlayer?.getDuration() || 0);
    if (!dur) return;

    const rect = DOM.progressWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekTo(ratio);

    // Sync progress fill width
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = (ratio * 100) + '%';
    
    const cur = ratio * dur;
    updateProgressDisplay(cur, dur);
  }

  DOM.progressWrapper?.addEventListener('mousedown', e => { isDragging = true; seek(e); });
  document.addEventListener('mousemove', e => { if (isDragging) seek(e); });
  document.addEventListener('mouseup', () => { isDragging = false; });
  DOM.progressWrapper?.addEventListener('touchstart', seek, { passive: true });
  DOM.progressWrapper?.addEventListener('touchmove', seek, { passive: true });
}

/* ============================================================
   8. UI RENDERING & INITS
   ============================================================ */

function updatePlayerUI(track) {
  if (DOM.playerImg)         { DOM.playerImg.src = track.img; DOM.playerImg.alt = track.name; DOM.playerImg.onerror = function(){ this.onerror=null; this.src='https://img.youtube.com/vi/'+track.ytId+'/mqdefault.jpg'; }; }
  if (DOM.playerTrackName)   DOM.playerTrackName.textContent  = track.name;
  if (DOM.playerTrackArtist) DOM.playerTrackArtist.textContent = track.artist;

  // Spotify Url Link
  const spotifyLink = document.getElementById('player-spotify-link');
  if (spotifyLink) {
    if (track.spotifyUrl) {
      spotifyLink.href = track.spotifyUrl;
      spotifyLink.style.display = 'inline-flex';
    } else {
      spotifyLink.style.display = 'none';
    }
  }
}

function setPlayingState(playing) {
  State.isPlaying = playing;
  const icon = document.getElementById('play-icon');
  if (icon) icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
  DOM.playPauseBtn?.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

function updateProgressDisplay(current, total) {
  if (DOM.currentTime) DOM.currentTime.textContent = formatTime(current);
  if (DOM.totalTime && total)   DOM.totalTime.textContent   = formatTime(total);
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ============================================================
   9. HOME PAGE LANGUAGE SECTIONS DYNAMIC RENDER
   ============================================================ */

function renderLanguageSections() {
  const root = document.getElementById('language-sections-root');
  if (!root) return;
  root.innerHTML = '';

  const languages = ['Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'English'];
  const albumNames = {
    'Hindi': 'Kabir Singh',
    'Telugu': 'Ala Vaikunthapurramuloo',
    'Tamil': '3',
    'Malayalam': 'Hridayam',
    'Kannada': 'KGF Series',
    'English': 'Future Nostalgia'
  };

  languages.forEach(lang => {
    const langTracks = TRACKS.filter(t => t.language.toLowerCase() === lang.toLowerCase());
    if (langTracks.length === 0) return;

    const section = document.createElement('section');
    section.className = 'content-section';
    section.setAttribute('aria-label', `${lang} Hits`);

    section.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">${lang} Hits — ${albumNames[lang]}</h2>
        <a href="#" class="section-link show-all-lang" data-lang="${lang}">Show all</a>
      </div>
      <div class="cards-grid">
        ${langTracks.slice(0, 6).map(track => `
          <div class="music-card" data-track-index="${TRACKS.findIndex(t => t.id === track.id)}" tabindex="0">
            <div class="card-img-wrapper">
              <img src="${track.img}" alt="${track.name} cover" loading="lazy" onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${track.ytId}/default.jpg'" />
              <button class="card-play-btn" aria-label="Play ${track.name}"><i class="fas fa-play"></i></button>
            </div>
            <div class="card-body">
              <p class="card-title">${track.name}</p>
              <p class="card-subtitle">${track.artist}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    root.appendChild(section);
  });

  // Bind click events on song cards
  root.querySelectorAll('.music-card').forEach(card => {
    card.addEventListener('click', e => {
      triggerRipple(card);
      const index = parseInt(card.dataset.trackIndex);
      loadTrack(index, true);
    });
    card.querySelector('.card-play-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      card.click();
    });
  });

  // Bind show all tabs click redirection
  root.querySelectorAll('.show-all-lang').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const lang = btn.dataset.lang;
      navigateTo('search');
      if (DOM.mainSearchInput) {
        DOM.mainSearchInput.value = lang;
        renderSearchResults(lang);
      }
    });
  });
}

/* ============================================================
   10. LIVE SEARCH COMPONENT
   ============================================================ */

function renderSearchResults(query) {
  const container = document.getElementById('search-results-container');
  const catGrid = document.getElementById('category-grid');
  if (!container || !catGrid) return;

  if (!query) {
    container.style.display = 'none';
    catGrid.style.display = 'grid';
    return;
  }

  container.style.display = 'block';
  catGrid.style.display = 'none';

  const queryClean = query.toLowerCase().trim();
  const results = TRACKS.filter(t => 
    t.name.toLowerCase().includes(queryClean) ||
    t.artist.toLowerCase().includes(queryClean) ||
    t.album.toLowerCase().includes(queryClean) ||
    t.language.toLowerCase().includes(queryClean)
  );

  if (results.length === 0) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 60px 20px; text-align:center; color: #b3b3b3; gap:10px;">
        <i class="fas fa-search-minus" style="font-size: 32px; color: #333;"></i>
        <h3 style="color: white;">No results found for "${query}"</h3>
        <p style="font-size:13px;">Please make sure your words are spelled correctly or try different keywords.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h2 class="section-title" style="margin-bottom:20px;">Matching Songs</h2>
    <div class="cards-grid">
      ${results.map(track => `
        <div class="music-card" data-track-index="${TRACKS.findIndex(t => t.id === track.id)}" tabindex="0">
          <div class="card-img-wrapper">
            <img src="${track.img}" alt="${track.name} cover" loading="lazy" onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${track.ytId}/default.jpg'" />
            <button class="card-play-btn" aria-label="Play ${track.name}"><i class="fas fa-play"></i></button>
          </div>
          <div class="card-body">
            <p class="card-title">${track.name}</p>
            <p class="card-subtitle">${track.artist}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Bind click handler on results
  container.querySelectorAll('.music-card').forEach(card => {
    card.addEventListener('click', e => {
      triggerRipple(card);
      const index = parseInt(card.dataset.trackIndex);
      loadTrack(index, true);
    });
    card.querySelector('.card-play-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      card.click();
    });
  });
}

function initSearch() {
  DOM.mainSearchInput?.addEventListener('input', e => {
    const q = e.target.value;
    if (DOM.searchClearBtn) DOM.searchClearBtn.style.display = q ? 'block' : 'none';
    renderSearchResults(q);
  });

  DOM.searchClearBtn?.addEventListener('click', () => {
    if (DOM.mainSearchInput) DOM.mainSearchInput.value = '';
    if (DOM.searchClearBtn)  DOM.searchClearBtn.style.display = 'none';
    renderSearchResults('');
    DOM.mainSearchInput?.focus();
  });

  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category || '';
      if (DOM.mainSearchInput) {
        DOM.mainSearchInput.value = cat;
        if (DOM.searchClearBtn) DOM.searchClearBtn.style.display = 'block';
        renderSearchResults(cat);
      }
    });
  });
}

/* ============================================================
   11. DOM DEFINITIONS
   ============================================================ */

const $ = id => document.getElementById(id);

// DOM is populated inside init() after DOMContentLoaded fires
let DOM = {};

/* ============================================================
   12. CORE EVENT ACTIONS
   ============================================================ */

function navigateTo(page) {
  if (State.currentPage === page) return;

  [DOM.homePage, DOM.searchPage, DOM.libraryPage].forEach(p => {
    if (p) { p.style.display = 'none'; p.classList.remove('active-page'); }
  });

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  switch (page) {
    case 'home':
      if (DOM.homePage) DOM.homePage.style.display = 'block';
      DOM.navHome?.classList.add('active');
      if (DOM.topSearchWrap) DOM.topSearchWrap.style.display = 'none';
      break;
    case 'search':
      if (DOM.searchPage) DOM.searchPage.style.display = 'block';
      DOM.navSearch?.classList.add('active');
      if (DOM.topSearchWrap) DOM.topSearchWrap.style.display = 'flex';
      setTimeout(() => DOM.mainSearchInput?.focus(), 200);
      break;
    case 'library':
      if (DOM.libraryPage) DOM.libraryPage.style.display = 'block';
      DOM.navLibrary?.classList.add('active');
      if (DOM.topSearchWrap) DOM.topSearchWrap.style.display = 'none';
      break;
  }

  // Mobile navigation sync
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

function triggerRipple(el) {
  el.classList.add('ripple');
  setTimeout(() => el.classList.remove('ripple'), 400);
}

function initCardInteractions() {
  // Bind mock static cards redirection
  document.querySelectorAll('.music-card, .artist-card').forEach(card => {
    if (card.dataset.trackIndex !== undefined) return; // Skip dynamic lang cards

    card.addEventListener('click', e => {
      triggerRipple(card);
      // Play a themed song matching category
      let songIndex = 0;
      const title = (card.dataset.song || '').toLowerCase();
      if (title.includes("hits") || title.includes("usa") || title.includes("radar") || title.includes("caviar")) {
        // Play Dua Lipa English Pop
        songIndex = 50 + Math.floor(Math.random() * 10);
      } else {
        songIndex = Math.floor(Math.random() * TRACKS.length);
      }
      loadTrack(songIndex, true);
    });
    
    card.querySelector('.card-play-btn')?.addEventListener('click', e => {
      e.stopPropagation(); card.click();
    });
  });

  // Quick-access home grid cards
  document.querySelectorAll('.quick-card').forEach(card => {
    card.addEventListener('click', () => {
      let songIndex = 0;
      const title = (card.dataset.song || '').toLowerCase();
      if (title.includes("liked")) {
        if (LikedSongs.length > 0) {
          songIndex = TRACKS.findIndex(t => t.id === LikedSongs[0]);
        } else {
          songIndex = 0;
        }
      } else {
        songIndex = Math.floor(Math.random() * TRACKS.length);
      }
      loadTrack(songIndex, true);
    });
    card.querySelector('.quick-play-btn')?.addEventListener('click', e => {
      e.stopPropagation(); card.click();
    });
  });
}

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
}

function initAvatarDropdown() {
  DOM.userAvatar?.addEventListener('click', e => {
    e.stopPropagation();
    DOM.avatarDropdown?.classList.toggle('open');
  });
  document.addEventListener('click', () => DOM.avatarDropdown?.classList.remove('open'));
}

function openSidebar()  {
  DOM.sidebar?.classList.add('open');
  DOM.sidebarOverlay?.classList.add('active');
}
function closeSidebar() {
  DOM.sidebar?.classList.remove('open');
  DOM.sidebarOverlay?.classList.remove('active');
}

function initSidebarToggle() {
  DOM.topNav?.addEventListener('click', e => {
    if (window.innerWidth > 768) return;
    const rect = DOM.topNav.getBoundingClientRect();
    if (e.clientX - rect.left < 48) openSidebar();
  });
  DOM.sidebarOverlay?.addEventListener('click', closeSidebar);
}

function initStickyNav() {
  DOM.contentArea?.addEventListener('scroll', () => {
    DOM.topNav?.classList.toggle('scrolled', DOM.contentArea.scrollTop > 10);
  });
}

function initCreatePlaylist() {
  DOM.createBtn?.addEventListener('click', () => {
    if (DOM.createBanner) DOM.createBanner.style.display = 'none';
    if (DOM.libraryList)  DOM.libraryList.style.display  = 'flex';
    showToast('Playlist created!');
  });
}

function showPremiumModal() {
  document.querySelector('.modal-overlay')?.remove();
  document.querySelector('.premium-banner')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'premium-banner';
  modal.innerHTML = `
    <i class="fab fa-spotify" style="font-size:48px; color:#1DB954; margin-bottom:16px;"></i>
    <h2>Try Premium free for 3 months</h2>
    <p>Ad-free music, offline listening, and more. Only $9.99/month after. Cancel anytime.</p>
    <div style="display:flex;flex-direction:column;gap:12px;align-items:center">
      <button class="btn-green" id="premium-try-btn">Try free for 3 months</button>
      <button style="color:#b3b3b3;font-size:13px;font-weight:600;padding:8px;background:none;border:none;cursor:pointer;" id="premium-close-btn">Not now</button>
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
}

let _toastTimeout;
function showToast(message) {
  document.querySelector('.toast')?.remove();
  if (_toastTimeout) clearTimeout(_toastTimeout);
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  _toastTimeout = setTimeout(() => toast.remove(), 2500);
}

function initLoadingScreen() {
  setTimeout(() => {
    if (DOM.app)         DOM.app.style.display         = 'grid';
    if (DOM.musicPlayer) DOM.musicPlayer.style.display = 'flex';
    loadTrack(0, false);
  }, 1000);
  setTimeout(() => {
    if (DOM.loadingScreen) DOM.loadingScreen.style.display = 'none';
  }, 1600);
}

function initGreeting() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  if (DOM.homePage) {
    const greetingHeader = document.createElement('h1');
    greetingHeader.textContent = greeting;
    greetingHeader.style.cssText = 'font-size:clamp(20px,3vw,32px);font-weight:800;margin-bottom:20px;letter-spacing:-0.5px;';
    DOM.homePage.insertBefore(greetingHeader, DOM.homePage.firstChild);
  }
}

function initPlayerControls() {
  DOM.playPauseBtn?.addEventListener('click', togglePlayPause);
  DOM.nextBtn?.addEventListener('click', playNext);
  DOM.prevBtn?.addEventListener('click', playPrev);
  DOM.shuffleBtn?.addEventListener('click', toggleShuffle);
  DOM.repeatBtn?.addEventListener('click', cycleRepeat);
  DOM.likeBtn?.addEventListener('click', toggleLike);
}

function init() {
  // Populate DOM refs now that HTML is fully parsed
  DOM.loadingScreen   = $('loading-screen');
  DOM.app             = $('app');
  DOM.sidebar         = $('sidebar');
  DOM.sidebarOverlay  = $('sidebar-overlay');
  DOM.topNav          = $('top-nav');
  DOM.backBtn         = $('back-btn');
  DOM.forwardBtn      = $('forward-btn');
  DOM.topSearchWrap   = $('top-search-wrapper');
  DOM.mainSearchInput = $('main-search-input');
  DOM.searchClearBtn  = $('search-clear-btn');
  DOM.userAvatar      = $('user-avatar');
  DOM.avatarDropdown  = $('avatar-dropdown');
  DOM.premiumBtn      = $('premium-btn');
  DOM.installBtn      = $('install-btn');
  DOM.navHome         = $('nav-home');
  DOM.navSearch       = $('nav-search');
  DOM.navLibrary      = $('nav-library');
  DOM.homePage        = $('home-page');
  DOM.searchPage      = $('search-page');
  DOM.libraryPage     = $('library-page');
  DOM.categoryGrid    = $('category-grid');
  DOM.createBtn       = $('create-btn');
  DOM.createBanner    = $('create-playlist-banner');
  DOM.libraryList     = $('library-list');
  DOM.filterTabs      = document.querySelectorAll('.filter-tab');
  DOM.libFullItems    = document.querySelectorAll('.lib-full-item');
  DOM.libSortBtn      = $('lib-sort-btn');
  DOM.libSortLabel    = $('lib-sort-label');
  DOM.librarySearch   = $('library-search');
  DOM.musicPlayer     = $('music-player');
  DOM.playPauseBtn    = $('play-pause-btn');
  DOM.prevBtn         = $('prev-btn');
  DOM.nextBtn         = $('next-btn');
  DOM.shuffleBtn      = $('shuffle-btn');
  DOM.repeatBtn       = $('repeat-btn');
  DOM.likeBtn         = $('like-btn');
  DOM.playerImg       = $('player-img');
  DOM.playerTrackName = $('player-track-name');
  DOM.playerTrackArtist = $('player-track-artist');
  DOM.progressFill    = $('progress-fill');
  DOM.progressWrapper = $('progress-bar-wrapper');
  DOM.currentTime     = $('current-time');
  DOM.totalTime       = $('total-time');
  DOM.volumeSlider    = $('volume-slider');
  DOM.volumeIconBtn   = $('volume-icon-btn');
  DOM.volumeIcon      = $('volume-icon');
  DOM.mobileBottomNav = $('mobile-bottom-nav');
  DOM.contentArea     = $('content-area');

  initLikedSongs();
  initYouTubePlayer();
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
  initGreeting();
  renderLanguageSections();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
