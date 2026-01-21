import CartCard from '../../cards/cart-card/CartCard.jsx'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'

export default function CartButton({ isOpen, onClick, onClose, items }) {
  return (
    <>
      <WhiteButton className="header-icon-btn ghost-btn" onClick={onClick} aria-expanded={isOpen}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"
          />
        </svg>
      </WhiteButton>

      {isOpen && (
        <aside className="side-panel right">
          <div className="side-panel-header">
            <span>Carrito</span>
            <button className="close-btn" onClick={onClose} aria-label="Cerrar carrito">×</button>
          </div>
          <div className="side-panel-body">
            <div className="side-panel-cards">
              {items.map((item) => (
                <CartCard
                  key={item.id}
                  imageSrc={item.imageSrc}
                  name={item.name}
                  price={item.price}
                  size={item.size}
                  color={item.color}
                  quantity={item.quantity}
                  stock={item.stock}
                  onQuantityChange={() => {}}
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
