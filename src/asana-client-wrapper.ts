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
  private attachments: any;
  private sections: any;
  private users: any;
  private teams: any;
  private defaultWorkspaceId?: string;

  constructor(token: string, defaultWorkspaceId?: string) {
    const client = Asana.ApiClient.instance;
    client.authentications['token'].accessToken = token;

    // Initialize API instances
    this.workspaces = new Asana.WorkspacesApi();
    this.projects = new Asana.ProjectsApi();
    this.tasks = new Asana.TasksApi();
    this.stories = new Asana.StoriesApi();
    this.projectStatuses = new Asana.ProjectStatusesApi();
    this.tags = new Asana.TagsApi();
    this.attachments = new Asana.AttachmentsApi();
    this.sections = new Asana.SectionsApi();
    this.users = new Asana.UsersApi();
    this.teams = new Asana.TeamsApi();
    this.defaultWorkspaceId = defaultWorkspaceId;
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
      // If DEFAULT_WORKSPACE_ID is set, only return that workspace
      if (this.defaultWorkspaceId) {
        console.error(`Using default workspace ID: ${this.defaultWorkspaceId}`);
        const response = await this.workspaces.getWorkspace(this.defaultWorkspaceId, opts);
        return [response.data]; // Return as an array with a single workspace
      }

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

  async searchProjects(workspace: string | undefined, namePattern: string, archived: boolean = false, opts: any = {}) {
    try {
      // Extrage parametrii noi
      const { 
        team,
        limit,
        offset,
        auto_paginate = false, 
        max_pages = 10,
        opt_fields,
        ...otherOpts
      } = opts;
      
      // Pregătește obiectul de parametri pentru cerere
      const searchParams: any = {
        ...otherOpts,
        archived
      };
      
      // Adaugă workspace dacă este furnizat sau folosește cel implicit
      if (workspace) {
        searchParams.workspace = workspace;
      } else if (this.defaultWorkspaceId) {
        searchParams.workspace = this.defaultWorkspaceId;
      }
      
      // Adaugă team dacă este furnizat
      if (team) {
        searchParams.team = team;
      }
      
      // Verifică dacă avem cel puțin un parametru de filtrare (workspace sau team)
      if (!searchParams.workspace && !searchParams.team) {
        throw new Error("No workspace or team specified and no default workspace ID set");
      }
      
      // Adaugă câmpuri opționale dacă sunt furnizate
      if (opt_fields) {
        searchParams.opt_fields = opt_fields;
      } else {
        searchParams.opt_fields = 'name,archived,created_at,modified_at,public,current_status';
      }
      
      // Adaugă parametri de paginare
      if (limit !== undefined) {
        // Asigură-te că limita este între 1 și 100
        searchParams.limit = Math.min(Math.max(1, Number(limit)), 100);
      }
      if (offset) {
        searchParams.offset = offset;
      }
      
      // Folosește handlePaginatedResults pentru a gestiona paginarea
      const projects = await this.handlePaginatedResults(
        // Funcția de fetch inițială
        () => this.projects.getProjects(searchParams),
        // Funcția de fetch pentru pagina următoare
        (nextOffset) => this.projects.getProjects({ ...searchParams, offset: nextOffset }),
        // Opțiuni de paginare
        { auto_paginate, max_pages }
      );
      
      // Filtrează proiectele pe baza pattern-ului de nume
      if (namePattern) {
        const pattern = new RegExp(namePattern, 'i');
        return projects.filter((project: any) => pattern.test(project.name));
      }
      
      return projects;
    } catch (error: any) {
      console.error(`Error searching projects: ${error.message}`);
      
      // Adaugă gestionare detaliată a erorilor pentru situații comune
      if (error.message?.includes('Bad Request')) {
        if (opts.limit && (opts.limit < 1 || opts.limit > 100)) {
          throw new Error(`Invalid limit parameter: ${opts.limit}. Limit must be between 1 and 100.`);
        }
        
        throw new Error(`Error searching projects: ${error.message}. Check that all parameters are valid.`);
      }
      
      throw error;
    }
  }

  async searchTasks(workspace: string | undefined, searchOpts: any = {}) {
    try {
      // Use default workspace if not specified and available
      if (!workspace && this.defaultWorkspaceId) {
        workspace = this.defaultWorkspaceId;
      }
      
      if (!workspace) {
        throw new Error("No workspace specified and no default workspace ID set");
      }
      
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
    // Ensure we always include essential opt_fields for task counts
    // See: https://developers.asana.com/reference/gettaskcountsforproject
    const options = {
      opt_fields: 'num_tasks,num_incomplete_tasks,num_completed_tasks,num_milestones,num_incomplete_milestones,num_completed_milestones'
    };
    
    // If caller provided specific opt_fields, use those instead
    if (opts.opt_fields) {
      options.opt_fields = opts.opt_fields;
    }
    
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
        // Corect format for Asana API
        const body = {
          data: {
            tag: tagGid
          }
        };
        
        await this.tasks.addTagForTask(body, taskId);
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

  async getTagsForWorkspace(workspace_gid: string | undefined, opts: any = {}) {
    // Use default workspace if not specified and available
    if (!workspace_gid && this.defaultWorkspaceId) {
      workspace_gid = this.defaultWorkspaceId;
    }
    
    if (!workspace_gid) {
      throw new Error("No workspace specified and no default workspace ID set");
    }
    
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

  async getTeamsForWorkspace(workspace_gid: string | undefined, opts: any = {}) {
    try {
      // Use default workspace if not specified and available
      if (!workspace_gid && this.defaultWorkspaceId) {
        workspace_gid = this.defaultWorkspaceId;
      }
      
      if (!workspace_gid) {
        throw new Error("No workspace specified and no default workspace ID set");
      }
      
      const response = await this.teams.getTeamsForWorkspace(workspace_gid, opts);
      return response.data;
    } catch (error) {
      console.error(`Error in getTeamsForWorkspace: ${error}`);
      throw error;
    }
  }

  /**
   * Gets a list of users in a workspace with support for pagination
   * @param workspaceId The workspace ID to get users for
   * @param opts Additional options including pagination parameters
   * @returns List of users in the workspace
   */
  async getUsersForWorkspace(workspaceId: string | undefined, opts: any = {}) {
    try {
      // Use default workspace if not specified and available
      if (!workspaceId && this.defaultWorkspaceId) {
        workspaceId = this.defaultWorkspaceId;
      }
      
      if (!workspaceId) {
        throw new Error("No workspace specified and no default workspace ID set");
      }
      
      // Extract pagination parameters
      const { 
        auto_paginate = false, 
        max_pages = 10,
        limit,
        offset,
        opt_fields,
        ...otherOpts
      } = opts;
      
      // Build search parameters
      const searchParams: any = {
        ...otherOpts
      };
      
      // Add default opt_fields if not specified
      if (!opt_fields) {
        searchParams.opt_fields = "name,email";
      } else {
        searchParams.opt_fields = opt_fields;
      }
      
      // Add pagination parameters if provided
      if (limit !== undefined) {
        // Ensure limit is between 1 and 100
        searchParams.limit = Math.min(Math.max(1, Number(limit)), 100);
      }
      if (offset) searchParams.offset = offset;
      
      // Use the paginated results handler for more reliable pagination
      return await this.handlePaginatedResults(
        // Initial fetch function
        () => this.users.getUsersForWorkspace(workspaceId, searchParams),
        // Next page fetch function
        (nextOffset) => this.users.getUsersForWorkspace(workspaceId, { ...searchParams, offset: nextOffset }),
        // Pagination options
        { auto_paginate, max_pages }
      );
    } catch (error: any) {
      console.error(`Error getting users for workspace ${workspaceId}: ${error.message}`);
      
      // Add detailed error handling for common issues
      if (error.message?.includes('Not Found')) {
        throw new Error(`Workspace with ID ${workspaceId} not found or inaccessible.`);
      }
      
      if (error.message?.includes('Bad Request')) {
        if (opts.limit && (opts.limit < 1 || opts.limit > 100)) {
          throw new Error(`Invalid limit parameter: ${opts.limit}. Limit must be between 1 and 100.`);
        }
        
        throw new Error(`Error retrieving users for workspace: ${error.message}. Check that all parameters are valid.`);
      }
      
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
        max_subtask_depth = 1,
        ...otherOpts 
      } = opts;

      // Initialize stats object for tracking counts
      const stats = {
        total_sections: 0,
        total_tasks: 0,
        total_subtasks: 0
      };

      // Pasul 1: Obține informații despre proiect
      const projectFields = "name,gid" + (opts.opt_fields_project ? `,${opts.opt_fields_project}` : "");
      const project = await this.getProject(projectId, { opt_fields: projectFields });
      
      // Pasul 2: Obține secțiunile proiectului
      const sectionFields = "name,gid" + (opts.opt_fields_sections ? `,${opts.opt_fields_sections}` : "");
      const sections = await this.getProjectSections(projectId, { opt_fields: sectionFields });
      
      // Update stats with section count
      stats.total_sections = sections ? sections.length : 0;
      
      // Verifică dacă avem secțiuni
      if (!sections || sections.length === 0) {
        return {
          project: project,
          sections: [],
          stats
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
        
        // Update total tasks count
        stats.total_tasks += tasks ? tasks.length : 0;
        
        // Pasul 4: Pentru fiecare task, obține subtask-urile dacă acestea există și dacă utilizatorul dorește
        const tasksWithSubtasks = await Promise.all(tasks.map(async (task: any) => {
          // Verifică dacă avem nevoie de subtask-uri și dacă task-ul are subtask-uri
          if (include_subtasks && task.num_subtasks && task.num_subtasks > 0) {
            try {
              // Pregătim câmpurile pentru subtask-uri
              const subtaskFields = "name,gid,completed,resource_subtype,num_subtasks" + 
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
              
              // Update subtasks count
              stats.total_subtasks += subtasks ? subtasks.length : 0;
              
              // If max_subtask_depth > 1, recursively fetch deeper subtasks
              if (max_subtask_depth > 1 && subtasks && subtasks.length > 0) {
                await this.fetchSubtasksRecursively(
                  subtasks,
                  max_subtask_depth,
                  1, // Current depth
                  subtaskOpts,
                  auto_paginate,
                  max_pages,
                  stats
                );
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
        stats, // Include the statistics in the result
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
  
  // Helper method to recursively fetch subtasks to a specified depth
  private async fetchSubtasksRecursively(
    tasks: any[],
    maxDepth: number,
    currentDepth: number,
    opts: any,
    auto_paginate: boolean,
    max_pages: number,
    stats: { total_subtasks: number }
  ) {
    // If we've reached the maximum depth, stop recursion
    if (currentDepth >= maxDepth) {
      return;
    }
    
    // For each task at the current depth
    for (const task of tasks) {
      // Skip if task has no subtasks
      if (!task.num_subtasks || task.num_subtasks <= 0) {
        continue;
      }
      
      try {
        // Fetch subtasks for this task
        let subtasks;
        if (auto_paginate) {
          // With auto pagination
          subtasks = await this.handlePaginatedResults(
            // Initial fetch function
            () => this.tasks.getSubtasksForTask(task.gid, opts),
            // Next page fetch function
            (nextOffset) => this.tasks.getSubtasksForTask(task.gid, { ...opts, offset: nextOffset }),
            // Pagination options
            { auto_paginate, max_pages }
          );
        } else {
          // Without auto pagination, just get one page
          const response = await this.tasks.getSubtasksForTask(task.gid, opts);
          subtasks = response.data || [];
          
          // Add pagination info to the task
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
        }
        
        // Update subtasks count
        stats.total_subtasks += subtasks ? subtasks.length : 0;
        
        // Add subtasks to the current task
        task.subtasks = subtasks;
        
        // Recursively fetch the next level of subtasks
        if (subtasks && subtasks.length > 0) {
          await this.fetchSubtasksRecursively(
            subtasks,
            maxDepth,
            currentDepth + 1,
            opts,
            auto_paginate,
            max_pages,
            stats
          );
        }
      } catch (error) {
        console.error(`Error recursively fetching subtasks for task ${task.gid}:`, error);
        task.subtasks = [];
        task.subtasks_error = "Error fetching subtasks recursively";
      }
    }
  }

  async createProjectForWorkspace(workspaceId: string | undefined, data: any, opts: any = {}) {
    try {
      // Use default workspace if not specified and available
      if (!workspaceId && this.defaultWorkspaceId) {
        workspaceId = this.defaultWorkspaceId;
      }
      
      if (!workspaceId) {
        throw new Error("No workspace specified and no default workspace ID set");
      }
      
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

  // Metodă pentru reordonarea unei secțiuni într-un proiect
  async reorderSections(projectId: string, sectionId: string, beforeSectionId?: string | null, afterSectionId?: string | null) {
    try {
      if (!sectionId) {
        throw new Error("Section ID cannot be empty");
      }

      // Nu putem specifica atât before_section cât și after_section simultan
      if (beforeSectionId !== undefined && beforeSectionId !== null && afterSectionId !== undefined && afterSectionId !== null) {
        throw new Error("Cannot specify both before_section and after_section. Choose one.");
      }

      const body: any = {
        data: {
          section: sectionId
        }
      };

      // Adăugăm before_section sau after_section la body, dacă sunt specificate
      if (beforeSectionId !== undefined) {
        body.data.before_section = beforeSectionId === null ? null : beforeSectionId;
      } else if (afterSectionId !== undefined) {
        body.data.after_section = afterSectionId === null ? null : afterSectionId;
      } else {
        throw new Error("Must specify either before_section_id or after_section_id");
      }

      // Apelăm API-ul Asana pentru a muta secțiunea
      const response = await this.sections.insertSectionForProject(projectId, body);
      
      return {
        project_id: projectId,
        section_id: sectionId,
        status: "success",
        before_section: beforeSectionId,
        after_section: afterSectionId,
        result: response.data
      };
    } catch (error) {
      console.error(`Error reordering section for project: ${error}`);
      
      // Dacă metoda standard eșuează, încercăm metoda alternativă cu callApi direct
      try {
        const client = Asana.ApiClient.instance;
        
        const body: any = {
          data: {
            section: sectionId
          }
        };

        // Adăugăm before_section sau after_section la body, dacă sunt specificate
        if (beforeSectionId !== undefined) {
          body.data.before_section = beforeSectionId === null ? null : beforeSectionId;
        } else if (afterSectionId !== undefined) {
          body.data.after_section = afterSectionId === null ? null : afterSectionId;
        }

        const response = await client.callApi(
          `/projects/${projectId}/sections/insert`,
          'POST',
          { project_gid: projectId },
          {},
          {},
          {},
          body,
          ['token'],
          ['application/json'],
          ['application/json'],
          'Blob'
        );
        
        return {
          project_id: projectId,
          section_id: sectionId,
          status: "success (fallback method)",
          before_section: beforeSectionId,
          after_section: afterSectionId,
          result: response.data
        };
      } catch (fallbackError) {
        console.error("Error in fallback method:", fallbackError);
        throw error; // Aruncăm eroarea originală
      }
    }
  }

  async getAttachmentsForObject(objectId: string, opts: any = {}) {
    const response = await this.attachments.getAttachmentsForObject(objectId, opts);
    return response.data;
  }

  async getAttachment(attachmentId: string, opts: any = {}) {
    const response = await this.attachments.getAttachment(attachmentId, opts);
    return response.data;
  }

  async uploadAttachmentForObject(objectId: string, filePath: string, fileName?: string, fileType?: string) {
    const fs = await import('fs');
    const path = await import('path');

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const form = new FormData();
    const name = fileName || path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);
    form.append('parent', objectId);
    form.append('file', fileStream, fileType ? { filename: name, contentType: fileType } : name);

    const token = Asana.ApiClient.instance.authentications['token'].accessToken;
    const response = await fetch('https://app.asana.com/api/1.0/attachments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form as any
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();
    return result.data;
  }

  private extensionForMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/zip': '.zip',
      'application/json': '.json'
    };
    return map[mime] || '';
  }

  async downloadAttachment(attachmentId: string, outputDir: string = 'downloads') {
    const fs = await import('fs');
    const path = await import('path');
    const { pipeline } = await import('stream/promises');

    const attachment = await this.getAttachment(attachmentId);
    const downloadUrl = attachment.download_url || attachment.downloadUrl;
    if (!downloadUrl) {
      throw new Error('Attachment does not have a download_url');
    }

    const resolvedDir = path.resolve(process.cwd(), outputDir);
    await fs.promises.mkdir(resolvedDir, { recursive: true });

    const token = Asana.ApiClient.instance.authentications['token'].accessToken;
    const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok || !res.body) {
      throw new Error(`Failed to download attachment: ${res.status}`);
    }

    let filename: string = attachment.name || attachment.gid;
    const contentType = res.headers.get('content-type') || attachment.mime_type;
    if (!path.extname(filename) && contentType) {
      filename += this.extensionForMime(contentType);
    }

    const filePath = path.join(resolvedDir, filename);
    const fileStream = fs.createWriteStream(filePath);
    await pipeline(res.body, fileStream);

    return { attachment_id: attachmentId, file_path: filePath, mime_type: contentType };
  }
}
