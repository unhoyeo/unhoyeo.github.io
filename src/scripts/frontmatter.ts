/*
 * 글 파일의 frontmatter를 읽고 쓴다.
 *
 * 읽기는 Astro가 빌드 때 쓰는 파서를 그대로 빌려 쓴다 — 편집기가 해석하는 값과
 * 빌드가 해석하는 값이 갈리면 안 되기 때문이다.
 * 쓰기는 직접 만든다. js-yaml의 dump는 따옴표·줄바꿈 스타일이 기존 글들과 달라서
 * 한 글자만 고쳐도 frontmatter 전체가 통째로 바뀐 diff가 나온다.
 */
import { parseFrontmatter } from '@astrojs/markdown-remark';

/** content.config.ts의 스키마와 같은 필드. 날짜는 파일에 적힌 문자열 그대로 들고 다닌다 */
export interface PostMeta {
  title: string;
  description?: string;
  /** 예: 2026-09-01T21:30:00+09:00 */
  pubDate: string;
  updatedDate?: string;
  /** '스프링/로깅'처럼 /로 계층을 나타낸다 */
  category?: string;
  tags: string[];
  draft: boolean;
}

export interface ParsedPost {
  meta: PostMeta;
  body: string;
}

/*
 * 날짜는 파싱된 값(Date)이 아니라 원문에서 직접 꺼낸다.
 * `pubDate: 2026-08-13`처럼 시각이 없는 글을 Date로 받아 다시 찍으면
 * 09:00 같은 시각이 붙어 버린다. 건드리지 않은 필드는 원문 그대로 남겨야 한다.
 */
function rawScalar(rawFrontmatter: string, key: string): string | undefined {
  const match = rawFrontmatter.match(new RegExp(`^${key}:[ \\t]*(.+?)[ \\t]*$`, 'm'));
  if (!match) return undefined;
  return match[1].replace(/^['"]|['"]$/g, '');
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

export function parsePost(source: string): ParsedPost {
  const { frontmatter, rawFrontmatter, content } = parseFrontmatter(source);
  const data = frontmatter as Record<string, unknown>;

  return {
    meta: {
      title: typeof data.title === 'string' ? data.title : '',
      description: typeof data.description === 'string' ? data.description : undefined,
      pubDate: rawScalar(rawFrontmatter, 'pubDate') ?? nowInSeoul(),
      updatedDate: rawScalar(rawFrontmatter, 'updatedDate'),
      category: typeof data.category === 'string' ? data.category : undefined,
      tags: asTags(data.tags),
      draft: data.draft === true,
    },
    // 본문은 frontmatter 바로 뒤의 빈 줄부터 시작한다
    body: content.replace(/^\n+/, ''),
  };
}

/*
 * YAML 이중 따옴표 문자열은 JSON 문자열과 이스케이프 규칙이 같다.
 * 기존 글들이 전부 이중 따옴표를 쓰므로 그 표기를 따른다.
 */
function quote(value: string): string {
  return JSON.stringify(value);
}

/** 기존 글들과 같은 필드 순서·표기로 파일 한 편을 만든다 */
export function serializePost({ meta, body }: ParsedPost): string {
  const lines = ['---', `title: ${quote(meta.title)}`];
  if (meta.description) lines.push(`description: ${quote(meta.description)}`);
  lines.push(`pubDate: ${meta.pubDate}`);
  if (meta.updatedDate) lines.push(`updatedDate: ${meta.updatedDate}`);
  if (meta.category) lines.push(`category: ${quote(meta.category)}`);
  lines.push(`tags: [${meta.tags.map(quote).join(', ')}]`);
  /*
   * 초안일 때만 적는다. 스키마 기본값이 false라서 발행된 글은 이 줄을 아예 안 쓰는 것이
   * 이 저장소의 관례다(명시한 글 0편). 굳이 적으면 글을 고칠 때마다 없던 줄이 하나씩 붙는다.
   */
  if (meta.draft) lines.push('draft: true');
  lines.push('---', '');

  const text = body.replace(/^\n+/, '').replace(/\s+$/, '');
  return `${lines.join('\n')}\n${text}\n`;
}

/*
 * 블로그가 한국 시간 기준이라 새 글의 pubDate도 KST로 찍는다.
 * hourCycle: 'h23'이 아니면 자정이 24시로 나오는 엔진이 있다.
 */
export function nowInSeoul(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const at = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  return `${at('year')}-${at('month')}-${at('day')}T${at('hour')}:${at('minute')}:${at('second')}+09:00`;
}

/** '스프링, 로깅 , ' → ['스프링', '로깅'] */
export function parseTagInput(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
