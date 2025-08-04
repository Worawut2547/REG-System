import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import LoginPage from './pages/authentication/Login/LoginPage'
import Dashboardpage from './pages/dashboard/dashboard';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboardpage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>

)
