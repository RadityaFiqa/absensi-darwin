import { create } from 'zustand';

interface AttendanceWorkflowState {
  actionType: 'check_in' | 'check_out';
  selfieBase64: string | null;
  verificationId: string | null;
  checkinId: string | null;
  setActionType: (type: 'check_in' | 'check_out') => void;
  setCheckinId: (id: string | null) => void;
  setWorkflowData: (verificationId: string, selfieBase64: string) => void;
  clearWorkflow: () => void;
}

export const useAttendanceStore = create<AttendanceWorkflowState>((set) => ({
  actionType: 'check_in',
  selfieBase64: null,
  verificationId: null,
  checkinId: null,
  setActionType: (actionType) => set({ actionType }),
  setCheckinId: (checkinId) => set({ checkinId }),
  setWorkflowData: (verificationId, selfieBase64) => set({ verificationId, selfieBase64 }),
  clearWorkflow: () => set({ selfieBase64: null, verificationId: null, checkinId: null }),
}));

export default useAttendanceStore;
