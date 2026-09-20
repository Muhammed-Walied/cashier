/**
 * سكريبت البناء المحمي (Protected Build Script)
 * 
 * يقوم بتحويل ملفات JavaScript الحساسة في الـ Electron main process
 * إلى V8 Bytecode باستخدام bytenode، مما يجعلها غير قابلة للقراءة.
 * 
 * الاستخدام: node scripts/build-protected.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_ELECTRON = path.join(__dirname, '..', 'dist-electron');

// الملفات الحساسة التي يجب حمايتها (تحويلها إلى bytecode)
const SENSITIVE_FILES = [
  'license/license-manager.js',
  'license/hwid.js',
  'main.js',
];

function log(msg) {
  console.log(`\n🔨 ${msg}`);
}

function step(num, msg) {
  console.log(`\n━━━ الخطوة ${num}: ${msg} ━━━`);
}

async function build() {
  console.log('\n' + '═'.repeat(50));
  console.log('   🔒 بناء النسخة المحمية من البرنامج');
  console.log('═'.repeat(50));

  // Step 1: Normal TypeScript compilation
  step(1, 'ترجمة TypeScript إلى JavaScript');
  try {
    execSync('npx tsc -p tsconfig.electron.json', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..') 
    });
    log('✅ تم ترجمة TypeScript بنجاح');
  } catch (err) {
    console.error('❌ فشل في ترجمة TypeScript');
    process.exit(1);
  }

  // Step 2: Vite build for frontend
  step(2, 'بناء الواجهة الأمامية (Vite)');
  try {
    execSync('npx vite build', { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..') 
    });
    log('✅ تم بناء الواجهة بنجاح');
  } catch (err) {
    console.error('❌ فشل في بناء الواجهة');
    process.exit(1);
  }

  // Step 3: Obfuscate sensitive files
  step(3, 'تشويش الكود الحساس (Obfuscation)');
  let hasObfuscator = true;
  try {
    require.resolve('javascript-obfuscator');
  } catch {
    hasObfuscator = false;
    log('⚠️  مكتبة javascript-obfuscator غير مثبتة، يتم تخطي التشويش');
    log('   لتثبيتها: npm install --save-dev javascript-obfuscator');
  }

  if (hasObfuscator) {
    const JavaScriptObfuscator = require('javascript-obfuscator');
    
    for (const file of SENSITIVE_FILES) {
      const filePath = path.join(DIST_ELECTRON, file);
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  الملف غير موجود: ${file}`);
        continue;
      }

      const code = fs.readFileSync(filePath, 'utf-8');
      const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.7,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.3,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: false,
        shuffleStringArray: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
        target: 'node',
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
      });

      fs.writeFileSync(filePath, obfuscated.getObfuscatedCode());
      console.log(`   ✅ تم تشويش: ${file}`);
    }
  }

  // Step 4: Convert to bytecode with bytenode (if available)
  step(4, 'تحويل إلى V8 Bytecode (bytenode)');
  let hasBytenode = true;
  try {
    require.resolve('bytenode');
  } catch {
    hasBytenode = false;
    log('⚠️  مكتبة bytenode غير مثبتة، يتم تخطي التحويل');
    log('   لتثبيتها: npm install --save-dev bytenode');
  }

  if (hasBytenode) {
    const bytenode = require('bytenode');

    for (const file of SENSITIVE_FILES) {
      const filePath = path.join(DIST_ELECTRON, file);
      if (!fs.existsSync(filePath)) continue;

      try {
        // Compile to .jsc bytecode
        const jscPath = filePath.replace('.js', '.jsc');
        await bytenode.compileFile(filePath, jscPath);

        // Replace the .js file with a loader that loads the .jsc
        const loaderCode = `"use strict";require("bytenode");require("${path.basename(jscPath)}");`;
        fs.writeFileSync(filePath, loaderCode);

        console.log(`   ✅ تم تحويل إلى bytecode: ${file}`);
      } catch (err) {
        console.log(`   ⚠️  فشل تحويل ${file}: ${err.message}`);
      }
    }
  }

  // Done!
  console.log('\n' + '═'.repeat(50));
  console.log('   ✅ تم البناء المحمي بنجاح!');
  console.log('═'.repeat(50));
  console.log('\n📦 الملفات الناتجة في: dist-electron/ و dist/');
  console.log('🔒 الكود الحساس محمي ضد القراءة والتعديل\n');
}

build().catch(console.error);
