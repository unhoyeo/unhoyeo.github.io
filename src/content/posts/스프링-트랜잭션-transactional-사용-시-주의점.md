---
title: "스프링 트랜잭션 @Transactional 사용 시 주의점"
description: "1. 트랜잭션 추상화 (PlatformTransactionManager) 각각의 데이터 접근 기술(JDBC, JPA 등)은 트랜잭션을 다루는 코드가 다르다."
pubDate: 2025-10-05T14:47:30+09:00
category: "스프링/DB"
tags: []
---

## 스프링 트랜잭션의 핵심: 추상화와 AOP

1. **트랜잭션 추상화 (PlatformTransactionManager)**
   - 각각의 데이터 접근 기술(JDBC, JPA 등)은 트랜잭션을 다루는 코드가 다르다.
   - 스프링은 **PlatformTransactionManager**라는 인터페이스를 통해 **트랜잭션 기능을 추상화**한다.
   - 또한 각각의 데이터 접근 기술마다 PlatformTransactionManager 인터페이스를 구현한 클래스도 제공한다.
   - 스프링 부트는 현재 사용 중인 데이터 접근 기술을 **자동으로 인식**하여, 그에 맞는 구현체를 **스프링 빈**으로 등록해 준다.
   - 따라서 개발자는 이 인터페이스에만 의존하면 된다.
2. **선언적 트랜잭션 관리 (@Transactional과 AOP)**
   - 트랜잭션 매니저를 직접 사용하여 트랜잭션을 다룰 수도 있지만, 비즈니스 로직과 트랜잭션 로직이 강하게 결합된다.
   - 스프링은 **@Transactional**을 통한 **선언적 트랜잭션 관리 방식**을 통해 트랜잭션 기능을 비즈니스 로직과 완벽하게 분리한다.
   - @Transactional을 붙이기만 하면, 스프링이 트랜잭션 기능이 포함된 **프록시 객체를 생성**하여 **비즈니스 로직을 감싸준다.**
   - 프록시는 비즈니스 메서드 실행 전에 **트랜잭션을 시작**하고, 메서드가 정상 종료되면 **커밋**하며, 예외가 발생하면 **롤백**을 수행한다.
   - 이 덕분에 서비스 클래스에는 순수한 비즈니스 로직만 남게 되어 코드가 매우 깔끔해진다.

---

## ⚠️ @Transactional 사용 시 핵심 주의점

## 1. 클래스 레벨에 선언 시

> **클래스 레벨**에 선언한 @Transactional은 해당 클래스의 **모든 public, protected, default 메서드**에 적용된다.

- **private** 메서드에는 트랜잭션이 적용되지 않으며, 그럼에도 @Transactional을 선언하면 **무시된다.**
- **외부에서 호출이 가능한** 메서드에만 트랜잭션이 적용되도록 해준다. (스프링 2.0은 public 메서드에만 적용됐었다.)

> private: 같은 클래스, default: 같은 패키지, protected: 같은 패키지 및 상속받은 클래스, public: 무제한

## 2. 적용 위치에 따른 우선순위

> 스프링은 항상 **더 구체적인 것이 더 높은 우선순위**를 가진다.

예를 들어, 클래스와 메서드 모두에 @Transactional이 적용되어 있다면, 메서드의 @Transactional이 적용된다.

또한 @Transactional은 인터페이스에도 적용할 수 있으며, 결과적으로 다음 순서대로 우선순위를 가진다.

1. **클래스의 메서드** (우선순위가 가장 높음)
2. **클래스의 타입**
3. **인터페이스의 메서드**
4. **인터페이스의 타입** (우선순위가 가장 낮음)

> 인터페이스에 @Transactional을 적용하는 방식은 다른 AOP 방식에서 적용되지 않을 수 있으므로 스프링에서는 권장하지 않는다.

## 3. 프록시 내부 호출 문제

> 트랜잭션이 적용되려면 반드시 **프록시 객체를 통해 메서드가 호출**되어야 한다.

트랜잭션 AOP는 기본적으로 **프록시 방식의 AOP**를 사용하기 때문에, 프록시 객체가 트랜잭션을 처리하고 실제 객체를 호출한다.

