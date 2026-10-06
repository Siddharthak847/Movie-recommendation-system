# 🎬 CineFlix — Netflix-Grade AI Movie Recommendation System

An intelligent, full-stack cinematic movie recommendation engine built with **FastAPI**, **scikit-learn**, **NumPy**, **Pandas**, and a pixel-perfect **Netflix-styled Dark UI**.

---

## ✨ Features & Architecture

### 🧠 1. Multi-Strategy Hybrid Recommendation Engine
1. **Content-Based Filtering (TF-IDF & Weighted Metadata Soups)**:
   - Evaluates multi-attribute feature representations:
     - **Genres** (weight 4.0)
     - **Mood & Tone Tags** (weight 3.0: *Mind-Bending*, *Cyberpunk*, *Dark & Gritty*, *Adrenaline Rush*, *Atmospheric*, etc.)
     - **Director** (weight 3.0)
     - **Key Cast** (weight 2.0)
     - **Plot Overview & Synopsis Tokens**
   - High-dimensional TF-IDF vectorization with sublinear term-frequency scaling and cosine similarity.

2. **Item-Item Collaborative Filtering**:
   - Simulated interaction matrix across 40 archetypal streaming personas.
   - Calculates item-item Pearson & cosine correlations (*"Viewers who loved this also watched..."*).

3. **Bayesian Weighted Rating Calibration (IMDb Top 250 Formula)**:
   $$WR = \left(\frac{v}{v+m}\right) R + \left(\frac{m}{v+m}\right) C$$
   Prevents unranked titles with few ratings from distorting recommendations, balancing popularity and critical acclaim.

4. **Real-Time Dynamic User Taste Vector Adaptation**:
   - Calculates user preference vector $V_{user}$ in latent feature space:
     $$V_{user} = \sum_{m \in \text{Rated}} (r_m - 2.8) \cdot V_m + 1.5 \sum_{w \in \text{Watchlist}} V_w$$
   - Every star rating (1★ to 5★) or Thumbs Up/Down action instantly recalibrates the taste vector and regenerates the **Top Picks for You** row live without reloading!

5. **Explainable AI (XAI)**:
   - Explains the exact reasoning behind every recommendation (*e.g., "Because you loved Inception by Christopher Nolan"* or *"Matches your interest in acclaimed Sci-Fi cinema"*).

---

### 🎨 2. Netflix-Inspired Cinematic Interface
- **Obsidian Dark Mode**: Netflix Red (`#E50914`), deep obsidian (`#141414`), and authentic Emerald Match (`#46d369`).
- **Hero Billboard Spotlight**:
  - High-res widescreen backdrop with atmospheric vignette.
  - Live Match percentage, 4K Ultra HD & Spatial Audio badges.
  - Interactive **Play Trailer**, **More Info**, and **My List** buttons.
- **Dynamic Category Rows with Carousel Navigation**:
  - **Top Picks for You** (Live AI Personalized)
  - **Top 10 Movies Today** (Giant stylized rank numerals 1 through 10)
  - **Because You Watched [Title]** (Contextual item-to-item similarity)
  - **Mind-Bending & Sci-Fi Realities**
  - **Adrenaline Rush & Action Spectacles**
  - **Dark, Gritty & Gripping Crime**
  - **Animation, Whimsy & Family**
  - **Critically Acclaimed Masterpieces**
  - **My List (Watchlist)**
- **Signature Netflix Hover Card Expansion**:
  - Smooth scale expansion on hover revealing backdrop banner, action buttons, Match %, duration, age rating, genre bullets, and AI explanation.
- **Full Movie Detail & Video Trailer Modal**:
  - Autoplaying embedded YouTube trailer.
  - Comprehensive cast, director, awards, storyline, and tags.
  - **Interactive Rating Widget ("Rate & Teach AI")**: 1-5 stars immediately updating user taste profile.
  - **"More Like This"** 6-card recommendation grid.
- **AI Taste Studio Drawer**:
  - Visualizes your real-time taste vector across top genres.
  - Instant **Persona Archetype Switcher** (*Nolan & Sci-Fi*, *Action & Adrenaline*, *Dark Crime & Noir*, *Oscar Masterpieces*, *Animation & Heart*).
- **Search & Multi-Attribute Filtering**:
  - Instant live search with debounce.
  - Filter by Genre, Mood, Minimum IMDb Rating, and Sort By Match % / Rating / Release Year.

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)

### 1. Activate the Virtual Environment
On Windows (PowerShell):
```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Start the Recommendation Server
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Open in Browser
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the Netflix frontend application |
| `GET` | `/api/home` | Returns hero spotlight and all curated rows |
| `GET` | `/api/movies/{id}` | Movie details and 6 similar recommendations |
| `GET` | `/api/recommend/user` | Real-time personalized recommendations |
| `POST` | `/api/user/rate` | Submit movie rating (1.0-5.0) & update taste profile |
| `POST` | `/api/user/watchlist/toggle` | Toggle movie in My List |
| `GET` | `/api/user/profile` | Current taste profile & genre weights |
| `POST` | `/api/user/persona` | Switch to preset taste archetype |
| `GET` | `/api/search` | Search by query, genre, mood, min rating |
| `GET` | `/api/metadata/filters` | Available genres and mood filter options |