---
title: "커넥션 풀, DataSource"
description: "애플리케이션이 데이터베이스와 통신하려면 먼저 연결 통로인 커넥션(Connection)을 획득해야 한다. 하지만 사용자의 모든 요청에 대해 매번 새로운 커넥션을 생성하는 방식은 비효율적이며, 서비스 성능에 심각한 영향을 미칠 수…"
pubDate: 2025-09-22T21:11:10+09:00
category: "스프링/DB"
tags: ["커넥션 풀"]
---

애플리케이션이 데이터베이스와 통신하려면 먼저 연결 통로인 <strong>커넥션(Connection)</strong>을 획득해야 한다.

하지만 사용자의 모든 요청에 대해 매번 새로운 커넥션을 생성하는 방식은 비효율적이며, 서비스 성능에 심각한 영향을 미칠 수 있다.

이를 해결하기 위해 등장한 기술이 바로 **커넥션 풀**과 **DataSource**다.

---

## 커넥션 풀: 미리 만들어두고 재사용하는 커넥션들

데이터베이스 커넥션을 새로 만드는 과정은 생각보다 복잡하고 비용이 많이 든다.

```java
                      애플리케이션 로직
              (커넥션 요청) ↓     ↑ (커넥션 생성 후 반환)
                        DB 드라이버
(TCP/IP 연결, 인증 정보 전달) ↓     ↑ (세션 생성 완료 응답)
                         데이터베이스
                      (인증 후 세션 생성)
```

1. 애플리케이션이 DB 드라이버를 통해 커넥션을 요청한다.
2. DB 드라이버는 데이터베이스와 TCP/IP 네트워크 연결을 맺는다.
3. ID/PW 등 인증 정보를 전달하고, 데이터베이스 내부에서 인증 과정을 거친다.
4. 데이터베이스는 내부에 세션을 생성하고, 연결이 완료되었음을 응답한다.
5. DB 드라이버는 이 정보를 바탕으로 커넥션 객체를 생성하여 반환한다.

사용자 요청이 있을 때마다 위 과정을 반복하면 응답 속도가 느려질 수밖에 없다.

이 문제를 해결하기 위한 아이디어가 바로 커넥션 풀(Connection Pool)이다.

커넥션 풀은 이름 그대로 커넥션을 관리하는 풀(Pool)이다.

- 애플리케이션 시작 시점에, 필요한 만큼의 커넥션을 미리 생성해서 풀에 보관해 둔다.
- 애플리케이션 로직은 필요할 때마다 이 풀에서 이미 생성된 커넥션을 **빌려 쓰고**,
- 사용이 끝나면 커넥션을 닫는(close) 대신, **풀에 반납**(return)하여 재사용한다.

```java
// 1. 커넥션 풀 초기화
                      { 커넥션 풀 }
              (커넥션 요청) ↓   ↑ (커넥션 생성 후 반환)
                        DB 드라이버
(TCP/IP 연결, 인증 정보 전달) ↓   ↑ (세션 생성 완료 응답)
                        데이터베이스
                     (인증 후 세션 생성)

// 2. 커넥션 풀 사용
                     애플리케이션 로직
              (커넥션 대여) ↑   ↓ (커넥션 반납)
                      { 커넥션 풀 }
```

이 방식은 매번 커넥션을 새로 만드는 비용을 없애주어 애플리케이션 성능을 획기적으로 향상시키고,

서버가 감당할 수 있는 최대 커넥션 수를 제한하여 데이터베이스를 보호하는 효과도 있다.

실무에서는 **HikariCP**와 같은 검증된 오픈소스 커넥션 풀을 사용하는 것이 일반적이다. (스프링 부트도 이를 기본 커넥션 풀로 제공한다.)

---

## DataSource: 커넥션 획득 방법의 추상화

과거에는 **DriverManager**를 통해 직접 커넥션을 얻었지만, 지금은 HikariCP와 같은 커넥션 풀을 사용한다.

만약 DriverManager를 사용하던 코드에서 HikariCP를 사용하도록 변경하면,

기존의 커넥션을 얻는 코드 전체를 수정해야 하는 문제가 발생한다.

이러한 의존성 문제를 해결하기 위해 자바는 DataSource라는 표준 인터페이스를 제공한다.

