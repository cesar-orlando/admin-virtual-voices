import type { UserProfile, AIConfig } from '../types';

// src/api/saveAiConfig.ts
export async function updateAiConfig(config: AIConfig, user: UserProfile) {
  const response = await fetch(`http://localhost:3001/api/ia-configs/${user.c_name}/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de AI');
  return response.json();
}