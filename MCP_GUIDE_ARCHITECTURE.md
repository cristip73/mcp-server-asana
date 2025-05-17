# MCP Server Architecture Guide

This guide provides a comprehensive overview of how to build Model Context Protocol (MCP) servers using a modular and maintainable architecture. The structure presented here is based on best practices and real-world implementation experience.

## What is an MCP Server?

An MCP server is a specialized service that enables AI models (like Claude) to interact with external systems and APIs in a standardized way. It follows the Model Context Protocol specification to:

1. Expose functionality through tools
2. Provide prompts for complex operations
3. Manage resources and their states
4. Handle standardized communication with AI models

## Core Architecture Components

### 1. Project Structure

```
src/
├── index.ts                 # Entry point and server setup
├── server.ts               # MCP server implementation
├── client-wrapper.ts       # API client wrapper
├── tool-handler.ts         # Tool registration and routing
├── prompt-handler.ts       # Prompt management
├── version.ts              # Version management
├── tools/                  # Tool implementations by domain
│   ├── core-tools.ts
│   └── domain-specific-tools.ts
└── utils/                  # Shared utilities
    ├── validation.ts
    ├── error-utils.ts
    ├── pagination.ts
    └── field-utils.ts
```

### 2. Core Components Description

#### a. Entry Point (index.ts)
- Server initialization
- Environment configuration
- Transport setup (typically stdio)
- Error handling
- Request handler registration

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tool_handler, list_of_tools } from './tool-handler.js';
import { createPromptHandlers } from './prompt-handler.js';
import { ClientWrapper } from './client-wrapper.js';

async function main() {
  const server = new Server(
    {
      name: "Your MCP Server",
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {}
      },
    }
  );

  const client = new ClientWrapper(config);
  
  server.setRequestHandler(CallToolRequestSchema, tool_handler(client));
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: list_of_tools }));
  
  const promptHandlers = createPromptHandlers(client);
  server.setRequestHandler(ListPromptsRequestSchema, promptHandlers.listPrompts);
  server.setRequestHandler(GetPromptRequestSchema, promptHandlers.getPrompt);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

#### b. Client Wrapper (client-wrapper.ts)
The client wrapper should:
- Implement all API endpoints as typed methods
- Handle rate limiting and retries
- Manage authentication and token refresh
- Transform API responses into standardized formats
- Implement caching where appropriate
- Handle API-specific error cases

Example structure:
```typescript
export class ClientWrapper {
  private client: APIClient;
  private cache: Cache;
  
  constructor(config: Config) {
    this.client = this.initializeClient(config);
    this.cache = new Cache();
  }
  
  // Resource management methods
  async getResource(id: string): Promise<Resource> {
    return this.withErrorHandling(async () => {
      const cached = await this.cache.get(id);
      if (cached) return cached;
      
      const result = await this.client.resources.get(id);
      await this.cache.set(id, result);
      return result;
    });
  }
  
  // Batch operations
  async batchOperation(items: string[]): Promise<BatchResult> {
    return this.withRateLimit(async () => {
      // Implementation
    });
  }
  
  // Utility methods
  private async withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.transformError(error);
    }
  }
}
```

#### c. Tool Handler (tool-handler.ts)
The tool handler should:
- Register all available tools with their schemas
- Validate incoming parameters against schemas
- Route requests to appropriate tool implementations
- Handle tool-specific errors
- Transform tool results into MCP response format
- Manage tool dependencies and initialization

Example structure:
```typescript
import { Tool, CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const tools = {
  resource_tools: resourceTools,
  user_tools: userTools,
  // ... more tool categories
};

export function createToolHandler(client: ClientWrapper) {
  return async (request: ToolRequest): Promise<ToolResponse> => {
    const { name, arguments: args } = request;
    
    // Validation
    validateToolExists(name);
    validateToolArguments(name, args);
    
    // Routing
    const handler = getToolHandler(name);
    const result = await handler(client, args);
    
    return formatToolResponse(result);
  };
}
```

#### d. Tools Directory Organization
Tools should be organized by domain/resource type:
- `core-tools.ts`: Basic operations (list, get, create)
- `resource-specific-tools.ts`: Resource-specific operations
- `batch-tools.ts`: Bulk operations
- `search-tools.ts`: Search and query operations
- `relationship-tools.ts`: Managing relationships between resources

Each tool file should:
- Export tool definitions with schemas
- Implement tool handlers
- Define tool-specific types
- Handle tool-specific validation
- Document tool behavior and examples

#### e. Utils Directory Organization
Utils should be organized by functionality:
- `validation.ts`: Parameter and schema validation
- `error-utils.ts`: Error handling and transformation
- `pagination.ts`: Pagination and result limiting
- `field-utils.ts`: Field mapping and transformation
- `array-utils.ts`: Array operations and normalization
- `cache-utils.ts`: Caching utilities
- `rate-limit.ts`: Rate limiting utilities

#### f. Prompt Handler (prompt-handler.ts)
The prompt handler should:
- Define available prompts
- Manage prompt templates
- Handle prompt parameters
- Format prompt responses
- Cache commonly used prompts

