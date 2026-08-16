---
title: "타임리프 폼 데이터 바인딩 – th:object, th:field"
description: "타임리프는 스프링 환경에서 HTML 폼 요소와 서버 측 객체 간의 데이터 바인딩을 매우 직관적으로 처리할 수 있는 기능을 제공한다."
pubDate: 2025-08-12T23:09:27+09:00
category: "스프링/MVC"
tags: []
---

타임리프는 스프링 환경에서 HTML 폼 요소와 서버 측 객체 간의 데이터 바인딩을 매우 직관적으로 처리할 수 있는 기능을 제공한다.

이를 통해 개발자는 반복적인 코드 작성을 줄이고, 서버에서 전달된 데이터를 손쉽게 화면에 렌더링하며, 사용자가 입력한 값을 다시 서버의 객체로 매핑할 수 있다.

그중 타임리프의 핵심 속성인 **th:object**와 **th:field**에 대해서 알아보자.

---

## th:object (폼 데이터의 주인 지정)

- <strong>폼 바인딩 대상 객체(커맨드 객체)</strong>를 지정하는 속성
- HTML &lt;form> 태그에서 주로 사용하며, 이후 폼 내부의 모든 데이터 바인딩의 기준점이 됨
- th:object="${userForm}"과 같이 모델에 담긴 객체 이름을 지정
- 해당 폼 내부에서 ${userForm.name} 대신 간결하게 \*{name} 형태로 접근 가능 (**선택 변수 표현식**)
- 단, 서버에서 해당 객체를 모델에 담아 뷰로 전달해야 함 (등록 폼의 경우, 아직 입력 전이므로 비어있는 객체를 전달)

---

## th:field (입력 값과 필드 값을 서로 연결)

- th:object로 지정된 객체의 특정 필드와 폼 입력 요소를 직접 연결하는 속성 (양방향 데이터 바인딩)
  - 화면에 객체 데이터를 출력할 뿐만 아니라, 사용자가 폼을 제출했을 때 입력된 값을 다시 객체의 해당 필드로 매핑
- th:field="\*{name}"과 같이 바인딩할 객체의 필드명을 지정
- 타임리프는 해당 요소의 **id, name, value** 속성을 자동으로 생성해 줌
  - id, name → 필드명(name)으로 설정됨 (반복 렌더링 시 id는 중복되지 않도록 뒤에 순번이 자동으로 붙음)
  - value → 필드 값(userForm.getName())으로 채워짐
- 속성 관리 자동화:
  - **체크박스/라디오 버튼**: 객체 필드의 값이 th:value로 지정된 값과 일치하면 checked 속성이 자동으로 추가됨
  - **셀렉트 박스**: 객체 필드의 값이 &lt;option>의 value와 일치하면 selected 속성이 자동으로 추가됨

---

## 실전 예제 (사용자 정보 입력 폼 구현)

```java
@Data
public class UserForm {
    private String name;          // 텍스트 입력
    private Boolean agree;        // 단일 체크박스
    private List<String> hobbies; // 다중 체크박스
    private String gender;        // 라디오 버튼
    private String country;       // 셀렉트 박스
}
```

- HTML 폼과 서버 간 데이터 바인딩을 담당하는 커맨드 객체
- th:object="${userForm}"으로 지정하면 UserForm의 필드가 폼 입력 요소와 연결

```java
@Controller
@RequestMapping("/users")
public class UserController {

    // 폼 화면을 보여주는 메서드
    @GetMapping("/form")
    public String showForm(Model model) {
        // th:object에서 사용할 비어있는 커맨드 객체를 모델에 추가
        model.addAttribute("userForm", new UserForm());

        // 체크박스, 라디오, 셀렉트 박스에서 사용할 목록 데이터를 모델에 추가
        model.addAttribute("hobbyList", Arrays.asList("GAMING", "COOKING", "HIKING"));
        model.addAttribute("genderList", Arrays.asList("MALE", "FEMALE"));
        model.addAttribute("countryList", Arrays.asList("KR", "US", "JP"));

        // 뷰 이름 반환
        return "user-form";
    }

    // 폼 데이터를 제출받아 처리하는 메서드
    @PostMapping("/form")
    public String submitForm(@ModelAttribute UserForm userForm, Model model) {
        // @ModelAttribute를 통해 제출된 폼 데이터가 userForm 객체에 자동으로 바인딩됨
        model.addAttribute("submittedData", userForm);
        return "user-result"; // 결과 확인 페이지
    }
}
```

- th:object를 적용하려면 먼저 해당 객체의 정보를 넘겨주어야 함
- 등록 폼이기 때문에 데이터가 없는 비어있는 UserForm 객체를 생성하여 뷰에 전달

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="UTF-8">
    <title>User Form</title>
  </head>
  <body>
    <h1>User Form</h1>

    <form method="post" th:action="@{/users/form}" th:object="${userForm}">

      <!-- 텍스트 입력 -->
      <label>이름: <input th:field="*{name}" type="text"></label>
      <br><br>

      <!-- 단일 체크박스 -->
      <label><input th:field="*{agree}" type="checkbox"> 이용 약관 동의</label>
      <br><br>

      <!-- 다중 체크박스 -->
      <div>
        취미 선택:
        <div th:each="h : ${hobbyList}">
          <label>
            <input th:field="*{hobbies}" th:value="${h}" type="checkbox"> [[${h}]]
          </label>
        </div>
      </div>
      <br>

      <!-- 라디오 버튼 -->
      <div>
        성별:
        <div th:each="g : ${genderList}">
          <label>
            <input th:field="*{gender}" th:value="${g}" type="radio"> [[${g}]]
          </label>
        </div>
      </div>
      <br>

      <!-- 셀렉트 박스 -->
      <div>
        국가:
        <select th:field="*{country}">
          <option value="">-- 선택하세요 --</option>
          <option th:each="c : ${countryList}" th:text="${c}" th:value="${c}"></option>
        </select>
      </div>
      <br>

      <button type="submit">제출</button>
    </form>

  </body>
