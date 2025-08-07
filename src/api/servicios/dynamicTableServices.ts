import api from "../axios";
import { handleError } from "../../Helpers/ErrorHandler";
import type { 
  UserProfile, 
  DynamicTable, 
  CreateTableRequest, 
  UpdateTableRequest,
  DynamicRecord,
  CreateRecordRequest,
  UpdateRecordRequest,
  PaginatedRecordsResponse,
  TableStats
} from "../../types";

// ===== TABLA SERVICES =====

// Crear una nueva tabla
export const createTable = async (tableData: CreateTableRequest, user: UserProfile) => {
  try {
    const payload = {
      ...tableData,
      c_name: user.companySlug,
      createdBy: user.id
    };
    
    // Enhanced logging for debugging
    console.log('🚀 Creating table with payload:', JSON.stringify(payload, null, 2));
    console.log('📋 Fields in payload:', payload.fields);
    
    const response = await api.post(`/tables/`, payload);
    console.log('✅ Table created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    console.error('❌ Table creation error:', error);
    console.error('📋 Error response:', error.response?.data);
    console.error('📊 Status code:', error.response?.status);
    console.error('📝 Status text:', error.response?.statusText);
    
    const backendMessage = error.response?.data?.message || error.response?.data?.error || 'No se pudo crear la tabla. Revisa los datos enviados.';
    const validationErrors = error.response?.data?.errors || error.response?.data?.validation || [];
    
    // Log validation errors if they exist
    if (validationErrors.length > 0) {
      console.error('🚫 Validation errors:', validationErrors);
    }
    
    // Don't call handleError for auth issues to avoid clearing session unexpectedly
    if (error.response?.status !== 401) {
      handleError(error);
    }
    
    // Create a more informative error message
    let fullErrorMessage = backendMessage;
    if (validationErrors.length > 0) {
      fullErrorMessage += '\nValidation errors: ' + validationErrors.map((err: any) => 
        typeof err === 'string' ? err : `${err.field || err.property || 'field'}: ${err.message || err.constraint || err}`
      ).join(', ');
    }
    
    throw new Error(fullErrorMessage);
  }
};

// Obtener todas las tablas de una empresa
export const getTables = async (user: UserProfile) => {
  try {
    const response = await api.get(`/tables/${user.companySlug}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener las tablas');
  }
};

// Obtener una tabla específica por slug
export const getTableBySlug = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/tables/${user.companySlug}/${tableSlug}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener la tabla');
  }
};

// Actualizar una tabla
export const updateTable = async (tableId: string, tableData: UpdateTableRequest, user: UserProfile) => {
  try {
    const response = await api.put(`/tables/${tableId}`, {
      ...tableData,
      c_name: user.companySlug
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar la tabla');
  }
};

// Eliminar una tabla (soft delete)
export const deleteTable = async (tableId: string, user: UserProfile) => {
  try {
    // Axios permite enviar body en DELETE usando { data: ... }
    const response = await api.delete(`/tables/${user.companySlug}/${tableId}`, {
      data: { deletedBy: user.email }
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo eliminar la tabla');
  }
};

// Obtener estructura de tabla
export const getTableStructure = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/tables/${user.companySlug}/${tableSlug}/structure`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener la estructura de la tabla');
  }
};

// Actualizar estructura de tabla
export const updateTableStructure = async (tableId: string, fields: any[], user: UserProfile) => {
  try {
    const response = await api.patch(`/tables/${user.companySlug}/${tableId}/structure`, {
      fields,
      updatedBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar la estructura de la tabla');
  }
};

// Duplicar tabla
export const duplicateTable = async (tableId: string, newName: string, newSlug: string, user: UserProfile) => {
  try {
    const response = await api.post(`/tables/${user.companySlug}/${tableId}/duplicate`, {
      newName,
      newSlug,
      c_name: user.companySlug,
      createdBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo duplicar la tabla');
  }
};

// Exportar tabla (frontend only) - usando utilidades
export const exportTableFrontend = (
  table: DynamicTable, 
  records: DynamicRecord[], 
  format: 'csv' | 'excel' | 'json' = 'csv',
  filename?: string
) => {
  try {
    const { exportTableData } = require('../../utils/exportUtils');
    return exportTableData(table, records, format, filename);
  } catch (error) {
    console.error('Error al exportar:', error);
    throw new Error('No se pudo exportar la tabla');
  }
};

// Mantener la función original para compatibilidad (opcional)
export const exportTable = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/tables/${user.companySlug}/${tableSlug}/export`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo exportar la tabla');
  }
};

// Importar tabla
export const importTable = async (tableData: any, user: UserProfile) => {
  try {
    const response = await api.post(`/tables/${user.companySlug}/import`, {
      tableData,
      c_name: user.companySlug,
      createdBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo importar la tabla');
  }
};

// Crear múltiples tablas desde Excel con múltiples hojas
export const createMultipleTablesFromExcel = async (
  tablesData: Array<{
    tableData: CreateTableRequest;
    records: Array<{ data: Record<string, unknown> }>;
  }>, 
  user: UserProfile
) => {
  try {
    console.log('🚀 Creating multiple tables from Excel:', tablesData.length, 'tables');
    
    const response = await api.post(`/tables/${user.companySlug}/bulk-create-from-excel`, {
      tables: tablesData.map(({ tableData, records }) => ({
        ...tableData,
        c_name: user.companySlug,
        createdBy: user.id,
        records
      }))
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Multiple tables creation error:', error);
    handleError(error as Error);
    throw new Error('No se pudieron crear las tablas desde Excel');
  }
};

// ===== RECORD SERVICES =====

// Crear un nuevo registro
export const createRecord = async (recordData: CreateRecordRequest, user: UserProfile) => {
  try {
    const response = await api.post(`/records/`, {
      ...recordData,
      c_name: user.companySlug,
      createdBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo crear el registro');
  }
};

// Obtener registros de una tabla con paginación
export const getRecords = async (
  tableSlug: string, 
  user: UserProfile, 
  page: number = 1, 
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortOrder: string = 'desc',
  filters?: Record<string, any>
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
      ...(filters && { filters: JSON.stringify(filters) })
    });

    const url = `/records/table/${user.companySlug}/${tableSlug}?${params}`;

    console.log("url --->", url)

    const response = await api.get(`/records/table/${user.companySlug}/${tableSlug}?${params}`);
    console.log("response --->", response.data)
    return response.data as PaginatedRecordsResponse;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener los registros');
  }
};

// Obtener un registro específico
export const getRecordById = async (recordId: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/${user.companySlug}/${recordId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener el registro');
  }
};

// Obtener un registro con su estructura de tabla
export const getRecordWithStructure = async (recordId: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/${user.companySlug}/${recordId}/with-structure`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener el registro con estructura');
  }
};

// Obtener un registro con datos de tabla
export const getRecordWithTable = async (recordId: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/${user.companySlug}/${recordId}/with-table`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener el registro con tabla');
  }
};

// Actualizar un registro
export const updateRecord = async (recordId: string, recordData: UpdateRecordRequest, user: UserProfile) => {
  try {
    const requestData = {
      ...recordData,
      c_name: user.companySlug,
      updatedBy: user.id
    };
    
    const response = await api.put(`/records/${recordId}`, requestData);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar el registro');
  }
};

// Eliminar un registro
export const deleteRecord = async (recordId: string, user: UserProfile) => {
  try {
    const response = await api.delete(`/records/${user.companySlug}/${recordId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo eliminar el registro');
  }
};

// Validar datos de un registro sin guardar
export const validateRecord = async (tableSlug: string, data: Record<string, any>, user: UserProfile) => {
  try {
    const response = await api.post(`/records/validate`, {
      tableSlug,
      data,
      c_name: user.companySlug
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo validar el registro');
  }
};

// Buscar un registro por teléfono en la tabla de prospectos
export const getRecordByPhone = async (phone: string, user: UserProfile, tableSlug: string = 'prospectos') => {
  try {
    // Normalizar el número de teléfono
    const normalizedPhone = phone.replace('@c.us', '').replace(/^\+?521/, '').replace(/^\+?52/, '');
    
    console.log('🔍 getRecordByPhone - Iniciando búsqueda:', {
      originalPhone: phone,
      normalizedPhone: normalizedPhone,
      tableSlug: tableSlug,
      user: user.companySlug
    });
    
    // Crear filtros para buscar por diferentes formatos de teléfono
    const phoneVariations = [
      normalizedPhone,
      `52${normalizedPhone}`,
      `521${normalizedPhone}`,
      `+52${normalizedPhone}`,
      `+521${normalizedPhone}`
    ];
    
    console.log('📱 Variaciones de teléfono a buscar:', phoneVariations);
    
    // Primero intentar búsqueda simple por cada campo común
    const commonPhoneFields = ['telefono', 'phone', 'celular', 'numero', 'whatsapp'];
    
    for (const field of commonPhoneFields) {
      console.log(`🔎 Buscando en campo: ${field}`);
      
      for (const phoneVar of phoneVariations) {
        const simpleFilter = { [field]: phoneVar };
        console.log(`📞 Buscando ${field} = "${phoneVar}"`);
        
        try {
          const response = await getRecords(tableSlug, user, 1, 5, 'createdAt', 'desc', simpleFilter);
          console.log(`📊 Respuesta para ${field} = "${phoneVar}":`, {
            totalRecords: response.records?.length || 0,
            records: response.records?.map(r => ({ 
              _id: r._id, 
              [field]: r.data?.[field],
              nombre: r.data?.nombre || r.data?.name 
            }))
          });
          
          if (response.records && response.records.length > 0) {
            console.log('✅ Registro encontrado:', response.records[0]);
            return response.records[0];
          }
        } catch (fieldError) {
          console.log(`⚠️ Error buscando en campo ${field}:`, fieldError);
        }
      }
    }
    
    console.log('❌ No se encontró registro con búsquedas simples, intentando búsqueda compleja...');
    
    // Si no encuentra nada, intentar con $or complejo
    const filters = {
      $or: phoneVariations.flatMap(phoneVar => 
        commonPhoneFields.map(field => ({ [field]: phoneVar }))
      )
    };
    
    console.log('🔍 Filtros complejos:', filters);

    const response = await getRecords(tableSlug, user, 1, 5, 'createdAt', 'desc', filters);
    console.log('📊 Respuesta búsqueda compleja:', {
      totalRecords: response.records?.length || 0,
      records: response.records?.map(r => ({ 
        _id: r._id, 
        telefono: r.data?.telefono,
        phone: r.data?.phone,
        nombre: r.data?.nombre || r.data?.name 
      }))
    });
    
    if (response.records && response.records.length > 0) {
      console.log('✅ Registro encontrado con búsqueda compleja:', response.records[0]);
      return response.records[0];
    }
    
    console.log('❌ No se encontró ningún registro');
    return null;
  } catch (error) {
    console.error('❌ Error buscando registro por teléfono:', error);
    return null;
  }
};

// Obtener estadísticas de la tabla
export const getTableStats = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/stats/${user.companySlug}/${tableSlug}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener las estadísticas');
  }
};

// Obtener estadísticas de columnas con distribución de datos reales
export const getColumnStats = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/column-stats/${user.companySlug}/${tableSlug}`);
    return response.data;
  } catch (error) {
    console.warn(`No se pudieron obtener las estadísticas de columnas para ${tableSlug}:`, error);
    // Si no existe el endpoint, obtenemos una muestra de datos y calculamos las estadísticas localmente
    try {
      const records = await getRecords(tableSlug, user, 1, 1000); // Obtener una muestra grande
      return calculateColumnStatsFromRecords(records.records);
    } catch (recordError) {
      console.error('Error obteniendo registros para calcular estadísticas:', recordError);
      return null;
    }
  }
};

// Función auxiliar para calcular estadísticas de columnas desde los registros
const calculateColumnStatsFromRecords = (records: DynamicRecord[]) => {
  if (!records || records.length === 0) return {};
  
  const columnStats: Record<string, unknown> = {};
  const firstRecord = records[0];
  
  // Obtener todas las columnas del primer registro
  Object.keys(firstRecord.data).forEach(columnName => {
    if (columnName === 'id' || columnName === 'createdAt' || columnName === 'updatedAt') {
      return; // Omitir campos de sistema
    }
    
    const values = records.map(record => record.data[columnName]).filter(val => val !== null && val !== undefined && val !== '');
    const totalValues = records.length;
    const nullValues = totalValues - values.length;
    const uniqueValues = new Set(values).size;
    
    // Calcular distribución de valores
    const distribution: { [key: string]: number } = {};
    values.forEach(value => {
      const stringValue = String(value);
      distribution[stringValue] = (distribution[stringValue] || 0) + 1;
    });
    
    // Ordenar por frecuencia y tomar los top 10
    const sortedDistribution = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: number });
    
    const mostCommonValue = Object.keys(sortedDistribution)[0] || '';
    const mostCommonValueCount = sortedDistribution[mostCommonValue] || 0;
    
    columnStats[columnName] = {
      totalValues,
      uniqueValues,
      nullValues,
      emptyValues: 0, // Calculado como parte de nullValues
      mostCommonValue,
      mostCommonValueCount,
      distributionStats: sortedDistribution
    };
  });
  
  return columnStats;
};

// Actualización masiva de registros
export const bulkUpdateRecords = async (
  tableSlug: string, 
  records: Array<{ id: string; data: Record<string, any> }>, 
  user: UserProfile
) => {
  try {
    const response = await api.post(`/records/${user.companySlug}/${tableSlug}/bulk`, {
      records,
      updatedBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar los registros masivamente');
  }
};

// Eliminación masiva de registros
export const bulkDeleteRecords = async (
  tableSlug: string, 
  recordIds: string[], 
  user: UserProfile
) => {
  try {
    const response = await api.delete(`/records/${user.companySlug}/${tableSlug}/bulk`, {
      data: { recordIds }
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron eliminar los registros masivamente');
  }
};

// Importar registros
export const importRecords = async (
  tableSlug: string, 
  records: Array<{ data: Record<string, any> }>, 
  user: UserProfile,
  options?: {
    duplicateStrategy: 'skip' | 'update' | 'create';
    identifierField: string;
    updateExistingFields: boolean;
  }
) => {
  try {
    console.log("🚀 Importing records:", records.length, "records with options:", options);
    
    const response = await api.post(`/records/${user.companySlug}/${tableSlug}/import`, {
      records,
      createdBy: user.id, // Add this line
      options
    });
    
    console.log("✅ Records imported successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ API Import error:', error);
    console.error('📊 Status code:', error.response?.status);
    console.error('📋 Error response:', error.response?.data);
    
    // Don't call handleError for auth issues to avoid clearing session unexpectedly
    if (error.response?.status !== 401) {
      handleError(error as any);
    }
    
    const errorMessage = error.response?.data?.message || 'No se pudieron importar los registros';
    throw new Error(errorMessage);
  }
};

// Exportar registros
export const exportRecords = async (
  tableSlug: string, 
  user: UserProfile, 
  format: string = 'json',
  filters?: Record<string, any>
) => {
  try {
    const params = new URLSearchParams({
      format,
      ...(filters && { filters: JSON.stringify(filters) })
    });

    const response = await api.get(`/records/${user.companySlug}/${tableSlug}/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron exportar los registros');
  }
};

// Agregar campo a todos los registros
export const addFieldToAllRecords = async (
  tableSlug: string, 
  fieldName: string, 
  defaultValue: any, 
  user: UserProfile
) => {
  try {
    const response = await api.post(`/records/add-field`, {
      tableSlug,
      c_name: user.companySlug,
      fieldName,
      defaultValue,
      updatedBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo agregar el campo a todos los registros');
  }
};

// Eliminar campos de todos los registros
export const deleteFieldsFromAllRecords = async (
  tableSlug: string, 
  fieldNames: string[], 
  user: UserProfile
) => {
  try {
    const response = await api.post(`/records/delete-fields`, {
      tableSlug,
      c_name: user.companySlug,
      fieldNames,
      updatedBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron eliminar los campos de todos los registros');
  }
};

// Eliminar campos de un registro específico
export const deleteFieldsFromRecord = async (
  recordId: string, 
  fieldNames: string[], 
  user: UserProfile
) => {
  try {
    const response = await api.patch(`/records/${recordId}/fields`, {
      fieldNames,
      updatedBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron eliminar los campos del registro');
  }
};

// Renombrar campo en todos los registros
export const renameFieldInAllRecords = async (
  tableSlug: string, 
  oldFieldName: string,
  newFieldName: string,
  user: UserProfile
) => {
  try {
    const response = await api.post(`/records/rename-field`, {
      tableSlug,
      c_name: user.companySlug,
      oldFieldName,
      newFieldName,
      updatedBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo renombrar el campo en todos los registros');
  }
}; 