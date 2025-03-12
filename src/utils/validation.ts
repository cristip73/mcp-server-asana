/**
 * Utilitar pentru validarea parametrilor API-ului Asana.
 * Acest modul oferă funcții pentru validarea parametrilor înainte de a face apeluri către API-ul Asana,
 * prevenind astfel erorile comune la nivel de API.
 */

// Interfețe pentru rezultatele validării
export interface ValidationError {
  param: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validează un GID Asana (identificator global)
 * @param gid Valoarea de validat
 * @param paramName Numele parametrului (pentru mesajele de eroare)
 * @returns Obiect cu rezultatul validării
 */
export function validateGid(gid: any, paramName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!gid) {
    errors.push(`${paramName} is required`);
  } else if (typeof gid !== 'string') {
    errors.push(`${paramName} must be a string`);
  } else if (!/^\d+$/.test(gid)) {
    errors.push(`${paramName} must be a numeric string (Asana GID format)`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validează un format de dată
 * @param date Valoarea de validat
 * @param paramName Numele parametrului
 * @param optional Dacă parametrul este opțional
 * @returns Obiect cu rezultatul validării
 */
export function validateDate(date: any, paramName: string, optional: boolean = true): ValidationResult {
  const errors: string[] = [];
  
  // Dacă e opțional și nu e furnizat, e valid
  if (optional && (date === undefined || date === null)) {
    return { valid: true, errors: [] };
  }
  
  if (!optional && (date === undefined || date === null)) {
    errors.push(`${paramName} is required`);
  } else if (date) {
    // Verificăm dacă e o dată validă în format ISO sau string de dată validă
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push(`${paramName} must be a valid date format (YYYY-MM-DD or ISO format)`);
      }
    } catch (e) {
      errors.push(`${paramName} must be a valid date format (YYYY-MM-DD or ISO format)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validează un parametru string
 * @param value Valoarea de validat
 * @param paramName Numele parametrului
 * @param optional Dacă parametrul este opțional
 * @param minLength Lungimea minimă (opțional)
 * @param maxLength Lungimea maximă (opțional)
 * @returns Obiect cu rezultatul validării
 */
export function validateString(
  value: any, 
  paramName: string, 
  optional: boolean = true,
  minLength?: number,
  maxLength?: number
): ValidationResult {
  const errors: string[] = [];
  
  // Dacă e opțional și nu e furnizat, e valid
  if (optional && (value === undefined || value === null)) {
    return { valid: true, errors: [] };
  }
  
  if (!optional && (value === undefined || value === null)) {
    errors.push(`${paramName} is required`);
  } else if (value !== undefined && value !== null) {
    if (typeof value !== 'string') {
      errors.push(`${paramName} must be a string`);
    } else {
      if (minLength !== undefined && value.length < minLength) {
        errors.push(`${paramName} must be at least ${minLength} characters long`);
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`${paramName} must be no more than ${maxLength} characters long`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validează un parametru de tip enum (valoare din listă predefinită)
 * @param value Valoarea de validat
 * @param paramName Numele parametrului
 * @param allowedValues Lista de valori permise
 * @param optional Dacă parametrul este opțional
 * @returns Obiect cu rezultatul validării
 */
export function validateEnum(
  value: any, 
  paramName: string, 
  allowedValues: string[],
  optional: boolean = true
): ValidationResult {
  const errors: string[] = [];
  
  // Dacă e opțional și nu e furnizat, e valid
  if (optional && (value === undefined || value === null)) {
    return { valid: true, errors: [] };
  }
  
  if (!optional && (value === undefined || value === null)) {
    errors.push(`${paramName} is required`);
  } else if (value !== undefined && value !== null) {
    if (typeof value !== 'string') {
      errors.push(`${paramName} must be a string`);
    } else if (!allowedValues.includes(value)) {
      errors.push(`${paramName} must be one of: ${allowedValues.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validează un parametru boolean
 * @param value Valoarea de validat
 * @param paramName Numele parametrului
 * @param optional Dacă parametrul este opțional
 * @returns Obiect cu rezultatul validării
 */
export function validateBoolean(
  value: any, 
  paramName: string, 
  optional: boolean = true
): ValidationResult {
  const errors: string[] = [];
  
  // Dacă e opțional și nu e furnizat, e valid
  if (optional && (value === undefined || value === null)) {
    return { valid: true, errors: [] };
  }
  
  if (!optional && (value === undefined || value === null)) {
    errors.push(`${paramName} is required`);
  } else if (value !== undefined && value !== null) {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      errors.push(`${paramName} must be a boolean (true or false)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validează parametrii pentru operațiunile legate de task-uri
 * @param toolName Numele uneltei (operațiunii)
 * @param params Parametrii de validat
 * @returns Rezultatul validării
 */
export function validateTaskParameters(toolName: string, params: any): ValidationResult {
  const errors: string[] = [];
  let result: ValidationResult;
  
  // Validări specifice fiecărei operațiuni
  switch (toolName) {
    case 'asana_get_task':
      result = validateGid(params.task_id, 'task_id');
      if (!result.valid) errors.push(...result.errors);
      break;
    
    case 'asana_create_task':
      result = validateGid(params.project_id, 'project_id');
      if (!result.valid) errors.push(...result.errors);
      
      result = validateString(params.name, 'name', false);
      if (!result.valid) errors.push(...result.errors);
      
      if (params.due_on) {
        result = validateDate(params.due_on, 'due_on');
        if (!result.valid) errors.push(...result.errors);
      }
      break;
    
    case 'asana_update_task':
      result = validateGid(params.task_id, 'task_id');
      if (!result.valid) errors.push(...result.errors);
      break;
    
    case 'asana_add_task_dependencies':
    case 'asana_add_task_dependents':
      result = validateGid(params.task_id, 'task_id');
      if (!result.valid) errors.push(...result.errors);
      
      // Verificăm dacă dependencies/dependents există și este un array sau string
      const arrayParam = toolName === 'asana_add_task_dependencies' ? 'dependencies' : 'dependents';
      if (!params[arrayParam]) {
        errors.push(`${arrayParam} is required`);
      }
      break;
    
    case 'asana_add_followers_to_task':
      result = validateGid(params.task_id, 'task_id');
      if (!result.valid) errors.push(...result.errors);
      
      if (!params.followers) {
        errors.push('followers is required');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validează parametrii pentru operațiunile legate de proiecte
 * @param toolName Numele uneltei
 * @param params Parametrii
 * @returns Rezultatul validării
 */
export function validateProjectParameters(toolName: string, params: any): ValidationResult {
  const errors: string[] = [];
  let result: ValidationResult;
  
  // Validări specifice fiecărei operațiuni
  switch (toolName) {
    case 'asana_get_project':
    case 'asana_get_project_task_counts':
    case 'asana_get_project_sections':
      result = validateGid(params.project_id, 'project_id');
      if (!result.valid) errors.push(...result.errors);
      break;
    
    case 'asana_search_projects':
      // Workspace-ul este opțional dacă DEFAULT_WORKSPACE_ID este setat
      if (params.workspace) {
        result = validateGid(params.workspace, 'workspace');
        if (!result.valid) errors.push(...result.errors);
      }
      
      // Verifică pattern-ul de căutare
      if (!params.name_pattern) {
        errors.push("name_pattern is required");
      }
      break;
    
    case 'asana_create_project_for_workspace':
      // Workspace-ul este opțional dacă DEFAULT_WORKSPACE_ID este setat
      if (params.workspace) {
        result = validateGid(params.workspace, 'workspace');
        if (!result.valid) errors.push(...result.errors);
      }
      
      result = validateString(params.name, 'name', false);
      if (!result.valid) errors.push(...result.errors);
      break;
    
    case 'asana_update_project':
      result = validateGid(params.project_id, 'project_id');
      if (!result.valid) errors.push(...result.errors);
      break;
    
    case 'asana_add_members_for_project':
    case 'asana_add_followers_for_project':
      result = validateGid(params.project_id, 'project_id');
      if (!result.valid) errors.push(...result.errors);
      
      const arrayParam = toolName === 'asana_add_members_for_project' ? 'members' : 'followers';
      if (!params[arrayParam]) {
        errors.push(`${arrayParam} is required`);
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validează parametrii pentru operațiunile legate de secțiuni
 * @param toolName Numele uneltei
 * @param params Parametrii
 * @returns Rezultatul validării
 */
export function validateSectionParameters(toolName: string, params: any): ValidationResult {
  const errors: string[] = [];
  let result: ValidationResult;
  
  switch (toolName) {
    case 'asana_create_section_for_project':
      result = validateGid(params.project_id, 'project_id');
      if (!result.valid) errors.push(...result.errors);
      
      result = validateString(params.name, 'name', false);
      if (!result.valid) errors.push(...result.errors);
      break;
    
    case 'asana_add_task_to_section':
      result = validateGid(params.task_id, 'task_id');
      if (!result.valid) errors.push(...result.errors);
      
      result = validateGid(params.section_id, 'section_id');
      if (!result.valid) errors.push(...result.errors);
      break;
    
    case 'asana_get_tasks_for_section':
      result = validateGid(params.section_id, 'section_id');
      if (!result.valid) errors.push(...result.errors);
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Funcția principală pentru validarea parametrilor în funcție de operațiune
 * @param toolName Numele uneltei/operațiunii
 * @param params Parametrii de validat
 * @returns Rezultatul validării
 */
export function validateParameters(toolName: string, params: any): ValidationResult {
  // Dacă nu avem parametri, returnăm eroare
  if (!params) {
    return {
      valid: false,
      errors: ['No parameters provided']
    };
  }
  
  // Identificăm tipul operațiunii și delegăm către validarea specifică
  if (toolName.includes('_task_')) {
    return validateTaskParameters(toolName, params);
  } else if (toolName.includes('_project_') || toolName.includes('_projects')) {
    return validateProjectParameters(toolName, params);
  } else if (toolName.includes('_section_')) {
    return validateSectionParameters(toolName, params);
  }
  
  // Pentru alte operațiuni care nu necesită validări specifice
  return {
    valid: true,
    errors: []
  };
} 