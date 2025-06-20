import type { UserProfile, AIConfig } from '../types';

// src/api/saveAiConfig.ts
export async function deleteAiConfig(config: Partial<AIConfig>, user: UserProfile) {
  console.log(config)
  const response = await fetch(`http://localhost:3001/api/ia-configs/${user.c_name}/${user.id}/${config._id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de AI');
  return response.json();
}