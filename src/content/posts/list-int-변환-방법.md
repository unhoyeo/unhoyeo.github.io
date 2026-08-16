---
title: "List ↔ int[] 변환 방법"
description: "✅ Java 8 이상 – Stream API 사용 (권장) list.stream() → 스트림 생성 .mapToInt(Integer::intValue) → Integer를 int로 언박싱 .toArray() → 배열로 변환…"
pubDate: 2025-10-08T17:27:40+09:00
category: "자바"
tags: []
---

## 1️⃣ List → int[] 변환

✅ **Java 8 이상 – Stream API 사용 (권장)**

```java
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

int[] arr = list.stream()
                .mapToInt(Integer::intValue)
                .toArray();
```

- list.stream() → 스트림 생성
- .mapToInt(Integer::intValue) → Integer를 int로 언박싱
- .toArray() → 배열로 변환
- 내부적으로 **박싱/언박싱 연산**이 포함되어 있어, **아주 큰 리스트에서는 미세한 오버헤드** 존재

---

✅ **for문을 이용한 수동 변환**

```java
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

int[] arr = new int[list.size()];
for (int i = 0; i < list.size(); i++) {
    arr[i] = list.get(i);
}
```

- 리스트 크기만큼 배열 생성 후, 인덱스로 직접 접근
- **불필요한 객체 생성이 없고 효율적**이지만, 코드가 다소 장황
- Java 7 이하 환경이나 단순 변환 시 유용

---

## 2️⃣ int[] → List 변환

✅ **Java 8 이상 – Stream API 사용 (권장)**

```java
int[] arr = {1, 2, 3, 4, 5};

List<Integer> list = Arrays.stream(arr)
                           .boxed()
                           .collect(Collectors.toList());
```

- Arrays.stream(arr) → IntStream 생성
- .boxed() → 각 int를 Integer로 박싱
- .collect(Collectors.toList()) → List&lt;Integer>로 수집
- **가독성**, **성능**, **유연성** 측면에서 가장 실무적으로 권장

---

✅ **for문을 이용한 수동 변환**

```java
int[] arr = {1, 2, 3, 4, 5};

List<Integer> list = new ArrayList<>();
for (int num : arr) {
    list.add(num); // auto-boxing 발생
}
```

- 자동 박싱(int → Integer)이 일어나며 코드 동작이 직관적
- **병렬 처리 불가능**, 대량 데이터에서는 Stream보다 비효율적

---

## 실무 팁

- 변환 후 **읽기 전용** 리스트가 필요하면 **toList()** (Java 16+) 사용 가능

```java
List<Integer> list = Arrays.stream(arr).boxed().toList(); // 불변 리스트
```

- 변환 후 **수정 가능한 리스트**가 필요하면 명시적으로 new ArrayList<>(...) 감싸야 한다.

```java
List<Integer> modifiableList = new ArrayList<>(Arrays.stream(arr).boxed().toList());
```
