---
title: "스프링의 예외 추상화 (DataAccessException), 예외 변환기 (SQLExceptionTranslator)"
description: "체크 예외는 개발자가 예외를 누락하지 않도록 해주는 훌륭한 안전장치이지만, 계층형 아키텍처에서는 의존 관계 문제를 유발할 수 있다."
pubDate: 2025-09-23T21:24:45+09:00
category: "스프링/DB"
tags: ["예외 처리"]
---

## 체크 예외의 딜레마: 의존 관계 문제

**체크 예외**는 개발자가 예외를 누락하지 않도록 해주는 훌륭한 안전장치이지만, 계층형 아키텍처에서는 의존 관계 문제를 유발할 수 있다.

예를 들어, 리포지토리 계층에서 JDBC를 사용하면 **SQLException**이라는 체크 예외가 발생할 수 있다.

- 따라서 해당 예외를 발생시킬 수 있는 리포지토리 메서드는 throws SQLException을 선언해야 한다.
- 하지만 이를 호출하는 서비스 계층은 해당 예외를 처리할 수 없으므로, 자신도 throws SQLException을 선언하여 던져야 한다.
- 결과적으로 서비스 계층이 특정 데이터 접근 기술에 종속되어 버린다. (java.sql.SQLException)

```java
// 서비스 계층
public void save(Member member) throws SQLException { // ? JDBC 기술에 종속!
    memberRepository.save(member);
}

// 리포지토리 계층 (JDBC)
public void save(Member member) throws SQLException {
    ...
}
```

여기서 만약 데이터 기술을 JDBC에서 JPA로 변경한다면, SQLException은 예를 들어 JPAException으로 바뀔 것이고, 이는 서비스 계층의 모든 관련 코드를 수정해야 함을 의미한다.

```java
// 서비스 계층
public void save(Member member) throws JPAException { // ? JPAException으로 수정!
    memberRepository.save(member);
}

// 리포지토리 계층 (JPA)
public void save(Member member) throws JPAException {
    ...
}
```

즉, 체크 예외는 서비스 계층의 순수성을 해치고 유연성을 떨어뜨리는 심각한 문제를 발생시킬 수 있다.

---

## 해결책: 런타임 예외로 전환

이 문제를 해결하는 가장 좋은 방법은, 리포지토리 계층의 경계에서 체크 예외를 런타임 예외로 전환(wrapping)하여 던지는 것이다.

런타임 예외는 throws 선언이 필수가 아니므로, 서비스 계층은 더 이상 특정 기술의 예외에 의존하지 않고 순수성을 유지할 수 있다.

```java
// 서비스 계층
public void save(Member member) { // ✅ throws SQLException 제거!
    memberRepository.save(member);
}

// 리포지토리 계층
public void save(Member member) { // ✅ throws SQLException 제거!
    try {
        ...
    } catch (SQLException e) {
        throw new MyDBException(e); // ✅ 체크 예외(SQLException)를 런타임 예외(MyDBException)로 전환!
    }
}
```

**⚠️ 주의: 예외 포함 (Exception Chaining)**:

- 예외를 전환할 때 가장 중요한 것은 기존 예외(e)를 새로운 예외의 원인(cause)으로 포함하는 것이다.
- 이렇게 해야 스택 트레이스를 통해 최초의 근본 원인이 무엇이었는지를 놓치지 않고 파악할 수 있다.

## 한계: 예외 구분 불가

- 위 방식의 리포지토리 메서드에서는 MyDBException만 발생한다.
- 따라서 서비스 계층에서 예외를 잡아서 복구하고 싶을 때 예외가 발생한 상황을 구분할 수 없다는 문제점이 있다.

---

## 해결책: 데이터 접근 예외 만들기

데이터베이스는 오류가 발생하면 **특정 오류 코드**를 JDBC 드라이버로 반환한다.

그리고 JDBC 드라이버는 해당 코드를 SQLException에 담아서 던진다.

따라서 SQLException에 담겨있는 errorCode를 통해 오류를 구분하여, SQLException을 특정 예외로 전환하여 던질 수 있다.

```java
                    서비스 계층
                       ↑
     (SQLException의 errorCode를 이용해 특정 예외를 던짐)
                       ↑
                   리포지토리 계층
                       ↑
         (SQLException에 오류 코드를 담아서 던짐)
                       ↑
                   JDBC 드라이버
                       ↑
                  (오류 코드 반환)
                       ↑
                     DB 서버
```

예를 들어, 회원 ID가 중복되면 뒤에 임의의 숫자를 붙여서 새로운 ID를 생성한다고 가정하자.

