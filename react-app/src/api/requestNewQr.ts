// src/api/requestNewQr.ts

export async function requestNewQr(sessionName: string) {
    const response = await fetch('http://localhost:3001/api/whatsapp/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionName: sessionName }),
    });
    window.console.log(response)
    if (!response.ok) throw new Error('No se pudo solicitar un nuevo QR');
    return response.json();
}
