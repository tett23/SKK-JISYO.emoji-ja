# SKK-JISYO.emoji-ja の仕様

この文書は、その時点の仕様の全体を書く。main では常に最新に保つ。
仕様の変更は ADR（`docs/adr/`）で決め、同じ変更でこの文書と `README.md` も直す。

[ADR 0001](adr/0001-introduce-adr-and-specifications.md) より前（v0.1.0〜v0.1.5）に決めたことは、ADR へのリンクを付けずに書く。経緯は README とコミットの履歴にある。

## ADR の一覧

| ADR | ステータス | 内容 |
|---|---|---|
| [ADR 0001](adr/0001-introduce-adr-and-specifications.md) | 採択 | ADR と仕様書を導入する |
| [ADR 0002](adr/0002-bang-prefixed-headwords.md) | 採択 | `!` を先頭に付けた見出し語で、絵文字だけを候補に出す |
| [ADR 0003](adr/0003-limit-line-length-for-ddskk.md) | 採択 | DDSKK が引けるように、辞書の 1 行の長さに上限を設ける |
| [ADR 0004](adr/0004-update-github-actions.md) | 採択（未実装） | GitHub Actions の actions と Node.js を最新の版にする |
| [ADR 0005](adr/0005-release-notes.md) | 採択（未実装） | リリースノートを英語で、変更の種類ごとに生成する |

## 配布物

| ファイル | 文字コード | 内容 |
|---|---|---|
| `SKK-JISYO.emoji-ja` | EUC-JP | 辞書。候補は `(concat "\UXXXXXXXX")` の Emacs Lisp の式（DDSKK 用） |
| `SKK-JISYO.emoji-ja.utf8` | UTF-8 | 辞書。候補は絵文字そのもの |
| `LICENSE` | | この辞書のライセンス（MIT License）。リポジトリの `LICENSE` の複製 |
| `LICENSE-Unicode.txt` | | emoji-test.txt と CLDR のライセンス（Unicode License V3） |
| `LICENSE-Mozc.txt` | | Mozc のライセンス（BSD 3-Clause License） |
| `LICENSE-emoji-data.txt` | | iamcal/emoji-data のライセンス（MIT License） |
| `SHA256SUMS` | | 上の 6 つの SHA-256（リリースにだけ添付） |

`LICENSE-*.txt` は、冒頭に「辞書のどの部分がそのデータに由来するか」の段落を置き、続けてライセンスの全文を書く。
辞書のヘッダーにも、3 つのデータのライセンスの全文を書く。

## データの出典

| 名前 | 取得元 | 使う項目 |
|---|---|---|
| Unicode の絵文字の一覧 | `https://unicode.org/Public/emoji/latest/emoji-test.txt` | `fully-qualified` と `component` の行の、コードポイント、版（`E<版>`）、英語名、グループ、サブグループ |
| CLDR | `unicode-org/cldr` の `<ref>/common/annotations/ja.xml` と `annotationsDerived/ja.xml` | 日本語名（`type="tts"`）とキーワード。`annotations` を `annotationsDerived` より優先する |
| Mozc | `google/mozc` の `master/src/data/emoji/emoji_data.tsv` | 3 列目の読み |
| iamcal/emoji-data | `iamcal/emoji-data` の `master/emoji.json` | `short_names`（ショートコード） |

- CLDR の `<ref>` は `data/meta.yaml` の `cldr_ref`（現在は `main`）。`update` の `--cldr-ref` で変えられる
- 取得元は固定しない。`update` を実行した時点の最新を取得し、`data/sources/` にキャッシュする（git では管理しない）
- CLDR と Mozc と emoji-data の照合では、コードポイントの `FE0F` を無視する

## YAML のデータ

`data/meta.yaml` と `data/emoji/NN-<グループ>.yaml` が、辞書の元のデータである。辞書は YAML だけから生成する。

### `data/meta.yaml`

| 項目 | 内容 |
|---|---|
| `unicode_emoji_version` | emoji-test.txt の版（例 `"18.0"`） |
| `cldr_ref` | 取得する CLDR の git ref |

### `data/emoji/NN-<グループ>.yaml`

emoji-test.txt のグループごとに 1 つのファイルにする。`NN` はグループの順の 2 桁の連番、`<グループ>` はグループ名を小文字の kebab-case にしたもの。
各ファイルは `group`（グループ名）と `emoji`（絵文字の配列）を持つ。肌の色違いを除く絵文字ごとに、次の項目を持つ。

