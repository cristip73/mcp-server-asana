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
  description: "Get all users in a workspace or organization with pagination support. Returns is_active flag for each user based on workspace membership.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to get users for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo,resource_type,workspace_memberships'). Include 'workspace_memberships' to get the is_active flag."
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return per page (1-100). Default is 50 for manual pagination and 100 for auto_paginate=true.",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response's pagination_info.next_offset. Use this to get the next page of results."
      },
      auto_paginate: {
        type: "boolean",
        description: "Controls pagination behavior: if true, fetches all pages automatically (limited by max_pages); if false, returns a single page with pagination_info for manual paging.",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when auto_paginate=true (protection against fetching too many pages)",
        default: 10
      }
    },
    required: ["workspace_id"]
  },
  examples: [
    {
      name: "Get first page of users in a workspace",
      input: {
        workspace_id: "12345678",
        limit: 20,
        opt_fields: "name,email,photo,workspace_memberships",
        auto_paginate: false
      },
      description: "Returns the first 20 users from the workspace with pagination information for getting subsequent pages"
    },
    {
      name: "Get next page of users",
      input: {
        workspace_id: "12345678",
        limit: 20,
        offset: "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
        opt_fields: "name,email,photo"
      },
      description: "Uses an offset token from a previous response to get the next page of results"
    },
    {
      name: "Get all active users",
      input: {
        workspace_id: "12345678",
        opt_fields: "name,email,workspace_memberships",
        auto_paginate: true,
        max_pages: 5
      },
      description: "Automatically fetches all users (up to max_pages limit) and returns them as a single list"
    }
  ]
}; 