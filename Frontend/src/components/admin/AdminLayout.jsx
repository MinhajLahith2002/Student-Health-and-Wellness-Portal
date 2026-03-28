import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ROLE_BREADCRUMB = {
  admin: 'Admin',
  doctor: 'Doctor Portal',
  pharmacist: 'Pharmacist Portal',
};

const AdminLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const breadcrumbRoot = ROLE_BREADCRUMB[user?.role] || 'Admin';

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300 flex flex-col min-h-screen"
        style={{ marginLeft: isCollapsed ? '80px' : '280px' }}
      >
        <TopBar />
        
        <div className="flex-1 p-8 max-w-[1440px] mx-auto w-full">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>{breadcrumbRoot}</span>
            {location.pathname.split('/').filter(Boolean).slice(1).map((path, i) => (
              <React.Fragment key={i}>
                <span className="text-slate-300">/</span>
                <span className={i === location.pathname.split('/').filter(Boolean).slice(1).length - 1 ? "text-blue-600" : ""}>
                  {path.replace(/-/g, ' ')}
                </span>
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="p-8 border-t border-slate-50 text-center">
          <p className="text-xs text-slate-400 font-medium">
            © 2026 CampusHealth Admin Portal. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;