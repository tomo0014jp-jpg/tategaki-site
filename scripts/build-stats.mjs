#!/usr/bin/env node
/*
 * build-stats.mjs — 実績数値の一元管理（single source of truth）
 *
 * 使い方 / How to update:
 *   1. data/stats.json の数値・日付を編集する
 *      - お知らせを1件追加する → milestones 配列の末尾にオブジェクトを1つ追記
 *      - 導入組織のドメイン数    → domainCount
 *      - 累計インストール数      → installsLabel / installsLabelNum / installsLabelEn
 *   2. リポジトリ直下で `node scripts/build-stats.mjs` を実行する
 *   3. 対象ファイルの実績表記が一括で更新される
 *   4. 変更をコミットする
 *
 * 各ファイルの名前付きマーカーの間だけを再生成します。
 * 何度実行しても同じ結果になります（冪等）。
 *
 *   <!-- STATS:START -->          … トップページのお知らせ枠 / llms の実績行（マイルストーン）
 *   <!-- STATS:ADOPTION:START --> … 導入実績の一文（累計インストール数＋組織ドメイン数＋評価）
 *
 * 表記の文言そのもの（言い回し）を変えたいときは、このファイル内の render 関数を
 * 編集してください。数値・日付だけを変えたいときは data/stats.json のみでOKです。
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

const ms = stats.milestones;
const last = ms[ms.length - 1];
// お知らせ枠は新しいものが上（降順）。stats.json は昇順のまま末尾に1件足せばよい。
const msDesc = [...ms].reverse();

const ratingJa = stats.showRating && stats.rating ? `評価 ★${stats.rating}` : '';
const ratingEn = stats.showRating && stats.rating ? `★${stats.rating} rating` : '';

// ---- トップページのお知らせ枠 (日本語) ----
// 高さ固定＋縦スクロール。最新行だけ <strong> で強調し、評価は最新行に添える。
// お知らせ枠には評価（★）を出さない。評価は llms.txt / admin-setup 側にのみ表示する
// （stats.showRating はそれらの出力に効いているため、フラグは倒さないこと）。
function renderNewsBox(label) {
  const rows = msDesc.map((m, i) => {
    const isLatest = i === 0;
    const text = isLatest ? `<strong>${label.text(m)}</strong>` : label.text(m);
    // nowrap は日付だけに掛ける。本文まで nowrap にすると、
    // 長いラベル（例：「…突破／導入組織 31ドメイン」）が狭い画面で折り返せず
    // 枠からはみ出して読めなくなる。
    return `        <li><span class="nw"><time datetime="${m.date}">${label.date(m)}</time></span>${label.sep}${text}</li>`;
  });
  return [
    `    <div class="news-scroll" role="region" aria-label="${label.aria}" tabindex="0">`,
    '      <p class="news-label">Google Workspace Marketplace</p>',
    '      <ul class="news-list">',
    ...rows,
    '      </ul>',
    '    </div>',
  ].join('\n');
}

function renderIndexJa() {
  return renderNewsBox({
    aria: 'お知らせ一覧',
    sep: ' ',
    date: (m) => m.dateLabel,
    text: (m) => m.label,
  });
}

// ---- トップページのお知らせ枠 (英語) ----
function renderIndexEn() {
  return renderNewsBox({
    aria: 'News list',
    sep: ': ',
    date: (m) => m.dateLabelEn,
    text: (m) => m.labelEn,
  });
}

// ---- 実績行 / テキスト (llms.txt, llms-full.txt) ----
function renderTxt(bold) {
  const chunks = ms.map((m) => `${m.dateLabel} ${m.label}`).join(' → ');
  const rating =
    stats.showRating && stats.rating ? ` / 評価 ★${stats.rating} / rating ${stats.rating}` : '';
  const bullet = bold ? '**Performance / 実績' : 'Performance / 実績';
  const close = bold ? '**' : '';
  return `- ${bullet} (${stats.asOfLabel} / ${stats.asOfLabelEn})${close}: ${chunks}（${stats.installsLabelEn} on Google Workspace Marketplace）${rating}`;
}

// ---- 導入実績の一文（累計インストール数＋組織ドメイン数＋評価） ----
function renderAdoptionTxt(bold) {
  const bullet = bold ? '**Adoption / 導入組織**' : 'Adoption / 導入組織';
  return `- ${bullet}: Used across ${stats.domainCount} organization domains (boards of education, schools, etc.) / ${stats.domainCount}の組織ドメイン（教育委員会・学校等）で導入`;
}

function renderAdoptionAdminJa() {
  const rating = ratingJa ? `（${ratingJa}）` : '';
  return `  <p class="trust">TateGaki は累計${stats.installsLabelNum}インストールを超え、${stats.domainCount}組織ドメインでの導入実績があります${rating}。</p>`;
}

function renderAdoptionAdminEn() {
  const rating = ratingEn ? ` (${ratingEn})` : '';
  return `  <p class="trust">TateGaki has surpassed ${stats.installsLabelNum} cumulative installs, with adoption across ${stats.domainCount} organization domains${rating}.</p>`;
}

function renderAdoptionOrg() {
  return `  <p class="subtitle lead">TateGakiは全国の学校・教育委員会を中心に、累計${stats.installsLabel}超・${stats.domainCount}組織ドメインでご利用いただいています。組織でのご利用には、クレジットカード不要の請求書払いに対応しています。</p>`;
}

function renderAdoptionGuide() {
  return `      <li>2026年4月公開、累計${stats.installsLabelNum}インストールを突破</li>`;
}

// file: 対象ファイル / marker: マーカー名 / render: 生成関数
const BLOCKS = [
  { file: 'index.html', marker: 'STATS', render: renderIndexJa },
  { file: 'en/index.html', marker: 'STATS', render: renderIndexEn },
  { file: 'llms.txt', marker: 'STATS', render: () => renderTxt(true) },
  { file: 'llms-full.txt', marker: 'STATS', render: () => renderTxt(false) },

  { file: 'llms.txt', marker: 'STATS:ADOPTION', render: () => renderAdoptionTxt(true) },
  { file: 'llms-full.txt', marker: 'STATS:ADOPTION', render: () => renderAdoptionTxt(false) },
  { file: 'admin-setup/index.html', marker: 'STATS:ADOPTION', render: renderAdoptionAdminJa },
  { file: 'en/admin-setup/index.html', marker: 'STATS:ADOPTION', render: renderAdoptionAdminEn },
  { file: 'organization.html', marker: 'STATS:ADOPTION', render: renderAdoptionOrg },
  {
    file: 'guide/google-docs-tategaki/index.html',
    marker: 'STATS:ADOPTION',
    render: renderAdoptionGuide,
  },
];

let changed = 0;
let missing = 0;
const touched = new Map();

for (const b of BLOCKS) {
  const path = resolve(root, b.file);
  const src = touched.has(b.file) ? touched.get(b.file) : readFileSync(path, 'utf8');

  const START = `<!-- ${b.marker}:START -->`;
  const END = `<!-- ${b.marker}:END -->`;

  const startIdx = src.indexOf(START);
  const endIdx = src.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.warn(`  ! ${b.file} [${b.marker}]: マーカーが見つかりません（スキップ）`);
    missing++;
    continue;
  }

  const lineStart = src.lastIndexOf('\n', startIdx) + 1;
  const indent = src.slice(lineStart, startIdx).match(/^\s*/)[0];

  const before = src.slice(0, startIdx + START.length);
  const after = src.slice(endIdx);
  const block = `\n${b.render()}\n${indent}`;

  touched.set(b.file, `${before}${block}${after}`);
}

for (const [file, next] of touched) {
  const path = resolve(root, file);
  const current = readFileSync(path, 'utf8');
  if (next !== current) {
    writeFileSync(path, next);
    console.log(`  ✓ ${file} を更新しました`);
    changed++;
  } else {
    console.log(`  = ${file} は変更なし`);
  }
}

console.log(
  `\n完了: ${changed} ファイル更新 / ${missing} マーカー未検出` +
    `\n  マイルストーン: ${ms.map((m) => `${m.dateLabel}:${m.label}`).join(' → ')}` +
    `\n  導入組織: ${stats.domainCount}ドメイン / 累計: ${stats.installsLabel} / 評価: ★${stats.rating}`
);
