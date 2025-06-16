// Este archivo se mantiene por compatibilidad, pero se recomienda usar src/types/index.ts
// para nuevos desarrollos

export type { UserProfile, UserProfileToken, UserRole } from '../types'

// Mantener para retrocompatibilidad
export type UserProfileToken_Legacy = {
    id: string;
    name: string;
    email: string;
    role: string;
    token: string;
    c_name: string;
};

export type UserProfile_Legacy = {
    name: string;
    email: string;
};