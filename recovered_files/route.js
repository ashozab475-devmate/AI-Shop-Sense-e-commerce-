import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;
const LABELS = [
  'T-shirt/top',
  'Trouser',
  'Pullover',
  'Dress',
  'Coat',
  'Sandal',
  'Shirt',
  'Sneaker',
  'Bag',
  'Ankle boot',
];

function parseNumber(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  if (max !== undefined) return Math.min(parsed, max);
  return parsed;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const split = searchParams.get('split') === 'test' ? 'test' : 'train';
  const limit = parseNumber(searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
  const offset = parseNumber(searchParams.get('offset'), 0);

  const fileName = split === 'test' ? 'fashion-mnist_test.csv' : 'fashion-mnist_train.csv';
  const filePath = path.join(process.cwd(), 'prisma', fileName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Dataset file not found', file: fileName }, { status: 404 });
  }

  try {
    const rows = await new Promise((resolve, reject) => {
      const results = [];
      let index = 0;
      const stream = fs.createReadStream(filePath);
      const parser = stream.pipe(csv({ headers: false, skipLines: 0 }));

      parser
        .on('data', (row) => {
          if (index >= offset && results.length < limit) {
            const values = Object.values(row).map((val) => Number(val));
            const [label, ...pixels] = values;
            results.push({
              id: offset + results.length,
              label,
              labelName: LABELS[label] ?? `Class ${label}`,
              pixels,
            });
          }

          index += 1;

          // Stop streaming once we have enough rows
          if (results.length >= limit) {
            resolve(results);
            stream.destroy();
          }
        })
        .on('end', () => resolve(results))
        .on('close', () => resolve(results))
        .on('error', reject);
    });

    return NextResponse.json({
      data: rows,
      meta: {
        split,
        offset,
        limit,
        count: rows.length,
        hasMore: rows.length === limit,
      },
    });
  } catch (error) {
    console.error('Failed to read Fashion-MNIST CSV:', error);
    return NextResponse.json({ error: 'Failed to load dataset' }, { status: 500 });
  }
}


