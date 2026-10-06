/**
 * CINEFLIX — State of the Art Movie Recommendation Frontend Engine
 * Handles real-time AI personalization, dynamic Netflix carousels,
 * interactive card expansions, YouTube trailer modal, search, and taste studio.
 */

const API_BASE = window.location.origin;
const STATE = {
  userId: "default_user",
  homeData: null,
  userProfile: null,
  currentModalMovie: null,
  activeFilterGenre: "All",
  activeFilterMood: "All",
  activeFilterSort: "match",
  searchQuery: "",
  searchDebounceTimer: null,
  isAudioMuted: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  initNavbarScroll();
  initEventListeners();
  await loadFilterOptions();
  await refreshApp();
});

async function refreshApp() {
  await Promise.all([
    loadHomeFeed(),
    loadUserProfile()
  ]);
}

// ============================================================================
// DATA FETCHING & API SERVICES
// ============================================================================
async function loadHomeFeed() {
  try {
    const res = await fetch(`${API_BASE}/api/home?user_id=${STATE.userId}`);
    if (!res.ok) throw new Error("Failed to load home feed");
    const data = await res.json();
    STATE.homeData = data;
    renderHero(data.hero);
    renderCategoryRows(data.rows);
  } catch (err) {
    console.error("Home feed error:", err);
    showToast("Error loading movie recommendations", "fa-triangle-exclamation");
  }
}

