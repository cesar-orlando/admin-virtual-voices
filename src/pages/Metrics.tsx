import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';

import { useAuth } from '../hooks/useAuth';
import DynamicDashboard from '../components/DynamicDashboard';
import DashboardQuickLearning from '../components/DashboardQuickLearning';
import { useNavigate } from 'react-router-dom';


const Metrics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isQuickLearning = user?.companySlug === 'quicklearning';
  const isAdmin = user?.role === 'Administrador' as any;

  const handleTableClick = (tableSlug: string) => {
    navigate(`/tablas/${tableSlug}`);
  };

  // Si es QuickLearning y admin, mostrar dashboard específico
  if (isQuickLearning && isAdmin) {
    return <DashboardQuickLearning />;
  }

  // Para otras empresas o si no es admin, mostrar dashboard dinámico
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '80vh', minWidth: '90vw' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Paper elevation={0} sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecf3 100%)',
          border: '1.5px solid #d1d5db',
          width: '100%',
          maxWidth: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 32px #6C63FF10',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Box sx={{
              bgcolor: '#6C63FF',
              color: '#fff',
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              fontSize: 36,
              boxShadow: '0 2px 12px #6C63FF30',
            }}>
              <span role="img" aria-label="metrics">📊</span>
            </Box>
            
            {/* Tables Dashboard */}
            <DynamicDashboard 
              companySlug={user?.companySlug ?? ''}
              onTableClick={handleTableClick}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Metrics;