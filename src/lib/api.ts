const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Types
import type { User, Event, Participant } from "@/lib/types";

type UpdateProfileData = {
  nom?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  location?: string;
  address?: string;
  isEmailConfirmed?: boolean;
};

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedToken = localStorage.getItem("access_token");
        if (savedToken) {
          this.token = savedToken;
        }
      } catch (error) {
        console.warn("Failed to load token from localStorage:", error);
      }
    }
  }

  async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      const localToken = localStorage.getItem("access_token");
      this.token = localToken;
      return localToken;
    }
    return null;
  }

  async setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  async saveLoginToken(response: { access_token: string }) {
    if (response?.access_token) {
      await this.setToken(response.access_token);
    }
  }
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    console.log("🛡️ Token used:", token);
  
    let headers: Record<string, string> = {};
  
    const isFormData = options.body instanceof FormData;
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
  
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        headers = { ...headers, ...(options.headers as Record<string, string>) };
      }
    }
  
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  
    const config: RequestInit = {
      ...options,
      headers,
    };
  
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
    const text = await response.text();
  
    if (!response.ok) {
      let errorMsg = `API Error: ${response.status}`;
      try {
        const error = text ? JSON.parse(text) : null;
        if (error?.message) errorMsg = error.message;
      } catch {}
      throw new Error(errorMsg);
    }
  
    if (!text) {
      // Return an empty object casted to T when no body is returned to satisfy typings
      return {} as T;
    }
  
    return JSON.parse(text) as T;
  }
  
  
  // ──────────── AUTHENTICATION ────────────

  async login(email: string, password: string): Promise<{ user: User; access_token: string }> {
    const response = await this.request<{ user: User; access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, motDePasse: String(password) }),
    });
    await this.saveLoginToken(response);
    return response;
  }
// Dans la même classe ou instance que login, resetPassword, etc.

