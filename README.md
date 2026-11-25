# UraNai+（うらないプラス） v0.10

ポップでかわいい占いサイト。

公開ページ: https://kaikomziu.github.io/uranai-plus/

## 占い

| 占い | URL | 遊び方 |
| --- | --- | --- |
| 🧩 タイプ診断 | `list/50o72qn/` | ひとりで |
| 🌞 今日の運勢 | `list/j0bajrr/` | ひとりで |
| 🃏 タロット占い | `list/p9e88lj/` | ひとりで |
| ⛩️ おみくじ | `list/0ll1z1i/` | ひとりで（1日1回） |
| 💘 恋愛相性占い | `list/5v8zmrv/` | ふたりで（URLを送る） |
| 🤝 友情相性占い | `list/8zn10ev/` | ふたりで（URLを送る） |
| 🙋 わたしのこと知ってる？クイズ | `list/v0g2okb/` | ふたりで（URLを送る） |

## ファイル

- `common.css` / `common.js` … 全ページ共通（タスクバー・BGMプレイヤー・更新履歴など）。占いの一覧 `FORTUNES` とバージョン `VERSION` もここ
- `audio.js` … Web Audio API で BGM と効果音を鳴らす
- `list/fortune.css` / `list/fortune.js` … 占いページ共通の見た目と仕組み
- `tools/ogp.html` / `tools/make-ogp.ps1` … OGP画像 `ogp.png` を作る

## クレジット

- BGM「おひるすぎ」: ふぁいの音楽置き場 / fai-musics
- 効果音: [OtoLogic](https://otologic.jp/)（[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)）、[効果音ラボ](https://soundeffect-lab.info/)

音源ファイル（`audio/`）の著作権はそれぞれの作者にあります。このサイト以外での再利用・再配布はしないでください。
