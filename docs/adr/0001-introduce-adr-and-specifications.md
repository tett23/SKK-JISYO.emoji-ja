# ADR 0001: ADR と仕様書を導入する

ステータス: 採択（未実装）

## 文脈

このリポジトリは、ADR も仕様書も無いまま作られた（v0.1.0〜v0.1.5）。
決めたことは、README とコミットの履歴にしか残っていない。

利用者の運用では、次のことを決めている。

- 実装の前に ADR を書き、人間のレビューを受けてから採択する
- コミットした ADR は、ステータスの行を除いて変えない。仕様を変えるときは新しい ADR を書く
- `docs/specifications.md` と `README.md` は、main で常に最新にする
- この規則を [adr-guard](https://github.com/tett23/adr-guard) で強制する

姉妹のリポジトリの [SKK-JISYO.kaomoji](https://github.com/tett23/SKK-JISYO.kaomoji) は、この運用で `docs/adr/` と `docs/specifications.md` を持っている。
このリポジトリも同じ構成にする。

## 実装すること

### ADR

- ADR を `docs/adr/` に置く。ファイル名は、4 桁の連番と、内容を表す kebab-case の名前にする（例: `0001-introduce-adr-and-specifications.md`）
- ADR の節は、ステータス、文脈、実装すること、実装しないこと、テスト設計、トレードオフ、参考文献とする。データ構造やアルゴリズムを変えるときは、その節も立てる
- 採択したが、まだ実装していない ADR は、ステータスを `採択（未実装）` にする

### 仕様書

`docs/specifications.md` を作り、この ADR を実装する時点の仕様の全体を書く。節は次のとおりとする。

| 節 | 内容 |
|---|---|
| ADR の一覧 | ADR へのリンク、ステータス、内容 |
| 配布物 | 辞書 2 種、ライセンスファイル 4 つ、`SHA256SUMS` |
| データの出典 | Unicode（emoji-test.txt）、CLDR、Mozc、iamcal/emoji-data と、それぞれから使う項目 |
| YAML のデータ | `data/meta.yaml` と `data/emoji/*.yaml` の項目、手で書く項目と `update` が書きかえる項目 |
| 見出し語 | 読みの規則、ショートコード、`ime_readings`、`ゔ` から `ぶ` への展開 |
| 候補の並び順 | ショートコード、`readings` の順位、`ime_readings`、Unicode の並び順、肌の色違い |
| 候補の書き方 | UTF-8 版と EUC-JP 版の書き方、注釈 |
| 辞書の形式 | ヘッダー、ライセンスの全文、見出し語の並び順 |
| 生成と更新 | `update` と `build`、`--strict`、Deno と Node.js |
| CI とリリース | CI のジョブ、リリースのワークフロー、添付するファイル |
| ADR の運用 | この ADR で決めること |
| ファイル構成 | 主なファイルとディレクトリ |

- ADR を導入する前に決めたことは、ADR へのリンクを付けずに書く
- 仕様書から ADR を示すときは、必ずリンクを付ける

### adr-guard

adr-guard の README の「リポジトリへの導入」に従う。

- `.githooks/pre-commit` を置き、実行権限を付ける

  ```sh
  #!/bin/sh
  exec adr-guard pre-commit --allow-status --allow-links
  ```

- CI（`.github/workflows/ci.yml`）に、`tett23/adr-guard@v0.8.3` を使う `adr` ジョブを足す。入力は adr-guard の README の例のとおり（`base`、`head`、`allow-status: true`、`allow-links: true`）。このジョブの checkout は `actions/checkout@v7`（`fetch-depth: 0`、`persist-credentials: false`）にする
- Claude Code の hook は、利用者の全体の設定（`~/.claude/settings.json`）で有効なので、このリポジトリには置かない

### README

- 「開発」の節に、clone ごとに `git config core.hooksPath .githooks` を実行することと、adr-guard（v0.8.3）を入れることを書く
- 仕様は `docs/specifications.md` に、決定の記録は `docs/adr/` にあることを書く

## 実装しないこと

- v0.1.0〜v0.1.5 で決めたことを、さかのぼって ADR にすること。ADR は決めた時点の記録であり、後から書くと経緯を作り直した文書になる。決めたことの現状は仕様書に書く
- 既存の CI のジョブ（`deno`、`node`）とリリースのワークフローで使う actions の版や、Node.js の版を変えること。必要なら別の ADR で決める
- このリポジトリへの Claude Code の hook の設定

## テスト設計

設定と文書の変更なので、自動テストは書かない。実装の後に、実際に動かして確かめる。

1. 手元の adr-guard 0.8.3 で、`adr-guard links` と `adr-guard check-status` が終了コード 0 で終わる
2. `git config core.hooksPath .githooks` を設定した一時的な clone で、コミット済みの ADR の本文を変えてコミットしようとすると、pre-commit hook が拒否する。ステータスの行だけの変更は通る
3. `.github/workflows/ci.yml` が YAML として読める
4. push の後、CI の `adr` ジョブが成功する
5. `docs/specifications.md` の内容が、実装の時点の `src/`、`data/`、`.github/workflows/` の動作と食い違わない（読み合わせで確かめる）

## トレードオフ

- ADR を導入する前の決定には ADR が無い。経緯を知りたいときは、README とコミットの履歴を見る必要がある。さかのぼって書くより、現状を仕様書に正確に書くほうを選ぶ
- 仕様書を保守する手間が増える。仕様を変える変更では、ADR、仕様書、README の 3 つを同時に直す必要がある
- CI の `adr` ジョブは adr-guard のリリースのバイナリに依存する。adr-guard の版を上げるときは、新しい ADR で決める（SKK-JISYO.kaomoji と同じ）

## 参考文献

- adr-guard の README（v0.8.3）: https://github.com/tett23/adr-guard/blob/v0.8.3/README.md
- SKK-JISYO.kaomoji の `docs/specifications.md`（コミット 47cb574）: https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/docs/specifications.md
- SKK-JISYO.kaomoji の [adr-guard を v0.8.3 に上げる ADR](https://github.com/tett23/SKK-JISYO.kaomoji/blob/47cb574e53c1ed2316839d51af6e308752910668/docs/adr/0007-update-adr-guard-to-v0.8.3.md)
