import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Upload as UploadIcon, CheckCircle as CheckIcon, Warning as WarningIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

// Date formatting utility function
const formatDateField = (value: any, fieldType?: string): any => {
  if (fieldType === 'date' && value) {
    // Handle Excel serial date numbers
    if (typeof value === 'number' && value > 25000 && value < 100000) {
      try {
        // Excel stores dates as serial numbers (days since 1900-01-01)
        const excelDate = XLSX.SSF.format('yyyy-mm-dd', value);
        return excelDate;
      } catch (e) {
        console.warn('Error formatting Excel date number:', value, e);
      }
    }
    
    // Handle string dates
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          // Return in ISO format (YYYY-MM-DD)
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Error parsing date string:', value, e);
      }
    }
    
    // Handle Date objects
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }
  }
  
  return value;
};

// Enhanced field validation
const validateFieldValue = (value: any, field: TableField): { valid: boolean; message?: string } => {
  if (field.required && (!value || value.toString().trim() === '')) {
    return { valid: false, message: `${field.label} es requerido` };
  }
  
  if (field.type === 'date' && value && value.toString().trim()) {
    const formattedDate = formatDateField(value, 'date');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formattedDate)) {
      return { valid: false, message: `${field.label} debe tener formato de fecha válido (YYYY-MM-DD)` };
    }
  }
  
  if (field.type === 'email' && value && value.toString().trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.toString())) {
      return { valid: false, message: `${field.label} debe tener formato de email válido` };
    }
  }
  
  if (field.type === 'number' && value && value.toString().trim()) {
    if (isNaN(Number(value))) {
      return { valid: false, message: `${field.label} debe ser un número válido` };
    }
  }
  
  return { valid: true };
};

interface ExcelData {
  [key: string]: unknown;
}

interface TableField {
  key: string;
  label: string;
  required: boolean;
  type?: string;
}

interface ImportResult {
  newRecords: number;
  updatedRecords: number;
  duplicatesSkipped: number;
  errors: string[];
}

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  tableFields: TableField[];
  onImport: (data: ExcelData[], options: ImportOptions) => Promise<ImportResult>;
}

interface ImportOptions {
  duplicateStrategy: 'skip' | 'update' | 'create';
  identifierField: string;
  updateExistingFields: boolean;
}

const steps = ['Subir archivo', 'Mapear columnas', 'Configurar importación'];

