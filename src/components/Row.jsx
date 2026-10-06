import { useRef } from 'react'
import { useFetch } from '../hooks/useFetch'
import { MovieCard } from './MovieCard'
import { Skeleton } from './Skeleton'

export const Row = ({ title, fetchUrl, onSelectMovie, myList, onToggleList }) => {
  const { data, loading, error } = useFetch(fetchUrl)
  const rowRef = useRef(null)

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const movies = data?.results || []

  if (error) return null

  return (
    <div className="row-container">
      <h2 className="row-title">{title}</h2>
      {loading ? (
        <Skeleton type="row" count={6} />
      ) : (
        <div className="row-wrapper">
          <button className="handle handle-left" onClick={() => handleScroll('left')}>
            ‹
          </button>
          <div className="row-cards" ref={rowRef}>
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
          <button className="handle handle-right" onClick={() => handleScroll('right')}>
            ›
          </button>
        </div>
      )}
    </div>
  )
}