</html>
```

- **라디오 버튼:**
  - 한 그룹 내에서 하나만 선택 가능 (체크박스는 다중 선택 가능)
  - 같은 name 속성을 공유하며, th:field 사용 시 자동 설정
  - 현재 선택 값과 일치하는 &lt;input> 태그에 자동으로 checked="checked" 처리 (체크박스도 마찬가지)
- **셀렉트 박스:**
  - 라디오 버튼과 마찬가지로 하나만 선택 가능
  - 현재 선택 값과 일치하는 &lt;option> 태그에 자동으로 selected="selected" 적용

---

## 체크박스 처리의 비밀

th:field를 사용한 체크박스 처리는 순수 HTML과 다른 중요한 특징이 있다.

HTML 기본 체크박스와 th:field를 사용한 체크박스의 차이를 알아보자.

---

## HTML 기본 체크박스

```html
<input type="checkbox" name="agree">
```

- **체크 시**:
  - agree=on이 전송됨 (value 속성을 지정하면 on 대신 그 값이 전송됨)
- **체크 해제 시**:
  - 아무런 값도 전송되지 않음 (해당 name 필드가 전송 데이터에 아예 포함되지 않음)
  - ⚠️ 이로 인해 서버에서는 해당 필드를 null로 수신하게 되어, boolean 타입으로 바인딩할 때 문제 발생 가능

---

## 타임리프 + 스프링 체크박스 (th:field 사용)

```html
<input type="checkbox" th:field="*{agree}">
```

스프링은 위 문제를 해결하기 위해 name에 **\_ 접두사**를 붙인 **히든 필드**를 자동으로 생성하여 렌더링함 (스프링 폼 태그 처리 규칙에 따름)

```html
<input type="checkbox" id="agree1" name="agree" value="true">
<input type="hidden" name="_agree" value="on"/>
```

- **체크 시**:
  - 체크박스 값(agree=true), 히든 필드 값(\_agree=on) 모두 전송됨
  - 스프링은 \_ 접두사가 없는 agree 파라미터를 우선하므로 true로 바인딩됨 (on → true 변환은 스프링의 타입 컨버터가 수행)
- **체크 해제 시**:
  - 체크박스 값은 전송되지 않고, 히든 필드 값(\_agree=on)만 전송됨
  - 스프링은 \_ 접두사가 있는 파라미터가 단독으로 전송되면, 해당 필드를 false로 처리함

이러한 메커니즘 덕분에 개발자는 null 체크 없이 boolean 타입 필드에 true 또는 false를 안정적으로 바인딩 가능

---

## 반복문 내 label과 id 연동 문제 해결

th:each와 같은 반복문 안에서 th:field를 사용하면 다음과 같은 심각한 문제가 발생할 수 있다.

---

## 문제 상황

HTML 명세상 모든 요소의 id 속성은 문서 내에서 유일해야 한다.

따라서 타임리프는 반복문 내에서 th:field="\*{...}"를 사용하면 id가 중복되지 않도록 자동으로 순번을 붙인다.

```html
<input type="checkbox" id="hobbies1" name="hobbies" value="GAMING">
<input type="checkbox" id="hobbies2" name="hobbies" value="COOKING">
<input type="checkbox" id="hobbies3" name="hobbies" value="HIKING">
```

즉, id가 동적으로 생성되기 때문에 &lt;label for="id 값">과 같이 id 값이 필요한 다른 요소에 id를 지정하는 것이 곤란해진다.

---

## 해결책: #ids 유틸리티 객체

타임리프는 이러한 동적 id 문제를 해결하기 위해 **ID 유틸리티 객체 #ids**를 제공한다.

- **#ids.prev(name)**: 바로 직전에 생성된 name 속성을 가진 요소의 id 값을 반환
- **#ids.next(name)**: 다음에 생성될 name 속성을 가진 요소의 id 값을 예측하여 반환

이를 사용하여 &lt;label>의 for 속성을 동적으로 생성할 수 있다.

```html
<div th:each="hobby : ${hobbyList}">
  <input type="checkbox" th:field="*{hobbies}" th:value="${hobby}">
  <label th:for="${#ids.prev('hobbies')}" th:text="${hobby}"></label>
</div>
```

⚠️ #ids.prev()는 구문상 바로 앞에 있는 요소를 참조하므로, input 태그 바로 뒤에 label 태그를 위치시키는 것이 가장 안전하고 명확

렌더링 결과:

```html
<input value="GAMING" type="checkbox" id="hobbies1" name="hobbies">
<label for="hobbies1">GAMING</label>

<input value="COOKING" type="checkbox" id="hobbies2" name="hobbies">
<label for="hobbies2">COOKING</label>

<input value="HIKING" type="checkbox" id="hobbies3" name="hobbies">
<label for="hobbies3">HIKING</label>
```

이제 각 label은 자신과 쌍을 이루는 input의 고유한 id와 정확하게 연결되어, 텍스트를 클릭해도 해당 체크박스가 올바르게 동작한다.
