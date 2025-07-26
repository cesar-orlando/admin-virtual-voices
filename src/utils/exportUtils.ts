import type { DynamicTable, DynamicRecord } from '../types';

// Función auxiliar para descargar archivo
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Función auxiliar para formatear valores según el tipo de campo
const formatValueForExport = (value: any, fieldType: string): string => {
  if (value === null || value === undefined) return '';
  
  switch (fieldType) {
    case 'date':
      return new Date(value).toLocaleString('es-ES');
    case 'boolean':
      return value ? 'Sí' : 'No';
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(value);
    case 'number':
      // Sin separadores de miles según la preferencia del usuario
      return String(value);
    case 'file':
      // Para archivos, mostrar solo la cantidad
      if (Array.isArray(value)) {
        return `${value.length} archivo(s)`;
      } else if (typeof value === 'string') {
        return value.includes('http') ? '1 archivo' : value;
      } else {
        return 'Archivo adjunto';
      }
    default:
      return String(value);
  }
};

// Exportar a CSV
export const exportToCSV = (table: DynamicTable, records: DynamicRecord[], filename?: string) => {
  const tableName = filename || `${table.name}_${new Date().toISOString().split('T')[0]}`;
  
  // Crear encabezados basados en los campos de la tabla + createdAt
  const headers = [
    ...table.fields.map(field => field.label || field.name),
    'Fecha de Creación'
  ];
  
  // Crear filas de datos
  const csvRows = [
    headers.join(','), // Encabezados
    ...records.map(record => 
      [
        ...table.fields.map(field => {
          const value = record.data[field.name];
          let formattedValue = formatValueForExport(value, field.type);
          formattedValue = formattedValue.replace(/"/g, '""');
          if (formattedValue.includes(',') || formattedValue.includes('\n') || formattedValue.includes('"')) {
            formattedValue = `"${formattedValue}"`;
          }
          return formattedValue;
        }),
        record.createdAt ? new Date(record.createdAt).toLocaleString('es-MX') : ''
      ].join(',')
    )
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${tableName}.csv`);
};

// Exportar a Excel
export const exportToExcel = (table: DynamicTable, records: DynamicRecord[], filename?: string) => {
  const tableName = filename || `${table.name}_${new Date().toISOString().split('T')[0]}`;
  
  import('xlsx').then(XLSX => {
    const excelData = records.map(record => {
      const row: any = {};
      table.fields.forEach(field => {
        const value = record.data[field.name];
        if (value === null || value === undefined) {
          row[field.label || field.name] = '';
          return;
        }
        switch (field.type) {
          case 'date':
            row[field.label || field.name] = new Date(value);
            break;
          case 'boolean':
            row[field.label || field.name] = value ? 'Sí' : 'No';
            break;
          case 'currency':
            row[field.label || field.name] = Number(value);
            break;
          case 'number':
            row[field.label || field.name] = Number(value);
            break;
          case 'file':
            if (Array.isArray(value)) {
              row[field.label || field.name] = `${value.length} archivo(s)`;
            } else if (typeof value === 'string') {
              row[field.label || field.name] = value.includes('http') ? '1 archivo' : value;
            } else {
              row[field.label || field.name] = 'Archivo adjunto';
            }
            break;
          default:
            row[field.label || field.name] = String(value);
        }
      });
      // Agregar createdAt
      row['Fecha de Creación'] = record.createdAt ? new Date(record.createdAt).toLocaleString('es-MX') : '';
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table.name);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `${tableName}.xlsx`);
  }).catch(error => {
    console.error('Error al cargar XLSX:', error);
    throw new Error('No se pudo exportar a Excel. Asegúrate de tener la librería xlsx instalada.');
  });
};

// Exportar a JSON
export const exportToJSON = (table: DynamicTable, records: DynamicRecord[], filename?: string) => {
  const tableName = filename || `${table.name}_${new Date().toISOString().split('T')[0]}`;
  
  const exportData = {
    table: {
      name: table.name,
      slug: table.slug,
      description: table.description,
      fields: table.fields
    },
    records: records,
    exportDate: new Date().toISOString(),
    totalRecords: records.length
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadFile(blob, `${tableName}.json`);
};

// Función principal de exportación
export const exportTableData = (
  table: DynamicTable, 
  records: DynamicRecord[], 
  format: 'csv' | 'excel' | 'json' = 'csv',
  filename?: string
) => {
  try {
    switch (format) {
      case 'csv':
        return exportToCSV(table, records, filename);
      case 'excel':
        return exportToExcel(table, records, filename);
      case 'json':
        return exportToJSON(table, records, filename);
      default:
        throw new Error('Formato no soportado');
    }
  } catch (error) {
    console.error('Error al exportar:', error);
    throw new Error('No se pudo exportar la tabla');
  }
};

// Exportar estructura de tabla (sin registros)
export const exportTableStructure = (table: DynamicTable, filename?: string) => {
  const tableName = filename || `${table.slug}-structure-${new Date().toISOString().split('T')[0]}`;
  
  const tableStructure = {
    table: {
      name: table.name,
      slug: table.slug,
      description: table.description,
      fields: table.fields,
      isActive: table.isActive,
      icon: table.icon
    },
    exportDate: new Date().toISOString(),
    exportType: 'table_structure'
  };
  
  const jsonContent = JSON.stringify(tableStructure, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadFile(blob, `${tableName}.json`);
}; 