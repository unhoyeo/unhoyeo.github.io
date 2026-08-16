---
title: "SQL, 제약 조건, 데이터 타입"
pubDate: 2025-09-16T20:41:17+09:00
category: "데이터베이스"
tags: ["SQL"]
---

## SQL (Structured Query Language)

SQL은 **관계형 데이터베이스**에서 데이터를 정의(DDL), 조작(DML), 제어(DCL)하는 국제 표준 언어다.

따라서 대부분의 RDBMS에서 거의 동일하게 사용할 수 있다.

> SQL 표준을 넘어서 각 DBMS는 자신들만의 추가 기능이나 추가 문법을 제공하는데, 이것을 방언(사투리, Dialect)이라고 한다.

SQL 명령어는 목적에 따라 크게 4가지로 분류된다.

- **DDL (Data Definition Language, 데이터 정의어)**:
  - 데이터베이스나 테이블의 '구조'를 정의한다.
  - 주요 명령어: CREATE, ALTER, DROP
- **DML (Data Manipulation Language, 데이터 조작어)**:

  - 실제 데이터를 추가, 조회, 수정, 삭제한다.
  - 주요 명령어: INSERT, SELECT, UPDATE, DELETE
- **DCL (Data Control Language, 데이터 제어어)**:

  - 사용자의 접근 권한을 관리한다.
  - 주요 명령어: GRANT, REVOKE
- **TCL (Transaction Control Language, 트랜잭션 제어어)**:

  - 작업의 논리적 단위를 제어하여 데이터의 일관성을 보장한다.
  - 주요 명령어: COMMIT, ROLLBACK

---

## 제약 조건 (Constraints)

제약 조건은 데이터의 '**무결성(Integrity)**', 즉 데이터에 결점이 없는 상태를 보장하기 위해 테이블에 거는 규칙이다.

- NOT NULL: 컬럼에 반드시 값이 있어야 한다.
- UNIQUE: 컬럼에 중복된 값을 허용하지 않는다.
- PRIMARY KEY: 테이블의 각 행을 유일하게 식별하며, NOT NULL과 UNIQUE 특징을 모두 갖는다.
- FOREIGN KEY: 다른 테이블의 기본 키를 참조하여, 참조 무결성을 보장한다.
- DEFAULT: 값을 지정하지 않았을 때 사용될 기본값을 설정한다.
- CHECK: 특정 조건을 만족하는 값만 허용한다.

---

## 데이터 타입 (Data Type)

데이터에 맞는 타입을 지정하는 것은 저장 공간의 효율성과 데이터의 정확성을 위해 매우 중요하다.

저장되는 데이터의 예상 범위와 성격에 맞는 타입을 선택해야 하며, 대표적인 데이터 타입은 다음과 같다.

- **숫자형**:

  - INT: 4바이트의 정수
  - BIGINT: 8바이트의 큰 정수
  - DECIMAL(M, D): 금융권에서 정확한 소수 표현 시 사용 (M: 총 자릿수, D: 소수점 이하 자릿수)
  - 정수 타입 앞에 UNSIGNED 속성을 추가할 경우, 0부터 시작하여 양수 범위만 저장하게 된다.
- **문자형**:
  - VARCHAR(n): 최대 n 글자까지 저장되는 가변 길이 문자열 (대부분의 경우에 사용)
  - CHAR(n): 항상 n 글자 길이를 차지하는 고정 길이 문자열 (항상 길이가 정해져 있는 데이터에 사용)
  - TEXT: 매우 긴 텍스트를 저장할 때 사용 (상품 상세 설명, 리뷰, 블로그 등)
- **날짜/시간형**:
  - DATE: 날짜('YYYY-MM-DD')만 저장
  - DATETIME: 날짜와 시간('YYYY-MM-DD HH:mm:ss') 저장
  - TIMESTAMP: DATETIME과 유사하게 날짜와 시간을 저장하지만, 타임존 자동 변환 기능이 포함되어 있음
- **이진형**:
  - BLOB: 이미지, 오디오, 비디오 같은 대용량 이진(Binary) 데이터 저장

---

## DATETIME vs TIMESTAMP

- 두 타입은 날짜와 시간을 모두 저장하지만, 결정적인 차이가 있기 때문에 구분하여 사용해야 한다.

|  |  |  |
| --- | --- | --- |
| 구분 | **DATETIME** | **TIMESTAMP** |
| 타임존 처리 | ❌ (입력 값 그대로 저장) | ✅ (입력 값을 UTC(협정 세계시)로 변환하여 저장, 조회자의 타임존에 따라 자동으로 값이 변환됨) |
| 저장 가능 범위 | 1000년 ~ 9999년 | 1970년 ~ 2038년 |
| 저장 공간 | 5바이트 + α | 4바이트 + α |
| 자동 초기화 및 업데이트 | MySQL 5.6.5부터 지원 | DEFAULT CURRENT\_TIMESTAMP, ON UPDATE CURRENT\_TIMESTAMP 기능을 통해 행 생성/수정 시 자동으로 현재 시간 기록 가능 |

현대 애플리케이션에서는 DATETIME 사용이 권장된다.