DataSource는 **커넥션을 획득하는 방법을 추상화**하는 인터페이스다.

이 인터페이스의 핵심 기능은 <strong>getConnection()</strong>이라는 단 하나의 메서드다.

```java
// javax.sql.DataSource
public interface DataSource  extends CommonDataSource, Wrapper {

    Connection getConnection() throws SQLException;

    Connection getConnection(String username, String password) throws SQLException;

    ...
}
```

HikariCP와 같은 대부분의 커넥션 풀은 이미 DataSource 인터페이스를 구현해두었다. (예: HikariDataSource)

스프링은 DriverManager조차도 DataSource를 통해 사용할 수 있도록 **DriverManagerDataSource**라는 구현 클래스를 제공한다.

```java
애플리케이션 로직 (커넥션 요청)  →  DataSource (커넥션 반환)
                              /      \
               HikariDataSource      DriverManagerDataSource
```

이제 애플리케이션 로직은 DriverManager나 HikariDataSource 같은 구체적인 클래스에 의존하는 대신,

DataSource라는 표준 인터페이스에만 의존하면 된다.

이 덕분에 DriverManagerDataSource를 사용하다가 HikariDataSource로 커넥션 풀 기술을 변경하더라도,

DataSource 인터페이스를 사용하는 애플리케이션 로직은 **단 한 줄도 변경할 필요가 없다.**

또한 DataSource를 사용하면 다음과 같이 설정과 사용의 책임이 명확하게 분리되는 큰 장점이 있다.

- **설정**: DataSource 객체를 생성할 때, DB 접속 정보(URL, USERNAME, PASSWORD)나 커넥션 풀 속성(최대 풀 크기 등)을 한 곳에서 설정한다.
- **사용**: DataSource를 사용하는 코드(예: Repository)는 이러한 구체적인 설정 정보를 전혀 알 필요 없이, 그저 주입받은 DataSource의 getConnection() 메서드만 호출하면 된다.

이러한 설계는 향후 기술 변경이나 설정 수정 시 유지보수를 매우 용이하게 만든다.

---

## 실제 코드 예시

```java
@RequiredArgsConstructor
public class MemberRepositoryV1 {

    private final DataSource dataSource; // 외부에서 생성자로 주입받음

    ...

    // 커넥션 획득 (DataSource 사용)
    private Connection getConnection() throws SQLException {
        // DriverManager 대신 DataSource를 통해서 커넥션 획득
        return dataSource.getConnection();
    }

    // 역순으로 리소스 정리 (스프링의 JdbcUtils 사용)
    private void close(Connection connection, Statement statement, ResultSet resultSet) {
        JdbcUtils.closeResultSet(resultSet);
        JdbcUtils.closeStatement(statement);
        JdbcUtils.closeConnection(connection);
    }
}
```

---

## 테스트 코드 예시

```java
class MemberRepositoryV1Test {

    MemberRepositoryV1 memberRepository;

    @BeforeEach
    void beforeEach() {
        // 1. DriverManager 사용 (매번 새로운 커넥션을 획득)
        // conn0, conn1, conn2, ...
//        DriverManagerDataSource dataSource = new DriverManagerDataSource(URL, USERNAME, PASSWORD);

        // 2. 커넥션 풀 사용 (이미 만들어진 커넥션 재사용)
        // HikariProxyConnection@246826139 wrapping conn0, ...
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(URL);
        dataSource.setUsername(USERNAME);
        dataSource.setPassword(PASSWORD);

        // 의존관계 주입 (생성자 주입)
        memberRepository = new MemberRepositoryV1(dataSource);
    }

    @Test
    void crud() throws SQLException {
        // save
        Member member = new Member("memberV1", 10000);
        memberRepository.save(member);

        // findById
        Member foundMember = memberRepository.findById(member.getMemberId());
        assertThat(foundMember).isEqualTo(member);

        // update
        memberRepository.update(member.getMemberId(), 20000);
        Member updatedMember = memberRepository.findById(member.getMemberId());
        assertThat(updatedMember.getMoney()).isEqualTo(20000);

        // delete
        memberRepository.delete(member.getMemberId());
        assertThatThrownBy(() -> memberRepository.findById(member.getMemberId()))
                .isInstanceOf(NoSuchElementException.class);
    }
}
```
