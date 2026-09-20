import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * أداة توليد التراخيص (License Generator)
 * تُستخدم من قبل المطور فقط لإنشاء مفاتيح تفعيل للعملاء
 * 
 * الاستخدام:
 *   npx ts-node tools/generate-license.ts --machine-id "FULL_SHA256_HASH" --customer "اسم المحل"
 *   npx ts-node tools/generate-license.ts --machine-id "FULL_SHA256_HASH" --customer "اسم المحل" --expires "2027-12-31"
 */

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = path.dirname(__filename_local);

const PRIVATE_KEY_PATH = path.join(__dirname_local, 'keys', 'private.pem');

interface LicensePayload {
  machineId: string;
  customer: string;
  issuedAt: string;
  expiresAt: string | null;
}

function parseArgs(): { machineId: string; customer: string; expires: string | null } {
  const args = process.argv.slice(2);
  let machineId = '';
  let customer = '';
  let expires: string | null = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--machine-id':
      case '-m':
        machineId = args[++i];
        break;
      case '--customer':
      case '-c':
        customer = args[++i];
        break;
      case '--expires':
      case '-e':
        expires = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  if (!machineId || !customer) {
    console.error('❌ خطأ: يجب تحديد --machine-id و --customer\n');
    printHelp();
    process.exit(1);
  }

  return { machineId, customer, expires };
}

function printHelp() {
  console.log(`
🔑 أداة توليد تراخيص برنامج الكاشير
======================================

الاستخدام:
  npx ts-node tools/generate-license.ts [خيارات]

الخيارات المطلوبة:
  --machine-id, -m    كود جهاز العميل (الهاش الكامل من شاشة التفعيل)
  --customer, -c      اسم العميل أو المحل

الخيارات الاختيارية:
  --expires, -e       تاريخ انتهاء الترخيص (YYYY-MM-DD)
                      بدون تحديد = ترخيص مدى الحياة
  --help, -h          عرض هذه المساعدة

أمثلة:
  npx ts-node tools/generate-license.ts -m "abc123def456..." -c "محل قطع غيار السلام"
  npx ts-node tools/generate-license.ts -m "abc123def456..." -c "محل النور" -e "2027-12-31"
  `);
}

function generateLicense() {
  const { machineId, customer, expires } = parseArgs();

  // Check private key exists
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('❌ المفتاح الخاص غير موجود!');
    console.error(`   المسار المتوقع: ${PRIVATE_KEY_PATH}`);
    console.error('   قم بتشغيل: npx ts-node tools/generate-keys.ts');
    process.exit(1);
  }

  // Read private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');

  // Create license payload
  const payload: LicensePayload = {
    machineId: machineId,
    customer: customer,
    issuedAt: new Date().toISOString(),
    expiresAt: expires ? new Date(expires + 'T23:59:59.999Z').toISOString() : null,
  };

  // Encode payload as base64
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64');

  // Sign the payload with private key
  const signer = crypto.createSign('SHA256');
  signer.update(payloadB64);
  signer.end();
  const signature = signer.sign(privateKey, 'base64');

  // Combine into license key
  const licenseData = {
    data: payloadB64,
    signature: signature,
  };

  const licenseKey = Buffer.from(JSON.stringify(licenseData)).toString('base64');

  // Output
  console.log('\n✅ تم توليد مفتاح التفعيل بنجاح!\n');
  console.log('━'.repeat(60));
  console.log(`👤 العميل:        ${customer}`);
  console.log(`🖥️  كود الجهاز:    ${machineId.substring(0, 16)}...`);
  console.log(`📅 تاريخ الإصدار: ${payload.issuedAt.split('T')[0]}`);
  console.log(`⏰ الانتهاء:      ${expires || 'مدى الحياة ♾️'}`);
  console.log('━'.repeat(60));
  console.log('\n🔑 مفتاح التفعيل (انسخه وأرسله للعميل):\n');
  console.log(licenseKey);
  console.log('\n' + '━'.repeat(60));
}

generateLicense();
