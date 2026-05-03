import { callApi } from "../common/helper/callApi";

export type CheckInRequest = {
  sessionId?: number | null;
  eventId?: number | null;
};

export const attendanceService = {
  checkIn: async (userId: number, req: CheckInRequest) => {
    return await callApi("POST", `attendance/checkin?userId=${userId}`, req, true);
  },

  checkOut: async (userId: number, req: CheckInRequest) => {
    return await callApi("POST", `attendance/checkout?userId=${userId}`, req, true);
  },

  getHistory: async (userId: number) => {
    return await callApi<any[]>("GET", `attendance/history/${userId}`, undefined, true);
  },

  getTodayAttendance: async () => {
    return await callApi<any[]>("GET", `attendance/user/today`, undefined, true);
  },

  // Admin
  createSession: async (dto: any) => {
    return await callApi("POST", `attendance/admin/session`, dto, true);
  },

  updateSession: async (id: number, dto: any) => {
    return await callApi("PUT", `attendance/admin/session/${id}`, dto, true);
  },

  openSession: async (id: number) => {
    return await callApi("POST", `attendance/admin/session/${id}/open`, undefined, true);
  },

  reopenSession: async (id: number) => {
    return await callApi("POST", `attendance/admin/session/${id}/reopen`, undefined, true);
  },

  closeSession: async (id: number) => {
    return await callApi("POST", `attendance/admin/session/${id}/close`, undefined, true);
  },

  getEventRecords: async (eventId: number) => {
    return await callApi<any[]>("GET", `attendance/admin/event/${eventId}/records`, undefined, true);
  },
  /**
   * Derive sessions list from event records. Backend currently returns records with session info.
   */
  getEventSessions: async (eventId: number) => {
    const records = await attendanceService.getEventRecords(eventId);
    const sessionsMap: Record<string, any> = {};
    if (!records) return [];
    for (const r of records) {
      const s = r.session || r.sessionId || null;
      if (!s) continue;
      const id = s.id || s.sessionId || JSON.stringify(s);
      if (!sessionsMap[id]) sessionsMap[id] = s;
    }
    return Object.values(sessionsMap);
  },

  getEventCheckinSettings: async (eventId: number) => {
    try {
      // Call backend API to get check-in/check-out settings for the event
      const settings = await callApi<any>("GET", `attendance/admin/event/${eventId}/checkin-settings`, undefined, true);

      console.log("Service settings:", settings);
      if (settings) {
        console.log({checkInEnd: settings.checkinEnd,})
        return {
          enabled: true,
          checkinStart: settings.checkinStart,
          checkinEnd: settings.checkinEnd,
          checkoutStart: settings.checkoutStart,
          checkoutEnd: settings.checkoutEnd,
          reopenedCheckInUntil: settings.reopenedCheckInUntil || undefined,
          reopenedCheckOutUntil: settings.reopenedCheckOutUntil || undefined,
          sessionId: settings.sessionId
        };
      }
    } catch (error) {
      console.error('Error calling backend checkin-settings API:', error);
    }

    // Fallback: derive from event records if API fails
    try {
      const sessions = await attendanceService.getEventSessions(eventId);
      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        console.log('Fallback: loaded from event sessions:', session);
        return {
          enabled: true,
          checkinStart: session.checkInStart || '08:00',
          checkinEnd: session.checkInEnd || '09:00',
          checkoutStart: session.checkOutStart || '17:00',
          checkoutEnd: session.checkOutEnd || '18:00',
          reopenedCheckInUntil: session.reopenedCheckInUntil || undefined,
          reopenedCheckOutUntil: session.reopenedCheckOutUntil || undefined,
          sessionId: session.id
        };
      }
    } catch (error) {
      console.error('Error loading from event sessions:', error);
    }

    // Final fallback: default values
    console.log('Using default checkin settings');
    return {
      enabled: true,
      checkinStart: '08:00',
      checkinEnd: '09:00',
      checkoutStart: '17:00',
      checkoutEnd: '18:00',
      reopenedCheckInUntil: undefined,
      reopenedCheckOutUntil: undefined
    };
  },

  updateEventCheckinSettings: async (eventId: number, settings: any) => {
    try {
      // Call backend API to update only check-in/check-out times
      const payload = {
        checkinStart: settings.checkinStart,
        checkinEnd: settings.checkinEnd,
        checkoutStart: settings.checkoutStart,
        checkoutEnd: settings.checkoutEnd,
        reopenedCheckInUntil: settings.reopenedCheckInUntil || null,
        reopenedCheckOutUntil: settings.reopenedCheckOutUntil || null
      };
      
      if (settings.sessionId) {
        // Update existing session with session ID
        const response = await callApi(
          "PATCH",
          `attendance/admin/event/${eventId}/checkin-settings/${settings.sessionId}`,
          payload,
          true
        );
        console.log("xxx...", response)
        return response;
      } else {
        // Update by event ID only (finds first session for event)
        const response = await callApi(
          "PATCH",
          `attendance/admin/event/${eventId}/checkin-settings`,
          payload,
          true
        );
        console.log("xxx...", response)
        return response;
      }
    } catch (error) {
      console.error('Error updating checkin settings:', error);
      throw error;
    }
  },

  // Get or set whether attendance is enabled for an event
  getEventAttendance: async (eventId: number) => {
    try {
      return await callApi<any>("GET", `events/${eventId}/attendance`, undefined, true);
    } catch (e) {
      console.error('Error fetching event attendance flag', e);
      return null;
    }
  },

  setEventAttendance: async (eventId: number, enabled: boolean) => {
    try {
      return await callApi<any>("PATCH", `events/${eventId}/attendance?enabled=${enabled}`, undefined, true);
    } catch (e) {
      console.error('Error setting event attendance flag', e);
      throw e;
    }
  },

  /**
   * Attempt to sync queued offline attempts
   */
  syncOfflineQueue: async (queue: any[]) => {
    for (const item of queue) {
      try {
        if (item.type === "checkin") await attendanceService.checkIn(item.userId, item.payload);
        if (item.type === "checkout") await attendanceService.checkOut(item.userId, item.payload);
      } catch (e) {
        // leave failures in queue
      }
    }
  },
};