따라서 트랜잭션이 적용되려면 반드시 **프록시 객체를 통해서 실제 객체가 호출**되어야 한다.

스프링은 실제 객체가 아닌 프록시 객체를 스프링 빈으로 등록하고 주입하므로, 일반적으로는 **실제 객체를 호출해도 프록시가 호출**된다.

하지만 일반적인 경우가 아닌, **실제 객체의 내부에서 호출하는 경우**에는 프록시를 거치지 않는다.

다음 예시 코드를 보자.

```java
@Slf4j
@SpringBootTest
public class InternalCallV1Test {

    @Autowired
    Service service;

    @Test
    void 프록시_체크() {
        log.info("service class = {}", service.getClass());
        assertThat(AopUtils.isAopProxy(service)).isTrue();
    }

    @Test
    void 내부_메서드_호출() {
        service.internal();
    }

    @Test
    void 외부_메서드_호출() {
        service.external();
    }

    static class Service {

        // 트랜잭션이 적용되지 않은 외부 메서드
        public void external() {
            log.info("call external");
            printTxInfo();
            this.internal();
        }

        // 트랜잭션이 적용된 내부 메서드
        @Transactional
        public void internal() {
            log.info("call internal");
            printTxInfo();
        }

        private void printTxInfo() {
            boolean active = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("tx active = {}", active);
        }
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public Service service() {
            return new Service();
        }
    }
}
```

실행 결과는 다음과 같다.

```r
// 프록시_체크
service class = class ...$Service$$SpringCGLIB$$0
```

- AopUtils.isAopProxy(object) 메서드를 통해 해당 객체가 프록시 객체인지 확인할 수 있다.
- @Transactional을 메서드나 클래스에 붙이면 해당 클래스의 객체는 **트랜잭션 AOP의 적용 대상**이 된다.
- 트랜잭션 AOP는 **실제 객체를 참조하는 프록시 객체를 생성**하고, 실제 객체 대신 **프록시 객체를 스프링 빈으로 등록**한다.

```r
// 내부_메서드_호출
Creating new transaction with name [...internal]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
...
Getting transaction for [...internal]
call internal
tx active = true
Completing transaction for [...internal]
Initiating transaction commit
...
```

- 일반적으로 **@Transactional이 적용된 메서드를 직접 호출**하는 경우다.
- 프록시 객체의 internal() 메서드를 호출했고, 이 메서드는 트랜잭션 AOP 적용 대상이기 때문에 트랜잭션이 잘 적용된다.
- TransactionSynchronizationManager.isActualTransactionActive()를 통해 **현재 스레드의 트랜잭션 적용 여부**를 알 수 있다.

```r
// 외부_메서드_호출
call external
tx active = false
call internal
tx active = false
```

- 특이하게 **@Transactional이 적용되지 않은 메서드에서 @Transactional이 적용된 메서드를 호출**하는 경우다.
- 프록시 객체의 external() 메서드를 호출했지만, 이 메서드는 트랜잭션 AOP 적용 대상이 아니기 때문에 **트랜잭션을 적용하지 않는다.**
- 트랜잭션이 적용되지 않은 상태에서 internal() 메서드를 호출하는데, **이때의 internal() 메서드는 프록시 객체의 메서드가 아니다!**
- 자바에서 메서드 앞에 별도의 참조가 없다면 **this**라는 뜻으로, **자기 자신의 인스턴스**를 가리킨다.
- 즉, **this.internal()**을 호출한 것이며, 이때의 this는 **프록시 객체가 호출한 실제 객체**다.

```java
// 1. 일반적인 경우
클라이언트  →  internal() 호출  →  < 프록시 객체 >
                                    ↓
                                트랜잭션 시작  →  internal() 호출  →  < 실제 객체 >

// 2. 특이한 경우
클라이언트  →  external() 호출  →  < 프록시 객체 >  →  external() 호출  →  < 실제 객체 >
                               (트랜잭션 적용X)                            ↓
                                                                  internal() 호출
```

? **해결책**: 트랜잭션이 필요한 메서드(internal)를 **별도의 클래스로 분리**하여 외부에서 호출하도록 구조를 변경!

