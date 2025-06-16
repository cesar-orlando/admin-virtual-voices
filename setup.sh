#!/bin/bash

echo "🚀 Configurando Virtual Voices - Mejoras implementadas"
echo "=================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está disponible."
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "🔧 Creando archivo .env..."
    cp .env.example .env
    echo "✅ Archivo .env creado desde .env.example"
else
    echo "✅ Archivo .env ya existe"
fi

# Ejecutar type-check
echo "🔍 Verificando tipos TypeScript..."
npm run type-check

# Ejecutar linter
echo "🧹 Ejecutando linter..."
npm run lint

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📝 Comandos disponibles:"
echo "  npm run dev          - Iniciar servidor de desarrollo"
echo "  npm run build        - Construir para producción"
echo "  npm run test         - Ejecutar tests"
echo "  npm run test:ui      - Ejecutar tests con interfaz"
echo "  npm run test:coverage - Ejecutar tests con cobertura"
echo "  npm run lint         - Ejecutar linter"
echo "  npm run lint:fix     - Corregir errores de linter"
echo "  npm run type-check   - Verificar tipos TypeScript"
echo ""
echo "🌟 Para iniciar el desarrollo:"
echo "  npm run dev"
echo ""