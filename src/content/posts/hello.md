---
title: 블로그를 새로 만들었다
description: Jekyll을 걷어내고 Astro로 옮겼다. 이 글은 템플릿 겸 첫 글이다.
pubDate: 2026-08-12
tags: ['블로그']
---

블로그 기반을 Astro로 새로 세웠다. 이 글은 지워도 되는 예시 겸 템플릿이다.

## 글 쓰는 법

`src/content/posts/` 아래에 `.md` 또는 `.mdx` 파일을 만든다. 파일명이 그대로 URL이 된다 —
`src/content/posts/hello.md` → `/posts/hello/`.

프론트매터는 이렇게 쓴다.

```yaml
---
title: 제목 # 필수
description: 목록과 검색 결과에 보이는 한 줄 # 선택
pubDate: 2026-08-12 # 필수
updatedDate: 2026-08-20 # 선택
tags: ['태그1', '태그2'] # 선택
draft: false # true면 배포에서 제외 (로컬에서는 보임)
---
```

스키마는 `src/content.config.ts`에 있다. 필수 필드가 빠지면 빌드가 실패하니,
오타 난 글이 조용히 배포되는 일은 없다.

## 확인하고 올리기

```bash
npm run dev     # 로컬 미리보기
npm run build   # 배포 전 검증
```

`main`에 푸시하면 GitHub Actions가 빌드해서 Pages로 배포한다.
