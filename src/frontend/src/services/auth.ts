import { apiRequest } from "./api";

export interface User {
  id: number;
  username: string;
  name: string;
  gender: string;
  dob?: string | null;
  phone: number;
  designation?: string;
  department?: string;
  qualifications: string[];
  experience: string[];
  email?: string;
  email_hash?: string;
  created_at?: string;
  enrolled_courses?: number[];
  role?: string;
}

export interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  phone: number;
  gender: string;
  dob?: string;
  designation?: string;
  department?: string;
  qualifications: string[];
  experience: string[];
  password: string;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  phone?: number;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UsernameCheckResponse {
  username: string;
  exists: boolean;
  available: boolean;
  message?: string;
}

export const authService = {
  async register(data: RegisterPayload): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginPayload): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<User> {
    return apiRequest<User>("/users/me", {
      method: "GET",
    });
  },

  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    return apiRequest<UsernameCheckResponse>(
      `/users/check-username?username=${encodeURIComponent(username.trim())}`,
      {
        method: "GET",
      },
    );
  },
};
