import { getCollection, type CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import { LOCALE } from './consts';

/*
 * 목차에 넣을 헤딩. depth 2~3만 쓰고, 각주를 쓸 때 remark-gfm이 끼워 넣는
 * 화면에 안 보이는 h2("Footnotes", id=footnote-label)는 뺀다.
 * 레이아웃(레일을 만들지)과 컴포넌트(렌더할지)가 같은 판단을 해야 하므로 여기 둔다.
 */
export function tocHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
  return headings.filter(
    (h) => (h.depth === 2 || h.depth === 3) && h.slug !== 'footnote-label'
  );
}

/** 목차를 띄울 만한 글인지. 항목 하나짜리 목차는 의미가 없다. */
export function hasToc(headings: MarkdownHeading[]): boolean {
  return tocHeadings(headings).length > 1;
}

/** 발행된 글을 최신순으로. 드래프트는 프로덕션 빌드에서만 제외한다. */
export async function getPublishedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 카테고리가 없는 글이 모이는 그룹. 정렬에서 항상 맨 뒤로 간다 */
export const UNCATEGORIZED = '기타';

export interface CategoryGroup {
  name: string;
  posts: CollectionEntry<'posts'>[];
}

/*
 * 사이드바 주제 트리용. 드래프트 처리는 getPublishedPosts()에 위임한다.
 * 그룹은 글 많은 순 → 이름 오름차순, '기타'만 개수와 무관하게 맨 마지막.
 * 그룹 안 글은 getPublishedPosts()의 최신순 정렬을 그대로 물려받는다.
 */
export async function getPostsByCategory(): Promise<CategoryGroup[]> {
  const posts = await getPublishedPosts();

  const groups = new Map<string, CollectionEntry<'posts'>[]>();
  for (const post of posts) {
    const name = post.data.category?.trim() || UNCATEGORIZED;
    const bucket = groups.get(name);
    if (bucket) bucket.push(post);
    else groups.set(name, [post]);
  }

  return [...groups]
    .map(([name, items]) => ({ name, posts: items }))
    .sort((a, b) => {
      if (a.name === UNCATEGORIZED) return 1;
      if (b.name === UNCATEGORIZED) return -1;
      return b.posts.length - a.posts.length || a.name.localeCompare(b.name, 'ko');
    });
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
