import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getAttachmentsForObjectTool: Tool = {
  name: "asana_get_attachments_for_object",
  description: "List attachments for an object (task, project, etc)",
  inputSchema: {
    type: "object",
    properties: {
      object_gid: {
        type: "string",
        description: "The object GID to get attachments for"
      },
      limit: {
        type: "number",
        description: "Results per page (1-100)",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination offset token"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["object_gid"]
  }
};

export const uploadAttachmentForObjectTool: Tool = {
  name: "asana_upload_attachment_for_object",
  description: "Upload a local file as attachment to an object",
  inputSchema: {
    type: "object",
    properties: {
      object_gid: {
        type: "string",
        description: "The object GID to attach the file to"
      },
      file_path: {
        type: "string",
        description: "Path to the local file"
      },
      file_name: {
        type: "string",
        description: "Optional custom file name"
      },
      file_type: {
        type: "string",
        description: "Optional MIME type for the uploaded file"
      }
    },
    required: ["object_gid", "file_path"]
  }
};

export const downloadAttachmentTool: Tool = {
  name: "asana_download_attachment",
  description: "Download an attachment locally",
  inputSchema: {
    type: "object",
    properties: {
      attachment_gid: {
        type: "string",
        description: "The attachment GID to download"
      },
      output_dir: {
        type: "string",
        description: "Directory to save the file (defaults to ./downloads)"
      }
    },
    required: ["attachment_gid"]
  }
};
