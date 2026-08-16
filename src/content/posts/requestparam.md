---
title: "@RequestParam"
pubDate: 2025-07-29T19:54:20+09:00
category: "스프링/MVC"
tags: ["타입 변환"]
---

**@RequestParam이란?**

스프링 MVC에서 **HTTP 요청 파라미터**를 핸들러 메서드의 파라미터에 바인딩할 때 사용하는 애노테이션이다.

요청 파라미터는 아래 두 가지 방식으로 전달된다.

- **쿼리 파라미터**: GET /search?q=spring
- **폼 데이터**: POST 요청에서 application/x-www-form-urlencoded 타입으로 전달

쿼리 파라미터와 폼 데이터가 모두 요청 파라미터로 인식될 수 있는 이유는
서블릿 API가 이들을 모두 ServletRequest.getParameter() 기반으로 통합해서 조회할 수 있도록 설계되어 있기 때문이다.

@RequestParam은 주로 GET 요청에서 검색어, 필터, 정렬 등과, POST 요청에서 로그인 정보, 폼 입력 데이터 등을 받아올 때 유용하다.

예시: GET /search?q=spring

```java
@GetMapping("/search")
public String search(@RequestParam("q") String query) { ... }
```

query에 "spring"이 바인딩 된다.

---

**왜 중요한가?**

- **HTTP 요청의 핵심 인터페이스**: 대부분의 웹 요청은 파라미터 기반으로 동작 (검색어, 필터, 정렬 옵션 등)
- **자동 타입 변환**: 문자열로 들어온 값을 숫자, 날짜, Enum 등으로 자동 변환
- **유효성 검증 연계**: 이후 @Valid, BindingResult 등과 통합하여 검증 가능
- **API 명시성 향상**: 명시적인 요청 처리 구조 덕분에 Swagger 문서화 시에도 유리

---

**속성 정리**

|  |  |
| --- | --- |
| **속성명** | **설명** |
| value (=name) | 바인딩할 요청 파라미터의 이름 (생략 시 변수명과 동일하게 처리됨) |
| required | 파라미터의 필수 여부 (기본값: true) |
| defaultValue | 파라미터가 없거나 빈 문자열일 때 사용할 기본값 (지정 시 required = false로 간주됨) |

**⚠️ 주의점** (자세한 내용은 [여기서](/posts/애노테이션-기반-컨트롤러의-주요-파라미터-바인딩-required-옵션-주의점-value/))

- 변수 타입이 **String**이고, 파라미터가 빈 문자열일 경우:
  - required 여부에 상관 없이 빈 문자열 ""이 바인딩됨 (예외 발생X)
- 변수 타입이 <strong>기본형(int, long 등)</strong>이고, 파라미터가 없거나 빈 문자열일 경우:
  - required 여부에 상관 없이 예외 발생

따라서 요청 파라미터가 **없는 경우**(/api)와 **빈 문자열인 경우**(/api?value=)를 잘 구분해서 예외 처리를 해야 한다.

- defaultValue 속성을 통해 파라미터가 없거나 빈 문자열일 경우 이를 대체할 기본값을 설정할 수 있다.
- 객체형 타입은 null 체크, String 타입은 **StringUtils.hasText()** 메서드를 통해 예외를 처리할 수 있다.
- 기본형 타입은 그 어떤 경우에도 예외가 발생하기 때문에, defaultValue를 사용하거나 객체형 타입을 사용해야 한다.

---

**다중 값 바인딩 (List)**

```java
@GetMapping("/filter")
public String filter(@RequestParam List<String> category) { ... }
```

- 요청: /filter?category=book&category=pen&category=note
- category = ["book", "pen", "note"]
- 이름이 동일한 여러 개의 파라미터를 List로 바인딩 가능

> 파라미터가 없으면 null, 파라미터가 1개이고 빈 문자열이면 빈 리스트 []가 주입됨

---

## 전체 파라미터 바인딩 (Map, MultiValueMap)

```java
@GetMapping("/params")
public String handleMap(@RequestParam Map<String, String> paramMap) { ... }
```

- 요청: /params?a=1&a=2&b=3
- paramMap = {a=1, b=3}
- Map&lt;String, String> → 키 중복 시, **첫 번째 값**만 저장

