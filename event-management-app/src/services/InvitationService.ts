import { callApi } from '../common/helper/callApi';

export interface StudentInvitation {
  id: number;
  eventId: number;
  eventName?: string;
  eventDate?: string;
  inviteeEmail: string;
  invitedByEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  invitedAt: string;
  acceptedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  ticketId?: number;
}

class InvitationService {
  /**
   * Get all invitations for a student
   */
  async getStudentInvitations(studentId: number): Promise<StudentInvitation[]> {
    try {
      const data = await callApi<StudentInvitation[]>(
        'GET',
        `students/${studentId}/invitations`,
        undefined,
        true
      );
      return data || [];
    } catch (error) {
      console.error('Failed to fetch student invitations:', error);
      throw error;
    }
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(invitationId: number): Promise<InvitationResponse> {
    try {
      const response = await callApi<InvitationResponse>(
        'POST',
        `invitations/${invitationId}/accept`,
        {},
        true
      );
      return response || { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Reject an invitation
   */
  async rejectInvitation(
    invitationId: number,
    reason?: string
  ): Promise<InvitationResponse> {
    try {
      const response = await callApi<InvitationResponse>(
        'POST',
        `invitations/${invitationId}/reject`,
        { reason: reason || '' },
        true
      );
      return response || { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      throw error;
    }
  }
}

export default new InvitationService();
