import Asana from 'asana';
import { ensureArray } from './utils/array-utils.js';
import { handlePagination, PaginationOptions, PaginatedResponse } from './utils/pagination.js';

export class AsanaClientWrapper {
  private workspaces: any;
  private projects: any;
  private tasks: any;
  private stories: any;
  private projectStatuses: any;
  private tags: any;
  private sections: any;
  private users: any;
  private teams: any;

  constructor(token: string) {
    const client = Asana.ApiClient.instance;
    client.authentications['token'].accessToken = token;

    // Initialize API instances
    this.workspaces = new Asana.WorkspacesApi();
    this.projects = new Asana.ProjectsApi();
    this.tasks = new Asana.TasksApi();
    this.stories = new Asana.StoriesApi();
    this.projectStatuses = new Asana.ProjectStatusesApi();
    this.tags = new Asana.TagsApi();
    this.sections = new Asana.SectionsApi();
    this.users = new Asana.UsersApi();
    this.teams = new Asana.TeamsApi();
  }

  /**
   * Helper method to ensure input is always an array
   * @param input The input to normalize
   * @returns An array representation of the input
   * @private
   */
  private ensureArray(input: any): any[] {
    return ensureArray(input);
  }

  /**
   * Helper method to handle paginated API calls
   * @param initialFetch Function to fetch the initial page
   * @param nextPageFetch Function to fetch subsequent pages
   * @param options Pagination options
   * @returns Combined results from all pages
   */
  private async handlePaginatedResults<T>(
    initialFetch: () => Promise<PaginatedResponse<T>>,
    nextPageFetch: (offset: string) => Promise<PaginatedResponse<T>>,
    options: PaginationOptions = {}
  ): Promise<T[]> {
    try {
      // Fetch the initial page
      const initialResponse = await initialFetch();
      
      // Use the pagination utility to handle additional pages if needed
      return await handlePagination(initialResponse, nextPageFetch, options);
    } catch (error: any) {
      console.error(`Error in paginated request: ${error.message}`);
      throw error;
    }
  }

  async listWorkspaces(opts: any = {}) {
    try {
      // Extract pagination parameters
      const {
        auto_paginate = false,
        max_pages = 10,
        limit,
        offset,
        ...otherOpts
      } = opts;
      
      // Build search parameters
      const searchParams: any = {
        ...otherOpts
      };
      
      // Add pagination parameters
      if (limit !== undefined) {
        // Ensure limit is between 1 and 100
        searchParams.limit = Math.min(Math.max(1, Number(limit)), 100);
      }
      if (offset) searchParams.offset = offset;
      
      // Use the paginated results handler for more reliable pagination
      return await this.handlePaginatedResults(
        // Initial fetch function
        () => this.workspaces.getWorkspaces(searchParams),
        // Next page fetch function
        (nextOffset) => this.workspaces.getWorkspaces({ ...searchParams, offset: nextOffset }),
        // Pagination options
        { auto_paginate, max_pages }
      );
    } catch (error: any) {
      console.error(`Error listing workspaces: ${error.message}`);
      throw error;
    }
  }

  async searchProjects(workspace: string, namePattern: string, archived: boolean = false, opts: any = {}) {
    const response = await this.projects.getProjectsForWorkspace(workspace, {
      archived,
      ...opts
    });
    const pattern = new RegExp(namePattern, 'i');
    return response.data.filter((project: any) => pattern.test(project.name));
  }

