# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

### Improved


## [1.8.6] - 2024-07-16

### Added
- New tool for adding tags to task (`asana_add_tags_to_task`) to support task categorization


## [1.8.5] - 2024-07-16

### Fixed
- Fixed asana_get_teams_for_user to use default workspace when user_gid is 'me'


## [1.8.4] - 2024-07-16

### Fixed
- Fixed project validation to properly support optional workspace parameter when DEFAULT_WORKSPACE_ID is set


## [1.8.3] - 2024-07-16

### Added
- Added support for using DEFAULT_WORKSPACE_ID environment variable as default workspace
- Modified tools to use DEFAULT_WORKSPACE_ID when no workspace is specified
- Updated `asana_list_workspaces` to return only the default workspace when DEFAULT_WORKSPACE_ID is set

### Improved
- Reduced the number of required tool calls by automatically using the default workspace
- Improved error messages when no workspace is specified and no default is set
- Added check to treat placeholder values like "your-default-workspace-id" as undefined


## [1.8.2] - 2024-07-13

### Added
- Modified `asana_list_workspace_users` tool to include only name and email fields by default
- Enhanced pagination support documentation for workspace users

### Improved
- Improved defaults for WorkspaceUsers function to include only essential fields
- Updated descriptions and documentation for pagination parameters in user tools


## [1.8.1] - 2024-07-12

### Added
- Enhanced error handling with detailed error messages
- Added error-utils.ts with comprehensive error pattern mappings
- Implemented user-friendly error messages with recovery steps
- Included error codes in responses for better error identification
- Standardized custom field updates with validation and better error messages
- Added field-utils.ts utility for custom field validation and parsing
- Implemented streamlined pagination across multiple functions with auto-paginate support
- Added new asana_get_tasks_for_project tool with comprehensive pagination options
- Created pagination.ts utility for standardized pagination handling

### Improved
- Made error messages more contextual and specific to resource types
- Enhanced error messages for "Not Found" errors to include resource IDs
- Added comprehensive documentation for working with custom fields
- Better handling of different custom field types (enum, text, number, date)
- Improved searchTasks function to support pagination and better error handling
- Standardized parameter validation for all functions returning multiple items
- Updated listWorkspaces and other collection methods to use pagination utilities

### Fixed
- Fixed generic "Not Found" error messages to include more context
- Improved error extraction from various Asana API response formats
- Fixed JSON string handling for custom fields input


## [1.8.0] - 2024-07-11

### Added
- Consistent array parameter handling across all functions
- Added ensureArray utility to normalize different array input formats (arrays, comma-separated strings, JSON strings)
- Modified tool-handler.ts to normalize array parameters at the request level
- Updated all methods in AsanaClientWrapper that work with arrays to ensure consistent parameter handling
- Implemented new addTagsToTask method with consistent array parameter handling

### Fixed
- Fixed issue with inconsistent handling of array parameters
- Removed debugging logs that were causing JSON parsing errors


## [1.7.1] - 2024-07-03

### Added
- New tool for creating projects in a workspace (`asana_create_project`)
- Updated documentation with comprehensive guides for developing new features

## [1.7.0] - 2024-07-02

### Added
- Correct implementation of the resources/list endpoint according to the MCP specification
- New tool for retrieving tasks from a section (`asana_get_tasks_for_section`)
- New tool for displaying the complete hierarchical structure of a project (`asana_get_project_hierarchy`) - delivers sections, tasks, and subtasks in a tree structure
- New tool for retrieving subtasks of a task (`asana_get_subtasks_for_task`)

### Fixed
- Resolved the issue in the `asana_add_task_to_section` functionality by adding a fallback mechanism to handle API errors
- Resolved the issue of registering new tools by adding missing cases in the tool handler

### Changed
- Improved the `asana_add_task_to_section` functionality to always add tasks at the end of the section instead of the beginning

## [1.6.3] - 2025-03-11

### Fixed
- The `asana_add_task_to_section` functionality was fixed, now correctly using SectionsApi instead of TasksApi

## [1.6.2] - 2025-03-11

### Added
- Section management: create sections in projects
- Task organization: move tasks between sections

## [1.6.1] - 2025-03-11

### Added
- Tag management: find tasks by tags and browse tags in workspaces
- Support for creating milestone/approval tasks in your projects
- Custom fields support when creating and updating tasks
- Enhanced subtask organization with ability to position subtasks in specific order

## [1.6.0] - 2025-02-08

### Added

- Support for Project Status (#2)
- CHANGELOG.md

## [1.5.2] - 2025-01-24

### Changed

- Reduce the amount of tokens used by custom fields even more

## [1.5.1] - 2025-01-24

### Changed

- Reduce the amount of tokens used by custom fields

## [1.5.0] - 2025-01-23

### Added

- Ability to search tasks by custom fields

### Changed

- Specify the repo url in the package.json so it shows on npmjs.com
- Use standard format for bin location

[unreleased]: https://github.com/cristip73/mcp-server-asana/compare/v1.6.3..HEAD
[1.6.3]: https://github.com/cristip73/mcp-server-asana/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/cristip73/mcp-server-asana/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/cristip73/mcp-server-asana/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/cristip73/mcp-server-asana/compare/v1.5.2...v1.6.0
[1.5.2]: https://github.com/cristip73/mcp-server-asana/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/cristip73/mcp-server-asana/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/cristip73/mcp-server-asana/compare/v1.4.0...v1.5.0
