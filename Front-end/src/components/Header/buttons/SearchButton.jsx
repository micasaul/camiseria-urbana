import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'

export default function SearchButton({ isOpen, value, onChange, onClick }) {
  return (
    <div className="search-wrapper">
      {isOpen && (
        <input
          className="search-input"
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Buscar..."
          aria-label="Buscar productos"
        />
      )}
      <WhiteButton className="header-icon-btn ghost-btn" onClick={onClick} aria-expanded={isOpen}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          />
        </svg>
      </WhiteButton>
    </div>
  )
}
