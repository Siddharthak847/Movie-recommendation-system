import { useState, useEffect } from 'react'
import { fetchFromTMDB } from '../api/tmdb'

export const useFetch = (endpoint) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!endpoint) {
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    fetchFromTMDB(endpoint)
      .then((res) => {
        if (isMounted) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error fetching data')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [endpoint])

  return { data, loading, error }
}
