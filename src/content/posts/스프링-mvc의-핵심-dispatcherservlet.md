---
title: "스프링 MVC의 핵심 – DispatcherServlet"
description: "스프링 MVC는 전통적인 웹 애플리케이션 아키텍처의 핵심 패턴인 프론트 컨트롤러(Front Controller) 패턴을 기반으로 동작한다."
pubDate: 2025-04-26T20:54:49+09:00
category: "스프링/MVC"
tags: []
---

스프링 MVC는 전통적인 웹 애플리케이션 아키텍처의 핵심 패턴인 **프론트 컨트롤러(Front Controller) 패턴**을 기반으로 동작한다.

점진적으로 직접 구현한 프론트 컨트롤러 프레임워크와 스프링 MVC의 구조를 비교해 보면 그 유사성이 명확히 드러난다.

|  |  |  |
| --- | --- | --- |
| **직접 구현** | **스프링 MVC** | **설명** |
| FrontControllerServlet | DispatcherServlet | HTTP 요청을 중앙에서 받아 처리하는 프론트 컨트롤러 |
| handlerMappingMap | HandlerMapping | 요청 URL에 매핑되는 컨트롤러(핸들러)를 탐색 |
| MyHandlerAdapter | HandlerAdapter | 다양한 방식의 핸들러를 유연하게 호출하는 어댑터 |
| ModelView | ModelAndView | 모델 데이터와 뷰 이름을 함께 담는 객체 |
| viewResolver() | ViewResolver | 논리 뷰 이름을 물리 경로로 변환하는 객체 |
| MyView | View | 최종적으로 HTML을 렌더링하는 객체 |

이제 이 아키텍처의 핵심인 **DispatcherServlet**을 중심으로, 스프링 MVC의 동작 원리를 분석해 보자.

---

## DispatcherServlet이란 무엇인가?

스프링 MVC의 진입점 역할을 수행하는 **프론트 컨트롤러 서블릿**이다.

스프링 프레임워크 내부에서 다음과 같은 **클래스 계층 구조**를 통해 정의되어 있다.

```mipsasm
DispatcherServlet → FrameworkServlet → HttpServletBean → HttpServlet
```

즉, DispatcherServlet 또한 **HttpServlet** 기반으로 동작하며, 스프링 MVC 전반의 흐름을 제어한다.

모든 요청은 이 DispatcherServlet을 통과하며, 이후 적절한 컨트롤러(핸들러) 호출과 뷰 렌더링 과정이 이어진다.

---

## DispatcherServlet은 어떻게 등록되는가? (스프링 부트 기준)

기존에는 프론트 컨트롤러 서블릿을 **@WebServlet** 애노테이션을 통해 명시적으로 등록했지만,

스프링 부트에서의 DispatcherServlet은 **자동 등록**된다.

스프링 부트는 내부적으로 DispatcherServletAutoConfiguration 클래스를 통해 DispatcherServlet을 **스프링 빈으로 등록**한다.

이후 DispatcherServletRegistrationBean을 통해 <strong>서블릿 컨테이너에 등록</strong>되며, 기본적으로 <strong>urlPatterns="/"</strong>으로 매핑된다.

따라서 **모든 요청을 가로채는 것이 가능한 것이다.**

단, 서블릿 매핑의 우선순위는 **구체적인 경로가 우선**이기 때문에, 명시적으로 등록한 다른 서블릿과도 공존이 가능하다.

---

## 스프링 MVC 요청 처리 흐름

스프링 MVC는 다음과 같은 순서로 요청을 처리한다.

```cos
클라이언트 요청
→ DispatcherServlet
→ HandlerMapping → 핸들러 조회
→ HandlerAdapter → 어댑터 조회
→ 어댑터 → 핸들러 호출
→ ModelAndView 반환
→ ViewResolver
→ View 반환 → 뷰 렌더링
```

**각 단계는 스프링의 주요 컴포넌트를 통해 독립적으로 구성되어 있어, 유연성과 확장성이 매우 높다.**

---

## DispatcherServlet 동작 원리

## 1️⃣ DispatcherServlet 호출

예를 들어 사용자가 /members로 요청을 보냈는데, /members에 매핑된 서블릿이 없을 경우,

모든 경로 /에 매핑되어 있는 DispatcherServlet이 호출된다.

## 2️⃣ FrameworkServlet.service() 호출

원래 서블릿은 호출될 경우 기본적으로 HttpServlet.service() 메서드가 실행된다.

하지만 스프링 MVC는 DispatcherServlet의 부모 클래스인 FrameworkServlet에 해당 메서드를 오버라이드하여 이를 실행한다.

