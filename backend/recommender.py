"""
Advanced Multi-Strategy Hybrid Movie Recommendation Engine.
Implements:
1. Content-Based TF-IDF + Cosine Similarity with Weighted Metadata Soups.
2. Collaborative Item-Item Filtering on Simulated Archetypal User Matrix.
3. Bayesian Weighted Rating Calibration (IMDb Top 250 Formula).
4. Real-Time Dynamic User Taste Vector with Instant Recalculation.
5. Explainable AI (XAI) Recommendation Justifications.
"""

import json
import os
import re
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class MovieRecommenderEngine:
    def __init__(self, data_path: Optional[str] = None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), "data", "movies.json")
        self.data_path = data_path
        self.movies: List[Dict[str, Any]] = []
        self.df: pd.DataFrame = pd.DataFrame()
        self.movie_map: Dict[int, Dict[str, Any]] = {}
        
        # ML Artifacts
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix: Optional[np.ndarray] = None
        self.content_sim_matrix: Optional[np.ndarray] = None
        self.collab_sim_matrix: Optional[np.ndarray] = None
        self.bayesian_scores: Dict[int, float] = {}
        
        # User Profiles (Session / In-memory storage)
        self.user_profiles: Dict[str, Dict[str, Any]] = {}
        
        # Load and initialize
        self._load_data()
        self._train_content_model()
        self._train_collaborative_model()
        self._calculate_bayesian_ratings()
        self._init_default_user("default_user")

    def _load_data(self):
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.movies = json.load(f)
        self.df = pd.DataFrame(self.movies)
        self.movie_map = {m["id"]: m for m in self.movies}

    def _clean_token(self, token: str) -> str:
        return re.sub(r"[^a-zA-Z0-9]", "", token.lower())

    def _create_metadata_soup(self, row: pd.Series) -> str:
        """
        Creates a high-signal weighted text representation:
        - Genres repeated 4 times (high weight)
        - Mood tags repeated 3 times
        - Director repeated 3 times
        - Top Cast repeated 2 times
        - Cleaned plot synopsis keywords
        """
        genres = " ".join([self._clean_token(g) for g in row["genres"]] * 4)
        moods = " ".join([self._clean_token(m) for m in row["mood_tags"]] * 3)
        director = " ".join([self._clean_token(d) for d in row["director"].split(",")] * 3)
        cast = " ".join([self._clean_token(c) for c in row["cast"][:4]] * 2)
        overview = row["overview"].lower()
        return f"{genres} {moods} {director} {cast} {overview}"

    def _train_content_model(self):
        """Builds TF-IDF feature space and calculates cosine similarity matrix."""
        soups = self.df.apply(self._create_metadata_soup, axis=1)
        self.tfidf_vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
            min_df=1
        )
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(soups).toarray()
        self.content_sim_matrix = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix)

    def _train_collaborative_model(self):
        """
        Simulates collaborative user interaction matrix using 40 distinct user personas
        (e.g., Sci-Fi enthusiasts, Christopher Nolan purists, Crime & Thriller lovers,
        Family & Animation viewers, Action/Blockbuster junkies, Oscar drama buffs).
        Computes item-item collaborative cosine similarity.
        """
        np.random.seed(42)
        num_movies = len(self.movies)
        num_simulated_users = 40
        ratings_matrix = np.zeros((num_simulated_users, num_movies))

        for u in range(num_simulated_users):
            # Assign favorite genre & director affinities to each synthetic persona
            fav_genres = np.random.choice(["Sci-Fi", "Action", "Drama", "Crime", "Animation", "Horror", "Comedy"], size=2, replace=False)
            fav_directors = np.random.choice(["Christopher Nolan", "Denis Villeneuve", "Martin Scorsese", "Quentin Tarantino", "David Fincher", "James Cameron"], size=1)

            for idx, movie in enumerate(self.movies):
                base_rating = movie["imdb_rating"] / 2.0  # Scale 1-5
                affinity = 0.0
                if any(g in fav_genres for g in movie["genres"]):
                    affinity += 0.8
                if movie["director"] in fav_directors:
                    affinity += 0.9
                
                # Add slight noise
                rating = base_rating + affinity + np.random.normal(0, 0.4)
                # Cap between 1.0 and 5.0, only some users rate each movie
                if np.random.rand() > 0.35:
                    ratings_matrix[u, idx] = max(1.0, min(5.0, rating))

        # Item-item collaborative matrix (movie x movie)
        item_ratings = ratings_matrix.T  # Shape: (num_movies, num_users)
        # Normalize by mean
        means = np.zeros(num_movies)
        for i in range(num_movies):
            rated = item_ratings[i, item_ratings[i] > 0]
            means[i] = np.mean(rated) if len(rated) > 0 else 3.0
            item_ratings[i, item_ratings[i] > 0] -= means[i]

        self.collab_sim_matrix = cosine_similarity(item_ratings)
        # Replace NaNs
        np.nan_to_num(self.collab_sim_matrix, copy=False, nan=0.0)

    def _calculate_bayesian_ratings(self):
        """
        Calculates IMDb Weighted Rating (WR):
        WR = (v / (v + m)) * R + (m / (v + m)) * C
        where:
        - R = average rating of the movie
        - v = number of votes for the movie
        - m = minimum votes required to be listed in top charts (70th percentile)
        - C = mean vote across the whole dataset
        """
        v_list = self.df["vote_count"].values
        r_list = self.df["imdb_rating"].values
        m = np.percentile(v_list, 70)
        c = np.mean(r_list)

        for _, row in self.df.iterrows():
            v = row["vote_count"]
            r = row["imdb_rating"]
            wr = (v / (v + m)) * r + (m / (v + m)) * c
            self.bayesian_scores[row["id"]] = float(wr)

    def _init_default_user(self, user_id: str):
        """Initializes default user profile with balanced initial seeds."""
        self.user_profiles[user_id] = {
            "ratings": {1: 5.0, 2: 5.0, 3: 4.5},  # Inception, Interstellar, The Dark Knight
            "likes": {1: "love", 2: "love", 3: "like"},
            "watchlist": [7, 13, 14],  # Dune 2, Parasite, Whiplash
            "history": [1, 2],
            "persona": "balanced"
        }

    def get_user_profile(self, user_id: str = "default_user") -> Dict[str, Any]:
        if user_id not in self.user_profiles:
            self._init_default_user(user_id)
        
        prof = self.user_profiles[user_id]
        rated_details = []
        for mid, score in prof["ratings"].items():
            if mid in self.movie_map:
                m = self.movie_map[mid]
                rated_details.append({
                    "id": m["id"],
                    "title": m["title"],
                    "poster_path": m["poster_path"],
                    "rating": score,
                    "like_status": prof["likes"].get(mid, "none")
                })
        
        watchlist_details = []
        for mid in prof["watchlist"]:
            if mid in self.movie_map:
                m = self.movie_map[mid]
                watchlist_details.append({
                    "id": m["id"],
                    "title": m["title"],
                    "poster_path": m["poster_path"],
                    "year": m["year"],
                    "imdb_rating": m["imdb_rating"]
                })

        # Calculate top genres preferred by user
        genre_weights: Dict[str, float] = {}
        for mid, score in prof["ratings"].items():
            if mid in self.movie_map:
                weight = score - 2.5
                for g in self.movie_map[mid]["genres"]:
                    genre_weights[g] = genre_weights.get(g, 0.0) + weight

        top_genres = sorted(genre_weights.items(), key=lambda x: x[1], reverse=True)

        return {
            "user_id": user_id,
            "persona": prof.get("persona", "custom"),
            "ratings_count": len(prof["ratings"]),
            "watchlist_count": len(prof["watchlist"]),
            "top_genres": [g[0] for g in top_genres[:5]],
            "rated_movies": rated_details,
            "watchlist": watchlist_details
        }

    def set_user_persona(self, persona_name: str, user_id: str = "default_user"):
        """Presets user taste vector to tailored archetypes for instant demonstration."""
        personas = {
            "nolan_scifi": {
                "ratings": {1: 5.0, 2: 5.0, 6: 4.5, 7: 5.0, 27: 4.5, 64: 4.0},
                "likes": {1: "love", 2: "love", 7: "love"},
                "watchlist": [5, 8, 45],
                "persona": "Christopher Nolan & Sci-Fi Aficionado"
            },
            "action_adrenaline": {
                "ratings": {31: 5.0, 41: 5.0, 35: 4.5, 52: 5.0, 18: 4.5, 3: 5.0},
                "likes": {31: "love", 41: "love", 52: "love"},
                "watchlist": [19, 32, 34],
                "persona": "High Octane Action & Adrenaline"
            },
            "crime_dark": {
                "ratings": {9: 5.0, 11: 5.0, 21: 5.0, 23: 5.0, 26: 4.5, 10: 4.5},
                "likes": {9: "love", 11: "love", 21: "love"},
                "watchlist": [12, 48, 50],
                "persona": "Dark Crime, Noir & Thrillers"
            },
            "cinephile_awards": {
                "ratings": {4: 5.0, 13: 5.0, 14: 5.0, 20: 5.0, 43: 4.5, 53: 4.5},
                "likes": {4: "love", 13: "love", 14: "love"},
                "watchlist": [17, 44, 61],
                "persona": "Critically Acclaimed Masterpieces"
            },
            "animation_heart": {
                "ratings": {15: 5.0, 16: 5.0, 29: 5.0, 42: 5.0, 57: 5.0, 58: 4.5},
                "likes": {15: "love", 29: "love", 42: "love"},
                "watchlist": [30, 43, 60],
                "persona": "Animation, Whimsy & Heartwarming"
            }
        }

        if persona_name in personas:
            self.user_profiles[user_id] = {
                "ratings": personas[persona_name]["ratings"].copy(),
                "likes": personas[persona_name]["likes"].copy(),
                "watchlist": personas[persona_name]["watchlist"].copy(),
                "history": list(personas[persona_name]["ratings"].keys())[:2],
                "persona": personas[persona_name]["persona"]
            }
        return self.get_user_profile(user_id)

    def rate_movie(self, movie_id: int, rating: float, user_id: str = "default_user") -> Dict[str, Any]:
        """Rates a movie (1.0 to 5.0) and dynamically adapts user taste vector."""
        if user_id not in self.user_profiles:
            self._init_default_user(user_id)
        
        self.user_profiles[user_id]["ratings"][movie_id] = float(rating)
        if rating >= 4.5:
            self.user_profiles[user_id]["likes"][movie_id] = "love"
        elif rating >= 3.5:
            self.user_profiles[user_id]["likes"][movie_id] = "like"
        else:
            self.user_profiles[user_id]["likes"][movie_id] = "dislike"

        if movie_id not in self.user_profiles[user_id]["history"]:
            self.user_profiles[user_id]["history"].append(movie_id)

        return self.get_user_profile(user_id)

    def toggle_watchlist(self, movie_id: int, user_id: str = "default_user") -> Dict[str, Any]:
        if user_id not in self.user_profiles:
            self._init_default_user(user_id)

        wl = self.user_profiles[user_id]["watchlist"]
        if movie_id in wl:
            wl.remove(movie_id)
            in_list = False
        else:
            wl.append(movie_id)
            in_list = True

        return {"movie_id": movie_id, "in_watchlist": in_list, "watchlist_count": len(wl)}

    def _get_user_vector(self, user_id: str) -> np.ndarray:
        """
        Dynamically computes user preference vector in the TF-IDF feature space
        as a weighted sum of movie vectors according to user ratings.
        """
        prof = self.user_profiles.get(user_id, {})
        ratings = prof.get("ratings", {})
        
        user_vector = np.zeros(self.tfidf_matrix.shape[1])
        total_weight = 0.0

        for mid, score in ratings.items():
            if mid in self.movie_map:
                idx = self.df.index[self.df["id"] == mid].tolist()[0]
                # Center rating around neutral 3.0: 5.0 gives +2.0, 1.0 gives -2.0
                weight = score - 2.8
                user_vector += weight * self.tfidf_matrix[idx]
                total_weight += abs(weight)

        # Also factor in Watchlist as positive intention (+1.5 weight)
        for mid in prof.get("watchlist", []):
            if mid in self.movie_map and mid not in ratings:
                idx = self.df.index[self.df["id"] == mid].tolist()[0]
                user_vector += 1.5 * self.tfidf_matrix[idx]
                total_weight += 1.5

        if total_weight > 0:
            norm = np.linalg.norm(user_vector)
            if norm > 0:
                user_vector = user_vector / norm

        return user_vector

    def _generate_explanation(self, movie: Dict[str, Any], user_id: str, similarity_score: float) -> str:
        """Generates clear, transparent Explainable AI recommendation reason."""
        prof = self.user_profiles.get(user_id, {})
        ratings = prof.get("ratings", {})

        # Check if same director as a highly rated film
        for mid, score in ratings.items():
            if score >= 4.0 and mid in self.movie_map:
                rated_movie = self.movie_map[mid]
                if rated_movie["director"] == movie["director"] and rated_movie["id"] != movie["id"]:
                    return f"Because you loved {rated_movie['title']} by {movie['director']}"

        # Check shared dominant mood or genre with top rated film
        for mid, score in sorted(ratings.items(), key=lambda x: x[1], reverse=True):
            if mid in self.movie_map:
                rated_movie = self.movie_map[mid]
                shared_moods = set(movie["mood_tags"]).intersection(set(rated_movie["mood_tags"]))
                if shared_moods:
                    return f"Because you liked {rated_movie['title']} ({list(shared_moods)[0]})"

        # General high match explanation
        genre_str = ", ".join(movie["genres"][:2])
        if similarity_score >= 0.8:
            return f"Matches your interest in acclaimed {genre_str} cinema"
        return f"Trending highly with viewers who enjoy {genre_str}"

    def calculate_match_percentage(self, raw_score: float) -> int:
        """
        Converts combined similarity and quality scores into match percentages:
        e.g., 98%, 95%, 91%, 88% Match.
        """
        clamped = max(0.0, min(1.0, raw_score))
        # Map 0.0 - 1.0 to 65% - 99%
        pct = int(round(65 + clamped * 34))
        return max(65, min(99, pct))

    def get_personalized_recommendations(
        self,
        user_id: str = "default_user",
        limit: int = 15,
        exclude_rated: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Ensemble Hybrid Recommender:
        Blends Content-Based User Similarity (50%), Collaborative Item Affinity (30%),
        and Bayesian Quality Calibration (20%).
        """
        if user_id not in self.user_profiles:
            self._init_default_user(user_id)

        user_vec = self._get_user_vector(user_id)
        user_ratings = self.user_profiles[user_id]["ratings"]
        user_watchlist = self.user_profiles[user_id]["watchlist"]

        # Content cosine similarity against user taste vector
        if np.linalg.norm(user_vec) > 0:
            content_sims = cosine_similarity([user_vec], self.tfidf_matrix)[0]
        else:
            content_sims = np.zeros(len(self.movies))

        # Collaborative scores: aggregate collaborative similarity from movies user liked
        collab_scores = np.zeros(len(self.movies))
        collab_count = 0
        for mid, score in user_ratings.items():
            if mid in self.movie_map and score >= 3.5:
                idx = self.df.index[self.df["id"] == mid].tolist()[0]
                weight = (score - 3.0) / 2.0
                collab_scores += weight * self.collab_sim_matrix[idx]
                collab_count += 1
        if collab_count > 0:
            collab_scores /= collab_count

        # Bayesian rating normalized to 0-1
        min_wr = min(self.bayesian_scores.values())
        max_wr = max(self.bayesian_scores.values())

        recommendations = []
        for idx, movie in enumerate(self.movies):
            mid = movie["id"]
            if exclude_rated and mid in user_ratings:
                continue

            c_sim = content_sims[idx]
            col_sim = collab_scores[idx]
            b_score = (self.bayesian_scores[mid] - min_wr) / (max_wr - min_wr + 1e-6)

            # Hybrid Weighted Formula
            hybrid_score = 0.50 * c_sim + 0.30 * col_sim + 0.20 * b_score
            match_pct = self.calculate_match_percentage(hybrid_score)
            explanation = self._generate_explanation(movie, user_id, hybrid_score)

            rec_item = dict(movie)
            rec_item["match_percentage"] = match_pct
            rec_item["explanation"] = explanation
            rec_item["in_watchlist"] = mid in user_watchlist
            rec_item["user_rating"] = user_ratings.get(mid, None)
            recommendations.append(rec_item)

        # Sort by match percentage descending
        recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)
        return recommendations[:limit]

    def get_similar_movies(self, movie_id: int, limit: int = 6) -> List[Dict[str, Any]]:
        """Item-to-Item Content Similarity ('More Like This' section in movie modal)."""
        if movie_id not in self.movie_map:
            return []

        idx = self.df.index[self.df["id"] == movie_id].tolist()[0]
        sim_scores = self.content_sim_matrix[idx]
        
        # Sort indices by similarity descending
        sorted_indices = np.argsort(sim_scores)[::-1]
        
        similar_items = []
        for i in sorted_indices:
            other_id = self.movies[i]["id"]
            if other_id == movie_id:
                continue
            
            raw_sim = sim_scores[i]
            item = dict(self.movies[i])
            item["match_percentage"] = self.calculate_match_percentage(raw_sim)
            item["explanation"] = f"Similar themes, direction & tone to {self.movie_map[movie_id]['title']}"
            similar_items.append(item)
            if len(similar_items) >= limit:
                break

        return similar_items

    def get_top_10_trending(self) -> List[Dict[str, Any]]:
        """Returns the Top 10 with ranking numbers 1 to 10."""
        # Top 10 by Bayesian score + recency/votes
        sorted_movies = sorted(self.movies, key=lambda m: (self.bayesian_scores[m["id"]], m["year"]), reverse=True)
        top10 = []
        for rank, movie in enumerate(sorted_movies[:10], start=1):
            item = dict(movie)
            item["rank"] = rank
            item["match_percentage"] = min(99, 99 - (rank * 1))
            top10.append(item)
        return top10

    def get_hero_spotlight(self, user_id: str = "default_user") -> Dict[str, Any]:
        """Selects the best spotlight for the billboard banner."""
        recommendations = self.get_personalized_recommendations(user_id=user_id, limit=5)
        # Choose the top recommendation with a rich backdrop
        for m in recommendations:
            if m.get("backdrop_path"):
                return m
        return self.movies[0]

    def get_category_rows(self, user_id: str = "default_user") -> Dict[str, Any]:
        """Builds all organized dynamic rows for the homepage."""
        prof = self.user_profiles.get(user_id, {})
        user_ratings = prof.get("ratings", {})
        watchlist_ids = prof.get("watchlist", [])

        # 1. Top Picks for You
        top_picks = self.get_personalized_recommendations(user_id=user_id, limit=12)

        # 2. Top 10 Today
        top_10 = self.get_top_10_trending()

        # 3. Contextual "Because You Watched..."
        reference_movie = None
        for mid, score in sorted(user_ratings.items(), key=lambda x: x[1], reverse=True):
            if mid in self.movie_map and score >= 4.0:
                reference_movie = self.movie_map[mid]
                break
        if not reference_movie:
            reference_movie = self.movies[0]  # Inception

        because_you_watched = self.get_similar_movies(reference_movie["id"], limit=10)

        # 4. Mind-Bending & Sci-Fi
        scifi_movies = [
            m for m in self.movies 
            if "Sci-Fi" in m["genres"] or "Mind-Bending" in m["mood_tags"]
        ]
        scifi_movies = sorted(scifi_movies, key=lambda m: self.bayesian_scores[m["id"]], reverse=True)[:10]

        # 5. High Octane Action
        action_movies = [
            m for m in self.movies 
            if "Action" in m["genres"]
        ]
        action_movies = sorted(action_movies, key=lambda m: self.bayesian_scores[m["id"]], reverse=True)[:10]

        # 6. Dark Crime & Gripping Thrillers
        thriller_movies = [
            m for m in self.movies 
            if "Crime" in m["genres"] or "Thriller" in m["genres"]
        ]
        thriller_movies = sorted(thriller_movies, key=lambda m: self.bayesian_scores[m["id"]], reverse=True)[:10]

        # 7. Animation, Fantasy & Family
        animation_movies = [
            m for m in self.movies 
            if "Animation" in m["genres"] or "Family" in m["genres"]
        ]
        animation_movies = sorted(animation_movies, key=lambda m: self.bayesian_scores[m["id"]], reverse=True)[:10]

        # 8. Critically Acclaimed Masterpieces (IMDb 8.5+)
        masterpieces = [
            m for m in self.movies 
            if m["imdb_rating"] >= 8.5
        ]
        masterpieces = sorted(masterpieces, key=lambda m: self.bayesian_scores[m["id"]], reverse=True)[:10]

        # 9. My List (Watchlist)
        watchlist_movies = [self.movie_map[mid] for mid in watchlist_ids if mid in self.movie_map]

        # Attach match percentage to each
        for row in [scifi_movies, action_movies, thriller_movies, animation_movies, masterpieces, watchlist_movies]:
            for m in row:
                m["match_percentage"] = self.calculate_match_percentage(
                    (self.bayesian_scores[m["id"]] - 7.0) / 2.5
                )

        return {
            "hero": self.get_hero_spotlight(user_id),
            "rows": [
                {
                    "id": "top_picks",
                    "title": "Top Picks for You",
                    "badge": "AI Personalized",
                    "movies": top_picks
                },
                {
                    "id": "top_10",
                    "title": "Top 10 Movies Today",
                    "badge": "#1 in Movies",
                    "is_top_10": True,
                    "movies": top_10
                },
                {
                    "id": "because_you_watched",
                    "title": f"Because You Watched {reference_movie['title']}",
                    "reference_movie": reference_movie,
                    "movies": because_you_watched
                },
                {
                    "id": "scifi_mindbending",
                    "title": "Mind-Bending & Sci-Fi Realities",
                    "movies": scifi_movies
                },
                {
                    "id": "action_adrenaline",
                    "title": "Adrenaline Rush & Action Spectacles",
                    "movies": action_movies
                },
                {
                    "id": "dark_crime",
                    "title": "Dark, Gritty & Gripping Crime",
                    "movies": thriller_movies
                },
                {
                    "id": "animation_whimsy",
                    "title": "Animation, Heartwarming & Family",
                    "movies": animation_movies
                },
                {
                    "id": "acclaimed",
                    "title": "Critically Acclaimed Masterpieces",
                    "movies": masterpieces
                },
                {
                    "id": "watchlist",
                    "title": "My List",
                    "movies": watchlist_movies
                }
            ]
        }

    def search_and_filter(
        self,
        query: str = "",
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        min_rating: float = 0.0,
        sort_by: str = "match",
        user_id: str = "default_user"
    ) -> List[Dict[str, Any]]:
        """Multi-attribute search and filtering engine."""
        results = []
        q = query.strip().lower()

        for idx, movie in enumerate(self.movies):
            # Text matching across title, cast, director, overview, mood_tags
            if q:
                match_title = q in movie["title"].lower()
                match_director = q in movie["director"].lower()
                match_cast = any(q in actor.lower() for actor in movie["cast"])
                match_mood = any(q in m.lower() for m in movie["mood_tags"])
                match_overview = q in movie["overview"].lower()
                if not (match_title or match_director or match_cast or match_mood or match_overview):
                    continue

            # Genre filter
            if genre and genre != "All":
                if genre not in movie["genres"]:
                    continue

            # Mood filter
            if mood and mood != "All":
                if mood not in movie["mood_tags"]:
                    continue

            # Rating filter
            if movie["imdb_rating"] < min_rating:
                continue

            item = dict(movie)
            # Calculate match percentage for user
            b_score = (self.bayesian_scores[movie["id"]] - 7.0) / 2.5
            item["match_percentage"] = self.calculate_match_percentage(b_score)
            results.append(item)

        # Sort results
        if sort_by == "rating":
            results.sort(key=lambda x: x["imdb_rating"], reverse=True)
        elif sort_by == "year":
            results.sort(key=lambda x: x["year"], reverse=True)
        else:  # match percentage
            results.sort(key=lambda x: x["match_percentage"], reverse=True)

        return results
