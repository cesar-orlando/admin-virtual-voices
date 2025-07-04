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
      c_name: user.c_name,
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
    const response = await api.get(`/tables/${user.c_name}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudieron obtener las tablas');
  }
};

// Obtener una tabla específica por slug
export const getTableBySlug = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/tables/${user.c_name}/${tableSlug}`);
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
      c_name: user.c_name
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
    const response = await api.delete(`/tables/${user.c_name}/${tableId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo eliminar la tabla');
  }
};

// Obtener estructura de tabla
export const getTableStructure = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/tables/${user.c_name}/${tableSlug}/structure`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener la estructura de la tabla');
  }
};

// Actualizar estructura de tabla
export const updateTableStructure = async (tableId: string, fields: any[], user: UserProfile) => {
  try {
    const response = await api.patch(`/tables/${user.c_name}/${tableId}/structure`, {
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
    const response = await api.post(`/tables/${user.c_name}/${tableId}/duplicate`, {
      newName,
      newSlug,
      c_name: user.c_name,
      createdBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo duplicar la tabla');
  }
};

// Exportar tabla
export const exportTable = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/tables/${user.c_name}/${tableSlug}/export`, {
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
    const response = await api.post(`/tables/${user.c_name}/import`, {
      tableData,
      c_name: user.c_name,
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
      c_name: user.c_name,
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

    const url = `/records/table/${user.c_name}/${tableSlug}?${params}`;

    console.log("url --->", url)

    const response = await api.get(`/records/table/${user.c_name}/${tableSlug}?${params}`);
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
    const response = await api.get(`/records/${user.c_name}/${recordId}`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener el registro');
  }
};

// Obtener un registro con su estructura de tabla
export const getRecordWithStructure = async (recordId: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/${user.c_name}/${recordId}/with-structure`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener el registro con estructura');
  }
};

// Obtener un registro con datos de tabla
export const getRecordWithTable = async (recordId: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/${user.c_name}/${recordId}/with-table`);
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo obtener el registro con tabla');
  }
};

// Actualizar un registro
export const updateRecord = async (recordId: string, recordData: UpdateRecordRequest, user: UserProfile) => {
  try {
    const response = await api.put(`/records/${recordId}`, {
      ...recordData,
      c_name: user.c_name,
      updatedBy: user.id
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo actualizar el registro');
  }
};

// Eliminar un registro
export const deleteRecord = async (recordId: string, user: UserProfile) => {
  try {
    const response = await api.delete(`/records/${user.c_name}/${recordId}`);
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
      c_name: user.c_name
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo validar el registro');
  }
};

// Buscar registros
export const searchRecords = async (
  tableSlug: string, 
  user: UserProfile, 
  query: string, 
  filters?: Record<string, any>,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const response = await api.post(`/records/${user.c_name}/${tableSlug}/search`, {
      query,
      filters,
      page,
      limit
    });
    return response.data;
  } catch (error) {
    handleError(error as any);
    throw new Error('No se pudo buscar en los registros');
  }
};

// Obtener estadísticas de la tabla
export const getTableStats = async (tableSlug: string, user: UserProfile) => {
  try {
    const response = await api.get(`/records/stats/${user.c_name}/${tableSlug}`);
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
    const response = await api.post(`/records/${user.c_name}/${tableSlug}/bulk`, {
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
    const response = await api.delete(`/records/${user.c_name}/${tableSlug}/bulk`, {
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
  user: UserProfile
) => {
  try {
    const response = await api.post(`/records/${user.c_name}/${tableSlug}/import`, {
      records,
      createdBy: user.id
    });
    return response.data;
  } catch (error) {
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

    const response = await api.get(`/records/${user.c_name}/${tableSlug}/export?${params}`, {
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
      c_name: user.c_name,
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
      c_name: user.c_name,
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