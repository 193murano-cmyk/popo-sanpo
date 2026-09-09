# 画像生成用プロンプト集 — フェルト版 v0.2

Gemini（ナノバナナ）でも ChatGPT でも、参照画像を添付できる生成サービスなら同じ手順で使える。
**ポポの5枚は同じサービスで作ること**（混ぜると質感がずれて別人に見える）。まず `popo_idle` を1枚作って確定版と見比べ、納得してから残りを作る。

使い方：1キャラ1チャット。最初に「共通文」と参照画像2枚（そのキャラの確定版立ち絵）を貼り、そのあと各画像の指示を1つずつ貼る。
必要な画像の一覧と置き場所は `docs/assets.md`。

---

## ① 共通文（チャットの最初に、参照画像と一緒に貼る）

```
あなたはキャラクター画像の制作担当です。これから「ポポさんぽ」というアプリ用に、同じキャラクターの画像を数枚作ります。添付の参照画像のキャラクターを、見た目・素材・光を完全に維持したまま、指示するポーズと表情で描いてください。

【画風（厳守）】
- ニードルフェルト／ぬいぐるみ調の立体。ふわふわした繊維の質感。粘土風・ベクター風・写実の毛並みは禁止。
- 参照画像と同じ光（やや左上からの柔らかい光）。全画像で光の向きを揃える。
- 太い黒アウトラインは不要。フェルトの質感で輪郭を出す。
- 目は黒い丸目に白いハイライト1点。

【アプリ用の共通条件（厳守）】
- 背景は真っ白（#FFFFFF）。空・地面・小物・文字・枠・模様を入れない。
- 全身を入れる。頭からつま先まで切れない。体のまわりに1割ほど余白。
- 影は足元の小さな接地影だけ。体から離れた影や壁の影は描かない。
- 向きは正面〜やや斜め。真横や後ろ姿は不可。
- 1枚に1体だけ。
- 出力は正方形（1024×1024以上）。

これ以降、私が「画像1」「画像2」…とポーズを指示します。指示ごとに1枚ずつ作ってください。準備ができたら「OK」とだけ返してください。
```

## ② ポポ

固定仕様（1回だけ貼る）：

```
【ポポの固定仕様（全画像で維持）】
- 二頭身のまんまるな赤い子猫。体の赤は #E45A47。
- 左耳の先が少し折れている（先の3分の1ほど）。右耳は立っている。
- 額に小さな白い巻き毛。手足の先は白。
- 首に濃い赤の組紐で、無地の穴あき金貨（#C9A54B）。金貨の縁に小さな凹みが1つ。
- 頭の後ろに白い綿毛の雲（7つ・頭の1.5倍以内）。
- 日常カットなので、手は赤いフェルトの手（綿毛の手にしない）。手のひらが見える角度では赤い肉球。
- 性格は行動派で明るい。表情は元気で親しみやすく。
```

各画像（1つずつ貼る）：

```
画像1（popo_idle）：自然に立っている。両手は体の横か腰。口を閉じ気味のにっこり。目はまっすぐこちらを見る。落ち着いた「ふだん」の姿。
plain pure white background, no scenery, no props, no text, full body visible with small margin around, only a soft small contact shadow under the feet, same lighting as the reference
```

```
画像2（popo_walk）：楽しそうに歩き出す／走り出す瞬間。片足が前に出て、腕を前後に振っている。少し前傾。口を開けた笑顔。綿毛が少し後ろになびく。転んではいない。
plain pure white background, no scenery, no props, no text, full body visible with small margin around, only a soft small contact shadow under the feet, same lighting as the reference
```

```
画像3（popo_yay）：両腕を高く上げてガッツポーズ。口を大きく開けた最高の笑顔。目は閉じてもよい。「やったー！」の瞬間。体はやや弾んでいる。
plain pure white background, no scenery, no props, no text, full body visible with small margin around, only a soft small contact shadow under the feet, same lighting as the reference
```

```
画像4（popo_sparkle）：両手を横に広げて、風を受けているように立つ。頬が赤く、目はぱっちり開いてうれしそう。綿毛が風でふわっと広がる。口は小さく開いた笑顔。
plain pure white background, no scenery, no props, no text, full body visible with small margin around, only a soft small contact shadow under the feet, same lighting as the reference
```

```
画像5（popo_good）：片手で親指を立てる（サムズアップ）。もう片方の手は腰。満足そうな落ち着いた笑顔。目は開いている。「おつかれさま」の雰囲気。
plain pure white background, no scenery, no props, no text, full body visible with small margin around, only a soft small contact shadow under the feet, same lighting as the reference
```

## ③ カナデ（新しいチャット。共通文＋カナデの確定版立ち絵を貼ってから）

```
【カナデの固定仕様】
- すらりとしたツバメ。背と翼は浅葱色 #4FB0C6、胸は白。
- 燕尾の先に細い紐で、穴あきの小さな金の硬貨の風鈴。
- 語り部。表情は明るく、歌うように語りかける。

画像6（kanade_frame）：古い木の額縁から身を乗り出しているカナデ。片翼を広げて、こちらに歌うように語りかける楽しげな表情。額縁の内側だけ、うっすら楽譜柄の空。額縁の外側は真っ白。額縁ごと1枚に収める。額縁は木の質感で、装飾は控えめ。横長でも正方形でもよい。
plain pure white background outside the frame, no text, the whole picture frame visible with margin, soft lighting same as the reference
```

## ④ モコ（新しいチャット。共通文＋モコの確定版立ち絵を貼ってから）

```
【モコの固定仕様】
- 洋梨型のもっちりした緑の猫。体の緑は #6FA867。垂れた丸い耳、太いしっぽ。
- 耳に小さな鉛筆。胸にベージュのがま口（口金の中央に穴あきの円形留め具）。
- 穏やかで落ち着いた性格。表情はやさしい微笑み。

画像7（moko_idle）：がま口を胸に抱えて立ち、小首をかしげている。穏やかな微笑み。目はやさしく開いている。
plain pure white background, no scenery, no props, no text, full body visible with small margin around, only a soft small contact shadow under the feet, same lighting as the reference
```

## できた画像の扱い

- 良いものを選んで `popo_idle` のようにファイル名を付け、`img/raw/` に置いて main に push。
- jpg / png どちらでも可。切り抜き・縮小はアプリ側で行う。
- ポポ5枚は、体の大きさと足の位置がなるべく近いものを選ぶ（表情の切り替えがきれいになる）。
