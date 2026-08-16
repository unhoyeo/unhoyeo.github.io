---
title: "Arrays.binarySearch()와 Collections.binarySearch()의 차이"
description: "Java의 Arrays.binarySearch()와 Collections.binarySearch()는 이진 탐색(binary search) 알고리즘을 기반으로 하는 대표적인 메서드로, 정렬된 데이터에서 특정 값을 빠르게 탐색하는 데…"
pubDate: 2025-06-21T01:08:10+09:00
category: "자바"
tags: []
---

Java의 Arrays.binarySearch()와 Collections.binarySearch()는 **이진 탐색(binary search)** 알고리즘을 기반으로 하는 대표적인 메서드로, 정렬된 데이터에서 특정 값을 빠르게 탐색하는 데 사용된다. 하지만 **자료형**에서 오는 차이점이 존재한다.

---

## 공통점

- <strong>이진 탐색 기반</strong>으로, 시간 복잡도가 <strong>O(log N)</strong>이다.
- **반드시 정렬된 상태**의 배열/컬렉션에서만 정상적으로 동작한다.
- **탐색 실패 시 음수 값을 반환**한다.
  - **-(삽입될 위치) - 1** 형태로 반환된다.

---

## 차이점

|  |  |  |
| --- | --- | --- |
| **항목** | **Arrays.binarySearch()** | **Collections.binarySearch()** |
| **대상 자료형** | **배열** (int[], Object[] 등) | **List&lt;T>** (예: ArrayList) |
| <strong>제네릭 지원</strong> | 제한적 (<strong>Object[]</strong>만 제네릭) | 완전한 제네릭 지원 |
| <strong>Comparator 지원 여부</strong> | <strong>Object[]</strong>에 한해 가능 | Comparator&lt;? super T>로 지원 |
| **내부 구현** | 배열 인덱스를 기준으로 구현 | List의 get()을 반복 호출 |
| **성능** | 기본형 배열 사용 시 매우 빠름 | ArrayList처럼 get()이 빠른 리스트에 적합 |

---

## 예시 코드 비교

```java
// Arrays.binarySearch
int[] arr = {1, 3, 5, 7, 9};
int index1 = Arrays.binarySearch(arr, 5); // 결과: 2

// Collections.binarySearch
List<Integer> list = Arrays.asList(1, 3, 5, 7, 9);
int index2 = Collections.binarySearch(list, 5); // 결과: 2
```

```java
// Comparator 사용 예시
List<String> words = Arrays.asList("Apple", "Banana", "Cherry");
int index1 = Collections.binarySearch(words, "banana");  // 결과: -4
int index2 = Collections.binarySearch(words, "banana", String.CASE_INSENSITIVE_ORDER);  // 결과: 1
```

---

## 실무 적용 기준

- **배열** 기반은 Arrays.binarySearch(), **컬렉션** 기반은 Collections.binarySearch()
- **Comparator**나 **타입 안정성**이 필요한 경우 ➤ Collections.binarySearch()
  - Arrays.binarySearch()의 경우, 배열 타입과 key 타입의 안정성은 컴파일러가 보장하지 않음
    - 실수로 Object[]에 Integer를 넣고 String을 찾으면 런타임 에러 가능
  - Collections.binarySearch()는 타입 바운드가 더 엄격함
    - 타입 안정성 확보가 강력하며 실무에서 더 안전한 사용이 가능

---

## 추가 주의사항

- 이진 탐색이므로 **반드시 데이터를 정렬**한 이후에 사용해야 한다. 정렬 기준과 탐색 기준이 다르면 잘못된 결과가 나온다.
- 리스트에 대해 이진 탐색을 수행할 때는 LinkedList보다는 **ArrayList**처럼 get()이 빠른 리스트가 적합하다. 그렇지 않으면 성능이 O(n log n)으로 저하될 수 있습니다.
- 탐색 실패 시 **-삽입위치 - 1**을 반환하므로, 다음과 같은 로직이 필요할 수 있다.

```java
int index = Arrays.binarySearch(arr, target);
if (index < 0) {
    int insertPoint = -(index + 1);
    // 여기에 삽입 또는 처리 로직
}
```

---

## 정리

- **공통점**: 정렬된 자료에서 이진 탐색 수행, 실패 시 음수 반환
- **차이점**: 대상 자료형, 제네릭 지원, Comparator 적용 방식 등
- **실무 선택 기준**:
  - 배열이면 Arrays, 리스트면 Collections
  - 정렬 기준 필요 시 Collections.binarySearch(list, key, comparator)