async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/user/profile?user_id=${STATE.userId}`);
    if (!res.ok) throw new Error("Failed to load user profile");
    const profile = await res.json();
    STATE.userProfile = profile;
    updateUserProfileUI(profile);
  } catch (err) {
    console.error("User profile error:", err);
  }
}

async function loadFilterOptions() {
  try {
    const res = await fetch(`${API_BASE}/api/metadata/filters`);
    if (!res.ok) return;
    const { genres, moods } = await res.json();
    
    const genreSelect = document.getElementById("filter-genre");
    const moodSelect = document.getElementById("filter-mood");

    genres.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreSelect.appendChild(opt);
    });

    moods.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      moodSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Filters load error:", err);
  }
}

// ============================================================================
// HERO BILLBOARD RENDERING
// ============================================================================
function renderHero(hero) {
  if (!hero) return;
  
  const backdrop = document.getElementById("hero-backdrop");
  backdrop.src = hero.backdrop_path || hero.poster_path;
  
  document.getElementById("hero-title").textContent = hero.title;
  document.getElementById("hero-match-pct").textContent = `${hero.match_percentage || 98}% Match`;
  document.getElementById("hero-rating").innerHTML = `<i class="fa-solid fa-star"></i> ${hero.imdb_rating}`;
  document.getElementById("hero-year").textContent = hero.year;
  document.getElementById("hero-age").textContent = hero.age_rating || "PG-13";
  document.getElementById("hero-duration").textContent = hero.duration || "2h";
  document.getElementById("hero-overview").textContent = hero.overview;
  
  const xaiText = hero.explanation || "Top recommendation based on your active taste vector";
  document.getElementById("hero-explanation-text").textContent = xaiText;
  document.getElementById("hero-age-pill").textContent = hero.age_rating || "16+";

  // Watchlist status
  const wlBtn = document.getElementById("hero-watchlist-btn");
  const inWatchlist = STATE.userProfile?.watchlist?.some(m => m.id === hero.id);
  updateButtonWatchlistState(wlBtn, inWatchlist);

  // Button Actions
  document.getElementById("hero-play-btn").onclick = () => openMovieModal(hero.id, true);
  document.getElementById("hero-info-btn").onclick = () => openMovieModal(hero.id, false);
  wlBtn.onclick = () => handleWatchlistToggle(hero.id, wlBtn);
}

// ============================================================================
// CATEGORY ROWS & CAROUSEL RENDERING
// ============================================================================
function renderCategoryRows(rows) {
  const container = document.getElementById("category-rows-container");
  container.innerHTML = "";

  rows.forEach(row => {
    if (!row.movies || row.movies.length === 0) return;

    const rowEl = document.createElement("section");
    rowEl.className = "category-row";
    rowEl.id = `row-${row.id}`;

    // Row Header
    const headerEl = document.createElement("div");
    headerEl.className = "row-header";
    headerEl.innerHTML = `
      <h2 class="row-title">${row.title}</h2>
      ${row.badge ? `<span class="row-badge">${row.badge}</span>` : ""}
    `;
    rowEl.appendChild(headerEl);

    // Carousel Container
    const carouselEl = document.createElement("div");
    carouselEl.className = "carousel-container";

    // Navigation Buttons
    const prevBtn = document.createElement("button");
    prevBtn.className = "carousel-btn prev";
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.setAttribute("aria-label", "Scroll left");

    const nextBtn = document.createElement("button");
    nextBtn.className = "carousel-btn next";
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.setAttribute("aria-label", "Scroll right");

    const trackEl = document.createElement("div");
    trackEl.className = "carousel-track";

    // Render Cards
    row.movies.forEach(movie => {
      const cardWrapper = row.is_top_10 
        ? createTop10Card(movie) 
        : createStandardMovieCard(movie);
      trackEl.appendChild(cardWrapper);
    });

    // Scroll Logic
    prevBtn.onclick = () => {
      trackEl.scrollBy({ left: -600, behavior: "smooth" });
    };
    nextBtn.onclick = () => {
      trackEl.scrollBy({ left: 600, behavior: "smooth" });
    };

    carouselEl.appendChild(prevBtn);
    carouselEl.appendChild(trackEl);
    carouselEl.appendChild(nextBtn);

    rowEl.appendChild(carouselEl);
    container.appendChild(rowEl);
  });
}

function createStandardMovieCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";
  card.dataset.movieId = movie.id;

  const inWatchlist = STATE.userProfile?.watchlist?.some(m => m.id === movie.id);
  const matchPct = movie.match_percentage || 85;

  card.innerHTML = `
    <img 
      src="${movie.poster_path}" 
      alt="${movie.title}" 
      class="movie-poster-img" 
      loading="lazy" 
    />
    <span class="card-match-ribbon">${matchPct}%</span>

    <!-- Hover Expanded Preview Card -->
    <div class="hover-preview-card">
      <div class="preview-media">
        <img src="${movie.backdrop_path || movie.poster_path}" alt="${movie.title}" class="preview-backdrop-img" />
        <div class="preview-media-overlay">
          <span class="preview-title">${movie.title}</span>
        </div>
      </div>
      <div class="preview-details">
        <div class="preview-actions">
          <div class="preview-action-left">
            <button class="action-circle-btn play-circle" title="Play Trailer">
              <i class="fa-solid fa-play"></i>
            </button>
            <button class="action-circle-btn watchlist-circle ${inWatchlist ? 'active' : ''}" title="My List">
              <i class="fa-solid ${inWatchlist ? 'fa-check' : 'fa-plus'}"></i>
            </button>
            <button class="action-circle-btn like-circle" title="Rate / Like">
              <i class="fa-regular fa-thumbs-up"></i>
            </button>
          </div>
          <button class="action-circle-btn details-circle" title="More Info">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
        </div>

        <div class="preview-meta">
          <span class="preview-match">${matchPct}% Match</span>
          <span class="preview-age">${movie.age_rating || "PG-13"}</span>
          <span>${movie.duration || "2h"}</span>
          <span class="hero-quality-badge">4K</span>
        </div>

        <div class="preview-genres">
          ${movie.genres.slice(0, 3).map((g, idx) => `
            <span class="${idx > 0 ? 'genre-dot' : ''}">${g}</span>
          `).join("")}
        </div>

        ${movie.explanation ? `
          <div class="preview-xai-reason">
            <i class="fa-solid fa-brain"></i>
            <span>${movie.explanation}</span>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  // Attach Card & Preview Event Listeners
  card.onclick = (e) => {
    // If clicked on action buttons inside preview, let their handlers run
    if (e.target.closest(".action-circle-btn")) return;
    openMovieModal(movie.id);
  };

  const playBtn = card.querySelector(".play-circle");
  playBtn.onclick = (e) => {
    e.stopPropagation();
    openMovieModal(movie.id, true);
  };

  const wlBtn = card.querySelector(".watchlist-circle");
  wlBtn.onclick = (e) => {
    e.stopPropagation();
    handleWatchlistToggle(movie.id, wlBtn);
  };

  const likeBtn = card.querySelector(".like-circle");
  likeBtn.onclick = (e) => {
    e.stopPropagation();
    handleQuickRate(movie.id, 5.0, card);
  };

  const detailsBtn = card.querySelector(".details-circle");
  detailsBtn.onclick = (e) => {
    e.stopPropagation();
    openMovieModal(movie.id, false);
  };

  return card;
}

function createTop10Card(movie) {
  const wrapper = document.createElement("div");
  wrapper.className = "top-10-card-wrapper";

  const rankEl = document.createElement("div");
  rankEl.className = "top-10-rank-number";
  rankEl.textContent = movie.rank || "1";

  const card = createStandardMovieCard(movie);

  wrapper.appendChild(rankEl);
  wrapper.appendChild(card);
  return wrapper;
}

// ============================================================================
// NETFLIX MOVIE DETAIL & TRAILER MODAL
// ============================================================================
async function openMovieModal(movieId, autoPlayTrailer = false) {
  try {
    const res = await fetch(`${API_BASE}/api/movies/${movieId}`);
    if (!res.ok) throw new Error("Could not fetch movie details");
    const { movie, similar } = await res.json();
    STATE.currentModalMovie = movie;

    // Elements
    const backdrop = document.getElementById("movie-modal-backdrop");
    const iframe = document.getElementById("modal-youtube-iframe");
    const fallbackImg = document.getElementById("modal-hero-fallback");

    // Title & Meta
    document.getElementById("modal-title").textContent = movie.title;
    document.getElementById("modal-match-score").textContent = `${movie.match_percentage || 95}% Match`;
    document.getElementById("modal-year").textContent = movie.year;
    document.getElementById("modal-age").textContent = movie.age_rating || "PG-13";
    document.getElementById("modal-duration").textContent = movie.duration;
    document.getElementById("modal-overview").textContent = movie.overview;

    // Director, Cast, Genres, Moods, Awards
    document.getElementById("modal-director").textContent = movie.director;
    document.getElementById("modal-cast").textContent = movie.cast.join(", ");
    document.getElementById("modal-genres").textContent = movie.genres.join(", ");
    document.getElementById("modal-awards").textContent = movie.awards || "Critically Acclaimed";

    // Mood Tags
    const moodContainer = document.getElementById("modal-mood-tags");
    moodContainer.innerHTML = movie.mood_tags.map(m => `<span class="tag">${m}</span>`).join("");

    // Explainable AI Reason
    const xaiEl = document.getElementById("modal-xai-text");
    xaiEl.textContent = movie.explanation || `Recommended because of your affinity for ${movie.genres.join(" and ")} storytelling.`;

    // Trailer Video Loading
    if (movie.trailer_youtube_id) {
      const autoPlayParam = autoPlayTrailer ? "1" : "0";
      iframe.src = `https://www.youtube.com/embed/${movie.trailer_youtube_id}?autoplay=${autoPlayParam}&enablejsapi=1&rel=0&modestbranding=1`;
      iframe.classList.remove("hidden");
      fallbackImg.classList.add("hidden");
    } else {
      iframe.src = "";
      iframe.classList.add("hidden");
      fallbackImg.src = movie.backdrop_path || movie.poster_path;
      fallbackImg.classList.remove("hidden");
    }

    // Modal Quick Actions
    const wlBtn = document.getElementById("modal-watchlist-btn");
    const inWatchlist = STATE.userProfile?.watchlist?.some(m => m.id === movie.id);
    updateButtonWatchlistState(wlBtn, inWatchlist);
    wlBtn.onclick = () => handleWatchlistToggle(movie.id, wlBtn);

    document.getElementById("modal-play-trailer-btn").onclick = () => {
      iframe.src = `https://www.youtube.com/embed/${movie.trailer_youtube_id}?autoplay=1&enablejsapi=1&rel=0`;
    };

    // Modal Thumbs
    const thumbsUp = document.getElementById("modal-thumbs-up");
    const thumbsLove = document.getElementById("modal-thumbs-love");
    
    thumbsUp.onclick = () => handleQuickRate(movie.id, 4.0);
    thumbsLove.onclick = () => handleQuickRate(movie.id, 5.0);

    // Interactive Stars Rating Widget
    setupModalStars(movie.id);

    // Render "More Like This" Grid Inside Modal
    renderModalSimilarGrid(similar);

    // Open Modal
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  } catch (err) {
    console.error("Open modal error:", err);
    showToast("Failed to load movie details", "fa-triangle-exclamation");
  }
}

