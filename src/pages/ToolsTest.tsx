import React from 'react';
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ToolsTest: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      minHeight: { xs: '100vh', md: '85vh' }
    }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.5rem', md: '2.125rem' },
          fontWeight: 700
        }}
      >
        Página de Prueba - Herramientas
      </Typography>
      <Typography 
        variant="body1" 
        paragraph
        sx={{ 
          fontSize: { xs: '0.875rem', md: '1rem' },
          mb: 3
        }}
      >
        Esta es una página de prueba para verificar que las rutas de herramientas funcionen correctamente.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/herramientas')}
        size={isMobile ? "medium" : "large"}
        sx={{ 
          fontSize: { xs: '0.875rem', md: '1rem' },
          px: { xs: 3, md: 4 },
          py: { xs: 1, md: 1.5 }
        }}
      >
        Ir a Lista de Herramientas
      </Button>
    </Box>
  );
};

export default ToolsTest; 