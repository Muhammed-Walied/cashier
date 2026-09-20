import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * أداة توليد مفاتيح RSA (تُنفّذ مرة واحدة فقط)
 * تُنشئ زوج مفاتيح:
 *   - المفتاح الخاص: tools/keys/private.pem (لا يُوزّع أبداً)
 *   - المفتاح العام: electron/license/keys/public.pem (يُضمّن مع البرنامج)
 */

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = path.dirname(__filename_local);

const PRIVATE_KEY_DIR = path.join(__dirname_local, 'keys');
const PRIVATE_KEY_PATH = path.join(PRIVATE_KEY_DIR, 'private.pem');
const PUBLIC_KEY_DIR = path.join(__dirname_local, '..', 'electron', 'license', 'keys');
const PUBLIC_KEY_PATH = path.join(PUBLIC_KEY_DIR, 'public.pem');

function generateKeys() {
  console.log('🔐 جاري توليد مفاتيح RSA-2048...\n');

  // Check if keys already exist
  if (fs.existsSync(PRIVATE_KEY_PATH)) {
    console.log('⚠️  المفاتيح موجودة بالفعل!');
    console.log(`   المفتاح الخاص: ${PRIVATE_KEY_PATH}`);
    console.log(`   المفتاح العام: ${PUBLIC_KEY_PATH}`);
    console.log('\n   لإعادة التوليد، احذف الملفات الموجودة أولاً.');
    process.exit(1);
  }

  // Generate RSA key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Create directories
  if (!fs.existsSync(PRIVATE_KEY_DIR)) {
    fs.mkdirSync(PRIVATE_KEY_DIR, { recursive: true });
  }
  if (!fs.existsSync(PUBLIC_KEY_DIR)) {
    fs.mkdirSync(PUBLIC_KEY_DIR, { recursive: true });
  }

  // Save keys
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, 'utf-8');
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, 'utf-8');

  console.log('✅ تم توليد المفاتيح بنجاح!\n');
  console.log(`   🔴 المفتاح الخاص (سري!): ${PRIVATE_KEY_PATH}`);
  console.log(`   🟢 المفتاح العام (يُوزّع):  ${PUBLIC_KEY_PATH}`);
  console.log('\n⚠️  تنبيه مهم: لا تشارك المفتاح الخاص أبداً!');
  console.log('   تأكد من إضافة tools/keys/ إلى .gitignore');
}

generateKeys();
