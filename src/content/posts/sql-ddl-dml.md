---
title: "SQL – DDL, DML"
description: "이제부터 기본적인 SQL, 데이터 타입, 제약 조건을 이용하여 간단한 쇼핑몰 데이터베이스를 설계해 보자. 데이터 작업을 시작하기 전에, 데이터를 담을 가장 큰 단위인 데이터베이스를 만들고, 앞으로 작업할 공간으로 지정해야 한다."
pubDate: 2025-09-17T16:59:53+09:00
category: "데이터베이스"
tags: []
---

이제부터 기본적인 SQL, 데이터 타입, 제약 조건을 이용하여 간단한 쇼핑몰 데이터베이스를 설계해 보자.

---

## 데이터베이스 생성 및 선택

데이터 작업을 시작하기 전에, 데이터를 담을 가장 큰 단위인 **데이터베이스**를 만들고, 앞으로 **작업할 공간으로 지정**해야 한다.

- **CREATE DATABASE**:
  - 데이터베이스라는 거대한 저장 공간을 만드는 명령어다.
  - 쇼핑몰의 모든 데이터를 보관할 my\_shop이라는 전용 창고를 짓는 것과 같다.
  - 데이터베이스 이름은 관례적으로 **프로젝트 이름**이나 **서비스의 특징**을 나타내는 것으로 **소문자와 언더스코어**를 조합하여 만든다.

```
CREATE DATABASE my_shop;
```

- **USE**:
  - 여러 데이터베이스 중에서 **앞으로 작업할 데이터베이스**를 선택하는 명령어다.
  - 이 명령어를 실행해야 이후의 모든 SQL 명령어가 해당 데이터베이스 안에서 수행된다.

```
USE my_shop;
```

---

## 테이블 설계 (DDL)

데이터베이스라는 창고를 지었다면, 이제 데이터를 체계적으로 정리할 <strong>선반</strong>, 즉 <strong>테이블(Table)</strong>을 만들어야 한다.

- **CREATE TABLE**:
  - 테이블의 구조(설계도)를 정의하고 생성하는 명령어다.
  - 테이블을 구성할 <strong>열(Column)들의 이름</strong>과 각 열에 저장될 <strong>데이터의 종류(타입)</strong>를 지정해야 한다.

```sql
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT, -- PK
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

- **AUTO\_INCREMENT**: 데이터가 추가될 때마다 고유한 번호가 자동으로 1씩 증가하여 부여된다.
- **DEFAULT CURRENT\_TIMESTAMP**: 값을 지정하지 않으면 새로운 행이 추가될 때 현재 시간이 자동으로 기록된다.
- **DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP**: 새로운 행이 추가될 때는 물론이고, 같은 행의 컬럼 값이 변경되어 업데이트될 때, 이 컬럼의 값은 현재 시간으로 자동 갱신된다.

```sql
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY, -- PK
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0
);
```

```sql
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY, -- PK
    customer_id INT NOT NULL, -- FK
    product_id INT NOT NULL, -- FK
    quantity INT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT '주문접수',

    CONSTRAINT fk_orders_customers
    	FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id),

    CONSTRAINT fk_orders_products
    	FOREIGN KEY (product_id)
        REFERENCES products (product_id)
);
```

- **CONSTRAINT ... FOREIGN KEY (...) REFERENCES ... (...)**: 외래 키 제약 조건

```bash
CONSTRAINT fk_name
FOREIGN KEY (child_column)
REFERENCES parent_table (parent_column)
[ON DELETE action]
[ON UPDATE action];
```

- 한 테이블(자식 테이블)의 컬럼이 다른 테이블(부모 테이블)의 <strong>기본 키(PK)</strong>나 <strong>고유 키(UNIQUE)</strong>를 참조하도록 강제하는 제약 조건
- 이를 통해 데이터 간 <strong>참조 무결성(Referential Integrity)</strong>을 보장한다.

- **ALTER TABLE**: 이미 생성된 테이블의 구조를 변경할 때 사용한다.
  - **ADD COLUMN**: 새로운 열을 추가한다.
  - **MODIFY COLUMN**: 기존 열의 데이터 타입을 변경한다.
  - **DROP COLUMN**: 기존 열을 삭제한다.
  - **⚠️** 운영 중인 대용량 테이블의 구조 변경은 서비스 중단을 유발할 수 있으므로 매우 신중하게 접근해야 한다.

```sql
ALTER TABLE products
ADD COLUMN point INT NOT NULL DEFAULT 0;

ALTER TABLE products
MODIFY COLUMN point INT NOT NULL DEFAULT 1000;

ALTER TABLE products
DROP COLUMN point;
```

- **SHOW DATABASES / TABLES**: 현재 DBMS 서버의 **데이터베이스 목록**이나 선택된 데이터베이스 내의 **테이블 목록**을 조회한다.

```
SHOW DATABASES;

