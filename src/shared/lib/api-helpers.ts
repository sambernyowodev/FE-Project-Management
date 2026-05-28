import type { components } from '../types/api';

/**
 * Utility type to extract a Schema from the OpenAPI generated components.
 * Usage: type User = Schema<'UserResponseDto'>;
 */
export type Schema<T extends keyof components['schemas']> = components['schemas'][T];

/**
 * Common fields from backend BaseDto
 */
export type BaseEntity = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
};

/**
 * Utility type to extract a Schema and merge it with BaseEntity.
 * Usage: type Project = Entity<'ProjectResponseDto'>;
 */
export type Entity<T extends keyof components['schemas']> = Schema<T> & BaseEntity;

/**
 * Build a query string from PaginationParams
 */
export function buildQueryString(params?: any): string {
  if (!params) return '';

  const query = new URLSearchParams();

  if (params.page) query.append('page', String(params.page));
  if (params.perPage) query.append('perPage', String(params.perPage));
  if (params.search) query.append('search', params.search);

  if (params.sort) {
    const prefix = params.order === 'desc' ? '-' : '';
    query.append('sort', `${prefix}${params.sort}`);
  }

  if (params.filters && Object.keys(params.filters).length > 0) {
    query.append('filter', JSON.stringify(params.filters));
  }

  // Add any other top-level parameters (like academicYearId)
  Object.keys(params).forEach(key => {
    const standardKeys = ['page', 'perPage', 'search', 'sort', 'order', 'filters'];
    if (!standardKeys.includes(key) && params[key] !== undefined && params[key] !== null) {
      query.append(key, String(params[key]));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}