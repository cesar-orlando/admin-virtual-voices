// Script de debug para verificar el estado del usuario
console.log('=== DEBUG USER STATE ===');

// Verificar localStorage
const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = localStorage.getItem('token');
const currentCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');

console.log('User from localStorage:', user);
console.log('Token from localStorage:', token);
console.log('CurrentCompany from localStorage:', currentCompany);

// Verificar si el usuario es de Quick Learning
const isQuickLearning = user.companySlug === 'quicklearning';
console.log('Is Quick Learning user:', isQuickLearning);

// Verificar si el usuario tiene los campos necesarios
console.log('User has companySlug:', !!user.companySlug);
console.log('User has id:', !!user.id);
console.log('User has name:', !!user.name);
console.log('User has email:', !!user.email);

// Verificar la ruta actual
console.log('Current pathname:', window.location.pathname);

// Verificar si estamos en la ruta de Quick Learning
const isQuickLearningRoute = window.location.pathname === '/quicklearning/whatsapp';
console.log('Is Quick Learning route:', isQuickLearningRoute);

console.log('=== END DEBUG ==='); 