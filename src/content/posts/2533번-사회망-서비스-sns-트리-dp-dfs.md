---
title: "2533번 사회망 서비스(SNS) – 트리, DP, DFS"
pubDate: 2025-09-26T23:54:16+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/2533>

페이스북, 트위터, 카카오톡과 같은 사회망 서비스(SNS)가 널리 사용됨에 따라, 사회망을 통하여 사람들이 어떻게 새로운 아이디어를 받아들이게 되는가를 이해하는 문제가 중요해졌다. 사회망에서 사람들의 친구 관계는 그래프로 표현할 수 있는데, 이 그래프에서 사람은 정점으로 표현되고, 두 정점을 잇는 에지는 두 정점으로 표현되는 두 사람이 서로 친구 관계임을 표현한다.

예를 들어, 철수와 영희, 철수와 만수, 영희와 순희가 서로 친구 관계라면 이를 표현하는 친구 관계 그래프는 다음과 같다.

![2533번 사회망 서비스(SNS) – 트리, DP, DFS](/images/tistory/258/img.png)

친구 관계 그래프를 이용하면 사회망 서비스에서 어떤 새로운 아이디어가 전파되는 과정을 이해하는데 도움을 줄 수 있다. 어떤 새로운 아이디어를 먼저 받아들인 사람을 얼리 아답터(early adaptor)라고 하는데, 사회망 서비스에 속한 사람들은 얼리 아답터이거나 얼리 아답터가 아니다. 얼리 아답터가 아닌 사람들은 자신의 모든 친구들이 얼리 아답터일 때만 이 아이디어를 받아들인다.

어떤 아이디어를 사회망 서비스에서 퍼뜨리고자 할 때, 가능한 한 최소의 수의 얼리 아답터를 확보하여 모든 사람이 이 아이디어를 받아들이게 하는 문제는 매우 중요하다.

일반적인 그래프에서 이 문제를 푸는 것이 매우 어렵다는 것이 알려져 있기 때문에, 친구 관계 그래프가 트리인 경우, 즉 모든 두 정점 사이에 이들을 잇는 경로가 존재하면서 사이클이 존재하지 않는 경우만 고려한다.

예를 들어, 8명의 사람으로 이루어진 다음 친구 관계 트리를 생각해 보자. 2, 3, 4번 노드가 표현하는 사람들이 얼리 아답터라면, 얼리 아답터가 아닌 사람들은 자신의 모든 친구가 얼리 아답터이기 때문에 새로운 아이디어를 받아들인다.

![2533번 사회망 서비스(SNS) – 트리, DP, DFS](/images/tistory/258/img_1.png)

친구 관계 트리가 주어졌을 때, 모든 개인이 새로운 아이디어를 수용하기 위하여 필요한 최소 얼리 어답터의 수를 구하는 프로그램을 작성하시오.

```java
8
1 2
1 3
1 4
2 5
2 6
4 7
4 8
```

첫 번째 줄에는 친구 관계 트리의 정점 개수 N이 주어진다. 단, 2 ≤ N ≤ 1,000,000이며, 각 정점은 1부터 N까지 일련번호로 표현된다. 두 번째 줄부터 N-1개의 줄에는 각 줄마다 친구 관계 트리의 에지 (u, v)를 나타내는 두 정수 u와 v가 하나의 빈칸을 사이에 두고 주어진다.

```java
3
```

주어진 친구 관계 그래프에서 아이디어를 전파하는데 필요한 얼리 아답터의 최소 수를 하나의 정수로 출력한다.

---

## 아이디어

- 어떠한 노드 node에 대해 두 가지 상태를 정의한다.
  - **dp[node][0]**: node가 **얼리어답터가 아닌 경우** → **자식 노드들은 반드시 얼리어답터여야 함**
  - **dp[node][1]**: node가 **얼리어답터인 경우** → **자식 노드는 얼리어답터이든 아니든 상관없음**
- 따라서 점화식은 다음과 같다.
  - **dp[parent][0] = Σ(dp[child][1])** (모든 자식들은 반드시 얼리어답터)
  - **dp[parent][1] = 1 + Σ(min(dp[child][0], dp[child][1]))** (내가 얼리어답터니까 자식은 상관없음)
- 최종 결과는 **min(dp[root][0], dp[root][1])**

---

## 시간 복잡도

- DFS + 각 노드의 자식에 대한 DP 연산 → **O(N)**
- N ≤ 1,000,000이어도 가능

---

## Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N;
    static boolean[] visited;
    static int[][] dp;
    static List<List<Integer>> tree = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        N = Integer.parseInt(br.readLine());

        for (int i = 0; i <= N; i++) {
            tree.add(new ArrayList<>());
        }

        for (int i = 0; i < N - 1; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int u = Integer.parseInt(st.nextToken());
            int v = Integer.parseInt(st.nextToken());
            tree.get(u).add(v);
            tree.get(v).add(u);
        }

        visited = new boolean[N + 1];
        dp = new int[N + 1][2]; // [0] = 얼리어답터가 아님, [1] = 얼리어답터임

        dfs(1);

        System.out.println(Math.min(dp[1][0], dp[1][1]));
    }

    static void dfs(int node) {
        visited[node] = true;
        dp[node][0] = 0; // 얼리어답터가 아닐 때
        dp[node][1] = 1; // 얼리어답터일 때

        for (int next : tree.get(node)) {
            if (!visited[next]) {
                dfs(next);
                // 현재 노드가 얼리어답터가 아니면 자식이 무조건 얼리어답터
                dp[node][0] += dp[next][1];
                // 현재 노드가 얼리어답터면 자식은 상관 없음
                dp[node][1] += Math.min(dp[next][0], dp[next][1]);
            }
        }
    }
}
```

---

## 정리

- 트리 DP 패턴: **"내가 포함될 때 / 포함되지 않을 때"** 두 상태로 나눔
- 루트 기준으로 <strong>min(dp[1][0], dp[1][1])</strong>이 답

> 복습 필요
