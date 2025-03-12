/**
 * Utilities for handling Asana custom fields
 */

/**
 * Validates custom field values based on their type
 * @param fieldType The type of the custom field (enum, text, number, date, etc.)
 * @param value The value to validate
 * @returns {boolean} Whether the value is valid for the field type
 */
export function validateCustomFieldValue(fieldType: string, value: any): boolean {
  // Null values are valid for all field types (to clear a field)
  if (value === null) {
    return true;
  }

  switch (fieldType) {
    case 'text':
      return typeof value === 'string';
    
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    
    case 'enum':
      // Enum values should be strings (the GID of the enum option)
      return typeof value === 'string' && value.length > 0;
      
    case 'date':
      // Check if it's a valid date string in YYYY-MM-DD format
      if (typeof value !== 'string') return false;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) return false;
      
      // Check if it's a valid date
      const date = new Date(value);
      return !isNaN(date.getTime());
    
    case 'boolean':
      return typeof value === 'boolean';
      
    case 'multi_enum':
      return Array.isArray(value) && value.every(item => typeof item === 'string' && item.length > 0);
      
    default:
      return true; // Allow unknown field types to pass validation
  }
}

/**
 * Formats custom field values for Asana API
 * @param customFields Object mapping field GIDs to their values
 * @param fieldMetadata Array of custom field metadata objects from Asana
 * @returns Formatted custom fields object
 */
export function formatCustomFieldsForUpdate(customFields: Record<string, any>, fieldMetadata: any[] = []): Record<string, any> {
  const formattedFields: Record<string, any> = {};
  const metadataMap: Record<string, any> = {};
  
  // Create a map of field GIDs to their metadata
  fieldMetadata.forEach(field => {
    metadataMap[field.gid] = field;
  });
  
  // Process each custom field
  for (const [fieldGid, value] of Object.entries(customFields)) {
    const fieldMeta = metadataMap[fieldGid];
    
    // Skip if we don't have metadata for this field
    if (!fieldMeta) {
      console.warn(`No metadata found for custom field ${fieldGid}, skipping validation`);
      formattedFields[fieldGid] = value;
      continue;
    }
    
    // Get the field type
    const fieldType = fieldMeta.resource_subtype || fieldMeta.type;
    
    // Validate the value based on the field type
    if (!validateCustomFieldValue(fieldType, value)) {
      throw new Error(
        `Invalid value for custom field "${fieldMeta.name}" (${fieldGid}). ` +
        `Expected type: ${fieldType}, received: ${typeof value}. ` +
        getCustomFieldFormatHint(fieldType)
      );
    }
    
    // Format the value according to the field type
    formattedFields[fieldGid] = value;
  }
  
  return formattedFields;
}

/**
 * Gets formatting hint for a specific custom field type
 * @param fieldType The type of custom field
 * @returns A string with formatting guidance
 */
function getCustomFieldFormatHint(fieldType: string): string {
  switch (fieldType) {
    case 'enum':
      return "For enum fields, use the enum option GID (e.g., '12345') not the display name.";
    case 'date':
      return "Date fields should be in YYYY-MM-DD format (e.g., '2023-04-15').";
    case 'number':
      return "Number fields should be numeric values (e.g., 42 or 3.14).";
    case 'multi_enum':
      return "Multi-enum fields should be arrays of enum option GIDs (e.g., ['12345', '67890']).";
    default:
      return "";
  }
}

/**
 * Gets custom field metadata for a task
 * @param task Task object from Asana API
 * @returns Array of custom field metadata objects
 */
export function getCustomFieldMetadataFromTask(task: any): any[] {
  if (!task.custom_fields || !Array.isArray(task.custom_fields)) {
    return [];
  }
  
  return task.custom_fields.map(field => ({
    gid: field.gid,
    name: field.name,
    resource_subtype: field.resource_subtype,
    type: field.type,
    enum_options: field.enum_options
  }));
}

/**
 * Parses custom fields input that might be a string
 * @param customFields The custom fields input (object or JSON string)
 * @returns Parsed custom fields object
 */
export function parseCustomFields(customFields: any): Record<string, any> {
  if (typeof customFields === 'string') {
    try {
      return JSON.parse(customFields);
    } catch (err) {
      throw new Error(`Invalid custom_fields format: ${(err as Error).message}. Expected valid JSON object mapping field GIDs to values.`);
    }
  }
  
  if (typeof customFields === 'object' && customFields !== null) {
    return customFields;
  }
  
  throw new Error("Invalid custom_fields format. Expected object mapping field GIDs to values.");
} 