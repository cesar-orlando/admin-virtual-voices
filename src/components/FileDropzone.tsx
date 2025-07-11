import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Fade,
  Zoom,
  useTheme,
  alpha,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PptIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import api from '../api/axios';

interface FileDropzoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  /**
   * Lista de tipos MIME permitidos. Ejemplo: ['image/jpeg', 'application/pdf', 'video/mp4']
   */
  acceptedFileTypes?: string[];
  maxFileSize?: number; // en MB
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  value = [],
  onChange,
  label = "Archivos",
  required = false,
  disabled = false,
  maxFiles = 10,
  acceptedFileTypes,
  maxFileSize = 10, // 10MB por defecto
}) => {
  const theme = useTheme();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Función para subir archivo a S3
  const uploadFileToS3 = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data?.url) {
        return response.data.url;
      }
      throw new Error('Error al subir el archivo');
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Función para validar tipo de archivo
  const isValidFileType = (file: File): boolean => {
    if (!acceptedFileTypes) return true; // Si no se especifica, acepta todos
    return acceptedFileTypes.includes(file.type);
  };

  // Función para obtener el icono del tipo de archivo
  const getFileIcon = (filename: string, isImage = false) => {
    if (isImage) return <ImageIcon />;
    
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon />;
      case 'doc':
      case 'docx':
        return <DocIcon />;
      case 'xls':
      case 'xlsx':
        return <ExcelIcon />;
      case 'ppt':
      case 'pptx':
        return <PptIcon />;
      default:
        return <FileIcon />;
    }
  };

  // Función para obtener el color del chip según el tipo
  const getFileChipColor = (filename: string, isImage = false): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    if (isImage) return "success";
    
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return "error";
      case 'doc':
      case 'docx':
        return "primary";
      case 'xls':
      case 'xlsx':
        return "success";
      case 'ppt':
      case 'pptx':
        return "warning";
      default:
        return "default";
    }
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Función para extraer el nombre del archivo de la URL
  const extractFileName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'archivo';
      // Remover timestamp del nombre si existe
      return filename.replace(/^\d+-/, '');
    } catch {
      return 'archivo';
    }
  };

  // Función para manejar la subida de archivos
  const handleFiles = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;

    // Validar límite de archivos
    const totalFiles = value.length + uploadingFiles.length + acceptedFiles.length;
    if (totalFiles > maxFiles) {
      setSnackbar({
        open: true,
        message: `Máximo ${maxFiles} archivos permitidos`,
        severity: 'warning',
      });
      return;
    }

    // Filtrar archivos válidos
    const validFiles = acceptedFiles.filter(file => {
      if (!isValidFileType(file)) {
        setSnackbar({
          open: true,
          message: `Tipo de archivo no permitido: ${file.name}`,
          severity: 'error',
        });
        return false;
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: `Archivo demasiado grande: ${file.name} (máximo ${maxFileSize}MB)`,
          severity: 'error',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Crear archivos en proceso de subida
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading',
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Simular progreso y subir archivos
    for (const uploadFile of newUploadingFiles) {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      try {
        const url = await uploadFileToS3(uploadFile.file);
        
        clearInterval(progressInterval);
        
        if (url) {
          // Marcar como completado
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, progress: 100, status: 'success' }
                : f
            )
          );

          // Agregar URL al valor
          onChange([...value, url]);

          // Remover del estado de subida después de un delay
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadFile.id));
          }, 1000);
        } else {
          throw new Error('Error al subir el archivo');
        }
      } catch (error) {
        clearInterval(progressInterval);
        
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', error: 'Error al subir el archivo' }
              : f
          )
        );

        setSnackbar({
          open: true,
          message: `Error al subir ${uploadFile.file.name}`,
          severity: 'error',
        });
      }
    }
  }, [value, uploadingFiles, onChange, disabled, maxFiles, maxFileSize, acceptedFileTypes]);

  // Configuración de dropzone
  const dropzoneConfig = {
    onDrop: handleFiles,
    disabled,
    maxFiles: maxFiles - value.length - uploadingFiles.length,
    maxSize: maxFileSize * 1024 * 1024,
    ...(acceptedFileTypes ? { accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) } : {})
  };
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone(dropzoneConfig);

  // Función para eliminar archivo
  const handleRemoveFile = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  // Función para abrir archivo
  const handleOpenFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Box>
      {/* Label */}
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1, 
          fontWeight: 500,
          color: theme.palette.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>

      {/* Dropzone */}
      <Paper
        {...getRootProps()}
        elevation={isDragActive ? 8 : 1}
        sx={{
          border: `2px dashed ${
            isDragReject 
              ? theme.palette.error.main 
              : isDragActive 
                ? theme.palette.primary.main 
                : theme.palette.divider
          }`,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive 
            ? alpha(theme.palette.primary.main, 0.04)
            : theme.palette.background.paper,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled ? theme.palette.divider : theme.palette.primary.main,
            bgcolor: disabled ? theme.palette.background.paper : alpha(theme.palette.primary.main, 0.02),
          },
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />
        
        <Fade in={true} timeout={300}>
          <Box>
            <CloudUploadIcon 
              sx={{ 
                fontSize: 48, 
                color: isDragActive 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                mb: 2,
              }} 
            />
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                color: isDragActive 
                  ? theme.palette.primary.main 
                  : theme.palette.text.primary,
              }}
            >
              {isDragActive 
                ? 'Suelta los archivos aquí' 
                : 'Arrastra archivos o haz clic para subir'
              }
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              {isDragReject 
                ? 'Tipo de archivo no permitido'
                : `Máximo ${maxFiles} archivos, ${maxFileSize}MB cada uno`
              }
            </Typography>

            {!disabled && (
              <Chip 
                label="Seleccionar archivos" 
                variant="outlined" 
                color="primary"
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Box>
        </Fade>
      </Paper>

      {/* Archivos subidos */}
      {(value.length > 0 || uploadingFiles.length > 0) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Archivos ({value.length + uploadingFiles.length})
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {/* Archivos ya subidos */}
            {value.map((url, index) => {
              const filename = extractFileName(url);
              const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
              
              return (
                <Zoom in={true} key={index}>
                  <Chip
                    icon={getFileIcon(filename, isImage)}
                    label={filename}
                    color={getFileChipColor(filename, isImage)}
                    variant="outlined"
                    onClick={() => handleOpenFile(url)}
                    onDelete={() => handleRemoveFile(index)}
                    deleteIcon={<DeleteIcon />}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  />
                </Zoom>
              );
            })}

            {/* Archivos en proceso de subida */}
            {uploadingFiles.map((uploadFile) => (
              <Zoom in={true} key={uploadFile.id}>
                <Chip
                  icon={
                    uploadFile.status === 'success' ? (
                      <CheckCircleIcon color="success" />
                    ) : uploadFile.status === 'error' ? (
                      <ErrorIcon color="error" />
                    ) : (
                      <CircularProgress size={16} />
                    )
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{uploadFile.file.name}</span>
                      {uploadFile.status === 'uploading' && (
                        <Typography variant="caption">
                          {uploadFile.progress}%
                        </Typography>
                      )}
                    </Box>
                  }
                  color={uploadFile.status === 'success' ? 'success' : uploadFile.status === 'error' ? 'error' : 'default'}
                  variant="outlined"
                  sx={{
                    cursor: 'default',
                    minWidth: 120,
                  }}
                />
              </Zoom>
            ))}
          </Box>
        </Box>
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileDropzone; 