```java
@GetMapping("/params2")
public String handleMulti(@RequestParam MultiValueMap<String, String> multiMap) { ... }
```

- 요청: /params?a=1&a=2&b=3
- multiMap = {a=[1, 2], b=[3]}
- MultiValueMap&lt;String, String> → 키 중복 시, **모든 값**을 List로 저장 (Map&lt;K, List&lt;V>>를 상속)

---

**타입 변환 메커니즘**

모든 요청 파라미터는 전부 **문자열(String)** 형태로 들어오기 때문에, 스프링 MVC는 이를 파라미터의 타입으로 자동 변환한다.

이때 내부적으로 ConversionService가 동작하고, Converter, Formatter, PropertyEditor 중 적절한 방식으로 변환된다.

다음 과정을 거치면 사용자 정의 타입 변환도 가능하다.

1. **Converter&lt;String, 사용자 정의 타입>** 구현
2. 해당 Converter를 스프링의 **ConversionService**에 등록

예시:

```java
public class IpPort {
    private String ip;
    private int port;

    // 생성자, getter, setter
}
```

```java
public class StringToIpPortConverter implements Converter<String, IpPort> {
    @Override
    public IpPort convert(String source) {
        String[] split = source.split(":");
        return new IpPort(split[0], Integer.parseInt(split[1]));
    }
}
```

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToIpPortConverter());
    }
}
```

- FormatterRegistry는 내부적으로 ConversionService를 감싼다.
- ConversionService는 스프링의 모든 타입 변환 작업을 처리하는 핵심 컴포넌트다.
- 위처럼 등록하면 @RequestParam, @PathVariable, @ModelAttribute, @InitBinder 등 모든 인자에 적용된다.

```java
@GetMapping("/ip")
public String ip(@RequestParam IpPort ipPort) { ... }
```

- 요청: /ip?ipPort=127.0.0.1:8080
- 자동으로 StringToIpPortConverter가 동작하여 IpPort 객체로 변환됨

---

## 내부 동작 방식 (RequestParamMethodArgumentResolver)

```java
DispatcherServlet
   ↓
HandlerMapping (RequestMappingHandlerMapping)
   ↓
HandlerAdapter (RequestMappingHandlerAdapter)
   ↓
HandlerMethodArgumentResolverComposite
   ↓
RequestParamMethodArgumentResolver
   ↓
WebDataBinderFactory
   ↓
ConversionService
   ↓
핸들러 메서드 실행
```

1. DispatcherServlet
   - 모든 HTTP 요청의 진입점이며, Spring MVC의 프론트 컨트롤러
   - 요청을 HandlerMapping에 위임하여 어떤 핸들러를 호출할지 결정
2. HandlerMapping (RequestMappingHandlerMapping)
   - 요청 URL, HTTP 메서드 등을 기반으로 호출할 핸들러(핸들러 메서드)를 찾음
3. HandlerAdapter (RequestMappingHandlerAdapter)
   - 핸들러 메서드의 파라미터를 바인딩하여, 핸들러 메서드를 실행함
   - 각각의 파라미터를 어떻게 바인딩할지 결정하기 위해 다음 단계로 위임
4. HandlerMethodArgumentResolverComposite
   - 핸들러 메서드의 각 파라미터에 대해 어떤 ArgumentResolver가 처리할 수 있는지 판단
   - 등록된 여러 HandlerMethodArgumentResolver 구현체들을 순차적으로 탐색하여 적절한 것을 선택함
   - @RequestParam이 붙은 파라미터의 경우, RequestParamMethodArgumentResolver가 선택됨
5. RequestParamMethodArgumentResolver
   - 실제로 @RequestParam을 처리하는 전담 Resolver
   - 내부적으로 request.getParameter()로 값을 꺼냄
   - 문자열 값을 객체로 변환하기 위해 WebDataBinder 사용
6. WebDataBinderFactory
   - WebDataBinder를 생성하는 팩토리
   - 필요 시 @InitBinder 메서드를 호출하여 바인더 초기화
7. ConversionService (GenericConversionService)
   - 문자열을 객체형으로 타입 변환 수행
   - 등록된 Converter&lt;String, T>가 실제 변환 로직 수행
8. 핸들러 메서드 실행
   - 모든 파라미터가 바인딩되면, 컨트롤러의 핸들러 메서드가 실행됨
