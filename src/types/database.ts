export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  photo_url: string | null;
  class_id: string | null;
  enrollment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  child_id: string;
  relationship: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  profession: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ChildHealth {
  id: string;
  child_id: string;
  allergies: string | null;
  dietary_restrictions: string | null;
  medical_notes: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  age_range: string | null;
  capacity: number;
  description: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  salary: number;
  hire_date: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChildAttendance {
  id: string;
  child_id: string;
  date: string;
  status: string;
  arrival_time: string | null;
  departure_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  date: string;
  status: string;
  arrival_time: string | null;
  departure_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  child_id: string;
  category_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  expense_date: string;
  description: string | null;
  receipt_number: string | null;
  created_at: string;
}

export interface PaymentCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  week_start: string;
  week_end: string;
  status: string;
  created_at: string;
}

export interface Activity {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  activity_name: string;
  activity_type: string | null;
  staff_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Menu {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  day_of_week: number;
  meal_type: string;
  dish_name: string;
  description: string | null;
  allergens: string | null;
  special_diet: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  related_entity: string | null;
  related_id: string | null;
  created_at: string;
}

export interface NurserySettings {
  id: string;
  nursery_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  director_name: string | null;
  registration_fee: number;
  monthly_fee: number;
  currency: string;
  created_at: string;
  updated_at: string;
}
