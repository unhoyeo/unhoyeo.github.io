---
title: "StringBuilder 메서드 정리"
description: "StringBuilder는 문자열을 수정할 수 있는 객체로, String보다 문자열 변경 작업에서 훨씬 효율적이다. 문자열을 뒤에 추가한다. + 연산자를 여러 번 사용할 경우보다 성능이 좋다. ✅ 시간 복잡도: O(1) ?"
pubDate: 2025-03-22T22:28:00+09:00
category: "자바"
tags: []
---

## StringBuilder에서 주로 사용하는 메서드 정리

> StringBuilder는 문자열을 수정할 수 있는 객체로, String보다 문자열 변경 작업에서 훨씬 효율적이다.

---

## 1️⃣ append(String s)

- 문자열을 **뒤에 추가**한다.
- **+ 연산자를 여러 번 사용할 경우보다 성능이 좋다.**
- ✅ **시간 복잡도**: O(1)

? **예제**

```java
StringBuilder sb = new StringBuilder("Hello");
sb.append(" World!");
System.out.println(sb); // "Hello World!"
```

---

## 2️⃣ insert(int index, String s)

- **특정 위치에 문자열을 삽입**한다.
- 기존 문자는 뒤로 밀린다.
- ✅ **시간 복잡도**: O(N)

? **예제**

```java
StringBuilder sb = new StringBuilder("Hello!");
sb.insert(5, " World"); // 5는 !
System.out.println(sb); // "Hello World!"
```

---

## 3️⃣ delete(int start, int end)

- **start 부터 end - 1 까지의 문자열을 삭제**한다.
- ✅ **시간 복잡도**: O(N)

? **예제**

```java
StringBuilder sb = new StringBuilder("Hello World!");
sb.delete(5, 11); // 5는 공백, 11은 !
System.out.println(sb); // "Hello!"
```

---

## 4️⃣ deleteCharAt(int index)

- **index에 해당하는 문자 하나만 삭제**한다.
- ✅ **시간 복잡도**: O(N)

? **예제**

```java
StringBuilder sb = new StringBuilder("Hello!");
sb.deleteCharAt(5); // 5는 !
System.out.println(sb); // "Hello"
```

---

## 5️⃣ replace(int start, int end, String s)

- **start 부터 end - 1 까지의 문자열을 s로 변경**한다.
- ✅ **시간 복잡도**: O(N)

? **예제**

```java
StringBuilder sb = new StringBuilder("Hello World!");
sb.replace(6, 11, "Java"); // 6은 W, 11은 !
System.out.println(sb); // "Hello Java!"
```

---

## 6️⃣ reverse()

- **문자열을 뒤집는다.**
- ✅ **시간 복잡도**: O(N)

? **예제**

```pgsql
StringBuilder sb = new StringBuilder("abc");
sb.reverse();
System.out.println(sb); // "cba"
```

---

## 7️⃣ setCharAt(int index, char c)

- **index 위치의 문자를 c로 변경**한다.
- ✅ **시간 복잡도**: O(1)

? **예제**

```java
StringBuilder sb = new StringBuilder("Java");
sb.setCharAt(0, 'K');
System.out.println(sb); // "Kava"
```

---

## 8️⃣ setLength(int newLength)

- **문자열의 길이를 해당 길이로 조절**한다.
  - 길이를 **줄이면, 그 이후 문자는 삭제된다.**
  - 길이를 **늘리면, 남은 부분은 \0 (null 문자)로 채워진다.**
- ✅ **시간 복잡도**: O(1)

? **예제**

```java
StringBuilder sb = new StringBuilder("Hello World!");
sb.setLength(5);
System.out.println(sb); // "Hello"
```

---

## 9️⃣ toString()

- StringBuilder 객체를 일반적인 **String으로 변환**한다.
- ✅ **시간 복잡도**: O(N)

? **예제**

```java
StringBuilder sb = new StringBuilder("Hello");
String str = sb.toString();
System.out.println(str); // "Hello"
```

---

## ✅ 정리

|  |  |  |
| --- | --- | --- |
| **append**(String s) | 문자열 끝에 추가 | O(1) |
| **insert**(int index, String s) | 특정 위치에 문자열 삽입 | O(N) |
| **delete**(int start, int end) | 특정 범위 문자 삭제 | O(N) |
| **deleteCharAt**(int index) | 특정 문자 하나 삭제 | O(N) |
| **replace**(int start, int end, String s) | 특정 범위 문자 변경 | O(N) |
| **reverse**() | 문자열 뒤집기 | O(N) |
| **setCharAt**(int index, char c) | 특정 문자 하나 변경 | O(1) |
| **setLength**(int newLength) | 문자열 길이 조정 | O(1) |
| **toString**() | StringBuilder → String 변환 | O(N) |

추가적으로, String에서도 사용하는 **length(), charAt(), substring(), indexOf()** 같은 메서드도 존재한다.

---

## StringBuilder를 사용해야 하는 경우

- 문자열을 **여러 번 수정**할 때 (+ 연산자 대신 append() 사용)
- 문자열을 **뒤집거나 특정 부분만 변경**할 때 **(reverse(), setCharAt())**
- 문자열을 **동적으로 생성**해야 할 때 **(delete(), insert())**

➡️ **빠른 문자열 조작이 필요하면 StringBuilder 사용이 필수!** ?