| 項目 | 書く人 | 内容 |
|---|---|---|
| `emoji` | `update` | 絵文字（読みやすさのため。正は `code`） |
| `code` | `update` | fully-qualified のコードポイント（空白区切りの 16 進数） |
| `name` | 手 | 注釈に出す日本語名 |
| `readings` | 手 | 見出し語。重要なものから順に書く |
| `ime_readings` | `update` | Mozc の読みのうち、`readings` に無いもの |
| `shortcodes` | `update`（手でも書ける） | ショートコード（前後のコロンを除く） |
| `en` | `update` | Unicode の英語名 |
| `since` | `update` | その絵文字が入った Emoji の版 |
| `subgroup` | `update` | サブグループ |
| `keywords` | `update` | CLDR のキーワード（読みを足すときの参考） |
| `variants` | `update` | 肌の色違いのコードポイントの配列 |
| `review` | `update`（手で消す） | `update` が新しく足した絵文字に `true` を付ける。読みを確かめたら消す |

空の配列の項目は書かない（`readings` は空でも書く）。

### `update` の併合の規則

- 絵文字は emoji-test.txt の順に並べ直し、グループごとのファイルに書き直す
- 肌の色違い（肌の色の修飾子を含み、2 つ以上のコードポイントからなるもの）は、emoji-test.txt で直前にある肌の色違いでない絵文字の `variants` に入れる
- 既にある絵文字は、`name`、`readings`、`review` を残す。`emoji`、`en`、`since`、`subgroup`、`keywords`、`variants` は取り直す
- 新しい絵文字は、`name` を CLDR の日本語名（無ければ英語名）にし、`readings` を CLDR の日本語名とキーワードのうちカナだけで書かれたものをひらがなにした読みにし、`review: true` を付ける
- `shortcodes` は emoji-data から取り直す。emoji-data にその絵文字が無いときに限り、既にある値を残す
- `ime_readings` は Mozc から取り直し、`readings` にある読みを除く。Mozc にその絵文字が無いときに限り、既にある値を残す
- emoji-test.txt から消えた絵文字は、警告を出して元のグループの末尾に残す
- `data/meta.yaml` の `unicode_emoji_version` と `cldr_ref` を書き直す

### Mozc の読みの正規化

NFKC 正規化、カタカナからひらがなへの変換、英字の小文字化をしたあと、見出し語の規則（「見出し語」）に合うものだけを残す。
合わないもの（`11:30`、`upまーく` など）は捨てる。

## 見出し語

見出し語は送り仮名の無いもの（okuri-nasi）だけを作る。次の 3 つから作る。

| 元 | 規則 |
|---|---|
| `readings`、`ime_readings` | ひらがなと `ー`（先頭に数字を付けてもよい。例 `12じ`）、または小文字の英数字だけ（例 `ok`、`sos`） |
| `shortcodes` | 小文字の英数字と `_`、`+`、`-`（例 `thumbsup`、`+1`） |

- 規則に合わない値は、警告を出して見出し語にしない
- `ゔ` を含む読みには、`ゔぁ`→`ば`、`ゔぃ`→`び`、`ゔぇ`→`べ`、`ゔぉ`→`ぼ`、`ゔ`→`ぶ` にした読みも足す
- EUC-JP 版では、EUC-JP で表せない見出し語（`ゔ` を含むもの）を出力しない
- すべての見出し語 `r` について、先頭に半角の `!` を付けた見出し語 `!r` も作り、`r` と同じ候補を同じ順に並べる（[ADR 0002](adr/0002-bang-prefixed-headwords.md)）。
  ほかの辞書には `!` に読みが続く見出し語が無いので、`!` を付けて変換すると絵文字だけが並ぶ
  - かな、数字とかな、英数字（ショートコードを含む）のすべての見出し語が対象である
  - `!` は辞書を出力する直前に足す（`withBangHeadwords`）。YAML の `readings`、`ime_readings`、`shortcodes` には書かない（書けば規則に合わない値として警告にする）
  - 全角の `！` を付けた見出し語は作らない
  - `!`（`0x21`）は、どちらの版のバイト順でも、ほかのすべての見出し語より前に並ぶ
  - SKK-JISYO.kaomoji も同じ `!` を使う。両方の辞書を使うと、重なる見出し語（`!あせ` など）では顔文字と絵文字の両方が並ぶ
  - DDSKK と AquaSKK では、かなの見出し語は `Q` で▽モードを始めて `!` と読みを、英数字の見出し語は abbrev モードで `!` に続けて入力する。skkeleton は `!` を全角の `！` に変えるので引けない。libskk と macSKK は確かめていない

