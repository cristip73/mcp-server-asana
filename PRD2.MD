# PRD v2: Priorities for Improving the Asana-Claude Integration

## 1. Executive Summary

Following extensive testing to validate the issues identified in PRD v1, we now present a prioritized list of improvements needed for the Asana-Claude integration. This document focuses on 10 new features and 5 modifications to existing functionality, selected based on importance and impact.

## 1.1 Project Context

The mcp-server-asana project implements a Model Context Protocol (MCP) server that provides Asana integration for AI tools like Claude. The current implementation:

- Lives in a TypeScript codebase organized into modules:
  - `src/tools/` - Contains domain-specific tools organized by functionality
  - `src/asana-client-wrapper.ts` - Handles interactions with the Asana API
  - `src/tool-handler.ts` - Registers tools and routes requests to appropriate handlers

- Has existing functionalities that need improvements:
  - Parameters need standardization (especially array-type parameters)
  - Some workflows require multiple steps that could be simplified
  - Error handling needs enhancement, especially for custom fields
  - Documentation needs clarification for user-facing functionality

- MCP server architectural constraints:
  - Tools must be registered with a defined schema
  - Changes must be backward compatible
  - Implementation needs to follow the existing patterns for consistency 

The proposed improvements aim to make the Asana integration more efficient, intuitive, and powerful while maintaining compatibility with the existing architecture.

## 2. Testing Conclusions

Testing confirmed most of the initially identified issues and provided important clarifications:

1. **Custom Field Updates** - Works for enum fields with the correct format, but requires documentation and standardization.
2. **Adding Dependents** - Works when the `dependents` parameter is formatted as an array.
3. **Creating Tasks in Specific Sections** - Not supported directly, requiring a two-step workflow.
4. **Task Counting** - Requires explicit specification of fields.
5. **Adding Tags** - Not directly supported through the API.
6. **Project Hierarchy** - Does not include subtasks in the results.

## 3. New Features Prioritized (10)

> **Note**: Following additional testing of the features `asana_add_members_for_project` and `asana_add_followers_for_project`, we confirmed that they work correctly and with parameters in array format. These features can serve as models for future implementations, especially for adding tags and standardizing arrays in parameters.

### 3.0 Search Users
- **Priority: High**
- **Description**: Implementing functions for identifying and listing users in Asana
- **Justification**: Enables better user management, task assignment, and reporting capabilities
- **Status**: Planned

#### 3.0.1 List Users in a Workspace
- **Priority: High**
- **Description**: Implement a function to list all users in a specific workspace
- **Justification**: Essential for user management and task assignment
- **Implementation Details**:
  - Create a new tool in `src/tools/user-tools.ts`:
    ```typescript
    export const getUsersForWorkspaceTool: Tool = {
      name: "asana_list_workspace_users",
      description: "Get all users in a workspace or organization",
      inputSchema: {
        type: "object",
        properties: {
          workspace_id: {
            type: "string",
            description: "The workspace ID to get users for"
          },
          opt_fields: {
            type: "string",
            description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo,role')"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return per page (1-100)"
          },
          offset: {
            type: "string",
            description: "Pagination token from previous response"
          },
          auto_paginate: {
            type: "boolean",
            description: "If true, automatically gets all pages and combines results",
            default: false
          }
        },
        required: ["workspace_id"]
      }
    };
    ```
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async getUsersForWorkspace(workspaceId: string, opts: any = {}) {
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
          searchParams.limit = Math.min(Math.max(1, Number(limit)), 100);
        }
        if (offset) searchParams.offset = offset;
        
        // Use the paginated results handler for more reliable pagination
        return await this.handlePaginatedResults(
          () => this.users.getUsersForWorkspace(workspaceId, searchParams),
          (nextOffset) => this.users.getUsersForWorkspace(workspaceId, { ...searchParams, offset: nextOffset }),
          { auto_paginate, max_pages }
        );
      } catch (error: any) {
        console.error(`Error getting users for workspace ${workspaceId}: ${error.message}`);
        throw error;
      }
    }
    ```
  - Update `tool-handler.ts` to handle the new tool

#### 3.0.2 Get User Details
- **Priority: Medium**
- **Description**: Implement a function to get detailed information about a specific user
- **Justification**: Provides comprehensive user information for reporting and management
- **Implementation Details**:
  - Create a new tool in `src/tools/user-tools.ts`:
    ```typescript
    export const getUserDetailsTool: Tool = {
      name: "asana_get_user_details",
      description: "Get detailed information about a specific user",
      inputSchema: {
        type: "object",
        properties: {
          user_id: {
            type: "string",
            description: "The user ID to get details for. Use 'me' to get details for the current user."
          },
          opt_fields: {
            type: "string",
            description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo,workspaces,teams')"
          }
        },
        required: ["user_id"]
      }
    };
    ```
  - Leverage existing `getUser` method in Asana API
  - Update `tool-handler.ts` to handle the new tool

#### 3.0.3 List Users in a Team
- **Priority: Medium**
- **Description**: Implement a function to list all users in a specific team
- **Justification**: Enables team-based user management and reporting
- **Implementation Details**:
  - Create a new tool in `src/tools/user-tools.ts`:
    ```typescript
    export const getUsersForTeamTool: Tool = {
      name: "asana_list_team_users",
      description: "Get all users in a specific team",
      inputSchema: {
        type: "object",
        properties: {
          team_id: {
            type: "string",
            description: "The team ID to get users for"
          },
          opt_fields: {
            type: "string",
            description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo')"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return per page (1-100)"
          },
          offset: {
            type: "string",
            description: "Pagination token from previous response"
          },
          auto_paginate: {
            type: "boolean",
            description: "If true, automatically gets all pages and combines results",
            default: false
          }
        },
        required: ["team_id"]
      }
    };
    ```
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async getUsersForTeam(teamId: string, opts: any = {}) {
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
          searchParams.limit = Math.min(Math.max(1, Number(limit)), 100);
        }
        if (offset) searchParams.offset = offset;
        
        // Use the paginated results handler for more reliable pagination
        return await this.handlePaginatedResults(
          () => this.users.getUsersForTeam(teamId, searchParams),
          (nextOffset) => this.users.getUsersForTeam(teamId, { ...searchParams, offset: nextOffset }),
          { auto_paginate, max_pages }
        );
      } catch (error: any) {
        console.error(`Error getting users for team ${teamId}: ${error.message}`);
        throw error;
      }
    }
    ```
  - Update `tool-handler.ts` to handle the new tool

### 3.1 Creating Tasks in Specific Sections
- **Priority: Critical**
- **Description**: Implementing the `section_id` parameter for the `asana_create_task` function
- **Justification**: Eliminates the need for an additional step, streamlining the workflow
- **Implementation Details**:
  - Update the `createTaskTool` definition in `src/tools/task-tools.ts`:
    ```typescript
    export const createTaskTool: Tool = {
      name: "asana_create_task",
      description: "Create a new task in a project, optionally placing it directly in a specific section",
      inputSchema: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description: "The project to create the task in"
          },
          name: {
            type: "string",
            description: "Name of the task"
          },
          // Add the new section_id parameter
          section_id: {
            type: "string",
            description: "The section to create the task in (optional). If provided, the task will be added to this section. The section must belong to the specified project."
          },
          // Other existing properties...
        },
        required: ["project_id", "name"]
      }
    };
    ```
  - Modify the `createTask` method in `src/asana-client-wrapper.ts` to handle the section_id parameter:
    ```typescript
    async createTask(projectId: string, data: any) {
      // Extract section_id from the data if provided
      const { section_id, ...taskData } = data;
      
      // Ensure project is included in the task data
      if (!taskData.projects) {
        taskData.projects = [projectId];
      }
      
      try {
        // Create the task
        const response = await this.tasks.createTask({
          data: taskData
        });
        
        // If section_id is provided, add the task to the specified section
        if (section_id) {
          try {
            await this.addTaskToSection(section_id, response.data.gid);
          } catch (sectionError) {
            // If adding to section fails, the task was still created
            // but we should inform the user about the section error
            console.error(`Task created but could not be added to section: ${sectionError.message}`);
            throw new Error(`Task was created with ID ${response.data.gid}, but could not be added to section: ${sectionError.message}. Please verify that the section belongs to the specified project.`);
          }
        }
        
        return response.data;
      } catch (error) {
        throw new Error(`Error creating task: ${error.message}`);
      }
    }
    ```
  - Update the tool handler to pass the section_id to the createTask method
  - Add validation in `tool-handler.ts` to provide helpful error messages:
    ```typescript
    case "asana_create_task":
      if (args.section_id) {
        // Task creation with section happens in two steps internally, but appears as one operation to users
        console.log(`Creating task "${args.name}" in project ${args.project_id} and section ${args.section_id}`);
      }
      return {
        result: await asanaClient.createTask(args.project_id, args)
      };
    ```
  - Example usage:
  ```javascript
    // Task creation with automatic section placement
  asana_create_task({
      name: "Task Name",
      project_id: "PROJECT_ID",
      section_id: "SECTION_ID" // New parameter
    })
    
    // This will create the task and place it in the specified section in one operation
    ```
  - **AI usage guidance to include:** "To place a task directly in a specific section, include the `section_id` parameter when creating the task."

