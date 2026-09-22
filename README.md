# SKK-JISYO.emoji-ja

Unicode Emoji 18.0 の全絵文字（fully-qualified 3,963 件＋コンポーネント 9 件）を、日本語の読みで変換できる SKK 辞書です。

| ファイル | 文字コード | 候補の形式 |
| --- | --- | --- |
| `SKK-JISYO.emoji-ja.utf8` | UTF-8 | 絵文字そのもの |
| `SKK-JISYO.emoji-ja` | EUC-JP | `(concat "\U0001F600")` 形式の Emacs Lisp 式 |

EUC-JP では絵文字を表現できないため、EUC-JP 版の候補は Emacs Lisp の式にしてあります。
この形式を評価できるのは DDSKK (Emacs) です。
AquaSKK、macSKK、libskk、fcitx5-skk などでは UTF-8 版を使ってください。

## 変換例

```
ぴえん    → 🥺
くさ      → 🌿 😂 🤣
ありがとう → 🙏 🫂 …
にほん    → 🇯🇵 🗾 🎌
てをふる  → 👋 👋🏻 👋🏼 …
```

- 各絵文字には、日本語名の直訳の読み（例「にっこりわらう」）と、自然な別名（「すまいる」「えがお」など）の両方を登録しています。
- 候補の注釈は日本語名です。
- 肌の色が異なるバリエーションは、元の絵文字の後ろにまとめて並べています（例「手を振る（薄い肌色）」）。
- 「ゔ」を含む読みには「ぶ」表記の読みも登録しています。

## 設定例 (DDSKK)

```elisp
;; EUC-JP 版
(add-to-list 'skk-extra-jisyo-list "~/path/to/SKK-JISYO.emoji-ja")
;; UTF-8 版（文字コードを指定する）
(add-to-list 'skk-extra-jisyo-list '("~/path/to/SKK-JISYO.emoji-ja.utf8" . utf-8))
```

## 生成方法

```sh
make fetch    # Unicode emoji-test.txt と CLDR 日本語アノテーションを取得
make extract  # data/emoji-all.json を作成
make build    # 辞書を生成
```

- 絵文字一覧: [emoji-test.txt](https://unicode.org/Public/emoji/latest/emoji-test.txt)
- 日本語名とキーワード: [Unicode CLDR](https://github.com/unicode-org/cldr) の `annotations/ja.xml` と `annotationsDerived/ja.xml`
- 読みと別名: `data/batches/out-*.jsonl`（CLDR の名称とキーワードを基に作成し、手作業で修正できます）

## ライセンス

MIT License。
絵文字データは Unicode, Inc. の [Terms of Use](https://www.unicode.org/terms_of_use.html) に従います。
