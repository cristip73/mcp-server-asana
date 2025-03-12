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
 * Tool to list users in a workspace with pagination support
 */
export const getUsersForWorkspaceTool: Tool = {
  name: "asana_list_workspace_users",
  description: `Get all users in a workspace or organization.

This tool supports both manual and automatic pagination. By default, it returns up to 50 users per page 
with pagination metadata to fetch subsequent pages. Includes a useful 'is_active' flag extracted from 
workspace memberships.

Examples:
- To get first 10 active users: { "workspace_id": "12345", "limit": 10, "opt_fields": "name,email,photo,workspace_memberships" }
- To get all users automatically: { "workspace_id": "12345", "auto_paginate": true }
- To get the next page of users: { "workspace_id": "12345", "limit": 50, "offset": "eyJkZXNjIjpmYWx..." }`,
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "The workspace ID to get users for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g., 'name,email,photo,workspace_memberships'). Include 'workspace_memberships' to get the 'is_active' flag."
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return per page (1-100). Defaults to 50 if not provided."
      },
      offset: {
        type: "string",
        description: "Pagination token from previous response's next_page.offset. IMPORTANT: Must be a valid token starting with 'eyJ'."
      },
      auto_paginate: {
        type: "boolean",
        description: "If true, automatically fetches all pages and combines results (up to max_pages limit). If false, returns a single page with pagination information.",
        default: false
      },
      max_pages: {
        type: "number",
        description: "Maximum number of pages to fetch when auto_paginate is true (default: 10)",
        default: 10
      }
    },
    required: ["workspace_id"]
  }
}; 