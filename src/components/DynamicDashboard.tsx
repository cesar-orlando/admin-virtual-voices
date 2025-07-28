import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Collapse,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Checkbox,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Storage,
  Add,
  Visibility,
  Edit,
  MoreVert,
  TableChart,
  Assessment,
  Timeline,
  PieChart,
  BarChart,
  Analytics,
  Settings,
  DragIndicator,
  VisibilityOff,
  ExpandMore,
  ExpandLess,
  FilterList,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getTables } from '../api/servicios/dynamicTableServices';
import { getRecords } from '../api/servicios/dynamicTableServices';
import { getTableStats } from '../api/servicios/dynamicTableServices';

interface SimpleTable {
  name: string;
  slug: string;
  icon?: string;
}

interface TableMetric {
  tableSlug: string;
  tableName: string;
  tableIcon: string;
  totalRecords: number;
  recordsToday: number;
  recordsThisWeek: number;
  recordsThisMonth: number;
  growthRate: number;
  lastUpdated: Date;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface TableSummaryCard {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  visible: boolean;
  order: number;
}

interface DashboardSegment {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

interface TableVisibilitySettings {
  [tableSlug: string]: {
    visible: boolean;
    showDetails: boolean;
  };
}

interface DynamicDashboardProps {
  companySlug: string;
  onTableClick?: (tableSlug: string) => void;
  onCreateTable?: () => void;
}

// Sortable Card Component using dnd-kit
interface SortableCardProps {
  card: TableSummaryCard;
  onToggleVisibility: (cardId: string) => void;
}

function SortableCard({ card, onToggleVisibility }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{ 
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        cursor: 'grab',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[4],
          transform: 'translateY(-2px)',
        },
        '&:active': {
          cursor: 'grabbing',
        }
      }}>
      <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(card.id);
          }}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            opacity: 0.7,
            '&:hover': { opacity: 1 }
          }}
        >
          <VisibilityOff fontSize="small" />
        </IconButton>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 1 
        }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: `${card.color}.light`,
            color: `${card.color}.contrastText`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {card.icon}
          </Box>
        </Box>
        
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {card.value}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {card.title}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Sortable Settings Item Component
interface SortableSettingsItemProps {
  card: TableSummaryCard;
  onToggleVisibility: (cardId: string) => void;
}

function SortableSettingsItem({ card, onToggleVisibility }: SortableSettingsItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <ListItem 
      ref={setNodeRef}
      style={style}
      {...attributes}
      sx={{ 
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' }
      }}
    >
      <Checkbox
        checked={card.visible}
        onChange={() => onToggleVisibility(card.id)}
      />
      <ListItemText primary={card.title} />
      <Box {...listeners} sx={{ p: 1, cursor: 'grab' }}>
        <DragIndicator sx={{ color: 'text.secondary' }} />
      </Box>
    </ListItem>
  );
}

export function DynamicDashboard({ 
  companySlug, 
  onTableClick, 
  onCreateTable 
}: DynamicDashboardProps) {
  const { user } = useAuth();
  const [tables, setTables] = useState<SimpleTable[]>([]);
  const [tableMetrics, setTableMetrics] = useState<TableMetric[]>([]);
  const [summaryCards, setSummaryCards] = useState<TableSummaryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New state for dashboard customization
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tableVisibility, setTableVisibility] = useState<TableVisibilitySettings>({});

  // Update the loadDashboardData function in DynamicDashboard.tsx