- 서비스 계층에서는 예외 복구를 위해 "키 중복 오류"를 구분할 수 있어야 한다.
- H2 데이터베이스의 경우 키가 중복되면 **23505**라는 에러 코드를 반환한다.
- 따라서 SQLException의 errorCode가 23505면, 해당 예외를 "키 중복 예외"로 전환하여 던지면 된다.

이를 이용한 예시 코드는 다음과 같다.

```java
class ExceptionTranslatorTest {

    Repository repository;
    Service service;

    @BeforeEach
    void setUp() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(URL, USERNAME, PASSWORD);
        repository = new Repository(dataSource);
        service = new Service(repository);
    }

    @Test
    void 중복_키_저장() {
        service.create("myId");
        service.create("myId");
    }

    @RequiredArgsConstructor
    static class Service {

        private final Repository repository;

        public void create(String memberId) {
            try {
                repository.save(new Member(memberId, 0));
            } catch (MyDuplicateKeyException e) {
                // MyDuplicateKeyException이 발생하면 잡아서 복구
                String newId = generateNewId(memberId);
                repository.save(new Member(newId, 0));
            } catch (MyDBException e) {
                // MyDBException이 발생하면 다시 밖으로 던짐
                throw e;
            }
        }

        private String generateNewId(String memberId) {
            return memberId + new Random().nextInt(10000);
        }
    }

    @RequiredArgsConstructor
    static class Repository {

        private final DataSource dataSource;

        public Member save(Member member) {
            String sql = "insert into member (member_id, money) values (?, ?)";
            Connection connection = null;
            PreparedStatement statement = null;
            try {
                connection = dataSource.getConnection();
                statement = connection.prepareStatement(sql);
                statement.setString(1, member.getMemberId());
                statement.setInt(2, member.getMoney());
                statement.executeUpdate();
                return member;
            } catch (SQLException e) {
                // 중복 키 에러인 경우 → MyDuplicateKeyException 던짐
                if (e.getErrorCode() == 23505) {
                    throw new MyDuplicateKeyException(e);
                }
                // 그 외의 경우 → MyDBException 던짐
                throw new MyDBException(e);
            } finally {
                JdbcUtils.closeStatement(statement);
                JdbcUtils.closeConnection(connection);
            }
        }
    }
}
```

- Repository에서는 SQLException을 잡아서,
  - 만약 errorCode가 23505(중복 키 오류)라면 → MyDuplicateKeyException으로 전환하여 던진다.
  - 그 외의 경우에는 → MyDBException으로 전환하여 던진다.
- Service에서는 Repository 호출 시,
  - MyDuplicateKeyException이 발생하면 → 해당 예외를 잡아서 복구한다.
  - 그 외에 복구할 수 없는 MyDBException이 발생하면 → 해당 예외를 잡아서 다시 밖으로 던진다.

## 한계: 데이터베이스마다 다른 에러 코드

- SQLException의 errorCode는 데이터베이스의 종류마다 다르기 때문에, 데이터베이스가 변경되면 에러 코드도 다 변경해야 한다.

---

**✅ 스프링의 해결책1: 예외 추상화 (DataAccessException), 예외 변환기 (SQLExceptionTranslator)**

스프링은 런타임 예외를 최상위로 하는 DataAccessException이라는 표준화된 데이터 접근 예외 계층을 제공한다.

이를 통해 데이터 접근과 관련된 수십 가지의 예외를 추상화하여 제공한다.

```java
                          RuntimeException
                                 |
                      {  DataAccessException  }
                         /                 \
                 NonTransient            Transient
             DataAccessException        DataAccessException
                /          \                 /          \
        DataIntegrity    BadSqlGrammar    Query        Optimistic
     ViolationException    Exception     Timeout      LockingFailure
             /                           Exception       Exception
   DuplicateKeyException
```

- 각각의 예외는 특정 기술에 종속적이지 않게 설계되어 있다.
- DataAccessException은 크게 **NonTransient** 예외와 **Transient** 예외로 구분된다.
  - NonTransient (일시적이지 않다): 같은 SQL을 다시 실행해도 실패한다. (문법 오류, 제약 조건 위배 등)
  - Transient (일시적이다): 같은 SQL을 다시 실행하면 성공할 수도 있다. (쿼리 타임아웃, 락 타임아웃 등)

그리고 스프링은 데이터베이스마다 다른 오류 코드를 분석하여, 각 상황에 맞는 DataAccessException로 변환해주는 예외 변환기인 **SQLExceptionTranslator**를 제공한다.

