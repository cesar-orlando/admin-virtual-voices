import React, { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
  IconButton,
  useTheme,
  Tooltip,
  TableSortLabel,
  InputAdornment,
  Card,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import { es } from 'date-fns/locale'

interface Column {
  id: string
  label: string
  minWidth?: number
  format?: (value: any) => string | JSX.Element
}

interface DataTableProps {
  title: string
  columns: Column[]
  rows: any[]
  sortBy: string
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
  filters?: {
    dateAfter?: boolean
    dateBefore?: boolean
    evaluation?: boolean
  }
  onFilterChange: (filters: any) => void
}

export default function DataTable({
  title,
  columns,
  rows,
  sortBy,
  sortDirection,
  onSort,
  filters,
  onFilterChange,
}: DataTableProps) {
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const [dateAfter, setDateAfter] = useState<Date | null>(null)
  const [dateBefore, setDateBefore] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filteredRows, setFilteredRows] = useState(rows)

  // Función para filtrar las filas basado en el término de búsqueda
  const filterRows = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredRows(rows)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = rows.filter(row => {
      return columns.some(column => {
        const value = row[column.id]
        if (value == null) return false
        
        // Si el valor es una fecha, convertirla a string para búsqueda
        if (value instanceof Date) {
          return value.toLocaleDateString('es-ES').toLowerCase().includes(searchLower)
        }
        
        // Para otros tipos de valores
        return String(value).toLowerCase().includes(searchLower)
      })
    })
    setFilteredRows(filtered)
  }

  // Actualizar filteredRows cuando cambien las filas originales
  useEffect(() => {
    filterRows(search)
  }, [rows])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearch(newSearch)
    filterRows(newSearch)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          p: 3,
          pb: showFilters ? 1 : 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
            fontFamily: 'Montserrat, Arial, sans-serif',
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder="Buscar..."
            size="small"
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color:'#8B5CF6',
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(59, 130, 246, 0.05)',
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'rgba(59, 130, 246, 0.1)',
                },
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? '#8B5CF6' : '#3B82F6',
                },
              },
            }}
          />
          <Tooltip title="Filtros">
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(59, 130, 246, 0.05)',
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'rgba(59, 130, 246, 0.1)',
                },
              }}
            >
              <FilterListIcon
                sx={{ color: '#8B5CF6' }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {showFilters && filters && (
        <Box
          sx={{
            mx: 3,
            mb: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor:"#fff",
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            {filters.dateAfter && (
              <DatePicker
                label="Fecha desde"
                value={dateAfter}
                onChange={newValue => {
                  setDateAfter(newValue)
                  onFilterChange({ dateAfter: newValue, dateBefore })
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 2,
                      '& .MuiInputBase-root': {
                        color: '#8B5CF6',
                        borderRadius: 2,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#8B5CF6',
                      },
                      '& .MuiIconButton-root': {
                        color: '#8B5CF6',
                      },
                    },
                  },
                }}
              />
            )}
            {filters.dateBefore && (
              <DatePicker
                label="Fecha hasta"
                value={dateBefore}
                onChange={newValue => {
                  setDateBefore(newValue)
                  onFilterChange({ dateAfter, dateBefore: newValue })
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 2,
                      '& .MuiInputBase-root': {
                        color: '#8B5CF6',
                        borderRadius: 2,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#8B5CF6',
                      },
                      '& .MuiIconButton-root': {
                        color: '#8B5CF6',
                      },
                    },
                  },
                }}
              />
            )}
          </LocalizationProvider>
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={{
          flex: 1,
          mx: 3,
          mb: 3,
          borderRadius: 3,
          overflow: 'auto',
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 4px 24px rgba(139, 92, 246, 0.1)'
              : '0 4px 24px rgba(139, 92, 246, 0.05)',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background:
              theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background:
              theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.id}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={sortBy === column.id ? sortDirection : false}
                  sx={{
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 40, 0.98)'
                        : 'rgba(255, 255, 255, 0.98)',
                    borderBottom: `2px solid ${
                      theme.palette.mode === 'dark'
                        ? 'rgba(139, 92, 246, 0.2)'
                        : 'rgba(59, 130, 246, 0.1)'
                    }`,
                    color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    py: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <TableSortLabel
                    active={sortBy === column.id}
                    direction={sortBy === column.id ? sortDirection : 'asc'}
                    onClick={() => onSort(column.id)}
                    sx={{
                      '&.MuiTableSortLabel-root': {
                        color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
                      },
                      '&.MuiTableSortLabel-root:hover': {
                        color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6',
                      },
                      '&.Mui-active': {
                        color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6',
                        '& .MuiTableSortLabel-icon': {
                          color: theme.palette.mode === 'dark' ? '#E05EFF' : '#8B5CF6',
                        },
                      },
                    }}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row, index) => (
              <TableRow
                hover
                key={index}
                sx={{
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(139, 92, 246, 0.1)'
                        : 'rgba(59, 130, 246, 0.05)',
                  },
                  transition: 'background-color 0.2s ease-out',
                }}
              >
                {columns.map(column => {
                  const value = row[column.id]
                  return (
                    <TableCell
                      key={column.id}
                      sx={{
                        borderBottom: `1px solid ${
                          theme.palette.mode === 'dark'
                            ? 'rgba(139, 92, 246, 0.1)'
                            : 'rgba(59, 130, 246, 0.05)'
                        }`,
                        color:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.9)'
                            : 'rgba(30, 30, 40, 0.9)',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {column.format ? column.format(value) : value}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
