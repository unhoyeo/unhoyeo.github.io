---
title: "로그인 처리 – 쿠키, 세션(HttpSession)"
description: "HTTP 프로토콜은 근본적으로 상태가 없는(Stateless) 특성을 가진다. 즉, 서버는 클라이언트의 각 요청을 완전히 독립적인 것으로 취급하며, 이전 요청의 내용을 기억하지 못한다."
pubDate: 2025-08-28T22:55:15+09:00
category: "스프링/MVC"
tags: []
---

HTTP 프로토콜은 근본적으로 **상태가 없는(Stateless)** 특성을 가진다.

즉, 서버는 클라이언트의 각 요청을 완전히 독립적인 것으로 취급하며, 이전 요청의 내용을 기억하지 못한다.

이 특성 때문에 <strong>"로그인 상태 유지"</strong>와 같은 기능은 HTTP만으로는 구현할 수 없다.

사용자가 로그인에 성공한 후 다른 페이지로 이동하면, 서버는 그 사용자가 방금 로그인했던 바로 그 사용자라는 사실을 알지 못한다.

이 문제를 해결하기 위해 클라이언트와 서버 간에 **상태를 유지(Stateful)하기 위한 기술**이 필요하다.

그 중 가장 대표적인 것이 바로 <strong>쿠키(Cookie)</strong>와 <strong>세션(Session)</strong>이다.

---

## 쿠키(Cookie)

쿠키는 서버가 사용자의 **웹 브라우저에 저장하는 작은 데이터 조각**이다.

서버는 HTTP 응답 헤더에 쿠키를 담아 보내고, 브라우저는 이 쿠키를 쿠키 저장소에 저장한다.

그리고 동일한 서버에 요청을 보낼 때마다, 자동으로 모든 요청의 헤더에 쿠키를 포함시켜 전송한다.

쿠키에는 세션 쿠키와 영속 쿠키가 있다.

- **세션 쿠키**
  - **만료 시간을 지정하지 않은** 쿠키
  - 브라우저를 종료하면 사라짐
  - 일반적인 로그인 상태 유지에 사용됨
- **⏳ 영속 쿠키**
  - Max-Age나 Expires 속성을 통해 **만료 시간을 지정한 쿠키**
  - 브라우저를 종료해도 유지됨
  - "로그인 상태 유지" 체크박스 기능 등에 사용됨

---

## 쿠키를 이용한 로그인 처리 흐름

1. **로그인 성공**: 사용자가 ID와 비밀번호로 로그인에 성공한다.
2. **쿠키 생성 및 전송**: 서버는 사용자를 식별할 수 있는 값(예: 회원 ID)을 담은 쿠키를 생성하여 클라이언트(브라우저)로 전송한다.
3. **쿠키 저장**: 브라우저는 응답으로 받은 쿠키를 내부에 저장한다.
4. **요청 시 쿠키 전송**: 이후 사용자가 같은 서버에 요청을 보낼 때마다, 브라우저는 저장된 쿠키를 자동으로 요청에 담아 보낸다.
5. **서버에서 사용자 식별**: 서버는 요청에 담겨 온 쿠키의 값을 읽어 어떤 사용자인지 식별하고, 해당 사용자에게 맞는 데이터를 제공한다.

---

## 쿠키를 이용한 로그인 처리 컨트롤러 예시

```java
@Controller
@RequiredArgsConstructor
public class CookieController {

    private final MemberService memberService;

    @GetMapping("/")
    public String home(
            @CookieValue(name = "memberId", required = false) Long memberId,
            Model model) {

        // 로그인하지 않은 사용자
        if (memberId == null) {
            return "home";
        }

        Member loginMember = memberService.findById(memberId);

        // 쿠키에 담겨있는 memberId로 사용자 조회 실패
        if (loginMember == null) {
            return "home";
        }

        model.addAttribute("member", loginMember);
        return "loginHome";
    }

    @PostMapping("/login")
    public String login(@Valid @ModelAttribute LoginForm form,
                        BindingResult bindingResult,
                        HttpServletResponse response) {

        if (bindingResult.hasErrors()) {
            return "loginForm";
        }

        Member loginMember = memberService.login(form.getLoginId(), form.getPassword());

        // 로그인 실패
        if (loginMember == null) {
            bindingResult.reject("loginFail", "아이디 또는 비밀번호가 맞지 않습니다.");
            return "loginForm";
        }

        // 로그인 성공, 쿠키 생성
        Cookie idCookie = new Cookie("memberId", String.valueOf(loginMember.getId()));
        response.addCookie(idCookie);
        return "redirect:/";
    }

    @PostMapping("/logout")
    public String logout(HttpServletResponse response) {
        // 만료 시간이 0인 쿠키를 생성하여 응답 → 바로 만료됨
        Cookie cookie = new Cookie("memberId", null);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return "redirect:/";
    }
}
```

