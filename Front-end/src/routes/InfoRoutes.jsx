import { Route } from 'react-router-dom'
import SobreNosotros from '../pages/info/SobreNosotros'
import Faq from '../pages/info/Faq'
import Error from '../pages/info/Error'

export default function InfoRoutes() {
  return (
    <>
      <Route path="/sobre-nosotros" element={<SobreNosotros />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/error" element={<Error />} />
    </>
  )
}
