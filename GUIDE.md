## Structura de dezvoltare MCP Server Asana

### Fișiere cheie:
- **src/asana-client-wrapper.ts** - Implementează metodele pentru API Asana
- **src/tool-handler.ts** - Înregistrează și rutează tool-urile
- **src/*-tools.ts** - Grupează tool-uri pe categorii (task-tools.ts, project-tools.ts)
- **src/server.ts** - Server Express principal, endpoint-uri MCP

### Pași pentru adăugarea unei funcționalități noi:

1. **Implementează metoda în `asana-client-wrapper.ts`**
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

2. **Definește tool-ul în fișierul *-tools.ts potrivit**
   ```typescript
   export const toolName: MCPTool = {
     name: "asana_tool_name",
     description: "Descriere clară a funcționalității",
     inputSchema: z.object({
       required_param: z.string().describe("Descriere parametru"),
       optional_param: z.string().optional().describe("Descriere parametru opțional")
     })
   };
   ```

3. **Înregistrează tool-ul în `tool-handler.ts`**
   - Adaugă import pentru tool
   - Adaugă la `list_of_tools`
   - Implementează caz în `switch` din `tool_handler`

4. **Testează tool-ul**

### Pași administrativi:

1. **Build și actualizare versiune**
   ```bash
   # Actualizare versiune în package.json
   # Actualizare CHANGELOG.md
   npm run build
   ```

2. **Gestionare git**
   ```bash
   git add .
   git commit -m "Add new tool: asana_tool_name"
   git tag -a vX.Y.Z -m "Version X.Y.Z with tool_name functionality"
   git push origin branch-name
   git push origin vX.Y.Z
   ```

3. **Publicare npm**
   ```bash
   npm publish
   ```

4. **Actualizare README.md** dacă tool-ul este important

### Convenții:
- Prefix tool-uri: `asana_`
- Excepții cuprinzătoare
- Testează fiecare nouă funcționalitate înainte de commit
- Respectă stilul de cod existent
- Folosește tipuri stricte (evită `any`) 