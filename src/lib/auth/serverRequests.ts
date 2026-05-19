import { auth } from './auth';

export async function setUserPassword(newPassword: string, headers: Headers) {
  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: headers as any,
    });
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, error: 'Error al establecer la contraseña' }, { status: 500 });
  }
}
