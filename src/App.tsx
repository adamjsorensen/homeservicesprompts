
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Business from "./pages/Business";
import Admin from "./pages/Admin";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { SavedGenerations } from "./pages/SavedGenerations";
import AdminUsers from "@/pages/admin/AdminUsers";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes using Layout with Outlet */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/library" />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:hubArea" element={<Library />} />
            <Route path="/saved-generations" element={<SavedGenerations />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/business" element={<Business />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
