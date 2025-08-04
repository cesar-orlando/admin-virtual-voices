import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { createTable } from '../api/servicios';

interface TableField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'boolean' | 'select' | 'currency' | 'file';
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  order: number;
  width?: number;
}

interface CreateTableRequest {
  name: string;
  slug: string;
  icon: string;
  description?: string;
  fields: TableField[];
  isActive?: boolean;
}

const DateFieldDebugger: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDateFieldCreation = async () => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Test data with date field
      const testTableData: CreateTableRequest = {
        name: "Debug Date Field Test",
        slug: "debug-date-field-test",
        icon: "🧪",
        description: "Testing date field creation",
        fields: [
          {
            name: "test_date",
            label: "Test Date",
            type: "date",
            required: true,
            order: 1,
            width: 150,
          },
          {
            name: "description",
            label: "Description", 
            type: "text",
            required: false,
            order: 2,
            width: 200,
          }
        ],
        isActive: true,
      };

      console.log('🔍 Testing table creation with date field...');
      console.log('📤 Payload:', JSON.stringify(testTableData, null, 2));

      const result = await createTable(testTableData, user);
      
      console.log('✅ Success! Table created:', result);
      setTestResult({
        success: true,
        message: 'Table with date field created successfully!',
        data: result,
      });

    } catch (err: any) {
      console.error('❌ Error creating table with date field:', err);
      
      const errorMessage = err?.message || 'Unknown error occurred';
      const errorResponse = err?.response?.data;
      
      setError(errorMessage);
      setTestResult({
        success: false,
        message: errorMessage,
        details: errorResponse,
        fullError: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const testFieldTypes = () => {
    const FIELD_TYPES = [
      { value: 'text', label: 'Texto', icon: '📝' },
      { value: 'email', label: 'Email', icon: '📧' },
      { value: 'number', label: 'Número', icon: '🔢' },
      { value: 'date', label: 'Fecha', icon: '📅' },
      { value: 'boolean', label: 'Booleano', icon: '✅' },
      { value: 'select', label: 'Selección', icon: '📋' },
      { value: 'currency', label: 'Moneda', icon: '💰' },
      { value: 'file', label: 'Archivo', icon: '📎' },
    ];

    console.log('📋 Available field types:');
    FIELD_TYPES.forEach(type => {
      console.log(`  ${type.icon} ${type.label} (${type.value})`);
    });

    return FIELD_TYPES;
  };

  const availableTypes = testFieldTypes();

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🧪 Date Field Debugger
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This tool helps debug date field creation issues in table structure.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Field Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableTypes.map((type) => (
                  <Chip
                    key={type.value}
                    label={`${type.icon} ${type.label}`}
                    color={type.value === 'date' ? 'primary' : 'default'}
                    variant={type.value === 'date' ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Date Field Creation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click to test creating a table with a date field
              </Typography>
              <Button 
                variant="contained" 
                onClick={testDateFieldCreation}
                disabled={loading || !user}
                fullWidth
              >
                {loading ? 'Testing...' : 'Test Date Field Creation'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">
              <Typography variant="subtitle2" gutterBottom>
                Error Details:
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          </Grid>
        )}

        {testResult && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {testResult.message}
              </Alert>

              {testResult.details && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Backend Response:
                  </Typography>
                  <Paper sx={{ p: 1, bgcolor: 'grey.100', fontSize: '12px' }}>
                    <pre>{JSON.stringify(testResult.details, null, 2)}</pre>
                  </Paper>
                </Box>
              )}

              {testResult.data && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Success Data:
                  </Typography>
                  <Paper sx={{ p: 1, bgcolor: 'success.light', fontSize: '12px' }}>
                    <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DateFieldDebugger;
