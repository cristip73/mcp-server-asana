import { Tool, CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';
import { normalizeArrayParameters } from './utils/array-utils.js';
import { formatErrorResponse } from './utils/error-utils.js';
import { validateParameters } from './utils/validation.js';

import { listWorkspacesTool } from './tools/workspace-tools.js';
import {
  searchProjectsTool,
  getProjectTool,
  getProjectTaskCountsTool,
  getProjectSectionsTool,
  createSectionForProjectTool,
  createProjectForWorkspaceTool,
  updateProjectTool,
  addMembersForProjectTool,
  addFollowersForProjectTool
} from './tools/project-tools.js';
import { 
  getProjectStatusTool,
  getProjectStatusesForProjectTool,
  createProjectStatusTool,
  deleteProjectStatusTool
} from './tools/project-status-tools.js';
import {
  searchTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  createSubtaskTool,
  getMultipleTasksByGidTool,
  addTaskToSectionTool,
  getTasksForSectionTool,
  getProjectHierarchyTool,
  getSubtasksForTaskTool,
  getTasksForProjectTool
} from './tools/task-tools.js';
import { getTasksForTagTool, getTagsForWorkspaceTool } from './tools/tag-tools.js';
import {
  addTaskDependenciesTool,
  addTaskDependentsTool,
  setParentForTaskTool,
  addFollowersToTaskTool
} from './tools/task-relationship-tools.js';
import {
  getStoriesForTaskTool,
  createTaskStoryTool
} from './tools/story-tools.js';
import { 
  getTeamsForUserTool,
  getTeamsForWorkspaceTool,
  getUsersForWorkspaceTool 
} from './tools/user-tools.js';

export const tools: Tool[] = [
  listWorkspacesTool,
  searchProjectsTool,
  getProjectTool,
  getProjectTaskCountsTool,
  getProjectSectionsTool,
  createSectionForProjectTool,
  createProjectForWorkspaceTool,
  updateProjectTool,
  getProjectStatusTool,
  getProjectStatusesForProjectTool,
  createProjectStatusTool,
  deleteProjectStatusTool,
  searchTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  createSubtaskTool,
  getMultipleTasksByGidTool,
  addTaskToSectionTool,
  getTasksForSectionTool,
  getProjectHierarchyTool,
  getSubtasksForTaskTool,
  getTasksForProjectTool,
  getTasksForTagTool,
  getTagsForWorkspaceTool,
  addTaskDependenciesTool,
  addTaskDependentsTool,
  setParentForTaskTool,
  addFollowersToTaskTool,
  getStoriesForTaskTool,
  createTaskStoryTool,
  getTeamsForUserTool,
  getTeamsForWorkspaceTool,
  addMembersForProjectTool,
  addFollowersForProjectTool,
  getUsersForWorkspaceTool
];

// Exportăm și ca list_of_tools pentru compatibilitate cu index.ts
export const list_of_tools = tools;

export function tool_handler(asanaClient: AsanaClientWrapper): (request: CallToolRequest) => Promise<CallToolResult> {
    return async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        // Normalizăm parametrii array înainte de procesare
        const rawArgs = request.params.arguments as any;
        const args = normalizeArrayParameters(rawArgs);
        
        // Validăm parametrii în funcție de tipul operațiunii
        const toolName = request.params.name;
        const validationResult = validateParameters(toolName, args);
        
        if (!validationResult.valid) {
          throw new Error(`Parameter validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Folosim console.error în loc de console.log pentru debugging
        // și doar dacă este necesar pentru debugging
        // if (JSON.stringify(rawArgs) !== JSON.stringify(args)) {
        //   console.error("Normalized array parameters:", {
        //     before: rawArgs,
        //     after: args
        //   });
        // }

        switch (request.params.name) {
          case "asana_list_workspaces": {
            const response = await asanaClient.listWorkspaces(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_search_projects": {
            const { workspace, name_pattern, archived = false, ...opts } = args;
            const response = await asanaClient.searchProjects(
              workspace,
              name_pattern,
              archived,
              opts
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_search_tasks": {
            const { workspace, ...searchOpts } = args;
            const response = await asanaClient.searchTasks(workspace, searchOpts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_task": {
            const { task_id, ...opts } = args;
            const response = await asanaClient.getTask(task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_task": {
            const { project_id, ...taskData } = args;
            const response = await asanaClient.createTask(project_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_task_stories": {
            const { task_id, ...opts } = args;
            const response = await asanaClient.getStoriesForTask(task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_update_task": {
            const { task_id, ...taskData } = args;
            const response = await asanaClient.updateTask(task_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProject(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_task_counts": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProjectTaskCounts(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_status": {
            const { project_status_gid, ...opts } = args;
            const response = await asanaClient.getProjectStatus(project_status_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_statuses": {
            const { project_gid, ...opts } = args;
            const response = await asanaClient.getProjectStatusesForProject(project_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_project_status": {
            const { project_gid, ...statusData } = args;
            const response = await asanaClient.createProjectStatus(project_gid, statusData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_delete_project_status": {
            const { project_status_gid } = args;
            const response = await asanaClient.deleteProjectStatus(project_status_gid);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_sections": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProjectSections(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_task_story": {
            const { task_id, text, ...opts } = args;
            const response = await asanaClient.createTaskStory(task_id, text, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_task_dependencies": {
            const { task_id, dependencies } = args;
            const response = await asanaClient.addTaskDependencies(task_id, dependencies);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_task_dependents": {
            const { task_id, dependents } = args;
            const response = await asanaClient.addTaskDependents(task_id, dependents);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_subtask": {
            const { parent_task_id, opt_fields, ...taskData } = args;
            const response = await asanaClient.createSubtask(parent_task_id, taskData, { opt_fields });
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_multiple_tasks_by_gid": {
            const { task_ids, ...opts } = args;
            // Handle both array and string input
            const taskIdList = Array.isArray(task_ids)
              ? task_ids
              : task_ids.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
            const response = await asanaClient.getMultipleTasksByGid(taskIdList, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_set_parent_for_task": {
            let { data, task_id, opts } = args;
            if ( typeof data == "string" ) {
              data = JSON.parse( data );
            }
            if ( typeof opts == "string" ) {
              opts = JSON.parse( opts );
            }
            const response = await asanaClient.setParentForTask(data, task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tasks_for_tag": {
            const { tag_gid, ...opts } = args;
            const response = await asanaClient.getTasksForTag(tag_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tags_for_workspace": {
            const { workspace_gid, ...opts } = args;
            const response = await asanaClient.getTagsForWorkspace(workspace_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_section_for_project": {
            const { project_id, name, ...opts } = args;
            const response = await asanaClient.createSectionForProject(project_id, name, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_task_to_section": {
            const { section_id, task_id, ...opts } = args;
            const response = await asanaClient.addTaskToSection(section_id, task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tasks_for_section": {
            const { section_id, ...opts } = args;
            const response = await asanaClient.getTasksForSection(section_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_hierarchy": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProjectHierarchy(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_subtasks_for_task": {
            const { task_id, ...opts } = args;
            const response = await asanaClient.getSubtasksForTask(task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_project": {
            const { workspace_id, name, ...projectData } = args;
            
            // Extragem opt_fields pentru opțiuni
            const { opt_fields, ...restData } = projectData;
            
            // Pregătim datele pentru proiect
            const data = {
              name,
              ...restData
            };
            
            // Verificăm dacă avem team_id și îl păstrăm, în asana-client-wrapper
            // va fi redenumit automat în team
            
            // Conversia array-urilor în formatul așteptat de API
            if (data.members && Array.isArray(data.members)) {
              data.members = data.members.map((id: string) => ({ gid: id }));
            }
            
            if (data.followers && Array.isArray(data.followers)) {
              data.followers = data.followers.map((id: string) => ({ gid: id }));
            }
            
            const response = await asanaClient.createProjectForWorkspace(workspace_id, data, { opt_fields });
            
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_update_project": {
            const { project_id, ...projectData } = args;
            
            // Extragem opt_fields pentru opțiuni
            const { opt_fields, ...restData } = projectData;
            
            // Câmpuri problematice care necesită API-uri separate
            const problematicFields = ['members', 'followers', 'public', 'html_notes', 'start_on'];
            let hasProblematicFields = false;
            
            // Verificăm dacă există câmpuri problematice în datele de actualizare
            for (const field of problematicFields) {
              if (field in restData) {
                // Înlăturăm câmpul problematic din datele trimise către API
                delete restData[field];
                hasProblematicFields = true;
              }
            }
            
            // Pregătim datele pentru actualizare
            const data = {
              ...restData
            };
            
            const response = await asanaClient.updateProject(project_id, data, { opt_fields });
            
            // Avertizare pentru utilizator dacă au fost înlăturate câmpuri problematice
            if (hasProblematicFields) {
              return {
                content: [
                  { 
                    type: "text", 
                    text: "Unele câmpuri nu pot fi actualizate direct prin updateProject și necesită API-uri separate:\n" +
                          "- Pentru a actualiza membrii, folosește asana_add_members_for_project\n" +
                          "- Pentru a actualiza followeri, folosește asana_add_followers_for_project\n" +
                          "- Câmpurile public, html_notes și start_on au de asemenea limitări\n\n" +
                          "Proiectul a fost actualizat cu succes pentru celelalte câmpuri. Iată răspunsul:\n" + 
                          JSON.stringify(response) 
                  }
                ],
              };
            }
            
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_teams_for_user": {
            const { user_gid, ...opts } = args;
            const response = await asanaClient.getTeamsForUser(user_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_teams_for_workspace": {
            const { workspace_gid, ...opts } = args;
            const response = await asanaClient.getTeamsForWorkspace(workspace_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_followers_to_task": {
            const { task_id, followers } = args;
            const response = await asanaClient.addFollowersToTask(task_id, followers);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_members_for_project": {
            const { project_id, members, ...opts } = args;
            const response = await asanaClient.addMembersForProject(project_id, members);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_followers_for_project": {
            const { project_id, followers, ...opts } = args;
            const response = await asanaClient.addFollowersForProject(project_id, followers);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tasks_for_project": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getTasksForProject(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_list_workspace_users": {
            const { workspace_id, ...opts } = args;
            try {
              console.log("Getting users for workspace", workspace_id, "with options:", JSON.stringify(opts));
              const response = await asanaClient.getUsersForWorkspace(workspace_id, opts);
              
              // Verificăm dacă răspunsul este un array valid înainte de serializare
              if (!Array.isArray(response)) {
                console.error("Invalid response format for getUsersForWorkspace:", response);
                throw new Error("Răspunsul de la Asana API nu este în formatul așteptat.");
              }
              
              return {
                content: [{ type: "text", text: JSON.stringify(response) }],
              };
            } catch (error: any) {
              console.error("Error in asana_list_workspace_users:", error);
              throw new Error(`Eroare la listarea utilizatorilor din workspace: ${error.message}`);
            }
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        console.error("Error executing tool:", error);
        
        // Log detailed error information for debugging
        if (error.response && error.response.body) {
          console.error("Response error details:", error.response.body);
        }
        
        // Add more context for specific tools
        if (request.params.name === "asana_get_task" && error.message === "Not Found" && request.params.arguments) {
          error = new Error(`Task with ID '${request.params.arguments.task_id}' not found or inaccessible`);
        }
        
        return {
          content: [
            {
              type: "text",
              text: formatErrorResponse(error),
            },
          ],
        };
      }
    };
}