  async searchTasks(workspace: string, searchOpts: any = {}) {
    try {
      // Extract pagination parameters
      const { 
        auto_paginate = false, 
        max_pages = 10,
        limit,
        offset,
        // Extract other known parameters
        text,
        resource_subtype,
        completed,
        is_subtask,
        has_attachment,
        is_blocked,
        is_blocking,
        sort_by,
        sort_ascending,
        opt_fields,
        ...otherOpts
      } = searchOpts;

      // Build search parameters
      const searchParams: any = {
        ...otherOpts // Include any additional filter parameters
      };

      // Handle custom fields if provided
      if (searchOpts.custom_fields) {
        if (typeof searchOpts.custom_fields == "string") {
          try {
            searchOpts.custom_fields = JSON.parse(searchOpts.custom_fields);
          } catch (err) {
            if (err instanceof Error) {
              err.message = "custom_fields must be a JSON object : " + err.message;
            }
            throw err;
          }
        }
        Object.entries(searchOpts.custom_fields).forEach(([key, value]) => {
          searchParams[`custom_fields.${key}`] = value;
        });
        delete searchParams.custom_fields; // Remove the custom_fields object since we've processed it
      }

      // Add optional parameters if provided
      if (text) searchParams.text = text;
      if (resource_subtype) searchParams.resource_subtype = resource_subtype;
      if (completed !== undefined) searchParams.completed = completed;
      if (is_subtask !== undefined) searchParams.is_subtask = is_subtask;
      if (has_attachment !== undefined) searchParams.has_attachment = has_attachment;
      if (is_blocked !== undefined) searchParams.is_blocked = is_blocked;
      if (is_blocking !== undefined) searchParams.is_blocking = is_blocking;
      if (sort_by) searchParams.sort_by = sort_by;
      if (sort_ascending !== undefined) searchParams.sort_ascending = sort_ascending;
      if (opt_fields) searchParams.opt_fields = opt_fields;
      
      // Add pagination parameters
      if (limit !== undefined) {
        // Ensure limit is between 1 and 100
        searchParams.limit = Math.min(Math.max(1, Number(limit)), 100);
      }
      if (offset) searchParams.offset = offset;

      // Use the paginated results handler for more reliable pagination
      const results = await this.handlePaginatedResults(
        // Initial fetch function
        () => this.tasks.searchTasksForWorkspace(workspace, searchParams),
        // Next page fetch function
        (nextOffset) => this.tasks.searchTasksForWorkspace(workspace, { ...searchParams, offset: nextOffset }),
        // Pagination options
        { auto_paginate, max_pages }
      );
      
      // Transform the response to simplify custom fields if present
      return results.map((task: any) => {
        if (!task.custom_fields) return task;

        return {
          ...task,
          custom_fields: task.custom_fields.reduce((acc: any, field: any) => {
            const key = `${field.name} (${field.gid})`;
            let value = field.display_value;

            // For enum fields with a value, include the enum option GID
            if (field.type === 'enum' && field.enum_value) {
              value = `${field.display_value} (${field.enum_value.gid})`;
            }

            acc[key] = value;
            return acc;
          }, {})
        };
      });
    } catch (error: any) {
      console.error(`Error searching tasks: ${error.message}`);
      
      // Add more detailed error handling for common issues
      if (error.message?.includes('Bad Request')) {
        // Check for common causes of Bad Request
        if (searchOpts.projects_any) {
          throw new Error(`Error searching tasks with projects_any: ${error.message}. Try using 'projects.any' instead of 'projects_any', or use getTasksForProject directly.`);
        }
        if (searchOpts.limit && (searchOpts.limit < 1 || searchOpts.limit > 100)) {
          throw new Error(`Invalid limit parameter: ${searchOpts.limit}. Limit must be between 1 and 100.`);
        }
        if (searchOpts.offset && !searchOpts.offset.startsWith('eyJ')) {
          throw new Error(`Invalid offset parameter: ${searchOpts.offset}. Offset must be a valid pagination token from a previous response.`);
        }
        
        // Generic bad request error with suggestions
        throw new Error(`Bad Request error when searching tasks. Check that all parameters are valid. Common issues: invalid workspace ID, invalid project reference, or incompatible search filters. ${error.message}`);
      }
      
      throw error;
    }
  }

