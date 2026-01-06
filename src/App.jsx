import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { GoogleMapsProvider } from './components/GoogleMapsProvider';
import LoginPage from './components/LoginPage';
import MainDashboard from './components/MainDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLandingPage from './components/PublicLandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Footer from './components/Footer';
// import './App.css';

// Wrapper component to conditionally show footer
const AppContent = () => {
    const location = useLocation();
    const isPublicPage = location.pathname === '/' || location.pathname === '/privacy' || location.pathname === '/terms';

    return (
        <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: 1 }}>
                <Routes>
                    {/* Public landing page */}
                    <Route path="/" element={<PublicLandingPage />} />

                    {/* Legal pages */}
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />

                    {/* Dispatcher login and dashboard */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/dispatch/*"
                        element={
                            <ProtectedRoute>
                                <MainDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Redirect old dashboard routes to new dispatch routes */}
                    <Route path="/dashboard/*" element={<Navigate to="/dispatch" replace />} />

                    {/* Any unknown route goes to public site */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            {!isPublicPage && <Footer />}
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <AlertProvider>
                <GoogleMapsProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </GoogleMapsProvider>
            </AlertProvider>
        </AuthProvider>
    );
}

export default App;