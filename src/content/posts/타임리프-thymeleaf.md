---
title: "타임리프(Thymeleaf)"
description: "타임리프는 서버 측에서 데이터를 받아 HTML을 동적으로 만들어 클라이언트로 전송하는 템플릿 엔진이다. 주로 Spring MVC에서 뷰(View)를 생성할 때 사용되며, 기존의 JSP를 대체하거나 보완하는 용도로 많이 활용된다."
pubDate: 2025-08-07T21:45:33+09:00
category: "스프링/MVC"
tags: ["타임리프", "빈"]
---

타임리프는 서버 측에서 데이터를 받아 HTML을 동적으로 만들어 클라이언트로 전송하는 템플릿 엔진이다.

주로 Spring MVC에서 뷰(View)를 생성할 때 사용되며, 기존의 JSP를 대체하거나 보완하는 용도로 많이 활용된다.

> 타임리프의 기본 문법은 [다음](/posts/타임리프의-기본-문법/) 글을 참고하자.

---

## 타임리프의 핵심 특징

- **서버 사이드 HTML 렌더링 (SSR: Server-Side Rendering)**
  - 타임리프는 서버에서 HTML을 동적으로 생성하고, 클라이언트(브라우저)에게 완성된 HTML을 응답하는 방식으로 동작함
  - 컨트롤러에서 전달한 모델 데이터를 기반으로 템플릿 파일 내의 변수를 치환하여 최종 HTML 생성
- **내추럴 템플릿(Natural Templates)**
  - 순수 HTML 구조를 유지하면서 템플릿 역할까지 수행하는 방식
  - 타임리프 파일은 순수한 HTML 마크업 구조를 그대로 유지함
  - 따라서 **서버 실행 없이도** 웹 브라우저에서 기본 모습을 볼 수 있음
- **스프링 통합 지원**
  - 타임리프는 스프링 프레임워크, 특히 Spring MVC와 강하게 통합됨
  - Model, @ModelAttribute, BindingResult, 국제화 메시지(MessageSource), 유효성 검증 등의 기능과 자연스럽게 연결됨
  - Spring Boot에서는 spring-boot-starter-thymeleaf 의존성 하나로 바로 사용 가능하며, 추가 설정이 거의 불필요함

---

## 왜 타임리프를 사용할까?

- **JSP의 단점 보완**
  - JSP는 템플릿 재사용성이 떨어지고, HTML 렌더링 전에는 JSP 태그로 인해 깨진다.
  - 타임리프는 th:\* 속성 기반으로 HTML 문서를 깨지 않으며, 프래그먼트로 재사용도 가능하다. (th:replace, th:include)
- **개발-디자인 협업 용이**
  - HTML 문서를 유지하기 때문에, 디자이너도 소스 코드를 수정할 수 있다.
  - th:block, th:fragment, layout 등을 통해 레이아웃 템플릿을 구성할 수 있다.

- **유지보수 및 확장성**
  - 템플릿 내에서 표현식, 유효성 검증 메시지, 국제화(i18n), 날짜 포맷 등 모두 설정할 수 있다.

---

## 타임리프의 기본 표현식

