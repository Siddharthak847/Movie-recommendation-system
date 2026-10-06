"""
Entry point launcher for CineFlix AI Movie Recommendation System.
Usage:
    python run.py
"""

import sys
import os
import webbrowser
import uvicorn

def main():
    print("=" * 60)
    print("🎬 Starting CineFlix — AI Movie Recommendation System")
    print("=" * 60)
    print("📍 URL: http://127.0.0.1:8000")
    print("⚡ Engine: Hybrid (TF-IDF + Cosine Similarity + Collaborative + Bayesian)")
    print("=" * 60)

    # Open browser automatically after a short delay
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
