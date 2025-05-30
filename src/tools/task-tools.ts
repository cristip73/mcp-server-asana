import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const searchTasksTool: Tool = {
  name: "asana_search_tasks",
  description: "Search tasks in a workspace with advanced filtering options",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace to search in (optional if DEFAULT_WORKSPACE_ID is set)"
      },
      text: {
        type: "string",
        description: "Text to search for in task names and descriptions"
      },
      resource_subtype: {
        type: "string",
        description: "Filter by task subtype (e.g. milestone)"
      },
      "portfolios_any": {
        type: "string",
        description: "Comma-separated list of portfolio IDs"
      },
      "assignee_any": {
        type: "string",
        description: "Comma-separated list of user IDs"
      },
      "assignee_not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "projects_any": {
        type: "string",
        description: "Comma-separated list of project IDs"
      },
      "projects_not": {
        type: "string",
        description: "Comma-separated list of project IDs to exclude"
      },
      "projects_all": {
        type: "string",
        description: "Comma-separated list of project IDs that must all match"
      },
      "sections_any": {
        type: "string",
        description: "Comma-separated list of section IDs"
      },
      "sections_not": {
        type: "string",
        description: "Comma-separated list of section IDs to exclude"
      },
      "sections_all": {
        type: "string",
        description: "Comma-separated list of section IDs that must all match"
      },
      "tags_any": {
        type: "string",
        description: "Comma-separated list of tag IDs"
      },
      "tags_not": {
        type: "string",
        description: "Comma-separated list of tag IDs to exclude"
      },
      "tags_all": {
        type: "string",
        description: "Comma-separated list of tag IDs that must all match"
      },
      "teams_any": {
        type: "string",
        description: "Comma-separated list of team IDs"
      },
      "followers_not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "created_by_any": {
        type: "string",
        description: "Comma-separated list of user IDs"
      },
      "created_by_not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "assigned_by_any": {
        type: "string",
        description: "Comma-separated list of user IDs"
      },
      "assigned_by_not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "liked_by_not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "commented_on_by_not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "due_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "due_on_before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "due_on_after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "due_at_before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "due_at_after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "start_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "start_on_before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "start_on_after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "created_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "created_on_before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "created_on_after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "created_at_before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "created_at_after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "completed_on": {
        type: "string",
        description: "ISO 8601 date string or null"},
      "completed_on_before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "completed_on_after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "completed_at_before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "completed_at_after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "modified_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "modified_on_before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "modified_on_after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "modified_at_before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "modified_at_after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      completed: {
        type: "boolean",
        description: "Filter for completed tasks"
      },
      is_subtask: {
        type: "boolean",
        description: "Filter for subtasks"
      },
      has_attachment: {
        type: "boolean",
        description: "Filter for tasks with attachments"
      },
      is_blocked: {
        type: "boolean",
        description: "Filter for tasks with incomplete dependencies"
      },
      is_blocking: {
        type: "boolean",
        description: "Filter for incomplete tasks with dependents"
      },
      sort_by: {
        type: "string",
        description: "Sort by: due_date, created_at, completed_at, likes, modified_at",
        default: "modified_at"
      },
      sort_ascending: {
        type: "boolean",
        description: "Sort in ascending order",
        default: false
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      },
      custom_fields: {
        type: "object",
        description: `Object containing custom field filters. Keys should be in the format "{gid}.{operation}" where operation can be:
- {gid}.is_set: Boolean - For all custom field types, check if value is set
- {gid}.value: String|Number|String(enum_option_gid) - Direct value match for Text, Number or Enum fields
- {gid}.starts_with: String - For Text fields only, check if value starts with string
- {gid}.ends_with: String - For Text fields only, check if value ends with string
- {gid}.contains: String - For Text fields only, check if value contains string
- {gid}.less_than: Number - For Number fields only, check if value is less than number
- {gid}.greater_than: Number - For Number fields only, check if value is greater than number

Example: { "12345.value": "high", "67890.contains": "urgent" }`
      }
    },
    required: []
  }
};

