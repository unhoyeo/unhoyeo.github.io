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
  content/posts/     글 (.md / .mdx) — 파일명이 URL slug
  content.config.ts  프론트매터 스키마 (여기 안 맞으면 빌드 실패)
  pages/             라우트
  layouts/Base.astro 공통 레이아웃
  components/        Header, Footer, PostList, BaseHead
  styles/global.css  디자인 토큰 + 기본 타이포
  consts.ts          사이트 제목·네비·소셜 링크
public/              그대로 복사되는 정적 파일
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

`draft: true`면 로컬에서는 보이고 배포에서는 빠진다.

## 디자인 바꾸기

색·타이포·간격은 전부 `src/styles/global.css`의 `:root` 토큰에 있다.
컴포넌트는 원시값을 쓰지 않고 `var(--...)`만 참조하므로, 토큰 값만 바꾸면 전체 톤이 따라온다.
다크모드는 `prefers-color-scheme`과 헤더의 토글(localStorage) 양쪽을 지원한다.
