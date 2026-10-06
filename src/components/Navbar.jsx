import { useState, useEffect } from 'react'

export const Navbar = ({ activeTab, setActiveTab, onSearch }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(term)
    }, 400)
    return () => clearTimeout(timer)
  }, [term, onSearch])

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-left">
        <h1 className="logo" onClick={() => { setActiveTab('home'); setTerm(''); }}>NETFLIX</h1>
        <ul className="nav-links">
          <li className={activeTab === 'home' && !term ? 'active' : ''} onClick={() => { setActiveTab('home'); setTerm(''); }}>Home</li>
          <li className={activeTab === 'movies' && !term ? 'active' : ''} onClick={() => { setActiveTab('movies'); setTerm(''); }}>Movies</li>
          <li className={activeTab === 'mylist' && !term ? 'active' : ''} onClick={() => { setActiveTab('mylist'); setTerm(''); }}>My List</li>
        </ul>
      </div>
      <div className="nav-right">
        <div className={`search-box ${searchOpen ? 'open' : ''}`}>
          <button className="search-btn" onClick={() => setSearchOpen(!searchOpen)}>
            🔍
          </button>
          <input
            type="text"
            placeholder="Titles, people, genres"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      </div>
    </nav>
  )
}
