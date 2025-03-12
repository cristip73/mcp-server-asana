import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const listWorkspacesTool: Tool = {
  name: "asana_list_workspaces",
  description: "List all available workspaces in Asana. If DEFAULT_WORKSPACE_ID is set, only returns that workspace.",
  inputSchema: {
    type: "object",
    properties: {
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    }
  }
};