SQLExceptionTranslator의 translate() 메서드의 파라미터로 (설명, 실행한 SQL, 발생한 SQLException)을 전달하면, 스프링의 표준 예외로 변환해 준다.

```java
class SpringSQLExceptionTranslatorTest {

    DataSource dataSource;

    @BeforeEach
    void setUp() {
        dataSource = new DriverManagerDataSource(URL, USERNAME, PASSWORD);
    }

    @Test
    void 잘못된_문법_오류() {
        String sql = "select bad grammar";
        try {
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql);
            statement.executeQuery();
        } catch (SQLException e) {
            int errorCode = e.getErrorCode();
            assertThat(errorCode).isEqualTo(42122); // COLUMN_NOT_FOUND_1
        }
    }

    @Test
    void 스프링_예외_변환기_사용() {
        String sql = "select bad grammar";
        try {
            Connection connection = dataSource.getConnection();
            PreparedStatement statement = connection.prepareStatement(sql);
            statement.executeQuery();
        } catch (SQLException e) {
            // 스프링의 예외 변환기 (SQLExceptionTranslator)
            SQLExceptionTranslator ts = new SQLErrorCodeSQLExceptionTranslator(dataSource);

            // (설명, 실행한 SQL, 발생한 SQLException)을 파라미터로 전달하면, 스프링의 표준 예외로 변환해줌
            DataAccessException resultEx = ts.translate("select", sql, e);

            assertThat(resultEx.getClass()).isEqualTo(BadSqlGrammarException.class);
        }
    }
}
```

SQLExceptionTranslator를 통해 DB별로 다른 SQL 오류 코드를 스프링의 DataAccessException으로 변환해 준다.

이 덕분에 개발자는 데이터베이스 종류나 데이터베이스 접근 기술(JDBC, JPA 등)에 상관없이, 스프링이 제공하는 일관된 예외를 사용하여 서비스 계층의 순수성을 유지한 채로 예외를 처리할 수 있게 된다.

> 스프링은 내부적으로 **sql-error-codes.xml** 파일 등을 통해 데이터베이스 종류별 SQL 오류 코드를 미리 정의된 스프링의 DataAccessException 서브클래스와 매핑해 두고, 이를 활용하여 오류를 자동 변환한다.

---

## 스프링의 해결책2: 반복 코드 제거 (JdbcTemplate)

리포지토리에서 JDBC를 사용함으로써 반복적으로 나타나는 부분(리소스 연결 및 정리, 예외 처리 등)을 해결하기 위해 스프링은 JdbcTemplate이라는 클래스를 제공한다.

JdbcTemplate은 **템플릿 콜백 패턴**을 사용하여 JDBC의 반복적인 작업을 대신 처리해 준다.

개발자는 JdbcTemplate이 요구하는 형식에 맞춰 실행할 SQL과 파라미터, 그리고 조회 결과를 어떻게 객체로 변환할지만 정의하면 된다.

```java
public class MemberRepositoryV5 {

    private final JdbcTemplate jdbcTemplate;

    // JdbcTemplate은 DataSource 필요
    public MemberRepositoryV5(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    // 등록
    public Member save(Member member) {
        String sql = "insert into member (member_id, money) values (?, ?)";
        jdbcTemplate.update(sql, member.getMemberId(), member.getMoney());
        return member;
    }

    // 조회
    public Member findById(String memberId) {
        String sql = "select * from member where member_id = ?";
        return jdbcTemplate.queryForObject(sql, memberRowMapper(), memberId);
    }

    // 조회 결과 데이터를 Member 객체로 매핑
    private RowMapper<Member> memberRowMapper() {
        return (rs, rowNum) -> {
            Member member = new Member();
            member.setMemberId(rs.getString("member_id"));
            member.setMoney(rs.getInt("money"));
            return member;
        };
    }

    // 수정
    public void update(String memberId, int money) {
        String sql = "update member set money = ? where member_id = ?";
        jdbcTemplate.update(sql, money, memberId);
    }

    // 삭제
    public void delete(String memberId) {
        String sql = "delete from member where member_id = ?";
        jdbcTemplate.update(sql, memberId);
    }
}
```

JdbcTemplate을 사용함으로써 커넥션을 얻고 동기화하는 작업, PreparedStatement를 생성하고 실행하는 작업, 리소스를 정리하는 작업, 그리고 예외가 발생했을 때 스프링 예외로 변환해 주는 작업까지 모두 JdbcTemplate 내부로 숨겨진다.

그 결과, 리포지토리 코드는 핵심적인 SQL과 비즈니스 데이터 처리 로직만 남아 매우 간결해진다.
