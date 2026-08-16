---
title: "동시성 제어 – synchronized, 비관적 락, 원자적 UPDATE 패턴"
description: "선착순 쿠폰을 여러 사용자가 동시에 다운로드하는 시나리오를 가정해 보자. 사용자는 /api/coupons/{couponId}/download API를 호출하여 쿠폰을 다운로드한다."
pubDate: 2025-10-10T06:20:38+09:00
category: "자바"
tags: []
---

**선착순 쿠폰**을 여러 사용자가 동시에 다운로드하는 시나리오를 가정해 보자.

- 사용자는 /api/coupons/{couponId}/download API를 호출하여 쿠폰을 다운로드한다.
- 쿠폰은 선착순으로 발급되며, **발급 가능한 수량(totalQuantity)이 한정**되어 있다.
- 여러 사용자가 동시에 요청하더라도 **쿠폰 발급 수량을 초과하지 않아야 한다.**

---

## 1. 엔티티

```java
package com.example.coupon.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int totalQuantity;  // 총 발급 가능 수량
    private int issuedQuantity; // 현재 발급된 수량

    public Coupon(String name, int totalQuantity) {
        this.name = name;
        this.totalQuantity = totalQuantity;
        this.issuedQuantity = 0;
    }

    public void issue() {
        if (isSoldOut()) {
            throw new IllegalStateException("쿠폰이 모두 소진되었습니다.");
        }
        this.issuedQuantity++;
    }

    public boolean isSoldOut() {
        return issuedQuantity >= totalQuantity;
    }
}
```

---

## 2. Repository

```java
package com.example.coupon.repository;

import com.example.coupon.domain.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
}
```

---

## 3. Service

```java
package com.example.coupon.service;

import com.example.coupon.domain.Coupon;
import com.example.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional
    public void downloadCoupon(Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

        log.info("{} - 발급 전: {}", Thread.currentThread().getName(), coupon.getIssuedQuantity());

        coupon.issue(); // 재고 감소

        log.info("{} - 발급 후: {}", Thread.currentThread().getName(), coupon.getIssuedQuantity());

        // Dirty Checking으로 DB update
    }
}
```

---

## 4. Controller

```java
package com.example.coupon.controller;

import com.example.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    @PostMapping("/{couponId}/download")
    public ResponseEntity<String> downloadCoupon(@PathVariable Long couponId) {
        couponService.downloadCoupon(couponId);
        return ResponseEntity.ok("쿠폰이 발급되었습니다.");
    }
}
```

---

## 5. 동시성 테스트

```java
package com.example.coupon.service;

import com.example.coupon.domain.Coupon;
import com.example.coupon.repository.CouponRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CouponServiceConcurrencyTest {

    private static final Long COUPON_ID = 1L;

    private final int couponQuantity = 100; // 쿠폰 수량

    @Autowired
    private CouponService couponService;

    @Autowired
    private CouponRepository couponRepository;

    @BeforeEach
    @Transactional
    void setUp() {
        Coupon coupon = new Coupon("선착순_쿠폰", couponQuantity);
        couponRepository.save(coupon);
    }

    @Test
    void 동시에_쿠폰_다운로드() throws Exception {
        int threadCount = couponQuantity;
        // 스레드 풀 생성
        ExecutorService executorService = Executors.newFixedThreadPool(10);
        // 모든 스레드가 작업을 마칠 때까지 기다리게 할 Latch
        CountDownLatch latch = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            executorService.submit(() -> {
                try {
                    // 테스트하려는 비즈니스 로직 호출
                    couponService.downloadCoupon(COUPON_ID);
                } catch (Exception e) {
                    // 예외는 무시
                } finally {
                    latch.countDown(); // 작업 완료 알림
                }
            });
        }

        latch.await(); // 모든 스레드가 끝날 때까지 대기

        Coupon coupon = couponRepository.findById(COUPON_ID).orElseThrow();
        System.out.println("✅ 총 발급 가능 수량: " + coupon.getTotalQuantity());
        System.out.println("✅ 최종 발급 수량: " + coupon.getIssuedQuantity());

        assertThat(coupon.getIssuedQuantity()).isEqualTo(coupon.getTotalQuantity());
    }
}
```

동시성 제어에 성공한다면 100개의 요청이 정상적으로 수행되어 **최종 발급 수량이 100개**가 될 것이다.

