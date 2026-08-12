# 月相羅針 計算PoC v0.9｜画面デザイン調整版

春華プロジェクトの「月相羅針 Web計算サービス」を技術検証するための、小規模な Flask + Vue 3 Web アプリです。

v0.9では、**v0.8の機能・画面構成・Python計算を維持したまま、iPad Safariで生年月日・出生時間の値が入力欄左上へ寄る表示を修正**しました。

```text
ブラウザ
  ↓
Vue 3（入力・画面制御・結果表示）
  ↓ fetch / JSON
Flask API
  ↓
既存Python計算
  ├─ astronomy.py
  ├─ phase_classifier.py
  └─ location_master.py
```

## 重要

この PoC は、**月相羅針の正式占術仕様を確定するものではありません。**

現在の P01〜P08 は、360°を45°ずつ8等分し、標準的な月相名称とPoC用説明文章を割り当てた技術確認用の仮仕様です。春華独自の正式な月相羅針の ID・名称・角度範囲・境界条件・説明文・特徴・進み方が確定したら、`phase_classifier.py` の定義を差し替える前提です。

また、出生時間不明時の `stable` / `ambiguous` 候補判定も、**PoCの技術検証仕様であり、春華独自の正式な出生時間不明時ルールではありません。**

## v0.9 の変更点

- iPad Safariで生年月日・出生時間の値が入力欄左上へ寄る表示を修正
- `input type="date"` / `input type="time"` の表示値を入力欄中央へ配置
- ネイティブの日付・時刻ピッカーは維持
- 出生地の表示位置・計算ロジック・API・Vue.js構成は変更していません

## v0.8 から維持している画面構成

- トップビューを、春華らしい落ち着いた配色・大きな「月相羅針」タイトル・中央寄せレイアウトへ変更
- 入力カードを、丸型番号＋見出し＋柔らかなカードUIへ変更
- ボタンを主ボタン／副ボタン構成へ変更
- `exact` 結果を、月相バッジ＋主要数値カード＋PoC確認用データ＋注意欄の構成へ再設計
- `stable` / `ambiguous` の結果表示も、同じデザイン言語で再構成
- `ambiguous` 候補一覧をカード形式へ整理
- `currentLocalDate()` / `currentLocalTime()` / `resetForm()` / `fetch("/api/calculate")` は維持
- Python側の計算ロジック、45°区分、P01〜P08、Swiss Ephemeris利用は変更していません

## Vue 3 の導入方式

PoCを軽量に保つため、Vue 3はCDN版をHTMLから読み込みます。

```html
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>
```

このため、Node.js、Vue CLI、Vite、TypeScript、Pinia、別フロントエンド開発サーバーは不要です。従来どおり `python app.py` だけでFlaskを起動できます。

## Python側で維持している処理

以下はVueへ移していません。

- 出生情報の検証
- 出生日時のUTC変換
- Swiss Ephemeris / pyswissephによる太陽黄経計算
- Swiss Ephemeris / pyswissephによる月黄経計算
- 角度差計算
- 月相8分類
- 出生時間不明時の候補計算
- `stable` / `ambiguous` 判定
- 出生地処理

角度差は従来どおり、Python側の `astronomy.py` で次の考え方を維持しています。

```python
angle_difference = normalize_angle(moon_longitude - sun_longitude)
```

## 入力UI仕様

### 生年月日

空欄で日付入力画面を開く場合、その時点の端末ローカルの現在年月日を現在値として設定します。既に値が存在する場合は上書きしません。

### 出生時間

出生時間は任意です。空欄で時刻入力画面を開く場合、その時点の端末ローカル現在時刻を現在値として設定します。既に値が存在する場合は上書きしません。

出生時間が空欄のまま計算された場合は、12:00等の仮時刻を設定せず、出生日全体を対象に候補判定します。

### リセット

フォームのresetイベントでは、前回計算値へ戻さず次の3項目を空欄にします。

- 生年月日
- 出生時間
- 出生地

## 計算API

### `POST /api/calculate`

リクエスト例：

```json
{
  "birth_date": "1964-09-03",
  "birth_time": "11:23",
  "birth_place": "兵庫県小野市"
}
```

出生時間が分からない場合：

```json
{
  "birth_date": "1964-09-03",
  "birth_time": "",
  "birth_place": "兵庫県小野市"
}
```

成功時の `result` には、分類結果に加えて、UTC日時、Julian Day UT、太陽黄経、月黄経、角度差、PoC確認用データ、出生地処理情報などが含まれます。

## 必要環境

- Python 3.10 以上を推奨
- pip
- Vue 3 CDNへアクセスできるブラウザ

## インストール

```bash
pip install -r requirements.txt
```

## 起動

```bash
python app.py
```

Flaskは `0.0.0.0:5000` で待ち受けます。

## テスト

```bash
python -m unittest discover -s tests -v
```

## 正解確認用テストデータ（出生時間あり）

- 生年月日：1964-09-03
- 出生時間：11:23
- 出生地：兵庫県小野市
- タイムゾーン：Asia/Tokyo
- 期待分類：P08 / 欠けていく三日月

## 出生時間不明のテスト例

- 1964-09-04 → `stable` / P08
- 1964-09-03 → `ambiguous` / P07, P08
