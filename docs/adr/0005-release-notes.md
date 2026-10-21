# ADR 0005: リリースノートを英語で、変更の種類ごとに生成する

ステータス: 採択（未実装）

## 文脈

利用者の運用では、リリースノートについて次のことを決めている。

- リリースノートは英語で、GitHub Releases に書く
- 変更点を「追加」「変更」「削除」「修正」などの項目に分ける。必要ならほかの項目も足す
- 可能であれば、各変更にコミット（または PR）と ADR を添える。ADR のリンクは絶対リンクにする
- `v` で始まるタグはリリースの対象で、`v0.0.1-rc` のようなタグはプレリリースにする

今のリリースのワークフロー（`.github/workflows/release.yml`）は、次のようにリリースノートを作っている。どれも運用の規則に合わない。

- 冒頭に、配布物の説明を日本語で書く
- 続けて、GitHub が生成する変更の一覧（`gh release create --generate-notes`）を付ける。PR を使わずに main にマージしているので、ほとんど中身が無い
- タグに `-` が含まれていても、プレリリースにしない

姉妹のリポジトリの SKK-JISYO.kaomoji は、`scripts/release_notes.ts` でコミットの件名から英語のリリースノートを作っている（v0.2.0 のリリースノートなど）。
このリポジトリも同じ形にする。

利用者の指示により、この ADR を実装した後のリリースから新しい形にする。既にあるリリース（v0.1.0〜v0.1.5）のリリースノートは直さない。

## 実装すること

### リリースノートの形

```markdown
## v0.2.0

Changes since [v0.1.5](https://github.com/<owner>/<repo>/releases/tag/v0.1.5).

### Added

- Add !-prefixed headwords that list only emoji ([ADR 0002](https://github.com/<owner>/<repo>/blob/v0.2.0/docs/adr/0002-bang-prefixed-headwords.md)) ([9055bf4](https://github.com/<owner>/<repo>/commit/<SHA>))

### Changed

- ...

### Dictionary

- Unicode Emoji 18.0: 3972 emoji
- Headwords: 17324 (UTF-8), 17310 (EUC-JP)

### Files

| File | Description |
|---|---|
| ... | ... |
```

- 見出しは `## <タグ>`
- 冒頭は、前のリリースへの絶対リンクを含む `Changes since <tag>.`。前のリリースが無ければ `First release.`
  - 前のリリースは、GitHub Releases の一覧（下書きを除く）から今回のタグを除き、作成日時が最も新しいもの
- 節は Added、Changed、Removed、Fixed、Dictionary、Files の順にする。中身の無い節は書かない（Dictionary と Files は常に書く）
- 前のリリースから今回のタグまでの、マージを除くコミット（`git log --no-merges`、新しい順）を、件名の最初の単語で分ける

  | 最初の単語（大文字と小文字は区別しない） | 節 |
  |---|---|
  | `Add`、`Introduce`、`Create`、`Support` | Added |
  | `Remove`、`Delete`、`Drop` | Removed |
  | `Fix`、`Correct` | Fixed |
  | それ以外 | Changed |

- 件名が版番号だけのコミット（`v0.1.0`、`v0.1.0-rc1` など）は載せない
- 各行は、件名の後に、短い SHA でコミットへの絶対リンクを付ける。件名の `(#123)` は PR への絶対リンクに、`ADR NNNN` はそのタグの時点の ADR のファイルへの絶対リンクにする。ファイルが見つからない番号はそのまま書く
- Dictionary には、UTF-8 版のヘッダーから Emoji の版と絵文字の数を、2 つの版から見出し語の数（okuri-nasi の行の数）を書く
- Files には、配布物の 7 つを英語で説明する表を書く

### スクリプト

- 純粋な関数を `src/lib/release-notes.ts` に置く。件名の分類（`classify`）、版番号だけの件名の判定（`isVersionBump`）、`git log` の出力の解析（`parseCommits`）、件名のリンク（`linkSubject`）、辞書の数え方（`countDict`）、リリースノートの組み立て（`notes`）
- コマンドを `src/release-notes.ts` に置く。引数は `--tag`、`--repo`（`owner/repo`）、`--commits`（`<SHA>\t<件名>` の行のファイル）、`--utf8`、`--euc`（辞書のファイル）、`--prev-tag`（省略できる）。ADR のファイルは `docs/adr/` から読み、リリースノートを標準出力に書く
- ほかのスクリプトと同じく `node:` のモジュールだけを使い、Deno（`deno task notes`）と、コンパイルした後の Node.js（`npm run notes`）の両方で動かす

### リリースのワークフロー

