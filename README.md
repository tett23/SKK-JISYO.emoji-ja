# SKK-JISYO.emoji-ja

Unicode Emoji 18.0 の全絵文字を、日本語の読みで変換できる SKK 辞書です。
収録数は、通常の絵文字 3,963 件と、肌の色見本などの部品 9 件です。

## ダウンロード

[Releases](../../releases) から辞書をダウンロードしてください。

| ファイル | 文字コード | 候補の書き方 |
| --- | --- | --- |
| `SKK-JISYO.emoji-ja.utf8` | UTF-8 | 絵文字そのもの |
| `SKK-JISYO.emoji-ja` | EUC-JP | `(concat "\U0001F600")` のような Emacs Lisp の式 |

EUC-JP では絵文字を表現できないため、EUC-JP 版の候補は Emacs Lisp の式にしてあります。
この式を評価して絵文字に変換できるのは DDSKK (Emacs) だけです。
AquaSKK、macSKK、libskk、fcitx5-skk などでは UTF-8 版を使ってください。

## 変換例

```
ぴえん    → 🥺
くさ      → 🌿 😂 🤣
ありがとう → 🙏 🫂 …
にほん    → 🇯🇵 🗾 🎌
てをふる  → 👋 👋🏻 👋🏼 …
thumbsup  → 👍 👍🏻 …   （ショートコード。abbrev モードで入力する）
+1        → 👍 …
!ねこ     → 🐈 😺 😸 …  （先頭に ! を付けると絵文字だけが出る）
```