  async getTask(taskId: string, opts: any = {}) {
    try {
      const response = await this.tasks.getTask(taskId, opts);
      return response.data;
    } catch (error: any) {
      console.error(`Error retrieving task ${taskId}: ${error.message}`);
      // Adăugăm informații utile pentru diagnosticare
      if (error.response && error.response.body) {
        console.error(`Response error details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
      throw error;
    }
  }

  async createTask(projectId: string, data: any) {
    try {
      // Ensure projects array includes the projectId
      const projects = data.projects || [];
      if (!projects.includes(projectId)) {
        projects.push(projectId);
      }

      const taskData = {
        data: {
          ...data,
          projects,
          // Handle resource_subtype if provided
          resource_subtype: data.resource_subtype || 'default_task',
          // Handle custom_fields if provided
          custom_fields: data.custom_fields || {},
          // Asigură-te că task-ul este adăugat la sfârșitul listei
          insert_before: null
        }
      };
      const response = await this.tasks.createTask(taskData);
      return response.data;
    } catch (error: any) {
      console.error(`Error creating task: ${error.message}`);
      // Add useful diagnostics information
      if (error.response && error.response.body) {
        console.error(`Response error details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
      
      // Provide more context about the error
      if (error.message.includes("Missing input")) {
        throw new Error(`Failed to create task: Missing required parameters. ${error.message}`);
      }
      
      if (error.message.includes("Not a valid project")) {
        throw new Error(`Project ID ${projectId} is not valid or you don't have access to it.`);
      }
      
      throw error;
    }
  }

  async getStoriesForTask(taskId: string, opts: any = {}) {
    const response = await this.stories.getStoriesForTask(taskId, opts);
    return response.data;
  }

  async updateTask(taskId: string, data: any) {
    // Create a deep clone of the data to avoid modifying the original
    const taskData = JSON.parse(JSON.stringify(data));
    
    // Handle custom fields properly if provided
    if (taskData.custom_fields) {
      try {
        // Import utils only when needed (avoiding circular dependencies)
        const { parseCustomFields } = await import('./utils/field-utils.js');
        taskData.custom_fields = parseCustomFields(taskData.custom_fields);
      } catch (err) {
        throw new Error(`Error processing custom fields: ${(err as Error).message}`);
      }
    }
    
    try {
      const body = {
        data: {
          ...taskData,
          // Handle resource_subtype if provided
          resource_subtype: taskData.resource_subtype || undefined,
        }
      };
      
      const opts = {};
      const response = await this.tasks.updateTask(body, taskId, opts);
      return response.data;
    } catch (error: any) {
      // Add more context for custom field errors
      if (error.message?.includes('custom_field')) {
        throw new Error(`Error updating custom fields: ${error.message}. Make sure you're using the correct format for each field type.`);
      }
      throw error;
    }
  }

  async getProject(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const response = await this.projects.getProject(projectId, options);
    return response.data;
  }

  async getProjectTaskCounts(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const response = await this.projects.getTaskCountsForProject(projectId, options);
    return response.data;
  }

  async getProjectSections(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const sections = new Asana.SectionsApi();
    const response = await sections.getSectionsForProject(projectId, options);
    return response.data;
  }

  async createTaskStory(taskId: string, text: string, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const body = {
      data: {
        text: text
      }
    };
    const response = await this.stories.createStoryForTask(body, taskId, options);
    return response.data;
  }

  async addTaskDependencies(taskId: string, dependencies: any) {
    // Ensure dependencies is an array
    const dependenciesArray = this.ensureArray(dependencies);
    
    const body = {
      data: {
        dependencies: dependenciesArray
      }
    };
    const response = await this.tasks.addDependenciesForTask(body, taskId);
    return response.data;
  }

  async addTaskDependents(taskId: string, dependents: any) {
    // Ensure dependents is an array
    const dependentsArray = this.ensureArray(dependents);
    
    const body = {
      data: {
        dependents: dependentsArray
      }
    };
    const response = await this.tasks.addDependentsForTask(body, taskId);
    return response.data;
  }

  /**
   * Add one or more tags to a task
   * @param taskId Task GID to add tags to
   * @param tags Single tag GID or array of tag GIDs
   * @returns Results object with successful and failed tags
   */
  async addTagsToTask(taskId: string, tags: any) {
    // Ensure tags is an array
    const tagsArray = this.ensureArray(tags);
    
    const results: {
      task_id: string,
      successful_tags: string[],
      failed_tags: Array<{tag_gid: string, error: string}>,
      task_data: any
    } = {
      task_id: taskId,
      successful_tags: [],
      failed_tags: [],
      task_data: null
    };
    
    if (tagsArray.length === 0) {
      throw new Error("Tags must be provided as a non-empty array of tag GIDs");
    }
    
    // The Asana API requires separate requests for each tag
    for (const tagGid of tagsArray) {
      try {
        await this.tasks.addTagForTask(taskId, {
          data: { tag: tagGid }
        });
        results.successful_tags.push(tagGid);
      } catch (error: any) {
        results.failed_tags.push({
          tag_gid: tagGid,
          error: error.message
        });
      }
    }
    
    // Return the updated task with tags included
    try {
      results.task_data = await this.getTask(taskId, { opt_fields: "name,tags" });
    } catch (error: any) {
      console.error(`Could not fetch updated task data: ${error.message}`);
    }
    
    return results;
  }

  // Metoda nouă pentru adăugarea de followers la un task
  async addFollowersToTask(taskId: string, followers: any) {
    // Ensure followers is an array
    const followersArray = this.ensureArray(followers);
    
    try {
      const body = {
        data: {
          followers: followersArray
        }
      };
      const response = await this.tasks.addFollowersForTask(body, taskId);
      return response.data;
    } catch (error) {
      console.error(`Error adding followers to task: ${error}`);
      // Dacă metoda standard eșuează, încercăm metoda alternativă cu callApi direct
      try {
        const client = Asana.ApiClient.instance;
        const response = await client.callApi(
          `/tasks/${taskId}/addFollowers`,
          'POST',
          { task_gid: taskId },
          {},
          {},
          {},
          { data: { followers: followersArray } },
          ['token'],
          ['application/json'],
          ['application/json'],
          'Blob'
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Error in fallback method for adding followers:", fallbackError);
        throw fallbackError;
      }
    }
  }

  async createSubtask(parentTaskId: string, data: any, opts: any = {}) {
    const taskData = {
      data: {
        ...data,
        // Asigură-te că subtask-ul este adăugat la sfârșitul listei
        insert_before: null
      }
    };
    const response = await this.tasks.createSubtaskForTask(taskData, parentTaskId, opts);
    return response.data;
  }

  async setParentForTask(data: any, taskId: string, opts: any = {}) {
    const response = await this.tasks.setParentForTask({ data }, taskId, opts);
    return response.data;
  }

  async getSubtasksForTask(taskId: string, opts: any = {}) {
    try {
      const response = await this.tasks.getSubtasksForTask(taskId, opts);
      return response.data;
    } catch (error) {
      console.error("Error in getSubtasksForTask:", error);
      throw error;
    }
  }

  async getProjectStatus(statusId: string, opts: any = {}) {
    const response = await this.projectStatuses.getProjectStatus(statusId, opts);
    return response.data;
  }

  async getProjectStatusesForProject(projectId: string, opts: any = {}) {
    const response = await this.projectStatuses.getProjectStatusesForProject(projectId, opts);
    return response.data;
  }

  async createProjectStatus(projectId: string, data: any) {
    const body = { data };
    const response = await this.projectStatuses.createProjectStatusForProject(body, projectId);
    return response.data;
  }

  async deleteProjectStatus(statusId: string) {
    const response = await this.projectStatuses.deleteProjectStatus(statusId);
    return response.data;
  }

  async getMultipleTasksByGid(taskIds: any, opts: any = {}) {
    const taskIdsArray = this.ensureArray(taskIds);
    
    if (taskIdsArray.length > 25) {
      throw new Error("Maximum of 25 task IDs allowed");
    }

    // Use Promise.all to fetch tasks in parallel
    const tasks = await Promise.all(
      taskIdsArray.map(taskId => this.getTask(taskId, opts))
    );

    return tasks;
  }

  async getTasksForTag(tag_gid: string, opts: any = {}) {
    const response = await this.tasks.getTasksForTag(tag_gid, opts);
    return response.data;
  }

  async getTagsForWorkspace(workspace_gid: string, opts: any = {}) {
    const response = await this.tags.getTagsForWorkspace(workspace_gid, opts);
    return response.data;
  }

  async getTeamsForUser(user_gid: string, opts: any = {}) {
    try {
      const response = await this.teams.getTeamsForUser(user_gid, opts);
      return response.data;
    } catch (error) {
      console.error(`Error in getTeamsForUser: ${error}`);
      throw error;
    }
  }

  async getTeamsForWorkspace(workspace_gid: string, opts: any = {}) {
    try {
      const response = await this.teams.getTeamsForWorkspace(workspace_gid, opts);
      return response.data;
    } catch (error) {
      console.error(`Error in getTeamsForWorkspace: ${error}`);
      throw error;
    }
  }

  // Metodă nouă pentru crearea unei secțiuni într-un proiect
  async createSectionForProject(projectId: string, name: string, opts: any = {}) {
    try {
      const body = {
        data: {
          name
        }
      };
      // Schimbăm ordinea parametrilor conform documentației Asana
      const response = await this.sections.createSectionForProject(projectId, body, opts);
      return response.data;
    } catch (error) {
      console.error(`Error creating section for project: ${error}`);
      // Dacă obținem eroare, încercăm metoda alternativă folosind callApi direct
      try {
        const client = Asana.ApiClient.instance;
        const response = await client.callApi(
          `/projects/${projectId}/sections`,
          'POST',
          { project_gid: projectId },
          {},
          {},
          {},
          { data: { name } },
          ['token'],
          ['application/json'],
          ['application/json'],
          'Blob'
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Error in fallback method:", fallbackError);
        throw fallbackError;
      }
    }
  }

  // Metodă nouă pentru adăugarea unui task într-o secțiune
  async addTaskToSection(sectionId: string, taskId: string, opts: any = {}) {
    const data = {
      data: {
        task: taskId,
        insert_before: null
      }
    };
    try {
      const response = await this.sections.addTaskForSection(sectionId, data, opts);
      return response.data;
    } catch (error) {
      console.error("Error in addTaskToSection:", error);
      // Dacă obținem eroare, încercăm metoda alternativă folosind callApi direct
      try {
        const client = Asana.ApiClient.instance;
        const response = await client.callApi(
          `/sections/${sectionId}/addTask`,
          'POST',
          { section_gid: sectionId },
          {},
          {},
          {},
          { data: { task: taskId, insert_before: null } },
          ['token'],
          ['application/json'],
          ['application/json'],
          'Blob'
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Error in fallback method:", fallbackError);
        throw fallbackError;
      }
    }
  }

  // Metodă nouă pentru a obține task-urile dintr-o secțiune
  async getTasksForSection(sectionId: string, opts: any = {}) {
    try {
      const response = await this.tasks.getTasksForSection(sectionId, opts);
      return response.data;
    } catch (error) {
      console.error("Error in getTasksForSection:", error);
      throw error;
    }
  }

  // Metodă pentru obținerea structurii ierarhice complete a unui proiect
  async getProjectHierarchy(projectId: string, opts: any = {}) {
    /**
     * Get the complete hierarchical structure of an Asana project
     * Pagination features:
     * 1. Auto pagination: Set auto_paginate=true to get all results automatically
     * 2. Manual pagination: 
     *    - First request: Set limit=N (without offset)
     *    - Subsequent requests: Use limit=N with offset token from previous response
     * 3. Pagination metadata is provided at multiple levels:
     *    - Global: result.pagination_info
     *    - Section level: section.pagination_info (contains next_offset token)
     *    - Task level: task.subtasks_pagination_info (for subtasks pagination)
     * 
     * @param projectId - The project GID
     * @param opts - Options including pagination params (limit, offset, auto_paginate)
     */
    try {
      // Extrage opțiunile de paginare
      const { 
        auto_paginate = false, 
        max_pages = 10,
        limit,
        offset,
        include_subtasks = true,
        include_completed_subtasks,
        ...otherOpts 
      } = opts;

      // Pasul 1: Obține informații despre proiect
      const projectFields = "name,gid" + (opts.opt_fields_project ? `,${opts.opt_fields_project}` : "");
      const project = await this.getProject(projectId, { opt_fields: projectFields });
      
      // Pasul 2: Obține secțiunile proiectului
      const sectionFields = "name,gid" + (opts.opt_fields_sections ? `,${opts.opt_fields_sections}` : "");
      const sections = await this.getProjectSections(projectId, { opt_fields: sectionFields });
      
      // Verifică dacă avem secțiuni
      if (!sections || sections.length === 0) {
        return {
          project: project,
          sections: []
        };
      }
      
      // Calculăm limita efectivă pentru task-uri, dacă este specificată
      // Dacă nu este specificată, folosim o valoare implicită care va permite API-ului să decidă
      const effectiveLimit = limit ? Math.min(Math.max(1, Number(limit)), 100) : undefined;
      
      // Pasul 3: Pentru fiecare secțiune, obține task-urile
      const sectionsWithTasks = await Promise.all(sections.map(async (section: any) => {
        const taskFields = "name,gid,completed,resource_subtype,num_subtasks" + (opts.opt_fields_tasks ? `,${opts.opt_fields_tasks}` : "");
        
        // Pregătim parametrii pentru task-uri
        const taskOpts: any = { 
          opt_fields: taskFields
        };
        
        // Adăugăm limita doar dacă este specificată
        if (effectiveLimit) {
          taskOpts.limit = effectiveLimit;
        }
        
        // Adăugăm offset doar dacă este specificat și pare valid (începe cu 'eyJ')
        if (offset && typeof offset === 'string' && offset.startsWith('eyJ')) {
          taskOpts.offset = offset;
        }
        
        // Include sau exclude task-urile completate
        if (opts.include_completed_tasks === false) {
          taskOpts.completed_since = "now";
        }
        
        // Obținem task-urile din secțiune cu sau fără paginare
        let tasks;
        if (auto_paginate) {
          // Folosim handlePaginatedResults pentru a obține toate task-urile cu paginare automată
          tasks = await this.handlePaginatedResults(
            // Initial fetch function
            () => this.tasks.getTasksForSection(section.gid, taskOpts),
            // Next page fetch function
            (nextOffset) => this.tasks.getTasksForSection(section.gid, { ...taskOpts, offset: nextOffset }),
            // Pagination options
            { auto_paginate, max_pages }
          );
        } else {
          // Obținem doar o pagină de task-uri
          try {
            const response = await this.tasks.getTasksForSection(section.gid, taskOpts);
            tasks = response.data || [];
            
            // Includem informații despre paginare în rezultat
            if (response.next_page) {
              section.pagination_info = {
                has_more: true,
                next_offset: response.next_page.offset
              };
            } else {
              section.pagination_info = {
                has_more: false
              };
            }
          } catch (error) {
            console.error(`Error fetching tasks for section ${section.gid}:`, error);
            tasks = [];
            section.error = "Could not fetch tasks for this section";
          }
        }
        
        // Pasul 4: Pentru fiecare task, obține subtask-urile dacă acestea există și dacă utilizatorul dorește
        const tasksWithSubtasks = await Promise.all(tasks.map(async (task: any) => {
          // Verifică dacă avem nevoie de subtask-uri și dacă task-ul are subtask-uri
          if (include_subtasks && task.num_subtasks && task.num_subtasks > 0) {
            try {
              // Pregătim câmpurile pentru subtask-uri
              const subtaskFields = "name,gid,completed,resource_subtype" + 
                (opts.opt_fields_subtasks ? `,${opts.opt_fields_subtasks}` : 
                 opts.opt_fields_tasks ? `,${opts.opt_fields_tasks}` : "");
              
              // Pregătim parametrii pentru subtask-uri
              const subtaskOpts: any = { 
                opt_fields: subtaskFields
              };
              
              // Adăugăm limita doar dacă este specificată
              if (effectiveLimit) {
                subtaskOpts.limit = effectiveLimit;
              }
              
              // Aplicăm filtrarea pentru task-uri completate (dacă este specificată)
              if (include_completed_subtasks === false) {
                subtaskOpts.completed_since = "now";
              }
              
              // Folosim metoda corectă pentru a obține subtask-urile
              let subtasks;
              if (auto_paginate) {
                // Cu paginare automată
                subtasks = await this.handlePaginatedResults(
                  // Initial fetch function
                  () => this.tasks.getSubtasksForTask(task.gid, subtaskOpts),
                  // Next page fetch function
                  (nextOffset) => this.tasks.getSubtasksForTask(task.gid, { ...subtaskOpts, offset: nextOffset }),
                  // Pagination options
                  { auto_paginate, max_pages }
                );
              } else {
                // Fără paginare automată, doar o singură pagină
                try {
                  const response = await this.tasks.getSubtasksForTask(task.gid, subtaskOpts);
                  subtasks = response.data || [];
                  
                  // Includem informații despre paginare în rezultat
                  if (response.next_page) {
                    task.subtasks_pagination_info = {
                      has_more: true,
                      next_offset: response.next_page.offset
                    };
                  } else {
                    task.subtasks_pagination_info = {
                      has_more: false
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching subtasks for task ${task.gid}:`, error);
                  subtasks = [];
                  task.subtasks_error = "Could not fetch subtasks for this task";
                }
              }
              
              return { ...task, subtasks };
            } catch (error) {
              console.error(`Error fetching subtasks for task ${task.gid}:`, error);
              return { ...task, subtasks: [], subtasks_error: "Error fetching subtasks" };
            }
          }
          return { ...task, subtasks: [] };
        }));
        
        return { ...section, tasks: tasksWithSubtasks };
      }));
      
      // Adăugăm informații despre paginare la nivelul rezultatului
      const result = {
        project: project,
        sections: sectionsWithTasks,
        pagination_info: {
          auto_paginate_used: auto_paginate,
          effective_limit: effectiveLimit,
          offset_provided: offset ? true : false
        }
      };
      
      // Returnează structura ierarhică completă
      return result;
    } catch (error: any) {
      // Oferim un mesaj de eroare mai util pentru probleme comune
      if (error.message && error.message.includes('offset')) {
        console.error("Error in getProjectHierarchy with pagination:", error);
        throw new Error(`Invalid pagination parameters: ${error.message}. Asana requires offset tokens to be obtained from previous responses.`);
      } else {
        console.error("Error in getProjectHierarchy:", error);
        throw error;
      }
    }
  }

  async createProjectForWorkspace(workspaceId: string, data: any, opts: any = {}) {
    try {
      // Pregătim datele pentru cerere
      const requestData = { ...data };
      
      // Redenumim team_id în team dacă există
      if (requestData.team_id) {
        requestData.team = requestData.team_id;
        delete requestData.team_id;
      }
      
      // Asana API are nevoie de parametrii corecți
      const body = {
        data: {
          // Includem workspace direct
          workspace: workspaceId,
          // Includem toate celelalte date dar fără workspace sau workspace_id
          // deoarece sunt deja transmise prin parametrul workspaceId
          ...requestData
        }
      };
      
      // Eliminăm parametrii redundanți dacă există
      delete body.data.workspace_id;
      delete body.data.workspace; // Evităm duplicarea - am pus deja workspaceId ca workspace
      
      // Folosim metoda standard createProject
      const response = await this.projects.createProject(body, opts);
      return response.data;
    } catch (error: any) {
      console.error(`Error creating project for workspace: ${error}`);
      
      // Adăugăm mai multe detalii despre eroare pentru debugging
      if (error.response && error.response.body) {
        console.error(`Response error details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
      
      throw error;
    }
  }
  
  async updateProject(projectId: string, data: any, opts: any = {}) {
    try {
      // Pregătim datele pentru cerere
      const body = {
        data: {
          ...data
        }
      };
      
      // Folosim metoda standard updateProject pentru a actualiza proiectul
      // Ordinea parametrilor este importantă: body, projectId, opts
      const response = await this.projects.updateProject(body, projectId, opts);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating project: ${error}`);
      
      // Adăugăm mai multe detalii despre eroare pentru debugging
      if (error.response && error.response.body) {
        console.error(`Response error details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
      
      throw error;
    }
  }

  // Metodă pentru adăugarea de membri la un proiect
  async addMembersForProject(projectId: string, members: any) {
    try {
      const membersArray = this.ensureArray(members);
      const body = {
        data: {
          members: membersArray
        }
      };
      const response = await this.projects.addMembersForProject(body, projectId);
      return response.data;
    } catch (error: any) {
      console.error(`Error adding members to project: ${error}`);
      
      // Adăugăm mai multe detalii despre eroare pentru debugging
      if (error.response && error.response.body) {
        console.error(`Response error details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
      
      // Dacă metoda standard eșuează, încercăm metoda alternativă cu callApi direct
      try {
        const client = Asana.ApiClient.instance;
        const membersArray = this.ensureArray(members);
        const response = await client.callApi(
          `/projects/${projectId}/addMembers`,
          'POST',
          { project_gid: projectId },
          {},
          {},
          {},
          { data: { members: membersArray } },
          ['token'],
          ['application/json'],
          ['application/json'],
          'Blob'
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Error in fallback method for adding members:", fallbackError);
        throw fallbackError;
      }
    }
  }

  // Metodă pentru adăugarea de urmăritori la un proiect
  async addFollowersForProject(projectId: string, followers: any) {
    try {
      const followersArray = this.ensureArray(followers);
      const body = {
        data: {
          followers: followersArray
        }
      };
      const response = await this.projects.addFollowersForProject(body, projectId);
      return response.data;
    } catch (error: any) {
      console.error(`Error adding followers to project: ${error}`);
      
      // Adăugăm mai multe detalii despre eroare pentru debugging
      if (error.response && error.response.body) {
        console.error(`Response error details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
      
      // Dacă metoda standard eșuează, încercăm metoda alternativă cu callApi direct
      try {
        const client = Asana.ApiClient.instance;
        const followersArray = this.ensureArray(followers);
        const response = await client.callApi(
          `/projects/${projectId}/addFollowers`,
          'POST',
          { project_gid: projectId },
          {},
          {},
          {},
          { data: { followers: followersArray } },
          ['token'],
          ['application/json'],
          ['application/json'],
          'Blob'
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Error in fallback method for adding followers:", fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Get tasks for a specific project with pagination support
   * @param projectId Project GID
   * @param opts Additional options including pagination options
   * @returns List of tasks in the project
   */
  async getTasksForProject(projectId: string, opts: any = {}) {
    try {
      // Extract pagination parameters
      const { 
        auto_paginate = false, 
        max_pages = 10,
        limit,
        offset,
        opt_fields,
        completed,
        ...otherOpts
      } = opts;

      // Build search parameters
      const searchParams: any = {
        ...otherOpts
      };
      
      // Add specific filters
      if (completed !== undefined) searchParams.completed = completed;
      if (opt_fields) searchParams.opt_fields = opt_fields;
      
      // Add pagination parameters
      if (limit !== undefined) {
        // Ensure limit is between 1 and 100
        searchParams.limit = Math.min(Math.max(1, Number(limit)), 100);
      }
      if (offset) searchParams.offset = offset;

      // Use the paginated results handler for more reliable pagination
      return await this.handlePaginatedResults(
        // Initial fetch function
        () => this.tasks.getTasksForProject(projectId, searchParams),
        // Next page fetch function
        (nextOffset) => this.tasks.getTasksForProject(projectId, { ...searchParams, offset: nextOffset }),
        // Pagination options
        { auto_paginate, max_pages }
      );
    } catch (error: any) {
      console.error(`Error getting tasks for project ${projectId}: ${error.message}`);
      
      // Add detailed error handling for common issues
      if (error.message?.includes('Not Found')) {
        throw new Error(`Project with ID ${projectId} not found or inaccessible.`);
      }
      
      if (error.message?.includes('Bad Request')) {
        if (opts.limit && (opts.limit < 1 || opts.limit > 100)) {
          throw new Error(`Invalid limit parameter: ${opts.limit}. Limit must be between 1 and 100.`);
        }
        
        throw new Error(`Error retrieving tasks for project: ${error.message}. Check that all parameters are valid.`);
      }
      
      throw error;
    }
  }
}
