---
title: "HttpServletRequest, HttpServletResponse"
pubDate: 2025-04-16T20:21:55+09:00
category: "스프링/MVC"
tags: ["서블릿"]
---

HTTP 요청과 응답은 웹의 기본이다. 개발자가 클라이언트와 서버 간 통신을 구현할 때 가장 많이 다루는 것이지만, 이 메시지를 직접 파싱하거나 조작하는 것은 매우 번거롭고 오류의 여지가 많다.

이 문제를 해결하기 위해 **서블릿 컨테이너**는 HTTP 메시지를 대신 파싱하고, 이를 객체 형태로 제공하여 개발자가 편리하게 HTTP 요청과 응답을 다룰 수 있도록 한다.

---

**HttpServletRequest란 무엇인가?**

서블릿 컨테이너가 클라이언트 요청 정보를 캡슐화하여 제공하는 객체

- 개발자가 HTTP 요청 메시지를 직접 파싱하지 않아도 되도록 추상화해주며,
- HTTP 메서드, URI, 헤더, 바디, 파라미터, 쿠키, 세션 등 HTTP 요청 전체의 메타데이터 및 본문 데이터를 담고 있다.
- 서블릿뿐 아니라 스프링 프레임워크의 모든 컨트롤러에서도 주입받아 사용할 수 있다.
- 이를 통해 클라이언트의 모든 요청 상황을 제어하고 분석할 수 있다.

---

**HttpServletResponse란 무엇인가?**

클라이언트에게 응답을 생성하고 전송하는 데 사용되는 객체

- HTTP 응답의 상태 코드, 헤더, 바디, 인코딩, 쿠키 등을 설정할 수 있다.
- 마찬가지로 서블릿 컨테이너가 제공하며, 이 객체를 통해 응답 정보를 손쉽게 구성할 수 있다.
- 실제 응답을 출력하는 getWriter()나 getOutputStream()을 통해 텍스트 또는 바이너리 데이터를 스트리밍할 수 있다.
- HTTP 명세에 따라 Content-Type, Charset, Cache-Control 등을 정확히 지정해야 정상적인 동작을 보장할 수 있다.

> **HttpServletRequest의 주요 기능**

✅ 요청 라인

