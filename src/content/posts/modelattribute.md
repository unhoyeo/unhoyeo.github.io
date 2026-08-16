---
title: "@ModelAttribute"
pubDate: 2025-07-29T22:42:24+09:00
category: "스프링/MVC"
tags: ["타입 변환"]
---

**@ModelAttribute란?**

스프링 MVC에서 컨트롤러 메서드의 파라미터나 반환 값을 모델(Model)에 바인딩하거나,

HTTP 요청 파라미터를 커맨드 객체로 변환하여 컨트롤러 메서드의 파라미터에 바인딩할 때 사용하는 애노테이션이다.

즉, 여러 개의 파라미터가 하나의 객체 필드로 대응될 수 있을 때, 그 객체를 자동으로 생성하고 필드에 값을 바인딩해 준다.

@RequestParam은 요청 파라미터를 <strong>단순 타입(int, Long, String, Enum 등)</strong>의 파라미터로 받을 때 사용한다면,

@ModelAttribute는 요청 파라미터를 <strong>복합 타입(UserForm 등)</strong>의 파라미터로 받을 때 사용한다.

예시:

```java
POST /join
Content-Type: application/x-www-form-urlencoded

name=kim&age=25
```

```java
@Getter @Setter
public class UserForm {
    private String name;
    private int age;
}
```

```java
@PostMapping("/join")
public String join(@ModelAttribute("userForm") UserForm form) { ... }
```

요청 본문의 폼 데이터 → UserForm 객체로 자동 변환됨

(자동으로 객체를 생성하고, Setter를 이용하여 name 필드에는 "kim"을, age 필드에는 25를 주입)

Model에 "userForm"이라는 이름으로 위 데이터가 저장됨

---

**왜 중요한가?**

- 복잡한 폼 데이터 처리: 여러 필드를 일일이 @RequestParam으로 받지 않아도 됨
- 계층형 객체 처리 가능: 내부 객체나 컬렉션까지 자동 바인딩
- 뷰 렌더링을 위한 모델 객체 자동 등록: @ModelAttribute로 받은 객체는 자동으로 Model에 포함됨
- 유효성 검증과의 자연스러운 통합: @Valid, BindingResult와 함께 사용

---

## @ModelAttribute를 반환 값에 선언하는 경우?

@ModelAttribute는 보통 메서드의 **파라미터**에서 사용되지만, 메서드의 **반환 값**에서도 사용이 가능하다.

@ModelAttribute를 처리하는 **ModelAttributeMethodProcessor** 또한

HandlerMethodArgumentResolver와 HandlerMethodReturnValueHandler를 모두 상속하고 있다.

HandlerAdapter는 컨트롤러 메서드를 실행하기 전에 다음 과정을 먼저 거친다.

1. 반환 값에 @ModelAttribute가 선언된 메서드를 먼저 실행
2. 해당 메서드의 반환 값을 Model에 저장

예시:

```java
@Controller
public class SampleController {

    @ModelAttribute("regions")
    public List<String> regions() {
        return List.of("서울", "부산", "제주");
    }

    @GetMapping("/hello")
    public String hello(Model model) {
        // model.getAttribute("regions") 가능
        return "helloView";
    }
}
```

- GET /hello 요청 시, regions() 메서드가 먼저 실행됨
- 해당 반환 값이 Model에 "regions"라는 이름으로 자동 등록됨
- 이후 다른 메서드에서 model 객체로 받거나, 뷰 렌더링 시 사용 가능

따라서 공통 데이터(예: 드롭다운 코드 목록)를 등록할 때 유용하다.

---

**속성 정리**

|  |  |
| --- | --- |
| **속성명** | **설명** |
| value (=name) | 바인딩할 모델 속성의 이름 (Model에 저장될 이름) |
| binding | 바인딩 수행 여부 (기본값: true) |

⚠️ value (=name) 속성을 지정하지 않을 경우, 클래스명(메서드 파라미터의 타입 또는 메서드의 반환 타입)을 camelCase로 하여 지정됨

```java
@ModelAttribute("hello") UserForm form  // hello로 지정됨
@ModelAttribute UserForm form  // userForm으로 지정됨
```

---

## 내부 동작 방식 (ModelAttributeMethodProcessor)

