import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes.jsx";
import './App.css';

function App() {
  useEffect(() => {
    console.log("BACKEND_URL runtime:", import.meta.env.BACKEND_URL);
  }, []);

  return (
    <AppRoutes />
  );
}

export default App;
