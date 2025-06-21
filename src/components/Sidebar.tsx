import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import GroupIcon from "@mui/icons-material/Group";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../hooks/useAuth";

const collapsedWidth = 72;
const expandedWidth = 240;

interface NavItem {
  label: string;
  icon: JSX.Element;
  path: string;
}

const mainNavItems: NavItem[] = [
  { 
    label: "Dashboard", 
    icon: <DashboardIcon sx={{ 
      fontSize: 24,
      transition: 'all 0.2s ease-out',
    }} />, 
    path: "/" 
  },
  { 
    label: "Usuarios", 
    icon: <PeopleIcon sx={{ 
      fontSize: 24,
      transition: 'all 0.2s ease-out',
    }} />, 
    path: "/usuarios" 
  },
  { 
    label: "IA", 
    icon: <SmartToyIcon sx={{ 
      fontSize: 24,
      transition: 'all 0.2s ease-out',
    }} />, 
    path: "/ia" 
  },
  { 
    label: "Equipos", 
    icon: <GroupIcon sx={{ 
      fontSize: 24,
      transition: 'all 0.2s ease-out',
    }} />, 
    path: "/equipos" 
  },
  { 
    label: "Whatsapp", 
    icon: <WhatsAppIcon sx={{ 
      fontSize: 24,
      transition: 'all 0.2s ease-out',
    }} />, 
    path: "/whatsapp" 
  },
  { 
    label: "Chats", 
    icon: <ChatIcon sx={{ 
      fontSize: 24,
      transition: 'all 0.2s ease-out',
    }} />, 
    path: "/chats"
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  mode: 'light' | 'dark';
  onHoverChange: (hover: boolean) => void;
}

const getFilteredNavItems = (user: any) => {
  return mainNavItems.filter(item => {
    // Hide "Chats" if user is not Admin
    if (item.label === "Chats" && user.role !== "Admin") return false;
    return true;
  });
};

export default function Sidebar({ mobileOpen, onClose, mode, onHoverChange }: SidebarProps) {
  const [hover, setHover] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isExpanded = hover || isMobile;
  const { logoutUser } = useAuth();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const filteredNavItems = getFilteredNavItems(user);

  const handleHover = (hovering: boolean) => {
    setHover(hovering);
    onHoverChange(hovering);
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      onMouseEnter={() => !isMobile && handleHover(true)}
      onMouseLeave={() => !isMobile && handleHover(false)}
      sx={{
        width: isExpanded ? expandedWidth : collapsedWidth,
        flexShrink: 0,
        position: 'fixed',
        "& .MuiDrawer-paper": {
          width: isExpanded ? expandedWidth : collapsedWidth,
          transition: "width 0.2s ease-out",
          background: mode === "dark"
            ? "rgba(30, 30, 40, 0.95)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(16px)",
          borderRight: "none",
          overflowX: "hidden",
          boxShadow: mode === "dark" 
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
      <Box sx={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "space-between",
        background: mode === "dark"
          ? "linear-gradient(180deg, rgba(30,30,40,0.95) 0%, rgba(30,30,40,0.92) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.92) 100%)",
      }}>
        {/* Top Section with Logo */}
        <Box sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            {isExpanded && (
              <Typography
                sx={{
                  fontWeight: 700,
                  color: mode === 'dark' ? '#fff' : '#8B5CF6',
                  letterSpacing: 2,
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  fontSize: 20,
                  mb: 1.5,
                  textAlign: 'center',
                  userSelect: 'none',
                  textShadow: mode === 'dark' ? '0 2px 8px #8B5CF6AA' : '0 2px 8px #E05EFF33',
                  transition: 'opacity 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                VIRTUAL VOICES
              </Typography>
            )}
            <Box
              sx={{
                width: isExpanded ? 56 : 44,
                height: isExpanded ? 56 : 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 60%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 16px 0 #8B5CF6AA',
                mx: 'auto',
                transition: 'all 0.2s ease-out',
              }}
            >
              <DashboardIcon sx={{ 
                fontSize: isExpanded ? 28 : 22, 
                color: '#fff',
                transition: 'font-size 0.2s ease-out',
              }} />
            </Box>
          </Box>

          {/* Main Navigation */}
          <List sx={{ px: 1 }}>
            {filteredNavItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItem
                  key={item.label}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) onClose();
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
                        background: mode === 'dark'
                          ? 'rgba(139, 92, 246, 0.1)'
                          : 'rgba(139, 92, 246, 0.05)',
                        color: '#E05EFF',
                        boxShadow: '0 4px 12px rgba(224, 94, 255, 0.1)',
                        '& .MuiListItemIcon-root': {
                          color: '#E05EFF',
                          transform: 'scale(1.1)',
                        }
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
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Bottom Section with User Profile */}
        <Box sx={{ mt: 'auto', pb: 2 }}>
          <Divider sx={{ 
            my: 1,
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            transition: 'border-color 0.2s'
          }} />
          
          {/* Profile Button */}
          <ListItem disablePadding sx={{ px: 1 }}>
            <ListItemButton
              onClick={() => navigate("/userProfile")}
              sx={{
                borderRadius: 3,
                minHeight: 44,
                pl: isExpanded ? 2.5 : 2,
                pr: isExpanded ? 2 : 2,
                justifyContent: isExpanded ? 'initial' : 'center',
                alignItems: 'center',
                transition: 'all 0.2s ease-out',
                '&:hover': {
                  background: mode === 'dark'
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(139, 92, 246, 0.05)',
                  '& .MuiAvatar-root': {
                    transform: 'scale(1.05)',
                  }
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
                {user?.name?.[0]?.toUpperCase() || "U"}
              </Avatar>
              {isExpanded && (
                <ListItemText
                  primary={user?.name || "Usuario"}
                  secondary={user?.email}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: 14,
                    noWrap: true,
                    color: mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'rgba(30, 30, 40, 0.9)',
                  }}
                  secondaryTypographyProps={{
                    fontSize: 12,
                    noWrap: true,
                    color: mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.5)' 
                      : 'rgba(30, 30, 40, 0.5)',
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
                  background: mode === 'dark'
                    ? 'rgba(224, 94, 255, 0.1)'
                    : 'rgba(224, 94, 255, 0.05)',
                  '& .MuiListItemIcon-root': {
                    color: '#E05EFF',
                    transform: 'scale(1.1)',
                  }
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
                    color: mode === 'dark' 
                      ? 'rgba(224, 94, 255, 0.8)' 
                      : 'rgba(224, 94, 255, 0.7)',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>
    </Drawer>
  );
}