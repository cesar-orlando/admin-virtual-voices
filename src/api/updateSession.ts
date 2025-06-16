import type { UserProfile, WhatsAppSession } from '../types';

// src/api/saveAiConfig.ts
export async function updateSession(update: Partial<WhatsAppSession>, user: UserProfile) {
    const response = await fetch(`http://localhost:3001/api/whatsapp/session/${user.c_name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de la sesión');
  return response.json();
}