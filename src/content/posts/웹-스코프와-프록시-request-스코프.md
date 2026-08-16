---
title: "웹 스코프와 프록시 - request 스코프"
description: "웹 스코프의 특징 웹 환경에서만 동작한다. 프로토타입 스코프와 다르게 스프링이 해당 스코프의 종료 시점까지 관리한다. 따라서 종료 메서드가 호출된다."
pubDate: 2025-02-13T20:55:50+09:00
category: "스프링/기본"
tags: []
---

웹 스코프의 특징

- **웹 환경**에서만 동작한다.
- 프로토타입 스코프와 다르게 스프링이 **해당 스코프의 종료 시점까지** 관리한다. 따라서 **종료 메서드**가 호출된다.

웹 스코프 종류

- **request** : **HTTP 요청 하나가 들어오고 나갈 때까지 유지**되는 스코프, 각각의 요청마다 별도의 빈 인스턴스가 생성되고 관리된다.
- **session** : HTTP Session과 동일한 생명주기를 가지는 스코프
- **application** : 서블릿 컨텍스트(ServletContext)와 동일한 생명주기를 가지는 스코프
- **websocket** : 웹 소켓과 동일한 생명주기를 가지는 스코프

request 스코프를 예제로 알아보자. 나머지도 범위만 다르지 동작 방식은 비슷하다.

---

서버에 동시에 여러 HTTP 요청이 오면 해당 로그가 정확히 어떤 요청이 남긴 로그인지 구분하기 어렵다.

이럴 때 사용하기 딱 좋은 것이 바로 request 스코프이다.

다음과 같은 형태로 로그가 남도록 request 스코프를 활용해서 개발해 보자.

> [UUID][requestURL]{message}

- UUID를 통해 HTTP 요청을 구분
- requestURL을 통해 어떤 URL을 요청해서 남은 로그인지 확인

```java
@Component
@Scope(value = "request")
public class MyLogger {

    private String uuid;
    private String requestURL;

    @PostConstruct
    public void init() {
        this.uuid = UUID.randomUUID().toString();
        System.out.println("[" + uuid + "] request scope bean created: " + this);
    }

    @PreDestroy
    public void close() {
        System.out.println("[" + uuid + "] request scope bean closed: " + this);
    }

    public void log(String message) {
        System.out.println("[" + uuid + "][" + requestURL + "]" + message);
    }

    public void setRequestURL(String requestURL) {
        this.requestURL = requestURL;
    }
}
```

- 로그를 출력하기 위한 request 스코프 빈이다.
- 빈이 생성되는 시점에(HTTP 요청이 들어올 때) 초기화 메서드를 통해 UUID를 생성해서 필드에 저장하고 생성 메시지를 남긴다.
- 이 빈은 HTTP 요청 당 하나씩 생성되므로, **UUID를 통해 다른 HTTP 요청과 구분할 수 있다.**
- 빈이 소멸되는 시점에(HTTP 요청이 끝날 때) 종료 메서드를 통해 종료 메시지를 남긴다.
- requestURL은 빈의 생성 시점에는 알 수 없으므로, 외부에서 setter로 입력받는다.

```java
@Controller
@RequiredArgsConstructor
public class MyLogController {

    private final MyLogService myLogService;
    private final MyLogger myLogger;

    @RequestMapping("log-demo")
    @ResponseBody
    public String logDemo(HttpServletRequest request) {
        String requestURL = request.getRequestURL().toString();

        myLogger.setRequestURL(requestURL);
        myLogger.log("controller test");

        myLogService.logic("testId");

        return "OK";
    }
}
```

- 로거가 잘 작동하는지 확인하는 테스트용 컨트롤러다.
- **HttpServletRequest**를 통해 **requestURL**을 받아서 myLogger에 저장해 둔다.
- "controller test"라는 로그를 남기고 서비스의 로직을 실행한다.

> requestURL을 MyLogger에 저장하는 부분은 공통 처리가 가능한 **스프링 인터셉터**나 **서블릿 필터** 등을 활용하는 것이 좋다.

```java
@Service
@RequiredArgsConstructor
public class MyLogService {

    private final MyLogger myLogger;

    public void logic(String id) {
        myLogger.log("service id = " + id);
    }
}
```

## 여기서 중요한 점!

- request 스코프를 사용하지 않고, 파라미터로 이 모든 정보를 서비스 계층에 넘긴다면 파라미터가 너무 많아서 지저분해진다.
- 더 큰 문제는 requestURL과 같은 **웹 관련 정보**가 웹과 관련 없는**서비스 계층까지 넘어가게 된다.**
- **웹과 관련된 부분**은 **컨트롤러까지만** 사용해야 한다!
- 서비스 계층은 웹 기술에 종속되지 않고, 가급적 순수하게 유지하는 것이 유지보수 관점에서 좋다.

> **request 스코프**인 MyLogger의 **멤버 변수**에 **웹 관련 정보**를 저장함으로써 해당 정보를 **파라미터로 넘기지 않고**, 코드와 계층을 깔끔하게 유지할 수 있다.

이제 스프링 애플리케이션을 실행해 보면 기대와는 다르게 다음과 같은 오류가 발생한다.

> Error creating bean with name 'myLogger': Scope 'request' is not active for the current thread; consider defining a scoped proxy for this bean if you intend to refer to it from a singleton;

