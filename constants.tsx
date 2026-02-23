
import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  LogOut, 
  PlusCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  MoreHorizontal
} from 'lucide-react';

export const CATEGORY_COLORS: Record<string, string> = {
  Teacher: 'bg-blue-100 text-blue-700',
  Classroom: 'bg-emerald-100 text-emerald-700',
  Labs: 'bg-purple-100 text-purple-700',
  Library: 'bg-amber-100 text-amber-700',
  Facilities: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-700',
};

export const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-sky-100 text-sky-700 border-sky-200',
  Resolved: 'bg-green-100 text-green-700 border-green-200',
};

export const Icons = {
  Dashboard: LayoutDashboard,
  Complaint: FileText,
  Profile: User,
  Logout: LogOut,
  Add: PlusCircle,
  Alert: AlertCircle,
  Clock: Clock,
  Check: CheckCircle2,
  More: MoreHorizontal
};
