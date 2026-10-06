import { useFetch } from '../hooks/useFetch'
import { ENDPOINTS } from '../api/tmdb'
import { MovieCard } from './MovieCard'
import { Skeleton } from './Skeleton'

export const SearchResults = ({ query, onSelectMovie, myList, onToggleList }) => {
  const { data, loading, error } = useFetch(query ? ENDPOINTS.search(query) : null)
  const movies = data?.results || []

  if (loading) return <div className="search-page"><Skeleton type="row" count={12} /></div>

  if (error) {
    return (
      <div className="search-page state-msg">
        <h2>Something went wrong loading results.</h2>
        <p>{error}</p>
      </div>
    )
  }

  if (!movies.length) {
    return (
      <div className="search-page state-msg">
        <h2>No movies found for "{query}".</h2>
        <p>Try searching for a different title, actor, or genre.</p>
      </div>
    )
  }

  return (
    <div className="search-page">
      <h2>Search Results for "{query}"</h2>
      <div className="search-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={onSelectMovie}
            isInList={myList.some((item) => item.id === movie.id)}
            onToggleList={onToggleList}
          />
        ))}
      </div>
    </div>
  )
}
