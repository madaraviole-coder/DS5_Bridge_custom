import http from 'node:http';
import { EventEmitter } from 'node:events';
import type { BridgeService } from './bridge-service';
import type { ModsServerSettings } from '../shared/types';

export class ModsApiServer extends EventEmitter {
  private server: http.Server | null = null;
  private settings: ModsServerSettings;
  private bridgeService: BridgeService;
  private running = false;

  constructor(bridgeService: BridgeService, initialSettings: ModsServerSettings) {
    super();
    this.bridgeService = bridgeService;
    this.settings = initialSettings;
  }

  public updateSettings(settings: ModsServerSettings): void {
    const wasRunning = this.running;
    const portChanged = this.settings.port !== settings.port;
    this.settings = settings;

    if (!settings.enabled && wasRunning) {
      this.stop();
    } else if (settings.enabled && (!wasRunning || portChanged)) {
      if (wasRunning) {
        this.stop();
      }
      this.start();
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getPort(): number {
    return this.settings.port;
  }

  public start(): Promise<void> {
    if (this.running || !this.settings.enabled) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.once('error', (err) => {
        this.running = false;
        this.emit('error', err);
        reject(err);
      });

      this.server.listen(this.settings.port, '127.0.0.1', () => {
        this.running = true;
        this.emit('started', this.settings.port);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    if (!this.running || !this.server) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.server?.close(() => {
        this.running = false;
        this.server = null;
        this.emit('stopped');
        resolve();
      });
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // CORS headers for local games / mod environments / AI tools
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://127.0.0.1:${this.settings.port}`);
    const pathname = url.pathname;

    // REST API Endpoint: GET /status
    if (req.method === 'GET' && (pathname === '/status' || pathname === '/api/status')) {
      const snapshot = this.bridgeService.getSnapshot();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        connected: Boolean(snapshot.status?.controllerConnected),
        controllerType: snapshot.status?.controllerType ?? 'unknown',
        batteryPercent: snapshot.status?.batteryPercent ?? null,
        charging: Boolean(snapshot.status?.batteryPercent && snapshot.status.batteryPercent > 100),
        hostPersonaMode: snapshot.status?.hostPersonaMode ?? snapshot.settings.hostPersonaMode,
        gyro: snapshot.settings.gyroSettings,
        activeGame: snapshot.activeGame ?? null
      }));
      return;
    }

    // MCP JSON-RPC 2.0 Endpoint: POST /mcp or POST /rpc
    if (this.settings.allowMCP && req.method === 'POST' && (pathname === '/mcp' || pathname === '/rpc' || pathname === '/')) {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const json = JSON.parse(body);
          this.handleMcpJsonRpc(json, res);
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' }
          }));
        }
      });
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));
  }

  private handleMcpJsonRpc(rpc: any, res: http.ServerResponse): void {
    const { id, method, params } = rpc;

    // MCP Protocol basic endpoints
    if (method === 'initialize') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'kitsune-mods-mcp',
            version: '1.0.0'
          }
        }
      }));
      return;
    }

    if (method === 'tools/list') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'get_controller_status',
              description: 'Get current DS5 controller connection, battery status, and active profile',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'trigger_haptics_test',
              description: 'Trigger a brief haptic rumble pulse on the controller',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        }
      }));
      return;
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      if (toolName === 'get_controller_status') {
        const snap = this.bridgeService.getSnapshot();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  connected: Boolean(snap.status?.controllerConnected),
                  controllerType: snap.status?.controllerType ?? 'unknown',
                  batteryPercent: snap.status?.batteryPercent ?? null,
                  charging: false,
                  activeGame: snap.activeGame?.name ?? null
                })
              }
            ]
          }
        }));
        return;
      }

      if (toolName === 'trigger_haptics_test') {
        void this.bridgeService.testClassicRumble();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: 'Classic rumble test triggered successfully.' }]
          }
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` }
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    }));
  }
}
