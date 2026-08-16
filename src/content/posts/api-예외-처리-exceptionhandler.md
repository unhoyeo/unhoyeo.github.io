---
title: "API 예외 처리 – @ExceptionHandler"
pubDate: 2025-09-06T01:02:57+09:00
category: "스프링/MVC"
tags: ["예외 처리", "서블릿"]
---

## HTML 오류 페이지의 한계

서블릿 오류 페이지 매핑이나 스프링 부트의 BasicErrorController를 사용하는 방식은 HTML 오류 화면을 제공하는 데는 훌륭하다.

하지만 API는 기계(클라이언트)와 통신하는 것을 전제로 하므로, 예외가 발생했을 때 단순히 오류 화면을 반환하는 것은 적절하지 않다.

대신, API 클라이언트가 이해하고 처리할 수 있도록 **미리 약속된 형식의 JSON 오류 메시지**와 명확한 HTTP 상태 코드를 반환해야 한다.

---

## 기존 서블릿 컨테이너의 예외 처리 메커니즘을 이용

WAS에 <strong>예외가 전파</strong>되거나, <strong>response.sendError(statusCode, message)</strong>를 통해 오류가 전달되면,

해당 오류에 대해 등록된 오류 페이지가 있는지 확인한다.

```java
@Component
public class WebServerCustomizer implements
        WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

    @Override
    public void customize(ConfigurableWebServerFactory factory) {
        // 404 오류 발생 시 /error-page/404 경로로 요청
        ErrorPage errorPage404 = new ErrorPage(
                HttpStatus.NOT_FOUND, // status
                "/error-page/404"     // path
        );

        // 500 오류 발생 시 /error-page/500 경로로 요청
        ErrorPage errorPage500 = new ErrorPage(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "/error-page/500"
        );

        // RuntimeException(또는 그 자식 타입) 발생 시 /error-page/500 경로로 요청
        ErrorPage errorPageEx = new ErrorPage(
                RuntimeException.class, // exception
                "/error-page/500"       // path
        );

        factory.addErrorPages(errorPage404, errorPage500, errorPageEx);
    }
}
```

위와 같은 경우, 404 오류는 /error-page/404, 500 오류와 RuntimeException 및 하위 예외들은 /error-page/500 경로로 요청이 발생한다. 따라서 컨트롤러에서 해당 경로의 요청을 받아서 일반 사용자는 HTML 오류 페이지를, API는 JSON 응답을 보내주면 된다.

```java
@Controller
public class ErrorPageController {

    // 오류 페이지 처리
    @RequestMapping("/error-page/500")
    public String ep500() {
        return "error-page/500";
    }

    // API 오류 처리
    @RequestMapping(
            value = "/error-page/500",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> errorApi500(HttpServletRequest request) {
        log.error("errorApi500");
        // request에 담긴 오류 정보를 꺼내어 예외 처리 가능
        Integer statusCode = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String message = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);

        // JSON 응답 바디에 담을 데이터
        Map<String, Object> data = new HashMap<>();
        data.put("status", statusCode);
        data.put("message", message);

        return new ResponseEntity<>(data, HttpStatusCode.valueOf(statusCode));
    }
}
```

## produces = MediaType.APPLICATION\_JSON\_VALUE

- 요청 시 Accept 헤더가 application/json인 경우 errorApi500() 메서드가 호출된다.
- 즉, 클라이언트가 받고 싶은 미디어 타입이 JSON인 경우 호출된다.

따라서 요청 시 Accept 헤더가 application/json이 아니면 <strong>오류 페이지(HTML)</strong>를 받을 수 있고,

Accept 헤더가 application/json이면 다음과 같은 **JSON 응답**을 받을 수 있다.

```javascript
{
    "status": 500,
    "message": "500 에러 발생"
}
```

---

## 스프링 부트(BasicErrorController)의 예외 처리 메커니즘을 이용

스프링 부트가 자동으로 등록하는 **BasicErrorController**의 내부 코드를 보면 다음과 같다.

