import localforage from 'localforage';

localforage.config({
  name: 'ModernBlogPlatform',
  version: 1.0,
  storeName: 'blog_data', // Should be alphanumeric, with underscores.
  description: 'Local storage for articles, drafts, and users.'
});

export const db = {
  // Articles
  getArticles: async () => {
    const articles = await localforage.getItem('articles');
    return articles || [];
  },
  saveArticle: async (article) => {
    const articles = await db.getArticles();
    const existingIndex = articles.findIndex(a => a.id === article.id);
    if (existingIndex > -1) {
      articles[existingIndex] = { ...articles[existingIndex], ...article, updatedAt: new Date().toISOString() };
    } else {
      articles.push({ ...article, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await localforage.setItem('articles', articles);
    return article;
  },
  getArticle: async (slug) => {
    const articles = await db.getArticles();
    return articles.find(a => a.slug === slug);
  },
  
  // Comments
  getComments: async (articleId) => {
    const comments = await localforage.getItem(`comments_${articleId}`);
    return comments || [];
  },
  addComment: async (articleId, comment) => {
    const comments = await db.getComments(articleId);
    comments.push({ ...comment, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    await localforage.setItem(`comments_${articleId}`, comments);
    return comments;
  },

  // User Profile
  getProfile: async () => {
    let profile = await localforage.getItem('profile');
    if (!profile) {
      profile = {
        name: 'Guest User',
        handle: '@guest',
        bio: 'Just exploring the platform.',
        avatarUrl: `https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff`,
      };
      await localforage.setItem('profile', profile);
    }
    return profile;
  },
  saveProfile: async (profile) => {
    await localforage.setItem('profile', profile);
    return profile;
  }
};