이는 스프링 애플리케이션을 실행하는 시점에 싱글톤 빈은 바로 생성해서 주입이 가능하지만, request 빈은 아직 생성되지 않기 때문이다.

## request 스코프 빈은 실제 HTTP 요청이 와야 생성할 수 있다!

이를 해결하기 위한 2가지 방법이 존재한다.

---

## 1. ObjectProvider 사용

```java
@Controller
@RequiredArgsConstructor
public class MyLogController {

    private final MyLogService myLogService;
    private final ObjectProvider<MyLogger> myLoggerProvider;

    @RequestMapping("log-demo")
    @ResponseBody
    public String logDemo(HttpServletRequest request) {
        String requestURL = request.getRequestURL().toString();

        MyLogger myLogger = myLoggerProvider.getObject();
        myLogger.setRequestURL(requestURL);
        myLogger.log("controller test");

        myLogService.logic("testId");

        return "OK";
    }
}

@Service
@RequiredArgsConstructor
public class MyLogService {

    private final ObjectProvider<MyLogger> myLoggerProvider;

    public void logic(String id) {
        MyLogger myLogger = myLoggerProvider.getObject();
        myLogger.log("service id = " + id);
    }
}
```

실행해보면 정상적으로 결과가 나온다.

> [72067742-e5af-42d5-9a7c-a5291606c4fb] request scope bean created: com.spring.MyLogger@1bebd2e9
> [72067742-e5af-42d5-9a7c-a5291606c4fb][http://localhost:8080/log-demo]controller test
> [72067742-e5af-42d5-9a7c-a5291606c4fb][http://localhost:8080/log-demo]service id = testId
> [72067742-e5af-42d5-9a7c-a5291606c4fb] request scope bean closed: com.spring.MyLogger@1bebd2e9

- ObjectProvider.getObject()를 호출하는 시점까지 **request 스코프 빈의 생성(호출)을 지연**해서 해결하는 방법이다.
- 해당 메서드를 호출하는 시점에는 HTTP 요청이 진행 중이므로 request 스코프 빈이 정상적으로 생성된다.
- 또한, 컨트롤러와 서비스에서 각각 한 번씩 따로 호출해도 **같은 HTTP 요청이면 같은 스프링 빈이 반환된다.**

---

## 2. @Scope의 proxyMode 속성 사용

```java
@Component
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class MyLogger { ... }
// 적용 대상이 클래스면 TARGET_CLASS
// 적용 대상이 인터페이스면 INTERFACES
```

- 이렇게 하면 스프링 컨테이너는 CGLIB 바이트코드 조작 라이브러리를 통해 MyLogger를 상속받은 가짜 프록시 객체를 생성한다.
- 그리고 스프링 컨테이너에 "myLogger"라는 이름으로 **진짜 대신에 가짜 프록시 객체를 등록한다.**
- 따라서 ac.getBean("myLogger", MyLogger.class)로 조회해도 가짜 프록시 객체가 조회된다.
- 또한 의존관계 주입도 이 가짜 프록시 객체가 주입된다.

**가짜 프록시 객체는 실제 myLogger의 기능을 호출하는 시점에 내부에서 진짜 빈을 요청하는 위임 로직이 들어있다.**

- 가짜 프록시 객체는 내부에 진짜 myLogger를 찾는 방법을 알고 있다.
- 클라이언트가 myLogger.log()를 호출하면 사실은 가짜 프록시 객체의 메서드를 호출한 것이다.
- 실제로는 가짜 프록시 객체가 진짜 myLogger를 스프링 컨테이너에서 찾아서 myLogger.log()를 호출해준다.

> 가짜 프록시 객체는 원본 클래스를 상속받아서 만들어졌기 때문에 이 객체를 사용하는 클라이언트 입장에서는 **진짜인지 가짜인지도 모르게 동일하게 사용할 수 있다. (다형성)**

## 정리

- CGLIB 라이브러리로 내 클래스를 상속받은 가짜 프록시 객체를 만들어서 주입한다.
- 이 가짜 프록시 객체는 실제 요청이 오면 그때 내부에서 실제 빈을 요청하는 위임 로직이 들어있다.
- 가짜 프록시 객체는 **실제로는 request 스코프와 관계가 없다.**
- 내부에 단순한 위임 로직만 있고, **싱글톤처럼 동작한다.**
- 이 프록시 객체 덕분에 클라이언트는 마치 싱글톤 빈을 사용하듯이 편리하게 request 스코프를 사용할 수 있다.
- 사실 Provider를 사용하든, 프록시를 사용하든 핵심 아이디어는 **진짜 객체 조회를 꼭 필요한 시점까지 지연처리한다는 점이다.**
- 단지 애노테이션 속성 변경만으로 원본 객체를 프록시 객체로 대체할 수 있다는 점이 바로 다형성과 DI 컨테이너가 가진 큰 강점이다.
- **웹 스코프가 아니어도 프록시를 사용할 수 있다.**

> **주의점!**

- **마치 싱글톤을 사용하는 것 같지만 다르게 동작하기 때문에 주의해서 사용해야 한다.**
- 이런 특별한 scope는 꼭 필요한 곳에만 최소화해서 사용해야 한다.
- 무분별하게 사용하면 유지보수하기 어려워진다.
