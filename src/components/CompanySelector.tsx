import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import type { CompanyConfig } from '../types';
import type { SelectChangeEvent } from '@mui/material';

interface CompanySelectorProps {
  value: string;
  onChange: (companySlug: string, company: CompanyConfig | null) => void;
  onEmailChange?: (email: string) => void;
  email?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const availableCompanies: CompanyConfig[] = [
  {
    slug: "quicklearning",
    name: "Quick Learning",
    displayName: "Quick Learning Enterprise",
    isEnterprise: true,
    features: {
      quickLearning: true,
      controlMinutos: true,
      elevenLabs: true,
      autoAssignment: true
    },
    database: { type: 'external' },
    branding: {
      primaryColor: "#E05EFF",
      secondaryColor: "#8B5CF6"
    }
  },
  {
    slug: "test",
    name: "Empresa Regular",
    displayName: "Empresa Regular",
    isEnterprise: false,
    features: {},
    database: { type: 'local' }
  }
];

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  value,
  onChange,
  onEmailChange,
  email,
  error = false,
  helperText,
  disabled = false
}) => {
  const [selectedCompany, setSelectedCompany] = useState<CompanyConfig | null>(null);
  const [autoDetected, setAutoDetected] = useState<string | null>(null);

  // Auto-detect company based on email domain
  useEffect(() => {
    if (email && onEmailChange) {
      const domain = email.split('@')[1];
      if (domain === 'quicklearning.com') {
        setAutoDetected('quicklearning');
        const company = availableCompanies.find(c => c.slug === 'quicklearning');
        if (company && value !== 'quicklearning') {
          onChange('quicklearning', company);
        }
      } else {
        setAutoDetected(null);
      }
    }
  }, [email, onChange, value, onEmailChange]);

  // Update selected company when value changes
  useEffect(() => {
    const company = availableCompanies.find(c => c.slug === value);
    setSelectedCompany(company || null);
  }, [value]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const companySlug = event.target.value;
    const company = availableCompanies.find(c => c.slug === companySlug) || null;
    setSelectedCompany(company);
    onChange(companySlug, company);
  };

  return (
    <Box>
      <FormControl 
        fullWidth 
        margin="normal"
        error={error}
        disabled={disabled}
      >
        <InputLabel 
          id="company-selector-label"
          sx={{ color: "#BDBDBD" }}
        >
          Empresa / Organización
        </InputLabel>
        <Select
          labelId="company-selector-label"
          id="company-selector"
          value={value}
          label="Empresa / Organización"
          onChange={handleChange}
          sx={{
            color: "#fff",
            fieldset: { 
              borderColor: error ? "#E05EFF" : "#8B5CF6" 
            },
            '& .Mui-focused fieldset': {
              borderColor: "#E05EFF",
              boxShadow: "0 0 8px 2px #E05EFF55",
            },
            '& .MuiSelect-icon': {
              color: "#8B5CF6"
            }
          }}
        >
          {availableCompanies.map((company) => (
            <MenuItem 
              key={company.slug} 
              value={company.slug}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
                backgroundColor: company.isEnterprise ? 'rgba(224, 94, 255, 0.05)' : 'transparent'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {company.displayName}
                </Typography>
                {company.isEnterprise && (
                  <Chip
                    label="Enterprise"
                    size="small"
                    sx={{
                      ml: 1,
                      backgroundColor: '#E05EFF',
                      color: '#fff',
                      fontSize: '0.7rem',
                      height: '20px'
                    }}
                  />
                )}
                {autoDetected === company.slug && (
                  <Chip
                    label="Auto-detectado"
                    size="small"
                    sx={{
                      ml: 1,
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      fontSize: '0.7rem',
                      height: '20px'
                    }}
                  />
                )}
              </Box>
              {company.isEnterprise && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary', 
                    mt: 0.5,
                    fontStyle: 'italic'
                  }}
                >
                  Base de datos enterprise externa • Funciones avanzadas
                </Typography>
              )}
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: error ? '#f44336' : '#BDBDBD',
              mt: 0.5,
              px: 1
            }}
          >
            {helperText}
          </Typography>
        )}
      </FormControl>

      {/* Company features display */}
      {selectedCompany && (
        <Box sx={{ mt: 1, p: 1, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" sx={{ color: '#BDBDBD', fontWeight: 600 }}>
            Funciones disponibles:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {Object.entries(selectedCompany.features).map(([feature, enabled]) => 
              enabled ? (
                <Tooltip key={feature} title={getFeatureDescription(feature)}>
                  <Chip
                    label={getFeatureDisplayName(feature)}
                    size="small"
                    sx={{
                      backgroundColor: selectedCompany.isEnterprise ? '#8B5CF6' : '#607D8B',
                      color: '#fff',
                      fontSize: '0.6rem',
                      height: '18px'
                    }}
                  />
                </Tooltip>
              ) : null
            )}
            {!selectedCompany.isEnterprise && (
              <Chip
                label="Funciones Básicas"
                size="small"
                sx={{
                  backgroundColor: '#607D8B',
                  color: '#fff',
                  fontSize: '0.6rem',
                  height: '18px'
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Helper functions for feature display
function getFeatureDisplayName(feature: string): string {
  const displayNames: Record<string, string> = {
    quickLearning: 'Quick Learning',
    controlMinutos: 'Control de Minutos',
    elevenLabs: 'ElevenLabs AI',
    autoAssignment: 'Asignación Automática'
  };
  return displayNames[feature] || feature;
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    quickLearning: 'Acceso a funciones avanzadas de Quick Learning Enterprise',
    controlMinutos: 'Control y seguimiento de minutos de uso',
    elevenLabs: 'Integración con ElevenLabs para síntesis de voz',
    autoAssignment: 'Asignación automática de tareas y recursos'
  };
  return descriptions[feature] || 'Función disponible';
}

export default CompanySelector;