// src/api/simulateAiResponse.ts
export async function simulateAiResponse(chatMessages: any, aiConfig: any) {
  const c_name="test_company"
  const response = await fetch(`http://localhost:3001/api/ia-configs/testIA/${c_name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({messages: chatMessages, aiConfig: aiConfig})
  });
  if (!response.ok) throw new Error('No se pudo simular chat con AI');
  return response.json();
}
