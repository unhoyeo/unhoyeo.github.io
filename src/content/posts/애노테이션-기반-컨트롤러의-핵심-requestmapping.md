---
title: "애노테이션 기반 컨트롤러의 핵심 – @RequestMapping"
description: "Spring MVC에서 HTTP 요청을 특정 컨트롤러 메서드에 매핑하기 위해 사용하는 애노테이션이다. 요청 URL, HTTP 메서드, 파라미터 조건, 헤더 조건, 미디어 타입 조건 등을 조합하여 요청을 정교하게 매핑할 수 있다."
pubDate: 2025-07-23T22:00:30+09:00
category: "스프링/MVC"
tags: []
---

## @RequestMapping이란?

Spring MVC에서 **HTTP 요청을 특정 컨트롤러 메서드에 매핑**하기 위해 사용하는 애노테이션이다.

**요청 URL, HTTP 메서드, 파라미터 조건, 헤더 조건, 미디어 타입 조건** 등을 조합하여 요청을 정교하게 매핑할 수 있다.

예시:

```kotlin
@RequestMapping("/hello")
public String hello() {
    return "hello";
}
```

/hello 경로로 들어온 모든 요청을 해당 메서드로 처리

---

## @RequestMapping을 클래스 레벨에 선언 시?

@RequestMapping은 메서드 레벨, 클래스 레벨 모두에서 사용할 수 있다.

클래스 레벨에서는 **공통 URL 경로**를 지정하고, 메서드 레벨에서는 **세부적인 경로와 매핑 조건**을 지정한다.

예:

```java
@Controller
@RequestMapping("/api/users")
public class UserController {

    @RequestMapping(method = RequestMethod.GET)
    public void find() {
        ...
    }

    @RequestMapping(value = "/join", method = RequestMethod.POST)
    public void join() {
        ...
    }

}
```

find()는 GET /api/users 요청에 매핑되고, join()은 POST /api/users/join 요청에 매핑된다.

---

## 속성 정리

@RequestMapping은 다양한 속성을 통해 매핑 조건을 상세하게 설정할 수 있다.

|  |  |  |
| --- | --- | --- |
| **속성** | **타입** | **설명** |
| name | String | 해당 매핑의 이름 |
| value (=path) | String[] | 매핑할 URI 경로 |
| method | RequestMethod[] | 매핑할 HTTP 메서드 |
| params | String[] | 매핑할 요청 파라미터 |
| headers | String[] | 매핑할 요청 헤더 |
| consumes | String[] | 매핑할 Content-Type 헤더 |
| produces | String[] | 매핑할 Accept 헤더 |

---

## ✔ name

- **매핑에 이름을 부여**하여 다른 곳(예: MvcUriComponentsBuilder)에서 참조할 수 있도록 한다.
- 클래스 레벨과 메서드 레벨에 모두 설정하면 **클래스명#메서드명** 형태로 조합된다.
- URI 빌더에서 명명 기반 매핑 검색 시 사용된다.

```java
@GetMapping(value = "/{id}", name = "findUserById")
```

---

## ✔ value (=path)

- **매핑할 요청 URL 경로**를 지정한다.
- <strong>Ant 스타일 경로 패턴</strong>(예: /profile/\*\*)이나 <strong>경로 변수</strong>(예: /{profile\_path})를 사용할 수 있다.
- 메서드 레벨에서는 **상대 경로**(예: edit)가 클래스 레벨에서 표현된 기본 매핑 내에서 지원된다.
- 클래스 레벨에서 사용하면 모든 메서드 레벨 매핑이 이 기본 매핑을 상속받아 특정 핸들러 메서드에 맞게 범위를 좁힌다.
- 명시적으로 경로에 매핑되지 않은 핸들러 메서드는 빈 경로에 매핑된다.

```java
@RequestMapping("/members")   // 단일 URL 매핑
@RequestMapping({"/a", "/b"}) // 복수 URL 매핑
```

---

## ✔ method

