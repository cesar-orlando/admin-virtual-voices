import type { UserProfile, WhatsAppSession } from '../types';

// src/api/saveAiConfig.ts
export async function deleteSession(session: Partial<WhatsAppSession>, user: UserProfile) {
    const response = await fetch(`http://localhost:3001/api/whatsapp/session/${user.c_name}/${session._id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de la sesión');
  return response.json();
}