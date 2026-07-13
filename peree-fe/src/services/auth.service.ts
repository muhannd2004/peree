import api from '../lib/api';

// -- Types matching backend DTOs --

export interface SignupPayload {
  name: string;
  userName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  userName?: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  error: string;
}

// -- API calls --

export async function signup(data: SignupPayload): Promise<string> {
  const res = await api.post<{ message?: string; error?: string }>('/auth/signup', data);
  if (res.data.error) throw new Error(res.data.error);
  return res.data.message ?? 'User registered successfully';
}

export async function login(data: LoginPayload): Promise<string> {
  const res = await api.post<AuthResponse>('/auth/login', data);
  if (res.data.error) throw new Error(res.data.error);
  return res.data.token;
}
