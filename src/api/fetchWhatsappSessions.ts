// src/api/fetchWhatsappSessions.ts

export async function fetchSessions() {
  //const companyId="684f69a90358ee11c4a344b7"
  const c_name="test_company"
  const userId="684b20f20a6d0e3c080afa0e"
  const response = await fetch(`http://localhost:3001/api/whatsapp/session/${c_name}/${userId}`);
  if (!response.ok) throw new Error('No se pudieron obtener las sesiones');
  return response.json();
}
