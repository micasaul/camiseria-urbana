import './wishlist-card.css'

export default function WishlistCard({ imageSrc, name, price, onRemove }) {
  return (
    <div className="wishlist-card">
      <img className="wishlist-card-image" src={imageSrc} alt={name} />
      <div className="wishlist-card-details">
        <span className="wishlist-card-name">{name}</span>
        <span className="wishlist-card-price">{price}</span>
      </div>
      <button
        type="button"
        className="wishlist-card-remove"
        onClick={onRemove}
        aria-label="Eliminar de wishlist"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v6M15 11v6M6 7l1 12a1 1 0 0 0 1 .93h8a1 1 0 0 0 1-.93l1-12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
