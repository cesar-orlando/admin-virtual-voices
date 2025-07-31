import React from 'react'
import { Container, Typography, Box, Paper, Divider } from '@mui/material'
import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            Política de Privacidad – Virtual Voices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Última actualización: {currentDate}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="body1" paragraph>
          En Virtual Voices, valoramos y respetamos la privacidad de los usuarios y las empresas que confían en nuestros servicios. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos la información al utilizar nuestra aplicación vinculada a plataformas de Meta (como Facebook Messenger, Instagram Direct, entre otros).
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            1. ¿Qué información recopilamos?
          </Typography>
          <Typography variant="body1" paragraph>
            Al vincular tu cuenta de Meta con nuestra aplicación, podemos recopilar:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">
              Información pública de tu página de Facebook o cuenta de Instagram.
            </Typography>
            <Typography component="li" variant="body1">
              ID de la página o cuenta asociada.
            </Typography>
            <Typography component="li" variant="body1">
              Contenido de los mensajes enviados o recibidos a través de Messenger o Instagram Direct.
            </Typography>
            <Typography component="li" variant="body1">
              Nombre y foto de perfil del usuario que inicia la conversación.
            </Typography>
            <Typography component="li" variant="body1">
              Estadísticas básicas de uso (mensajes enviados, recibidos, abiertos).
            </Typography>
          </Box>
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>No accedemos ni almacenamos tus credenciales de inicio de sesión personal.</strong>
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            2. ¿Cómo usamos esta información?
          </Typography>
          <Typography variant="body1" paragraph>
            La información recopilada se utiliza exclusivamente para:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">
              Automatizar respuestas a mensajes entrantes en nombre de tu empresa.
            </Typography>
            <Typography component="li" variant="body1">
              Ofrecer una experiencia conversacional mejorada mediante inteligencia artificial.
            </Typography>
            <Typography component="li" variant="body1">
              Proporcionar herramientas de análisis para mejorar la atención al cliente.
            </Typography>
            <Typography component="li" variant="body1">
              Permitir el uso de asistentes inteligentes que respondan en tiempo real.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            3. ¿Con quién compartimos tu información?
          </Typography>
          <Typography variant="body1" paragraph>
            No compartimos, vendemos ni cedemos tu información a terceros. La información se utiliza únicamente para prestar el servicio de automatización contratado. Solo compartimos información si es requerido por ley o si el cliente así lo solicita.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            4. Seguridad
          </Typography>
          <Typography variant="body1" paragraph>
            Implementamos medidas de seguridad técnicas y administrativas para proteger tus datos contra accesos no autorizados, pérdida o alteración. Usamos servidores cifrados y protocolos seguros (HTTPS, OAuth, etc.).
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            5. Retención de datos
          </Typography>
          <Typography variant="body1" paragraph>
            Los datos se almacenan durante el tiempo necesario para prestar el servicio o hasta que el cliente solicite su eliminación. Puedes solicitarnos en cualquier momento la eliminación de los datos relacionados con tu cuenta.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            6. Derechos del usuario
          </Typography>
          <Typography variant="body1" paragraph>
            Como usuario o administrador de una página, puedes:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">
              Solicitar el acceso, corrección o eliminación de tus datos.
            </Typography>
            <Typography component="li" variant="body1">
              Desvincular tu página de nuestra App en cualquier momento desde Meta Business Suite.
            </Typography>
            <Typography component="li" variant="body1">
              Revocar permisos desde la configuración de privacidad de tu cuenta de Facebook.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            7. Contacto
          </Typography>
          <Typography variant="body1" paragraph>
            Para cualquier consulta relacionada con esta Política de Privacidad, puedes contactarnos en:
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Email:</strong> cesarorlando@virtualvoices.com
          </Typography>
        </Box>

        <Divider sx={{ mt: 4, mb: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
              Volver al inicio de sesión
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}