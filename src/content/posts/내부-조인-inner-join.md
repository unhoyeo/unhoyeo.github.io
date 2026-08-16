---
title: "내부 조인 (INNER JOIN)"
description: "데이터베이스를 잘 설계하려면 데이터의 중복을 막고 일관성을 지키기 위해 정규화(Normalization) 과정을 거쳐서 데이터를 여러 테이블로 나누어 저장해야 한다."
pubDate: 2025-09-17T21:47:08+09:00
category: "데이터베이스"
tags: ["SQL"]
---

## 조인(JOIN)이 필요한 이유: 흩어진 데이터를 연결하는 기술

데이터베이스를 잘 설계하려면 데이터의 중복을 막고 일관성을 지키기 위해 **정규화(Normalization)** 과정을 거쳐서

데이터를 여러 테이블로 나누어 저장해야 한다.

예를 들어, orders 테이블에는 고객의 이름이나 주소 대신 user\_id만 저장하고, users 테이블에서 실제 고객 정보를 관리해야 한다.

하지만 이렇게 잘 분리된 데이터에서 "어떤 고객이 어떤 상품을 주문했는지"와 같은 의미 있는 정보를 만들려면,

흩어진 데이터 조각들을 다시 합쳐야 한다. 이때 사용하는 기술이 바로 <strong>조인(JOIN)</strong>이다.

조인은 두 개 이상의 테이블을 특정 열(주로 기본 키와 외래 키)을 기준으로 연결하여, 마치 처음부터 하나의 테이블이었던 것처럼 보여주는 강력한 기능이다.

---

## 내부 조인 (INNER JOIN): 교집합을 찾아서

내부 조인(INNER JOIN)은 가장 기본적이고 널리 사용되는 조인 방식으로,

두 테이블을 연결할 때 양쪽 테이블에 모두 공통으로 존재하는 데이터만을 결과로 보여준다.

집합의 관점에서 보면 두 테이블의 **교집합**을 찾는 것과 같다.

예를 들어, orders 테이블과 users 테이블을 user\_id로 조인하면, 주문 기록이 있는 고객의 정보만 결과에 포함된다.

주문한 적이 없는 고객은 users 테이블에는 존재하지만, orders 테이블에는 없으므로 결과에서 제외된다.

```sql
SELECT
    u.name,
    o.order_date
FROM
    orders o
JOIN
    users u ON o.user_id = u.user_id;
```

- **FROM / JOIN**: 연결할 테이블들을 지정한다.
- **ON**: 두 테이블을 어떤 조건으로 연결할지 명시하는 가장 중요한 부분이다.
- **테이블 별칭 (Alias)**:
  - orders o, users u와 같이 테이블에 짧은 별칭을 부여하면 쿼리가 간결해지고 가독성이 높아진다.
  - 실무에서는 거의 항상 사용한다.
- **INNER 생략**:
  - INNER JOIN에서 INNER는 생략할 수 있다.
  - 실무에서는 보통 JOIN이라고만 작성한다.
- **조인 방향은 중요하지 않다**:
  - 내부 조인은 교집합을 찾는 연산이므로, orders JOIN users와 users JOIN orders는 항상 동일한 결과를 반환한다.
  - 하지만 쿼리를 읽는 사람의 입장에서, 주문 현황을 보는 것이 중심이라면 orders로 시작하는 것이 더 자연스러울 수 있다.

---

## 내부 조인의 작동 원리

데이터베이스는 다음과 같은 논리적 순서로 조인 쿼리를 처리한다.

1. **FROM / JOIN**: ON 절의 조건을 만족하는 행들을 결합하여 하나의 거대한 가상 테이블을 만든다.
2. **WHERE**: 생성된 가상 테이블에서 WHERE 절의 조건에 맞는 행들만 필터링한다.
3. **SELECT**: 최종적으로 필터링된 결과에서 SELECT 절에 명시된 열들만 추출하여 반환한다.

이 순서를 이해하면 복잡한 쿼리가 어떻게 작동하는지 명확하게 파악할 수 있다.

---

## 내부 조인 활용: 3개 테이블 조인 및 집계

조인은 여러 테이블에 걸쳐 확장할 수 있다.

예를 들어, orders, users, products 세 테이블을 모두 조인하면,

"어떤 고객이 어떤 상품을 언제 주문했는지"에 대한 완전한 정보를 얻을 수 있다.

또한, 집계 함수(SUM, COUNT 등)와 GROUP BY를 함께 사용하면 "고객별 총 구매액"과 같은 강력한 분석 데이터를 추출할 수 있다.

```sql
SELECT
    u.user_id AS user_id,
    SUM(o.quantity * p.price) AS total_purchase_amount
FROM
    orders o
JOIN
    users u ON o.user_id = u.user_id
JOIN
    products p ON o.product_id = p.product_id
GROUP BY
    u.user_id
ORDER BY
    total_purchase_amount DESC;
```
