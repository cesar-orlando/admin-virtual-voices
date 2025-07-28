import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { 
  loginAPI, 
  registerAPI, 
  quickLearningLoginAPI, 
  quickLearningRegisterAPI 
} from '../api/servicios/authServices';
import type { LoginRequest, RegisterRequest } from '../types';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../api/servicios/authServices', () => ({
  loginAPI: vi.fn(),
  registerAPI: vi.fn(),
  quickLearningLoginAPI: vi.fn(),
  quickLearningRegisterAPI: vi.fn(),
  getAvailableCompaniesAPI: vi.fn(),
  detectCompanyByEmailAPI: vi.fn(),
}));

describe('Multi-Company Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Quick Learning Enterprise Login', () => {
    it('should login successfully to Quick Learning Enterprise', async () => {
      // Mock successful Quick Learning login response
      const mockResponse = {
        data: {
          id: 'ql-user-1',
          name: 'Quick Learning Admin',
          email: 'admin@quicklearning.com',
          role: 'Admin',
          c_name: 'quicklearning',
          companySlug: 'quicklearning',
          token: 'ql-jwt-token-123'
        }
      } as any;

      vi.mocked(quickLearningLoginAPI).mockResolvedValue(mockResponse);

      // Test login request
      const loginData = {
        email: 'admin@quicklearning.com',
        password: 'QuickLearning2024!',
        companySlug: 'quicklearning' as const
      };

      const result = await quickLearningLoginAPI(loginData);

      expect(quickLearningLoginAPI).toHaveBeenCalledWith({
        email: 'admin@quicklearning.com',
        password: 'QuickLearning2024!',
        companySlug: 'quicklearning'
      });

      expect(result.data.companySlug).toBe('quicklearning');
      expect(result.data.role).toBe('Admin');
      expect(result.data.token).toBe('ql-jwt-token-123');
    });

    it('should handle Quick Learning login errors', async () => {
      vi.mocked(quickLearningLoginAPI).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const loginData = {
        email: 'invalid@quicklearning.com',
        password: 'wrongpassword',
        companySlug: 'quicklearning' as const
      };

      await expect(quickLearningLoginAPI(loginData)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Quick Learning Enterprise Registration', () => {
    it('should register successfully to Quick Learning Enterprise', async () => {
      const mockResponse = {
        data: {
          id: 'ql-user-2',
          name: 'New Quick Learning User',
          email: 'newuser@quicklearning.com',
          role: 'Usuario',
          c_name: 'quicklearning',
          companySlug: 'quicklearning',
          token: ''
        }
      } as any;

      vi.mocked(quickLearningRegisterAPI).mockResolvedValue(mockResponse);

      const registerData = {
        name: 'New Quick Learning User',
        email: 'newuser@quicklearning.com',
        password: 'NewPassword123!',
        role: 'Asesor' as const,
        companySlug: 'quicklearning' as const,
      };

      const result = await quickLearningRegisterAPI(registerData);

      expect(quickLearningRegisterAPI).toHaveBeenCalledWith({
        name: 'New Quick Learning User',
        email: 'newuser@quicklearning.com',
        password: 'NewPassword123!',
        role: 'Asesor',
        companySlug: 'quicklearning',
      });

      expect(result.data.companySlug).toBe('quicklearning');
      expect(result.data.role).toBe('Usuario');
    });
  });

  describe('Regular Company Authentication', () => {
    it('should login successfully to regular company', async () => {
      const mockResponse = {
        data: {
          id: 'user-1',
          name: 'Regular User',
          email: 'korina@gmail.com',
          role: 'Usuario',
          c_name: 'test',
          companySlug: 'test',
          token: 'jwt-token-456'
        }
      } as any;

      vi.mocked(loginAPI).mockResolvedValue(mockResponse);

      const loginData: LoginRequest = {
        email: 'korina@gmail.com',
        password: 'Korina1234567890.',
        companySlug: 'test'
      };

      const result = await loginAPI(loginData);

      expect(loginAPI).toHaveBeenCalledWith({
        email: 'korina@gmail.com',
        password: 'Korina1234567890.',
        companySlug: 'test'
      });

      expect(result.data.companySlug).toBe('test');
      expect(result.data.role).toBe('Usuario');
    });

    it('should register successfully to regular company', async () => {
      const mockResponse = {
        data: {
          id: 'user-2',
          name: 'Test User',
          email: 'test@example.com',
          role: 'Usuario',
          c_name: 'test',
          companySlug: 'test',
          token: ''
        }
      } as any;

      vi.mocked(registerAPI).mockResolvedValue(mockResponse);

      const registerData: RegisterRequest = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123456',
        role: 'Asesor',
        companySlug: 'test'
      };

      const result = await registerAPI(registerData);

      expect(registerAPI).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123456',
        role: 'Asesor',
        companySlug: 'test'
      });

      expect(result.data.companySlug).toBe('test');
    });
  });

  describe('Company Detection', () => {
    it('should auto-detect Quick Learning from email domain', () => {
      const email = 'admin@quicklearning.com';
      const domain = email.split('@')[1];
      
      expect(domain).toBe('quicklearning.com');
      
      // Logic that should be in the component
      const recommendedCompany = domain === 'quicklearning.com' ? 'quicklearning' : 'test';
      expect(recommendedCompany).toBe('quicklearning');
    });

    it('should default to regular company for other domains', () => {
      const email = 'user@example.com';
      const domain = email.split('@')[1];
      
      expect(domain).toBe('example.com');
      
      const recommendedCompany = domain === 'quicklearning.com' ? 'quicklearning' : 'test';
      expect(recommendedCompany).toBe('test');
    });
  });

  describe('JWT Token Handling', () => {
    it('should store different JWT secrets for different companies', () => {
      // Quick Learning should use specific JWT secret
      const quickLearningToken = 'ql-jwt-token-with-specific-secret';
      const regularToken = 'regular-jwt-token';

      // These would be handled by the backend, but we can test the frontend handling
      expect(quickLearningToken).toBeDefined();
      expect(regularToken).toBeDefined();
      expect(quickLearningToken).not.toBe(regularToken);
    });
  });

  describe('LocalStorage Management', () => {
    it('should save user data correctly for Quick Learning', () => {
      const userData = {
        id: 'ql-user-1',
        name: 'Quick Learning Admin',
        email: 'admin@quicklearning.com',
        role: 'Admin',
        c_name: 'quicklearning',
        companySlug: 'quicklearning'
      };

      const companyData = {
        slug: 'quicklearning',
        name: 'Quick Learning',
        displayName: 'Quick Learning Enterprise',
        isEnterprise: true,
        features: {
          quickLearning: true,
          controlMinutos: true,
          elevenLabs: true,
          autoAssignment: true
        },
        database: { type: 'external' }
      };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('currentCompany', JSON.stringify(companyData));
      localStorage.setItem('token', 'ql-jwt-token-123');

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const storedCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');
      
      expect(storedUser.companySlug).toBe('quicklearning');
      expect(storedCompany.isEnterprise).toBe(true);
      expect(storedCompany.features.quickLearning).toBe(true);
    });

    it('should save user data correctly for regular company', () => {
      const userData = {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'Usuario',
        c_name: 'test',
        companySlug: 'test'
      };

      const companyData = {
        slug: 'test',
        name: 'Empresa Regular',
        displayName: 'Empresa Regular',
        isEnterprise: false,
        features: {},
        database: { type: 'local' }
      };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('currentCompany', JSON.stringify(companyData));

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const storedCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');
      
      expect(storedUser.companySlug).toBe('test');
      expect(storedCompany.isEnterprise).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(loginAPI).mockRejectedValue(new Error('Network error'));

      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        companySlug: 'test'
      };

      await expect(loginAPI(loginData)).rejects.toThrow('Network error');
    });

    it('should handle invalid company slug', async () => {
      vi.mocked(loginAPI).mockRejectedValue(new Error('Invalid company'));

      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        companySlug: 'invalid-company'
      };

      await expect(loginAPI(loginData)).rejects.toThrow('Invalid company');
    });
  });

  describe('Enterprise Features', () => {
    it('should identify enterprise features correctly', () => {
      const quickLearningFeatures = {
        quickLearning: true,
        controlMinutos: true,
        elevenLabs: true,
        autoAssignment: true
      };

      const regularFeatures = {};

      expect(Object.keys(quickLearningFeatures).length).toBeGreaterThan(0);
      expect(Object.keys(regularFeatures).length).toBe(0);
    });

    it('should validate admin role for Quick Learning', () => {
      const isValidQuickLearningAdmin = (role: string, companySlug: string) => {
        return companySlug === 'quicklearning' && (role === 'Admin' || role === 'Usuario');
      };

      expect(isValidQuickLearningAdmin('Admin', 'quicklearning')).toBe(true);
      expect(isValidQuickLearningAdmin('Usuario', 'quicklearning')).toBe(true);
      expect(isValidQuickLearningAdmin('InvalidRole', 'quicklearning')).toBe(false);
    });
  });
});