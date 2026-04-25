import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChevronRight } from 'lucide-react';

const ROLE_ROOT = { admin:'Admin', doctor:'Doctor Portal', pharmacist:'Pharmacist Portal' };

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const loc = useLocation();
  const { user } = useAuth();
  const crumbs = loc.pathname.split('/').filter(Boolean).slice(1);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: collapsed ? 68 : 256 }}>
        <TopBar />
        <main className="flex-1 p-6" style={{ backgroundImage: 'var(--mesh)' }}>
          <div className="flex items-center gap-1.5 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
              {ROLE_ROOT[user?.role] || 'Admin'}
            </span>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3" style={{ color: 'var(--text3)' }} />
                <span className={`text-xs font-bold uppercase tracking-widest ${i === crumbs.length-1 ? 'grad-text' : ''}`}
                  style={i !== crumbs.length-1 ? { color: 'var(--text3)' } : {}}>
                  {c.replace(/-/g,' ')}
                </span>
              </React.Fragment>
            ))}
          </div>
          <motion.div key={loc.pathname} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.25, ease:[.4,0,.2,1] }}>
            {children}
          </motion.div>
        </main>
        <footer className="px-6 py-4 text-center" style={{ borderTop: '1px solid var(--border2)' }}>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>© 2026 CampusHealth Admin Portal. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};
export default AdminLayout;
