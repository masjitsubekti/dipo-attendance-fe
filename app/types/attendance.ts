// ==================== Attendance Types ====================

export interface AttendanceLocation {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeter: number;
  isActive: boolean;
}

export interface WorkTime {
  id: number;
  code: string;
  name: string;
  workStartTime: string; // "HH:MM"
  workEndTime: string;
  checkinStart: string;
  checkinEnd: string;
  checkoutStart: string | null;
  checkoutEnd: string | null;
  lateTolerance: number;
  earlyLeaveTolerance: number;
}

export interface ShiftInfo {
  shiftId: string;
  shiftName: string;
  dayOfWeek: number;
  isWorkingDay: boolean;
  workTime: WorkTime | null;
}

export interface AttendanceRecord {
  id: number;
  institutionId: number;
  personId: number;
  attendanceType: string;
  attendanceDate: string;
  checkinTime: string | null;
  checkoutTime: string | null;
  checkinPhoto: string | null;
  checkoutPhoto: string | null;
  checkinLatitude: number | null;
  checkinLongitude: number | null;
  checkinDistanceMeter: number | null;
  checkoutLatitude: number | null;
  checkoutLongitude: number | null;
  checkoutDistanceMeter: number | null;
  status: string | null;
  lateMinutes: number | null;
  earlyLeaveMinutes: number | null;
  overtimeMinutes: number | null;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AttendanceTodayResponse {
  attendance: AttendanceRecord | null;
  can_checkin: boolean;
  can_checkout: boolean;
  time_window_status?: 'OPEN' | 'BEFORE_CHECKIN' | 'AFTER_CHECKIN' | 'BEFORE_CHECKOUT' | 'AFTER_CHECKOUT' | 'HOLIDAY_DISABLED';
  time_window_message?: string;
  current_time: string;
  config?: {
    allow_holiday_attendance: boolean;
    save_attendance_photo: boolean;
    require_attendance_photo: boolean;
  };
  shift: ShiftInfo | null;
  location: Pick<AttendanceLocation, 'id' | 'name' | 'latitude' | 'longitude' | 'radiusMeter'> | null;
}

export interface AttendanceLog {
  id: number;
  dateTime: string;
  action: 'checkin' | 'checkout';
  attendanceType: string;
  photo: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeter: number | null;
  locationStatus: string | null;
  status: 'success' | 'rejected' | 'failed';
  rejectionReason: string | null;
  device: string | null;
}

export interface AttendancePaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceHistoryResponse {
  data: AttendanceRecord[];
  meta: AttendancePaginatedMeta;
}

export interface AttendanceLogResponse {
  data: AttendanceLog[];
  meta: AttendancePaginatedMeta;
}

export interface AttendanceCheckResponse {
  attendance: AttendanceRecord;
  distance_meter: number;
  late_minutes?: number;
  early_leave_minutes?: number;
  overtime_minutes?: number;
  status?: string;
}

export type AttendanceAction = 'checkin' | 'checkout';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'holiday' | 'incomplete';