export const getTaskTool: Tool = {
  name: "asana_get_task",
  description: "Get detailed information about a specific task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_id"]
  }
};

export const createTaskTool: Tool = {
  name: "asana_create_task",
  description: "Create a new task in a project",
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
      notes: {
        type: "string",
        description: "Description of the task"
      },
      html_notes: {
        type: "string",
        description: "HTML-like formatted description of the task. Does not support ALL HTML tags. Only a subset. The only allowed TAG in the HTML are: <body> <h1> <h2> <ol> <ul> <li> <strong> <em> <u> <s> <code> <pre> <blockquote> <a data-asana-type=\"\" data-asana-gid=\"\"> <hr> <img> <table> <tr> <td>. No other tags are allowed. Use the \\n to create a newline. Do not use \\n after <body>. Example: <body><h1>Motivation</h1>\nA customer called in to complain\n<h1>Goal</h1>\nFix the problem</body>"
      },
      due_on: {
        type: "string",
        description: "Due date in YYYY-MM-DD format"
      },
      assignee: {
        type: "string",
        description: "Assignee (can be 'me' or a user ID)"
      },
      followers: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of user IDs to add as followers"
      },
      parent: {
        type: "string",
        description: "The parent task ID to set this task under"
      },
      projects: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of project IDs to add this task to"
      },
      resource_subtype: {
        type: "string",
        description: "The type of the task. Can be one of 'default_task' or 'milestone'"
      },
      custom_fields: {
        type: "object",
        description: "Object mapping custom field GID strings to their values. For enum fields use the enum option GID as the value."
      }
    },
    required: ["project_id", "name"]
  }
};

export const updateTaskTool: Tool = {
  name: "asana_update_task",
  description: "Update an existing task's details",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to update"
      },
      name: {
        type: "string",
        description: "New name for the task"
      },
      notes: {
        type: "string",
        description: "New description for the task"
      },
      due_on: {
        type: "string",
        description: "New due date in YYYY-MM-DD format"
      },
      assignee: {
        type: "string",
        description: "New assignee (can be 'me' or a user ID)"
      },
      completed: {
        type: "boolean",
        description: "Mark task as completed or not"
      },
      resource_subtype: {
        type: "string",
        description: "The type of the task. Can be one of 'default_task' or 'milestone'"
      },
      custom_fields: {
        type: "object",
        description: "Object mapping custom field GID strings to their values. For enum fields use the enum option GID as the value."
      }
    },
    required: ["task_id"]
  }
};

export const createSubtaskTool: Tool = {
  name: "asana_create_subtask",
  description: "Create a new subtask for an existing task",
  inputSchema: {
    type: "object",
    properties: {
      parent_task_id: {
        type: "string",
        description: "The parent task ID to create the subtask under"
      },
      name: {
        type: "string",
        description: "Name of the subtask"
      },
      notes: {
        type: "string",
        description: "Description of the subtask"
      },
      due_on: {
        type: "string",
        description: "Due date in YYYY-MM-DD format"
      },
      assignee: {
        type: "string",
        description: "Assignee (can be 'me' or a user ID)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["parent_task_id", "name"]
  }
};

export const getMultipleTasksByGidTool: Tool = {
  name: "asana_get_multiple_tasks_by_gid",
  description: "Get detailed information about multiple tasks by their GIDs (maximum 25 tasks)",
  inputSchema: {
    type: "object",
    properties: {
      task_ids: {
        oneOf: [
          {
            type: "array",
            items: {
              type: "string"
            },
            maxItems: 25
          },
          {
            type: "string",
            description: "Comma-separated list of task GIDs (max 25)"
          }
        ],
        description: "Array or comma-separated string of task GIDs to retrieve (max 25)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_ids"]
  }
};

export const addTaskToSectionTool: Tool = {
  name: "asana_add_task_to_section",
  description: "Add a task to a specific section in a project",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The section ID to add the task to"
      },
      task_id: {
        type: "string",
        description: "The task ID to add to the section"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["section_id", "task_id"]
  }
};

export const getTasksForSectionTool: Tool = {
  name: "asana_get_tasks_for_section",
  description: "Get all tasks from a specific section in a project",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The section ID to get tasks from"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g., 'name,gid,completed,assignee,notes,subtasks')"
      },
      completed_since: {
        type: "string",
        description: "Only return tasks that are either incomplete or that have been completed since this time (ISO 8601 format)"
      },
      limit: {
        type: "number",
        description: "Number of results to return per page (1-100)"
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response. Required for paginated requests"
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically gets all pages of results (limited by max_pages)",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum pages to fetch when auto_paginate is true",
        default: 10
      }
    },
    required: ["section_id"]
  }
};

