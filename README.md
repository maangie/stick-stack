# StickStack

StickStack は、棒ミノ（I ミノ）だけが落ちてくる、変則ルールのレトロ風落ち物パズルです。

普通のテトリスと違って出現するミノは 1 種類だけ。いかにも簡単そうに見えますが、棒しか来ないせいで逆に地形調整が難しく、妙な緊張感があります。

## 特徴

- 棒ミノだけが落下
- レトロゲーム機っぽい配色と UI
- キーボード操作に対応
- ハードドロップ機能あり
- ライン消去、スコア、レベル表示あり

## 操作方法

### キーボード

- ← : 左へ移動
- → : 右へ移動
- ↑ : 回転
- ↓ : 1 マス落下
- Space : ハードドロップ
- P : 一時停止
- R : リセット

### 画面上のボタン

画面右側のコントロールパネルからも操作できます。

## 実行方法

### 1. 依存パッケージをインストール

```bash
npm install
```

### 2. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000/stick-stack` を開くとゲームが表示されます。

## スコア仕様

- 通常落下: +10
- ライン消去: 1 ラインにつき +150
- 10 ライン消すごとにレベルアップ
- レベルが上がると落下速度が上昇

## ディレクトリ構成

```
.
├── app/
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # エントリーポイント
├── components/
│   ├── ui/
│   │   ├── badge.tsx      # shadcn/ui Badge
│   │   ├── button.tsx     # shadcn/ui Button
│   │   └── card.tsx       # shadcn/ui Card
│   ├── StickStack.tsx     # ゲーム本体
│   └── StickStackLoader.tsx  # SSR無効化用ラッパー
├── lib/
│   └── utils.ts           # ユーティリティ関数
├── public/                # 静的ファイル
├── components.json        # shadcn/ui 設定
├── next.config.ts         # Next.js 設定
└── package.json
```

## アイデアの出典

このアプリは、Threads の [@yukishiro_byakuya](https://www.threads.com/@yukishiro_byakuya/post/DVshsQPicmd) による次の投稿からインスピレーションを得ています。

> 棒？だけが落ちてくる、テトリスのアプリがあったはずなんだけど、誰か知りませんか？思いつく限りのワードも入れて探してるんですが、出てこんのですよ。

「そのアプリ、自分で作れば？」という発想から StickStack が生まれました。

## 音楽クレジット

- **コロベイニキ**（テトリスのテーマ）
  - 編曲・演奏：Pracchia-78
  - 出典：[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Nikolaj_Alekseevi%C4%8D_Nekrasov_-_Korobeiniki.ogg)
  - ライセンス：パブリックドメイン

## ひとこと

棒しか落ちてこないのに、妙に落ち着かない。
それが StickStack です。
