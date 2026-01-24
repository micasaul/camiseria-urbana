import { Route } from 'react-router-dom'
import Catalogo from '../pages/catalogo/Catalogo'
import Producto from '../pages/catalogo/Producto'
import Buscar from '../pages/catalogo/Buscar'

export default function CatalogoRoutes() {
  return (
    <>
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/producto/:documentId" element={<Producto />} />
      <Route path="/buscar" element={<Buscar />} />
    </>
  )
}
