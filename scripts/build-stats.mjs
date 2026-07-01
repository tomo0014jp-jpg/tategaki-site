#!/usr/bin/env node
/*
 * build-stats.mjs — 実績数値の一元管理（single source of truth）
 *
 * 使い方 / How to update:
 *   1. data/stats.json の数値・日付を編集する
 *      （マイルストーンは milestones 配列。件数の追加・更新はここだけ）
 *   2. リポジトリ直下で `node scripts/build-stats.mjs` を実行する
 *   3. index.html / en/index.html / llms.txt / llms-full.txt の実績表記が一括で更新される
 *   4. 変更をコミットする
 *
 * 各ファイルの <!-- STATS:START --> ～ <!-- STATS:END --> の間だけを再生成します。
 * 何度実行しても同じ結果になります（冪等）。表記の文言を変えたいときは、この
 * ファイル内の render 関数を編集してください（数値・日付だけなら stats.json のみでOK）。
 *
 * HTML 側は各単位を <span class="nw">（white-space:nowrap）で囲むため、
 * 「税込」や日付・件数が途中で改行されません（単位と単位の間だけで折り返す）。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const stats = JSON.parse(readFileSync(resolve(root, 'data/stats.json'), 'utf8'));

const START = '<!-- STATS:START -->';
const END = '<!-- STATS:END -->';
const ms = stats.milestones;
const last = ms[ms.length - 1];

// ---- HTML (日本語) ----
// 常に3行: ラベル / マイルストーン1 / マイルストーン2（＋評価）
function renderIndexJa() {
  const rows = ms.map((m, i) => {
    const strong = i === ms.length - 1;
    const label = strong ? `<strong>${m.label}</strong>` : m.label;
    const rating =
      strong && stats.showRating && stats.rating
        ? ` <span class="nw">評価 <strong>★${stats.rating}</strong></span>`
        : '';
    return `<span class="news-row"><span class="nw"><time datetime="${m.date}">${m.dateLabel}</time> ${label}</span>${rating}</span>`;
  });
  return `<p class="news-item"><span class="news-label">Google Workspace Marketplace</span>${rows.join('')}</p>`;
}

// ---- HTML (English) ----
function renderIndexEn() {
  const rows = ms.map((m, i) => {
    const strong = i === ms.length - 1;
    const label = strong ? `<strong>${m.labelEn}</strong>` : m.labelEn;
    const rating =
      strong && stats.showRating && stats.rating
        ? ` <span class="nw">· <strong>★${stats.rating}</strong> rating</span>`
        : '';
    return `<span class="news-row"><span class="nw"><time datetime="${m.date}">${m.dateLabelEn}</time>: ${label}</span>${rating}</span>`;
  });
  return `<p class="news-item"><span class="news-label">Google Workspace Marketplace</span>${rows.join('')}</p>`;
}

// ---- テキスト (llms) ----
function renderTxt(bold) {
  const chunks = ms.map((m) => `${m.dateLabel} ${m.label}`).join(' → ');
  const rating =
    stats.showRating && stats.rating ? ` / 評価 ★${stats.rating} / rating ${stats.rating}` : '';
  const bullet = bold ? '**Performance / 実績' : 'Performance / 実績';
  const close = bold ? '**' : '';
  return `- ${bullet} (${stats.asOfLabel} / ${stats.asOfLabelEn})${close}: ${chunks}（${last.labelEn} on Google Workspace Marketplace）${rating}`;
}

const targets = [
  { file: 'index.html', render: renderIndexJa },
  { file: 'en/index.html', render: renderIndexEn },
  { file: 'llms.txt', render: () => renderTxt(true) },
  { file: 'llms-full.txt', render: () => renderTxt(false) },
];

let changed = 0;
let missing = 0;

for (const t of targets) {
  const path = resolve(root, t.file);
  const src = readFileSync(path, 'utf8');

  const startIdx = src.indexOf(START);
  const endIdx = src.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.warn(`  ! ${t.file}: STATS マーカーが見つかりません（スキップ）`);
    missing++;
    continue;
  }

  const lineStart = src.lastIndexOf('\n', startIdx) + 1;
  const indent = src.slice(lineStart, startIdx).match(/^\s*/)[0];

  const before = src.slice(0, startIdx + START.length);
  const after = src.slice(endIdx);
  const block = `\n${indent}${t.render()}\n${indent}`;
  const next = `${before}${block}${after}`;

  if (next !== src) {
    writeFileSync(path, next);
    console.log(`  ✓ ${t.file} を更新しました`);
    changed++;
  } else {
    console.log(`  = ${t.file} は変更なし`);
  }
}

console.log(
  `\n完了: ${changed} ファイル更新 / ${missing} マーカー未検出（${ms
    .map((m) => `${m.dateLabel}:${m.label}`)
    .join(' → ')}）`
);
