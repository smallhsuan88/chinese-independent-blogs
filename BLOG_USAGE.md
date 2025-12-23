# 簡易部落格功能

目前的操作僅保留「新增文章」與「刪除文章」兩項功能，並以專案根目錄的 `posts.json` 進行儲存。

## 使用方式

1. 安裝依賴（第一次執行時）
   ```bash
   npm install
   ```
2. 新增文章
   ```bash
   node script.js add "文章標題" "文章內容"
   ```
3. 刪除文章
   ```bash
   node script.js delete <id>
   ```

每篇文章都會被指派自增的 `id`，時間戳記則會以 ISO 字串形式寫入 `posts.json`。
