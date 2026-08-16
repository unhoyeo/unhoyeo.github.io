---
title: "2565﻿번 전깃줄 - DP (LIS, 가장 긴 증가하는 부분 수열)"
description: "두 전봇대 A와 B 사이에 하나둘씩 전깃줄을 추가하다 보니 전깃줄이 서로 교차하는 경우가 발생하였다. 합선의 위험이 있어 이들 중 몇 개의 전깃줄을 없애 전깃줄이 교차하지 않도록 만들려고 한다."
pubDate: 2025-04-30T18:12:36+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/2565>

두 전봇대 A와 B 사이에 하나둘씩 전깃줄을 추가하다 보니 전깃줄이 서로 교차하는 경우가 발생하였다. 합선의 위험이 있어 이들 중 몇 개의 전깃줄을 없애 전깃줄이 교차하지 않도록 만들려고 한다.

예를 들어, < 그림 1 >과 같이 전깃줄이 연결되어 있는 경우 A의 1번 위치와 B의 8번 위치를 잇는 전깃줄, A의 3번 위치와 B의 9번 위치를 잇는 전깃줄, A의 4번 위치와 B의 1번 위치를 잇는 전깃줄을 없애면 남아있는 모든 전깃줄이 서로 교차하지 않게 된다. 전깃줄이 전봇대에 연결되는 위치는 전봇대 위에서부터 차례대로 번호가 매겨진다.

![2565﻿번 전깃줄 - DP (LIS, 가장 긴 증가하는 부분 수열)](/images/tistory/120/img.png)

전깃줄의 개수와 전깃줄들이 두 전봇대에 연결되는 위치의 번호가 주어질 때, 남아있는 모든 전깃줄이 서로 교차하지 않게 하기 위해 없애야 하는 전깃줄의 최소 개수를 구하는 프로그램을 작성하시오.

```java
8
1 8
3 9
2 2
4 1
6 4
10 10
9 7
7 6
```

첫째 줄에는 두 전봇대 사이의 전깃줄의 개수가 주어진다. 전깃줄의 개수는 100 이하의 자연수이다. 둘째 줄부터 한 줄에 하나씩 전깃줄이 A전봇대와 연결되는 위치의 번호와 B전봇대와 연결되는 위치의 번호가 차례로 주어진다. 위치의 번호는 500 이하의 자연수이고, 같은 위치에 두 개 이상의 전깃줄이 연결될 수 없다.

```
3
```

첫째 줄에 남아있는 모든 전깃줄이 서로 교차하지 않게 하기 위해 없애야 하는 전깃줄의 최소 개수를 출력한다.

---

## 아이디어

- **A에서는 오름차순인데 B에서는 내림차순**이 되는 두 전깃줄은 **서로 교차**한다.
- **A 기준으로 정렬한 뒤, B 값들에서 가장 긴 증가 부분 수열(LIS)**을 찾으면, **교차하지 않는 최대 전깃줄 수**가 된다.
  - A 위치를 기준으로 정렬하면, A 값은 **항상 오름차순**이 된다.
  - 교차를 방지하려면, B 값도 같이 **오름차순**이어야 한다.
  - 그래서 B 값들에서 **가장 긴 오름차순 수열**을 찾으면, 이게 **서로 교차하지 않는 전깃줄들의 최대 집합**이다!
- 따라서, **[제거해야 할 전깃줄 수] = [전체 전깃줄 수] - [LIS 길이]**

> LIS: Longest Increasing Subsequence (가장 긴 증가 부분 수열)

## ⏱️ 시간복잡도

- 입력: 최대 100개 전깃줄
- LIS 탐색: **O(N²)** 또는 **O(N log N)** 가능 (여기서는 O(N²)으로도 충분)
- 최종 시간복잡도: **O(N²)**

