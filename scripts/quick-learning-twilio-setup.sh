#!/bin/bash

# 🚀 Quick Learning Twilio WhatsApp Setup Script
# Autor: Equipo de Desarrollo
# Descripción: Script automatizado para configurar e instalar el sistema frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
ERROR="❌"
INFO="ℹ️"
WARNING="⚠️"
ROCKET="🚀"
GEAR="⚙️"
TEST="🧪"

# Functions
print_header() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                🚀 Quick Learning Twilio WhatsApp              ║"
    echo "║                     Frontend Setup Script                     ║"
    echo "║                                                               ║"
    echo "║  Este script instalará y configurará todo lo necesario       ║"
    echo "║  para el sistema de WhatsApp con NatalIA                     ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}${GEAR} $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${CYAN}${INFO} $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node() {
    print_step "Verificando Node.js..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            print_success "Node.js $NODE_VERSION encontrado"
        else
            print_error "Node.js $NODE_VERSION es muy antiguo. Se requiere Node.js 16+"
            print_info "Instala Node.js desde: https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Node.js no está instalado"
        print_info "Instala Node.js desde: https://nodejs.org/"
        exit 1
    fi
}

# Check npm
check_npm() {
    print_step "Verificando npm..."
    
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION encontrado"
    else
        print_error "npm no está instalado"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Instalando dependencias principales..."
    
    # Main dependencies
    npm install @mui/material @mui/icons-material @emotion/react @emotion/styled axios
    
    if [ $? -eq 0 ]; then
        print_success "Dependencias principales instaladas"
    else
        print_error "Error instalando dependencias principales"
        exit 1
    fi
    
    print_step "Instalando dependencias de desarrollo..."
    
    # Dev dependencies for testing
    npm install --save-dev vitest msw @testing-library/react @testing-library/jest-dom @types/react @types/react-dom
    
    if [ $? -eq 0 ]; then
        print_success "Dependencias de desarrollo instaladas"
    else
        print_warning "Algunas dependencias de desarrollo no se pudieron instalar"
    fi
}

# Create environment file
setup_environment() {
    print_step "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        cat > .env << EOL
# Quick Learning Twilio Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001

# Debug settings (development only)
VITE_DEBUG_MODE=true
VITE_AUTO_REFRESH_INTERVAL=30000

# Twilio Settings (these will be set by backend)
# VITE_TWILIO_PHONE_NUMBER=+5213341610750
EOL
        print_success "Archivo .env creado"
    else
        print_info "Archivo .env ya existe"
    fi
}

# Test API connection
test_api_connection() {
    print_step "Probando conexión con API..."
    
    API_URL="${VITE_API_BASE_URL:-http://localhost:3001/api}"
    
    # Check if backend is running
    if curl -s "$API_URL/quicklearning/twilio/status" > /dev/null 2>&1; then
        print_success "API backend está respondiendo"
    else
        print_warning "API backend no está disponible en $API_URL"
        print_info "Asegúrate de que el backend esté ejecutándose"
        print_info "El frontend funcionará, pero necesitarás el backend para datos reales"
    fi
}

# Run tests
run_tests() {
    print_step "Ejecutando pruebas..."
    
    if command_exists npm && [ -f package.json ]; then
        # Check if test script exists
        if npm run test --silent > /dev/null 2>&1; then
            print_success "Todas las pruebas pasaron"
        else
            print_warning "Algunas pruebas fallaron o no están configuradas"
            print_info "Configura las pruebas en package.json si es necesario"
        fi
    else
        print_warning "No se pueden ejecutar pruebas automáticamente"
    fi
}

# Build project
build_project() {
    print_step "Construyendo proyecto..."
    
    if npm run build > /dev/null 2>&1; then
        print_success "Proyecto construido exitosamente"
    else
        print_error "Error construyendo el proyecto"
        print_info "Ejecuta 'npm run build' manualmente para ver los errores"
    fi
}

