import type { UserProfile } from '../types';

export async function fetchCompanyUsers(user: UserProfile) {
    const response = await fetch(`http://localhost:3001/api/users/${user.c_name}`);
    if (!response.ok) throw new Error('No se pudo obtener los datos del usuario');
    return response.json();
}