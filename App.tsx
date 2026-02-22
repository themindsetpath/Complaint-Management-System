
import React, { useState, useEffect, useCallback } from 'react';
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
  initializeDB 
} from './db';
import { CATEGORY_COLORS, STATUS_COLORS, Icons } from './constants';
import Layout from './components/Layout';
import StatsView from './components/StatsView';
import { analyzeComplaint } from './geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
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
  }, []);

  const refreshComplaints = useCallback(() => {
    setComplaints(getComplaints());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('pmdc_active_user', JSON.stringify(user));
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Please try again.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
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

    saveUser(newUser);
    setCurrentUser(newUser);
    localStorage.setItem('pmdc_active_user', JSON.stringify(newUser));
    setAuthError('');
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

    saveComplaint(complaint);
    setNewComplaint({ title: '', category: ComplaintCategory.OTHER, description: '' });
    setSubmitting(false);
    setActiveTab('dashboard');
    refreshComplaints();
  };

  const handleStatusUpdate = (id: string, status: ComplaintStatus) => {
    updateComplaintStatus(id, status);
    refreshComplaints();
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
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20 mb-6">
              <Icons.Complaint className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PMDC College</h1>
            <p className="text-slate-500 mt-2 font-medium">Complaint Management System</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{isRegistering ? 'Create Student Account' : 'Welcome Back'}</h2>
            
            {authError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {authError}
              </div>
            )}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="John Doe"
                      value={regData.name}
                      onChange={e => setRegData({...regData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Roll Number</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. CS2024-001"
                      value={regData.rollNo}
                      onChange={e => setRegData({...regData, rollNo: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="student@pmdc.edu"
                  value={isRegistering ? regData.email : loginData.email}
                  onChange={e => isRegistering 
                    ? setRegData({...regData, email: e.target.value})
                    : setLoginData({...loginData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                  value={isRegistering ? regData.password : loginData.password}
                  onChange={e => isRegistering 
                    ? setRegData({...regData, password: e.target.value})
                    : setLoginData({...loginData, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                {isRegistering ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-slate-500 text-sm font-medium">
                {isRegistering ? 'Already have an account?' : 'New to the college?'}
                <button
                  onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                  className="ml-2 text-indigo-600 font-bold hover:underline"
                >
                  {isRegistering ? 'Log In' : 'Create Student Account'}
                </button>
              </p>
              {!isRegistering && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Admin Demo Credentials</p>
                  <p className="text-xs text-slate-600 mt-1">Email: admin@pmdc.edu | Pass: adminpassword</p>
                </div>
              )}
            </div>
          </div>
        </div>
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
            {activeTab === 'dashboard' ? 'Complaint Dashboard' : activeTab === 'stats' ? 'Analytical Overview' : 'Submit New Complaint'}
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            {activeTab === 'dashboard' 
              ? `${currentUser.role === UserRole.ADMIN ? 'Manage all student grievances' : 'Track your submitted issues'} (${filteredComplaints.length})` 
              : activeTab === 'stats' 
              ? 'Real-time reporting on college environment' 
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
          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 border border-dashed border-slate-300 flex flex-col items-center text-center">
              <div className="p-6 bg-slate-50 rounded-full mb-6">
                <Icons.Complaint className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No complaints found</h3>
              <p className="text-slate-500 max-w-xs mt-2 font-medium">Try adjusting your filters or submit a new grievance if you have one.</p>
              {currentUser.role === UserRole.STUDENT && (
                 <button 
                  onClick={() => setActiveTab('new')}
                  className="mt-8 px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all"
                >
                  Create Your First Complaint
                </button>
              )}
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ${CATEGORY_COLORS[complaint.category]}`}>
                        {complaint.category}
                      </span>
                      <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[complaint.status]}`}>
                        {complaint.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">#{complaint.id} • {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{complaint.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 hover:line-clamp-none transition-all duration-500 cursor-pointer">
                      {complaint.description}
                    </p>
                    
                    {complaint.sentiment && (
                      <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI Smart Analysis
                        </p>
                        <p className="text-xs text-indigo-800 italic font-medium">"{complaint.sentiment}"</p>
                      </div>
                    )}

                    {currentUser.role === UserRole.ADMIN && (
                      <div className="mt-6 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">{complaint.studentName.charAt(0)}</div>
                          <span className="font-bold text-slate-700">{complaint.studentName}</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <span className="font-medium text-slate-500">Roll: {complaint.studentRollNo}</span>
                      </div>
                    )}
                  </div>

                  {currentUser.role === UserRole.ADMIN && (
                    <div className="flex flex-col gap-2 md:w-48 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Update Status</p>
                      {Object.values(ComplaintStatus).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(complaint.id, status)}
                          disabled={complaint.status === status}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                            complaint.status === status 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm'
                          }`}
                        >
                          Mark as {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
