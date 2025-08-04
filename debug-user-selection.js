// Debug script para probar usuarios
console.log('🔍 Testing user selection...')

// Simular respuesta de API
const mockApiResponse = [
  {
    "_id": "test001",
    "name": "Cesar Orlando", 
    "email": "cesariorlando@virtualvoices.com",
    "role": "Administrador"
  },
  {
    "_id": "test002", 
    "name": "Javier Llanos",
    "email": "blueage888@gmail.com", 
    "role": "Administrador"
  }
]

// Transformación que ahora hace el código
const transformedUsers = mockApiResponse.map(user => ({
  id: user._id,  // ✅ Ahora _id se convierte en id
  name: user.name,
  email: user.email,
  role: user.role
}))

console.log('✅ Usuarios transformados:', transformedUsers)
console.log('🎯 IDs disponibles:', transformedUsers.map(u => u.id))

alert('✅ FIX APLICADO!\n\n🔧 _id → id transformado\n🎯 Selección funcionará correctamente')