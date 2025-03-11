# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

### Fixed


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
