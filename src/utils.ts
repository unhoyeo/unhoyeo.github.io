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

export interface CategoryNode {
  /** 이 단계의 이름 (예: '시큐리티') */
  name: string;
  /** 루트부터의 전체 경로 (예: '스프링/시큐리티'). localStorage 키와 링크에 쓴다 */
  path: string;
  /** 이 노드에 직접 속한 글 (하위 노드의 글은 포함하지 않는다) */
  posts: CollectionEntry<'posts'>[];
  children: CategoryNode[];
  /** 자기 글 + 모든 하위 글의 합. 접힌 상태에서도 규모를 알 수 있어야 하므로 */
  total: number;
}

/*
 * `category: 스프링/시큐리티`를 세그먼트 배열로 자른다.
 * 앞뒤 공백과 빈 세그먼트(`//`)는 버리고, 전부 비면 '기타'로 본다.
 */
export function parseCategory(raw?: string): string[] {
  const segments = (raw ?? '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments : [UNCATEGORIZED];
}

/** 경로의 조상까지 포함한 접두 경로들. '스프링/시큐리티' → ['스프링', '스프링/시큐리티'] */
export function categoryAncestors(segments: string[]): string[] {
  return segments.map((_, i) => segments.slice(0, i + 1).join('/'));
}

/*
 * 각 depth에서 같은 규칙으로 정렬한다: 합계 많은 순 → 이름 오름차순.
 * '기타'는 루트에서만 나오고 개수와 무관하게 맨 마지막이다.
 */
function sortNodes(nodes: CategoryNode[]): CategoryNode[] {
  nodes.sort((a, b) => {
    if (a.name === UNCATEGORIZED) return 1;
    if (b.name === UNCATEGORIZED) return -1;
    return b.total - a.total || a.name.localeCompare(b.name, 'ko');
  });
  nodes.forEach((node) => sortNodes(node.children));
  return nodes;
}

/*
 * 사이드바 주제 트리. 드래프트 처리는 getPublishedPosts()에 위임하고,
 * 노드 안 글 순서도 그 최신순 정렬을 그대로 물려받는다.
 * 중간 노드는 자기 글이 없어도 경로상 존재하면 만들어진다
 * (예: '자바/동시성/가상스레드'만 있어도 '자바'와 '자바/동시성' 노드가 생긴다).
 */
export async function getPostsByCategory(): Promise<CategoryNode[]> {
  const posts = await getPublishedPosts();
  const roots: CategoryNode[] = [];

  const childOf = (siblings: CategoryNode[], name: string, path: string) => {
    let node = siblings.find((n) => n.name === name);
    if (!node) {
      node = { name, path, posts: [], children: [], total: 0 };
      siblings.push(node);
    }
    return node;
  };

  for (const post of posts) {
    const segments = parseCategory(post.data.category);
    let siblings = roots;
    let node: CategoryNode | undefined;

    segments.forEach((name, i) => {
      node = childOf(siblings, name, segments.slice(0, i + 1).join('/'));
      node.total += 1; // 지나가는 모든 조상의 합계에 포함된다
      siblings = node.children;
    });

    node?.posts.push(post);
  }

  return sortNodes(roots);
}

/** 트리를 깊이 우선으로 펼친다. 카테고리 페이지의 getStaticPaths용 */
export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children)]);
}

/** 노드와 그 하위 전부의 글을 최신순으로 */
export function postsUnder(node: CategoryNode): CollectionEntry<'posts'>[] {
  const all = [...node.posts, ...node.children.flatMap(postsUnder)];
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export interface Crumb {
  label: string;
  href?: string;
}

/** 상단바 경로 표시용. 카테고리 세그먼트는 링크, 마지막 글 제목은 링크 없음 */
export function postCrumbs(post: CollectionEntry<'posts'>): Crumb[] {
  const segments = parseCategory(post.data.category);
  return [
    ...categoryAncestors(segments).map((path, i) => ({
      label: segments[i],
      href: `/categories/${path}/`,
    })),
    { label: post.data.title },
  ];
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
