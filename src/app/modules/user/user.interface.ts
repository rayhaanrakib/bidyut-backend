export interface StaffCreateInput {
  name: string;
  email: string;
  password: string;
  role: string;
  employeeId?: string;
  designation?: string;
  shift?: string;
  phone?: string;
  specialization?: string;
  experienceYears?: number;
}
