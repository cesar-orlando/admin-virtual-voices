// src/api/requestNewQr.ts

export async function requestNewQr(sessionName: string) {
    const companyId = "684f69a90358ee11c4a344b7";
    const c_name = "test_company";
    const user_id="684b20f20a6d0e3c080afa0e";
    const user_name="Cesar Lopez";
    const response = await fetch('http://localhost:3001/api/whatsapp/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionName, c_name, user_id, user_name }),
    });
    window.console.log(response)
    if (!response.ok) throw new Error('No se pudo solicitar un nuevo QR');
    return response.json();
}
