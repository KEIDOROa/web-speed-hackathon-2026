# CaX Scoring Tool

CaX のパフォーマンスを計測し、得点を計算するツールです。
GitHub Actions の計測でも同じツールを使用して採点を行なっています。

## セットアップ

1. [../docs/development.md](../docs/development.md) に記載されているセットアップを実行します
2. 依存パッケージをインストールします
   - ```bash
     pnpm install --frozen-lockfile
     ```

## 使い方

`--applicationUrl` に計測したい URL を与えて実行します

```bash
pnpm start --applicationUrl <applicationUrl>
```

### 計測名一覧を表示する

計測名一覧を表示したい場合は `--targetName` を値なしで指定します

```shell
pnpm start --applicationUrl <applicationUrl> --targetName
```

### 特定の計測だけ実行する

特定の計測だけ実行したい場合は `--targetName` に計測名を指定します

```shell
pnpm start --applicationUrl <applicationUrl> --targetName "投稿"
```

### ユーザーフロー「DM送信」だけ試す

アプリを `http://localhost:3000` で起動したうえで、採点ツールのディレクトリから:

```bash
pnpm run score:dm
```

別の URL で試す場合は `score:dm` の代わりに、計測名の一部 `DM送信` をそのまま使います。

```bash
pnpm start --applicationUrl <applicationUrl> --targetName DM送信
```

（`--targetName` は計測名に**部分一致**します。`DM送信` は `ユーザーフロー: DM送信` にマッチします。）

リポジトリ構成で `application` と `scoring-tool` が隣にある場合は、`application` からも次で同じ計測だけ実行できます。

```bash
pnpm run score:dm
```

### ユーザーフロー計測をまとめて試す

`ユーザーフロー:` で始まる計測名は次の **5 件**です（`--targetName` に共通部分の `ユーザーフロー` を渡すと、これらだけが順に実行されます）。

1. ユーザー登録 → サインアウト → サインイン  
2. DM送信  
3. 検索 → 結果表示  
4. Crok AIチャット  
5. 投稿  

```bash
pnpm run score:user-flow
```

任意の URL の場合:

```bash
pnpm start --applicationUrl <applicationUrl> --targetName ユーザーフロー
```

`application` と `scoring-tool` が隣にある構成なら、`application` から:

```bash
pnpm run score:user-flow
```

## LICENSE

MPL-2.0 by CyberAgent, Inc.
