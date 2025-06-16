// src/api/fetchMessages.ts

export async function fetchMessages() {
  //const companyId="684f69a90358ee11c4a344b7"
  const c_name="test_company"
  const response = await fetch(`http://localhost:3001/api/whatsapp/messages/${c_name}`);
  if (!response.ok) throw new Error('No se pudieron obtener mensajes');
  return response.json();
}
