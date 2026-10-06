import { useFetch } from '../hooks/useFetch'
import { ENDPOINTS, getBackdropUrl } from '../api/tmdb'
import { Skeleton } from './Skeleton'

export const Hero = ({ onSelectMovie }) => {
  const { data, loading, error } = useFetch(ENDPOINTS.trending)

  if (loading) return <Skeleton type="hero" />
  if (error || !data?.results?.length) return null

  const movies = data.results
  const movie = movies[Math.floor(Math.random() * Math.min(movies.length, 10))]

  return (
    <div
      className="hero-banner"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(20,20,20,0) 50%, rgba(20,20,20,0.9) 90%, #141414 100%), url(${getBackdropUrl(movie.backdrop_path)})`
      }}
    >
      <div className="hero-content">
        <h1 className="hero-title">{movie.title || movie.name}</h1>
        <p className="hero-overview">{movie.overview}</p>
        <div className="hero-buttons">
          <button className="btn btn-play" onClick={() => onSelectMovie(movie)}>
            ▶ Play
          </button>
          <button className="btn btn-info" onClick={() => onSelectMovie(movie)}>
            ⓘ More Info
          </button>
        </div>
      </div>
      <div className="hero-fade-bottom" />
    </div>
  )
}
