# Nueva Estructura de API - Virtual Voices

## 📁 Estructura Reorganizada

La API ha sido completamente reestructurada siguiendo mejores prácticas:

```
src/api/
├── axios.ts              # Configuración centralizada de Axios
└── servicios/           # Servicios organizados por funcionalidad
    ├── index.ts         # Exportaciones centralizadas
    ├── authServices.ts  # Servicios de autenticación
    ├── userServices.ts  # Servicios de usuario y empresa
    ├── aiConfigServices.ts  # Servicios de configuración AI
    └── whatsappServices.ts  # Servicios de WhatsApp
```

## 🔧 Configuración por Entornos

### Scripts de Package.json
- `yarn dev` - Desarrollo (localhost:3001)
- `yarn qa` - Ambiente de QA
- `yarn prod` - Producción

### Variables de Entorno
- `.env.development` - Para desarrollo local
- `.env.qa` - Para ambiente de testing
- `.env.production` - Para producción

## 📋 Servicios Disponibles

### 🔐 AuthServices (`authServices.ts`)
- `loginAPI(email, password)` - Iniciar sesión
- `registerAPI(name, email, password, c_name)` - Registro de usuario

### 👥 UserServices (`userServices.ts`)
- `updateUser(name, email, password, c_name)` - Actualizar usuario
- `fetchCompanyUsers(user)` - Obtener usuarios de la empresa
- `fetchClientData(user)` - Obtener datos del cliente

### 🤖 AI Config Services (`aiConfigServices.ts`)
- `createAiConfig(config, user)` - Crear configuración AI
- `fetchAllAiConfigs(user)` - Obtener todas las configuraciones
- `updateAiConfig(config, user)` - Actualizar configuración
- `deleteAiConfig(configId, user)` - Eliminar configuración
- `simulateAiResponse(user, message, configId)` - Simular respuesta AI

### 📱 WhatsApp Services (`whatsappServices.ts`)
- `fetchSessions(user)` - Obtener sesiones de WhatsApp
- `requestNewQr(sessionName, user)` - Solicitar nuevo código QR
- `updateSession(update, user)` - Actualizar sesión
- `deleteSession(sessionId, user)` - Eliminar sesión
- `fetchMessages(user)` - Obtener mensajes
- `sendMessages(sessionId, user, phone, message)` - Enviar mensaje

## 🚀 Cómo Usar

### Importación Simplificada
```typescript
// Antes (múltiples imports)
import { loginAPI } from "../api/authServices";
import { fetchSessions } from "../api/fetchWhatsappSessions";
import { createAiConfig } from "../api/createAiConfig";

// Ahora (import centralizado)
import { loginAPI, fetchSessions, createAiConfig } from "../api/servicios";
```

### Configuración de Axios
```typescript
// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Token automático en todas las requests
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🔄 Migración Realizada

### Cambios Principales:
1. ✅ Consolidación de archivos API dispersos
2. ✅ Configuración centralizada de Axios
3. ✅ Variables de entorno por ambiente
4. ✅ Eliminación de código duplicado
5. ✅ Imports optimizados
6. ✅ Estructura escalable

### URLs por Entorno:
- **Desarrollo**: `http://localhost:3001/api`
- **QA**: `https://api-qa.virtualvoices.com.mx/api`
- **Producción**: `https://api.virtualvoices.com.mx/api`

## 🎯 Beneficios

- **Mantenibilidad**: Código más organizado y fácil de mantener
- **Escalabilidad**: Estructura que crece con el proyecto
- **Desarrollo**: Separación clara de entornos
- **Performance**: Eliminación de imports y código no utilizado
- **Consistency**: API calls consistentes usando Axios
- **Security**: Manejo automático de tokens de autenticación

## 🚨 Notas Importantes

- Todos los archivos antiguos han sido eliminados
- Las importaciones se actualizaron automáticamente
- Los archivos `.env.*` están en `.gitignore`
- La configuración de Axios maneja automáticamente la autenticación