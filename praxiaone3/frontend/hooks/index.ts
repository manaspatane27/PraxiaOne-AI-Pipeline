/**
 * React hooks for Praxia5Chronic frontend
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ChronicDisease, LoadingState, APIError } from '@/types';

// ==================== GENERIC HOOKS ====================

/**
 * useAsync - Generic hook for async operations
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps?: React.DependencyList
) {
  const [state, setState] = useState<LoadingState & { data?: T }>({
    isLoading: true,
    error: null,
    isSuccess: false,
  });

  useEffect(() => {
    let isMounted = true;

    const runAsync = async () => {
      try {
        setState({ isLoading: true, error: null, isSuccess: false });
        const data = await fn();
        if (isMounted) {
          setState({
            isLoading: false,
            error: null,
            isSuccess: true,
            data,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isLoading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
            isSuccess: false,
          });
        }
      }
    };

    runAsync();

    return () => {
      isMounted = false;
    };
  }, deps);

  return state;
}

/**
 * useMutation - Hook for handling POST/PATCH/DELETE operations
 */
export function useMutation<T, D = any>(
  fn: (data: D) => Promise<T>
) {
  const [state, setState] = useState<LoadingState & { data?: T }>({
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const mutate = useCallback(
    async (data: D) => {
      try {
        setState({ isLoading: true, error: null, isSuccess: false });
        const result = await fn(data);
        setState({
          isLoading: false,
          error: null,
          isSuccess: true,
          data: result,
        });
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        setState({
          isLoading: false,
          error: errorObj,
          isSuccess: false,
        });
        throw errorObj;
      }
    },
    [fn]
  );

  return { ...state, mutate };
}

// ==================== DISEASE HOOKS ====================

/**
 * useDiseases - Fetch all user diseases
 */
export function useDiseases() {
  const [diseases, setDiseases] = useState<ChronicDisease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await fetch('/api/chronic/diseases/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch diseases');

        const data = await response.json();
        setDiseases(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiseases();
  }, []);

  return { diseases, isLoading, error };
}

/**
 * useDisease - Fetch single disease with all relations
 */
export function useDisease(id?: number) {
  const [disease, setDisease] = useState<ChronicDisease | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDisease = async () => {
      try {
        const response = await fetch(`/api/chronic/diseases/${id}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch disease');

        const data = await response.json();
        setDisease(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisease();
  }, [id]);

  return { disease, isLoading, error };
}

/**
 * useCreateDisease - Create new disease
 */
export function useCreateDisease() {
  return useMutation(async (data) => {
    const response = await fetch('/api/chronic/diseases/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create disease');
    }

    return response.json();
  });
}

/**
 * useUpdateDisease - Update existing disease
 */
export function useUpdateDisease(id?: number) {
  return useMutation(async (data) => {
    if (!id) throw new Error('Disease ID is required');

    const response = await fetch(`/api/chronic/diseases/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update disease');

    return response.json();
  });
}

// ==================== WEARABLE HOOKS ====================

/**
 * useWearableDevices - Fetch paired wearable devices
 */
export function useWearableDevices() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/data-sources/devices/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch devices');

        const data = await response.json();
        setDevices(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return { devices, isLoading, error };
}

/**
 * useHealthMetrics - Fetch health metrics with optional filters
 */
export function useHealthMetrics(filters?: {
  metric_type?: string;
  start_date?: string;
  end_date?: string;
}) {
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.metric_type) params.append('metric_type', filters.metric_type);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);

        const query = params.toString();
        const url = `/api/data-sources/metrics/${query ? '?' + query : ''}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch metrics');

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [filters]);

  return { metrics, isLoading, error };
}

// ==================== AI HOOKS ====================

/**
 * useHealthAIQuery - Query health AI (RAG)
 */
export function useHealthAIQuery() {
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const query = useCallback(async (prompt: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/ai/query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ query: prompt }),
      });

      if (!res.ok) throw new Error('Failed to query AI');

      const data = await res.json();
      setResponse(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { response, isLoading, error, query };
}

/**
 * useHealthInsights - Fetch AI insights
 */
export function useHealthInsights() {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/ai/insights/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch insights');

        const data = await response.json();
        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return { insights, isLoading, error };
}

// ==================== AUTHENTICATION HOOKS ====================

/**
 * useAuth - Manage authentication state
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verify token by fetching user profile
        const response = await fetch('/api/user/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return { isAuthenticated, isLoading, user, logout };
}

// ==================== UTILITY HOOKS ====================

/**
 * useDebounce - Debounce a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useLocalStorage - Persist state to localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error setting local storage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
