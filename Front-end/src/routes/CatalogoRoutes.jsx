import { Route } from 'react-router-dom'
import Catalogo from '../pages/catalogo/Catalogo'
import Producto from '../pages/catalogo/Producto'
import Buscar from '../pages/catalogo/Buscar'
import Combo from '../pages/catalogo/Combo'
import DetalleCombo from '../pages/catalogo/DetalleCombo'

export default function CatalogoRoutes() {
  return (
    <>
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/producto/:documentId" element={<Producto />} />
      <Route path="/buscar" element={<Buscar />} />
      <Route path="/combo" element={<Combo />} />
      <Route path="/combo/:documentId" element={<DetalleCombo />} />
    </>
  )
}
