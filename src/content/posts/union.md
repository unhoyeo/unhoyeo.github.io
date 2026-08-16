---
title: "UNION"
description: "먼저, JOIN과 UNION의 근본적인 차이를 이해하는 것이 중요하다. JOIN: 여러 테이블을 옆으로(수평으로) 이어 붙여, 더 많은 열(Column)을 가진 하나의 결과 집합을 만든다."
pubDate: 2025-09-19T17:32:04+09:00
category: "데이터베이스"
tags: []
---

## JOIN vs UNION: 수평 결합과 수직 결합

먼저, JOIN과 UNION의 근본적인 차이를 이해하는 것이 중요하다.

- **JOIN**:
  - 여러 테이블을 <strong>옆으로(수평으로)</strong> 이어 붙여, <strong>더 많은 열(Column)</strong>을 가진 하나의 결과 집합을 만든다.
  - 즉, 데이터의 정보를 풍성하게 만드는 기술이다.
- **UNION**:
  - 여러 SELECT 문의 결과 집합을 <strong>아래로(수직으로)</strong> 이어 붙여, <strong>더 많은 행(Row)</strong>을 가진 하나의 결과 집합을 만든다.
  - 즉, 흩어진 집합들을 하나로 모으는 기술이다.

## ⚠️ 주의: UNION 규칙

- UNION 으로 연결되는 모든 SELECT 문은 **컬럼의 개수가 동일**해야 한다.
- 각 SELECT 문의 같은 위치에 있는 컬럼들은 **서로 호환 가능한 데이터 타입**이어야 한다.
- 최종 결과의 컬럼 이름은 **첫 번째 SELECT 문의 컬럼 이름**을 따른다.

예시: "활동 고객과 탈퇴 고객 모두에게 이메일을 보내기 위해, 두 테이블에 흩어진 이름과 이메일을 하나의 목록으로 만들기"

```sql
SELECT name, email FROM users
UNION
SELECT name, email FROM retired_users;
```

이처럼 **구조는 비슷하지만 서로 다른 테이블의 데이터를 합쳐야 할 때** UNION을 사용한다.

---

## UNION vs UNION ALL: 중복 처리의 차이와 성능

UNION과 UNION ALL의 유일한 차이점은 **중복된 행을 처리하는 방식**이다.

- **UNION (중복 자동 제거)**
  - UNION은 두 결과 집합을 합친 뒤, **완전히 중복되는 행을 자동으로 제거**하여 고유한 값만 남긴다.
  - 예를 들어, '나중복' 고객이 users와 retired\_users 테이블 양쪽에 모두 존재하더라도, 최종 결과에는 **한 번만** 포함된다.
- **UNION ALL (중복 허용)**
  - UNION ALL은 중복 제거 과정 없이, 두 결과 집합을 **그대로 모두 합친다**.
  - 예를 들어, '나중복' 고객이 users와 retired\_users 테이블 양쪽에 모두 존재하면, 최종 결과에 **두 번** 포함된다.

---

## ✅ 실무에서는 UNION ALL을 우선 사용하라

UNION은 중복을 제거하기 위해 내부적으로 **전체 결과를 정렬하고 비교**하는 추가적인 작업을 수행해야 하므로, 데이터의 양이 많아질수록 성능이 크게 저하될 수 있다.

하지만 UNION ALL은 그런 과정 없이 그대로 합치므로, **UNION ALL이 UNION보다 훨씬 빠르다.**

따라서 **중복이 없는 고유한 목록이 반드시 필요할 때만 UNION을 사용**하고,

그 외 모든 경우(중복이 없음을 알거나 중복이 허용되어도 상관없는 경우)에는 **성능을 위해 항상 UNION ALL을 우선적으로 사용**해야 한다.

---

## UNION 결과 정렬하기 (ORDER BY)

UNION으로 합친 최종 결과 집합을 정렬할 때는 다음과 같은 규칙을 따라야 한다.

1. ORDER BY 절은 전체 UNION 쿼리의 **가장 마지막에 한 번만 사용**해야 한다.
2. ORDER BY 절에서는 **첫 번째 SELECT 문의 열 이름이나 별칭(Alias)만 사용**할 수 있다.
   - 이는 위에서 언급했듯이, 최종 결과 집합의 열 이름이 첫 번째 SELECT 문을 따르기 때문이다.

```sql
-- 오류 발생하는 코드
SELECT name, email, created_at FROM users
UNION ALL
SELECT name, email, retired_date FROM retired_users
ORDER BY retired_date; -- 첫 번째 SELECT 문에 없는 컬럼
```

created\_at과 retired\_date처럼 **의미는 같지만 이름이 다른 열을 합칠 때는**, event\_date와 같이 **공통된 별칭**을 사용하는 것이 좋다.

```sql
SELECT name, email, created_at AS event_date FROM users
UNION ALL
SELECT name, email, retired_date AS event_date FROM retired_users
ORDER BY event_date DESC; -- 공통된 별칭을 사용하여 정렬
```

이렇게 하면 ORDER BY event\_date와 같이 코드를 더 명확하고 일관성 있게 작성할 수 있다.
