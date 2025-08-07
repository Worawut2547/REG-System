import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import LoginPage from './pages/authentication/Login/LoginPage'
import AdminDashboardpage from './pages/admin/dashboard/dashboard';
import StudentDashboardpage from './pages/student/dashboard/dashboard';
import TeacherDashboardpage from './pages/teacher/dashboard/dashboard';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardpage />} />
        <Route path="/student/dashboard" element={<StudentDashboardpage />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboardpage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>

)
