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
    const response = await api.post(`/tables/`, payload);
    return response.data;
  } catch (error: any) {
    const backendMessage = error.response?.data?.message || 'No se pudo crear la tabla. Revisa los datos enviados.';
    handleError(error);
    throw new Error(backendMessage);
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
    console.log("Importing records:", records, "with options:", options, "user:", user);
    
    const response = await api.post(`/records/${user.companySlug}/${tableSlug}/import`, {
      records,
      createdBy: user.id, // Add this line
      options
    });
    
    return response.data;
  } catch (error) {
    console.error('API Import error:', error);
    handleError(error as any);
    throw new Error('No se pudieron importar los registros');
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