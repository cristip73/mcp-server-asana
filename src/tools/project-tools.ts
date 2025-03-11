import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const searchProjectsTool: Tool = {
  name: "asana_search_projects",
  description: "Search for projects in Asana using name pattern matching",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace to search in"
      },
      name_pattern: {
        type: "string",
        description: "Regular expression pattern to match project names"
      },
      archived: {
        type: "boolean",
        description: "Only return archived projects",
        default: false
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["workspace", "name_pattern"]
  }
};

export const getProjectTool: Tool = {
  name: "asana_get_project",
  description: "Get detailed information about a specific project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

export const getProjectTaskCountsTool: Tool = {
  name: "asana_get_project_task_counts",
  description: "Get the number of tasks in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get task counts for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

export const getProjectSectionsTool: Tool = {
  name: "asana_get_project_sections",
  description: "Get sections in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get sections for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

export const createSectionForProjectTool: Tool = {
  name: "asana_create_section_for_project",
  description: "Create a new section in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to create the section in"
      },
      name: {
        type: "string",
        description: "Name of the section to create"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id", "name"]
  }
};

export const createProjectForWorkspaceTool: Tool = {
  name: "asana_create_project",
  description: "Create a new project in a workspace",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to create the project in"
      },
      name: {
        type: "string",
        description: "Name of the project to create"
      },
      public: {
        type: "boolean",
        description: "Whether the project is public to the organization",
        default: false
      },
      archived: {
        type: "boolean",
        description: "Whether the project is archived",
        default: false
      },
      color: {
        type: "string",
        description: "Color of the project (light-green, light-orange, light-blue, etc.)"
      },
      team_id: {
        type: "string",
        description: "If the workspace for the project is an organization, specify the team GID"
      },
      layout: {
        type: "string",
        description: "The layout of the project (board, list, timeline, or calendar)",
        default: "list"
      },
      default_view: {
        type: "string",
        description: "The default view of the project (list, board, calendar, timeline, or gantt)"
      },
      due_on: {
        type: "string",
        description: "The date on which this project is due (YYYY-MM-DD format)"
      },
      start_on: {
        type: "string",
        description: "The day on which work for this project begins (YYYY-MM-DD format)"
      },
      notes: {
        type: "string",
        description: "Free-form textual information associated with the project"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["workspace_id", "name"]
  }
};