- **매핑할 HTTP 메서드**(GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE, TRACE)를 지정한다.
- 지정하지 않으면 모든 HTTP 메서드를 허용한다.
- 실무에선 명확성을 위해 @GetMapping, @PostMapping 등 축약형 애노테이션을 사용한다.

```java
@RequestMapping(value = "/save", method = RequestMethod.POST) // @PostMapping("/save")과 동일
```

---

## ✔ params

- 요청에 **특정 파라미터가 존재하거나, 특정 값을 가질 때만** 매핑하도록 제한한다.
- **"myParam=myValue"** → 해당 파라미터가 지정된 값을 가져야 함 (**!=** 연산자도 가능)
- **"myParam"** → 해당 파라미터가 요청에 존재해야 함 (**!** 연산자도 가능)
- 실무에서는 **기능 분기** 용도로 활용된다.

```java
params = "mode"         // mode 파라미터가 존재해야 함
params = "!mode"        // mode 파라미터가 없어야 함
params = "mode=debug"   // mode 파라미터가 debug이어야 함
params = "mode!=debug"  // mode 파라미터가 debug가 아니어야 함
```

---

## ✔ headers

- 요청에 **특정 헤더가 존재하거나, 특정 값을 가질 때만** 매핑하도록 제한한다.
- Accept, Content-Type 같은 헤더에 <strong>미디어 타입 와일드카드(\*)</strong>도 지원
- 예: "Content-Type=text/\*" → text/plain, text/html 등 모두 매칭

```java
headers = "!X-Auth"         // X-Auth 헤더가 없어야 함
headers = "X-Auth=true"     // X-Auth 헤더가 true이어야 함
headers = "X-API-VERSION=1" // API 버전 관리를 위해 커스텀 헤더 조건을 걸 수도 있음
```

---

## ✔ consumes

- 핸들러가 **소비할 수 있는 요청의 미디어 타입**을 지정한다.
- 즉, 클라이언트가 보내는 요청의 **Content-Type**을 매핑한다.

```java
consumes = "application/json" // 요청의 Content-Type이 JSON 타입이어야 함
consumes = MediaType.APPLICATION_JSON_VALUE // 위와 동일
```

---

## ✔ produces

- 핸들러가 **생산할 수 있는 응답의 미디어 타입**을 지정한다.
- 즉, 클라이언트의 **Accept 헤더**와 비교하여 **콘텐츠 협상**(Content Negotiation)을 통해 매핑된다.

```java
produces = "application/json" // 클라이언트가 JSON 타입의 응답을 받을 수 있어야 함
```

---

## 실무 활용 예시

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @RequestMapping(
        path = "/{userId}",
        method = RequestMethod.GET,
        params = "mode=fast",
        produces = "application/json",
        headers = "X-Request-Version=1"
    )
    public UserResponse getUser(@PathVariable Long userId) {
        return userService.findUserById(userId);
    }
}
```

이 메서드는 다음 조건이 모두 만족될 때만 동작한다.

- GET /api/users/{userId}?mode=fast 요청
- Accept: application/json 헤더
- X-Request-Version: 1 헤더

---

**왜 이렇게 다양한 옵션이 필요할까?**

- RESTful 설계 원칙에 따라 URL과 HTTP 메서드를 명확히 구분해야 함
- 같은 URL이라도, 특정 조건에 따라 다른 핸들러가 필요할 수 있음 (예: 헤더 기반 버전 관리)
- 요청의 Content-Type, Accept 등을 보고 적절한 핸들러를 선택하게 함으로써, 유연하고 명확한 API 설계 가능

---

**정리**

- @RequestMapping은 단순한 경로 매핑 이상의 역할을 수행하며, HTTP 요청을 **복합 조건 기반으로 정교하게 처리**할 수 있다.
- 속성으로는 name, value(=path), method, params, headers, consumes, produces가 있다.
- 이를 조합하여 **복잡한 요청 조건 분기, API 버전 관리** 등을 유연하게 수행할 수 있으며, 신뢰성과 유지보수성 있는 설계를 할 수 있다.
