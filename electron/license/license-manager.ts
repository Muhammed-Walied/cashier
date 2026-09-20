import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getMachineIdFull } from './hwid';

/**
 * موديول التحقق من الترخيص (License Manager)
 * يتحقق من صلاحية الترخيص باستخدام RSA Digital Signature
 */

// المفتاح العام المدمج مع البرنامج - يُقرأ من ملف public.pem
// At runtime, __dirname = dist-electron/license/, so keys/ is a direct child
const PUBLIC_KEY_PATH = path.join(__dirname, 'keys', 'public.pem');

// بنية بيانات الترخيص
export interface LicensePayload {
  machineId: string;    // SHA-256 hash لبصمة الجهاز
  customer: string;     // اسم العميل/المحل
  issuedAt: string;     // تاريخ الإصدار
  expiresAt: string | null; // تاريخ الانتهاء (null = مدى الحياة)
}

export interface LicenseInfo {
  isValid: boolean;
  customer: string;
  issuedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  machineMatch: boolean;
}

export type LicenseStatus = 'valid' | 'not_found' | 'invalid' | 'expired' | 'machine_mismatch';

/**
 * الحصول على مسار ملف الترخيص
 */
function getLicenseFilePath(): string {
  let userDataDir = '';
  try {
    userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'casher_data');
  } catch {
    userDataDir = path.join(process.cwd(), 'casher_data');
  }
  return path.join(userDataDir, 'license.key');
}

/**
 * قراءة المفتاح العام
 */
function getPublicKey(): string {
  // Try multiple paths for the public key
  const possiblePaths = [
    PUBLIC_KEY_PATH,
    path.join(__dirname, 'keys', 'public.pem'),
    path.join(__dirname, '..', 'electron', 'license', 'keys', 'public.pem'),
    path.join(process.cwd(), 'electron', 'license', 'keys', 'public.pem'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }

  throw new Error('Public key not found');
}

/**
 * فك تشفير مفتاح الترخيص واستخراج البيانات والتوقيع
 */
function decodeLicenseKey(licenseKey: string): { payload: LicensePayload; signature: string } | null {
  try {
    const decoded = Buffer.from(licenseKey.trim(), 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (!parsed.data || !parsed.signature) {
      return null;
    }

    const payload: LicensePayload = JSON.parse(
      Buffer.from(parsed.data, 'base64').toString('utf-8')
    );

    return { payload, signature: parsed.signature };
  } catch {
    return null;
  }
}

/**
 * التحقق من التوقيع الرقمي
 */
function verifySignature(data: string, signature: string): boolean {
  try {
    const publicKey = getPublicKey();
    const verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    verifier.end();
    return verifier.verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}

/**
 * التحقق الكامل من الترخيص
 */
export async function validateLicense(): Promise<{ status: LicenseStatus; info?: LicenseInfo }> {
  const licenseFilePath = getLicenseFilePath();

  // 1. Check if license file exists
  if (!fs.existsSync(licenseFilePath)) {
    return { status: 'not_found' };
  }

  // 2. Read and decode license
  const licenseKey = fs.readFileSync(licenseFilePath, 'utf-8');
  const decoded = decodeLicenseKey(licenseKey);

  if (!decoded) {
    return { status: 'invalid' };
  }

  const { payload, signature } = decoded;

  // 3. Verify digital signature
  const dataB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const isSignatureValid = verifySignature(dataB64, signature);

  if (!isSignatureValid) {
    return { status: 'invalid' };
  }

  // 4. Verify machine ID
  const currentMachineId = await getMachineIdFull();
  const machineMatch = payload.machineId === currentMachineId;

  if (!machineMatch) {
    return {
      status: 'machine_mismatch',
      info: {
        isValid: false,
        customer: payload.customer,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt,
        isExpired: false,
        machineMatch: false,
      },
    };
  }

  // 5. Check expiration
  if (payload.expiresAt) {
    const expiryDate = new Date(payload.expiresAt);
    const now = new Date();
    if (now > expiryDate) {
      return {
        status: 'expired',
        info: {
          isValid: false,
          customer: payload.customer,
          issuedAt: payload.issuedAt,
          expiresAt: payload.expiresAt,
          isExpired: true,
          machineMatch: true,
        },
      };
    }
  }

  // 6. License is valid!
  return {
    status: 'valid',
    info: {
      isValid: true,
      customer: payload.customer,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      isExpired: false,
      machineMatch: true,
    },
  };
}

/**
 * محاولة تفعيل البرنامج بمفتاح ترخيص
 */
export async function activateLicense(licenseKey: string): Promise<{ success: boolean; message: string; info?: LicenseInfo }> {
  // 1. Decode the license key
  const decoded = decodeLicenseKey(licenseKey);

  if (!decoded) {
    return { success: false, message: 'مفتاح التفعيل غير صالح. تأكد من نسخ المفتاح بالكامل.' };
  }

  const { payload, signature } = decoded;

  // 2. Verify digital signature
  const dataB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const isSignatureValid = verifySignature(dataB64, signature);

  if (!isSignatureValid) {
    return { success: false, message: 'مفتاح التفعيل غير صالح أو تم التلاعب به.' };
  }

  // 3. Verify machine ID
  const currentMachineId = await getMachineIdFull();

  if (payload.machineId !== currentMachineId) {
    return { success: false, message: 'مفتاح التفعيل مخصص لجهاز آخر. تواصل مع الدعم الفني.' };
  }

  // 4. Check expiration
  if (payload.expiresAt) {
    const expiryDate = new Date(payload.expiresAt);
    const now = new Date();
    if (now > expiryDate) {
      return { success: false, message: 'مفتاح التفعيل منتهي الصلاحية. تواصل مع الدعم الفني للتجديد.' };
    }
  }

  // 5. Save the license
  const licenseFilePath = getLicenseFilePath();
  const dir = path.dirname(licenseFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(licenseFilePath, licenseKey.trim(), 'utf-8');

  return {
    success: true,
    message: `تم تفعيل البرنامج بنجاح! مرحباً ${payload.customer}`,
    info: {
      isValid: true,
      customer: payload.customer,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      isExpired: false,
      machineMatch: true,
    },
  };
}

/**
 * الحصول على معلومات الترخيص الحالي
 */
export async function getLicenseInfo(): Promise<LicenseInfo | null> {
  const result = await validateLicense();
  return result.info || null;
}