export const getProjectHierarchyTool: Tool = {
  name: "asana_get_project_hierarchy",
  description: "Get the complete hierarchical structure of an Asana project, including its sections, tasks, and subtasks. Supports both manual and automatic pagination.\n\n" +
  "PAGINATION GUIDE:\n" +
  "1. Get all data at once: Use auto_paginate=true\n" +
  "2. Manual pagination: First request with limit=N, then use the returned 'next_offset' tokens in subsequent requests\n" +
  "3. Tips for large projects: Specify only needed fields, set include_subtasks=false if subtasks aren't needed\n\n" +
  "EXAMPLES:\n" +
  "- For all data: {project_id:\"123\", auto_paginate:true}\n" +
  "- For first page: {project_id:\"123\", limit:10}\n" +
  "- For next page: {project_id:\"123\", limit:10, offset:\"eyJ0a...\"}\n" +
  "- For deep subtasks: {project_id:\"123\", include_subtasks:true, max_subtask_depth:3}\n" +
  "Note: offset must be a token from previous response (section.pagination_info.next_offset)",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "ID of the project to get hierarchy for"
      },
      include_completed_tasks: {
        type: "boolean",
        description: "Include completed tasks (default: false)"
      },
      include_subtasks: {
        type: "boolean",
        description: "Include subtasks for each task (default: true)"
      },
      include_completed_subtasks: {
        type: "boolean",
        description: "Include completed subtasks (default: follows include_completed_tasks)"
      },
      max_subtask_depth: {
        type: "number",
        description: "Maximum depth of subtasks to retrieve (default: 1, meaning only direct subtasks)",
        minimum: 1,
        maximum: 10,
        default: 1
      },
      opt_fields_tasks: {
        type: "string",
        description: "Optional fields for tasks (e.g. 'name,notes,assignee,due_on,completed')"
      },
      opt_fields_subtasks: {
        type: "string",
        description: "Optional fields for subtasks (if not specified, uses same as tasks)"
      },
      opt_fields_sections: {
        type: "string",
        description: "Optional fields for sections (e.g. 'name,created_at')"
      },
      opt_fields_project: {
        type: "string",
        description: "Optional fields for project (e.g. 'name,created_at,owner')"
      },
      limit: {
        type: "number",
        description: "Max results per page (1-100). For pagination, set this and don't use auto_paginate",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response. MUST be valid token from section.pagination_info.next_offset"
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically gets all pages and combines results (limited by max_pages)",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum pages to fetch when auto_paginate is true (protects against infinite loops)",
        default: 10
      }
    },
    required: ["project_id"]
  }
};

export const getSubtasksForTaskTool: Tool = {
  name: "asana_get_subtasks_for_task",
  description: "Get the list of subtasks for a specific task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "ID of the task to get subtasks for"
      },
      opt_fields: {
        type: "string",
        description: "Optional fields for subtasks (e.g. 'name,notes,assignee,due_on,completed')"
      },
      limit: {
        type: "number",
        description: "Maximum number of results per page (1-100)"
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
    required: ["task_id"]
  }
};

export const getTasksForProjectTool: Tool = {
  name: "asana_get_tasks_for_project",
  description: "Get all tasks from a specific project with pagination support",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get tasks for"
      },
      completed: {
        type: "boolean",
        description: "Filter for completed or incomplete tasks"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (1-100)",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response"
      },
      auto_paginate: {
        type: "boolean",
        description: "Automatically fetch all pages of results (up to max_pages)",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when auto_paginate is true",
        default: 10
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

