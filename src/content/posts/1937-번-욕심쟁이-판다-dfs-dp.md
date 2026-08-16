---
title: "1937번 욕심쟁이 판다 – DFS, DP"
pubDate: 2025-08-11T21:15:04+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/1937>

n × n의 크기의 대나무 숲이 있다. 욕심쟁이 판다는 어떤 지역에서 대나무를 먹기 시작한다. 그리고 그 곳의 대나무를 다 먹어 치우면 상, 하, 좌, 우 중 한 곳으로 이동을 한다. 그리고 또 그곳에서 대나무를 먹는다. 그런데 단 조건이 있다. 이 판다는 매우 욕심이 많아서 대나무를 먹고 자리를 옮기면 그 옮긴 지역에 그 전 지역보다 대나무가 많이 있어야 한다.

이 판다의 사육사는 이런 판다를 대나무 숲에 풀어 놓아야 하는데, 어떤 지점에 처음에 풀어 놓아야 하고, 어떤 곳으로 이동을 시켜야 판다가 최대한 많은 칸을 방문할 수 있는지 고민에 빠져 있다. 우리의 임무는 이 사육사를 도와주는 것이다. n × n 크기의 대나무 숲이 주어져 있을 때, 이 판다가 최대한 많은 칸을 이동하려면 어떤 경로를 통하여 움직여야 하는지 구하여라.

```java
4
14 9 12 10
1 11 5 4
7 15 2 13
6 3 16 8
```

첫째 줄에 대나무 숲의 크기 n(1 ≤ n ≤ 500)이 주어진다. 그리고 둘째 줄부터 n+1번째 줄까지 대나무 숲의 정보가 주어진다. 대나무 숲의 정보는 공백을 사이로 두고 각 지역의 대나무의 양이 정수 값으로 주어진다. 대나무의 양은 1,000,000보다 작거나 같은 자연수이다.

```java
4
```

첫째 줄에는 판다가 이동할 수 있는 칸의 수의 최댓값을 출력한다.

---

## 아이디어

- 모든 칸에서 시작하여 가능한 **경로의 최대 길이**를 구하는 문제이므로, DFS 이용
  - 단, n이 최대 500이므로 단순 DFS로는 시간 초과 가능
- 따라서 **DFS + 메모이제이션(DP)** 방식 사용
  - dp[i][j] = (i, j)에서 시작했을 때, 이동할 수 있는 최대 칸 수
  - 모든 칸에 대해 dfs(i, j) 호출 (반환 값 = dp[i][j])
    - 만약 **이미 계산한 값**이 있다면 (dp[r][c] != 0) → 바로 반환하여 **재사용**
    - dp[r][c] = 1로 초기화 (현재 위치로 이동)
    - 상하좌우 탐색하면서, **현재 칸의 대나무 양보다 더 많을 때** 재귀 호출
    - 기존 dp[r][c] 값과 **(호출 결과 + 1)** 값을 비교하여 더 큰 값으로 dp[r][c] 갱신
  - 최종적으로 dp[i][j] 중 최댓값 출력

---

## 시간 복잡도

- 각 칸은 최대 한 번만 DFS 수행하므로, **O(n²)**
- n ≥ 500 → 가능

---

## Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static int n;
    static int[][] map, dp;
    static int[] dr = {-1, 1, 0, 0};
    static int[] dc = {0, 0, -1, 1};

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        n = Integer.parseInt(br.readLine());

        map = new int[n][n];
        dp = new int[n][n]; // 해당 위치에서 시작할 때 최대 경로 길이

        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            for (int j = 0; j < n; j++) {
                map[i][j] = Integer.parseInt(st.nextToken());
            }
        }

        int result = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                result = Math.max(result, dfs(i, j));
            }
        }

        System.out.println(result);
    }

    static int dfs(int r, int c) {
        // 이미 계산한 값 있으면 반환
        if (dp[r][c] != 0) return dp[r][c];

        dp[r][c] = 1; // 최소 자기 자신

        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d];
            int nc = c + dc[d];

            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;

            if (map[nr][nc] > map[r][c]) {
                dp[r][c] = Math.max(dp[r][c], dfs(nr, nc) + 1);
            }
        }

        return dp[r][c];
    }
}
```

만약 n이 훨씬 커지거나 대각선 이동이 허용된다면, 이 구조를 **그래프** 형태로 바꿔서 **BFS + 위상 정렬** 방식으로도 풀 수 있다.

---

**아이디어**

- 각 칸을 정점으로 보고, 이동 가능한 방향을 간선으로 둠
- 작은 값에서 큰 값으로만 이동하므로 **비순환 그래프** → 위상 정렬 가능
- 진입 차수가 0인 칸(가장 작은 값들)부터 시작해 BFS를 돌리면서, 이전 칸의 최대 거리 + 1 값을 갱신

---

⏱ **시간 복잡도**

- N×N 칸을 모두 순회하며 간선 계산: **O(N²)**
- BFS에서 각 간선을 한 번씩만 처리: **O(N²)**
- 전체 시간 복잡도: **O(N²)**

---

**Java 코드**

```java
import java.io.*;
import java.util.*;

public class Main {
    static int n;
    static int[][] map, dp, indegree;
    static int[] dr = {-1, 1, 0, 0};
    static int[] dc = {0, 0, -1, 1};

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        n = Integer.parseInt(br.readLine());

        map = new int[n][n];
        dp = new int[n][n];
        indegree = new int[n][n];

        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            for (int j = 0; j < n; j++) {
                map[i][j] = Integer.parseInt(st.nextToken());
            }
        }

        // 1. 진입 차수 계산
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                for (int d = 0; d < 4; d++) {
                    int nr = r + dr[d];
                    int nc = c + dc[d];
                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                    if (map[nr][nc] > map[r][c]) {
                        indegree[nr][nc]++;
                    }
                }
            }
        }

        // 2. 진입 차수 0인 칸을 큐에 삽입
        Queue<int[]> q = new ArrayDeque<>();
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (indegree[r][c] == 0) {
                    q.offer(new int[]{r, c});
                    dp[r][c] = 1; // 최소 자기 자신
                }
            }
        }

        // 3. BFS (위상 정렬)
        int result = 0;
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int r = cur[0], c = cur[1];
            result = Math.max(result, dp[r][c]);

            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d];
                int nc = c + dc[d];
                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                if (map[nr][nc] > map[r][c]) {
                    dp[nr][nc] = Math.max(dp[nr][nc], dp[r][c] + 1);
                    if (--indegree[nr][nc] == 0) {
                        q.offer(new int[]{nr, nc});
                    }
                }
            }
        }

        System.out.println(result);
    }
}
```

---

## 장점

- 재귀 호출 없이 **반복문만 사용**하므로 스택 오버플로우 위험 없음
- 위상 정렬을 이용해 **모든 칸의 최대 이동 거리**를 한 번의 BFS로 계산 가능
- dp 값이 즉시 갱신되므로, DFS처럼 후처리 없이 결과 바로 구할 수 있음
