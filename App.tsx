
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  UserRole, 
  Complaint, 
  ComplaintCategory, 
  ComplaintStatus 
} from './types';
import { 
  getUsers, 
  getComplaints, 
  saveUser, 
  saveComplaint, 
  updateComplaintStatus, 
  deleteUser,
  initializeDB 
} from './db';
import { CATEGORY_COLORS, STATUS_COLORS, Icons } from './constants';
import Layout from './components/Layout';
import StatsView from './components/StatsView';
import UsersView from './components/UsersView';
import { analyzeComplaint } from './geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Registration form
  const [regData, setRegData] = useState({ name: '', email: '', rollNo: '', password: '' });
  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  // New Complaint form
  const [newComplaint, setNewComplaint] = useState({ title: '', category: ComplaintCategory.OTHER, description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeDB();
    const storedUser = localStorage.getItem('pmdc_active_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    refreshComplaints();
    refreshUsers();

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'COMPLAINT_CREATED' || data.type === 'COMPLAINT_UPDATED') {
        refreshComplaints();
      }
    };

    return () => ws.close();
  }, []);

  const refreshComplaints = useCallback(async () => {
    const data = await getComplaints();
    setComplaints(data);
  }, []);

  const refreshUsers = useCallback(async () => {
    const data = await getUsers();
    setAllUsers(data);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const users = await getUsers();
      const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('pmdc_active_user', JSON.stringify(user));
        setAuthError('');
      } else {
        setAuthError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setAuthError('Connection error. Please check if the server is running.');
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const users = await getUsers();
      if (users.find(u => u.email === regData.email)) {
        setAuthError('User with this email already exists.');
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: regData.name,
        email: regData.email,
        rollNumber: regData.rollNo,
        role: UserRole.STUDENT,
        password: regData.password
      };

      await saveUser(newUser);
      setCurrentUser(newUser);
      localStorage.setItem('pmdc_active_user', JSON.stringify(newUser));
      setAuthError('');
      refreshUsers();
    } catch (err) {
      setAuthError('Registration failed. Please try again.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pmdc_active_user');
    setActiveTab('dashboard');
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);

    // Smart Analysis with Gemini
    const sentiment = await analyzeComplaint(newComplaint.title, newComplaint.description);

    const complaint: Complaint = {
      id: 'COMP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentRollNo: currentUser.rollNumber || 'N/A',
      title: newComplaint.title,
      category: newComplaint.category,
      description: newComplaint.description,
      status: ComplaintStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentiment
    };

    await saveComplaint(complaint);
    setNewComplaint({ title: '', category: ComplaintCategory.OTHER, description: '' });
    setSubmitting(false);
    setActiveTab('dashboard');
    refreshComplaints();
  };

  const handleStatusUpdate = async (id: string, status: ComplaintStatus) => {
    await updateComplaintStatus(id, status);
    refreshComplaints();
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
    refreshUsers();
  };

  const filteredComplaints = complaints.filter(c => {
    const matchCategory = filterCategory === 'All' || c.category === filterCategory;
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchUser = currentUser?.role === UserRole.ADMIN || c.studentId === currentUser?.id;
    return matchCategory && matchStatus && matchUser;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-block p-5 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/30 mb-6"
            >
              <Icons.Complaint className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">PMDC College</h1>
            <p className="text-slate-500 mt-2 font-semibold">Complaint Management System</p>
          </div>

          <motion.div 
            layout
            className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{isRegistering ? 'Create Student Account' : 'Welcome Back'}</h2>
            
            <AnimatePresence mode="wait">
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl flex items-center gap-3 overflow-hidden"
                >
                  <Icons.Alert className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
              <AnimatePresence mode="popLayout">
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Full Name</label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder="John Doe"
                        value={regData.name}
                        onChange={e => setRegData({...regData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Roll Number</label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder="e.g. CS2024-001"
                        value={regData.rollNo}
                        onChange={e => setRegData({...regData, rollNo: e.target.value})}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="student@pmdc.edu"
                  value={isRegistering ? regData.email : loginData.email}
                  onChange={e => isRegistering 
                    ? setRegData({...regData, email: e.target.value})
                    : setLoginData({...loginData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="••••••••"
                  value={isRegistering ? regData.password : loginData.password}
                  onChange={e => isRegistering 
                    ? setRegData({...regData, password: e.target.value})
                    : setLoginData({...loginData, password: e.target.value})}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 mt-2"
              >
                {isRegistering ? 'Create Account' : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-slate-500 text-sm font-semibold">
                {isRegistering ? 'Already have an account?' : 'New to the college?'}
                <button
                  onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                  className="ml-2 text-indigo-600 font-bold hover:underline"
                >
                  {isRegistering ? 'Log In' : 'Create Student Account'}
                </button>
              </p>
              {!isRegistering && (
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">Admin Demo Access</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-slate-600 font-medium">Email: <span className="font-bold text-slate-900">admin@pmdc.edu</span></p>
                    <p className="text-xs text-slate-600 font-medium">Pass: <span className="font-bold text-slate-900">adminpassword</span></p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'dashboard' ? 'Complaint Dashboard' : 
             activeTab === 'stats' ? 'Analytical Overview' : 
             activeTab === 'users' ? 'Student Management' :
             'Submit New Complaint'}
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            {activeTab === 'dashboard' 
              ? `${currentUser.role === UserRole.ADMIN ? 'Manage all student grievances' : 'Track your submitted issues'} (${filteredComplaints.length})` 
              : activeTab === 'stats' 
              ? 'Real-time reporting on college environment' 
              : activeTab === 'users'
              ? 'View and manage registered student accounts'
              : 'Tell us what’s on your mind'}
          </p>
        </div>

        {activeTab === 'dashboard' && (
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              {Object.values(ComplaintCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {Object.values(ComplaintStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {currentUser.role === UserRole.STUDENT && (
               <button 
                onClick={() => setActiveTab('new')}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                <Icons.Add className="w-4 h-4" />
                New Complaint
              </button>
            )}
          </div>
        )}
      </header>

      {activeTab === 'stats' && <StatsView complaints={complaints} />}
      {activeTab === 'users' && <UsersView users={allUsers} onDeleteUser={handleDeleteUser} />}

      {activeTab === 'new' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-2xl">
          <form onSubmit={handleSubmitComplaint} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Complaint Title</label>
                <input
                  required
                  type="text"
                  placeholder="Summarize the issue briefly..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={newComplaint.title}
                  onChange={e => setNewComplaint({...newComplaint, title: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(ComplaintCategory).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewComplaint({...newComplaint, category: cat})}
                      className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                        newComplaint.category === cat 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Provide details such as location, date, time, and specific people involved if applicable..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  value={newComplaint.description}
                  onChange={e => setNewComplaint({...newComplaint, description: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-3"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Grievance...
                  </>
                ) : 'Submit Official Complaint'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-8 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredComplaints.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-20 border border-dashed border-slate-300 flex flex-col items-center text-center"
              >
                <div className="p-8 bg-slate-50 rounded-full mb-6">
                  <Icons.Complaint className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">No complaints found</h3>
                <p className="text-slate-500 max-w-xs mt-2 font-semibold leading-relaxed">Try adjusting your filters or submit a new grievance if you have one.</p>
                {currentUser.role === UserRole.STUDENT && (
                   <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('new')}
                    className="mt-8 px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    Create Your First Complaint
                  </motion.button>
                )}
              </motion.div>
            ) : (
              filteredComplaints.map((complaint, index) => (
                <motion.div 
                  key={complaint.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl ${CATEGORY_COLORS[complaint.category]}`}>
                          {complaint.category}
                        </span>
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 ${STATUS_COLORS[complaint.status]}`}>
                          {complaint.status}
                        </span>
                        <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                          <Icons.Clock className="w-3.5 h-3.5" />
                          #{complaint.id} • {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-extrabold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{complaint.title}</h3>
                      <p className={`text-slate-600 text-base leading-relaxed transition-all duration-500 cursor-pointer font-medium ${currentUser.role === UserRole.ADMIN ? '' : 'line-clamp-2 hover:line-clamp-none'}`}>
                        {complaint.description}
                      </p>
                      
                      {complaint.sentiment && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4"
                        >
                          <div className="bg-indigo-100 p-2 rounded-xl h-fit">
                            <Icons.Alert className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">AI Smart Analysis</p>
                            <p className="text-sm text-indigo-900 italic font-semibold leading-relaxed">"{complaint.sentiment}"</p>
                          </div>
                        </motion.div>
                      )}

                      {currentUser.role === UserRole.ADMIN && (
                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[11px] text-slate-500 shadow-inner">
                              {complaint.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 leading-none">{complaint.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">Roll: {complaint.studentRollNo}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {currentUser.role === UserRole.ADMIN && (
                      <div className="flex flex-col gap-2.5 md:w-56 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Update Status</p>
                        {Object.values(ComplaintStatus).map((status) => (
                          <motion.button
                            key={status}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStatusUpdate(complaint.id, status)}
                            disabled={complaint.status === status}
                            className={`w-full py-3 rounded-xl text-xs font-black transition-all border-2 ${
                              complaint.status === status 
                              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
                            }`}
                          >
                            Mark as {status}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </Layout>
  );
};

export default App;