- 各絵文字には、日本語名の直訳の読み（例「にっこりわらう」）と、自然な別名（「すまいる」「えがお」など）の両方を登録しています。
- [Google 日本語入力（Mozc）](https://github.com/google/mozc) の絵文字の読みも取り込んでいます。
  - Mozc の読みは、この辞書で独自に付けた読みより後ろの候補になります。
- 候補の注釈は日本語名です。
- 肌の色違いは、元の絵文字の後ろにまとめて並べています（例「手を振る（薄い肌色）」）。
- 「ゔ」を含む読みには、「ぶ」表記の読みも自動で追加します。
- 絵文字のショートコード（Slack や GitHub などで使われる `:thumbsup:` 形式。前後のコロンは除く）も見出し語として登録しています。
  - DDSKK では abbrev モード（`/` で入る）で入力します。
  - そのショートコードに対応する絵文字が、候補の先頭に来ます。

### `!` を付けて絵文字だけを出す

すべての見出し語に、先頭に半角の `!` を付けた見出し語（`!ねこ`、`!thumbsup` など）があります。
ほかの辞書（SKK-JISYO.L など）には `!` に読みが続く見出し語が無いので、`!` を付けて変換すると、ほかの辞書の語が混ざらず、絵文字だけが並びます。

| 入力 | ほかの辞書と併せたときの候補 |
| --- | --- |
| `Q n e k o SPC`（`ねこ`） | 猫、🐈、😺、… |
| `Q ! n e k o SPC`（`!ねこ`） | 🐈、😺、😸、… |
| `/ o k SPC`（`ok`） | オッケー、オーケー、… |
| `/ ! o k SPC`（`!ok`） | 🆗、👌、🙆、… |

- かなの見出し語は、`Q` で▽モードを始めてから、`!` と読みを入力します
- 英数字の見出し語（ショートコードなど）は、abbrev モード（`/`）で `!` に続けて入力します
- 確かめた実装: DDSKK（`ddskk-17.2_Mena`、Emacs 30.1）、AquaSKK（codefirst/aquaskk のコミット 0e7a88f のエンジン）
- skkeleton は `!` を全角の `！` に変えるので、`!` の付いた見出し語を引けません。libskk（fcitx5-skk、ibus-skk）と macSKK は確かめていません
- [SKK-JISYO.kaomoji](https://github.com/tett23/SKK-JISYO.kaomoji) も同じ `!` を使います。両方の辞書を使うと、`!あせ` などでは顔文字と絵文字の両方が並びます

## 設定例 (DDSKK)

DDSKK では EUC-JP 版を使ってください。

```elisp
(add-to-list 'skk-extra-jisyo-file-list '("~/path/to/SKK-JISYO.emoji-ja" . euc-jp))
```

### 広い意味の読みの候補

`じょせい`、`かっぷる`、`はーと` のように多くの絵文字が当たる読みでは、候補の一部（肌の色違いや、Mozc の読みだけで当たった絵文字）を外しています。
1 行が長すぎると、DDSKK が辞書の一部の見出し語を引けなくなるためです。
外した絵文字も、それぞれの名前の読みなど、ほかの見出し語では引けます。

## データの構成

辞書は YAML ファイルから生成します。
読みの追加や修正は YAML ファイルに対して行ってください。

```
data/
  meta.yaml            # Unicode Emoji のバージョンと、参照する CLDR の git ref
  emoji/01-smileys-emotion.yaml … 10-flags.yaml   # 絵文字のグループごとのデータ
src/
  update.ts            # Unicode、CLDR、Mozc、emoji-data から最新データを取得し、YAML に反映する
  build.ts             # YAML から辞書を生成する
  lib/                 # パーサー、EUC-JP エンコーダーなど
tests/
```

YAML の 1 件は次の形式です。

```yaml
  - emoji: 👋
    code: 1F44B                    # コードポイント（これが正）
    name: 手を振る                  # SKK の注釈（"/" と ";" は使用不可）
    readings:                      # 見出し語。重要なものから順に書く
      - てをふる
      - ばいばい
      - またね
    ime_readings: [ さよなら, て ]  # Mozc の読み（readings にないもの）。これも見出し語になる
    shortcodes: [ wave ]           # ショートコード（コロンなし）。これも見出し語になる
    en: waving hand                # 以下は update で自動更新される
    since: "0.6"
    subgroup: hand-fingers-open
    keywords: [ あいさつ, さようなら, バイバイ, ハロー, またね, 手, 手を振る ]
    variants: [ 1F44B 1F3FB, 1F44B 1F3FC, 1F44B 1F3FD, 1F44B 1F3FE, 1F44B 1F3FF ]
```

手で編集するのは `name` と `readings` だけです。
それ以外の項目は `update` を実行すると上書きされます。

`shortcodes` は [iamcal/emoji-data](https://github.com/iamcal/emoji-data)（Slack などが使っている絵文字データ）から取得します。
emoji-data は Unicode の新しい版への対応が遅れることがあります。
emoji-data に名前がない絵文字に限り、手で書いた `shortcodes` を `update` 後も残します。
2026 年 9 月時点では、emoji-data が Emoji 17.0 までの対応のため、Emoji 18.0 で追加された 9 件にはショートコードがありません。

`ime_readings` は、Mozc の [`src/data/emoji/emoji_data.tsv`](https://github.com/google/mozc/blob/master/src/data/emoji/emoji_data.tsv) から取得します。
- `update` を実行するたびに取り直すので、手で編集しないでください。
- `readings` にすでにある読みは除きます。
- 全角英数字は半角に直します。記号を含む読み（`11:30` など）や、英字とかなが混ざった読み（`upまーく` など）は、SKK の見出し語に向かないので除外します。
- Mozc の読みは五十音順に並んでいて、重要度の順ではありません。そのため辞書では、すべて `readings` より後ろの順位になります。
- 順位を上げたい読みは `readings` にも書いてください。
- 2026 年 9 月時点では、Mozc が Emoji 17.0 までの対応のため、Emoji 18.0 で追加された絵文字には `ime_readings` がありません。

### 読みの付け方

- 使える文字は、ひらがなと長音「ー」です。
  - 数字の後にひらがなを続けても構いません（例 `12じ`）。
  - 英字略語の場合は、小文字の英字と数字だけにします（例 `sos`、`ok`、`atm`）。
- 1 つ目の読みは、`name` をそのまま読んだものにします。
- 2 つ目以降には、日本語として自然な別名を付けます（目安は 3〜8 個）。
  - 対象物の一般名、俗称、ネットスラング、感情の言い方、用途などです。
  - 例: 🙏 → おねがい、ありがとう、いただきます。🥺 → ぴえん。🔥 → えんじょう。
- 国旗には、国名、国の通称、「〇〇のこっき」「〇〇のはた」の読みを付けます。
- 複数の絵文字が同じ読みを持つ場合、候補の順番は次のとおりです。
  1. その読みを、より前（上位）に書いている絵文字
  2. 1 が同じ場合は、Unicode の並び順
  3. 最後に、肌の色違い

## 開発

Deno と Node.js のどちらでも実行できます。

仕様の全体は [docs/specifications.md](docs/specifications.md) に、決定の記録（ADR）は [docs/adr/](docs/adr/) にあります。
仕様を変えるときは、先に ADR を書いてレビューを受け、実装と同じ変更で仕様書と README を直します。

### 準備

ADR の変更を防ぐ [adr-guard](https://github.com/tett23/adr-guard)（v0.8.3）を、adr-guard の README に従って入れます。
そのうえで、clone ごとに git の hook を有効にします。

```sh
git config core.hooksPath .githooks
```

`.githooks/pre-commit` が、コミット済みの ADR の変更（ステータスの行とリンクを除く）を拒否します。
CI の `adr` ジョブも同じ検査をします。

### Deno

```sh
deno task update          # Unicode、CLDR、Mozc、emoji-data の最新データを YAML に反映する
deno task build           # dist/ に辞書を生成する（--strict を付けると警告をエラーにする）
deno task test
```

### Node.js（TypeScript をコンパイルして実行）

```sh
npm ci
npm run compile           # dist-js/ に JS を出力する
npm run update
npm run build
npm test
```

### 新しい絵文字が追加されたとき

1. `deno task update` を実行します。
   新しい絵文字が YAML に追加され、`review: true` が付きます。
   `name` と、カナだけで書かれた CLDR の名称やキーワードから作った読みが、初期値として入ります。
   Mozc が対応済みであれば、`ime_readings` も入ります。見直しの参考にしてください。
2. `review: true` が付いた項目について、`name` と `readings` を見直します。
   見直し終わったら `review` の行を削除してください。
3. `deno task build --strict` が警告なしで終わることを確認します。

`update` のオプションは次のとおりです。

| オプション | 内容 |
| --- | --- |
| `--offline` | `data/sources/` にキャッシュ済みのファイルを使う |
| `--cldr-ref <ref>` | 参照する CLDR の git ref を指定する（既定は `data/meta.yaml` の値。現在は `main`） |
| `--emoji-url <url>` | `emoji-test.txt` の取得元を指定する |
| `--emoji-data-url <url>` | ショートコードを取得する `emoji.json` の取得元を指定する |
| `--mozc-url <url>` | Mozc の読みを取得する `emoji_data.tsv` の取得元を指定する |

## CI / リリース

- **CI** (`.github/workflows/ci.yml`): push と pull request のたびに次を実行します。
  - Deno でフォーマット、lint、型チェック、テストを行い、`build --strict` で辞書を生成します。
  - Node.js でもコンパイル、テスト、辞書の生成を行います。
  - Deno と Node.js の出力がバイト単位で一致することを確認します。
  - adr-guard で、コミット済みの ADR が変わっていないことを確認します。
  - 生成した辞書は Actions のアーティファクトとしてダウンロードできます。
- **リリース** (`.github/workflows/release.yml`): `v*` のタグを push すると、GitHub Release を作成し、次のファイルを添付します。
  - 辞書 2 種
  - ライセンスファイル: `LICENSE`、`LICENSE-Unicode.txt`、`LICENSE-Mozc.txt`、`LICENSE-emoji-data.txt`（`build` が `dist/` に出力する）
  - `SHA256SUMS`

```sh
git tag v1.0.0
git push origin v1.0.0
```

## データの出典

- 絵文字一覧: [emoji-test.txt](https://unicode.org/Public/emoji/latest/emoji-test.txt)（Unicode License V3。著作権表示は下記）
- 読みの一部: [Mozc](https://github.com/google/mozc) の `src/data/emoji/emoji_data.tsv`（BSD 3-Clause License。著作権表示は下記）
- ショートコード: [iamcal/emoji-data](https://github.com/iamcal/emoji-data) の `emoji.json`（MIT License。著作権表示は下記）
- 日本語名とキーワード: [Unicode CLDR](https://github.com/unicode-org/cldr) の `annotations/ja.xml` と `annotationsDerived/ja.xml`（Unicode License V3。著作権表示は下記）

## 謝辞

この辞書は、uasi さんの [skk-emoji-jisyo](https://github.com/uasi/skk-emoji-jisyo) に着想を得て作りました。
SKK で絵文字を入力するというアイデアと、その先行実装に感謝します。

## ライセンス

この辞書（読み、コード、生成スクリプト）は MIT License です。
取り込んでいる第三者のデータには、それぞれ次のライセンスが適用されます。
各ライセンスの著作権表示は、生成した辞書ファイルのヘッダーにも含めています。
また、リリースには `LICENSE-*.txt` として添付しています。

### Unicode

絵文字の一覧（emoji-test.txt）と、日本語名・キーワード（CLDR の annotations）は、Unicode のデータファイルに由来します。
ライセンスは次のとおりです。

```
UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 1991-2026 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.
```

### Mozc

辞書の読みの一部（YAML の `ime_readings`）は、Mozc の `src/data/emoji/emoji_data.tsv` に由来します。
Mozc のライセンスは次のとおりです。

```
Copyright 2010-2018, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.
  * Neither the name of Google Inc. nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### emoji-data

ショートコード（YAML の `shortcodes`）は、iamcal/emoji-data の `emoji.json` に由来します。
emoji-data のライセンスは次のとおりです。

```
The MIT License (MIT)

Copyright (c) 2013 Cal Henderson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