function closeMovieModal() {
  const backdrop = document.getElementById("movie-modal-backdrop");
  const iframe = document.getElementById("modal-youtube-iframe");
  iframe.src = ""; // Stop audio/video
  backdrop.classList.remove("open");
  document.body.style.overflow = "auto";
  STATE.currentModalMovie = null;
}

function setupModalStars(movieId) {
  const starBtns = document.querySelectorAll("#modal-stars-bar .star-btn");
  const feedbackLabel = document.getElementById("rating-feedback");

  // Check if already rated
  const existingRating = STATE.userProfile?.rated_movies?.find(r => r.id === movieId)?.rating;
  if (existingRating) {
    updateStarBarUI(existingRating);
    feedbackLabel.textContent = `You rated this ${existingRating} ★`;
  } else {
    updateStarBarUI(0);
    feedbackLabel.textContent = "Click to rate";
  }

  starBtns.forEach(btn => {
    const val = parseFloat(btn.dataset.value);
    btn.onmouseenter = () => {
      starBtns.forEach((b, i) => {
        if (i < val) b.classList.add("hovered");
        else b.classList.remove("hovered");
      });
    };
    btn.onmouseleave = () => {
      starBtns.forEach(b => b.classList.remove("hovered"));
    };
    btn.onclick = async () => {
      await handleStarRate(movieId, val);
    };
  });
}

