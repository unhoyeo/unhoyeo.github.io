---
title: "BufferedReader"
description: "Scanner보다는 BufferedReader가 빠르기 때문에 BufferedReader를 사용해서 입력을 받아보자. 간단하게 백준 문제 1000번의 풀이를 예제로 보자."
pubDate: 2025-02-19T15:52:06+09:00
category: "자바"
tags: []
---

Scanner보다는 BufferedReader가 빠르기 때문에 BufferedReader를 사용해서 입력을 받아보자.

간단하게 백준 문제 1000번의 풀이를 예제로 보자.

```java
import java.io.*;
import java.util.*;

class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());

        int a = Integer.parseInt(st.nextToken());
        int b = Integer.parseInt(st.nextToken());

        System.out.println(a + b);
    }
}
```

## 1. 입력 관련 패키지

```java
import java.io.*;
import java.util.*;
```

- **BufferedReader** 및 InputStreamReader를 사용하려면 java.io 패키지를 포함해야 한다.
- **StringTokenizer**를 사용하려면 java.util 패키지를 포함해야 한다.

## 2. 메인 메서드 정의

```java
public static void main(String[] args) throws IOException {
```

- main 메서드의 형태를 잘 기억하자. (psvm)
- BufferedReader를 사용할 때 **IOException**이 발생할 수 있기 때문에 throws IOException를 넣어줘야 한다.

## 3. 입력 처리

```java
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
StringTokenizer st = new StringTokenizer(br.readLine());
```

- **System.in**은 표준 입력(키보드 입력)을 의미하며, 이를 InputStreamReader를 통해 문자 스트림으로 변환한 후, BufferedReader를 사용하여 성능을 향상한다.
- <strong>br.readLine()</strong>을 통해 한 줄의 문자열을 입력받는다.
- StringTokenizer를 사용하여 입력받은 문자열을 공백을 기준으로 나눈다. 기준을 지정하려면 두 번째 파라미터에 넣어주면 된다.

## 4. 입력값을 정수로 변환

```java
int a = Integer.parseInt(st.nextToken());
int b = Integer.parseInt(st.nextToken());
```

- **st.nextToken()** → StringTokenizer에서 공백을 기준으로 분리된 토큰을 가져온다.
- **Integer.parseInt()** → 문자열을 정수로 변환한다.

---

## 정리

- 입력받을 땐 **java.io** 패키지와 **java.util** 패키지를 꼭 import 하자.
- main 메서드에 **throws IOException**을 꼭 넣어주자.

> **주의할 점:** 주어진 수의 최댓값이 만약 10^9 정도라면 int형의 범위(-2,147,483,648 ~ 2,147,483,647)를 넘을 수도 있으므로 long 타입에 저장해야 한다.
>
>
> ```java
> long a = Long.parseLong(st.nextToken());
> ```
