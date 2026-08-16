---
title: "데이터 무결성 (Data Integrity), 제약 조건 (Constraints)"
description: "데이터 무결성이란 데이터의 정확성, 일관성, 유효성을 유지하려는 성질을 의미한다. 데이터베이스의 가장 근본적인 역할은 데이터를 빠르고 효과적으로 조회하는 것뿐만 아니라, 데이터를 안전하고 정확하게 지키고 관리하는 것이다."
pubDate: 2025-09-21T15:18:24+09:00
category: "데이터베이스"
tags: []
---

## 데이터 무결성(Data Integrity)이란 무엇이며 왜 중요한가?

**데이터 무결성**이란 데이터의 정확성, 일관성, 유효성을 유지하려는 성질을 의미한다.

데이터베이스의 가장 근본적인 역할은 데이터를 빠르고 효과적으로 조회하는 것뿐만 아니라,

데이터를 안전하고 정확하게 지키고 관리하는 것이다.

"쓰레기가 들어가면, 쓰레기가 나온다 (Garbage In, Garbage Out)"는 컴퓨터 과학의 격언처럼,

잘못된 데이터가 데이터베이스에 저장되는 순간, 그 데이터를 기반으로 한 모든 분석과 애플리케이션의 동작은 신뢰를 잃게 된다.

따라서 데이터베이스는 애플리케이션의 버그나 사용자의 실수로부터 데이터를 보호하는 최후의 보루 역할을 해야 하며,

이를 위해 테이블의 특정 컬럼에 <strong>제약 조건(Constraints)</strong>이라는 강력한 규칙을 사용한다.

---

## 기본 제약 조건: 한 테이블 내에서의 규칙

## NOT NULL

- 역할: 해당 열에 NULL 값(값이 없는 상태)이 저장되는 것을 방지하여, 필수 정보의 누락을 막는다.
- 위반 시: Column '...' cannot be null과 같은 오류를 발생시키며 데이터 입력을 거부한다.

## UNIQUE

- 역할: 해당 열의 모든 값이 테이블 내에서 고유해야 함을 보장하여, 중복 데이터가 쌓이는 것을 막는다.
- 위반 시: Duplicate entry '...' for key '...'과 같은 오류를 발생시키며 데이터 입력을 거부한다.

## PRIMARY KEY (기본 키)

- 역할: 테이블의 각 행을 고유하게 식별하는 대표 키로, NOT NULL과 UNIQUE 제약 조건의 특징을 모두 포함한다.
- 특징: 테이블당 하나만 설정할 수 있으며, 데이터 검색 성능에도 매우 중요한 역할을 한다.

## DEFAULT

- 역할: 특정 열에 값을 명시적으로 입력하지 않았을 때, 자동으로 설정될 기본값을 지정한다.
- 특징: 데이터 누락을 방지하고 입력을 편리하게 해준다.

---

## 외래 키 제약 조건: 테이블 간의 관계 지키기

**참조 무결성**(Referential Integrity)은 두 테이블 사이의 관계가 항상 유효하고 일관된 상태를 유지해야 한다는 원칙이다.

이를 강제하는 가장 강력한 제약 조건이 바로 외래 키 제약 조건이다.

## 역할:

- 유령 데이터 생성 방지:
  - 부모 테이블에 존재하지 않는 값을 자식 테이블에 입력하는 것을 막는다.
- 기존 데이터를 유령 데이터로 만드는 것 방지:
  - 자식 테이블에서 참조하고 있는 부모 테이블의 데이터를 함부로 삭제하거나 수정하지 못하게 막는다.

---

## ON DELETE / ON UPDATE 옵션

외래 키 제약 조건에는 ON DELETE / ON UPDATE 옵션이 존재한다.

이를 통해 부모 데이터가 변경될 때 자식 데이터가 어떻게 동작할지 설정할 수 있다.

- **RESTRICT (기본값)**:

  - 자식 행이 있으면 부모 행의 변경/삭제를 막는다.
- **CASCADE**:

  - 부모 행이 변경/삭제되면, 이를 참조하는 자식 행도 함께 자동 변경/삭제된다.
  - ⚠️ 이 옵션은 편리하지만 의도치 않은 대량 데이터 변경을 유발할 수 있어, 실무에서는 신중하게 사용해야 한다.
  - 따라서 실무에서는 CASCADE 옵션 대신, 애플리케이션 계층에서 명시적으로 관련 데이터를 처리하는 방식을 선호한다.
- **SET NULL**:

  - 부모 행이 변경/삭제되면, 자식 행의 해당 외래 키 컬럼 값을 NULL로 설정한다.
  - 단, 이 옵션을 사용하려면 자식 테이블의 외래 키 컬럼이 NULL 값을 허용해야 한다.

```sql
CREATE TABLE orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL, -- 외래 키
    product_id BIGINT NOT NULL, -- 외래 키
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    quantity INT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',

    CONSTRAINT fk_orders_users -- 자식 테이블 → 부모 테이블 순으로 보통 네이밍
    	FOREIGN KEY (user_id) -- 자식 테이블(현재 테이블)의 외래 키 컬럼
        REFERENCES users (user_id) -- 부모 테이블의 기본 키 컬럼
        ON DELETE CASCADE, -- ON DELETE CASCADE 옵션 추가

    CONSTRAINT fk_orders_products
    	FOREIGN KEY (product_id)
        REFERENCES products (product_id)
);
```

---

## CHECK 제약 조건: 데이터 내용에 대한 비즈니스 규칙 강제

기본 제약 조건과 외래 키 제약 조건이 데이터의 '**구조**'와 '**관계**'에 대한 무결성을 보장했다면,

CHECK 제약 조건은 컬럼에 들어갈 수 있는 값의 범위나 조건을 직접 지정하여, 데이터의 '**내용**'에 대한 비즈니스 규칙을 강제한다.

```sql
CREATE TABLE products (
    product_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price INT NOT NULL CHECK (price >= 0), -- CHECK 제약 조건 추가
    stock_quantity INT NOT NULL CHECK (stock_quantity >= 0), -- CHECK 제약 조건 추가
    discount_rate DECIMAL(5, 2) DEFAULT 0.00,

    -- CHECK 제약 조건도 이름 정의 가능
    CONSTRAINT products_chk_discount_rate
        CHECK (discount_rate BETWEEN 0.00 AND 100.00)
);
```

만약 INSERT 또는 UPDATE 시, CHECK 조건식을 만족하지 않으면 데이터베이스는 해당 작업을 거부하고 오류를 발생시킨다.

> 최근 실무에서는 유연성과 테스트 용이성 때문에 대부분의 유효성 검사를 애플리케이션 코드에서 처리하는 추세다.
> 데이터베이스의 CHECK 제약 조건은 간단하지만 절대 값이 바뀌면 안 되는 핵심 데이터에만 '최후의 방어선'으로 사용하는 것이 좋다.
