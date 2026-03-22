import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  HelpCircle,
  BookOpen,
  LogOut,
  Menu
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  to, 
  isCollapsed, 
  isActive,
  badge,
  subItems
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-3 py-1">
      <Link 
        to={to}
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
          isActive 
            ? "bg-blue-50 text-blue-600" 
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
        {!isCollapsed && (
          <span className="font-medium text-sm flex-1 truncate">{label}</span>
        )}
        {!isCollapsed && badge && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
            {badge}
          </span>
        )}
        {isActive && (
          <motion.div 
            layoutId="active-nav"
            className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
          />
        )}
      </Link>
    </div>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();

  const menuGroups = [
    {
      title: "Main",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", to: "/admin/dashboard" },
        { icon: Users, label: "User Management", to: "/admin/users" },
      ]
    },
    {
      title: "Content",
      items: [
        { icon: BookOpen, label: "Resources", to: "/admin/resources" },
        { icon: HelpCircle, label: "FAQ Manager", to: "/admin/faq" },
        { icon: Calendar, label: "Events", to: "/admin/events" },
      ]
    },
    {
      title: "Communication",
      items: [
        { icon: Bell, label: "Notifications", to: "/admin/notifications", badge: 3 },
        { icon: MessageSquare, label: "Feedback", to: "/admin/feedback" },
      ]
    },
    {
      title: "System",
      items: [
        { icon: BarChart3, label: "Reports", to: "/admin/reports" },
        { icon: ShieldCheck, label: "Audit Logs", to: "/admin/audit" },
        { icon: Settings, label: "Settings", to: "/admin/settings" },
      ]
    }
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="fixed left-0 top-0 bottom-0 bg-white border-r border-slate-100 z-50 flex flex-col transition-all duration-300"
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-slate-50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl text-slate-900 tracking-tight"
            >
              Campus<span className="text-blue-600">Admin</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            {!isCollapsed && (
              <p className="px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {group.title}
              </p>
            )}
            {group.items.map((item, i) => (
              <SidebarItem 
                key={i}
                {...item}
                isCollapsed={isCollapsed}
                isActive={location.pathname === item.to}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-50">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all group"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-3 mt-1 rounded-xl text-rose-500 hover:bg-rose-50 transition-all group">
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;