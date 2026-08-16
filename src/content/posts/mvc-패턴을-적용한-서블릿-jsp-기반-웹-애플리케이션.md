---
title: "MVC 패턴을 적용한 서블릿 + JSP 기반 웹 애플리케이션"
description: "웹 애플리케이션의 구조를 명확하게 분리하기 위해 MVC 패턴(Model-View-Controller)을 적용해 보자. Controller → 서블릿 클라이언트의 요청을 받아서 처리하고, View로 제어를 전달하는 역할 View →…"
pubDate: 2025-04-18T16:37:53+09:00
category: "스프링/MVC"
tags: []
---

웹 애플리케이션의 구조를 명확하게 분리하기 위해 **MVC 패턴(Model-View-Controller)**을 적용해 보자.

- Controller → **서블릿**
  - 클라이언트의 요청을 받아서 처리하고, View로 제어를 전달하는 역할
- View → **JSP**
  - 단순히 데이터를 받아서 화면을 그리는 역할만 수행
  - 화면에 필요한 데이터는 컨트롤러가 준비하고 JSP는 순수하게 출력만 담당
- Model → **HttpServletRequest**
  - HttpServletRequest는 내부에 **데이터 저장소(속성 맵)**를 가지고 있다.
  - **request.setAttribute(key, value)**를 통해 데이터를 저장하고,
  - **request.getAttribute(key)**를 통해 데이터를 조회할 수 있다.
  - 이 방식을 사용하면 컨트롤러에서 만든 데이터를 JSP로 전달할 수 있다.
  - 단, 해당 데이터는 **요청 범위(request scope)** 내에서만 유효하다. (다른 요청에서 사용 불가)
  - 따라서 일회성 데이터 전달에 적합하다.

---

## ⚠️ Model – HttpServletRequest 단점

- request 객체는 **단순히 값만 전달**할 뿐, **도메인 모델을 직접 표현하지 못한다.**
- 실무에서 DTO, Form, ViewModel 등을 별도로 사용하는 이유가 여기에 있다.

---

## 회원 등록 폼 컨트롤러 – MemberFormServlet

```scala
@WebServlet(name = "memberFormServlet", urlPatterns = "/members/new-form")
public class MemberFormServlet extends HttpServlet {

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String viewPath = "/WEB-INF/views/new-form.jsp";
        RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
        dispatcher.forward(request, response);
    }
}
```

---

## RequestDispatcher.forward()

- **"클라이언트에게 보이지 않도록" 서버 내부에서 요청을 전달하는 기능**
- HTTP 요청/응답 객체가 **그대로 유지**되어 전달된다. (새로운 요청이 발생하지 않음)
- 따라서 request.setAttribute()의 값을 **다른 서블릿이나 JSP에서 접근**할 수 있다.

---

## /WEB-INF

- JSP를 /WEB-INF에 위치시키면 오직 **forward를 통해서만** 접근할 수 있다.
- 따라서 **외부(브라우저)에서 JSP에 직접 접근하는 것을 차단**할 수 있다.
- 즉, **"컨트롤러를 통해서만 JSP를 호출하기 위해서"**

---

## redirect vs forward 차이

|  |  |  |
| --- | --- | --- |
| **구분** | **redirect** | **forward** |
| 동작 방식 | 클라이언트에 응답 후, **새로운 요청 발생** | 서버 내부에서 **요청을 그대로 전달** |
| 요청 횟수 | **2번** | **1번** |
| URL | ? 새 요청이므로 변경됨 | 유지 |
| 요청/응답 객체 | ? 새 요청이므로 변경됨 | 유지 |
| 데이터 전달 방식 | 쿼리 파라미터, 세션 | request.setAttribute() |
| 예시 | PRG(Post-Redirect-Get) 패턴 | View 렌더링 |

