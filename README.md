# 極簡部落格

提供極簡但完整的部落格體驗：文章列表（僅 published）、全文搜尋、分類/標籤瀏覽、Markdown 內頁、上一篇/下一篇、相關文章、私密預覽草稿、基本 SEO（title/meta/OG/canonical/sitemap/robots）與最小可用 CMS。

## 圖形介面使用方式

1. 開啟 `index.html`（可直接以檔案或本機伺服器打開）。首次會同步 `posts.json` 至瀏覽器 localStorage。
2. 點擊「新增 / 編輯」展開表單，可填寫：title、slug（可編）、excerpt、content(Markdown)、cover_image_url、category、tags、status（published/draft）、published_at。
3. 列表只顯示 published 文章，含封面、摘要、分類、標籤、發佈日期與估算閱讀時間，並支援分頁。
4. 內頁使用 slug（例：`#/blog/does-name-affect-life`）渲染 Markdown（含 code block、引用、圖片、表格），自動產生 TOC、上一篇/下一篇與相關文章（分類或標籤）。
5. 分類/標籤頁：`#/category/:slug`、`#/tag/:slug`。搜尋頁：`#/search?q=keyword`（搜尋標題/摘要/內容）。
6. 後台管理列出全部文章（含 draft），可編輯/刪除並取得草稿私密預覽連結（`#/blog/:slug?preview=token`）。
7. SEO：每頁更新 title/meta/OG/canonical，並可下載自動產生的 `sitemap.xml`、`robots.txt`。

> 文章資料僅存放於瀏覽器 localStorage（本機）。

## 命令列使用方式

1. 安裝依賴（首次執行）
   ```bash
   npm install
   ```
2. 新增文章（預設狀態為 published，slug 依標題自動產生，摘要自動截取）
   ```bash
   node script.js add "文章標題" "文章內容"
   ```
3. 刪除文章
   ```bash
   node script.js delete <id>
   ```

每篇文章都會自動取得遞增的 `id` 與建立時間，published 文章會有發佈日期，draft 文章提供私密預覽 token。
