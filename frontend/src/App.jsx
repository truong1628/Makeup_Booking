import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import ArtistLayout from './components/ArtistLayout';

// Customer Pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ArtistsPage from './pages/ArtistsPage';
import CollectionsPage from './pages/CollectionsPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import VNPayReturnPage from './pages/VNPayReturnPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminSchedulesPage from './pages/admin/AdminSchedulesPage';
import AdminArtistsPage from './pages/admin/AdminArtistsPage';
import AdminVouchersPage from './pages/admin/AdminVouchersPage';

// Artist Pages
import ArtistDashboardPage from './pages/artist/ArtistDashboardPage';
import ArtistSchedulePage from './pages/artist/ArtistSchedulePage';
import ArtistProfilePage from './pages/artist/ArtistProfilePage';
import ArtistCollectionsPage from './pages/artist/ArtistCollectionsPage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Routes with MainLayout (Header & Footer) */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="services/:id" element={<ServiceDetailPage />} />
              <Route path="artists" element={<ArtistsPage />} />
              <Route path="collections" element={<CollectionsPage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="payment/vnpay-return" element={<VNPayReturnPage />} />

              {/* Tuyến đường yêu cầu đăng nhập: Hồ sơ cá nhân & Lịch sử đặt lịch */}
              <Route element={<ProtectedRoute />}>
                <Route path="profile" element={<ProfilePage />} />
                <Route path="my-bookings" element={<MyBookingsPage />} />
                <Route path="account/bookings" element={<Navigate to="/my-bookings" replace />} />
              </Route>
            </Route>

            {/* Admin Routes with AdminLayout (Bắt buộc quyền ROLE_ADMIN đọc từ JWT) */}
            <Route element={<ProtectedRoute requiredRole="ROLE_ADMIN" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="artists" element={<AdminArtistsPage />} />
                <Route path="schedules" element={<AdminSchedulesPage />} />
                <Route path="vouchers" element={<AdminVouchersPage />} />
              </Route>
            </Route>

            {/* Dedicated Makeup Artist Portal (Bắt buộc quyền ROLE_ARTIST đọc từ JWT) */}
            <Route element={<ProtectedRoute requiredRole="ROLE_ARTIST" />}>
              <Route path="/artist" element={<ArtistLayout />}>
                <Route index element={<ArtistDashboardPage />} />
                <Route path="collections" element={<ArtistCollectionsPage />} />
                <Route path="schedule" element={<ArtistSchedulePage />} />
                <Route path="profile" element={<ArtistProfilePage />} />
              </Route>
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