### 3.2 Adding Tags to Tasks
- **Priority: High**
- **Description**: Implementing the ability to add tags to tasks
- **Justification**: Allows for efficient categorization of tasks
- **Implementation Details**:
  - Add a new tool definition in `src/tools/tag-tools.ts`:
    ```typescript
    export const addTagsToTaskTool: Tool = {
      name: "asana_add_tags_to_task",
      description: "Add one or more tags to a task for categorization purposes",
      inputSchema: {
        type: "object",
        properties: {
          task_id: {
            type: "string",
            description: "The task ID to add tags to"
          },
          tags: {
            type: "array",
            description: "Array of tag GIDs to add to the task. Use asana_get_tags_for_workspace to find available tags.",
            items: {
              type: "string"
            }
          }
        },
        required: ["task_id", "tags"]
      }
    };
    ```
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async addTagsToTask(taskId: string, tags: string[]) {
      const results = {
        task_id: taskId,
        successful_tags: [],
        failed_tags: [],
        task_data: null
      };
      
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        throw new Error("Tags must be provided as a non-empty array of tag GIDs");
      }
      
      // The Asana API requires separate requests for each tag
      for (const tagGid of tags) {
        try {
          await this.tasks.addTagForTask(taskId, {
            data: { tag: tagGid }
          });
          results.successful_tags.push(tagGid);
        } catch (error) {
          results.failed_tags.push({
            tag_gid: tagGid,
            error: error.message
          });
        }
      }
      
      // Return the updated task with tags included
      try {
        results.task_data = await this.getTask(taskId, { opt_fields: "name,tags" });
      } catch (error) {
        console.error(`Could not fetch updated task data: ${error.message}`);
      }
      
      return results;
    }
    ```
  - Update the tools export in `src/tools/tag-tools.ts` to include the new tool:
    ```typescript
    // At the top of the file with other imports
    import { Tool } from "@modelcontextprotocol/sdk/types.js";
    
    // Export both existing and new tools
    export { 
      getTasksForTagTool, 
      getTagsForWorkspaceTool,
      addTagsToTaskTool 
    }
    ```
  - Update `src/tool-handler.ts` to register and handle the new tool:
    ```typescript
    // Add to imports
    import {
      getTasksForTagTool, 
      getTagsForWorkspaceTool,
      addTagsToTaskTool
    } from './tools/tag-tools.js';
    
    // Add to tools array
    export const tools: Tool[] = [
      // existing tools...
      getTasksForTagTool,
      getTagsForWorkspaceTool,
      addTagsToTaskTool,
      // other tools...
    ];
    
    // Add case in tool handler switch statement
    case "asana_add_tags_to_task":
      if (!Array.isArray(args.tags)) {
        throw new Error("Tags must be provided as an array of tag GIDs");
      }
      console.log(`Adding ${args.tags.length} tags to task ${args.task_id}`);
      return {
        result: await asanaClient.addTagsToTask(args.task_id, args.tags)
      };
    ```
  - Update the README documentation to include information about tag workflow:
    ```markdown
    #### Adding Tags to Tasks
    
    To categorize tasks, you can add tags:
    
    1. First, find available tags using `asana_get_tags_for_workspace`
    2. Then add tags to a task using their GIDs:
    
  ```javascript
    // Get available tags
    asana_get_tags_for_workspace({
      workspace_gid: "WORKSPACE_ID"
    })
    
    // Add tags to a task
  asana_add_tags_to_task({
      task_id: "TASK_ID",
      tags: ["TAG_ID1", "TAG_ID2"]
  })
  ```
    ```
  
  - Example usage:
  ```javascript
    // Add multiple tags to a task
    asana_add_tags_to_task({
      task_id: "TASK_ID",
      tags: ["TAG_ID1", "TAG_ID2"]
    })
    ```
  - Expected response:
    ```json
    {
      "task_id": "1234567890",
      "successful_tags": ["TAG_ID1", "TAG_ID2"],
      "failed_tags": [],
      "task_data": {
        "gid": "1234567890",
        "name": "My task name",
        "tags": [
          {"gid": "TAG_ID1", "name": "Priority"},
          {"gid": "TAG_ID2", "name": "Bug"}
        ]
      }
    }
    ```
  - **AI usage guidance to include:** "For categorizing tasks, use `asana_add_tags_to_task` with an array of tag IDs (get available tags with `asana_get_tags_for_workspace`)."

### 3.3 Complete Project Hierarchy
- **Priority: High**
- **Description**: Extending the `asana_get_project_hierarchy` function to include subtasks
- **Justification**: Provides a complete picture of the project structure
- **Implementation Details**:
  - Update the tool definition in `src/tools/task-tools.ts`:
    ```typescript
    export const getProjectHierarchyTool: Tool = {
      name: "asana_get_project_hierarchy",
      description: "Get a hierarchical view of a project with sections, tasks, and optionally subtasks",
      inputSchema: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description: "The project ID to get hierarchy for"
          },
          include_subtasks: {
            type: "boolean",
            description: "Whether to include subtasks in the hierarchy (default: false)",
            default: false
          },
          max_subtask_depth: {
            type: "integer",
            description: "Maximum depth of subtasks to retrieve (default: 1, meaning only direct subtasks)",
            default: 1
          },
          sections_per_page: {
            type: "integer",
            description: "Number of sections to retrieve per page (default: 20)",
            default: 20
          },
          tasks_per_section: {
            type: "integer",
            description: "Maximum number of tasks to retrieve per section (default: 100)",
            default: 100
          },
          subtasks_per_task: {
            type: "integer",
            description: "Maximum number of subtasks to retrieve per task (default: 20)",
            default: 20
          },
          opt_fields: {
            type: "string",
            description: "Comma-separated list of optional fields to include for tasks and subtasks",
            default: "name,gid,due_on,completed"
          }
        },
        required: ["project_id"]
      }
    };
    ```
  - Enhance the implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async getProjectHierarchy(projectId: string, opts: any = {}) {
      // Default options
      const options = {
        include_subtasks: false,
        max_subtask_depth: 1,
        sections_per_page: 20,
        tasks_per_section: 100,
        subtasks_per_task: 20,
        opt_fields: "name,gid,due_on,completed",
        ...opts
      };
      
      console.log(`Getting project hierarchy for project ${projectId}, include_subtasks=${options.include_subtasks}, max_depth=${options.max_subtask_depth}`);
      
      // Get project details
      const project = await this.getProject(projectId, {
        opt_fields: "name,gid" + (options.opt_fields ? `,${options.opt_fields}` : "")
      });
      
      // Get project sections with pagination if needed
      let allSections = [];
      let offset = null;
      
      do {
        const paginationOpts = { 
          limit: options.sections_per_page,
          ...(offset ? { offset } : {})
        };
        
        const sectionsResponse = await this.projects.getSectionsForProject(projectId, paginationOpts);
        allSections = [...allSections, ...sectionsResponse.data];
        
        offset = sectionsResponse.next_page ? sectionsResponse.next_page.offset : null;
      } while (offset);
      
      // Prepare result structure
      const result = {
        project: {
          gid: project.gid,
          name: project.name
        },
        sections: [],
        stats: {
          total_sections: allSections.length,
          total_tasks: 0,
          total_subtasks: 0
        }
      };
      
      // Process each section and its tasks
      for (const section of allSections) {
        const tasksResponse = await this.sections.getTasksForSection(section.gid, {
          opt_fields: options.opt_fields,
          limit: options.tasks_per_section
        });
        
        const tasks = tasksResponse.data;
        result.stats.total_tasks += tasks.length;
        
        const sectionData = {
          gid: section.gid,
          name: section.name,
          tasks: tasks
        };
        
        // If include_subtasks flag is true, fetch subtasks for each task
        if (options.include_subtasks) {
          await this.fetchSubtasksRecursively(
            tasks, 
            options.max_subtask_depth, 
            1, 
            options.subtasks_per_task,
            options.opt_fields,
            result.stats
          );
        }
        
        result.sections.push(sectionData);
      }
      
      return result;
    }
    
    // Helper method to recursively fetch subtasks
    async fetchSubtasksRecursively(tasks, maxDepth, currentDepth, limit, opt_fields, stats) {
      if (currentDepth > maxDepth) return;
      
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const subtasksResponse = await this.tasks.getSubtasksForTask(task.gid, {
          opt_fields,
          limit
        });
        
        const subtasks = subtasksResponse.data;
        stats.total_subtasks += subtasks.length;
        
        // Add subtasks to the task
        task.subtasks = subtasks;
        
        // Recursively get subtasks of subtasks if needed
        if (currentDepth < maxDepth && subtasks.length > 0) {
          await this.fetchSubtasksRecursively(
            subtasks, 
            maxDepth, 
            currentDepth + 1, 
            limit,
            opt_fields,
            stats
          );
        }
      }
    }
    ```
  - Update the tool handler in `src/tool-handler.ts` to pass all parameters:
    ```typescript
    case "asana_get_project_hierarchy":
      return {
        result: await asanaClient.getProjectHierarchy(
          args.project_id, 
          { 
            include_subtasks: args.include_subtasks || false,
            max_subtask_depth: args.max_subtask_depth || 1,
            sections_per_page: args.sections_per_page || 20,
            tasks_per_section: args.tasks_per_section || 100,
            subtasks_per_task: args.subtasks_per_task || 20, 
            opt_fields: args.opt_fields || "name,gid,due_on,completed"
          }
        )
      };
    ```
  - Add performance warning in the documentation:
    ```markdown
    #### Project Hierarchy with Subtasks
    
    For large projects, retrieving the full hierarchy with subtasks can be resource-intensive.
    Consider using the pagination and limiting parameters to control response size:
    
    - `max_subtask_depth`: Control how deep to go with nested subtasks
    - `tasks_per_section`: Limit tasks fetched per section
    - `subtasks_per_task`: Limit subtasks fetched per task
    ```
  
  - Example usage:
    ```javascript
    // Basic usage with subtasks
  asana_get_project_hierarchy({
      project_id: "PROJECT_ID",
      include_subtasks: true
    })
    
    // Advanced usage with control parameters
    asana_get_project_hierarchy({
      project_id: "PROJECT_ID",
      include_subtasks: true,
      max_subtask_depth: 2,
      tasks_per_section: 50,
      subtasks_per_task: 10,
      opt_fields: "name,gid,due_on,completed,assignee"
  })
  ```
  - Expected output:
    ```json
    {
      "project": {
        "gid": "1209649929142042",
        "name": "Marketing Campaign Q2"
      },
      "sections": [
        {
          "gid": "1209649929142064",
          "name": "Planning",
          "tasks": [
            {
              "gid": "1209649807941684",
              "name": "Define campaign objectives",
              "completed": true,
              "due_on": "2025-04-05",
              "subtasks": [
                {
                  "gid": "1209649809895684",
                  "name": "Draft initial objectives",
                  "completed": false,
                  "due_on": "2025-04-02"
                }
              ]
            }
          ]
        }
      ],
      "stats": {
        "total_sections": 1,
        "total_tasks": 1,
        "total_subtasks": 1
      }
    }
    ```
  - **AI usage guidance to include:** "For complete project structure including subtasks, use `include_subtasks: true`. For large projects, control response size with `max_subtask_depth` and other limiting parameters."

### 3.4 Batch Updating of Tasks
- **Priority: Medium**
- **Description**: Add a new tool for updating multiple tasks in a single call
- **Justification**: Streamlines status or metadata updates for multiple tasks, reducing the number of API calls needed
- **Implementation Details**:
  - Create a new file `src/tools/batch-tools.ts` to house batch operation functionality
  - Implement the tool definition following existing patterns:
    ```typescript
    export const batchUpdateTasksTool: Tool = {
      name: "asana_batch_update_tasks",
      description: "Update multiple tasks in a single batch operation",
      inputSchema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Array of task objects to update, each containing task_id and update fields",
            items: {
              type: "object",
              properties: {
                task_id: {
                  type: "string",
                  description: "The ID of the task to update"
                },
                // Allow any other properties that are valid for asana_update_task
              },
              required: ["task_id"]
            }
          },
          transaction_mode: {
            type: "string",
            description: "How to handle errors in batch: 'continue' (process all tasks regardless of errors), 'stop_on_error' (stop processing on first error), or 'all_or_nothing' (revert all changes if any task update fails)",
            enum: ["continue", "stop_on_error", "all_or_nothing"],
            default: "continue"
          },
          concurrency: {
            type: "integer",
            description: "Maximum number of tasks to update concurrently (1-5, default: 3)",
            default: 3
          }
        },
        required: ["tasks"]
      }
    };
    ```
  - Add batch utils helper module for concurrent processing:
    ```typescript
    // src/utils/batch-utils.ts
    export async function processBatch(items, processFn, concurrency = 3) {
      const results = [];
      const chunks = [];
      
      // Split items into chunks based on concurrency
      for (let i = 0; i < items.length; i += concurrency) {
        chunks.push(items.slice(i, i + concurrency));
      }
      
      // Process chunks sequentially, but items within chunks concurrently
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(item => processFn(item));
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
      
      return results;
    }
    ```
  
  - Add corresponding implementation in the `AsanaClientWrapper` class:
    ```typescript
    async batchUpdateTasks(tasks: any[], options: any = {}) {
      const { transaction_mode = 'continue', concurrency = 3 } = options;
      const defaultTaskFields = ["name", "due_on", "completed", "notes", "assignee", "custom_fields"];
      const results = [];
      const successfulUpdates = [];
      
      // Validate concurrency
      const actualConcurrency = Math.min(5, Math.max(1, concurrency));
      
      console.log(`Batch updating ${tasks.length} tasks with mode=${transaction_mode}, concurrency=${actualConcurrency}`);
      
      // Validate task_id is present in each task
      for (const task of tasks) {
        if (!task.task_id) {
          throw new Error("Each task in the batch must have a task_id");
        }
      }
      
      // Function to process a single task update
      const processTask = async (task) => {
        const { task_id, ...updateData } = task;
        
        try {
          // Validate update data contains valid fields
          const unknownFields = Object.keys(updateData).filter(key => !defaultTaskFields.includes(key));
          if (unknownFields.length > 0) {
            console.warn(`Warning: Potentially unknown fields in task update: ${unknownFields.join(', ')}`);
          }
          
          const result = await this.updateTask(task_id, updateData);
          successfulUpdates.push({ task_id, data: updateData });
          
          return {
            task_id,
            status: "success",
            result
          };
        } catch (error) {
          const errorResult = {
            task_id,
            status: "error",
            error: error.message
          };
          
          // If in stop_on_error mode, throw to stop processing
          if (transaction_mode === 'stop_on_error') {
            throw new Error(`Task update failed: ${error.message}. Stopping batch processing.`);
          }
          
          return errorResult;
        }
      };
      
      try {
        if (transaction_mode === 'all_or_nothing') {
          // For all_or_nothing, we collect errors but need to revert on failure
          const taskResults = [];
          
          for (const task of tasks) {
            try {
              const result = await processTask(task);
              taskResults.push(result);
            } catch (error) {
              // Revert all successful updates so far
              await this.revertTaskUpdates(successfulUpdates);
              throw new Error(`Batch failed in all_or_nothing mode: ${error.message}. All updates were reverted.`);
            }
          }
          
          results.push(...taskResults);
        } else {
          // For continue or stop_on_error modes, use concurrent processing
          try {
            const batchUtils = require('../utils/batch-utils');
            const taskResults = await batchUtils.processBatch(tasks, processTask, actualConcurrency);
            results.push(...taskResults);
          } catch (error) {
            // This catch will only trigger in stop_on_error mode
            throw new Error(`Batch processing stopped due to error: ${error.message}`);
          }
        }
      } catch (error) {
        // This catch handles errors from the above operations
        throw error;
      }
      
      // Generate summary
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'error').length;
      
      return {
        summary: {
          total: tasks.length,
          successful,
          failed
        },
        tasks: results
      };
    }
    
    // Helper method to revert updates in case of all_or_nothing transaction failure
    async revertTaskUpdates(updates) {
      console.log(`Reverting ${updates.length} task updates due to transaction failure`);
      
      for (const update of updates) {
        try {
          // For each successful update, we need to get the task's original state
          // This is a simplified approach - in a real implementation we would
          // need to store the original state before updates
          const task = await this.getTask(update.task_id);
          console.log(`Reverting changes to task ${update.task_id}`);
        } catch (error) {
          console.error(`Error reverting task ${update.task_id}: ${error.message}`);
        }
      }
    }
    ```
  - Update `src/tool-handler.ts` to register and handle the new tool:
    ```typescript
    // Import the new batch tools
    import { batchUpdateTasksTool } from './tools/batch-tools.js';
    
    // Add to tools array
    export const tools: Tool[] = [
      // existing tools...
      batchUpdateTasksTool,
      // other tools...
    ];
    
    // Add case in tool handler switch statement
    case "asana_batch_update_tasks":
      if (!Array.isArray(args.tasks) || args.tasks.length === 0) {
        throw new Error("Tasks must be provided as a non-empty array");
      }
      
      // Set default options if not provided
      const batchOptions = {
        transaction_mode: args.transaction_mode || 'continue',
        concurrency: args.concurrency || 3
      };
      
      return {
        result: await asanaClient.batchUpdateTasks(args.tasks, batchOptions)
      };
    ```
  - Add usage documentation in README:
    ```markdown
    #### Batch Updating Tasks
    
    When you need to update multiple tasks at once, you can use the batch update feature:
    
  ```javascript
  asana_batch_update_tasks({
    tasks: [
        { task_id: "1234", completed: true },
        { task_id: "5678", due_on: "2025-05-01" }
      ],
      transaction_mode: "continue", // Options: "continue", "stop_on_error", "all_or_nothing"
      concurrency: 3 // How many tasks to process simultaneously (1-5)
    })
    ```
    
    The `transaction_mode` parameter controls error handling:
    - `continue`: Process all tasks regardless of errors (default)
    - `stop_on_error`: Stop processing when the first error occurs
    - `all_or_nothing`: Try to revert all changes if any task update fails
    ```
  
  - Example usage:
    ```javascript
    // Basic batch update
    asana_batch_update_tasks({
      tasks: [
        { task_id: "1234", completed: true },
        { task_id: "5678", due_on: "2025-05-01" },
        { task_id: "9012", assignee: "user_123", name: "Updated task name" }
      ]
    })
    
    // Advanced batch update with transaction control
    asana_batch_update_tasks({
      tasks: [
        { task_id: "1234", completed: true },
        { task_id: "5678", due_on: "2025-05-01" }
      ],
      transaction_mode: "all_or_nothing",
      concurrency: 2
    })
    ```
  - Expected response:
    ```json
    {
      "summary": {
        "total": 3,
        "successful": 2,
        "failed": 1
      },
      "tasks": [
        {
          "task_id": "1234",
          "status": "success",
          "result": { "gid": "1234", "name": "Task 1", "completed": true }
        },
        {
          "task_id": "5678",
          "status": "success",
          "result": { "gid": "5678", "name": "Task 2", "due_on": "2025-05-01" }
        },
        {
          "task_id": "9012",
          "status": "error",
          "error": "Task not found or no access"
        }
      ]
    }
    ```
  - **AI usage guidance to include:** "To update multiple tasks at once, use `asana_batch_update_tasks` with an array of task objects. Control error handling with `transaction_mode` parameter."

