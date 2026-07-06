import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./context/AuthContext";
import { ActiveCatProvider } from "./context/ActiveCatContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Behavior from "./pages/Behavior";
import Feeding from "./pages/Feeding";
import Records from "./pages/Records";
import VetsShelters from "./pages/VetsShelters";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ActiveCatProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="scan" element={<Scan />} />
                <Route path="behavior" element={<Behavior />} />
                <Route path="feeding" element={<Feeding />} />
                <Route path="records" element={<Records />} />
                <Route path="vets" element={<VetsShelters />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ActiveCatProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
