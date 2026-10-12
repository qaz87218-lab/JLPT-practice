# JLPT App v0.3.8.1 — Vercel TypeScript 修復

## 根本原因

在 `src/lib/reading-exams.ts`，先前將讀解 JSON 直接強制轉型為 `ReadingExam`。編譯器推斷 JSON 詞彙 `vocab` 為 `string[][]`，但資料型別要求每筆是固定長度 `[string, string, string]`，觸發 TS2352。

## 修復方式

逐筆檢查文章中的 `vocab`：每筆必須含 **恰好三個字串**（單字、假名、繁體中文釋義）。通過驗證後重新組成固定長度三元素陣列，並使用 `ReadingExam` 明確型別，不使用危險的 `as ReadingExam`。

**只修正程式型別處理，未修改原題、答案、讀解頁圖、文法、單字或本機紀錄資料格式。**

## GitHub Desktop 更新步驟

1. 將此 ZIP 解壓縮。
2. 在 GitHub Desktop 選擇原本連到 Vercel 的 Repository，點 `Repository → Show in Explorer`。
3. 將解壓縮後專案資料夾**內部的檔案與資料夾**複製到 Repository 根目錄，覆蓋同名檔案。不要覆蓋或刪除 `.git` 資料夾。
4. 回到 GitHub Desktop，確認 `Changes` 中有 `src/lib/reading-exams.ts` 及 `package.json` 的修改。
5. 輸入 Commit 訊息 `Fix TS2352 reading vocab typing (v0.3.8.1)`，按 `Commit to main`，接著 `Push origin`。
6. 在 Vercel 的 `Deployments` 找到這個新的 Commit，查看 Build Logs 及狀態。

## 驗證限制

已使用獨立的 TypeScript 嚴格型別檢查驗證讀解資料模組，並檢查 11 篇文章、44 筆詞彙及 21 題資料完整性。本執行環境無法連接 npm 套件庫，因此**無法在這裡完成 Next.js 全量建置**；如 Vercel 繼續報其他編譯錯誤，請提供新部署的第一個實際錯誤訊息。
