import { Navigate, Route, Routes } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import BoardPage from "./pages/BoardPage";
import CreateOrgPage from "./pages/CreateOrgPage";
import DashboardPage from "./pages/DashboardPage";
import OrgAdminPage from "./pages/OrgAdminPage";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="eyebrow">Planora</p>
          <h1>Loading...</h1>
          <p>Checking your session.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        path="/org/new"
        element={
          <ProtectedRoute>
            <CreateOrgPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/org/:id/admin"
        element={
          <ProtectedRoute>
            <OrgAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/board/:id"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
