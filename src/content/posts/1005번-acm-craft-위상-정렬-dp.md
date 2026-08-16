---
title: "1005번 ACM Craft - 위상 정렬 + DP"
pubDate: 2025-04-21T21:06:10+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/1005>

서기 2012년! 드디어 2년간 수많은 국민들을 기다리게 한 게임 ACM Craft (Association of Construction Manager Craft)가 발매되었다. 이 게임은 지금까지 나온 게임들과는 다르게 ACM크래프트는 다이나믹한 게임 진행을 위해 건물을 짓는 순서가 정해져 있지 않다. 즉, 첫 번째 게임과 두 번째 게임이 건물을 짓는 순서가 다를 수도 있다. 매 게임시작 시 건물을 짓는 순서가 주어진다. 또한 모든 건물은 각각 건설을 시작하여 완성이 될 때까지 Delay가 존재한다.

![1005번 ACM Craft - 위상 정렬 + DP](/images/tistory/112/img.jpg)

위의 예시를 보자. 이번 게임에서는 다음과 같이 건설 순서 규칙이 주어졌다. 1번 건물의 건설이 완료된다면 2번과 3번의 건설을 시작할 수 있다. (동시에 진행이 가능하다) 그리고 4번 건물을 짓기 위해서는 2번과 3번 건물이 모두 건설 완료되어야지만 4번 건물의 건설을 시작할 수 있다.

따라서 4번건물의 건설을 완료하기 위해서는 우선 처음 1번 건물을 건설하는데 10초가 소요된다. 그리고 2번 건물과 3번 건물을 동시에 건설하기 시작하면 2번은 1초 뒤에 건설이 완료되지만 아직 3번 건물이 완료되지 않았으므로 4번 건물을 건설할 수 없다. 3번 건물이 완성되고 나면 그때 4번 건물을 지을 수 있으므로 4번 건물이 완성되기까지는 총 120초가 소요된다.

최백준은 애인과의 데이트 비용을 마련하기 위해 서강대학교배 ACM크래프트 대회에 참가했다! 최백준은 화려한 컨트롤 실력을 가지고 있기 때문에 모든 경기에서 특정 건물만 짓는다면 무조건 게임에서 이길 수 있다. 그러나 매 게임마다 특정건물을 짓기 위한 순서가 달라지므로 최백준은 좌절하고 있었다. 백준이를 위해 특정건물을 가장 빨리 지을 때까지 걸리는 최소시간을 알아내는 프로그램을 작성해 주자.

```java
5
3 2
1 2 3
3 2
2 1
1
4 3
5 5 5 5
1 2
1 3
2 3
4
5 10
100000 99999 99997 99994 99990
4 5
3 5
3 4
2 5
2 4
2 3
1 5
1 4
1 3
1 2
4
4 3
1 1 1 1
1 2
3 2
1 4
4
7 8
0 0 0 0 0 0 0
1 2
1 3
2 4
3 4
4 5
4 6
5 7
6 7
7
```

첫째 줄에는 테스트케이스의 개수 T가 주어진다. 각 테스트 케이스는 다음과 같이 주어진다. 첫째 줄에 건물의 개수 N과 건물 간의 건설순서 규칙의 총 개수 K이 주어진다. (건물의 번호는 1번부터 N번까지 존재한다)

둘째 줄에는 각 건물당 건설에 걸리는 시간 D1, D2, ..., DN이 공백을 사이로 주어진다. 셋째 줄부터 K+2줄까지 건설순서 X Y가 주어진다. (이는 건물 X를 지은 다음에 건물 Y를 짓는 것이 가능하다는 의미이다)

마지막 줄에는 백준이가 승리하기 위해 건설해야 할 건물의 번호 W가 주어진다.

- 2 ≤ N ≤ 1000
- 1 ≤ K ≤ 100,000
- 1 ≤ X, Y, W ≤ N
- 0 ≤ Di ≤ 100,000, Di는 정수

```
6
5
399990
2
0
```

