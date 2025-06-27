# 🚀 Virtual Voices - Plataforma de Chatbots WhatsApp con IA

Una aplicación moderna de React + TypeScript para gestionar chatbots de WhatsApp con integración de Inteligencia Artificial.

## ✨ Características Principales

- 🤖 **Integración con IA** - Chatbots inteligentes configurables
- 📱 **WhatsApp Integration** - Conexión directa con WhatsApp Business
- 🔄 **Tiempo Real** - Socket.IO para comunicación en vivo
- 🎨 **UI Moderna** - Material-UI con tema personalizable
- 🔐 **Autenticación JWT** - Sistema de login seguro
- 📊 **Dashboard Intuitivo** - Gestión completa de sesiones
- 🌙 **Modo Oscuro/Claro** - Interfaz adaptable
- 📱 **Responsive Design** - Funciona en todos los dispositivos

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 19 + TypeScript + Vite
- **UI Library**: Material-UI v7
- **Estado**: Context API + Custom Hooks
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Forms**: React Hook Form + Yup
- **Testing**: Vitest + Testing Library
- **Tipos**: TypeScript estricto

### Mejoras Recientes ✅
- ✅ **Testing completo** con Vitest y Testing Library
- ✅ **Tipos TypeScript** completamente tipado
- ✅ **Custom Hooks** para lógica reutilizable
- ✅ **Componentes refactorizados** de 280 → 3 componentes
- ✅ **Sistema de notificaciones** mejorado
- ✅ **Variables de entorno** configurables
- ✅ **Code quality** con Prettier y ESLint

## 🚀 Instalación Rápida

### Opción 1: Script Automático
```bash
# Clonar repositorio
git clone <tu-repo-url>
cd virtual-voices

# Ejecutar configuración automática
chmod +x setup.sh
./setup.sh
```

### Opción 2: Instalación Manual
```bash
# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env

# Iniciar desarrollo
npm run dev
```

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001

# Environment
VITE_ENV=development

# App Configuration
VITE_APP_NAME="VirtualVoices Admin"
VITE_APP_VERSION="1.0.0"
```

### Configuración por Entorno

#### Desarrollo
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_ENV=development
```

#### Producción
```bash
VITE_API_BASE_URL=https://api.tuapp.com/api
VITE_SOCKET_URL=https://api.tuapp.com
VITE_ENV=production
```

#### Staging
```bash
VITE_API_BASE_URL=https://staging.api.tuapp.com/api
VITE_SOCKET_URL=https://staging.api.tuapp.com
VITE_ENV=staging
```

**⚠️ Importante**: Nunca subas el archivo `.env` al repositorio. Asegúrate de que esté en `.gitignore`.

## 📝 Comandos Disponibles

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
```

### Testing
```bash
npm run test         # Ejecutar tests
npm run test:ui      # Interfaz visual de tests
npm run test:coverage # Tests con cobertura
npm run test:run     # Ejecutar tests una vez
```

### Code Quality
```bash
npm run lint         # Ejecutar linter
npm run lint:fix     # Corregir errores automáticamente
npm run type-check   # Verificar tipos TypeScript
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Layout/           # Componentes de layout
│   │   ├── index.tsx     # Layout principal
│   │   ├── AppHeader.tsx # Barra de navegación
│   │   └── NotificationPanel.tsx # Panel de notificaciones
│   ├── WhatsappTab.tsx   # Gestión de WhatsApp
│   ├── AiConfigTab.tsx   # Configuración de IA
│   └── ...
├── hooks/                # Custom hooks
│   ├── useApi.ts         # Hook genérico para APIs
│   ├── useWhatsApp.ts    # Lógica de WhatsApp
│   └── useNotifications.ts # Sistema de notificaciones
├── pages/
│   ├── Login.tsx         # Página de login
│   └── Register.tsx      # Página de registro
├── context/
│   └── useAuth.tsx       # Contexto de autenticación
├── api/                  # Servicios de API
├── types/                # Tipos TypeScript
├── test/                 # Configuración de tests
│   ├── setup.ts          # Setup global
│   └── mocks/            # Mocks para testing
└── theme/                # Configuración de temas
```

## 🧪 Testing

El proyecto incluye testing completo con:

- **Tests unitarios** para hooks y funciones
- **Tests de componentes** con Testing Library
- **Mocking de APIs** con MSW
- **Cobertura de código** con reportes HTML

```bash
# Ejecutar todos los tests
npm run test

