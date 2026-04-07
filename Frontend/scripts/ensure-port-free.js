import { execFileSync } from 'node:child_process';
import process from 'node:process';

const port = Number(process.argv[2]);

if (!Number.isInteger(port) || port <= 0) {
  console.error('[ensure-port-free] A valid port number is required.');
  process.exit(1);
}

function runPowerShell(command) {
  return execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim();
}

function getPortOwner(targetPort) {
  const script = `
    $connection = Get-NetTCPConnection -State Listen -LocalPort ${targetPort} -ErrorAction SilentlyContinue | Select-Object -First 1;
    if (-not $connection) { exit 0 }
    $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue | Select-Object -First 1;
    if (-not $process) { exit 0 }
    $commandLine = Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -eq $process.Id } | Select-Object -ExpandProperty CommandLine -First 1;
    @{
      ProcessId = $process.Id
      Name = $process.ProcessName
      CommandLine = $commandLine
    } | ConvertTo-Json -Compress
  `;

  const output = runPowerShell(script);
  return output ? JSON.parse(output) : null;
}

function isSafeToStop(owner) {
  const details = `${owner?.Name || ''} ${owner?.CommandLine || ''}`.toLowerCase();
  return details.includes('node') || details.includes('vite');
}

function stopProcess(processId) {
  runPowerShell(`Stop-Process -Id ${processId} -Force`);
}

try {
  const owner = getPortOwner(port);

  if (!owner) {
    process.exit(0);
  }

  if (!isSafeToStop(owner)) {
    console.error(`[ensure-port-free] Port ${port} is being used by a non-node process. Stop it manually and try again.`);
    process.exit(1);
  }

  stopProcess(owner.ProcessId);
  console.log(`[ensure-port-free] Cleared port ${port} by stopping PID ${owner.ProcessId}.`);
} catch (error) {
  console.error(`[ensure-port-free] Failed to clear port ${port}: ${error.message}`);
  process.exit(1);
}
