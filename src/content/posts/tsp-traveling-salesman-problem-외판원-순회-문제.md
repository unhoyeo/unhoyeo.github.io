---
title: "TSP(Traveling Salesman problem, 외판원 순회 문제)"
description: "N개의 도시가 있고, 어떤 도시에서 출발해 모든 도시를 한 번씩만 방문한 뒤, 다시 출발 도시로 돌아오는 최소 비용 경로를 찾는 문제 조건: 모든 도시는 정확히 한 번 방문 마지막에 출발 도시로 복귀 경로의 총 비용(또는 거리)을…"
pubDate: 2025-08-15T16:40:31+09:00
category: "알고리즘/개념"
tags: []
draft: true
---

## TSP(외판원 순회 문제)란?

- N개의 도시가 있고, 어떤 도시에서 출발해 **모든 도시를 한 번씩만 방문**한 뒤, 다시 **출발 도시로 돌아오는** 최소 비용 경로를 찾는 문제
- **조건**:
  - 모든 도시는 정확히 **한 번 방문**
  - 마지막에 **출발 도시로 복귀**
  - 경로의 총 비용(또는 거리)을 최소화

---

## ⚠️ 단순 접근: 순열 완전탐색

- 모든 방문 순서를 나열해서 최소 비용 경로를 찾는 방법
- 도시 수가 N일 때 가능한 경로 개수: (N-1)! (출발 도시 고정)
- **문제점**: N이 조금만 커져도 경우의 수 폭발 (N=10 → 9! = 362,880)

---

## ✅ 효율적인 접근: DP(Top-Down) + 비트마스킹

- 핵심 아이디어: <strong>"지금까지 방문한 도시 집합"</strong>과 <strong>"현재 도시"</strong>만 알면, 남은 최소 비용을 계산 가능
- **dp[cur][visited]** = 현재 cur 도시에 있고, 방문한 도시 집합이 visited일 때 남은 최소 비용
  - visited는 비트마스크(이진수)로 관리
  - 예: N=4, visited=1011(2) → 0,1,3번 도시 방문 완료
- 점화식: **dp[cur][visited] = min(dp[cur][visited], W[cur][next] + dp[next][visited | (1 << next)])**
  - 단, next는 아직 방문하지 않았으며 이동 가능해야 함

- 종료 조건:
  - 모든 도시 방문 시, 출발 도시로 돌아가는 비용 반환
- 시간 복잡도:
  - 상태 수: N × (1 << N)
  - 각 상태에서 최대 N개의 도시로 이동 시도
  - **O(N^2 × 2^N)**

---

## 왜 시작 도시를 고정해도 되는가?

- 모든 도시를 순회하는 최소 경로의 비용은 **"시작 도시를 바꿔도" 동일**
  - 예: 최소 경로가 0→1→2→3→0이라면, 2→3→0→1→2도 비용 동일
- 따라서 중복 계산 방지를 위해 **임의로 하나를 고정함 (보통 0번 도시)**

---

## 예제 – 백준 10971번 외판원 순회 2

<https://www.acmicpc.net/problem/10971>

외판원 순회 문제는 영어로 Traveling Salesman problem (TSP) 라고 불리는 문제로 computer science 분야에서 가장 중요하게 취급되는 문제 중 하나이다. 여러 가지 변종 문제가 있으나, 여기서는 가장 일반적인 형태의 문제를 살펴보자.

1번부터 N번까지 번호가 매겨져 있는 도시들이 있고, 도시들 사이에는 길이 있다. (길이 없을 수도 있다) 이제 한 외판원이 어느 한 도시에서 출발해 N개의 도시를 모두 거쳐 다시 원래의 도시로 돌아오는 순회 여행 경로를 계획하려고 한다. 단, 한 번 갔던 도시로는 다시 갈 수 없다. (맨 마지막에 여행을 출발했던 도시로 돌아오는 것은 예외) 이런 여행 경로는 여러 가지가 있을 수 있는데, 가장 적은 비용을 들이는 여행 계획을 세우고자 한다.