```java
@Slf4j
@SpringBootTest
public class InternalCallV2Test {

    @Autowired
    Service service;

    @Test
    void 외부_메서드_호출() {
        service.external();
    }

    @RequiredArgsConstructor
    static class Service {

        private final InternalService internalService;

        public void external() {
            log.info("call external");
            internalService.internal();
        }
    }

    @Transactional
    static class InternalService {

        public void internal() {
            log.info("call internal");
        }
    }

    ...
}
```

- 내부 메서드인 internal()을 별도의 **InternalService** 클래스로 분리하고, 기존의 Service 클래스에서 해당 클래스를 주입받는다.
- **service.external()** 호출 시 Service에는 @Transactional이 없으므로, **실제 객체**의 메서드가 호출된다.
- **internalService.internal()** 호출 시 InternalService에는 @Transactional이 있으므로, **프록시**의 메서드가 호출된다.
- 따라서 internal() 메서드에 정상적으로 트랜잭션이 동작하게 된다.

## 4. 초기화 시점 문제

> @PostConstruct와 같은 **초기화 메서드**에서는 @Transactional이 **동작하지 않을 수 있다.**

다음 예시 코드에서 초기화 메서드를 호출해보면, 트랜잭션 적용 여부가 false인 것을 알 수 있다.

```java
@Slf4j
@SpringBootTest
public class TxInitTest {

    @Autowired
    Hello hello;

    @Test
    void 초기화() {
        // 초기화 코드는 스프링이 초기화 시점에 호출함
    }

    static class Hello {

        @PostConstruct
        @Transactional
        public void initV1() {
            boolean active = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("initV1 tx active = {}", active);
        }
    }
    ...
}
```

- 이는 **초기화 코드가 먼저 실행**되고, 그 이후에 트랜잭션 AOP를 위한 **프록시 객체가 생성**되기 때문이다.
- 따라서 초기화 시점의 메서드는 트랜잭션을 적용할 수 없다.

? **해결책**: 초기화 메서드가 호출되고, 트랜잭션 AOP가 완전히 적용된 시점, 즉 **스프링 컨테이너가 완전히 생성된 이후에 호출**하면 된다.

해당 시점에 로직을 실행하고 싶다면, 해당 메서드에 **@EventListener(ApplicationReadyEvent.class)**를 선언하면 된다.

아래 코드를 실행해보면 트랜잭션이 적용된 것을 알 수 있다.

```java
@Slf4j
@SpringBootTest
public class TxInitTest {

    @Autowired
    Hello hello;

    @Test
    void 초기화() {
        // 초기화 코드는 스프링이 초기화 시점에 호출함
    }

    static class Hello {

        @EventListener(ApplicationReadyEvent.class)
        @Transactional
        public void initV2() {
            boolean active = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("initV2 tx active = {}", active);
        }
    }
    ...
}
```

---

## 예외와 트랜잭션 롤백 정책

스프링의 @Transactional은 예외 발생 시 기본적으로 다음과 같은 롤백 정책을 따른다.

- **언체크 예외** (RuntimeException 및 그 하위 예외) → **롤백 ❌**
- **체크 예외** (Exception 및 그 하위 예외 중 런타임 예외가 아닌 것) → **커밋 ✅**

스프링은 **언체크 예외를 복구 불가능한 시스템 예외**로, **체크 예외를 의도된 비즈니스 예외**로 가정한다.

- **시스템 예외**:
  - DB 연결 문제와 같은 시스템 예외는 **롤백**하여 데이터 일관성을 지키는 것이 맞다.
- **비즈니스 예외**:
  - '**결제 시 잔고 부족**'과 같은 예외는 시스템에 문제가 있어서 발생한 시스템 예외가 아니므로, **비즈니스 예외**다.
  - 따라서 주문 상태를 '**대기**'로 변경하고, 데이터를 **커밋**해야 고객에게 잔고 부족을 알리고 후속 처리를 할 수 있다.
  - 이때 **체크 예외**를 사용하면, 예외가 발생하더라도 트랜잭션이 커밋되도록 할 수 있다.

**? 만약 체크 예외가 발생했을 때도 롤백하고 싶다면?**

@Transactional(**rollbackFor** = MyException.class)와 같이 rollbackFor 옵션을 사용하여 명시적으로 지정할 수 있다.
