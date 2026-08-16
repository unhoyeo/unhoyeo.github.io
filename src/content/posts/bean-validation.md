---
title: "Bean Validation"
description: "이전의 Validator 인터페이스를 직접 구현하는 방식이 검증 로직을 컨트롤러로부터 분리하는 단계였다면, Bean Validation은 검증 로직 자체를 애노테이션 기반으로 표준화하고 자동화하는 기술이다."
pubDate: 2025-08-28T19:47:55+09:00
category: "스프링/MVC"
tags: []
---

이전의 Validator 인터페이스를 직접 구현하는 방식이 검증 로직을 컨트롤러로부터 분리하는 단계였다면,

Bean Validation은 검증 로직 자체를 애노테이션 기반으로 표준화하고 자동화하는 기술이다.

---

## Bean Validation이란?

Bean Validation은 반복적이고 정형화된 검증 로직(예: 값이 비어있는지, 특정 범위를 만족하는지)을 모든 프로젝트에서 일관성 있게 처리할 수 있도록 만든 <strong>자바 표준 기술 사양(JSR-380)</strong>이다.

이는 특정 구현체가 아닌 인터페이스와 애노테이션의 모음이다.

마치 JPA가 데이터 접근 기술의 표준 사양이고, 하이버네이트(Hibernate)가 그 구현체인 것과 같은 관계다.

스프링 부트는 기본 구현체로 **Hibernate Validator**를 사용한다.

---

## 왜 중요한가

- 검증 로직을 DTO에 선언적으로 부착 → 중복 감소, 가독성 향상
- 컨트롤러/서비스/리포지토리 경계마다 일관된 검증 수행 → 신뢰성 향상
- 국제화, 그룹, 조합 제약, 커스텀 제약으로 복잡한 규칙 표현 가능

---

## 자주 사용하는 Bean Validation 애노테이션

- Null 관련: @NotNull(null 금지), @NotEmpty(null/빈 컬렉션 금지), @NotBlank(문자열 공백 금지)
- 숫자: @Min, @Max, @Positive, @Digits(integer, fraction)
- 문자열: @Size(min,max), @Pattern(regexp)
- 날짜/시간: @Past, @Future, @PastOrPresent, @FutureOrPresent (시계는 ClockProvider로 제어 가능)
- 이메일 등: @Email, @URL(Hibernate Validator)

