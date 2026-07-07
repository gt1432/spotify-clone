# 🎵 Spotify Web Player UI Clone

A **pixel-perfect, fully responsive clone of the Spotify Web Player** built from scratch using **HTML5, CSS3, and Vanilla JavaScript**. This is a pure frontend/UI project — no backend, no Spotify API, no authentication required.

---

## 🖼️ Screenshots

> Open `index.html` in your browser to see the live UI.

---

## ✨ Features

### 🎨 UI Components
- **Left Sidebar** — Logo, Home, Search, Your Library, Create Playlist, Liked Songs, footer links, language button
- **Top Navigation Bar** — Back/Forward buttons, Premium button, Install App, Notifications, User Avatar with dropdown
- **Main Content Area** — Home, Search, and Library views
- **Bottom Music Player** — Full player bar with track info, controls, progress bar, and volume

### 🏠 Home Page Sections
- **Good Morning/Afternoon/Evening** — Dynamic time-based greeting
- **Quick Access Grid** — 6 recently played items in an instant-play grid
- **Recently Played** — 6 music cards with hover animations
- **Made For You** — 6 personalized playlist cards
- **Popular Artists** — 6 circular artist cards
- **Trending Now** — 6 trending playlist cards
- **Recommended Albums** — 6 album cards
- **Podcasts You Might Like** — 6 podcast cards

### 🔍 Search Page
- Real-time search filtering of category cards
- 12 colorful Browse All category cards (Pop, Hip-Hop, Electronic, R&B, Rock, Latin, Podcasts, Indie, Dance/EDM, Jazz, Classical, Country)
- Sticky search input in top navigation

### 📚 Library Page
- Filter tabs: All | Playlists | Artists | Albums | Podcasts & Shows
- Library search input
- Sort by: Recents, Recently Added, Alphabetical, Creator
- Playlist, artist, album, and podcast items with type badges

### 🎵 Music Player Bar
- **Left**: Album art, song name, artist, Like button, external link
- **Center**: Shuffle, Previous, Play/Pause, Next, Repeat + progress bar with timestamps
- **Right**: Queue, Devices, Volume icon (mute/low/high), Volume slider, Fullscreen
- Auto-advances to next track on completion
- "Repeat One" mode available

### 📱 Responsive Design
- **Desktop (>1400px)**: Full 6-column card grid
- **Laptop (1024–1280px)**: 4-column grid, compact sidebar
- **Tablet Landscape (768–1024px)**: Icon-only collapsed sidebar
- **Tablet Portrait (600–768px)**: Off-canvas sidebar, mobile bottom nav
- **Mobile (<600px)**: Single-column, swipeable bottom nav, simplified player

---

## 🛠️ Technologies Used

| Technology        | Purpose                                 |
|-------------------|-----------------------------------------|
| HTML5             | Semantic structure, accessibility       |
| CSS3              | Design system, animations, layout       |
| CSS Flexbox       | Sidebar, player bar, nav layouts        |
| CSS Grid          | Card grids, app layout                  |
| CSS Variables     | Design tokens (colors, spacing, radii)  |
| Vanilla JS (ES6)  | All interactions, state management      |
| Font Awesome 6    | Icons throughout the UI                 |
| Inter (Google Fonts) | Typography (closest to Spotify Circular) |

---

## 🚀 Installation & Running

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- No Node.js, npm, or build tools required

### Steps
```bash
# 1. Clone or download the project
git clone <your-repo-url>
cd spotify-clone

# 2. Open directly in browser
# Option A: Double-click index.html
# Option B: Use VS Code Live Server extension
# Option C: Use Python's simple HTTP server
python -m http.server 8080
# Then visit: http://localhost:8080
```

---

## 📁 Folder Structure

```
spotify-clone/
│── index.html            ← Main application
│── css/
│   ├── style.css         ← Design system, components, animations
│   └── responsive.css    ← All media queries & breakpoints
│── js/
│   └── script.js         ← Frontend interactions & state management
│── assets/
│   ├── images/           ← AI-generated album art, artist photos, podcast covers
│   └── icons/            ← Custom SVG icons (if added)
└── README.md
```

---

## 🎮 Keyboard Shortcuts

