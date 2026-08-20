import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toast, ToastContainer } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import TheatreSelectionPage from './pages/TheatreSelectionPage';
import SeatLayoutPage from './pages/SeatLayoutPage';
import FoodSelectionPage from './pages/FoodSelectionPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TheatresPage from './pages/TheatresPage';
import MoviesPage from './pages/MoviesPage';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import TermsConditions from './pages/TermsConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import UserComplaints from './pages/UserComplaints';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BackendStatusProvider } from './context/BackendStatusContext';
import ServerStatusBanner from './components/ServerStatusBanner';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const [showToast, setShowToast] = React.useState(false);
  const [toastContent, setToastContent] = React.useState({ title: '', body: '', variant: 'info' });

  // Expose notify function globally
  window.notify = (title, body, variant = 'info') => {
    setToastContent({ title, body, variant });
    setShowToast(true);
  };

  return (
    <div className="d-flex min-vh-100 app-root-wrapper">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast bg={toastContent.variant} show={showToast} onClose={() => setShowToast(false)} delay={5000} autohide>
          <Toast.Header className="border-0">
            <strong className="me-auto text-dark">{toastContent.title}</strong>
          </Toast.Header>
          <Toast.Body className={['success', 'danger', 'info', 'warning'].includes(toastContent.variant) ? 'text-white' : 'text-dark'}>
            {toastContent.body}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      <Sidebar />
      <div 
        className="flex-grow-1 d-flex flex-column app-main-wrapper" 
        style={{ 
          marginLeft: 'var(--sidebar-width, 260px)',
          transition: 'margin-left 0.3s ease',
          backgroundColor: 'var(--bg-color)',
          color: 'var(--text-primary)',
          minHeight: '100vh',
        }}
      >
        <ServerStatusBanner />
        {!isAdminPage && <TopBar />}
        <main 
          className="main-content" 
          style={{ 
            marginTop: isAdminPage ? '0' : '60px',
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-primary)',
            flex: 1,
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetailsPage />} />
            <Route path="/buytickets/:movieId" element={<TheatreSelectionPage />} />
            <Route path="/seatlayout/:showId" element={<SeatLayoutPage />} />
            <Route path="/food-selection/:showId" element={<FoodSelectionPage />} />
            <Route path="/payment/:showId" element={<PaymentPage />} />
            <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/theatres" element={<TheatresPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/complaints" element={<UserComplaints />} />
          </Routes>
        </main>
        {!isAdminPage && <Footer />}
      </div>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId="186000649352-ej297a31pq7bc44d3oj0nljc5ajajfk7.apps.googleusercontent.com">
      <ThemeProvider>
        <AuthProvider>
          <BackendStatusProvider>
            <Router>
              <ScrollToTop />
              <AppContent />
            </Router>
          </BackendStatusProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