export function ExcelImportDialog({ open, onClose, tableFields, onImport }: ExcelImportDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  
  // Import options
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'create'>('skip');
  const [identifierField, setIdentifierField] = useState<string>('');
  const [updateExistingFields, setUpdateExistingFields] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add this function to automatically map fields when headers match
  const autoMapFields = (excelHeaders: string[], tableFields: TableField[]) => {
    const mapping: Record<string, string> = {};
    
    tableFields.forEach(field => {
      // Try exact match first
      const exactMatch = excelHeaders.find(header => 
        header.toLowerCase() === field.label.toLowerCase() ||
        header.toLowerCase() === field.key.toLowerCase()
      );
      
      if (exactMatch) {
        mapping[field.key] = exactMatch;
        return;
      }
      
      // Try partial match (contains)
      const partialMatch = excelHeaders.find(header => 
        header.toLowerCase().includes(field.label.toLowerCase()) ||
        field.label.toLowerCase().includes(header.toLowerCase())
      );
      
      if (partialMatch) {
        mapping[field.key] = partialMatch;
      }
    });
    
    return mapping;
  };

  // Update the handleFileUpload function
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setError('El archivo debe tener al menos 2 filas (encabezados + datos)');
          setLoading(false);
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const formattedData = rows
          .filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''))
          .map((row) => {
            const obj: ExcelData = {};
            headers.forEach((header, index) => {
              const rawValue = row[index] || '';
              
              // Find the table field that maps to this header
              const mappedFieldKey = Object.keys(fieldMapping).find(key => fieldMapping[key] === header);
              const tableField = tableFields.find(f => f.key === mappedFieldKey);
              
              // Format the value based on field type
              if (tableField?.type === 'date') {
                obj[header] = formatDateField(rawValue, 'date');
              } else {
                obj[header] = rawValue;
              }
            });
            return obj;
          });
        
        setExcelHeaders(headers);
        setExcelData(formattedData);
        
        // Auto-map fields when possible
        const autoMapping = autoMapFields(headers, tableFields);
        setFieldMapping(autoMapping);
        
        // Auto-set identifier field if there's a clear match
        const possibleIdentifiers = Object.keys(autoMapping).filter(key => {
          const field = tableFields.find(f => f.key === key);
          return field && (
            field.key.toLowerCase().includes('id') ||
            field.key.toLowerCase().includes('numero') ||
            field.label.toLowerCase().includes('número') ||
            field.label.toLowerCase().includes('telefono') ||
            field.label.toLowerCase().includes('email')
          );
        });
        
        if (possibleIdentifiers.length > 0) {
          setIdentifierField(possibleIdentifiers[0]);
        }
        
        setActiveStep(1);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setError('Error al leer el archivo Excel. Verifica que sea un archivo válido.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFieldMappingChange = (tableField: string, excelHeader: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [tableField]: excelHeader
    }));
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Check if we have any mappings at all
      const hasMappings = Object.keys(fieldMapping).some(key => fieldMapping[key]);
      
      if (!hasMappings) {
        setError('Debes mapear al menos un campo para continuar');
        return;
      }
      
      // Validate required field mappings
      const requiredFields = tableFields.filter(f => f.required);
      const missingFields = requiredFields.filter(f => !fieldMapping[f.key]);
      
      if (missingFields.length > 0) {
        setError(`Los siguientes campos obligatorios no han sido mapeados: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
      setError('');
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    
    try {
      // Transform data according to field mapping with proper type formatting
      const transformedData = excelData.map(row => {
        const newRow: ExcelData = {};
        Object.entries(fieldMapping).forEach(([tableField, excelHeader]) => {
          if (excelHeader && row[excelHeader] !== undefined) {
            const tableFieldDef = tableFields.find(f => f.key === tableField);
            const rawValue = row[excelHeader];
            
            // Format value according to field type
            if (tableFieldDef?.type === 'date') {
              newRow[tableField] = formatDateField(rawValue, 'date');
            } else if (tableFieldDef?.type === 'number' && rawValue) {
              const numValue = Number(rawValue);
              newRow[tableField] = isNaN(numValue) ? rawValue : numValue;
            } else if (tableFieldDef?.type === 'boolean' && rawValue) {
              const strValue = rawValue.toString().toLowerCase();
              newRow[tableField] = strValue === 'true' || strValue === '1' || strValue === 'sí' || strValue === 'si';
            } else {
              newRow[tableField] = rawValue;
            }
          }
        });
        return newRow;
      });

      const options: ImportOptions = {
        duplicateStrategy,
        identifierField,
        updateExistingFields
      };

      const result = await onImport(transformedData, options);
      setImportResult(result);
      
      if (result.errors.length === 0) {
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Error durante la importación');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setExcelData([]);
    setExcelHeaders([]);
    setFieldMapping({});
    setFileName('');
    setError('');
    setImportResult(null);
    setDuplicateStrategy('skip');
    setIdentifierField('');
    setUpdateExistingFields(true);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Selecciona un archivo Excel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Formatos soportados: .xlsx, .xls, .csv
            </Typography>
            <Button
              variant="contained"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Subir archivo'}
            </Button>
            {fileName && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Archivo: {fileName}
              </Typography>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".xlsx,.xls,.csv"
            />
            
            {/* Date Format Information */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📅 Formatos de fecha soportados:
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Excel nativo:</strong> Celdas formateadas como fecha en Excel<br/>
                • <strong>Formato ISO:</strong> YYYY-MM-DD (ej: 2025-01-28)<br/>
                • <strong>Formatos comunes:</strong> DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY<br/>
                • <strong>Texto legible:</strong> "January 28, 2025", "28 enero 2025"
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                💡 Para mejores resultados, usa celdas de fecha nativa de Excel o formato ISO (YYYY-MM-DD)
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Mapear columnas del Excel con campos de la tabla
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Encontrados {excelData.length} registros. Mapea las columnas del Excel con los campos de tu tabla.
            </Typography>
            
            {tableFields.map((field) => (
              <Box key={field.key} sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                  </InputLabel>
                  <Select
                    value={fieldMapping[field.key] || ''}
                    label={field.label}
                    onChange={(e) => handleFieldMappingChange(field.key, e.target.value)}
                  >
                    <MenuItem value="">-- Sin mapear --</MenuItem>
                    {excelHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            ))}

            {/* Preview */}
            {excelData.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Vista previa (primeros 3 registros):
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(fieldMapping).filter(key => fieldMapping[key]).map(key => (
                          <TableCell key={key}>
                            {tableFields.find(f => f.key === key)?.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {excelData.slice(0, 3).map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.entries(fieldMapping).filter(([, header]) => header).map(([fieldKey, header]) => {
                            const tableField = tableFields.find(f => f.key === fieldKey);
                            const rawValue = row[header];
                            let displayValue = String(rawValue || '').slice(0, 50);
                            let hasError = false;
                            
                            // Format and validate the display value
                            if (tableField?.type === 'date' && rawValue) {
                              const formattedDate = formatDateField(rawValue, 'date');
                              displayValue = String(formattedDate);
                              hasError = !/^\d{4}-\d{2}-\d{2}$/.test(String(formattedDate));
                            }
                            
                            if (tableField?.required && (!rawValue || String(rawValue).trim() === '')) {
                              hasError = true;
                            }
                            
                            return (
                              <TableCell key={fieldKey} sx={{ 
                                color: hasError ? 'error.main' : 'inherit',
                                bgcolor: hasError ? 'error.light' : 'inherit',
                                fontWeight: hasError ? 'bold' : 'normal'
                              }}>
                                {displayValue}
                                {tableField?.type === 'date' && rawValue ? (
                                  <Chip
                                    label="DATE"
                                    size="small"
                                    color={hasError ? 'error' : 'success'}
                                    variant="outlined"
                                    sx={{ ml: 1, fontSize: '0.6rem', height: 16 }}
                                  />
                                ) : null}
                                {hasError && (
                                  <WarningIcon sx={{ fontSize: 16, ml: 0.5, color: 'error.main' }} />
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const autoMapping = autoMapFields(excelHeaders, tableFields);
                  setFieldMapping(autoMapping);
                  
                  // Auto-set identifier if possible
                  const possibleIdentifiers = Object.keys(autoMapping).filter(key => {
                    const field = tableFields.find(f => f.key === key);
                    return field && (
                      field.key.toLowerCase().includes('id') ||
                      field.key.toLowerCase().includes('numero') ||
                      field.label.toLowerCase().includes('número') ||
                      field.label.toLowerCase().includes('telefono') ||
                      field.label.toLowerCase().includes('email')
                    );
                  });
                  
                  if (possibleIdentifiers.length > 0) {
                    setIdentifierField(possibleIdentifiers[0]);
                  }
                }}
              >
                Auto-mapear campos
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                onClick={() => {
                  setFieldMapping({});
                  setIdentifierField('');
                }}
              >
                Limpiar mapeo
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configurar importación
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Campo identificador para duplicados</InputLabel>
              <Select
                value={identifierField}
                label="Campo identificador para duplicados"
                onChange={(e) => setIdentifierField(e.target.value)}
              >
                <MenuItem value="">-- Seleccionar campo --</MenuItem>
                {/* Show all table fields that have mappings OR all table fields if no mappings */}
                {(Object.keys(fieldMapping).length > 0 
                  ? Object.keys(fieldMapping).filter(key => fieldMapping[key])
                  : tableFields.map(f => f.key)
                ).map(key => (
                  <MenuItem key={key} value={key}>
                    {tableFields.find(f => f.key === key)?.label}
                    {fieldMapping[key] && ` (${fieldMapping[key]})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Estrategia para duplicados</InputLabel>
              <Select
                value={duplicateStrategy}
                label="Estrategia para duplicados"
                onChange={(e) => setDuplicateStrategy(e.target.value as any)}
              >
                <MenuItem value="skip">Omitir duplicados</MenuItem>
                <MenuItem value="update">Actualizar existentes</MenuItem>
                <MenuItem value="create">Crear como nuevos</MenuItem>
              </Select>
            </FormControl>

            {duplicateStrategy === 'update' && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={updateExistingFields}
                    onChange={(e) => setUpdateExistingFields(e.target.checked)}
                  />
                }
                label="Actualizar solo campos no vacíos"
                sx={{ mb: 2 }}
              />
            )}

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Se van a procesar <strong>{excelData.length}</strong> registros.
                {identifierField && (
                  <> Los duplicados se identificarán por el campo <strong>{tableFields.find(f => f.key === identifierField)?.label}</strong>.</>
                )}
              </Typography>
            </Alert>

            {importResult && (
              <Alert severity={importResult.errors.length > 0 ? "warning" : "success"} sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Resultado de la importación:</strong><br />
                  • {importResult.newRecords} registros nuevos creados<br />
                  • {importResult.updatedRecords} registros actualizados<br />
                  • {importResult.duplicatesSkipped} duplicados omitidos<br />
                  {importResult.errors.length > 0 && (
                    <>• {importResult.errors.length} errores encontrados</>
                  )}
                </Typography>
                {importResult.errors.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {importResult.errors.slice(0, 5).map((error, idx) => (
                      <Typography key={idx} variant="caption" display="block">
                        {error}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: 500 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon />
          Importar datos desde Excel
        </Box>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Atrás
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={activeStep === 0 && excelData.length === 0}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={importing || !identifierField}
            startIcon={importing ? <CircularProgress size={20} /> : undefined}
          >
            {importing ? 'Importando...' : 'Importar datos'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}