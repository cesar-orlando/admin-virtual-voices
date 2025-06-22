import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTableBySlug } from '../api/servicios'
import DynamicDataTable from '../components/DynamicDataTable'
import type { DynamicTable, DynamicRecord } from '../types'

export default function TableRecords() {
  const [table, setTable] = useState<DynamicTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { tableSlug } = useParams<{ tableSlug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const theme = useTheme()

  useEffect(() => {
    if (tableSlug && user) {
      loadTable()
    }
  }, [tableSlug, user])

  const loadTable = async () => {
    if (!tableSlug || !user) return

    try {
      setLoading(true)
      setError(null)
      const tableData = await getTableBySlug(tableSlug, user)
      setTable(tableData)
    } catch (err) {
      setError('Error al cargar la tabla')
      console.error('Error loading table:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordCreate = () => {
    navigate(`/tablas/${tableSlug}/nuevo`)
  }

  const handleRecordEdit = (record: DynamicRecord) => {
    navigate(`/tablas/${tableSlug}/editar/${record._id}`)
  }

  const handleRecordView = (record: DynamicRecord) => {
    navigate(`/tablas/${tableSlug}/ver/${record._id}`)
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <Box
        component="main"
        sx={{
          p: 3,
          width: '90vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(30,30,40,0.95)'
            : 'rgba(255,255,255,0.96)',
        }}
      >
        <Skeleton variant="text" width="40%" height={48} />
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ mt: 3 }}>
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Box>
    )
  }

  if (error || !table) {
    return (
      <Box
        component="main"
        sx={{
          p: 3,
          width: '90vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(30,30,40,0.95)'
            : 'rgba(255,255,255,0.96)',
        }}
      >
        <Alert severity="error">{error || 'No se pudo cargar la tabla'}</Alert>
      </Box>
    )
  }

  return (
    <Box
      component="main"
      sx={{
        p: 3,
        width: '90vw',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(30,30,40,0.95)'
          : 'rgba(255,255,255,0.96)',
      }}
    >
      <DynamicDataTable
        table={table}
        onRecordCreate={handleRecordCreate}
        onRecordEdit={handleRecordEdit}
        onRecordView={handleRecordView}
        refreshTrigger={refreshTrigger}
      />
    </Box>
  )
}
