---
title: "애노테이션 기반 컨트롤러의 주요 파라미터 바인딩, required 옵션 주의점, value (=name) 생략 시 주의점"
description: "Spring MVC의 @RequestMapping 애노테이션 기반 컨트롤러는 다양한 방식으로 요청 데이터를 핸들러 메서드의 파라미터로 받을 수 있도록 하는 파라미터 바인딩 기능을 제공한다."
pubDate: 2025-07-24T23:59:05+09:00
category: "스프링/MVC"
tags: []
---

Spring MVC의 **@RequestMapping 애노테이션 기반 컨트롤러**는 다양한 방식으로 요청 데이터를 핸들러 메서드의 파라미터로 받을 수 있도록 하는 **파라미터 바인딩 기능**을 제공한다.

몇가지 주요 애노테이션들과 인터페이스를 알아보자.

---

## @RequestParam – 쿼리 파라미터 / HTML Form 파라미터

```java
@GetMapping("/hello")
public String hello(@RequestParam("name") String name) { ... }
```

- GET /hello?name=kim 요청 → name에 "kim"이 바인딩됨
- **단순 타입**(int, Integer, String 등)일 경우, @RequestParam **생략 가능** (실무에선 명확성 때문에 생략하지 않는 것을 권장)
- 속성: value (=name), **required (기본값: true)**, defaultValue

---

## @PathVariable – URL 경로 내 변수

```java
@GetMapping("/members/{id}")
public String getMember(@PathVariable("id") Long id) { ... }
```

- GET /members/3 요청 → id에 3이 바인딩됨
- 속성: value (=name), **required (기본값: true)**

---

## @RequestHeader – 요청 헤더

```java
@GetMapping("/test")
public String test(@RequestHeader("User-Agent") String userAgent) { ... }
```

- 요청 헤더 값 추출
- 속성: value (=name), **required (기본값: true)**, defaultValue

---

## @CookieValue – 쿠키 값 추출

```java
@GetMapping("/cookie")
public String cookie(@CookieValue("sessionId") String sessionId) { ... }
```

- 쿠키에서 값 추출
- 속성: value (=name), **required (기본값: true)**, defaultValue

---

## @RequestBody – HTTP 본문 (JSON, XML 등)

```java
@PostMapping("/users")
public String saveUser(@RequestBody UserDto userDto) { ... }
```

- **HTTP 메시지 본문**(바디) 전체를 **객체로 변환** (주로 JSON → 객체)
- Jackson 등 메시지 컨버터를 통해 역직렬화
- 속성: **required (기본값: true)**

---

## ⚠️ required 옵션 사용 시 주의점

위 애노테이션들은 모두 required 옵션을 가지고 있다. 해당 옵션과 파라미터 타입에 따라 다음 두 상황에서 문제가 발생할 수 있다.

요청에 해당 파라미터가 **없는 경우** (예: /api):

1. **문자열 (String):**
   - required = true → **❌** MissingServletRequestParameterException 발생, **400** 에러
   - required = false → ✅ **null** 저장
2. **객체형 (Integer, Long 등):**
   - required = true → **❌** MissingServletRequestParameterException 발생, **400** 에러
   - required = false → ✅ **null** 저장
3. **기본형 (int, long 등):**
   - required = true → **❌** MissingServletRequestParameterException 발생, **400** 에러
   - required = false → **❌ 기본형에 null 저장 불가**, IllegalStateException 발생, **500** 에러 **?**

요청에 해당 파라미터가 있으나 **값이 없는 경우** (예: /api?key=):

1. **문자열 (String):**
   - required = true → ✅ **빈 문자열 ""** 저장 (**⚠️ 주의!**)
   - required = false → ✅ **빈 문자열 ""** 저장
2. **객체형 (Integer, Long 등):**
   - required = true → ❌ MissingServletRequestParameterException 발생, **400** 에러
   - required = false → ✅ **null** 저장
3. **기본형 (int, long 등):**
   - required = true → ❌ MethodArgumentTypeMismatchException 발생, **400** 에러
   - required = false → ❌ MethodArgumentTypeMismatchException 발생, **400** 에러
   - → Failed to convert value of type 'java.lang.String' to required type 'int'; For input string: ""

## ☑️ 결론

- 파라미터는 <strong>항상 객체형(Integer, Long, String 등)</strong>으로 선언
- 예외 처리를 위해 **defaultValue** 속성 사용도 고려 (required = true일 때 ""가 들어와도 defaultValue가 저장됨)
- 내부 로직에서 **null과 빈 문자열 ""을 명확하게 구분**하는 것이 중요!

