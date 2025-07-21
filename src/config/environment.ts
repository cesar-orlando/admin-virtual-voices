// 🏗️ Configuración robusta de entorno
// Este archivo maneja todas las variables de entorno de manera segura

interface EnvironmentConfig {
  // API Configuration
  API_BASE_URL: string;
  SOCKET_URL: string;
  
  // App Configuration
  APP_NAME: string;
  APP_VERSION: string;
  DEBUG_MODE: boolean;
  
  // Features
  MULTI_COMPANY_ENABLED: boolean;
  ENTERPRISE_MODE: boolean;
  QUICK_LEARNING_INTEGRATION: boolean;
  
  // Timeouts
  API_TIMEOUT: number;
  SOCKET_TIMEOUT: number;
  AUTO_REFRESH_INTERVAL: number;
}

// Función para obtener variable de entorno con fallback
function getEnvVar(key: string, fallback: string): string {
  const value = import.meta.env[key];
  if (value === undefined || value === null || value === '') {
    console.warn(`⚠️ Variable de entorno ${key} no encontrada, usando fallback: ${fallback}`);
    return fallback;
  }
  return value;
}

// Función para obtener variable booleana
function getBoolEnvVar(key: string, fallback: boolean): boolean {
  const value = getEnvVar(key, fallback.toString());
  return value.toLowerCase() === 'true';
}

// Función para obtener variable numérica
function getNumberEnvVar(key: string, fallback: number): number {
  const value = getEnvVar(key, fallback.toString());
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`⚠️ Variable de entorno ${key} no es un número válido, usando fallback: ${fallback}`);
    return fallback;
  }
  return parsed;
}

// Detectar el entorno actual
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const isTest = import.meta.env.MODE === 'test';

console.log(`🌍 Entorno detectado: ${import.meta.env.MODE} (DEV: ${isDevelopment}, PROD: ${isProduction})`);

// Configuración por defecto según el entorno
const getDefaultConfig = (): EnvironmentConfig => {
  if (isDevelopment) {
    return {
      API_BASE_URL: 'http://localhost:3001/api',
      SOCKET_URL: 'http://localhost:3001',
      APP_NAME: 'Virtual Voices (Dev)',
      APP_VERSION: '1.0.0-dev',
      DEBUG_MODE: true,
      MULTI_COMPANY_ENABLED: true,
      ENTERPRISE_MODE: true,
      QUICK_LEARNING_INTEGRATION: true,
      API_TIMEOUT: 30000,
      SOCKET_TIMEOUT: 20000,
      AUTO_REFRESH_INTERVAL: 30000,
    };
  }
  
  if (isProduction) {
    return {
      API_BASE_URL: 'https://api.virtualvoices.com.mx/api',
      SOCKET_URL: 'https://api.virtualvoices.com.mx',
      APP_NAME: 'Virtual Voices',
      APP_VERSION: '1.0.0',
      DEBUG_MODE: false,
      MULTI_COMPANY_ENABLED: true,
      ENTERPRISE_MODE: true,
      QUICK_LEARNING_INTEGRATION: true,
      API_TIMEOUT: 30000,
      SOCKET_TIMEOUT: 20000,
      AUTO_REFRESH_INTERVAL: 60000,
    };
  }
  
  // Fallback para otros entornos
  return {
    API_BASE_URL: 'http://localhost:3001/api',
    SOCKET_URL: 'http://localhost:3001',
    APP_NAME: 'Virtual Voices',
    APP_VERSION: '1.0.0',
    DEBUG_MODE: false,
    MULTI_COMPANY_ENABLED: true,
    ENTERPRISE_MODE: true,
    QUICK_LEARNING_INTEGRATION: true,
    API_TIMEOUT: 30000,
    SOCKET_TIMEOUT: 20000,
    AUTO_REFRESH_INTERVAL: 30000,
  };
};

// Configuración final
export const config: EnvironmentConfig = {
  // API Configuration
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', getDefaultConfig().API_BASE_URL),
  SOCKET_URL: getEnvVar('VITE_SOCKET_URL', getDefaultConfig().SOCKET_URL),
  
  // App Configuration
  APP_NAME: getEnvVar('VITE_APP_NAME', getDefaultConfig().APP_NAME),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', getDefaultConfig().APP_VERSION),
  DEBUG_MODE: getBoolEnvVar('VITE_DEBUG_MODE', getDefaultConfig().DEBUG_MODE),
  
  // Features
  MULTI_COMPANY_ENABLED: getBoolEnvVar('VITE_MULTI_COMPANY_ENABLED', getDefaultConfig().MULTI_COMPANY_ENABLED),
  ENTERPRISE_MODE: getBoolEnvVar('VITE_ENTERPRISE_MODE', getDefaultConfig().ENTERPRISE_MODE),
  QUICK_LEARNING_INTEGRATION: getBoolEnvVar('VITE_QUICK_LEARNING_INTEGRATION', getDefaultConfig().QUICK_LEARNING_INTEGRATION),
  
  // Timeouts
  API_TIMEOUT: getNumberEnvVar('VITE_API_TIMEOUT', getDefaultConfig().API_TIMEOUT),
  SOCKET_TIMEOUT: getNumberEnvVar('VITE_SOCKET_TIMEOUT', getDefaultConfig().SOCKET_TIMEOUT),
  AUTO_REFRESH_INTERVAL: getNumberEnvVar('VITE_AUTO_REFRESH_INTERVAL', getDefaultConfig().AUTO_REFRESH_INTERVAL),
};

// Función para validar la configuración
export function validateConfig(): void {
  const errors: string[] = [];
  
  // Validar URLs
  if (!config.API_BASE_URL) {
    errors.push('VITE_API_BASE_URL es requerida');
  }
  
  if (!config.SOCKET_URL) {
    errors.push('VITE_SOCKET_URL es requerida');
  }
  
  // Validar timeouts
  if (config.API_TIMEOUT < 1000) {
    errors.push('VITE_API_TIMEOUT debe ser al menos 1000ms');
  }
  
  if (config.SOCKET_TIMEOUT < 1000) {
    errors.push('VITE_SOCKET_TIMEOUT debe ser al menos 1000ms');
  }
  
  if (errors.length > 0) {
    console.error('❌ Errores de configuración:', errors);
    throw new Error(`Configuración inválida: ${errors.join(', ')}`);
  }
  
  console.log('✅ Configuración validada correctamente');
}

// Función para obtener headers específicos según el entorno
export function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Headers específicos para ngrok (solo en desarrollo)
  if (isDevelopment && config.SOCKET_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  return headers;
}

// Función para obtener configuración de Socket.IO
export function getSocketConfig() {
  const baseConfig = {
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: true,
    timeout: config.SOCKET_TIMEOUT,
    forceNew: true,
  };
  
  // Configuración específica para ngrok
  if (isDevelopment && config.SOCKET_URL.includes('ngrok')) {
    return {
      ...baseConfig,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
    };
  }
  
  return baseConfig;
}

// Log de configuración (solo en desarrollo)
if (config.DEBUG_MODE) {
  console.log('🔧 Configuración cargada:', {
    API_BASE_URL: config.API_BASE_URL,
    SOCKET_URL: config.SOCKET_URL,
    APP_NAME: config.APP_NAME,
    DEBUG_MODE: config.DEBUG_MODE,
    MULTI_COMPANY_ENABLED: config.MULTI_COMPANY_ENABLED,
    ENTERPRISE_MODE: config.ENTERPRISE_MODE,
    QUICK_LEARNING_INTEGRATION: config.QUICK_LEARNING_INTEGRATION,
  });
}

// Validar configuración al importar
validateConfig();

export default config; 