import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getTeamsForUserTool: Tool = {
  name: "asana_get_teams_for_user",
  description: "Get teams to which the user has access",
  inputSchema: {
    type: "object",
    properties: {
      user_gid: {
        type: "string",
        description: "The user GID to get teams for. Use 'me' to get teams for the current user."
      },
      workspace: {
        type: "string",
        description: "The workspace to get teams from (optional if DEFAULT_WORKSPACE_ID is set)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["user_gid"]
  }
};

export const getTeamsForWorkspaceTool: Tool = {
  name: "asana_get_teams_for_workspace",
  description: "Get teams in a workspace",
  inputSchema: {
    type: "object",
    properties: {
      workspace_gid: {
        type: "string",
        description: "The workspace GID to get teams for (optional if DEFAULT_WORKSPACE_ID is set)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: []
  }
};

export const getUsersForWorkspaceTool: Tool = {
  name: "asana_list_workspace_users",
  description: "Get users in a workspace",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to get users for (optional if DEFAULT_WORKSPACE_ID is set)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g., 'photo,resource_type'). Fields 'name' and 'email' are included by default."
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return per page (1-100). Helps prevent timeouts and ensures more reliable responses.",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response. Must be the exact token returned in a previous response's next_page.offset field."
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically fetches all pages and combines results (limited by max_pages)",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when auto_paginate is true",
        default: 10
      }
    },
    required: []
  }
}; 