---

## 쿠키의 치명적인 보안 문제

쿠키만으로 로그인 상태를 관리하는 방식은 간단하지만 다음과 같은 심각한 보안 취약점을 가진다.

- **쿠키 값 위변조**
  - 쿠키는 클라이언트에 저장되므로, 사용자가 브라우저 개발자 도구 등을 이용해 **쿠키의 값을 마음대로 변경**할 수 있음
  - 예를 들어, userId=1 쿠키를 userId=2로 바꾸면 다른 사용자로 위장할 수 있음
- **중요 정보 노출**
  - 쿠키의 값은 **암호화되지 않은 채**로 네트워크를 통해 계속 전송됨
  - 따라서 중간에 탈취될 경우, **사용자의 민감한 정보가 그대로 노출**됨
- **탈취 후 영구 사용**
  - 해커가 쿠키를 한 번 훔치면 **영구적으로 악용**할 수 있음

이러한 쿠키의 보안 문제를 해결하기 위한 대안이 바로 세션이다.

---

## ️ 세션(Session)

세션은 "<strong>중요한 정보는 모두 서버에 저장</strong>하고, 클라이언트와는 <strong>추정 불가능한 임의의 식별자(세션 ID)</strong>로만 연결"하는 것을 의미한다.

즉, 세션은 추정 불가능한 식별자인 **세션 ID와 데이터**를 보관하는 **서버 측 저장소**를 의미하며,

클라이언트와 세션을 유지하기 위해서 **쿠키에 세션 ID를 담아서** 사용한다.

---

## 세션을 이용한 로그인 처리 흐름

1. **로그인 성공**: 사용자가 ID와 비밀번호로 로그인에 성공한다.
2. **세션 생성**: 서버는 임의의 **세션 ID**(UUID 등)를 생성하고, 생성된 **세션 ID와 사용자 정보**를 서버 내의 **세션 저장소**에 저장한다.
3. **세션 ID 쿠키 전송**: 서버는 오직 **세션 ID만을 쿠키에 담아** 클라이언트로 전송한다. (이때 쿠키의 이름은 JSESSIONID)
4. **요청 시 세션 ID 쿠키 전송**: 브라우저는 이후 모든 요청에 **세션 ID가 담긴 쿠키**를 자동으로 포함시켜 전송한다.
5. **서버에서 세션 조회**: 서버는 요청 쿠키에서 세션 ID를 확인하고, **세션 저장소를 조회**하여 저장되어 있던 사용자 정보를 꺼내 사용한다.

---

## ✅ 보안 문제 해결

세션은 쿠키의 보안 취약점을 다음과 같이 해결한다.

- **쿠키 값 위변조 문제**
  - 클라이언트가 가진 쿠키에는 **의미 없는 랜덤 값**(세션 ID)만 있으므로, 위변조가 사실상 불가능
- **중요 정보 노출 문제**
  - 쿠키가 탈취되어도 **중요한 정보는 서버에만 보관**되므로 안전함
- **탈취 후 영구 사용 문제**
  - 서버의 세션 저장소에 저장된 데이터를 삭제함으로써, 세션을 **강제 만료**시킬 수 있음

---

## 세션 직접 구현 예시

