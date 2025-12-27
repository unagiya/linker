# 要件定義書

## はじめに

「Kiroでアプリを作ってみた。」というタイトルのライトニングトーク用スライドを作成します。このプレゼンテーションは、AWS re:Invent2025での体験から始まり、KiroというAIアシスタントを使用してLinkerプラットフォームを開発した経験を共有し、AI支援開発の実際の効果と可能性を聴衆に伝えることを目的とします。

## 用語集

- **Lightning Talk**: 10-15分程度のプレゼンテーション
- **AWS re:Invent**: AWSの年次カンファレンス（2025年版）
- **AWS DevOpsAgent**: AWSの新しいDevOps支援AIエージェント
- **AWS SecurityAgent**: AWSのセキュリティ支援AIエージェント  
- **Datadog Bits AI**: Datadogの新しいAI機能
- **Kiro**: AI支援開発プラットフォーム・IDEアシスタント
- **Linker**: 開発したエンジニアプロフィール共有プラットフォーム
- **Spec**: Kiroの機能仕様書作成機能
- **Property-Based Testing**: プロパティベーステスト手法
- **AI-Assisted Development**: AI支援開発手法
- **Slide Deck**: プレゼンテーション用スライド一式
- **Demo**: 実際のアプリケーションのデモンストレーション

## 要件

### 要件 1: プレゼンテーション構成

**ユーザーストーリー:** 発表者として、聴衆にKiroの価値を効果的に伝えたいので、論理的で魅力的なスライド構成を持ちたい。

#### 受け入れ基準

1. WHEN スライドが表示される THEN Slide System SHALL タイトルスライドから始まり、自己紹介、AWS re:Invent紹介、Kiro導入、開発プロセス、成果、まとめの順序で構成する
2. WHEN 各セクションが表示される THEN Slide System SHALL 明確な見出しと要点を含む
3. WHEN プレゼンテーション全体が進行する THEN Slide System SHALL 10-15分で発表可能な分量に収める
4. WHEN スライドが切り替わる THEN Slide System SHALL 聴衆が理解しやすい流れを維持する
5. WHEN 技術的な内容を説明する THEN Slide System SHALL 非技術者にも理解可能な表現を使用する

### 要件 2: 自己紹介セクション

**ユーザーストーリー:** 発表者として、聴衆に自分の背景と今回の発表の動機を理解してもらいたいので、簡潔で親しみやすい自己紹介を持ちたい。

#### 受け入れ基準

1. WHEN 自己紹介スライドが表示される THEN Slide System SHALL 発表者の名前、職業、専門分野を含む
2. WHEN 背景が説明される THEN Slide System SHALL 発表者の開発経験とAI技術への関心を簡潔に紹介する
3. WHEN 発表の動機が説明される THEN Slide System SHALL なぜKiroを試してみたかの理由を含む
4. WHEN 自己紹介が終了する THEN Slide System SHALL 聴衆との親近感を築いて次のセクションに自然に繋げる

### 要件 3: AWS re:Invent 2025 紹介セクション

**ユーザーストーリー:** 発表者として、AWS re:Invent2025での体験と最新のAI開発トレンドを共有したいので、関連性の高い導入セクションを持ちたい。

#### 受け入れ基準

1. WHEN AWS re:Invent紹介スライドが表示される THEN Slide System SHALL AWS re:Invent2025への参加体験を簡潔に紹介する
2. WHEN AI開発トレンドが説明される THEN Slide System SHALL AWS DevOpsAgent、AWS SecurityAgent、Datadog Bits AIの概要を含む
3. WHEN 各AIツールが紹介される THEN Slide System SHALL それぞれの特徴と開発への影響を簡潔に説明する
4. WHEN re:Inventからの学びが提示される THEN Slide System SHALL AI支援開発の業界トレンドとKiroとの関連性を示す
5. WHEN セクションが終了する THEN Slide System SHALL 「実際にAI支援開発を試してみた」という流れでKiro紹介に繋げる

### 要件 4: Kiro紹介セクション

**ユーザーストーリー:** 発表者として、Kiroについて知らない聴衆にその特徴を理解してもらいたいので、分かりやすいKiro紹介スライドを持ちたい。

#### 受け入れ基準

1. WHEN Kiro紹介スライドが表示される THEN Slide System SHALL Kiroの基本概念（AI支援IDE、スペック駆動開発）を説明する
2. WHEN Kiroの特徴が説明される THEN Slide System SHALL 従来の開発手法との違いを明確に示す
3. WHEN Kiroの機能が紹介される THEN Slide System SHALL Spec機能、プロパティベーステスト、コード生成の主要機能を含む
4. WHEN 聴衆がKiroを理解する THEN Slide System SHALL 「なぜKiroを使うのか」という動機を明確に伝える

### 要件 5: 開発プロセス紹介

**ユーザーストーリー:** 発表者として、実際の開発プロセスを具体的に示したいので、Linker開発の実際の流れを説明するスライドを持ちたい。

#### 受け入れ基準

1. WHEN 開発プロセスが説明される THEN Slide System SHALL 要件定義、設計、実装の各フェーズを含む
2. WHEN 各フェーズが紹介される THEN Slide System SHALL Kiroがどのように支援したかを具体的に示す
3. WHEN Spec機能が説明される THEN Slide System SHALL 要件→設計→タスクの流れを視覚的に表現する
4. WHEN プロパティベーステストが紹介される THEN Slide System SHALL 従来のテスト手法との違いを説明する
5. WHEN 実際のコード例が表示される THEN Slide System SHALL 簡潔で理解しやすいコードスニペットを使用する