각 도시간에 이동하는데 드는 비용은 행렬 W[i][j]형태로 주어진다. W[i][j]는 도시 i에서 도시 j로 가기 위한 비용을 나타낸다. 비용은 대칭적이지 않다. 즉, W[i][j] 는 W[j][i]와 다를 수 있다. 모든 도시간의 비용은 양의 정수이다. W[i][i]는 항상 0이다. 경우에 따라서 도시 i에서 도시 j로 갈 수 없는 경우도 있으며 이럴 경우 W[i][j]=0이라고 하자.

N과 비용 행렬이 주어졌을 때, 가장 적은 비용을 들이는 외판원의 순회 여행 경로를 구하는 프로그램을 작성하시오.

```java
4
0 10 15 20
5 0 9 10
6 13 0 12
8 8 9 0
```

첫째 줄에 도시의 수 N이 주어진다. (2 ≤ N ≤ 10) 다음 N개의 줄에는 비용 행렬이 주어진다. 각 행렬의 성분은 1,000,000 이하의 양의 정수이며, 갈 수 없는 경우는 0이 주어진다. W[i][j]는 도시 i에서 j로 가기 위한 비용을 나타낸다.

항상 순회할 수 있는 경우만 입력으로 주어진다.

```java
35
```

첫째 줄에 외판원의 순회에 필요한 최소 비용을 출력한다.

---

## 아이디어

- 모든 도시를 **한 번씩 방문**하고 **출발점으로 돌아오는** 최소 비용 경로 → TSP(DP + 비트마스킹)
- dp[i][visited] = 현재 i번 도시에 있고, 방문한 도시 집합이 visited일 때, 남은 도시를 모두 방문하고 출발 도시로 돌아가는 최소 비용
  - 크기는 **N × (1 << N)**, 값은 **-1로 초기화**하여 메모이제이션 이용
  - visited는 비트마스크로, i번째 비트가 1이면 i번 도시를 방문했다는 의미
- 점화식:
  - 현재 도시(cur)에서 다음 도시(next)로 이동할 수 있다면(W[cur][next] == 0 || (visited & (1 << next)) != 0),
  - **dp[cur][visited] = min(dp[cur][visited], W[cur][next] + dp[next][visited | (1 << next)])**
- 종료 조건:
  - **모든 도시를 방문한 경우(visited == (1 << N) - 1)**, 출발 도시로 돌아가는 비용 반환
  - 출발 도시로 돌아갈 수 없다면(W[cur][0] == 0), INF 반환
- 최종 답:
  - 시작 도시를 0번이라고 가정하면, dp[0][1 << 0]

---

## ⏱️ 시간 복잡도

- 상태 수: N × (1 << N)
- 각 상태에서 최대 N개의 도시로 이동 시도
- 총 시간 복잡도: **O(N² × 2^N)**
- N ≥ 10이므로, 최악의 경우 10 × 10 × 1024 → 가능

---

## Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static final int INF = 10 * 1_000_000 + 1;
    static int N;
    static int[][] W;
    static int[][] dp;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        N = Integer.parseInt(br.readLine());

        W = new int[N][N];

        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            for (int j = 0; j < N; j++) {
                W[i][j] = Integer.parseInt(st.nextToken());
            }
        }

        dp = new int[N][1 << N];

        for (int[] row : dp) {
            Arrays.fill(row, -1);
        }

        System.out.println(tsp(0, 1));
    }

    static int tsp(int cur, int visited) {
        if (visited == (1 << N) - 1) {
            return W[cur][0] == 0 ? INF : W[cur][0];
        }

        if (dp[cur][visited] != -1) {
            return dp[cur][visited];
        }

        dp[cur][visited] = INF;

        for (int next = 0; next < N; next++) {
            if (W[cur][next] == 0 || (visited & (1 << next)) != 0) continue;
            int cost = W[cur][next] + tsp(next, visited | (1 << next));
            dp[cur][visited] = Math.min(dp[cur][visited], cost);
        }

        return dp[cur][visited];
    }
}
```
