const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'posts.json');
const DEFAULT_CATEGORY = '未分類';

function loadPosts() {
  if (!fs.existsSync(dataFile)) {
    return [];
  }

  const raw = fs.readFileSync(dataFile, 'utf-8');
  const parsed = JSON.parse(raw || '[]');

  if (!Array.isArray(parsed)) {
    throw new Error('posts.json 應該是一個包含文章的陣列');
  }

  return parsed;
}

function savePosts(posts) {
  fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2));
}

function nextId(posts) {
  const maxId = posts.reduce((max, post) => Math.max(max, Number(post.id) || 0), 0);
  return maxId + 1;
}

function generateExcerpt(content) {
  const trimmed = (content || '').trim();
  const slice = trimmed.slice(0, 120);
  return slice + (trimmed.length > 120 ? '…' : '');
}

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function addPost(title, content, options = {}) {
  const posts = loadPosts();

  const now = new Date().toISOString();
  const post = {
    id: nextId(posts),
    title,
    content,
    excerpt: options.excerpt || generateExcerpt(content),
    coverImage: options.coverImage || '',
    category: options.category || DEFAULT_CATEGORY,
    tags: parseTags(options.tags),
    status: options.status === 'draft' ? 'draft' : 'published',
    createdAt: now,
    publishedAt: options.status === 'draft' ? null : options.publishedAt || now,
  };

  posts.push(post);
  savePosts(posts);

  console.log(`已新增文章 #${post.id}: ${post.title}`);
}

function deletePost(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    throw new Error('文章 ID 必須為整數');
  }

  const posts = loadPosts();
  const index = posts.findIndex((post) => Number(post.id) === numericId);

  if (index === -1) {
    throw new Error(`找不到 ID 為 ${numericId} 的文章`);
  }

  const [removed] = posts.splice(index, 1);
  savePosts(posts);

  console.log(`已刪除文章 #${removed.id}: ${removed.title}`);
}

function printUsage() {
  console.log('用法:');
  console.log('  node script.js add <title> <content>      新增文章（預設狀態為 published）');
  console.log('  node script.js delete <id>                刪除文章');
}

function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    if (command === 'add') {
      const [title, ...contentParts] = args;
      const content = contentParts.join(' ').trim();

      if (!title || !content) {
        throw new Error('新增文章需要 <title> 與 <content>');
      }

      addPost(title, content);
      return;
    }

    if (command === 'delete') {
      const [id] = args;

      if (!id) {
        throw new Error('刪除文章需要 <id>');
      }

      deletePost(id);
      return;
    }

    printUsage();
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exit(1);
  }
}

main();
