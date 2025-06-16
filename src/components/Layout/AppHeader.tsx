import React from 'react'
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Switch as MuiSwitch,
  Badge,
  Tooltip,
  Fade,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import type { UserProfile, NotificationState } from '../../types'
import type { Theme } from '@mui/material/styles'

interface AppHeaderProps {
  user: UserProfile
  notifications: NotificationState[]
  mode: 'light' | 'dark'
  anchorEl: null | HTMLElement
  onDrawerToggle: () => void
  onProfileClick: (event: React.MouseEvent<HTMLElement>) => void
  onMenuClose: () => void
  onModeChange: () => void
  onNotificationsToggle: () => void
  onLogout: () => void
  theme: Theme
}

export function AppHeader({
  user,
  notifications,
  mode,
  anchorEl,
  onDrawerToggle,
  onProfileClick,
  onMenuClose,
  onModeChange,
  onNotificationsToggle,
  onLogout,
  theme
}: AppHeaderProps) {
  const menuOpen = Boolean(anchorEl)

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1201,
          background: theme.palette.mode === 'dark'
            ? 'rgba(30,30,40,0.92)'
            : 'rgba(255,255,255,0.92)',
          color: theme.palette.text.primary,
          borderBottom: "2px solid #8B5CF6",
          backdropFilter: "blur(16px)",
          boxShadow: '0 4px 24px #8B5CF655',
          transition: 'background 0.5s',
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Menú hamburguesa solo en móvil */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={onDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
              aria-label="Abrir menú lateral"
            >
              <MenuIcon />
            </IconButton>
            
            {/* Logo y nombre */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #E05EFF 0%, #8B5CF6 60%, #3B82F6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px #8B5CF6AA",
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: 1 }}>
                  V
                </Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  letterSpacing: 2,
                  fontFamily: 'Montserrat, Arial, sans-serif',
                }}
              >
                VIRTUAL VOICES
              </Typography>
            </Box>
          </Box>

          {/* Header derecho: Notificaciones, Switch de tema, usuario, avatar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Bell de notificaciones */}
            <Tooltip title="Notificaciones">
              <IconButton 
                color="inherit" 
                onClick={onNotificationsToggle} 
                aria-label="Ver notificaciones"
              >
                <Badge 
                  badgeContent={notifications.length} 
                  color="secondary" 
                  variant="dot" 
                  overlap="circular"
                >
                  <NotificationsIcon sx={{ 
                    fontSize: 26, 
                    color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6' 
                  }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Switch de tema */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LightModeIcon sx={{ 
                color: mode === 'light' ? '#E05EFF' : '#BDBDBD', 
                fontSize: 22, 
                transition: 'color 0.3s' 
              }} />
              <MuiSwitch
                checked={mode === 'dark'}
                onChange={onModeChange}
                color="secondary"
                inputProps={{ 'aria-label': 'Cambiar modo de tema' }}
                sx={{
                  '& .MuiSwitch-thumb': {
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #E05EFF 100%)',
                    transition: 'background 0.3s',
                  },
                }}
              />
              <DarkModeIcon sx={{ 
                color: mode === 'dark' ? '#8B5CF6' : '#BDBDBD', 
                fontSize: 22, 
                transition: 'color 0.3s' 
              }} />
            </Box>

            {/* Usuario y avatar */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
              onClick={onProfileClick}
              aria-label="Abrir menú de usuario"
            >
              <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {user?.name || "Usuario"}
              </Typography>
              <Avatar sx={{
                bgcolor: "#8B5CF6",
                width: 36,
                height: 36,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px #8B5CF6AA',
              }}>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </Avatar>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu del usuario */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={onMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 1,
            minWidth: 180,
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: "0 4px 24px #8B5CF633",
          },
        }}
      >
        <MenuItem disabled>{user?.email}</MenuItem>
        <MenuItem
          onClick={() => {
            onLogout()
            onMenuClose()
          }}
          sx={{ color: "#E05EFF", fontWeight: 700 }}
        >
          Cerrar sesión
        </MenuItem>
      </Menu>
    </>
  )
}