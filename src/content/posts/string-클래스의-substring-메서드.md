---
title: "String 클래스의 substring() 메서드"
description: "String 클래스의 substring() 메서드에는 2가지의 종류가 있다. 지정된 인덱스의 문자부터 문자열의 끝까지 잘라낸다. 예를 들어, \"unhappy\".substring(2)은 \"happy\"를 반환한다."
pubDate: 2025-02-19T17:42:14+09:00
category: "자바"
tags: []
---

String 클래스의 substring() 메서드에는 2가지의 종류가 있다.

```java
public String substring(int beginIndex) {
    return substring(beginIndex, length());
}
```

**지정된 인덱스의 문자부터 문자열의 끝까지 잘라낸다.**

예를 들어, "unhappy".substring(2)은 "happy"를 반환한다.

```java
public String substring(int beginIndex, int endIndex) {
    int length = length();
    checkBoundsBeginEnd(beginIndex, endIndex, length);
    if (beginIndex == 0 && endIndex == length) {
        return this;
    }
    int subLen = endIndex - beginIndex;
    return isLatin1() ? StringLatin1.newString(value, beginIndex, subLen)
                      : StringUTF16.newString(value, beginIndex, subLen);
}
```

**beginIndex 인덱스의 문자부터 endIndex - 1 인덱스의 문자까지 잘라낸다.**

예를 들어, "hamburger".substring(4, 8)은 "urge"를 반환한다.