## 候補の並び順

1 つの見出し語の候補は、次の順に並べる。

1. その見出し語の順位が高い絵文字から順に並べる。順位は、ショートコード、`readings` の 1 つ目、2 つ目……、`ime_readings` の順に低くなる。`ime_readings` は Mozc の読みの並びに意味が無いので、すべて同じ順位にする
2. 順位が同じ絵文字は、YAML の順（emoji-test.txt の順）に並べる
3. 肌の色違いを、すべての絵文字の後ろに、元の絵文字の順に並べる

行が長すぎる見出し語では、この並びの末尾から候補を外す（「行の長さ」）。

## 候補の書き方

- UTF-8 版: `絵文字;注釈`
- EUC-JP 版: `(concat "...");注釈`。絵文字の英数字はそのまま書き、それ以外の文字を `\uXXXX`（BMP の外は `\UXXXXXXXX`）にする。この式を評価するのは DDSKK だけである
- 注釈は `name`。`/` は `／`、`;` は `；` にする。肌の色違いは `name（薄い肌色・濃い肌色）` のように肌の色を付ける
- EUC-JP 版の注釈で EUC-JP で表せない文字は `?` にする。EUC-JP の符号化は、WHATWG の EUC-JP の対応表（JIS X 0208 の標準の行と JIS X 0212 と半角カナ）に、`〜`、`‖`、`−`、`¢`、`£`、`¬`、`—` を同じバイト列に符号化する別名を足したものである

## 辞書の形式

- 1 行目は `;; -*- mode: fundamental; coding: <utf-8|euc-jp> -*-`
- ヘッダーのコメントに、辞書名、Emoji の版と絵文字の数（肌の色違いを含む）、この辞書の著作権表示とライセンス、Unicode、Mozc、emoji-data のライセンスの全文を書く
- `;; okuri-ari entries.`（空）と `;; okuri-nasi entries.` の節を置く
- 見出し語は、それぞれの文字コードのバイト列の昇順に並べる

## 行の長さ

[ADR 0003](adr/0003-limit-line-length-for-ddskk.md) による。

DDSKK の二分探索（`skk-search-jisyo`、`limit` 10000）は、範囲の先頭の行が 5,000 文字以上あると、その後ろの見出し語を見落とす。
そのため、EUC-JP 版のどの行も 4,000 文字（`MAX_LINE_LENGTH`）以下にする。

- 行の長さは、EUC-JP 版の行（見出し語、空白、`/`、`(concat "...")`、`;`、注釈、`/`）の文字数で、改行を含めない（`eucLineLength`）。上限と比べるのは、`!` を付けた見出し語の行の長さである
- 上限を超える行は、候補を末尾から外す（`limitLineLength`）。末尾には、肌の色違い、次に `ime_readings` だけで当たった絵文字が並ぶので、重要度の低いものから外れる
  - その絵文字がほかの行に残っていなければ外さず、1 つ前の候補に進む。どの絵文字（肌の色違いを含む）も、少なくとも 1 つの行に残る
  - 見出し語は UTF-8 のバイト順に処理する
  - 外せる候補が無くなっても上限を超える行があれば、`build` は失敗する
- `collect` の結果を `limitLineLength` に通し、その結果に `!` の付いた見出し語を足してから、2 つの版を出力する。UTF-8 版も同じ候補である
- `build` は、候補を外した見出し語の数と、外した候補の数を表示する（2026-10-22 のデータで、54 個の見出し語から 5,472 候補）

## 既知の問題

なし。

[ADR 0003](adr/0003-limit-line-length-for-ddskk.md) より前は、DDSKK で EUC-JP 版の一部の見出し語を引けなかった（v0.1.5 で 8,655 個中 1,159 個、[ADR 0002](adr/0002-bang-prefixed-headwords.md) の実装の後で 17,310 個中 2,317 個）。
[ADR 0002](adr/0002-bang-prefixed-headwords.md) の実装のときにこの文書に書いた数（1,242、2,483）は、DDSKK の数値変換による見かけの失敗を含んでいた。

## 生成と更新

| 処理 | Deno | Node.js |
|---|---|---|
| データの取得と YAML への反映 | `deno task update` | `npm run update` |
| 辞書の生成（`dist/`） | `deno task build` | `npm run build` |
| テスト | `deno task test` | `npm test` |

