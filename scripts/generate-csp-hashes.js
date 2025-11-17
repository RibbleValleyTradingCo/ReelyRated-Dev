#!/usr/bin/env node

/**
 * Generate CSP Hashes for Vite Build Output
 *
 * This script scans the dist/index.html file for inline scripts and styles,
 * generates SHA-256 hashes, and updates the CSP policy in vercel.json.
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { parse } from 'node-html-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Generate SHA-256 hash for content
 */
function generateHash(content) {
  const hash = createHash('sha256');
  hash.update(content, 'utf8');
  return `'sha256-${hash.digest('base64')}'`;
}

/**
 * Extract inline scripts and styles from HTML
 */
function extractInlineContent(htmlPath) {
  const html = readFileSync(htmlPath, 'utf-8');
  const root = parse(html);

  const scriptHashes = [];
  const styleHashes = [];

  // Find inline scripts
  const scripts = root.querySelectorAll('script:not([src])');
  scripts.forEach(script => {
    const content = script.text.trim();
    if (content) {
      scriptHashes.push(generateHash(content));
    }
  });

  // Find inline styles
  const styles = root.querySelectorAll('style');
  styles.forEach(style => {
    const content = style.text.trim();
    if (content) {
      styleHashes.push(generateHash(content));
    }
  });

  return { scriptHashes, styleHashes };
}

/**
 * Update vercel.json with CSP hashes
 */
function updateVercelConfig(scriptHashes, styleHashes) {
  const vercelPath = join(projectRoot, 'vercel.json');
  const config = JSON.parse(readFileSync(vercelPath, 'utf-8'));

  // Find CSP header
  const headers = config.headers[0].headers;
  const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');

  if (!cspHeader) {
    console.error('❌ CSP header not found in vercel.json');
    return false;
  }

  // Parse current CSP
  const cspParts = cspHeader.value.split(';').map(p => p.trim());

  // Update script-src
  const scriptSrcIndex = cspParts.findIndex(p => p.startsWith('script-src'));
  if (scriptSrcIndex !== -1) {
    let scriptSrc = 'script-src \'self\'';

    // Add hashes if any inline scripts exist
    if (scriptHashes.length > 0) {
      scriptSrc += ' ' + scriptHashes.join(' ');
      console.log(`✅ Found ${scriptHashes.length} inline script(s), added hashes`);
    } else {
      console.log('✅ No inline scripts found, using strict CSP');
    }

    cspParts[scriptSrcIndex] = scriptSrc;
  }

  // Update style-src
  const styleSrcIndex = cspParts.findIndex(p => p.startsWith('style-src'));
  if (styleSrcIndex !== -1) {
    let styleSrc = 'style-src \'self\'';

    // Add hashes if any inline styles exist
    if (styleHashes.length > 0) {
      styleSrc += ' ' + styleHashes.join(' ');
      console.log(`✅ Found ${styleHashes.length} inline style(s), added hashes`);
    } else {
      // Keep unsafe-inline for Google Fonts and Tailwind
      styleSrc += ' \'unsafe-inline\' https://fonts.googleapis.com';
      console.log('✅ No inline styles found, keeping unsafe-inline for external fonts');
    }

    cspParts[styleSrcIndex] = styleSrc;
  }

  // Rebuild CSP value
  cspHeader.value = cspParts.join('; ');

  // Write updated config
  writeFileSync(vercelPath, JSON.stringify(config, null, 2) + '\n');

  return true;
}

/**
 * Main execution
 */
function main() {
  console.log('🔒 Generating CSP hashes for Vite build...\n');

  const htmlPath = join(projectRoot, 'dist', 'index.html');

  try {
    // Check if dist/index.html exists
    readFileSync(htmlPath);
  } catch (error) {
    console.error('❌ dist/index.html not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Extract inline content
  const { scriptHashes, styleHashes } = extractInlineContent(htmlPath);

  console.log('\n📊 Hash Summary:');
  console.log(`   Inline scripts: ${scriptHashes.length}`);
  console.log(`   Inline styles: ${styleHashes.length}`);

  if (scriptHashes.length > 0) {
    console.log('\n📝 Script Hashes:');
    scriptHashes.forEach((hash, i) => {
      console.log(`   ${i + 1}. ${hash}`);
    });
  }

  if (styleHashes.length > 0) {
    console.log('\n📝 Style Hashes:');
    styleHashes.forEach((hash, i) => {
      console.log(`   ${i + 1}. ${hash}`);
    });
  }

  // Update vercel.json
  console.log('\n🔧 Updating vercel.json...');

  if (updateVercelConfig(scriptHashes, styleHashes)) {
    console.log('✅ vercel.json updated successfully!\n');
    console.log('🎉 CSP hashes generated! Deploy to Vercel to apply changes.\n');
  } else {
    console.error('❌ Failed to update vercel.json\n');
    process.exit(1);
  }
}

main();
