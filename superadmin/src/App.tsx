import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import AmsOverviewPage from './pages/AmsOverviewPage';
import DashboardPage from './pages/DashboardPage';
import KycQueuePage from './pages/KycQueuePage';
import LoginPage from './pages/LoginPage';
import PersonaFeaturePage from './pages/PersonaFeaturePage';
import ProfilePage from './pages/ProfilePage';
import UserDetailPage from './pages/UserDetailPage';
import UsersDirectoryPage from './pages/UsersDirectoryPage';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersDirectoryPage />} />
        <Route path="/users/:userId" element={<UserDetailPage />} />
        <Route path="/kyc" element={<KycQueuePage />} />
        <Route path="/personas/agri-market-seller" element={<AmsOverviewPage />} />
        <Route path="/personas/agri-market-seller/:feature" element={<PersonaFeaturePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
