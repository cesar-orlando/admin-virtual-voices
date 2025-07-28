import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, Refresh, BugReport } from '@mui/icons-material';
import { 
  getChatMetrics, 
  getRealTimeChatMetrics,
  getAvailableChatSources,
  getSampleChatData,
  getChatStructureAnalysis
} from '../api/servicios/chatMetricsServices';

interface ChatMetricsDebuggerProps {
  companySlug: string;
}

interface TestResults {
  generalMetrics?: unknown;
  realtimeMetrics?: unknown;
  sources?: unknown;
  sampleData?: unknown;
  structureAnalysis?: unknown;
  timestamp?: string;
}

export function ChatMetricsDebugger({ companySlug }: ChatMetricsDebuggerProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResults>({});
  const [error, setError] = useState<string | null>(null);

  const testAllEndpoints = async () => {
    setLoading(true);
    setError(null);
    setResults({});

    try {
      console.log('🧪 Testing all chat metrics endpoints for:', companySlug);
      
      // Determine if this is Quick Learning or WhatsApp based on company slug
      const isQuickLearning = companySlug === 'quicklearning' || companySlug.includes('quicklearning');
      
      console.log(`📊 Dashboard type: ${isQuickLearning ? 'Quick Learning' : 'WhatsApp'}`);

      // Test 1: General metrics (will auto-determine chat type)
      console.log('1. Testing general metrics...');
      const generalMetrics = await getChatMetrics(companySlug, '30days');
      
      // Test 2: Real-time metrics (will auto-determine chat type)
      console.log('2. Testing real-time metrics...');
      const realtimeMetrics = await getRealTimeChatMetrics(companySlug);
      
      // Test 3: Available sources
      console.log('3. Testing available sources...');
      const sources = await getAvailableChatSources(companySlug);
      
      // Test 4: Sample data (will auto-determine source type)
      console.log('4. Testing sample data...');
      const sampleData = await getSampleChatData(companySlug);

      // Test 5: Structure analysis
      console.log('5. Testing structure analysis...');
      const structureAnalysis = await getChatStructureAnalysis(companySlug);

      setResults({
        generalMetrics,
        realtimeMetrics,
        sources,
        sampleData,
        structureAnalysis,
        timestamp: new Date().toISOString()
      });

      console.log('✅ All tests completed successfully');

    } catch (err: unknown) {
      console.error('❌ Error during testing:', err);
      setError(err instanceof Error ? err.message : 'Error during API testing');
    } finally {
      setLoading(false);
    }
  };

  const formatJSON = (data: unknown) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <BugReport color="primary" />
            <Typography variant="h5" component="h1">
              Chat Metrics API Debugger
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Testing chat metrics integration for company: <strong>{companySlug}</strong>
          </Typography>

          <Button
            variant="contained"
            onClick={testAllEndpoints}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            sx={{ mr: 2 }}
          >
            {loading ? 'Testing...' : 'Test All Endpoints'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Error:</strong> {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {Object.keys(results).length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Test Results ({results.timestamp})
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>📊 General Metrics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {formatJSON(results.generalMetrics)}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>⚡ Real-time Metrics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {formatJSON(results.realtimeMetrics)}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>🔍 Available Sources</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {formatJSON(results.sources)}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>📝 Sample Data</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {formatJSON(results.sampleData)}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>🏗️ Structure Analysis</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {formatJSON(results.structureAnalysis)}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );
}
