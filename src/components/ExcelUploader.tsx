import React, { useState } from 'react';
import { Button, Input, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import * as XLSX from 'xlsx';

interface ExcelData {
  [key: string]: any;
}

export function ExcelUploader() {
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert array of arrays to array of objects
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const formattedData = rows.map((row) => {
          const obj: ExcelData = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        setExcelData(formattedData);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error al leer el archivo Excel');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const renderTable = () => {
    if (excelData.length === 0) return null;

    const headers = Object.keys(excelData[0]);

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {excelData.slice(0, 10).map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header}>
                    {String(row[header] || '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {excelData.length > 10 && (
          <Typography variant="caption" sx={{ p: 1, display: 'block' }}>
            Mostrando 10 de {excelData.length} filas
          </Typography>
        )}
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="excel-upload"
        />
        <label htmlFor="excel-upload">
          <Button variant="contained" component="span" disabled={loading}>
            {loading ? 'Cargando...' : 'Subir archivo Excel'}
          </Button>
        </label>
        {fileName && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Archivo: {fileName}
          </Typography>
        )}
      </Box>

      {excelData.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Datos del Excel ({excelData.length} filas)
          </Typography>
          {renderTable()}
          
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => console.log('Excel data:', excelData)}
            >
              Ver datos en consola
            </Button>
            <Button 
              variant="contained" 
              sx={{ ml: 1 }}
              onClick={() => {
                // Here you can process the data or send it to your API
                alert(`Procesando ${excelData.length} filas de datos`);
              }}
            >
              Procesar datos
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}