```java
@Component
public class SessionManager {

    public static final String SESSION_COOKIE_NAME = "SessionId";

    private final Map<String, Object> sessionStore = new ConcurrentHashMap<>();

    // 세션 생성
    public void createSession(Object value, HttpServletResponse response) {
        // 세션 ID 생성
        String sessionId = UUID.randomUUID().toString();

        // 세션 저장소에 세션 ID와 데이터 저장
        sessionStore.put(sessionId, value);

        // 세션 ID를 담은 쿠키를 응답 헤더에 담음
        Cookie sessionCookie = new Cookie(SESSION_COOKIE_NAME, sessionId);
        response.addCookie(sessionCookie);
    }

    // 세션 조회
    public Object getSession(HttpServletRequest request) {
        // 요청 헤더에서 세션 쿠키를 찾고, 세션 저장소에서 해당 세션 ID의 데이터를 조회
        Cookie sessionCookie = findCookie(request, SESSION_COOKIE_NAME);
        if (sessionCookie == null) return null;
        return sessionStore.get(sessionCookie.getValue());
    }

    // 세션 만료
    public void expireSession(HttpServletRequest request) {
        // 요청 헤더에서 세션 쿠키를 찾고, 세션 저장소에서 해당 세션 ID의 데이터를 삭제
        Cookie sessionCookie = findCookie(request, SESSION_COOKIE_NAME);
        if (sessionCookie != null) {
            sessionStore.remove(sessionCookie.getValue());
        }
    }

    // 세션 쿠키 조회
    private Cookie findCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookie.getName().equals(cookieName))
                .findAny()
                .orElse(null);
    }
}
```

위와 같이 개발자가 직접 세션 관리 로직을 구현할 수도 있지만, 서블릿은 이미 **HttpSession**이라는 표준 인터페이스을 제공한다.

---

## 서블릿이 제공하는 세션 – HttpSession

HttpSession은 **쿠키(JSESSIONID)** 또는 **URL Rewriting**을 통해 클라이언트와 연결된다.

보통은 JSESSIONID라는 이름의 쿠키를 통해 클라이언트를 구분한다.

HttpSession은 클라이언트 요청 시 **HttpServletRequest**의 **getSession()** 메서드로 **생성**하거나, **조회**할 수 있다.

```java
HttpSession getSession(boolean create);
HttpSession getSession();
```

- **getSession(true), getSession()**: 세션이 있으면 기존 세션을, **없으면 새로 생성**해서 반환
- <strong>getSession(false)</strong>: 세션이 있으면 기존 세션을, 없으면 <strong>null</strong> 반환 → <strong>세션 존재 여부(사용자 로그인 여부)</strong>를 확인할 때 사용

```java
HttpSession session = request.getSession(false);
if (session == null) {
    // 로그인하지 않은 사용자
}
```

HttpSession에 데이터를 저장할 때는 **setAttribute(String name, Object value)** 메서드를 이용한다.

```java
HttpSession session = request.getSession();
session.setAttribute("loginMember", loginMember); // 세션에 회원 정보 보관
```

HttpSession에 저장한 데이터를 조회할 때는 **getAttribute(String name)** 메서드를 이용한다.

```java
Member loginMember = (Member) session.getAttribute("loginMember"); // Object 타입이므로 캐스팅
if (loginMember == null) {
    // 세션에 해당 데이터가 없음
}
```

HttpSession을 삭제할 때는 **invalidate()** 메서드를 이용한다.

```java
HttpSession session = request.getSession(false);
if (session != null) {
    session.invalidate(); // 세션 삭제
}
```

---

## 스프링이 지원하는 세션 – @SessionAttribute

스프링은 @SessionAttribute 애노테이션을 제공하여 HttpSession을 더욱 편리하게 사용할 수 있도록 지원한다.

이 애노테이션을 사용하면 HttpServletRequest를 직접 다루지 않고도, **세션에 저장한 데이터를 파라미터로 바로 조회**할 수 있다.

```java
@GetMapping("/profile")
public String profile(
        @SessionAttribute(name = "loginMember", required = false) Member loginMember) {

    // 세션 데이터 없음 = 로그인하지 않은 사용자
    if (loginMember == null) {
        ...
    }

    // 세션 데이터 있음 = 로그인한 사용자
    ...
}
```

