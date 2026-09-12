import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

export async function ocrBookTitle(imagePath) {
  if (!fs.existsSync(imagePath)) return '';
  const worker = await createWorker('ara');
  const { data: { text } } = await worker.recognize(imagePath);
  await worker.terminate();

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const skip = ['الدكتور', 'نصر', 'أستاذ', 'جامعة', 'ISBN', 'ISSN', 'مركز', 'نشر', 'طبعة', 'كلية'];
  const arabicLines = lines.filter((line) => {
    if (line.length < 8) return false;
    if (!/[\u0600-\u06FF]/.test(line)) return false;
    if (skip.some((s) => line.includes(s))) return false;
    return true;
  });

  if (arabicLines.length === 0) return '';
  // Title often spans 1-2 lines before author block
  return arabicLines.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim();
}

if (process.argv[2]) {
  ocrBookTitle(path.resolve(process.argv[2])).then((t) => {
    console.log(t);
  });
}
