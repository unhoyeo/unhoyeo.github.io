---
title: "스프링의 타입 변환기 – Converter, Formatter"
description: "애플리케이션 개발 시 타입 변환은 매우 흔하게 발생하는 작업이다. 특히 웹 애플리케이션에서는 HTTP 요청 파라미터가 항상 문자열(String)로 전달되기 때문에, 이를 숫자(Integer, Long)나 특정 객체 타입으로 변환하는…"
pubDate: 2025-09-06T15:37:13+09:00
category: "스프링/MVC"
tags: []
---

애플리케이션 개발 시 **타입 변환**은 매우 흔하게 발생하는 작업이다.

특히 웹 애플리케이션에서는 HTTP **요청 파라미터**가 항상 **문자열(String)**로 전달되기 때문에,

이를 숫자(Integer, Long)나 특정 객체 타입으로 변환하는 과정이 필수적이다.

스프링은 이러한 타입 변환을 위해 **Converter**와 **Formatter**를 제공한다.

---

## Converter – 범용적인 타입 변환기

Converter&lt;S, T> 인터페이스는 **소스 타입(S)** 객체를 **타겟 타입(T)** 객체로 변환하는 **convert()** 메서드를 가지고 있다.

개발자는 이 인터페이스를 구현하여 원하는 모든 종류의 타입 변환 로직을 만들 수 있다.

```java
public interface Converter<S, T> {

    @Nullable
    T convert(S source);

    default <U> Converter<S, U> andThen(Converter<? super T, ? extends U> after) { ... }
}
```

스프링은 용도에 따라 다양한 방식의 Converter를 제공한다.

- **Converter**: 단일 타입 S에서 단일 타입 T로 변환하는 단방향 변환기
- **ConverterFactory**: 하나의 원본 타입 S에서 여러 하위 대상 타입 R로 변환할 수 있는 변환기 생성기
- **GenericConverter**: 다중 타입 매핑 지원, 소스/대상 타입 정보를 런타임에 동적으로 결정하는 유연한 변환기
- **ConditionalConverter**: 변환 조건을 정의하여 특정 상황에서만 변환을 수행하는 변환기

또한 스프링은 **숫자, 문자, Enum, UUID** 등 일반적인 타입에 대한 대부분의 Converter를 기본으로 제공한다.

---

## 커스텀 Converter 구현 예시

"127.0.0.0:8080" 같은 IP + Port 문자열을 객체로 변환하는 Converter는 다음과 같이 구현할 수 있다.

```java
@Data
@AllArgsConstructor
public class IpPort {
    private String ip;
    private Integer port;
}

public class StringToIpPortConverter implements Converter<String, IpPort> {
    @Override
    public IpPort convert(String source) {
        String[] split = source.split(":"); // : 문자를 기준으로 문자열 분리
        return new IpPort(split[0], Integer.parseInt(split[1]));
    }
}

public class IpPortToStringConverter implements Converter<IpPort, String> {
    @Override
    public String convert(IpPort source) {
        return source.getIp() + ":" + source.getPort();
    }
}
```

- **StringToIpPortConverter**: String → IpPort 변환
- **IpPortToStringConverter**: IpPort → String 변환

---

## ️ ConversionService – 컨버터들의 중앙 관리소

ConversionService는 애플리케이션에 등록된 **여러 Converter들을 한데 모아 관리**하는 중앙 허브 역할을 한다.

개발자가 직접 특정 Converter를 찾아 호출할 필요 없이, ConversionService에 "이 String을 Integer로 바꿔줘"라고 요청하기만 하면, ConversionService가 **알아서 가장 적합한 Converter를 찾아 실행**해 준다.

이 덕분에 변환 로직을 사용하는 **클라이언트 코드**와 실제 변환 로직을 구현하는 **Converter 코드**가 **완전히 분리**된다.

스프링은 **@RequestParam, @ModelAttribute, @PathVariable**과 같은 애노테이션이 붙은 파라미터를 처리할 때 내부적으로 이 ConversionService를 사용하여 필요한 타입 변환을 자동으로 수행한다.

> 참고로 컨버터를 사용하는 부분(ConversionService)과 컨버터를 등록하는 부분(ConverterRegistry)은 서로 다른 인터페이스로 분리되어 있다. 따라서 컨버터를 사용하는 클라이언트는 꼭 필요한 메서드만 알게 된다. 이렇게 인터페이스를 분리하는 것을 **ISP**라 한다.

---

## Formatter – 문자열 변환에 특화된 변환기

Converter가 Object ↔ Object 간의 범용적인 변환을 담당한다면, Formatter는 **String ↔ Object 변환에 특화**되어 있으며,

추가적으로 **Locale 정보를 사용**하여 각 나라의 문화권에 맞는 **형식(예: 날짜, 숫자, 통화)**으로 변환하는 기능을 제공한다.

예를 들어, 숫자 1000을 한국에서는 **"1,000"**으로, 독일에서는 **"1.000"**으로 변환하는 등 현지화(i18n) 처리가 필요할 때 사용된다.

Formatter는 객체를 문자열로 변환하는 **print()** 메서드와, 문자열을 객체로 변환하는 **parse()** 메서드를 가진다.