SHOW TABLES;
```

- <strong>DESCRIBE</strong> (또는 DESC): <strong>테이블의 구조(열, 타입, 제약조건 등)</strong>를 확인한다.

```
DESCRIBE products; -- 또는 DESC products;
```

- **TRUNCATE TABLE**: 테이블의 구조는 남겨두고, **내부의 모든 데이터만** 빠르게 삭제한다.
  - WHERE 절 없는 DELETE (예: DELETE FROM products)와 비슷하지만,
  - DELETE보다 TRUNCATE가 훨씬 빠르며, **AUTO\_INCREMENT 값도 초기화**된다.

```sql
TRUNCATE TABLE products;
```

- **DROP TABLE / DATABASE**: 테이블이나 데이터베이스를 **영구적으로 삭제**한다.
  - ⚠️ 테이블의 데이터는 물론, 구조까지 완전히 삭제하므로, 실제 운영 환경에서는 절대 함부로 사용해서는 안 된다.

```sql
DROP TABLE products;

DROP DATABASE my_shop;
```

---

## 테이블의 데이터 조작 (DML, CRUD)

이제 실제 데이터를 넣고, 읽고, 수정하고, 삭제하는 **CRUD (Create, Read, Update, Delete)** 작업을 수행해 보자.

이는 SQL의 <strong>DML (데이터 조작어)</strong>에 해당한다.

- <strong>INSERT INTO ... VALUES ...</strong>: 테이블에 <strong>새로운 행(데이터)</strong>을 추가한다.
  - 열 목록을 생략할 경우, 모든 열에 대한 값을 지정해야 한다.
  - 문자열이나 날짜의 경우 <strong>작은따옴표(')</strong>로 감싸주어야 한다.

```sql
-- 단일 행 삽입
INSERT INTO products (name, price)
VALUES ('A티셔츠', 25000);

-- 여러 행 삽입
INSERT INTO products (name, price)
VALUES ('B티셔츠', 35000), ('C티셔츠', 45000), ('D티셔츠', 55000);
```

- **SELECT ... FROM ...**: 테이블의 데이터를 조회한다.
  - \*는 모든 열을 의미한다.

```sql
-- 모든 열 조회
SELECT * FROM products;

-- 특정 열만 조회
SELECT name, price FROM products;
```

- **UPDATE ... SET ... WHERE ...**: 기존 데이터를 수정한다.
  - **WHERE 절**을 사용하여 **수정할 대상을 정확히 지정**하는 것이 매우 중요하다.

```sql
UPDATE products
SET name = '고급 티셔츠', price = 100000, -- 여러 컬럼 수정 가능
WHERE product_id = 1;
```

- **DELETE FROM ... WHERE ...**: 기존 데이터를 삭제한다.
  - UPDATE와 마찬가지로 **WHERE 절**이 필수적이다.

```sql
DELETE FROM products
WHERE product_id = 1;
```

---

## UPDATE / DELETE 수행 시 WHERE 절을 생략한다면?

WHERE 절을 빠뜨리면 테이블의 **모든 행이 수정되거나 삭제**되는 재앙이 발생하므로 극도로 주의해야 한다.

이 때문에 MySQL은 **WHERE 절에 기본 키(PK)를 사용하지 않은 UPDATE나 DELETE를 방지**하는 '**안전 업데이트 모드**'를 제공한다.

```sql
SELECT @@SQL_SAFE_UPDATES; -- 안전 업데이트 모드 활성화 여부 확인

SET SQL_SAFE_UPDATES = 1; -- 안전 업데이트 모드 활성화
SET SQL_SAFE_UPDATES = 0; -- 안전 업데이트 모드 비활성화
```

하지만 MySQL 서버와 애플리케이션 커넥션의 기본 설정은 **비활성화** 상태다.

따라서 **최고의 예방 습관**은 UPDATE나 DELETE를 실행하기 전, **반드시 동일한 WHERE 절로 SELECT를 먼저 실행**하여,

변경 대상을 눈으로 확인하는 것이다.

---

## TRUNCATE vs DELETE

|  |  |  |
| --- | --- | --- |
| **구분** | **TRUNCATE** | **DELETE** |
| **기능** | 테이블의 모든 데이터를 **빠르게 삭제** (테이블 초기화) | 조건에 맞는 데이터를 **선택적으로 삭제** |
| **동작 방식** | **DDL** (데이터 정의어) → DROP + CREATE와 유사 | **DML** (데이터 조작어) |
| **WHERE 절 사용** | ❌ 불가능 (전체 삭제만 가능) | ✅ 가능 (DELETE FROM table WHERE 조건) |
| **AUTO\_INCREMENT** | ? 초기화됨 (다시 1부터 시작) | 초기화되지 않음 (삭제 후에도 증가값 유지) |
| **트랜잭션 롤백** | InnoDB에서는 트랜잭션에 포함 가능, 하지만 실행 즉시 커밋됨 → **부분 롤백 불가** | ✅ 트랜잭션에 완전히 포함 → 롤백 가능 |
| **삭제 속도** | 매우 빠름 (데이터 페이지 단위로 제거) | 상대적으로 느림 (한 행씩 삭제 + 로그 기록) |
| **로그 기록** | 메타데이터 수준만 기록 (개별 행 삭제 로그 없음) | 각 행 삭제가 모두 로그에 기록 |
| **트리거(Trigger)** | DELETE 트리거 실행되지 않음 | DELETE 트리거 실행됨 |
| **외래 키 제약 조건** | FK 참조 관계 있으면 실행 불가 | FK 제약 조건 검사 후 개별 행 삭제 |
| **사용 목적** | 테이블 전체 초기화 (테스트 데이터 제거, 테이블 리셋) | 특정 조건의 데이터만 삭제 (실제 서비스 로직) |
