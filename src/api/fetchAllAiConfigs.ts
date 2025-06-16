// src/api/fetchAllAiConfigs.ts
export async function fetchAllAiConfigs() {
  //const companyId="684f69a90358ee11c4a344b7"
  const c_name="test_company"
  const userId="684b20f20a6d0e3c080afa0e"
  const response = await fetch(`http://localhost:3001/api/ia-configs/${c_name}/${userId}`);
  if (!response.ok) throw new Error('No se pudo obtener la configuración de AI');
  return response.json();
}
