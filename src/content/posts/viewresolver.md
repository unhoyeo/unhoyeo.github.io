---
title: "ViewResolver"
description: "Spring MVC에서 컨트롤러(핸들러)는 뷰 자체가 아니라 단순히 논리 뷰 이름을 반환한다. 하지만 뷰가 렌더링되려면 실제 물리 경로가 필요하다."
pubDate: 2025-04-27T12:38:59+09:00
category: "스프링/MVC"
tags: []
---

## ViewResolver란?

Spring MVC에서 컨트롤러(핸들러)는 뷰 자체가 아니라 단순히 <strong>논리 뷰 이름</strong>을 반환한다.

하지만 뷰가 렌더링되려면 실제 물리 경로가 필요하다.

ViewResolver는 논리 뷰 이름을 실제 렌더링 가능한 **물리 뷰 경로**로 변환하여 실제 뷰 객체를 생성하는 역할을 담당한다.

즉, 논리 뷰 이름을 받아서 실제 뷰 객체를 반환하는 것이 ViewResolver의 핵심 역할이다.

---

## 주요 ViewResolver 종류

스프링 부트는 다음과 같은 ViewResolver를 우선순위에 따라 등록한다.

|  |  |  |
| --- | --- | --- |
| **우선순위** | **ViewResolver** | **설명** |
| 1 | BeanNameViewResolver | 뷰 이름과 일치하는 스프링 빈을 탐색 |
| 2 | InternalResourceViewResolver | 뷰 이름에 prefix와 suffix를 붙여 JSP 경로 생성 |

DispatcherServlet은 등록된 ViewResolver들을 순차적으로 탐색하면서 논리 이름을 실제 뷰로 변환한다.

---

## InternalResourceViewResolver 주의 사항

InternalResourceViewResolver는 application.properties 파일의 다음 설정을 통해 JSP 경로를 생성한다.

```properties
spring.mvc.view.prefix=/WEB-INF/views/
spring.mvc.view.suffix=.jsp
```

따라서 위 설정이 누락되면 JSP 파일을 찾지 못해 Whitelabel Error Page가 발생한다.

---

## ViewResolver 동작 과정

```java
@Component("/springmvc/old-controller")
public class OldController implements Controller {
    @Override
    public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response)
            throws Exception {
        return new ModelAndView("new-form");
    }
}
```

1. HandlerAdapter가 OldController 실행 → ModelAndView("new-form") 반환
2. BeanNameViewResolver: "new-form"이라는 이름의 빈 없음 → 패스
3. InternalResourceViewResolver:
   - 실제 경로 /WEB-INF/views/new-form.jsp 생성 → InternalResourceView 객체 반환
4. InternalResourceView가 RequestDispatcher.forward() 방식으로 JSP 실행
5. JSP가 렌더링되어 최종 HTML 응답 전송

---

**InternalResourceView란?**

Spring MVC에서 JSP와 같은 서버 내부 리소스를 forward 방식으로 렌더링하기 위한 View 구현체다.

이전의 "[프론트 컨트롤러 패턴의 점진적 도입](/posts/프론트-컨트롤러-패턴의-점진적-도입/)"이라는 글에서 FrontControllerServletV5의 코드를 보자.

```
ModelView mv = adapter.handle(request, response, handler);

MyView view = viewResolver(mv.getViewName());
view.render(mv.getModel(), request, response);
```

위와 같이 뷰 리졸버가 MyView 객체를 반환하여, MyView.render()를 통해 뷰를 렌더링하는 것을 볼 수 있다.

```java
public void render(Map<String, Object> model,
                   HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {

    model.forEach(request::setAttribute);
    request.getRequestDispatcher(viewPath).forward(request, response);
}
```

이와 같이 JSP는 직접 렌더링을 수행할 수 없기 때문에, 서블릿 내에서 forward 방식을 사용하여 JSP를 실행해야 한다.

이때의 **MyView**가 스프링 MVC의 **InternalResourceView**라고 생각하면 된다.

---

## JSTL을 사용하는 경우: JstlView

InternalResourceViewResolver는 JSTL(JSP Standard Tag Library)을 사용할 수 있는 환경이라면, InternalResourceView 대신 이를 상속받은 JstlView를 반환한다.

JstlView는 InternalResourceView 기능에 더해 JSTL 태그와 국제화(i18n) 처리, 포맷팅 기능 등을 지원한다.

---

## Thymeleaf는 어떻게 렌더링되는가?

Thymeleaf는 JSP와 달리 forward()를 사용하지 않고, 자체적으로 렌더링이 가능한 템플릿 엔진이다.

단, Thymeleaf를 사용하기 위해서는 **ThymeleafViewResolver**를 따로 등록해야 한다.

(spring-boot-starter-thymeleaf 의존성을 추가하면 자동으로 등록됨)

## 렌더링 방식

1. ThymeleafViewResolver가 뷰 이름을 받아 템플릿 경로 생성 → ThymeleafView 생성
2. ThymeleafView.render()에서 템플릿 엔진이 직접 HTML 렌더링
3. 렌더링 결과를 response.getWriter()를 통해 클라이언트로 직접 출력

ThymeleafViewResolver는 다음 설정을 기반으로 템플릿 경로를 생성하여 템플릿 파일을 탐색한다. (스프링 부트 기본 설정)

```properties
spring.thymeleaf.prefix=classpath:/templates/
spring.thymeleaf.suffix=.html
```

## 장점

- forward 불필요, redirect와의 혼동 감소
- 서블릿에 종속되지 않고 다양한 환경에서도 동일하게 동작 (standalone, webflux 등)
- 템플릿 파일을 직접 해석하고 렌더링 → 구조 명확, 테스트 용이
- 조건 분기, 반복 등 논리 처리를 순수 HTML 템플릿 안에서 표현 가능

---

**Spring MVC 요청 처리 흐름 요약**

```
HTTP 요청
   ↓
DispatcherServlet
   ↓
HandlerMapping (요청 URI에 매핑된 핸들러 조회)
   ↓
HandlerAdapter (해당 핸들러를 실행 가능한 어댑터 조회)
   ↓
Handler (ModelAndView 반환)
   ↓
ViewResolver (논리 뷰 이름 → 물리 경로 변환 후 뷰 객체 반환)
   ↓
View.render() (forward 방식으로 JSP 실행)
   ↓
HTML 응답 반환
```

---

**정리**

- ViewResolver는 컨트롤러가 반환한 논리 뷰 이름을 실제 물리 뷰로 반환하는 핵심 구성 요소이다.
- 특히, InternalResourceViewResolver는 JSP를 forward 방식으로 실행함으로써, 서블릿 기반 아키텍처와의 호환을 보장한다.
- 실무에서는 뷰 렌더링 전략(JSP vs Thymeleaf 등)에 따라 ViewResolver를 명확히 이해하고 설정하는 것이 필수이다.
