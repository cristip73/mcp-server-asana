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
        description: "The workspace GID to get teams for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["workspace_gid"]
  }
};

export const getUsersForWorkspaceTool: Tool = {
  name: "asana_list_workspace_users",
  description: "Get all users in a workspace or organization with support for pagination. Results are sorted alphabetically and limited by default. You can use opt_fields to get additional user details. The response includes pagination information.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to get users for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo,workspace_memberships.is_active'). Add 'workspace_memberships' to see if users are active."
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return per page (1-100). Defaults to 50 if not provided."
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response. Must be the exact token received from a previous response."
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically gets all pages and combines results (limited by max_pages)",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when using auto_paginate",
        default: 10
      }
    },
    required: ["workspace_id"]
  },
  examples: [
    {
      name: "Get active users in a workspace",
      parameters: {
        workspace_id: "12345",
        opt_fields: "name,email,photo,workspace_memberships.is_active",
        limit: 50
      }
    },
    {
      name: "Get all users with auto pagination",
      parameters: {
        workspace_id: "12345",
        auto_paginate: true,
        max_pages: 5
      }
    },
    {
      name: "Get next page of users",
      parameters: {
        workspace_id: "12345",
        offset: "eyJ0eXAiO..."
      }
    }
  ]
}; 