하지만 지금은 동시성 제어를 하지 않았으므로, 다음과 같은 결과가 나온다.

```
✅ 총 발급 가능 수량: 100
✅ 최종 발급 수량: 12
```

서비스 계층에 남긴 로그를 확인해보면, **여러 스레드가 동일한 수량을 읽은 것**을 확인할 수 있다.

그 이유를 정리하면 다음과 같다.

- **초기 조건**
  - 쿠폰 총 수량: 100 (totalQuantity = 100)
  - 초기 발급 수량: 0 (issuedQuantity = 0)
  - 처리할 요청 수: 100 (100개의 스레드)
  - 스레드 풀 크기: 10 (한 번에 10개의 스레드만 실행 가능)
- **테스트 수행 과정**
  - 스레드 풀 내 10개의 스레드가 동시에 쿠폰 엔티티 조회
    - 모두 issuedQuantity = 0 읽음
  - 각 스레드에서 issuedQuantity++ 수행 후 트랜잭션 커밋 시도
    - DB에는 마지막으로 커밋한 스레드의 값이 반영됨 (다른 스레드의 값은 덮어쓰기됨)
  - 커밋 완료 후, 스레드가 스레드 풀에 반납 → 대기하던 다음 스레드가 스레드 풀에서 실행
    - 새로 실행된 스레드가 현재 DB 값(예: issuedQuantity = 1) 읽음 → 다시 증가 시도 → 커밋 시 또 덮어쓰기 발생
  - 이 과정이 반복됨
- **결과 요약**
  - 동시에 여러 스레드가 같은 값을 읽고 증가 → 일부 증가가 무시됨 → 최종 발급 수량이 기대치보다 낮음
  - 다른 트랜잭션의 변경 중간 상태를 보지 못함 → Race Condition 발생
  - 스레드 풀 크기만큼 동시 요청이 발생하는 동안, 각 그룹의 증가가 마지막 커밋에 의해 덮어쓰기 됨
  - 따라서 100개의 요청을 처리했음에도, 최종 발급 수량은 10개 정도로 기대치보다 낮게 나올 수 있음

이제 동시성 제어를 단계별로 적용해 보자.

---

## 1️⃣ 애플리케이션 레벨 동시성 제어 (Single JVM)

**synchronized** 키워드를 이용하여 단일 서버(애플리케이션) 인스턴스, 즉 **같은 JVM 내에서 스레드 간 동시성 제어**를 해보자.

```java
package com.example.coupon.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int totalQuantity;  // 총 발급 가능 수량
    private int issuedQuantity; // 현재 발급된 수량

    public Coupon(String name, int totalQuantity) {
        this.name = name;
        this.totalQuantity = totalQuantity;
        this.issuedQuantity = 0;
    }

    // synchronized 추가
    public synchronized void issue() {
        if (isSoldOut()) {
            throw new IllegalStateException("쿠폰이 모두 소진되었습니다.");
        }
        this.issuedQuantity++;
    }

    public boolean isSoldOut() {
        return issuedQuantity >= totalQuantity;
    }
}
```

Coupon 엔티티의 **issue()** 메서드에 적용한 후 테스트를 돌려봤다.

하지만 이전과 마찬가지로 동시성 제어가 되지 않았다.

```
✅ 총 발급 가능 수량: 100
✅ 최종 발급 수량: 11
```

이번에는 CouponService의 **downloadCoupon()** 메서드에 적용한 후 테스트를 돌려봤다.

이번에도 마찬가지로 동시성 제어가 되지 않았다. (이는 issue()와 downloadCoupon() 두 군데 모두 적용했을 때도 마찬가지였다.)

```
✅ 총 발급 가능 수량: 100
✅ 최종 발급 수량: 49
```

그 이유를 나름 파해쳐보았다.

우선 synchronized는 **JVM 내에서 "객체 단위"로 락을 걸어** 스레드 간 접근을 막는다.

- 예를 들어 synchronized를 메서드에 걸면, **그 객체의 동일한 인스턴스에 대해 한 번에 하나의 스레드만 접근 가능**하다.
- 즉, 락은 **메모리상의 객체 단위**이고, **DB의 데이터 자체를 보호하지는 않는다.**

