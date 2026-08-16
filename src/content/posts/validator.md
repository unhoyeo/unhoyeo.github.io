---
title: "Validator"
description: "다음 검증 코드를 보면 검증 로직이 늘어날수록 컨트롤러 코드가 복잡해진다는 문제점이 존재한다. 스프링은 검증 로직을 별도의 클래스로 분리할 수 있도록 Validator 인터페이스를 제공한다. supports(Class<?"
pubDate: 2025-08-27T15:25:29+09:00
category: "스프링/MVC"
tags: []
---

다음 검증 코드를 보면 **검증 로직이 늘어날수록 컨트롤러 코드가 복잡해진다**는 문제점이 존재한다.

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

스프링은 검증 로직을 **별도의 클래스로 분리**할 수 있도록 Validator 인터페이스를 제공한다.

---

## Validator 인터페이스

```java
public interface Validator {
    boolean supports(Class<?> clazz);
    void validate(Object target, Errors errors);
}
```

- supports(Class&lt;?> clazz):
  - 어떤 타입의 객체를 검증할 것인지 명시
- validate(Object target, Errors errors):
  - 실제 검증 로직을 구현하며, BindingResult의 부모 인터페이스인 Errors 객체를 통해 오류를 추가

---

## Validator 예시 – ItemValidator

```java
@Component
public class ItemValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        // 이 검증기가 Item 클래스를 지원하는지 여부 반환
        return Item.class.isAssignableFrom(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        // 실제 검증 로직 구현
        Item item = (Item) target;

        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "name", "required");

        if (item.getPrice() == null || item.getPrice() < 1_000 || item.getPrice() > 5_000) {
            errors.rejectValue(
                    "price", // field
                    "range", // errorCode
                    new Object[]{1_000, 5_000}, // errorArgs
                    null // defaultMessage
            );
        }

        if (item.getQuantity() == null || item.getQuantity() > 999) {
            errors.rejectValue(
                    "quantity", // field
                    "max", // errorCode
                    new Object[]{999}, // errorArgs
                    null // defaultMessage
            );
        }

        if (item.getPrice() != null && item.getQuantity() != null) {
            int result = item.getPrice() * item.getQuantity();
            if (result < 100_000) {
                errors.reject(
                        "totalPriceMin", // errorCode
                        new Object[]{100_000, result}, // errorArgs
                        null // defaultMessage
                );
            }
        }
    }
}
```

```java
@PostMapping("/save")
public String saveItem(@ModelAttribute Item item,
                       BindingResult bindingResult,
                       RedirectAttributes redirectAttributes) {

    itemValidator.validate(item, bindingResult);

    if (bindingResult.hasErrors()) {
        return "item/saveForm";
    }

    // 검증 성공 로직
    ...
}
```

검증 로직을 분리함으로써 컨트롤러 코드가 깔끔해졌다.

그런데 ItemValidator를 그냥 단순한 유틸 클래스로 할 수도 있는데, 굳이 **스프링 빈으로 등록하고 사용하는 이유는 뭘까?**

**? @InitBinder**와 **@Validated** 애노테이션을 통한 **"자동 검증"**을 할 수 있기 때문!

---

## ✅ Validator 검증 자동화

우선 컨트롤러에 **@InitBinder 메서드**를 만들어 **WebDataBinder**에 사용할 Validator를 등록한다.

등록된 Validator는 **해당 컨트롤러 내에서만 사용 가능**하며, 전역으로 사용하려면 별도 설정이 필요하다.

```java
@InitBinder
public void init(WebDataBinder dataBinder) {
    dataBinder.addValidators(itemValidator); // ItemValidator 등록
}
```

그리고 검증이 필요한 모델 객체 앞에 **@Validated** 애노테이션을 붙이면 된다.

```java
@PostMapping("/save")
public String saveItem(@Validated @ModelAttribute Item item, // @Validated 추가
                       BindingResult bindingResult,
                       RedirectAttributes redirectAttributes) {

    if (bindingResult.hasErrors()) {
        return "item/saveForm";
    }

    // 검증 성공 로직
    ...
}
```

@Validated는 **검증기를 실행**하는 애노테이션이다.

스프링은 해당 애노테이션이 붙은 객체에 대해서 다음 과정을 수행한다.

- WebDataBinder에 등록된 Validator 중에서 **supports()** 메서드 호출 결과 true인 것을 찾음
- 해당 Validator의 **validate()** 메서드를 실행함

이 방식을 통해 컨트롤러는 검증 로직의 구체적인 내용과 **완전히 분리**되어 훨씬 깔끔해진다.

또한 해당 검증기는 다른 곳에서도 **재사용**될 수 있다.

---

## 참고 – @Validated, @Valid

검증 시 @Validated, @Valid 둘 다 사용할 수 있다.

- @Validated → org.springframework.validation.annotation
- @Valid → jakarta.validation

@Validated는 **스프링 전용** 검증 애노테이션이고, @Valid는 **자바 표준** 검증 애노테이션이다.

단, **@Valid**를 사용하려면 build.gradle에 다음 의존관계를 추가해야 한다.

```java
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

@Validated는 @Valid와 달리 [**groups 기능**](https://uh1205.tistory.com/210)을 지원한다.