- `actions/checkout` を `fetch-depth: 0` にする（コミットの範囲を読むため）
- `gh release list` で前のリリースを求め、`git log --no-merges --format='%H%x09%s' <前のタグ>..<今回のタグ>` を `deno task notes` に渡してリリースノートを作る。前のリリースが無ければ、今回のタグまでのすべてのコミットを使う
- `gh release create` に `--notes-file` で渡す。`--generate-notes` は使わない
- タグに `-` を含むときは `--prerelease` を付ける
- 手動実行（`workflow_dispatch`）をやめ、`v` で始まるタグの push だけで動かす。リリースノートはタグまでのコミットの範囲から作るので、タグが要る
- リリースの題名は今までどおり `<タグ> (Emoji <版>)` にする

### 文書

- `docs/specifications.md` の「CI とリリース」に、リリースノートの形と作り方を書く。コミットの件名の最初の単語がリリースノートの節を決めることも書く。ADR の一覧に足す
- `README.md` の「CI / リリース」に、リリースノートは英語でコミットから作られることと、`-` を含むタグはプレリリースになることを書く

## 実装しないこと

- 既にあるリリース（v0.1.0〜v0.1.5）のリリースノートの書き直し（利用者の指示）
- CHANGELOG のファイル。リリースノートは GitHub Releases にだけ書く
- コミットの件名の書き方を強制する仕組み（commit-msg の hook など）。件名を英語の命令形で書く今の慣習に頼る
- コミットの本文や PR の説明からの抜き出し
- リリースノートを手で直す仕組み。直す必要があれば、リリースの後に GitHub の画面で直す

## テスト設計

実装の前に次のテストを書いて失敗させてから実装する。

### `tests/release-notes.test.ts`（`deno task test`、`npm test`）

1. `classify`: `Add x`、`introduce x`、`Create x`、`Support x` は Added、`Remove x`、`Delete x`、`Drop x` は Removed、`Fix x`、`Correct x` は Fixed、`Rename x`、`Include x`、`Merge x` は Changed
2. `isVersionBump`: `v0.1.0`、`v0.1.0-rc1` は真、`v0.1.0 release`、`Update to v0.1.0` は偽
3. `parseCommits`: `<SHA>\t<件名>` の行を読み、空行を無視する。件名にタブがあっても最初のタブで分ける
4. `linkSubject`: `(#12)` が PR への絶対リンクに、`ADR 0002` がタグの時点の `docs/adr/0002-....md` への絶対リンクになる。ファイルが無い番号（`ADR 0099`）はそのまま残る
5. `notes`: 前のタグがあるときは `Changes since [v0.1.5](.../releases/tag/v0.1.5).`、無いときは `First release.` で始まる
6. `notes`: 中身の無い節（例えば Removed）は書かず、Dictionary と Files は常に書く。節の順は Added、Changed、Removed、Fixed、Dictionary、Files
7. `notes`: 版番号だけのコミットを載せない。ほかのコミットは渡された順に並べる
8. `countDict`: 小さな辞書のヘッダーから Emoji の版と絵文字の数を読み、okuri-nasi の行の数を数える（`;` で始まる行を数えない）

### 実装の後に実際に動かして確かめること

1. 手元で、`v0.1.5` から `HEAD` までのコミットと、生成した辞書でリリースノートを作り、形が「リリースノートの形」と合っている
2. 同じことを `npm run notes` でも行い、Deno と同じ出力になる
3. `.github/workflows/release.yml` が YAML として読め、`actionlint` が警告を出さない
4. 次のタグの push で、リリースノートが英語の新しい形になり、`-` を含むタグならプレリリースになる

## トレードオフ

- リリースノートの質は、コミットの件名に左右される。件名の最初の単語で節を決めるので、`Update` や `Rename` で始まる件名は、追加でも Changed に入る。SKK-JISYO.kaomoji と同じ単純な規則にし、件名の書き方で合わせる
- 手動実行をやめるので、タグを付けずにリリースを作ることはできなくなる。運用の規則で、`v` で始まるタグがリリースの対象と決まっているので、困らないと判断した
- 既にあるリリースのリリースノートは日本語と GitHub の生成した一覧のまま残り、形がそろわない。利用者の指示に従う
- SKK-JISYO.kaomoji のスクリプトと同じ働きのコードを、このリポジトリにも持つ。2 つのリポジトリは実行環境（Deno だけか、Node.js でも動かすか）と辞書の数え方が違うので、共通のパッケージにはしない

## 参考文献

- SKK-JISYO.kaomoji の `scripts/release_notes.ts`（コミット 47cb574）: https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/scripts/release_notes.ts
- SKK-JISYO.kaomoji の `.github/workflows/release.yml`（コミット 47cb574）: https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/.github/workflows/release.yml
- SKK-JISYO.kaomoji v0.2.0 のリリースノート: https://github.com/tett23/SKK-JISYO.kaomoji/releases/tag/v0.2.0
- GitHub CLI `gh release create`: https://cli.github.com/manual/gh_release_create
