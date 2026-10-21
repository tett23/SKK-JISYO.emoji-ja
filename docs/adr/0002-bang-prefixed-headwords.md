# ADR 0002: `!` を先頭に付けた見出し語で、絵文字だけを候補に出す

ステータス: 採択（未実装）

## 文脈

この辞書は、ほかの辞書（SKK-JISYO.L など）と併せて使われる。
`はーと` のような読みで変換すると、ほかの辞書の候補（`ハート` など）と絵文字が混ざって並ぶ。
絵文字だけを探したいときに、ほかの辞書の候補を飛ばす手間がかかる。

姉妹の辞書の SKK-JISYO.kaomoji は、すべての読みの先頭に半角の `!` を付けた見出し語（`!にこにこ` など）を作り、その候補を顔文字だけにした（[SKK-JISYO.kaomoji の ADR 0005](https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/docs/adr/0005-bang-prefixed-headwords.md)）。
その ADR は、同じ仕組みを後でこの辞書にも入れることを見越して、マーカーを選んでいる。
この辞書でも、同じマーカー `!` で同じ仕組みを入れる。

### マーカー

マーカーの比べ方は、[SKK-JISYO.kaomoji の ADR 0005](https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/docs/adr/0005-bang-prefixed-headwords.md) の「マーカーの比べ方」に従う。
その ADR は、DDSKK（Emacs 30.1、`ddskk-17.2_Mena`）と AquaSKK（codefirst/aquaskk のコミット 0e7a88f のエンジン）で、`Q` で▽モードを始めてから `!` と読みを入力して引けることを確かめている。
`@`、`?`、`;`、`#`、`>` は入力できないか、DDSKK の特別な文字と重なる。

### この辞書の見出し語

2026-10-22 の辞書（コミット bc37095、v0.1.5 と同じ）の見出し語は、UTF-8 版で 8,662 個ある。

| 種類 | 数 | 例 | 入力の仕方 |
|---|---|---|---|
| ひらがなと `ー` | 6,611 | `はーと`、`ぴえん` | ▽モード |
| 数字とひらがな | 37 | `12じ`、`100てん` | ▽モード |
| 英数字と `_`、`+`、`-` | 2,014 | `thumbsup`、`+1`、`ok`、`100` | abbrev モード |

EUC-JP 版は、EUC-JP で表せない `ゔ` を含む 7 個を除いた 8,655 個である。

### ほかの辞書との重なり

2026-10-22 に、skk-dev/dict（コミット 0a164e6）と SKK-JISYO.kaomoji v0.2.0 の見出し語を調べた。

| 辞書 | `!` で始まる見出し語 | `!` に読みが続く見出し語 | この辞書と重なるかなの見出し語 | この辞書と重なる英数字の見出し語 |
|---|---|---|---|---|
| SKK-JISYO.L | `!`、`!!`、`!=` | 無い | 2,702 | 577（`abacus`、`8ball` など） |
| SKK-JISYO.emoji | `!`、`!!`、`!?` | 無い | 2,191 | 676（`+1`、`abacus` など） |
| SKK-JISYO.jinmei | 無い | 無い | 566 | 0 |
| SKK-JISYO.geo | 無い | 無い | 656 | 0 |
| SKK-JISYO.propernoun | 無い | 無い | 66 | 1（`metro`） |
| SKK-JISYO.station | 無い | 無い | 149 | 0 |
| SKK-JISYO.kaomoji v0.2.0 | 566 個（`!あせ` など） | 566 個 | 225 | 0 |

- skk-dev/dict の辞書には、`!` にひらがな、数字、英字が続く見出し語が無い。`!` を付ければ、これらの辞書の候補は出ない
- 英数字の見出し語も、SKK-JISYO.L と SKK-JISYO.emoji で多く重なる。英数字の見出し語にも `!` を付ける意味がある
- SKK-JISYO.kaomoji とは、かなの見出し語 225 個が重なる。両方の辞書を使うと、`!あせ` などでは顔文字と絵文字が並ぶ

## 実装すること

### `!` の付いた見出し語

- 辞書のすべての見出し語 `r` について、見出し語 `!r` を作る。候補と並び順（肌の色違いも含む）は `r` と同じにする
  - 対象は、ひらがなと `ー` の見出し語、数字とひらがなの見出し語、英数字の見出し語（ショートコードを含む）のすべてである
  - `readings`、`ime_readings`、`shortcodes` のどれから作った見出し語も対象にする。`ゔ` から `ぶ` に展開した見出し語も対象にする
