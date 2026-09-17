# unhoyeo.github.io

Astro로 만든 개인 블로그. `main`에 푸시하면 GitHub Actions가 빌드해서 Pages로 배포한다.

## 명령어

```bash
npm install     # 최초 1회
npm run dev     # http://localhost:4321
npm run build   # dist/ 로 정적 빌드
npm run preview # 빌드 결과 미리보기
```

## 구조

```
src/
  content/posts/       글 (.md / .mdx) — 파일명이 URL slug
  content.config.ts    프론트매터 스키마 (여기 안 맞으면 빌드 실패)
  pages/               라우트
  pages/admin.astro    브라우저에서 글을 쓰는 편집기 화면
  layouts/Base.astro   공통 레이아웃
  components/          Header, Footer, PostList, BaseHead
  scripts/             편집기 로직 + 글 페이지와 공유하는 클라이언트 스크립트
  styles/global.css    디자인 토큰 + 기본 타이포
  consts.ts            사이트 제목·네비·소셜 링크·저장소 정보
  markdown.config.mjs  마크다운·shiki 설정 (빌드와 편집기 프리뷰가 함께 쓴다)
public/                그대로 복사되는 정적 파일
```

## 글 쓰기

`src/content/posts/제목.md`:

```yaml
---
title: 제목
description: 한 줄 요약
pubDate: 2026-08-12
tags: ['태그']
draft: false
---
```

`draft: true`면 로컬에서는 보이고 배포에서는 빠진다. 발행된 글은 `draft` 줄을 아예 안 쓴다.

## 브라우저에서 글 쓰기 — `/admin`

파일을 만들고 커밋하고 푸시하는 대신, 배포된 사이트의 `/admin`에서 바로 쓴다.

- **왼쪽에 쓰면 오른쪽에 바로 렌더된다.** 프리뷰는 빌드가 쓰는 것과 **같은** 마크다운
  파이프라인(`@astrojs/markdown-remark` + `markdown.config.mjs`)을 브라우저에서 돌리고,
  CSS도 `global.css`를 그대로 쓴다. 그래서 프리뷰와 실제 글이 같은 화면이다.
- **저장을 누르면 GitHub API로 바로 커밋된다.** 이미지를 붙여넣으면 글과 **한 커밋에** 같이
  올라간다(`public/images/uploads/<slug>/`). 커밋 뒤 Actions 빌드가 끝날 때까지
  상단에 진행 상태가 뜨고, 끝나면 글 링크가 나온다 — 대략 1분.
- **글 페이지의 "수정" 버튼**이 그 글을 편집기에서 연다. 이미 있는 글은 제목을 고쳐도
  파일명(= 주소)을 바꾸지 않는다.
- 커밋 전 내용은 브라우저에 임시 저장되므로 새로고침해도 이어서 쓸 수 있다.

### 토큰

`/admin`은 정적 페이지고 서버가 없다. 쓰기 권한은 GitHub 토큰으로 얻는다.

1. [fine-grained 토큰](https://github.com/settings/personal-access-tokens/new)을 이 저장소에만,
   **Contents: Read and write** 권한으로 만든다.
2. `/admin`의 **토큰** 버튼에 붙여넣는다. 그 브라우저의 `localStorage`에만 저장되고
   GitHub 외에는 어디로도 나가지 않는다.

토큰이 없으면 글을 쓰고 미리 볼 수는 있지만 저장은 안 된다. 페이지 자체는 공개돼 있어도
(정적 호스팅이라 숨길 수 없다) 토큰 없이는 아무것도 바꿀 수 없고, `noindex`라 검색에는 안 걸린다.

## 디자인

ChatGPT 데스크톱 앱 UI를 참고했다.

- **좌측 고정 사이드바** — 브랜드 / 네비 / 최근 글 25편 / 하단 프로필. 글 목록만 스크롤되고
  위아래는 고정된다. 60rem 아래에서는 오프캔버스로 접히고 상단 햄버거로 연다.
- **코드블록** — 언어 라벨 바 + 복사 버튼. `scripts/codeBlocks.ts`가 shiki의 `data-language`를
  읽어 `<pre>`를 감싼다. 글 페이지(`CodeBlocks.astro`)와 `/admin` 프리뷰가 같은 함수를 부른다.
  언어 표시 이름은 그 파일의 `LABELS`에서 고친다.
- **무채색 팔레트** — 액센트 색을 따로 두지 않고 텍스트색을 쓴다.

색·타이포·간격은 전부 `src/styles/global.css`의 `:root` 토큰에 있고, 컴포넌트는 원시값 대신
`var(--...)`만 참조한다. 다크모드는 `prefers-color-scheme`과 상단 토글(localStorage) 양쪽을 지원하며,
`BaseHead.astro`의 인라인 스크립트가 첫 페인트 전에 적용해 깜빡임을 막는다.