async registerUser(data: {
  nom: string;
  email: string;
  motDePasse: string;
  phone: string;
  role: "Responsable" | "Employee"; // adapte si tu as d'autres rôles
  department: string;
  position: string;
  location: string;
  address: string;
}): Promise<{ message: string } | any> {
  return this.request("/auth/users/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

  // async register(name: string, email: string, password: string, role: string): Promise<{ user: User; token: string }> {
  //   return this.request("/auth/register", {
  //     method: "POST",
  //     body: JSON.stringify({ name, email, password, role }),
  //   });
  // }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ──────────── VOICE AI INTEGRATIONS ────────────

  /**
   * Envoie l'audio (Blob) à l'API de transcription et retourne le texte + confiance.
   * @param audioBlob Blob audio enregistré via MediaRecorder
   */
  async transcribeAudio(audioBlob: Blob): Promise<import("@/lib/types").VoiceTranscription> {
    const formData = new FormData();
    // Nom de champ "file" supposé par l'API ; adapter si nécessaire
    formData.append("file", audioBlob, "audio.wav");

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.text || "",
      confidence: data.confidence || 1,
      isProcessing: false,
    };
  }

  /**
   * Envoie le texte transcrit à l'API d'extraction pour générer les champs de l'événement.
   * @param transcription Texte issu de la transcription vocale
   */
  async generateEventContent(transcription: string): Promise<import("@/lib/types").GeneratedEventFields> {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: transcription }),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    const payload: any = await response.json();
    let data = payload;
    if (payload.event_json !== undefined) {
      data = payload.event_json;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {}
      }
    }

    // Si la réponse complète est une chaîne JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {}
    }

    return data as import("@/lib/types").GeneratedEventFields;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = await this.getToken();
  
    console.log("🔐 Calling changePassword:");
    console.log("🔐 Token:", token);
    console.log("📤 Payload:", { currentPassword, newPassword });
  
    if (!token) {
      throw new Error("No token found. Please login again.");
    }
  
    try {
      await this.request("/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
  
      console.log("✅ Password changed successfully.");
    } catch (error) {
      console.error("❌ Failed to change password:", error);
      throw error;
    }
  }
  
  

  // ──────────── PROFILE ────────────

  async getCurrentUser(): Promise<User> {
    return this.request("/users/me");
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    return this.request("/users", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    const token = await this.getToken();
    const formData = new FormData();
    formData.append("file", file); // The name must match the backend

    const response = await fetch(`${API_BASE_URL}/upload/${userId}/upload-avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json(); // { avatarUrl: string }
  }
  async uploadEventImage(file: File): Promise<{ imageUrl: string }> {
    const token = await this.getToken();
    const formData = new FormData();
    formData.append("file", file);
  
    const response = await fetch(`${API_BASE_URL}/upload/event-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error("Upload failed");
    }
  
    return response.json(); // { imageUrl: string }
  }


  async uploadFile(file: File): Promise<{ url: string }> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const unsignedPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
    console.log("📦 Fichier à uploader:", file);
    console.log("🌍 CloudName:", cloudName);
    console.log("🔐 Upload preset:", unsignedPreset);
    console.log("📁 Type MIME:", file.type);
  
    const formData = new FormData();
    formData.append("file", file);           // <- OBLIGATOIRE : ajouter le fichier
    formData.append("resource_type", "auto");
    
    if (cloudName && unsignedPreset) {
      formData.append("upload_preset", unsignedPreset);
  
      console.log("📤 Tentative d'upload direct vers Cloudinary...");
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formData,
      });
  
      console.log("📥 Statut de la réponse Cloudinary:", response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Échec Cloudinary:", errorText);
        throw new Error(`Cloudinary upload failed: ${errorText}`);
      }
  
      const data: any = await response.json();
      console.log("✅ Réponse Cloudinary:", data);
      return { url: data.secure_url as string };
    }
  
    // Fallback
    const token = await this.getToken();
    console.log("🪪 Token utilisé:", token);
  
    console.log("📤 Upload via backend...");
    const response = await fetch(`${API_BASE_URL}/upload/chat-file`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });
  
    console.log("📥 Statut réponse backend:", response.status);
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Échec backend:", errorText);
      throw new Error(`Backend upload failed: ${errorText}`);
    }
  
    const data: any = await response.json();
    console.log("✅ Réponse backend:", data);
    return { url: data.url || data.secure_url || data.imageUrl };
  }
  
  

  // ──────────── USERS ────────────

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: "employee" | "manager";
    phone?: string;
    department?: string;
    job?: string;
    location?: string;
    address?: string;
  }): Promise<User> {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request("/users");
  }

  async getUserById(userId: string): Promise<User> {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: string, data: UpdateProfileData): Promise<User> {
    return this.request(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  // ──────────── EVENTS ────────────

  async getEvents(): Promise<Event[]> {
    return this.request("/events");
  }

  async getMyEvents(): Promise<Event[]> {
    return this.request("/users/me/events");
  }

  /*async getAllEventsFromUsers(): Promise<Event[]> {
    return this.request("/events");
  }*/

  async getEvent(id: string): Promise<Event> {
    return this.request(`/events/${id}`);
  }

  async createEvent(event: {
    titre: string;
    description: string;
    date: string;
    heure: string;
    lieu: string;
    capacite: number;
    organisateurId: string;
    imageUrl?: string;
    status?: "PENDING" | "PUBLISHED" | "CANCELLED" | "REJECTED" | "DONE";
  }): Promise<Event> {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  }
  

  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    return this.request(`/events/${id}`, {
      method: "PUT", // backend expects PUT
      body: JSON.stringify(event),
    });
  }

  async deleteEvent(id: string): Promise<void> {
    const token = localStorage.getItem("access_token")
    // ou récupère-le via ton service Auth
  
    if (!token) throw new Error("User not authenticated")
  
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,  // très important pour que le backend reconnaisse l'utilisateur
        "Content-Type": "application/json",
      },
    })
  
    if (!response.ok) {
      // Tu peux gérer les cas 401 / 403 plus finement si tu veux
      const errorText = await response.text()
      throw new Error(`Failed to delete event: ${errorText || response.statusText}`)
    }
  }
  

  async participateInEvent(eventId: string, userId: string): Promise<Participant> {
    return this.request(`/participants`, {
      method: "POST",
      body: JSON.stringify({ eventId, userId }),
    });
  }
  

  async cancelParticipation(eventId: string, userId: string): Promise<void> {
    return this.request(`/participants/event/${eventId}/user/${userId}`, {
      method: "DELETE",
    });
  }
  

  async confirmParticipation(eventId: string, userId: string): Promise<void> {
    return this.request(`/events/${eventId}/confirm/${userId}`, {
      method: "GET",
    });
  }

  async inviteToEvent(eventId: string, userId: string): Promise<void> {
    return this.request(`/events/${eventId}/invite`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async addOrganizer(eventId: string, userId: string): Promise<void> {
    return this.request(`/events/${eventId}/add-organizer`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getEventParticipants(eventId: string): Promise<Participant[]> {
    // Backend (NestJS) exposes GET /participants/event/:eventId
    const candidateEndpoints = [
      `/participants/event/${eventId}`,
      `/participants?eventId=${eventId}`,
    ]

    for (const endpoint of candidateEndpoints) {
      try {
        return await this.request(endpoint)
      } catch (err) {
        // Continue to next endpoint when 404; log once in dev but keep console clean from cascade
        if (process.env.NODE_ENV === "development") {
          console.debug(`❔ Endpoint ${endpoint} not available:`, (err as Error).message)
        }
      }
    }

    // If none succeed, return an empty array to avoid breaking the UI
    return []
  }

  // ──────────── NOTIFICATIONS ────────────

  async getNotifications(userId: string): Promise<any[]> {
    return this.request(`/notifications/user/${userId}`)
  }

  async markNotificationRead(notifId: string): Promise<void> {
    await this.request(`/notifications/${notifId}/read`, { method: 'PATCH' })
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.request(`/notifications/user/${userId}/read-all`, { method: 'PATCH' })
  }

  // Responsable: récupérer toutes les notifications (ex: messages de tous les salons)
  async getAllNotifications(): Promise<any[]> {
    return this.request(`/notifications`)
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    return this.request(`/notifications/user/${userId}/unread-count`)
  }

  // ──────────── CHAT MESSAGE COUNT ────────────
  async countAllChatMessages(): Promise<{ count: number }> {
    return this.request('/chat/count')
  }

  async countUserChatMessages(userId: string): Promise<{ count: number }> {
    return this.request(`/chat/count?userId=${userId}`)
  }

  // async getMessages(eventId: string): Promise<any[]> {
  //   return this.request(`/chat/${eventId}/messages`)
  // }

  // ──────────── LOGOUT ────────────

  logout() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  }
}

// Types
export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const apiService = new ApiService();
