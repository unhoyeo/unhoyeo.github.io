---
title: "SQL – 조회, 필터링, 정렬 (WHERE, ORDER BY, LIMIT)"
description: "데이터베이스에 데이터를 저장하는 것만큼 중요한 것은, 저장된 데이터를 원하는 조건에 맞게 조회하고, 의미 있는 순서로 정렬하여 가치 있는 정보로 만드는 것입니다. 이 모든 작업의 중심에는 SELECT 문이 있다."
pubDate: 2025-09-17T20:42:11+09:00
category: "데이터베이스"
tags: []
---

데이터베이스에 데이터를 저장하는 것만큼 중요한 것은, 저장된 데이터를 원하는 **조건에 맞게 조회**하고, 의미 있는 순서로 **정렬**하여 가치 있는 정보로 만드는 것입니다. 이 모든 작업의 중심에는 SELECT 문이 있다.

---

## SELECT와 FROM: 조회문의 기본 뼈대

SELECT 문은 두 가지 핵심 요소로 시작한다.

- **SELECT**: 조회할 **열(Column)**을 지정 (무엇을 가져올 것인가?)
- **FROM**: 데이터가 들어있는 **테이블(Table)**을 지정 (어디에서 가져올 것인가?)

가장 기본적인 형태는 **\* 와일드카드**를 사용하여 테이블의 모든 열을 조회하는 것이다.

```sql
SELECT * FROM customers;
```

하지만 실무에서는 **성능 저하**와 **가독성 문제**를 피하기 위해, \* 대신 **필요한 열의 이름만 명시적으로 지정**하는 것이 좋다.

또한, **AS** 키워드를 사용하여 열 이름에 '고객명'과 같은 **별칭(Alias)**을 붙이면 가독성을 크게 향상시킬 수 있다.

```sql
SELECT
    name AS 고객명,
    email AS 이메일
FROM
    customers;
```