---

## 세션을 이용한 로그인 처리 컨트롤러 예시

```java
@Controller
@RequiredArgsConstructor
public class Controller {

    private final MemberService memberService;

    @GetMapping("/")
    public String home(
            @SessionAttribute(name = "loginMember", required = false) Member loginMember,
            Model model) {

        // 로그인하지 않은 사용자
        if (loginMember == null) {
            return "home";
        }
        // 로그인한 사용자
        model.addAttribute("member", loginMember);
        return "loginHome";
    }

    @PostMapping("/login")
    public String login(@Valid @ModelAttribute LoginForm form,
                        BindingResult bindingResult,
                        HttpServletRequest request) {

        if (bindingResult.hasErrors()) {
            return "loginForm";
        }

        Member loginMember = memberService.login(form.getLoginId(), form.getPassword());

        // 로그인 실패
        if (loginMember == null) {
            bindingResult.reject("loginFail", "아이디 또는 비밀번호가 맞지 않습니다.");
            return "loginForm";
        }

        // 로그인 성공, 세션 생성
        HttpSession session = request.getSession();
        session.setAttribute("loginMember", loginMember);
        return "redirect:/";
    }

    @PostMapping("/logout")
    public String logout(HttpServletRequest request) {
        // 세션이 있으면 삭제
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return "redirect:/";
    }
}
```

---

## 세션의 문제점

세션은 사용자가 로그아웃 버튼을 눌러서 명시적으로 <strong>session.invalidate()</strong>가 호출되어야 비로소 삭제된다.

그러나 대부분의 사용자는 로그아웃 버튼을 누르지 않고 **바로 브라우저를 종료**한다.

HTTP는 비연셜성이기 때문에 서버는 사용자가 브라우저를 종료했다는 사실을 모른다.

따라서 **세션을 무한정 보관**하게 되며, 다음과 같은 문제가 발생한다.

- **탈취 위험**: 세션 ID를 담은 쿠키가 탈취될 경우, 계속해서 해당 쿠키로 악의적인 요청을 할 수 있음
- **메모리 낭비**: 세션은 기본적으로 메모리에 생성되기 때문에, 꼭 필요한 경우에만 생성해야 함

이 때문에 세션이 서버 메모리에 계속 쌓이는 것을 방지하기 위해 **타임아웃**이라는 기능이 존재한다.

---

## ⛔️ 세션 타임아웃

HttpSession은 기본적으로 **최근 서버 접근 시간**(lastAccessedTime)을 기준으로, **일정 시간**(기본 30분) 동안 추가적인 요청이 없으면, 해당 세션을 자동으로 삭제한다.

이 시간은 application.properties에서 **server.servlet.session.timeout**으로 설정할 수 있다. (60초 단위)

또한, **세션마다 개별적으로** 만료 시간을 설정하려면 다음 메서드를 이용하면 된다.

```java
session.setMaxInactiveInterval(1800); // 초 단위 (30분)
```

---

**⚠️ 로그인 후 404 오류 – URL에 ;jsessionid=...**

처음으로 로그인을 시도할 때, URL에 다음과 같이 jsessionid를 포함하면서 404 오류가 발생한다.

```bash
http://localhost:8080/;jsessionid=6C7ED226A9EE64EDDD33AD869700F954
```

이는 웹 브라우저가 쿠키를 지원하지 않을 때, 쿠키 대신 URL을 통해서 세션을 유지하기 위한 기능이다.

서버 입장에서는 브라우저가 쿠키를 지원하는지 처음에는 모르기 때문에 **쿠키와 URL을 모두 이용**해서 jsessionid를 전달한다.

하지만 스프링의 **URL 매핑 전략**이 변경됨에 따라, 현재는 컨트롤러를 찾지 못하고 404 오류가 발생한다.

따라서 application.properties 파일에 다음과 같은 설정을 추가해야 한다.

```java
// application.properties
spring.mvc.pathmatch.matching-strategy=ant_path_matcher  // URL, 쿠키 모두 사용
server.servlet.session.tracking-modes=cookie             // 쿠키만 사용
```
