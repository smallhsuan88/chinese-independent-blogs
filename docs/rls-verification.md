# RLS Verification — posts table

目的：每次修改 schema / RLS policy 後，用這份流程快速驗證：
- 匿名只能讀已發布文章
- 登入者只能操作自己的文章
- 非作者不能動到別人的資料

---

## 0) 前置條件（固定不變）

- 表：`public.posts`
- 文章欄位（至少）：
  - `id` (uuid)
  - `author_id` (uuid)
  - `status` (text) 例如 `draft` / `published`
  - `published_at` (timestamptz, 可為 null)
  - `slug` (unique)

- 你的 user id（uid）：
  - owner uid：`<YOUR_UID>`
  - non-owner uid：`11111111-2222-3333-4444-555555555555`（測試用假 uid）

---

## A) Anonymous（未登入）驗證

### A1. 只能看到 published 且 published_at 不為 null
```sql
set local role anon;

select id, title, status, published_at
from public.posts
where status = 'published'
  and published_at is not null
order by published_at desc;
預期結果：

✅ 看得到已發布文章

✅ 看不到 draft

A2. 匿名不能新增
set local role anon;

insert into public.posts (title, status)
values ('hack test', 'published');
預期結果：

✅ 會被擋（RLS 錯誤或 new row violates RLS）

B) Authenticated (owner)（登入本人）驗證
B0. 模擬登入（owner）
set local role authenticated;
select set_config('request.jwt.claim.sub', '<YOUR_UID>', true);

B1. owner 可以 insert 自己的文章
insert into public.posts (title, slug, content, status, published_at, author_id)
values ('RLS測試文', 'rls-test-<TIMESTAMP>', 'hello', 'published', now(), auth.uid())
returning id, author_id, status, published_at, slug;


預期結果：

✅ 插入成功

✅ author_id = auth.uid()

B2. owner 可以 update 自己文章
update public.posts
set title = 'RLS測試文（已更新）'
where slug = 'rls-test-<TIMESTAMP>'
returning id, title, author_id;


預期結果：

✅ 更新成功

B3. owner 可以 delete 自己文章
delete from public.posts
where slug = 'rls-test-<TIMESTAMP>'
returning id, slug, author_id;


預期結果：

✅ 刪除成功

C) Authenticated (non-owner)（非作者）驗證
C0. 模擬另一個登入者（non-owner）
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-2222-3333-4444-555555555555', true);


請挑一篇「作者不是 non-owner」的文章 slug，例如：a-post-20251224

C1. non-owner 不能 update 別人的文章
update public.posts
set title = 'B 想改 A 的文章'
where slug = 'a-post-20251224'
returning id, slug, author_id;


預期結果：

✅ 0 rows affected（或不回傳任何 row）

✅ 資料實際不會被改到

C2. non-owner 不能 delete 別人的文章
delete from public.posts
where slug = 'a-post-20251224'
returning id, slug, author_id;


預期結果：

✅ 0 rows affected（或不回傳任何 row）

✅ 資料不會被刪掉

最終判定（Pass 條件）

Anonymous：只能讀到 published + published_at not null，且不能 insert

Owner：可以 insert / update / delete 自己文章

Non-owner：update / delete 別人文章都會失敗（0 rows）


5. 往下捲到頁面底部
6. Commit 設定：
   - Commit message 填：`Add RLS verification doc`
   - 選 **Commit directly to the main branch**
7. 點 **Commit new file**

✅ 完成後你會在 repo 看到 `docs/rls-verification.md`

---

## 步驟 2：把 `<YOUR_UID>` 與 `<TIMESTAMP>` 替換掉（務必做）

### 1) 替換 `<YOUR_UID>`
- 用你現在一直在用的 owner uid，例如你圖裡那串 `3a957a9a-...`

把文件裡所有 `<YOUR_UID>` 改成你的真 uid。

### 2) `<TIMESTAMP>` 怎麼填？
給你一個最省腦的規則：

- 每次測試都用：`20251224-1` 這種
- slug 改成：`rls-test-20251224-1`

這樣不會撞到 unique constraint。

---

## 步驟 3：把它連到 README（加一行就好）

打開 `README.md`，加一行：

```md
- RLS verification: see `docs/rls-verification.md`

風險提醒（你踩過的坑，這次直接避掉）

slug 唯一：不要一直用 rls-test，會撞 posts_slug_unique

non-owner 測試：where slug = ... 必須指向「作者不是 non-owner」的文章

0 rows ≠ 失敗：RLS 擋住的正確表現通常就是 0 rows affected