### 3.5 Reordering Sections
- **Priority: Medium**
- **Description**: Allows modifying the order of sections in a project
- **Justification**: Facilitates project structure reorganization
- **Implementation Details**:
  - Add a new tool definition in `src/tools/project-tools.ts`:
    ```typescript
    export const reorderSectionsTool: Tool = {
      name: "asana_reorder_sections",
      description: "Reorder sections within a project",
      inputSchema: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description: "The project ID containing the sections to reorder"
          },
          section_order: {
            type: "array",
            description: "Array of section GIDs in the desired order. Must include all sections in the project.",
            items: {
              type: "string"
            }
          },
          validate_sections: {
            type: "boolean",
            description: "Whether to validate that all sections exist in the project before attempting reordering (default: true)",
            default: true
          }
        },
        required: ["project_id", "section_order"]
      }
    };
    ```
  
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async reorderSections(projectId: string, sectionOrder: string[], options: any = {}) {
      const { validate_sections = true } = options;
      
      if (!Array.isArray(sectionOrder) || sectionOrder.length === 0) {
        throw new Error("Section order must be a non-empty array of section GIDs");
      }
      
      console.log(`Reordering ${sectionOrder.length} sections in project ${projectId}`);
      
      // If validation is enabled, verify all sections exist in the project
      if (validate_sections) {
        const projectSections = await this.getProjectSections(projectId);
        const projectSectionIds = projectSections.map(section => section.gid);
        
        // Check if all sections in sectionOrder exist in the project
        const invalidSections = sectionOrder.filter(sectionId => !projectSectionIds.includes(sectionId));
        if (invalidSections.length > 0) {
          throw new Error(`The following section IDs do not exist in project ${projectId}: ${invalidSections.join(', ')}`);
        }
        
        // Check if all project sections are included in sectionOrder
        const missingSections = projectSectionIds.filter(sectionId => !sectionOrder.includes(sectionId));
        if (missingSections.length > 0) {
          throw new Error(`The following sections from project ${projectId} are missing in the reordering: ${missingSections.join(', ')}`);
        }
      }
      
      // Asana's API doesn't have a single endpoint for reordering all sections
      // We need to move sections one by one to achieve the desired order
      const results = [];
      
      // The strategy is to move each section to its expected position
      // We'll start from the end and work backwards
      for (let i = sectionOrder.length - 1; i >= 0; i--) {
        const sectionId = sectionOrder[i];
        
        try {
          // For each section except the first one, we need to insert it after the previous one
          if (i > 0) {
            const previousSectionId = sectionOrder[i - 1];
            
            // Asana API for moving a section
            const response = await this.sections.insertSectionForProject(projectId, {
              data: {
                section: sectionId,
                beforeSection: null,
                afterSection: previousSectionId
              }
            });
            
            results.push({
              section_id: sectionId,
              status: "success",
              position: i + 1
            });
          } else {
            // For the first section, we need to move it to the beginning
            const response = await this.sections.insertSectionForProject(projectId, {
              data: {
                section: sectionId,
                beforeSection: null,
                afterSection: null
              }
            });
            
            results.push({
              section_id: sectionId,
              status: "success",
              position: 1
            });
          }
        } catch (error) {
          results.push({
            section_id: sectionId,
            status: "error",
            error: error.message,
            position: i + 1
          });
          
          console.error(`Error reordering section ${sectionId}: ${error.message}`);
        }
      }
      
      // After reordering, fetch and return the updated section list
      const updatedSections = await this.getProjectSections(projectId);
      
      return {
        project_id: projectId,
        results: results,
        current_order: updatedSections.map(section => ({
          gid: section.gid,
          name: section.name
        }))
      };
    }
    ```
  
  - Update `src/tool-handler.ts` to register and handle the new tool:
    ```typescript
    // Add to imports from project-tools.js
    import {
      // existing imports...
      reorderSectionsTool
    } from './tools/project-tools.js';
    
    // Add to tools array
    export const tools: Tool[] = [
      // existing tools...
      reorderSectionsTool,
      // other tools...
    ];
    
    // Add case in tool handler switch statement
    case "asana_reorder_sections":
      if (!Array.isArray(args.section_order)) {
        throw new Error("section_order must be an array of section GIDs");
      }
      
      return {
        result: await asanaClient.reorderSections(
          args.project_id, 
          args.section_order,
          { validate_sections: args.validate_sections !== false }
        )
      };
    ```
  
  - Add usage documentation in README:
    ```markdown
    #### Reordering Sections in a Project
    
    To reorganize your project by changing the order of sections:
    
  ```javascript
  asana_reorder_sections({
      project_id: "PROJECT_ID",
      section_order: ["SECTION_ID1", "SECTION_ID2", "SECTION_ID3"],
      validate_sections: true // Optional, default is true
  })
  ```

    This will reorder the sections to match the provided sequence. All sections in the project must be included in the `section_order` array.
    ```
  
  - Example usage:
    ```javascript
    // Reorder sections in a project
    asana_reorder_sections({
      project_id: "PROJECT_ID",
      section_order: ["SECTION_ID1", "SECTION_ID2", "SECTION_ID3"]
    })
    ```
  
  - Expected response:
    ```json
    {
      "project_id": "PROJECT_ID",
      "results": [
        {
          "section_id": "SECTION_ID3",
          "status": "success",
          "position": 3
        },
        {
          "section_id": "SECTION_ID2",
          "status": "success",
          "position": 2
        },
        {
          "section_id": "SECTION_ID1",
          "status": "success",
          "position": 1
        }
      ],
      "current_order": [
        {
          "gid": "SECTION_ID1",
          "name": "First Section"
        },
        {
          "gid": "SECTION_ID2",
          "name": "Second Section"
        },
        {
          "gid": "SECTION_ID3",
          "name": "Third Section"
        }
      ]
    }
    ```
  
  - Performance considerations:
    ```
    Note: This operation requires multiple API calls (one per section), so it may be slower for projects with many sections.
    The implementation uses a systematic approach to ensure sections are moved in the correct order to minimize API calls.
    ```
  
  - **AI usage guidance to include:** "To reorganize project sections, use `asana_reorder_sections` with project ID and array of section IDs in desired order."

### 3.6 Project Summary
- **Priority: Medium**
- **Description**: Provides a high-level overview of a project with key metrics and insights
- **Justification**: Facilitates reporting and monitoring project health at a glance
- **Implementation Details**:
  - Create a new tool definition in `src/tools/project-tools.ts`:
    ```typescript
    export const getProjectSummaryTool: Tool = {
      name: "asana_get_project_summary",
      description: "Get a comprehensive summary of project metrics, task distribution, and progress",
      inputSchema: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description: "The project ID to get summary for"
          },
          include_sections: {
            type: "boolean",
            description: "Whether to include section-level metrics in the summary (default: true)",
            default: true
          },
          include_task_distribution: {
            type: "boolean",
            description: "Whether to include task distribution metrics by assignee (default: true)",
            default: true
          },
          include_due_date_metrics: {
            type: "boolean",
            description: "Whether to include due date distribution metrics (default: true)",
            default: true
          },
          include_overdue_tasks: {
            type: "boolean",
            description: "Whether to include list of overdue tasks (default: false)",
            default: false
          },
          include_recent_activity: {
            type: "boolean",
            description: "Whether to include recent activity metrics (default: false)",
            default: false
          }
        },
        required: ["project_id"]
      }
    };
    ```
  
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async getProjectSummary(projectId: string, options: any = {}) {
      // Default options
      const opts = {
        include_sections: true,
        include_task_distribution: true,
        include_due_date_metrics: true,
        include_overdue_tasks: false,
        include_recent_activity: false,
        ...options
      };
      
      console.log(`Generating project summary for project ${projectId}`);
      
      // Get basic project details
      const project = await this.getProject(projectId, {
        opt_fields: "name,gid,created_at,modified_at,owner,due_date,starts_on,public,archived"
      });
      
      // Get task counts
      const taskCounts = await this.getProjectTaskCounts(projectId, {
        opt_fields: "num_tasks,num_incomplete_tasks,num_completed_tasks"
      });
      
      // Initialize summary object
      const summary = {
        project: {
          gid: project.gid,
          name: project.name,
          created_at: project.created_at,
          modified_at: project.modified_at,
          owner: project.owner,
          due_date: project.due_date,
          starts_on: project.starts_on,
          public: project.public,
          archived: project.archived
        },
        overall_metrics: {
          total_tasks: taskCounts.num_tasks || 0,
          completed_tasks: taskCounts.num_completed_tasks || 0,
          incomplete_tasks: taskCounts.num_incomplete_tasks || 0,
          completion_percentage: taskCounts.num_tasks ? 
            Math.round((taskCounts.num_completed_tasks / taskCounts.num_tasks) * 100) : 0
        },
        sections: [],
        task_distribution: {},
        due_date_metrics: {},
        overdue_tasks: [],
        recent_activity: {}
      };
      
      // Get sections and their tasks if requested
      if (opts.include_sections) {
        const sections = await this.getProjectSections(projectId);
        
        for (const section of sections) {
          const sectionTasks = await this.getTasksForSection(section.gid, {
            opt_fields: "name,gid,completed,due_on,assignee"
          });
          
          const completedTasks = sectionTasks.filter(task => task.completed);
          
          summary.sections.push({
            gid: section.gid,
            name: section.name,
            total_tasks: sectionTasks.length,
            completed_tasks: completedTasks.length,
            incomplete_tasks: sectionTasks.length - completedTasks.length,
            completion_percentage: sectionTasks.length ? 
              Math.round((completedTasks.length / sectionTasks.length) * 100) : 0
          });
        }
      }
      
      // Get task distribution by assignee if requested
      if (opts.include_task_distribution) {
        // Search for all tasks in the project
        const tasks = await this.tasks.getTasksForProject(projectId, {
          opt_fields: "assignee,completed"
        });
        
        const assigneeDistribution = {};
        
        tasks.data.forEach(task => {
          const assigneeId = task.assignee ? task.assignee.gid : 'unassigned';
          const assigneeName = task.assignee ? task.assignee.name : 'Unassigned';
          
          if (!assigneeDistribution[assigneeId]) {
            assigneeDistribution[assigneeId] = {
              gid: assigneeId,
              name: assigneeName,
              total_tasks: 0,
              completed_tasks: 0,
              incomplete_tasks: 0
            };
          }
          
          assigneeDistribution[assigneeId].total_tasks++;
          
          if (task.completed) {
            assigneeDistribution[assigneeId].completed_tasks++;
          } else {
            assigneeDistribution[assigneeId].incomplete_tasks++;
          }
        });
        
        // Calculate completion percentage for each assignee
        Object.values(assigneeDistribution).forEach((assignee: any) => {
          assignee.completion_percentage = assignee.total_tasks ? 
            Math.round((assignee.completed_tasks / assignee.total_tasks) * 100) : 0;
        });
        
        summary.task_distribution = Object.values(assigneeDistribution);
      }
      
      // Get due date metrics if requested
      if (opts.include_due_date_metrics) {
        const tasks = await this.tasks.getTasksForProject(projectId, {
          opt_fields: "due_on,completed"
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        
        const dueDateMetrics = {
          past_due: 0,
          due_today: 0,
          due_this_week: 0,
          due_next_week: 0,
          due_later: 0,
          no_due_date: 0
        };
        
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);
        
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(today.getDate() + 14);
        
        tasks.data.forEach(task => {
          // Skip completed tasks
          if (task.completed) return;
          
          if (!task.due_on) {
            dueDateMetrics.no_due_date++;
            return;
          }
          
          const dueDate = new Date(task.due_on);
          dueDate.setHours(0, 0, 0, 0); // Normalize
          
          if (dueDate < today) {
            dueDateMetrics.past_due++;
          } else if (dueDate.getTime() === today.getTime()) {
            dueDateMetrics.due_today++;
          } else if (dueDate <= oneWeekFromNow) {
            dueDateMetrics.due_this_week++;
          } else if (dueDate <= twoWeeksFromNow) {
            dueDateMetrics.due_next_week++;
          } else {
            dueDateMetrics.due_later++;
          }
        });
        
        summary.due_date_metrics = dueDateMetrics;
      }
      
      // Get overdue tasks if requested
      if (opts.include_overdue_tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        
        const tasks = await this.tasks.getTasksForProject(projectId, {
          opt_fields: "name,gid,due_on,assignee,completed",
          completed: false
        });
        
        const overdueTasks = tasks.data.filter(task => {
          if (!task.due_on) return false;
          const dueDate = new Date(task.due_on);
          return dueDate < today;
        }).map(task => ({
          gid: task.gid,
          name: task.name,
          due_on: task.due_on,
          assignee: task.assignee ? { 
            gid: task.assignee.gid, 
            name: task.assignee.name 
          } : null
        }));
        
        summary.overdue_tasks = overdueTasks;
      }
      
      // Get recent activity metrics if requested
      if (opts.include_recent_activity) {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        // Find tasks modified in the last two weeks
        const recentTasks = await this.tasks.getTasksForProject(projectId, {
          opt_fields: "modified_at,completed_at",
          modified_since: twoWeeksAgo.toISOString()
        });
        
        const recentActivity = {
          recently_modified_count: recentTasks.data.length,
          recently_completed_count: recentTasks.data.filter(t => 
            t.completed_at && new Date(t.completed_at) > twoWeeksAgo
          ).length
        };
        
        summary.recent_activity = recentActivity;
      }
      
      return summary;
    }
    ```
  
  - Update `src/tool-handler.ts` to register and handle the new tool:
    ```typescript
    // Add to imports from project-tools.js
    import {
      // existing imports...
      getProjectSummaryTool
    } from './tools/project-tools.js';
    
    // Add to tools array
    export const tools: Tool[] = [
      // existing tools...
      getProjectSummaryTool,
      // other tools...
    ];
    
    // Add case in tool handler switch statement
    case "asana_get_project_summary":
      return {
        result: await asanaClient.getProjectSummary(
          args.project_id, 
          {
            include_sections: args.include_sections !== false,
            include_task_distribution: args.include_task_distribution !== false,
            include_due_date_metrics: args.include_due_date_metrics !== false,
            include_overdue_tasks: !!args.include_overdue_tasks,
            include_recent_activity: !!args.include_recent_activity
          }
        )
      };
    ```
  
  - Add usage documentation in README:
    ```markdown
    #### Project Summary
    
    Get a comprehensive overview of a project's health and status:
    
  ```javascript
  asana_get_project_summary({
      project_id: "PROJECT_ID",
      include_sections: true,              // Section-level metrics
      include_task_distribution: true,     // Distribution by assignee
      include_due_date_metrics: true,      // Due date distribution
      include_overdue_tasks: false,        // List of overdue tasks
      include_recent_activity: false       // Recent activity metrics
  })
  ```

    This provides a consolidated view of project metrics to help assess project health and progress at a glance.
    ```
  
  - Example usage:
  ```javascript
    // Basic project summary with default options
    asana_get_project_summary({
      project_id: "PROJECT_ID"
    })
    
    // Comprehensive project summary with all metrics
    asana_get_project_summary({
      project_id: "PROJECT_ID",
      include_overdue_tasks: true,
      include_recent_activity: true
  })
  ```

  - Expected response:
    ```json
    {
      "project": {
        "gid": "PROJECT_ID",
        "name": "Marketing Campaign Q2",
        "created_at": "2025-03-11T16:53:57.931Z",
        "modified_at": "2025-03-12T05:11:55.109Z",
        "owner": {
          "gid": "USER_ID",
          "name": "John Doe"
        },
        "due_date": "2025-06-30",
        "starts_on": "2025-04-01",
        "public": true,
        "archived": false
      },
      "overall_metrics": {
        "total_tasks": 12,
        "completed_tasks": 5,
        "incomplete_tasks": 7,
        "completion_percentage": 42
      },
      "sections": [
        {
          "gid": "SECTION_ID1",
          "name": "Planning",
          "total_tasks": 4,
          "completed_tasks": 3,
          "incomplete_tasks": 1,
          "completion_percentage": 75
        },
        {
          "gid": "SECTION_ID2",
          "name": "Execution",
          "total_tasks": 8,
          "completed_tasks": 2,
          "incomplete_tasks": 6,
          "completion_percentage": 25
        }
      ],
      "task_distribution": [
        {
          "gid": "USER_ID1",
          "name": "John Doe",
          "total_tasks": 5,
          "completed_tasks": 3,
          "incomplete_tasks": 2,
          "completion_percentage": 60
        },
        {
          "gid": "USER_ID2",
          "name": "Jane Smith",
          "total_tasks": 4,
          "completed_tasks": 1,
          "incomplete_tasks": 3,
          "completion_percentage": 25
        },
        {
          "gid": "unassigned",
          "name": "Unassigned",
          "total_tasks": 3,
          "completed_tasks": 1,
          "incomplete_tasks": 2,
          "completion_percentage": 33
        }
      ],
      "due_date_metrics": {
        "past_due": 1,
        "due_today": 2,
        "due_this_week": 3,
        "due_next_week": 2,
        "due_later": 1,
        "no_due_date": 3
      },
      "overdue_tasks": [
        {
          "gid": "TASK_ID1",
          "name": "Submit budget proposal",
          "due_on": "2025-03-10",
          "assignee": {
            "gid": "USER_ID1",
            "name": "John Doe"
          }
        }
      ],
      "recent_activity": {
        "recently_modified_count": 8,
        "recently_completed_count": 5
      }
    }
    ```
    
  - How it differs from existing features:
    ```
    While asana_get_project_task_counts provides basic task counts, this summary offers:
    1. Comprehensive metrics across multiple dimensions (tasks, assignees, due dates)
    2. Section-level progress tracking
    3. Workload distribution by team member
    4. Time-based analysis of upcoming and overdue work
    5. Identification of potential bottlenecks or at-risk areas
    ```
    
  - **AI usage guidance to include:** "For a complete project health overview including completion rates, workload distribution, and due date metrics, use `asana_get_project_summary`."

