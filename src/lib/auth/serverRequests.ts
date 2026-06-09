import { auth } from './auth';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth:serverRequests');

export async function setUserPassword(newPassword: string, headers: Headers) {
  log.info('Solicitud de cambio de contraseña recibida');
  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: headers as any,
    });
    log.info('Contraseña actualizada exitosamente');
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    log.error('Error al establecer la contraseña', { error: (error as Error).message });
    return Response.json({ success: false, error: 'Error al establecer la contraseña' }, { status: 500 });
  }
}
