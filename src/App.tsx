import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Business from "./pages/Business";
import Admin from "./pages/Admin";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import SavedGenerations from "./pages/SavedGenerations";
import AdminUsers from "@/pages/admin/AdminUsers";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Library />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Layout>
                  <Library />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/library/:hubArea"
            element={
              <ProtectedRoute>
                <Layout>
                  <Library />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-generations"
            element={
              <ProtectedRoute>
                <Layout>
                  <SavedGenerations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <Chat />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/business"
            element={
              <ProtectedRoute>
                <Layout>
                  <Business />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminUsers />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
