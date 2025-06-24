import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import Logo from '../assets/VirtualVoice.svg'

export default function Loading({ message = 'Cargando...', overlay = false, size = 40 }) {
  return (
    <Box
      sx={{
        position: overlay ? 'fixed' : 'relative',
        top: overlay ? 0 : 'auto',
        left: overlay ? 0 : 'auto',
        width: overlay ? '100vw' : '100%',
        height: overlay ? '100vh' : '100%',
        zIndex: overlay ? 2000 : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: overlay ? 'rgba(255,255,255,0.18)' : 'none',
        backdropFilter: overlay ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: overlay ? 'blur(14px)' : 'none',
        flexDirection: 'column',
      }}
    >
      <Box
        component="img"
        src={Logo}
        alt="Virtual Voices Logo"
        sx={{
          width: 180,
          height: 180,
          zIndex: 1,
          position: 'relative',
          filter: 'drop-shadow(0 2px 8px #8B5CF6aa)',
        }}
      />
      <CircularProgress size={size} thickness={5} sx={{ color: '#8B5CF6', marginTop: 2 }} />
      <Typography
        variant="h6"
        sx={{
          color: '#8B5CF6',
          fontWeight: 700,
          letterSpacing: 1,
          fontFamily: 'Montserrat, Arial, sans-serif',
          textAlign: 'center',
        }}
      >
        {message}
      </Typography>
    </Box>
  )
}
