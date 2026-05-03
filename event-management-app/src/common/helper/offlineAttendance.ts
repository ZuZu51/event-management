const KEY = "attendance_offline_queue";

export const offlineAttendance = {
  enqueue(item: any) {
    try {
      const q = JSON.parse(localStorage.getItem(KEY) || "[]");
      q.push(item);
      localStorage.setItem(KEY, JSON.stringify(q));
    } catch (e) {
      console.error("Failed to enqueue offline attendance", e);
    }
  },

  getAll(): any[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  },

  clear() {
    localStorage.removeItem(KEY);
  },
};
