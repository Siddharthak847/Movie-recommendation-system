import { useState } from 'react'
import { getImageUrl } from '../api/tmdb'

export const MovieCard = ({ movie, onSelect, isInList, onToggleList }) => {
  const [imgError, setImgError] = useState(false)
  const posterUrl = imgError
    ? 'https://via.placeholder.com/500x750/141414/ffffff?text=No+Poster'
    : getImageUrl(movie.poster_path)

  const handleListClick = (e) => {
    e.stopPropagation()
    onToggleList(movie)
  }

  return (
    <div className="movie-card" onClick={() => onSelect(movie)}>
      <img
        src={posterUrl}
        alt={movie.title || movie.name}
        loading="lazy"
        onError={() => setImgError(true)}
      />
      <div className="card-overlay">
        <div className="card-info">
          <h4>{movie.title || movie.name}</h4>
          <div className="card-meta">
            <span className="rating">⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
            <span className="year">{(movie.release_date || movie.first_air_date || '').slice(0, 4)}</span>
          </div>
        </div>
        <button
          className={`my-list-btn ${isInList ? 'added' : ''}`}
          onClick={handleListClick}
          title={isInList ? 'Remove from My List' : 'Add to My List'}
        >
          {isInList ? '✓' : '+'}
        </button>
      </div>
    </div>
  )
}
