import { email, type User } from 'better-auth';
import { auth } from './auth';

interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
}

interface RegistrationResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
  };
  error?: string;
}

export async function registerUser(data: UserRegistrationData): Promise<RegistrationResponse> {
  const response = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: data.password,
      name: data.name,
    },
  });

  if (!response || !response.user || !response.token) {
    return {
      success: false,
      error: 'Error al crear usuario',
    };
  }

  return {
    success: true,
    token: response.token,
    user: response.user,
  };
}
