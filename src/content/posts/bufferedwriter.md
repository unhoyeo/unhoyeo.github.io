---
title: "BufferedWriter"
description: "기본적으로 자바에서 출력할 때는 System.out.println()으로도 충분하다. 하지만 출력할 일이 많을 때는 시간이 오래 걸린다. 그럴 때 사용하기 좋은 것이 바로 BufferedWriter이다."
pubDate: 2025-02-20T12:53:52+09:00
category: "자바"
tags: []
---

기본적으로 자바에서 출력할 때는 System.out.println()으로도 충분하다. 하지만 출력할 일이 많을 때는 시간이 오래 걸린다.

그럴 때 사용하기 좋은 것이 바로 **BufferedWriter**이다.

백준 15552번의 풀이를 예제로 보자.

```java
import java.io.*;
import java.util.*;

class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));
        int T = Integer.parseInt(br.readLine());
        for (int i = 0; i < T; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int A = Integer.parseInt(st.nextToken());
            int B = Integer.parseInt(st.nextToken());
            bw.write(Integer.toString(A + B));
            bw.newLine();
        }
        bw.flush();
    }
}
```

> 반복문 안의 변수를 반복문 밖에서 선언할 수도 있지만, 반복문에서만 사용하는 변수는 반복문 안에서만 사용하는 것이 더 바람직하다.다음 글에서 알아보자.

## 1. 입출력 관련 패키지

```java
import java.io.*;
import java.util.*;
```

- **java.io** → 입출력 관련 클래스(BufferedReader, BufferedWriter) 사용을 위해 포함해야 한다.
- **java.util** → 토큰화(StringTokenizer)를 위해 포함해야 한다.

## 2. 메인 메서드 정의

```arduino
public static void main(String[] args) throws IOException {
```

- BufferedReader를 사용할 때 IOException이 발생할 수 있기 때문에 **throws IOException**를 넣어줘야 한다.

## 3. 입출력 처리

```haxe
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));
```

- **BufferedReader** → 표준 입력(System.in)을 버퍼링하여 빠르게 읽는다.
- **BufferedWriter** → 표준 출력(System.out)을 버퍼링하여 효율적으로 출력한다.

> ✅ Scanner보다 BufferedReader가 속도가 빠르므로 BufferedReader를 사용하자!
> ✅ 출력문이 많을 때는 System.out.println() 대신 BufferedWriter를 사용하자!

## 4. 테스트 케이스 개수 입력받기

```
int T = Integer.parseInt(br.readLine());
```

- **br.readLine()** → 한 줄을 문자열로 입력받는다.
- **Integer.parseInt(String s)** → 문자열을 정수로 변환한다.

## 5. 테스트 케이스 반복 처리

```java
for (int i = 0; i < T; i++) {
```

- 두 개의 정수를 입력받고 합을 출력하는 것을 T번 반복한다.

## 6. 입력 토큰화

```java
StringTokenizer st = new StringTokenizer(br.readLine());
```

- br.readLine() → 한 줄을 문자열로 입력받는다.
- **StringTokenizer** → 공백(기본값)을 기준으로 문자열을 분리한다.

## 7. 정수 변환

```
int A = Integer.parseInt(st.nextToken());
int B = Integer.parseInt(st.nextToken());
```

- **st.nextToken()** → 첫 번째 토큰(문자열로 된 정수)을 가져온다.
- Integer.parseInt() → 가져온 토큰(문자열)을 정수로 변환한다.
- st.nextToken() → 두 번째 토큰(문자열로 된 정수)을 가져온다.

## 8. 정수 합을 BufferedWriter에 저장

```java
bw.write(Integer.toString(A + B));
bw.newLine();
```

- **Integer.toString(int i)** → 정수를 문자열로 변환한다.
- **bw.write(String str)** : 문자열을 버퍼에 저장한다.
- **bw.newLine()** → 줄바꿈(개행 문자)을 버퍼에 저장한다.

> bw.write(Integer.toString(A + B))는 bw.write(A + B + "")로 대체 가능하다.
> 자바에서 + 연산자는 두 가지 기능을 가지고 있는데, 피연산자가 **모두 숫자**일 경우에는 덧셈 연산을 수행하고, 피연산자 중 하나가 **문자열**일 경우에는 나머지 피연산자도 문자열로 자동 변환되어 문자열 결합 연산을 수행한다. 또한, 연산식에서 + 연산자가 연이어 나오면 앞에서부터 순차적으로 연산을 수행한다. 먼저 수행된 연산식이 덧셈이라면 덧셈 결과를 가지고 그다음 + 연산을 수행하고, 먼저 수행된 연산이 문자열 결합이라면 이후 + 연산은 결합 연산이 수행된다.
>
> 예를 들어, System.out.println(1 + 2 + "?" + 3 + 4)인 경우, 출력 결과는 <strong>3?34</strong>가 된다.
>
> 여기서 주의할 점은 **큰따옴표**("")이어야 문자열 결합 연산을 수행한다. 작은따옴표('')의 경우 아스키 코드를 덧셈 연산하게 된다.

## 9. BufferedWriter 닫기

```java
bw.flush();
```

- 버퍼를 잡아 놓았기 때문에 반드시 사용한 후에 <strong>flush()</strong> 또는 <strong>close()</strong>를 해주어야 한다.
- close()는 출력 스트림을 아예 닫아버리기 때문에, 다른 것도 출력하고자 한다면 flush()를 사용하면 된다.

---

## 정리

- 출력할 땐 bw.write(str)을 이용하자.
- 줄바꿈을 넣을 땐 bw.newLine() 또는 bw.write("\n")을 이용하자.
- 정수를 문자열로 변환할 때는 Integer.toString(i) 또는 String.valueOf(i)를 이용하자.
