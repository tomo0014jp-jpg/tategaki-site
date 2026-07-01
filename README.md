# tategaki.site

TateGaki（Googleドキュメント向け縦書きアドオン）の公式サイト。GitHub Pages でホストされる静的HTMLサイトです（ビルド不要）。

## 実績数値の更新方法（重要）

サイトや `llms.txt` に載せる **実績数値（ダウンロード数・評価・「〜時点」の日付）は
[`data/stats.json`](data/stats.json) の1か所だけで管理**しています。

数値を更新する手順:

1. [`data/stats.json`](data/stats.json) を編集する（例: `installs` / `installsLabel` / `asOf` / `asOfLabel` / `rating`）。
2. リポジトリ直下で次を実行する:
   ```
   node scripts/build-stats.mjs
   ```
3. `index.html` / `en/index.html` / `llms.txt` / `llms-full.txt` の実績表記が **一括で更新**される。
4. 変更をコミットして push する。

各ファイルの `<!-- STATS:START -->` ～ `<!-- STATS:END -->` の間だけが自動生成されます。
何度実行しても同じ結果になります（冪等）。文言そのもの（言い回し）を変えたいときは
[`scripts/build-stats.mjs`](scripts/build-stats.mjs) の `render` 関数を編集してください。

### `data/stats.json` の項目

| キー | 意味 | 例 |
| --- | --- | --- |
| `asOf` | 基準月（`<time datetime>` に使用） | `"2026-06"` |
| `asOfLabel` / `asOfLabelEn` | 「〜時点」の表示ラベル | `"2026年6月時点"` / `"As of June 2026"` |
| `installs` | 生の件数（llms.txt 用） | `"10,000"` |
| `installsLabel` / `installsLabelEn` | 表示ラベル | `"1万ダウンロード突破"` / `"Over 10,000 installs"` |
| `rating` | 評価（★の値） | `"4.5"` |
| `reviewCount` | レビュー件数（未使用なら `null`） | `null` |
| `showRating` | 評価を表示するか | `true` / `false` |

> 対外表記（PR TIMES 等）との整合が必要な数値です。丸め表現／正確値のどちらを出すかは
> 情報開示ガイドラインに合わせて確定してください。日付を必ず添える運用にしているため、
> 数値が古くなっても「〜時点」の事実表記として成立します。

## ヒーロー背景画像

トップページ（[index.html](index.html) / [en/index.html](en/index.html)）のヒーロー背景は
`images/hero.jpg`（原稿用紙・机まわりの実写）を使用しています。差し替えるときは
**同じパス `images/hero.jpg` に別画像を置くだけ**で両ページに反映されます。文字の可読性は
`.hero` の `background-image` 先頭にある暖色オーバーレイ（`rgba(250,248,245,0.74〜0.86)`）で
担保しているため、暗い写真でも既存の濃い文字色のまま読めます。写真を明るくしたい/暗くしたい
場合はこのオーバーレイの透過値を調整してください。

## 料金表記について

料金（TateGaki Pro / 月額500円・税込）は各HTMLに直接記載しています（利用規約・特商法は
法的表記のため自動生成の対象外）。`llms.txt` / `llms-full.txt` の料金記述もこれに揃えています。
