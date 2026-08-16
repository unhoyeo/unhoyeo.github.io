---
title: "11437번 LCA – 트리, 최소 공통 조상 (LCA)"
pubDate: 2025-10-07T01:31:28+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/11437>

N(2 ≤ N ≤ 50,000)개의 정점으로 이루어진 트리가 주어진다. 트리의 각 정점은 1번부터 N번까지 번호가 매겨져 있으며, 루트는 1번이다.

두 노드의 쌍 M(1 ≤ M ≤ 10,000)개가 주어졌을 때, 두 노드의 가장 가까운 공통 조상이 몇 번인지 출력한다.

```java
15
1 2
1 3
2 4
3 7
6 2
3 8
4 9
2 5
5 11
7 13
10 4
11 15
12 5
14 7
6
6 11
10 9
2 6
7 6
8 13
8 15
```

첫째 줄에 노드의 개수 N이 주어지고, 다음 N-1개 줄에는 트리 상에서 연결된 두 정점이 주어진다. 그 다음 줄에는 가장 가까운 공통 조상을 알고싶은 쌍의 개수 M이 주어지고, 다음 M개 줄에는 정점 쌍이 주어진다.

```java
2
4
2
1
3
1
```

M개의 줄에 차례대로 입력받은 두 정점의 가장 가까운 공통 조상을 출력한다.

---

**아이디어**

- 단순히 각 노드의 <strong>부모 배열</strong>을 구하고, 부모를 타고 올라가면 <strong>O(N)</strong>이라 느림
- <strong>Binary Lifting (이진 점프)</strong> 기법을 사용하면 <strong>O(log N)</strong>에 구할 수 있음
  - 각 노드의 2⁰, 2¹, 2², …, 2ᵏ 번째 조상을 미리 저장
- 즉, 한 번에 한 칸씩 부모로 올라가면 O(N)이지만, **2의 거듭제곱 단위로 점프**하면 O(log N)으로 줄어듦!
  - DFS로 **깊이**와 **부모**를 저장 (2⁰ 번째 조상)
  - 이진 점프 **전처리** (2¹, 2², …, 2ᵏ 번째 조상)
  - LCA 구하기:
    - 먼저 두 노드의 **깊이를 맞춤** (더 깊은 쪽을 위로 올림)
    - 깊이가 같아지면, **동시에 위로 점프**시켜서 두 노드의 부모가 같아지는 바로 직전 단계까지 이동
    - 마지막 두 노드의 **부모**가 바로 LCA

---

**Java 코드 (단순히 부모 배열만 사용)**

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N;
    static List<List<Integer>> tree = new ArrayList<>();
    static int[] parent;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st;

        N = Integer.parseInt(br.readLine());

        for (int i = 0; i <= N; i++) {
            tree.add(new ArrayList<>());
        }

        for (int i = 0; i < N - 1; i++) {
            st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            tree.get(a).add(b);
            tree.get(b).add(a);
        }

        parent = new int[N + 1];

        // 부모 배열 구하기
        Queue<Integer> q = new ArrayDeque<>();
        q.add(1);
        parent[1] = -1;

        while (!q.isEmpty()) {
            int cur = q.poll();
            for (int next : tree.get(cur)) {
                if (parent[next] == 0) {
                    parent[next] = cur;
                    q.add(next);
                }
            }
        }

        StringBuilder sb = new StringBuilder();
        int M = Integer.parseInt(br.readLine());

        for (int i = 0; i < M; i++) {
            st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            sb.append(findCommonAncestor(a, b)).append('\n');
        }

        System.out.println(sb);
    }

    // 가장 가까운 공통 조상 구하기
    static int findCommonAncestor(int a, int b) {
        boolean[] isAncestor = new boolean[N + 1];

        int cur = a;
        while (true) {
            isAncestor[cur] = true;
            if (cur == 1) break;
            cur = parent[cur];
        }

        cur = b;
        while (true) {
            if (isAncestor[cur]) return cur;
            cur = parent[cur];
        }
    }
}
```

- findCommonAncestor(a, b) 함수의 시간 복잡도는 **O(N)**
- LCA를 M번 구하므로, 전체 시간 복잡도는 **O(N × M)**
- N ≤ 50,000, M ≤ 10,000 → 최악의 경우 5×10^8 → **시간 초과 가능!**

---

**Java 코드 (이진 점프 기법 사용)**

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N, LOG;
    static List<List<Integer>> tree = new ArrayList<>();
    static int[][] parent;
    static int[] depth;
    static boolean[] visited;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st;

        N = Integer.parseInt(br.readLine());

        // 트리의 최대 깊이를 표현하기 위해 필요한 비트 수
        LOG = (int) Math.ceil(Math.log(N) / Math.log(2));

        for (int i = 0; i <= N; i++) {
            tree.add(new ArrayList<>());
        }

        for (int i = 0; i < N - 1; i++) {
            st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            tree.get(a).add(b);
            tree.get(b).add(a);
        }

        parent = new int[LOG + 1][N + 1]; // parent[k][v] = 노드 v의 2^k번째 조상
        depth = new int[N + 1];
        visited = new boolean[N + 1];

        // 부모(0번째 조상), 깊이 정보 저장
        dfs(1, 0);

        // 이진 점프 전처리
        for (int k = 1; k <= LOG; k++) {
            for (int v = 1; v <= N; v++) {
                parent[k][v] = parent[k - 1][parent[k - 1][v]];
            }
        }

        int M = Integer.parseInt(br.readLine());
        StringBuilder sb = new StringBuilder();

        while (M-- > 0) {
            st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            sb.append(lca(a, b)).append('\n');
        }

        System.out.print(sb);
    }

    static void dfs(int v, int p) {
        parent[0][v] = p;
        for (int next : tree.get(v)) {
            if (next != p) {
                depth[next] = depth[v] + 1;
                dfs(next, v);
            }
        }
    }

    static int lca(int a, int b) {
        // 더 깊은 쪽을 a로 세팅
        if (depth[a] < depth[b]) {
            int temp = a;
            a = b;
            b = temp;
        }

        // 깊이 맞추기
        int diff = depth[a] - depth[b];
        for (int k = LOG; k >= 0; k--) {
            if ((diff & (1 << k)) != 0) {
                a = parent[k][a];
            }
        }

        // 이미 같은 노드라면 LCA
        if (a == b) return a;

        // 위로 동시에 올리기
        for (int k = LOG; k >= 0; k--) {
            if (parent[k][a] != parent[k][b]) {
                a = parent[k][a];
                b = parent[k][b];
            }
        }

        // 부모가 LCA
        return parent[0][a];
    }
}
```

- DFS: **O(N)**
- 이진 점프 전처리: **O(N log N)**
- LCA 한 번 계산: **O(log N)**
- M개의 쿼리 처리: **O(M log N)**
- 전체 시간 복잡도: **O((N + M) log N)**
- N ≤ 50,000, M ≤ 10,000이므로 충분히 빠름!
