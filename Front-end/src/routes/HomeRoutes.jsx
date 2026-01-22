import { Route } from 'react-router-dom'
import Home from '../pages/home/Home'

export default function HomeRoutes() {
  return <Route path="/" element={<Home />} />
}
