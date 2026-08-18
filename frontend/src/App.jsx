import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MapPage from './pages/MapPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import CoachDashboard from './pages/dashboard/CoachDashboard.jsx';
import Subscriptions from './pages/dashboard/Subscriptions.jsx';
import Settings from './pages/dashboard/Settings.jsx';

const App = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/dashboard" element={<ProtectedRoute roles={['Admin', 'Coach_ClubOwner']}><CoachDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/subscriptions" element={<ProtectedRoute roles={['Admin', 'Coach_ClubOwner']}><Subscriptions /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute roles={['Admin', 'Coach_ClubOwner']}><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

export default App;