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
 *   <!-- PAGES:START -->          … 公開ページ一覧（生成はせず、整合チェックのみ行う）
 *
 * また、実行の最後に「ページ一覧の整合チェック」を行います。
 * sitemap.xml の <loc> と llms.txt / llms-full.txt の PAGES ブロックを突き合わせ、
 * 差分があれば、どのURLがどちら側に無いのかを表示して exit 1 で終了します。
 * ページを追加・削除・URL変更したときは、3ファイルすべてを更新してください。
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

// ---- llms-full.txt のページ本文に埋め込む実績表記（プレーンテキスト版） ----
// HTML ページ本文を Markdown 化して収録しているため、数値を手書きすると
// stats.json の一元管理から外れてしまう。ここでも同じ数値を生成する。
function renderAdoptionOrgTxt() {
  return `TateGakiは全国の学校・教育委員会を中心に、累計${stats.installsLabel}超・${stats.domainCount}組織ドメインでご利用いただいています。組織でのご利用には、クレジットカード不要の請求書払いに対応しています。`;
}

function renderAdoptionAdminTxtJa() {
  const rating = ratingJa ? `（${ratingJa}）` : '';
  return `TateGaki は累計${stats.installsLabelNum}インストールを超え、${stats.domainCount}組織ドメインでの導入実績があります${rating}。`;
}

function renderAdoptionAdminTxtEn() {
  const rating = ratingEn ? ` (${ratingEn})` : '';
  return `TateGaki has surpassed ${stats.installsLabelNum} cumulative installs, with adoption across ${stats.domainCount} organization domains${rating}.`;
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

  // llms-full.txt に収録したページ本文の中の実績表記。
  // 1ファイル内に複数のブロックを置くため、マーカー名を分けている。
  { file: 'llms-full.txt', marker: 'STATS:ADOPTION:ORG', render: renderAdoptionOrgTxt },
  { file: 'llms-full.txt', marker: 'STATS:ADOPTION:ADMIN', render: renderAdoptionAdminTxtJa },
  { file: 'llms-full.txt', marker: 'STATS:ADOPTION:ADMINEN', render: renderAdoptionAdminTxtEn },
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

// ---------------------------------------------------------------------------
// ページ一覧の整合チェック / Pages consistency check
//
// 公開ページの一覧は sitemap.xml・llms.txt・llms-full.txt の3箇所に手書きで
// 存在します。同じ情報を複数箇所に書いている以上、片方だけ更新される事故は
// 必ず起きます（実際に2026-08-30、縦書きガイドと admin-setup 日英の3件が
// llms 側にだけ載っていない状態が発生しました）。
//
// コメントによる注意書きは読み飛ばされれば機能しないため、ここで機械的に
// 突き合わせ、差分があればビルドを異常終了（exit 1）させます。
//
// 対象ブロックは <!-- PAGES:START --> 〜 <!-- PAGES:END --> で囲みます。
// ---------------------------------------------------------------------------

// 正規表現で拾った際に紛れ込む前後の空白や末尾の記号（句読点・閉じ括弧）を落とす。
// 末尾スラッシュの有無は正規化しない（別URLとして扱い、表記を揃えさせる）。
function normalizeUrl(u) {
  return u.trim().replace(/[)\s.,]+$/, '');
}

function readPagesBlock(file) {
  const src = readFileSync(resolve(root, file), 'utf8');
  const START = '<!-- PAGES:START -->';
  const END = '<!-- PAGES:END -->';
  const a = src.indexOf(START);
  const b = src.indexOf(END);
  if (a === -1 || b === -1 || b < a) {
    return null; // マーカー欠落。呼び出し側でエラーにする。
  }
  return src.slice(a + START.length, b);
}

// ブロック中に現れる https://tategaki.site/... をすべて拾う。
// Markdown リンク形式（llms.txt）でも素の URL 形式（llms-full.txt）でも
// 同じ抽出でよいので、記法の違いに依存しない。
function extractUrls(block) {
  const found = block.match(/https:\/\/tategaki\.site[^\s)<>"']*/g) || [];
  return found.map(normalizeUrl);
}

function readSitemapUrls() {
  const src = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
  const locs = [...src.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => normalizeUrl(m[1]));
  return locs;
}

// 重複は「同じページを2行書いてしまった」ケース。差分と同じく事故なので拾う。
function findDuplicates(urls) {
  const seen = new Set();
  const dup = new Set();
  for (const u of urls) {
    if (seen.has(u)) dup.add(u);
    seen.add(u);
  }
  return [...dup];
}

function checkPages() {
  const problems = [];

  const sitemapUrls = readSitemapUrls();
  if (sitemapUrls.length === 0) {
    problems.push('sitemap.xml から <loc> を1件も読み取れませんでした。');
  }
  for (const d of findDuplicates(sitemapUrls)) {
    problems.push(`sitemap.xml に重複した <loc> があります: ${d}`);
  }

  const sitemapSet = new Set(sitemapUrls);

  for (const file of ['llms.txt', 'llms-full.txt']) {
    const block = readPagesBlock(file);
    if (block === null) {
      problems.push(
        `${file}: <!-- PAGES:START --> / <!-- PAGES:END --> マーカーが見つかりません。` +
          `\n      ページ一覧をこのマーカーで囲んでください（整合チェックができません）。`
      );
      continue;
    }

    const urls = extractUrls(block);
    const urlSet = new Set(urls);

    for (const d of findDuplicates(urls)) {
      problems.push(`${file}: ページ一覧に同じURLが2回出てきます: ${d}`);
    }

    // sitemap にあるが llms 側に無い = AI から参照されないページ（機会損失）
    const missingInFile = sitemapUrls.filter((u) => !urlSet.has(u));
    for (const u of missingInFile) {
      problems.push(`${u}\n      → sitemap.xml にはあるが ${file} のページ一覧に【無い】`);
    }

    // llms 側にあるが sitemap に無い = 消したページ・URL変更の取り残し
    const missingInSitemap = urls.filter((u) => !sitemapSet.has(u));
    for (const u of missingInSitemap) {
      problems.push(`${u}\n      → ${file} のページ一覧にはあるが sitemap.xml に【無い】`);
    }
  }

  if (problems.length > 0) {
    console.error('\n' + '─'.repeat(70));
    console.error('✖ ページ一覧の不整合を検出しました / Pages consistency check FAILED');
    console.error('─'.repeat(70));
    for (const p of problems) console.error(`  ・${p}`);
    console.error('─'.repeat(70));
    console.error(
      'sitemap.xml / llms.txt / llms-full.txt のページ一覧は 1:1 で対応させてください。\n' +
        'ページを追加・削除・URL変更したときは3ファイルすべてを更新します。\n'
    );
    process.exit(1);
  }

  console.log(`  ✓ ページ一覧の整合チェック: ${sitemapUrls.length}件が sitemap.xml と一致`);
}

checkPages();
