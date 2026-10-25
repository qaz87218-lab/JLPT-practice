> v0.4.4: N2 模擬試題新增 2017/12（75 題）、2018/12（73 題）掃描原卷作答版；三回共 223 題。詳見 [N2 歷年題庫新增說明](N2_ARCHIVE_2017_12_2018_12_INTEGRATION.md)。

# JLPT Deep Practice v0.4.1（無 API）— N2 雙來源深度解析

新增 67 筆 N2 深度解析與 25 組附假名、繁中翻譯的來源短例句。來源位置與校對範圍請參閱 `N2_DEEP_GRAMMAR_INTEGRATION.md`。原有 551 項文法、1,102 例句、2018/07 N2 75 題不變。

---

# JLPT Deep Practice v0.4.1（無 API）— N2 雙來源深度解析

新增 67 筆 N2 深度解析與 25 組附假名、繁中翻譯的來源短例句。來源位置與校對範圍請參閱 `N2_DEEP_GRAMMAR_INTEGRATION.md`。原有 551 項文法、1,102 例句、2018/07 N2 75 題不變。

---

# JLPT Deep Practice v0.3.9（無 API）

**新增 2018 年 7 月 N2 書面題組：1–75 題（文字語彙32、文法22、讀解21），保留原有 N5～N1 文法551項、1102例句及單字匯入功能。**

- 入口：`/jlpt/n2/mock/` → 2018年7月完整書面題組（75題）。
- 讀解獨立入口仍是 `/jlpt/n2/reading/`（21題），共用本機作答進度。
- 聽解只有逐字稿及答案掃描頁，缺音檔，因此不計入75題。
- 檢查：`npm run verify:2018`、`npm run verify:reading`、`npm run verify:data`。
- 實際 Next.js build 尚待部署環境驗證。
- 詳見 `2018_N2_FULL_75_INTEGRATION.md`。

---

# JLPT Deep Practice v0.3.7（無 API，單字匯入版）

本版新增 OpenJLPT N5～N1 單字匯入、離線瀏覽與跨級去重。**交付包尚未附上所有單字原始檔，需首次在 App 匯入，或先執行 `npm run import:vocab`。** 繼續保留 v0.3.6 五級文法及本機功能。

詳細操作、範圍、授權與限制參見 [VOCAB_IMPORT_GUIDE_V037.md](VOCAB_IMPORT_GUIDE_V037.md)。

---

# JLPT Deep Practice v0.3.6 — N5～N1 無 API 本機版

新增《TRY！N5》45 主文法＋1 Plus、92 句自編例句，延續 N4～N1 505 項。共有 **551 個文法項目、1,102 組例句**。

無 Supabase、無帳號需求、無外部 API。學習資料存於瀏覽器 localStorage，可從總覽匯出／匯入 JSON。

> 文法皆待審校；N5 寒暄與各類補充表格目前只有索引，不應視作已完整數位化。

詳見 `N5_FULL_DATA_README.md`，另保留前版本說明。

# JLPT Deep Practice v0.3.5 — 無 API 本機版

這是以 **v0.3.4** 的 Next.js 專案修改的版本，沒有 Supabase 或任何第三方資料 API。

## 保留資料

- N5～N1 分級及五種入口（單字、文法、文章、聽力、模擬試題），另有系統課程；口說模組已於 v0.4.3 移除
- TRY！N4／N3／N2／N1：100＋127＋149＋129＝**505** 個文法學習項目、**1,010** 組助理編寫的例句與假名
- 搜尋文法、完整教學欄位、來源書名和頁碼
- 原始匯出檔保存在 `DATA_EXPORTS/`；可持續以 `src/data/` 內各級 JSON 擴充
- 未填入的模組顯示「尚未建置」

## 已移除

- `@supabase/supabase-js`、`src/lib/supabase.ts`、所有 Supabase 登入／註冊／查詢程式
- Supabase migration、雲端匯入腳本、環境變數檔及設定檢查元件
- 不需要 API URL、API KEY 或 Supabase 帳號

## 學習資料儲存

現在使用瀏覽器 `localStorage`，包含：手動學習狀態（未學／學習中／已掌握）、收藏、筆記。首頁可匯出／匯入 JSON 備份。若使用者清除網站資料、改用不同網址或瀏覽器，紀錄不會自動同步。**切換到本機版不會自動搬移原本 Supabase 雲端使用者紀錄，也不會修改或刪除雲端資料。**

目前的「已掌握」是手動標記，不代表答題驗證。錯題率、間隔複習與正式聽力音檔等仍屬後續功能，沒有虛構的測驗紀錄。

## 執行／部署

1. 安裝 Node.js 20.9 以上（建議目前 Node.js LTS）
2. 在專案根目錄執行 `npm install`
3. 開發：`npm run dev`，瀏覽 http://localhost:3000
4. 建置靜態網站：`npm run build`，輸出在 `out/`（不需要 App Server／API／環境變數）
5. 將 `out/` 的內容部署到任意提供靜態網站的服務；必須讓 `.../jlpt/n4/grammar/` 等子路徑正常載入。

注意：單純雙擊 `out/index.html` 使用 `file://` 開啟，可能受到瀏覽器對 JS 模組的限制；請以本機 HTTP server 或靜態網站託管。

`npm install` 需要從套件庫下載框架依賴，但 **App 使用時不會連接 Supabase API**。

## 安全與資料品質

使用者自行備份資料。教材中的助理編寫內容尚未全面進行日語專業審校，原書內容與助理編寫內容的來源區分仍保留。

## v0.3.8：2018 年 7 月 N2 歷年讀解整合

N2 → **文章** 可練習 2018/07 的問題 10–14，共 21 題。保留原卷掃描頁、逐選項中文詳解、作答判分與錯題篩選，並使用既有瀏覽器本機存檔，未新增 API。亦可在 **N2 → 模擬試題** 進入該讀解題組。詳見 `READING_2018_N2_INTEGRATION.md`。

> 注意：只匯入讀解，不是整回考試；中文詳解待教師審校。第三方試卷的公開散布授權亦尚待確認。
