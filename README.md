# UraNai+（うらないプラス） v0.12

質問にこたえるタイプ診断と、名前で占う相性診断ができる占いサイト。

公開ページ: https://kaikomziu.github.io/uranai-plus/

## 診断

| 診断 | URL | 内容 |
| --- | --- | --- |
| 🧩 タイプ診断 | `list/50o72qn/` | 10問にこたえて6タイプのどれかがわかる |
| 💞 相性診断 | `list/5v8zmrv/` | ふたりの名前で相性を占う。名前はこの端末にだけ保存され、結果のURLには入らない（相手には「？？？」と表示） |

トップページでは、タイプ診断のあとに相性診断の入力欄がある。

## ファイル

- `common.css` / `common.js` … 全ページ共通（タスクバー・BGMプレイヤー・更新履歴など）。バージョン `VERSION` もここ
- `audio.js` … Web Audio API で BGM と効果音を鳴らす
- `list/fortune.css` / `list/fortune.js` … 診断ページ共通の見た目と仕組み
- `list/aisho.css` / `list/aisho.js` … 相性診断（名前の入力欄・計算・名前の保存）
- `tools/ogp.html` / `tools/make-ogp.ps1` … OGP画像 `ogp.png` を作る

## クレジット

- BGM「おひるすぎ」: ふぁいの音楽置き場 / fai-musics
- 効果音: [OtoLogic](https://otologic.jp/)（[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)）、[効果音ラボ](https://soundeffect-lab.info/)

音源ファイル（`audio/`）の著作権はそれぞれの作者にあります。このサイト以外での再利用・再配布はしないでください。