Example structure:
```typescript
import { GetPromptRequest, GetPromptResult, ListPromptsResult } from "@modelcontextprotocol/sdk/types.js";


export const prompts = {
  resource_creation: {
    template: "Create a new {resource_type} with...",
    parameters: ["resource_type", "fields"],
    examples: [/* ... */]
  },
  // ... more prompts
};

export function createPromptHandler(client: ClientWrapper) {
  return {
    listPrompts: async () => ({ prompts }),
    getPrompt: async (name: string, params: any) => {
      validatePromptExists(name);
      return formatPrompt(prompts[name], params);
    }
  };
}
```

## Best Practices

1. **Tool Organization**
   - Group tools by domain/functionality if there are many
   - Use consistent naming conventions
   - Implement comprehensive parameter validation
   - Document tool behavior and requirements

2. **Error Handling**
   - Implement centralized error handling
   - Provide meaningful error messages
   - Include recovery steps in error responses
   - Log errors appropriately

3. **Parameter Handling**
   - Validate all input parameters
   - Normalize array parameters consistently
   - Handle optional parameters gracefully
   - Document parameter requirements

4. **Testing**
   - Implement unit tests for tools
   - Test error handling
   - Validate parameter handling
   - Test integration with external APIs

## Implementing a New MCP Server

1. **Define Your Server's Purpose**
   - What external system will it interact with?
   - What operations need to be exposed?
   - What tools will be needed?
   - What prompts might be helpful?

2. **Setup Project Structure**
   - Initialize npm project
   - Install MCP SDK and dependencies
   - Create directory structure
   - Setup build process

3. **Implement Core Components**
   - Create client wrapper for external API
   - Setup tool handler
   - Implement basic tools
   - Add error handling

4. **Add Tools and Features**
   - Implement domain-specific tools
   - Add parameter validation
   - Implement error handling
   - Document tools and usage

5. **Testing and Deployment**
   - Test with MCP Inspector
   - Validate tool behavior
   - Document setup process
   - Create usage examples

## Example: Implementing a Weather MCP Server

```typescript
// client-wrapper.ts
export class WeatherClientWrapper {
  async getWeather(location: string): Promise<WeatherData> {
    // API implementation
  }
}

// tools/weather-tools.ts
export const getWeatherTool: MCPTool = {
  name: "weather_get_current",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name or coordinates")
  })
};

// prompt-handler.ts
export const weatherPrompts = {
  weather_report: {
    name: "weather_report",
    description: "Generate a weather report based on weather data",
    template: `
Given the following weather data for {location}, create a natural language report:
Temperature: {temperature}°C
Humidity: {humidity}%
Wind Speed: {wind_speed} km/h
Conditions: {conditions}

Consider:
1. Time of day and season
2. Notable weather patterns
3. Any weather warnings or alerts
4. Recommendations for outdoor activities

Format the report in a clear, concise manner suitable for general audience.
    `,
    parameters: ["location", "temperature", "humidity", "wind_speed", "conditions"],
    examples: [
      {
        input: {
          location: "London",
          temperature: 18,
          humidity: 75,
          wind_speed: 12,
          conditions: "Partly cloudy"
        },
        output: "Current weather in London shows mild conditions with temperatures at 18°C..."
      }
    ]
  },
  weather_alert: {
    name: "weather_alert",
    description: "Generate weather alert message",
    template: "WEATHER ALERT for {location}: {alert_type}\n\nSeverity: {severity}\nRecommended Actions:\n{actions}",
    parameters: ["location", "alert_type", "severity", "actions"]
  }
};

export function createWeatherPromptHandler() {
  return {
    listPrompts: async (): Promise<ListPromptsResult> => ({
      prompts: Object.values(weatherPrompts)
    }),
    
    getPrompt: async (request: GetPromptRequest): Promise<GetPromptResult> => {
      const prompt = weatherPrompts[request.params.name];
      if (!prompt) {
        throw new Error(`Prompt '${request.params.name}' not found`);
      }
      
      // Validate required parameters
      const missingParams = prompt.parameters.filter(
        param => !(param in request.params.parameters)
      );
      
      if (missingParams.length > 0) {
        throw new Error(
          `Missing required parameters: ${missingParams.join(", ")}`
        );
      }
      
      // Format the prompt template with provided parameters
      let formattedPrompt = prompt.template;
      for (const [key, value] of Object.entries(request.params.parameters)) {
        formattedPrompt = formattedPrompt.replace(
          new RegExp(`{${key}}`, "g"),
          String(value)
        );
      }
      
      return {
        prompt: {
          content: formattedPrompt,
          examples: prompt.examples
        }
      };
    }
  };
}
```

This example shows how to implement both tools and prompts for a weather service MCP server. The prompt handler provides templates for generating weather reports and alerts, while the tools handle the actual API interactions.

## Conclusion

Building an MCP server requires careful consideration of architecture, error handling, and user experience. The structure presented here provides a solid foundation for building maintainable and reliable MCP servers that can effectively bridge AI models with external services.

Remember to:
- Keep tools focused and well-documented
- Implement comprehensive error handling
- Validate all inputs
- Provide meaningful feedback
- Test thoroughly
- Document setup and usage 