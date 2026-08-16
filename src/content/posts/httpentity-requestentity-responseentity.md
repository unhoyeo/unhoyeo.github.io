---
title: "HttpEntity – RequestEntity, ResponseEntity"
description: "Spring MVC는 HTTP 요청/응답 메시지를 직접 다루는 대신, 이를 추상화된 객체로 표현하여 제공한다. 이는 서블릿 API에 종속적이지 않고, 보다 객체 지향적인 HTTP 메시지 처리를 가능하게 한다."
pubDate: 2025-08-04T16:47:49+09:00
category: "스프링/MVC"
tags: []
---

Spring MVC는 **HTTP 요청/응답 메시지**를 직접 다루는 대신, 이를 **추상화된 객체**로 표현하여 제공한다.

이는 **서블릿 API에 종속적이지 않고**, 보다 **객체 지향적인 HTTP 메시지 처리**를 가능하게 한다.

즉, HttpEntity와 이를 상속한 RequestEntity와 ResponseEntity는 **HTTP 요청 및 응답 메시지를 추상화**하여 개발자가 손쉽게 요청과 응답을 처리하도록 도와주는 객체다.

---

## HttpEntity&lt;T> – 헤더, 바디

```java
public class HttpEntity<T> {

    private final HttpHeaders headers;

    @Nullable
    private final T body;

    ...
}
```

- HTTP 요청 또는 응답의 **헤더와 바디를 캡슐화**하는 클래스
- **RestTemplate**과 함께 사용되거나, @Controller 메서드의 **파라미터 또는 반환 값**으로 사용됨
  - 단, 상태 코드 설정은 불가능 (상태 코드가 필요하면 ResponseEntity 사용)

예시:

```java
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType. TEXT_PLAIN);

HttpEntity<String> entity = new HttpEntity<>("Hello World", headers);
URI location = template.postForLocation("https://example.com", entity);
```

```java
@GetMapping("/handle")
public HttpEntity<String> handle(HttpEntity<User> httpEntity) {
    HttpHeaders requestHeaders = httpEntity.getHeaders();
    User user = httpEntity.getBody();

    ...

    HttpHeaders responseHeaders = new HttpHeaders();
    responseHeaders.set("MyResponseHeader", "MyValue");
    return new HttpEntity<>("Hello World", responseHeaders);
}
```

---

## RequestEntity&lt;T> – HTTP 메서드, 요청 URL

```java
public class RequestEntity<T> extends HttpEntity<T> {

    @Nullable
    private final HttpMethod method;

    @Nullable
    private final URI url;

    @Nullable
    private final Type type;

    ...
}
```

- HttpEntity를 상속하면서, **HTTP 메서드와 요청 URL**도 포함한 클래스
- 주로 **RestTemplate이나 WebClient를 통한 외부 API 호출** 시 사용
  - 즉, 클라이언트 역할에서 요청을 구성할 때 사용
  - 물론 @Controller 메서드에서 사용도 가능

예시:

```java
MyRequest body = ...

RequestEntity<MyRequest> request = RequestEntity
    .post("https://example.com/{foo}", "bar")
    .accept(MediaType.APPLICATION_JSON)
    .body(body);

ResponseEntity<MyResponse> response = template.exchange(request, MyResponse.class);
```

```java
@RequestMapping("/handle")
public void handle(RequestEntity<String> request) {
    HttpMethod method = request.getMethod();
    URI url = request.getUrl();
    String body = request.getBody();
    ...
}
```

---

## ResponseEntity&lt;T> – 상태 코드

```java
public class ResponseEntity<T> extends HttpEntity<T> {

    private final HttpStatusCode status;

    ...
}
```

- HttpEntity를 상속하면서, HTTP 응답의 **상태 코드**를 명시할 수 있는 클래스
- RestTemplate과 @Controller 메서드에서 사용됨
  - RestTemplate에서 이 클래스는 getForEntity()와 exchange()에서 반환됨
  - Spring MVC에서 @Controller 메서드의 **반환 값**으로도 사용 가능 (정적 메서드를 통해 접근 가능한 **빌더**로도 사용 가능)
- 실무에서 **표준화된 API 응답 형식**을 만들 때 가장 많이 사용
- @ResponseBody와 유사하게 동작하지만 **헤더와 상태 코드 제어가 더 자유로움**
- 응답 DTO와 에러 응답이 일관된 포맷을 갖도록 ResponseEntity&lt;ApiResponse>로 감싸는 패턴이 흔함

예시:

```java
ResponseEntity<String> entity = template.getForEntity("https:// example.com", String.class);
String body = entity.getBody();
MediaType contentType = entity.getHeaders().getContentType();
HttpStatus statusCode = entity.getStatusCode();
```

```java
@RequestMapping("/handle")
public ResponseEntity<String> handle() {
    URI location = ...;
    HttpHeaders responseHeaders = new HttpHeaders();
    responseHeaders.setLocation(location);
    responseHeaders.set("MyResponseHeader", "MyValue");
    return new ResponseEntity<String>("Hello World", responseHeaders, HttpStatus.CREATED);
}

@RequestMapping("/handle")
public ResponseEntity<String> handle() {
    URI location = ...;
    return ResponseEntity
        .created(location)
        .header("MyResponseHeader", "MyValue")
        .body("Hello World");
}
```

---

## HttpEntityMethodProcessor

이전에 **@RequestBody, @ResponseBody**는 내부적으로 **RequestResponseBodyMethodProcessor**가 처리한다고 했었다.

마찬가지로 **HttpEntity**(RequestEntity, ResponseEntity)는 **HttpEntityMethodProcessor**가 내부적으로 처리한다.

두 메서드 프로세서의 공통점:

- HandlerMethod**ArgumentResolver**와 HandlerMethod**ReturnValueHandler**를 둘 다 상속
- 내부에서 **HttpMessageConverter**를 사용하여 바디 정보를 변환 (예: JSON ↔ User)