즉, DispatcherServlet이 호출되면 FrameworkServlet.service() 메서드가 실행된다.

## 3️⃣ DispatcherServlet.doDispatch() 호출

FrameworkServlet.service() 메서드는 내부적으로 DispatcherServlet.doDispatch()를 호출한다.

바로 이 메서드 안에 **실제 요청 처리 로직**이 집중되어 있다.

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response)
        throws Exception {

    // 현재 요청에 매핑된 핸들러 조회
    HandlerExecutionChain mappedHandler = getHandler(request);

    // 해당 핸들러를 처리할 수 있는 어댑터 조회
    HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

    // 어댑터가 핸들러를 호출하고, ModelAndView 반환
    ModelAndView mv = ha.handle(request, response, mappedHandler.getHandler());

    // 뷰 렌더링 및 응답 반환
    processDispatchResult(request, response, mappedHandler, mv, null);
}
```

1. **핸들러 조회**: HandlerMapping을 통해 요청 URL에 매핑된 핸들러를 조회한다.
2. **핸들러 어댑터 조회**: 해당 핸들러를 실행할 수 있는 HandlerAdapter를 찾는다.
3. **핸들러 실행**: HandlerAdapter.handle()을 통해 실제 핸들러를 호출한다.
4. **ModelAndView 반환**: 핸들러의 반환 결과를 ModelAndView로 변환하여 반환한다.
5. **ViewResolver 호출 및 View 생성**: 논리 뷰 이름을 물리 뷰 이름으로 변환하여 뷰 객체를 생성한다.
6. **View 렌더링**: 최종적으로 View.render()를 통해 HTML을 생성하고 응답을 반환한다.

---

## ✅ 스프링 MVC의 강력한 확장성

스프링 MVC는 <strong>"인터페이스 기반 설계"</strong>를 통해 DispatcherServlet 코드 수정 없이 기능을 변경하거나 확장할 수 있다.

다음 인터페이스들을 구현하여 등록하기만 하면 기능을 자유롭게 확장할 수 있다.

- HandlerMapping: 커스텀 URL 매핑 전략 구현
- HandlerAdapter: 사용자 정의 컨트롤러 호출 방식 지원
- ViewResolver: 다양한 뷰 템플릿 렌더링 전략 적용
- View: HTML 외에도 JSON, PDF 등 다양한 렌더링 방식 구현 가능

이러한 확장성 덕분에 스프링 MVC는 전 세계 다양한 실무 요구사항에 유연하게 대응할 수 있는 프레임워크가 되었다.

---

## 왜 스프링 MVC의 구조를 이해해야 하는가?

스프링 MVC의 내부 구조는 복잡하게 느껴질 수 있으나, 다음과 같은 실무적 이유로 학습할 가치가 충분하다.

- **문제 원인 추적**: 구조를 이해하면, 요청 처리 흐름 중 어느 계층에서 오류가 발생했는지 빠르게 파악할 수 있다.
- **적절한 확장 지점 파악**: 사용자 정의 기능을 추가할 때, 어떤 컴포넌트를 구현해야 하는지 판단할 수 있다.
- **프레임워크의 작동 원리를 파악**: 단순히 사용하는 수준을 넘어서, 프레임워크의 설계 철학과 의도를 이해할 수 있다.

---

## 지금은 구조 이해만으로 충분!

초기 학습 단계에서는 DispatcherServlet 중심의 전체 흐름을 파악하는 것으로 충분하다.

**커스텀 핸들러나 뷰 리졸버, 인터셉터, 필터** 등은 필요할 때마다 점진적으로 학습하는 것이 효율적이다.

실무에서 이 구조를 활용해 **직접 확장하거나 커스터마이징해 본 경험**이 쌓일수록, 이 구조에 대한 이해도는 더 단단해질 것이다.

---

## 참고: DispatcherServlet의 뷰 렌더링 처리 코드

```java
private void processDispatchResult(HttpServletRequest request, HttpServletResponse response,
                                   HandlerExecutionChain mappedHandler, ModelAndView mv,
                                   Exception exception) throws Exception {
    render(mv, request, response);
}

protected void render(ModelAndView mv, HttpServletRequest request, HttpServletResponse response) throws Exception {
    View view;
    String viewName = mv.getViewName();
    if (viewName != null) {
        view = resolveViewName(viewName, mv.getModelInternal(), locale, request);
    } else {
        view = mv.getView();
    }
    view.render(mv.getModelInternal(), request, response);
}
```

이 코드는 **논리 뷰 이름 → ViewResolver → View → HTML 렌더링**의 처리 흐름을 보여준다.
