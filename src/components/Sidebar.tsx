import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import GroupIcon from '@mui/icons-material/Group'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import LogoutIcon from '@mui/icons-material/Logout'
import TableChartIcon from '@mui/icons-material/TableChart'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import BuildIcon from '@mui/icons-material/Build'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import SettingsIcon from '@mui/icons-material/Settings'
import { useAuth } from '../hooks/useAuth'
import { getTables } from '../api/servicios'
import type { DynamicTable } from '../types'
import Logo from '../assets/VirtualVoice.svg'

const collapsedWidth = 72
const expandedWidth = 240

interface NavItem {
  label: string
  icon: JSX.Element
  path: string
  children?: NavItem[]
}

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
  mode: 'light' | 'dark'
  onHoverChange: (hover: boolean) => void
}

export default function Sidebar({ mobileOpen, onClose, mode, onHoverChange }: SidebarProps) {
  const [hover, setHover] = useState(false)
  const [tables, setTables] = useState<DynamicTable[]>([])
  const [tablesOpen, setTablesOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isExpanded = hover || isMobile
  const { logoutUser } = useAuth()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Cargar tablas dinámicas
  useEffect(() => {
    if (user.companySlug) {
      loadTables()
    }
  }, [user.companySlug])

  const loadTables = async () => {
    try {
      setLoading(true)
      const response = await getTables(user)
      setTables(response.tables || [])
    } catch (error) {
      console.error('Error loading tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHover = (hovering: boolean) => {
    setHover(hovering)
    onHoverChange(hovering)
  }

  const handleLogout = () => {
    logoutUser()
    onClose()
  }

  const handleTablesToggle = () => {
    setTablesOpen(!tablesOpen)
  }

  const handleToolsToggle = () => {
    setToolsOpen(!toolsOpen)
  }

  const handleTableClick = (tableSlug: string) => {
    navigate(`/tablas/${tableSlug}`)
    if (isMobile) onClose()
  }

  const handleCreateTable = () => {
    navigate('/tablas/nueva')
    if (isMobile) onClose()
  }

  // Crear el item de Tablas con submenú
  const tablesNavItem: NavItem = {
    label: 'Tablas',
    icon: (
      <TableChartIcon
        sx={{
          fontSize: 24,
          transition: 'all 0.2s ease-out',
        }}
      />
    ),
    path: '/tablas',
    children: [
      {
        label: 'Crear Nueva Tabla',
        icon: <AddIcon sx={{ fontSize: 20 }} />,
        path: '/tablas/nueva',
      },
      ...tables.map(table => ({
        label: table.name,
        icon: <span style={{ fontSize: 20 }}>{table.icon || '📋'}</span>,
        path: `/tablas/${table.slug}`,
      })),
    ],
  }

  // Construir el menú principal dinámicamente según la empresa
  const mainNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <AnalyticsIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />, path: '/',
    },
    // Solo mostrar Usuarios si es Administrador
    ...(user.role === 'Administrador' ? [
      {
        label: 'Usuarios',
        icon: <PeopleIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />,
        path: '/usuarios',
      },
    ] : []),
    ...(user.companySlug === 'quicklearning'
      ? []
      : [
          {
            label: 'IA',
            icon: <SmartToyIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />,
            path: '/ia',
          },
        ]),
    ...(user.companySlug === 'quicklearning'
      ? []
      : [
          {
            label: 'Herramientas',
            icon: <BuildIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />,
            path: '/herramientas',
            children: [
              {
                label: 'Dashboard',
                icon: <DashboardCustomizeIcon sx={{ fontSize: 20 }} />,
                path: '/herramientas-dashboard',
              },
              {
                label: 'Gestionar Herramientas',
                icon: <BuildIcon sx={{ fontSize: 20 }} />,
                path: '/herramientas',
              },
              {
                label: 'Nueva Herramienta',
                icon: <AddIcon sx={{ fontSize: 20 }} />,
                path: '/herramientas/nueva',
              },
              {
                label: 'Tester',
                icon: <PlayArrowIcon sx={{ fontSize: 20 }} />,
                path: '/herramientas/tester',
              },
            ],
          },
        ]),
    /*     Tenemos que ver que hacer con esta tarea que es asignar tareas y demás, estilo Jira.
    {
      label: 'Equipos',
      icon: <GroupIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />, path: '/equipos',
    }, */
    ...(user.companySlug === 'quicklearning'
      ? []
      : [
          {
            label: 'Whatsapp',
            icon: <WhatsAppIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />,
            path: '/whatsapp',
          },
        ]),
    // Solo agregar QuickLearning WA si es quicklearning
    ...(user.companySlug === 'quicklearning'
      ? [
          {
            label: 'Quick Whats',
            icon: <WhatsAppIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />,
            path: '/quicklearning/whatsapp',
          },
        ]
      : []),
    ...(user.companySlug === 'quicklearning'
      ? []
      : [
          {
            label: 'Chats',
            icon: <ChatIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />,
            path: '/chats',
          },
          {
            label: 'Messenger',
            icon: <ChatIcon sx={{ fontSize: 24, transition: 'all 0.2s ease-out' }} />,
            path: '/messenger',
          },
        ]),
  ]

  // Solo mostrar Tablas si es Administrador
  const allNavItems = [
    ...mainNavItems,
    ...(user.role === 'Administrador' ? [tablesNavItem] : [])
  ]

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      onMouseEnter={() => !isMobile && handleHover(true)}
      onMouseLeave={() => !isMobile && handleHover(false)}
      sx={{
        width: isExpanded ? expandedWidth : collapsedWidth,
        flexShrink: 0,
        position: 'fixed',
        '& .MuiDrawer-paper': {
          width: isExpanded ? expandedWidth : collapsedWidth,
          transition: 'width 0.2s ease-out',
          background: mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          borderRight: 'none',
          overflowX: 'hidden',
          boxShadow:
            mode === 'dark'
              ? '4px 0 24px rgba(139, 92, 246, 0.1)'
              : '4px 0 24px rgba(139, 92, 246, 0.05)',
          zIndex: theme.zIndex.drawer,
          '&::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.1), transparent)',
            boxShadow: '0 0 8px rgba(139, 92, 246, 0.1)',
          },
        },
      }}
    >
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            mode === 'dark'
              ? 'linear-gradient(180deg, rgba(30,30,40,0.95) 0%, rgba(30,30,40,0.92) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.92) 100%)',
        }}
      >
        {/* Top Section with Logo */}
        <Box sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              component="img"
              src={Logo}
              alt="Virtual Voices Logo"
              sx={{
                width: isExpanded ? 100 : 60,
                height: isExpanded ? 100 : 60,
                zIndex: 1,
                position: 'relative',
                filter: 'drop-shadow(0 2px 8px #8B5CF6aa)',
              }}
            ></Box>
          </Box>

          {/* Main Navigation */}
          <List sx={{ px: 1 }}>
            {allNavItems.map(item => {
              const active =
                location.pathname === item.path ||
                (item.children && item.children.some(child => location.pathname === child.path))

              return (
                <Box key={item.label}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        if (item.children) {
                          navigate(item.path)
                          if (isExpanded) {
                            if (item.label === 'Tablas') {
                              handleTablesToggle()
                            } else if (item.label === 'Herramientas') {
                              handleToolsToggle()
                            }
                          }
                        } else {
                          navigate(item.path)
                          if (isMobile) onClose()
                        }
                      }}
                      sx={{
                        borderRadius: 3,
                        minHeight: 44,
                        pl: isExpanded ? 2.5 : 2,
                        pr: isExpanded ? 2 : 2,
                        justifyContent: isExpanded ? 'initial' : 'center',
                        alignItems: 'center',
                        transition: 'all 0.2s ease-out',
                        background: active
                          ? mode === 'dark'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'rgba(139, 92, 246, 0.1)'
                          : 'transparent',
                        color: active ? '#E05EFF' : undefined,
                        boxShadow: active
                          ? mode === 'dark'
                            ? '0 4px 12px rgba(224, 94, 255, 0.15)'
                            : '0 4px 12px rgba(224, 94, 255, 0.1)'
                          : 'none',
                        '&:hover': {
                          background:
                            mode === 'dark'
                              ? 'rgba(139, 92, 246, 0.1)'
                              : 'rgba(139, 92, 246, 0.05)',
                          color: '#E05EFF',
                          boxShadow: '0 4px 12px rgba(224, 94, 255, 0.1)',
                          '& .MuiListItemIcon-root': {
                            color: '#E05EFF',
                            transform: 'scale(1.1)',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: active
                            ? '#E05EFF'
                            : mode === 'dark'
                              ? 'rgba(139, 92, 246, 0.8)'
                              : 'rgba(139, 92, 246, 0.7)',
                          minWidth: isExpanded ? 36 : 'auto',
                          mr: isExpanded ? 2 : 0,
                          transition: 'all 0.2s ease-out',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {isExpanded && (
                        <>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              fontFamily: 'Montserrat, Arial, sans-serif',
                              fontSize: 14,
                              color: active
                                ? '#E05EFF'
                                : mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.9)'
                                  : 'rgba(30, 30, 40, 0.9)',
                            }}
                          />
                          {item.children && (
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation()
                                if (item.label === 'Tablas') {
                                  handleTablesToggle()
                                } else if (item.label === 'Herramientas') {
                                  handleToolsToggle()
                                }
                              }}
                              sx={{
                                color: active ? '#E05EFF' : 'inherit',
                                transform: (
                                  item.label === 'Tablas'
                                    ? tablesOpen
                                    : item.label === 'Herramientas'
                                      ? toolsOpen
                                      : false
                                )
                                  ? 'rotate(180deg)'
                                  : 'rotate(0deg)',
                                transition: 'transform 0.2s ease-out',
                              }}
                            >
                              {(
                                item.label === 'Tablas'
                                  ? tablesOpen
                                  : item.label === 'Herramientas'
                                    ? toolsOpen
                                    : false
                              ) ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>

                  {/* Submenús */}
                  {item.children && isExpanded && (
                    <Collapse
                      in={
                        item.label === 'Tablas'
                          ? tablesOpen
                          : item.label === 'Herramientas'
                            ? toolsOpen
                            : false
                      }
                      timeout="auto"
                      unmountOnExit
                    >
                      <List component="div" disablePadding>
                        {item.children.map(child => {
                          const childActive = location.pathname === child.path
                          return (
                            <ListItem key={child.label} disablePadding sx={{ pl: 4, mb: 0.5 }}>
                              <ListItemButton
                                onClick={() => {
                                  if (child.path.startsWith('/tablas')) {
                                    if (child.path === '/tablas/nueva') {
                                      handleCreateTable()
                                    } else {
                                      handleTableClick(child.path.split('/')[2])
                                    }
                                  } else {
                                    navigate(child.path)
                                    if (isMobile) onClose()
                                  }
                                }}
                                sx={{
                                  borderRadius: 3,
                                  minHeight: 40,
                                  pl: 2,
                                  pr: 2,
                                  transition: 'all 0.2s ease-out',
                                  background: childActive
                                    ? mode === 'dark'
                                      ? 'rgba(139, 92, 246, 0.1)'
                                      : 'rgba(139, 92, 246, 0.05)'
                                    : 'transparent',
                                  color: childActive ? '#E05EFF' : undefined,
                                  '&:hover': {
                                    background:
                                      mode === 'dark'
                                        ? 'rgba(139, 92, 246, 0.05)'
                                        : 'rgba(139, 92, 246, 0.02)',
                                    color: '#E05EFF',
                                  },
                                }}
                              >
                                <ListItemIcon
                                  sx={{
                                    color: childActive
                                      ? '#E05EFF'
                                      : mode === 'dark'
                                        ? 'rgba(139, 92, 246, 0.6)'
                                        : 'rgba(139, 92, 246, 0.5)',
                                    minWidth: 32,
                                    mr: 1.5,
                                    fontSize: 18,
                                  }}
                                >
                                  {child.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={child.label}
                                  primaryTypographyProps={{
                                    fontWeight: 500,
                                    fontSize: 13,
                                    color: childActive
                                      ? '#E05EFF'
                                      : mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.8)'
                                        : 'rgba(30, 30, 40, 0.8)',
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          )
                        })}
                      </List>
                    </Collapse>
                  )}
                </Box>
              )
            })}
          </List>
        </Box>

        {/* Bottom Section with User Profile */}
        <Box sx={{ mt: 'auto', pb: 2 }}>
          <Divider
            sx={{
              my: 1,
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              transition: 'border-color 0.2s',
            }}
          />

          {/* Profile Button */}
          <ListItem disablePadding sx={{ px: 1 }}>
            <ListItemButton
              onClick={() => navigate('/userProfile')}
              sx={{
                borderRadius: 3,
                minHeight: 44,
                pl: isExpanded ? 2.5 : 2,
                pr: isExpanded ? 2 : 2,
                justifyContent: isExpanded ? 'initial' : 'center',
                alignItems: 'center',
                transition: 'all 0.2s ease-out',
                '&:hover': {
                  background:
                    mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                  '& .MuiAvatar-root': {
                    transform: 'scale(1.05)',
                  },
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 15,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
                  boxShadow: '0 2px 8px #8B5CF6AA',
                  mr: isExpanded ? 2 : 0,
                  transition: 'all 0.2s ease-out',
                }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              {isExpanded && (
                <ListItemText
                  primary={user?.name || 'Usuario'}
                  secondary={user?.email}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: 14,
                    noWrap: true,
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 40, 0.9)',
                  }}
                  secondaryTypographyProps={{
                    fontSize: 12,
                    noWrap: true,
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(30, 30, 40, 0.5)',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>

          {/* Logout Button */}
          <ListItem disablePadding sx={{ px: 1 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 3,
                minHeight: 44,
                pl: isExpanded ? 2.5 : 2,
                pr: isExpanded ? 2 : 2,
                justifyContent: isExpanded ? 'initial' : 'center',
                alignItems: 'center',
                transition: 'all 0.2s ease-out',
                '&:hover': {
                  background:
                    mode === 'dark' ? 'rgba(224, 94, 255, 0.1)' : 'rgba(224, 94, 255, 0.05)',
                  '& .MuiListItemIcon-root': {
                    color: '#E05EFF',
                    transform: 'scale(1.1)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: mode === 'dark' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.7)',
                  minWidth: isExpanded ? 36 : 'auto',
                  mr: isExpanded ? 2 : 0,
                  transition: 'all 0.2s ease-out',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <LogoutIcon sx={{ fontSize: 22 }} />
              </ListItemIcon>
              {isExpanded && (
                <ListItemText
                  primary="Cerrar sesión"
                  primaryTypographyProps={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: mode === 'dark' ? 'rgba(224, 94, 255, 0.8)' : 'rgba(224, 94, 255, 0.7)',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>
    </Drawer>
  )
}
