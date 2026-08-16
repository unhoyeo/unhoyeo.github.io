---
title: "11725번 트리의 부모 찾기 – 트리, BFS, DFS"
description: "루트 없는 트리가 주어진다. 이때, 트리의 루트를 1이라고 정했을 때, 각 노드의 부모를 구하는 프로그램을 작성하시오. 첫째 줄에 노드의 개수 N (2 ≤ N ≤ 100,000)이 주어진다."
pubDate: 2025-09-26T23:14:57+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/11725>

루트 없는 트리가 주어진다. 이때, 트리의 루트를 1이라고 정했을 때, 각 노드의 부모를 구하는 프로그램을 작성하시오.

```bash
7
1 6
6 3
3 5
4 1
2 4
4 7
```

첫째 줄에 노드의 개수 N (2 ≤ N ≤ 100,000)이 주어진다. 둘째 줄부터 N-1개의 줄에 트리 상에서 연결된 두 정점이 주어진다.

```bash
4
6
1
3
1
4
```

첫째 줄부터 N-1개의 줄에 각 노드의 부모 노드 번호를 2번 노드부터 순서대로 출력한다.

---

## 아이디어

- 트리는 **인접 리스트** 형태로 저장
- 트리의 루트를 1번으로 정했으므로, 1번 노드에서부터 시작하여 **BFS**나 **DFS**로 탐색하면서 **부모를 기록**
- 현재 노드에 연결된 노드들은 모두 **현재 노드가 부모 노드가 됨**

---

## ⏱️ 시간 복잡도

- 그래프 구성: **O(N)**
- DFS/BFS 탐색: **O(N)**
- 전체: **O(N)**
- N ≤ 100,000

---

## Java 코드 (BFS 버전)

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N;
    static int[] parent;
    static List<List<Integer>> tree = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        N = Integer.parseInt(br.readLine());

        parent = new int[N + 1];

        for (int i = 0; i <= N; i++) {
            tree.add(new ArrayList<>());
        }

        for (int i = 0; i < N - 1; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            tree.get(a).add(b);
            tree.get(b).add(a);
        }

        bfs(1);

        StringBuilder sb = new StringBuilder();
        for (int i = 2; i <= N; i++) {
            sb.append(parent[i]).append('\n');
        }

        System.out.print(sb);
    }

    static void bfs(int root) {
        Queue<Integer> q = new LinkedList<>();
        q.add(root);
        parent[root] = -1; // 루트의 부모는 없음

        while (!q.isEmpty()) {
            int cur = q.poll();
            for (int next : tree.get(cur)) {
                if (parent[next] == 0) { // 아직 방문 안 함
                    parent[next] = cur; // 부모 기록
                    q.add(next);
                }
            }
        }
    }
}
```

---

## Java 코드 (DFS 버전)

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N;
    static int[] parent;
    static List<List<Integer>> tree = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        N = Integer.parseInt(br.readLine());

        parent = new int[N + 1];

        for (int i = 0; i <= N; i++) {
            tree.add(new ArrayList<>());
        }

        for (int i = 0; i < N - 1; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            tree.get(a).add(b);
            tree.get(b).add(a);
        }

        dfs(1, -1);

        StringBuilder sb = new StringBuilder();
        for (int i = 2; i <= N; i++) {
            sb.append(parent[i]).append('\n');
        }

        System.out.print(sb);
    }

    static void dfs(int cur, int p) {
        parent[cur] = p; // 부모 기록
        for (int next : tree.get(cur)) {
            if (next != p) { // 부모가 아니면 (자식이면)
                dfs(next, cur);
            }
        }
    }
}
```

> DFS는 N이 크면 **스택 오버플로우**가 발생할 수 있으므로, BFS가 더 안전하다.