건물 W를 건설완료 하는데 드는 최소 시간을 출력한다. 편의상 건물을 짓는 명령을 내리는 데는 시간이 소요되지 않는다고 가정한다.

건설순서는 모든 건물이 건설 가능하도록 주어진다.

---

이 문제는 <strong>위상 정렬(Topological Sort) + DP (누적 시간 갱신)</strong>를 함께 사용하는 전형적인 <strong>건설 순서 시뮬레이션 문제</strong>다.

- **각 건물의 건설 시간**이 주어지고,
- **특정 건물을 짓기 위해 반드시 선행되어야 할 건물들**이 존재한다.
- 즉, **선후 관계가 있는 방향 비순환 그래프**다.

## 아이디어

1. **진입 차수 배열 (inDegree[]) 생성**
   - 각 건물이 **선행 건물을 몇 개 갖는지 저장**한다.
2. **그래프 생성**
   - graph[a] = [b, c] 라면, **a를 먼저 지으면 b, c를 지을 수 있다**는 의미다.
3. **건설 시간 누적 배열 (dp[]) 초기화**
   - dp[i] 는 **i번째 건물을 짓기 위해 필요한 최소 시간**이다.
   - 초기값을 **dp[i] = buildTime[i]** (자기 자신만 지었을 때)로 설정한다.
4. **위상 정렬 수행 (큐 사용)**
   - 진입 차수가 0인 노드부터 시작한다.
   - 큐에서 꺼낸 건물 cur에 연결된 next에 대해,
     - **dp[next] = max(dp[next], dp[cur] + buildTime[next])**
     - 즉, 더 오래 걸리는 경로를 선택하여 최소 시간을 누적한다.
   - 이후 진입 차수를 하나 줄이고, 0이 되면 큐에 넣는다.
5. **W 건물의 최종 건설 시간 출력**

## 시간 복잡도

- 노드 수 N ≤ 1000
- 간선 수 K ≤ 100,000
- 위상 정렬의 시간 복잡도: **O(N + K)**
- 각 노드와 간선을 한 번씩만 처리하면 되므로 효율적이다.

## 자바 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static int N, K, W;
    static int[] buildTime, dp, inDegree;
    static List<List<Integer>> graph;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();

        int T = Integer.parseInt(br.readLine());
        while (T-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            N = Integer.parseInt(st.nextToken()); // 건물 수
            K = Integer.parseInt(st.nextToken()); // 건설 순서 규칙 수

            buildTime = new int[N + 1]; // 건물 건설 시간
            dp = new int[N + 1]; // 해당 건물을 짓기 위해 필요한 최소 시간
            inDegree = new int[N + 1]; // 해당 건물을 짓기 전에 먼저 지어야 할 건물 수

            graph = new ArrayList<>();
            for (int i = 0; i < N + 1; i++) {
                graph.add(new ArrayList<>());
            }

            st = new StringTokenizer(br.readLine());
            for (int i = 1; i <= N; i++) {
                buildTime[i] = Integer.parseInt(st.nextToken());
                dp[i] = buildTime[i]; // 기본 건설 시간으로 초기화
            }

            for (int i = 0; i < K; i++) {
                st = new StringTokenizer(br.readLine());
                int from = Integer.parseInt(st.nextToken());
                int to = Integer.parseInt(st.nextToken());

                graph.get(from).add(to);
                inDegree[to]++;
            }

            W = Integer.parseInt(br.readLine()); // 건설해야 할 건물

            topologicalSort();
            sb.append(dp[W]).append('\n');
        }

        System.out.print(sb);
    }

    static void topologicalSort() {
        Queue<Integer> q = new LinkedList<>();

        for (int i = 1; i <= N; i++) {
            if (inDegree[i] == 0) q.add(i);
        }

        while (!q.isEmpty()) {
            int cur = q.poll();

            for (int next : graph.get(cur)) {
                dp[next] = Math.max(dp[next], dp[cur] + buildTime[next]);
                inDegree[next]--;
                if (inDegree[next] == 0) q.add(next);
            }
        }
    }
}
```
