# v0.3.5 檢查紀錄

- [x] 原 N4、N3、N2、N1 教材 JSON 完整保留；100＋127＋149＋129＝505 條文法、1,010 組例句、假名及翻譯均存在。
- [x] 檢查所有新 `.ts/.tsx` 檔案，TypeScript parser 解析無語法診斷。
- [x] `src/` 無 Supabase／`NEXT_PUBLIC_SUPABASE_*` 引用；`package.json` 無 `@supabase/supabase-js`。
- [x] `src/lib/local-store.ts` 功能模擬測試：手動狀態、收藏、筆記、JSON 備份還原、拒絕無效匯入均通過。
- [x] Next.js 設定為 `output: 'export'`，提供所有 N5～N1、六模組的靜態路徑清單。
- [ ] **尚未完成正式 `npm run build`**：此執行環境下載安裝前端依賴時逾時，未能完成 Next.js 編譯及瀏覽器端到端驗證。請在可連網的 Node.js 環境執行 `npm install && npm run build`。
- [ ] 未測試不同裝置的實際瀏覽器儲存限制，也沒有跨裝置同步（設計上不提供）。

程式移除的僅是原有雲端連線功能，並沒有刪除或更動使用者遠端 Supabase 上的資料。
