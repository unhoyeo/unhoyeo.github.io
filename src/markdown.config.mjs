/*
 * 사이트의 마크다운 렌더링 설정.
 *
 * astro.config.mjs(빌드 때 글을 렌더한다)와 /admin의 실시간 프리뷰(브라우저에서
 * 같은 파이프라인을 돌린다)가 반드시 같은 값을 써야 한다. 한쪽만 바뀌면 프리뷰에서
 * 본 화면과 배포된 글이 달라지므로, 설정은 여기 한 곳에만 둔다.
 */
/**
 * 타입을 명시해 둔다. 여기는 .mjs라 그냥 두면 테마 이름이 string으로 넓어져,
 * 이 값을 받는 쪽(astro.config, createMarkdownProcessor)에서 타입이 맞지 않는다.
 *
 * @type {import('astro').ShikiConfig}
 */
export const shikiConfig = {
  themes: { light: 'github-light', dark: 'github-dark' },
  // 긴 줄은 접지 않고 가로 스크롤한다 — 들여쓰기 정렬이 코드에서는 정보다
  wrap: false,
};

/**
 * Astro의 `markdown` 옵션이자 createMarkdownProcessor()에 그대로 넘기는 값
 *
 * @type {import('astro').AstroUserConfig['markdown']}
 */
export const markdownConfig = { shikiConfig };