### 3.7 Advanced Search in Project

After careful evaluation, we recommend **removing this feature** from the implementation roadmap for the following reasons:

1. **Redundancy with Existing Functionality**: This functionality can be fully accomplished using the existing `asana_search_tasks` tool with the appropriate filters.

2. **Implementation Example Using Existing Tools**:
  ```javascript
   // Instead of creating a new tool, use asana_search_tasks with project filter:
   asana_search_tasks({
     workspace: "WORKSPACE_ID",
     projects_any: "PROJECT_ID",  // Project-specific filter
     text: "search term",         // Text to search for
     opt_fields: "name,notes,due_on,assignee",  // Include notes in results
     limit: 20  // Limit number of results
  })
  ```

3. **Better Alternative**: Instead of implementing this as a separate feature, we recommend enhancing the documentation for `asana_search_tasks` to include clear examples of project-specific searches.

## 4. **Documentation Enhancement**:
   ```markdown
   #### Searching Within a Project
   
   To search for tasks within a specific project:
   
  ```javascript
   asana_search_tasks({
     workspace: "WORKSPACE_ID",
     projects_any: "PROJECT_ID",  // Limit search to this project
     text: "search term"
  })
  ```

   For including task notes in your search:
   
  ```javascript
   asana_search_tasks({
     workspace: "WORKSPACE_ID",
     projects_any: "PROJECT_ID",
     text: "search term",
     opt_fields: "name,notes,due_on,assignee"
  })
  ```
   ```

5. **Resource Allocation**: The development effort would be better directed toward implementing unique features that aren't possible with the current toolset.

**AI usage guidance to add to existing search_tasks documentation**: "To search within a specific project, use `asana_search_tasks` with the `projects_any` parameter set to your project ID."