```java
@Controller
@RequestMapping("${server.error.path:${error.path:/error}}")
public class BasicErrorController extends AbstractErrorController {
    ...

    @RequestMapping(produces = MediaType.TEXT_HTML_VALUE)
    public ModelAndView errorHtml(HttpServletRequest request, HttpServletResponse response) {
        HttpStatus status = getStatus(request);
        Map<String, Object> model = Collections
            .unmodifiableMap(getErrorAttributes(request, getErrorAttributeOptions(request, MediaType.TEXT_HTML)));
        response.setStatus(status.value());
        ModelAndView modelAndView = resolveErrorView(request, response, status, model);
        return (modelAndView != null) ? modelAndView : new ModelAndView("error", model);
    }

    @RequestMapping
    public ResponseEntity<Map<String, Object>> error(HttpServletRequest request) {
        HttpStatus status = getStatus(request);
        if (status == HttpStatus.NO_CONTENT) {
            return new ResponseEntity<>(status);
        }
        Map<String, Object> body = getErrorAttributes(request, getErrorAttributeOptions(request, MediaType.ALL));
        return new ResponseEntity<>(body, status);
    }
    ...
}
```

**/error** 경로를 처리하는 다음 두 메서드를 확인할 수 있다.

- **errorHtml()**:
  - produces = MediaType.TEXT\_HTML\_VALUE
  - 클라이언트 요청의 Accept 해더 값이 text/html 인 경우에 호출되어, ModelAndView를 반환함
- **error()**:
  - 그 외 모든 경우에 호출되어, ResponseEntity를 반환함

따라서 WebServerCustomizer 코드를 주석 처리하고, 요청 시 Accept 헤더가 text/html이면 오류 페이지(HTML)를 받을 수 있고,

Accept 헤더가 text/html이 아니면 다음과 같은 JSON 응답을 받을 수 있다.

```javascript
{
    "timestamp": "2025-09-05T12:28:16.059+00:00",
    "status": 500,
    "error": "Internal Server Error",
    "path": "/500"
}
```

---

## 위 방식들의 한계

위 방식들은 실무적인 API 예외 처리에서는 다음과 같은 한계에 부딪힌다.

- **고정된 응답 형식**: BasicErrorController가 반환하는 JSON 응답 형식은 고정되어 있다. API마다, 심지어 같은 API 내의 오류 종류마다 다른 응답 형식을 원할 수 있는데 이를 만족시키기 어렵다.
- **복잡한 구현**: 이 방식을 커스터마이징하려면 BasicErrorController를 확장하는 등 복잡한 과정이 필요하며, 이는 API 예외 처리를 위한 최선의 방법이 아니다.

따라서 위 방식들은 HTML 오류 페이지를 처리할 때 사용하고, API 예외 처리는 다른 방식으로 처리해야 한다.

---

## 스프링의 예외 처리 전략: HandlerExceptionResolver

컨트롤러(핸들러)에서 예외가 발생하여 서블릿 컨테이너까지 전파되면 기본적으로 500 오류로 처리된다.

하지만 **예외 타입에 따라 다른 상태 코드**로 처리하고 싶을 수 있다. (예: IllegalArgumentException → 400 오류)

이를 위해 스프링은 전파되는 예외를 중간에 가로채서 다른 방식으로 처리할 수 있는 **HandlerExceptionResolver**를 제공한다.

---

## HandlerExceptionResolver 인터페이스

```java
public interface HandlerExceptionResolver {

    @Nullable
    ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response,
                                  @Nullable Object handler, Exception ex);
}
```

## 예외 처리 흐름

1. 컨트롤러에서 예외 발생 → DispatcherServlet이 예외를 감지
2. DispatcherServlet은 등록된 ExceptionResolver들을 순서대로 호출하며, 이 예외를 처리할 수 있는지 확인
   - 해당 ExceptionResolver가 처리할 수 없어 null이 반환되면, 다음 ExceptionResolver가 호출됨
3. ExceptionResolver가 예외를 처리하여 ModelAndView 객체를 반환하면, **예외 흐름은 거기서 정상적인 흐름으로 종결됨**
   - 즉, WAS 입장에서는 예외가 발생하지 않고 "정상 처리"된 것처럼 보이게 됨
   - 만약 처리할 수 있는 ExceptionResolver가 없어 null이 반환되면, 다음 ExceptionResolver가 호출됨
4. 만약 아무도 처리하지 못하면, 예외는 서블릿 컨테이너(WAS)로 전달됨

```java
WAS(예외 처리 시 정상 응답!✅) ← DispatcherServlet(예외 감지!?) ← 컨트롤러(예외 발생!?)

                  (예외 처리 가능?) ↓ ↑ (처리 가능: ModelAndView, 처리 불가능: null)

                          ExceptionResolver
```

> ExceptionResolver로 예외를 처리해도, 인터셉터의 postHandle()은 호출되지 않는다.

이 메커니즘 덕분에, 예외를 API 응답에 맞는 JSON 데이터와 적절한 HTTP 상태 코드로 변환하여 응답하는 것이 가능해진다.

