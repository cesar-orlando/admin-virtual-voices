// src/api/simulateAiResponse.ts
export async function simulateAiResponse(chatMessages: any) {
  const response = await fetch('http://localhost:3001/api/ia-configs/testIA/test_company', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatMessages)
  });
  if (!response.ok) throw new Error('No se pudo simular chat con AI');
  return response.json();
}
