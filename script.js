const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

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

  const normalized = normalizePosts(parsed);

  if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
    savePosts(normalized);
  }

  return normalized;
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

function slugify(text) {
  return (text || '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'untitled';
}

function buildSlugSet(posts) {
  return new Map(
    posts.map((post) => {
      const slug = post.slug || '';
      return [slug, post.id];
    }),
  );
}

function ensureUniqueSlug(slug, mapOrPosts, currentId) {
  const slugMap = mapOrPosts instanceof Map ? mapOrPosts : buildSlugSet(mapOrPosts || []);
  const base = slug || 'untitled';
  let candidate = base;
  let counter = 2;

  while (slugMap.has(candidate) && slugMap.get(candidate) !== currentId) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  slugMap.set(candidate, currentId || true);
  return candidate;
}

function normalizePosts(posts) {
  const slugMap = new Map();
  const baseId = posts.reduce((max, post) => Math.max(max, Number(post.id) || 0), 0);
  let tempCounter = 1;
  return posts.map((post, index) => {
    const status = post.status === 'draft' ? 'draft' : 'published';
    const title = post.title || `未命名文章 ${index + 1}`;
    const rawSlug = post.slug || slugify(title);
    const baseSlug = ensureUniqueSlug(rawSlug, slugMap, post.id);
    const id = post.id ?? baseId + tempCounter++;

    return {
      id,
      title,
      content: post.content || '',
      excerpt: post.excerpt || generateExcerpt(post.content || ''),
      coverImage: post.coverImage || '',
      category: post.category || DEFAULT_CATEGORY,
      tags: parseTags(post.tags),
      slug: baseSlug,
      status,
      createdAt: post.createdAt || new Date().toISOString(),
      publishedAt: status === 'draft' ? null : post.publishedAt || post.createdAt || new Date().toISOString(),
      previewToken: post.previewToken || randomUUID(),
    };
  });
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
  const slug = ensureUniqueSlug(options.slug || slugify(title), posts);

  const post = {
    id: nextId(posts),
    title,
    content,
    excerpt: options.excerpt || generateExcerpt(content),
    coverImage: options.coverImage || '',
    category: options.category || DEFAULT_CATEGORY,
    tags: parseTags(options.tags),
    status: options.status === 'draft' ? 'draft' : 'published',
    slug,
    createdAt: now,
    publishedAt: options.status === 'draft' ? null : options.publishedAt || now,
    previewToken: options.previewToken || randomUUID(),
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