---

## @ModelAttribute – 커맨드 객체 (폼 데이터 바인딩)

```java
@PostMapping("/form")
public String submit(@ModelAttribute MemberForm form) { ... }
```

- name=value 형식의 파라미터를 객체 필드에 바인딩한다.
- 단, 해당 파라미터 타입은 **setter가 필수로 존재**해야 한다. (내부적으로 DataBinder를 사용하기 때문에)
- 속성: name(=value), **binding**(기본값: true)
  - 바인딩에 실패할 경우 MethodArgumentNotValidException(BindException 상속)이 발생한다.
- @RequestParam과 마찬가지로 **생략이 가능**하다.
  - **단순 타입**일 경우 (String, Long, int 등) → @RequestParam으로 인식
  - **복합 타입**일 경우 (Member 등) → @ModelAttribute로 인식
  - 단, argument resolver로 지정된 타입(HttpServletRequest 등)은 인식하지 않는다.

---

## @RequestPart – multipart/form-data 요청에서 일부 파트 추출

```java
@PostMapping("/upload")
public String upload(@RequestPart("file") MultipartFile file) { ... }
```

- 파일 업로드 및 multipart 요청 처리
- JSON + 파일 같이 받을 때 유용

---

## HttpServletRequest, HttpServletResponse, HttpSession

```java
@GetMapping("/native")
public String nativeApi(HttpServletRequest request,
                        HttpServletResponse response,
                        HttpSession session) { ... }
```

- 서블릿 API에 직접 접근
- 애노테이션 없이도 자동 주입됨

---

## @AuthenticationPrincipal – 보안

```java
@GetMapping("/me")
public String profile(@AuthenticationPrincipal UserDetails user) { ... }
```

- Spring Security 사용 시 인증된 사용자 정보 주입
- 또는 Principal 인터페이스로 기본 정보 받기

---

## BindingResult – 검증 결과 처리

```java
@PostMapping("/form")
public String form(@Valid @ModelAttribute MemberForm form, BindingResult result) { ... }
```

- @Valid나 @Validated와 함께 사용하여 Bean Validation 결과 처리
- 오류 발생 시 예외가 아니라 BindingResult로 바인딩

---

**기타 지원 타입 (Spring이 자동 주입)**

- Locale
- TimeZone
- WebRequest, ServletRequestAttributes
- RedirectAttributes
- **Map&lt;K, V>** (다중 파라미터 저장)
- **MultiValueMap&lt;K, V>** (하나의 키에 여러 값 저장 가능, Map&lt;K, List&lt;V>>를 상속받은 스프링의 자료구조)

> 파라미터의 값이 여러 개일 수 있다면, Map 대신 MultiValueMap을 사용하자.

---

**정리**

|  |  |  |
| --- | --- | --- |
| **애노테이션** | **역할** | **주된 사용 케이스** |
| @RequestParam | 쿼리/폼 파라미터 | 정렬, 필터, 검색 조건 |
| @PathVariable | URL 경로 변수 | 리소스 식별자 |
| @RequestBody | JSON 요청 본문 | REST API |
| @ModelAttribute | 폼 데이터 바인딩 | 웹 폼 입력 처리 |
| @RequestHeader | 요청 헤더 값 | 클라이언트 정보 등 |
| @CookieValue | 쿠키 값 추출 | 인증 세션 등 |
| @RequestPart | multipart 데이터 | 파일 업로드 |
| @AuthenticationPrincipal | 로그인 유저 정보 | 인증된 사용자 식별 |

> 더 알아볼 내용: HandlerMethodArgumentResolver

---

## ⚠️ value (=name) 속성 생략 시 주의점

스프링 부트 3.2부터는 자바 컴파일러에 **-parameters** 옵션을 넣어주어야 다음 주요 애노테이션들의 name 속성을 생략할 수 있다.

```java
@RequestParam, @PathVariable, @Autowired, @ConfigurationProperties
```

명시적으로 이름을 지정하거나, -parameters 옵션을 추가하여 문제를 해결할 수도 있지만, 다음 설정을 통해 간단하게 해결할 수 있다.

```
Settings → Build, Execution, Deployment → Build Tools → Gradle
→ Gradle Projects → Build and Run → Build and run using:
```

해당 옵션을 <strong>"Gradle"</strong>로 설정하면, 코드나 컴파일러 변경 없이 name 속성을 생략할 수 있다.