- Node.js では、先に `npm run compile` で TypeScript を `dist-js/` にコンパイルする
- `build` が表示する見出し語の数は、`!` の付いた見出し語を含めた okuri-nasi の行の数である（UTF-8 版と EUC-JP 版のそれぞれ）
- `build --strict` は、警告（確認待ちの絵文字、規則に合わない値、読みの無い絵文字）が 1 つでもあれば失敗する
- `build` は、辞書のほかに `LICENSE`（リポジトリのものの複製）と `LICENSE-*.txt` を `dist/` に書く
- 依存するパッケージは `yaml` だけである。EUC-JP の符号化は、実行環境の `TextDecoder` から対応表を作って行う

## CI とリリース

### CI（`.github/workflows/ci.yml`）

push（main）、pull request、手動実行で動く。

| ジョブ | 内容 |
|---|---|
| `deno` | `deno fmt --check`、`deno lint`、`deno check`、`deno task test`、`deno task build --strict`。生成物をアーティファクトにする |
| `node` | `npm ci`、`npm run compile`、`npm test`、`npm run build -- --strict`。`deno` ジョブの生成物とバイト単位で一致するかを確かめる |
| `adr` | adr-guard（`tett23/adr-guard@v0.8.3`）でコミット済みの ADR が変わっていないかを確かめる（[ADR 0001](adr/0001-introduce-adr-and-specifications.md)）。確かめるコミットの範囲が無い手動実行では動かさない |

### リリース（`.github/workflows/release.yml`）

- `v` で始まるタグの push、または手動実行（タグを入力）で動く
- `deno task test` と `deno task build --strict` を実行し、`SHA256SUMS` を作り、配布物の 7 つを添付した GitHub Release を作る
- リリースノートは、配布物の説明と、GitHub が生成する変更の一覧（`--generate-notes`）である

## ADR の運用

[ADR 0001](adr/0001-introduce-adr-and-specifications.md) による。

- ADR は `docs/adr/` に置き、ファイル名は 4 桁の連番と kebab-case の名前にする
- ADR は作成時点ではコミットせず、人間のレビューを受けてから、ステータスを `採択` にしてコミットする
- 採択したが、まだ実装していない ADR は、ステータスを `採択（未実装）` にする。`adr-guard unimplemented` で一覧できる
- 一度コミットした ADR は、ステータスの行とリンクを除いて変更しない。仕様を変える場合は新しい ADR を作る
- ADR を破棄する場合は、ステータスを `破棄` にし、理由をこの文書に書く
- 仕様を変える ADR を実装するときは、同じ変更でこの文書と `README.md` を直す。この文書から ADR を示すときは、リンクを付ける
- [adr-guard](https://github.com/tett23/adr-guard) で、git の pre-commit hook（`.githooks/pre-commit`）と CI（`adr` ジョブ）の二か所で強制する。clone ごとに `git config core.hooksPath .githooks` を実行する

## ファイル構成

| パス | 内容 |
|---|---|
| `data/meta.yaml` | Emoji の版と CLDR の ref |
| `data/emoji/` | 絵文字ごとの読みなどの元のデータ（グループごとの YAML） |
| `data/sources/` | `update` が取得したデータのキャッシュ（git では管理しない） |
| `src/update.ts` | データの取得と YAML への反映 |
| `src/build.ts` | 辞書とライセンスファイルの生成 |
| `src/lib/emoji-test.ts` | emoji-test.txt の解析 |
| `src/lib/cldr.ts` | CLDR のアノテーションの解析と、Unicode のライセンス |
| `src/lib/mozc.ts` | Mozc の読みの解析と正規化、Mozc のライセンス |
| `src/lib/shortcode.ts` | emoji-data のショートコードの解析と、emoji-data のライセンス |
| `src/lib/kana.ts` | 読みの規則とかなの変換 |
| `src/lib/eucjp.ts` | EUC-JP の符号化 |
| `src/lib/store.ts` | YAML の読み書き |
| `src/lib/skk.ts` | 見出し語と候補の集め方、辞書の出力 |
| `tests/` | テスト（`node:test`。Deno と Node.js の両方で動く） |
| `docs/specifications.md` | この文書 |
| `docs/adr/` | ADR |
| `.githooks/pre-commit` | adr-guard の pre-commit hook |
| `.github/workflows/` | CI とリリース |
