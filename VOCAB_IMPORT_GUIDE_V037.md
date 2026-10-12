# JLPT Deep Practice v0.3.7 — 單字資料庫匯入說明

## 目前版本範圍

- 維持 v0.3.6 **N5～N1 文法 551 項及 1,102 組例句**，不修改既有教材內容與學習紀錄鍵。
- 新增 N5～N1 的單字分類瀏覽、假名／羅馬字／英文釋義搜尋、詞性、日文例句與已有的振假名；可收藏、寫本機筆記、手動標記學習中與已掌握。
- 資料下載／匯入後寫進 **IndexedDB**；收藏／筆記／掌握度沿用既有 **localStorage**。不接 Supabase、無須帳號或 API 金鑰。
- 單字自動測驗、錯題判分、間隔複習尚未完成；不會假裝提供。

## 如何取得單字

**方法 A：直接在 App 中一次匯入（最簡單）**

1. 啟動專案並開啟 `/jlpt/n5/vocabulary`（N4～N1 同理）。
2. 點選「一次匯入 N5～N1 單字」。首次需連網；瀏覽器會先檢查是否有內建的靜態檔，沒有才從 OpenJLPT 的 GitHub `raw.githubusercontent.com` 下載 JSON。這是**讀取靜態公開資料**，不是 Supabase／前一版 API。
3. 成功時顯示實際取得筆數、唯一詞彙數與合併筆數；關閉網路後可從同一裝置查閱已存入的單字。
4. 若網站網路政策擋住 GitHub，改用「從 JSON 匯入」。

**方法 B：預先把資料包進 App**

在可連網的電腦根目錄執行：

```bash
npm run import:vocab
```

腳本下載並驗證 OpenJLPT 五份原始 JSON，儲存至 `public/vocab/n5.json` ～ `n1.json`，並產出 `DATA_EXPORTS/VOCAB_OPENJLPT/normalized-vocab.json`、`normalized-vocab.csv` 與 `import-manifest.json`，接著重新建置 App。使用者第一次點擊匯入時即可從**自己的 App 靜態檔案**載入，無須再連 GitHub。

可離線使用本機下載好的官方 OpenJLPT JSON：

```bash
node scripts/import-openjlpt.mjs --from-dir /path/to/downloaded-openjlpt-json
```

該資料夾需包含 `n5.json`、`n4.json`、`n3.json`、`n2.json`、`n1.json`。試跑不寫入：加上 `--dry-run`。

## 去重策略

- 唯一詞彙使用 `(word, reading, jmdict_id)`；同字不同讀音、同音不同詞義的獨立 JMdict 詞條**不任意合併**。
- 同一詞彙出現在多個級別時合併詞彙本體，同時保留 `levels[]`、`sourceIds[]`、`sourceRefs[]`。App 頁面仍依每個級別顯示該詞彙。
- App 學習紀錄的單字 ID 由上述三項產生確定性的 key，避免匯入順序影響記錄綁定。
- 必須用實際下載內容計數；OpenJLPT README 的 7,811 是上游公布的資料總數，不是本 ZIP 已匯入的筆數。

## 中文釋義與例句翻譯

OpenJLPT 詞彙 JSON 的 `meanings`、`examples.en` 是**英文**，並非繁體中文。這版保留原文與來源，中文欄位明確標為「待翻譯／待校對」。不可將英文硬填成中文，也不把這份資料當成使用者指定網站 jlpt.mant0u.com 的逐頁鏡像。

下一階段需要取得可合法再利用的繁中詞義資料、完成歧義配對及審校，再做單字卡與測驗。詞性來自 JMdict 的標籤，例如 `v1`、`v5r`、`n`；尚未全部翻成中文。

## 驗證與限制

- Node 腳本做 JSON 結構、來源分級、欄位類型及重複詞數檢查。
- 已使用測試資料驗證去重、跨級合併、不同讀音不合併、穩定 ID 及腳本 dry-run。
- 目前執行環境無法連線下載 GitHub JSON，因此**這個交付 ZIP 不含完整 OpenJLPT 詞彙實體資料**。必須完成以上方法 A 或 B 才能使用完整詞彙瀏覽，不能宣稱已匯入 7,811 筆。
- 已做 TSX/TS 語法解析與測試資料驗證，但完整 Next.js production build 和實際瀏覽器 IndexedDB/網路導入尚未在此環境驗證。
- 本機學習紀錄 JSON 備份**不會包含**另存在 IndexedDB 的單字全文；換裝置需重新導入單字，並匯入你的學習記錄備份。

## 授權與出處

本版保留英文詞義、例句和註記原始來源，不聲稱原創；若公開再散布修改後詞彙資料，請遵守 CC BY-SA 4.0 以及上游素材各自的歸屬要求。

- [OpenJLPT](https://github.com/evanclan/OpenJLPT)（資料集 CC BY-SA 4.0）
- [JMdict / EDRDG](https://www.edrdg.org/jmdict/j_jmdict.html)
- [Jonathan Waller's JLPT lists](https://www.tanos.co.uk/jlpt/)
- [Tatoeba](https://tatoeba.org)（日英例句，CC BY 2.0 FR）
- [原始 NOTICE.md](https://github.com/evanclan/OpenJLPT/blob/main/NOTICE.md)
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

OpenJLPT 的 JLPT 等級是社群近似分級，不代表主辦單位公布的正式試題範圍。