## 자바 코드 - O(N²) 방식

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        Cable[] cables = new Cable[N];

        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            cables[i] = new Cable(a, b);
        }

        Arrays.sort(cables); // A 기준 오름차순 정렬

        int[] dp = new int[N]; // LIS 저장
        Arrays.fill(dp, 1);

        for (int i = 1; i < N; i++) {
            for (int j = 0; j < i; j++) {
                if (cables[i].b > cables[j].b) { // 교차하지 않는 경우
                    dp[i] = Math.max(dp[i], dp[j] + 1);
                }
            }
        }

        int maxLIS = 0;
        for (int LIS : dp) {
            maxLIS = Math.max(maxLIS, LIS);
        }

        System.out.println(N - maxLIS); // 제거할 개수 = 전체 길이 - LIS 길이
    }

    static class Cable implements Comparable<Cable> {
        int a, b;

        Cable(int a, int b) {
            this.a = a;
            this.b = b;
        }

        @Override
        public int compareTo(Cable other) {
            return this.a - other.a; // A 기준으로 정렬
        }
    }
}
```

또는 다음과 같이 풀 수도 있다.

```java
import java.io.*;
import java.util.*;

public class Main {
    static final int MAX = 501;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        int[] cables = new int[MAX];

        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            cables[a] = b;
        }

        int[] dp = new int[MAX];

        for (int i = 1; i < MAX; i++) {
            if (cables[i] != 0) {
                dp[i] = 1;
                for (int j = 1; j < i; j++) {
                    if (cables[j] != 0 && cables[j] < cables[i]) {
                        dp[i] = Math.max(dp[i], dp[j] + 1);
                    }
                }
            }
        }

        int maxLIS = 0;
        for (int LIS : dp) {
            maxLIS = Math.max(maxLIS, LIS);
        }

        System.out.println(N - maxLIS);
    }
}
```

## 예제 시각화

```java
8
1 8
3 9
2 2
4 1
6 4
10 10
9 7
7 6
```

A 기준으로 오름차순 정렬

```java
A  B
1  8
2  2
3  9
4  1
6  4
7  6
9  7
10 10
```

B 값만 보면 다음과 같음

```java
8 2 9 1 4 6 7 10
```

- i = 1, j = 0
  - cables[1] = 2 < cables[0] = 8 → 패스
- i = 2, j = 0~1
  - cables[2] = 9 > cables[0] = 8 → dp[2] = max(dp[2], dp[0] + 1) = max(1, 1 + 1) = 2
  - cables[2] = 9 > cables[1] = 2 → **dp[2]** = max(dp[2], dp[1] + 1) = max(2, 1 + 1) = 2
- i = 3, j = 0~2
  - cables[3] = 1 < cables[0] = 8 → 패스
  - cables[3] = 1 < cables[1] = 2 → 패스
  - cables[3] = 1 < cables[2] = 9 → 패스
- i = 4, j = 0~3
  - cables[4] = 4 < cables[0] = 8 → 패스
  - cables[4] = 4 > cables[1] = 2 → dp[4] = max(dp[4], dp[1] + 1) = max(1, 1 + 1) = 2
  - cables[4] = 4 < cables[2] = 9 → 패스
  - cables[4] = 4 > cables[3] = 1 → **dp[4]** = max(dp[4], dp[3] + 1) = max(2, 1 + 1) = **2**
- i = 5, j = 0~4
  - cables[5] = 6 < cables[0] = 8 → 패스
  - cables[5] = 6 > cables[1] = 2 → dp[5] = max(dp[5], dp[1] + 1) = max(1, 1 + 1) = 2
  - cables[5] = 6 < cables[2] = 9 → 패스
  - cables[5] = 6 > cables[3] = 1 → dp[5] = max(dp[5], dp[3] + 1) = max(2, 1 + 1) = 2
  - cables[5] = 6 > cables[4] = 4 → **dp[5]** = max(dp[5], dp[4] + 1) = max(2, 2 + 1) = **3**

...

## LIS 예시

```java
2 4 6 7 10 → 길이 5
```

따라서, **전체 전깃줄 수(8) - LIS(5) = 3** → 3개 제거 필요!

---

## ✅ O(N log N) 풀이

- LIS를 **이진 탐색**을 이용하여 구하는 방식
- 기본 아이디어는 같음
- 핵심은 LIS 배열에 값을 적절히 **"덮어쓰면서"** 이진 탐색으로 위치를 찾아나가는 것
- LIS는 실제 수열을 완전히 저장하는 게 아니라 **"길이만 알면 되므로"**, 덮어쓰는 방식으로 구현 가능
- 이진 탐색을 위해 **List&lt;Integer>** 또는 **int[] + 길이 변수** 사용

## 예시

B 값이 다음과 같다고 가정하자.

```java
8 2 9 1 4 6 7 10
```

LIS 배열을 유지하면서 덮어쓰면 다음과 같다.

- 8 → [8]
- 2 → [2] **(2는 8보다 작으므로 덮어씀)**
- 9 → [2, 9]
- 1 → [1, 9] **(1은 2보다 작으므로 덮어씀)**
- 4 → [1, 4] **(4는 9보다 작으므로 덮어씀)**
- 6 → [1, 4, 6]
- 7 → [1, 4, 6, 7]
- 10 → [1, 4, 6, 7, 10]

## 최종 LIS 길이: 5

---

## 자바 코드 - O(N log N) 방식

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        Cable[] cables = new Cable[N];

        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            cables[i] = new Cable(a, b);
        }

        Arrays.sort(cables); // A 기준 오름차순 정렬

        int[] lis = new int[N];
        int len = 0; // LIS 길이

        for (int i = 0; i < N; i++) {
            int b = cables[i].b;

            // LIS 배열에 삽입할 위치 찾기 (이진 탐색 실패하면 [-삽입 위치 - 1] 반환하는 점 이용)
            int idx = Arrays.binarySearch(lis, 0, len, b);
            idx = -(idx + 1); // 삽입 위치 = -(반환값 + 1)

            lis[idx] = b; // 작으면 덮어씀

            if (idx == len) len++; // LIS 길이 늘리기
        }

        System.out.println(N - len); // 제거할 개수 = 전체 길이 - LIS 길이
    }

    static class Cable implements Comparable<Cable> {
        int a, b;

        Cable(int a, int b) {
            this.a = a;
            this.b = b;
        }

        @Override
        public int compareTo(Cable other) {
            return this.a - other.a; // A 기준으로 정렬
        }
    }
}
```

