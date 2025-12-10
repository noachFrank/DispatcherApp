import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GoogleMapsProvider } from './components/GoogleMapsProvider';
import LoginPage from './components/LoginPage';
import MainDashboard from './components/MainDashboard';
import ProtectedRoute from './components/ProtectedRoute';
// import './App.css';

function App() {
    return (
        <AuthProvider>
            <GoogleMapsProvider>
                <Router>
                    <div className="app">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route
                                path="/dashboard/*"
                                element={
                                    <ProtectedRoute>
                                        <MainDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </div>
                </Router>
            </GoogleMapsProvider>
        </AuthProvider>
    );
}

export default App;