| Shortcut         | Action               |
|------------------|----------------------|
| `Space`          | Play / Pause         |
| `Ctrl + →`       | Next track           |
| `Ctrl + ←`       | Previous track       |
| `Ctrl + ↑`       | Volume up            |
| `Ctrl + ↓`       | Volume down          |
| `M`              | Toggle mute          |
| `S`              | Toggle shuffle       |
| `R`              | Cycle repeat mode    |
| `Escape`         | Close dropdowns/modal|

---

## 🎨 Design System

### Color Palette
```css
--sp-bg-dark:      #121212   /* Main background */
--sp-bg-elevated:  #181818   /* Card background */
--sp-bg-card:      #282828   /* Elevated card */
--sp-green:        #1DB954   /* Spotify primary */
--sp-text-primary: #FFFFFF   /* Primary text */
--sp-text-secondary: #B3B3B3 /* Secondary text */
```

### Typography
- **Font**: Inter (Google Fonts) — closest open-source match to Spotify's Circular
- **Weights**: 300, 400, 500, 600, 700, 800

### Animations
- Loading screen with equalizer bars
- Card hover: scale + shadow + green play button reveal
- Page transitions: slide-up fade
- Progress bar auto-animation
- Volume slider interactive fill
- Toast notification slide-up
- Staggered card entry animations

---

## 🔧 JavaScript Architecture

The app uses a simple, zero-dependency architecture with:

- **`State`** object — single source of truth for all app state
- **`TRACKS`** array — 6 built-in tracks for cycling
- **`DOM`** object — all element references centralized
- **Module-style functions** — each feature in its own `initXxx()` function
- **Event delegation** — minimal listeners, maximum performance
- **IntersectionObserver** — lazy animation of sections as they scroll into view

---

## 🌟 JS Feature Implementations

| Feature                 | Implementation                                           |
|-------------------------|----------------------------------------------------------|
| Play/Pause toggle       | State flag + icon class swap + interval management       |
| Progress bar            | `setInterval` 1s tick + click/drag seek                  |
| Volume control          | Range input + background-size gradient + icon states     |
| Page navigation         | Section show/hide + nav active class toggling            |
| Search filtering        | Opacity filter on category cards                         |
| Library tabs            | `data-type` filtering on list items                      |
| Shuffle                 | Random index generation (avoids repeating current)       |
| Repeat modes            | 3-state cycle: off → all → one                           |
| Track auto-advance      | Duration comparison in progress interval                 |
| Toast notifications     | Dynamic DOM injection with CSS animation                 |
| Keyboard shortcuts      | Global `keydown` listener with modifier key support      |
| Avatar dropdown         | Toggle class with outside-click dismissal                |
| Mobile sidebar          | Transform slide with overlay                             |

---

## 📈 Performance

- **Lazy-loaded images** — `loading="lazy"` on all `<img>` tags
- **Intersection Observer** — sections animate only when visible
- **CSS `transform` + `opacity`** — GPU-accelerated animations
- **No external JS dependencies** — zero bundle overhead
- **Semantic HTML5** — screen-reader friendly, SEO-optimized
- **`prefers-reduced-motion`** — motion disabled for accessibility
- **`hover: none` media query** — touch-device optimization

---

## 🔮 Future Improvements

- [ ] Integrate Spotify Web Playback SDK for real music playback
- [ ] Add OAuth 2.0 Spotify authentication
- [ ] Implement real-time lyrics display
- [ ] Add drag-and-drop playlist reordering
- [ ] Build out Now Playing full-screen view
- [ ] Add mini player on mobile
- [ ] Implement queue management UI
- [ ] Add friend activity sidebar
- [ ] Podcast episode listing pages
- [ ] Artist/Album detail pages with hero gradient
- [ ] Local storage for persisting liked songs and library
- [ ] Dark/Light theme toggle (partial Spotify light mode)

---

## 📝 License

This project is built for **educational and portfolio purposes only**.  
Spotify, the Spotify logo, and all related marks are trademarks of Spotify AB.  
This clone is not affiliated with, endorsed by, or connected to Spotify in any way.

---

## 👤 Author

Built as a portfolio project demonstrating strong **HTML, CSS, responsive design, and JavaScript skills**.
