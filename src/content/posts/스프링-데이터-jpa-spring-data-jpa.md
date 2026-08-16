---
title: "스프링 데이터 JPA (Spring Data JPA)"
description: "이전의 순수 JPA 리포지토리는 JdbcTemplate이나 MyBatis에 비해 많은 발전을 이루었지만, 여전히 개발자는 각 엔티티마다 em.persist(), em.find() 등 기본적인 CRUD 코드를 반복적으로 작성해야…"
pubDate: 2025-10-04T11:31:39+09:00
category: "스프링/DB"
tags: []
---

## 스프링 데이터 JPA의 등장: 반복의 종말

이전의 순수 JPA 리포지토리는 JdbcTemplate이나 MyBatis에 비해 많은 발전을 이루었지만,

여전히 개발자는 각 엔티티마다 em.persist(), em.find() 등 **기본적인 CRUD 코드를 반복적으로 작성**해야 한다.

**스프링 데이터 JPA**는 이러한 **반복적인 리포지토리 구현을 제거**하기 위해 등장한, JPA를 더욱 편리하게 사용하도록 도와주는 기술이다.

따라서 개발자는 더 이상 리포지토리의 구현 클래스를 작성할 필요가 없다.

---

## 스프링 데이터 JPA의 핵심 기능

## 1. 공통 인터페이스 (JpaRepository)

- save(), findById(), findAll(), delete() 등 대부분의 DB에 대한 공통 메서드를 모아 JpaRepository라는 인터페이스로 제공한다.
- 개발자는 자신이 만들 리포지토리 인터페이스에서 **JpaRepository를 상속**받기만 하면 된다.

```java
// extends JpaRepository<엔티티 타입, ID 타입>
public interface SpringDataJpaItemRepository extends JpaRepository<Item, Long> {
}
```

**동작 원리**:

1. 애플리케이션이 실행될 때, 스프링 데이터 JPA는 **JpaRepository를 상속받은 인터페이스를 찾는다.**
2. **프록시 기술**을 사용해 **구현 클래스를 동적으로 생성**한다.
3. 생성한 클래스의 인스턴스를 **스프링 빈으로 등록**한다.

이 덕분에 개발자는 **인터페이스**만 정의하면, 어떤 구현 코드도 없이 **기본적인 CRUD 기능**을 모두 사용할 수 있게 된다.

---

## 2. 쿼리 메서드 (Query Method)

- 스프링 데이터 JPA가 **메서드 이름을 분석하여 JPQL 쿼리를 자동으로 생성하고 실행**해 주는 기능이다.
- 단순한 CRUD를 넘어, 특정 조건으로 데이터를 조회해야 할 때 사용한다.

```java
public interface SpringDataJpaItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByItemNameLike(String itemName);
    // select i from Item i where i.itemName like ? JPQL을 자동으로 생성

    List<Item> findByItemNameLikeAndPriceLessThanEqual(String name, Integer price);
    // ... where i.itemName like ? and i.price <= ? JPQL을 자동으로 생성
}
```

이 덕분에 간단한 조회 쿼리는 **메서드 선언**만으로 해결할 수 있어, JPQL을 직접 작성하는 수고를 덜 수 있다.

**쿼리 메서드명 규칙** ([공식 메뉴얼](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)):

- **조회**: find…By, read…By, query…By, get…By
  - 예:) findHelloBy 처럼 ...에 식별하기 위한 내용(설명)이 들어가도 된다.
- **COUNT**: count…By
  - 반환 타입: **long**
- **EXISTS**: exists…By
  - 반환 타입: boolean
- **삭제**: delete…By, remove…By
  - 반환 타입: **long**
- **DISTINCT**: findDistinct, findMemberDistinctBy
- **LIMIT**: findFirst3, findFirst, findTop, findTop3

메서드 이름이 너무 길어지거나, 조인 등 **복잡한 쿼리**가 필요한 경우에는 **@Query** 애노테이션을 사용하여 인터페이스 메서드에 직접 **JPQL을 작성**할 수 있다. 이 경우 메서드 이름은 쿼리 생성에 영향을 주지 않는다.

```java
@Query("select i from Item i where i.itemName like :itemName and i.price <= :price")
List<Item> findItems(@Param("itemName") String itemName, @Param("price") Integer price);
```

---

## 한계: 동적 쿼리

검색 조건이 여러 개이고, 이 조건들이 조합에 따라 동적으로 WHERE 절을 구성해야 할 때, 스프링 데이터 JPA만으로는 깔끔하게 처리하기 어렵다. 실무에서는 이러한 동적 쿼리 문제를 해결하기 위해 **Querydsl**이라는 기술을 함께 사용하는 것이 일반적이다.
