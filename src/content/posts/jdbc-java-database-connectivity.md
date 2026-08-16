---
title: "JDBC (Java Database Connectivity)"
pubDate: 2025-09-22T17:25:12+09:00
category: "스프링/DB"
tags: ["JDBC"]
---

## JDBC의 등장 배경: 표준의 필요성

애플리케이션 서버가 데이터베이스와 연동하기 위해서는 일반적으로 다음 3단계를 거친다.

1. **커넥션 연결**: 데이터베이스에 접속한다.
2. **SQL 전달**: 애플리케이션이 필요한 SQL을 데이터베이스에 보낸다.
3. **결과 응답**: 데이터베이스는 SQL 실행 결과를 애플리케이션에 돌려준다.

과거에는 이 3단계를 수행하는 방법이 데이터베이스마다 모두 달랐다. 이로 인해 다음과 같은 문제가 발생했다.

- **❌ 데이터베이스 변경의 어려움**:

  - 데이터베이스를 변경하면, 데이터베이스와 연동하는 애플리케이션의 코드 전체를 새로 작성해야 한다.
- **❌ 높은 학습 비용**:

  - 개발자는 각각의 데이터베이스에 맞는 접속 및 데이터 처리 방식을 모두 새로 배워야 한다.

이러한 비효율을 해결하기 위해, 자바는 데이터베이스 접근을 위한 표준 인터페이스인 **JDBC**를 만들었다.

---

## JDBC와 JDBC 드라이버

JDBC(Java Database Connectivity)는 **자바 애플리케이션이 데이터베이스와 통신하기 위한 표준 API**다.

JDBC는 자바 표준 라이브러리(java.sql, javax.sql)에 포함되어,

데이터베이스의 종류에 상관없이 동일한 방식으로 접근 가능하게 하는 <strong>추상화 계층(표준 인터페이스)</strong>을 제공한다.

대표적인 JDBC 표준 인터페이스:

- java.sql.**Connection** → 데이터베이스 연결을 담당
- java.sql.**Statement** → SQL을 담아 전달하는 역할
- java.sql.**ResultSet** → SQL 실행 결과를 받는 역할

이제 개발자는 JDBC가 제공하는 표준 인터페이스에만 의존하여 코드를 작성하면 된다. 해당 인터페이스의 구현체는 각 데이터베이스 벤더(회사)가 자신들의 데이터베이스에 맞게 구현하여 **JDBC 드라이버**라는 라이브러리로 제공하기 때문이다.

```sql
애플리케이션 코드 → JDBC 표준 인터페이스
                    /      \
           JDBC 드라이버    JDBC 드라이버
             (MySQL)        (Oracle)
```

결과적으로, 애플리케이션 코드는 JDBC 표준 인터페이스를 호출하고, JDBC 드라이버가 실제 데이터베이스와의 통신을 담당하게 된다.

이 덕분에 데이터베이스를 변경하더라도, 애플리케이션 코드를 수정할 필요 없이 JDBC 드라이버만 교체하면 된다.

> JDBC는 최소한의 공통 기능만 표준화한다. 각 DBMS마다 **고유한 SQL 방언**이 있으므로, SQL은 변경해야 할 수도 있다.
> 이런 문제점은 <strong>JPA (Java Persistence API)</strong>를 사용하면 대부분 해결할 수 있다.

---

## JDBC를 이용한 개발 과정 (CRUD)

JDBC를 사용하여 데이터를 관리하는 과정은 다음과 같은 흐름을 따른다.

1. **커넥션 획득**:
   - DriverManager.getConnection()을 사용해 데이터베이스와의 커넥션을 확보한다.
     - DriverManager는 라이브러리에 등록된 JDBC 드라이버 중에서 적합한 드라이버를 찾고,
     - 해당 드라이버가 구현한 Connection 객체를 반환한다. (예: H2의 경우 org.h2.jdbc.JdbcConnection)
2. **SQL 준비 및 전달**:
   - **PreparedStatement** 객체를 통해 실행할 SQL을 준비한다.
     - ?를 사용한 파라미터 바인딩은 SQL 인젝션 공격을 예방하는 효과적인 방법이다.
     - ps.setString(), ps.setInt() 등으로 SQL의 ?에 실제 값을 채워 넣는다.
3. **쿼리 실행 및 결과 처리**:
   - 등록(INSERT), 수정(UPDATE), 삭제(DELETE) 시 → ps.**executeUpdate()**
     - 이 메서드는 쿼리의 영향을 받은 행(row)의 수를 반환한다.
   - 조회(SELECT) 시 → ps.**executeQuery()**
     - 이 메서드는 쿼리의 결과를 ResultSet 객체에 담아 반환한다.
4. **ResultSet 처리 (조회 시)**:
   - ResultSet은 쿼리의 실행 결과 데이터를 담고 있는 테이블과 유사한 구조다.
   - rs.next()를 호출하여 데이터 행을 한 줄씩 이동하며,
   - rs.getString(), rs.getInt() 등으로 각 열의 데이터를 꺼낸다.
5. **리소스 정리**:
   - 사용한 Connection, PreparedStatement, ResultSet 객체는 반드시 **역순으로** 닫아주어야 한다.
   - 리소스를 제대로 닫지 않으면 커넥션이 계속 유지되어 리소스 누수가 발생할 수 있다.
   - 결과적으로 커넥션 부족으로 인한 장애가 발생할 수 있다.

---

## 실제 코드 예시

