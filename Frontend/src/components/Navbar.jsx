import { motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, Heart, Pill, Calendar, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/", icon: null },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Mental Health", path: "/mental-health", icon: <Heart className="w-4 h-4" /> },
    { name: "Pharmacy", path: "/pharmacy", icon: <Pill className="w-4 h-4" /> },
    { name: "Doctor", path: "/doctor", icon: <Calendar className="w-4 h-4" /> },
    { name: "Admin", path: "/admin", icon: null },
  ];

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
          <button className="apple-button-primary py-2 px-6 text-[13px] font-semibold">
            Sign In
          </button>
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
          <div className="pt-8 border-t border-border-gray/10">
            <button className="apple-button-primary w-full py-4 text-lg">
              Sign In
            </button>
          </div>
        </div>
      </motion.div>
    </nav>
  );
}