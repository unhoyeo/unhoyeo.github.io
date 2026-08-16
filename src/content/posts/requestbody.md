---
title: "@RequestBody"
description: "? @RequestBody란? 스프링 MVC에서 HTTP 요청 본문(body)을 자바 객체로 변환하여 핸들러 메서드 파라미터에 바인딩할 때 사용하는 애노테이션이다."
pubDate: 2025-07-30T18:22:07+09:00
category: "스프링/MVC"
tags: []
---

? **@RequestBody란?**

스프링 MVC에서 **HTTP 요청 본문(body)**을 **자바 객체로 변환**하여 핸들러 메서드 파라미터에 바인딩할 때 사용하는 애노테이션이다.

@ModelAttribute는 주로 **폼 데이터(application/x-www-form-urlencoded)**를 자바 객체로 받을 때 사용한다면,

@RequestBody는 주로 XML, **JSON(application/json)** 등 구조화된 데이터를 자바 객체로 받을 때 사용한다.

예시:

```java
POST /users
Content-Type: application/json

{
  "name": "kim",
  "age": 25
}
```

```java
@PostMapping("/users")
public String saveUser(@RequestBody UserDto user) { ... }
```

? 요청 body의 JSON → **UserDto 객체**로 자동 변환

---

## 속성 정리

- required: 요청 바디 내용의 필수 여부 (**기본값: true**)

---

**? 내부 동작 방식 (RequestResponseBodyMethodProcessor, HttpMessageConverter)**

```java
DispatcherServlet
   ↓
HandlerMapping (RequestMappingHandlerMapping)
   ↓
HandlerAdapter (RequestMappingHandlerAdapter)
   ↓
HandlerMethodArgumentResolverComposite
   ↓
RequestResponseBodyMethodProcessor
   ↓
HttpMessageConverter (e.g. MappingJackson2HttpMessageConverter)
   ↓
핸들러 메서드 실행
```

1. **DispatcherServlet**
   - 모든 HTTP 요청의 진입점이며, Spring MVC의 프론트 컨트롤러
   - 요청을 HandlerMapping에 위임하여 어떤 핸들러를 호출할지 결정
2. **HandlerMapping (RequestMappingHandlerMapping)**
   - 요청 URL, HTTP 메서드 등을 기반으로 호출할 핸들러(핸들러 메서드)를 찾음
3. **HandlerAdapter (RequestMappingHandlerAdapter)**
   - 핸들러 메서드의 **파라미터를 바인딩**하여, 핸들러 메서드를 실행함
   - 파라미터 분석, 리졸버 호출, 바디/리턴값 처리 등 포함
4. **HandlerMethodArgumentResolverComposite**
   - 여러 종류의 HandlerMethodArgumentResolver 중 해당 파라미터에 맞는 리졸버 탐색
   - @RequestBody의 경우, RequestResponseBodyMethodProcessor가 선택됨
5. **RequestResponseBodyMethodProcessor**
   - @RequestBody, @ResponseBody를 처리하는 리졸버
   - HandlerMethodArgumentResolver 및 HandlerMethodReturnValueHandler를 모두 구현한 클래스
   - 파라미터에 @RequestBody가 있을 때 → resolveArgument()
   - 반환 타입에 @ResponseBody가 있을 때 → handleReturnvalue()
   - 등록된 **HttpMessageConverter** 구현체 목록을 순회하여, 적절한 컨버터를 선택
6. **HttpMessageConverter (MappingJackson2HttpMessageConverter)**
   - 파라미터의 타입과 요청의 Content-Type에 따라 어떤 HttpMessageConverter가 동작할지 결정
   - JSON의 경우 Jackson 기반의 MappingJackson2HttpMessageConverter가 동작
7. **핸들러 메서드 실행**
   - 변환된 객체를 인자로 주입하여 핸들러 메서드 호출

---

## HttpMessageConverter

Spring MVC에서 **HTTP 요청/응답의 본문(body)**을 자바 객체로 변환하거나 그 반대를 수행하는 핵심 컴포넌트다.

@RequestBody와 @ResponseBody가 동작할 수 있도록 해주는 핵심 메커니즘이다.

어떤 HttpMessageConverter가 선택될지는 요청의 **Content-Type**과 응답의 **Accept** 헤더에 따라 결정된다.

스프링 부트는 다음과 같은 HttpMessageConverter 구현체들을 순서대로 등록한다. (WebMvcConfigurationSupport 내부 참고)

1. **ByteArrayHttpMessageConverter**
   - 입력: \*/\*
   - 출력: application/octet-stream
   - 변환 대상: byte[]
   - 특징: 바이너리 데이터를 직접 처리, 파일 다운로드에 활용 가능
2. **StringHttpMessageConverter**
   - 입력: \*/\*
   - 출력: text/plain
   - 변환 대상: String
   - 특징: 기본 인코딩은 ISO-8859-1, 설정을 통해 UTF-8 사용 가능
3. **MappingJackson2HttpMessageConverter**
   - 입출력: application/json
   - 변환 대상: 자바 객체
   - 특징: Jackson 라이브러리 기반으로 JSON 처리

> 커스텀 컨버터를 추가하거나 순서를 조절하려면, WebMvcConfigurer의 configureMessageConverters() 또는 extendMessageConverters() 메서드를 오버라이드하면 된다.
> 단, configureMessageConverters()는 기본 컨버터가 아예 등록되지 않으므로 반드시 수동 등록이 필요하다.

---

## ⚠️ 주의사항

- @RequestBody는 반드시 **Content-Type 헤더**가 지정되어야 한다. (application/json 등)
- 파라미터의 타입으로 int, Long, Enum 등은 불가능하다.
  - String의 경우 본문 전체를 바인딩한다. (예: "{"name": "kim", "age": 25}")
  - 일반적으로는 DTO 객체로 바인딩한다.
- Jackson 라이브러리가 JSON을 자바 객체로 변환할 때, 해당 객체에 **Getter만 있어도 동작**한다. (reflection 기반)
  - (자세한 내용은 추후 추가)
