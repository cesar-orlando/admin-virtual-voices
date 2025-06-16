// src/api/simulateAiResponse.ts
import type { UserProfile, AIConfig } from '../types';

export async function simulateAiResponse(
  chatMessages: { from: 'user' | 'ai', text: string }[],
  aiConfig: AIConfig,
  user: UserProfile
) {
  const response = await fetch(`http://localhost:3001/api/ia-configs/testIA/${user.c_name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({messages: chatMessages, aiConfig: aiConfig})
  });
  if (!response.ok) throw new Error('No se pudo simular chat con AI');
  return response.json();
}
