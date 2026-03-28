import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Heart, Pill, Calendar, LayoutDashboard, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, booting, logout, redirectPathForRole } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getNavLinks = () => {
    if (user?.role === 'admin') {
      return [
        { name: "Admin Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Users", path: "/admin/users", icon: <Heart className="w-4 h-4" /> },
        { name: "Settings", path: "/admin/settings", icon: <LayoutDashboard className="w-4 h-4" /> },
      ];
    }
    if (user?.role === 'doctor') {
      return [
        { name: "Dashboard", path: "/doctor", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Appointments", path: "/doctor/appointments", icon: <Calendar className="w-4 h-4" /> },
        { name: "Patients", path: "/doctor/patients", icon: <Heart className="w-4 h-4" /> },
      ];
    }
    if (user?.role === 'pharmacist') {
      return [
        { name: "Dashboard", path: "/pharmacist/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Inventory", path: "/pharmacist/inventory", icon: <Pill className="w-4 h-4" /> },
        { name: "Orders", path: "/pharmacist/orders", icon: <Heart className="w-4 h-4" /> },
      ];
    }

    // Default for students and guests (Home Navbar)
    return [
      { name: "Home", path: "/", icon: null },
      { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: "Appointments", path: "/student/appointments", icon: <Calendar className="w-4 h-4" /> },
      { name: "Mental Health", path: "/mental-health", icon: <Heart className="w-4 h-4" /> },
      { name: "Pharmacy", path: "/pharmacy", icon: <Pill className="w-4 h-4" /> },
    ];
  };

  const navLinks = getNavLinks();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const mainPaths = navLinks.map(l => l.path);
  const isMainPage = mainPaths.includes(location.pathname) || isAuthPage;

  if (!isMainPage) {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "nav-blur py-3" : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-accent-primary hover:text-white text-primary-text transition-colors shadow-sm backdrop-blur-md border border-border-gray/20"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <Link to="/" className="hidden sm:flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-accent-primary rounded-[10px] flex items-center justify-center text-white font-bold shadow-lg shadow-accent-primary/10 group-hover:scale-105 transition-transform">C</div>
              <span className="font-semibold text-xl tracking-tight text-primary-text">CampusHealth</span>
            </Link>
          </div> */}
          
          <div className="flex items-center gap-4">
            {booting ? (
              <span className="text-secondary-text text-sm">Loading…</span>
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(redirectPathForRole(user.role))}
                  className="text-[13px] font-medium text-secondary-text hover:text-primary-text transition-colors max-w-[140px] truncate"
                  title={user.email}
                >
                  {user.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full border border-border-gray/40 text-[13px] font-semibold text-primary-text hover:bg-secondary-bg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] font-semibold text-secondary-text hover:text-primary-text transition-colors"
                >
                  Sign in
                </Link>
                <Link to="/register" className="apple-button-primary py-2 px-6 text-[13px] font-semibold inline-block text-center hidden sm:inline-block">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "nav-blur py-3" : "bg-transparent py-5"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-accent-primary rounded-[10px] flex items-center justify-center text-white font-bold shadow-lg shadow-accent-primary/10 group-hover:scale-105 transition-transform">C</div>
          <span className="font-semibold text-xl tracking-tight text-primary-text">CampusHealth</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ${
                location.pathname === link.path 
                  ? "text-primary-text" 
                  : "text-secondary-text hover:text-primary-text"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {booting ? (
            <span className="text-secondary-text text-sm">Loading…</span>
          ) : user ? (
            <>
              <button
                type="button"
                onClick={() => navigate(redirectPathForRole(user.role))}
                className="text-[13px] font-medium text-secondary-text hover:text-primary-text transition-colors max-w-[140px] truncate"
                title={user.email}
              >
                {user.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full border border-border-gray/40 text-[13px] font-semibold text-primary-text hover:bg-secondary-bg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[13px] font-semibold text-secondary-text hover:text-primary-text transition-colors"
              >
                Sign in
              </Link>
              <Link to="/register" className="apple-button-primary py-2 px-6 text-[13px] font-semibold inline-block text-center">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden p-2 text-primary-text" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        className="lg:hidden overflow-hidden bg-surface/98 backdrop-blur-2xl border-b border-border-gray/10"
      >
        <div className="px-8 py-12 flex flex-col gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`text-4xl font-semibold tracking-tight ${
                location.pathname === link.path ? "text-accent-primary" : "text-primary-text"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-8 border-t border-border-gray/10 flex flex-col gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                  navigate("/");
                }}
                className="apple-button-primary w-full py-4 text-lg inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="apple-button-secondary w-full py-4 text-lg text-center block">
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="apple-button-primary w-full py-4 text-lg text-center block">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
}