현재 테스트에서는 스레드 풀의 **10개의 스레드**가 동시에 couponService.downloadCoupon()를 호출한다.

- 각 스레드는 서로 다른 커넥션을 가지므로, 별도의 DB 세션, 즉 **서로 다른 영속성 컨텍스트**를 사용한다.
- JPA는 기본적으로 **영속성 컨텍스트(1차 캐시)에서 관리되는 객체**를 반환한다.
- 따라서 **각 스레드는 서로 다른 Coupon 객체 인스턴스**를 갖게 된다.
- 하지만 synchronized는 **객체 인스턴스 단위의 락**을 걸기 때문에,
- **스레드가 서로 다른 객체를 가지고 있으면 서로 다른 객체에 락이 걸리게 되고,** 락을 거는 의미가 없어지게 된다.

couponService.downloadCoupon()에 synchronized를 적용할 경우에는 조금 다르다.

- 일단 서비스 객체는 스프링이 **싱글톤**으로 관리하므로, **객체 인스턴스는 하나뿐이다.**
- 따라서 같은 JVM 내에서 동시에 한 스레드만 이 메서드를 호출할 수 있는게 맞다.
- 하지만 해당 메서드에 **스프링 트랜잭션**이 걸린다는 것이 문제다.
- AOP 프록시 기반의 @Transactional은 실제 객체가 호출되는 것이 아니라 **프록시 객체가 호출**된다.
- 즉, downloadCoupon() 메서드를 호출하면 실제 객체가 아닌 프록시 객체가 호출되고,
- 이 프록시 객체가 트랜잭션을 실행하고 실제 객체의 downloadCoupon() 메서드를 호출한다.
  - 예를 들어, 스레드1과 2가 동시에 트랜잭션을 시작하여 각각 커넥션을 획득한다고 가정해 보자.
  - 이때 스레드1이 조금 더 빨리 실제 서비스 메서드에 진입하면서 락을 획득하면, 스레드2는 대기하게 된다.
  - 스레드1이 issuedQuantity = 0에서 1로 변경하고 메서드를 빠져나오면, 바로 스레드2가 메서드에 진입한다.
  - 하지만 스레드1이 아직 커밋하기 전이라면, 스레드2는 여전히 issuedQuantity = 0을 읽을 수 있다.
  - 따라서 스레드1이 커밋한 결과를 스레드2가 덮어쓰기해버릴 수 있는 것이다.

결과적으로, issue()나 downloadCoupon()에 synchronized를 걸어도 **동시성 문제**가 발생한다.

즉, JVM 객체 수준의 락(synchronized)은 DB 레코드 수준의 race condition을 막지 못한다.

---

## 2️⃣ 데이터베이스 레벨 동시성 제어

synchronized를 이용한 락은 "자바 객체 인스턴스 단위"이므로 "DB 레코드 단위"의 충돌을 막을 수 없었다.

이번에는 <strong>비관적 락 (Pessimistic Lock)</strong>을 이용하여 DB에서 직접 동시 수정 자체를 제어해 보자.

```java
package com.example.coupon.repository;

import com.example.coupon.domain.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") Long id);
}
```

```java
package com.example.coupon.service;

import com.example.coupon.domain.Coupon;
import com.example.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional
    public synchronized void downloadCoupon(Long couponId) {
        Coupon coupon = couponRepository.findByIdForUpdate(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

        log.info("{} - 발급 전: {}", Thread.currentThread().getName(), coupon.getIssuedQuantity());

        coupon.issue(); // 재고 감소

        log.info("{} - 발급 후: {}", Thread.currentThread().getName(), coupon.getIssuedQuantity());

        // Dirty Checking으로 DB update
    }
}
```

테스트 수행 결과 드디어 동시성 제어에 성공했다!

```
✅ 총 발급 가능 수량: 100
✅ 최종 발급 수량: 100
```

비관적 락은 트랜잭션이 특정 행을 읽을 때 **DB가 그 행에 배타적(또는 공유) 락을 걸어** 다른 트랜잭션의 변경을 막는다.

