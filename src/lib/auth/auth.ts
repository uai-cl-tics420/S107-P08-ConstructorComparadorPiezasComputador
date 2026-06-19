import { db } from 'mongodb';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { emailOTP } from 'better-auth/plugins';
import { Resend } from 'resend';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth');
log.info('Instancia de BetterAuth inicializada');

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    changePassword: {
      enabled: true,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        log.info('Enviando OTP por email', { email, type });
        try {
          await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: email,
            subject: 'Tu código de verificación',
            text: `Tu código OTP es: ${otp}`,
          });
          log.info('OTP enviado exitosamente', { email, type });
        } catch (error) {
          log.error('Error al enviar OTP por email', { email, type, error: (error as Error).message });
          throw error;
        }
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_BASE_URL,
  basePath: process.env.BETTER_AUTH_BASE_PATH,
});
