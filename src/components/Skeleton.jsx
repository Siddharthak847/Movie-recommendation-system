export const Skeleton = ({ type = 'row', count = 6 }) => {
  if (type === 'hero') {
    return (
      <div className="hero-skeleton">
        <div className="skeleton-backdrop shimmer"></div>
        <div className="skeleton-content">
          <div className="skeleton-title shimmer"></div>
          <div className="skeleton-text shimmer"></div>
          <div className="skeleton-text shimmer short"></div>
          <div className="skeleton-buttons">
            <div className="skeleton-btn shimmer"></div>
            <div className="skeleton-btn shimmer"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="row-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card shimmer"></div>
      ))}
    </div>
  )
}
