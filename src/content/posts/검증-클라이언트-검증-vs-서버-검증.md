---
title: "검증 (클라이언트 검증 vs 서버 검증)"
description: "웹 애플리케이션에서 검증은 애플리케이션의 견고함과 사용자 경험을 좌우하는 핵심 기능이다. 여기서 검증은 사용자가 폼(Form)을 통해 데이터를 제출했을 때, 해당 데이터가 비즈니스 규칙에 맞는지 체계적으로 확인하고, 오류가 있다면…"
pubDate: 2025-08-17T13:05:32+09:00
category: "스프링/MVC"
tags: []
---

웹 애플리케이션에서 **검증**은 애플리케이션의 견고함과 사용자 경험을 좌우하는 핵심 기능이다.

여기서 검증은 사용자가 폼(Form)을 통해 데이터를 제출했을 때, 해당 데이터가 비즈니스 규칙에 맞는지 체계적으로 확인하고, 오류가 있다면 사용자에게 명확하고 친절하게 알려주는 전반적인 과정을 의미한다.

검증은 크게 **클라이언트 검증**과 **서버 검증**으로 나눌 수 있다.

---

## 클라이언트 검증

- 브라우저(JavaScript, HTML5 input 속성 등)나 모바일 앱에서 사용자 입력을 즉시 검증
- 예: 이메일 형식, 비밀번호 길이, 필수 입력 여부 등
- **✅ 장점**
  - 빠른 피드백 제공 → **사용자 경험(UX)** 향상
  - 서버까지 요청이 가지 않아 네트워크/서버 리소스 절약

- **❌ 한계**
  - 클라이언트 코드는 언제든 **조작 가능** (F12 → 콘솔, 네트워크 탭, Postman 같은 툴로 무력화 가능)
  - 보안적 신뢰 불가 → 데이터 무결성 보장 불가
- ➡️ **클라이언트 검증은 UX 목적이지, 보안 목적이 아님!**

---

## 서버 검증

- 서버(API, Controller, Service 단)에서 모든 입력 데이터 검증
- 예: Spring에서 @Valid, Bean Validation, Custom Validator 사용
- **✅ 장점**
  - 신뢰 가능한 검증 (클라이언트 조작 불가능)
  - 비즈니스 규칙 적용 가능 (예: 특정 사용자 권한, DB 제약 조건 등)

- **❌ 한계**
  - 사용자가 잘못된 입력을 하면, 응답 받아보기까지 대기 → UX 저하
  - 네트워크/서버 자원 낭비 (불필요한 요청이 서버까지 감)
- ➡️ **서버 검증은 보안과 무결성 보장을 위해 필수!**

---

## 결론

- 클라이언트 검증은 조작할 수 있으므로, 보안에 취약함
- 서버만으로 검증하면, 즉각적인 고객 사용성이 부족함
- 둘을 적절히 섞어서 사용하되, 최종적으로 **서버 검증은 필수**
- **API 스펙**을 잘 정의해서 검증 실패 시 일관된 응답 구조를 제공하면 클라이언트와 협업 효율 증가

---

## 서버 검증 – 직접 구현 예시

```java
@PostMapping("/save")
public String saveItem(@ModelAttribute Item item,
                       RedirectAttributes redirectAttributes,
                       Model model) {

    // 검증 오류를 보관할 Map
    Map<String, String> errors = new HashMap<>();

    // 검증 로직
    if (!StringUtils.hasText(item.getName())) {
        errors.put("name", "상품 이름은 필수 값입니다.");
    }

    if (item.getPrice() == null || item.getPrice() < 1_000 || item.getPrice() > 5_000) {
        errors.put("price", "상품 가격은 1,000원 이상 5,000원 이하이여야 합니다.");
    }

    if (item.getQuantity() == null || item.getQuantity() > 999) {
        errors.put("quantity", "상품 수량은 999개 이하이여야 합니다.");
    }

    // 복합 조건 검증
    if (item.getPrice() != null && item.getQuantity() != null) {
        int result = item.getPrice() * item.getQuantity();
        if (result < 100_000) {
            errors.put(
                    "globalError",
                    "상품 가격과 수량의 곱은 100,000 이상이여야 합니다. 현재 값 = " + result
            );
        }
    }

    // 검증 실패 시 다시 입력 폼으로 이동
    if (!errors.isEmpty()) {
        model.addAttribute("errors", errors);
        return "item/saveForm";
    }

    // 검증 성공 로직
    Item savedItem = itemRepository.save(item);

    // 리다이렉트 시 파라미터 전달
    redirectAttributes.addAttribute("itemId", savedItem.getId());
    redirectAttributes.addAttribute("status", true);

    return "redirect:/items/{itemId}";
}
```

- 검증 과정에서 오류 발생 시, 다음과 같은 형태로 Map에 담아둔다.
  - **key = 오류가 발생한 필드명** (특정 필드명을 지정하기 어려운 경우, "**globalError**"를 key로 사용)
  - **value = 오류 메시지**
- 오류가 하나라도 있으면, 오류를 담은 Map을 **model에 추가**하여 뷰에 전달한다.
- @ModelAttribute를 통해 Item 객체를 받았으므로, model에는 이미 item 객체가 들어있다.
  - 따라서 **기존 입력 폼 값을 유지**할 수 있다.
- 뷰에서는 ${errors['필드명']}을 통해 해당 필드의 오류 메시지를 표시한다.

```html
<label for="price" th:text="#{label.item.price}">가격</label>
<input class="form-control"
       id="price"
       placeholder="가격을 입력하세요"
       th:classappend="${errors?.containsKey('price')} ? 'field-error' : _"
       th:field="*{price}"
       type="text"
/>

<div class="field-error"
     th:if="${errors?.containsKey('price')}"
     th:text="${errors['price']}">
  가격 필드 오류
</div>
```

- **?. (Safe Navigation Operator)**
  - 첫 번째 인수가 null이면 null을 반환하는 이항 연산자
  - NullPointerException을 방지해줌
  - SpringEL이 제공하는 문법 ([참고](https://docs.spring.io/spring-framework/reference/core/expressions/language-ref/operator-safe-navigation.html))

---

## 위 코드의 문제점

- **뷰 템플릿 중복**
  - 오류 메시지를 출력하는 로직이 각 필드마다 반복됨
  - 비슷한 코드가 많아 유지보수가 어려움
- **타입 변환 실패(TypeMismatch) 처리 문제**
  - price 같은 숫자 필드에 문자열을 저장할 경우, **TypeMismatchException**이 발생함
  - 이 경우 **컨트롤러 메서드가 호출되기도 전에** 바인딩에 실패했기 때문에, **400 오류**가 발생함
- **사용자 경험(UX) 문제**
  - 바인딩 예외가 발생하더라도, UX를 위해 사용자가 입력한 값은 그대로 유지해야 함
  - 그러나 **바인딩 자체가 실패**했기 때문에 **사용자가 입력한 값은 사라지게 됨**
  - 따라서 **사용자가 입력한 값도 별도로 관리**해야 함

위 문제들은 스프링이 제공하는 **BindingResult** 인터페이스를 사용하면 해결할 수 있다.
