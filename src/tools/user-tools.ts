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

/**
 * Tool for listing users in an Asana workspace with pagination support
 */
export const getUsersForWorkspaceTool: Tool = {
  name: "asana_list_workspace_users",
  description: "Get all users in a workspace or organization with pagination support. Results include an 'is_active' field to identify active users. Results are sorted alphabetically by Asana API.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to get users for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo,role'). The 'is_active' flag will be automatically extracted from workspace_memberships."
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return per page (1-100). Defaults to 50 if not provided. Use this with offset for paginating through large workspaces."
      },
      offset: {
        type: "string",
        description: "Pagination token from a previous response's pagination_info.next_offset. MUST be a valid Asana token starting with 'eyJ'."
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically fetches all pages and combines results (limited by max_pages). If false, returns a single page with pagination info for manual paging.",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when auto_paginate is true, to prevent excessive API calls for very large workspaces.",
        default: 10
      }
    },
    required: ["workspace_id"]
  },
  examples: [
    {
      name: "List first 10 users",
      input: {
        workspace_id: "12345",
        limit: 10,
        opt_fields: "name,email"
      }
    },
    {
      name: "Get only active users",
      input: {
        workspace_id: "12345",
        opt_fields: "name,email,workspace_memberships"
      },
      output: "Filter the results with: results.filter(user => user.is_active)"
    },
    {
      name: "Auto-paginate to get all users",
      input: {
        workspace_id: "12345",
        auto_paginate: true,
        max_pages: 5,
        opt_fields: "name,email"
      }
    },
    {
      name: "Get next page of users",
      input: {
        workspace_id: "12345",
        offset: "eyJ0eXAi...", // token from previous response
        limit: 50
      }
    }
  ]
}; 