import { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Row } from './components/Row'
import { MovieCard } from './components/MovieCard'
import { MovieModal } from './components/MovieModal'
import { SearchResults } from './components/SearchResults'
import { ENDPOINTS } from './api/tmdb'

export function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [myList, setMyList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('netflix_my_list')) || [] }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('netflix_my_list', JSON.stringify(myList))
  }, [myList])

  const handleToggleList = (movie) => {
    setMyList((prev) =>
      prev.some((item) => item.id === movie.id)
        ? prev.filter((item) => item.id !== movie.id)
        : [...prev, movie]
    )
  }

  const rows = [
    { title: 'Trending Now', url: ENDPOINTS.trending },
    { title: 'Top Rated', url: ENDPOINTS.topRated },
    { title: 'Popular', url: ENDPOINTS.popular },
    { title: 'Action Movies', url: ENDPOINTS.action },
    { title: 'Comedy Movies', url: ENDPOINTS.comedy },
    { title: 'Horror Movies', url: ENDPOINTS.horror },
    { title: 'Sci-Fi Movies', url: ENDPOINTS.scifi },
    { title: 'Romance Movies', url: ENDPOINTS.romance }
  ]

  return (
    <div className="app">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onSearch={setSearchQuery} />
      {searchQuery ? (
        <SearchResults query={searchQuery} onSelectMovie={setSelectedMovie} myList={myList} onToggleList={handleToggleList} />
      ) : activeTab === 'mylist' ? (
        <div className="my-list-page">
          <h2>My List</h2>
          {!myList.length ? (
            <div className="state-msg"><p>Your list is empty. Add movies to watch them later!</p></div>
          ) : (
            <div className="search-grid">
              {myList.map((m) => (
                <MovieCard key={m.id} movie={m} onSelect={setSelectedMovie} isInList={true} onToggleList={handleToggleList} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <Hero onSelectMovie={setSelectedMovie} />
          <div className="rows-container">
            {rows.map((r) => (
              <Row key={r.title} title={r.title} fetchUrl={r.url} onSelectMovie={setSelectedMovie} myList={myList} onToggleList={handleToggleList} />
            ))}
          </div>
        </>
      )}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} isInList={myList.some((i) => i.id === selectedMovie.id)} onToggleList={handleToggleList} />
      )}
    </div>
  )
}

export default App
