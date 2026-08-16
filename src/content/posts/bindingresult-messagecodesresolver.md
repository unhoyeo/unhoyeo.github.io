---
title: "BindingResult, MessageCodesResolver"
description: "? BindingResult란? 폼 바인딩/검증 과정에서 발생한 모든 오류를 담는 객체 요청 파라미터 → 객체 변환 중 발생한 바인딩 오류(타입 불일치, 값 범위 초과 등) Bean Validation(@Valid,…"
pubDate: 2025-08-27T14:32:38+09:00
category: "스프링/MVC"
tags: []
---

**BindingResult란?**

- **폼 바인딩/검증 과정에서 발생한 모든 오류**를 담는 객체
  - 요청 파라미터 → 객체 변환 중 발생한 **바인딩 오류**(타입 불일치, 값 범위 초과 등)
  - Bean Validation(@Valid, @Validated) 또는 비즈니스 검증 수행 중 발생한 **검증 오류**
- ⚠️ 항상 <strong>"검증할 파라미터 바로 뒤"</strong>에 선언해야 연결됨
  - 예: public String saveItem(@ModelAttribute Item **item**, BindingResult **bindingResult**) { ... }
  - 순서가 어긋나면 BindException이 발생하거나, 다른 객체와 연결될 수도 있음
- BindingResult 인터페이스는 **Errors** 인터페이스를 상속함
  - 실제로 넘어오는 구현체는 **BeanPropertyBindingResult**
  - 해당 구현체는 BindingResult, Errors 모두 구현하므로, 사실 BindingResult 대신 Errors를 사용해도 됨
  - 하지만 관례상 BindingResult를 주로 사용함
- BindingResult는 **Model에 자동으로 포함**됨

---

## BindingResult 주요 메서드

> BindingResult는 Errors의 메서드를 그대로 상속하기 때문에 Errors의 메서드도 포함하여 정리했다.

- void **addError**(ObjectError error) → 오류 목록에 사용자 지정 **ObjectError** 또는 **FieldError** 추가
- boolean **hasErrors**() → 오류 존재 여부
- boolean **hasGlobalErrors**() → 전역 오류 존재 여부
- boolean **hasFieldErrors**() → 필드 오류 존재 여부
  - boolean hasFieldErrors(String field) → 특정 필드 오류 여부
- List&lt;ObjectError> **getAllErrors**() → 모든 오류 반환 (전역 오류 및 필드 오류)
- List&lt;ObjectError> **getGlobalErrors**() → 모든 전역 오류 반환
- List&lt;FieldError> **getFieldErrors**() → 모든 필드 오류 반환
  - List&lt;FieldError> **getFieldErrors**(String field) → 특정 필드의 모든 오류 반환
- FieldError **getFieldError**() → 첫 번째 필드 오류 반환
  - FieldError getFieldError(String field) → 특정 필드의 첫 번째 오류 반환
- void **reject**(String errorCode, String defaultMessage) → 전역 오류 등록
- void **rejectValue**(String field, String errorCode, String defaultMessage) → 필드 오류 등록

---

## FieldError, ObjectError

BindingResult에는 두 종류의 오류를 **addError()** 메서드를 통해 추가할 수 있다.

1. **FieldError**: 특정 필드에 대한 오류 (ObjectError 상속)
2. **ObjectError**: 여러 필드를 조합해야 하는 등 특정 필드에 국한되지 않는 전역(Global) 오류

각각의 생성자 코드는 다음과 같다.

```java
public FieldError(
        String objectName,
        String field,
        String defaultMessage) { ... }

public FieldError(
        String objectName,
        String field,
        @Nullable Object rejectedValue,
        boolean bindingFailure,
        @Nullable String[] codes,
        @Nullable Object[] arguments,
        @Nullable String defaultMessage) { ... }
```

```java
public ObjectError(
        String objectName,
        @Nullable String defaultMessage) { ... }

public ObjectError(
        String objectName,
        @Nullable String[] codes,
        @Nullable Object[] arguments,
        @Nullable String defaultMessage) { ... }
```

## FieldError, ObjectError 모두 존재

