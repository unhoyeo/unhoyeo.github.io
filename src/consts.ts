export const SITE_TITLE = 'unhoyeo blog';
export const SITE_TAGLINE = '개발하며 남기는 기록';
export const SITE_DESCRIPTION =
  '개발, 사이드 프로젝트, 그리고 만들면서 배운 것들을 기록하는 블로그입니다.';
export const SITE_URL = 'https://unhoyeo.github.io';
export const AUTHOR = '여운호';
export const LOCALE = 'ko-KR';

export const NAV_LINKS = [
  { href: '/', label: '홈' },
  { href: '/posts/', label: '글' },
  { href: '/tags/', label: '태그' },
  // '/about/'은 사이드바 하단 프로필이 담당하므로 네비에는 두지 않는다
];

export const SOCIAL_LINKS = [{ href: 'https://github.com/unhoyeo', label: 'GitHub' }];

/*
 * 글 페이지의 "수정" 링크가 가리킬 저장소. GitHub 웹 편집기로 바로 넘어간다.
 * 따로 인증 장치를 만들 필요가 없다 — 쓰기 권한이 있는 사람에게만 저장 버튼이
 * 열리고, 나머지에게는 GitHub이 알아서 읽기 전용으로 보여준다.
 */
export const REPO_URL = 'https://github.com/unhoyeo/unhoyeo.github.io';
export const REPO_BRANCH = 'main';
/** 글 파일이 사는 곳. content.config.ts의 glob base와 같아야 한다 */
export const POSTS_DIR = 'src/content/posts';
