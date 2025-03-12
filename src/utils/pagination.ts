/**
 * Utilities for handling pagination in Asana API responses
 */

export interface PaginationOptions {
  limit?: number;
  offset?: string;
  auto_paginate?: boolean;
  max_pages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_page?: {
    offset: string;
    path: string;
  } | null;
}

/**
 * Processes a paginated response, collects all pages if auto_paginate is true
 * @param initialResponse The first page response
 * @param fetchNextPage Function to fetch the next page
 * @param options Pagination options
 * @returns Combined results from all pages
 */
export async function handlePagination<T>(
  initialResponse: PaginatedResponse<T>,
  fetchNextPage: (offset: string) => Promise<PaginatedResponse<T>>,
  options: PaginationOptions = {}
): Promise<T[]> {
  const { auto_paginate = false, max_pages = 10 } = options;
  
  // Start with the initial data
  let results = [...initialResponse.data];
  let currentPage = 1;
  let nextPageData = initialResponse.next_page;
  
  // If auto-pagination is enabled and we have more pages
  if (auto_paginate && nextPageData && nextPageData.offset) {
    // Loop until we've reached max_pages or there are no more pages
    while (nextPageData && currentPage < max_pages) {
      // Fetch the next page
      const nextResponse = await fetchNextPage(nextPageData.offset);
      
      // Add data to our results
      results = [...results, ...nextResponse.data];
      
      // Update pagination info for the next iteration
      nextPageData = nextResponse.next_page;
      currentPage++;
      
      // If no more pages, break out of the loop
      if (!nextPageData) {
        break;
      }
    }
  }
  
  return results;
}

/**
 * Creates standard pagination parameters for Asana API requests
 * @param options Pagination options
 * @returns Object with limit and offset parameters
 */
export function createPaginationParams(options: PaginationOptions = {}): { limit?: number; offset?: string } {
  const { limit, offset } = options;
  const params: { limit?: number; offset?: string } = {};
  
  if (limit !== undefined) {
    // Ensure limit is between 1 and 100
    params.limit = Math.min(Math.max(1, limit), 100);
  }
  
  if (offset) {
    params.offset = offset;
  }
  
  return params;
} 