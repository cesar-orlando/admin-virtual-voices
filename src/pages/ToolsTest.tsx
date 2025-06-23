import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ToolsTest: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Página de Prueba - Herramientas
      </Typography>
      <Typography variant="body1" paragraph>
        Esta es una página de prueba para verificar que las rutas de herramientas funcionen correctamente.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/herramientas')}
      >
        Ir a Lista de Herramientas
      </Button>
    </Box>
  );
};

export default ToolsTest; 