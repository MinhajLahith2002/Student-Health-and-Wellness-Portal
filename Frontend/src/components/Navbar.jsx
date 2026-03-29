import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, Heart, Pill, Calendar, LayoutDashboard, ArrowLeft, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, booting, logout, redirectPathForRole } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (user?.role === 'counselor') {
      return [
        { name: "Dashboard", path: "/counselor/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Sessions", path: "/counselor/sessions", icon: <Calendar className="w-4 h-4" /> },
        { name: "Profile", path: "/counselor/profile", icon: <Heart className="w-4 h-4" /> },
      ];
    }

    // Default for students and guests
    const links = [
      { name: "Home", path: "/", icon: null },
      { name: "Appointments", path: "/student/appointments", icon: <Calendar className="w-4 h-4" /> },
      { name: "Mental Health", path: "/mental-health", icon: <Heart className="w-4 h-4" /> },
      { name: "Pharmacy", path: "/pharmacy", icon: <Pill className="w-4 h-4" /> },
    ];

    return links;
  };

  const navLinks = getNavLinks();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const mainPaths = [...navLinks.map(l => l.path), '/dashboard'];
  const isMainPage = mainPaths.includes(location.pathname) || isAuthPage;

  if (!isMainPage) {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "nav-blur py-3" : "nav-blur py-4"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-bg hover:bg-accent-primary hover:text-white text-primary-text transition-all duration-300 shadow-sm border border-border-gray/20 group"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 group-active:-translate-x-1 transition-transform" />
            </button>
            
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-accent-primary/10 group-hover:scale-105 transition-transform text-sm">C</div>
              <span className="font-semibold text-lg tracking-tight text-primary-text hidden sm:inline">CampusHealth</span>
            </Link>
          </div>
          
          {/* Right side is intentionally empty for sub-pages per user request */}
          <div className="flex items-center gap-4"></div>
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
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-secondary-bg transition-all duration-300 border border-transparent hover:border-border-gray/20"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-accent-primary" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-primary-text leading-none">{user.name}</span>
                  <span className="text-[11px] text-secondary-text mt-0.5 capitalize">{user.role}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-secondary-text transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-2xl shadow-2xl border border-border-gray/10 py-2.5 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 border-b border-border-gray/5 mb-1.5">
                    <p className="text-[11px] font-medium text-secondary-text uppercase tracking-wider mb-0.5">Account</p>
                    <p className="text-[13px] font-semibold text-primary-text truncate">{user.email}</p>
                  </div>
                  
                  <Link
                    to={redirectPathForRole(user.role)}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[14px] text-primary-text hover:bg-secondary-bg transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-secondary-text" />
                    Dashboard
                  </Link>

                  <div className="my-1.5 border-t border-border-gray/5"></div>

                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                      navigate("/");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
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
              <>
                <Link 
                  to={redirectPathForRole(user.role)}
                  onClick={() => setIsOpen(false)}
                  className="apple-button-secondary w-full py-4 text-lg inline-flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    navigate("/");
                  }}
                  className="apple-button-primary w-full py-4 text-lg inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 border-red-500 text-white"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </>
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
