---
title: "순수 JSP 기반 웹 애플리케이션"
description: "기존의 순수 서블릿 기반 웹 애플리케이션을 JSP(JavaServer Pages) 기반으로 전환해보자. contentType: JSP가 생성하는 응답의 MIME 타입을 설정한다."
pubDate: 2025-04-16T22:40:03+09:00
category: "스프링/MVC"
tags: []
---

기존의 순수 서블릿 기반 웹 애플리케이션을 **JSP(JavaServer Pages)** 기반으로 전환해보자.

---

## 회원 등록 폼 – new-form.jsp

```html
<%@ page contentType="text/html;charset=UTF-8" %>
<html>
  <body>
    <form action="/jsp/members/save.jsp" method="post">
      이름: <input name="username" type="text"/>
      나이: <input name="age" type="text"/>
      <button type="submit">등록</button>
    </form>
  </body>
</html>
```

- contentType: JSP가 생성하는 응답의 MIME 타입을 설정한다.
- form: /jsp/members/save.jsp로 POST 요청을 보낸다. 이는 회원 정보를 저장하는 페이지이다.

---

## 회원 저장 처리 – save.jsp

```java
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="hello.servlet.domain.member.Member" %>
<%@ page import="hello.servlet.domain.member.MemberRepository" %>
<%
    MemberRepository memberRepository = MemberRepository.getInstance();

    String username = request.getParameter("username");
    int age = Integer.parseInt(request.getParameter("age"));

    Member member = new Member(username, age);
    memberRepository.save(member);
%>
<html>
  <body>
    회원 등록 성공
    <ul>
      <li>id=<%=member.getId()%></li>
      <li>username=<%=member.getUsername()%></li>
      <li>age=<%=member.getAge()%></li>
    </ul>
    <a href="/index.html">메인</a>
  </body>
</html>
```

- JSP는 내부적으로 **서블릿으로 변환**되므로, 서블릿과 동일하게 request, response 객체 사용이 가능하다.
- <% ... %>: 자바 로직을 포함하는 JSP 스크립틀릿
- <%= ... %>: 자바 표현식으로, HTML에 출력되는 값
- 실무에서는 JSTL 또는 커스텀 태그를 사용해 Java 코드를 최소화하고, EL(Expression Language)를 활용하는 것이 권장된다.

> ⚠️ JSP 내부에서 리포지토리에 직접 접근하는 구조는 MVC 패턴에 어긋나는 안티 패턴이다.

---

## 회원 목록 출력 – members.jsp

```html
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="java.util.List" %>
<%@ page import="hello.servlet.domain.member.Member" %>
<%@ page import="hello.servlet.domain.member.MemberRepository" %>
<%
    MemberRepository memberRepository = MemberRepository.getInstance();
    List<Member> members = memberRepository.findAll();
%>
<html>
  <body>
    <b>회원 목록</b>
    <table>
      <thead>
        <th>id</th>
        <th>username</th>
        <th>age</th>
      </thead>
      <tbody>
        <%
            for (Member member : members) {
                out.write("<tr>");
                out.write("<td>" + member.getId() + "</td>");
                out.write("<td>" + member.getUsername() + "</td>");
                out.write("<td>" + member.getAge() + "</td>");
                out.write("</tr>");
            }
        %>
      </tbody>
    </table>
  </body>
</html>
```

- out.write()를 사용하는 방식은 가독성이 떨어지며, HTML과 Java 코드가 얽혀 유지보수가 어렵다.
- JSTL &lt;c:forEach>와 EL 표현식 ${}를 사용하는 구조로 전환하는 것이 유지보수성과 확장성 측면에서 권장된다.

---

## 서블릿과 JSP가 가지는 구조적 한계

|  |  |  |
| --- | --- | --- |
| **항목** | **서블릿 기반** | **JSP 기반** |
| 코드 복잡도 | 자바 코드 내 HTML 생성 → 매우 높음 | HTML 내 자바 코드 삽입 → 덜 복잡하지만 여전히 혼재 |
| 역할 분리 | 비즈니스 로직과 뷰가 한 클래스에 존재 | 비즈니스 로직과 뷰가 하나의 파일에 존재 |
| 유지보수 | UI 수정 시 Java 로직 속에서 HTML을 찾아야 함 | 비즈니스 로직 수정 시 HTML 속에서 Java 로직을 파악해야 함 |

→ 하나의 서블릿이나 JSP가 **너무 많은 책임**을 가지게 되어 가독성, 유지보수, 디버깅, 테스트, 협업이 어렵다.

---

## 변경의 라이프 사이클 불일치 문제

UI 수정과 비즈니스 로직 수정은 서로 다른 시점, 다른 목적으로 발생한다.

- **UI 수정**: 디자이너 혹은 프론트엔드 개발자에 의해 자주 발생
- **비즈니스 로직 수정**: 백엔드 개발자의 주도 하에 변경됨

하지만 서블릿이나 JSP 기반 구조에서는 이 둘이 **물리적으로 분리되지 않아**, 서로의 수정이 영향을 주게 된다.

> 예: 단순한 UI 글자 수정을 위해서 Java 로직까지 열어야 하는 상황이 발생

---

## 기능 특화와 역할 분리의 필요성

- **JSP**: 뷰(View) 렌더링에 최적화되어 있음 → 오직 화면 그리기에만 집중해야 함
- **비즈니스 로직**: 컨트롤러 또는 서비스 계층에서 수행해야 함
- **데이터 접근**: Repository 계층에서 전담

---

## MVC 패턴의 도입

MVC(Model-View-Controller) 패턴은 웹 애플리케이션 구조를 역할에 따라 분리하는 아키텍처 패턴이다.

|  |  |
| --- | --- |
| **계층** | **책임** |
| Controller | HTTP 요청 처리, 파라미터 검증, Service 호출, 결과를 Model에 담아 View로 전달 |
| Service | 비즈니스 로직 수행 |
| Repository | DB 또는 저장소에 접근 |
| Model | View에 전달할 데이터 보관 객체 |
| View | 화면 렌더링 (JSP, Thymeleaf 등) |

**추가 계층**

- **DTO (Data Transfer Object)**: Controller ↔ Service 계층 간 데이터 전달에 활용
- **Form 객체**: 입력 검증을 위한 구조화된 요청 바인딩 객체

---

## 구조적 흐름 예시

```
 [Client]
    ↓
[Controller] → [Service] → [Repository]
    ↓
  [Model]
    ↓
  [View]
```

---

## 결론

- MVC 패턴은 <strong>관심사의 분리(SoC, Separation of Concerns)</strong>를 실현하며,
  - 가독성
  - 유지보수성
  - 확장성
  - 협업 효율성
  - 테스트 용이성 등을 크게 향상시킨다.
- **변경 주기가 다른 코드**(UI와 비즈니스 로직)는 완전히 분리해서 유지보수성을 확보하자!
