// src/api/requestNewQr.ts

import type { UserProfile } from '../types';

export async function requestNewQr(sessionName: string, user: UserProfile) {
    const response = await fetch('http://localhost:3001/api/whatsapp/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionName, c_name: user.c_name, user_id: user.id, user_name: user.name }),
    });
    window.console.log(response)
    if (!response.ok) throw new Error('No se pudo solicitar un nuevo QR');
    return response.json();
}
