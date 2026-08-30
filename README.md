# tategaki.site

TateGaki（Googleドキュメント向け縦書きアドオン）の公式サイト。GitHub Pages でホストされる静的HTMLサイトです（ビルド不要）。

## 実績数値の更新方法（重要）

サイトや `llms.txt` に載せる **実績数値（お知らせ／累計インストール数／導入組織のドメイン数／
評価／「〜時点」の日付）は [`data/stats.json`](data/stats.json) の1か所だけで管理**しています。
**HTMLを直接書き換えないでください。** ビルドを流すと上書きされます。

数値を更新する手順:

1. [`data/stats.json`](data/stats.json) を編集する。
2. リポジトリ直下で次を実行する:
   ```
   node scripts/build-stats.mjs
   ```
3. 対象ファイル（下表）の実績表記が **一括で更新**される。
4. 変更をコミットして push する。

各ファイルの `<!-- ○○:START -->` ～ `<!-- ○○:END -->` の間だけが自動生成されます。
何度実行しても同じ結果になります（冪等）。文言そのもの（言い回し）を変えたいときは
[`scripts/build-stats.mjs`](scripts/build-stats.mjs) の `render` 関数を編集してください。

### よくある更新

| やりたいこと | 編集する場所 |
| --- | --- |
| お知らせを1件追加する | `milestones` 配列の**末尾**にオブジェクトを1つ追記（表示は自動で降順） |
| 導入組織のドメイン数を変える | `domainCount` |
| 累計インストール数を変える | `installsLabel` / `installsLabelNum` / `installsLabelEn` の3つ |
| 評価を変える／隠す | `rating` / `showRating` |

### `data/stats.json` の項目

| キー | 意味 | 例 |
| --- | --- | --- |
| `asOf` | 基準月 | `"2026-08"` |
| `asOfLabel` / `asOfLabelEn` | 「〜時点」の表示ラベル | `"2026年8月時点"` / `"As of August 2026"` |
| `installsLabel` | 累計インストール数・和文の概数 | `"3万6千インストール"` |
| `installsLabelNum` | 累計インストール数・数字表記 | `"36,000"` |
| `installsLabelEn` | 累計インストール数・英文 | `"36,000+ installs"` |
| `domainCount` | 導入組織のドメイン数 | `31` |
| `milestones[]` | お知らせ1件（`date` / `dateLabel` / `dateLabelEn` / `label` / `labelEn`） | — |
| `rating` | 評価（★の値） | `"4"` |
| `reviewCount` | レビュー件数（現在は出力に未使用） | `4` |
| `showRating` | 評価を表示するか | `true` / `false` |

### マーカーと反映先

| マーカー | 反映先ファイル | 生成される内容 |
| --- | --- | --- |
| `STATS` | `index.html` / `en/index.html` | トップページの「お知らせ」枠（降順リスト） |
| `STATS` | `llms.txt` / `llms-full.txt` | Performance / 実績 の行 |
| `STATS:ADOPTION` | `llms.txt` / `llms-full.txt` | Adoption / 導入組織 の行 |
| `STATS:ADOPTION` | `admin-setup/index.html` / `en/admin-setup/index.html` | 冒頭の導入実績の一文 |
| `STATS:ADOPTION` | `organization.html` | リード文（累計インストール数・ドメイン数） |
| `STATS:ADOPTION` | `guide/google-docs-tategaki/index.html` | 「累計◯◯インストールを突破」の箇条書き |

> **対外公表してよい数値のみを置くこと。** このリポジトリは public です。組織・学校・企業の
> 実名やドメイン名、GA4 / Search Console / Stripe の分析データ・売上・顧客数などは
> `data/stats.json` を含め一切書かないでください（件数のみ可）。
>
> 日付を必ず添える運用にしているため、数値が古くなっても「〜時点」の事実表記として成立します。

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
