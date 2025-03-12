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
  description: "Get all users in a workspace or organization with pagination support. Returns is_active flag for each user where available.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to get users for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo,resource_type,workspace_memberships')"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return per page (1-100). Always specify a limit to enable pagination.",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response's pagination_info.next_offset"
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically fetches all pages and combines results (limited by max_pages). If false, returns a single page with pagination_info object.",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when auto_paginate is true",
        default: 10
      }
    },
    required: ["workspace_id"]
  },
  examples: [
    {
      name: "Get active users in a workspace",
      input: {
        workspace_id: "12345678",
        opt_fields: "name,email,photo,workspace_memberships",
        limit: 20,
        auto_paginate: false
      }
    },
    {
      name: "Get all users with automatic pagination",
      input: {
        workspace_id: "12345678",
        opt_fields: "name,email",
        auto_paginate: true,
        max_pages: 5
      }
    }
  ]
}; 