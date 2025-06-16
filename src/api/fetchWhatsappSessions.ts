// src/api/fetchWhatsappSessions.ts

import type { UserProfile } from '../types';

export async function fetchSessions(user: UserProfile) {
  const response = await fetch(`http://localhost:3001/api/whatsapp/session/${user.c_name}/${user.id}`);
  if (!response.ok) throw new Error('No se pudieron obtener las sesiones');
  return response.json();
}
