---
title: "1149번 RGB거리 – DP"
description: "RGB거리에는 집이 N개 있다. 거리는 선분으로 나타낼 수 있고, 1번 집부터 N번 집이 순서대로 있다. 집은 빨강, 초록, 파랑 중 하나의 색으로 칠해야 한다."
pubDate: 2025-07-28T13:43:56+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/1149>

RGB거리에는 집이 N개 있다. 거리는 선분으로 나타낼 수 있고, 1번 집부터 N번 집이 순서대로 있다.

집은 빨강, 초록, 파랑 중 하나의 색으로 칠해야 한다. 각각의 집을 빨강, 초록, 파랑으로 칠하는 비용이 주어졌을 때, 아래 규칙을 만족하면서 모든 집을 칠하는 비용의 최솟값을 구해보자.

- 1번 집의 색은 2번 집의 색과 같지 않아야 한다.
- N번 집의 색은 N-1번 집의 색과 같지 않아야 한다.
- i(2 ≤ i ≤ N-1)번 집의 색은 i-1번, i+1번 집의 색과 같지 않아야 한다.

```java
3
26 40 83
49 60 57
13 89 99
```

첫째 줄에 집의 수 N(2 ≤ N ≤ 1,000)이 주어진다. 둘째 줄부터 N개의 줄에는 각 집을 빨강, 초록, 파랑으로 칠하는 비용이 1번 집부터 한 줄에 하나씩 주어진다. 집을 칠하는 비용은 1,000보다 작거나 같은 자연수이다.

```java
96
```

첫째 줄에 모든 집을 칠하는 비용의 최솟값을 출력한다.

---

## 아이디어

- 각 집은 **빨강, 초록, 파랑** 중 하나의 색으로 칠할 수 있고, **인접한 집은 같은 색으로 칠할 수 없다.**
- i번 집을 j 색깔로 칠하는 비용은 **cost[i][j]** 배열로 관리
- **dp[i][j] = i번 집을 j 색깔로 칠했을 때, 0번 집부터 i번 집까지의 최소 누적 비용**
  - 즉, dp[i][0], dp[i][1], dp[i][2] 3개의 dp 배열 사용
- 초기값은 dp[0][j] = cost[0][j]로 설정하고, 이후 순차적으로 채워 나간다.
  - dp[i][0] = min(dp[i-1][1], dp[i-1][2]) + cost[i][0]
  - dp[i][1] = min(dp[i-1][0], dp[i-1][2]) + cost[i][1]
  - dp[i][2] = min(dp[i-1][0], dp[i-1][1]) + cost[i][2]

- 마지막 집까지 계산한 후, dp[N-1][0], dp[N-1][1], dp[N-1][2] 중 가장 작은 값이 정답이 된다.

---

## 시간 복잡도

- 각 집마다 1번만 3가지 색에 대해 최소값을 계산하므로, **O(N)** (N ≤ 1,000이므로 충분히 빠름)

---

## Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        int[][] cost = new int[N][3];

        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            cost[i][0] = Integer.parseInt(st.nextToken());
            cost[i][1] = Integer.parseInt(st.nextToken());
            cost[i][2] = Integer.parseInt(st.nextToken());
        }

        int[][] dp = new int[N][3];

        dp[0][0] = cost[0][0];
        dp[0][1] = cost[0][1];
        dp[0][2] = cost[0][2];

        for (int i = 1; i < N; i++) {
            dp[i][0] = Math.min(dp[i - 1][1], dp[i - 1][2]) + cost[i][0];
            dp[i][1] = Math.min(dp[i - 1][0], dp[i - 1][2]) + cost[i][1];
            dp[i][2] = Math.min(dp[i - 1][0], dp[i - 1][1]) + cost[i][2];
        }

        System.out.println(Math.min(Math.min(dp[N - 1][0], dp[N - 1][1]), dp[N - 1][2]));
    }
}
```

---

사실 dp 배열 전체를 유지할 필요 없이, **이전 집의 색상 조합 정보만 유지**하면 충분하다.

즉, **크기 3인 배열 하나**만으로 매번 갱신하는 방식으로 공간을 최적화할 수 있다.

---

## 최적화 아이디어

- dp[i][c]에서 i는 현재 집 번호이고, c는 현재 색상
- 사실 i가 **이전과 현재** 두 개만 필요하므로, 배열 하나로 갱신 가능
- 매번 새로운 배열에 값을 저장한 뒤, 이전 배열을 덮어쓰기

---

## 최적화된 Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        int[] prev = new int[3]; // 이전 집의 R, G, B 최소 비용

        StringTokenizer st = new StringTokenizer(br.readLine());
        prev[0] = Integer.parseInt(st.nextToken()); // R
        prev[1] = Integer.parseInt(st.nextToken()); // G
        prev[2] = Integer.parseInt(st.nextToken()); // B

        for (int i = 1; i < N; i++) {
            st = new StringTokenizer(br.readLine());
            int r = Integer.parseInt(st.nextToken());
            int g = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());

            int[] cur = new int[3];
            cur[0] = Math.min(prev[1], prev[2]) + r;
            cur[1] = Math.min(prev[0], prev[2]) + g;
            cur[2] = Math.min(prev[0], prev[1]) + b;

            prev = cur; // 현재 값을 다음 반복의 이전 값으로
        }

        System.out.println(Math.min(prev[0], Math.min(prev[1], prev[2])));
    }
}
```
