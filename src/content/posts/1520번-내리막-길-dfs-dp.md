---
title: "1520번 내리막 길 - DFS + DP"
description: "여행을 떠난 세준이는 지도를 하나 구하였다. 이 지도는 아래 그림과 같이 직사각형 모양이며 여러 칸으로 나뉘어 있다. 한 칸은 한 지점을 나타내는데 각 칸에는 그 지점의 높이가 쓰여 있으며, 각 지점 사이의 이동은 지도에서 상하좌우…"
pubDate: 2025-04-20T12:37:28+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/1520>

여행을 떠난 세준이는 지도를 하나 구하였다. 이 지도는 아래 그림과 같이 직사각형 모양이며 여러 칸으로 나뉘어 있다. 한 칸은 한 지점을 나타내는데 각 칸에는 그 지점의 높이가 쓰여 있으며, 각 지점 사이의 이동은 지도에서 상하좌우 이웃한 곳끼리만 가능하다.

현재 제일 왼쪽 위 칸이 나타내는 지점에 있는 세준이는 제일 오른쪽 아래 칸이 나타내는 지점으로 가려고 한다. 그런데 가능한 힘을 적게 들이고 싶어 항상 높이가 더 낮은 지점으로만 이동하여 목표 지점까지 가고자 한다. 아래 지도에서는 다음과 같은 세 가지 경로가 가능하다.

![1520번 내리막 길 - DFS + DP](/images/tistory/110/img.png)

지도가 주어질 때 이와 같이 제일 왼쪽 위 지점에서 출발하여 제일 오른쪽 아래 지점까지 항상 내리막길로만 이동하는 경로의 개수를 구하는 프로그램을 작성하시오.

---

## ❌ 첫 번째 아이디어 - 단순 DFS

- DFS로 (0, 0)에서 시작하여 (N-1, M-1)에 도착하면 경로의 개수를 1 늘린다.
- 목적지에 도착하면 방문 여부를 되돌린다. (백트래킹)

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N, M, result;
    static int[][] map;
    static boolean[][] visited;
    static int[] dr = {0, 1, 0, -1};
    static int[] dc = {1, 0, -1, 0};

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        N = Integer.parseInt(st.nextToken());
        M = Integer.parseInt(st.nextToken());

        map = new int[N][M];
        visited = new boolean[N][M];

        for (int i = 0; i < N; i++) {
            st = new StringTokenizer(br.readLine());
            for (int j = 0; j < M; j++) {
                map[i][j] = Integer.parseInt(st.nextToken());
            }
        }

        dfs(0, 0);
        System.out.println(result);
    }

    static void dfs(int r, int c) {
        if (r == N - 1 && c == M - 1) {
            result++;
            return;
        }
        visited[r][c] = true;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d];
            int nc = c + dc[d];

            if (nr < 0 || nc < 0 || nr >= N || nc >= M || visited[nr][nc]) continue;

            if (map[nr][nc] < map[r][c]) {
                dfs(nr, nc);
                visited[nr][nc] = false;
            }
        }
    }
}
```

**시간 초과 발생**

- 단순 DFS는 **중복 호출이 너무 많아** 시간 초과가 발생한다.
- **이미 방문한 좌표에 대해서는 경로 수를 기억**해두는 방식으로 최적화해야 한다.

---

## ✅ 두 번째 아이디어 - DFS + DP(메모이제이션)

- **dp[r][c] = (r, c)에서 목적지까지 갈 수 있는 경로의 수**
- **초기값은 -1** → 아직 계산되지 않은 상태 (아직 방문하지 않았음)
  - 0 이상이면 이미 방문해서 경로 수를 계산한 것이고, 그 값을 재활용할 수 있다.

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N, M;
    static int[][] map, dp;
    static int[] dr = {0, 1, 0, -1};
    static int[] dc = {1, 0, -1, 0};

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        N = Integer.parseInt(st.nextToken());
        M = Integer.parseInt(st.nextToken());

        map = new int[N][M];
        dp = new int[N][M];

        for (int i = 0; i < N; i++) {
            st = new StringTokenizer(br.readLine());
            for (int j = 0; j < M; j++) {
                map[i][j] = Integer.parseInt(st.nextToken());
                dp[i][j] = -1; // 아직 방문하지 않음
            }
        }

        System.out.println(dfs(0, 0));
    }

    static int dfs(int r, int c) {
        // 목적지에 도착한 경우
        if (r == N - 1 && c == M - 1) {
            return 1; // 경로 하나를 성공적으로 찾은 것이므로 1을 리턴
        }

        // 이전에 이 위치에서 출발한 경로 수를 이미 계산한 경우
        if (dp[r][c] != -1) {
            return dp[r][c]; // 바로 그 값을 사용
        }

        dp[r][c] = 0; // 아직 계산된 적이 없다면, 일단 0으로 초기화

        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d];
            int nc = c + dc[d];

            if (nr < 0 || nc < 0 || nr >= N || nc >= M) continue;

            // 내리막인 경우에만 그 칸으로 이동
            if (map[nr][nc] < map[r][c]) {
                dp[r][c] += dfs(nr, nc); // 그 칸에서 목적지까지 갈 수 있는 경로 수를 재귀적으로 더해줌
            }
        }

        return dp[r][c];
    }
}
```

## ☑️ DFS 수행 이후의 최종 dp 테이블

![1520번 내리막 길 - DFS + DP](/images/tistory/110/img_1.png)

- (3,4)는 **도착 지점**이므로 dp[3][4] = 1 (기저 조건)
- 각 위치는 **자신보다 낮은 인접 칸들로 가는 경로의 수를 합산**해서 계산됨
  - dp[3][3] = dp[3][4] = 1
  - dp[3][2] = dp[3][3] = 1
  - dp[2][2] = dp[3][2] = 1
  - dp[1][2] = dp[2][2] = 1
  - dp[0][2] = dp[1][2] + dp[0][3] = 1 + 1 = 2
  - 이런 방식으로 위쪽으로 거슬러 올라가면서 중복 계산 없이 메모이제이션이 누적됨

## ✅ 요약 정리

- 이 문제는 단순한 DFS로는 시간 초과가 난다.
- 그래서 **한 번 계산한 지점에 대해서는 다시 계산하지 않도록** DP를 활용한 메모이제이션을 사용해야 한다.

## 핵심 아이디어

- (r, c)에서 출발하는 모든 내리막 경로 수는
- 내리막으로 갈 수 있는 인접한 모든 칸의 경로 수를 더한 것과 같다!
