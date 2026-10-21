# ADR 0004: GitHub Actions の actions と Node.js を最新の版にする

ステータス: 採択

## 文脈

利用者の運用では、GitHub Actions について次のことを決めている。

- actions は、Node 24 以降で動く最新のメジャー版を使う
- Node.js は、常に最新の LTS を使う

このリポジトリの CI（`.github/workflows/ci.yml`）とリリース（`.github/workflows/release.yml`）は、v0.1.0 のころの版のままである。
[ADR 0001](0001-introduce-adr-and-specifications.md) で足した `adr` ジョブだけは新しい版を使っている。

2026-10-22 に、各 action の最新のリリースと、`action.yml` の `runs.using` を調べた。

| action | 今の版 | 今の版の実行環境 | 最新のメジャー版 | 最新の版の実行環境 |
|---|---|---|---|---|
| `actions/checkout` | v5（`adr` ジョブは v7） | node24 | v7（v7.0.1） | node24 |
| `actions/setup-node` | v5 | node24 | v7（v7.1.0） | node24 |
| `actions/upload-artifact` | v4 | **node20** | v7（v7.0.2） | node24 |
| `actions/download-artifact` | v4 | **node20** | v8（v8.0.2） | node24 |
| `denoland/setup-deno` | v2 | node24 | v2（v2.0.5） | node24 |
| `tett23/adr-guard` | v0.8.3 | composite | v0.8.3 | composite |

`upload-artifact@v4` と `download-artifact@v4` は Node 20 で動き、運用の規則に合わない。

### メジャー版の間の変更

このリポジトリの使い方に関係するものを調べた。

- `actions/checkout` v6、v7: 入力の変更は無い
- `actions/setup-node` v6: 自動のキャッシュを npm だけにした。このリポジトリは `cache: npm` を明示しているので影響しない。v7: ESM への移行と出力の追加で、入力の変更は無い
- `actions/upload-artifact` v5〜v7: Node 24 への移行。入力の変更は無い
- `actions/download-artifact` v5: ID で指定した 1 つのアーティファクトの展開先が変わった。このリポジトリは名前（`name: dictionaries`）で指定するので影響しない。v8: ダウンロードしたファイルのハッシュが合わないとき、警告ではなく失敗にする。正しい動きなので、そのまま受け入れる

### Node.js の LTS

2026-10-22 の時点の最新の LTS は Node.js 24（v24.22.1、Krypton）である。Node.js 26 はまだ LTS ではない。
CI の `node` ジョブは `node-version: 24` を指定しており、今は最新の LTS と同じだが、Node.js 26 が LTS になると古くなる。

## 実装すること

### actions の版

`.github/workflows/ci.yml` と `.github/workflows/release.yml` の actions を、次のメジャー版にする。

| action | 版 |
|---|---|
| `actions/checkout` | `v7` |
| `actions/setup-node` | `v7` |
| `actions/upload-artifact` | `v7` |
| `actions/download-artifact` | `v8` |
| `denoland/setup-deno` | `v2`（変えない） |
| `tett23/adr-guard` | `v0.8.3`（変えない） |

入力は変えない。

### Node.js の版

- CI の `node` ジョブの `actions/setup-node` を `node-version: lts/*` にする。最新の LTS を、ワークフローを書きかえずに使い続けるためである
- `package.json` の `engines`（`node >=22`）は変えない。利用者の手元では、LTS の 1 つ前でも動くことを許す

### 文書

- `docs/specifications.md` の「CI とリリース」に、使う actions の版と、Node.js は最新の LTS（`lts/*`）を使うことを書く。ADR の一覧に足す

## 実装しないこと

- Dependabot などで actions の版を自動で上げる仕組み。版を上げるときは、新しい ADR で確かめてから上げる（SKK-JISYO.kaomoji と同じ）
- actions をコミットの SHA で固定すること。adr-guard の README の例と SKK-JISYO.kaomoji に合わせ、タグ（メジャー版）で指定する
- `package.json` の `engines` の変更
- Deno の版の変更（`deno-version: v2.x` のまま）
- ジョブの構成の変更

## テスト設計

設定の変更なので、自動テストは書かない。実装の後に、実際に動かして確かめる。

1. 2 つのワークフローが YAML として読める
2. `actionlint`（Docker のイメージ `rhysd/actionlint`）が、2 つのワークフローに警告を出さない
3. push の後、CI の 3 つのジョブ（Deno、Node.js、ADR）が成功する。Node.js のジョブのログで、`lts/*` が Node.js 24 系に解決されている
4. CI のログに、Node 20 で動く action についての非推奨の警告が出ない
5. 次のタグの push で、リリースのワークフローが成功し、配布物の 7 つが添付される

## トレードオフ

- `lts/*` は、Node.js の新しい LTS が出ると、ワークフローを変えずに CI の Node.js が上がる。CI がいつの間にか新しい版で失敗する可能性があるが、運用の規則（常に最新の LTS）に合うほうを選ぶ。失敗すれば CI で気づける
- actions をメジャー版のタグで指定するので、同じメジャー版の中の更新は自動で入る。SHA で固定するほど再現性は高くないが、運用の手間とのバランスで、adr-guard の README と同じ指定にする
- 版を上げるたびに ADR を書く手間がかかる。版は運用の規則に関わるので、記録を残すほうを選ぶ

## 参考文献

- actions/checkout のリリース: https://github.com/actions/checkout/releases
- actions/setup-node のリリース（v6.0.0、v7.0.0）: https://github.com/actions/setup-node/releases
- actions/upload-artifact のリリース（v5.0.0〜v7.0.2）: https://github.com/actions/upload-artifact/releases
- actions/download-artifact のリリース（v5.0.0、v8.0.0）: https://github.com/actions/download-artifact/releases
- denoland/setup-deno のリリース: https://github.com/denoland/setup-deno/releases
- Node.js のリリースの一覧: https://nodejs.org/dist/index.json
- setup-node の `node-version` の書き方（`lts/*`）: https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md
- actionlint: https://github.com/rhysd/actionlint
