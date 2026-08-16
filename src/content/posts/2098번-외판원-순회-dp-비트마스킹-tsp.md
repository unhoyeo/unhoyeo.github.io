---
title: "2098번 외판원 순회 – DP + 비트마스킹 (TSP)"
pubDate: 2025-08-14T17:52:17+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/2098>

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

첫째 줄에 도시의 수 N이 주어진다. (2 ≤ N ≤ 16) 다음 N개의 줄에는 비용 행렬이 주어진다. 각 행렬의 성분은 1,000,000 이하의 양의 정수이며, 갈 수 없는 경우는 0이 주어진다. W[i][j]는 도시 i에서 j로 가기 위한 비용을 나타낸다.

항상 순회할 수 있는 경우만 입력으로 주어진다.

```java
35
```

첫째 줄에 외판원의 순회에 필요한 최소 비용을 출력한다.

---

## 아이디어

- 모든 도시를 정확히 **한 번씩 방문**하고 **출발 도시로 복귀**하는 순환의 최소 비용 → TSP(외판원 순회) 문제 → **DP + 비트마스킹**
  - 다른 알고리즘이 아닌 이유:
    - **순서 제약 + 모든 정점 방문 + 시작점 복귀** 조건을 직접적으로 반영해야 함
    - **다익스트라**: 고정된 시작점에서 한 번의 최단 경로 계산 → 순회 조건 미반영
    - **플로이드**: 모든 쌍 최단경로 계산 → 순회 순서 제약 해결 불가
    - **BFS/DFS**: 순회 순서 제약 고려 시 O(N!) → N ≥ 12면 불가능
- TSP(외판원 순회) 문제 특성:
  - 모든 도시를 정확히 한 번씩 방문 → **방문 여부**를 관리해야 함
  - 간선 가중치 비대칭 → **방향성** 고려 필요
  - 시작점으로 복귀 필요 → **사이클 형성** 필요
  - 간선이 없을 수 있음 → **INF 처리** 필요
- **W[i][j]** = i번 도시에서 j번 도시로 가는 비용 (0: 경로 없음)
- **dp[current][visited]**
  - **현재 도시**가 current이고,
  - **방문 상태**가 visited일 때,
  - 남은 도시를 모두 방문하고 **출발 도시로 돌아가는 최소 비용**
- visited(비트마스크)
  - i번째 비트가 1 → i번 도시 방문
  - i번째 비트가 0 → i번 도시 미방문
  - 예: N=4, visited=11(01011) → 0, 1, 3번 도시 방문 상태

```java
dp[current][visited] = min(W[current][next] + dp[next][visited | (1 << next)])
```

- 단, 다음 조건들을 만족하는 경우에만 수행
  - **W[current][next] != 0** → 이동이 가능해야 함
  - **(visited & (1 << next)) == 0** → 방문하지 않은 도시여야 함

- 기저 조건
  - 모든 도시를 방문한 경우 → **visited == (1 << N) - 1**
  - 출발 도시로 돌아가는 비용 반환 (경로 없으면 INF 반환)
- 탐색 방식
  - **DFS + 메모이제이션 (Top-Down DP)**
  - **tsp(current, visited)** = (current, visited) 상태에서 남은 도시들을 모두 방문하고 출발지로 돌아가는 최소 비용 반환
    - 모든 도시를 방문한 경우:
      - 출발 도시로 돌아가는 비용 반환
      - 만약 돌아가는 길이 없다면 INF 반환
    - 이미 계산된 값이 있는 경우:
      - 그 값을 바로 반환하여 재사용 (메모이제이션)
    - 다음 도시로 이동 (재귀 호출):
      - 일단 dp[current][visited]를 INF로 초기화
      - 방문하지 않은 도시 중 이동 가능한 도시만 선택하여 재귀 호출
        - 이미 방문한 경우(**(visited & (1 << next)) != 0**) 패스
        - 현재 도시에서 다음 도시로 가는 경로가 없는 경우(**W[current][next] == 0**) 패스
      - 이동 비용 + 나머지 경로 비용 = **W[current][next] + tsp(next, visited | (1 << next))**
        - <strong>visited | (1 << next)</strong>를 통해 방문 상태 갱신
    - dp[current][visited]에 저장 후 반환 → 다른 경로에서도 재활용 가능

---

## 시간 복잡도

- 상태의 수 = (도시의 수) \* (방문 상태의 가짓수) = N \* 2ⁿ (각 도시를 방문했거나 안 했거나)
- 각 상태에서 다음 방문할 도시를 최대 N번 찾음 → (N \* 2ⁿ) \* N = **O(N² \* 2ⁿ)**

---

## Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static final int INF = 16 * 1_000_000 + 1;
    static int N;
    static int[][] W;
    static int[][] dp;
    static int start = 0; // 시작 도시
    static int ALL_VISITED; // 모든 도시를 방문했음을 나타내는 비트마스크

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

        dp = new int[N][1 << N]; // dp[현재도시][방문한도시들]
        ALL_VISITED = (1 << N) - 1; // 10...00 - 00...01 = 011...1

        // DP 테이블을 -1로 초기화하여 아직 계산되지 않았음을 표시
        for (int i = 0; i < N; i++) {
            Arrays.fill(dp[i], -1);
        }

        // 0번 도시에서 출발하여 순회 시작
        // 초기 방문 상태는 0번 도시만 방문했으므로, 비트마스크는 1 (00...01)
        int result = tsp(0, 1);

        System.out.println(result);
    }

    /**
     * 외판원 순회 문제를 해결하는 재귀 함수 (Top-down DP)
     *
     * @param current 현재 위치한 도시
     * @param visited 지금까지 방문한 도시들을 나타내는 비트마스크
     * @return 현재 상태에서 남은 도시들을 모두 방문하고 출발지로 돌아가는 데 드는 최소 비용
     */
    static int tsp(int current, int visited) {
        // 모든 도시를 방문한 경우
        if (visited == ALL_VISITED) {
            // 현재 도시에서 출발 도시로 돌아가는 비용 반환
            // 돌아가는 경로가 없으면 무한대 비용 반환
            return W[current][start] == 0 ? INF : W[current][start];
        }

        // 이미 계산된 값이 있는 경우
        if (dp[current][visited] != -1) {
            return dp[current][visited]; // 재사용 (메모이제이션)
        }

        dp[current][visited] = INF; // 일단 무한대로 초기화

        // 다음으로 방문할 도시 탐색
        for (int next = 0; next < N; next++) {
            // next 도시를 이미 방문한 경우
            if ((visited & (1 << next)) != 0) continue;

            // 현재 도시에서 next 도시로 가는 경로가 없는 경우
            if (W[current][next] == 0) continue;

            // next 도시를 방문한 것으로 처리하고 재귀 호출
            int cost = W[current][next] + tsp(next, visited | (1 << next));

            // 기존에 계산된 최소 비용과 새로 계산된 비용을 비교하여 더 작은 값으로 갱신
            dp[current][visited] = Math.min(dp[current][visited], cost);
        }

        return dp[current][visited];
    }
}
```