- 트랜잭션이 <strong>SELECT ... FOR UPDATE</strong> 로 행을 읽으면, DB는 해당 행에 대한 <strong>배타적 락(exclusive lock)</strong>을 획득한다.
- 락은 **그 트랜잭션이 커밋하거나 롤백할 때까지 유지**된다.
- 다른 트랜잭션이 동일 행을 SELECT ... FOR UPDATE 하거나 UPDATE하려고 하면, **락이 해제될 때까지 대기**한다.
- 락 타임아웃이 초과되면 예외가 발생한다.

## ✅ 장점

- **Lost update, race condition 방지**: 다른 트랜잭션이 동일 행을 동시에 갱신하지 못하므로 덮어쓰기 문제가 사라진다.
- **멀티 인스턴스 환경에서도 동작**: 하나의 DB에서 락을 제어하므로, 서버 인스턴스가 여러 개인 분산 환경에서도 일관성이 보장된다.

## ❌ 단점

- **성능 저하**
  - 동시에 수많은 요청이 들어오면, 많은 트랜잭션이 락을 기다리게 되어 처리량이 감소한다.
  - 즉, 응답이 지연된다.
- **DB 커넥션 점유**
  - 트랜잭션이 길어지면 해당 커넥션은 대기 중인 다른 트랜잭션이 사용할 수 없다.
  - 따라서 커넥션 풀이 고갈되고, 전체 서비스가 지연되거나 장애가 발생할 수 있다.
- **교착 상태(Deadlock) 발생 가능**
  - 예: T1이 A → B 순으로 락을 시도하고, T2가 B → A 순으로 락을 시도하면 교착 상태가 발생한다. (InnoDB는 교착을 감지하면 한 트랜잭션을 롤백시킴)
  - 따라서 애플리케이션은 교착으로 인한 롤백을 감지하고 재시도해야 한다.
- **락 범위가 의도보다 넓어질 수 있음**
  - WHERE절이나 인덱스가 적절치 않으면 풀 테이블 스캔에 의해 생각보다 많은 행에 락을 걸 수도 있다.
- **타임아웃/예외 처리 필요**
  - 락 대기 시간이 길면 DB가 타임아웃 예외를 던질 수 있다.
  - 따라서 반드시 재시도 정책을 설계해야 한다.

따라서 **비관적 락이 무조건 좋은 것은 아니다.**

그런데 잘 생각해보면, 쿠폰 다운로드처럼 단순한 경우는 굳이 SELECT 하고 UPDATE 할 필요 없이, **하나의 UPDATE** 만으로 처리할 수 있다.

## ✅ 원자적 UPDATE 패턴

```java
package com.example.coupon.repository;

import com.example.coupon.domain.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Modifying
    @Query("UPDATE Coupon c SET c.issuedQuantity = c.issuedQuantity + 1 " +
            "WHERE c.id = :id AND c.issuedQuantity < c.totalQuantity")
    int tryIncreaseIssued(@Param("id") Long id);
}
```

```java
package com.example.coupon.service;

import com.example.coupon.domain.Coupon;
import com.example.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional
    public void downloadCoupon(Long couponId) {
        int updated = couponRepository.tryIncreaseIssued(couponId);
        if (updated == 0) {
            throw new IllegalStateException("쿠폰 소진 또는 동시성 충돌");
        }
    }
}
```

이렇게 하면 DB가 **UPDATE 시점에 행 락을 잠깐만 잡아서 원자적으로 처리한다.**

즉, DB에서 **짧은 시간 동안만 락을 잡기 때문에** 처리량과 응답성을 향상할 수 있다.

하지만 다음과 같은 한계가 존재한다.

## ❌ 영속성 컨텍스트(1차 캐시)와의 불일치

- Spring Data JPA의 @Modifying JPQL/SQL은 엔티티 매니저의 **영속성 컨텍스트를 거치지 않고, DB에 직접 쿼리를 실행**한다.
- 따라서 같은 트랜잭션 내에서 이미 조회한 Coupon 엔티티는 여전히 **이전 상태를 유지**한다.

```java
@Transactional
public void downloadCoupon(Long couponId) {
    Coupon coupon = couponRepository.findById(couponId).orElseThrow();
    log.info("{} - 발급 전: {}", Thread.currentThread().getName(), coupon.getIssuedQuantity());

    int updated = couponRepository.tryIncreaseIssued(couponId);
    if (updated == 0) {
        throw new IllegalStateException("쿠폰 소진 또는 동시성 충돌");
    }

    log.info("{} - 발급 후: {}", Thread.currentThread().getName(), coupon.getIssuedQuantity());
}
```

