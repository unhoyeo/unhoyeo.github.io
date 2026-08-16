---
title: "HandlerMapping, HandlerAdapter"
description: "스프링 MVC는 다양한 형태의 컨트롤러(핸들러)를 하나의 일관된 구조 내에서 처리할 수 있도록 설계되어 있다. 이 유연함의 핵심은 바로 HandlerMapping과 HandlerAdapter 두 인터페이스 컴포넌트에 있다."
pubDate: 2025-04-26T22:05:14+09:00
category: "스프링/MVC"
tags: []
---

스프링 MVC는 다양한 형태의 컨트롤러(핸들러)를 하나의 일관된 구조 내에서 처리할 수 있도록 설계되어 있다.

이 유연함의 핵심은 바로 HandlerMapping과 HandlerAdapter 두 인터페이스 컴포넌트에 있다.

- HandlerMapping: **요청 URL에 매핑되는 핸들러를 찾는 역할**
- HandlerAdapter: **찾아낸 핸들러를 실제로 실행하는 방법을 결정하는 역할**

이 두 컴포넌트를 통해 스프링 MVC는 아래와 같은 흐름으로 동작한다.

1. 클라이언트가 요청을 보낸다.
2. HandlerMapping이 요청에 해당하는 핸들러 객체(컨트롤러)를 탐색한다.
3. HandlerAdapter가 해당 핸들러를 어떻게 실행할지를 결정하고 실행한다.
4. 반환된 ModelAndView를 기반으로 뷰가 렌더링된다.

---

**과거 방식의 컨트롤러 – org.springframework.web.servlet.mvc.Controller**

초기 스프링 MVC에서는 컨트롤러를 만들기 위해 다음과 같은 **Controller 인터페이스를 직접 구현**했다.

```java
public interface Controller {
    ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response) throws Exception;
}
```

해당 인터페이스를 구현할 때는 **@Component** 애노테이션을 통해 **빈 이름이 요청 URL인 스프링 빈으로 등록**했다.

```java
@Component("/springmvc/old-controller")
public class OldController implements Controller {
    @Override
    public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response)
            throws Exception {
        ...
        return new ModelAndView("old-view");
    }
}
```

즉, URL 매핑의 기준이 **빈의 이름**인 방식이다.

---

## OldController가 실행되기 위한 필수 조건

OldController가 DispatcherServlet에 의해 정상적으로 실행되려면 **두 가지 조건**이 충족되어야 한다.

**1️⃣ HandlerMapping이 '빈 이름'으로 핸들러를 검색할 수 있어야 한다.**

- → BeanNameUrlHandlerMapping이 필요

**2️⃣ HandlerAdapter가 'Controller' 타입의 핸들러를 실행할 수 있어야 한다.**

- → SimpleControllerHandlerAdapter가 필요

---

## 주요 HandlerMapping 및 HandlerAdapter 종류

스프링 부트는 기본적으로 주요 핸들러 매핑 및 어댑터를 자동 등록한다.

이로 인해 대부분의 상황에서는 개발자가 직접 구현할 필요 없이 다양한 핸들러를 활용할 수 있다.

## HandlerMapping 우선순위

|  |  |  |
| --- | --- | --- |
| **우선순위** | **HandlerMapping** | **설명** |
| 0 | **RequestMapping**HandlerMapping | @RequestMapping 기반 매핑 |
| 1 | **BeanNameUrl**HandlerMapping | 빈 이름 기반 매핑 (과거 방식) |

DispatcherServlet은 등록된 HandlerMapping 목록을 순회하면서 getHandler()를 호출했을 때,

핸들러를 반환하는 첫 번째 매핑을 선택한다.

## HandlerAdapter 우선순위

|  |  |  |
| --- | --- | --- |
| **우선순위** | **HandlerAdapter** | **설명** |
| 0 | **RequestMapping**HandlerAdapter | @RequestMapping 기반 컨트롤러 |
| 1 | **HttpRequest**HandlerAdapter | HttpRequestHandler 인터페이스 구현체 |
| 2 | **SimpleController**HandlerAdapter | Controller 인터페이스 구현체 (과거 방식) |

DispatcherServlet은 각 HandlerAdapter의 supports(handler) 메서드를 호출하여,

true를 반환하는 첫 번째 어댑터를 선택하여 실행한다.

---

## 요청 흐름 예시: OldController 기준

**요청 URI**: /springmvc/old-controller

1. **핸들러 조회**
   - DispatcherServlet은 등록된 HandlerMapping 목록을 순회하면서 핸들러를 탐색
   - 그 중 BeanNameUrlHandlerMapping이 빈 이름이 해당 URI인 OldController를 반환
2. **핸들러 어댑터 조회**
   - 각 HandlerAdapter의 supports(handler)를 순서대로 호출
   - 그 중 SimpleControllerHandlerAdapter가 Controller 타입을 인식하고 true를 반환
3. **핸들러 실행**
   - SimpleControllerHandlerAdapter.handle() 호출
   - 내부적으로 OldController.handleRequest() 실행
4. **ModelAndView 반환**
   - 컨트롤러에서 ModelAndView("old-view") 반환
5. **뷰 렌더링**
   - ViewResolver가 논리 뷰 이름인 "old-view"에 해당하는 View 객체를 탐색
   - 해당 View가 렌더링되어 HTML 응답 반환

---

## 스프링 MVC는 왜 HandlerMapping과 HandlerAdapter로 분리되어 있는가?

이 구조는 단순히 역할을 나눈 것 이상으로, **프론트 컨트롤러의 유연성과 확장성 확보**를 위한 설계다.

## HandlerMapping이 필요한 이유

- 요청 URL과 핸들러 간의 매핑 방식은 다양할 수 있다.
  - @RequestMapping 기반
  - 빈 이름 기반
  - 커스텀 애노테이션 기반 등
- 이러한 다양성을 고려해 **핸들러 탐색 책임을 HandlerMapping 인터페이스로 분리**했다.
- 결과적으로 다양한 방식의 핸들러 매핑을 독립적으로 구현하고 확장할 수 있다.

## HandlerAdapter가 필요한 이유

- 핸들러는 다음과 같이 타입이 제각각이다.
  - Controller 인터페이스 (구방식)
  - @RequestMapping 메서드
  - HttpRequestHandler 등
- 핸들러를 호출하는 방식이 서로 다르기 때문에 **“어떻게 실행할 것인가”의 책임을 HandlerAdapter로 분리**했다.
- 이를 통해 DispatcherServlet은 **핸들러 타입에 관계없이 일관된 방식으로 실행을 위임**할 수 있게 된다.

---

## ✅ 구조 분리의 장점

|  |  |
| --- | --- |
| **유연성** | 여러 종류의 컨트롤러를 혼합하여 사용 가능, 특정 목적에 특화된 컨트롤러 도입 용이 |
| **확장성** | 새로운 핸들러 매핑 방식이나 핸들러 타입을 자유롭게 추가 가능 |
| **유지보수성** | 핸들러 매핑과 실행 로직이 분리되어 각각 독립적으로 관리 가능 |

예를 들어 **특수 목적의 컨트롤러**를 만든다고 가정하면, 해당 컨트롤러를 위한 새로운 HandlerMapping, HandlerAdapter를 구현해서 DispatcherServlet에 등록하면, 기존 구조를 변경하지 않고도 손쉽게 통합할 수 있다.

정리하자면, **다양한 형태의 컨트롤러를 하나의 프론트 컨트롤러에서 유연하게 탐색하고 실행**하기 위해 **역할을 분리**한 것이다.
