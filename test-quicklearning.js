// Script para simular un usuario de Quick Learning
console.log('=== TESTING QUICK LEARNING USER ===');

// Simular un usuario de Quick Learning
const quickLearningUser = {
  id: 'ql-test-user-1',
  name: 'Test Quick Learning User',
  email: 'test@quicklearning.com',
  role: 'Admin',
  companySlug: 'quicklearning',
  status: 'active'
};

const quickLearningToken = 'ql-test-token-123';

const quickLearningCompany = {
  slug: 'quicklearning',
  name: 'Quick Learning',
  displayName: 'Quick Learning Enterprise',
  isEnterprise: true,
  features: {
    quickLearning: true,
    controlMinutos: true,
    elevenLabs: true,
    autoAssignment: true
  },
  database: { type: 'external' }
};

// Guardar en localStorage
localStorage.setItem('user', JSON.stringify(quickLearningUser));
localStorage.setItem('token', quickLearningToken);
localStorage.setItem('currentCompany', JSON.stringify(quickLearningCompany));

console.log('Quick Learning user saved to localStorage');
console.log('User:', quickLearningUser);
console.log('Company:', quickLearningCompany);

// Verificar que se guardó correctamente
const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
const savedCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');

console.log('Saved user matches:', JSON.stringify(savedUser) === JSON.stringify(quickLearningUser));
console.log('Saved company matches:', JSON.stringify(savedCompany) === JSON.stringify(quickLearningCompany));

// Verificar si el usuario puede acceder a Quick Learning
const canAccessQuickLearning = savedUser.companySlug === 'quicklearning';
console.log('Can access Quick Learning:', canAccessQuickLearning);

// Simular navegación a la ruta
const targetRoute = '/quicklearning/whatsapp';
console.log('Target route:', targetRoute);

// Verificar si la ruta debería ser accesible
const shouldBeAccessible = canAccessQuickLearning;
console.log('Route should be accessible:', shouldBeAccessible);

console.log('=== END TEST ===');

// Instrucciones para el usuario
console.log('');
console.log('INSTRUCCIONES:');
console.log('1. Recarga la página (F5)');
console.log('2. Deberías ver "Quick Whats" en el sidebar');
console.log('3. Haz clic en "Quick Whats"');
console.log('4. Deberías ver el dashboard de Quick Learning');
console.log('5. Revisa la consola para ver los logs de debug'); 