---
title: "Querydsl"
description: "JdbcTemplate, MyBatis, JPA(JPQL)와 같은 기존 데이터 접근 기술들은 다음과 같은 공통적인 약점을 가지고 있다. 동적 쿼리 작성의 어려움: 검색 조건이 다양하게 조합되는 동적 쿼리를 작성하기가 매우 복잡하다."
pubDate: 2025-10-04T14:19:53+09:00
category: "스프링/DB"
tags: ["Querydsl", "문자열"]
---

## 동적 쿼리와 문자열 쿼리의 한계

JdbcTemplate, MyBatis, JPA(JPQL)와 같은 기존 데이터 접근 기술들은 다음과 같은 공통적인 약점을 가지고 있다.

- **동적 쿼리 작성의 어려움**:
  - 검색 조건이 다양하게 조합되는 동적 쿼리를 작성하기가 매우 복잡하다.
  - 자바 코드에서 if 문으로 SQL 문자열을 조립하거나, XML에서 복잡한 태그를 사용해야 한다.
- **문자열 기반 쿼리의 한계**:
  - SQL이나 JPQL은 결국 문자열이다.
  - 따라서 쿼리에 오타가 있어도 컴파일 시점에는 오류를 잡을 수 없고, 애플리케이션이 실행된 후에야 런타임 오류가 발생한다.

Querydsl은 바로 이 두 가지 문제를 해결하기 위해 등장한 **쿼리 빌더 라이브러리**다.

---

## Querydsl: 쿼리를 Java 코드로, Type-Safe하게

Querydsl의 핵심 아이디어는 **SQL(또는 JPQL)을 문자열이 아닌 자바 코드로 작성**하는 것이다.

## 동작 원리

1. **Q-Type 생성**:
   - 프로젝트를 컴파일하면, Querydsl은 Annotation Processor를 이용해 JPA 엔티티(@Entity)를 분석하여,
   - 해당 엔티티의 메타 정보를 담은 Q-Type 클래스(예: Item → QItem)를 자동으로 생성한다.
2. **자바 코드로 쿼리 작성**:
   - 개발자는 이 Q-Type 클래스를 사용하여 자바 코드로 쿼리를 작성한다.
   - 쿼리의 모든 요소(테이블, 컬럼, 조건 등)는 자바 객체로 표현된다.

## 장점

- **컴파일 시점 오류 감지**:
  - 쿼리를 자바 코드로 작성하므로, 오타가 발생하면 컴파일 시점에 바로 발견할 수 있어, **타입 안정성**이 보장된다.
- **IDE 자동 완성 지원**:
  - Q-Type을 통해 엔티티의 필드들이 자동으로 완성되므로, 생산성이 향상되고 실수가 줄어든다.
- **동적 쿼리 해결**:
  - 자바의 if문과 메서드 분리 등 모든 기능을 활용하여 동적 쿼리를 매우 깔끔하고 유연하게 작성할 수 있다.

---

## Querydsl 설정 방법

우선 build.gradle에 다음 설정을 추가하자.

```java
dependencies {
    implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
    annotationProcessor "com.querydsl:querydsl-apt:${dependencyManagement.importedProperties['querydsl.version']}:jakarta"
    annotationProcessor "jakarta.annotation:jakarta.annotation-api"
    annotationProcessor "jakarta.persistence:jakarta.persistence-api"
}

clean {
    delete file('src/main/generated')
}
```

그리고 다음을 차례대로 실행하자.

- Gradle → Tasks → build → clean
- Gradle → Tasks → other → compileJava

그러면 프로젝트 파일의 build/generated/sources/annotationProcessor/java/main 하위에 Q 타입 클래스가 생성되어 있어야 한다.

---

**Querydsl 적용 예시**

```java
import static hello.itemservice.domain.QItem.item;

@Repository
@Transactional
@RequiredArgsConstructor
public class JpaItemRepositoryV3 implements ItemRepository {

    private final EntityManager em;
    private final JPAQueryFactory queryFactory;

    public JpaItemRepositoryV3(EntityManager em) {
        this.em = em;
        this.queryFactory = new JPAQueryFactory(em);
    }

    ...

    // 1. BooleanBuilder를 이용한 동적 쿼리
    public List<Item> findAllV1(ItemSearchCond cond) {
        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();

        // QItem item = new QItem("i");
        // QItem 내부에 public static final QItem item = new QItem("item"); 존재

        BooleanBuilder booleanBuilder = new BooleanBuilder();
        if (StringUtils.hasText(itemName)) {
            booleanBuilder.and(item.itemName.like("%" + itemName + "%"));
        }
        if (maxPrice != null) {
            booleanBuilder.and(item.price.loe(maxPrice));
        }

        return queryFactory
                .select(item)
                .from(item)
                .where(booleanBuilder)
                .fetch();
    }

    // 2. BooleanExpression를 이용한 동적 쿼리
    public List<Item> findAllV2(ItemSearchCond cond) {
        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();

        return queryFactory
                .select(item)
                .from(item)
                .where(
                        ItemNameLike(itemName),
                        maxPriceLoe(maxPrice)
                )
                .fetch();
    }

    private BooleanExpression ItemNameLike(String itemName) {
        if (StringUtils.hasText(itemName)) {
            return item.itemName.like("%" + itemName + "%");
        }
        return null;
    }

    private BooleanExpression maxPriceLoe(Integer maxPrice) {
        if (maxPrice != null) {
            return item.price.loe(maxPrice);
        }
        return null;
    }
}
```

**JPAQueryFactory**:

- Querydsl은 JPA 쿼리인 JPQL을 자동으로 생성하고 실행한다.
- 이를 위해 JPAQueryFactory가 필요하며, 이는 JPA의 **EntityManager**를 통해 생성한다.

**동적 쿼리를 작성하는 2가지 방법**:

1. **BooleanBuilder 이용**:
   - booleanBuilder.and(), booleanBuilder.or() 등을 통해 원하는 조건을 추가하고,
   - where() 절 안에 booleanBuilder를 넣으면 된다.
2. **BooleanExpression 이용**:
   - if 문 등을 통해 BooleanExpression을 반환하는 조건 메서드를 정의하고,
   - where() 절 안에 해당 메서드를 넣으면 된다.
   - where() 절은 파라미터로 받은 BooleanExpression들을 AND 조건으로 자동으로 조합한다.
   - 또한 where() 절에 null이 전달되면 해당 조건은 **자동으로 무시**된다.
   - 조건 메서드들은 다른 쿼리에서도 재사용될 수 있어 코드의 모듈화가 가능해진다.

---

## 정리

다음 세 가지 기술은 각자의 역할을 보완하며 강력한 시너지를 낸다.

- **JPA**: ORM 기술을 통해 객체-테이블 매핑을 처리하여 생산성을 높인다.
- **Spring Data JPA**: JPA를 더욱 편리하게 사용하여, 인터페이스 선언만으로 리포지토리 구현을 자동화한다.
- **Querydsl**: 두 기술의 약점인 복잡한 조회와 동적 쿼리를 타입-세이프하고 깔끔하게 해결한다.

따라서 현대 스프링 기반 애플리케이션의 데이터 접근 기술에서 위 세 기술은 실무의 다양한 문제를 해결하기 위한 **표준 조합**으로 여겨진다.