- `!` の付いた見出し語は、辞書を出力する直前に、`src/lib/skk.ts` の純粋な関数 `withBangHeadwords` で足す。`collect` の結果（見出し語と候補）は変えない
  - `withBangHeadwords` は、受け取った `Dictionary` を書きかえず、新しい `Dictionary` を返す
  - `src/build.ts` は、`collect` の結果を `withBangHeadwords` に通してから、2 つの版を出力する
- YAML の `readings`、`ime_readings`、`shortcodes` には `!` を書かない。今の検査（`VALID_READING`、`VALID_SHORTCODE`）が `!` を含む値を受け付けないことを変えない。書けば、今までどおり規則に合わない値として警告にする（`--strict` では失敗する）
- Mozc の読みの正規化（`normalizeMozcReading`）も、今までどおり `!` を含む読みを捨てる
- 全角の `！` を付けた見出し語は作らない
- 並び順は今までどおり、EUC-JP 版は EUC-JP のバイト順、UTF-8 版は UTF-8 のバイト順にする。`!`（`0x21`）は、どちらの版でも、英数字、`+`、`-`、ひらがなより前に並ぶ

### 数え方

- `build` が表示する見出し語の数は、`!` の付いた見出し語を含めた、辞書の okuri-nasi の行の数にする
- 絵文字の数（ヘッダーの `(N emoji)`）は変えない

### 文書

- `docs/specifications.md`（[ADR 0001](0001-introduce-adr-and-specifications.md) で作る）の「見出し語」に `!` の付いた見出し語を書き、ADR の一覧に足す。この ADR は [ADR 0001](0001-introduce-adr-and-specifications.md) の後に実装する
- `README.md` に、次のことを書く
  - `!` を付けて変換すると、絵文字だけが出ること
  - 入力の仕方。かなの見出し語は、DDSKK と AquaSKK では `Q` の後に `!` と読みを入力する。英数字の見出し語は、abbrev モードで `!` に続けて入力する
  - SKK-JISYO.kaomoji と併せて使うと、`!` の付いた見出し語では顔文字と絵文字の両方が出ること
  - 確かめた実装と、確かめていない実装

## 実装しないこと

- 全角の `！` を付けた見出し語。skkeleton など、`!` を `！` に変える実装では、`!` の付いた見出し語を引けない
- 末尾に `!` を付ける形（`はーと!`）
- `!` だけの見出し語。SKK-JISYO.L の `!` などと重なる
- SKK-JISYO.kaomoji と別のマーカーを使うこと。顔文字と絵文字を同じ入力で探せるほうを選ぶ（「トレードオフ」）
- `!` の付いた見出し語だけを収めた別の辞書ファイル
- DDSKK と AquaSKK 以外の実装での確認と、その設定例
- DDSKK の数値変換（`skk-use-numeric-conversion`）と、数字を含む見出し語（`12じ`、`!12じ`）の関係の調査。`!` を付けない見出し語と同じ扱いにする

## テスト設計

実装の前に次のテストを書いて失敗させてから実装する。

### `tests/lib.test.ts`（`deno task test`、`npm test`）

1. `withBangHeadwords`: 見出し語 `くさ`（候補 `🌿`、`😂`）と `てをふる`（候補 `👋`、`👋🏻`）から、`!くさ`、`!てをふる` が同じ候補と並び順で足される。元の見出し語も残る
2. `withBangHeadwords` は、英数字の見出し語（`joy`、`+1`）と数字とひらがなの見出し語（`12じ`）にも `!` を付ける
3. `withBangHeadwords` は、受け取った `Dictionary` の `entries` を書きかえない（新しい値を返す）。`emojiCount` と `warnings` は変えない
4. 出力の並び: UTF-8 版で、`!` で始まる見出し語がすべて、`!` で始まらない見出し語より前に、UTF-8 のバイト順で並ぶ（例: `!+1`、`!joy`、`!くさ`、`+1`、`joy`、`くさ`）。EUC-JP 版でも同じく前に並ぶ
5. `collect`: YAML の `readings` に `!あせ`、`shortcodes` に `!joy` があると、規則に合わない値として警告を出し、見出し語にしない

### `tests/data.test.ts`

6. `data/emoji/*.yaml` の `readings`、`ime_readings`、`shortcodes` に、`!` を含む値が無い

### 実装の後に実際に動かして確かめること

