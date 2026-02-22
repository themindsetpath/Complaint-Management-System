
import { User, Complaint, UserRole, ComplaintStatus, ComplaintCategory } from './types';

const USERS_KEY = 'pmdc_users';
const COMPLAINTS_KEY = 'pmdc_complaints';

// Initial admin account
const INITIAL_ADMIN: User = {
  id: 'admin-001',
  name: 'System Administrator',
  email: 'admin@pmdc.edu',
  role: UserRole.ADMIN,
  password: 'adminpassword'
};

export const initializeDB = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([INITIAL_ADMIN]));
  }
  if (!localStorage.getItem(COMPLAINTS_KEY)) {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify([]));
  }
};

export const getUsers = (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
export const getComplaints = (): Complaint[] => JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');

export const saveUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const saveComplaint = (complaint: Complaint) => {
  const complaints = getComplaints();
  complaints.unshift(complaint);
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
};

export const updateComplaintStatus = (id: string, status: ComplaintStatus, notes?: string) => {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  if (index !== -1) {
    complaints[index] = { 
      ...complaints[index], 
      status, 
      adminNotes: notes || complaints[index].adminNotes,
      updatedAt: new Date().toISOString() 
    };
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  }
};
