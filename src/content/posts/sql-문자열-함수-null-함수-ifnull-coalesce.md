---
title: "SQL – 문자열 함수, NULL 함수(IFNULL, COALESCE)"
description: "데이터베이스의 진정한 힘은 데이터를 단순히 저장하고 조회하는 것을 넘어, 저장된 데이터를 원하는 정보로 가공하고 계산하는 데 있다. SQL은 이를 위해 다양한 연산자와 내장 함수를 제공한다."
pubDate: 2025-09-17T21:05:47+09:00
category: "데이터베이스"
tags: []
---

데이터베이스의 진정한 힘은 데이터를 단순히 저장하고 조회하는 것을 넘어, 저장된 데이터를 원하는 정보로 가공하고 계산하는 데 있다.

SQL은 이를 위해 다양한 연산자와 내장 함수를 제공한다.

---

## 산술 연산: SQL로 직접 계산하기

SELECT 문 안에서 <strong>숫자 타입의 열(Column)</strong>에 사칙연산(+, -, \*, /)을 직접 적용하여 새로운 값을 계산할 수 있다.

이를 통해 애플리케이션에서 별도로 계산할 필요 없이 데이터베이스 단에서 원하는 정보를 바로 얻을 수 있다.

예를 들어, 상품의 재고 자산 총액(가격 \* 재고 수량)을 계산하고, AS를 사용해 total\_stock\_value라는 의미 있는 별칭을 붙여줄 수 있다.

```sql
SELECT
    name,
    price,
    stock_quantity,
    price * stock_quantity AS total_stock_value
FROM
    products;
```

---

## 문자열 함수: 텍스트 데이터 조합하고 변형하기

데이터를 사용자에게 보여주기 좋은 형태로 만들기 위해 문자열을 합치거나 형식을 바꾸는 작업은 매우 흔하다.

- **CONCAT(str1, str2, ...)**: 여러 문자열이나 열을 순서대로 이어 붙인다.

```sql
-- '홍길동 (hong@example.com)' 형태로 출력
SELECT
    CONCAT(name, ' (', email, ')') AS name_and_email
FROM
    customers;
```

- **CONCAT\_WS(separator, str1, str2, ...)**: 각 문자열 사이에 지정된 구분자(separator)를 자동으로 넣어 합친다.

```sql
-- '1-홍길동-hong@example.com' 형태로 출력
SELECT
    CONCAT_WS(' - ', customer_id, name, email) AS customer_data
FROM
    customers;
```

> CONCAT\_WS()는 MySQL 전용 함수이며, WS는 "With Separator"의 약자다.

- **UPPER() / LOWER()**: 문자열을 모두 대문자 또는 소문자로 변환한다. (대소문자 구분 없이 비교해야 할 때 유용하다.)
- **CHAR\_LENGTH() vs LENGTH()**:
  - CHAR\_LENGTH(): **글자 수**를 반환한다.
  - LENGTH(): **바이트(byte) 수**를 반환한다. (UTF-8 환경에서 한글은 보통 3바이트를 차지한다.)

---

## NULL 함수: '알 수 없는 값'을 우아하게 처리하기

데이터베이스의 NULL은 '알 수 없는 값'을 의미하는 특별한 상태로, 이를 그대로 사용자에게 노출하는 것은 좋지 않다.

NULL을 의미 있는 다른 값으로 대체하기 위해 다음과 같은 함수를 사용한다.

- **IFNULL(표현식1, 표현식2)**:
  - 표현식1이 NULL이면 표현식2를 반환하고, NULL이 아니면 표현식1의 값을 그대로 반환합니다.

```sql
-- description이 NULL이면 '상품 설명 없음'으로 표시
SELECT
    name,
    IFNULL(description, '상품 설명 없음') AS description
FROM
    products;
```

- **COALESCE(표현식1, 표현식2, ...)**:
  - 나열된 표현식들 중 처음으로 NULL이 아닌 값을 반환한다.
  - 여러 대안을 순서대로 검사할 수 있어 IFNULL보다 더 유연하고 확장성이 좋다.

```sql
-- short_description이 NULL이면 long_description 사용,
-- long_description이 NULL이면 '설명 없음'으로 표시
SELECT
    name,
    COALESCE(short_description, long_description, '설명 없음') AS description
FROM
    products;
```

> MySQL을 포함한 대부분의 데이터베이스는 이 외에도 수많은 내장 함수를 제공한다.
