import api from '../axios';
import type { UserProfileToken } from '../../types';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  hangoutLink?: string;
  status: string;
  colorId?: string;
}

// Backend API event structure
export interface BackendCalendarEvent {
  dbId: string;
  googleEventId: string;
  phoneUser: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  attendees: string[];
  status: string;
  googleCalendarUrl: string;
  createdVia: string;
  createdAt: string;
  updatedAt: string;
}

// Backend API response structure
export interface BackendCalendarResponse {
  success: boolean;
  data: {
    events: BackendCalendarEvent[];
    count: number;
    metadata: {
      queryType: string;
      company: string;
      phoneUser: string;
      filters: {
        status: string;
        limit: number;
      };
    };
  };
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
  timeMin: string;
  timeMax: string;
}

export interface CalendarEventsParams {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  pageToken?: string;
  orderBy?: 'startTime' | 'updated';
  singleEvents?: boolean;
}

/**
 * Transform backend calendar event to frontend format
 */
export const transformBackendEvent = (backendEvent: BackendCalendarEvent): CalendarEvent => {
  return {
    id: backendEvent.googleEventId || backendEvent.dbId,
    summary: backendEvent.title,
    description: backendEvent.description || undefined,
    start: {
      dateTime: backendEvent.startDateTime,
      timeZone: 'America/Mexico_City', // Default timezone
    },
    end: {
      dateTime: backendEvent.endDateTime,
      timeZone: 'America/Mexico_City', // Default timezone
    },
    location: backendEvent.location || undefined,
    attendees: backendEvent.attendees.map(email => ({
      email,
      displayName: email.split('@')[0], // Use email prefix as display name
      responseStatus: 'accepted', // Default status
    })),
    organizer: {
      email: backendEvent.attendees[0] || 'admin@virtualvoices.com',
      displayName: 'Virtual Voices',
    },
    htmlLink: backendEvent.googleCalendarUrl,
    hangoutLink: undefined, // Not provided by backend
    status: backendEvent.status === 'active' ? 'confirmed' : backendEvent.status,
    colorId: undefined,
  };
};

/**
 * Get calendar events for a company
 */
export const getCalendarEvents = async (
  companySlug: string,
  params?: CalendarEventsParams
): Promise<CalendarEventsResponse> => {
  try {
    const endpoint = `/calendar-events/${companySlug}/events`;
    console.log('📅 CalendarService: Getting events for company:', companySlug);
    console.log('📅 CalendarService: Endpoint:', endpoint);
    console.log('📅 CalendarService: Parameters:', params);

    const response = await api.get(endpoint, {
      params: {
        timeMin: params?.timeMin,
        timeMax: params?.timeMax,
        maxResults: params?.maxResults || 250,
        pageToken: params?.pageToken,
        orderBy: params?.orderBy || 'startTime',
        singleEvents: params?.singleEvents !== false,
        ...params
      }
    });

    console.log('📅 CalendarService: Full response:', response);
    console.log('📅 CalendarService: Response data:', response.data);
    console.log('📅 CalendarService: Response status:', response.status);
    
    // Handle the backend response format
    const backendResponse: BackendCalendarResponse = response.data;
    
    if (!backendResponse.success) {
      throw new Error('Backend returned unsuccessful response');
    }

    // Transform backend events to frontend format
    const transformedEvents = backendResponse.data.events.map(transformBackendEvent);
    
    console.log('📅 CalendarService: Transformed events:', transformedEvents);

    // Return in expected frontend format
    const frontendResponse: CalendarEventsResponse = {
      events: transformedEvents,
      timeMin: params?.timeMin || new Date().toISOString(),
      timeMax: params?.timeMax || new Date().toISOString(),
    };

    return frontendResponse;
  } catch (error) {
    console.error('❌ CalendarService: Error getting calendar events:', error);
    console.error('❌ CalendarService: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: (error as { response?: { status?: number } })?.response?.status,
      data: (error as { response?: { data?: unknown } })?.response?.data
    });
    throw error;
  }
};

/**
 * Get calendar events for the current user's company
 */
export const getUserCompanyCalendarEvents = async (
  user: UserProfileToken,
  params?: CalendarEventsParams
): Promise<CalendarEventsResponse> => {
  if (!user.companySlug) {
    throw new Error('User has no company slug');
  }

  return getCalendarEvents(user.companySlug, params);
};

/**
 * Get calendar events for a specific date range
 */
export const getCalendarEventsForDateRange = async (
  companySlug: string,
  startDate: Date,
  endDate: Date,
  maxResults?: number
): Promise<CalendarEventsResponse> => {
  return getCalendarEvents(companySlug, {
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    maxResults: maxResults || 250,
    orderBy: 'startTime',
    singleEvents: true
  });
};

/**
 * Get calendar events for a specific month (including adjacent month days for calendar grid)
 */
export const getCalendarEventsForMonth = async (
  companySlug: string,
  year: number,
  month: number
): Promise<CalendarEventsResponse> => {
  // Calculate the full calendar grid date range
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  
  // Start from the Sunday of the week containing the first day of the month
  const startDate = new Date(year, month, 1 - firstDayOfWeek);
  
  // End at 35 days later (5 weeks * 7 days) to cover the full calendar grid
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 34);
  endDate.setHours(23, 59, 59, 999);

  console.log('📅 Calendar month range:', {
    requestedMonth: `${year}-${month + 1}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    firstDayOfWeek
  });

  return getCalendarEventsForDateRange(companySlug, startDate, endDate);
};

/**
 * Get calendar events for today
 */
export const getCalendarEventsForToday = async (
  companySlug: string
): Promise<CalendarEventsResponse> => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  return getCalendarEventsForDateRange(companySlug, startOfDay, endOfDay);
};

/**
 * Get calendar events for this week
 */
export const getCalendarEventsForWeek = async (
  companySlug: string
): Promise<CalendarEventsResponse> => {
  const today = new Date();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6, 23, 59, 59, 999);

  return getCalendarEventsForDateRange(companySlug, startOfWeek, endOfWeek);
};
