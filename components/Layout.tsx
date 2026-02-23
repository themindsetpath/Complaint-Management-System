
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';
import { Icons } from '../constants';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab }) => {
  const menuItems = user.role === UserRole.STUDENT 
    ? [
        { id: 'dashboard', label: 'My Complaints', icon: Icons.Dashboard },
        { id: 'new', label: 'Submit Complaint', icon: Icons.Add },
      ]
    : [
        { id: 'dashboard', label: 'All Complaints', icon: Icons.Dashboard },
        { id: 'users', label: 'Students', icon: Icons.Profile },
        { id: 'stats', label: 'Analytics', icon: Icons.Complaint },
      ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex">
        <div className="p-8 border-b border-slate-800">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
              <Icons.Complaint className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                PMDC College
              </h1>
              <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Complaint Portal</p>
            </div>
          </motion.div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative group ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`} />
              <span className="font-semibold text-sm">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-4 bg-slate-800/40 rounded-2xl mb-4 border border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-100">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-bold">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-400 hover:bg-rose-400/10 transition-all font-bold text-sm group"
          >
            <Icons.Logout className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Icons.Complaint className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-slate-900">PMDC College</h1>
          </div>
          <button onClick={onLogout} className="text-rose-500 font-bold text-sm px-4 py-2 hover:bg-rose-50 rounded-xl transition-all">Logout</button>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-6xl mx-auto p-6 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
