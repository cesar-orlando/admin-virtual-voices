# 🛠️ Sistema de Herramientas Dinámicas

## 📝 Descripción General

Se ha implementado un sistema completo de herramientas dinámicas para el CRM Virtual Voices que permite a los usuarios crear, gestionar, probar y ejecutar herramientas personalizadas que se integran con APIs externas.

## 🏗️ Arquitectura Implementada

### 📁 Estructura de Archivos

```
src/
├── types/index.ts                    # Tipos TypeScript para herramientas
├── api/servicios/toolsServices.ts    # Servicios API para herramientas
├── hooks/useTools.ts                 # Hooks React Query para estado
├── pages/
│   ├── ToolsDashboard.tsx           # Dashboard principal con estadísticas
│   ├── ToolsList.tsx                # Lista y gestión de herramientas
│   ├── ToolForm.tsx                 # Formulario multi-step crear/editar
│   └── ToolTester.tsx               # Tester en tiempo real
└── components/Sidebar.tsx            # Navegación actualizada
```

## 🎯 Funcionalidades Implementadas

### 1. Dashboard Principal (`/herramientas-dashboard`)
- **Estadísticas en tiempo real**: Total herramientas, activas, ejecuciones del día, tasa de éxito
- **Herramientas más utilizadas**: Ranking con métricas de rendimiento
- **Distribución por categorías**: Visualización de herramientas por categoría
- **Acciones rápidas**: Botones de navegación a funciones principales

### 2. Lista de Herramientas (`/herramientas`)
- **Tabla de datos completa** con filtros avanzados:
  - Búsqueda por nombre/descripción
  - Filtro por categoría
  - Filtro por estado (activo/inactivo)
  - Paginación configurable
- **Acciones por herramienta**:
  - ✏️ Editar configuración
  - ▶️ Probar funcionamiento
  - 🔄 Activar/Desactivar
  - 🗑️ Eliminar (soft delete)
- **Gestión masiva**: Activar/desactivar múltiples herramientas

### 3. Formulario Multi-Step (`/herramientas/nueva`, `/herramientas/:id/editar`)
- **Step 1: Información Básica**
  - Nombre técnico (validación regex)
  - Nombre para mostrar
  - Descripción
  - Categoría seleccionable
  
- **Step 2: Configuración de Endpoint**
  - URL del endpoint (validación URL)
  - Método HTTP (GET, POST, PUT, DELETE)
  - Timeout configurable
  - Validación en tiempo real del endpoint
  
- **Step 3: Parámetros** (implementación básica)
  - Constructor dinámico de parámetros
  - Tipos: string, number, boolean, array
  - Validaciones y valores por defecto
  
- **Step 4: Configuración de Seguridad** (implementación básica)
  - Rate limiting
  - Dominios permitidos
  - Timeouts máximos

### 4. Tester de Herramientas (`/herramientas/:id/test`, `/herramientas/tester`)
- **Selector de herramientas**: Dropdown con todas las herramientas disponibles
- **Formulario dinámico**: Genera campos según los parámetros definidos
- **Ejecución en tiempo real**: 
  - Loading states
  - Métricas de tiempo de respuesta
  - Visualización de respuesta JSON formateada
- **Historial de pruebas**: Últimas 10 ejecuciones con parámetros y resultados
- **Funciones avanzadas**:
  - Copiar al portapapeles
  - Formato JSON automático
  - Estados de éxito/error claros

## 🔧 API Services Implementados

### Core CRUD Operations
```typescript
// Crear herramienta
toolsServices.create(data: CreateToolRequest)

// Listar con filtros
toolsServices.list(c_name: string, params?: ToolListParams)

// Obtener por ID
toolsServices.getById(c_name: string, toolId: string)

// Actualizar
toolsServices.update(c_name: string, toolId: string, data: UpdateToolRequest)

// Eliminar (soft delete)
toolsServices.delete(c_name: string, toolId: string)

// Activar/Desactivar
toolsServices.toggleStatus(c_name: string, toolId: string, isActive: boolean)
```

### Testing & Execution
```typescript
// Probar herramienta
toolsServices.test(c_name: string, toolId: string, data: ToolTestRequest)

// Ejecutar herramienta individual
toolsServices.execute(data: ExecuteToolRequest)

// Ejecutar múltiples herramientas
toolsServices.batchExecute(data: BatchExecuteRequest)
```

### Analytics & Monitoring
```typescript
// Estadísticas del dashboard
toolsServices.getDashboardStats(c_name: string)

// Analytics de uso
toolsServices.getAnalytics(c_name: string, startDate?: string, endDate?: string)

// Logs de ejecución
toolsServices.getExecutionLogs(c_name: string, toolId: string, page: number, limit: number)
```

### Validation
```typescript
// Validar esquema de parámetros
validationServices.validateSchema(data: ValidateSchemaRequest)

// Validar endpoint
validationServices.validateEndpoint(data: ValidateEndpointRequest)
```

## 📊 Tipos de Datos Principales

### ITool - Estructura Principal
```typescript
interface ITool {
  _id: string;
  name: string;                    // Nombre técnico único
  displayName: string;             // Nombre para mostrar
  description: string;             // Descripción funcional
  category: string;                // Categoría de clasificación
  isActive: boolean;               // Estado activo/inactivo
  c_name: string;                  // Identificador de empresa
  createdBy: string;               // Usuario creador
  updatedBy?: string;              // Usuario última modificación
  config: ToolConfig;              // Configuración del endpoint
  parameters: ToolParameters;      // Parámetros de entrada
  responseMapping?: ResponseMapping; // Mapeo de respuestas
  security: SecurityConfig;         // Configuración de seguridad
  createdAt: Date;
  updatedAt: Date;
}
```

