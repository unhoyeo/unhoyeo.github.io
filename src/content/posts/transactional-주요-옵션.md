---
title: "@Transactional – 주요 옵션"
description: "@Transactional은 단순히 \"트랜잭션을 걸어준다\"는 의미 이상으로, 여러 속성(옵션)을 통해 트랜잭션의 전파, 격리, 롤백 동작 등을 정교하게 제어할 수 있다. 1. propagation (전파 수준) 2."
pubDate: 2025-10-14T13:33:56+09:00
category: "스프링/DB"
tags: []
---

@Transactional은 단순히 "트랜잭션을 걸어준다"는 의미 이상으로, 여러 속성(옵션)을 통해 트랜잭션의 전파, 격리, 롤백 동작 등을 정교하게 제어할 수 있다.

```java
public @interface Transactional {

    // 사용할 트랜잭션 매니저 지정
    String value() default ""; // transactionManager 옵션과 동일

    // 트랜잭션 전파 수준 지정
    Propagation propagation() default Propagation.REQUIRED;

    // 트랜잭션 격리 수준 지정
    Isolation isolation() default Isolation.DEFAULT;

    // 트랜잭션 수행 제한 시간 지정
    int timeout() default TransactionDefinition.TIMEOUT_DEFAULT;

    // 읽기 전용 트랜잭션 여부 지정
    boolean readOnly() default false;

    // 롤백할 예외 지정
    Class<? extends Throwable>[] rollbackFor() default {};

    // 롤백하지 않을 예외 지정
    Class<? extends Throwable>[] noRollbackFor() default {};

    ...
}
```

---

## 주요 옵션 정리

1. propagation (전파 수준)
2. isolation (격리 수준)
3. rollbackFor / noRollbackFor (롤백 기준)
4. timeout (제한 시간)
5. readOnly (읽기 전용 여부)

---

## propagation (전파 수준)

- 트랜잭션이 이미 존재할 때, 새 메서드가 어떻게 동작할지를 결정한다.
- 기본값은 Propagation.REQUIRED

|  |  |  |
| --- | --- | --- |
| **옵션** | **설명** | **실무 예시** |
| REQUIRED (기본값) | 이미 트랜잭션이 있으면 참여, 없으면 새로 시작 | 서비스 계층 메서드 대부분 |
| REQUIRES\_NEW | 항상 새 트랜잭션 시작 (기존 트랜잭션은 일시 중단) | 로그 기록, 감사 기록 등 실패해도 본 트랜잭션에 영향 주면 안 되는 경우 |
| SUPPORTS | 있으면 참여, 없으면 비트랜잭션으로 실행 | 단순 조회 로직 |
| MANDATORY | 반드시 트랜잭션 내에서만 실행되어야 함 (없으면 예외) | 서비스 내부에서만 호출되는 비즈니스 로직 |
| NOT\_SUPPORTED | 트랜잭션이 있으면 일시 중단하고, 트랜잭션 없이 실행 | 외부 API 호출 등 트랜잭션 불필요한 구간 |
| NEVER | 트랜잭션이 있으면 예외 발생 | 트랜잭션 환경에서 실행되면 안 되는 작업 |
| NESTED | 부모 트랜잭션 안에서 독립적인 세이브포인트 생성 | 부분 롤백 처리 (JDBC에서 savepoint 지원 필요) |

> 대부분의 경우 **REQUIRED**와 **REQUIRES\_NEW** 조합만으로도 충분하다.

---

## isolation (격리 수준)

- 동시성 문제를 제어하기 위한 **데이터베이스 격리 레벨**이다.
- 기본값은 DEFAULT (DB 기본값 따름, 보통 READ\_COMMITTED)

|  |  |  |
| --- | --- | --- |
| **옵션** | **의미** | **방지 가능 문제** |
| DEFAULT | DB 설정 따름 | - |
| READ\_UNCOMMITTED | 커밋되지 않은 데이터 읽기 허용 | X (Dirty Read 가능) |
| READ\_COMMITTED | 커밋된 데이터만 읽음 | Dirty Read 방지 |
| REPEATABLE\_READ | 한 트랜잭션 내 같은 쿼리 결과 동일 보장 | Non-repeatable Read 방지 |
| SERIALIZABLE | 가장 엄격, 완전한 순차 실행 | Phantom Read 방지, 성능 저하 |

> 실무에서는 **READ\_COMMITTED**(기본값)이면 충분하다.
> 정합성이 매우 중요한 금융 로직 등에서만 REPEATABLE\_READ 이상을 고려하면 된다.

---

## rollbackFor / noRollbackFor

- 스프링은 기본적으로 언체크 예외(런타임 예외)만 롤백하고, 체크 예외는 롤백되지 않는다.
- 따라서 해당 옵션을 통해 롤백할 예외와 롤백하지 않을 예외를 지정할 수 있다.
- **rollbackFor = Exception.class** → 체크 예외도 롤백 대상에 포함
- **noRollbackFor = SomeException.class** → 특정 예외는 롤백하지 않음
- 예시:

```java
@Transactional(rollbackFor = Exception.class)
public void processOrder() throws IOException {
    // IOException 발생 시에도 롤백
}
```

> 보통 특정 체크 예외를 롤백하고 싶을 때 사용한다.

---

## timeout

- 트랜잭션 수행 제한 시간이다. (초 단위)
- 제한 시간을 초과하면 트랜잭션이 롤백된다.

```java
@Transactional(timeout = 5)
public void longRunningTask() { ... }
```

> 대용량 배치 처리나 외부 I/O 연동 시 유용하다.

---

## readOnly

- 트랜잭션은 기본적으로 읽기와 쓰기가 모두 가능하도록 생성된다.
- 이 옵션을 설정하면, 트랜잭션을 **읽기 전용**으로 설정한다.
- DB 드라이버나 JPA가 이를 힌트로 받아 쓰기 금지 또는 캐시 최적화에 활용할 수 있다.
  - JdbcTemplate은 읽기 전용 트랜잭션에서 변경 기능을 실행하면 예외를 던진다.
  - JPA는 읽기 전용 트랜잭션의 경우 커밋 시점에 flush()를 호출하지 않으며, 변경 감지를 위한 스냅샷 객체도 생성하지 않는다.

```java
@Transactional(readOnly = true)
public List<User> findAllUsers() { ... }
```

> **조회 전용 서비스 메서드**에 반드시 지정하는 것이 권장된다.
