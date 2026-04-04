import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  LogOut,
  Heart,
  Pill,
  Calendar,
  LayoutDashboard,
  ArrowLeft,
  User as UserIcon,
  ChevronDown,
  BadgePlus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function BrandMark({ size = 'w-10 h-10', iconSize = 'w-5 h-5' }) {
  return (
    <div className={`${size} rounded-[16px] bg-[linear-gradient(135deg,#0f2942_0%,#14748b_100%)] flex items-center justify-center text-white shadow-[0_12px_24px_rgba(15,41,66,0.16)]`}>
      <BadgePlus className={iconSize} />
    </div>
  );
}

function BrandLockup({ compact = false }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <BrandMark size={compact ? 'w-9 h-9' : 'w-10 h-10'} iconSize={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      <div className="min-w-0">
        <p className={`font-black tracking-tight leading-none text-slate-900 ${compact ? 'text-base' : 'text-lg'}`}>
          SLIIT MediBridge Care
        </p>
        {!compact && (
          <p className="text-[11px] uppercase tracking-[0.22em] mt-1 text-slate-500">
            Hospital and Pharmacy Portal
          </p>
        )}
      </div>
    </div>
  );
}

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNavLinks = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Admin Dashboard', path: '/admin/dashboard' },
        { name: 'Users', path: '/admin/users' },
        { name: 'Settings', path: '/admin/settings' }
      ];
    }
    if (user?.role === 'doctor') {
      return [
        { name: 'Dashboard', path: '/doctor' },
        { name: 'Appointments', path: '/doctor/appointments' },
        { name: 'Patients', path: '/doctor/patients' }
      ];
    }
    if (user?.role === 'pharmacist') {
      return [
        { name: 'Dashboard', path: '/pharmacist/dashboard' },
        { name: 'Inventory', path: '/pharmacist/inventory' },
        { name: 'Orders', path: '/pharmacist/orders' }
      ];
    }
    if (user?.role === 'counselor') {
      return [
        { name: 'Dashboard', path: '/counselor/dashboard' },
        { name: 'Sessions', path: '/counselor/sessions' },
        { name: 'Profile', path: '/counselor/profile' }
      ];
    }

    return [
      { name: 'Home', path: '/' },
      { name: 'Appointments', path: '/student/appointments' },
      { name: 'Mental Health', path: '/mental-health' },
      { name: 'Pharmacy', path: '/pharmacy' }
    ];
  };

  const navLinks = getNavLinks();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const mainPaths = ['/', ...navLinks.map((link) => link.path), '/dashboard'];
  const isMainPage = mainPaths.includes(location.pathname) || isAuthPage;

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsOpen(false);
    navigate('/');
  };

  const barShadow = scrolled ? 'shadow-[0_14px_34px_rgba(15,41,66,0.08)]' : 'shadow-[0_8px_24px_rgba(15,41,66,0.05)]';

  if (!isMainPage) {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 ${barShadow} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 hover:bg-[#0f2942] hover:text-white text-slate-700 transition-all duration-300"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="min-w-0">
              <BrandLockup compact />
            </Link>
          </div>
          <div />
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 ${barShadow} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-6 min-h-20 flex items-center justify-between gap-6">
        <Link to="/" className="shrink-0 min-w-0">
          <BrandLockup />
        </Link>

        <div className="hidden lg:flex items-center gap-2 min-w-0">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  active
                    ? 'bg-[#0f2942] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {booting ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 rounded-[20px] px-2 py-2 transition-all duration-300 border bg-slate-50 border-slate-200 hover:bg-white"
              >
                <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center border bg-[#eef7fb] border-[#d7ecf1]">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-[#14748b]" />
                  )}
                </div>
                <div className="flex flex-col items-start pr-1">
                  <span className="text-sm font-bold leading-none text-slate-900">{user.name}</span>
                  <span className="text-[11px] mt-1 capitalize text-slate-500">{user.role}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 origin-top-right bg-white rounded-3xl shadow-2xl border border-slate-200 py-2.5 z-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-1">Account</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                  </div>

                  <Link
                    to={redirectPathForRole(user.role)}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    Dashboard
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold bg-[#0f2942] text-white hover:bg-[#133b5b] transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        <button
          className="lg:hidden flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="lg:hidden overflow-hidden border-t border-slate-200 bg-white"
      >
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-2xl text-base font-semibold transition-colors ${
                  location.pathname === link.path
                    ? 'bg-[#0f2942] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  to={redirectPathForRole(user.role)}
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 rounded-2xl text-center font-bold bg-[#0f2942] text-white"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 rounded-2xl font-bold bg-rose-500 text-white"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 rounded-2xl text-center font-bold bg-white text-slate-900 border border-slate-200"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 rounded-2xl text-center font-bold bg-[#0f2942] text-white"
                >
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
