import { useEffect, useState } from "react";
import { fetchCompanyUsers } from "../api/fetchCompanyUsers";
import type { UserProfile } from '../types';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, FormControl, InputLabel, Select, MenuItem, Box, Typography,
  Card, CardContent, InputAdornment, useTheme, Avatar, Chip, IconButton,
  CircularProgress
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import UserDrawer from '../components/UserDrawer';

// Utilidad para color de avatar
function stringToColor(string: string) {
  let hash = 0;
  let i;
  for (i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color + '33'; // Opacidad
}

export default function Users() {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserProfile;
    const [userData, setUsers] = useState<UserProfile[]>([]);
    const [filter, setFilter] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "email">("name");
    const [roleFilter, setRoleFilter] = useState("Todos");
    const theme = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
    const [editUser, setEditUser] = useState<any>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        setIsLoading(true);
        const loadData = async () => {
            const fetchedCompanyUsers = await fetchCompanyUsers(user);
            setUsers(fetchedCompanyUsers);
        };
        loadData();
        setIsLoading(false);
    }, [user.c_name, user.id]);

    console.log("user.c_name ---->", user.c_name)

    const filteredData = userData
        .filter(user =>
            user.name.toLowerCase().includes(filter.toLowerCase()) &&
            (roleFilter === "Todos" || user.role === roleFilter)
        )
        .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

    const handleAddUser = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (drawerMode === 'edit' && editUser) {
                // Aquí deberías llamar a tu endpoint de edición, por ahora simula update
                // await fetch(`/users/${editUser.id}`, { method: 'PUT', ... })
                setSnackbar({ open: true, message: 'Usuario actualizado', severity: 'success' });
            } else {
                const res = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Error al registrar usuario');
                }
                setSnackbar({ open: true, message: 'Usuario creado exitosamente', severity: 'success' });
            }
            setDrawerOpen(false);
            setEditUser(null);
            setDrawerMode('create');
            // Refresca usuarios
            const fetchedCompanyUsers = await fetchCompanyUsers(user);
            setUsers(fetchedCompanyUsers);
        } catch (e: any) {
            setSnackbar({ open: true, message: e.message, severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (userData: any) => {
        setEditUser(userData);
        setDrawerMode('edit');
        setDrawerOpen(true);
    };



    if (isLoading || isSubmitting) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column', background: theme.palette.background.default }}>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, letterSpacing: 1 }}>
                        Gestión de Usuarios
                    </Typography>
                    <Button variant="contained" color="primary" onClick={() => { setDrawerOpen(true); setDrawerMode('create'); setEditUser(null); }} sx={{ borderRadius: 2, fontWeight: 600, boxShadow: '0 2px 8px #3B82F633' }}>
                        Agregar usuario
                    </Button>
                </Box>
                <Card sx={{ borderRadius: 2, boxShadow: '0 8px 32px 0 rgba(59,130,246,0.10)', background: theme.palette.background.paper, mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                label="Buscar usuario"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                variant="outlined"
                                size="small"
                                sx={{ flexGrow: 1, minWidth: 200, background: theme.palette.background.paper, borderRadius: 2, color: theme.palette.text.primary, '& .MuiInputBase-input': { color: theme.palette.text.primary }, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    style: { color: theme.palette.text.primary, background: theme.palette.background.paper }
                                }}
                                InputLabelProps={{ style: { color: theme.palette.text.primary, opacity: 0.7 } }}
                            />
                            <FormControl size="small" sx={{ minWidth: 150, background: theme.palette.background.paper, borderRadius: 2 }}>
                                <InputLabel sx={{ color: theme.palette.text.primary, opacity: 0.7 }}>Ordenar por</InputLabel>
                                <Select
                                    value={sortBy}
                                    label="Ordenar por"
                                    onChange={e => setSortBy(e.target.value as "name" | "email")}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <FilterListIcon color="action" />
                                        </InputAdornment>
                                    }
                                    sx={{ color: theme.palette.text.primary }}
                                >
                                    <MenuItem value="name">Nombre</MenuItem>
                                    <MenuItem value="email">Email</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 150, background: theme.palette.background.paper, borderRadius: 2 }}>
                                <InputLabel sx={{ color: theme.palette.text.primary, opacity: 0.7 }}>Rol</InputLabel>
                                <Select
                                    value={roleFilter}
                                    label="Rol"
                                    onChange={e => setRoleFilter(e.target.value)}
                                    sx={{ color: theme.palette.text.primary }}
                                >
                                    <MenuItem value="Todos">Todos</MenuItem>
                                    <MenuItem value="Admin">Admin</MenuItem>
                                    <MenuItem value="Usuario">Usuario</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 8px 32px 0 rgba(139,92,246,0.08)', background: theme.palette.background.paper, m: 2 }}>
                <TableContainer sx={{ flex: 1, height: '100%' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(90deg, #232136 60%, #2a2139 100%)' : 'linear-gradient(90deg, #f4f6fb 60%, #e9e6f7 100%)' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5, color: theme.palette.text.primary }}>Nombre</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5, color: theme.palette.text.primary }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5, color: theme.palette.text.primary }}>Rol</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5, color: theme.palette.text.primary }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.length > 0 ? (
                                filteredData.map((user, idx) => (
                                    <TableRow 
                                        key={idx}
                                        sx={{ 
                                            transition: 'box-shadow 0.2s, transform 0.2s',
                                            '&:hover': { 
                                                background: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.04)' : 'rgba(139,92,246,0.04)',
                                                boxShadow: '0 4px 24px 0 #8B5CF622',
                                                transform: 'scale(1.01)'
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: theme.palette.mode === 'dark' ? '#8B5CF6' : stringToColor(user.name),
                                                        color: '#fff',
                                                        fontWeight: 700,
                                                        width: 40,
                                                        height: 40,
                                                        fontSize: 20,
                                                        boxShadow: '0 2px 8px #8B5CF633'
                                                    }}
                                                >
                                                    {user.name[0]}
                                                </Avatar>
                                                <span style={{ fontWeight: 500, fontSize: 16 }}>{user.name}</span>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 15, color: theme.palette.text.primary }}>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role === 'admin' ? 'Admin' : user.role === 'user' ? 'Usuario' : user.role}
                                                icon={
                                                    user.role === 'admin'
                                                        ? <AdminPanelSettingsIcon sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#3B82F6', fontSize: 22 }} />
                                                        : <PersonIcon sx={{ color: theme.palette.mode === 'dark' ? '#a21caf' : '#8B5CF6', fontSize: 22 }} />
                                                }
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: 15,
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 2,
                                                    background: user.role === 'admin'
                                                        ? (theme.palette.mode === 'dark'
                                                            ? 'linear-gradient(90deg, #232136 0%, #3B82F622 100%)'
                                                            : 'linear-gradient(90deg, #e0e7ff 0%, #bae6fd 100%)')
                                                        : (theme.palette.mode === 'dark'
                                                            ? 'linear-gradient(90deg, #2a2139 0%, #a21caf22 100%)'
                                                            : 'linear-gradient(90deg, #f3e8ff 0%, #fbc2eb 100%)'),
                                                    color: user.role === 'admin'
                                                        ? (theme.palette.mode === 'dark' ? '#fff' : '#2563eb')
                                                        : (theme.palette.mode === 'dark' ? '#fff' : '#a21caf'),
                                                    boxShadow: user.role === 'admin'
                                                        ? (theme.palette.mode === 'dark'
                                                            ? '0 2px 8px #3B82F622'
                                                            : '0 2px 8px #3B82F622')
                                                        : (theme.palette.mode === 'dark'
                                                            ? '0 2px 8px #a21caf22'
                                                            : '0 2px 8px #8B5CF622'),
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleEditClick(user)}>
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">
                                            No se encontraron usuarios
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
            {/* Drawer profesional para crear/editar usuario */}
            <UserDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditUser(null); setDrawerMode('create'); }} onSubmit={handleAddUser} initialData={editUser} mode={drawerMode} />
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <MuiAlert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
} 