# ADR 0006: adr-guard を v0.10.0 に上げる

ステータス: 採択

## 文脈

[ADR 0001](0001-introduce-adr-and-specifications.md) は、CI に `tett23/adr-guard@v0.8.3` の `adr` ジョブを置くと決めた。
[ADR 0004](0004-update-github-actions.md) は、actions の版を上げたときも adr-guard は v0.8.3 のままにした。
README も、インストールする adr-guard の版を v0.8.3 と書いている。
adr-guard の版を上げるときは新しい ADR で決める（[ADR 0001](0001-introduce-adr-and-specifications.md) のトレードオフ）。

adr-guard の v0.9.0〜v0.10.0 で、次のものが加わった。

- v0.9.0: `adr-guard check-numbers`。同じディレクトリで番号が重複した ADR を報告する。action は既定でこれを実行し（入力 `check-numbers`）、重複があれば CI が失敗する。重複を直す `adr-guard renumber [--dry-run]` と、`pre-commit` と `check-range` の `--allow-renumber`（action の入力 `allow-renumber`、既定は false）も加わった
- v0.9.1: `renumber` の誤報の修正
- v0.10.0: 修飾子付きの ADR の参照。`ADR NNNN` の直前の語（空白 1 つ）を修飾子とみなす。`/` を含む語はディレクトリ、`-` を含む語はモジュール（`docs/<モジュール>/adr/`）、それ以外の語はそのモジュールが存在するときだけ修飾子になる。`links` と pre-commit は、ディレクトリや ADR が存在しない修飾子付きの参照、リンク先が修飾子の ADR と異なるリンク、リンクの外に出た修飾子を報告する。シンボリックリンクの `.md` は検査しない

このリポジトリはほかのリポジトリの ADR を参照する（`SKK-JISYO.kaomoji の ADR 0005` など）。
`SKK-JISYO.kaomoji` は `-` を含むので、`の` を挟まずに `SKK-JISYO.kaomoji ADR 0005` と書くと、存在しないモジュールの修飾子とみなされて検査が失敗する。
今ある参照は `の` を挟み、リンクのテキストに入れているので、手元の adr-guard 0.10.0 で `adr-guard links` は終了コード 0 で終わる。

## 実装すること

- CI（`.github/workflows/ci.yml` の `adr` ジョブ）の adr-guard の action を `tett23/adr-guard@v0.10.0` にする。ほかの入力は変えない。`check-numbers` は既定（実行する）のままにする
- README の adr-guard の版の記述を v0.10.0 にし、CI の `adr` ジョブが ADR の番号の重複も確かめることを書く
- `docs/specifications.md` を次のように直す
  - 「CI とリリース」の `adr` ジョブの説明と actions の版の表を v0.10.0 にし、番号の重複も確かめることを書く
  - 「ADR の運用」に、ほかのリポジトリの ADR を参照するときは、リポジトリ名を含めたテキストを外部リンクにすることを書く
  - ADR の一覧にこの ADR を足す
- [ADR 0001](0001-introduce-adr-and-specifications.md) と [ADR 0004](0004-update-github-actions.md) のステータスの行に、adr-guard の版はこの ADR によることを足す
- `adr-guard links --fix --include-committed` を実行し、直すものがあれば直す

## 実装しないこと

- `.githooks/pre-commit` のコマンドは変えない（`adr-guard pre-commit --allow-status --allow-links` のまま）。`--allow-renumber` は付けない
- action の `check-numbers: false` と `allow-renumber: true` は付けない
- `docs/<モジュール>/adr/` のようなモジュールの ADR は作らない。このリポジトリの ADR は `docs/adr/` だけである
- 既存の ADR の番号の付けかえ。今は重複がない

## テスト設計

設定と文書の変更なので、自動テストは書かない。実装の後に、実際に動かして確かめる。

1. 手元の adr-guard 0.10.0 で、`adr-guard links`、`adr-guard check-status`、`adr-guard check-numbers` が終了コード 0 で終わる
2. `adr-guard links --fix --include-committed` が、コミット済みのファイルを書きかえない（書きかえたときは、その変更を別のコミットにする）
3. `.github/workflows/ci.yml` が YAML として読める
4. コミットの後、`adr-guard check-range origin/main HEAD --allow-status --allow-links` が終了コード 0 で終わる
5. push の後、CI の `adr` ジョブが v0.10.0 の action で成功する

## トレードオフ

- `check-numbers` を既定のまま動かすので、別々のブランチで同じ番号の ADR を作ると、後からマージしたほうの CI が失敗する。番号の重複は気づくべき誤りなので、止めずに CI で検出するほうを選ぶ
- 修飾子の規則により、ほかのリポジトリの ADR を `<リポジトリ名> ADR NNNN` の形で書けなくなる。リンクのテキストに `の` を挟んで書く今の書き方を続ける
- adr-guard の版を上げるたびに ADR を書く手間がかかる。版は [ADR 0001](0001-introduce-adr-and-specifications.md) で決めたことなので、変えるときは新しい ADR で記録するほうを選ぶ

## 参考文献

- adr-guard v0.9.0 のリリース: https://github.com/tett23/adr-guard/releases/tag/v0.9.0
- adr-guard v0.9.1 のリリース: https://github.com/tett23/adr-guard/releases/tag/v0.9.1
- adr-guard v0.10.0 のリリース: https://github.com/tett23/adr-guard/releases/tag/v0.10.0
- adr-guard の README（v0.10.0）: https://github.com/tett23/adr-guard/blob/v0.10.0/README.md
- adr-guard の ADR「[重複したADRの番号の修復](https://github.com/tett23/adr-guard/blob/main/docs/adr/0018-repair-duplicate-adr-numbers.md)」
- adr-guard の ADR「[モジュールで修飾したADRの参照](https://github.com/tett23/adr-guard/blob/main/docs/adr/0019-module-qualified-adr-references.md)」
- adr-guard の ADR「[シンボリックリンクの文書を飛ばす](https://github.com/tett23/adr-guard/blob/main/docs/adr/0020-skip-symlinked-documents.md)」
