export interface CreateSpeakerInput {
  name: string;
  bio: string;
  // Backend expects Role enum: SPEAKER | GUEST
  role: "SPEAKER" | "GUEST";
}

export interface Speaker {
  id?: number;
  name: string;
  bio: string;
  role: "SPEAKER" | "GUEST";
}
