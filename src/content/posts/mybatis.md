---
title: "MyBatis"
description: "MyBatis는 JdbcTemplate과 같이 SQL을 직접 다루는 SQL Mapper 기술이다. 하지만 JdbcTemplate보다 더 많은 편의 기능, 특히 동적 쿼리 작성과 SQL의 분리 측면에서 강력한 장점을 가진다."
pubDate: 2025-10-03T15:56:44+09:00
category: "스프링/DB"
tags: []
---

## MyBatis: SQL 중심의 데이터 접근 기술

MyBatis는 JdbcTemplate과 같이 SQL을 직접 다루는 **SQL Mapper** 기술이다.

하지만 JdbcTemplate보다 더 많은 편의 기능, 특히 **동적 쿼리** 작성과 **SQL의 분리** 측면에서 강력한 장점을 가진다.

## JdbcTemplate vs MyBatis

- **SQL 작성**:
  - **JdbcTemplate**: SQL을 **자바 코드** 내에서 **문자열**로 작성해야 하므로, 여러 줄의 복잡한 SQL을 다루기 불편하다.
  - **MyBatis**: SQL을 별도의 **XML 파일**에 작성하므로, SQL 자체에만 집중할 수 있고 가독성이 높다.
- **동적 쿼리 작성**:
  - **JdbcTemplate**: 자바 코드에서 **수많은 if 문과 문자열을 조립**해야 하므로, 복잡하고 오류가 발생하기 쉽다.
  - <strong>MyBatis</strong>: 동적 쿼리를 <strong>XML 태그(&lt;if>, &lt;where> 등)</strong>를 통해 매우 간결하고 직관적으로 작성할 수 있다.

> 언제 사용할까?
>
> - 단순한 쿼리가 많다면 설정이 거의 필요 없는 JdbcTemplate이 좋은 선택이다.
> - 복잡한 쿼리나 동적 쿼리가 많다면 MyBatis가 훨씬 효율적이다.

---

## MyBatis의 핵심 구성 요소: Mapper 인터페이스와 XML

MyBatis는 **Mapper 인터페이스**와 **XML 파일**이라는 두 가지 핵심 요소를 통해 동작한다.

우선 build.gradle에 다음 의존성을 추가하자.

```java
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:3.0.5'
```

> 스프링 부트가 버전을 관리하는 공식 라이브러리가 아니므로 뒤에 적절한 버전을 적어줘야 한다.

## 1. Mapper 인터페이스 (@Mapper)

- **SQL을 호출할 자바 인터페이스**를 정의하고 **@Mapper** 애노테이션을 붙인다.

```java
@Mapper
public interface ItemMapper {

    void save(Item item);

    void update(@Param("id") Long id, @Param("updateParam") ItemUpdateDto updateParam);

    Optional<Item> findById(Long id);

    List<Item> findAll(ItemSearchCond itemSearch);
}
```

- 파라미터가 2개 이상이면 **@Param** 애노테이션을 통해 파라미터 이름을 지정해야 한다.

## 2. XML 매퍼

- Mapper 인터페이스와 **동일한 경로**에, 실제 SQL을 담고 있는 XML 파일을 작성한다.
- application.properties에 mybatis.mapper-locations=classpath:mapper/\*\*/\*.xml 설정을 추가하면 resources/mapper를 포함한 그 하위 폴더에 있는 XML 파일을 매퍼로 인식한다. (파일명은 자유롭게 설정 가능)

```html
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="hello.itemservice.repository.mybatis.ItemMapper">

    <insert id="save" useGeneratedKeys="true" keyProperty="id">
        insert into item (item_name, price, quantity)
        values (#{itemName}, #{price}, #{quantity})
    </insert>

    <update id="update">
        update item
        set item_name=#{updateParam.itemName},
            price=#{updateParam.price},
            quantity=#{updateParam.quantity}
        where id = #{id}
    </update>

    <select id="findById" resultType="Item">
        select id, item_name, price, quantity
        from item
        where id = #{id}
    </select>

    <select id="findAll" resultType="Item">
        select id, item_name, price, quantity
        from item
        <where>
            <if test="itemName != null and itemName != ''">
                and item_name like concat('%',#{itemName},'%')
            </if>
            <if test="maxPrice != null">
                and price &lt;= #{maxPrice}
            </if>
        </where>
    </select>

</mapper>
```

- **namespace**: 연결할 Mapper 인터페이스의 전체 경로를 지정한다.
- **&lt;select>, &lt;insert>, &lt;update>, &lt;delete>**: SQL의 종류에 맞는 태그를 사용하면 된다.
  - **id**: 인터페이스의 **메서드명**을 지정한다.
  - **resultType**: 조회 결과를 **매핑할 객체 타입**을 지정한다.
  - **useGeneratedKeys**: 데이터베이스의 identity 전략에서 자동 생성되는 키의 속성 이름을 지정한다.
- **#{...}**: PreparedStatement를 사용하여 파라미터를 안전하게 바인딩한다.
- **&lt;if>**: test 조건이 참일 경우에만 내부의 SQL 조각을 포함시킨다.
- **&lt;where>**: &lt;if> 조건이 하나라도 참이면 WHERE 절을 자동으로 추가하고, **가장 앞에 오는 and나 or를 제거**해 준다.
  - 이 덕분에 개발자는 WHERE와 AND를 붙이는 복잡한 로직을 고민할 필요가 없다.
- ⚠️ 데이터 영역에서 <strong><, >, &</strong> 같은 특수 문자는 <strong>&lt;, &gt;, &amp;</strong>와 같이 <strong>HTML 엔티티</strong>로 나타내야 한다.

> application.properties에 **mybatis.type-aliases-package={패키지명}** 설정을 추가하면 타입 정보를 사용할 때 패키지명을 생략할 수 있으며, **mybatis.configuration.map-underscore-to-camel-case=true** 설정을 추가하면, item\_name과 같은 snake\_case 컬럼을 itemName 같은 camelCase 프로퍼티에 자동으로 매핑해 준다.

Mapper 인터페이스와 XML 파일을 적용한 리포지토리는 다음과 같다.

```java
@Repository
@RequiredArgsConstructor
public class MyBatisItemRepository implements ItemRepository {

    private final ItemMapper itemMapper;

    @Override
    public Item save(Item item) {
        itemMapper.save(item);
        return item;
    }

    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        itemMapper.update(itemId, updateParam);
    }

    @Override
    public Optional<Item> findById(Long id) {
        return itemMapper.findById(id);
    }

    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        return itemMapper.findAll(cond);
    }
}
```

---

## Mapper 인터페이스의 동작 원리

1. 애플리케이션이 실행될 때, **MyBatis-Spring 연동 모듈**은 **@Mapper가 붙은 인터페이스**를 찾는다.
2. Mapper 인터페이스를 찾으면, **동적 프록시 기술**을 통해 해당 인터페이스의 **구현체를 생성**한다.
3. 생성한 구현체를 **스프링 빈으로 등록**한다.

따라서 개발자는 **인터페이스**만 만들면 되며, 자동 생성된 구현체가 **XML에 정의된 SQL을 실행**하는 역할을 한다.

> 자세한 내용은 공식 메뉴얼을 참고하자.
>
> - MyBatis 공식 메뉴얼: <https://mybatis.org/mybatis-3/ko/index.html>
> - MyBatis 스프링 공식 메뉴얼: <https://mybatis.org/spring/ko/index.html>
