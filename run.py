"""
Entry point launcher for CineMatch AI Movie Recommendation System.
Usage:
    python run.py
"""

import sys
import os
import webbrowser
import uvicorn

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 60)
    print("🎬 Starting CineMatch — AI Movie Recommendation System")
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
