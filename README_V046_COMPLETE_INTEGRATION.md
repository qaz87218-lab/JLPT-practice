# JLPT Deep Practice v0.4.6 — 詞彙學習 × RPG 整合交付說明

## 本次實際交付

這是 **JLPT Deep Practice** 專案的後續版本，不是 Nihongo Quest 改版；以 v0.4.4 FULL 為基礎。

### 內容

1. N5 520 筆：沿用使用者的 Nihongo Quest、繁中資料，隨網站封裝。
2. N2 1,430 筆：沿用使用者舊 N2 名詞詞庫，補正 7 筆明顯錯字／缺義，隨網站封裝（N2_VOCAB_CORRECTIONS_046.csv）。**這份不是涵蓋所有詞性的完整 N2 詞庫**。
3. N4（WordMaster 宣稱 676 筆）、N3（2,246 筆）、N1（2,931 筆）及額外的 N2（3,636 筆）經程式連至 `raw.githubusercontent.com/lratusa/wordmaster-wordlists/main/japanese/jlpt_n*.json` 讀取。**四份遠端實體 JSON 仍未封裝**：本工具執行環境無法下載完整檔案，因此此版不能離線第一次開啟 N4/N3/N1 或額外 N2。網站用戶第一次載入成功後會嘗試保存到 IndexedDB，供下次離線使用。
4. 將先前 N5＋N2 詞庫，以**字形與讀音同時相符**為條件對照 WordMaster 詞條並回填其繁中詞義；另對常見的 27 條詞彙建立校對表；沒有安全匹配的英文欄位保留為「原始英文」並標記待翻譯，**不冒稱已全量翻譯**。本專案內含 2,615 字的簡→繁字級轉換表（ICU Hans-Hant 產生，可能有多義字錯換，未逐項審校）。
5. 保留 WordMaster 原始日文例句，提供中文自動轉換欄位（非人工校訂）。
6. 新增詞彙 RPG：EXP、等級、稱號、連擊、每天 10 題＋答對 7 題送 50 XP、答錯清單／復仇、到期複習、五星熟練度、N5～N1 五位詞彙 Boss 及擊破獎勵。測驗每題四選一，只使用有中文釋義的詞彙；不使用未校對英文作中文選項。
7. RPG 的 XP、稱號、復仇表保存在新的 `jlpt-deep-practice-rpg-v1` localStorage key；答題掌握度寫回既有的 `jlpt-deep-practice-local-v1` progress，原有收藏、筆記、歷年答題紀錄等皆原封不動。
8. 增加 WordMaster 各級 JSON 使用者自行匯入欄位，可在 GitHub 無法連線時用本機檔案載入並存入 IndexedDB。

### 本次未能確認的部分（不可宣稱完成）

- N4／N3／N1／WordMaster N2 共約 9,489 條的逐詞**人工繁體中文校訂未完成**；有些詞義仍為英文、少數詞義簡→繁是自動轉換。
- WordMaster 四份完整原始 JSON 未能寫入此 ZIP；實際筆數要以使用者端成功下載後顯示為準。
- 未進行 Next.js Production 建置及實際瀏覽器操作測試（離線的執行環境沒有 Next.js／React npm 依賴）；僅完成靜態程式解析、原有題庫／課程驗證，以及數據／RPG 規格檢查。
- WordMaster 原始素材的公開再散布權限尚待查核。下載腳本只供確認已獲授權的私人使用；公開網站前應確認可使用範圍。

### 部署

只使用 GitHub Desktop 時：
1. 備份目前 JLPT repository 與網站中的「學習紀錄 JSON」。
2. 解壓 `JLPT_v0_4_6_GitHub_Desktop_UPDATE_ONLY.zip`，將**內容**覆蓋舊 repository 相對應檔案，**不要覆蓋 `.git`**。
3. GitHub Desktop 檢視異動，再 Commit、Push，確認 Vercel Production Build 成功。
4. 本機上有 Node.js 時，先執行 `npm install`、`npm run verify:all`、`npm run build`。欲嘗試預存 WordMaster，則先執行 `npm run prefetch:wordmaster`（須有網路並確認素材使用權），再建置。
5. 回歸測試：N5/N2 內建單字、N4/N3/N1（首次需要網路）、WordMaster N2 額外詞庫、OpenJLPT 匯入、551 文法、223 題 N2 書面模考、RPG 作答及本機學習紀錄保存。

**要完整翻譯約 9,489 筆且可離線打包，仍須取得四份 WordMaster JSON 實體，進行逐條翻譯／審查；本版不是該校訂工作的完工品。**
