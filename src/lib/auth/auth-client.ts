import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: window.location.origin as string,
});

export const { signIn, signUp, signOut, useSession } = authClient;
