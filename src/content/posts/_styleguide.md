---
title: 스타일 가이드 — 모든 요소 점검용
description: 마크다운 요소가 새 디자인에서 의도대로 렌더되는지 확인하는 글. 배포에는 나가지 않는 draft다.
pubDate: 2026-08-13
updatedDate: 2026-08-13
tags: ['시안', '점검']
draft: true
---

이 글은 렌더 점검용이다. 마크다운에서 쓸 만한 요소를 한 번씩 넣어두고, 디자인이 바뀔 때마다 여기부터 확인한다. `draft: true`라 배포에는 나가지 않고 로컬(`npm run dev`)에서만 보인다.

본문 첫 문단은 이렇게 흐른다. 한글 가독성을 위해 행간을 1.75로 두고 `word-break: keep-all`을 걸었기 때문에, 긴 문장이라도 단어 중간에서 잘리지 않고 어절 단위로 넘어가야 한다. 이 문장은 그 줄바꿈이 실제로 어떻게 일어나는지 보려고 일부러 길게 쓴 것이다.

## 1. 텍스트 서식

**굵게**, *기울임*, ***굵은 기울임***, ~~취소선~~, `인라인 코드`, [링크](https://github.com/unhoyeo), 그리고 각주[^1]까지 한 문단에 넣으면 이렇게 보인다.

[^1]: 각주는 글 맨 아래로 내려간다. 번호를 누르면 본문 위치로 돌아온다.

숫자 범위는 `\~`로 이스케이프해서 쓴다 — 3\~5만 원처럼. 물결표 하나를 취소선으로 잘못 읽는 걸 막기 위해서다.

### 1.1 인용문

> 인용문은 왼쪽 세로선으로 표시한다. 배경색은 쓰지 않는다.
>
> 문단이 여럿이면 이렇게 이어진다.

> **중첩 인용:**
>
> > 인용 안의 인용은 선이 하나 더 생긴다.

### 1.2 수평선

아래가 수평선이다.

---

위아래 여백이 충분한지 본다.

## 2. 목록

### 2.1 순서 없는 목록

- 첫 항목
- 둘째 항목
  - 중첩된 항목
  - 또 다른 중첩 항목
    - 3단계까지
- 셋째 항목

### 2.2 순서 있는 목록

1. 첫 단계
2. 둘째 단계
   1. 하위 단계
   2. 또 하위 단계
3. 셋째 단계

### 2.3 체크리스트

- [x] 끝난 일
- [ ] 안 끝난 일
- [ ] 긴 항목도 넣어본다. 줄이 넘어갈 때 체크박스 기준으로 들여쓰기가 유지되는지 확인하려는 것이다.

## 3. 코드

### 3.1 언어별 코드블록

라벨 바에 언어 이름이 제대로 뜨는지 본다.

```java
private static final Logger log = LoggerFactory.getLogger(UserService.class);

public User find(Long id) {
    log.info("회원 조회: {}", id);
    return repository.findById(id).orElseThrow();
}
```

```bash
npm run dev     # 로컬 미리보기
npm run build   # 배포 전 검증
```

```typescript
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
}
```

### 3.2 언어를 안 적은 경우

```
Your Code
   |
   v
SLF4J API
   |
   v
Logback
   ├── Console
   └── File
```

### 3.3 가로로 긴 코드

옆으로 스크롤이 생겨야 하고, 페이지 전체가 가로로 밀리면 안 된다.

```java
public ResponseEntity<PageResponse<UserSummaryDto>> search(@RequestParam String keyword, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, @AuthenticationPrincipal UserDetails principal) {
    return ResponseEntity.ok(service.search(keyword, PageRequest.of(page, size), principal));
}
```

## 4. 표

좁은 표부터.

| 항목 | 값 |
|---|---|
| 사이드바 | `#222222` |
| 본문 | `#181818` |

열이 많은 표는 자기 영역 안에서만 가로 스크롤되어야 한다.

| 토큰 | 라이트 | 다크 | 쓰이는 곳 | 비고 |
|---|---|---|---|---|
| `--bg` | `#ffffff` | `#181818` | 본문 배경 | 기준색 |
| `--bg-sidebar` | `#fcfcfc` | `#222222` | 사이드바 | 다크에서 본문보다 밝다 |
| `--bg-subtle` | `#f4f4f4` | `#242424` | 코드블록 | 라벨 바와 같은 색 |
| `--toc-current` | `#d1d8dc` | `#3d3d3d` | 목차 현재 항목 | 실측값 |
| `--toc-parent` | `#edeff1` | `#2b2b2b` | 목차 상위 섹션 | 2단계 표시 |

## 5. 제목 단계 점검

### 5.1 h3은 목차에 들어간다

이 제목은 우측 목차에 들여쓴 채로 보여야 한다.

#### h4는 목차에 들어가지 않는다

h4는 우측 목차에 나타나지 않는다. 본문에서는 h3보다 작게 렌더된다. 목차에 h4까지 넣으면 깊이가 3단계가 되어 좁은 폭에서 읽기 어려워지므로 h2·h3만 잡는다.

##### h5도 마찬가지다

h5는 별도 스타일을 주지 않아 h4와 비슷하게 보인다. 실제 글에서는 h4 아래로 잘 내려가지 않는다.

### 5.2 아주 긴 제목이 목차에서 어떻게 줄바꿈되는지 확인하기 위한 의도적으로 긴 제목

목차 폭이 16rem이라 이 제목은 두 줄 이상으로 흐른다. 말줄임 없이 그대로 이어져야 한다.

## 6. 이미지

![파비콘 예시](/favicon.svg)

이미지는 최대 폭을 넘지 않고 모서리가 둥글게 처리된다.

## 7. 마치며

여기까지가 점검 항목이다. 목차를 눌러 이동했을 때 상단바에 제목이 가리지 않는지, 스크롤에 따라 목차 칩이 2단계로 따라오는지도 함께 본다.
