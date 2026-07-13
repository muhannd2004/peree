import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './components/RouteGuards';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import PublicDocumentPage from './pages/PublicDocumentPage';

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/editor/:documentId" element={<EditorPage />} />
      </Route>

      <Route path="/:userName/:slug" element={<PublicDocumentPage />} />
    </Routes>
  );
}

export default App;
