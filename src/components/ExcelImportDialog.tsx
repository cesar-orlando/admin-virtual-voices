import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Tooltip
} from '@mui/material';
import * as XLSX from 'xlsx';
import { remove as removeDiacritics } from 'diacritics';

interface TableField {
  key: string;
  label: string;
  required: boolean;
}

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  tableFields: TableField[];
  onImport: (mappedRows: any[]) => void;
}

const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({ open, onClose, tableFields, onImport }) => {
  const [excelFileName, setExcelFileName] = useState('');
  const [importedFields, setImportedFields] = useState<string[]>([]);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<{ [excelField: string]: string | undefined }>({});
  const [error, setError] = useState('');

  const handleExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (Array.isArray(data) && data.length > 0) {
        const excelFields = Object.keys(data[0] as object);
        setImportedRows(data);
        setImportedFields(excelFields);
        // Mapeo automático: si el nombre de la columna de Excel coincide con el label o key de un campo de la tabla, se asigna automáticamente
        const normalize = (str: string | undefined) => {
          if (!str) return '';
          return removeDiacritics(String(str))
            .toLowerCase()
            .replace(/[^a-z0-9]/gi, '');
        };
        
        const mapping: { [excelField: string]: string | undefined } = {};
        const alreadyMapped = new Set<string>();
        
        excelFields.forEach(excelField => {
          const excelNorm = normalize(excelField);
          let match: TableField | undefined;
        
          for (const f of tableFields) {
            const fieldNorm = normalize(f.label) || normalize(f.key);
        
            if (
              (excelNorm === fieldNorm || fieldNorm.includes(excelNorm) || excelNorm.includes(fieldNorm)) &&
              !alreadyMapped.has(f.key)
            ) {
              match = f;
              alreadyMapped.add(f.key);
              break;
            }
          }
        
          mapping[excelField] = match ? match.key : undefined;
        });
        
        console.table(mapping); // <-- Colócalo aquí, después de llenar el objeto
        setFieldMapping(mapping);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFieldMappingChange = (excelField: string, value: string) => {
    setFieldMapping(prev => {
      // Si selecciona 'Ignorar', deselecciona el campo para esa columna
      if (!value) {
        return { ...prev, [excelField]: undefined };
      }
      // No permitir mapear un campo ya seleccionado en otra columna
      if (value && Object.entries(prev).some(([key, v]) => v === value && key !== excelField)) {
        return prev;
      }
      const newMapping = { ...prev };
      Object.keys(newMapping).forEach(key => {
        if (key !== excelField && newMapping[key] === value) {
          newMapping[key] = undefined;
        }
      });
      newMapping[excelField] = value;
      return newMapping;
    });
  };

  // Validación de campos requeridos
  const requiredFieldKeys = tableFields.filter(f => f.required).map(f => f.key);
  const mappedFieldKeys = Object.values(fieldMapping);
  const missingRequired = requiredFieldKeys.filter(key => !mappedFieldKeys.includes(key));
  const canImport = importedRows.length > 0 && missingRequired.length === 0;

  // Previsualización: solo muestra columnas mapeadas
  const previewFields = tableFields.filter(f => mappedFieldKeys.includes(f.key));

  const handleImport = () => {
    if (!canImport) return;
    // Construye los registros mapeados
    const mappedRows = importedRows.map(row => {
      const mapped: any = {};
      for (const field of tableFields) {
        const excelCol = Object.keys(fieldMapping).find(k => fieldMapping[k] === field.key);
        mapped[field.key] = excelCol ? row[excelCol] : '';
      }
      return mapped;
    });
    onImport(mappedRows);
    handleClose();
  };

  const handleClose = () => {
    setExcelFileName('');
    setImportedFields([]);
    setImportedRows([]);
    setFieldMapping({});
    setError('');
    onClose();
  };

  

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Importar Registros desde Excel</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Button
            variant="outlined"
            component="label"
            sx={{ mb: 2 }}
          >
            Seleccionar archivo Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleExcelFile}
            />
          </Button>
          {excelFileName && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Archivo seleccionado: <b>{excelFileName}</b>
            </Typography>
          )}
          {importedFields.length > 0 && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Asigna cada columna de tu archivo Excel al campo correspondiente de la tabla. Los campos requeridos están marcados en <b style={{color:'#d32f2f'}}>rojo</b>. Solo puedes asignar un campo por columna.
              </Alert>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Mapea las columnas del Excel a los campos de la tabla:</Typography>
              <Box sx={{ mb: 2 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f5f5f5', padding: 6, border: '1px solid #ddd', fontWeight: 700 }}>Columna Excel</th>
                      <th style={{ background: '#f5f5f5', padding: 6, border: '1px solid #ddd', fontWeight: 700 }}>Importar como</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedFields.map((excelField, index) => (
                      <tr key={`row-${index}`}>
                        <td style={{ padding: 6, border: '1px solid #eee', fontWeight: 600 }}>{excelField}</td>
                        <td style={{ padding: 6, border: '1px solid #eee' }}>
                          <FormControl size="small" fullWidth>
                            <InputLabel>Campo</InputLabel>
                            <Select
                              value={fieldMapping[excelField] ?? ''}
                              label="Campo"
                              onChange={e => handleFieldMappingChange(excelField, e.target.value)}
                              renderValue={selected => {
                                if (!selected) return 'Ignorar';
                                const campo = tableFields.find(f => f.key === selected);
                                return campo ? campo.label : 'Ignorar';
                              }}
                            >
                              <MenuItem value="">Ignorar</MenuItem>
                              {tableFields.map(f => {
                                const isSelected = fieldMapping[excelField] === f.key;
                                // Solo deshabilitar si el campo está mapeado en otra columna (y no en esta)
                                const isMappedElsewhere = Object.entries(fieldMapping).some(([key, v]) => v === f.key && key !== excelField);
                                return (
                                  <MenuItem key={f.key} value={f.key} disabled={isMappedElsewhere}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {isSelected && <span style={{color:'#8B5CF6',fontWeight:700}}>&#10003;</span>}
                                      <span style={{color: f.required ? '#d32f2f' : undefined, fontWeight: f.required ? 700 : undefined}}>{f.label}{f.required ? ' *' : ''}</span>
                                    </Box>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
              {missingRequired.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Los siguientes campos requeridos no están mapeados: <b>{[...new Set(missingRequired.map(k => tableFields.find(f => f.key === k)?.label))].join(', ')}</b>
                </Alert>
              )}
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Previsualización de todos los registros (con mapeo):</Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 2, mb: 2 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {previewFields.map(f => (
                        <th key={f.key} style={{ background: f.required ? '#ffebee' : '#f5f5f5', color: f.required ? '#d32f2f' : undefined, padding: 6, border: '1px solid #ddd', fontWeight: 700 }}>{f.label}{f.required ? ' *' : ''}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importedRows.map((row, idx) => (
                      <tr key={idx}>
                        {previewFields.map(f => {
                          const excelCol = Object.keys(fieldMapping).find(k => fieldMapping[k] === f.key);
                          let cellValue = '-';
                          if (excelCol) {
                            cellValue = row[excelCol] !== undefined && row[excelCol] !== '' ? row[excelCol] : '-';
                          }
                          const isEmpty = cellValue === '-';
                          return (
                            <Tooltip  key={`cell-${idx}-${f.key}`} title={f.required && isEmpty ? 'Este campo es requerido y está vacío en esta fila.' : ''} arrow>
                              <td style={{ padding: 6, border: '1px solid #eee', color: f.required && isEmpty ? '#d32f2f' : undefined, background: f.required && isEmpty ? '#ffebee' : undefined, fontWeight: f.required && isEmpty ? 700 : undefined }}>{cellValue}</td>
                            </Tooltip>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Tooltip title={importedRows.length === 0 ? 'Debes seleccionar un archivo Excel' : missingRequired.length > 0 ? 'Debes mapear todos los campos requeridos' : ''} arrow>
          <span>
            <Button
              variant="contained"
              color="primary"
              disabled={!canImport}
              onClick={handleImport}
              sx={{ fontWeight: 700, px: 4 }}
            >
              Importar
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default ExcelImportDialog; 