function updateStarBarUI(val) {
  const starBtns = document.querySelectorAll("#modal-stars-bar .star-btn");
  starBtns.forEach((b, i) => {
    if (i < val) b.classList.add("active");
    else b.classList.remove("active");
  });
}

function renderModalSimilarGrid(similarMovies) {
  const grid = document.getElementById("modal-similar-grid");
  grid.innerHTML = "";

  if (!similarMovies || similarMovies.length === 0) {
    grid.innerHTML = "<p class='text-muted'>No direct recommendations available.</p>";
    return;
  }

  similarMovies.forEach(item => {
    const card = document.createElement("div");
    card.className = "similar-card";
    card.innerHTML = `
      <img src="${item.backdrop_path || item.poster_path}" alt="${item.title}" class="similar-card-img" />
      <div class="similar-card-body">
        <div class="similar-card-header">
          <span class="similar-match">${item.match_percentage}% Match</span>
          <span class="meta-pill">${item.year}</span>
        </div>
        <h4 class="similar-card-title">${item.title}</h4>
        <p class="similar-card-overview">${item.overview}</p>
      </div>
    `;
    card.onclick = () => {
      openMovieModal(item.id, true);
    };
    grid.appendChild(card);
  });
}

// ============================================================================
// REAL-TIME USER ACTIONS (RATING & WATCHLIST)
// ============================================================================
async function handleStarRate(movieId, rating) {
  try {
    const res = await fetch(`${API_BASE}/api/user/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: movieId, rating: rating, user_id: STATE.userId })
    });
    if (!res.ok) throw new Error("Failed to record rating");
    const data = await res.json();
    
    updateStarBarUI(rating);
    document.getElementById("rating-feedback").textContent = `Rated ${rating} ★ — AI Recalibrated!`;
    showToast(`AI learned your taste! Updated recommendation vector with ${rating}★`, "fa-brain");

    // Refresh recommendations dynamically in background
    await refreshApp();
  } catch (err) {
    console.error("Star rate error:", err);
    showToast("Rating failed to submit", "fa-triangle-exclamation");
  }
}

async function handleQuickRate(movieId, rating, sourceCard = null) {
  try {
    const res = await fetch(`${API_BASE}/api/user/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: movieId, rating: rating, user_id: STATE.userId })
    });
    if (!res.ok) throw new Error("Failed to submit rating");
    
    showToast(`Rated! AI instantly adjusted your Top Picks`, "fa-thumbs-up");
    await refreshApp();
  } catch (err) {
    console.error("Quick rate error:", err);
  }
}

