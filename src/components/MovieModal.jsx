import { useEffect } from 'react'
import { useFetch } from '../hooks/useFetch'
import { ENDPOINTS, getBackdropUrl } from '../api/tmdb'

export const MovieModal = ({ movie, onClose, isInList, onToggleList }) => {
  const { data: details } = useFetch(movie ? ENDPOINTS.details(movie.id) : null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!movie) return null

  const info = details || movie
  const cast = details?.credits?.cast?.slice(0, 5) || []
  const videos = details?.videos?.results || []
  const trailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') || videos[0]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-hero" style={{ backgroundImage: `url(${getBackdropUrl(info.backdrop_path)})` }}>
          <div className="modal-hero-overlay">
            <h2>{info.title || info.name}</h2>
            <div className="modal-hero-actions">
              <button className={`btn btn-info ${isInList ? 'added' : ''}`} onClick={() => onToggleList(movie)}>
                {isInList ? '✓ In My List' : '+ Add to My List'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <span className="match">{(info.vote_average * 10).toFixed(0)}% Rating</span>
            <span className="year">{(info.release_date || '').slice(0, 4)}</span>
            {info.runtime ? <span className="runtime">{info.runtime}m</span> : null}
            {info.genres?.length ? (
              <span className="genres">{info.genres.map((g) => g.name).join(', ')}</span>
            ) : null}
          </div>

          <p className="modal-overview">{info.overview}</p>

          {cast.length > 0 && (
            <div className="modal-cast">
              <strong>Cast:</strong> {cast.map((c) => c.name).join(', ')}
            </div>
          )}

          {trailer && (
            <div className="modal-trailer">
              <h3>Official Trailer</h3>
              <div className="video-responsive">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=0`}
                  title="YouTube trailer"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
