
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum ComplaintStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved'
}

export enum ComplaintCategory {
  TEACHER = 'Teacher',
  CLASSROOM = 'Classroom',
  LABS = 'Labs',
  LIBRARY = 'Library',
  FACILITIES = 'Facilities',
  OTHER = 'Other'
}

export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  role: UserRole;
  password?: string;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  sentiment?: string;
}
