---
title: "컬렉션 순회 중 발생하는 ConcurrentModificationException"
description: "발생 시점: 컬렉션(Collection)을 Iterator 또는 foreach(내부적으로 Iterator 사용)로 순회하는 도중, 해당 컬렉션의 구조적 변경(Structural Modification)이 감지되면 발생함 구조적…"
pubDate: 2025-09-03T20:05:14+09:00
category: "자바"
tags: ["예외 처리", "컬렉션"]
---

## 개념

- 발생 시점: 컬렉션(Collection)을 Iterator 또는 foreach(내부적으로 Iterator 사용)로 순회하는 도중, 해당 컬렉션의 구조적 변경(Structural Modification)이 감지되면 발생함
- **구조적 변경**(Structural Modification): 컬렉션의 크기나 구조에 영향을 주는 작업
  - 요소 추가/삭제, 내부 배열 크기 변경 등
  - 단순히 요소 값을 수정하는 것은 구조적 변경이 아님

---

## 발생 원리

- Java 컬렉션(ArrayList, HashMap 등)의 대부분은 **fail-fast iterator**를 사용함
- fail-fast iterator는 내부적으로 **modCount**라는 변경 횟수 카운터를 유지함
  - 컬렉션이 구조적으로 변경될 때마다 modCount 증가
  - Iterator 생성 시점의 expectedModCount와 순회 중 비교
  - 불일치가 발생하면 즉시 ConcurrentModificationException 발생
- 이 방식은 멀티스레드 환경뿐 아니라 단일 스레드에서도 순회 도중 잘못된 수정이 있으면 빠르게 감지할 수 있도록 설계된 것

---

## 예시 (단일 스레드에서 발생)

```java
List<String> list = new ArrayList<>();
list.add("A");
list.add("B");
list.add("C");

for (String s : list) { // 내부적으로 Iterator 사용
    if (s.equals("B")) {
        list.remove(s); // 구조적 변경 → modCount 증가 → CME 발생
    }
}
```

---

## 해결 방법

## Iterator의 remove 메서드 사용 (권장)

```java
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("B")) {
        it.remove(); // modCount와 expectedModCount를 동기화
    }
}
```

## 수정할 요소를 미리 수집 후 일괄 처리

```java
List<String> toRemove = new ArrayList<>();
for (String s : list) {
    if (s.equals("B")) toRemove.add(s);
}
list.removeAll(toRemove);
```

**CopyOnWriteArrayList와 같은 fail-safe 컬렉션 사용** (멀티스레드 환경에 적합)

```lasso
List<String> list = new CopyOnWriteArrayList<>();
```

- fail-safe 컬렉션은 순회 시 원본이 아닌 **복사본**을 사용하므로 CME가 발생하지 않음
- 단, 메모리와 성능 비용이 크므로 빈번한 수정에는 비효율적

---

## 멀티스레드 환경에서의 주의점

- CME는 동기화 문제를 완전히 해결해주지 않음
- 예: 두 스레드가 동시에 수정하면 CME가 발생할 수 있으나, 이건 단지 **감지일 뿐**이고, 동시성 제어 자체는 별도로 필요함
- **동시성 컬렉션**(ConcurrentHashMap, ConcurrentLinkedQueue) 사용 권장

---

## 결론

- **단일 스레드**: Iterator의 remove()를 사용하거나, 수정할 데이터는 별도로 모아 한 번에 처리
- **멀티 스레드**: 동시성 컬렉션 사용 또는 외부 동기화 적용
- 대량 삭제나 조건부 변경이 필요하면 Stream API의 filter/collect로 새 컬렉션 생성 후 교체하는 방법도 자주 사용함
