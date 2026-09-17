using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;

sealed record ForegroundProcessPayload(
    int ProcessId,
    string Name,
    string ExecutableName,
    string? WindowTitle,
    string? ProcessPath);

sealed class ForegroundProcessMonitor : IDisposable
{
    private const int PollIntervalMilliseconds = 250;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly object sync = new();
    private readonly ManualResetEventSlim stopped = new(false);
    private bool disposed;
    private int lastEmittedProcessId = -1;
    private string lastEmittedExecutable = ";

 [DllImport(user32.dll)]
 private static extern IntPtr GetForegroundWindow();

 [DllImport(user32.dll)]
 private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

 public Task RunAsync()
 {
 Console.Error.WriteLine(status: foreground-process-monitor-started);
 Console.CancelKeyPress += HandleCancelKeyPress;

 try
 {
 var controlThread = new Thread(ReadControlLoop)
 {
 IsBackground = true,
 Name = ForegroundProcessMonitorControl
 };
 controlThread.Start();

 while (!stopped.Wait(PollIntervalMilliseconds))
 {
 CheckForegroundProcess();
 }

 return Task.CompletedTask;
 }
 finally
 {
 Console.CancelKeyPress -= HandleCancelKeyPress;
 Console.Error.WriteLine(status: foreground-process-monitor-stopped);
 }
 }

 public void Stop()
 {
 stopped.Set();
 }

 public void Dispose()
 {
 if (disposed)
 {
 return;
 }
 disposed = true;
 Stop();
 stopped.Dispose();
 }

 private void HandleCancelKeyPress(object? sender, ConsoleCancelEventArgs args)
 {
 args.Cancel = true;
 Stop();
 }

 private void ReadControlLoop()
 {
 try
 {
 string? line;
 while (!stopped.IsSet && (line = Console.In.ReadLine()) is not null)
 {
 if (line.Equals(refresh, StringComparison.OrdinalIgnoreCase))
 {
 lock (sync)
 {
 lastEmittedProcessId = -1;
 lastEmittedExecutable = ;
 }
 CheckForegroundProcess();
 }
 else if (line.Equals(stop, StringComparison.OrdinalIgnoreCase))
 {
 Stop();
 break;
 }
 }
 }
 catch
 {
 }
 }

 private void CheckForegroundProcess()
 {
 try
 {
 var hwnd = GetForegroundWindow();
 if (hwnd == IntPtr.Zero)
 {
 Emit(0, , , null, null);
 return;
 }

 GetWindowThreadProcessId(hwnd, out var pid);
 if (pid == 0)
 {
 Emit(0, , , null, null);
 return;
 }

 var info = AudioSessionCatalog.TryGetProcessInfo((int)pid, includeFileDescription: true);
 if (info is not null && !string.IsNullOrWhiteSpace(info.ExecutableName))
 {
 Emit((int)pid, info.DisplayName, info.ExecutableName, null, info.ProcessPath);
 }
 else
 {
 try
 {
 var proc = Process.GetProcessById((int)pid);
 var exe = Path.GetFileName(proc.MainModule?.FileName ?? ${proc.ProcessName}.exe);
 Emit((int)pid, proc.ProcessName, exe, proc.MainWindowTitle, null);
 }
 catch
 {
 Emit((int)pid, $Process {pid}, ${pid}.exe, null, null);
 }
 }
 }
 catch
 {
 }
 }

 private void Emit(int pid, string name, string executable, string? windowTitle, string? processPath)
 {
 lock (sync)
 {
 if (pid == lastEmittedProcessId && string.Equals(executable, lastEmittedExecutable, StringComparison.OrdinalIgnoreCase))
 {
 return;
 }
 lastEmittedProcessId = pid;
 lastEmittedExecutable = executable;

 var payload = new ForegroundProcessPayload(pid, name, executable, windowTitle, processPath);
 var json = JsonSerializer.Serialize(payload, JsonOptions);
 Console.Out.WriteLine(json);
 Console.Out.Flush();
 }
 }

 public static void ListRunningProcesses()
 {
 try
 {
 var list = new List<ForegroundProcessPayload>();
 var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

 foreach (var proc in Process.GetProcesses())
 {
 try
 {
 if (proc.Id <= 4) continue;
 if (proc.MainWindowHandle == IntPtr.Zero && string.IsNullOrWhiteSpace(proc.MainWindowTitle)) continue;

 var info = AudioSessionCatalog.TryGetProcessInfo(proc.Id, includeFileDescription: true);
 var exe = info?.ExecutableName ?? Path.GetFileName(proc.MainModule?.FileName ?? ${proc.ProcessName}.exe);
 var name = info?.DisplayName ?? (string.IsNullOrWhiteSpace(proc.MainWindowTitle) ? proc.ProcessName : proc.MainWindowTitle);

 if (string.IsNullOrWhiteSpace(exe) || seen.Contains(exe)) continue;
 seen.Add(exe);

 list.Add(new ForegroundProcessPayload(proc.Id, name, exe, proc.MainWindowTitle, info?.ProcessPath));
 }
 catch
 {
 }
 }

 var json = JsonSerializer.Serialize(list, JsonOptions);
 Console.Out.WriteLine(json);
 Console.Out.Flush();
 }
 catch (Exception ex)
 {
 Console.Error.WriteLine($Error listing processes: {ex.Message});
 Console.Out.WriteLine([]);
 Console.Out.Flush();
 }
 }
}