- getMethod() : HTTP 메서드 (GET, POST, PUT, DELETE 등)
- getRequestURI() : URI만 반환 (/users/123)
- getRequestURL() : 전체 URL (http://localhost:8080/users/123)
- getProtocol() : HTTP 프로토콜 버전 (HTTP/1.1, HTTP/2)
- isSecure() : HTTPS 요청 여부 판단

> 로깅이나 인증 필터에서 많이 사용한다. 특히 URL 전체를 로그로 남기거나 요청 메서드별 처리 분기에 사용된다.

---

✅ 요청 파라미터 (Query String, Form)

- getParameter(String name) : 단일 파라미터 조회
- getParameterValues(String name) : 동일 이름의 복수 파라미터 처리 (예: 체크박스)
- getParameterMap() : 모든 파라미터를 Map&lt;String, String[]>로 반환
- getQueryString() : 원본 쿼리 스트링 (username=kim&age=30)

> POST 요청은 바디가 application/x-www-form-urlencoded 형식일 때만 파라미터로 인식된다.
> application/json 형식은 해당 메서드로 접근할 수 없다.

---

✅ 요청 헤더

- getHeader(String name) : 특정 헤더 조회
- getHeaderNames() : 모든 헤더 이름 열거
- getContentType() : 요청 본문의 MIME 타입 (예: application/json)
- getCharacterEncoding() : 요청 인코딩 (없으면 ISO-8859-1이 기본)
- getLocale() : 클라이언트가 선호하는 언어 설정 (Accept-Language 헤더)

> 사용자 환경 분석, 언어 설정, 콘텐츠 협상(Content Negotiation) 등에 활용된다.

---

✅ 요청 바디

- getInputStream() : 바이너리 스트림(ServletInputStream) 기반
- JSON 처리 예:

```java
ServletInputStream inputStream = request.getInputStream();
String body = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);

ObjectMapper objectMapper = new ObjectMapper();
MyDto dto = objectMapper.readValue(body, MyDto.class);
```

> getInputStream()은 바이트 코드를 반환하기 때문에 문자열로 읽으려면 문자표(Charset)를 지정해야 한다.

---

✅ 쿠키

- getCookies() : 쿠키 배열 반환 → 반복문으로 필요한 값 추출

```
Cookie[] cookies = request.getCookies();
for (Cookie cookie : cookies) {
    if (cookie.getName().equals("auth")) {
        String value = cookie.getValue();
    }
}
```

> 쿠키는 상태 유지, 인증 정보 저장 등에 사용되며, 보안을 위해 HttpOnly, Secure 속성 등을 필수로 설정해야 한다.

---

✅ 네트워크

- getRemoteAddr() : 클라이언트 IP
- getRemoteHost() : 클라이언트 호스트명 (DNS Lookup 발생 가능)
- getRemotePort() : 클라이언트 포트
- getLocalAddr() : 서버 IP
- getLocalName() : 서버 호스트명
- getLocalPort() : 서버 포트

> 서버/클라이언트 로깅, IP 기반 차단, 감사 로그 작성 등에 활용된다.

---

✅ 세션 및 요청 스코프 저장소

- getSession() : 세션 객체(HttpSession) 반환 (없으면 새로 생성해서 반환)
- getSession(false) : 존재하지 않으면 null 반환
- setAttribute(name, value) : 요청 스코프 임시 저장소에 저장 (현재 요청 동안만 유효)
- getAttribute(name) : 저장한 값 조회

> 세션은 사용자 로그인 정보 등 인증 및 상태 유지에 유용하며, 요청 스코프 저장소는 필터 → 컨트롤러 → 뷰 사이에서 데이터를 임시 전달할 때 유용하다.

> **HttpServletResponse의 주요 기능**

✅ HTTP 상태 코드

- setStatus(int sc) : 상태 코드 수동 설정
- sendError(int sc) : 오류 응답 + 기본 오류 페이지 출력

```
response.setStatus(HttpServletResponse.SC_FORBIDDEN);
response.sendError(HttpServletResponse.SC_NOT_FOUND, "Not Found");
```

> REST API에서는 상태 코드에 따라 로직 분기 및 클라이언트 동작이 결정되므로 명확한 설정이 중요하다.

---

✅ 응답 헤더

- setHeader(name, value) : 응답 헤더 설정 (기존 값 덮어씀)
- addHeader(name, value) : 동일 이름 다중 헤더 허용

```
response.setHeader("Cache-Control", "no-store");
response.setHeader("X-Custom-Header", "example");
```

> CORS, 캐싱 정책, 인증 헤더 설정 시 반드시 사용된다.

---

✅ 콘텐츠 타입 및 인코딩

- setContentType("application/json")
- setCharacterEncoding("UTF-8")

> 이 설정은 반드시 출력 스트림(getWriter(), getOutputStream()) 호출 전에 설정해야 한다. (이후 변경은 무시되거나 예외 발생 가능)

---

✅ 응답 바디 (텍스트 기반)

```
response.setContentType("text/plain");
response.setCharacterEncoding("UTF-8");

PrintWriter writer = response.getWriter();
writer.write("Hello, world");
```

> JSP 없이 직접 HTML, JSON, XML을 구성할 때 사용하며, 스프링 MVC에서는 @ResponseBody 혹은 ResponseEntity로 추상화된다.

---

✅ JSON 응답 처리

```java
response.setContentType("application/json");
response.setCharacterEncoding("UTF-8");

ObjectMapper objectMapper = new ObjectMapper();
String json = objectMapper.writeValueAsString(myDto);

response.getWriter().write(json);
```

> 대용량 JSON 또는 바이너리 응답 시 getOutputStream() 사용을 고려해야 한다. 특히 Excel, 이미지, PDF 다운로드 등에서는 반드시 바이너리 스트림을 사용해야 한다.

---

✅ 리다이렉트

- sendRedirect(String location) : 302 Found 응답 전송

```
response.sendRedirect("/login");
```

> 클라이언트가 URL을 변경하면서 재요청하는 방식이므로 POST-Redirect-GET 패턴에서 자주 사용된다.

---

✅ 쿠키

```java
Cookie cookie = new Cookie("authToken", "abcdef123456");
cookie.setMaxAge(3600); // 초 단위
cookie.setHttpOnly(true); // 자바스크립트 접근 방지
cookie.setSecure(true); // HTTPS 전용

response.addCookie(cookie);
```

> 실무에서는 CSRF, XSS 방지, 도메인 스코프 설정을 함께 고려해야 한다.

---

**마무리 요약**

- HttpServletRequest는 **요청 데이터 조회**를 위해, HttpServletResponse는 **응답 생성**을 위해 사용된다.
- 웹 애플리케이션 개발의 기반이 되는 개념으로, Spring MVC에서도 동일한 객체가 내부적으로 사용된다.
- 프레임워크 내부 동작 커스터마이징, 저수준 서블릿 프로그래밍이 필요한 상황에서도 디버깅과 최적화에 강점을 가지게 된다.
- 또한, 스프링 MVC 등에서 추상화된 인터페이스 뒤에서 무슨 일이 벌어지고 있는지 파악하는 능력은 실무에서 큰 자산이 된다.
