import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  IconButton,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Event as EventIcon,
  AccessTime,
  LocationOn,
  Person,
  Videocam,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getCalendarEventsForMonth } from '../api/servicios/calendarServices';
import type { 
  CalendarEvent, 
  CalendarEventsResponse 
} from '../api/servicios/calendarServices';

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Log user information on component mount
  useEffect(() => {
    console.log('📅 Calendar component mounted');
    console.log('📅 User context:', user);
    console.log('📅 Company slug:', user?.companySlug);
  }, [user]);

  // Calendar navigation
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const loadCalendarEvents = useCallback(async () => {
    if (!user?.companySlug) {
      console.log('❌ Calendar: No user or companySlug available', { user });
      setError('No se pudo obtener la información de la empresa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Calendar: Loading events for company:', user.companySlug);
      console.log('📅 Calendar: Date context:', { currentYear, currentMonth, selectedDate });
      
      const eventsData: CalendarEventsResponse = await getCalendarEventsForMonth(
        user.companySlug,
        currentYear,
        currentMonth
      );

      console.log('📅 Calendar: Raw API response:', eventsData);
      console.log('📅 Calendar: Events array:', eventsData.events);
      console.log('📅 Calendar: Events count:', eventsData.events?.length || 0);
      
      if (eventsData.events && eventsData.events.length > 0) {
        console.log('📅 Calendar: First event sample:', eventsData.events[0]);
      }
      
      setEvents(eventsData.events || []);
      
    } catch (err: unknown) {
      console.error('❌ Calendar: Error loading events:', err);
      setError('Error al cargar los eventos del calendario');
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth, currentYear, selectedDate]);

  useEffect(() => {
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    // Create local date string without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; // YYYY-MM-DD format in local time
    
    const dayEvents = events.filter(event => {
      // Handle both date and dateTime formats
      let eventDateString: string | undefined;
      
      if (event.start.date) {
        // All-day event with date format
        eventDateString = event.start.date;
      } else if (event.start.dateTime) {
        // Event with specific time - convert to local date
        const eventDate = new Date(event.start.dateTime);
        const eventYear = eventDate.getFullYear();
        const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0');
        const eventDay = String(eventDate.getDate()).padStart(2, '0');
        eventDateString = `${eventYear}-${eventMonth}-${eventDay}`;
      }
      
      const matches = eventDateString === dateString;
      
      if (matches) {
        console.log('📅 Event matched for date:', dateString, {
          event: event.summary,
          eventDate: eventDateString,
          searchDate: dateString,
          originalDateTime: event.start.dateTime
        });
      }
      
      return matches;
    });
    
    if (dayEvents.length > 0) {
      console.log(`📅 Found ${dayEvents.length} events for ${dateString}:`, dayEvents.map(e => e.summary));
    }
    
    return dayEvents;
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime) {
      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime!);
      return `${startTime.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${endTime.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    return 'Todo el día';
  };

  const getEventColor = (event: CalendarEvent) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
    const colorIndex = event.id.charCodeAt(0) % colors.length;
    return colors[colorIndex] as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  };

  const openEventDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const closeEventDialog = () => {
    setSelectedEvent(null);
    setEventDialogOpen(false);
  };

  // Generate calendar grid
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];
    
    // Calculate dates for previous month's trailing days
    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    
    // Add trailing days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const cellDate = new Date(currentYear, currentMonth - 1, day);
      const dayEvents = getEventsForDate(cellDate);
      
      days.push(
        <Paper
          key={`prev-${day}`}
          sx={{
            height: 120,
            p: 1,
            opacity: 0.4, // Dimmed for previous month
            bgcolor: 'grey.50',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.disabled',
                fontSize: '0.75rem'
              }}
            >
              {day}
            </Typography>
            {dayEvents.length > 0 && (
              <Chip
                label={dayEvents.length}
                size="small"
                color="default"
                sx={{ height: 16, fontSize: '0.6rem', opacity: 0.7 }}
              />
            )}
          </Box>
          
          <Box sx={{ overflow: 'hidden' }}>
            {dayEvents.slice(0, 2).map((event) => (
              <Tooltip key={event.id} title={event.summary}>
                <Chip
                  label={event.summary}
                  size="small"
                  color="default"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEventDialog(event);
                  }}
                  sx={{
                    mb: 0.5,
                    fontSize: '0.6rem',
                    height: 18,
                    maxWidth: '100%',
                    opacity: 0.7,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              </Tooltip>
            ))}
            {dayEvents.length > 2 && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                +{dayEvents.length - 2}
              </Typography>
            )}
          </Box>
        </Paper>
      );
    }

    // Days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentYear, currentMonth, day);
      const dayEvents = getEventsForDate(cellDate);
      const isToday = cellDate.toDateString() === new Date().toDateString();

      // Debug log for each day
      if (day <= 5 || dayEvents.length > 0) { // Log first 5 days and days with events
        console.log(`📅 Day ${day} (${cellDate.toISOString().split('T')[0]}):`, {
          dayEvents: dayEvents.length,
          eventTitles: dayEvents.map(e => e.summary)
        });
      }

      days.push(
        <Paper
          key={`current-${day}`}
          sx={{
            height: 120,
            p: 1,
            border: isToday ? 2 : 1,
            borderColor: isToday ? 'primary.main' : 'divider',
            bgcolor: isToday ? 'primary.light' : 'background.paper',
            cursor: 'pointer',
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: isToday ? 'primary.light' : 'action.hover',
              transform: 'translateY(-1px)',
              boxShadow: 2,
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: isToday ? 'bold' : 'normal',
                color: isToday ? 'primary.main' : 'text.primary',
              }}
            >
              {day}
            </Typography>
            {dayEvents.length > 0 && (
              <Chip
                label={dayEvents.length}
                size="small"
                color="primary"
                sx={{ height: 16, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          
          <Box sx={{ overflow: 'hidden' }}>
            {dayEvents.slice(0, 2).map((event) => (
              <Tooltip key={event.id} title={event.summary}>
                <Chip
                  label={event.summary}
                  size="small"
                  color={getEventColor(event)}
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEventDialog(event);
                  }}
                  sx={{
                    mb: 0.5,
                    fontSize: '0.65rem',
                    height: 20,
                    maxWidth: '100%',
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              </Tooltip>
            ))}
            {dayEvents.length > 2 && (
              <Typography variant="caption" color="text.secondary">
                +{dayEvents.length - 2} más
              </Typography>
            )}
          </Box>
        </Paper>
      );
    }

    // Calculate how many days we need from next month to fill the grid
    const totalCellsUsed = firstDay + daysInMonth;
    const totalCellsNeeded = 35; // 7 columns × 5 rows
    const nextMonthDays = totalCellsNeeded - totalCellsUsed;

    // Add leading days from next month
    for (let day = 1; day <= nextMonthDays; day++) {
      const cellDate = new Date(currentYear, currentMonth + 1, day);
      const dayEvents = getEventsForDate(cellDate);
      
      days.push(
        <Paper
          key={`next-${day}`}
          sx={{
            height: 120,
            p: 1,
            opacity: 0.4, // Dimmed for next month
            bgcolor: 'grey.50',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.disabled',
                fontSize: '0.75rem'
              }}
            >
              {day}
            </Typography>
            {dayEvents.length > 0 && (
              <Chip
                label={dayEvents.length}
                size="small"
                color="default"
                sx={{ height: 16, fontSize: '0.6rem', opacity: 0.7 }}
              />
            )}
          </Box>
          
          <Box sx={{ overflow: 'hidden' }}>
            {dayEvents.slice(0, 2).map((event) => (
              <Tooltip key={event.id} title={event.summary}>
                <Chip
                  label={event.summary}
                  size="small"
                  color="default"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEventDialog(event);
                  }}
                  sx={{
                    mb: 0.5,
                    fontSize: '0.6rem',
                    height: 18,
                    maxWidth: '100%',
                    opacity: 0.7,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              </Tooltip>
            ))}
            {dayEvents.length > 2 && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                +{dayEvents.length - 2}
              </Typography>
            )}
          </Box>
        </Paper>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Cargando calendario...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 1400 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          📅 Calendario
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={goToToday}
            size="small"
          >
            Hoy
          </Button>
        </Box>
      </Box>

      {/* Calendar Navigation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton onClick={() => navigateMonth('prev')}>
              <ChevronLeft />
            </IconButton>
            
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {selectedDate.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Typography>
            
            <IconButton onClick={() => navigateMonth('next')}>
              <ChevronRight />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Calendar Grid */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        {/* Day Headers */}
        <Box sx={{ display: 'flex', mb: 2 }}>
          {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, index) => (
            <Box key={day} sx={{ flex: 1, textAlign: 'center' }}>
              <Typography
                variant="subtitle2"
                sx={{ 
                  fontWeight: 'bold', 
                  color: index === 0 || index === 6 ? 'primary.main' : 'text.secondary',
                  fontSize: '0.875rem'
                }}
              >
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Days - Fixed 7x5 grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gap: 1,
          minHeight: 600
        }}>
          {renderCalendarGrid()}
        </Box>
      </Paper>

      {/* Event Details Dialog */}
      <Dialog open={eventDialogOpen} onClose={closeEventDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon color="primary" />
            <Typography variant="h6">{selectedEvent?.summary}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ py: 1 }}>
              {/* Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTime color="action" />
                <Typography variant="body1">
                  {formatEventTime(selectedEvent)}
                </Typography>
              </Box>

              {/* Location */}
              {selectedEvent.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOn color="action" />
                  <Typography variant="body1">{selectedEvent.location}</Typography>
                </Box>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Descripción:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}

              {/* Organizer */}
              {selectedEvent.organizer && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Person color="action" />
                  <Typography variant="body2">
                    Organizador: {selectedEvent.organizer.displayName || selectedEvent.organizer.email}
                  </Typography>
                </Box>
              )}

              {/* Attendees */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Asistentes:
                  </Typography>
                  <List dense>
                    {selectedEvent.attendees.map((attendee, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {(attendee.displayName || attendee.email).charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={attendee.displayName || attendee.email}
                          secondary={`Estado: ${attendee.responseStatus}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Video Call Link */}
              {selectedEvent.hangoutLink && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Videocam color="action" />
                  <Button
                    variant="outlined"
                    size="small"
                    href={selectedEvent.hangoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Unirse a la videollamada
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedEvent?.htmlLink && (
            <Button
              href={selectedEvent.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
            >
              Ver en Google Calendar
            </Button>
          )}
          <Button onClick={closeEventDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;