> PRG 패턴에 대해서는 ? [여기](https://uh1205.tistory.com/81)

---

## 회원 등록 폼 – /WEB-INF/views/new-form.jsp

```xml
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
  <head>
    <meta charset="UTF-8">
    <title>회원 등록</title>
  </head>
  <body>
    <form action="save" method="post">
      이름: <input name="name" type="text"/>
      나이: <input name="age" type="text"/>
      <button type="submit">등록</button>
    </form>
  </body>
</html>
```

---

## 상대 경로

- action="save"에서 **save**는 상대 경로다.
- HTML에서 상대 경로는 **현재 페이지 URL의 디렉토리 경로 기준**으로 붙는다.
- 즉, 현재 URL에서 **마지막 경로를 잘라내고**, 그걸 디렉토리로 간주하여 상대 경로를 붙인다.
- 예를 들어 현재 URL이 **/members/new-form**이라면 **/members/save**로 요청이 전송된다.

## 사용 이유

- JSP나 **여러 URL 경로가 나뉘는 구조**에서 각 컨트롤러 URL 밑에 **일관된 하위 경로**를 연결하기 위해서
- 테스트 환경, 배포 환경에서 context path가 바뀌더라도 상대 경로를 사용하면 문제가 발생하지 않음
- 다만, URL이 바뀔 수 있는 SPA 구조나 리다이렉션이 많은 경우에는 **절대 경로(/save)**를 쓰는 것이 유지보수에 유리할 수 있다.

---

## 회원 등록 컨트롤러 – MemberSaveServlet

```java
@WebServlet(name = "memberSaveServlet", urlPatterns = "/members/save")
public class MemberSaveServlet extends HttpServlet {

    private MemberRepository memberRepository = MemberRepository.getInstance();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String username = request.getParameter("username");
        int age = Integer.parseInt(request.getParameter("age"));

        Member member = new Member(username, age);
        memberRepository.save(member);

        request.setAttribute("member", member);

        String viewPath = "/WEB-INF/views/save-result.jsp";
        request.getRequestDispatcher(viewPath).forward(request, response);
    }
}
```

---

## 회원 등록 결과 페이지 – /WEB-INF/views/save-result.jsp

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %><html>
<head>
  <meta charset="UTF-8">
  <title>회원 저장 결과</title>
</head>
<body>
  저장 성공
  <ul>
    <li>id: ${member.id}</li>
    <li>username: ${member.username}</li>
    <li>age: ${member.age}</li>
  </ul>
  <a href="/index.html">메인</a>
</body>
</html>
```

---

## JSP 데이터 출력 방식 비교

## 1️⃣ 스크립틀릿

```gcode
<%= request.getAttribute("member") %>
```

- ❌ HTML과 Java가 뒤섞여 유지보수에 부적합

## 2️⃣ EL (Expression Language)

```
${member}
```

- ✅ JSP 내부의 표현식 처리
- ✅ request.getAttribute("member")와 동일한 효과
- ✅ JSTL과 함께 사용하면 더 강력

---

## 회원 목록 컨트롤러 – MemberListServlet

```scala
@WebServlet(name = "memberListServlet", urlPatterns = "/members")
public class MemberListServlet extends HttpServlet {

    private MemberRepository memberRepository = MemberRepository.getInstance();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        List<Member> members = memberRepository.findAll();
        request.setAttribute("members", members);

        String viewPath = "/WEB-INF/views/members.jsp";
        request.getRequestDispatcher(viewPath).forward(request, response);
    }
}
```

---

## 회원 목록 페이지 – /WEB-INF/views/members.jsp

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<html>
  <head>
    <meta charset="UTF-8">
    <title>회원 목록</title>
  </head>
  <body>
    <table border="1">
      <thead>
        <th>id</th>
        <th>username</th>
        <th>age</th>
      </thead>
      <tbody>
        <c:forEach var="member" items="${members}">
          <tr>
            <td>${member.id}</td>
            <td>${member.username}</td>
            <td>${member.age}</td>
          </tr>
        </c:forEach>
      </tbody>
    </table>
    <a href="/members/new-form">회원 등록</a>
  </body>
</html>
```

- 컬렉션 반복 출력을 위해서 JSTL의 **&lt;c:forEach>** 사용
- JSTL은 JSP 개발의 필수 도구로, 가독성과 유지보수성을 높여줌

---

## 서블릿 + JSP 기반 MVC의 한계

1️⃣ **중복된 포워드 코드**

```vbscript
request.getRequestDispatcher(viewPath).forward(request, response);
```

- **모든 컨트롤러**에서 반복됨
- View 경로도 **하드코딩**됨 (/WEB-INF/views/xxx.jsp) → **뷰 템플릿** 변경 시 유지보수 어려움

2️⃣ **불필요한 request/response**

```vbscript
public void service(HttpServletRequest request, HttpServletResponse response)
```

- **모든 컨트롤러**에 강제 포함 (서블릿 의존적)
- **테스트 어려움** (유닛 테스트 불가) → 추상화 부족

3️⃣ **공통 처리 중복**

- **파라미터 추출, 인코딩 설정, 로깅, 예외 처리** 등이 각 컨트롤러에 **중복**됨
- 공통 메서드로 재사용할 수 있으나, 여전히 중복 호출됨
- 프로젝트 규모가 커지고, 기능이 복잡해질수록 **실수**할 가능성 높음

---

## 해결 방안: Front Controller 패턴

모든 요청을 **하나의 진입점**(서블릿)에서 받아 **공통 로직을 처리**하고, 이후 **개별 컨트롤러에 위임**하는 구조

## ✅ 장점

- 중복 제거
- 코드 일관성 확보
- 공통 기능 중앙 집중화
- 추후 **인터페이스 기반 설계**, **애노테이션 기반 매핑** 등 고도화가 쉬움

> Spring MVC의 핵심 구성 요소인 **DispatcherServlet**이 이 역할을 수행함

---

## 요약

- **서블릿 + JSP** 조합만으로도 MVC 패턴을 구현할 수 있지만, 다음과 같은 문제점이 존재한다.
  - **불필요한 request/response 객체 강제 포함**
  - **viewPath 중복 및 하드코딩**
  - **포워드 코드 중복**
  - 이외에도 파라미터 추출, 인코딩 설정, 로깅, 예외 처리 등 중복
- 이러한 코드 반복과 낮은 추상화 수준은 유지보수를 어렵게 만든다.
- **Front Controller 패턴**을 적용하면 **공통 로직을 한 곳에서 처리**할 수 있어, 기존 MVC 패턴의 단점을 보완할 수 있다.