async function handleWatchlistToggle(movieId, buttonElement) {
  try {
    const res = await fetch(`${API_BASE}/api/user/watchlist/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: movieId, user_id: STATE.userId })
    });
    if (!res.ok) throw new Error("Watchlist toggle failed");
    const { in_watchlist, watchlist_count } = await res.json();

    updateButtonWatchlistState(buttonElement, in_watchlist);
    showToast(
      in_watchlist ? "Added to My List" : "Removed from My List", 
      in_watchlist ? "fa-check" : "fa-trash"
    );

    await loadUserProfile();
    // Refresh rows so My List row updates
    await loadHomeFeed();
  } catch (err) {
    console.error("Watchlist error:", err);
    showToast("Failed to update My List", "fa-triangle-exclamation");
  }
}

function updateButtonWatchlistState(btn, inList) {
  if (!btn) return;
  if (inList) {
    btn.classList.add("active");
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.title = "In My List";
  } else {
    btn.classList.remove("active");
    btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    btn.title = "Add to My List";
  }
}

// ============================================================================
// AI TASTE STUDIO & PERSONA ADAPTATION
// ============================================================================
function updateUserProfileUI(profile) {
  if (!profile) return;

  // Navbar Watchlist Count
  const badge = document.getElementById("watchlist-nav-badge");
  if (badge) badge.textContent = profile.watchlist_count || 0;

  // Dropdown Active Persona
  const personaLabel = document.getElementById("dropdown-persona-name");
  if (personaLabel) personaLabel.textContent = profile.persona || "Custom Persona";

  // Ratings Count
  const ratingsCount = document.getElementById("user-ratings-count");
  if (ratingsCount) ratingsCount.textContent = profile.ratings_count || 0;

  // Render Top Taste Bars
  const barsContainer = document.getElementById("taste-bars-container");
  if (barsContainer) {
    barsContainer.innerHTML = "";
    const topGenres = profile.top_genres || ["Sci-Fi", "Action", "Drama", "Thriller", "Adventure"];
    
    topGenres.forEach((genre, idx) => {
      const pct = Math.max(30, 95 - (idx * 13));
      const barItem = document.createElement("div");
      barItem.className = "taste-bar-item";
      barItem.innerHTML = `
        <div class="taste-bar-labels">
          <span>${genre}</span>
          <span class="text-muted">${pct}% affinity</span>
        </div>
        <div class="taste-progress-track">
          <div class="taste-progress-fill" style="width: ${pct}%"></div>
        </div>
      `;
      barsContainer.appendChild(barItem);
    });
  }

  // Render Rated Movies Thumbs in Studio
  const ratedScroll = document.getElementById("rated-movies-list");
  if (ratedScroll) {
    ratedScroll.innerHTML = "";
    if (profile.rated_movies && profile.rated_movies.length > 0) {
      profile.rated_movies.forEach(rm => {
        const thumb = document.createElement("div");
        thumb.className = "rated-thumb";
        thumb.title = `${rm.title} (${rm.rating}★)`;
        thumb.innerHTML = `
          <img src="${rm.poster_path}" alt="${rm.title}" />
          <div class="rated-thumb-score">${rm.rating}★</div>
        `;
        thumb.onclick = () => openMovieModal(rm.id);
        ratedScroll.appendChild(thumb);
      });
    } else {
      ratedScroll.innerHTML = "<p class='text-muted' style='font-size:11px'>No rated movies yet. Rate titles to tune the engine!</p>";
    }
  }
}

async function switchPersona(personaKey) {
  try {
    const res = await fetch(`${API_BASE}/api/user/persona`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona_name: personaKey, user_id: STATE.userId })
    });
    if (!res.ok) throw new Error("Persona switch failed");
    const updatedProfile = await res.json();
    
    showToast(`Taste archetype shifted to: ${updatedProfile.persona}!`, "fa-wand-magic-sparkles");
    
    // Close dropdown & drawer
    document.getElementById("persona-dropdown").classList.remove("open");
    document.getElementById("ai-studio-drawer").classList.remove("open");

    // Re-render
    await refreshApp();
  } catch (err) {
    console.error("Persona error:", err);
  }
}

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================
async function performSearch() {
  const query = STATE.searchQuery;
  const genre = STATE.activeFilterGenre;
  const mood = STATE.activeFilterMood;
  const sort = STATE.activeFilterSort;

  const resultsSection = document.getElementById("search-results-section");
  const homeRows = document.getElementById("category-rows-container");
  const heroSection = document.getElementById("hero-section");
  const grid = document.getElementById("search-grid");
  const summary = document.getElementById("search-summary");

  if (!query && genre === "All" && mood === "All") {
    // Show normal Netflix home rows
    resultsSection.classList.add("hidden");
    homeRows.style.display = "block";
    heroSection.style.display = "flex";
    return;
  }

  // Switch to search view
  resultsSection.classList.remove("hidden");
  homeRows.style.display = "none";
  heroSection.style.display = "none";
  grid.innerHTML = "<div class='text-muted' style='padding:20px'>Searching recommendation catalog...</div>";

  try {
    const url = new URL(`${API_BASE}/api/search`);
    if (query) url.searchParams.append("q", query);
    if (genre !== "All") url.searchParams.append("genre", genre);
    if (mood !== "All") url.searchParams.append("mood", mood);
    url.searchParams.append("sort_by", sort);
    url.searchParams.append("user_id", STATE.userId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Search request failed");
    const movies = await res.json();

    summary.textContent = `Found ${movies.length} titles matching criteria`;
    grid.innerHTML = "";

    if (movies.length === 0) {
      grid.innerHTML = "<div class='text-muted' style='padding:40px; grid-column:1/-1; text-align:center'>No movies found matching your search. Try different filters!</div>";
      return;
    }

    movies.forEach(movie => {
      const card = createStandardMovieCard(movie);
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Search error:", err);
    grid.innerHTML = "<div class='text-muted'>Error fetching search results.</div>";
  }
}

// ============================================================================
// EVENT LISTENERS & UI BEHAVIOR
// ============================================================================
function initEventListeners() {
  // Modal Close
  document.getElementById("modal-close-btn").onclick = closeMovieModal;
  document.getElementById("movie-modal-backdrop").onclick = (e) => {
    if (e.target.id === "movie-modal-backdrop") closeMovieModal();
  };

  // Keyboard Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMovieModal();
      document.getElementById("ai-studio-drawer").classList.remove("open");
      document.getElementById("persona-dropdown").classList.remove("open");
    }
  });

  // Search Toggle
  const searchTrigger = document.getElementById("search-trigger");
  const searchContainer = document.getElementById("search-container");
  const searchInput = document.getElementById("search-input");
  const clearSearch = document.getElementById("clear-search");

  searchTrigger.onclick = () => {
    searchContainer.classList.toggle("active");
    if (searchContainer.classList.contains("active")) {
      searchInput.focus();
    }
  };

  searchInput.oninput = (e) => {
    STATE.searchQuery = e.target.value.trim();
    clearTimeout(STATE.searchDebounceTimer);
    STATE.searchDebounceTimer = setTimeout(performSearch, 300);
  };

  clearSearch.onclick = () => {
    searchInput.value = "";
    STATE.searchQuery = "";
    performSearch();
  };

  // Filter Dropdowns
  document.getElementById("filter-genre").onchange = (e) => {
    STATE.activeFilterGenre = e.target.value;
    performSearch();
  };

  document.getElementById("filter-mood").onchange = (e) => {
    STATE.activeFilterMood = e.target.value;
    performSearch();
  };

  document.getElementById("filter-sort").onchange = (e) => {
    STATE.activeFilterSort = e.target.value;
    performSearch();
  };

  document.getElementById("reset-filters-btn").onclick = () => {
    document.getElementById("filter-genre").value = "All";
    document.getElementById("filter-mood").value = "All";
    document.getElementById("filter-sort").value = "match";
    document.getElementById("search-input").value = "";
    STATE.activeFilterGenre = "All";
    STATE.activeFilterMood = "All";
    STATE.activeFilterSort = "match";
    STATE.searchQuery = "";
    performSearch();
  };

  // AI Taste Studio Drawer
  const openStudioBtn = document.getElementById("open-studio-btn");
  const closeStudioBtn = document.getElementById("drawer-close-btn");
  const drawer = document.getElementById("ai-studio-drawer");

  openStudioBtn.onclick = () => drawer.classList.add("open");
  closeStudioBtn.onclick = () => drawer.classList.remove("open");

  // Persona Dropdown
  const personaBtn = document.getElementById("persona-btn");
  const personaDropdown = document.getElementById("persona-dropdown");

  personaBtn.onclick = (e) => {
    e.stopPropagation();
    personaDropdown.classList.toggle("open");
  };

  document.addEventListener("click", () => {
    personaDropdown.classList.remove("open");
  });

  // Persona Option Clicks (Dropdown & Studio Cards)
  document.querySelectorAll(".persona-option, .persona-card").forEach(el => {
    el.onclick = () => {
      const personaKey = el.dataset.persona;
      if (personaKey) switchPersona(personaKey);
    };
  });

  // Sound Toggle on Hero
  const muteBtn = document.getElementById("mute-toggle-btn");
  const soundIcon = document.getElementById("sound-icon");
  muteBtn.onclick = () => {
    STATE.isAudioMuted = !STATE.isAudioMuted;
    if (STATE.isAudioMuted) {
      soundIcon.className = "fa-solid fa-volume-xmark";
      showToast("Audio muted", "fa-volume-xmark");
    } else {
      soundIcon.className = "fa-solid fa-volume-high";
      showToast("Spatial Audio enabled", "fa-volume-high");
    }
  };

  // Nav Logo Click
  document.getElementById("logo-btn").onclick = (e) => {
    e.preventDefault();
    document.getElementById("reset-filters-btn").click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

function initNavbarScroll() {
  const navbar = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function showToast(message, icon = "fa-circle-check") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4000);
}
