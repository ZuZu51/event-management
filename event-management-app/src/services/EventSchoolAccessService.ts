const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/";

export interface EventSchoolAccess {
    id: number;
    eventId: number;
    schoolId: number;
}

class EventSchoolAccessService {
    /**
     * Lấy danh sách schools của một event
     * @param eventId ID của event
     * @returns List<EventSchoolAccess>
     */
    async getEventSchools(eventId: number): Promise<EventSchoolAccess[]> {
        try {
            // Get token from localStorage
            const token = localStorage.getItem("token");
            
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            
            // Add Authorization header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}events/${eventId}/schools`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch event schools: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching event schools:', error);
            return [];
        }
    }
}

export default new EventSchoolAccessService();
