import { Route } from 'react-router-dom'
import Home from '../pages/Home'

function ShopRoutes() {
  return (
    <>
      <Route path="/" element={<Home />} />
    </>
  )
}

export default ShopRoutes
