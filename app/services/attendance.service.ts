import { useApi } from '~/composables/useApi';
import type {
  AttendanceTodayResponse,
  AttendanceHistoryResponse,
  AttendanceLogResponse,
  AttendanceLocation,
  AttendanceCheckResponse,
} from '~/types/attendance';

export const attendanceService = {
  /**
   * Get today's attendance status + shift + location
   */
  async getToday(): Promise<AttendanceTodayResponse> {
    const api = useApi();
    const res: any = await api.get('/attendance/today');
    return res.data;
  },

  /**
   * Get active attendance locations for user's institution
   */
  async getLocations(): Promise<AttendanceLocation[]> {
    const api = useApi();
    const res: any = await api.get('/attendance/locations');
    return res.data;
  },

  /**
   * Get paginated attendance history
   */
  async getHistory(params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    attendance_type?: string;
    status?: string;
  }): Promise<AttendanceHistoryResponse> {
    const api = useApi();
    const res: any = await api.get('/attendance/history', { params });
    return res.data;
  },

  /**
   * Get paginated attendance logs (audit trail)
   */
  async getLogs(params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    action?: string;
    status?: string;
  }): Promise<AttendanceLogResponse> {
    const api = useApi();
    const res: any = await api.get('/attendance/logs', { params });
    return res.data;
  },

  /**
   * Submit Check-In
   * Sends multipart/form-data with photo file + GPS coordinates
   */
  async checkIn(payload: {
    photo?: File | null;
    latitude: number;
    longitude: number;
    attendance_location_id?: number | null;
  }): Promise<AttendanceCheckResponse> {
    const api = useApi();
    const form = new FormData();
    if (payload.photo) {
      form.append('photo', payload.photo);
    }
    form.append('latitude', String(payload.latitude));
    form.append('longitude', String(payload.longitude));
    if (payload.attendance_location_id) {
      form.append('attendance_location_id', String(payload.attendance_location_id));
    }

    const res: any = await api.fetch('/attendance/check-in', {
      method: 'POST',
      body: form,
    });
    return res.data;
  },

  /**
   * Submit Check-Out
   */
  async checkOut(payload: {
    photo?: File | null;
    latitude: number;
    longitude: number;
    attendance_location_id?: number | null;
  }): Promise<AttendanceCheckResponse> {
    const api = useApi();
    const form = new FormData();
    if (payload.photo) {
      form.append('photo', payload.photo);
    }
    form.append('latitude', String(payload.latitude));
    form.append('longitude', String(payload.longitude));
    if (payload.attendance_location_id) {
      form.append('attendance_location_id', String(payload.attendance_location_id));
    }

    const res: any = await api.fetch('/attendance/check-out', {
      method: 'POST',
      body: form,
    });
    return res.data;
  },
};
