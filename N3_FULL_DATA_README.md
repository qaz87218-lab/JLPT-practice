# TRY！N3 文法完整版（助理編寫教材）

## 本次新增

- 原書目錄對應的 11 章，113 個編號文法項目以及 14 個 Plus 補充項目；合計 127 個學習項目。
- 每個項目含：標準句型、接續、中文意義、詳細解說、語感、注意事項、相似文法比較，與兩組自編日文例句／完整假名／繁體中文翻譯；合計 254 組例句。
- 來源 PDF：`TRY！新日语能力考试N3 语法必备(1).pdf`，實際 247 頁；目錄頁20–24；掃描版對照為原書印刷頁 +9 = PDF 頁。
- 第112項已對照正文確認為「～抜きで」，**不是**「～なきゃならない」。
- 加入 `src/data/try-n3-grammar.json`，`src/data/jlpt.ts` 的 N3 `grammar` 已接入。
- 原有 N4 100 條與 `src/lib/supabase.ts`、登入、進度、收藏、個人筆記及雲端模擬試題路徑均保留。
- 獨立 N3 的 Excel／CSV／JSON／SQLite 與 N4＋N3 合併 SQLite 收錄於 `DATA_EXPORTS/`。

## 來源與限制

**書本的章節、項目標題和頁碼**由使用者上傳的掃描教材目錄核對；**標準化文法、接續、解說、例句、假名和翻譯**則是助理另外編寫，並非書中原文。除了抽查部分頁面外，尚未將全書正文、原書例句、全部練習題或書末索引完整逐頁轉錄。正式對外公開前，建議由日語教師逐條審校。

## 使用

- 需要原本 v0.2/v0.3.1 的 Supabase URL 及 publishable/anon 金鑰（請設定部署環境變數，ZIP 未包含機密金鑰）。
- 使用 `npm install`、`npm run dev` 啟動。登入後到 JLPT → N3 → 文法可看到本地教材，N4 仍在原位置。
- 如需匯入 v0.3 Supabase 新資料表，在 **已備份且完成 schema／migration** 的資料庫下，先執行：`node scripts/import-n3-complete.mjs`（dry run），確認後再使用管理端環境變數搭配 `--apply`。
- `SUPABASE_SERVICE_ROLE_KEY` 僅可保留在管理員機器／伺服器，不得寫入 `NEXT_PUBLIC_*` 或前端程式碼。
- 匯入項目預設 `review_required / is_published=false`，不會更改既有 N4 或使用者進度。
- 尚未連線到使用者正式 Supabase、未部署正式環境，也未提供新的 N3 錄音或測驗題庫。