```java
public interface Formatter<T> extends Printer<T>, Parser<T> {
}

public interface Printer<T> {
	String print(T object, Locale locale);
}

public interface Parser<T> {
	T parse(String text, Locale locale) throws ParseException;
}
```

스프링은 기본적인 Formatter 인터페이스뿐만 아니라, 필드의 타입이나 애노테이션 정보를 활용할 수 있는 **AnnotationFormatterFactory** 인터페이스와 **애노테이션 기반의 Formatter**도 제공한다.

---

## 스프링이 제공하는 애노테이션 기반의 Formatter

스프링은 자주 사용되는 숫자와 날짜/시간 타입에 대해 다음과 같은 애노테이션 기반 Formatter를 기본으로 제공한다.

- **@NumberFormat**
- **@DateTimeFormat**
- **@DurationFormat**

이를 통해 개발자는 별도의 Formatter 클래스를 만들지 않고도, 원하는 형식을 필드에 직접 지정할 수 있다. ([참고](https://docs.spring.io/spring-framework/reference/core/validation/format.html#format-CustomFormatAnnotations))

```
static class Form {

    @NumberFormat(pattern = "###,###")
    private Integer number;

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime localDateTime;
}
```

---

## 커스텀 Formatter 구현 예시

숫자 1000을 **"1,000"**으로, 즉 1000 단위로 쉼표가 들어가는 포맷을 적용해 보자.

**천 단위 구분 기호**를 적용하려면 자바가 기본으로 제공하는 **NumberFormat** 객체를 이용하면 된다.

이 객체는 Locale 정보를 통해 나라별로 서로 다른 숫자 포맷을 만들어 준다.

```java
public class MyNumberFormatter implements Formatter<Number> {

    @Override
    public String print(Number object, Locale locale) {
        return NumberFormat.getInstance(locale).format(object); // 1000 → "1,000"
    }

    @Override
    public Number parse(String text, Locale locale) throws ParseException {
        return NumberFormat.getInstance(locale).parse(text); // "1,000" → 1000
    }
}
```

---

## 스프링에 Converter, Formatter 등록하기

스프링 MVC 환경에서는 **WebMvcConfigurer** 인터페이스를 구현하고, **addFormatters()** 메서드를 오버라이드하여,

커스텀 Converter나 Formatter를 손쉽게 등록할 수 있다.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        // Converter 등록
        registry.addConverter(new IpPortToStringConverter());
        registry.addConverter(new StringToIpPortConverter());
        // Formatter 등록
        registry.addFormatter(new MyNumberFormatter());
    }
}
```

> FormatterRegistry는 ConverterRegistry를 상속받기 때문에 Formatter와 Converter 모두 등록할 수 있다.

이렇게 등록된 Converter와 Formatter는 스프링의 **ConversionService**에 추가되어 애플리케이션 전반에서 사용된다.

> 스프링 부트는 내부적으로 DefaultFormattingConversionService를 확장하는 **WebConversionService**를 구현체로 사용한다.
> DefaultFormattingConversionService는 FormattingConversionService를 확장하고,
> **FormattingConversionService**는 GenericConversionService를 확장하면서 FormatterRegistry를 구현한다.
> 그리고 GenericConversionService는 ConfigurableConversionService를 구현하는데,
> 바로 이 인터페이스가 ConversionService, ConverterRegistry를 상속한다.
> 즉, **FormattingConversionService**가 Formatter를 지원하는 ConversionService다.

---

## 뷰 템플릿(Thymeleaf)에서의 활용

타임리프에서는 **${{...}}** 구문을 사용하여 ConversionService를 통한 타입 변환을 적용할 수 있다.

```html
<!-- 변수 표현 -->
<li>${ipPort}: <span th:text="${ipPort}"></span></li>

<!-- 타입 변환 -->
<li>${{ipPort}}: <span th:text="${{ipPort}}" ></span></li>

<!-- th:field에서도 타입 변환 -->
<input type="text" th:field="*{ipPort}">
```

- **${ipPort}**: IpPort 객체의 toString() 메서드 호출 결과를 출력
- **${{ipPort}}**: ConversionService를 사용하여 IpPort → String 변환 결과를 출력
- **th:field**는 자동으로 ConversionService가 적용된다.

---

## ⚠️ 주의: ConversionService는 HttpMessageConverter와 관계없음!

한 가지 매우 중요한 점은, **HttpMessageConverter는 ConversionService를 사용하지 않는다**는 것이다.

즉, @RequestBody, @ResponseBody 등을 통해 JSON 데이터를 객체로 변환할 때는 Converter, Formatter가 적용되지 않는다.

HttpMessageConverter는 **Jackson**과 같은 별도의 라이브러리를 사용하여 HTTP 메시지 바디 전체를 직렬화/역직렬화한다.

따라서 JSON 응답에서 날짜나 숫자 형식을 변경하고 싶다면, ConversionService가 아닌 **해당 라이브러리의 설정을 직접 변경**해야 한다.

> 참고: @JsonFormat

> ❗️ConversionService는 @RequestParam, @ModelAttribute, @PathVariable, 뷰 템플릿 등에서 사용할 수 있다.