```java
DispatcherServlet
  ↓
HandlerMapping
  ↓
HandlerAdapter
  ↓
HandlerMethodArgumentResolverComposite
  ↓
ModelAttributeMethodProcessor
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
   - @ModelAttribute가 붙은 파라미터의 경우, ModelAttributeMethodProcessor가 선택됨
5. ModelAttributeMethodProcessor
   - 실제로 @ModelAttribute를 처리하는 전담 Resolver
   - 내부적으로 파라미터 타입의 기본 생성자를 호출하여 객체를 생성함
6. WebDataBinderFactory
   - 바인딩을 위한 WebDataBinder 객체 생성
   - 내부적으로 Setter를 통해 각 필드에 값을 바인딩함
7. ConversionService (GenericConversionService)
   - 바인딩 시 각 필드 타입에 맞게 타입 변환 수행
   - 예: "25" → int 25 로 변환
   - 커스텀 Converter가 등록되어 있다면 여기서 활용됨
8. 핸들러 메서드 실행
   - 모든 파라미터가 바인딩되면, 컨트롤러의 핸들러 메서드가 실행됨

예시: name=kim&age=25

```java
@PostMapping("/user")
public String save(@ModelAttribute User user) { ... }
```

1. ModelAttributeMethodProcessor가 **기본 생성자**를 호출하여 User 객체 생성 (new User())
2. WebDataBinder가 **Setter**를 호출해서 User 객체 필드에 값 주입
3. 이때, "25"는 ConversionService 통해서 int 타입 25로 **타입 변환**하여 주입
4. 바인딩 완료된 객체를 메서드에 전달

---

## @ModelAttribute 주의 사항

- **@ModelAttribute 생략 시**: Spring MVC의 HandlerMethodArgumentResolver 전략에 기반하여 다음과 같이 처리됨
  - 단순 타입 ? @RequestParam
    - int, boolean, Integer, String, LocalDate, Date, Enum 등
  - 그 외 복합 타입 ? @ModelAttribute
    - 자바 빈 규약을 따르는 객체, DTO 클래스, 컬렉션이 아닌 복합 구조 등
    - 예외: ArgumentResolver로 처리되는 타입
      - HttpServletRequest, Model, BindingResult 등은 각각의 전용 리졸버가 처리한다.
- **기본 생성자 + Setter 필수**: 내부적으로 객체를 생성하고, 값을 주입하려면 필수
  - 기본 생성자는 클래스에 생성자가 하나도 선언되어 있지 않다면, 자바 컴파일러가 자동으로 만들어 준다.
  - Setter 대신 AllArgsConstructor를 사용해도 값이 주입된다.
    - 단, 생성자의 파라미터 이름이 요청 파라미터 이름과 일치해야 하고,
    - 자바 컴파일러에 -parameters 옵션을 넣어주어야 한다. (Build and run using: Gradle 설정으로도 가능)
- **@RequestBody와 혼용 불가**
  - JSON 요청은 @ModelAttribute로 처리할 수 없기 때문에, 이때는 @RequestBody를 사용해야 한다.
- **파라미터 누락 시 예외가 발생하지 않음**
  - 파라미터가 누락되면 null이 주입되는 것이 아니라, 빈 객체가 생성된다.
  - 따라서 내부 로직에서 예외 처리를 해야 한다.

- **데이터 바인딩 시, 외부에서 설정되어선 안 되는 필드가 노출될 수 있음**
  - 예: 사용자의 role, id, createdAt 같은 필드가 외부 요청에서 바인딩되면 취약점이 될 수 있음
  - 해결 방법:
    - DTO 클래스에서 바인딩 대상 필드만 노출
    - @InitBinder 사용하여 허용 필드 지정
    - 민감 필드는 Setter를 제거하거나 @JsonIgnore, transient 처리
- **@ExceptionHandler에서는 모델 객체 접근 불가**
  - 예외는 언제든지 발생할 수 있으므로, 모델 상태가 불완전할 수 있기 때문

---

**실무 적용 팁**

- **폼 바인딩용 DTO와 도메인 엔티티를 분리**
  - View/Form 처리에는 별도의 DTO 클래스를 만들어야 의도치 않은 값 주입을 방지할 수 있다.
  - 즉, 엔티티를 직접 바인딩하지 말고, DTO를 만들어서 사용 (예: UserForm)

- **전역 참조 데이터 등록**
  - 드롭다운 목록, 공통 코드 등은 @ModelAttribute 메서드로 모델에 등록
- **뷰 템플릿(thymeleaf 등)에서의 접근**
  - th:each="region : ${regions}"처럼 뷰에서 직접 접근 가능
- **가독성을 위해 명시적 사용 권장**
  - 생략이 가능하더라도, 실무에서는 @ModelAttribute를 명시하는 것이 낫다. (의도가 분명해짐)
