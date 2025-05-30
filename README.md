# MCP Server for Asana

[![npm version](https://badge.fury.io/js/%roychri%2Fmcp-server-asana.svg)](https://www.npmjs.com/package/@cristip73/mcp-server-asana)

This Model Context Protocol server implementation of Asana allows you
to talk to Asana API from MCP Client such as Anthropic's Claude
Desktop Application, and many more.

More details on MCP here:
 - https://www.anthropic.com/news/model-context-protocol
 - https://modelcontextprotocol.io/introduction
 - https://github.com/modelcontextprotocol

<a href="https://glama.ai/mcp/servers/ln1qzdhwmc"><img width="380" height="200" src="https://glama.ai/mcp/servers/ln1qzdhwmc/badge" alt="mcp-server-asana MCP server" /></a>

## Usage

In the AI tool of your choice (ex: Claude Desktop) ask something about asana tasks, projects, workspaces, and/or comments. Mentioning the word "asana" will increase the chance of having the LLM pick the right tool.

Example:

> How many unfinished asana tasks do we have in our Sprint 30 project?

Another example:

![Claude Desktop Example](https://raw.githubusercontent.com/cristip73/mcp-server-asana/main/mcp-server-asana-claude-example.png)

## Working with Custom Fields

When updating or creating tasks with custom fields, use the following format:

```javascript
asana_update_task({
  task_id: "TASK_ID",
  custom_fields: {
    "custom_field_gid": value  // The value format depends on the field type
  }
})
```

The value format varies by field type:
- **Enum fields**: Use the `enum_option.gid` of the option (NOT the display name)
- **Text fields**: Use a string
- **Number fields**: Use a number
- **Date fields**: Use a string in YYYY-MM-DD format
- **Multi-enum fields**: Use an array of enum option GIDs

### Finding Custom Field GIDs

To find the GIDs of custom fields and their enum options:

1. Use `asana_get_task` with the `opt_fields` parameter set to include custom fields:
   ```javascript
   asana_get_task({
     task_id: "TASK_ID",
     opt_fields: "custom_fields,custom_fields.enum_options"
   })
   ```

2. In the response, look for the `custom_fields` array. Each custom field will have:
   - `gid`: The unique identifier for the custom field
   - `name`: The display name of the custom field
   - `resource_subtype`: The type of custom field (text, number, enum, etc.)
   - For enum fields, examine the `enum_options` array to find the GID of each option

### Example: Updating an Enum Custom Field

```javascript
// First, get the task with custom fields
const taskDetails = asana_get_task({
  task_id: "1234567890",
  opt_fields: "custom_fields,custom_fields.enum_options"
});

// Find the custom field GID and enum option GID
const priorityFieldGid = "11112222";  // From taskDetails.custom_fields
const highPriorityOptionGid = "33334444";  // From the enum_options of the priority field

// Update the task with the custom field
asana_update_task({
  task_id: "1234567890",
  custom_fields: {
    [priorityFieldGid]: highPriorityOptionGid
  }
});
```

## Tools

1. `asana_list_workspaces`
    * List all available workspaces in Asana
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of workspaces
    * Note: If DEFAULT_WORKSPACE_ID is set, this will only return that workspace instead of fetching all workspaces
2. `asana_search_projects`
    * Search for projects in Asana using name pattern matching
    * Required input:
        * name_pattern (string): Regular expression pattern to match project names
    * Optional input:
        * workspace (string): The workspace to search in (optional if DEFAULT_WORKSPACE_ID is set)
        * team (string): The team to filter projects on
        * archived (boolean): Only return archived projects (default: false)
        * limit (number): Results per page (1-100)
        * offset (string): Pagination offset token
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of matching projects
    * Note: Either workspace or team must be specified if DEFAULT_WORKSPACE_ID is not set
3. `asana_search_tasks`
    * Search tasks in a workspace with advanced filtering options
    * Required input:
        * workspace (string): The workspace to search in (optional if DEFAULT_WORKSPACE_ID is set)
    * Optional input:
        * text (string): Text to search for in task names and descriptions
        * resource_subtype (string): Filter by task subtype (e.g. milestone)
        * completed (boolean): Filter for completed tasks
        * is_subtask (boolean): Filter for subtasks
        * has_attachment (boolean): Filter for tasks with attachments
        * is_blocked (boolean): Filter for tasks with incomplete dependencies
        * is_blocking (boolean): Filter for incomplete tasks with dependents
        * assignee, projects, sections, tags, teams, and many other advanced filters
        * sort_by (string): Sort by due_date, created_at, completed_at, likes, modified_at (default: modified_at)
        * sort_ascending (boolean): Sort in ascending order (default: false)
        * opt_fields (string): Comma-separated list of optional fields to include
        * custom_fields (object): Object containing custom field filters
    * Returns: List of matching tasks
4. `asana_get_task`
    * Get detailed information about a specific task
    * Required input:
        * task_id (string): The task ID to retrieve
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Detailed task information
5. `asana_create_task`
    * Create a new task in a project
    * Required input:
        * project_id (string): The project to create the task in
        * name (string): Name of the task
    * Optional input:
        * notes (string): Description of the task
        * html_notes (string): HTML-like formatted description of the task
        * due_on (string): Due date in YYYY-MM-DD format
        * assignee (string): Assignee (can be 'me' or a user ID)
        * followers (array of strings): Array of user IDs to add as followers
        * parent (string): The parent task ID to set this task under
        * projects (array of strings): Array of project IDs to add this task to
        * resource_subtype (string): The type of the task (default_task or milestone)
        * custom_fields (object): Object mapping custom field GID strings to their values
    * Returns: Created task information
6. `asana_get_task_stories`
    * Get comments and stories for a specific task
    * Required input:
        * task_id (string): The task ID to get stories for
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of task stories/comments
7. `asana_update_task`
    * Update an existing task's details
    * Required input:
        * task_id (string): The task ID to update
    * Optional input:
        * name (string): New name for the task
        * notes (string): New description for the task
        * due_on (string): New due date in YYYY-MM-DD format
        * assignee (string): New assignee (can be 'me' or a user ID)
        * completed (boolean): Mark task as completed or not
        * resource_subtype (string): The type of the task (default_task or milestone)
        * custom_fields (object): Object mapping custom field GID strings to their values
    * Returns: Updated task information
8. `asana_get_project`
    * Get detailed information about a specific project
    * Required input:
        * project_id (string): The project ID to retrieve
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Detailed project information
9. `asana_get_project_task_counts`
    * Get the number of tasks in a project
    * Required input:
        * project_id (string): The project ID to get task counts for
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Task count information
10. `asana_get_project_sections`
    * Get sections in a project
    * Required input:
        * project_id (string): The project ID to get sections for
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of project sections
11. `asana_create_task_story`
    * Create a comment or story on a task
    * Required input:
        * task_id (string): The task ID to add the story to
        * text (string): The text content of the story/comment
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Created story information
12. `asana_add_task_dependencies`
    * Set dependencies for a task
    * Required input:
        * task_id (string): The task ID to add dependencies to
        * dependencies (array of strings): Array of task IDs that this task depends on
    * Returns: Updated task dependencies
13. `asana_add_task_dependents`
    * Set dependents for a task (tasks that depend on this task)
    * Required input:
        * task_id (string): The task ID to add dependents to
        * dependents (array of strings): Array of task IDs that depend on this task
    * Returns: Updated task dependents
14. `asana_create_subtask`
    * Create a new subtask for an existing task
    * Required input:
        * parent_task_id (string): The parent task ID to create the subtask under
        * name (string): Name of the subtask
    * Optional input:
        * notes (string): Description of the subtask
        * due_on (string): Due date in YYYY-MM-DD format
        * assignee (string): Assignee (can be 'me' or a user ID)
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Created subtask information
15. `asana_add_followers_to_task`
    * Add followers to a task
    * Required input:
        * task_id (string): The task ID to add followers to
        * followers (array of strings): Array of user IDs to add as followers to the task
    * Returns: Updated task information
16. `asana_get_multiple_tasks_by_gid`
    * Get detailed information about multiple tasks by their GIDs (maximum 25 tasks)
    * Required input:
        * task_ids (array of strings or comma-separated string): Task GIDs to retrieve (max 25)
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of detailed task information
17. `asana_get_project_status`
    * Get a project status update
    * Required input:
        * project_status_gid (string): The project status GID to retrieve
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Project status information
18. `asana_get_project_statuses`
    * Get all status updates for a project
    * Required input:
        * project_gid (string): The project GID to get statuses for
    * Optional input:
        * limit (number): Results per page (1-100)
        * offset (string): Pagination offset token
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of project status updates
19. `asana_create_project_status`
    * Create a new status update for a project
    * Required input:
        * project_gid (string): The project GID to create the status for
        * text (string): The text content of the status update
    * Optional input:
        * color (string): The color of the status (green, yellow, red)
        * title (string): The title of the status update
        * html_text (string): HTML formatted text for the status update
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Created project status information
20. `asana_delete_project_status`
    * Delete a project status update
    * Required input:
        * project_status_gid (string): The project status GID to delete
    * Returns: Deletion confirmation
21. `asana_set_parent_for_task`
    * Set the parent of a task and position the subtask within the other subtasks of that parent
    * Required input:
        * task_id (string): The task ID to operate on
        * parent (string): The new parent of the task, or null for no parent
    * Optional input:
        * insert_after (string): A subtask of the parent to insert the task after, or null to insert at the beginning of the list
        * insert_before (string): A subtask of the parent to insert the task before, or null to insert at the end of the list
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Updated task information
22. `asana_get_tasks_for_tag`
    * Get tasks for a specific tag
    * Required input:
        * tag_gid (string): The tag GID to retrieve tasks for
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
        * opt_pretty (boolean): Provides the response in a 'pretty' format
        * limit (integer): The number of objects to return per page. The value must be between 1 and 100.
        * offset (string): An offset to the next page returned by the API.
    * Returns: List of tasks for the specified tag
23. `asana_get_tags_for_workspace`
    * Get tags in a workspace
    * Required input:
        * workspace_gid (string): Globally unique identifier for the workspace or organization (optional if DEFAULT_WORKSPACE_ID is set)
    * Optional input:
        * limit (integer): Results per page. The number of objects to return per page. The value must be between 1 and 100.
        * offset (string): Offset token. An offset to the next page returned by the API.
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of tags in the workspace
24. `asana_create_section_for_project`
    * Create a new section in a project
    * Required input:
        * project_id (string): The project ID to create the section in
        * name (string): Name of the section to create
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Created section information
25. `asana_add_task_to_section`
    * Add a task to a specific section in a project
    * Required input:
        * section_id (string): The section ID to add the task to
        * task_id (string): The task ID to add to the section
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Operation result
26. `asana_create_project`
    * Create a new project in a workspace
    * Required input:
        * workspace_id (string): The workspace ID to create the project in (optional if DEFAULT_WORKSPACE_ID is set)
        * name (string): Name of the project to create
        * team_id (string): REQUIRED for organization workspaces - The team GID to share the project with
    * Optional input:
        * public (boolean): Whether the project is public to the organization (default: false)
        * archived (boolean): Whether the project is archived (default: false)
        * color (string): Color of the project (light-green, light-orange, light-blue, etc.)
        * layout (string): The layout of the project (board, list, timeline, or calendar)
        * default_view (string): The default view of the project (list, board, calendar, timeline, or gantt)
        * due_on (string): The date on which this project is due (YYYY-MM-DD format)
        * start_on (string): The day on which work for this project begins (YYYY-MM-DD format)
        * notes (string): Free-form textual information associated with the project
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: Created project information
27. `asana_get_teams_for_user`
    * Get teams to which the user has access
    * Required input:
        * user_gid (string): The user GID to get teams for. Use 'me' to get teams for the current user.
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of teams the user has access to
28. `asana_get_teams_for_workspace`
    * Get teams in a workspace
    * Required input:
        * workspace_gid (string): The workspace GID to get teams for (optional if DEFAULT_WORKSPACE_ID is set)
    * Optional input:
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of teams in the workspace
29. `asana_list_workspace_users`
    * Get users in a workspace
    * Required input:
        * workspace_id (string): The workspace ID to get users for (optional if DEFAULT_WORKSPACE_ID is set)
    * Optional input:
        * limit (integer): Results per page (1-100)
        * offset (string): Pagination offset token
        * opt_fields (string): Comma-separated list of optional fields to include (defaults to "name,email")
        * auto_paginate (boolean): Whether to automatically fetch all pages
        * max_pages (integer): Maximum number of pages to fetch when auto_paginate is true
    * Returns: List of users in the workspace
30. `asana_get_project_hierarchy`
    * Get the complete hierarchical structure of an Asana project, including sections, tasks, and subtasks
    * Required input:
        * project_id (string): The project ID to get hierarchy for
    * Optional input:
        * include_completed_tasks (boolean): Include completed tasks (default: false)
        * include_subtasks (boolean): Include subtasks for each task (default: true)
        * include_completed_subtasks (boolean): Include completed subtasks (default: follows include_completed_tasks)
        * max_subtask_depth (number): Maximum depth of subtasks to retrieve (default: 1)
        * opt_fields_tasks (string): Optional fields for tasks
        * opt_fields_subtasks (string): Optional fields for subtasks
        * opt_fields_sections (string): Optional fields for sections
        * opt_fields_project (string): Optional fields for project
        * limit (number): Max results per page (1-100)
        * offset (string): Pagination token from previous response
        * auto_paginate (boolean): Whether to automatically fetch all pages
        * max_pages (number): Maximum pages to fetch when auto_paginate is true
    * Returns: Hierarchical project structure with statistics

31. `asana_get_attachments_for_object`
    * List attachments for a specific object (task, project, etc.)
    * Required input:
        * object_gid (string): The object GID to retrieve attachments for
    * Optional input:
        * limit (number): Results per page (1-100)
        * offset (string): Pagination offset token
        * opt_fields (string): Comma-separated list of optional fields to include
    * Returns: List of attachments

32. `asana_upload_attachment_for_object`
    * Upload a local file as attachment to a task or other object
    * Required input:
        * object_gid (string): The object GID to attach the file to
        * file_path (string): Path to the local file to upload
    * Optional input:
        * file_name (string): Custom file name
        * file_type (string): MIME type of the uploaded file
    * Returns: Metadata of the uploaded attachment

33. `asana_download_attachment`
    * Download an attachment to a local directory
    * Required input:
        * attachment_gid (string): The attachment GID to download
    * Optional input:
        * output_dir (string): Directory to save the file (default: ~/downloads)
    * Returns: Path and MIME type of the downloaded file

## Prompts

1. `task-summary`
    * Get a summary and status update for a task based on its notes, custom fields and comments
    * Required input:
        * task_id (string): The task ID to get summary for
    * Returns: A detailed prompt with instructions for generating a task summary

## Resources

None

## Setup


1. **Create an Asana account**:

   - Visit the [Asana](https://www.asana.com).
   - Click "Sign up".

2. **Retrieve the Asana Access Token**:

   - You can generate a personal access token from the Asana developer console.
     - https://app.asana.com/0/my-apps
   - More details here: https://developers.asana.com/docs/personal-access-token

3. **Optional: Get your default workspace ID**:

   - If you primarily work with one workspace, you can set a default workspace ID.
   - Use the Asana API to list your workspaces, or go to your workspace in Asana and copy the ID from the URL.
   - When you set a default workspace ID, you won't need to specify the workspace for each API call.
   - Without a default workspace, the server will call `asana_list_workspaces` to get the list of available workspaces.

4. **Configure Claude Desktop**:
   Add the following to your `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "asana": {
         "command": "npx",
         "args": ["-y", "@cristip73/mcp-server-asana"],
         "env": {
           "ASANA_ACCESS_TOKEN": "your-asana-access-token",
           "DEFAULT_WORKSPACE_ID": "your-default-workspace-id"
         }
       }
     }
   }
   ```

## Troubleshooting

If you encounter permission errors:

1. Ensure the asana plan you have allows API access
2. Confirm the access token and configuration are correctly set in `claude_desktop_config.json`.


## Contributing

Clone this repo and start hacking.

### Test it locally with the MCP Inspector

If you want to test your changes, you can use the MCP Inspector like this:

```bash
npm run inspector
```

This will expose the client to port `5173` and server to port `3000`.

If those ports are already used by something else, you can use:

```bash
CLIENT_PORT=5009 SERVER_PORT=3009 npm run inspector
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