> 자세한 내용은 [공식 매뉴얼](https://docs.jboss.org/hibernate/stable/validator/reference/en-US/html_single/?v=9.0#section-builtin-constraints)을 참고하자.

---

## Bean Validation 애노테이션 적용 예시

```java
@Data
public class Item {

    private Long id;

    @NotBlank(message = "공백은 입력할 수 없습니다.")
    private String name;

    @NotNull
    @Range(min = 1_000, max = 5_000)
    private Integer price;

    @NotNull
    @Max(9999)
    private Integer quantity;

    ...
}
```

> @Range는 Hibernate Validator에서만 제공하는 애노테이션이다.

```java
@Valid // 중첩 객체 검증
private ShippingInfo shipping;

// 컬렉션 요소 제약(Bean Validation 2.0)
private List<@NotBlank String> tags;
```

- 필드에 @Valid를 붙이면 객체 그래프를 따라 내려가며 재귀적으로 검증함
- 컬렉션은 **컨테이너 요소 제약**으로 각 요소를 직접 검증함

---

## 스프링 MVC와 Bean Validation의 통합

스프링 부트는 Bean Validation을 매우 긴밀하게 통합하여, 개발자가 별도의 설정 없이 바로 사용할 수 있도록 지원한다.

build.gradle에 spring-boot-starter-validation 의존성을 추가하면,

스프링 부트는 이를 인지하고 **LocalValidatorFactoryBean**을 전역(Global) Validator로 자동으로 등록한다.

이 전역 Validator가 바로 @NotNull과 같은 Bean Validation 애노테이션을 해석하고 검증을 수행하는 주체다.

이 때문에 이전처럼 Validator를 직접 만들거나 @InitBinder를 통해 등록할 필요 없이,

모델 객체에 Bean Validation 애노테이션을 지정하기만 하면 검증이 자동으로 실행된다.

> ⚠️ 별도로 전역 Validator를 등록한 경우, 애노테이션 기반의 Validator가 동작하지 않는다.

---

## 검증 실행 순서

스프링 MVC에서 @Validated가 적용된 @ModelAttribute의 처리 과정은 다음과 같다.

1. **데이터 바인딩 (타입 변환)**
   - HTTP 요청 파라미터를 @ModelAttribute 객체의 각 필드에 바인딩
   - 바인딩 실패 시, typeMismatch FieldError를 BindingResult에 추가
2. **바인딩에 성공한 필드만 Bean Validation 적용**
   - 타입 변환에 성공한 필드에 한해서만 Bean Validation 애노테이션(@NotBlank, @Max 등) 적용
   - 타입 변환 자체가 실패한 필드는 검증의 의미가 없으므로, Bean Validation이 적용되지 않음
   - 검증 실패 시, 해당 오류 정보가 FieldError로 변환되어 BindingResult에 담김

---

## Bean Validation의 메시지 코드

Bean Validation이 기본으로 제공하는 오류 메시지를 좀 더 자세히 변경하고 싶다면, 다음과 같은 방법을 사용하면 된다.

1. 이전과 마찬가지로 **errors.properties** 파일에 정의하기
2. Bean Validation 애노테이션의 **message 속성** 사용하기

Bean Validation의 오류 코드는 typeMismatch와 유사하게 애노테이션 이름으로 등록된다.

예를 들어, **@NotBlank** 애노테이션이 검증 실패할 경우, MessageCodesResolver는 다음과 같은 코드를 생성한다.

- NotBlank.item.name
- NotBlank.name
- NotBlank.java.lang.String
- NotBlank

Bean Validation의 오류 메시지는 다음과 같은 순서로 찾는다.

1. 생성된 오류 코드 순서대로 messageSource에서 찾기
2. 해당 애노테이션의 message 속성에서 찾기 (예: @NotBlank(message = "상품 이름은 필수 값입니다."))
3. 라이브러리가 제공하는 기본값 사용 (예: 공백일 수 없습니다.)

---

## 전역 오류 처리 – @ScriptAssert

Bean Validation에서 특정 필드 오류(FieldError)가 아닌 해당 객체와 관련된 전역 오류(ObjectError)는 **@ScriptAssert**를 사용한다.

```java
@Data
@ScriptAssert(lang = "javascript", script = "_this.price * _this.quantity >= 100000")
public class Item {
    ...
}
```

메시지 코드도 다음과 같이 생성된다.

- ScriptAssert.item
- ScriptAssert

하지만 실무에서는 해당 객체의 범위를 넘어서는 검증을 하는 경우도 존재하기 때문에, @ScriptAssert는 잘 사용되지 않는다.

따라서 전역 오류와 관련된 부분만 컨트롤러에서 직접 검증하는 것을 권장한다. (커스텀 애노테이션 + 커스텀 Validator 방식도 존재)

---

## 검증 애노테이션의 충돌

실무에서는 데이터 <strong>등록(Create)</strong>과 <strong>수정(Update)</strong>의 검증 요구사항이 다른 경우가 대부분이다.

예를 들어, 등록 시에는 id가 없어야 하지만, 수정 시에는 id가 반드시 존재해야 할 수 있다.

즉, 하나의 도메인 객체(Item)에 모든 검증 애너테이션을 적용하면, 등록과 수정 시에 검증 규칙이 충돌할 수 있다.

이 문제를 해결하기 위한 두 가지 방법이 존재한다.

1. **Bean Validation의 groups 기능 이용**
2. **폼 전송 객체(DTO) 분리**

---

## Bean Validation의 groups 기능

- 특정 상황에만 검증 규칙을 활성화하는 방법
- SaveCheck와 UpdateCheck 같은 마커 인터페이스를 만들고, 검증 애노테이션에 **groups 속성**을 부여하여 언제 적용될지를 지정

```java
public interface SaveCheck {
}

public interface UpdateCheck {
}

@Data
public class Item {

    @NotNull(groups = UpdateCheck.class) // 수정할 때만 검증
    private Long id;

    @NotBlank(groups = {SaveCheck.class, UpdateCheck.class}) // 등록, 수정 모두 검증
    private String name;

    @NotNull(groups = {SaveCheck.class, UpdateCheck.class})
    @Max(value = 999, groups = SaveCheck.class) // 등록할 때만 적용
    private Integer quantity;

    ...
}
```

컨트롤러에서는 **@Validated** 애노테이션에 활성화할 그룹을 명시한다.

```java
// 등록
public String saveItem(@Validated(SaveCheck.class) @ModelAttribute Item item, ...) { ... }

// 수정
public String updateItem(@Validated(UpdateCheck.class) @ModelAttribute Item item, ...) { ... }
```

> **⚠️ 주의**
> groups 기능은 스프링이 제공하는 @Validated 애노테이션의 고유 기능이다.
> 따라서, 자바 표준인 @Valid에는 이 기능이 없어 groups를 사용할 수 없다.

---

## 폼 전송 객체(DTO) 분리 (권장)

- groups 기능은 유용하지만, 적용된 객체와 컨트롤러 코드가 복잡해지는 단점이 존재
- 실무에서는 폼 데이터 전송을 위한 별도의 객체(DTO)로 분리하여 사용하는 것을 선호
  - ItemSaveForm → 등록에 필요한 필드와 검증 규칙만 포함
  - ItemUpdateForm → 수정에 필요한 필드와 검증 규칙만 포함
- 컨트롤러는 도메인 객체(Item) 대신, DTO를 파라미터로 받음

```java
@Data
public class ItemSaveForm {

    @NotBlank
    private String name;

    @NotNull
    @Max(value = 9999) // 등록할 때만
    private Integer quantity;

    ...
}

@Data
public class ItemUpdateForm {

    @NotNull
    private Long id; // 수정할 때만

    @NotBlank
    private String name;

    @NotNull
    private Integer quantity;

    ...
}

@PostMapping("/save")
public String saveItem(@Validated @ModelAttribute("item") ItemSaveForm form, ...) {
    ...
}

@PostMapping("/update")
public String updateItem(@Validated @ModelAttribute("item") ItemUpdateForm form, ...) {
    ...
}
```

## 이 방식의 장점

- **명확한 책임 분리**: 등록과 수정의 요구사항이 물리적으로 분리되어 코드를 이해하고 유지보수하기 쉽다.
- **단순해진 도메인 객체**: 도메인 객체(Item)는 순수하게 데이터 저장의 역할에만 집중하고, 검증 로직을 포함하지 않게 된다.
- **유연성**: 폼 전송 시 필요한 추가적인 데이터(약관 정보 등)를 도메인 객체와 무관하게 자유롭게 폼 객체에 추가할 수 있다.

물론 폼 객체를 실제 도메인 객체로 변환하는 과정이 추가되는 단점이 있지만,

복잡한 실무 애플리케이션에서는 이러한 명확성이 주는 이점이 훨씬 크다.

---

## @RequestBody에서의 Bean Validation

Bean Validation은 @ModelAttribute뿐만 아니라, JSON 데이터를 처리하는 **@RequestBody**에도 동일하게 적용할 수 있다.

```java
@PostMapping("/save")
public Object saveItem(@Valid @RequestBody ItemSaveForm form,
                      BindingResult bindingResult) {
    ...
}
```

단, @ModelAttribute와의 중요한 차이점이 있다.

---

## @ModelAttribute vs @RequestBody

- @ModelAttribute는 **필드 단위로 바인딩**함
  - 따라서 특정 필드에 타입 오류가 발생해도, 다른 필드는 정상적으로 처리됨
- @RequestBody는 HttpMessageConverter를 통해 HTTP 메시지 **본문 전체를 하나의 객체로 변환**함
  - 따라서 타입 오류 등으로 객체 생성 자체가 실패하면 컨트롤러가 호출되기도 전에 예외가 발생하고, **Validator도 실행되지 않음**

즉, @RequestBody에서의 Bean Validation은 JSON → 객체로 성공적으로 변환된 이후에만 수행된다.

따라서 @RequestBody의 검증은 다음 두 가지 경우로 나누어 생각해야 한다.

1. **JSON → 객체 변환 실패**
   - HttpMessageConverter에서 실패
   - 컨트롤러가 호출되지 않고, 그 전에 HttpMessageNotReadableException이 발생함 → 전역 예외 처리 필요
2. **JSON → 객체 변환은 성공했지만, 검증 실패**
   - HttpMessageConverter는 성공했지만, Validator에서 실패
   - 컨트롤러는 정상적으로 호출되었지만, @Valid의 Bean Validation에서 검증 오류가 발생함

> BindingResult 파라미터 없이, @Valid @RequestBody 검증에서 JSON 객체 변환이 실패하면 MethodArgumentNotValidException이 발생함
