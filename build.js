#!/usr/bin/env node
/**
 * Build script — obfuscate client-side JS before deployment
 * Usage: npm run build (after: npm install javascript-obfuscator --save-dev)
 *
 * This extracts JS from index.html, obfuscates it, and writes index.min.html
 * You can then rename index.min.html → index.html before deploying
 */

const fs = require('fs');
const path = require('path');

try {
  const JavaScriptObfuscator = require('javascript-obfuscator');

  const htmlPath = path.join(__dirname, 'public', 'index.html');
  const outPath = path.join(__dirname, 'public', 'index.html');
  const backupPath = path.join(__dirname, 'public', 'index.backup.html');

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Backup original
  fs.writeFileSync(backupPath, html, 'utf8');
  console.log('✅ Backup saved to index.backup.html');

  // Extract script content
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    console.error('❌ No <script> tag found');
    process.exit(1);
  }

  const originalJS = scriptMatch[1];
  console.log(`📦 Original JS size: ${(originalJS.length / 1024).toFixed(1)}KB`);

  // Obfuscate
  const result = JavaScriptObfuscator.obfuscate(originalJS, {
    compact: true,
    controlFlowFlattening: false, // Keep off for performance
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,
    renameGlobals: false, // Keep false — we use global functions in onclick
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: false,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
  });

  const obfuscatedJS = result.getObfuscatedCode();
  console.log(`🔒 Obfuscated JS size: ${(obfuscatedJS.length / 1024).toFixed(1)}KB`);

  // Replace in HTML
  html = html.replace(/<script>[\s\S]*?<\/script>/, '<script>' + obfuscatedJS + '</script>');
  fs.writeFileSync(outPath, html, 'utf8');

  console.log('✅ Obfuscated index.html written');
  console.log('📋 To restore original: copy index.backup.html → index.html');

} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('❌ javascript-obfuscator not installed.');
    console.log('   Run: npm install javascript-obfuscator --save-dev');
    console.log('   Then: node build.js');
  } else {
    console.error('❌ Error:', e.message);
  }
}