### 要件 6: 成果と効果の提示

**ユーザーストーリー:** 発表者として、Kiroを使用した開発の具体的な成果を示したいので、定量的・定性的な効果を説明するスライドを持ちたい。

#### 受け入れ基準

1. WHEN 成果スライドが表示される THEN Slide System SHALL 完成したLinkerアプリケーションの機能を紹介する
2. WHEN 開発効率が説明される THEN Slide System SHALL 従来手法と比較した開発時間の短縮を示す
3. WHEN コード品質が紹介される THEN Slide System SHALL プロパティベーステストによる品質向上を説明する
4. WHEN 実際のアプリが紹介される THEN Slide System SHALL Linkerの主要機能（プロフィール作成、共有、認証）を含む
5. WHEN 技術スタックが表示される THEN Slide System SHALL React、TypeScript、Supabaseなどの使用技術を列挙する

### 要件 7: デモンストレーション

**ユーザーストーリー:** 発表者として、実際に動作するアプリケーションを見せたいので、効果的なデモンストレーション計画を持ちたい。

#### 受け入れ基準

1. WHEN デモセクションが開始される THEN Slide System SHALL 実際のLinkerアプリケーションへのリンクを提供する
2. WHEN デモが実行される THEN Slide System SHALL ユーザー登録からプロフィール作成までの主要フローを含む
3. WHEN デモが進行する THEN Slide System SHALL 3-4分以内で完了可能な内容に絞る
4. WHEN デモが失敗した場合 THEN Slide System SHALL 代替として画面キャプチャやGIFアニメーションを用意する

### 要件 8: 学びと今後の展望

**ユーザーストーリー:** 発表者として、開発を通じて得た学びと今後の可能性を共有したいので、洞察に富んだまとめスライドを持ちたい。

#### 受け入れ基準

1. WHEN 学びセクションが表示される THEN Slide System SHALL AI支援開発の利点と課題を含む
2. WHEN 今後の展望が説明される THEN Slide System SHALL Kiroの可能性と開発者への影響を述べる
3. WHEN まとめが提示される THEN Slide System SHALL 聴衆が次のアクションを取りたくなるような結論を含む
4. WHEN 質疑応答の準備がされる THEN Slide System SHALL よくある質問への回答を準備する

### 要件 9: 視覚的デザイン

**ユーザーストーリー:** 発表者として、聴衆の注意を引く魅力的なスライドを持ちたいので、視覚的に優れたデザインを適用したい。

#### 受け入れ基準

1. WHEN スライドが表示される THEN Slide System SHALL 一貫したデザインテーマを使用する
2. WHEN テキストが表示される THEN Slide System SHALL 読みやすいフォントサイズと色を使用する
3. WHEN 画像やスクリーンショットが含まれる THEN Slide System SHALL 高品質で関連性の高い画像を使用する
4. WHEN コードが表示される THEN Slide System SHALL シンタックスハイライトと適切なフォントを使用する
5. WHEN アニメーションが使用される THEN Slide System SHALL 控えめで効果的なトランジションを適用する

### 要件 10: 技術的実装

**ユーザーストーリー:** 発表者として、様々な環境で確実にプレゼンテーションを実行したいので、技術的に安定したスライドシステムを持ちたい。

#### 受け入れ基準

1. WHEN スライドが作成される THEN Slide System SHALL HTML/CSS/JavaScriptベースの実装を使用する
2. WHEN プレゼンテーションが実行される THEN Slide System SHALL オフラインでも動作可能にする
3. WHEN 異なるデバイスで表示される THEN Slide System SHALL レスポンシブデザインを適用する
4. WHEN キーボード操作が行われる THEN Slide System SHALL 矢印キーやスペースキーでのナビゲーションを提供する
5. WHEN プレゼンテーションが共有される THEN Slide System SHALL 静的ファイルとして配布可能にする

### 要件 11: コンテンツの正確性

**ユーザーストーリー:** 発表者として、正確で信頼性の高い情報を提供したいので、事実に基づいたコンテンツを持ちたい。

#### 受け入れ基準

1. WHEN Linkerの機能が説明される THEN Slide System SHALL 実際に実装された機能のみを紹介する
2. WHEN 開発プロセスが説明される THEN Slide System SHALL 実際に使用したKiroの機能を正確に反映する
3. WHEN 技術的詳細が提示される THEN Slide System SHALL 実装で使用した実際の技術スタックを示す
4. WHEN 成果が報告される THEN Slide System SHALL 測定可能で検証可能な結果を含む
5. WHEN Kiroの機能が説明される THEN Slide System SHALL 現在利用可能な機能に基づいて説明する

### 要件 12: 聴衆エンゲージメント

**ユーザーストーリー:** 発表者として、聴衆の関心を維持し参加を促したいので、インタラクティブで魅力的なプレゼンテーションを持ちたい。

#### 受け入れ基準

1. WHEN プレゼンテーションが開始される THEN Slide System SHALL 聴衆の関心を引く導入を含む
2. WHEN 技術的内容が説明される THEN Slide System SHALL 具体例と実際のコードを使用する
3. WHEN 質問が投げかけられる THEN Slide System SHALL 聴衆の経験に関連する質問を含む
4. WHEN デモが実行される THEN Slide System SHALL 聴衆が結果を予想できるような設定を提供する
5. WHEN まとめが提示される THEN Slide System SHALL 聴衆が行動を起こしたくなるような呼びかけを含む