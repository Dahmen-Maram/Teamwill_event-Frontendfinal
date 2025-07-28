export interface User {
  id: string
  nom:string
  email: string
  username: string
  role: "Responsable" | "Employee"
  avatarUrl?: string
  phone?: string
  address?: string
  department?: string
  job?: string
  position?: string
  joinedAt?: string
  location?: string
}

export interface Event {
  id: string;
  titre: string;
  description: string;
  date: string;
  heure: string;
  lieu: string;
  capacite: number;
  organisateur: User; // au singulier, comme dans le backend
  imageUrl?: string;
  status?: "PENDING" | "PUBLISHED" | "CANCELLED" | "REJECTED" | "DONE";
  participants?: Participant[];
  currentParticipants?: number;
  isRegistered?: boolean;
  tags?: string[];
}

export interface CreateParticipantDto {
  userId: string
  eventId: string
  
}
export interface Participant {
  id: string
  user: User
  event: Event
  status: "PENDING" | "APPROVED" | "REJECTED"
  registeredAt: Date
}
export interface ChatMessage {
  id: string
  eventId: string
  userId: string
  userName: string
  userRole: "Employee" | "Responsable"
  message: string
  timestamp: string
  type: "text" | "file" | "image" | "video"
  fileUrl?: string
  fileName?: string
  avatarUrl?: string
  seenBy: string[] 
}

export interface VoiceTranscription {
  text: string
  confidence: number
  isProcessing: boolean
}

export interface AIGeneratedContent {
  title: string
  description: string
  tags: string[]
}

// Result schema renvoyé par l'endpoint /generate (extraction des champs)
export interface GeneratedEventFields {
  nom?: string
  event?: string
  date?: string
  heure?: string
  capacite?: number
  titre?: string
  description?: string
}

export interface UpdateProfileData {
  nom: string
  email: string
  phone?: string
  address?: string
  department?: string
  location?: string
  job?: string
  position?: string
  avatarUrl?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface Notification {
  id: string;
  kind: 'event' | 'chat';
  title: string;          // ex : « Nouvel événement », « Nouveau message »
  eventId?: string;       // pour naviguer vers le chat ou la page event
  createdAt: string;
  read: boolean;
}