[Tutorial: Using Thymeleaf](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#standard-expression-syntax)

> 자세한 내용은 공식 문서를 확인하자.

- 간단한 표현식
  - 변수 표현식: ${...}
  - 선택 변수 표현식: \*{...}
  - 메시지 표현식: #{...}
  - 링크 URL 표현식: @{...}
  - 프래그먼트 표현식: ~{...}
- 리터럴
  - 텍스트 리터럴: 'one text', 'Another one!' 등
  - 숫자 리터럴: 0, 34, 3.0, 12.3 등
  - 불리언 리터럴: true, false
  - null 리터럴: null
  - 리터럴 토큰: one, sometext, main 등
- 텍스트 연산
  - 문자열 연결: +
  - 리터럴 치환: |The name is ${name}|
- 산술 연산
  - 이항 연산자: +, -, \*, /, %
  - 단항 연산자 (음수 부호): -
- 불리언 연산
  - 이항 연산자: and, or
  - 단항 연산자 (부정): !, not
- 비교 및 동등성
  - 비교 연산자: >, <, >=, <= (또는 gt, lt, ge, le)
  - 동등성 연산자: ==, != (또는 eq, ne)
- 조건 연산자
  - if-then: (조건) ? (참일 때)
  - if-then-else: (조건) ? (참일 때) : (거짓일 때)
  - 기본값 연산자: (값) ?: (기본값)
- 특수 토큰
  - No-Operation (아무 작업도 하지 않음): \_

예시:

```java
'User is of type ' + (${user.isAdmin()} ? 'Administrator' : (${user.type} ?: 'Unknown'))
```

- 사용자 타입이 관리자면 'Administrator'
- 아니고 user.type이 있으면 해당 값
- 그마저도 없으면 'Unknown'

---

## 타임리프가 제공하는 기본 객체 (Spring Boot 3.x 기준)

아래 객체들은 ${#...} 형식으로 사용하며, 타임리프에서 <strong>표현식 유틸리티 객체(Utility Objects)</strong>로 기본 제공된다.

|  |  |  |
| --- | --- | --- |
| **객체** | **설명** | **사용 예** |
| #dates | 날짜와 시간 포맷 관련 도우미 | ${#dates.format(today, 'yyyy-MM-dd')} |
| #calendars | 날짜 계산 및 조작 (Java Calendar 기반) | ${#calendars.day(today)} |
| #numbers | 숫자 포맷 처리 | ${#numbers.formatInteger(1000, 3)} |
| #strings | 문자열 유틸리티 | ${#strings.substring(name, 0, 2)} |
| #objects | null 체크 등 공통 Object 유틸리티 | ${#objects.nullSafe(user.name)} |
| #bools | Boolean 처리 유틸리티 | ${#bools.isTrue(flag)} |
| #arrays | 배열 유틸리티 | ${#arrays.length(arr)} |
| #lists | 리스트 유틸리티 | ${#lists.size(users)} |
| #sets | Set 유틸리티 | ${#sets.contains(set, value)} |
| #maps | Map 유틸리티 | ${#maps.containsKey(map, 'key')} |
| #temporals | java.time 기반 날짜/시간 유틸리티 | ${#temporals.format(localDateTime, 'yyyy-MM-dd')} |

> 특히 #temporals는 Java 8 이후의 LocalDate, LocalDateTime 등 java.time API를 처리하는 데 권장된다.

---

## Spring Boot 3.0부터 제거된 객체들

|  |  |
| --- | --- |
| **객체** | **설명** |
| #request | HttpServletRequest 접근 |
| #response | HttpServletResponse 접근 |
| #session | HttpSession 접근 |
| #servletContext | ServletContext 접근 |

Spring Boot 2.x까지는 Servlet API와 강하게 연동되어 있었지만,

3.0부터는 서블릿 의존성을 줄이고, 순수 서버사이드 템플릿으로써의 역할을 강화하는 방향으로 바뀌었다.

해당 값이 필요하면 Controller에서 직접 값을 Model에 담아 전달하거나,

```java
@GetMapping("/example")
public String example(HttpSession session, Model model) {
    String userId = (String) session.getAttribute("userId");
    model.addAttribute("userId", userId);
    return "example";
}
```

Spring MVC의 **@SessionAttribute, @ModelAttribute** 등을 활용해야 한다.

```kotlin
@GetMapping("/mypage")
public String mypage(@SessionAttribute("loginUser") User user, Model model) {
    model.addAttribute("user", user);
    return "mypage";
}
```

---

## 스프링 빈 접근

스프링 컨테이너에 등록된 스프링 빈 객체에 직접 접근할 때는 **@** 기호를 사용한다.

이를 통해 서비스나 컴포넌트 등의 빈을 템플릿에서 참조할 수 있다.

예를 들어, 다음과 같은 스프링 빈이 있다고 가정했을 때,

```java
@Component("helloBean")
class HelloBean {
    public String hello(String data) {
        return "Hello " + data;
    }
}
```

타임리프 파일에서 해당 빈에 접근하려면 **${@빈이름}** 방식을 사용하면 된다.

```html
<span th:text="${@helloBean.hello('Spring!')}">
```