```java
public class MemberRepositoryV0 {

    /**
     * 등록
     */
    public Member save(Member member) throws SQLException {
        // 파라미터 바인딩을 통해 SQL Injection 공격 방지
        String sql = "insert into member (member_id, money) values (?, ?)";

        Connection connection = null;
        PreparedStatement statement = null; // Statement에서 SQL 파라미터 바인딩 기능을 확장한 인터페이스

        try {
            // 커넥션 획득
            connection = getConnection();

            // DB에 전달할 SQL 준비
            statement = connection.prepareStatement(sql);
            statement.setString(1, member.getMemberId());
            statement.setInt(2, member.getMoney());

            // 준비된 sql을 커넥션을 통해 DB에 전달 (영향 받은 row 수 반환)
            statement.executeUpdate();

            return member;
        } catch (SQLException e) {
            log.error("db error", e);
            throw e;
        } finally {
            // 예외 발생과 상관없이 항상 호출되도록 finally 구문에 작성 (리소스 누수 방지)
            close(connection, statement, null);
        }
    }

    /**
     * 조회
     */
    public Member findById(String memberId) throws SQLException {
        String sql = "select * from member where member_id = ?";

        Connection connection = null;
        PreparedStatement statement = null;
        ResultSet resultSet = null;

        try {
            connection = getConnection();

            statement = connection.prepareStatement(sql);
            statement.setString(1, memberId);

            // 데이터 등록, 수정, 삭제 시에는 executeUpdate() 사용하지만, 조회 시에는 executeQuery() 사용
            resultSet = statement.executeQuery();

            // resultSet은 select 쿼리 결과가 순서대로 들어있는 자료형
            // resultSet.next() 호출 시 내부에 있는 커서가 다음으로 이동함 (데이터가 없다면 false 반환)
            // 최초의 커서는 데이터를 가리키지 않으므로, 최초 1번은 호출해야 함
            if (resultSet.next()) {
                return new Member(
                        resultSet.getString("member_id"),
                        resultSet.getInt("money")
                );
            } else {
                throw new NoSuchElementException("member not found memberId = " + memberId);
            }
        } catch (SQLException e) {
            log.error("db error", e);
            throw e;
        } finally {
            close(connection, statement, resultSet);
        }
    }

    /**
     * 수정
     */
    public void update(String memberId, int money) throws SQLException {
        String sql = "update member set money = ? where member_id = ?";

        Connection connection = null;
        PreparedStatement statement = null;

        try {
            connection = getConnection();

            statement = connection.prepareStatement(sql);
            statement.setInt(1, money);
            statement.setString(2, memberId);

            // 쿼리 실행 후 영향 받은 row 수 반환
            int result = statement.executeUpdate();

            log.info("ressult = {}", result);
        } catch (SQLException e) {
            log.error("db error", e);
            throw e;
        } finally {
            close(connection, statement, null);
        }
    }

    /**
     * 삭제
     */
    public void delete(String memberId) throws SQLException {
        String sql = "delete from member where member_id = ?";

        Connection connection = null;
        PreparedStatement statement = null;

        try {
            connection = getConnection();

            statement = connection.prepareStatement(sql);
            statement.setString(1, memberId);

            int result = statement.executeUpdate();

            log.info("ressult = {}", result);
        } catch (SQLException e) {
            log.error("db error", e);
            throw e;
        } finally {
            close(connection, statement, null);
        }
    }

    // 커넥션 획득 (DriverManager 사용)
    private Connection getConnection() throws SQLException {
        // 적합한 JDBC 드라이버를 찾아서, 해당 드라이버가 제공하는 커넥션을 반환
        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }

    // 역순으로 리소스 정리
    private void close(Connection connection, Statement statement, ResultSet resultSet) {
        if (resultSet != null) {
            try {
                resultSet.close();
            } catch (SQLException e) {
                log.error("resultSet error", e);
            }
        }
        if (statement != null) {
            try {
                statement.close();
            } catch (SQLException e) {
                log.error("statement error", e);
            }
        }
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                log.error("connection error", e);
            }
        }
    }
}
```

---

## JDBC와 최신 데이터 접근 기술

JDBC는 강력하지만, 커넥션을 얻고 리소스를 정리하는 등의 반복적인 코드를 직접 작성해야 하는 번거로움이 있다.

이 문제를 해결하기 위해 현대 애플리케이션에서는 JDBC를 직접 사용하기보다, JDBC를 기반으로 만들어진 더 편리한 기술들을 사용한다.

대표적으로 SQL Mapper와 ORM 기술로 나눌 수 있다.

- **SQL Mapper**:
  - 개발자가 SQL은 직접 작성하지만, JDBC의 반복적인 작업(커넥션, 리소스 정리, 결과 매핑 등)을 대신 처리해 준다.
  - 예시: 스프링의 JdbcTemplate, MyBatis
- **ORM (Object-Relational Mapping)**:
  - 객체와 관계형 데이터베이스 테이블을 자동으로 매핑해주는 기술이다.
  - 개발자가 SQL을 직접 작성하지 않아도, ORM 기술이 객체 조작을 기반으로 SQL을 동적으로 생성하여 실행한다.
  - 예시: JPA, 그 구현체인 하이버네이트(Hibernate)

이러한 최신 기술들도 **내부적으로는 모두 JDBC를 사용**하기 때문에, JDBC의 기본 동작 원리를 이해하는 것이 매우 중요하다.
