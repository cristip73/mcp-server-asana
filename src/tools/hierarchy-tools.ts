import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getProjectHierarchyTool: Tool = {
  name: "asana_get_project_hierarchy",
  description: "Obține structura ierarhică completă a unui proiect Asana, inclusiv secțiunile, task-urile și subtask-urile sale",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "ID-ul proiectului pentru care se dorește obținerea structurii ierarhice"
      },
      include_completed_tasks: {
        type: "boolean",
        description: "Specifică dacă să includă și task-urile completate (implicit: false)"
      },
      opt_fields_tasks: {
        type: "string",
        description: "Câmpuri opționale pentru task-uri (ex: 'name,notes,assignee,due_on,completed')"
      },
      opt_fields_sections: {
        type: "string",
        description: "Câmpuri opționale pentru secțiuni (ex: 'name,created_at')"
      }
    },
    required: ["project_id"]
  }
}; 