# Create scripts
create_helpful_scripts() {
    print_step "Creando scripts útiles..."
    
    # Create test script for Twilio
    cat > scripts/test-twilio.js << 'EOL'
#!/usr/bin/env node

// 🧪 Script de prueba para Quick Learning Twilio
const axios = require('axios');

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function testTwilioEndpoints() {
    console.log('🧪 Probando endpoints de Quick Learning Twilio...\n');
    
    const endpoints = [
        { name: 'Estado del servicio', url: '/quicklearning/twilio/status' },
        { name: 'Chats activos', url: '/quicklearning/chats/active' },
        { name: 'Estadísticas dashboard', url: '/quicklearning/dashboard/stats' },
        { name: 'Historial de mensajes', url: '/quicklearning/twilio/history?limit=5' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`⏳ Probando: ${endpoint.name}...`);
            const response = await axios.get(`${API_BASE}${endpoint.url}`, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 200) {
                console.log(`✅ ${endpoint.name}: OK`);
                console.log(`   Datos: ${JSON.stringify(response.data).substring(0, 100)}...\n`);
            } else {
                console.log(`⚠️  ${endpoint.name}: Status ${response.status}\n`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}\n`);
        }
    }
    
    console.log('🎉 Prueba completada!');
}

testTwilioEndpoints().catch(console.error);
EOL

    chmod +x scripts/test-twilio.js
    print_success "Script de prueba creado en scripts/test-twilio.js"
    
    # Create development start script
    cat > scripts/dev-start.sh << 'EOL'
#!/bin/bash

# 🚀 Script de inicio para desarrollo
echo "🚀 Iniciando Quick Learning Twilio WhatsApp Dashboard..."

# Check if backend is running
API_URL="${VITE_API_BASE_URL:-http://localhost:3001/api}"

echo "📡 Verificando backend en $API_URL..."
if curl -s "$API_URL/quicklearning/twilio/status" > /dev/null 2>&1; then
    echo "✅ Backend está ejecutándose"
else
    echo "⚠️  Backend no detectado. El frontend se iniciará pero necesitarás el backend para datos reales."
fi

echo "🎯 Iniciando servidor de desarrollo..."
npm run dev
EOL

    chmod +x scripts/dev-start.sh
    print_success "Script de desarrollo creado en scripts/dev-start.sh"
}

# Show final instructions
show_final_instructions() {
    print_step "Instrucciones finales..."
    
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 ¡INSTALACIÓN COMPLETA!                 ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${CYAN}📋 Próximos pasos:${NC}"
    echo ""
    echo -e "${YELLOW}1. Configurar el backend:${NC}"
    echo "   • Asegúrate de que tu API backend esté ejecutándose"
    echo "   • Verifica que los endpoints de Twilio estén funcionando"
    echo ""
    echo -e "${YELLOW}2. Iniciar el frontend:${NC}"
    echo "   • Desarrollo: npm run dev"
    echo "   • O usar: ./scripts/dev-start.sh"
    echo ""
    echo -e "${YELLOW}3. Probar el sistema:${NC}"
    echo "   • Ejecutar: node scripts/test-twilio.js"
    echo "   • Abrir: http://localhost:5173/quicklearning/whatsapp"
    echo ""
    echo -e "${YELLOW}4. Archivos importantes:${NC}"
    echo "   • Dashboard: src/pages/QuickLearningDashboard.tsx"
    echo "   • Historial: src/components/QuickLearningMessageHistory.tsx"
    echo "   • Hook: src/hooks/useQuickLearningTwilio.ts"
    echo "   • Servicios: src/api/servicios/quickLearningTwilioServices.ts"
    echo ""
    echo -e "${GREEN}📚 Documentación completa: QUICK_LEARNING_TWILIO_FRONTEND_README.md${NC}"
    echo ""
}

# Create directory structure
create_directories() {
    print_step "Creando estructura de directorios..."
    
    mkdir -p scripts
    mkdir -p src/types
    mkdir -p src/api/servicios
    mkdir -p src/hooks
    mkdir -p src/pages
    mkdir -p src/components
    mkdir -p src/test
    
    print_success "Estructura de directorios creada"
}

# Check if files exist
check_implementation_files() {
    print_step "Verificando archivos de implementación..."
    
    files=(
        "src/types/quicklearning.ts"
        "src/api/servicios/quickLearningTwilioServices.ts"
        "src/hooks/useQuickLearningTwilio.ts"
        "src/pages/QuickLearningDashboard.tsx"
        "src/components/QuickLearningMessageHistory.tsx"
        "src/test/quickLearningTwilio.test.ts"
    )
    
    all_exist=true
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_warning "✗ $file (falta)"
            all_exist=false
        fi
    done
    
    if [ "$all_exist" = true ]; then
        print_success "Todos los archivos de implementación están presentes"
    else
        print_warning "Algunos archivos de implementación faltan"
        print_info "Revisa la documentación para crear los archivos faltantes"
    fi
}

# Main execution
main() {
    print_header
    
    check_node
    check_npm
    create_directories
    check_implementation_files
    install_dependencies
    setup_environment
    create_helpful_scripts
    test_api_connection
    build_project
    run_tests
    show_final_instructions
    
    echo -e "\n${GREEN}${ROCKET} ¡Setup completado! Quick Learning Twilio WhatsApp está listo!${NC}\n"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "🚀 Quick Learning Twilio WhatsApp Setup Script"
        echo ""
        echo "Uso: $0 [opciones]"
        echo ""
        echo "Opciones:"
        echo "  --help, -h     Mostrar esta ayuda"
        echo "  --test-only    Solo ejecutar pruebas"
        echo "  --deps-only    Solo instalar dependencias"
        echo "  --build-only   Solo construir el proyecto"
        echo ""
        echo "Sin argumentos: Ejecutar setup completo"
        exit 0
        ;;
    --test-only)
        print_header
        run_tests
        ;;
    --deps-only)
        print_header
        check_node
        check_npm
        install_dependencies
        ;;
    --build-only)
        print_header
        build_project
        ;;
    *)
        main
        ;;
esac