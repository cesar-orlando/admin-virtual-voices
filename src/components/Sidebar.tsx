import { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import GroupIcon from "@mui/icons-material/Group";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme, useMediaQuery } from "@mui/material";

const drawerWidth = 240;
const collapsedWidth = 72;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  mode: 'light' | 'dark';
}

export default function Sidebar({ mobileOpen, onClose, mode }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { label: "Usuarios", icon: <PeopleIcon />, path: "/usuarios" },
    { label: "IA", icon: <SmartToyIcon />, path: "/ia" },
    { label: "Equipos", icon: <GroupIcon />, path: "/equipos" },
    { label: "Whatsapp", icon: <WhatsAppIcon />, path: "/whatsapp" },
  ];

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? collapsedWidth : drawerWidth,
          boxSizing: "border-box",
          background: mode === 'dark'
            ? 'rgba(30,30,40,0.92)'
            : 'rgba(255,255,255,0.92)',
          color: mode === 'dark' ? '#fff' : '#181A20',
          borderRight: "2px solid #8B5CF6",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.22)",
          transition: 'width 0.3s cubic-bezier(.4,0,.2,1), background 0.5s',
          overflowX: 'hidden',
        },
      }}
      PaperProps={{
        role: "navigation",
        "aria-label": "Menú principal",
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto", px: 1, pt: 2, pb: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Logo y botón de colapso */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4, mt: 1, justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <Typography
              sx={{
                fontWeight: 700,
                color: mode === 'dark' ? '#fff' : '#181A20',
                letterSpacing: 2,
                fontFamily: 'Montserrat, Arial, sans-serif',
                fontSize: 18,
                flex: 1,
                ml: 1,
              }}
            >
              VIRTUAL VOICES
            </Typography>
          )}
          <Tooltip title={collapsed ? "Expandir menú" : "Colapsar menú"} placement="right">
            <IconButton
              onClick={() => setCollapsed((c) => !c)}
              sx={{ ml: 1, color: mode === 'dark' ? '#8B5CF6' : '#3B82F6' }}
              size="small"
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <List sx={{ flex: 1, pt: 0 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.label} disablePadding sx={{ position: 'relative' }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) onClose();
                  }}
                  sx={{
                    borderRadius: 3,
                    mb: 1,
                    minHeight: 48,
                    pl: collapsed ? 1.5 : 2.5,
                    pr: collapsed ? 1.5 : 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                    background: active
                      ? 'linear-gradient(90deg, #E05EFF33 0%, #8B5CF633 50%, #3B82F633 100%)'
                      : 'none',
                    color: active ? '#E05EFF' : undefined,
                    boxShadow: active ? '0 2px 12px #E05EFF33' : undefined,
                    '&:hover': {
                      background: 'linear-gradient(90deg, #E05EFF22 0%, #8B5CF622 50%, #3B82F622 100%)',
                      color: '#E05EFF',
                      boxShadow: '0 2px 8px #E05EFF33',
                    },
                  }}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                >
                  {/* Barra vertical animada */}
                  {active && !collapsed && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 8,
                        bottom: 8,
                        width: 5,
                        borderRadius: 3,
                        background: 'linear-gradient(180deg, #E05EFF 0%, #8B5CF6 100%)',
                        boxShadow: '0 0 8px #E05EFF99',
                        animation: 'fadeInBar 0.4s',
                        '@keyframes fadeInBar': {
                          from: { opacity: 0, width: 0 },
                          to: { opacity: 1, width: 5 },
                        },
                      }}
                    />
                  )}
                  <ListItemIcon sx={{ color: active ? '#E05EFF' : (mode === 'dark' ? '#8B5CF6' : '#3B82F6'), minWidth: 36, transition: 'color 0.2s' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        fontFamily: 'Montserrat, Arial, sans-serif',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        {/* Footer corporativo sticky */}
        <Box sx={{ textAlign: 'center', color: '#BDBDBD', fontSize: 12, fontFamily: 'Montserrat, Arial, sans-serif', mb: 1, mt: 2 }}>
          © {new Date().getFullYear()}<br />Virtual Voices
        </Box>
      </Box>
    </Drawer>
  );
} 