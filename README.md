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
thumbsup  → 👍 👍🏻 …   （Slack 形式の名前。abbrev モードで入力する）
+1        → 👍 …
```

- 各絵文字には、日本語名の直訳の読み（例「にっこりわらう」）と、自然な別名（「すまいる」「えがお」など）の両方を登録しています。
- 候補の注釈は日本語名です。
- 肌の色違いは、元の絵文字の後ろにまとめて並べています（例「手を振る（薄い肌色）」）。
- 「ゔ」を含む読みには、「ぶ」表記の読みも自動で追加します。
- Slack 形式の名前（`:thumbsup:` の前後のコロンを除いたもの）も見出し語として登録しています。
  - DDSKK では abbrev モード（`/` で入る）で入力します。
  - その名前に対応する絵文字が、候補の先頭に来ます。

## 設定例 (DDSKK)

```elisp
;; EUC-JP 版
(add-to-list 'skk-extra-jisyo-list "~/path/to/SKK-JISYO.emoji-ja")
;; UTF-8 版（文字コードを指定する）
(add-to-list 'skk-extra-jisyo-list '("~/path/to/SKK-JISYO.emoji-ja.utf8" . utf-8))
```

## データの構成

辞書は YAML ファイルから生成します。
読みの追加や修正は YAML ファイルに対して行ってください。

```
data/
  meta.yaml            # Unicode Emoji のバージョンと、参照する CLDR の git ref
  emoji/01-smileys-emotion.yaml … 10-flags.yaml   # 絵文字のグループごとのデータ
src/
  update.ts            # Unicode と CLDR から最新データを取得し、YAML に反映する
  build.ts             # YAML から辞書を生成する
  lib/                 # パーサー、EUC-JP エンコーダーなど
tests/
```

YAML の 1 件は次の形式です。

```yaml
  - emoji: 👋
    code: 1F44B              # コードポイント（これが正）
    name: 手を振る            # SKK の注釈（"/" と ";" は使用不可）
    readings:                # 見出し語。重要なものから順に書く
      - てをふる
      - ばいばい
      - またね
    slack: [ wave ]          # Slack 形式の名前（コロンなし）。これも見出し語になる
    en: waving hand          # 以下は update で自動更新される
    since: "0.6"
    subgroup: hand-fingers-open
    keywords: [ あいさつ, さようなら, バイバイ, ハロー, またね, 手, 手を振る ]
    variants: [ 1F44B 1F3FB, 1F44B 1F3FC, 1F44B 1F3FD, 1F44B 1F3FE, 1F44B 1F3FF ]
```

手で編集するのは `name` と `readings` だけです。
それ以外の項目は `update` を実行すると上書きされます。

`slack` は [iamcal/emoji-data](https://github.com/iamcal/emoji-data)（Slack が使っている絵文字データ）から取得します。
emoji-data は Unicode の新しい版への対応が遅れることがあります。
emoji-data に名前がない絵文字に限り、手で書いた `slack` を `update` 後も残します。
2026 年 9 月時点では、emoji-data が Emoji 17.0 までの対応のため、Emoji 18.0 で追加された 9 件には Slack 形式の名前がありません。

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

### Deno

```sh
deno task update          # Unicode と CLDR の最新データを YAML に反映する
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
2. `review: true` が付いた項目について、`name` と `readings` を見直します。
   見直し終わったら `review` の行を削除してください。
3. `deno task build --strict` が警告なしで終わることを確認します。

`update` のオプションは次のとおりです。

| オプション | 内容 |
| --- | --- |
| `--offline` | `data/sources/` にキャッシュ済みのファイルを使う |
| `--cldr-ref <ref>` | 参照する CLDR の git ref を指定する（既定は `data/meta.yaml` の値。現在は `main`） |
| `--emoji-url <url>` | `emoji-test.txt` の取得元を指定する |
| `--emoji-data-url <url>` | Slack 形式の名前を取得する `emoji.json` の取得元を指定する |

## CI / リリース

- **CI** (`.github/workflows/ci.yml`): push と pull request のたびに次を実行します。
  - Deno でフォーマット、lint、型チェック、テストを行い、`build --strict` で辞書を生成します。
  - Node.js でもコンパイル、テスト、辞書の生成を行います。
  - Deno と Node.js の出力がバイト単位で一致することを確認します。
  - 生成した辞書は Actions のアーティファクトとしてダウンロードできます。
- **リリース** (`.github/workflows/release.yml`): `v*` のタグを push すると、辞書 2 種と `SHA256SUMS` を添付した GitHub Release を作成します。

```sh
git tag v1.0.0
git push origin v1.0.0
```

## データの出典

- 絵文字一覧: [emoji-test.txt](https://unicode.org/Public/emoji/latest/emoji-test.txt)
- Slack 形式の名前: [iamcal/emoji-data](https://github.com/iamcal/emoji-data)（MIT License）
- 日本語名とキーワード: [Unicode CLDR](https://github.com/unicode-org/cldr) の `annotations/ja.xml` と `annotationsDerived/ja.xml`

## 謝辞

この辞書は、uasi さんの [skk-emoji-jisyo](https://github.com/uasi/skk-emoji-jisyo) に着想を得て作りました。
SKK で絵文字を入力するというアイデアと、その先行実装に感謝します。

## ライセンス

MIT License。
絵文字データは Unicode, Inc. の [Terms of Use](https://www.unicode.org/terms_of_use.html) に従います。
