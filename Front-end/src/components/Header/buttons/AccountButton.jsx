import { Link } from 'react-router-dom'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'

export default function AccountButton({ isOpen, onClick, menuItems }) {
  return (
    <div className="account-wrapper">
      <WhiteButton className="header-icon-btn ghost-btn" onClick={onClick} aria-expanded={isOpen}>
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
            clipRule="evenodd"
          />
        </svg>
      </WhiteButton>
      {isOpen && (
        <div className="account-dropdown">
          {menuItems.map((item) => (
            <Link key={item.label} to={item.to} className="dropdown-link">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
