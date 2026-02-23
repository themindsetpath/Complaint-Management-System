import React from 'react';
import { motion } from 'motion/react';
import { User, UserRole } from '../types';
import { Icons } from '../constants';

interface UsersViewProps {
  users: User[];
  onDeleteUser: (id: string) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ users, onDeleteUser }) => {
  const students = users.filter(u => u.role === UserRole.STUDENT);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Registered Students</h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage student accounts and access</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Number</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <Icons.Profile className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold">No students registered yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-sm shadow-inner">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-600 font-mono text-sm">{student.rollNumber}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-medium text-slate-500">{student.email}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${student.name}?`)) {
                            onDeleteUser(student.id);
                          }
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Student"
                      >
                        <Icons.Logout className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default UsersView;