- 위 코드를 실행해보면 다음과 같은 로그가 남는다.

```java
pool-2-thread-5 - 발급 전: 0
pool-2-thread-9 - 발급 전: 0
pool-2-thread-4 - 발급 전: 0
pool-2-thread-6 - 발급 전: 0
pool-2-thread-3 - 발급 전: 0
pool-2-thread-10 - 발급 전: 0
pool-2-thread-1 - 발급 전: 0
pool-2-thread-8 - 발급 전: 0
pool-2-thread-7 - 발급 전: 0
pool-2-thread-2 - 발급 전: 0
pool-2-thread-5 - 발급 후: 0
pool-2-thread-9 - 발급 후: 0
pool-2-thread-6 - 발급 후: 0
pool-2-thread-8 - 발급 후: 0
pool-2-thread-5 - 발급 전: 2
pool-2-thread-9 - 발급 전: 3
pool-2-thread-4 - 발급 후: 0
pool-2-thread-6 - 발급 전: 4
pool-2-thread-10 - 발급 후: 0
...
```

- 트랜잭션이 시작되면 findById()로 가져온 쿠폰 엔티티가 **EntityManager의 1차 캐시**에 올라간다.
  - 이 시점의 coupon.issuedQuantity = 0이다.
- tryIncreaseIssued() JPQL 쿼리가 **DB 레벨**에서 issuedQuantity를 증가시켰지만, **1차 캐시에 올라온 쿠폰 객체는 그대로 0이다.**
  - 즉, **DB는 업데이트되었지만, 메모리에 올라온 객체가 최신 상태가 아니다.**

```java
@Transactional
public void downloadCoupon(Long couponId) {
    Coupon before = couponRepository.findById(couponId).orElseThrow();
    log.info("{} - 발급 전: {}", Thread.currentThread().getName(), before.getIssuedQuantity());

    int updated = couponRepository.tryIncreaseIssued(couponId);
    if (updated == 0) {
        throw new IllegalStateException("쿠폰 소진 또는 동시성 충돌");
    }

    Coupon after = couponRepository.findById(couponId).orElseThrow();
    log.info("{} - 발급 후: {}", Thread.currentThread().getName(), after.getIssuedQuantity());
}
```

- 다음과 같이 **발급 전/후 따로 findById()를 호출**해도 똑같은 문제가 발생한다.
- 이는 **이전에 엔티티를 읽은 것이 나중에 읽은 것을 오염**시켰기 때문이다.
  - findById()가 호출되면 JPA는 먼저 <strong>1차 캐시(EntityManager 내부 Map)</strong>를 확인한다.
  - 없으면 DB에서 가져와서 1차 캐시에 저장하고, 있으면 **DB를 조회하지 않고 캐시에서 반환한다.**
  - 그래서 캐시에서 **stale(낡은) 데이터**를 반환한 것이다.
- 이를 해결하려면 **업데이트 전에 em.clear()를 호출하여 기존 캐시를 모두 지움으로써, DB를 다시 조회하도록 유도하면 된다.**
  - **@Modifying(clearAutomatically = true)** 옵션을 통해 쿼리 실행 후 캐시를 자동으로 비울 수도 있다.
- 또는 업데이트 후 <strong>em.refresh(before)</strong>를 하여 DB에서 해당 엔티티만 다시 읽어와 캐시 최신화를 할 수 있다.

```java
@Transactional
public void downloadCoupon(Long couponId) {
    Coupon before = couponRepository.findById(couponId).orElseThrow();
    log.info("{} - 발급 전: {}", Thread.currentThread().getName(), before.getIssuedQuantity());

    em.clear(); // 캐시 비우고, 이후 조회하는 모든 엔티티를 다시 읽기
    int updated = couponRepository.tryIncreaseIssued(couponId);
    if (updated == 0) {
        throw new IllegalStateException("쿠폰 소진 또는 동시성 충돌");
    }
    em.refresh(before); // 또는 쿠폰 엔티티만 다시 읽기

    Coupon after = couponRepository.findById(couponId).orElseThrow();
    log.info("{} - 발급 후: {}", Thread.currentThread().getName(), after.getIssuedQuantity());
}
```
