import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'

export default function AdminButton({ items }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedGroup, setSelectedGroup] = useState('')

  const activePath = location.pathname
  const activeGroup = useMemo(() => {
    if (selectedGroup) {
      return selectedGroup
    }
    if (activePath.startsWith('/admin/productos')) {
      return 'productos'
    }
    if (activePath.startsWith('/admin/combos')) {
      return 'combos'
    }
    if (activePath.startsWith('/admin/promos')) {
      return 'promos'
    }
    if (activePath.startsWith('/admin/descuentos')) {
      return 'descuentos'
    }
    if (activePath.startsWith('/admin/ventas')) {
      return 'ventas'
    }
    if (activePath === '/admin') {
      return 'dashboard'
    }
    return selectedGroup || ''
  }, [activePath, selectedGroup])

  useEffect(() => {
    if (activePath.startsWith('/admin/productos')) {
      setSelectedGroup('productos')
      return
    }
    if (activePath.startsWith('/admin/combos')) {
      setSelectedGroup('combos')
      return
    }
    if (activePath.startsWith('/admin/promos')) {
      setSelectedGroup('promos')
      return
    }
    if (activePath.startsWith('/admin/descuentos')) {
      setSelectedGroup('descuentos')
      return
    }
    if (activePath.startsWith('/admin/ventas')) {
      setSelectedGroup('ventas')
      return
    }
    if (activePath === '/admin') {
      setSelectedGroup('dashboard')
    }
  }, [activePath])

  return (
    <>
      <aside className="side-panel admin-side-panel">
        <div className="side-panel-header" />
        <div className="admin-menu-list">
          {items.map((item) => {
            const isGroup = Array.isArray(item.children)
            const isActive = activeGroup === item.id

            if (isGroup) {
              return (
                <div key={item.id} className="admin-menu-group">
                  <WhiteButton
                    type="button"
                    width="100%"
                    height="40px"
                    className={`admin-menu-item admin-menu-item-group${isActive ? ' active' : ''}`}
                    aria-disabled="true"
                  >
                    {item.label}
                  </WhiteButton>
                  <div className="side-panel-submenu admin-submenu">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        className={`side-panel-link sub-link admin-sub-link${activePath === child.to ? ' active' : ''}`}
                        onClick={() => {
                          setSelectedGroup(item.id)
                          navigate(child.to)
                        }}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <WhiteButton
                key={item.id}
                type="button"
                width="100%"
                height="40px"
                className={`admin-menu-item${isActive ? ' active' : ''}`}
                onClick={() => {
                  setSelectedGroup(item.id)
                  navigate(item.to)
                }}
              >
                {item.label}
              </WhiteButton>
            )
          })}
        </div>
      </aside>
    </>
  )
}
