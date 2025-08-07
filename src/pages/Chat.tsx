import React, { useEffect, useState, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  Grid,
  Switch,
  ButtonGroup,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import ForumIcon from '@mui/icons-material/Forum'
import AddIcon from '@mui/icons-material/Add'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import CloseIcon from '@mui/icons-material/Close'
import LabelIcon from '@mui/icons-material/Label'
import Badge from '@mui/material/Badge'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import SmartToyIcon from '@mui/icons-material/SmartToy'

import { fetchWhatsAppUsers, fetchUserMessages, sendMessages, fetchSessions, assignChatToAdvisor, getAvailableAdvisors, getChatAssignments, fetchFilteredChats } from '../api/servicios/whatsappServices'
import { getRecordByPhone, getTableBySlug, updateRecord, createRecord, getRecords } from '../api/servicios'
import { fetchCompanyUsers } from '../api/servicios/userServices'
import type { UserProfile, WhatsAppSession, WhatsAppUser, WhatsAppMessage, GroupedWhatsAppUser, ChatAssignment, FilteredWhatsAppChat, DynamicTable, DynamicRecord, TableField } from '../types'
import { MetricsDashboard } from '../components/MetricsDashboard'
import io from 'socket.io-client'

export function ChatsTab() {
  const user = JSON.parse(localStorage.getItem('user') || '{}') as UserProfile
  const theme = useTheme()
  const [conversations, setConversations] = useState<GroupedWhatsAppUser[]>([])
  const [filteredConversations, setFilteredConversations] = useState<GroupedWhatsAppUser[]>([])
  const [activeConversation, setActiveConversation] = useState<GroupedWhatsAppUser | null>(null)
  const [activeMessages, setActiveMessages] = useState<WhatsAppMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [iaFilter, setIaFilter] = useState<'all' | 'withIA' | 'withoutIA'>('all')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // State for the new message modal
  const [openSendModal, setOpenSendModal] = useState(false)
  const [sendPhone, setSendPhone] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [sendLoading, setSendLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })
  const [selectedSessionViewId, setSelectedSessionViewId] = useState<string>(''); // <-- NUEVO
  const [openMetricsModal, setOpenMetricsModal] = useState(false) // <-- NUEVO ESTADO PARA MODAL DE MÉTRICAS
  
  // Estados para asignación de chats
  const [availableAdvisors, setAvailableAdvisors] = useState<UserProfile[]>([])
  const [openAssignModal, setOpenAssignModal] = useState(false)
  const [selectedChatForAssign, setSelectedChatForAssign] = useState<GroupedWhatsAppUser | null>(null)
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('')
  const [isVisibleToAll, setIsVisibleToAll] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [chatAssignments, setChatAssignments] = useState<Map<string, { advisor: { id: string; name: string } | null; isVisibleToAll: boolean }>>(new Map())

  // Estados para edición de cliente
  const [openClientEditModal, setOpenClientEditModal] = useState(false)
  const [clientRecord, setClientRecord] = useState<DynamicRecord | null>(null)
  const [clientTable, setClientTable] = useState<DynamicTable | null>(null)
  const [clientFormData, setClientFormData] = useState<Record<string, any>>({})
  const [clientLoading, setClientLoading] = useState(false)
  const [clientSaving, setClientSaving] = useState(false)
  const [asesores, setAsesores] = useState<any[]>([])
  const [selectedClientPhone, setSelectedClientPhone] = useState<string>('')

  // Agrupa conversaciones por número de teléfono para manejar múltiples sesiones
  function groupConversationsByPhone(users: WhatsAppUser[]): GroupedWhatsAppUser[] {
    const map = new Map<string, GroupedWhatsAppUser>();
    
    users.forEach((u, index) => {
      // Normalizar el número de teléfono para asegurar consistencia
      let phoneKey = u.phone;
      
      // Asegurar que termine con @c.us
      if (!phoneKey.endsWith('@c.us')) {
        phoneKey = phoneKey + '@c.us';
      }
      
      if (!map.has(phoneKey)) {
        map.set(phoneKey, { 
          ...u, 
          phone: phoneKey, // Usar el phoneKey normalizado
          sessions: [u.session.id], 
          unreadMessages: u.unreadMessages || 0 
        });
      } else {
        const existing = map.get(phoneKey)!;
        
        // Evitar duplicar sesiones
        if (!existing.sessions.includes(u.session.id)) {
          existing.sessions.push(u.session.id);
          
          // Suma los mensajes no leídos de todas las sesiones
          existing.unreadMessages = (existing.unreadMessages || 0) + (u.unreadMessages || 0);
          
          // Actualiza el último mensaje si es más reciente
          if (
            u.lastMessage &&
            (!existing.lastMessage ||
              new Date(u.lastMessage.date).getTime() > new Date(existing.lastMessage.date).getTime())
          ) {
            existing.lastMessage = u.lastMessage;
          }
          
          // Actualizar el nombre si el nuevo usuario tiene un nombre más específico
          if (u.name && u.name !== phoneKey.replace('@c.us', '') && (!existing.name || existing.name === phoneKey.replace('@c.us', ''))) {
            existing.name = u.name;
          }
        } else {
          console.log(`⚠️ Sesión ${u.session.id} ya existe para ${phoneKey}, saltando...`);
        }
      }
    });
    
    const result = Array.from(map.values());
    
    return result;
  }

  // Función para abrir el modal de edición de cliente
  async function handleOpenClientEdit(phone: string) {
    setClientLoading(true);
    setSelectedClientPhone(phone);
    setOpenClientEditModal(true);
    
    try {
      
      // Obtener información del chat actual
      const currentConversation = conversations.find(conv => conv.phone === phone);
      console.log("currentConversation", currentConversation);
      
      // Debug: ver qué número vamos a buscar
      const cleanPhone = phone.replace('@c.us', '').replace(/^\+?521/, '').replace(/^\+?52/, '');
      console.log('🔍 Buscando registro con:', {
        originalPhone: phone,
        cleanPhone: cleanPhone,
        tableSlug: currentConversation?.tableSlug || 'prospectos'
      });
      
      // Primero, vamos a ver qué registros existen en la tabla
      console.log('🔍 Verificando registros existentes en la tabla...');
      try {
        const allRecords = await getRecords(currentConversation?.tableSlug || 'prospectos', user, 1, 10, 'createdAt', 'desc');
        console.log('📊 Registros encontrados en la tabla:', {
          total: allRecords.records?.length || 0,
          records: allRecords.records?.map(r => ({
            _id: r._id,
            data: r.data,
            telefono: r.data?.telefono,
            phone: r.data?.phone,
            celular: r.data?.celular,
            numero: r.data?.numero,
            whatsapp: r.data?.whatsapp,
            nombre: r.data?.nombre || r.data?.name
          }))
        });
      } catch (error) {
        console.log('❌ Error obteniendo registros de la tabla:', error);
      }

      // Buscar el registro del cliente por teléfono
      const record = await getRecordByPhone(phone, user, currentConversation?.tableSlug || 'prospectos');
      console.log('📋 Resultado de búsqueda:', record);
      
      // Obtener la estructura de la tabla
      const tableData = await getTableBySlug('prospectos', user);
      console.log('🏗️ Estructura de la tabla:', {
        name: tableData.name,
        slug: tableData.slug,
        fields: tableData.fields.map((f: TableField) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required
        }))
      });
      setClientTable(tableData);
      
      if (record) {
        setClientRecord(record);
        setClientFormData(record.data || {});
      } else {
        console.log('⚠️ Cliente no encontrado, creando registro nuevo con datos del chat');
        
        // Inicializar con datos por defecto y información del chat
        const defaultData: Record<string, any> = {};
        tableData.fields.forEach((field: TableField) => {
          if (field.name === 'telefono' || field.name === 'phone' || field.name === 'celular' || field.name === 'numero' || field.name === 'whatsapp') {
            defaultData[field.name] = cleanPhone;
          } else if (field.name === 'nombre' || field.name === 'name') {
            // Usar el nombre del chat si no es un número de teléfono
            const chatName = currentConversation?.name || '';
            if (chatName && !chatName.match(/^\+?[\d\s\-\(\)]+$/)) {
              defaultData[field.name] = chatName;
            } else {
              defaultData[field.name] = field.defaultValue ?? '';
            }
          } else if (field.name === 'ia' || field.name === 'IA') {
            // Usar el estado de bot del chat actual
            defaultData[field.name] = currentConversation?.botActive ?? false;
          } else if (field.name === 'tableSlug') {
            // Usar la tabla del chat actual
            defaultData[field.name] = currentConversation?.tableSlug || 'prospectos';
          } else if (field.name === 'asesor' && currentConversation?.advisor) {
            // Usar el asesor asignado del chat
            defaultData[field.name] = currentConversation.advisor.name;
          } else if (field.type === 'file') {
            defaultData[field.name] = field.defaultValue ?? [];
          } else if (field.type === 'boolean') {
            defaultData[field.name] = field.defaultValue ?? false;
          } else {
            defaultData[field.name] = field.defaultValue ?? '';
          }
        });
        
        console.log('📋 Datos prellenados con información del chat:', {
          chatData: {
            name: currentConversation?.name,
            phone: currentConversation?.phone,
            botActive: currentConversation?.botActive,
            tableSlug: currentConversation?.tableSlug,
            advisor: currentConversation?.advisor
          },
          formData: defaultData
        });
        
        setClientRecord(null);
        setClientFormData(defaultData);
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos del cliente:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error al cargar datos del cliente', 
        severity: 'error' 
      });
    } finally {
      setClientLoading(false);
    }
  }

  // Función para manejar cambios en el formulario de cliente
  function handleClientInputChange(fieldName: string, value: any) {
    setClientFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }

  // Función para guardar los cambios del cliente
  async function handleSaveClient() {
    if (!clientTable) return;
    
    setClientSaving(true);
    try {
      if (clientRecord) {
        // Actualizar registro existente
        const updateData = { data: clientFormData };
        await updateRecord(clientRecord._id, updateData, user);
        setSnackbar({ 
          open: true, 
          message: 'Cliente actualizado correctamente', 
          severity: 'success' 
        });
      } else {
        // Crear nuevo registro
        const createData = { tableSlug: 'prospectos', data: clientFormData };
        await createRecord(createData, user);
        setSnackbar({ 
          open: true, 
          message: 'Cliente creado correctamente', 
          severity: 'success' 
        });
      }
      
      setOpenClientEditModal(false);
      
      // Actualizar información en la conversación si cambió
      const newName = clientFormData.nombre || clientFormData.name;
      const newIAStatus = clientFormData.ia || clientFormData.IA;
      
      if (newName || newIAStatus !== undefined) {
        setConversations(prev => 
          prev.map(convo => 
            convo.phone === selectedClientPhone ? {
              ...convo,
              ...(newName && { name: newName }),
              ...(newIAStatus !== undefined && { botActive: Boolean(newIAStatus) })
            } : convo
          )
        );
        
        // También actualizar la conversación activa si es la misma
        if (activeConversation && activeConversation.phone === selectedClientPhone) {
          setActiveConversation(prev => prev ? {
            ...prev,
            ...(newName && { name: newName }),
            ...(newIAStatus !== undefined && { botActive: Boolean(newIAStatus) })
          } : prev);
        }
      }
      
    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error al guardar cliente', 
        severity: 'error' 
      });
    } finally {
      setClientSaving(false);
    }
  }

  // Función para manejar la asignación de chat
  async function handleAssignChat() {
    if (!selectedChatForAssign) return;
    
    setAssignLoading(true);
    try {
      // Usar la primera sesión disponible para el chat si selectedSessionViewId está vacío
      const sessionToUse = selectedSessionViewId || 
        (selectedChatForAssign.sessions && selectedChatForAssign.sessions.length > 0 ? 
          selectedChatForAssign.sessions[0] : 
          (sessions.length > 0 ? sessions[0]._id || sessions[0].id : ''));

      const result = await assignChatToAdvisor(user, {
        sessionId: sessionToUse,
        number: selectedChatForAssign.phone.replace('@c.us', ''),
        advisorId: selectedAdvisorId || null,
        isVisibleToAll
      });
      
      
      const advisorName = selectedAdvisorId ? 
        availableAdvisors.find(a => a.id === selectedAdvisorId)?.name || 'Desconocido' : 
        null;
      
      // Actualizar el estado local de asignaciones
      setChatAssignments(prev => {
        const newMap = new Map(prev);
        // Normalizar el teléfono para que coincida con el formato usado en las conversaciones
        const phoneKey = selectedChatForAssign.phone.replace('@c.us', '');
        const newAssignment = {
          advisor: advisorName ? { id: selectedAdvisorId, name: advisorName } : null,
          isVisibleToAll
        };
        
        // También guardar con el formato @c.us para asegurar compatibilidad
        newMap.set(phoneKey, newAssignment);
        newMap.set(phoneKey + '@c.us', newAssignment);
        
        return newMap;
      });
      
      // También actualizar el array de conversaciones para reflejar el cambio inmediatamente
      setConversations(prev => 
        prev.map(convo => 
          convo.phone === selectedChatForAssign.phone ? {
            ...convo,
            advisor: advisorName ? { id: selectedAdvisorId, name: advisorName } : undefined,
            isVisibleToAll
          } : convo
        )
      );
      
      const message = advisorName ? 
        `Chat asignado correctamente a ${advisorName}` : 
        'Chat desasignado correctamente';
      
      setSnackbar({ open: true, message, severity: 'success' });
      setOpenAssignModal(false);
      setSelectedAdvisorId('');
      setIsVisibleToAll(false);
      
    } catch (error) {
      console.error('❌ Error en asignación:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        chatPhone: selectedChatForAssign?.phone,
        advisorId: selectedAdvisorId
      });
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Error al asignar chat', 
        severity: 'error' 
      });
    } finally {
      setAssignLoading(false);
    }
  }

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL) // Use environment variable

    // Listen for new whatsapp-message events
    socket.on(`whatsapp-message-${user.companySlug}`, (newMessageData: any) => {
      // Update conversations when new messages arrive
      setConversations(prev => {
        // Normalizar el número del mensaje entrante para que coincida con el formato de las conversaciones
        const incomingPhone = newMessageData.phone.endsWith('@c.us') ? newMessageData.phone : newMessageData.phone + '@c.us';
        const existingConvoIndex = prev.findIndex(m => m.phone === incomingPhone);
        if (existingConvoIndex !== -1) {
          const updatedConversations = [...prev];
          updatedConversations[existingConvoIndex] = {
            ...updatedConversations[existingConvoIndex],
            lastMessage: newMessageData.messages[newMessageData.messages.length - 1],
            totalMessages: updatedConversations[existingConvoIndex].totalMessages + 1,
            updatedAt: newMessageData.messages[newMessageData.messages.length - 1].createdAt,
            unreadMessages: newMessageData.messages[newMessageData.messages.length - 1].direction === 'inbound'
              ? (updatedConversations[existingConvoIndex].unreadMessages || 0) + 1
              : 0
          };
          // Notificación tipo snackbar solo para mensajes entrantes
          const lastMsg = newMessageData.messages[newMessageData.messages.length - 1];
          if (lastMsg.direction === 'inbound') {
            setSnackbar({
              open: true,
              message: `Nuevo mensaje de ${newMessageData.name || newMessageData.phone.replace('@c.us', '')}: ${lastMsg.body?.slice(0, 60)}`,
              severity: 'info'
            });
          }
          return updatedConversations;
        }
        return prev;
      });

      const incomingPhone = newMessageData.phone.endsWith('@c.us') ? newMessageData.phone : newMessageData.phone + '@c.us';
      if (activeConversation && activeConversation.phone === incomingPhone) {
        setActiveMessages(prev => [...prev, newMessageData.lastMessage]);
      }
    });

    // Fetch initial data
    const loadData = async () => {
      try {
        
        // Intentar cargar sesiones, pero no fallar si no existen
        let sessionsData: WhatsAppSession[] = [];
        try {
          sessionsData = await fetchSessions(user) as WhatsAppSession[];
          setSessions(sessionsData);
          
          // Selecciona la primera sesión por defecto si no hay una seleccionada
          if (!selectedSessionViewId && sessionsData.length > 0) {
            const firstSessionId = sessionsData[0]._id || sessionsData[0].id;
            setSelectedSessionViewId(firstSessionId);
          }
        } catch (sessionsError) {
          console.log('⚠️ No se pudieron cargar sesiones, continuando sin sesiones:', sessionsError);
        }
        
        
        // Determinar si mostrar todos los chats (solo para admins)
        const showAll = user.role === 'Administrador' || user.role === 'Gerente';
        
        let finalConversations: GroupedWhatsAppUser[] = [];
        
        try {
          // Método principal: usar chats filtrados del backend
          const chatsData = await fetchFilteredChats(user, showAll);
          
          // Convertir los chats a formato de conversaciones y agrupar por teléfono
          const conversationsMap = new Map<string, GroupedWhatsAppUser>();
          
          chatsData.forEach((chat: FilteredWhatsAppChat) => {
            // Normalizar el número de teléfono para asegurar consistencia
            let phoneKey = chat.phone;
            
            // Asegurar que termine con @c.us
            if (!phoneKey.endsWith('@c.us')) {
              phoneKey = phoneKey + '@c.us';
            }
            
            const conversationData = {
              _id: chat._id,
              phone: phoneKey, // Usar phoneKey normalizado
              name: chat.name || phoneKey.replace('@c.us', ''),
              tableSlug: chat.tableSlug || 'clientes',
              botActive: chat.botActive || false,
              sessions: chat.session ? [chat.session.id] : ['default-session'],
              unreadMessages: chat.messages?.length || 0,
              lastMessage: chat.messages && chat.messages.length > 0 ? {
                body: chat.messages[chat.messages.length - 1].body,
                date: chat.messages[chat.messages.length - 1].createdAt,
                direction: chat.messages[chat.messages.length - 1].direction
              } : undefined,
              advisor: chat.advisor ? {
                id: chat.advisor.id,
                name: chat.advisor.name
              } : undefined,
              isVisibleToAll: !chat.advisor,
              createdAt: chat.createdAt || new Date().toISOString(),
              updatedAt: chat.updatedAt || new Date().toISOString()
            } as GroupedWhatsAppUser;
            
            if (!conversationsMap.has(phoneKey)) {
              conversationsMap.set(phoneKey, conversationData);
            } else {
              const existing = conversationsMap.get(phoneKey)!;
              
              // Agregar sesión si no existe
              if (chat.session?.id && !existing.sessions.includes(chat.session.id)) {
                existing.sessions.push(chat.session.id);
              }
              
              // Actualizar mensajes no leídos
              existing.unreadMessages = (existing.unreadMessages || 0) + (conversationData.unreadMessages || 0);
              
              // Actualizar último mensaje si es más reciente
              if (
                conversationData.lastMessage &&
                (!existing.lastMessage ||
                  new Date(conversationData.lastMessage.date).getTime() > new Date(existing.lastMessage.date).getTime())
              ) {
                existing.lastMessage = conversationData.lastMessage;
              }
              
              // Mantener el advisor más específico
              if (conversationData.advisor && !existing.advisor) {
                existing.advisor = conversationData.advisor;
                existing.isVisibleToAll = conversationData.isVisibleToAll;
              }
            }
          });
          
          finalConversations = Array.from(conversationsMap.values());
          console.log("🎯 Conversaciones filtradas agrupadas por teléfono:", finalConversations.map(c => ({
            phone: c.phone,
            name: c.name,
            sessionsCount: c.sessions?.length || 0,
            sessions: c.sessions
          })));
          
        } catch (filterError) {
          console.log('⚠️ Error con chats filtrados, usando método de fallback:', filterError);
          
          // Método de fallback: usar WhatsAppUsers y agrupar por teléfono
          if (selectedSessionViewId || sessionsData[0]?._id || sessionsData[0]?.id) {
            try {
              const usersData = await fetchWhatsAppUsers(user, ['prospectos', 'clientes', 'nuevo_ingreso']) as WhatsAppUser[];
              console.log("📋 Usuarios fallback obtenidos:", usersData);
              
              // Agrupa por número de teléfono para manejar múltiples sesiones
              finalConversations = groupConversationsByPhone(usersData);
              console.log("🔗 Conversaciones agrupadas por teléfono:", finalConversations);
            } catch (fallbackError) {
              console.error("❌ Error también en método de fallback:", fallbackError);
              finalConversations = [];
            }
          }
        }
        
        // También actualizar el selectedSessionViewId con la primera sesión real disponible
        if (!selectedSessionViewId && finalConversations.length > 0 && finalConversations[0].sessions && finalConversations[0].sessions.length > 0) {
          const firstRealSessionId = finalConversations[0].sessions[0];
          if (firstRealSessionId !== 'default-session') {
            console.log('🎯 Seleccionando sesión real del primer chat:', firstRealSessionId);
            setSelectedSessionViewId(firstRealSessionId);
          }
        }
          
          // Ordena por fecha de último mensaje
          const sortedConversations = finalConversations.sort((a, b) => {
            const lastMessageDateA = a.lastMessage ? new Date(a.lastMessage.date).getTime() : 0;
            const lastMessageDateB = b.lastMessage ? new Date(b.lastMessage.date).getTime() : 0;
            return lastMessageDateB - lastMessageDateA;
          });
          
          console.log("✅ Conversaciones finales:", sortedConversations);
          setConversations(sortedConversations)
      } catch (error) {
        console.error("❌ Error loading conversations:", error)
        setSnackbar({ open: true, message: 'Error al cargar datos iniciales', severity: 'error' })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Cleanup socket connection on unmount
    return () => {
      socket.disconnect()
    }
  }, [user.companySlug, user.id]) // No agregues selectedSessionViewId aquí

  // Cargar asesores disponibles si es admin
  useEffect(() => {
    const loadAdvisors = async () => {
      if (user.role === 'Administrador' || user.role === 'Gerente') {
        try {
          const advisors = await getAvailableAdvisors(user);
          setAvailableAdvisors(advisors);
        } catch (error) {
          console.error('Error loading advisors:', error);
        }
      }
    };

    if (user.id && user.companySlug) {
      loadAdvisors();
    }
  }, [user.id, user.companySlug, user.role]);

  // Cargar asignaciones de chats existentes
  useEffect(() => {
    const loadChatAssignments = async () => {
      try {
        const assignments = await getChatAssignments(user);
        
        
        // Validar que assignments sea un array
        if (!Array.isArray(assignments)) {
          console.warn('⚠️ Las asignaciones no son un array:', assignments);
          setChatAssignments(new Map());
          return;
        }
        
        // Convertir el array de asignaciones a un Map
        const assignmentsMap = new Map();
        assignments.forEach((assignment: ChatAssignment) => {
          
          // Buscar phone o chatId (por compatibilidad con diferentes estructuras)
          const phoneId = assignment.phone || assignment.chatId;
          
          
          if (phoneId) {
            const phoneWithoutSuffix = phoneId.replace('@c.us', '');
            const phoneWithSuffix = phoneWithoutSuffix.endsWith('@c.us') ? phoneWithoutSuffix : phoneWithoutSuffix + '@c.us';
            
            // Crear objeto de asignación con estructura consistente
            const assignmentData = {
              advisor: assignment.advisor || null,
              isVisibleToAll: assignment.isVisibleToAll || false,
              assignedAt: assignment.assignedAt,
              assignedBy: assignment.assignedBy
            };
            
            // Guardar en ambos formatos para máxima compatibilidad
            assignmentsMap.set(phoneWithoutSuffix, assignmentData);
            assignmentsMap.set(phoneWithSuffix, assignmentData);
          } else {
            console.warn('⚠️ Asignación sin phone/chatId:', assignment);
          }
        });
        
        setChatAssignments(assignmentsMap);
      } catch (error) {
        console.error('❌ Error cargando asignaciones de chats:', error);
        // Establecer Map vacío en caso de error
        setChatAssignments(new Map());
      }
    };

    if (user.id && user.companySlug) {
      loadChatAssignments();
    }
  }, [user.id, user.companySlug, user.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar asesores para el formulario de cliente
  useEffect(() => {
    if (user && user.companySlug) {
      fetchCompanyUsers(user.companySlug).then(setAsesores).catch(console.error);
    }
  }, [user.companySlug]);

  useEffect(() => {
    let updatedConversations = conversations
      .filter(convo => {
        // Filtro por término de búsqueda
        const matchesSearch = convo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          convo.phone.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtro por estado de IA
        const matchesIAFilter = 
          iaFilter === 'all' ? true :
          iaFilter === 'withIA' ? convo.botActive === true :
          convo.botActive !== true;
        
        return matchesSearch && matchesIAFilter;
      });

    // Ya no necesitamos filtrar por permisos aquí ya que el backend lo hace
    // updatedConversations = filterConversationsByUserPermissions(updatedConversations);

    // Ordenar por fecha del último mensaje
    updatedConversations = updatedConversations.sort((a, b) => {
      const lastMessageDateA = a.lastMessage && a.lastMessage.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const lastMessageDateB = b.lastMessage && b.lastMessage.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      
      return lastMessageDateB - lastMessageDateA;  // Descending order
    });

    setFilteredConversations(updatedConversations);
  }, [conversations, searchTerm, iaFilter]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (
      activeConversation?.phone &&
      activeConversation.sessions?.includes(selectedSessionViewId)
    ) {
      const loadMessages = async () => {
        try {
          const messagesData = await fetchUserMessages(user, selectedSessionViewId, activeConversation.phone)
          setActiveMessages(messagesData.chat?.messages || [])
          // Cambia el nombre del chat si el nombre de la sesión es diferente
          if (
            messagesData.chat?.name &&
            messagesData.chat.name !== activeConversation.name
          ) {
            setConversations(prev =>
              prev.map(convo =>
                convo.phone === activeConversation.phone
                  ? { ...convo, name: messagesData.chat.name, lastMessage: messagesData.chat.messages[messagesData.chat.messages.length - 1] }
                  : convo
              )
            )
            // Si el chat activo es el mismo, actualiza también el activeConversation
            setActiveConversation(prev =>
              prev && prev.phone === activeConversation.phone
                ? { ...prev, name: messagesData.chat.name, lastMessage: messagesData.chat.messages[messagesData.chat.messages.length - 1] }
                : prev
            )
          }
        } catch (error) {
          console.error("Failed to load messages", error)
          setSnackbar({ open: true, message: 'Error al cargar mensajes', severity: 'error' })
        }
      }
      loadMessages()
    } else {
      setActiveMessages([])
    }
  }, [activeConversation?.phone, conversations, selectedSessionViewId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeMessages])

  async function handleSendMessage() {
    if (!chatInput.trim() || !activeConversation || !sessions.length) return
    
    console.log('📤 Enviando mensaje:', {
      activeConversation: activeConversation.name,
      phone: activeConversation.phone,
      sessionsAvailable: activeConversation.sessions,
      selectedSessionViewId,
      isSessionValid: activeConversation.sessions?.includes(selectedSessionViewId)
    });
    
    const userMessage = chatInput
    setChatInput('')

    // Asegúrate de que el número tenga @c.us
    let phone = activeConversation.phone
    if (!phone.endsWith('@c.us')) {
      phone = phone + '@c.us'
    }

    const newMessage: WhatsAppMessage = {
      _id: Date.now().toString(),
      body: userMessage,
      direction: 'outbound',
      respondedBy: 'user',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Optimistically update the UI
    setActiveMessages(prev => [...prev, newMessage])

    try {
      // Determinar qué sesión usar para enviar el mensaje
      let sessionToUse = selectedSessionViewId;
      
      // Si la sesión seleccionada no es válida para esta conversación, usar la primera disponible
      if (!activeConversation.sessions?.includes(selectedSessionViewId)) {
        sessionToUse = activeConversation.sessions?.[0] || selectedSessionViewId;
        console.log('⚠️ Sesión no válida, usando:', sessionToUse);
      }
      
      console.log('🚀 Enviando mensaje con sesión:', sessionToUse);
      
      if (activeConversation?.phone && sessionToUse) {
        await sendMessages(sessionToUse, user, phone, userMessage);
        // Update conversations if message sent successfully
        setConversations((prevConvos) =>
          prevConvos.map((convo) =>
            convo.phone === activeConversation.phone
              ? {
                  ...convo,
                  lastMessage: newMessage,
                  updatedAt: new Date().toISOString(),
                }
              : convo
          )
        );
        console.log('✅ Mensaje enviado exitosamente');
      } else {
        throw new Error('No hay sesión válida para enviar el mensaje');
      }
    } catch (error) {
      // If the message fails, show error
      setSnackbar({ open: true, message: 'Error al enviar mensaje', severity: 'error' });
      // Optionally, remove the optimistic message if failed
      setActiveMessages((prev) => prev.filter((msg) => msg._id !== newMessage._id));
    }
  }

  async function handleSendFromModal() {
    if (!sendPhone.trim() || !sendMessage.trim() || !selectedSessionId) return;
    setSendLoading(true);

    const newMessage: WhatsAppMessage = {
      _id: Date.now().toString(),
      body: sendMessage,
      direction: 'outbound',
      respondedBy: 'user',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Send the message
      await sendMessages(selectedSessionId, user, `521${sendPhone}@c.us`, sendMessage);
      // Update conversations if message sent successfully
      setConversations((prevConvos) =>
        prevConvos.map((convo) =>
          convo.phone === `521${sendPhone}`
            ? {
                ...convo,
                lastMessage: newMessage,
                updatedAt: new Date().toISOString(),
              }
            : convo
        )
      );

      setSnackbar({ open: true, message: 'Mensaje enviado correctamente', severity: 'success' });
      setSendPhone('');
      setSendMessage('');
      setOpenSendModal(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al enviar mensaje', severity: 'error' });
    } finally {
      setSendLoading(false);
    }
  }

  useEffect(() => {
    if (!activeConversation) return;
    
    console.log('🔄 Verificando sesión para conversación activa:', {
      phone: activeConversation.phone,
      availableSessions: activeConversation.sessions,
      currentSelected: selectedSessionViewId,
      sessionsCount: activeConversation.sessions?.length || 0
    });
    
    // Si la selectedSessionViewId no es válida para este número, selecciona la primera sesión disponible
    if (
      !activeConversation.sessions?.includes(selectedSessionViewId) &&
      activeConversation.sessions &&
      activeConversation.sessions.length > 0
    ) {
      console.log('⚠️ Sesión no válida, cambiando a:', activeConversation.sessions[0]);
      setSelectedSessionViewId(activeConversation.sessions[0]);
    }
    // Si solo hay una sesión, asegúrate de que esté seleccionada
    if (
      activeConversation.sessions &&
      activeConversation.sessions.length === 1 &&
      selectedSessionViewId !== activeConversation.sessions[0]
    ) {
      console.log('🎯 Estableciendo única sesión disponible:', activeConversation.sessions[0]);
      setSelectedSessionViewId(activeConversation.sessions[0]);
    }
  }, [activeConversation, selectedSessionViewId]);

  // Estado para galería de imágenes
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Extrae todas las imágenes del chat para la galería
  const allChatImages = activeMessages
    .map(m => m.body.match(/https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif)/gi))
    .filter(Boolean)
    .flat()
    .filter((img): img is string => img !== null);

  // Función para renderizar mensajes con imagenes
  function renderMessageWithImages(text: string) {
    const imageRegex = /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif))/gi;
    const parts = text.split(imageRegex);
    return parts.map((part, idx) => {
      if (imageRegex.test(part)) {
        return (
          <img
            key={idx}
            src={part}
            alt="Imagen enviada"
            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '12px', margin: '4px 0', cursor: 'pointer' }}
            onClick={() => {
              setGalleryImages(allChatImages);
              setGalleryIndex(allChatImages.indexOf(part));
              setGalleryOpen(true);
            }}
          />
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    )
  }

  return (
    <Box 
      component="main"
      sx={{
        width: '90vw',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(30,30,40,0.95)'
          : 'rgba(255,255,255,0.96)',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#fff' : '#1E1E28',
              fontFamily: 'Montserrat, Arial, sans-serif',
            }}
          >
            Bandeja de Entrada
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
          >
            Gestiona todas tus conversaciones de WhatsApp en un solo lugar.
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            onClick={() => setOpenMetricsModal(true)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              '&:hover': {
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              }
            }}
          >
            Métricas de Chat
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenSendModal(true)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            }}
          >
            Nuevo Mensaje
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Conversation List */}
        <Paper 
          elevation={0}
          sx={{ 
            width: { xs: '100%', md: 360 },
            borderRight: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'transparent',
          }}
        >
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar conversación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            {/* Filtros de IA */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ButtonGroup
                variant="outlined"
                sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 1 }}
              >
                <Button
                  onClick={() => setIaFilter('all')}
                  variant={iaFilter === 'all' ? 'contained' : 'outlined'}
                  sx={{ fontWeight: 700, borderRadius: 3, textTransform: 'none', px: 3 }}
                >
                  Todos
                </Button>
                <Button
                  onClick={() => setIaFilter('withIA')}
                  variant={iaFilter === 'withIA' ? 'contained' : 'outlined'}
                  sx={{ fontWeight: 700, borderRadius: 3, textTransform: 'none', px: 3 }}
                  startIcon={<SmartToyIcon sx={{ color: iaFilter === 'withIA' ? '#FFFFFF' : '#8B5CF6' }} />}
                >
                  Con IA
                </Button>
                <Button
                  onClick={() => setIaFilter('withoutIA')}
                  variant={iaFilter === 'withoutIA' ? 'contained' : 'outlined'}
                  sx={{ fontWeight: 700, borderRadius: 3, textTransform: 'none', px: 3 }}
                >
                  Sin IA
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
          <Divider />
          <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {filteredConversations.length > 0 ? filteredConversations.map(convo => {
              // Buscar asignación primero en los datos del backend, luego en el Map local
              const phoneWithoutSuffix = convo.phone.replace('@c.us', '');
              const phoneWithSuffix = phoneWithoutSuffix.endsWith('@c.us') ? phoneWithoutSuffix : phoneWithoutSuffix + '@c.us';
              
              // Priorizar los datos del backend (más actualizados) sobre el Map local
              const assignment = convo.advisor ? {
                advisor: convo.advisor,
                isVisibleToAll: convo.isVisibleToAll || false
              } : (
                chatAssignments.get(convo.phone) || 
                chatAssignments.get(phoneWithoutSuffix) || 
                chatAssignments.get(phoneWithSuffix)
              );
              
              return (
                <ListItem
                key={convo._id}
                button
                selected={activeConversation?._id === convo._id}
                onClick={() => setActiveConversation(convo)}
                sx={{ borderRadius: 2, mb: 0.5, alignItems: 'flex-start', position: 'relative' }}
              >
                <ListItemAvatar>
                  <Badge
                    color="secondary"
                    badgeContent={convo.unreadMessages > 0 ? convo.unreadMessages : 0}
                    invisible={!convo.unreadMessages || convo.unreadMessages <= 0}
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Avatar sx={{ 
                        backgroundColor: assignment?.advisor ? '#4CAF50' : '#8B5CF6',
                        border: assignment?.isVisibleToAll ? '2px solid #FF9800' : 'none'
                      }}>
                        {convo.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                      {/* Indicador de IA activa */}
                      {convo.botActive && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 16,
                            height: 16,
                            backgroundColor: '#00E676',
                            borderRadius: '50%',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '7px',
                            fontWeight: 'bold',
                            color: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        >
                          IA
                        </Box>
                      )}
                    </Box>
                  </Badge>
                </ListItemAvatar>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600} noWrap sx={{ flex: 1 }}>
                      {convo.name}
                    </Typography>
                    {convo.botActive && (
                      <Chip 
                        label="IA" 
                        size="small" 
                        sx={{ 
                          fontSize: '0.65rem',
                          height: '18px',
                          backgroundColor: '#00E676',
                          color: 'white',
                          fontWeight: 'bold',
                          minWidth: '28px'
                        }} 
                      />
                    )}
                  </Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    noWrap 
                    sx={{ fontStyle: 'italic' }}
                  >
                    {convo.lastMessage?.body || 'Sin mensajes'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {assignment?.advisor && (
                      <Chip
                        label={assignment.advisor.name}
                        size="small"
                        sx={{
                          bgcolor: '#e8f5e8',
                          color: '#2e7d32',
                          fontWeight: 600,
                          fontSize: 12,
                          fontStyle: 'italic',
                        }}
                      />
                    )}
                    {!assignment?.advisor && assignment?.isVisibleToAll && (
                      <Chip
                        label="Todos los asesores"
                        size="small"
                        sx={{
                          bgcolor: '#fff3e0',
                          color: '#f57c00',
                          fontWeight: 600,
                          fontSize: 12,
                          fontStyle: 'italic',
                        }}
                      />
                    )}
                    {!assignment?.advisor && !assignment?.isVisibleToAll && (
                      <Chip
                        label="Sin asignar"
                        size="small"
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#757575',
                          fontWeight: 600,
                          fontSize: 12,
                          fontStyle: 'italic',
                        }}
                      />
                    )}
                  </Box>
                </Box>
                </ListItem>
              );
            }) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary">No hay conversaciones</Typography>
              </Box>
            )}
          </List>
        </Paper>

        {/* Chat View */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeConversation ? (
            <>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Avatar sx={{ backgroundColor: '#8B5CF6', mr: 2 }}>{activeConversation.name.substring(0, 2).toUpperCase()}</Avatar>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: theme.palette.primary.main
                      }
                    }}
                    onClick={() => handleOpenClientEdit(activeConversation.phone)}
                  >
                    {activeConversation.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {activeConversation.phone}
                  </Typography>
                  {/* Selector de sesión - mostrar solo cuando hay múltiples sesiones */}
                  {activeConversation.sessions && activeConversation.sessions.length > 1 && (
                    <FormControl size="small" sx={{ minWidth: 180, ml: 3 }}>
                      <InputLabel id="session-view-chat-label">Sesión</InputLabel>
                      <Select
                        labelId="session-view-chat-label"
                        value={selectedSessionViewId}
                        label="Sesión"
                        onChange={e => setSelectedSessionViewId(e.target.value)}
                      >
                        {sessions
                          .filter(s => activeConversation.sessions?.includes(s._id || s.id))
                          .map(session => (
                            <MenuItem key={session._id || session.id} value={session._id || session.id}>
                              {session.name || session._id || session.id}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
                
                {/* Botón de asignación en el header del chat */}
                {(user.role === 'Administrador' || user.role === 'Gerente') && (
                  <IconButton
                    onClick={() => {
                      setSelectedChatForAssign(activeConversation);
                      // Pre-llenar el modal con la asignación actual
                      const assignment = chatAssignments.get(activeConversation.phone) || chatAssignments.get(activeConversation.phone.replace('@c.us', ''));
                      if (assignment) {
                        setSelectedAdvisorId(assignment.advisor?.id || '');
                        setIsVisibleToAll(assignment.isVisibleToAll);
                      } else {
                        setSelectedAdvisorId('');
                        setIsVisibleToAll(false);
                      }
                      setOpenAssignModal(true);
                    }}
                    sx={{ 
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <LabelIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeMessages.map((msg, idx) => (
                  <Box
                    key={msg._id || idx}
                    sx={{
                      alignSelf: msg.direction === 'inbound' ? 'flex-start' : 'flex-end',
                      maxWidth: '70%',
                    }}
                  >
                    <Paper 
                      elevation={1}
                      sx={{
                        p: '10px 14px',
                        borderRadius: msg.direction === 'inbound' ? '20px 20px 20px 5px' : '20px 20px 5px 20px',
                        backgroundColor: msg.direction === 'inbound'
                          ? (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200')
                          : 'primary.main',
                        color: msg.direction === 'inbound' ? 'text.primary' : 'primary.contrastText',
                      }}
                    >
                      {renderMessageWithImages(msg.body)}
                    </Paper>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Box>
              <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.default' }}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Escribe un mensaje..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <IconButton color="primary" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                    <SendIcon />
                  </IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'text.secondary' }}>
              <ForumIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }}/>
              <Typography variant="h5">Selecciona una conversación</Typography>
              <Typography>Elige un chat de la lista para ver los mensajes.</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal para Métricas de Chat */}
      <Dialog 
        open={openMetricsModal} 
        onClose={() => setOpenMetricsModal(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnalyticsIcon sx={{ color: '#8B5CF6' }} />
            <Typography variant="h5" component="span" sx={{ fontWeight: 700 }}>
              Métricas de Chat
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenMetricsModal(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 3, height: '70vh', overflow: 'auto' }}>
            <MetricsDashboard companySlug={user?.companySlug || ''} />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal para enviar mensaje manual */}
      <Dialog open={openSendModal} onClose={() => setOpenSendModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Enviar Nuevo Mensaje</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="session-select-label">Sesión de Envío</InputLabel>
              <Select
                labelId="session-select-label"
                value={selectedSessionId}
                label="Sesión de Envío"
                onChange={e => setSelectedSessionId(e.target.value)}
              >
                {sessions.map(session => (
                  <MenuItem key={session._id || session.id} value={session._id || session.id}>
                    {session.name || session._id || session.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Número de Teléfono (10 dígitos)"
              value={sendPhone}
              onChange={e => setSendPhone(e.target.value)}
              fullWidth
              placeholder="Ej: 5512345678"
            />
            <TextField
              label="Mensaje"
              value={sendMessage}
              onChange={e => setSendMessage(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Escribe el mensaje..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setOpenSendModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSendFromModal}
            disabled={!sendPhone.trim() || !sendMessage.trim() || !selectedSessionId || sendLoading}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            }}
          >
            {sendLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para asignación de chat */}
      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Asignar Chat
          {selectedChatForAssign && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedChatForAssign.name} - {selectedChatForAssign.phone}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="advisor-select-label">Asignar a Asesor</InputLabel>
              <Select
                labelId="advisor-select-label"
                value={selectedAdvisorId}
                label="Asignar a Asesor"
                onChange={e => setSelectedAdvisorId(e.target.value)}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {availableAdvisors.map(advisor => (
                  <MenuItem key={advisor.id} value={advisor.id}>
                    {advisor.name} ({advisor.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={isVisibleToAll}
                  onChange={(e) => setIsVisibleToAll(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Visible para todos los usuarios</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cuando está activado, todos los usuarios pueden ver esta conversación, 
                    independientemente de a quién esté asignada.
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setOpenAssignModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignChat}
            disabled={assignLoading}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            }}
          >
            {assignLoading ? <CircularProgress size={24} color="inherit" /> : 'Asignar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal galería de imágenes */}
      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="md">
        <DialogTitle>Galería de Imágenes</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
          {galleryImages.length > 0 && (
            <>
              <img
                src={galleryImages[galleryIndex]}
                alt={`Imagen ${galleryIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '12px' }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {galleryImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Miniatura ${idx + 1}`}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: idx === galleryIndex ? '2px solid #8B5CF6' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setGalleryIndex(idx)}
                  />
                ))}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para edición de cliente */}
      <Dialog open={openClientEditModal} onClose={() => setOpenClientEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {clientRecord ? 'Editar Cliente' : 'Crear Cliente'}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Teléfono: {selectedClientPhone.replace('@c.us', '')}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {clientLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : clientTable ? (
            <Grid container spacing={3} sx={{ pt: 2 }}>
              {clientTable.fields
                .filter(field => field.name !== '_id' && field.name !== 'createdAt' && field.name !== 'updatedAt')
                .map((field) => {
                  const value = clientFormData[field.name] || '';
                  
                  return (
                    <Grid item xs={12} sm={field.type === 'text' && field.name === 'observaciones' ? 12 : 6} key={field.name}>
                      {field.type === 'text' ? (
                        <TextField
                          fullWidth
                          label={field.label}
                          value={value}
                          onChange={(e) => handleClientInputChange(field.name, e.target.value)}
                          multiline={field.name === 'observaciones' || field.name === 'comentarios'}
                          rows={field.name === 'observaciones' || field.name === 'comentarios' ? 4 : 1}
                          required={field.required}
                          variant="outlined"
                        />
                      ) : field.type === 'number' ? (
                        <TextField
                          fullWidth
                          label={field.label}
                          type="number"
                          value={value}
                          onChange={(e) => handleClientInputChange(field.name, e.target.value)}
                          required={field.required}
                          variant="outlined"
                        />
                      ) : field.type === 'email' ? (
                        <TextField
                          fullWidth
                          label={field.label}
                          type="email"
                          value={value}
                          onChange={(e) => handleClientInputChange(field.name, e.target.value)}
                          required={field.required}
                          variant="outlined"
                        />
                      ) : field.type === 'select' ? (
                        <FormControl fullWidth required={field.required}>
                          <InputLabel>{field.label}</InputLabel>
                          <Select
                            value={value}
                            label={field.label}
                            onChange={(e) => handleClientInputChange(field.name, e.target.value)}
                          >
                            {field.options?.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : field.type === 'boolean' ? (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={Boolean(value)}
                              onChange={(e) => handleClientInputChange(field.name, e.target.checked)}
                            />
                          }
                          label={field.label}
                        />
                      ) : field.name === 'asesor' && asesores.length > 0 ? (
                        <FormControl fullWidth required={field.required}>
                          <InputLabel>Asesor</InputLabel>
                          <Select
                            value={value}
                            label="Asesor"
                            onChange={(e) => handleClientInputChange(field.name, e.target.value)}
                          >
                            <MenuItem value="">Sin asignar</MenuItem>
                            {asesores.map((asesor) => (
                              <MenuItem key={asesor._id || asesor.id} value={asesor.name || asesor.nombre || `${asesor.nombre} ${asesor.apellido || ''}`.trim()}>
                                {asesor.name || asesor.nombre || `${asesor.nombre} ${asesor.apellido || ''}`.trim()} ({asesor.email})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          fullWidth
                          label={field.label}
                          value={value}
                          onChange={(e) => handleClientInputChange(field.name, e.target.value)}
                          required={field.required}
                          variant="outlined"
                        />
                      )}
                    </Grid>
                  );
                })}
            </Grid>
          ) : (
            <Typography>Error cargando la estructura del formulario</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setOpenClientEditModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveClient}
            disabled={clientSaving}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #E05EFF 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
            }}
          >
            {clientSaving ? <CircularProgress size={24} color="inherit" /> : (clientRecord ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
