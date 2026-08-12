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
