import { execSync } from 'child_process';
import crypto from 'crypto';

/**
 * موديول بصمة الجهاز (Hardware Fingerprint)
 * يقرأ معرّفات فريدة من عتاد الجهاز ويولّد كود تعريف فريد (Machine ID)
 */

interface HardwareInfo {
  motherboardUUID: string;
  diskSerial: string;
  cpuId: string;
}

/**
 * تنفيذ أمر PowerShell وإرجاع الناتج
 */
function runPowerShell(command: string): string {
  try {
    const result = execSync(
      `powershell -NoProfile -NonInteractive -Command "${command}"`,
      {
        encoding: 'utf-8',
        timeout: 10000,
        windowsHide: true,
      }
    );
    return result.trim();
  } catch {
    return '';
  }
}

/**
 * قراءة معلومات العتاد من الجهاز
 */
function getHardwareInfo(): HardwareInfo {
  const motherboardUUID = runPowerShell(
    '(Get-CimInstance Win32_ComputerSystemProduct).UUID'
  );

  const diskSerial = runPowerShell(
    '(Get-CimInstance Win32_DiskDrive | Select-Object -First 1).SerialNumber'
  );

  const cpuId = runPowerShell(
    '(Get-CimInstance Win32_Processor | Select-Object -First 1).ProcessorId'
  );

  return {
    motherboardUUID: motherboardUUID || 'UNKNOWN-MB',
    diskSerial: diskSerial || 'UNKNOWN-DISK',
    cpuId: cpuId || 'UNKNOWN-CPU',
  };
}

/**
 * توليد Machine ID فريد من بصمة الجهاز
 * يُرجع hash مختصر في صيغة سهلة القراءة: XXXX-XXXX-XXXX-XXXX
 */
export async function getMachineId(): Promise<string> {
  const hw = getHardwareInfo();

  // Combine all hardware identifiers
  const raw = `${hw.motherboardUUID}|${hw.diskSerial}|${hw.cpuId}`;

  // Create SHA-256 hash
  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  // Take first 16 hex chars and format as XXXX-XXXX-XXXX-XXXX
  const short = hash.substring(0, 16).toUpperCase();
  const formatted = `${short.slice(0, 4)}-${short.slice(4, 8)}-${short.slice(8, 12)}-${short.slice(12, 16)}`;

  return formatted;
}

/**
 * الحصول على الـ Machine ID الكامل (SHA-256 hash بدون تقطيع)
 * يُستخدم داخلياً في التحقق من الترخيص
 */
export async function getMachineIdFull(): Promise<string> {
  const hw = getHardwareInfo();
  const raw = `${hw.motherboardUUID}|${hw.diskSerial}|${hw.cpuId}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