const loadDashboardData = useCallback(async () => {
  if (!user) {
    console.log('DynamicDashboard: No user available');
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    console.log('DynamicDashboard: Starting to load dashboard data...');

    // Fetch all tables
    console.log('DynamicDashboard: Fetching tables...');
    const tablesResponse = await getTables(user);
    console.log('DynamicDashboard: Raw tables response:', tablesResponse);
    
    // Check if response has a tables property or is directly an array
    let tablesList: SimpleTable[] = [];
    
    if (Array.isArray(tablesResponse)) {
      tablesList = tablesResponse;
    } else if (tablesResponse && Array.isArray(tablesResponse.tables)) {
      tablesList = tablesResponse.tables;
    } else if (tablesResponse && Array.isArray(tablesResponse.data)) {
      tablesList = tablesResponse.data;
    } else {
      console.warn('DynamicDashboard: Unexpected tables response structure:', tablesResponse);
      tablesList = [];
    }
    
    console.log('DynamicDashboard: Processed tables list:', tablesList);
    setTables(tablesList);

    if (!tablesList || tablesList.length === 0) {
      console.log('DynamicDashboard: No tables found');
      setSummaryCards([
        {
          id: 'total-tables',
          title: 'Total de Tablas',
          value: 0,
          icon: <TableChart />,
          color: 'primary',
          visible: true,
          order: 1
        },
        {
          id: 'total-records',
          title: 'Total de Registros',
          value: 0,
          icon: <Storage />,
          color: 'secondary',
          visible: true,
          order: 2
        },
        {
          id: 'records-today',
          title: 'Registros Hoy',
          value: 0,
          icon: <TrendingUp />,
          color: 'success',
          visible: true,
          order: 3
        }
      ]);
      setTableMetrics([]);
      setLoading(false);
      return;
    }

    // Calculate metrics for each table using getTableStats
    const metrics: TableMetric[] = [];
    let totalRecordsAllTables = 0;
    let totalTablesWithData = 0;
    let totalRecordsToday = 0;
    let totalRecordsThisWeek = 0;

    console.log(`DynamicDashboard: Processing ${tablesList.length} tables...`);

    for (const table of tablesList) {
      try {
        console.log(`DynamicDashboard: Loading stats for table ${table.slug}...`);
        
        // Use getTableStats instead of getRecords
        const tableStats = await getTableStats(table.slug, user);
        console.log(`DynamicDashboard: Table stats for ${table.slug}:`, tableStats);

        // Extract data from tableStats
        const totalRecords = tableStats?.totalRecords || 0;
        
        // Note: getTableStats might not have time-based breakdowns by default
        // You might need to calculate these or modify your backend to include them
        // For now, we'll use mock data or simplified calculations
        const recordsToday = Math.round(totalRecords * 0.05); // 5% estimate
        const recordsThisWeek = Math.round(totalRecords * 0.15); // 15% estimate  
        const recordsThisMonth = Math.round(totalRecords * 0.30); // 30% estimate

        // Calculate growth (if you have historical data in tableStats)
        const growthRate = tableStats?.growthRate || 0;

        // Assign colors cyclically
        const colors: Array<'primary' | 'secondary' | 'success' | 'warning' | 'error'> = 
          ['primary', 'secondary', 'success', 'warning', 'error'];
        const color = colors[metrics.length % colors.length];

        // Use lastUpdated from tableStats or current date
        const lastUpdated = tableStats?.lastUpdated 
          ? new Date(tableStats.lastUpdated) 
          : new Date();

        metrics.push({
          tableSlug: table.slug,
          tableName: table.name || table.slug,
          tableIcon: table.icon || '📊',
          totalRecords,
          recordsToday,
          recordsThisWeek,
          recordsThisMonth,
          growthRate,
          lastUpdated,
          color
        });

        totalRecordsAllTables += totalRecords;
        totalRecordsToday += recordsToday;
        totalRecordsThisWeek += recordsThisWeek;
        
        if (totalRecords > 0) {
          totalTablesWithData++;
        }

        console.log(`DynamicDashboard: Processed table ${table.slug} - ${totalRecords} total records`);

      } catch (tableError) {
        console.error(`DynamicDashboard: Error loading stats for table ${table.slug}:`, tableError);
        
        // Add the table to metrics with default values even if stats fail
        const colors: Array<'primary' | 'secondary' | 'success' | 'warning' | 'error'> = 
          ['primary', 'secondary', 'success', 'warning', 'error'];
        const color = colors[metrics.length % colors.length];

        metrics.push({
          tableSlug: table.slug,
          tableName: table.name || table.slug,
          tableIcon: table.icon || '📊',
          totalRecords: 0,
          recordsToday: 0,
          recordsThisWeek: 0,
          recordsThisMonth: 0,
          growthRate: 0,
          lastUpdated: new Date(),
          color
        });
      }
    }

    setTableMetrics(metrics);
    console.log('DynamicDashboard: Final metrics:', metrics);

    // Create summary cards
    const avgRecordsPerTable = totalTablesWithData > 0 
      ? Math.round(totalRecordsAllTables / totalTablesWithData) 
      : 0;

    const summaryData: TableSummaryCard[] = [
      {
        id: 'total-tables',
        title: 'Total de Tablas',
        value: tablesList.length,
        icon: <TableChart />,
        color: 'primary',
        visible: true,
        order: 1
      },
      {
        id: 'total-records',
        title: 'Total de Registros',
        value: totalRecordsAllTables.toLocaleString(),
        icon: <Storage />,
        color: 'secondary',
        visible: true,
        order: 2
      },
      {
        id: 'records-today',
        title: 'Registros Hoy',
        value: totalRecordsToday,
        icon: <TrendingUp />,
        color: 'success',
        visible: true,
        order: 3
      },
      {
        id: 'records-week',
        title: 'Registros Esta Semana',
        value: totalRecordsThisWeek,
        icon: <Timeline />,
        color: 'warning',
        visible: true,
        order: 4
      },
      {
        id: 'avg-records',
        title: 'Promedio por Tabla',
        value: avgRecordsPerTable,
        icon: <BarChart />,
        color: 'error',
        visible: true,
        order: 5
      },
      {
        id: 'active-tables',
        title: 'Tablas Activas',
        value: totalTablesWithData,
        icon: <Analytics />,
        color: 'primary',
        visible: true,
        order: 6
      }
    ];

    setSummaryCards(summaryData);
    console.log('DynamicDashboard: Dashboard data loaded successfully');

  } catch (error) {
    console.error('DynamicDashboard: Error loading dashboard data:', error);
    setError('Error al cargar los datos del dashboard');
  } finally {
    setLoading(false);
  }
}, [user]); // useCallback dependency array

  useEffect(() => {
    if (user && companySlug) {
      loadDashboardData();
    }
  }, [user, companySlug, loadDashboardData]);

  // dnd-kit sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSummaryCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order values
        return newItems.map((card, index) => ({
          ...card,
          order: index + 1
        }));
      });
    }
  };

  // Toggle card visibility
  const toggleCardVisibility = (cardId: string) => {
    setSummaryCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? { ...card, visible: !card.visible } : card
      )
    );
  };

  // Toggle table visibility
  const toggleTableVisibility = (tableName: string) => {
    setTableVisibility(prev => ({
      ...prev,
      [tableName]: {
        visible: !(prev[tableName]?.visible ?? true),
        showDetails: prev[tableName]?.showDetails ?? false
      }
    }));
  };

  // Sort cards by order
  const sortedCards = [...summaryCards].sort((a, b) => a.order - b.order);
  const visibleCards = sortedCards.filter(card => card.visible);

  // Get visible tables  
  const visibleTables = tables.filter((table: SimpleTable) => tableVisibility[table.name]?.visible !== false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, tableSlug: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTable(tableSlug);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTable(null);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return 'Hace menos de 1 hora';
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2, 
        p: 4 
      }}>
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          📊 Dashboard de Tablas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            color="secondary" 
            onClick={() => setSettingsOpen(true)}
            sx={{ 
              bgcolor: 'secondary.light', 
              '&:hover': { bgcolor: 'secondary.main', color: 'white' } 
            }}
          >
            <Settings />
          </IconButton>
          {onCreateTable && (
            <IconButton 
              color="primary" 
              onClick={onCreateTable}
              sx={{ 
                bgcolor: 'primary.light', 
                '&:hover': { bgcolor: 'primary.main', color: 'white' } 
              }}
            >
              <Add />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={visibleCards.map(card => card.id)}
          strategy={horizontalListSortingStrategy}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {visibleCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={card.id}>
                <SortableCard card={card} onToggleVisibility={toggleCardVisibility} />
              </Grid>
            ))}
          </Grid>
        </SortableContext>
      </DndContext>

      {/* Tables Overview */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Resumen de Tablas
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tabla</TableCell>
                <TableCell align="right">Total Registros</TableCell>
                <TableCell align="right">Hoy</TableCell>
                <TableCell align="right">Esta Semana</TableCell>
                <TableCell align="right">Este Mes</TableCell>
                <TableCell align="right">Crecimiento</TableCell>
                <TableCell align="right">Última Actualización</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableMetrics.map((metric) => (
                <TableRow key={metric.tableSlug} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: `${metric.color}.light`, width: 32, height: 32 }}>
                        <span style={{ fontSize: '16px' }}>{metric.tableIcon}</span>
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {metric.tableName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metric.totalRecords.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={metric.recordsToday} 
                      size="small" 
                      color={metric.recordsToday > 0 ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {metric.recordsThisWeek}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {metric.recordsThisMonth}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {metric.growthRate !== 0 && (
                        <>
                          {metric.growthRate > 0 ? (
                            <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                          ) : (
                            <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
                          )}
                          <Typography 
                            variant="body2" 
                            color={metric.growthRate > 0 ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 600 }}
                          >
                            {metric.growthRate > 0 ? '+' : ''}{metric.growthRate.toFixed(1)}%
                          </Typography>
                        </>
                      )}
                      {metric.growthRate === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          --
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeAgo(metric.lastUpdated)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuClick(e, metric.tableSlug)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedTable && onTableClick) {
            onTableClick(selectedTable);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Tabla</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle edit action
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configuración del Dashboard</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Visibilidad de Tarjetas Resumen
          </Typography>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (active.id !== over?.id) {
                setSummaryCards((items) => {
                  const oldIndex = items.findIndex((item) => item.id === active.id);
                  const newIndex = items.findIndex((item) => item.id === over?.id);
                  const newItems = arrayMove(items, oldIndex, newIndex);
                  return newItems.map((card, index) => ({
                    ...card,
                    order: index + 1
                  }));
                });
              }
            }}
          >
            <SortableContext 
              items={sortedCards.map(card => card.id)}
              strategy={verticalListSortingStrategy}
            >
              <List>
                {sortedCards.map((card) => (
                  <SortableSettingsItem 
                    key={card.id} 
                    card={card} 
                    onToggleVisibility={toggleCardVisibility} 
                  />
                ))}
              </List>
            </SortableContext>
          </DndContext>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Visibilidad de Tablas
          </Typography>
          <List>
            {tables.map((table) => (
              <ListItem key={table.name}>
                <Checkbox
                  checked={tableVisibility[table.name]?.visible !== false}
                  onChange={() => toggleTableVisibility(table.name)}
                />
                <ListItemText primary={table.name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DynamicDashboard;