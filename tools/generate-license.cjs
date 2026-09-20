const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'private.pem');

/**
 * استخراج بصمة الجهاز المحلي للتسهيل على المطور في حال أراد تجربة التفعيل على جهازه
 */
function getLocalMachineId() {
  try {
    const mb = execSync('powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', {
      encoding: 'utf-8',
      timeout: 6000,
      windowsHide: true,
    }).trim() || 'UNKNOWN-MB';

    const disk = execSync('powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_DiskDrive | Select-Object -First 1).SerialNumber"', {
      encoding: 'utf-8',
      timeout: 6000,
      windowsHide: true,
    }).trim() || 'UNKNOWN-DISK';

    const cpu = execSync('powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_Processor | Select-Object -First 1).ProcessorId"', {
      encoding: 'utf-8',
      timeout: 6000,
      windowsHide: true,
    }).trim() || 'UNKNOWN-CPU';

    const raw = `${mb}|${disk}|${cpu}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const short = hash.substring(0, 16).toUpperCase();
    const formatted = `${short.slice(0, 4)}-${short.slice(4, 8)}-${short.slice(8, 12)}-${short.slice(12, 16)}`;

    return { short: formatted, full: hash };
  } catch {
    return null;
  }
}

function printHelp() {
  console.log(`
🔑 أداة توليد تراخيص برنامج الكاشير (POS Offline License Generator)
================================================================

الاستخدام السريع:
  npm run license:generate
  أو فتح ملف: توليد_ترخيص.bat
  (سيبدأ معالج تفاعلي يسألك خطوة بخطوة)

الاستخدام عبر سطر الأوامر (CLI):
  node tools/generate-license.cjs -m "<machine-id>" -c "<customer-name>" [-e "<YYYY-MM-DD>"]

الخيارات:
  --machine-id, -m    كود جهاز العميل (الهاش الكامل أو الكود المختصر 16 حرف)
  --customer, -c      اسم العميل أو المحل
  --expires, -e       تاريخ انتهاء الترخيص (YYYY-MM-DD) - افتراضياً مدى الحياة
  --help, -h          عرض هذه المساعدة
  `);
}

function createLicense(machineId, customer, expires) {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('\n❌ المفتاح الخاص غير موجود!');
    console.error(`   المسار المطلوب: ${PRIVATE_KEY_PATH}`);
    console.error('   قم أولاً بإنشاء المفاتيح عبر: npm run license:generate-keys\n');
    process.exit(1);
  }

  const cleanMachineId = machineId.trim().replace(/[^a-zA-Z0-9]/g, '');
  if (!cleanMachineId || cleanMachineId.length < 16) {
    console.error('\n❌ كود الجهاز غير صالح! يجب أن يحتوي على الأقل على 16 حرفاً أو رقماً.\n');
    process.exit(1);
  }

  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');

  // تجهيز حمولة الترخيص
  const payload = {
    machineId: cleanMachineId,
    customer: customer.trim(),
    issuedAt: new Date().toISOString(),
    expiresAt: expires ? new Date(expires + 'T23:59:59.999Z').toISOString() : null,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64');

  // التوقيع الرقمي RSA-2048 SHA-256
  const signer = crypto.createSign('SHA256');
  signer.update(payloadB64);
  signer.end();
  const signature = signer.sign(privateKey, 'base64');

  const licenseData = {
    data: payloadB64,
    signature: signature,
  };

  const licenseKey = Buffer.from(JSON.stringify(licenseData)).toString('base64');

  // حفظ الملف في مجلد licenses لسهولة الرجوع إليه
  const licensesDir = path.join(__dirname, '..', 'licenses');
  if (!fs.existsSync(licensesDir)) {
    fs.mkdirSync(licensesDir, { recursive: true });
  }

  const safeCustomerName = customer.trim().replace(/[/\\?%*:|"<>]/g, '_');
  const customerFile = path.join(licensesDir, `ترخيص_${safeCustomerName}.txt`);
  const rootOutputFile = path.join(__dirname, '..', 'license_output.txt');

  const fileContent = `================================================================
🔑 مفتاح ترخيص نظام الكاشير (POS Offline License)
================================================================
العميل / المحل : ${customer.trim()}
كود الجهاز    : ${cleanMachineId}
تاريخ الإصدار  : ${payload.issuedAt.split('T')[0]}
الصلاحية       : ${expires ? expires : 'مدى الحياة ♾️'}
================================================================

مفتاح التفعيل (انسخ السطر التالي كاملاً والصقه في شاشة التفعيل بالبرنامج):
----------------------------------------------------------------
${licenseKey}
----------------------------------------------------------------
`;

  fs.writeFileSync(customerFile, fileContent, 'utf-8');
  fs.writeFileSync(rootOutputFile, fileContent, 'utf-8');

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                   ✅ تم توليد مفتاح الترخيص بنجاح!                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`👤 اسم العميل/المحل:   ${customer.trim()}`);
  console.log(`🖥️  كود جهاز العميل:    ${cleanMachineId.substring(0, 16)}...`);
  console.log(`📅 تاريخ الإصدار:      ${payload.issuedAt.split('T')[0]}`);
  console.log(`⏰ الصلاحية:           ${expires ? expires : 'مدى الحياة ♾️'}`);
  console.log('─'.repeat(70));
  console.log('\n🔑 مفتاح التفعيل (انسخه وأرسله للعميل):\n');
  console.log(licenseKey);
  console.log('\n' + '─'.repeat(70));
  console.log(`💾 تم حفظ نسخة جاهزة للإرسال في:`);
  console.log(`   📄 ${customerFile}`);
  console.log(`   📄 ${rootOutputFile}`);
  console.log('─'.repeat(70) + '\n');
}

async function runInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('\n');
  console.log('======================================================================');
  console.log('   🔑 معالج توليد تراخيص برنامج الكاشير (POS Offline License)        ');
  console.log('======================================================================\n');

  const localHw = getLocalMachineId();
  if (localHw) {
    console.log(`💡 للمعلومة: كود جهازك الحالي هو: [ ${localHw.short} ]`);
    console.log(`   (إذا كنت تريد تجربة التفعيل على جهازك، اضغط Enter مباشرة عند طلب كود الجهاز)\n`);
  }

  let machineId = await question('1️⃣  أدخل كود جهاز العميل (أو اضغط Enter لاستخدام جهازك الحالي): ');
  machineId = machineId.trim();

  if (!machineId) {
    if (localHw) {
      machineId = localHw.full;
      console.log(`   ✓ تم استخدام كود جهازك الحالي: ${localHw.short}`);
    } else {
      console.error('❌ خطأ: يجب إدخال كود الجهاز.');
      rl.close();
      process.exit(1);
    }
  }

  let customer = await question('\n2️⃣  أدخل اسم العميل أو اسم المحل: ');
  customer = customer.trim();
  if (!customer) {
    customer = 'عميل تجريبي';
    console.log(`   ✓ تم تعيين الاسم الافتراضي: ${customer}`);
  }

  let expires = await question('\n3️⃣  تاريخ الانتهاء YYYY-MM-DD (اضغط Enter لترخيص مدى الحياة ♾️): ');
  expires = expires.trim();
  if (!expires) {
    expires = null;
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
    console.log('⚠️  التاريخ المدخل غير صحيح، سيتم إنشاء ترخيص مدى الحياة.');
    expires = null;
  }

  rl.close();

  createLicense(machineId, customer, expires);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // الوضع التفاعلي
    runInteractive().catch(err => {
      console.error('حدث خطأ:', err);
      process.exit(1);
    });
    return;
  }

  let machineId = '';
  let customer = '';
  let expires = null;

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
    console.error('\n❌ خطأ: يجب تحديد --machine-id و --customer\n');
    printHelp();
    process.exit(1);
  }

  createLicense(machineId, customer, expires);
}

main();
