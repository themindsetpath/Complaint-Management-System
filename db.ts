
import { User, Complaint, ComplaintStatus } from './types';

export const initializeDB = async () => {
  // Server handles initialization
};

export const getUsers = async (): Promise<User[]> => {
  const res = await fetch('/api/users');
  return res.json();
};

export const getComplaints = async (): Promise<Complaint[]> => {
  const res = await fetch('/api/complaints');
  return res.json();
};

export const saveUser = async (user: User) => {
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
};

export const deleteUser = async (id: string) => {
  await fetch(`/api/users/${id}`, {
    method: 'DELETE',
  });
};

export const saveComplaint = async (complaint: Complaint) => {
  await fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint),
  });
};

export const updateComplaintStatus = async (id: string, status: ComplaintStatus, notes?: string) => {
  await fetch(`/api/complaints/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminNotes: notes }),
  });
};
