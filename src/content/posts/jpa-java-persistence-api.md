---
title: "JPA (Java Persistence API)"
pubDate: 2025-10-03T17:14:15+09:00
category: "스프링/DB"
tags: ["JPA"]
---

## ORM과 JPA: 왜 SQL에서 객체로 패러다임이 전환되었나?

JdbcTemplate이나 MyBatis와 같은 **SQL Mapper** 기술은 JDBC의 반복 작업을 줄여주었지만,

여전히 개발자가 SQL을 직접 작성해야 하는 한계가 있다.

이는 애플리케이션의 **객체 모델**과 데이터베이스의 **관계형 모델** 사이에 불일치가 발생하며,

개발자는 객체를 SQL로, SQL 결과를 다시 객체로 변환하는 반복적이고 지루한 작업을 계속해야 한다.

이러한 SQL 중심 개발의 문제점을 해결하기 위해 **ORM(Object-Relational Mapping)** 기술이 등장했다.

ORM은 이름 그대로 애플리케이션의 객체와 관계형 데이터베이스의 테이블을 자동으로 매핑해주는 기술이다.

<strong>JPA(Java Persistence API)</strong>는 이러한 ORM 기술에 대한 자바 표준 사양(API)이며,

<strong>하이버네이트(Hibernate)</strong>는 이 JPA 표준을 구현한 가장 널리 사용되는 구현체다.

이제 개발자는 더 이상 SQL을 작성하지 않아도 된다.

그저 객체를 다루기만 하면, ORM 기술이 적절한 SQL을 생성하여 실행하고, 그 결과까지 객체로 변환해 준다.

이로 인해 개발 생산성이 비약적으로 향상된다.

---

## JPA의 핵심 구성 요소 및 개발 방법

우선 build.gradle에 다음 의존성을 추가하자.

```java
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
```

하이버네이트가 생성하고 실행하는 SQL을 확인하려면 application.properties에 다음 설정을 추가하자.

```java
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.orm.jdbc.bind=TRACE
```

JPA를 사용하는 첫 단계는 자바 객체가 어떤 테이블과 어떻게 매핑되는지를 알려주는 것이다. 이는 애노테이션을 통해 이루어진다.

```java
@Entity // 이 클래스는 JPA가 관리하는 엔티티임을 선언
public class Item {

    @Id // 테이블의 Primary Key와 매핑
    @GeneratedValue(strategy = GenerationType.IDENTITY) // DB의 identity 방식 사용
    private Long id;

    @Column(name = "item_name", length = 20) // 객체 필드와 테이블의 컬럼을 매핑
    private String itemName;

    private Integer price;
    private Integer quantity;

    public Item() { // JPA는 public 또는 protected 기본 생성자가 필수
    }

    ...
}
```

JPA를 사용하는 리포지토리는 다음과 같다.

```java
@Repository // 컴포넌트 스캔 대상, 예외 변환 AOP의 적용 대상이 됨 (즉, 예외 변환을 처리하는 프록시를 만들어 줌)
@Transactional // JPA의 모든 데이터 변경(등록, 수정, 삭제)은 트랜잭션 안에서 이루어져야 함
@RequiredArgsConstructor
public class JpaItemRepositoryV1 implements ItemRepository {

    private final EntityManager em; // 내부에서 DataSource를 통해 DB 접근

    @Override
    public Item save(Item item) {
        em.persist(item); // 자동으로 INSERT 쿼리 보내고, ID 키도 자동으로 넣어줌
        return item;
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        Item item = em.find(Item.class, itemId);
        item.setItemName(updateParam.getItemName());
        item.setPrice(updateParam.getPrice());
        item.setQuantity(updateParam.getQuantity());
        // 조회 시점에 스냅샷을 뜨고, 데이터 변경점을 저장한 뒤, 트랜잭션 커밋 시점에 자동으로 UPDATE 쿼리 보냄
    }

    @Override
    public Optional<Item> findById(Long id) {
        Item item = em.find(Item.class, id);
        return Optional.ofNullable(item);
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        String jpql = "select i from Item i"; // Item 엔티티 자체를 조회

        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();

        // 동적 쿼리
        if (StringUtils.hasText(itemName) || maxPrice != null) jpql += " where";
        boolean andFlag = false;
        if (StringUtils.hasText(itemName)) {
            jpql += " i.itemName like concat('%',:itemName,'%')";
            andFlag = true;
        }
        if (maxPrice != null) {
            if (andFlag) jpql += " and";
            jpql += " i.price <= :maxPrice";
        }

        TypedQuery<Item> query = em.createQuery(jpql, Item.class);

        if (StringUtils.hasText(itemName)) {
            query.setParameter("itemName", itemName);
        }
        if (maxPrice != null) {
            query.setParameter("maxPrice", maxPrice);
        }

        return query.getResultList();
    }
}
```

- **EntityManager**:
  - 엔티티를 관리하는 JPA의 핵심 인터페이스다.
  - 스프링을 통해 리포지토리에 주입받아 사용한다.
  - persist()를 통해 데이터를 저장하고, find()를 통해 조회하며, createQuery()를 통해 JPQL을 실행할 수 있다.
- **@Transactional**:
  - JPA에서 모든 데이터 변경(저장, 수정, 삭제) 작업은 반드시 트랜잭션 내에서 이루어져야 한다.
  - 조회 작업은 조회 전용 트랜잭션을 걸거나, 아예 트랜잭션이 없어도 가능하다.
- **변경 감지 (Dirty Checking)**:
  - 트랜잭션 내에서 조회한 엔티티의 값을 변경하기만 하면, 트랜잭션이 커밋될 때 JPA가 변경된 내용을 자동으로 감지하여 UPDATE 쿼리를 생성하고 실행해 준다.
  - 즉, 별도의 update() 메서드를 호출할 필요가 없다.
- **JPQL (Java Persistence Query Language)**:
  - 테이블이 아닌 엔티티 객체를 대상으로 하는 객체지향 쿼리 언어다. (SQL과 문법이 매우 유사하다.)
  - 개발자가 JPQL을 작성하면, JPA가 이를 분석하여 현재 설정된 데이터베이스에 맞는 SQL로 변환하여 실행한다.
- **JPA 예외 변환 (@Repository의 비밀)**:
  - JPA는 PersistenceException과 같은 JPA 전용 예외를 발생시킨다.
  - 만약 이 예외가 서비스 계층으로 전파되면, 서비스 계층은 JPA라는 특정 기술에 종속되게 된다.
  - 스프링은 @Repository 애노테이션이 붙은 클래스에 예외 변환 AOP 프록시를 적용한다.
  - 따라서 JPA 예외가 발생하면 이를 스프링의 데이터 접근 예외(DataAccessException) 계층의 예외로 자동 변환해 준다.
  - 이 덕분에 서비스 계층은 특정 기술에 종속되지 않고 순수성을 유지할 수 있다.

> 스프링은 JPA를 사용할 경우 JPA 예외 변환기(PersistenceExceptionTranslator)를 자동으로 등록한다.

> 스프링 부트는 PersistenceExceptionTranslationPostProcessor를 자동으로 등록하는데, 여기서 @Repository를 AOP 프록시로 만드는 어드바이저가 등록된다.
