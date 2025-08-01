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
import { Upload as UploadIcon, Warning as WarningIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

// Date formatting utility function
const formatDateField = (value: unknown, fieldType?: string): string => {
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
  
  return String(value || '');
};

interface ExcelData {
  [key: string]: unknown;
}

interface ExcelSheetData {
  sheetName: string;
  tableName: string;
  headers: string[];
  data: ExcelData[];
  selected: boolean;
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
  tablesCreated?: string[];
}

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  tableFields: TableField[];
  onImport: (data: ExcelData[], options: ImportOptions, tableName?: string) => Promise<ImportResult>;
  onCreateTable?: (tableName: string, data: ExcelData[]) => Promise<void>;
}

interface ImportOptions {
  duplicateStrategy: 'skip' | 'update' | 'create';
  identifierField: string;
  updateExistingFields: boolean;
}

export function ExcelImportDialog({ open, onClose, tableFields, onImport, onCreateTable }: ExcelImportDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [excelSheets, setExcelSheets] = useState<ExcelSheetData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<ExcelSheetData | null>(null);
  
  // Dynamic steps based on whether this is a new table or existing table
  const isNewTable = tableFields.length === 0;
  const steps = isNewTable 
    ? ['Subir archivo', 'Crear tabla'] 
    : ['Subir archivo', 'Seleccionar hojas', 'Mapear columnas', 'Configurar importación'];
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
        
        if (workbook.SheetNames.length === 0) {
          setError('El archivo no contiene hojas válidas');
          setLoading(false);
          return;
        }

        // Process all sheets
        const sheets: ExcelSheetData[] = [];
        const baseFileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            console.warn(`Sheet "${sheetName}" skipped: must have at least 2 rows`);
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as unknown[][];
          
          const formattedData = rows
            .filter((row) => {
              const hasData = row.some(cell => cell !== undefined && cell !== null && cell !== '');
              
              return hasData;
            })
            .map((row) => {
              const obj: ExcelData = {};
              headers.forEach((header, colIndex) => {
                const rawValue = row[colIndex] || '';
                obj[header] = rawValue;
              });
              
              return obj;
            });

          // Determine table name
          let tableName: string;
          if (workbook.SheetNames.length === 1) {
            // Single sheet: use filename
            tableName = baseFileName;
          } else {
            // Multiple sheets: use sheet name
            tableName = sheetName;
          }

          // Ensure we have a valid table name
          if (!tableName || tableName.trim() === '') {
            tableName = `tabla_${sheetName || 'sin_nombre'}`;
          }

          
          
          
           // Log all data

          sheets.push({
            sheetName,
            tableName: tableName.trim(), // Keep original name for display and API
            headers,
            data: formattedData,
            selected: true // Default to selected
          });
        });

        if (sheets.length === 0) {
          setError('No se encontraron hojas válidas con datos');
          setLoading(false);
          return;
        }

        setExcelSheets(sheets);
        
        if (sheets.length === 1) {
          // Skip sheet selection for single sheet
          const sheet = sheets[0];
          setSelectedSheet(sheet);
          setExcelHeaders(sheet.headers);
          setExcelData(sheet.data);
          
          // Check if this is a new table (no existing fields)
          const isNewTable = tableFields.length === 0;
          
          if (isNewTable) {
            // For new tables, skip column mapping and go to final step
            setActiveStep(1);
          } else {
            // Auto-map fields for existing tables
            const autoMapping = autoMapFields(sheet.headers, tableFields);
            setFieldMapping(autoMapping);
            
            // Auto-set identifier field
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
            
            setActiveStep(2); // Go to mapping step
          }
        } else {
          setActiveStep(1); // Go to sheet selection step
        }
        
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setError('Error al leer el archivo Excel. Verifica que sea un archivo válido.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSheetSelection = (sheet: ExcelSheetData) => {
    setSelectedSheet(sheet);
    setExcelHeaders(sheet.headers);
    setExcelData(sheet.data);
    
    // Check if this is a new table (no existing fields)
    const isNewTable = tableFields.length === 0;
    
    if (!isNewTable) {
      // Auto-map fields for the selected sheet only if we have existing table fields
      const autoMapping = autoMapFields(sheet.headers, tableFields);
      setFieldMapping(autoMapping);
      
      // Auto-set identifier field
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
    }
  };

  const toggleSheetSelection = (sheetIndex: number) => {
    setExcelSheets(prev => prev.map((sheet, idx) => 
      idx === sheetIndex ? { ...sheet, selected: !sheet.selected } : sheet
    ));
  };

  const handleFieldMappingChange = (tableField: string, excelHeader: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [tableField]: excelHeader
    }));
  };

  const handleNext = () => {
    const isNewTable = tableFields.length === 0;
    
    if (activeStep === 1 && !isNewTable) {
      // Sheet selection step for existing tables - check if at least one sheet is selected
      const selectedSheets = excelSheets.filter(sheet => sheet.selected);
      if (selectedSheets.length === 0) {
        setError('Debes seleccionar al menos una hoja para continuar');
        return;
      }
      
      // If only one sheet is selected, auto-select it
      if (selectedSheets.length === 1) {
        handleSheetSelection(selectedSheets[0]);
      }
      
      setError('');
    }
    
    if (activeStep === 2 && !isNewTable) {
      // Column mapping step - only validate if we have existing table fields
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
      if (isNewTable) {
        // Logic for creating new tables
        if (excelSheets.filter(s => s.selected).length > 1) {
          // Multiple tables creation
          const selectedSheets = excelSheets.filter(s => s.selected);
          
          
          const createdTables: string[] = [];
          
          for (const sheet of selectedSheets) {
            try {
              
              
              
              
              
              
              if (!onCreateTable) {
                console.error('❌ onCreateTable function is not defined!');
                throw new Error('onCreateTable function is not defined');
              }
              
              
              await onCreateTable(sheet.tableName, sheet.data);
              
              createdTables.push(sheet.tableName);
            } catch (sheetError) {
              console.error(`❌ Error creating table ${sheet.tableName}:`, sheetError);
              console.error(`💥 Error details:`, JSON.stringify(sheetError, null, 2));
              setError(`Error creando la tabla "${sheet.tableName}": ${(sheetError as Error).message}`);
              return;
            }
          }
          
          setImportResult({
            newRecords: selectedSheets.reduce((acc, sheet) => acc + sheet.data.length, 0),
            updatedRecords: 0,
            duplicatesSkipped: 0,
            errors: [],
            tablesCreated: createdTables
          });
          
          // Navigate to tables list for multiple tables instead of specific table
          setTimeout(() => {
            window.location.href = '/tablas';
          }, 1000);
          
        } else {
          // Single table creation
          if (selectedSheet) {
            if (!onCreateTable) {
              throw new Error('onCreateTable function is not defined');
            }
            
            try {
              await onCreateTable(selectedSheet.tableName, selectedSheet.data);
              
              setImportResult({
                newRecords: selectedSheet.data.length,
                updatedRecords: 0,
                duplicatesSkipped: 0,
                errors: [],
                tablesCreated: [selectedSheet.tableName]
              });
              
              // Navigate to the created table for single table
              setTimeout(() => {
                window.location.href = '/tablas';
              }, 1000);
              
            } catch (createError) {
              console.error('Error creating single table:', createError);
              setError(`Error creando la tabla: ${(createError as Error).message}`);
              return;
            }
          }
        }
        
        // Close dialog after successful creation, but with a small delay to show success
        setTimeout(() => {
          
          handleClose();
        }, 1000);
        
      } else {
        // Original logic for existing tables
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
      }
    } catch (err: unknown) {
      console.error('Error during import/creation:', err);
      setError((err as Error).message || 'Error durante la importación');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setExcelSheets([]);
    setSelectedSheet(null);
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
        // For new tables: show create table step
        // For existing tables: show sheet selection step
        if (isNewTable) {
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Crear nueva tabla
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Se creará una nueva tabla con {excelData.length} registros.
                Los campos se detectarán automáticamente desde las columnas del Excel.
              </Typography>
              
              {selectedSheet && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Tabla a crear:</strong> {selectedSheet.tableName}<br />
                    <strong>Columnas detectadas:</strong> {selectedSheet.headers.join(', ')}<br />
                    <strong>Registros:</strong> {selectedSheet.data.length}
                  </Typography>
                </Alert>
              )}

              {excelSheets.filter(s => s.selected).length > 1 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Se crearán {excelSheets.filter(s => s.selected).length} tablas nuevas:
                    {excelSheets.filter(s => s.selected).map(sheet => 
                      <span key={sheet.sheetName} style={{ display: 'block', marginLeft: '16px' }}>
                        • {sheet.tableName} ({sheet.data.length} registros)
                      </span>
                    )}
                  </Typography>
                </Alert>
              )}

              {/* Preview of data */}
              {excelData.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Vista previa de datos (primeros 3 registros):
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {excelHeaders.map(header => (
                            <TableCell key={header}>{header}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {excelData.slice(0, 3).map((row, idx) => (
                          <TableRow key={idx}>
                            {excelHeaders.map(header => (
                              <TableCell key={header}>
                                {String(row[header] || '').slice(0, 50)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          );
        } else {
          // Original sheet selection logic for existing tables
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Seleccionar hojas para importar
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Se encontraron {excelSheets.length} hoja(s) en el archivo. Selecciona las que deseas importar.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {excelSheets.map((sheet, index) => (
                  <Paper 
                    key={sheet.sheetName} 
                    sx={{ 
                      p: 2, 
                      border: sheet.selected ? 2 : 1, 
                      borderColor: sheet.selected ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => {
                      toggleSheetSelection(index);
                      if (!sheet.selected) {
                        handleSheetSelection(sheet);
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox
                          checked={sheet.selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSheetSelection(index);
                          }}
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            📄 {sheet.sheetName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Se creará como tabla: <strong>{sheet.tableName}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sheet.data.length} registros • {sheet.headers.length} columnas
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip 
                          label={`${sheet.data.length} filas`}
                          size="small" 
                          color={sheet.selected ? 'primary' : 'default'}
                          variant={sheet.selected ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </Box>
                    
                    {/* Preview headers */}
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        Columnas:
                      </Typography>
                      {sheet.headers.slice(0, 6).map((header, idx) => (
                        <Chip 
                          key={idx}
                          label={header} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {sheet.headers.length > 6 && (
                        <Typography variant="caption" color="text.secondary">
                          +{sheet.headers.length - 6} más
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
              
              {excelSheets.filter(s => s.selected).length > 1 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Se crearán {excelSheets.filter(s => s.selected).length} tablas nuevas. 
                    Cada hoja seleccionada se convertirá en una tabla independiente.
                  </Typography>
                </Alert>
              )}
            </Box>
          );
        }

      case 2:
        // Only for existing tables: mapping columns
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

      case 3:
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
                onChange={(e) => setDuplicateStrategy(e.target.value as 'skip' | 'update' | 'create')}
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
                {selectedSheet ? (
                  <>
                    Se van a procesar <strong>{selectedSheet.data.length}</strong> registros de la hoja <strong>{selectedSheet.sheetName}</strong>.
                    {identifierField && (
                      <> Los duplicados se identificarán por el campo <strong>{tableFields.find(f => f.key === identifierField)?.label}</strong>.</>
                    )}
                  </>
                ) : (
                  <>
                    Se van a procesar <strong>{excelData.length}</strong> registros.
                    {identifierField && (
                      <> Los duplicados se identificarán por el campo <strong>{tableFields.find(f => f.key === identifierField)?.label}</strong>.</>
                    )}
                  </>
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
                  {importResult.tablesCreated && importResult.tablesCreated.length > 0 && (
                    <>• {importResult.tablesCreated.length} tabla(s) creada(s): {importResult.tablesCreated.join(', ')}<br /></>
                  )}
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
            disabled={importing || (!isNewTable && !identifierField)}
            startIcon={importing ? <CircularProgress size={20} /> : undefined}
          >
            {importing 
              ? (isNewTable ? 'Creando tabla...' : 'Importando...')
              : (isNewTable ? 'Crear tabla' : 'Importar datos')
            }
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