별칭에 공백과 같은 특수 문자를 포함하려면 **백틱(`)**으로 감싸주면 된다.

```sql
SELECT
    name AS `상품 이름`,
    stock_quantity AS `남은 수량`
FROM
    products;
```

---

## WHERE: 원하는 데이터만 골라내기 (필터링)

WHERE 절은 FROM 절 뒤에 위치하며, 테이블의 전체 데이터 중 **특정 조건을 만족하는 행(Row)**만 걸러내는 필터 역할을 한다.

=, !=, >, < 등의 **비교 연산자**와 AND, OR, NOT 같은 **논리 연산자**를 조합하여 복잡한 조건을 만들 수 있다.

```sql
-- 가격이 5000원 이상이면서, 재고가 50개 이상인 상품 조회
SELECT * FROM products
WHERE price >= 5000 AND stock_quantity >= 50;
```

SQL은 더 간결하고 직관적인 검색을 위해 다음과 같은 유용한 연산자들을 제공한다.

- **BETWEEN a AND b**: a와 b 사이의 값(양 끝 값 포함)을 검색한다.
- **IN (목록)**: 괄호 안의 목록 중 **하나라도 일치하는 값**을 검색한다. (여러 OR 조건을 사용하는 것보다 훨씬 가독성이 좋다.)
- **LIKE**: 문자열의 일부 패턴으로 검색할 때 사용하며, %(0개 이상의 모든 문자)와 \_(정확히 한 개의 문자) 와일드카드와 함께 사용된다.
- **IS NULL**: 값이 NULL인 데이터를 찾는다.

```sql
SELECT * FROM products WHERE price BETWEEN 5000 AND 15000;
SELECT * FROM products WHERE price NOT BETWEEN 5000 AND 15000;

SELECT * FROM products WHERE name IN ('갤럭시', '아이폰', '에어팟');
SELECT * FROM products WHERE name NOT IN ('갤럭시', '아이폰', '에어팟');

SELECT * FROM customers WHERE name LIKE '김_연';
SELECT * FROM customers WHERE address NOT LIKE '서울%';

SELECT * FROM products WHERE description IS NULL;
SELECT * FROM products WHERE description IS NOT NULL;
```

---

## ORDER BY: 결과 정렬하기

ORDER BY 절은 SELECT 문의 **가장 마지막**에 위치하며, 조회된 결과를 **특정 열 기준으로 정렬**한다.

ORDER BY를 명시하지 않으면 결과의 순서는 보장되지 않는다.

- **ASC** (Ascending): **오름차순** (기본값이므로 생략 가능)
- **DESC** (Descending): **내림차순**
- **다중 열 정렬**: 콤마(,)로 여러 열을 나열하여 1차, 2차 정렬 기준을 지정할 수 있다.

```sql
-- 재고 많은 순, 재고가 같다면 가격 낮은 순으로 정렬
SELECT * FROM products
ORDER BY stock_quantity DESC, price;
```

---

## LIMIT: 조회 개수 제한과 페이징

LIMIT 절은 **조회 결과의 개수를 제한**하기 위해 사용하며, 의미 있는 결과를 얻기 위해 **ORDER BY와 함께 사용**하는 것이 중요하다.

- **LIMIT n**: 상위 n개의 결과만 가져온다.

```sql
-- 가장 비싼 상품 2개만 조회
SELECT * FROM products
ORDER BY price DESC
LIMIT 2;
```

- **LIMIT offset, row\_count**:
  - offset: **시작 위치 (0부터 시작)** → 생략 시 0으로 간주
  - row\_count: **가져올 행(row)의 개수**
  - 즉, **offset 개수만큼 건너뛰고, row\_count 개수만큼 결과를 가져온다.**
  - 이는 **페이징(Pagination)** 기능 구현의 핵심이다.

```sql
-- offset 공식
offset = (page_number - 1) * page_size
```

```sql
-- 한 페이지당 10개의 상품을 보여줄 때, 3페이지 조회
SELECT * FROM products
ORDER BY product_id
LIMIT 20, 10; -- offset = (3 - 1) * 10 = 20
```

- **OFFSET** 키워드와 함께 사용하여 가독성을 향상시킬 수 있다.

```sql
SELECT * FROM products
ORDER BY product_id
LIMIT 10 OFFSET 20; -- 20개를 건너뛰고, 21번째부터 10개 조회
```

---

## DISTINCT: 중복 제거

SELECT 키워드 바로 뒤에 DISTINCT를 사용하면, 조회 결과에서 **중복된 행을 제거하고 고유한 값만** 남겨준다.

```sql
-- 주문한 적 있는 고객 ID 목록을 중복 없이 조회
SELECT DISTINCT customer_id FROM orders;
```

---

## ⚠️ NULL의 특별한 취급: '알 수 없는 값'

데이터베이스에서 NULL은 숫자 0이나 빈 문자열('')과는 완전히 다른, **'알 수 없는 값' 또는 '존재하지 않는 값'**을 의미하는 특별한 상태다.

- **비교**: NULL은 특정 값이 아니므로 **등호(=)로 비교할 수 없다.**
  - WHERE description = NULL과 같은 조건은 항상 '**알 수 없음(UNKNOWN)**'으로 판별되어 아무 결과도 반환하지 않는다.
  - 따라서 NULL 값을 찾기 위해서는 반드시 **IS NULL** 또는 **IS NOT NULL**을 사용해야 한다.
- **정렬**: MySQL에서 NULL은 **가장 작은 값으로 취급된다.**
  - 오름차순(ASC) 정렬 시 NULL 값이 가장 먼저 나온다.
  - 내림차순(DESC) 정렬 시 NULL 값이 가장 나중에 나온다.

---

**? NULL을 가장 큰 값으로 취급하려면?**

SELECT 절에 **IS NULL 컬럼**을 추가하여, ORDER BY 절에 조건을 추가하는 트릭을 사용하면 된다.

```sql
-- description 기준으로 내림차순 정렬하되, description이 NULL인 행이 가장 먼저 나오도록 조회
SELECT
    product_id,
    name,
    description,
    description IS NULL -- NULL인 경우 1, 아닌 경우 0
FROM
    products
ORDER BY
    description IS NULL DESC, -- NULL인 경우 1이므로, 내림차순 정렬
    description DESC;
```
