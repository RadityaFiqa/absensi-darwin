export interface UserSession {
  token: string | null;
  isAuthenticated: boolean;
}

export interface AttendanceMessage {
  id: string;
  date: string;
  last_action: number;
  button_stage: 'check_in' | 'check_out' | string;
  check_in_time: string | null;
  check_out_time: string | null;
  first_check_in_time: string | null;
}

export interface AttendanceResponse {
  status: number;
  message: AttendanceMessage;
  error: string;
}

export interface FaceVerificationResponse {
  status: number;
  verification_result: number;
  verification_id: string;
  message: string;
  error?: string;
}

export interface CheckInPayload {
  latlng: string;
  verification_id: string;
  in_out: number; // 1 = check in, 2 = check out
  location_type: string; // e.g., "1"
  location: string; // base64 encoded location text
  message: string;
  udid: string;
  token: string;
  checkin_id?: string;
}

export interface CheckInResponse {
  status: number;
  message: string;
  error?: string;
}

export interface LocationOption {
  id: string;
  name: string;
  latlng: string;
  address: string;
}

export interface AuthResponse {
  status: number;
  token?: string;
  message?: string | { token: string };
  error?: string;
}
