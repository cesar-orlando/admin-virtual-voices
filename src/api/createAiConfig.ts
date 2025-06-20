import type { UserProfile, AIConfig } from '../types';

// src/api/saveAiConfig.ts
export async function createAiConfig(config: AIConfig, user: UserProfile) {
  console.log(config)
  const response = await fetch(`http://localhost:3001/api/ia-configs/${user.c_name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('No se pudo guardar la configuración de AI');
  return response.json();
}