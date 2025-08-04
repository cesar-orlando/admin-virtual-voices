// Script para simular login como usuario VirtualVoices
// Ejecutar en la consola del navegador

const virtualVoicesUser = {
  id: "virtual-admin-001",
  name: "Administrador VirtualVoices", 
  email: "admin@virtualvoices.com",
  role: "SuperAdmin",
  companySlug: "virtualvoices",
  status: "active"
}

const virtualVoicesToken = "virtual-voices-demo-token-2024"

// Guardar en localStorage
localStorage.setItem('user', JSON.stringify(virtualVoicesUser))
localStorage.setItem('token', virtualVoicesToken)

console.log('✅ Usuario VirtualVoices configurado!')
console.log('🔄 Recarga la página para ver los súper poderes!')
console.log('👁️ Podrás ver y gestionar tareas de TODAS las empresas!')

// Mensaje en pantalla
alert('🎯 ¡Usuario VirtualVoices configurado!\n\n✅ Recarga la página\n👑 Tendrás acceso a TODAS las empresas\n🌍 Vista global activada')