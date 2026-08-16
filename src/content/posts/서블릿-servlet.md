---
title: "서블릿(Servlet)"
description: "? 서블릿이란? 서블릿은 Java 기반의 웹 요청-응답 처리를 위한 WAS(Web Application Server)의 핵심 구성 요소다."
pubDate: 2025-04-14T21:02:03+09:00
category: "스프링/MVC"
tags: ["서블릿", "WAS"]
---

**서블릿이란?**

서블릿은 Java 기반의 **웹 요청-응답 처리**를 위한 WAS(Web Application Server)의 핵심 구성 요소다.

웹 브라우저가 HTTP 요청을 전송하면, WAS는 해당 요청을 적절한 서블릿에 위임하고,

서블릿은 그 요청을 처리한 뒤 응답을 생성하여 브라우저에 반환한다.

정리하면 서블릿은 자바 코드로 작성된 HTTP 요청 핸들러이며, HTTP 메시지를 기반으로 비즈니스 로직을 수행하고,

결과를 다시 HTTP 메시지로 구성하여 클라이언트에 반환한다.

> Servlet = Server + Applet
> (Applet = Applicaiton + -let, 작은 크기의 애플리케이션)

---

**서블릿 등장 배경: HTTP 직접 처리의 복잡성**

서블릿 이전에는 자바 개발자가 HTTP 요청을 처리하기 위해 다음과 같은 **로우레벨 작업**을 직접 수행해야 했다.

- 소켓 수동 열기
- 요청 바이트 파싱
- HTTP 헤더/바디 직접 분리
- Content-Type 기반 본문 파싱
- 응답 메시지 수동 생성 및 전송
- 자원 해제

이는 코드의 대부분이 HTTP 프로토콜 처리에 집중되면서, 비즈니스 로직 구현이 사실상 부차적인 작업이 되는 문제가 발생했다.

→ 서블릿은 이러한 **복잡한 작업을 추상화**하고, 개발자가 HTTP를 객체 기반으로 다룰 수 있도록 지원한다.

---

**서블릿 클래스 구조**

서블릿은 일반적으로 **HttpServlet** 클래스를 상속하여 구현하며, 서블릿 컨테이너가 이 객체의 생명주기 전반을 관리한다.

```java
@WebServlet(name = "userServlet", urlPatterns = "/users")
public class UserServlet extends HttpServlet {
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String username = request.getParameter("username");
        response.setContentType("text/plain");
        response.getWriter().write("User: " + username);
    }
}
```

- **@WebServlet**: 이 클래스가 서블릿임을 선언
  - urlPatterns: 이 서블릿이 매핑될 URI 설정
- **service()**: 모든 요청의 진입점, 내부에서 HTTP 메서드(GET, POST 등) 분기
  - doGet(), doPost() 등: 메서드별 요청 처리 메서드

> 실무에서는 service()를 오버라이드하는 경우는 드물며, 주로 doGet(), doPost()를 사용한다.

---

**서블릿 동작 원리**

1. **서블릿 컨테이너가 서블릿 객체 생성**
   - 컨테이너 초기화 시 서블릿 클래스 로딩 및 인스턴스화
   - @WebServlet에 의해 등록됨
   - 싱글톤으로 관리
   - HTTP 요청 URL과 서블릿 매핑 테이블을 통해 적절한 서블릿 결정
2. **HTTP 요청 수신, URL 매핑 확인**
   - HTTP 요청 URL과 서블릿 매핑 테이블을 통해 적절한 서블릿 결정
3. **HttpServletRequest, HttpServletResponse 객체 생성**
   - 요청 메시지를 기반으로 HttpServletRequest 객체 생성
   - 응답 생성용 HttpServletResponse 객체 준비
4. **service() 호출**
   - 컨테이너가 서블릿의 service() 메서드를 호출
   - 내부적으로 요청 메서드에 따라 doGet(), doPost()로 분기
5. **응답 처리**
   - HttpServletResponse 객체에 상태 코드, 헤더, 바디 설정
   - 컨테이너가 응답 메시지를 바이트로 직렬화하여 TCP 소켓으로 전송

> 스프링 부트 사용 시 SpringApplication.run() 내부에서 내장 톰캣 서버(WAS)가 생성되고 실행된다.

---

**서블릿 생명주기**

1. 로딩: WAS 시작 시 서블릿 클래스 로딩
2. 인스턴스화: 싱글톤으로 서블릿 객체 생성
3. 초기화(init()): 최초 요청 이전에 단 1회 호출 (리소스 준비 등)
4. 요청 처리(service()): 요청마다 호출됨, 내부적으로 doGet(), doPost() 분기
5. 종료(destroy()): 서블릿 컨테이너 종료 시 리소스 정리

> init()과 destroy()는 서블릿 생명주기 관리 포인트로, 외부 자원(DB 연결 등)을 효율적으로 처리하기 위해 사용된다.

---

**서블릿 컨테이너란?**

서블릿 컨테이너는 서블릿을 실행하는 HTTP 요청-응답 관리 모듈이며, 일반적으로 WAS(Tomcat, Jetty 등)의 일부로 동작한다.

## 주요 역할

