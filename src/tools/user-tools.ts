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
  description: "Get all users in a workspace or organization with improved pagination support. Returns is_active flag for each user where available. Use pagination_info in response for manual navigation.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to get users for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (recommended: 'name,email,photo,resource_type,workspace_memberships')"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return per page (1-100). This parameter is now strictly enforced. Defaults to 20 for manual pagination, 100 for auto-pagination.",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response's pagination_info.next_offset. Only valid tokens starting with 'eyJ' will be used."
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically fetches all pages and combines results (limited by max_pages). If false, returns a single page with pagination_info object with a next_offset token for manual pagination.",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when auto_paginate is true to prevent excessive API calls",
        default: 10
      }
    },
    required: ["workspace_id"]
  },
  examples: [
    {
      name: "Get limited number of users with manual pagination",
      input: {
        workspace_id: "12345678",
        opt_fields: "name,email,photo,workspace_memberships",
        limit: 20,
        auto_paginate: false
      },
      description: "Returns 20 users and includes pagination_info object with next_offset token"
    },
    {
      name: "Get all users with automatic pagination",
      input: {
        workspace_id: "12345678",
        opt_fields: "name,email",
        auto_paginate: true,
        max_pages: 5
      },
      description: "Returns all users (up to max_pages*100) in a single combined array"
    },
    {
      name: "Continue pagination from previous response",
      input: {
        workspace_id: "12345678",
        offset: "eyJ0eXAiOiJKV1QiLCJhbGci...",
        limit: 20
      },
      description: "Returns the next page of results starting from the provided offset token"
    }
  ]
}; 