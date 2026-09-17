#!/usr/bin/env node
/**
 * List and delete all blobs under nasr-website/ prefix (old failed upload cleanup).
 *
 * Usage: npm run clear:blob
 * Pass --confirm to actually delete.
 */
import { list, del } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

const PREFIX = 'nasr-website/';

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('Missing BLOB_READ_WRITE_TOKEN in .env');
    process.exit(1);
  }

  const confirm = process.argv.includes('--confirm');
  let cursor;
  const all = [];

  do {
    const result = await list({ prefix: PREFIX, cursor });
    all.push(...result.blobs);
    cursor = result.cursor;
  } while (cursor);

  if (all.length === 0) {
    console.log(`No blobs found with prefix "${PREFIX}"`);
    return;
  }

  let totalSize = 0;
  console.log(`Found ${all.length} blob(s):\n`);
  for (const blob of all) {
    totalSize += blob.size || 0;
    console.log(`  ${blob.pathname} (${((blob.size || 0) / (1024 * 1024)).toFixed(2)} MB)`);
  }
  console.log(`\nTotal: ${(totalSize / (1024 * 1024)).toFixed(1)} MB`);

  if (!confirm) {
    console.log('\nDry run only. Re-run with --confirm to delete all listed blobs.');
    return;
  }

  console.log('\nDeleting...');
  for (let i = 0; i < all.length; i++) {
    await del(all[i].url);
    process.stdout.write(`\r[${i + 1}/${all.length}] deleted`);
  }
  console.log('\n\nAll blobs deleted.');
}

main().catch((err) => {
  console.error('Clear failed:', err.message);
  process.exit(1);
});
