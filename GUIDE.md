## MCP Server Asana Development Structure

### Key Files:
- **src/asana-client-wrapper.ts** - Implements methods for the Asana API
- **src/tool-handler.ts** - Registers and routes tools
- **src/*-tools.ts** - Groups tools by categories (task-tools.ts, project-tools.ts)
- **src/server.ts** - Main Express server, MCP endpoints

### Steps for Adding a New Feature:

1. **Implement the method in `asana-client-wrapper.ts`**
   ```typescript
   async methodName(param1: Type, param2: Type): Promise<ResponseType> {
     try {
       return await this.client.apiName.method(param1, param2);
     } catch (error) {
       this.logger.error(`Error in methodName: ${error}`);
       throw error;
     }
   }
   ```

2. **Define the tool in the appropriate *-tools.ts file**
   ```typescript
   export const toolName: MCPTool = {
     name: "asana_tool_name",
     description: "Clear description of the functionality",
     inputSchema: z.object({
       required_param: z.string().describe("Parameter description"),
       optional_param: z.string().optional().describe("Optional parameter description")
     })
   };
   ```

3. **Register the tool in `tool-handler.ts`**
   - Add import for the tool
   - Add to `list_of_tools`
   - Implement case in `switch` from `tool_handler`

4. **Test the tool**

### Administrative Steps:

1. **Build and version update**
   ```bash
   # Update version in package.json
   # Update CHANGELOG.md
   npm run build
   ```

2. **Git management**
   ```bash
   git add .
   git commit -m "Add new tool: asana_tool_name"
   git tag -a vX.Y.Z -m "Version X.Y.Z with tool_name functionality"
   git push origin branch-name
   git push origin vX.Y.Z
   ```

3. **Publish npm**
   ```bash
   npm publish
   ```

4. **Update README.md** if the tool is important

### Conventions:
- Prefix tools: `asana_`
- Comprehensive exceptions
- Test each new feature before committing
- Adhere to existing code style
- Use strict types (avoid `any`) 