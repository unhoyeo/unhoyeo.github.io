import { getCollection, type CollectionEntry } from 'astro:content';
import { LOCALE } from './consts';

/** 발행된 글을 최신순으로. 드래프트는 프로덕션 빌드에서만 제외한다. */
export async function getPublishedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
