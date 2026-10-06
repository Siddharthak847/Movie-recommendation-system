"""
FastAPI Server for Netflix-grade Movie Recommendation System.
Provides RESTful APIs for real-time personalization, hybrid recommendation,
collaborative filtering, search, and serves the cinematic front-end.
"""

import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.recommender import MovieRecommenderEngine

app = FastAPI(
    title="CineFlix - AI Movie Recommendation Engine",
    description="Netflix-grade recommendation system using hybrid Content-Based & Collaborative Filtering",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Recommender Engine
recommender = MovieRecommenderEngine()

# Static directory path
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)


class RateRequest(BaseModel):
    movie_id: int
    rating: float
    user_id: Optional[str] = "default_user"


class WatchlistRequest(BaseModel):
    movie_id: int
    user_id: Optional[str] = "default_user"


class PersonaRequest(BaseModel):
    persona_name: str
    user_id: Optional[str] = "default_user"


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "movie_count": len(recommender.movies),
        "engine": "Hybrid (TF-IDF + Cosine Similarity + Item-Item Collaborative + Bayesian Rating)"
    }


@app.get("/api/home")
def get_home_rows(user_id: str = "default_user"):
    """Returns hero billboard and all curated Netflix category rows."""
    return recommender.get_category_rows(user_id=user_id)


@app.get("/api/movies/catalog")
def get_catalog():
    """Returns all movies in the system catalog."""
    return recommender.movies


@app.get("/api/movies/{movie_id}")
def get_movie_details(movie_id: int):
    """Returns comprehensive movie details and similar movies."""
    if movie_id not in recommender.movie_map:
        raise HTTPException(status_code=404, detail="Movie not found")
    movie = recommender.movie_map[movie_id]
    similar = recommender.get_similar_movies(movie_id, limit=6)
    return {
        "movie": movie,
        "similar": similar
    }


@app.get("/api/recommend/user")
def get_user_recommendations(
    user_id: str = "default_user",
    limit: int = 15,
    exclude_rated: bool = False
):
    """Returns real-time personalized recommendations based on active taste profile."""
    return recommender.get_personalized_recommendations(
        user_id=user_id,
        limit=limit,
        exclude_rated=exclude_rated
    )


@app.get("/api/recommend/similar/{movie_id}")
def get_similar_recommendations(movie_id: int, limit: int = 8):
    """Returns content-based similar movies."""
    return recommender.get_similar_movies(movie_id=movie_id, limit=limit)


@app.post("/api/user/rate")
def rate_movie(req: RateRequest):
    """Submits movie rating (1.0 to 5.0) and dynamically recalibrates taste profile."""
    if req.movie_id not in recommender.movie_map:
        raise HTTPException(status_code=404, detail="Movie not found")
    if req.rating < 1.0 or req.rating > 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0")
    profile = recommender.rate_movie(req.movie_id, req.rating, user_id=req.user_id)
    return {
        "message": f"Successfully recorded rating of {req.rating} for {recommender.movie_map[req.movie_id]['title']}",
        "profile": profile
    }


@app.post("/api/user/watchlist/toggle")
def toggle_watchlist(req: WatchlistRequest):
    """Toggles movie presence in user's Watchlist (My List)."""
    if req.movie_id not in recommender.movie_map:
        raise HTTPException(status_code=404, detail="Movie not found")
    res = recommender.toggle_watchlist(req.movie_id, user_id=req.user_id)
    return res


@app.get("/api/user/profile")
def get_user_profile(user_id: str = "default_user"):
    """Returns the user's active taste profile, rated movies, and watchlist."""
    return recommender.get_user_profile(user_id=user_id)


@app.post("/api/user/persona")
def set_user_persona(req: PersonaRequest):
    """Switches the user's taste persona archetype."""
    return recommender.set_user_persona(req.persona_name, user_id=req.user_id)


@app.get("/api/search")
def search_movies(
    q: str = "",
    genre: Optional[str] = None,
    mood: Optional[str] = None,
    min_rating: float = 0.0,
    sort_by: str = "match",
    user_id: str = "default_user"
):
    """Multi-attribute search and filtering."""
    return recommender.search_and_filter(
        query=q,
        genre=genre,
        mood=mood,
        min_rating=min_rating,
        sort_by=sort_by,
        user_id=user_id
    )


@app.get("/api/metadata/filters")
def get_filter_options():
    """Returns available genres and mood tags for filtering."""
    all_genres = set()
    all_moods = set()
    for m in recommender.movies:
        all_genres.update(m.get("genres", []))
        all_moods.update(m.get("mood_tags", []))
    return {
        "genres": sorted(list(all_genres)),
        "moods": sorted(list(all_moods))
    }


# Mount static assets directory
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "CineFlix Recommendation Engine is running! Frontend assets loading..."}