---

## HandlerExceptionResolver 반환 값에 따른 동작 방식

- **빈 ModelAndView**:
  - return new ModelAndView();
  - 뷰를 렌더링하지 않고, 정상 흐름으로 서블릿이 리턴된다.
- **ModelAndView 지정**:
  - ModelAndView에 View, Model 등의 정보를 지정해서 반환하면 뷰를 렌더링한다.
- **null**:
  - 다음 ExceptionResolver를 찾아서 호출한다.
  - 만약 처리할 수 있는 ExceptionResolver가 없으면, 기존에 발생한 예외를 서블릿 밖(WAS)으로 던진다.

---

## HandlerExceptionResolver 활용

1. **예외 상태 코드 변환**
   - 예외를 response.sendError() 호출로 변경하여, 서블릿에서 상태 코드에 따른 오류를 처리하도록 위임
   - 이후 WAS는 서블릿 오류 페이지를 찾아서 내부 호출 (예: /error)
2. **뷰 템플릿 처리**
   - ModelAndView에 데이터를 담아, 예외에 따른 새로운 오류 화면을 렌더링하여 사용자에게 제공
3. **API 응답 처리**
   - response.getWriter()를 통해 데이터를 직접 HTTP 응답 바디에 담음
   - 여기서 JSON으로 응답 시 API 예외 처리 가능

---

## HandlerExceptionResolver 활용 예시

1번을 응용하여 IllegalArgumentException을 **400 오류**로 처리하는 ExceptionResolver를 구현해 보자.

```java
public class MyHandlerExceptionResolver implements HandlerExceptionResolver {
    @Override
    public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response,
                                         Object handler, Exception ex) {
        try {
            if (ex instanceof IllegalArgumentException) {
                // 400(Bad Request) 오류로 처리
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, ex.getMessage());

                // 정상적으로 처리된 경우 ModelAndView 객체 반환
                return new ModelAndView();
            }
        } catch (IOException e) {
            // 오류 발생
        }
        return null; // 처리할 수 없으면 null 반환
    }
}
```

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void extendHandlerExceptionResolvers(List<HandlerExceptionResolver> resolvers) {
        resolvers.add(new MyHandlerExceptionResolver());
    }
}
```

이제 500이 아닌 400 오류를 응답하지만, 예외를 response.sendError()로 바꾸어 /error 요청을 다시 보내는 과정은 너무 복잡하다.

2번과 3번을 응용하여 **ExceptionResolver 내부에서 응답**까지 처리하도록 변경해 보자.

```java
public class MyHandlerExceptionResolver implements HandlerExceptionResolver {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response,
                                         Object handler, Exception ex) {
        try {
            if (ex instanceof IllegalArgumentException) {
                // 400(Bad Request) 오류로 처리
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

                // Accept 헤더
                String acceptHeader = request.getHeader(HttpHeaders.ACCEPT);

                // Accept 헤더가 application/json인 경우
                if (acceptHeader.equals(MediaType.APPLICATION_JSON_VALUE)) {
                    // JSON 응답에 담을 데이터
                    Map<String, Object> data = new HashMap<>();
                    data.put("exception", ex.getClass());
                    data.put("message", ex.getMessage());

                    String json = objectMapper.writeValueAsString(data);

                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("utf-8");
                    response.getWriter().write(json);

                    // 처리 가능: 빈 ModelAndView 객체 반환 (정상 응답)
                    return new ModelAndView();
                }

                // Accept 헤더가 application/json이 아닌 경우
                // 처리 가능: ModelAndView 객체 반환 (뷰 렌더링)
                return new ModelAndView("error/400");
            }
        } catch (IOException e) {
            // 오류 발생
        }
        return null; // 처리 불가능: null 반환
    }
}
```

요청의 Accept 헤더가 application/json이면 JSON으로 응답하고, 그 외에는 error/400.html을 렌더링하여 보여주게 된다.

---

## 스프링이 제공하는 기본 ExceptionResolver

스프링 부트는 기본적으로 세 가지 ExceptionResolver를 우선순위에 따라 등록한다.

1. **ExceptionHandlerExceptionResolver** (가장 높은 우선순위)
2. **ResponseStatusExceptionResolver**
3. **DefaultHandlerExceptionResolver** (가장 낮은 우선순위)

---

## ExceptionHandlerExceptionResolver (가장 중요)

스프링은 복잡한 ExceptionResolver를 직접 구현하는 대신,

**@ExceptionHandler** 애노테이션 기반으로 매우 편리하게 예외를 처리할 수 있는 기능을 제공한다.

이 리졸버가 바로 @ExceptionHandler 애노테이션을 처리하는 리졸버로, **API 예외 처리의 핵심**이다.

가장 우선순위가 높으며, 실무에서 대부분의 API 예외는 이 리졸버를 통해 처리한다.

컨트롤러 내부에 특정 예외를 처리하는 메서드를 만들고, @ExceptionHandler 애노테이션을 붙여서 사용한다.

```java
@RestController
public class ApiExceptionController {

