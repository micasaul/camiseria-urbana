import { Link, useNavigate } from 'react-router-dom'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'
import BlueButton from '../../buttons/blue-btn/BlueButton.jsx'

export default function AccountButton({ isOpen, onClick, userRole = 'guest', onLogout, onClose }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    }
    if (onClose) {
      onClose()
    }
    navigate('/')
  }

  const handleAdminClick = () => {
    if (onClose) {
      onClose()
    }
    navigate('/admin')
  }

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
          {userRole === 'guest' ? (
            <div className="account-submenu">
              <Link to="/login" className="side-panel-link sub-link" onClick={onClose}>
                Login
              </Link>
            </div>
          ) : (
            <div className="account-submenu">
              <button
                type="button"
                className="side-panel-link sub-link"
                onClick={() => {
                  if (onClose) {
                    onClose()
                  }
                  navigate('/mi-cuenta')
                }}
              >
                Mi cuenta
              </button>
              <button type="button" className="side-panel-link sub-link" onClick={handleLogout}>
                Cerrar sesión
              </button>
              {userRole === 'admin' && (
                <BlueButton
                  className="account-admin-button"
                  width="220px"
                  height="36px"
                  fontSize="15px"
                  onClick={handleAdminClick}
                >
                  Admin Panel
                </BlueButton>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
