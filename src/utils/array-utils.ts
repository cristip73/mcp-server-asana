/**
 * Utilities for handling and normalizing arrays across the application
 */

/**
 * Common parameters that should always be treated as arrays
 */
export const ARRAY_PARAMETERS = [
  'dependencies', 
  'dependents', 
  'followers', 
  'projects', 
  'tags', 
  'team_ids', 
  'sections', 
  'tasks', 
  'task_ids'
];

/**
 * Normalizes a single value into an array 
 * Handles: arrays, comma-separated strings, JSON string arrays, and single values
 * 
 * @param input The input value to normalize into an array
 * @returns An array representation of the input
 */
export function ensureArray(input: any): any[] {
  // Already an array
  if (Array.isArray(input)) {
    return input;
  }
  
  // Handle null/undefined
  if (input === null || input === undefined) {
    return [];
  }
  
  // Handle string values
  if (typeof input === 'string') {
    // Empty string
    if (input.trim() === '') {
      return [];
    }
    
    // Check if it's a JSON array string
    if (input.trim().startsWith('[') && input.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error: any) {
        // If parsing fails, treat as a regular string
        console.warn(`Failed to parse JSON array: ${error.message}`);
      }
    }
    
    // Check if it's a comma-separated list
    if (input.includes(',')) {
      return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // Single string value
    return [input];
  }
  
  // Any other value type (number, boolean, object, etc.)
  return [input];
}

/**
 * Normalizes array parameters in an object
 * Identifies known array parameters and ensures they are in array format
 * 
 * @param args Object containing parameters
 * @returns Object with normalized array parameters
 */
export function normalizeArrayParameters(args: any): any {
  if (!args || typeof args !== 'object') {
    return args;
  }
  
  const result = { ...args };
  
  for (const param of ARRAY_PARAMETERS) {
    if (param in result) {
      result[param] = ensureArray(result[param]);
    }
  }
  
  return result;
} 