    // value에 처리할 예외 지정
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgumentException(IllegalArgumentException e) {
        return new ErrorResponse("IllegalArgumentException", e.getMessage());
    }

    // value 생략 시 파라미터의 예외가 지정됨
    @ExceptionHandler
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException e) {
        ErrorResponse errorResponse = new ErrorResponse("CustomException", e.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    ...

    @Data
    @AllArgsConstructor
    static class ErrorResponse {
        String code;
        String message;
    }
}
```

해당 메서드는 <strong>지정된 예외(또는 그 자식 예외)</strong>가 발생했을 때만 호출된다.

메서드의 파라미터나 반환 타입이 일반 컨트롤러처럼 유연하기 때문에 상태 코드, 헤더, 본문을 완벽하게 제어할 수 있다. ([자세한 내용](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html#mvc-ann-exceptionhandler-args))

---

## ResponseStatusExceptionResolver

예외에 따라 HTTP 상태 코드를 지정해 주는 단순하고 직관적인 리졸버다.

예외 클래스에 **@ResponseStatus** 애노테이션을 붙이면, 해당 예외 발생 시 지정된 상태 코드와 메시지로 응답하게 된다.

```java
@ResponseStatus(code = HttpStatus.BAD_REQUEST, reason = "잘못된 요청 오류")
public class BadRequestException extends RuntimeException { ... }
```

코드 수정이 불가능한 라이브러리의 예외를 처리하거나, 동적으로 상태 코드를 변경해야 하는 경우에는

**ResponseStatusException** 예외를 발생시켜 사용하면 된다.

```java
throw new ResponseStatusException(
        HttpStatus.NOT_FOUND, // status
        "잘못된 요청 오류", // reason
        new IllegalArgumentException() // cause
);
```

이 Resolver는 내부적으로 response.sendError()를 호출하므로, 결국 서블릿의 /error 경로를 다시 요청하는 방식으로 동작한다.

---

## DefaultHandlerExceptionResolver

**스프링 내부에서 발생하는 예외**들을 처리한다.

예를 들어, 요청 파라미터 바인딩 시 타입이 맞지 않아 발생하는 TypeMismatchException은 클라이언트의 잘못된 요청이므로,

500 오류가 아닌 **400(Bad Request)** 오류로 변환해 준다.

이 Resolver 또한 내부적으로 response.sendError()를 호출한다.

---

## 최상의 해결책: @ExceptionHandler + @ControllerAdvice

@ExceptionHandler를 각 컨트롤러마다 작성하면 중복 코드가 발생한다.

또한 정상 처리 로직과 예외 처리 로직이 혼재되어 있다는 문제도 존재한다.

이때 @ControllerAdvice를 사용하면 이러한 예외 처리 로직을 여러 컨트롤러에 걸쳐 전역적으로 적용할 수 있게 해준다.

- **@ControllerAdvice**: 여러 컨트롤러에 대한 전역적인 예외 처리, @InitBinder 등의 설정을 모아두는 클래스에 부여
- **@RestControllerAdvice**: @ControllerAdvice에 @ResponseBody 기능이 추가된 것으로, 별도의 설정 없이 반환 객체를 바로 JSON으로 변환해 주므로, API 예외 처리에 특히 유용함

```java
@RestControllerAdvice
public class GlobalExceptionAdvice {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgumentException(IllegalArgumentException e) {
        return new ErrorResponse("IllegalArgumentException", e.getMessage());
    }

    @ExceptionHandler
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException e) {
        ErrorResponse errorResponse = new ErrorResponse("CustomException", e.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}
```

@ExceptionHandler와 @RestControllerAdvice를 조합하면, 컨트롤러는 순수한 비즈니스 로직에만 집중하고,

모든 예외 처리는 별도의 @RestControllerAdvice 클래스에서 일관되게 관리할 수 있어 **관심사의 분리**를 완벽하게 달성할 수 있다.