---

## 만약 실제 LIS 수열을 추적하려면?

- **prev[]** → 현재 LIS의 이전 요소 인덱스를 저장
- **lastIndex** → LIS 마지막 인덱스 저장 (최댓값 위치)

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        Cable[] cables = new Cable[N];

        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            cables[i] = new Cable(a, b);
        }

        Arrays.sort(cables);

        int[] dp = new int[N]; // 각 위치에서 LIS 길이
        Arrays.fill(dp, 1);

        int[] prev = new int[N]; // LIS 역추적을 위한 이전 인덱스 저장
        Arrays.fill(prev, -1);

        int lastIndex = 0; // LIS 끝나는 위치
        int maxLIS = 1;

        for (int i = 1; i < N; i++) {
            for (int j = 0; j < i; j++) {
                if (cables[i].b > cables[j].b && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    prev[i] = j; // 추적 정보 저장
                }
            }

            if (dp[i] > maxLIS) {
                maxLIS = dp[i];
                lastIndex = i;
            }
        }

        System.out.println(N - maxLIS); // 제거할 전깃줄 수

        // 실제 LIS 수열 출력
        List<Cable> lis = new ArrayList<>();
        int idx = lastIndex;
        while (idx != -1) {
            lis.add(cables[idx]);
            idx = prev[idx];
        }

        Collections.reverse(lis);
        for (Cable c : lis) {
            System.out.println(c.a + " " + c.b);
        }
    }

    static class Cable implements Comparable<Cable> {
        int a, b;

        Cable(int a, int b) {
            this.a = a;
            this.b = b;
        }

        @Override
        public int compareTo(Cable other) {
            return this.a - other.a;
        }
    }
}
```

---

## 2025. 05. 28. 복습 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        Cable[] cables = new Cable[N];

        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            cables[i] = new Cable(a, b);
        }

        Arrays.sort(cables); // A 기준 오름차순 정렬

        // B 기준 LIS 길이 구하기
        List<Integer> dp = new ArrayList<>();

        for (int i = 0; i < N; i++) {
            int idx = Collections.binarySearch(dp, cables[i].b);
            if (idx < 0) idx = -idx - 1;

            if (idx == dp.size()) dp.add(cables[i].b);
            else dp.set(idx, cables[i].b);
        }

        // 없애야 하는 전깃줄 수 = 전체 전깃줄 수 - LIS 길이
        System.out.println(N - dp.size());
    }

    static class Cable implements Comparable<Cable> {
        int a, b;

        public Cable(int a, int b) {
            this.a = a;
            this.b = b;
        }

        public int compareTo(Cable o) {
            return this.a - o.a;
        }
    }
}
```
