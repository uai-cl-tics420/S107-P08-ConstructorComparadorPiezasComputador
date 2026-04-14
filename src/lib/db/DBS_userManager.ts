import { email, type User } from 'better-auth';
import { auth } from './auth';

// Type interfaces for user operations
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

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
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

interface UpdateUserData {
  token: string;
  name?: string;
  email?: string;
}

interface UpdateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  error?: string;
}

interface ValidateTokenResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  error?: string;
}

export async function registerUser(data: UserRegistrationData): Promise<RegistrationResponse> {
  const response = await auth.api.signUpEmail({
    // request to BetterAuth API to register a new user
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
    // returns session token an info on success
    success: true,
    token: response.token,
    user: response.user,
  };
}

export async function loginUser(data: LoginData): Promise<LoginResponse> {
  const response = await auth.api.signInEmail({
    // request to BetterAuth API to login user
    body: {
      email: data.email,
      password: data.password,
    },
  });

  if (!response || !response.user || !response.token) {
    return {
      success: false,
      error: 'Credenciales inválidas o error al iniciar sesión',
    };
  }

  return {
    // returns session token an info on success
    success: true,
    token: response.token,
    user: response.user,
  };
}

export async function validateToken(token: string): Promise<ValidateTokenResponse> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers({
        Authorization: `Bearer ${token}`,
      }),
    });

    if (!session) {
      return {
        success: false,
        error: 'Token inválido o expirado',
      };
    }

    return {
      // on success returns user info
      success: true,
      user: session.user,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error validando token con API BetterAuth',
    };
  }
}
