---
title: "13023번 ABCDE – DFS, 백트래킹"
description: "BOJ 알고리즘 캠프에는 총 N명이 참가하고 있다. 사람들은 0번부터 N-1번으로 번호가 매겨져 있고, 일부 사람들은 친구이다. 오늘은 다음과 같은 친구 관계를 가진 사람 A, B, C, D, E가 존재하는지 구해보려고 한다."
pubDate: 2025-08-31T09:45:07+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/13023>

BOJ 알고리즘 캠프에는 총 N명이 참가하고 있다. 사람들은 0번부터 N-1번으로 번호가 매겨져 있고, 일부 사람들은 친구이다.

오늘은 다음과 같은 친구 관계를 가진 사람 A, B, C, D, E가 존재하는지 구해보려고 한다.

- A는 B와 친구다.
- B는 C와 친구다.
- C는 D와 친구다.
- D는 E와 친구다.

위와 같은 친구 관계가 존재하는지 안하는지 구하는 프로그램을 작성하시오.

```java
5 5
0 1
1 2
2 3
3 0
1 4
```

첫째 줄에 사람의 수 N (5 ≤ N ≤ 2000)과 친구 관계의 수 M (1 ≤ M ≤ 2000)이 주어진다.

둘째 줄부터 M개의 줄에는 정수 a와 b가 주어지며, a와 b가 친구라는 뜻이다. (0 ≤ a, b ≤ N-1, a ≠ b) 같은 친구 관계가 두 번 이상 주어지는 경우는 없다.

```java
1
```

문제의 조건에 맞는 A, B, C, D, E가 존재하면 1을 없으면 0을 출력한다.

---

## 아이디어

- 친구 관계는 **무방향 그래프**로 표현 가능
- A-B-C-D-E와 같은 관계를 찾는 건 **길이가 4인 단순 경로**를 찾는 것과 동일
- 모든 사람을 시작점으로 DFS를 수행하며, 깊이가 5에 도달하면 바로 종료

---

## 시간 복잡도

- 최악의 경우 모든 정점에서 DFS를 수행: **O(N × (N + M))**
- N, M ≤ 2000이므로 충분히 가능

---

## Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N, M;
    static List<List<Integer>> graph = new ArrayList<>();
    static boolean[] visited;
    static boolean found = false;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        N = Integer.parseInt(st.nextToken());
        M = Integer.parseInt(st.nextToken());

        for (int i = 0; i < N; i++) {
            graph.add(new ArrayList<>());
        }

        for (int i = 0; i < M; i++) {
            st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            graph.get(a).add(b);
            graph.get(b).add(a);
        }

        visited = new boolean[N];

        for (int i = 0; i < N; i++) {
            dfs(1, i);
            if (found) break;
        }

        System.out.println(found ? 1 : 0);
    }

    static void dfs(int depth, int node) {
        if (found) return; // 이미 찾은 경우 중단

        if (depth == 5) {
            found = true;
            return;
        }

        visited[node] = true;
        for (int next : graph.get(node)) {
            if (visited[next]) continue;
            dfs(depth + 1, next);
        }
        visited[node] = false; // 다른 경로 탐색을 위해 백트래킹
    }
}
```

> 복습 필요
