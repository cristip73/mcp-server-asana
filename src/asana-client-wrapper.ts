import Asana from 'asana';

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

  async listWorkspaces(opts: any = {}) {
    const response = await this.workspaces.getWorkspaces(opts);
    return response.data;
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
    // Extract known parameters
    const {
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
      if ( typeof searchOpts.custom_fields == "string" ) {
        try {
          searchOpts.custom_fields = JSON.parse( searchOpts.custom_fields );
        } catch ( err ) {
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

    const response = await this.tasks.searchTasksForWorkspace(workspace, searchParams);

    // Transform the response to simplify custom fields if present
    const transformedData = response.data.map((task: any) => {
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

    return transformedData;
  }

  async getTask(taskId: string, opts: any = {}) {
    const response = await this.tasks.getTask(taskId, opts);
    return response.data;
  }

  async createTask(projectId: string, data: any) {
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
  }

  async getStoriesForTask(taskId: string, opts: any = {}) {
    const response = await this.stories.getStoriesForTask(taskId, opts);
    return response.data;
  }

  async updateTask(taskId: string, data: any) {
    const body = {
      data: {
        ...data,
        // Handle resource_subtype if provided
        resource_subtype: data.resource_subtype || undefined,
        // Handle custom_fields if provided
        custom_fields: data.custom_fields || undefined
      }
    };
    const opts = {};
    const response = await this.tasks.updateTask(body, taskId, opts);
    return response.data;
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

  async addTaskDependencies(taskId: string, dependencies: string[]) {
    const body = {
      data: {
        dependencies: dependencies
      }
    };
    const response = await this.tasks.addDependenciesForTask(body, taskId);
    return response.data;
  }

  async addTaskDependents(taskId: string, dependents: string[]) {
    const body = {
      data: {
        dependents: dependents
      }
    };
    const response = await this.tasks.addDependentsForTask(body, taskId);
    return response.data;
  }

  // Metoda nouă pentru adăugarea de followers la un task
  async addFollowersToTask(taskId: string, followers: string[]) {
    try {
      const body = {
        data: {
          followers: followers
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
          { data: { followers: followers } },
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

  async getMultipleTasksByGid(taskIds: string[], opts: any = {}) {
    if (taskIds.length > 25) {
      throw new Error("Maximum of 25 task IDs allowed");
    }

    // Use Promise.all to fetch tasks in parallel
    const tasks = await Promise.all(
      taskIds.map(taskId => this.getTask(taskId, opts))
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
    try {
      // Pasul 1: Obține informații despre proiect
      const projectFields = "name,gid" + (opts.opt_fields_project ? `,${opts.opt_fields_project}` : "");
      const project = await this.getProject(projectId, { opt_fields: projectFields });
      
      // Pasul 2: Obține secțiunile proiectului
      const sectionFields = "name,gid" + (opts.opt_fields_sections ? `,${opts.opt_fields_sections}` : "");
      const sections = await this.getProjectSections(projectId, { opt_fields: sectionFields });
      
      // Pasul 3: Pentru fiecare secțiune, obține task-urile
      const sectionsWithTasks = await Promise.all(sections.map(async (section: any) => {
        const taskFields = "name,gid,completed,resource_subtype" + (opts.opt_fields_tasks ? `,${opts.opt_fields_tasks}` : "");
        const taskOpts: any = { opt_fields: taskFields };
        
        // Include sau exclude task-urile completate
        if (opts.include_completed_tasks === false) {
          taskOpts.completed_since = "now";
        }
        
        const tasks = await this.getTasksForSection(section.gid, taskOpts);
        
        // Pasul 4: Pentru fiecare task, obține subtask-urile dacă există
        const tasksWithSubtasks = await Promise.all(tasks.map(async (task: any) => {
          // Verifică dacă are subtask-uri
          if (task.num_subtasks && task.num_subtasks > 0) {
            try {
              const subtasks = await this.tasks.getSubtasksForTask(task.gid, { opt_fields: taskFields });
              return { ...task, subtasks: subtasks.data };
            } catch (error) {
              console.error(`Error fetching subtasks for task ${task.gid}:`, error);
              return { ...task, subtasks: [] };
            }
          }
          return { ...task, subtasks: [] };
        }));
        
        return { ...section, tasks: tasksWithSubtasks };
      }));
      
      // Returneaza structura ierarhică completă
      return {
        project: project,
        sections: sectionsWithTasks
      };
    } catch (error) {
      console.error("Error in getProjectHierarchy:", error);
      throw error;
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
      const response = await this.projects.updateProject(projectId, body, opts);
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
}