- String **objectName**: 오류가 발생한 객체명
- String[] **codes**: 이 메시지를 해결하는 데 사용할 코드
- Object[] **arguments**: 이 메시지를 해결하는 데 사용할 인수

## FieldError에만 존재

- String **field**: 오류가 발생한 필드명
- Object **rejectedValue**: 거부된 필드 값 → 이를 통해 **사용자 입력 값을 유지할 수 있음**
- boolean **bindingFailure**: 이 오류가 바인딩 실패를 나타내는지 여부 (아닐 경우 검증 실패)

---

## BindingResult 적용 예시

> BindingResult 적용 전 코드는 [여기](/posts/검증-클라이언트-검증-vs-서버-검증/)

```java
@PostMapping("/save")
public String saveItem(@ModelAttribute Item item,
                       BindingResult bindingResult, // 반드시 검증할 파라미터 바로 뒤에 위치
                       RedirectAttributes redirectAttributes) {

    // 검증 로직
    if (!StringUtils.hasText(item.getName())) {
        bindingResult.addError(new FieldError(
                "item",         // objectName
                "name",         // field
                item.getName(), // rejectedValue
                false,          // bindingFailure
                null,           // codes
                null,           // arguments
                "상품 이름은 필수 값입니다." // defaultMessage
        ));
    }

    if (item.getPrice() == null || item.getPrice() < 1_000 || item.getPrice() > 5_000) {
        bindingResult.addError(new FieldError(
                "item",
                "price",
                item.getPrice(),
                false,
                null,
                null,
                "상품 가격은 1,000원 이상 5,000원 이하이여야 합니다."
        ));
    }

    if (item.getQuantity() == null || item.getQuantity() > 999) {
        bindingResult.addError(new FieldError(
                "item",
                "quantity",
                item.getQuantity(),
                false,
                null,
                null,
                "상품 수량은 999개 이하이여야 합니다."
        ));
    }

    // 복합 조건 검증
    if (item.getPrice() != null && item.getQuantity() != null) {
        int result = item.getPrice() * item.getQuantity();
        if (result < 100_000) {
            bindingResult.addError(new ObjectError(
                    "item",
                    "상품 가격과 수량의 곱은 100,000 이상이여야 합니다. 현재 값 = " + result
            ));
        }
    }

    // 오류가 있다면 다시 입력 폼으로 이동
    if (bindingResult.hasErrors()) {
        return "item/saveForm";
    }

    // 검증 성공 로직
    ...
}
```

- **bindingResult.addError(ObjectError error)** 메서드를 통해 오류 저장
  - 전역 오류는 **ObjectError**, 필드 오류는 ObjectError를 상속한 **FieldError** 객체를 생성하여 저장
- 만약 **바인딩 오류**가 발생하면, 스프링이 해당 필드의 오류 정보를 바탕으로 **자동으로 FieldError를 생성하여 저장함**
  - 따라서 바인딩 오류가 발생해도 **컨트롤러가 정상적으로 호출됨!**
- 오류를 발생시킨 **사용자 입력 값**은 FieldError의 **rejectedValue**에 저장
  - 해당 값을 이용하여 사용자 입력 값을 유지 가능 → UX 향상
