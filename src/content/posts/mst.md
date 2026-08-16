---
title: "MST"
description: "MST (Minimum Spanning Tree) Spanning Tree: 모든 노드가 연결된 트리 MST: 최소 비용으로 모든 노드가 연결된 트리 → 모든 노드를 잇는데 최소 비용이 뭐야?!"
pubDate: 2025-03-06T19:14:05+09:00
category: "알고리즘/개념"
tags: []
draft: true
---

## 개념

- **MST (Minimum Spanning Tree)**
- **Spanning Tree**: 모든 노드가 연결된 트리
- **MST**: **최소 비용**으로 모든 노드가 연결된 트리 → **모든 노드를 잇는데 최소 비용이 뭐야?!**
- 푸는 방법: **Kruskal, Prim**
- **Kruskal: 모든 간선 중 작은 것부터 연결**
- **Prim: 현재 연결된 트리에 이어진 간선 중 가장 작은 것을 추가**

![MST](/images/tistory/31/img.png)

예를 들어 다음과 같은 Spanning Tree가 있을 때,

- Kruskal: 간선 1 → 간선 2 → 간선 3 → 간선 4는 이미 연결되어 있으므로 pass → 간선 5 → 간선 6은 이미 연결되어 있으므로 pass
- Prim: 노드 1에 연결된 간선 중 가장 작은 간선 1 추가 → 현재 트리에 연결된 간선 2, 3 중 가장 작은 간선 2 연결 → 간선 3, 4, 5 중 가장 작은 간선 3 연결 → 간선 4, 5, 6중 가장 작은 간선 4는 이미 연결되어 있으므로 pass → 간선 5, 6중 가장 작은 간선 5 연결
- Kruskal 알고리즘은 코드로 구현하기 어려우므로, **Prim** 알고리즘 사용!
- 간선들의 비용을 비교하기 위한 자료구조로 **Heap** (자바에서는 **PriorityQueue**) 사용! → **최솟값, 최댓값을** 빠르게 찾기 때문!

---

## 핵심 코드

```java
int sum = 0; // MST 전체 가중치 합
PriorityQueue<Edge> pq = new PriorityQueue<>(); // 최소 힙 (가중치 기준 정렬)
pq.add(new Edge(1, 0)); // 시작 정점 추가(1번)

while (!pq.isEmpty()) {
    Edge edge = pq.poll();
    int node = edge.node;
    int weight = edge.weight;

    if (visited[node]) continue; // 이미 방문한 정점이면 스킵
    visited[node] = true; // 방문 처리
    sum += weight; // 가중치 더하기

    // 인접한 정점들 중에서 방문하지 않은 경우 큐에 추가
    for (Edge e : graph.get(node)) {
        if (!visited[e.node]) {
            pq.add(e);
        }
    }
}
```

---

## 연습 문제 - 백준 1197번

```java
3 3
1 2 1
2 3 2
1 3 3
```

첫째 줄에 정점의 개수 V(1 ≤ V ≤ 10,000)와 간선의 개수 E(1 ≤ E ≤ 100,000)가 주어진다. 다음 E개의 줄에는 각 간선에 대한 정보를 나타내는 세 정수 A, B, C가 주어진다. 이는 A번 정점과 B번 정점이 가중치 C인 간선으로 연결되어 있다는 의미이다. C는 음수일 수도 있으며, 절댓값이 1,000,000을 넘지 않는다.

그래프의 정점은 1번부터 V번까지 번호가 매겨져 있고, 임의의 두 정점 사이에 경로가 있다. 최소 스패닝 트리의 가중치가 -2,147,483,648보다 크거나 같고, 2,147,483,647보다 작거나 같은 데이터만 입력으로 주어진다.

```java
3
```

첫째 줄에 최소 스패닝 트리의 가중치를 출력한다.

## 1. 아이디어

- <strong>간선(Edge)</strong>을 <strong>인접 리스트(List&lt;List>)</strong> 형태로 저장한다.
- <strong>힙(PriorityQueue)</strong>에 <strong>시작 정점</strong>(1번 정점)를 넣는다.
- 힙이 빌 때까지 다음 과정을 반복한다.
- <strong>힙의 최솟값(가장 가중치가 작은 간선)</strong>을 꺼낸다.
- 해당 정점이 방문하지 않은 곳일 경우 → **방문 처리, 해당 가중치 더하기, 연결된 간선들 힙에 추가!**

## 2. 시간복잡도

- **MST → O(E logE)**
- 힙에 추가 → O(logE)
- 간선 개수 E에 대해 큐에서 E번 연산 수행 → O(E \* logE)

## 3. 자료구조

- 최소 가중치 간선 빠르게 선택 → **PriorityQueue&lt;Edge>**
- 정점 방문 여부 체크 → **boolean[]**
- 간선 저장하는 인접 리스트 → **ArrayList&lt;ArrayList&lt;Edge>>**
- 가중치 최댓값 → 절댓값이 1,000,000을 넘지 않음 → int 가능
- 정점 번호 최댓값 → V ≤ 10,000 → int 가능
- MST 총비용 → 조건에 의해 int 가능