### ToolConfig - Configuración de Endpoint
```typescript
interface ToolConfig {
  endpoint: string;                // URL del endpoint
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>; // Headers personalizados
  authType?: 'none' | 'api_key' | 'bearer' | 'basic';
  authConfig?: {                   // Configuración de autenticación
    apiKey?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
  };
  timeout?: number;                // Timeout en milisegundos
}
```

### ToolParameters - Parámetros de Entrada
```typescript
interface ToolParameters {
  type: 'object';
  properties: Record<string, ParameterProperty>;
  required: string[];
}

interface ParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  enum?: string[];                 // Valores permitidos
  format?: string;                 // Formato específico (email, phone, etc)
  default?: any;                   // Valor por defecto
}
```

## 🎨 Navegación Implementada

Se ha actualizado el Sidebar principal para incluir:

```
Herramientas
├── Dashboard              → /herramientas-dashboard
├── Gestionar Herramientas → /herramientas
├── Nueva Herramienta      → /herramientas/nueva
└── Tester                 → /herramientas/tester
```

## 🔄 React Query Hooks

### Queries (Lectura de datos)
```typescript
const { useToolsList }        // Lista paginada con filtros
const { useToolById }         // Herramienta individual
const { useDashboardStats }   // Estadísticas del dashboard
const { useAnalytics }        // Analytics de uso
const { useExecutionLogs }    // Logs de ejecución
```

### Mutations (Modificación de datos)
```typescript
const { useCreateTool }       // Crear nueva herramienta
const { useUpdateTool }       // Actualizar herramienta
const { useDeleteTool }       // Eliminar herramienta
const { useToggleToolStatus } // Cambiar estado activo/inactivo
const { useTestTool }         // Probar herramienta
const { useExecuteTool }      // Ejecutar herramienta
const { useBatchExecuteTools } // Ejecutar múltiples herramientas
```

## 🛡️ Validaciones Implementadas

### Formularios
- **Zod Schema validation** para todos los formularios
- **Validación en tiempo real** de campos
- **Validación de URL** para endpoints
- **Validación de nombres técnicos** (regex pattern)

### Endpoint Validation
- Validación de conectividad del endpoint
- Verificación de tiempo de respuesta
- Validación de esquemas de parámetros

## 🎯 Características Destacadas

### UX/UI
- ✅ **Responsive Design**: Optimizado para móvil y desktop
- ✅ **Loading States**: Indicadores de carga en todas las operaciones
- ✅ **Error Handling**: Manejo robusto de errores con mensajes claros
- ✅ **Toast Notifications**: Feedback inmediato de acciones
- ✅ **Confirmación de eliminación**: Diálogos de confirmación

### Performance
- ✅ **React Query Caching**: Cache inteligente de datos
- ✅ **Optimistic Updates**: Actualizaciones optimistas
- ✅ **Debounced Search**: Búsqueda con debounce
- ✅ **Pagination**: Carga paginada de grandes datasets

### Desarrollo
- ✅ **TypeScript**: Tipado fuerte en toda la aplicación
- ✅ **Modular Architecture**: Separación clara de responsabilidades
- ✅ **Reusable Components**: Componentes reutilizables
- ✅ **Error Boundaries**: Manejo de errores a nivel de componente

## 🚀 Endpoints de Backend Requeridos

El frontend está preparado para trabajar con estos endpoints de backend:

```
POST   /api/tools                           # Crear herramienta
GET    /api/tools/{c_name}                  # Listar herramientas
GET    /api/tools/{c_name}/{tool_id}        # Obtener herramienta
PUT    /api/tools/{c_name}/{tool_id}        # Actualizar herramienta
DELETE /api/tools/{c_name}/{tool_id}        # Eliminar herramienta
PATCH  /api/tools/{c_name}/{tool_id}/status # Cambiar estado
POST   /api/tools/{c_name}/{tool_id}/test   # Probar herramienta
POST   /api/tools/execute                   # Ejecutar herramienta
POST   /api/tools/batch-execute             # Ejecutar múltiples
GET    /api/tools/analytics/{c_name}        # Analytics
GET    /api/tools/logs/{c_name}/{tool_id}   # Logs de ejecución
POST   /api/tools/validate-schema           # Validar esquema
POST   /api/tools/validate-endpoint         # Validar endpoint
```

## 📈 Próximas Mejoras Sugeridas

### Funcionalidades Adicionales
1. **Analytics avanzados** con gráficos de Recharts
2. **Categorías personalizadas** - CRUD completo
3. **Templates de herramientas** predefinidos
4. **Import/Export** de configuraciones
5. **Versionado** de herramientas
6. **Scheduled execution** - ejecución programada
7. **Webhooks** para notificaciones
8. **Rate limiting visual** - gráficos de uso

### Mejoras Técnicas
1. **Tests unitarios** con Jest/RTL
2. **Storybook** para documentación de componentes
3. **Error monitoring** con Sentry
4. **Performance monitoring**
5. **Internacionalización (i18n)**

## 🔗 Integración con Sistemas Existentes

El sistema de herramientas se integra perfectamente con:
- ✅ Sistema de autenticación existente
- ✅ Navegación y layout actual
- ✅ Tema y diseño Material-UI
- ✅ Configuración de React Query
- ✅ Manejo de errores global

## 📞 Soporte y Documentación

Para cualquier duda sobre la implementación:
1. Revisar los tipos TypeScript en `src/types/index.ts`
2. Consultar los servicios API en `src/api/servicios/toolsServices.ts`
3. Examinar los hooks en `src/hooks/useTools.ts`
4. Revisar las páginas implementadas en `src/pages/`

---

**Estado**: ✅ Implementación básica completa y funcional
**Versión**: 1.0.0
**Última actualización**: Diciembre 2024