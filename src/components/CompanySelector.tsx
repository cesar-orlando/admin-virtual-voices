import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  Business as BusinessIcon,
  Public as GlobalIcon
} from '@mui/icons-material'
import { useCompanies } from '../hooks/useTasks'
import type { Company } from '../types/tasks'

interface CompanySelectorProps {
  userRole?: string
  userCompany?: string
  selectedCompany: string
  onCompanyChange: (companySlug: string) => void
  sx?: any
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
  userRole,
  userCompany,
  selectedCompany,
  onCompanyChange,
  sx = {}
}) => {
  const { companies, loading, canSelectCompanies } = useCompanies(userRole, userCompany)

  // Check if user is VirtualVoices
  const isVirtualVoices = userCompany?.toLowerCase().includes('virtual') || 
                         userRole === 'SuperAdmin'

  console.log('🏢 CompanySelector - Detection:', {
    userRole,
    userCompany,
    isVirtualVoices,
    canSelectCompanies
  })

  // If user can't select companies, show current company name
  if (!canSelectCompanies) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
        <BusinessIcon color="primary" />
        <Typography variant="h6" component="div">
          {userCompany || 'Mi Empresa'}
        </Typography>
      </Box>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Cargando empresas...</Typography>
      </Box>
    )
  }

  // Show selector for SuperAdmin and VirtualVoices users
  return (
    <FormControl sx={{ minWidth: 200, ...sx }}>
      <InputLabel id="company-selector-label">Empresa</InputLabel>
      <Select
        labelId="company-selector-label"
        value={selectedCompany}
        label="Empresa"
        onChange={(e) => onCompanyChange(e.target.value)}
        size="small"
      >
        {companies.map((company: Company) => (
          <MenuItem key={company.slug} value={company.slug}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              {company.isSpecial ? (
                <GlobalIcon fontSize="small" color="primary" />
              ) : (
                <BusinessIcon fontSize="small" />
              )}
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {company.name}
              </Typography>
              {company.isSpecial && (
                <Chip 
                  label="Global" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default CompanySelector