# Ver cobertura
npm run test:coverage

# Interfaz visual
npm run test:ui
```

## 🎨 Componentes y Hooks

### Custom Hooks Disponibles

#### `useApi<T>(apiFunction)`
Hook genérico para llamadas a APIs con manejo de loading, error y datos.

```typescript
const { data, loading, error, execute } = useApi(fetchUserData)

// Ejecutar API call
const result = await execute(userId)
```

#### `useWhatsApp(user)`
Hook específico para funcionalidades de WhatsApp.

```typescript
const { 
  sessions, 
  qrCode, 
  requestQR, 
  removeSession 
} = useWhatsApp(user)
```

#### `useNotifications()`
Sistema completo de notificaciones.

```typescript
const { 
  notifications, 
  addNotification, 
  markAsRead,
  unreadCount 
} = useNotifications()
```

## 🔧 Configuración de Desarrollo

### VSCode Extensions Recomendadas
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Material Icon Theme

### Configuración de Git Hooks
```bash
# Instalar husky para pre-commit hooks
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run lint:fix && npm run type-check"
```

## 🌟 Funcionalidades Principales

### 1. Gestión de WhatsApp
- Conexión mediante códigos QR
- Múltiples sesiones simultáneas
- Estado en tiempo real
- Gestión de mensajes

### 2. Configuración de IA
- Múltiples modelos de IA
- Prompts personalizables
- Configuración por sesión
- Respuestas automáticas

### 3. Dashboard
- Estadísticas en tiempo real
- Gestión de usuarios
- Panel de administración
- Notificaciones inteligentes

### 4. Autenticación
- Login/Register seguro
- JWT tokens
- Protección de rutas
- Gestión de sesiones

## 📊 Calidad del Código

El proyecto mantiene altos estándares de calidad:

- **TypeScript**: 95%+ tipado
- **Test Coverage**: 80%+ objetivo
- **ESLint**: Configuración estricta
- **Prettier**: Formato consistente
- **Componentes**: Máximo 100 líneas
- **Hooks**: Lógica separada de UI

## 🔄 Flujo de Desarrollo

1. **Crea una rama** para tu feature
2. **Desarrolla** con tests incluidos
3. **Ejecuta** `npm run lint:fix`
4. **Verifica** `npm run type-check`
5. **Prueba** `npm run test`
6. **Haz commit** y push
7. **Crea Pull Request**

## 🐛 Debugging

### Logs de Desarrollo
```bash
# Activar logs detallados
VITE_DEBUG=true npm run dev
```

### Testing de APIs
```bash
# Usar MSW para mocking
npm run test -- --coverage
```

## 📈 Monitoreo y Performance

- **React DevTools** para debugging
- **Lighthouse** para auditorías
- **Bundle analyzer** incluido
- **Performance metrics** configurados

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch
3. Commit con conventional commits
4. Push al branch
5. Crear Pull Request

### Conventional Commits
```bash
feat: add new WhatsApp integration
fix: resolve authentication bug
docs: update API documentation
test: add component tests
refactor: improve code structure
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo `LICENSE` para detalles.

## 📞 Soporte

- **Documentación**: `MEJORAS_IMPLEMENTADAS.md`
- **Análisis**: `PROYECTO_ANALISIS.md`
- **Issues**: GitHub Issues
- **Email**: tu-email@dominio.com

## 🎯 Roadmap

### Próximas Versiones
- [ ] Storybook para componentes
- [ ] PWA capabilities
- [ ] Internacionalización (i18n)
- [ ] CI/CD con GitHub Actions
- [ ] Docker containerization
- [ ] Analytics dashboard
- [ ] Multi-tenant support

---

**Virtual Voices v1.0.0** - Hecho con ❤️ y TypeScript

*Última actualización: ${new Date().toLocaleDateString()}*
