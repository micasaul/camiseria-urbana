import WishlistCard from '../../cards/wishlist-card/WishlistCard.jsx'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'

export default function WishlistButton({ isOpen, onClick, onClose, items }) {
  return (
    <>
      <WhiteButton className="header-icon-btn ghost-btn" onClick={onClick} aria-expanded={isOpen}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"
          />
        </svg>
      </WhiteButton>

      {isOpen && (
        <aside className="side-panel right">
          <div className="side-panel-header">
            <span>Wishlist</span>
            <button className="close-btn" onClick={onClose} aria-label="Cerrar wishlist">×</button>
          </div>
          <div className="side-panel-body">
            <div className="side-panel-cards">
              {items.map((item) => (
                <WishlistCard
                  key={item.id}
                  imageSrc={item.imageSrc}
                  name={item.name}
                  price={item.price}
                  onRemove={() => {}}
                />
              ))}
            </div>
          </div>
        </aside>
      )}
    </>
  )
}
