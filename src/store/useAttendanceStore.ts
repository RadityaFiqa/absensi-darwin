import { create } from 'zustand';

interface AttendanceWorkflowState {
  actionType: 'check_in' | 'check_out';
  selfieBase64: string | null;
  verificationId: string | null;
  setActionType: (type: 'check_in' | 'check_out') => void;
  setWorkflowData: (verificationId: string, selfieBase64: string) => void;
  clearWorkflow: () => void;
}

export const useAttendanceStore = create<AttendanceWorkflowState>((set) => ({
  actionType: 'check_in',
  selfieBase64: null,
  verificationId: null,
  setActionType: (actionType) => set({ actionType }),
  setWorkflowData: (verificationId, selfieBase64) => set({ verificationId, selfieBase64 }),
  clearWorkflow: () => set({ selfieBase64: null, verificationId: null }),
}));

export default useAttendanceStore;
