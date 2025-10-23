import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { MenuItem } from '@food-ordering/shared';
import { MenuService, MenuFilters } from '../services/menuService';

/**
 * Hook to fetch all menu items with optional filters
 */
export function useMenuItems(filters?: MenuFilters): UseQueryResult<MenuItem[], Error> {
  return useQuery({
    queryKey: ['menu', 'items', filters],
    queryFn: () => MenuService.getMenuItems(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch only available menu items
 */
export function useAvailableMenuItems(): UseQueryResult<MenuItem[], Error> {
  return useQuery({
    queryKey: ['menu', 'available'],
    queryFn: MenuService.getAvailableMenuItems,
    staleTime: 3 * 60 * 1000, // 3 minutes (shorter for availability)
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus for availability
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch a single menu item by ID
 */
export function useMenuItem(id: string): UseQueryResult<MenuItem, Error> {
  return useQuery({
    queryKey: ['menu', 'item', id],
    queryFn: () => MenuService.getMenuItemById(id),
    enabled: !!id, // Only run query if ID is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch menu items by category
 */
export function useMenuItemsByCategory(category: 'main' | 'side' | 'combo'): UseQueryResult<MenuItem[], Error> {
  return useQuery({
    queryKey: ['menu', 'category', category],
    queryFn: () => MenuService.getMenuItemsByCategory(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to search menu items
 */
export function useMenuSearch(query: string): UseQueryResult<MenuItem[], Error> {
  return useQuery({
    queryKey: ['menu', 'search', query],
    queryFn: () => MenuService.searchMenuItems(query),
    enabled: !!query && query.trim().length >= 2, // Only search if query is valid
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}