import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { resolveAudioHelperPath } from './audio-helper';
import type { RunningProcessInfo } from '../shared/types';

export interface ForegroundProcessEvent {
  processId: number;
  name: string;
  executableName: string;
  windowTitle?: string | null;
  processPath?: string | null;
}

export class GameProfileMonitor extends EventEmitter {
  private process: ChildProcessWithoutNullStreams | null = null;
  private stdoutBuffer = '';
  private stopped = false;
  private lastEmitted: ForegroundProcessEvent | null = null;
  private pollTimer: NodeJS.Timeout | null = null;

  start(): void {
    if (this.process || this.stopped) {
      return;
    }
    this.startHelperOrFallback();
  }

  stop(): void {
    this.stopped = true;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.process) {
      try {
        this.process.kill();
      } catch {}
      this.process = null;
    }
  }

  getLastForegroundProcess(): ForegroundProcessEvent | null {
    return this.lastEmitted;
  }

  async listRunningProcesses(): Promise<RunningProcessInfo[]> {
    return new Promise((resolve) => {
      try {
        const helperPath = resolveAudioHelperPath();
        const proc = spawn(helperPath, ['--list-running-processes'], {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'ignore']
        });
        let output = '';
        proc.stdout.on('data', (data: Buffer) => {
          output += data.toString('utf8');
        });
        proc.on('close', () => {
          try {
            const parsed = JSON.parse(output.trim());
            if (Array.isArray(parsed)) {
              resolve(parsed);
              return;
            }
          } catch {}
          resolve([]);
        });
        proc.on('error', () => resolve([]));
        setTimeout(() => {
          try {
            proc.kill();
          } catch {}
          resolve([]);
        }, 3000);
      } catch {
        resolve([]);
      }
    });
  }

  emitForegroundChange(event: ForegroundProcessEvent): void {
    this.lastEmitted = event;
    this.emit('foreground-change', event);
  }

  private startHelperOrFallback(): void {
    try {
      const helperPath = resolveAudioHelperPath();
      const helper = spawn(helperPath, ['--monitor-foreground-process'], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process = helper;
      this.stdoutBuffer = '';

      helper.stdout.on('data', (chunk: Buffer) => {
        this.stdoutBuffer += chunk.toString('utf8');
        const lines = this.stdoutBuffer.split(/\r?\n/);
        this.stdoutBuffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line.trim()) as ForegroundProcessEvent;
            if (typeof parsed.processId === 'number' && typeof parsed.executableName === 'string') {
              this.lastEmitted = parsed;
              this.emit('foreground-change', parsed);
            }
          } catch {}
        }
      });

      helper.on('error', () => {
        this.process = null;
      });

      helper.on('exit', () => {
        this.process = null;
      });
    } catch {
      this.process = null;
    }
  }
}
