---
title: "@ResponseBody"
description: "스프링 MVC에서 핸들러 메서드의 반환 값을 HTTP 응답 본문으로 직접 변환하도록 지시하는 애노테이션이다. 즉, 반환 값을 ViewResolver를 통해 뷰로 변환하지 않고, HttpMessageConverter를 사용해 반환…"
pubDate: 2025-07-31T22:08:26+09:00
category: "스프링/MVC"
tags: []
---

## @ResponseBody란?

스프링 MVC에서 **핸들러 메서드의 반환 값을 HTTP 응답 본문으로 직접 변환**하도록 지시하는 애노테이션이다.

즉, 반환 값을 **ViewResolver**를 통해 뷰로 변환하지 않고,

**HttpMessageConverter**를 사용해 반환 객체를 **HTTP 응답 본문(body)에 직접 쓰도록(직렬화)** 처리한다.

예시:

```java
@GetMapping("/user")
@ResponseBody
public UserDto getUser() {
    return new UserDto("kim", 25);
}
```

```java
HTTP/1.1 200 OK
Content-Type: application/json

{
    "name": "kim",
    "age": 25
}
```

반환된 UserDto 객체는 MappingJackson2HttpMessageConverter를 통해 JSON으로 직렬화되어, HTTP 응답 본문에 포함됨

---

## @RestController

스프링 MVC에서 **REST API 컨트롤러**를 개발할 때 주로 사용하는 **클래스 레벨 애노테이션**이다.

내부적으로 다음 두 애노테이션을 조합한 특수한 형태다.

- @Controller
- **@ResponseBody**

즉, @ResponseBody를 메서드 레벨에 일일이 선언하는 대신, **클래스 레벨**에 선언하여

전체 메서드에 @ResponseBody를 자동 적용하기 위한 애노테이션이다.

```java
@RestController
@RequestMapping("/api")
public class UserController {

    @GetMapping("/user")
    public UserDto getUser() {
        return new UserDto("kim", 25);
    }
}
```

따라서 @RestController를 사용하면 컨트롤러 메서드에 @ResponseBody를 반복해서 붙일 필요가 없다.

---

**내부 동작 방식 (RequestResponseBodyMethodProcessor, HttpMessageConverter)**

1. **HandlerAdapter**가 @ResponseBody가 선언된 핸들러 메서드를 실행
2. 반환 값을 처리하기 위해 등록된 **HandlerMethodReturnValueHandler** 구현체 목록 탐색
3. 그 중에서 @ResponseBody를 처리할 수 있는 **RequestResponseBodyMethodProcessor**가 선택됨
4. 해당 ReturnValueHandler는 **반환 객체**를 다음과 같은 방식으로 처리함
   - **컨텐츠 타입** 결정 (ContentNegotiationManager)
   - 적절한 **HttpMessageConverter** 탐색 및 선택
   - 선택된 컨버터로 객체를 **변환(직렬화)** 후 HttpServletResponse에 직접 씀

---

## ⚠️ 주의사항

- HTTP 응답의 Content-Type은 기본적으로 **application/json**이며, 필요시 produces 속성 또는 HttpHeaders로 명시 가능
- String 반환 시 템플릿 뷰가 아니라 **문자열 자체가 본문**이 된다. (text/plain)
- **Jackson** 라이브러리 미포함 시 JSON 변환이 불가하여 예외(HttpMediaTypeNotAcceptableException 등)가 발생한다.
- **HttpMessageConverter**가 등록되어 있지 않으면 동작하지 않는다.