- 서블릿 클래스 로딩, 인스턴스화
- 서블릿 객체 생명주기 관리 (싱글톤으로 관리)
- 요청 URL-서블릿 매핑
- HttpServletRequest, HttpServletResponse 객체 생성
- 멀티쓰레드 처리 (쓰레드 풀을 통해 요청마다 쓰레드 할당)
- 필터, 리스너 등 요청 흐름 관리
- JSP → 서블릿 변환 및 실행

> 톰캣은 대표적인 서블릿 컨테이너이자 WAS로, 스프링 부트는 내장 톰캣을 사용한다.

---

**서블릿과 JSP의 관계**

- JSP는 서버 측 템플릿 문법
- 최초 요청 시 JSP는 **서블릿(Java 코드)으로 변환**됨
- 이후 일반 서블릿처럼 실행되며, 뷰 처리에 집중

> JSP의 본질은 HTML로 감싼 서블릿이다.

---

멀티쓰레드 환경과 싱글톤 주의점

서블릿 컨테이너는 동시 요청을 처리하기 위해 하나의 서블릿 객체에 여러 쓰레드를 동시에 할당한다.

하지만 서블릿은 싱글톤으로 관리되기 때문에 모든 쓰레드는 **같은 인스턴스를 공유**한다.

## 이로 인해 발생하는 문제

```java
public class UnsafeServlet extends HttpServlet {
    private String username; // 모든 쓰레드가 공유

    protected void doPost(HttpServletRequest req, HttpServletResponse res) {
        username = req.getParameter("username"); // 동시 접근 → 데이터 충돌
    }
}
```

## 해결 방법

- 상태를 유지하지 않도록 설계 (Stateless)
- 공유 자원 사용 시 **synchronized** 또는 ThreadLocal 활용
- **지역 변수**만 사용

> 스프링에서도 스프링 빈이 싱글톤이므로 동일한 주의 필요

---

**쓰레드와 쓰레드 풀**

WAS에서 실제로 서블릿 객체를 실행하는 것은 **쓰레드**이다.

## 쓰레드란?

- 프로세스 내부에서 실제 작업을 수행하는 단위
- 쓰레드가 애플리케이션 코드를 한 줄씩 순차적으로 실행함
- 동시 처리 필요 시 쓰레드를 추가로 생성해야 함

## 웹 서버에서의 쓰레드 모델

- **단일 요청 - 단일 쓰레드**: 들어온 요청에 쓰레드를 할당하여 서블릿을 실행
- **다중 요청 - 단일 쓰레드**: 이전 요청을 처리 중인 쓰레드를 기다려야 하므로 처리 지연
- **다중 요청 - 다중 쓰레드**: 들어온 요청마다 새로운 쓰레드를 생성하여 요청을 병렬 처리

## 다중 요청 - 다중 쓰레드의 문제점

- **쓰레드 생성 비용**: 쓰레드 생성 시 JVM과 OS의 자원을 사용하기 때문에 비용이 높음
- **컨텍스트 스위칭 비용**: 쓰레드는 CPU를 공유하므로 전환마다 레지스터 저장/복원 작업 발생
- **무한 쓰레드 생성 가능성**: 동시 요청 폭주 시 쓰레드 수가 폭증하여 CPU/메모리 임계점 초과, 서버 장애 발생

## 해결책: 쓰레드 풀(Thread Pool)

- 일정 개수의 쓰레드를 미리 생성하여 재사용
- Java에서는 ExecutorService, ThreadPoolExecutor 사용

---

**WAS의 쓰레드 풀 처리**

서블릿 컨테이너는 요청마다 새로운 쓰레드를 생성하지 않고 <strong>쓰레드 풀(Thread Pool)</strong>을 사용한다.

## 동작 원리

1. 요청 도착
2. 쓰레드 풀에서 유휴 쓰레드 할당 (유휴 쓰레드 없는 경우 대기 큐에서 대기하거나, 요청 거절)
3. 쓰레드가 서블릿을 호출
4. 응답 처리 완료 후 쓰레드 반납

## 장점

- 쓰레드 생성/삭제 비용 감소 → 응답 속도 향상
- 최대 쓰레드 수 제어 가능 → 서버 과부하 방지

## 실무 팁

- 최대 쓰레드 수는 성능 테스트를 통해 CPU, 메모리, IO 부하 고려하여 튜닝
- 과도한 설정은 메모리 폭증 → GC 지연 → 서버 장애

---

**서블릿의 한계**

- HTML 직접 출력
- 파라미터 바인딩, 검증, 뷰 렌더링 수작업 필요
- 생산성이 낮고, 유지보수가 어려움

> 그래서 **Spring MVC**가 등장!
> Spring MVC도 서블릿 위에서 동작하지만, 핸들러 매핑, 애노테이션 기반 바인딩, 모델 관리, 예외 처리 등 복잡한 작업을 추상화

---

**정리**

- 서블릿은 자바 웹 개발의 핵심이며, HTTP 요청-응답 처리의 기본 단위
- HttpServletRequest와 HttpServletResponse를 통해 요청/응답 추상화
- 서블릿 컨테이너가 서블릿의 생명주기와 멀티쓰레드 처리를 담당
- 따라서 개발자는 비즈니스 로직 구현에 집중 가능
