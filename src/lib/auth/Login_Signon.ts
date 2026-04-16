import { auth } from './auth';
import { loginUser, registerUser } from '../db/DBS_userManager';

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

async function handleLoginAction(payload: any): Promise<LoginResponse> {
  return await loginUser({ email: payload.email, password: payload.password });
}

async function handleRegisterAction(payload: any): Promise<LoginResponse> {
  return await registerUser({
    email: payload.email,
    password: payload.password,
    name: payload.name,
  });
}

export async function processAuthTask(task: string, payload: any): Promise<LoginResponse> {
  switch (task) {
    case 'login':
      return await handleLoginAction(payload);

    case 'register':
      return await handleRegisterAction(payload);
    default:
      return { success: false, error: `Tarea '${task}' no reconocida` };
  }
}
