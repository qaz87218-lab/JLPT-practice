> **歷史說明：此文件僅記錄 v0.4.5。最新版請先閱讀 README_V046_COMPLETE_INTEGRATION.md。**

# JLPT Deep Practice v0.4.5 — Nihongo Quest 單字資料整合（部分可離線）

這是**JLPT App** 的完整專案延伸版，不是 Nihongo Quest 改版。

## 已實作

- JLPT → 各級 → 單字，新增「Nihongo Quest 單字 / 原有 OpenJLPT」來源切換。
- N5 520 個、N2 1,430 個，加入 `public/vocab/nihongo/n5.json` 與 `n2.json`，均來自使用者先前提供的 Nihongo Quest。
- N2 額外提供「WordMaster N2（原版）」入口，保留原版 3,636 筆列表的存取方式（實際筆數以取得的 JSON 為準），與內建的 1,430 筆獨立顯示，不會靜默去重或覆蓋。
- N4、N3、N1 延用 Nihongo Quest 原先的 WordMaster Word Lists 靜態 GitHub 連結；需初次連網才能顯示，來源檔尚未封裝於 ZIP。
- 來源區分、繁體中文空缺／英文原文獨立展示，依級別搜尋、收藏、筆記、學習狀態均可沿用。
- **不修改** `jlpt-deep-practice-local-v1` localStorage key、OpenJLPT IndexedDB schema、文法、2017–2018 N2 題庫、原課程。
- 無 Supabase；動態下載是遠端靜態 JSON，不是 API 登入系統。

## 限制

- N4、N3、N1 詞義中的英文、簡體中文仍未逐筆校正；資料來源主張 `translation_cn` 不足以保證為繁體中文。
- N2 的 1,430 筆主要是名詞／サ變動詞，仍非所有詞性的完整 N2 資料。
- N2 原檔有 2 筆空白中文詞義；本版不隱藏或假裝已校訂。
- 同級相同字形與讀音的重複項只保留第一筆；跨級來源未合併，原有 OpenJLPT 也未自動合併，以免破壞 ID 及學習紀錄。
- 公開發布前需再次確認題庫與詞彙來源的再散布權限，並做教師審校。

## GitHub Desktop 部署

1. 備份現有 repo 與在 App 匯出的本機學習紀錄 JSON。
2. 本 ZIP 為完整 JLPT 專案，不含 `.git`。將其檔案**內容**覆蓋至舊 repo 根目錄，保留原 `.git` 與使用者私有設定。
3. GitHub Desktop 檢視差異，Commit → Push。Vercel 應重新建置。
4. 驗證 N5/N2 本地詞庫、N4/N3/N1 外部載入、OpenJLPT 舊資料、文法與模擬試題。

本環境是否能完整 Next.js production build，以最終驗證報告為準。
