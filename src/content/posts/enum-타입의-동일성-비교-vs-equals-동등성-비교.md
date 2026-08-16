---
title: "enum 타입의 ==(동일성 비교) vs equals(동등성 비교)"
pubDate: 2024-12-25T19:49:00+09:00
category: "자바"
tags: ["enum"]
---

## 1. 동일성(Identity) 비교

동일성 비교는 **== 연산자**를 사용하는 것으로, 두 객체가 같은 메모리 주소를 참조하는지를 확인한다.

자바에서 하나의 enum 상수는 클래스 로드 시 한 번만 생성되고, 해당 상수는 JVM 내에서 단일 인스턴스를 보장한다. (싱글톤)

따라서 동일한 enum 값끼리는 항상 == 비교를 통해 동일성을 확인할 수 있다.

```java
public class Example {

    public enum Day {
        MONDAY, TUESDAY, WEDNESDAY
    }

    public static void main(String[] args) {
        Day day1 = Day.MONDAY;
        Day day2 = Day.MONDAY;

        // 동일성 비교
        if (day1 == day2) {
            System.out.println("day1과 day2는 동일합니다.");
        }
    }
}
```

다음 예제를 실행하면 day1과 day2는 동일하다는 것을 알 수 있다. Day.MONDAY는 항상 동일한 메모리 참조를 가지기 때문이다.

---

## 2. 동등성(Equality) 비교

동등성 비교는 **equals() 메서드**를 사용하는 것으로, 두 객체의 내용(값)이 같은지를 확인한다.

다만, enum의 equals()는 Object의 equals() 메서드를 재정의하지 않는다.

따라서 내부적으로 == 연산자로 동일성 비교를 수행하도록 구현되어 있다.

```java
public abstract class Enum<E extends Enum<E>> {

	...

    /**
     * Returns true if the specified object is equal to this
     * enum constant.
     *
     * @param other the object to be compared for equality with this object.
     * @return  true if the specified object is equal to this
     *          enum constant.
     */
    public final boolean equals(Object other) {
        return this == other;
    }
```

> **그래서 뭘 써야 해?**

> enum은 **==** 연산자를 사용해서 비교하는 것이 더 좋다.

크게 3가지 이유가 있다.

**1. enum은 Singleton(유일 인스턴스)을 보장한다.**

자바에서 enum은 클래스처럼 동작하지만, 각 열거형 상수(enum constant)는 JVM이 하나의 인스턴스만 생성하고 이를 재사용한다. 예를 들어, Day.MONDAY는 프로그램이 실행되는 동안 단 하나의 인스턴스만 존재한다. 따라서, == 연산자는 열거형 상수 비교에서 정확하고 안전하다.

**2. ==는 NPE(NullPointerException)를 방지한다.**

== 연산자는 두 피연산자가 모두 null이어도 예외를 발생시키지 않는다.

반면, equals() 메서드는 앞에 오는 값이 null이면 NPE가 발생한다. (null에다가 . 찍으면 NullPointerException이다.)

```java
public class Example {

    public enum Day {
        MONDAY, TUESDAY, WEDNESDAY
    }

    public static void main(String[] args) {
        Day day1 = null;
        Day day2 = null;
        Day day3 = Day.MONDAY;

        // equals()는 앞이 null이면 NPE 발생
        if (day1.equals(day2)) {
        }

        if (day1.equals(day3)) {
        }

        // 뒤만 null일 경우는 OK
        if (day3.equals(day1)) {
        }

        // ==는 둘 다 null이어도 OK
        if (day1 == day2) {
        }
    }
}
```

## 3. 성능 이점

== 연산자는 단순히 메모리 주소를 비교하기 때문에 성능적으로 빠른 반면, equals()는 메서드 호출을 포함하므로 약간의 오버헤드가 있다. 다만, enum에서 equals()는 ==와 동일하게 구현되어 있으므로 성능 차이는 미미하다. 하지만 equals()는 불필요한 메서드 호출을 추가하는 셈이다.

## 결론

1. JVM에서 enum 상수는 단일 인스턴스를 보장하므로, 동일성 비교(==)만으로도 충분히 정확하다.

2. ==는 NPE를 방지한다.

3. 불필요한 메서드 호출을 피할 수 있다.

따라서 enum 타입 비교에는 == 연산자를 사용하는 것이 더 좋다.
