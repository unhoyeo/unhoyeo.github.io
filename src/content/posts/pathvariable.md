---
title: "@PathVariable"
description: "? @PathVariable이란? 스프링 MVC에서 URI 템플릿 변수(경로 변수)를 핸들러 메서드 파라미터에 바인딩하기 위해 사용하는 애노테이션이다."
pubDate: 2025-07-30T15:16:20+09:00
category: "스프링/MVC"
tags: []
---

**@PathVariable이란?**

스프링 MVC에서 <strong>URI 템플릿 변수(경로 변수)</strong>를 핸들러 메서드 파라미터에 바인딩하기 위해 사용하는 애노테이션이다.

@RequestParam이나 @ModelAttribute와는 달리, **URL 경로 자체에 포함된 값**을 추출하는 데 사용되며,

주로 **RESTful 스타일의 URL**에서 자주 활용된다.

예시: GET /users/2

```java
@GetMapping("/users/{id}")
public String getUser(@PathVariable("id") Long userId) { ... }
```

{id}에 해당하는 값인 2가 userId에 바인딩된다.

---

**왜 사용하는가?**

과거에는 대부분의 데이터 전달이 ?key=value 형태의 **쿼리 파라미터**를 통해 이루어졌다.

하지만 RESTful API 설계가 확산되면서, 의미 있는 **리소스를 경로에 직접 표현하는 방식**이 선호되기 시작했다.

- /members?id=100 ❌ (구방식)
- /members/100 ✅ (RESTful 방식)

---

**속성 정리**

|  |  |
| --- | --- |
| **속성명** | **설명** |
| value (=name) | 바인딩할 경로 변수의 이름 (**생략 시 변수명과 동일**하게 처리됨) |
| required | 경로 변수의 필수 여부 (**기본값: true**) |

value 생략 시, required 사용 시 주의 사항은 [여기서](/posts/애노테이션-기반-컨트롤러의-주요-파라미터-바인딩-required-옵션-주의점-value/) 참고하자.

---

## 다중 바인딩 (Map&lt;String, String>)

```java
@GetMapping("/users/{userId}/comments/{commentId}")
public String showComment(@PathVariable Map<String, String> pathVars) {
    // pathVars.get("userId"), pathVars.get("commentId") 사용 가능
}
```

- 요청: GET /users/1/comments/2
- pathVars = {commentId=2, userId=1}

모든 경로 변수를 Map&lt;String, String>으로도 받을 수 있지만, 무조건 **String**으로 받기 때문에 **타입 안정성이 없다.**

---

## 내부 동작 방식 (PathVariableMethodArgumentResolver)

```java
DispatcherServlet
   ↓
HandlerMapping (RequestMappingHandlerMapping)
   ↓
HandlerAdapter (RequestMappingHandlerAdapter)
   ↓
HandlerMethodArgumentResolverComposite
   ↓
PathVariableMethodArgumentResolver
   ↓
WebDataBinderFactory
   ↓
ConversionService (GenericConversionService)
   ↓
핸들러 메서드 실행
```

1. **DispatcherServlet**
   - 모든 HTTP 요청의 진입점이며, Spring MVC의 프론트 컨트롤러
   - 요청을 HandlerMapping에 위임하여 어떤 핸들러를 호출할지 결정
2. **HandlerMapping (RequestMappingHandlerMapping)**
   - 요청 URL, HTTP 메서드 등을 기반으로 호출할 핸들러(핸들러 메서드)를 찾음
   - 이때 URI 템플릿 /users/{id}와 요청 경로 /users/10를 매핑하며,
   - 경로 변수 값을 추출하여 내부적으로 **UriTemplateVariables**에 저장
3. **HandlerAdapter (RequestMappingHandlerAdapter)**
   - 핸들러 메서드를 실행할 수 있는 어댑터
   - 이 과정에서 메서드의 각 파라미터를 어떻게 바인딩할지 결정하기 위해 다음 단계로 위임
4. **HandlerMethodArgumentResolverComposite**
   - 메서드의 각 파라미터에 대해 어떤 ArgumentResolver가 처리할 수 있는지 판단
   - 등록된 HandlerMethodArgumentResolver 구현체를 순차적으로 탐색
   - @PathVariable이 붙은 파라미터의 경우, PathVariableMethodArgumentResolver가 선택됨
5. **PathVariableMethodArgumentResolver**
   - 실제로 @PathVariable을 처리하는 전담 Resolver
     - @PathVariable("id")의 이름 "id"를 확인,
     - HandlerMapping의 UriTemplateVariables에서 "id"에 해당하는 값 조회
     - 문자열을 원하는 파라미터 타입(Long 등)으로 변환하기 위해 ConversionService 호출
6. **WebDataBinderFactory**
   - 복잡한 타입(List, 사용자 정의 객체 등)에 대한 바인딩을 지원
   - 여기서는 단순 String → Long과 같은 변환이므로 주로 ConversionService에 위임
7. **ConversionService (GenericConversionService)**
   - 등록된 Converter&lt;String, Long> 등 다양한 변환기를 사용하여 타입 변환 수행
   - 예: "10" → Long 10 으로 변환
8. **핸들러 메서드 실행**
   - 모든 파라미터가 바인딩되면, 컨트롤러의 핸들러 메서드가 실행됨
   - 변환된 Long id가 메서드 인자로 주입됨

---

## @PathVariable vs @RequestParam vs @ModelAttribute

|  |  |
| --- | --- |
| **리소스 조회** | GET /items/{id} + **@PathVariable** |
| **검색 조건 필터** | GET /search?q=spring&page=2 + **@RequestParam** |
| **복합 입력 처리** | POST/PUT name=kim&age=25 **@ModelAttribute** (JSON의 경우 @RequestBody) |

---

## ✅ 결론

- @PathVariable은 자주 변경되지 않는 **리소스 식별자**에 적합
- 반대로 검색 조건, 페이징 등 **동적인 필터링 값**은 @RequestParam 사용
- URI 변수와 파라미터명이 다르면 **명시적으로 "name" 속성** 지정 필요
