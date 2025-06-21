import type { UserProfile } from '../types';

export async function sendMessages(sessionId: string, user: UserProfile, phone: string, message: string) {
  const response = await fetch(
    `http://localhost:3001/api/whatsapp/session/${user.c_name}/${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    }
  );
  if (!response.ok) throw new Error('No se pudo mandar el mensaje');
  return response.json();
}