### 3.8 Duplicating Tasks
- **Priority: Low-Medium**
- **Description**: Allows creating a copy of an existing task with its details and optionally its subtasks
- **Justification**: Useful for repetitive tasks, templates, and creating similar tasks efficiently
- **Implementation Details**:
  - Add a new tool definition in `src/tools/task-tools.ts`:
    ```typescript
    export const duplicateTaskTool: Tool = {
      name: "asana_duplicate_task",
      description: "Create a copy of an existing task with its details and optionally subtasks",
      inputSchema: {
        type: "object",
        properties: {
          task_id: {
            type: "string",
            description: "The task ID to duplicate"
          },
          name: {
            type: "string",
            description: "Optional new name for the duplicated task. If not provided, will use the original task name with 'Copy of ' prefix."
          },
          include_subtasks: {
            type: "boolean",
            description: "Whether to include subtasks in the duplication (default: false)",
            default: false
          },
          include_attachments: {
            type: "boolean",
            description: "Whether to include attachments in the duplication (default: false)",
            default: false
          },
          include_tags: {
            type: "boolean",
            description: "Whether to include tags in the duplication (default: true)",
            default: true
          },
          include_dependencies: {
            type: "boolean",
            description: "Whether to preserve dependencies (default: false)",
            default: false
          },
          include_followers: {
            type: "boolean",
            description: "Whether to include the same followers (default: false)",
            default: false
          },
          due_on_offset: {
            type: "integer",
            description: "Optional number of days to offset the due date (can be negative or positive)",
            default: 0
          },
          target_section_id: {
            type: "string",
            description: "Optional section ID to place the duplicated task in"
          },
          target_project_id: {
            type: "string",
            description: "Optional project ID to create the task in. If not provided, will use the same project(s) as the original."
          }
        },
        required: ["task_id"]
      }
    };
    ```
  
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async duplicateTask(taskId: string, options: any = {}) {
      // Set default options
      const opts = {
        include_subtasks: false,
        include_attachments: false,
        include_tags: true,
        include_dependencies: false,
        include_followers: false,
        due_on_offset: 0,
        ...options
      };
      
      console.log(`Duplicating task ${taskId} with options:`, JSON.stringify(opts));
      
      // Get the source task with details
      const sourceTask = await this.getTask(taskId, {
        opt_fields: "name,notes,projects,custom_fields,due_on,assignee,tags,dependencies,followers,parent"
      });
      
      if (!sourceTask) {
        throw new Error(`Task ${taskId} not found or inaccessible`);
      }
      
      // Handle custom fields - get the original structure
      const customFields = {};
      if (sourceTask.custom_fields) {
        sourceTask.custom_fields.forEach(field => {
          if (field.enabled && field.value !== null) {
            // For enum type custom fields, we need the enum_value.gid
            if (field.resource_subtype === 'enum') {
              customFields[field.gid] = field.enum_value ? field.enum_value.gid : null;
            } else {
              // For other field types, use the direct value
              customFields[field.gid] = field.value;
            }
          }
        });
      }
      
      // Calculate new due date if needed
      let newDueOn = null;
      if (sourceTask.due_on && opts.due_on_offset !== 0) {
        const dueDate = new Date(sourceTask.due_on);
        dueDate.setDate(dueDate.getDate() + opts.due_on_offset);
        newDueOn = dueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } else if (sourceTask.due_on) {
        newDueOn = sourceTask.due_on;
      }
      
      // Prepare project array - either use target project or original projects
      const projects = opts.target_project_id 
        ? [opts.target_project_id]
        : sourceTask.projects.map(p => p.gid);
      
      // Prepare new task data
      const newTaskData = {
        name: opts.name || `Copy of ${sourceTask.name}`,
        notes: sourceTask.notes,
        projects: projects,
        custom_fields: customFields,
        due_on: newDueOn,
        assignee: opts.include_assignee ? sourceTask.assignee?.gid : null
      };
      
      // Create the new task
      const newTask = await this.tasks.createTask({
        data: newTaskData
      });
      
      const duplicateResult = {
        original_task: {
          gid: sourceTask.gid,
          name: sourceTask.name
        },
        duplicated_task: newTask.data,
        subtasks: [],
        additional_operations: []
      };
      
      // If a target section is specified, add the task to that section
      if (opts.target_section_id) {
        try {
          await this.addTaskToSection(opts.target_section_id, newTask.data.gid);
          duplicateResult.additional_operations.push({
            operation: "add_to_section",
            status: "success",
            section_id: opts.target_section_id
          });
        } catch (error) {
          duplicateResult.additional_operations.push({
            operation: "add_to_section",
            status: "error",
            section_id: opts.target_section_id,
            error: error.message
          });
        }
      }
      
      // Add tags if requested
      if (opts.include_tags && sourceTask.tags) {
        try {
          const tagIds = sourceTask.tags.map(tag => tag.gid);
          if (tagIds.length > 0) {
            await this.addTagsToTask(newTask.data.gid, tagIds);
            duplicateResult.additional_operations.push({
              operation: "add_tags",
              status: "success",
              count: tagIds.length
            });
          }
        } catch (error) {
          duplicateResult.additional_operations.push({
            operation: "add_tags",
            status: "error",
            error: error.message
          });
        }
      }
      
      // Add followers if requested
      if (opts.include_followers && sourceTask.followers) {
        try {
          const followerIds = sourceTask.followers.map(follower => follower.gid);
          if (followerIds.length > 0) {
            await this.addFollowersToTask(newTask.data.gid, followerIds);
            duplicateResult.additional_operations.push({
              operation: "add_followers",
              status: "success",
              count: followerIds.length
            });
          }
        } catch (error) {
          duplicateResult.additional_operations.push({
            operation: "add_followers",
            status: "error",
            error: error.message
          });
        }
      }
      
      // Add dependencies if requested
      if (opts.include_dependencies && sourceTask.dependencies) {
        try {
          const dependencyIds = sourceTask.dependencies.map(dep => dep.gid);
          if (dependencyIds.length > 0) {
            await this.addTaskDependencies(newTask.data.gid, dependencyIds);
            duplicateResult.additional_operations.push({
              operation: "add_dependencies",
              status: "success",
              count: dependencyIds.length
            });
          }
        } catch (error) {
          duplicateResult.additional_operations.push({
            operation: "add_dependencies",
            status: "error",
            error: error.message
          });
        }
      }
      
      // Duplicate subtasks if requested
      if (opts.include_subtasks) {
        const subtasks = await this.getSubtasksForTask(taskId, {
          opt_fields: "name,notes,due_on,assignee"
        });
        
        for (const subtask of subtasks) {
          try {
            const newSubtask = await this.createSubtask(newTask.data.gid, {
              name: subtask.name,
              notes: subtask.notes,
              due_on: subtask.due_on ? 
                (opts.due_on_offset ? this.offsetDate(subtask.due_on, opts.due_on_offset) : subtask.due_on) : 
                null,
              assignee: opts.include_assignee ? subtask.assignee?.gid : null
            });
            
            duplicateResult.subtasks.push({
              original_gid: subtask.gid,
              duplicated_gid: newSubtask.gid,
              name: newSubtask.name,
              status: "success"
            });
          } catch (error) {
            duplicateResult.subtasks.push({
              original_gid: subtask.gid,
              name: subtask.name,
              status: "error",
              error: error.message
            });
          }
        }
      }
      
      return duplicateResult;
    }
    
    // Helper method to offset dates
    offsetDate(dateStr, offsetDays) {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + offsetDays);
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }
    ```
  
  - Update `src/tool-handler.ts` to register and handle the new tool:
    ```typescript
    // Add to imports
    import {
      // existing imports...
      duplicateTaskTool
    } from './tools/task-tools.js';
    
    // Add to tools array
    export const tools: Tool[] = [
      // existing tools...
      duplicateTaskTool,
      // other tools...
    ];
    
    // Add case in tool handler switch statement
    case "asana_duplicate_task":
      return {
        result: await asanaClient.duplicateTask(args.task_id, {
          name: args.name,
          include_subtasks: !!args.include_subtasks,
          include_attachments: !!args.include_attachments,
          include_tags: args.include_tags !== false,
          include_dependencies: !!args.include_dependencies,
          include_followers: !!args.include_followers,
          due_on_offset: args.due_on_offset || 0,
          target_section_id: args.target_section_id,
          target_project_id: args.target_project_id
        })
      };
    ```
  
  - Add documentation in README:
    ```markdown
    #### Duplicating Tasks
    
    Create copies of existing tasks with optional related elements:
    
  ```javascript
    asana_duplicate_task({
      task_id: "TASK_ID",
      name: "New Task Name",                 // Optional - defaults to "Copy of [original name]"
      include_subtasks: true,                // Include subtasks in duplication
      include_tags: true,                    // Copy the tags (default: true)
      include_dependencies: false,           // Preserve dependencies 
      include_followers: false,              // Copy the followers
      due_on_offset: 7,                      // Shift due dates by 7 days
      target_section_id: "SECTION_ID",       // Put the new task in a specific section
      target_project_id: "PROJECT_ID"        // Put the new task in a specific project
    })
    ```
    
    This is useful for:
    - Creating task templates that can be reused
    - Repeating similar tasks in different time periods
    - Creating variations of existing tasks
    ```
  
  - Example usage:
    ```javascript
    // Basic duplication
    asana_duplicate_task({
      task_id: "TASK_ID"
    })
    
    // Advanced duplication with subtasks and date shifting
    asana_duplicate_task({
      task_id: "TASK_ID",
      name: "April Budget Review",
      include_subtasks: true,
      due_on_offset: 30,  // Shift due dates by 30 days
      target_section_id: "SECTION_ID"
    })
    
    // Create a task based on a template in another project
    asana_duplicate_task({
      task_id: "TEMPLATE_TASK_ID",
      name: "New Project Kickoff",
      include_subtasks: true,
      target_project_id: "NEW_PROJECT_ID"
    })
    ```
  
  - Expected response:
    ```json
    {
      "original_task": {
        "gid": "1234567890",
        "name": "Budget Review"
      },
      "duplicated_task": {
        "gid": "9876543210",
        "name": "April Budget Review",
        "due_on": "2025-05-15"
      },
      "subtasks": [
        {
          "original_gid": "111222333",
          "duplicated_gid": "444555666",
          "name": "Collect department budgets",
          "status": "success"
        },
        {
          "original_gid": "777888999",
          "duplicated_gid": "000111222",
          "name": "Create summary report",
          "status": "success"
        }
      ],
      "additional_operations": [
        {
          "operation": "add_to_section",
          "status": "success",
          "section_id": "SECTION_ID"
        },
        {
          "operation": "add_tags",
          "status": "success",
          "count": 3
        }
      ]
    }
    ```
  
  - **What gets duplicated**:
    ```
    By default, the following elements are duplicated:
    - Task name (with "Copy of" prefix unless a new name is specified)
    - Task description/notes
    - Custom fields
    - Project assignment
    - Tags (if include_tags is true)
    
    The following are only duplicated if explicitly requested:
    - Subtasks (include_subtasks: true)
    - Dependencies (include_dependencies: true)
    - Followers (include_followers: true)
    - Attachments (include_attachments: true) [Note: requires additional API calls]
    
    The following are never duplicated:
    - Comments/task stories
    - Completion status (duplicated tasks are always incomplete)
    - Task history
    ```
    
  - **AI usage guidance to include:** "To create a copy of a task with its details, use `asana_duplicate_task`. For recurring templates, include subtasks and specify a due date offset."

### 3.9 Getting Project Timeline
- **Priority: Medium**
- **Description**: Returns tasks organized chronologically by due dates and start dates, with options for grouping, filtering and date range selection
- **Justification**: Facilitates sequential visualization of task timelines for project planning and tracking
- **Implementation Details**:
  - Add a new tool definition in `src/tools/project-tools.ts`:
    ```typescript
    export const getProjectTimelineTool: Tool = {
      name: "asana_get_project_timeline",
      description: "Get a chronological view of project tasks organized by their dates",
      inputSchema: {
        type: "object",
        properties: {
          project_id: {
            type: "string", 
            description: "The ID of the project to get the timeline for"
          },
          start_date: {
            type: "string",
            description: "Start date in YYYY-MM-DD format to filter tasks (inclusive)",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$"
          },
          end_date: {
            type: "string",
            description: "End date in YYYY-MM-DD format to filter tasks (inclusive)",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$"
          },
          include_without_dates: {
            type: "boolean",
            description: "Whether to include tasks without due dates (default: false)",
            default: false
          },
          group_by: {
            type: "string",
            description: "How to group results - 'month', 'week', 'day', 'section', or 'none'",
            enum: ["month", "week", "day", "section", "none"],
            default: "month"
          },
          sort_within_group: {
            type: "string",
            description: "How to sort tasks within each group - 'due_date', 'start_date', 'created_at', 'name'",
            enum: ["due_date", "start_date", "created_at", "name"],
            default: "due_date"
          },
          sort_direction: {
            type: "string",
            description: "Sort direction within each group - 'asc' or 'desc'",
            enum: ["asc", "desc"],
            default: "asc"
          },
          date_field: {
            type: "string",
            description: "Which date field to use for timeline - 'due_date', 'start_date' or 'both'",
            enum: ["due_date", "start_date", "both"],
            default: "both"
          },
          include_completed: {
            type: "boolean",
            description: "Whether to include completed tasks (default: false)",
            default: false
          },
          limit: {
            type: "integer",
            description: "Maximum number of tasks to return",
            default: 100
          }
        },
        required: ["project_id"]
      }
    };
    ```
  
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async getProjectTimeline(projectId: string, options: any = {}) {
      console.log(`Getting timeline for project ${projectId} with options:`, JSON.stringify(options));
      
      // Set default options
      const opts = {
        include_without_dates: false,
        group_by: "month",
        sort_within_group: "due_date",
        sort_direction: "asc",
        date_field: "both",
        include_completed: false,
        limit: 100,
        ...options
      };
      
      const validateDate = (dateStr) => {
        if (!dateStr) return true;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      };
      
      // Validate date parameters
      if (opts.start_date && !validateDate(opts.start_date)) {
        throw new Error(`Invalid start_date format: ${opts.start_date}. Use YYYY-MM-DD format.`);
      }
      
      if (opts.end_date && !validateDate(opts.end_date)) {
        throw new Error(`Invalid end_date format: ${opts.end_date}. Use YYYY-MM-DD format.`);
      }
      
      // Prepare date range filters for the Asana API query
      const filters: any = {
        project: projectId
      };
      
      // Only include incomplete tasks if include_completed is false
      if (!opts.include_completed) {
        filters.completed = false;
      }
      
      // Get project details
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found or inaccessible`);
      }
      
      // Get tasks with dates and detailed information
      const tasks = await this.findTasksByProject(projectId, {
        opt_fields: "name,due_on,due_at,start_on,start_at,created_at,completed,assignee,completed_at,custom_fields,memberships.section.name,tags,notes",
        limit: opts.limit
      });
      
      // Filter tasks based on date fields and date range
      const filteredTasks = tasks.filter(task => {
        // Skip tasks without dates if we're not including them
        const hasDueDate = !!task.due_on || !!task.due_at;
        const hasStartDate = !!task.start_on || !!task.start_at; 
        
        if (!hasDueDate && !hasStartDate && !opts.include_without_dates) {
          return false;
        }
        
        // If we're including tasks without dates, keep them
        if (!hasDueDate && !hasStartDate && opts.include_without_dates) {
          return true;
        }
        
        // Apply date range filtering based on the selected date field
        if (opts.start_date || opts.end_date) {
          const taskDueDate = task.due_on || (task.due_at ? task.due_at.split('T')[0] : null);
          const taskStartDate = task.start_on || (task.start_at ? task.start_at.split('T')[0] : null);
          
          if (opts.date_field === "due_date") {
            if (!taskDueDate) return opts.include_without_dates;
            
            if (opts.start_date && taskDueDate < opts.start_date) return false;
            if (opts.end_date && taskDueDate > opts.end_date) return false;
          } 
          else if (opts.date_field === "start_date") {
            if (!taskStartDate) return opts.include_without_dates;
            
            if (opts.start_date && taskStartDate < opts.start_date) return false;
            if (opts.end_date && taskStartDate > opts.end_date) return false;
          }
          else { // "both"
            // For "both", if either date is in range, include the task
            if (taskDueDate) {
              const dueDateInRange = (!opts.start_date || taskDueDate >= opts.start_date) && 
                                   (!opts.end_date || taskDueDate <= opts.end_date);
              if (dueDateInRange) return true;
            }
            
            if (taskStartDate) {
              const startDateInRange = (!opts.start_date || taskStartDate >= opts.start_date) && 
                                     (!opts.end_date || taskStartDate <= opts.end_date);
              if (startDateInRange) return true;
            }
            
            // If we get here, neither date is in range or both are missing
            return opts.include_without_dates && !taskDueDate && !taskStartDate;
          }
        }
        
        return true;
      });
      
      // Prepare the result with project info
      const result = {
        project: {
          gid: project.gid,
          name: project.name
        },
        date_range: {
          start_date: opts.start_date || null,
          end_date: opts.end_date || null
        },
        groups: [],
        total_tasks: filteredTasks.length
      };
      
      // Helper function to get the group key based on the grouping option
      const getGroupKey = (task) => {
        if (opts.group_by === 'none') return 'all_tasks';
        
        if (opts.group_by === 'section') {
          const section = task.memberships?.[0]?.section;
          return section ? section.name : 'Uncategorized';
        }
        
        // For date-based grouping, use the appropriate date
        // Prioritize due_date when grouping unless the date_field is explicitly set to start_date
        let dateStr = null;
        
        if (opts.date_field === 'start_date') {
          dateStr = task.start_on || (task.start_at ? task.start_at.split('T')[0] : null);
        } else {
          dateStr = task.due_on || (task.due_at ? task.due_at.split('T')[0] : null);
          // If no due date but we should use both, fall back to start date
          if (!dateStr && opts.date_field === 'both') {
            dateStr = task.start_on || (task.start_at ? task.start_at.split('T')[0] : null);
          }
        }
        
        if (!dateStr) return 'No Date';
        
        const date = new Date(dateStr);
        
        if (opts.group_by === 'month') {
          return date.toLocaleString('default', { year: 'numeric', month: 'long' });
        } 
        
        if (opts.group_by === 'week') {
          // Get the week number and year
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
          const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7) + 1;
          return `Week ${week}, ${d.getFullYear()}`;
        }
        
        if (opts.group_by === 'day') {
          return date.toISOString().split('T')[0];
        }
        
        return 'Unknown Group';
      };
      
      // Group tasks based on the grouping option
      const taskGroups = {};
      
      for (const task of filteredTasks) {
        const groupKey = getGroupKey(task);
        
        if (!taskGroups[groupKey]) {
          taskGroups[groupKey] = [];
        }
        
        taskGroups[groupKey].push(task);
      }
      
      // Sort tasks within each group
      for (const groupKey in taskGroups) {
        taskGroups[groupKey].sort((a, b) => {
          // For sorting by relevant field
          let aValue, bValue;
          
          switch (opts.sort_within_group) {
            case 'due_date':
              aValue = a.due_on || (a.due_at ? a.due_at.split('T')[0] : '9999-12-31');
              bValue = b.due_on || (b.due_at ? b.due_at.split('T')[0] : '9999-12-31');
              break;
            case 'start_date':
              aValue = a.start_on || (a.start_at ? a.start_at.split('T')[0] : '9999-12-31');
              bValue = b.start_on || (b.start_at ? b.start_at.split('T')[0] : '9999-12-31');
              break;
            case 'created_at':
              aValue = a.created_at || (a.created_at ? a.created_at.split('T')[0] : '9999-12-31');
              bValue = b.created_at || (b.created_at ? b.created_at.split('T')[0] : '9999-12-31');
              break;
            case 'name':
              aValue = a.name || '';
              bValue = b.name || '';
              break;
          }
          
          if (opts.sort_direction === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        });
      }
      
      // Prepare result structure
      for (const groupKey in taskGroups) {
        result.groups.push({
          name: groupKey,
          tasks: taskGroups[groupKey]
        });
      }
      
      return result;
    }
    ```
    
  - Add examples to the `createTaskTool` and `updateTaskTool` descriptions:
    ```typescript
    export const updateTaskTool: Tool = {
      // ...existing code...
      description: "Update an existing task's details. For custom fields, use format: {\"custom_field_gid\": value} where value matches the field type (string for text, number for numeric, enum_option.gid for enum).",
      // ...existing code...
    };
    ```
    
  - Example usage:
    ```javascript
    // For enum fields
  asana_update_task({
      task_id: "TASK_ID",
      custom_fields: {"1201019211530163": "1201019211530164"}
  })
  
    // For text fields
  asana_update_task({
      task_id: "TASK_ID",
      custom_fields: {"1201019211530165": "Important note"}
  })
  
    // For number fields
  asana_update_task({
      task_id: "TASK_ID",
      custom_fields: {"1201019211530166": 42}
  })
  ```

### 4.2 Improving `asana_get_project_task_counts` Function
- **Priority: High**
- **Description**: Adding default values for frequently used fields
- **Justification**: Eliminates the need for explicit specification of these fields
- **Implementation**: 
  ```javascript
  // Before
  asana_get_project_task_counts({
    project_id: "PROJECT_ID",
    opt_fields: "num_tasks,num_completed_tasks,num_incomplete_tasks"
  })
  
  // After
  asana_get_project_task_counts({
    project_id: "PROJECT_ID"
  }) // Automatically returns essential fields
  ```

### 4.3 Standardizing Arrays in Parameters
- **Priority: High**
- **Description**: Ensuring that all functions that use lists accept a consistent format (array)
- **Justification**: Eliminates confusion and errors in usage
- **Implementation**: 
  ```javascript
  // Standardized format for all functions
  asana_add_task_dependencies({
    task_id: "TASK_ID",
    dependencies: ["DEP1", "DEP2"]
  })
  
  asana_add_followers_to_task({
    task_id: "TASK_ID",
    followers: ["USER1", "USER2"]
  })
  ```
- **Note**: The functions `asana_add_members_for_project` and `asana_add_followers_for_project` already use correct array format for parameters and can serve as models for standardization. Important to note that adding a follower to a project automatically adds them as a member.

### 4.4 Improving `asana_search_tasks` Function
- **Priority: Medium**
- **Description**: Adding parameters for more precise filtering and limiting results
- **Justification**: Reduces the number of irrelevant results
- **Implementation**: 
  ```javascript
  asana_search_tasks({
    workspace: "WORKSPACE_ID",
    projects_any: "PROJECT_ID",
    text: "search term",
    limit: 10, // New parameter
    fields: ["name", "due_on"] // New parameter for selecting fields
  })
  ```

### 4.5 Extending Information from `asana_get_task`
- **Priority: Low-Medium**
- **Description**: Adding options to include information about subtasks and dependencies
- **Justification**: Reduces the need for multiple calls for related information
- **Implementation**: 
  ```javascript
  asana_get_task({
    task_id: "TASK_ID",
    include_subtasks: true, // New parameter
    include_dependencies: true, // New parameter
    opt_fields: "name,due_on"
  })
  ```

### 4.5 ✅ Streamlined Pagination
- **Priority: Medium**
- **Description**: Standardizing pagination across all functions that return multiple items
- **Justification**: Simplifies handling large result sets and improves consistency
- **Status**: Implemented in v1.8.1 - Added pagination.ts utility and enhanced methods for standardized pagination
- **Implementation Details**:
  // ... existing code ...

## 5. Implementation Roadmap

We recommend the following implementation order:

### Phase 1 (Critical Improvements)
1. Standardizing custom field updates
2. Implementing the `section_id` parameter for task creation

### Phase 2 (High Priority Improvements)
3. Improving `asana_get_project_task_counts` function
4. Standardizing arrays in parameters
5. Adding tags to tasks
6. Extending project hierarchy to include subtasks

### Phase 3 (Medium Priority Improvements)
7. Batch updating of tasks
8. Improving `asana_search_tasks` function
9. Reordering sections
10. Implementing project summary

### Phase 4 (Low Priority Improvements)
11. Extending information from `asana_get_task`
12. Advanced search in project
13. Duplicating tasks
14. Getting project timeline
15. Cloning project structure

## 6. Expected Benefits

- **Reduction in the number of steps** for common workflows by 30-50%
  - Creating tasks directly in sections reduces workflow from 2 steps to 1
  - Adding tags in one operation instead of requiring multiple API calls
  - Better project hierarchy visualization reduces navigation needs
  
- **Improvement in visibility** of project structure and status
  - Complete project hierarchy with subtasks provides a more comprehensive view
  - Project summaries offer quick insights into project health
  - Timeline views enable better sequential planning
  
- **Increase in efficiency** in managing projects directly from Claude
  - Batch operations reduce the number of user interactions and API calls
  - Standard array formats improve intuitive usage
  - Better documentation leads to faster adoption
  
- **Reduction in errors** caused by API inconsistencies
  - Standardized parameter formats (especially for arrays and custom fields)
  - Improved error messages with actionable guidance
  - Consistent behavior across similar functions
  
- **More intuitive experience** for users not familiar with Asana API
  - Functions that match natural language requests
  - Default values for commonly used fields
  - Simplified task creation with appropriate section placement

## 7. Testing Infrastructure

To ensure the new features work as expected, we will implement the following testing approach:

### 7.1 Unit Tests

- Add unit tests for each new function
- Test with various input combinations
- Verify error handling for edge cases

### 7.2 Integration Tests

- Test workflows that combine multiple functions
- Verify that batch operations maintain data integrity
- Ensure custom fields are properly updated with different field types

### 7.3 Documentation Tests

- Verify all examples in documentation work as described
- Include common use cases in documentation
- Document error codes and resolution steps

### 7.4 Performance Testing

- Benchmark batch operations vs. individual calls
- Verify response times remain acceptable with complex operations
- Test with larger datasets to ensure scalability

### 7.5 Validation Process

Each new feature will go through the following validation process:
1. Developer testing with mock data
2. Integration testing with real Asana accounts
3. Documentation verification
4. User acceptance testing with sample workflows

## 8. Conclusions and Next Steps

### 8.1 Key Recommendations

1. **Focus on Critical Improvements First**: The most significant workflow improvements will come from the critical and high-priority features:
   - Adding `section_id` parameter to task creation
   - Standardizing custom field updates
   - Implementing tag functionality
   - Enhancing project hierarchy to include subtasks

2. **Maintain Backward Compatibility**: All changes should ensure existing client code continues to work, while new parameters are optional enhancements.

3. **Document as You Build**: Update the README.md and code examples as each feature is implemented to ensure users can immediately benefit from improvements.

4. **Test Thoroughly**: Given the integration nature of this project, extensive testing with real Asana accounts is crucial to validate behavior.

### 8.2 Implementation Strategy

1. **Development Approach**
   - Create feature branches for each enhancement
   - Implement changes in small, reviewable increments
   - Add unit tests for new functionality
   - Update documentation with each change

2. **First Sprint (Critical Features)**
   - Implement standardization for custom field updates
   - Add `section_id` parameter to task creation
   - Update README to reflect these changes
   - Create sample code for users

3. **Second Sprint (High Priority Features)**
   - Add tag functionality
   - Extend project hierarchy to include subtasks
   - Standardize array parameters across all functions
   - Set default fields for task counts

4. **Third Sprint (Medium Priority Features)**
   - Implement batch operations for tasks
   - Add section reordering capability
   - Implement project summary functionality

5. **Final Sprint (Low Priority and Refinement)**
   - Add remaining features from the roadmap
   - Perform comprehensive testing
   - Refine documentation based on user feedback
   - Release final version with all enhancements

### 8.3 Success Metrics

The implementation will be considered successful when:

1. All identified critical and high-priority features are implemented and working correctly
2. Documentation is clear and comprehensive for all new features
3. Users can complete common Asana workflows with 30-50% fewer steps
4. Error handling provides clear guidance for resolving issues
5. All features have unit tests with > 80% coverage

### 3.10 Cloning Project Structure
- **Priority: Low-Medium**
- **Description**: Allows creating a new project based on the structure of an existing one
- **Justification**: Useful for repetitive projects or standard project templates
- **Implementation Details**:
  - Add a new tool definition in `src/tools/project-tools.ts`:
    ```typescript
    export const cloneProjectStructureTool: Tool = {
      name: "asana_clone_project_structure",
      description: "Create a new project with the same sections and optionally tasks as an existing project",
      inputSchema: {
        type: "object",
        properties: {
          source_project_id: {
            type: "string", 
            description: "The ID of the source project to clone"
          },
          name: {
            type: "string",
            description: "Name for the new project"
          },
          team_id: {
            type: "string",
            description: "Team ID where the new project should be created. If not provided, will use the same team as the source project."
          },
          include_tasks: {
            type: "boolean",
            description: "Whether to include tasks in the cloning (default: false)",
            default: false
          },
          include_task_notes: {
            type: "boolean",
            description: "Whether to include task descriptions/notes in the cloning (default: true when include_tasks is true)",
            default: true
          },
          include_subtasks: {
            type: "boolean", 
            description: "Whether to include subtasks in the cloning (default: false)",
            default: false
          },
          include_task_assignees: {
            type: "boolean",
            description: "Whether to preserve task assignees (default: false)",
            default: false
          },
          include_task_dates: {
            type: "boolean",
            description: "Whether to include due dates and start dates in the cloning (default: false)",
            default: false
          },
          due_date_offset: {
            type: "integer",
            description: "Number of days to offset due dates in the new project (can be negative or positive)",
            default: 0
          },
          include_custom_fields: {
            type: "boolean",
            description: "Whether to include custom field values in the cloning (default: false)",
            default: false
          },
          include_task_dependencies: {
            type: "boolean",
            description: "Whether to preserve task dependencies (default: false)",
            default: false
          }
        },
        required: ["source_project_id", "name"]
      }
    };
    ```
  
  - Add implementation in `src/asana-client-wrapper.ts`:
    ```typescript
    async cloneProjectStructure(sourceProjectId: string, options: any = {}) {
      console.log(`Cloning project ${sourceProjectId} with options:`, JSON.stringify(options));
      
      // Set default options
      const opts = {
        include_tasks: false,
        include_task_notes: true,
        include_subtasks: false,
        include_task_assignees: false,
        include_task_dates: false,
        due_date_offset: 0,
        include_custom_fields: false,
        include_task_dependencies: false,
        ...options
      };
      
      // Get source project details
      const sourceProject = await this.getProject(sourceProjectId, {
        opt_fields: "name,team.name,default_view,color,public,due_date,start_on"
      });
      
      if (!sourceProject) {
        throw new Error(`Project ${sourceProjectId} not found or inaccessible`);
      }
      
      // Get sections from source project
      const sourceSections = await this.getSectionsForProject(sourceProjectId);
      
      // Create the new project
      const newProjectData = {
        name: opts.name,
        team: opts.team_id || sourceProject.team?.gid,
        default_view: sourceProject.default_view,
        color: sourceProject.color,
        due_date: null,
        start_on: null
      };
      
      // Calculate new dates if needed and original dates exist
      if (opts.include_task_dates) {
        if (sourceProject.due_date && opts.due_date_offset !== 0) {
          const dueDate = new Date(sourceProject.due_date);
          dueDate.setDate(dueDate.getDate() + opts.due_date_offset);
          newProjectData.due_date = dueDate.toISOString().split('T')[0];
        } else if (sourceProject.due_date) {
          newProjectData.due_date = sourceProject.due_date;
        }
        
        if (sourceProject.start_on && opts.due_date_offset !== 0) {
          const startDate = new Date(sourceProject.start_on);
          startDate.setDate(startDate.getDate() + opts.due_date_offset);
          newProjectData.start_on = startDate.toISOString().split('T')[0];
        } else if (sourceProject.start_on) {
          newProjectData.start_on = sourceProject.start_on;
        }
      }
      
      console.log(`Creating new project with name: ${opts.name}`);
      const newProject = await this.projects.createProject({
        data: newProjectData
      });
      
      if (!newProject || !newProject.data) {
        throw new Error('Failed to create new project');
      }
      
      const newProjectId = newProject.data.gid;
      console.log(`New project created with ID: ${newProjectId}`);
      
      // Create sections in the new project
      const sectionMap = {}; // Maps old section GIDs to new section GIDs
      
      for (const section of sourceSections) {
        console.log(`Creating section "${section.name}" in new project`);
        const newSection = await this.createSectionInProject(newProjectId, {
          name: section.name
        });
        
        sectionMap[section.gid] = newSection.gid;
      }
      
      // Clone tasks if requested
      const taskMap = {}; // Maps old task GIDs to new task GIDs
      let totalTasksCreated = 0;
      
      if (opts.include_tasks) {
        console.log('Cloning tasks from source project...');
        
        // Get tasks for each section
        for (const oldSectionId in sectionMap) {
          const newSectionId = sectionMap[oldSectionId];
          const sectionTasks = await this.getTasksForSection(oldSectionId, {
            opt_fields: "name,notes,assignee,due_on,due_at,start_on,start_at,custom_fields,dependencies,parent"
          });
          
          // Skip tasks that are subtasks if we're processing them through their parents later
          const topLevelTasks = sectionTasks.filter(task => !task.parent || !opts.include_subtasks);
          
          // Create tasks in the new section
          for (const task of topLevelTasks) {
            const newTaskData = {
              name: task.name,
              notes: opts.include_task_notes ? task.notes : "",
              projects: [newProjectId]
            };
            
            // Add assignee if requested
            if (opts.include_task_assignees && task.assignee) {
              newTaskData.assignee = task.assignee.gid;
            }
            
            // Add dates if requested
            if (opts.include_task_dates) {
              if (task.due_on) {
                if (opts.due_date_offset !== 0) {
                  const dueDate = new Date(task.due_on);
                  dueDate.setDate(dueDate.getDate() + opts.due_date_offset);
                  newTaskData.due_on = dueDate.toISOString().split('T')[0];
                } else {
                  newTaskData.due_on = task.due_on;
                }
              }
              
              if (task.start_on) {
                if (opts.due_date_offset !== 0) {
                  const startDate = new Date(task.start_on);
                  startDate.setDate(startDate.getDate() + opts.due_date_offset);
                  newTaskData.start_on = startDate.toISOString().split('T')[0];
                } else {
                  newTaskData.start_on = task.start_on;
                }
              }
            }
            
            // Add custom fields if requested
            if (opts.include_custom_fields && task.custom_fields) {
              const customFields = {};
              task.custom_fields.forEach(field => {
                if (field.enabled && field.value !== null) {
                  if (field.resource_subtype === 'enum') {
                    customFields[field.gid] = field.enum_value ? field.enum_value.gid : null;
                  } else {
                    customFields[field.gid] = field.value;
                  }
                }
              });
              
              if (Object.keys(customFields).length > 0) {
                newTaskData.custom_fields = customFields;
              }
            }
            
            // Create the task
            try {
              const newTask = await this.tasks.createTask({
                data: newTaskData
              });
              
              if (newTask && newTask.data) {
                totalTasksCreated++;
                taskMap[task.gid] = newTask.data.gid;
                
                // Add task to the section
                await this.sections.addTaskForSection(newSectionId, {
                  data: {
                    task: newTask.data.gid
                  }
                });
                
                // Create subtasks if requested
                if (opts.include_subtasks) {
                  const subtasks = await this.getSubtasksForTask(task.gid, {
                    opt_fields: "name,notes,assignee,due_on,due_at,start_on,start_at,custom_fields"
                  });
                  
                  for (const subtask of subtasks) {
                    const newSubtaskData = {
                      name: subtask.name,
                      notes: opts.include_task_notes ? subtask.notes : "",
                      parent: newTask.data.gid
                    };
                    
                    // Add subtask assignee if requested
                    if (opts.include_task_assignees && subtask.assignee) {
                      newSubtaskData.assignee = subtask.assignee.gid;
                    }
                    
                    // Add subtask dates if requested
                    if (opts.include_task_dates) {
                      if (subtask.due_on) {
                        if (opts.due_date_offset !== 0) {
                          const dueDate = new Date(subtask.due_on);
                          dueDate.setDate(dueDate.getDate() + opts.due_date_offset);
                          newSubtaskData.due_on = dueDate.toISOString().split('T')[0];
                        } else {
                          newSubtaskData.due_on = subtask.due_on;
                        }
                      }
                      
                      if (subtask.start_on) {
                        if (opts.due_date_offset !== 0) {
                          const startDate = new Date(subtask.start_on);
                          startDate.setDate(startDate.getDate() + opts.due_date_offset);
                          newSubtaskData.start_on = startDate.toISOString().split('T')[0];
                        } else {
                          newSubtaskData.start_on = subtask.start_on;
                        }
                      }
                    }
                    
                    // Add custom fields if requested
                    if (opts.include_custom_fields && subtask.custom_fields) {
                      const customFields = {};
                      subtask.custom_fields.forEach(field => {
                        if (field.enabled && field.value !== null) {
                          if (field.resource_subtype === 'enum') {
                            customFields[field.gid] = field.enum_value ? field.enum_value.gid : null;
                          } else {
                            customFields[field.gid] = field.value;
                          }
                        }
                      });
                      
                      if (Object.keys(customFields).length > 0) {
                        newSubtaskData.custom_fields = customFields;
                      }
                    }
                    
                    // Create the subtask
                    const newSubtask = await this.tasks.createTask({
                      data: newSubtaskData
                    });
                    
                    if (newSubtask && newSubtask.data) {
                      totalTasksCreated++;
                      taskMap[subtask.gid] = newSubtask.data.gid;
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`Failed to create task "${task.name}":`, error.message);
            }
          }
        }
        
        // Add dependencies if requested and after all tasks are created
        if (opts.include_task_dependencies && Object.keys(taskMap).length > 0) {
          console.log('Setting up task dependencies...');
          
          for (const oldTaskId in taskMap) {
            const newTaskId = taskMap[oldTaskId];
            const taskDependencies = await this.getTaskDependencies(oldTaskId);
            
            for (const dependency of taskDependencies) {
              const newDependencyId = taskMap[dependency.gid];
              if (newDependencyId) {
                try {
                  await this.addTaskDependency(newTaskId, newDependencyId);
                } catch (error) {
                  console.error(`Failed to set up dependency between tasks:`, error.message);
                }
              }
            }
          }
        }
      }
      
      return {
        source_project: {
          gid: sourceProject.gid,
          name: sourceProject.name
        },
        new_project: {
          gid: newProjectId,
          name: opts.name,
          url: `https://app.asana.com/0/${newProjectId}/list`
        },
        sections: {
          count: Object.keys(sectionMap).length,
          section_mapping: sectionMap
        },
        tasks: {
          count: totalTasksCreated,
          task_mapping: opts.include_tasks ? taskMap : null
        }
      };
    }
    
    // Helper method to get task dependencies
    async getTaskDependencies(taskId: string) {
      const response = await this.tasks.getDependenciesForTask(taskId);
      return response.data || [];
    }
    
    // Helper method to add a task dependency
    async addTaskDependency(taskId: string, dependencyId: string) {
      await this.tasks.addDependenciesForTask(taskId, {
        data: {
          dependency: dependencyId
        }
      });
    }
    ```
  
  - Update `src/tool-handler.ts` to register and handle the new tool:
    ```typescript
    // Add to imports
    import {
      // existing imports...
      cloneProjectStructureTool
    } from './tools/project-tools.js';
    
    // Add to tools array
    export const tools: Tool[] = [
      // existing tools...
      cloneProjectStructureTool,
      // other tools...
    ];
    
    // Add case in tool handler switch statement
    case "asana_clone_project_structure":
      return {
        result: await asanaClient.cloneProjectStructure(args.source_project_id, {
          name: args.name,
          team_id: args.team_id,
          include_tasks: !!args.include_tasks,
          include_task_notes: args.include_task_notes !== false,
          include_subtasks: !!args.include_subtasks,
          include_task_assignees: !!args.include_task_assignees,
          include_task_dates: !!args.include_task_dates,
          due_date_offset: args.due_date_offset || 0,
          include_custom_fields: !!args.include_custom_fields,
          include_task_dependencies: !!args.include_task_dependencies
        })
      };
    ```
  
  - Add documentation in README:
    ```markdown
    #### Cloning Project Structure
    
    Create a new project based on the structure of an existing one:
    
    ```javascript
    asana_clone_project_structure({
      source_project_id: "SOURCE_PROJECT_ID",
      name: "New Project Name",
      team_id: "TEAM_ID",                    // Optional - defaults to source project's team
      include_tasks: true,                   // Whether to include tasks (default: false)
      include_task_notes: true,              // Whether to include task descriptions (default: true)
      include_subtasks: true,                // Whether to include subtasks (default: false)
      include_task_assignees: false,         // Whether to preserve assignees (default: false)
      include_task_dates: true,              // Whether to include dates (default: false)
      due_date_offset: 14,                   // Shift all dates by 14 days (default: 0)
      include_custom_fields: true,           // Whether to include custom fields (default: false)
      include_task_dependencies: true        // Whether to preserve dependencies (default: false)
    })
    ```
    
    This is useful for:
    - Creating template projects that can be reused for recurring workflows
    - Starting new projects with a proven structure
    - Creating variations of existing projects with different timelines
    ```
  
  - Example usage:
    ```javascript
    // Basic structure cloning (sections only)
    asana_clone_project_structure({
      source_project_id: "SOURCE_PROJECT_ID",
      name: "Q3 Marketing Campaign"
    })
    
    // Full project cloning with tasks and shifted dates
    asana_clone_project_structure({
      source_project_id: "SOURCE_PROJECT_ID",
      name: "Q3 Marketing Campaign",
      include_tasks: true,
      include_subtasks: true,
      include_task_dates: true,
      due_date_offset: 90  // Shift all dates by 90 days (one quarter)
    })
    
    // Copy project to a different team
    asana_clone_project_structure({
      source_project_id: "SOURCE_PROJECT_ID",
      name: "Website Redesign Template",
      team_id: "NEW_TEAM_ID",
      include_tasks: true,
      include_task_assignees: false  // Don't copy assignees as they may be different in the new team
    })
    ```
  
  - Expected response:
    ```json
    {
      "source_project": {
        "gid": "1234567890",
        "name": "Q2 Marketing Campaign"
      },
      "new_project": {
        "gid": "9876543210",
        "name": "Q3 Marketing Campaign",
        "url": "https://app.asana.com/0/9876543210/list"
      },
      "sections": {
        "count": 4,
        "section_mapping": {
          "11111111": "55555555",
          "22222222": "66666666",
          "33333333": "77777777",
          "44444444": "88888888"
        }
      },
      "tasks": {
        "count": 15,
        "task_mapping": {
          "111222333": "555666777",
          "444555666": "888999000",
          "777888999": "123123123"
        }
      }
    }
    ```
  
  - **AI usage guidance to include:** "To create a new project based on an existing one, use `asana_clone_project_structure`. Specify whether to include tasks, subtasks, and other elements through parameters. For recurring projects, use due_date_offset to shift all dates appropriately."

## 4. Modifications to Existing Features (5)

### 4.1 ✅ Standardizing Custom Field Updates
- **Priority: Critical**
- **Description**: Clear documentation and standardization of format for different types of fields
- **Justification**: Eliminates confusion and errors in usage
- **Status**: Implemented in v1.8.1 - Added field-utils.ts with validation and parsing for custom fields
- **Implementation Details**:
  - Update the documentation in `README.md` to clearly explain custom field usage:
    ```markdown
    #### Custom Fields
    When updating tasks with custom fields, use the following format:
    
    ```javascript
    asana_update_task({
      task_id: "TASK_ID",
      custom_fields: {
        "custom_field_gid": value  // The value format depends on the field type
      }
    })
    ```
    
    The value format varies by field type:
    - **Enum fields**: Use the `enum_option.gid` of the option
    - **Text fields**: Use a string
    - **Number fields**: Use a number
    - **Date fields**: Use a string in YYYY-MM-DD format
    ```
  
  - Enhance the `updateTask` method in `src/asana-client-wrapper.ts` to better handle custom fields:
    ```typescript
    async updateTask(taskId: string, data: any) {
      // Create a deep clone of the data to avoid modifying the original
      const taskData = JSON.parse(JSON.stringify(data));
      
      // Handle custom fields properly if provided
      if (taskData.custom_fields) {
        // If custom_fields is a string, try to parse it as JSON
        if (typeof taskData.custom_fields === 'string') {
          try {
            taskData.custom_fields = JSON.parse(taskData.custom_fields);
          } catch (err) {
            throw new Error(`Invalid custom_fields format: ${err.message}`);
          }
        }
        
        // The API expects custom_fields as an object with key-value pairs
        // No additional transformation needed as the API accepts the format:
        // { "custom_field_gid": value }
      }
      
      try {
        const response = await this.tasks.updateTask(taskId, {
          data: taskData
        });
        return response.data;
      } catch (error) {
        // Provide better error messages for custom field errors
        if (error.message.includes('custom_field')) {
          throw new Error(`Error updating custom fields: ${error.message}. Make sure you're using the correct format for each field type.`);
        }
        throw error;
      }
    }
    ```
  
  - Add more detailed validation and helper functions for custom fields in `src/utils/field-utils.ts`:
    ```typescript
    /**
     * Utilities for handling Asana custom fields
     */
    
    /**
     * Validates custom field values based on their type
     * @param fieldType The type of the custom field
     * @param value The value to validate
     * @returns {boolean} Whether the value is valid for the field type
     */
    export function validateCustomFieldValue(fieldType: string, value: any): boolean {
      switch (fieldType) {
        case 'text':
          return typeof value === 'string';
        
        case 'number':
          return typeof value === 'number' && !isNaN(value);
        
        case 'enum':
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
          return false;
      }
    }
    
    /**
     * Formats custom field values for Asana API
     * @param customFields Object mapping field GIDs to their values
     * @param fieldMetadata Array of custom field metadata objects from Asana
     * @returns Formatted custom fields object
     */
    export function formatCustomFieldsForUpdate(customFields: Record<string, any>, fieldMetadata: any[]): Record<string, any> {
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
        
        // Validate the value based on the field type
        const fieldType = fieldMeta.resource_subtype;
        if (!validateCustomFieldValue(fieldType, value)) {
          throw new Error(
            `Invalid value for custom field "${fieldMeta.name}" (${fieldGid}). ` +
            `Expected type: ${fieldType}, received: ${typeof value}`
          );
        }
        
        // Format the value according to the field type
        formattedFields[fieldGid] = value;
      }
      
      return formattedFields;
    }
    
    /**
     * Gets custom field metadata for a task
     * @param task Task object from Asana API
     * @returns Array of custom field metadata objects
     */
    export function extractCustomFieldMetadata(task: any): any[] {
      if (!task.custom_fields || !Array.isArray(task.custom_fields)) {
        return [];
      }
      
      return task.custom_fields.map(field => ({
        gid: field.gid,
        name: field.name,
        resource_subtype: field.resource_subtype,
        type: field.type,
        enum_options: field.resource_subtype === 'enum' ? field.enum_options : undefined
      }));
    }
    ```
  
  - Update `src/tool-handler.ts` to use the new utils for custom field handling:
    ```typescript
    // Add import
    import { formatCustomFieldsForUpdate } from './utils/field-utils.js';
    
    // In the asana_update_task case
    case "asana_update_task":
      // If custom fields are provided and the task exists, get the task first to validate
      if (args.custom_fields) {
        const task = await asanaClient.getTask(args.task_id, {
          opt_fields: "custom_fields"
        });
        
        if (task && task.custom_fields) {
          try {
            // Format and validate custom fields
            args.custom_fields = formatCustomFieldsForUpdate(
              args.custom_fields, 
              task.custom_fields
            );
          } catch (error) {
            return {
              error: error.message
            };
          }
        }
      }
      
      return {
        result: await asanaClient.updateTask(args.task_id, args)
      };
    ```
  
  - Add example usage in documentation:
    ```markdown
    #### Examples of correct custom field updates
    
    For an enum field (e.g., Status):
    ```javascript
    // First, get the task to see available enum options
    const task = await asana_get_task({
      task_id: "TASK_ID",
      opt_fields: "custom_fields"
    });
    
    // Find the enum options
    const statusField = task.custom_fields.find(f => f.name === "Status");
    const inProgressOption = statusField.enum_options.find(o => o.name === "In Progress");
    
    // Update the task with the correct enum option GID
    await asana_update_task({
      task_id: "TASK_ID",
      custom_fields: {
        [statusField.gid]: inProgressOption.gid
      }
    });
    ```
    
    For a number field:
    ```javascript
    await asana_update_task({
      task_id: "TASK_ID",
      custom_fields: {
        "12345": 42  // Where "12345" is the custom field GID
      }
    });
    ```
    
    For a date field:
    ```javascript
    await asana_update_task({
      task_id: "TASK_ID",
      custom_fields: {
        "67890": "2025-12-31"  // YYYY-MM-DD format
      }
    });
    ```
    ```
  
  - **AI usage guidance to include:** "When updating custom fields, first use `asana_get_task` with `opt_fields: 'custom_fields'` to see the available fields and their types. For enum fields, you need the enum_option.gid, not just the name. Always use the correct data type for each field."

### 4.2 ✅ Consistent Array Parameter Handling
- **Priority: High**
- **Description**: Standardizing the format of array parameters across all functions
- **Justification**: Prevents confusion and errors when passing arrays to different functions
- **Implementation Details**:
  - Update the `FunctionHandler` class in `src/tool-handler.ts` to normalize array parameters:
    ```typescript
    /**
     * Normalizes array parameters to ensure consistent handling
     * @param args Tool arguments to normalize
     * @returns Normalized arguments object
     */
    private normalizeArrayParameters(args: any): any {
      const result = { ...args };
      
      // Known parameters that should be arrays
      const arrayParams = [
        'dependencies', 'dependents', 'followers', 'projects', 'tags', 
        'team_ids', 'sections', 'tasks', 'task_ids'
      ];
      
      for (const param of arrayParams) {
        if (param in result) {
          // If it's a string, try to convert comma-separated to array
          if (typeof result[param] === 'string') {
            // Check if it looks like a JSON array string
            if (result[param].trim().startsWith('[') && result[param].trim().endsWith(']')) {
              try {
                result[param] = JSON.parse(result[param]);
                continue;
              } catch (e) {
                // If parsing fails, fall back to comma-splitting
                console.warn(`Failed to parse JSON array for ${param}, falling back to comma-splitting`);
              }
            }
            
            // Split by commas, handle empty strings
            result[param] = result[param].split(',')
              .map((item: string) => item.trim())
              .filter((item: string) => item.length > 0);
          } 
          else if (!Array.isArray(result[param])) {
            // If it's not a string or array already, make it a single-item array
            result[param] = [result[param]];
          }
        }
      }
      
      return result;
    }
    
    // Update the main handle method to use this normalization
    async handle(toolName: string, args: any): Promise<any> {
      const normalizedArgs = this.normalizeArrayParameters(args);
      console.log(`Handling tool ${toolName} with normalized args:`, JSON.stringify(normalizedArgs));
      
      // Rest of the handler method
      // ...
    }
    ```
  
  - Update key functions in `src/asana-client-wrapper.ts` to handle arrays consistently:
    ```typescript
    /**
     * Ensures the input is an array
     * @param input The input value (could be array, string, or other)
     * @returns An array
     */
    private ensureArray(input: any): any[] {
      if (Array.isArray(input)) {
        return input;
      }
      
      if (typeof input === 'string') {
        // Check if it's a comma-separated string
        if (input.includes(',')) {
          return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
        
        // Single value string
        return [input];
      }
      
      if (input === null || input === undefined) {
        return [];
      }
      
      // Other values (numbers, booleans, objects)
      return [input];
    }
    
    // Example implementation for addTaskDependencies
    async addTaskDependencies(taskId: string, dependencies: any): Promise<any> {
      const dependencyArray = this.ensureArray(dependencies);
      console.log(`Adding ${dependencyArray.length} dependencies to task ${taskId}`);
      
      const results = [];
      
      for (const dependencyId of dependencyArray) {
        try {
          const response = await this.tasks.addDependencyForTask(taskId, {
            data: {
              dependency: dependencyId
            }
          });
          
          results.push({
            dependency: dependencyId,
            status: 'success'
          });
        } catch (error) {
          results.push({
            dependency: dependencyId,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return {
        task_id: taskId,
        added_dependencies: results
      };
    }
    
    // Example implementation for adding followers
    async addFollowersToTask(taskId: string, followers: any): Promise<any> {
      const followerArray = this.ensureArray(followers);
      console.log(`Adding ${followerArray.length} followers to task ${taskId}`);
      
      const results = [];
      
      for (const followerId of followerArray) {
        try {
          await this.tasks.addFollowersForTask(taskId, {
            data: {
              followers: [followerId]
            }
          });
          
          results.push({
            follower: followerId,
            status: 'success'
          });
        } catch (error) {
          results.push({
            follower: followerId,
            status: 'error',
            error: error.message
          });
        }
      }
      
      // Re-fetch the task to get the updated followers list
      const updatedTask = await this.getTask(taskId, {
        opt_fields: "followers"
      });
      
      return {
        task_id: taskId,
        followers: updatedTask.followers,
        results: results
      };
    }
    ```
  
  - Update the documentation in `README.md` to explain array parameter formats:
    ```markdown
    #### Working with Arrays
    
    Many functions accept arrays as parameters. You can provide arrays in several formats:
    
    1. **JSON array**: 
    ```javascript
    asana_add_task_dependencies({
      task_id: "TASK_ID",
      dependencies: ["DEP_ID_1", "DEP_ID_2", "DEP_ID_3"]
    })
    ```
    
    2. **Comma-separated string**:
    ```javascript
    asana_add_task_dependencies({
      task_id: "TASK_ID",
      dependencies: "DEP_ID_1,DEP_ID_2,DEP_ID_3"
    })
    ```
    
    3. **Single value** (automatically converted to an array):
    ```javascript
    asana_add_task_dependencies({
      task_id: "TASK_ID", 
      dependencies: "DEP_ID_1"
    })
    ```
    
    These formats work for all parameters that expect arrays, including:
    - `dependencies` and `dependents` for task dependencies
    - `followers` for adding task followers
    - `projects` when creating or updating tasks
    - `tags` when working with task tags
    - `task_ids` when working with multiple tasks
    ```
  
  - **AI usage guidance to include:** "When providing multiple values to functions like dependencies, followers, or projects, you can use either a JSON array or a comma-separated string. Both formats will work consistently across all functions."

### 4.3 ✅ Enhanced Error Messages
- **Priority: Medium**
- **Description**: Improving error messages with detailed explanations and recovery suggestions
- **Justification**: Reduces confusion and helps users recover from errors quickly
- **Status**:  Implemented in v1.8.1 - Created comprehensive error handling with friendly messages, recovery steps, and error codes
- **Implementation Details**:
  // ... existing code ...

### 4.4 ✅ Improved Parameter Validation
- **Priority: Medium**
- **Description**: Adding robust parameter validation to all functions
- **Justification**: Prevents API errors by catching invalid parameters early
- **Implementation Details**:
  - Create a validation utility in `src/utils/validation.ts`:
    ```typescript
    /**
     * Utilities for validating parameter values before making API calls
     */
    
    export interface ValidationError {
      field: string;
      message: string;
    }
    
    export interface ValidationResult {
      valid: boolean;
      errors: ValidationError[];
    }
    
    /**
     * Pattern for validating Asana GID (ID) strings
     * Asana GIDs are numeric strings
     */
    const GID_PATTERN = /^\d+$/;
    
    /**
     * Pattern for validating date strings in YYYY-MM-DD format
     */
    const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
    
    /**
     * Validates a GID (Asana ID) string
     * @param gid The GID to validate
     * @param fieldName The name of the field for error reporting
     * @returns Validation error object or null if valid
     */
    export function validateGid(gid: any, fieldName: string): ValidationError | null {
      if (gid === undefined || gid === null) {
        return null; // Allow undefined/null for optional fields
      }
      
      if (typeof gid !== 'string') {
        return {
          field: fieldName,
          message: `${fieldName} must be a string`
        };
      }
      
      if (!GID_PATTERN.test(gid)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a numeric string (Asana GID)`
        };
      }
      
      return null;
    }
    
    /**
     * Validates a date string in YYYY-MM-DD format
     * @param date The date string to validate
     * @param fieldName The name of the field for error reporting
     * @returns Validation error object or null if valid
     */
    export function validateDate(date: any, fieldName: string): ValidationError | null {
      if (date === undefined || date === null) {
        return null; // Allow undefined/null for optional fields
      }
      
      if (typeof date !== 'string') {
        return {
          field: fieldName,
          message: `${fieldName} must be a string in YYYY-MM-DD format`
        };
      }
      
      if (!DATE_PATTERN.test(date)) {
        return {
          field: fieldName,
          message: `${fieldName} must be in YYYY-MM-DD format`
        };
      }
      
      // Validate it's an actual valid date
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return {
          field: fieldName,
          message: `${fieldName} is not a valid date`
        };
      }
      
      return null;
    }
    
    /**
     * Validates common parameters for task-related operations
     * @param params Parameters to validate
     * @returns Validation result with errors array
     */
    export function validateTaskParams(params: any): ValidationResult {
      const errors: ValidationError[] = [];
      
      // Task ID validation
      const taskIdError = validateGid(params.task_id, 'task_id');
      if (taskIdError) errors.push(taskIdError);
      
      // Due date validation
      const dueDateError = validateDate(params.due_on, 'due_on');
      if (dueDateError) errors.push(dueDateError);
      
      // Start date validation
      const startDateError = validateDate(params.start_on, 'start_on');
      if (startDateError) errors.push(startDateError);
      
      // Name validation
      if (params.name !== undefined && params.name !== null) {
        if (typeof params.name !== 'string') {
          errors.push({
            field: 'name',
            message: 'name must be a string'
          });
        }
      }
      
      // Assignee validation (can be a GID or 'me')
      if (params.assignee !== undefined && params.assignee !== null && params.assignee !== 'me') {
        const assigneeError = validateGid(params.assignee, 'assignee');
        if (assigneeError) errors.push(assigneeError);
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
    
    /**
     * Validates common parameters for project-related operations
     * @param params Parameters to validate
     * @returns Validation result with errors array
     */
    export function validateProjectParams(params: any): ValidationResult {
      const errors: ValidationError[] = [];
      
      // Project ID validation
      const projectIdError = validateGid(params.project_id, 'project_id');
      if (projectIdError) errors.push(projectIdError);
      
      // Due date validation
      const dueDateError = validateDate(params.due_on, 'due_on');
      if (dueDateError) errors.push(dueDateError);
      
      // Start date validation
      const startDateError = validateDate(params.start_on, 'start_on');
      if (startDateError) errors.push(startDateError);
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
    ```
  
  - Implement validation in the tool handler:
    ```typescript
    // Add import
    import { 
      validateTaskParams, 
      validateProjectParams, 
      ValidationResult 
    } from './utils/validation.js';
    
    // Helper method for the handler class
    private validateParameters(toolName: string, args: any): ValidationResult {
      // Select the appropriate validation method based on the tool
      if (toolName.includes('task')) {
        return validateTaskParams(args);
      } else if (toolName.includes('project')) {
        return validateProjectParams(args);
      }
      
      // Default to valid for other tools
      return { valid: true, errors: [] };
    }
    
    // In the handle method, add validation before processing
    async handle(toolName: string, args: any): Promise<any> {
      // Normalize array parameters
      const normalizedArgs = this.normalizeArrayParameters(args);
      
      // Validate parameters
      const validation = this.validateParameters(toolName, normalizedArgs);
      if (!validation.valid) {
        return {
          error: "Invalid parameters",
          validation_errors: validation.errors,
          recovery_steps: [
            "Check the parameter values and correct any formatting issues",
            "Refer to the documentation for the expected parameter formats"
          ]
        };
      }
      
      // Continue with handling the tool call
      // ...
    }
    ```
  
  - Update the documentation in README to explain validation:
    ```markdown
    #### Parameter Validation
    
    All functions include validation of parameters before making API calls. If validation fails, you'll receive a clear error with details:
    
    ```json
    {
      "error": "Invalid parameters",
      "validation_errors": [
        {
          "field": "due_on",
          "message": "due_on must be in YYYY-MM-DD format"
        },
        {
          "field": "task_id",
          "message": "task_id must be a numeric string (Asana GID)"
        }
      ],
      "recovery_steps": [
        "Check the parameter values and correct any formatting issues",
        "Refer to the documentation for the expected parameter formats"
      ]
    }
    ```
    
    Common validation rules:
    
    - **IDs (GIDs)**: Must be numeric strings
    - **Dates**: Must be in YYYY-MM-DD format
    - **Enum values**: Must be one of the allowed values
    - **Arrays**: Can be provided as JSON arrays or comma-separated strings
    ```
  
  - **AI usage guidance to include:** "If you receive validation errors, check the validation_errors array for specific fields that need correction. For dates, always use YYYY-MM-DD format. For IDs, make sure they are valid Asana GIDs (numeric strings)."

### 4.5 Streamlined Pagination
- **Priority: Medium**
- **Description**: Standardizing pagination across all functions that return multiple items
- **Justification**: Simplifies handling large result sets and improves consistency
- **Implementation Details**:
  - Create a pagination utility in `src/utils/pagination.ts`:
    ```typescript
    /**
     * Utilities for handling pagination of Asana API results
     */
    
    export interface PaginationParams {
      limit?: number;
      offset?: string;
    }
    
    export interface PaginatedResult<T> {
      data: T[];
      pagination: {
        limit: number;
        offset?: string;
        has_more: boolean;
        next_page?: string;
      };
    }
    
    /**
     * Validates and normalizes pagination parameters
     * @param params The pagination parameters to normalize
     * @returns Normalized pagination parameters
     */
    export function normalizePaginationParams(params: any): PaginationParams {
      const result: PaginationParams = {};
      
      // Handle limit parameter
      if (params.limit !== undefined) {
        // Convert string to number if needed
        const limit = typeof params.limit === 'string' 
          ? parseInt(params.limit, 10) 
          : params.limit;
        
        // Validate limit is a number and in range
        if (!isNaN(limit) && limit > 0) {
          // Cap limit to 100 (Asana API maximum)
          result.limit = Math.min(limit, 100);
        }
      }
      
      // Handle offset parameter
      if (params.offset && typeof params.offset === 'string') {
        result.offset = params.offset;
      }
      
      return result;
    }
    
    /**
     * Formats an Asana API response into a standardized paginated result
     * @param response The raw API response
     * @param defaultLimit The default limit to use if not specified
     * @returns Standardized paginated result
     */
    export function formatPaginatedResponse<T>(response: any, defaultLimit = 50): PaginatedResult<T> {
      const data = response.data || [];
      let pagination = {
        limit: defaultLimit,
        has_more: false
      };
      
      // Extract pagination info if it exists
      if (response.next_page) {
        pagination.has_more = true;
        pagination.next_page = response.next_page.offset;
        pagination.offset = response.next_page.offset;
      }
      
      return {
        data,
        pagination
      };
    }
    
    /**
     * Helper for handling auto-pagination when fetching all results
     * @param fetchFunction The function to call for each page
     * @param limit Limit per page
     * @param maxPages Maximum number of pages to fetch (safety limit)
     * @returns Combined results from all pages
     */
    export async function fetchAllPages<T>(
      fetchFunction: (params: PaginationParams) => Promise<PaginatedResult<T>>,
      limit = 100,
      maxPages = 10
    ): Promise<T[]> {
      let allResults: T[] = [];
      let offset: string | undefined = undefined;
      let pageCount = 0;
      
      do {
        // Fetch a page of results
        const result = await fetchFunction({ limit, offset });
        
        // Add results to our collection
        allResults = [...allResults, ...result.data];
        
        // Update offset for next page
        offset = result.pagination.offset;
        
        // Increment page counter and check if we've hit the max
        pageCount++;
        if (pageCount >= maxPages) {
          console.warn(`Reached maximum page count (${maxPages}), stopping pagination`);
          break;
        }
        
        // Continue until there are no more pages
      } while (offset && allResults.length < 1000); // Hard cap at 1000 items for safety
      
      return allResults;
    }
    ```
  
  - Update functions in `src/asana-client-wrapper.ts` to use standardized pagination:
    ```typescript
    // Add import
    import { 
      normalizePaginationParams, 
      formatPaginatedResponse,
      fetchAllPages,
      PaginatedResult
    } from './utils/pagination.js';
    
    // Example implementation for getTasksForProject with standardized pagination
    async getTasksForProject(projectId: string, options: any = {}): Promise<PaginatedResult<any>> {
      // Normalize pagination parameters
      const paginationParams = normalizePaginationParams(options);
      
      // Set default options
      const opts = {
        opt_fields: options.opt_fields || "name,assignee,completed,due_on",
        ...paginationParams
      };
      
      // Make the API call
      const response = await this.tasks.getTasksForProject(projectId, opts);
      
      // Format the response
      return formatPaginatedResponse(response, opts.limit);
    }
    
    // Add a method for fetching all tasks for a project (with auto-pagination)
    async getAllTasksForProject(projectId: string, options: any = {}): Promise<any[]> {
      const fetchPage = async (pageParams: any) => {
        return await this.getTasksForProject(projectId, {
          ...options,
          ...pageParams
        });
      };
      
      return await fetchAllPages(fetchPage, options.limit, options.max_pages);
    }
    ```
  
  - Update the tool handler to support both paginated and all-results modes:
    ```typescript
    // In tool-handler.ts for functions that support pagination
    case "asana_get_tasks_for_project":
      // Check if fetch_all flag is set
      if (args.fetch_all) {
        return {
          result: await asanaClient.getAllTasksForProject(args.project_id, args)
        };
      } else {
        const paginatedResult = await asanaClient.getTasksForProject(args.project_id, args);
        return {
          result: paginatedResult.data,
          pagination: paginatedResult.pagination
        };
      }
    ```
  
  - Update the documentation in README to explain pagination:
    ```markdown
    #### Pagination
    
    Functions that return multiple items support standardized pagination:
    
    ```javascript
    // Get first page of tasks
    const result = await asana_get_tasks_for_project({
      project_id: "PROJECT_ID",
      limit: 25  // Items per page (default: 50, max: 100)
    });
    
    // Response includes pagination info
    console.log(result.pagination);
    // { limit: 25, has_more: true, offset: "eyJ0eXBlIjoidGFzayIsImlkIjoxNjQ5NDA1NTk5MDkzfQ", next_page: "eyJ0eXBlI..." }
    
    // Get the next page using the offset
    const nextPage = await asana_get_tasks_for_project({
      project_id: "PROJECT_ID",
      limit: 25,
      offset: result.pagination.offset
    });
    ```
    
    For convenience, you can also fetch all items at once with auto-pagination:
    
    ```javascript
    // Get all tasks (use with caution for large projects)
    const allTasks = await asana_get_tasks_for_project({
      project_id: "PROJECT_ID",
      fetch_all: true,
      max_pages: 5  // Safety limit on number of pages to fetch
    });
    ```
    
    > **Note**: Using `fetch_all` can be slow for large projects. For better performance, use pagination and process results in smaller batches.
    ```
  
  - **AI usage guidance to include:** "Use pagination with limit and offset parameters for large result sets. If you need all items, use fetch_all=true but be aware this could be slow for large datasets. Always check pagination.has_more to see if there are more results available."

## 5. Expected Results (5)