```java
import java.io.*;
import java.util.*;

class Edge implements Comparable<Edge> {
    int node; // 목적지 정점
    int weight; // 가중치

    public Edge(int node, int weight) {
        this.node = node;
        this.weight = weight;
    }

    @Override
    public int compareTo(Edge o) {
        return this.weight - o.weight; // 가중치 기준 오름차순 정렬
    }
}

class Main {

    static int V, E, A, B, C;
    static boolean[] visited; // 방문 여부
    static List<List<Edge>> graph; // 인접 리스트

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        StringTokenizer st = new StringTokenizer(br.readLine());
        V = Integer.parseInt(st.nextToken());
        E = Integer.parseInt(st.nextToken());

        visited = new boolean[V + 1]; // 정점 번호가 1부터 시작
        graph = new ArrayList<>();
        for (int i = 0; i < V + 1; i++) { // 정점 번호가 1부터 시작
            graph.add(new ArrayList<>());
        }

        // 간선 추가
        for (int i = 0; i < E; i++) {
            st = new StringTokenizer(br.readLine());
            A = Integer.parseInt(st.nextToken());
            B = Integer.parseInt(st.nextToken());
            C = Integer.parseInt(st.nextToken());

            graph.get(A).add(new Edge(B, C));
            graph.get(B).add(new Edge(A, C)); // 무방향 그래프이므로 반대 방향도 추가
        }

        int sum = 0; // MST 전체 가중치 합
        PriorityQueue<Edge> pq = new PriorityQueue<>(); // 최소 힙 (가중치 기준 정렬)
        pq.add(new Edge(1, 0)); // 시작 정점 추가(1번)

        while (!pq.isEmpty()) {
            Edge edge = pq.poll();
            int node = edge.node;
            int weight = edge.weight;

            if (visited[node]) continue; // 이미 방문한 정점이면 스킵
            visited[node] = true; // 방문 처리
            sum += weight; // 가중치 더하기

            // 인접한 정점들 중에서 방문하지 않은 경우 큐에 추가
            for (Edge e : graph.get(node)) {
                if (!visited[e.node]) {
                    pq.add(e);
                }
            }
        }

        System.out.println(sum);
    }
}
```

## 이해를 돕기 위해

![MST](/images/tistory/31/img_1.png)

- 가장 먼저 큐에 (1, 0) 간선이 들어간다. → (1번 노드로 가는, 가중치 0 간선)
- 큐에서 (1, 0) 간선을 **꺼낸다**. → 1번 노드는 **방문하지 않았다.** //
- 1번 노드를 **방문 처리**하고, **연결된** 간선을 찾는다. → (2, 2), (3, 3), (5, 1)
  - 전부 방문하지 않았으므로, 해당 간선 모두 **큐에 넣는다**. → 가중치 기준 오름차순으로 정렬된다. // (5, 1), (2, 2), (3, 3)
- 큐에서 (5, 1) 간선을 **꺼낸다**. → 5번 노드는 **방문하지 않았다.** // (2, 2), (3, 3)
- 5번 노드를 **방문 처리**하고, **연결된** 간선을 찾는다. → 없음
- 큐에서 (2, 2) 간선을 **꺼낸다**. → 2번 노드는 **방문하지 않았다.** // (3, 3)
- 2번 노드를 **방문 처리**하고, **연결된** 간선을 찾는다. → (1, 2), (3, 4), (4, 5)
  - 1번은 이미 방문 → 3번 방문 안함 큐에 (3, 4) 추가 → 4번 방문 안함 큐에 (4, 5) 추가 // (3, 3), (3, 4), (4, 5)
- 큐에서 (3, 3) 간선을 **꺼낸다**. → 3번 노드는 **방문하지 않았다.** // (3, 4), (4, 5)
- 3번 노드를 **방문 처리**하고, **연결된** 간선을 찾는다. → (1, 3), (2, 4), (4, 6)
  - 1번은 이미 방문 → 2번은 이미 방문 → 4번 방문 안함 큐에 (4, 6) 추가 // (3, 4), (4, 5), (4, 6)
- 큐에서 (3, 4) 간선을 **꺼낸다**. → 3번 노드는 **이미 방문함.** // (4, 5)
- 큐에서 (4, 5) 간선을 **꺼낸다**. → 4번 노드는 **방문하지 않았다.** //
- 4번 노드를 **방문 처리**하고, **연결된** 간선을 찾는다. → (2, 5), (3, 6)
  - 모두 이미 방문함

---

## 팁

- 최소 스패닝 트리 문제는 **그냥 코드를 외우자!**
- 중요한 건 해당 문제가 MST 문제인지 알아내는 능력이다.
- **모든 노드가 연결되도록 한다거나, 이미 연결된 노드를 최소의 비용으로 줄인다**면 MST 관련 문제!
