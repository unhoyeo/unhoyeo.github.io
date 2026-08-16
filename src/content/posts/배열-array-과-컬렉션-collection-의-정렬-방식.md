---
title: "배열(Array)과 컬렉션(Collection)의 정렬 방식"
description: "배열은 java.util.Arrays 클래스의 정적 메서드 sort()를 이용해 정렬한다. 기본적으로 오름차순 정렬이며, 내림차순 정렬 시에는 Comparator를 함께 사용해야 한다."
pubDate: 2025-10-10T17:48:09+09:00
category: "자바"
tags: []
---

## 배열(Array) 정렬

- 배열은 java.util.<strong>Arrays</strong> 클래스의 정적 메서드 sort()를 이용해 정렬한다.
- 기본적으로 **오름차순** 정렬이며, **내림차순** 정렬 시에는 Comparator를 함께 사용해야 한다.

## 1. 기본 타입 배열 (int[], double[] 등)

```java
import java.util.Arrays;

public class ArraySortExample {
    public static void main(String[] args) {
        int[] numbers = {5, 2, 9, 1, 7};

        // 오름차순
        Arrays.sort(numbers);

        // 내림차순
        // 기본 타입 배열은 Comparator를 직접 적용할 수 없음 → 박싱 필요
        Integer[] boxed = Arrays.stream(numbers)
                .boxed()
                .toArray(Integer[]::new);

        Arrays.sort(boxed, (a, b) -> b - a);

        // 출력 결과
        System.out.println(Arrays.toString(numbers)); // [1, 2, 5, 7, 9]
        System.out.println(Arrays.toString(boxed));   // [9, 7, 5, 2, 1]
    }
}
```

- Arrays.sort()는 **Dual-Pivot Quicksort**(primitive type) 또는 **TimSort**(object type) 알고리즘을 사용한다.
- 기본 타입은 Comparator를 적용할 수 없기 때문에, <strong>박싱(boxing)</strong>을 통해 Integer[]로 변환해야 내림차순 정렬이 가능하다.

## 2. 참조 타입 배열 (String[], Integer[] 등)

```java
import java.util.Arrays;
import java.util.Collections;

public class ObjectArraySort {
    public static void main(String[] args) {
        String[] names = {"Tom", "Jerry", "Alice", "Bob"};

        // 오름차순
        Arrays.sort(names);
        System.out.println(Arrays.toString(names)); // [Alice, Bob, Jerry, Tom]

        // 내림차순
        Arrays.sort(names, Collections.reverseOrder());
        System.out.println(Arrays.toString(names)); // [Tom, Jerry, Bob, Alice]
    }
}
```

- 객체 배열은 **Comparable 인터페이스를 구현**해야 정렬이 가능하다. (String, Integer 등은 이미 구현됨)
- <strong>Collections.reverseOrder()</strong>는 내부적으로 Comparator를 반환하여 내림차순 정렬을 수행한다.

---

## 컬렉션(Collection) 정렬

- 컬렉션(List, Set 등)은 <strong>Collections.sort()</strong>나 <strong>List.sort()</strong>를 사용한다.
- 단, Set은 순서가 없기 때문에 정렬하려면 List로 변환해야 한다.

## 1. List 정렬 예시

```java
import java.util.*;

public class ListSortExample {
    public static void main(String[] args) {
        List<Integer> list = Arrays.asList(5, 2, 9, 1, 7);

        // 오름차순
        Collections.sort(list);
        System.out.println(list); // [1, 2, 5, 7, 9]

        // 내림차순
        Collections.sort(list, Collections.reverseOrder());
        System.out.println(list); // [9, 7, 5, 2, 1]
    }
}
```

## 2. List + 커스텀 Comparator 예시

```java
import java.util.*;

public class CustomComparatorExample {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("apple", "banana", "kiwi", "orange");

        // 문자열 길이 기준 오름차순
        list.sort(Comparator.comparingInt(String::length));
        System.out.println(list); // [kiwi, apple, banana, orange]

        // 문자열 길이 기준 내림차순
        list.sort(Comparator.comparingInt(String::length).reversed());
        System.out.println(list); // [banana, orange, apple, kiwi]
    }
}
```

- Collections.sort()는 내부적으로 List.sort()를 호출한다.
- Java 8 이상에서는 List.sort(Comparator)를 바로 사용하는 것이 권장된다.
- Comparator.comparing(), .reversed(), .thenComparing() 등을 활용하면 다단계 정렬도 가능하다.

---

## 스트림(Stream) 기반 정렬 (Java 8 이상)

```java
import java.util.*;
import java.util.stream.Collectors;

public class StreamSortExample {
    public static void main(String[] args) {
        List<Integer> list = Arrays.asList(5, 2, 9, 1, 7);

        // 오름차순
        List<Integer> asc = list.stream()
                .sorted()
                .collect(Collectors.toList());

        System.out.println(asc); // [1, 2, 5, 7, 9]

        // 내림차순
        List<Integer> desc = list.stream()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        System.out.println(desc); // [9, 7, 5, 2, 1]
    }
}
```

- 불변성(Immutable)을 유지하면서, 정렬된 새로운 리스트를 반환한다.
- 병렬 스트림(parallelStream())과 결합해 대용량 데이터 정렬에도 활용이 가능하다.

---

## 실무 팁

- 대량 데이터 정렬 시 List → Stream.sorted()가 효율적이며 가독성이 높다.
- 정렬 기준이 복합적일 경우, Comparator.comparing().thenComparing() 체인을 사용하는 것이 유지보수에 유리하다.
- DB에서 가져온 대량 데이터를 자바에서 정렬하기보다, **SQL ORDER BY**를 우선 고려하는 것이 일반적이다.
