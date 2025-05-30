import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getTagsForWorkspaceTool: Tool = {
  name: "asana_get_tags_for_workspace",
  description: "Get tags in a workspace",
  inputSchema: {
    type: "object",
    properties: {
      workspace_gid: {
        type: "string",
        description: "Globally unique identifier for the workspace or organization (optional if DEFAULT_WORKSPACE_ID is set)"
      },
      limit: {
        type: "integer",
        description: "Results per page. The number of objects to return per page. The value must be between 1 and 100."
      },
      offset: {
        type: "string",
        description: "Offset token. An offset to the next page returned by the API."
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: []
  }
};

export const getTasksForTagTool: Tool = {
  name: "asana_get_tasks_for_tag",
  description: "Get tasks for a specific tag",
  inputSchema: {
    type: "object",
    properties: {
      tag_gid: {
        type: "string",
        description: "The tag GID to retrieve tasks for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      },
      opt_pretty: {
        type: "boolean",
        description: "Provides the response in a 'pretty' format"
      },
      limit: {
        type: "integer",
        description: "Results per page. The number of objects to return per page. The value must be between 1 and 100."
      },
      offset: {
        type: "string",
        description: "Offset token. An offset to the next page returned by the API."
      }
    },
    required: ["tag_gid"]
  }
};

export const addTagsToTaskTool: Tool = {
  name: "asana_add_tags_to_task",
  description: "Add one or more tags to a task for categorization purposes",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to add tags to"
      },
      tag_ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "A list of tag GIDs to add to the task. Use asana_get_tags_for_workspace to find available tags."
      }
    },
    required: ["task_id", "tag_ids"]
  }
};
