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
  Button,
} from '@mui/material'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
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
    dateRange?: boolean
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
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [showFilters, setShowFilters] = useState(false)
  const [filteredRows, setFilteredRows] = useState(rows)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Función para filtrar las filas basado en búsqueda y fechas
  const filterRows = (searchTerm: string, [startDate, endDate]: [Date | null, Date | null]) => {
    let filtered = [...rows]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(row => {
        return columns.some(column => {
          const value = row[column.id]
          if (value == null) return false
          return String(value).toLowerCase().includes(searchLower)
        })
      })
    }

    // Filtrar por fecha
    if (startDate || endDate) {
      filtered = filtered.filter(row => {
        const rowDate = new Date(row.lastLogin)
        if (!rowDate.getTime()) return true // Si la fecha no es válida, incluir la fila
        
        if (startDate && endDate) {
          const endOfDay = new Date(endDate)
          endOfDay.setHours(23, 59, 59, 999)
          return rowDate >= startDate && rowDate <= endOfDay
        }
        if (startDate) {
          return rowDate >= startDate
        }
        if (endDate) {
          const endOfDay = new Date(endDate)
          endOfDay.setHours(23, 59, 59, 999)
          return rowDate <= endOfDay
        }
        return true
      })
    }

    setFilteredRows(filtered)
  }

  // Actualizar filtros cuando cambien las filas originales
  useEffect(() => {
    filterRows(search, dateRange)
  }, [rows])

  // Manejar cambios en la búsqueda
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearch(newSearch)
    filterRows(newSearch, dateRange)
  }

  // Manejar cambios en el rango de fechas
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    setDateRange(dates)
    filterRows(search, dates)
    onFilterChange({ dateRange: dates })
  }

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSearch('')
    setStartDate(null)
    setEndDate(null)
    setDateRange([null, null])
    filterRows('', [null, null])
    onFilterChange({ dateRange: [null, null] })
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
          {(search || dateRange[0] || dateRange[1]) && (
            <Tooltip title="Limpiar filtros">
              <IconButton
                onClick={handleClearFilters}
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
                <ClearIcon sx={{ color: '#8B5CF6' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {showFilters && filters && (
        <Box
          sx={{
            mx: 3,
            mb: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: "#fff",
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            '& .react-datepicker-wrapper': {
              width: '300px',
            },
            '& .react-datepicker': {
              fontFamily: 'Montserrat, Arial, sans-serif',
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: '1rem',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)',
              overflow: 'hidden',
            },
            '& .react-datepicker__header': {
              backgroundColor: '#8B5CF6',
              borderBottom: 'none',
              padding: '1rem',
              fontWeight: 600,
              position: 'relative',
            },
            '& .react-datepicker__current-month': {
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'capitalize',
            },
            '& .react-datepicker__day-name': {
              color: '#fff',
              fontWeight: 500,
              width: '2.5rem',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
            },
            '& .react-datepicker__navigation': {
              top: '1rem',
              '&:hover': {
                opacity: 0.8,
              },
            },
            '& .react-datepicker__navigation-icon::before': {
              borderColor: '#fff',
            },
            '& .react-datepicker__day': {
              width: '2.5rem',
              height: '2.5rem',
              lineHeight: '2.5rem',
              borderRadius: '50%',
              margin: '0.2rem',
              color: '#4B5563',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              },
            },
            '& .react-datepicker__day--selected, & .react-datepicker__day--in-range': {
              backgroundColor: '#8B5CF6',
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#7C3AED',
              },
            },
            '& .react-datepicker__day--keyboard-selected': {
              backgroundColor: '#8B5CF6',
              color: '#fff',
              fontWeight: 600,
            },
            '& .react-datepicker__day--in-selecting-range': {
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '0',
            },
            '& .react-datepicker__day--in-range': {
              backgroundColor: 'rgba(139, 92, 246, 0.8)',
              borderRadius: '0',
            },
            '& .react-datepicker__day--range-start, & .react-datepicker__day--range-end': {
              backgroundColor: '#8B5CF6',
              color: '#fff',
              fontWeight: 600,
              borderRadius: '50%',
            },
            '& .react-datepicker__day--disabled': {
              color: '#CBD5E1',
            },
            '& .react-datepicker__triangle': {
              display: 'none',
            },
            '& .react-datepicker__month': {
              margin: '0.8rem',
            },
            '& .react-datepicker__input-container': {
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%238B5CF6\'%3E%3Cpath d=\'M19,4H17V3a1,1,0,0,0-2,0V4H9V3A1,1,0,0,0,7,3V4H5A2,2,0,0,0,3,6V20a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2V6A2,2,0,0,0,19,4ZM19,20H5V9H19Z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                opacity: 0.7,
                pointerEvents: 'none',
                display: 'var(--show-calendar-icon, block)',
              },
            },
            '& .react-datepicker__input-container input': {
              width: '100%',
              padding: '0.75rem 1rem',
              paddingRight: '2.5rem',
              borderRadius: '0.75rem',
              border: '2px solid #E2E8F0',
              fontSize: '0.95rem',
              fontFamily: 'Montserrat, Arial, sans-serif',
              color: '#1a1a1a',
              backgroundColor: '#fff',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#8B5CF6',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)',
              },
              '&:focus': {
                outline: 'none',
                borderColor: '#8B5CF6',
                boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
              },
              '&::placeholder': {
                color: '#94A3B8',
              },
            },
            '& .react-datepicker__close-icon': {
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '0',
              display: 'var(--show-clear-button, none)',
              '&::after': {
                backgroundColor: 'transparent',
                color: '#8B5CF6',
                fontSize: '18px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid currentColor',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                content: '"×"',
                '&:hover': {
                  backgroundColor: '#8B5CF6',
                  color: '#fff',
                  transform: 'scale(1.1)',
                },
              },
            },
            ...(dateRange[0] || dateRange[1] ? {
              '--show-calendar-icon': 'none',
              '--show-clear-button': 'block',
            } : {
              '--show-calendar-icon': 'block',
              '--show-clear-button': 'none',
            }),
          }}
        >
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            isClearable={true}
            placeholderText="Seleccionar rango de fechas"
            locale={es}
            showPopperArrow={false}
            className="date-picker-input"
          />
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
