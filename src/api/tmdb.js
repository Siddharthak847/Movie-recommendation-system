const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
const API_KEY = import.meta.env.VITE_TMDB_KEY || ''

export const ENDPOINTS = {
  trending: '/trending/movie/week',
  topRated: '/movie/top_rated',
  popular: '/movie/popular',
  action: '/discover/movie?with_genres=28',
  comedy: '/discover/movie?with_genres=35',
  horror: '/discover/movie?with_genres=27',
  scifi: '/discover/movie?with_genres=878',
  romance: '/discover/movie?with_genres=10749',
  search: (q) => `/search/movie?query=${encodeURIComponent(q)}`,
  details: (id) => `/movie/${id}?append_to_response=credits,videos`
}

export const getImageUrl = (path, size = 'w500') =>
  path ? `${IMAGE_BASE_URL}/${size}${path}` : 'https://via.placeholder.com/500x750/141414/ffffff?text=No+Poster'

export const getBackdropUrl = (path) =>
  path ? `${IMAGE_BASE_URL}/original${path}` : ''

export const fetchFromTMDB = async (endpoint) => {
  if (!endpoint) return null
  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  return await res.json()
}
