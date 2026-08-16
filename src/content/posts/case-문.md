---
title: "CASE 문"
description: "JOIN이나 UNION이 데이터의 구조를 바꾸는 기술이었다면, CASE 문은 데이터의 '값 자체'를 특정 조건에 따라 동적으로 가공하고 새로운 의미를 부여하는 조건부 로직 도구다."
pubDate: 2025-09-19T17:58:32+09:00
category: "데이터베이스"
tags: []
---

## CASE 문: 데이터에 옷을 입히는 기술

JOIN이나 UNION이 데이터의 구조를 바꾸는 기술이었다면,

CASE 문은 데이터의 **'값 자체'**를 특정 조건에 따라 **동적으로 가공**하고 **새로운 의미를 부여**하는 조건부 로직 도구다.

---

## CASE 문의 두 가지 방식

CASE 문은 사용법에 따라 두 가지 방식으로 나뉜다.

## 1. 단순 CASE 문 (Simple CASE Expression)

- **하나의 특정 열**(Column) 값이 **정해진 값과 일치하는지**를 비교할 때 사용한다.
- "이 값이 A면 X, B면 Y"와 같이 명확하게 분기할 때 유용하다.

```sql
-- 주문 상태(status)를 영문에서 한글로 변환하기
SELECT
    order_id,
    CASE status
        WHEN 'PENDING'   THEN '주문 대기'
        WHEN 'COMPLETED' THEN '결제 완료'
        WHEN 'SHIPPED'   THEN '배송'
        ELSE '알 수 없음'
    END AS status_korean
FROM
    orders;
```

## 2. 검색 CASE 문 (Searched CASE Expression)

- 각 WHEN 절마다 **독립적인 조건식**을 사용하여 복잡한 논리를 구현할 때 사용한다.
- 가격 범위나 여러 열을 조합한 조건처럼 복잡한 경우에 주로 사용된다.

```sql
-- 상품 가격에 따라 등급 표시하기
SELECT
    name, price,
    CASE
        WHEN price >= 100000 THEN '고가'
        WHEN price >= 30000  THEN '중가'
        ELSE '저가'
    END AS price_label
FROM
    products;
```

**⚠️ 중요**: CASE 문은 WHEN 절을 **위에서 아래로 순차적으로 평가**하며, **가장 먼저 참이 되는 조건의 결과를 반환하고 즉시 평가를 종료한다.**

따라서 **조건의 순서**가 매우 중요하며, 보통 **범위가 좁고 구체적인 조건**을 더 넓고 포괄적인 조건보다 먼저 배치해야 한다.

---

## CASE 문의 고급 활용법

CASE 문의 진정한 힘은 다른 SQL 구문, 특히 **집계 함수**나 **GROUP BY**와 결합될 때 발휘된다.

## 1. 집계 함수와 함께 사용하기 (조건부 집계 및 피벗)

- CASE 문을 SUM()이나 COUNT() 같은 **집계 함수 내부**에 넣어, **특정 조건에 맞는 값만 골라서 집계**하는 조건부 집계 기법이다.
- 이는 행(Row)으로 표현된 데이터를 열(Column)로 변환하는 **피벗(Pivot)** 형태의 결과를 만들 때 매우 강력하다.
- 대표적으로 두 가지 패턴이 있다.
  - **SUM(CASE WHEN ... THEN 1 ELSE 0 END)**: 조건이 참이면 1, 아니면 0 반환 → **모든 값(1 또는 0)을 더한다.**
  - **COUNT(CASE WHEN ... THEN 1 END)**: 조건이 참이면 1 아니면 NULL 반환 → **NULL이 아닌 값만 센다.**

```sql
-- 전체 주문 건수와 상태별 주문 건수를 하나의 쿼리로 조회하기
SELECT
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    COUNT(CASE WHEN status = 'SHIPPED' THEN 1 END) AS shipped_count
FROM
    orders;
```

## 2. GROUP BY와 함께 사용하기 (동적 그룹핑)

- CASE 문을 사용해 기존에 없던 **새로운 분류 기준**을 동적으로 생성하고,
- 이를 GROUP BY의 기준으로 삼아 **그룹별 통계**를 낼 수 있다.

```sql
-- 출생 연대에 따라 고객 수를 집계하기
SELECT
    CASE
        WHEN YEAR(birth_date) >= 1990 THEN '1990년대생'
        WHEN YEAR(birth_date) >= 1980 THEN '1980년대생'
        ELSE '그 이전 출생'
    END AS birth_decade,
    COUNT(*) AS customer_count
FROM
    users
GROUP BY
    birth_decade; -- SELECT 절에서 만든 별칭을 GROUP BY에 사용
```

⚠️ SQL 표준의 논리적 실행 순서에 따르면 **GROUP BY 절이 SELECT 절보다 먼저 처리**되므로, 원칙적으로는 SELECT 절에서 정의한 별칭(birth\_decade)을 GROUP BY 절에서 사용할 수 없다. 하지만 MySQL을 포함한 많은 데이터베이스들은 사용자 편의를 위해 이러한 별칭 사용을 예외적으로 허용한다.
