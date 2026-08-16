---
title: "DP"
pubDate: 2025-03-06T15:13:20+09:00
category: "알고리즘/개념"
tags: []
draft: true
---

## 개념

- DP(Dynamic Programming)
- 이전의 값을 재활용하는 방법
- 예시) 1 ~ 10 숫자 중, 각 숫자와 이전 값들을 더한 값 구하기
- 1은 1, 2는 1+2=3, 3은 1+2+3=6 ...
- 이런 경우, **이전 값을 재활용**하여 시간을 단축시킬 수 있다.
- 이중 for문으로 구현 → **O(N^2)**
- DP는 for문 한 개 → **O(N)**
- DP에서 가장 중요한 것은 바로 "**이전 값을 활용하는 식**" **점화식!** (예를 들면, Ai = Ai-1 + Ai-2)
- 점화식을 미리 세우고 코드를 짜는 것이 중요하다.
- 어떻게 해야 할지 막막하지만 **처음에는 그냥 해보자**! 그러면 규칙이 자연스럽게 보일 것이다.

---

## 연습 문제 - 백준 11726번

```java
9
```

첫째 줄에 n이 주어진다. (1 ≤ n ≤ 1,000)

```java
55
```

첫째 줄에 2×n 크기의 직사각형을 채우는 방법의 수를 10,007로 나눈 나머지를 출력한다.

## 1. 아이디어

- **점화식을 먼저 세워야 한다.**
- 처음엔 그냥 해보면서 규칙을 찾아보자.
- n=1 → | → 1
- n=2 → ||, = → 2
- n=3 → |||, |=, =| → 3
- n=4 → ||||, ||=, |=|, =||, == → 5
- n=5 → |||||, |||=, ||=|, |=||, =|||, =|=, |==, ==| → 8
- 뭔가 규칙이 보인다.
- **An = An-1 + An-2 (n >= 3)**

## 2. 시간복잡도

- **O(N)**

## 3. 자료구조

- 경우의 수를 저장할 배열 → int[]

```java
import java.io.*;

class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());
        int[] arr = new int[N + 1];
        arr[0] = arr[1] = 1;
        for (int i = 2; i <= N; i++) {
            arr[i] = (arr[i - 1] + arr[i - 2]) % 10007;
        }
        System.out.println(arr[N]);
    }
}
```

## 팁

- 어떻게 하는지 모르겠을 땐 **하나씩 그려보면서 규칙 찾기**
- **점화식**을 명확히 세운 뒤 코드 짜기