- BindingResult는 **Model에 자동으로 포함됨** → 타임리프에서 **#fields**를 통해 접근 가능
  - 타임리프는 BindingResult를 활용하여 검증 오류를 편리하게 표현하는 여러 기능을 제공함 ([참고](https://www.thymeleaf.org/doc/tutorials/3.0/thymeleafspring.html#validation-and-error-messages))

```html
<div th:if="${#fields.hasGlobalErrors()}">
  <p class="field-error"
     th:each="err : ${#fields.globalErrors()}"
     th:text="${err}">
    전역 오류
  </p>
</div>

<label for="price" th:text="#{label.item.price}">가격</label>
<input class="form-control"
       id="price"
       placeholder="가격을 입력하세요"
       th:errorclass="field-error"
       th:field="*{price}"
       type="text"
/>

<div class="field-error"
     th:errors="*{price}">
  가격 필드 오류
</div>
```

- **#fields**: BindingResult가 제공하는 검증 오류에 접근
- **th:field**: 상황에 따라 유연하게 필드 값을 출력함
  - 일반적인 상황 → 모델 객체의 값을 사용
  - 오류 발생 → 해당 FieldError의 **rejectedValue**에 저장된 값을 사용

- **th:errorclass**: th:field에서 지정한 필드에 오류가 있으면 class 정보를 추가
- **th:errors**: 해당 필드에 오류가 있다면, 오류 메시지 코드를 순서대로 탐색하여 메시지를 출력 (없으면 기본 메시지 출력)

---

## ✅ 위 코드의 장점

- **뷰 템플릿 처리 단순화**
  - th:errors="\*{필드명}"로 간단하게 오류 출력 가능
  - 전역 오류는 #fields.globalErrors()로 일괄 처리 가능
  - 중복 로직 제거 → 유지보수성 향상
- **타입 변환 실패(TypeMismatch) 처리 가능**
  - 데이터를 바인딩할 때 타입 오류가 발생해도, 400 오류를 발생시키지 않음
  - **오류 정보를 FieldError 객체에 담아 BindingResult에 추가**하고, **컨트롤러를 정상적으로 호출**함
- **사용자 경험(UX) 개선**
  - 바인딩에 실패한 **사용자 입력 값을** 뷰에 그대로 전달
  - 사용자는 어떤 값을 잘못 입력했는지 알기 쉬움 → UX 향상

---

## 메시지 관리 – codes, arguments

위 코드와 같이 **오류 메시지를 하드코딩**하는 것은 유지보수 측면에서 바람직하지 않다.

스프링은 메시지를 별도의 프로퍼티 파일(messages.properties, errors.properties 등)로 분리하고,

코드로는 메시지 키만 참조하는 방식을 권장한다.

FieldError, ObjectError의 생성자 코드를 보면 **codes, arguments**가 존재한다.

이는 별도의 파일에 정의되어 있는 오류 메시지를 찾기 위해 사용된다.

- String[] **codes**: 메시지 코드 배열 (순서대로 매칭해서 처음 매칭되는 코드가 사용됨)
- Object[] **arguments**: 메시지에서 사용하는 인자 배열 ({0}, {1}, ...)

예를 들어, **errors.properties** 파일에 다음과 같이 정의할 수 있다. (errors\_en.properties 파일을 생성하여 국제화 처리도 가능)

```python
# errors.properties
required.item.name=상품 이름은 필수 값입니다.
range.item.price=상품 가격은 {0}원 이상 {1}원 이하이여야 합니다.
max.item.quantity=상품 수량은 {0}개 이하이여야 합니다.
totalPriceMin=상품 가격과 수량의 곱은 {0} 이상이여야 합니다. 현재 값 = {1}
```

위 메시지를 적용한 코드는 다음과 같다.

```java
@PostMapping("/save")
public String saveItem(@ModelAttribute Item item,
                       BindingResult bindingResult, // 반드시 검증할 파라미터 바로 뒤에 위치
                       RedirectAttributes redirectAttributes) {

    // 검증 로직
    if (!StringUtils.hasText(item.getName())) {
        bindingResult.addError(new FieldError(
                "item",
                "name",
                item.getName(),
                false,
                new String[]{"required.item.name"}, // codes
                null, // arguments
                "상품 이름은 필수 값입니다."
        ));
    }

    if (item.getPrice() == null || item.getPrice() < 1_000 || item.getPrice() > 5_000) {
        bindingResult.addError(new FieldError(
                "item",
                "price",
                item.getPrice(),
                false,
                new String[]{"range.item.price"}, // codes
                new Object[]{1_000, 5_000}, // arguments
                "상품 가격은 1,000원 이상 5,000원 이하이여야 합니다."
        ));
    }

    if (item.getQuantity() == null || item.getQuantity() > 999) {
        bindingResult.addError(new FieldError(
                "item",
                "quantity",
                item.getQuantity(),
                false,
                new String[]{"max.item.quantity"}, // codes
                new Object[]{999}, // arguments
                "상품 수량은 999개 이하이여야 합니다."
        ));
    }

    // 복합 조건 검증
    if (item.getPrice() != null && item.getQuantity() != null) {
        int result = item.getPrice() * item.getQuantity();
        if (result < 100_000) {
            bindingResult.addError(new ObjectError(
                    "item",
                    new String[]{"totalPriceMin"}, // codes
                    new Object[]{100_000, result}, // arguments
                    "상품 가격과 수량의 곱은 100,000 이상이여야 합니다. 현재 값 = " + result
            ));
        }
    }

    // 오류가 있다면 다시 입력 폼으로 이동
    if (bindingResult.hasErrors()) {
        return "item/saveForm";
    }

    // 검증 성공 로직
    ...
}
```

⚠️ 주의: 스프링 부트는 기본적으로 messages.properties만 인식하기 때문에 **application.properties**에 추가로 설정해줘야 한다.

```properties
# application.properties
spring.messages.basename=messages, errors
```

---

## rejectValue(), reject()

검증할 때마다 **FieldError나 ObjectError를 매번 직접 생성**하기에는 너무 번거롭다.

이를 위해 BindingResult는 rejectValue()와 reject() 메서드를 제공한다.

```java
// 필드 오류 등록
void rejectValue(@Nullable String field,
                 String errorCode) { ... }

void rejectValue(@Nullable String field,
                 String errorCode,
                 String defaultMessage) { ... }

void rejectValue(@Nullable String field,
                 String errorCode,
                 @Nullable Object[] errorArgs,
                 @Nullable String defaultMessage) { ... }

// 전역 오류 등록
void reject(String errorCode,
            String defaultMessage) { ... }

void reject(String errorCode,
            @Nullable Object[] errorArgs,
            @Nullable String defaultMessage) { ... }
```

> BindingResult는 "검증할 객체 바로 다음에 위치"하기 때문에 검증 대상 객체를 이미 알고 있다.
> 따라서 검증 대상 객체(item)에 대한 정보는 없어도 된다.

rejectValue()와 reject() 메서드를 적용해보면 코드가 확실히 깔끔해진다.

```java
@PostMapping("/save")
public String saveItem(@ModelAttribute Item item,
                       BindingResult bindingResult, // 반드시 검증할 파라미터 바로 뒤에 위치
                       RedirectAttributes redirectAttributes) {

    // 검증 로직
    if (!StringUtils.hasText(item.getName())) {
        bindingResult.rejectValue(
                "name", // field
                "required" // errorCode
        );
    }

    if (item.getPrice() == null || item.getPrice() < 1_000 || item.getPrice() > 5_000) {
        bindingResult.rejectValue(
                "price", // field
                "range", // errorCode
                new Object[]{1_000, 5_000}, // errorArgs
                null // defaultMessage
        );
    }

    if (item.getQuantity() == null || item.getQuantity() > 999) {
        bindingResult.rejectValue(
                "quantity", // field
                "max", // errorCode
                new Object[]{999}, // errorArgs
                null // defaultMessage
        );
    }

    // 복합 조건 검증
    if (item.getPrice() != null && item.getQuantity() != null) {
        int result = item.getPrice() * item.getQuantity();
        if (result < 100_000) {
            bindingResult.reject(
                    "totalPriceMin", // errorCode
                    new Object[]{100_000, result}, // errorArgs
                    null // defaultMessage
            );
        }
    }

    // 오류가 있다면 다시 입력 폼으로 이동
    if (bindingResult.hasErrors()) {
        return "item/saveForm";
    }

    // 검증 성공 로직
    ...
}
```

## 그런데 오류 코드를 입력하는 부분이 기존과 약간 다르다!

- 기존 방식(FieldError, ObjectError 직접 생성): **range.item.price**
- rejectValue(), reject() 메서드를 사용하는 방식: **range**

하지만 range.item.price라고 명시하지 않아도 errors.properties 파일에 정의된 해당 메시지를 잘 가져온다.

이는 rejectValue(), reject() 메서드가 내부적으로 **MessageCodesResolver**를 사용하기 때문이다.

---

## MessageCodesResolver 역할

MessageCodesResolver는 객체명, 필드명, 필드 타입 등을 이용하여 **구체적인 것에서 범용적인 순서로 메시지 코드를 생성**해준다.

MessageCodesResolver의 기본 구현체 DefaultMessageCodesResolver의 메시지 코드 생성 규칙은 다음과 같다.

```java
// ObjectError
1 - errorCode + "." + objectName
2 - errorCode

// FieldError
1 - errorCode + "." + objectName + "." + field
2 - errorCode + "." + field
3 - errorCode + "." + fieldType
4 - errorCode
```

예를 들어, <strong>bindingResult.rejectValue("name", "required")</strong>가 호출되면, 다음과 같은 메시지 코드들이 순서대로 생성된다.

1. required.item.name (가장 구체적)
2. required.name
3. required.java.lang.String (필드 타입)
4. required (가장 범용적)

따라서 스프링은 **이 순서대로 errors.properties 파일에서 메시지를 찾아서** FieldError, ObjectError를 생성하게 된다.

다음은 MessageCodesResolver가 메시지 코드를 생성하는 예시를 보여준다.

```java
class MessageCodesResolverTest {

    MessageCodesResolver codesResolver = new DefaultMessageCodesResolver();

    @Test
    void object() {
        String[] codes = codesResolver.resolveMessageCodes(
                "required", // errorCode
                "item" // objectName
        );

        // codes = ["required.item", "required"] 구체적 → 범용적 순서
        assertThat(codes).containsExactly("required.item", "required");
    }

    @Test
    void field() {
        String[] codes = codesResolver.resolveMessageCodes(
                "required", // errorCode
                "item", // objectName
                "name", // field
                String.class); // fieldType

        // 코드.객체.필드 → 코드.필드 → 코드.타입 → 코드
        assertThat(codes).containsExactly(
                "required.item.name",
                "required.name",
                "required.java.lang.String",
                "required"
        );
    }
}
```

---

## 유연한 오류 메시지 관리

MessageCodesResolver 덕분에 우리는 다음과 같이 메시지 관리를 유연하게 할 수 있다.

1. **범용적인 메시지를 정의**
   - required=필수 값입니다.
2. **더 구체적인 메시지가 필요할 때만 해당 코드를 추가**

   - required.item.name=상품 이름은 필수 값입니다.

## 이러한 계층 구조의 장점

- 개발자가 모든 오류 상황에 대해 메시지를 일일이 만들 필요가 없음
- 공통 메시지를 **재사용**하다가 필요할 때만 세밀하게 조정할 수 있음 → **생산성 향상**

---

## TypeMismatch 메시지 관리

사용자가 숫자 필드에 문자를 입력하는 등 바인딩이 실패하면 TypeMismatchException이 발생한다.

하지만 해당 오류는 스프링이 자동으로 FieldError를 생성하여 BindingResult에 담아주기 때문에, 기본 오류 메시지가 친절하지 않다.

이러한 바인딩 오류의 메시지도 **errors.properties** 파일로 관리할 수 있다.

바인딩 오류의 로그를 남겨보면 다음과 같은 메시지 코드들이 들어있는 것을 확인할 수 있다.

- typeMismatch.item.price
- typeMismatch.price
- typeMismatch.java.lang.Integer
- typeMismatch

required.item.name=상품 이름은 필수 값입니다. 라고 지정한 것처럼 위 메시지 코드들도 errors.properties 파일에 설정하면 된다.

```
# errors.properties
required.item.name=상품 이름은 필수 값입니다.
range.item.price=상품 가격은 {0}원 이상 {1}원 이하이여야 합니다.
max.item.quantity=상품 수량은 {0}개 이하이여야 합니다.
totalPriceMin=상품 가격과 수량의 곱은 {0} 이상이여야 합니다. 현재 값 = {1}

typeMismatch.java.lang.Integer=숫자를 입력해 주세요.
typeMismatch=타입 오류입니다.
```

---

## 참고 – ValidationUtils

```java
if (!StringUtils.hasText(item.getName())) {
    bindingResult.rejectValue("name", "required");
}
```

위와 같이 **값이 비어 있거나 공백만 포함되어 있는 경우**의 검증을 간단하게 하는 기능을 제공한다.

```java
ValidationUtils.rejectIfEmptyOrWhitespace(bindingResult, "name", "required");
```
