import { db } from './db';

const demoArticles = [
  {
    id: '1',
    slug: 'the-future-of-react-19',
    title: 'The Future of React 19',
    content: '<p>React 19 brings exciting new features including concurrent rendering improvements and a brand new compiler...</p>',
    author: { name: 'Dan Abramov', handle: '@dan_abramov', avatar: 'https://ui-avatars.com/api/?name=Dan+Abramov' },
    createdAt: new Date(Date.now() - 100000000).toISOString(),
    updatedAt: new Date(Date.now() - 100000000).toISOString(),
    likes: 120,
    tags: ['React', 'JavaScript', 'Frontend']
  },
  {
    id: '2',
    slug: 'mastering-tailwind-v4',
    title: 'Mastering Tailwind CSS v4',
    content: '<p>Tailwind CSS v4 introduces a completely redesigned engine. No more tailwind.config.js!</p>',
    author: { name: 'Adam Wathan', handle: '@adamwathan', avatar: 'https://ui-avatars.com/api/?name=Adam+Wathan' },
    createdAt: new Date(Date.now() - 50000000).toISOString(),
    updatedAt: new Date(Date.now() - 50000000).toISOString(),
    likes: 340,
    tags: ['CSS', 'Tailwind', 'Design']
  },
  {
    id: '3',
    slug: 'building-local-first-apps',
    title: 'Building Local-First Web Applications',
    content: '<p>Why build local-first? It is faster, offline-capable, and respects user privacy. In this article, we explore localforage and IndexedDB.</p>',
    author: { name: 'Local Dev', handle: '@localdev', avatar: 'https://ui-avatars.com/api/?name=Local+Dev' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 85,
    tags: ['Architecture', 'IndexedDB', 'LocalFirst']
  }
];

export async function seedDatabase() {
  const existing = await db.getArticles();
  if (existing.length === 0) {
    console.log('Seeding demo articles...');
    for (const article of demoArticles) {
      await db.saveArticle(article);
    }
  }
}
