import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Tooltip
} from '@mui/material'
import {
  Assignment as TaskIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { TaskStats } from '../types/tasks'

interface TaskStatsProps {
  stats: TaskStats | null
  loading?: boolean
  isGlobalView?: boolean
}

const statusColors = {
  todo: '#1976d2',
  in_progress: '#ed6c02', 
  review: '#9c27b0',
  done: '#2e7d32'
}

const priorityColors = {
  low: '#CCCCCC',
  medium: '#0088FF',
  high: '#FFAA00', 
  urgent: '#FF4444'
}

const TaskStatsComponent: React.FC<TaskStatsProps> = ({
  stats,
  loading = false,
  isGlobalView = false
}) => {
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Estadísticas de Tareas
        </Typography>
        <LinearProgress sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Cargando estadísticas...
        </Typography>
      </Box>
    )
  }

  if (!stats) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hay estadísticas disponibles
        </Typography>
      </Paper>
    )
  }

  // Prepare data for charts
  const statusData = stats.statusStats.map(stat => ({
    name: getStatusLabel(stat._id),
    value: stat.count,
    color: statusColors[stat._id]
  }))

  const priorityData = stats.priorityStats.map(stat => ({
    name: getPriorityLabel(stat._id),
    value: stat.count,
    color: priorityColors[stat._id]
  }))

  function getStatusLabel(status: string): string {
    const labels = {
      todo: 'Por Hacer',
      in_progress: 'En Progreso',
      review: 'En Revisión', 
      done: 'Completadas'
    }
    return labels[status as keyof typeof labels] || status
  }

  function getPriorityLabel(priority: string): string {
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  // Calculate completion rate
  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.statusStats.find(s => s._id === 'done')?.count || 0) / stats.totalTasks * 100)
    : 0

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📊 Estadísticas de Tareas
        {isGlobalView && (
          <Chip label="Vista Global" size="small" color="primary" variant="outlined" />
        )}
      </Typography>

      <Grid container spacing={3}>
        {/* Key Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TaskIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {stats.totalTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Tareas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {completionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {stats.overdueCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vencidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {stats.statusStats.find(s => s._id === 'in_progress')?.count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En Progreso
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Distribución por Estado
            </Typography>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${percent ? (percent * 100).toFixed(0) : '0'}%)`
                    }
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos para mostrar
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Priority Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Distribución por Prioridad
            </Typography>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`priority-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos para mostrar
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Task Status Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Desglose Detallado
            </Typography>
            <Grid container spacing={2}>
              {stats.statusStats.map((stat) => {
                const percentage = stats.totalTasks > 0 
                  ? Math.round((stat.count / stats.totalTasks) * 100) 
                  : 0
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={stat._id}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {getStatusLabel(stat._id)}
                        </Typography>
                        <Chip 
                          label={stat.count} 
                          size="small" 
                          sx={{ 
                            backgroundColor: statusColors[stat._id as keyof typeof statusColors],
                            color: 'white'
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          sx={{ 
                            flexGrow: 1, 
                            height: 8, 
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: statusColors[stat._id as keyof typeof statusColors]
                            }
                          }} 
                        />
                        <Typography variant="caption" color="text.secondary">
                          {percentage}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TaskStatsComponent