import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, booting, redirectPathForRole } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Default to student if role is somehow undefined
  const userRole = user?.role || 'student';

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect unauthorized users to their specific landing page
    return <Navigate to={redirectPathForRole(userRole)} replace />;
  }

  return children;
}
