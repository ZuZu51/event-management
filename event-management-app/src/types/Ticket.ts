export interface CreateTicketInput {
  userId: number;
  eventId: number;
}

export interface TicketUpdateDTO {
  ticketCode: string;
  status: "NONE" | "CHECKED_IN" | "CHECKED_OUT";
  checkInTime: string | null;
  checkOutTime: string | null;
  eventName: string;
  userName: string;
}