1. 本物の UTF-8 版で、`!` で始まる見出し語の数が、`!` で始まらない見出し語の数と同じになる（2026-10-22 のデータで 8,662 個ずつ）。EUC-JP 版でも同じになる（8,655 個ずつ）
2. Deno と Node.js で生成した辞書が、今までどおりバイト単位で一致する（CI の `node` ジョブ）
3. DDSKK（SKK-JISYO.kaomoji の `Dockerfile` の環境）で、本物の EUC-JP 版を `skk-extra-jisyo-file-list` に入れて、`Q ! h a - t o SPC` が絵文字に変換される
4. 同じ環境で、SKK-JISYO.L と併せて `!はーと` を変換したとき、候補が絵文字だけになる
5. 同じ環境で、abbrev モードで `! t h u m b s u p SPC` が `👍` に変換される
6. 手元の AquaSKK のエンジン（[SKK-JISYO.kaomoji の ADR 0005](https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/docs/adr/0005-bang-prefixed-headwords.md) と同じ方法）で、本物の UTF-8 版を辞書にして、3 と 5 と同じ入力が絵文字に変換される

5 と 6 の abbrev モードで `!` を入力できない実装があれば、その実装では英数字の `!` の付いた見出し語を引けないことを README に書く。辞書からは除かない（ほかの実装の利用者は引ける）。

## トレードオフ

- 辞書がおよそ 2 倍の大きさになる。UTF-8 版は約 1.8 MB から約 3.6 MB に、EUC-JP 版は約 2.4 MB から約 4.7 MB になる。収録する絵文字は増えない
- SKK-JISYO.kaomoji と併せて使うと、重なる 225 個の見出し語（`!あせ`、`!ありがとう` など）では、顔文字と絵文字の両方が出る。`!` は「ほかの辞書の語を除き、顔文字と絵文字だけを出す」という意味になる。
  辞書ごとに別のマーカーにすれば分けられるが、利用者が覚える入力が増え、[SKK-JISYO.kaomoji の ADR 0005](https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/docs/adr/0005-bang-prefixed-headwords.md) で次点だった `：` も全角に変わるなどの癖がある。同じ `!` で揃えるほうを選ぶ
- 英数字の `!` の付いた見出し語（2,014 個、UTF-8 版で約 230 KB）は、abbrev モードで `!` を入力できる実装でしか引けない。SKK-JISYO.L と SKK-JISYO.emoji で重なる英数字の見出し語が多い（577 個と 676 個）ので、引ける実装の利用者には役に立つ。かなの見出し語と規則を分けないほうが単純なので、すべての見出し語に付ける
- skkeleton は▽モードで `!` を全角の `！` に変えるので、`!` の付いた見出し語を引けない。libskk（fcitx5-skk、ibus-skk）と macSKK は確かめていない。
  これらの実装の利用者は、`!` を付けずに引けば、今までどおり絵文字を使える（ほかの辞書の候補と混ざるだけである）
- `!` の付いた見出し語は、この辞書と SKK-JISYO.kaomoji だけが持つことを前提にしている。ほかの辞書が `!` に読みが続く見出し語を持つと、絵文字と顔文字だけにはならない。2026-10-22 の時点の skk-dev/dict には無い
- 先頭に付ける形は、`Q` などで▽モードを始めてから `!` を入力する必要がある。SKK-JISYO.kaomoji と同じ形にし、入力の仕方を揃えるほうを選ぶ

## 参考文献

- SKK-JISYO.kaomoji の [`!` を先頭に付けた見出し語の ADR](https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/docs/adr/0005-bang-prefixed-headwords.md)（コミット 47cb574）
- SKK-JISYO.kaomoji v0.2.0: https://github.com/tett23/SKK-JISYO.kaomoji/releases/tag/v0.2.0
- skk-dev/dict（コミット 0a164e6b990c5eb5b59eb7d8789f08865dc2f644）の `SKK-JISYO.L`、`SKK-JISYO.emoji`、`SKK-JISYO.jinmei`、`SKK-JISYO.geo`、`SKK-JISYO.propernoun`、`SKK-JISYO.station`: https://github.com/skk-dev/dict/tree/0a164e6b990c5eb5b59eb7d8789f08865dc2f644
- AquaSKK（コミット 0e7a88f4713299de2c42c71a088bfe458fc0e3cd）: https://github.com/codefirst/aquaskk/tree/0e7a88f4713299de2c42c71a088bfe458fc0e3cd
- skkeleton `denops/skkeleton/kana/rom_hira.ts`: https://github.com/vim-skk/skkeleton/blob/main/denops/skkeleton/kana/rom_hira.ts
