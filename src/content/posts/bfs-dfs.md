---
title: "BFS, DFS"
description: "BFS(Breadth First Search, 너비 우선 탐색) DFS(Depth First Search, 깊이 우선 탐색) BFS, DFS는 그래프 탐색의 한 방법이다."
pubDate: 2025-03-05T01:06:10+09:00
category: "알고리즘/개념"
tags: []
draft: true
---

## BFS와 DFS

- BFS(Breadth First Search, 너비 우선 탐색)
- DFS(Depth First Search, 깊이 우선 탐색)
- BFS, DFS는 **그래프 탐색**의 한 방법이다.
- 그래프 탐색은 어떤 것들이 연속해서 이어져 있을 때 모두 확인하는 방법을 말한다.
- 그래프는 **Vertex**(어떤 것)와 **Edge**(이어져 있는 것)로 이루어져 있다.
- BFS는 자기 자식들을 우선으로 탐색한다.
- 그 뒤 자식의 자식들을 탐색하게 된다.
- DFS는 자기 자식의 자식을 우선으로 탐색한다.
- 자식이 더 이상 없다면 부모로 올라와서 다음 자식의 자식을 탐색하게 된다.

---

## BFS - 아이디어

- 한 Vertex에 연결된 Vertex를 찾는다.
- 찾은 Vertex를 큐에 저장한다.
- 큐의 가장 첫 Vertex를 뽑아서 반복한다.

## BFS - 시간복잡도

- **O(V+E)**

## BFS - 자료구조

- 검색할 그래프 → 2차원 배열
- 방문여부 확인(재방문 금지) → 2차원 배열
- BFS를 실행할 큐

---

## 연습문제 - 백준 1926번

```java
6 5
1 1 0 1 1
0 1 1 0 0
0 0 0 0 0
1 0 1 1 1
0 0 1 1 1
0 0 1 1 1
```

첫째 줄에 도화지의 세로 크기 n(1 ≤ n ≤ 500)과 가로 크기 m(1 ≤ m ≤ 500)이 차례로 주어진다. 두 번째 줄부터 n+1 줄 까지 그림의 정보가 주어진다. (단 그림의 정보는 0과 1이 공백을 두고 주어지며, 0은 색칠이 안된 부분, 1은 색칠이 된 부분을 의미한다)

```
4
9
```

첫째 줄에는 그림의 개수, 둘째 줄에는 그 중 가장 넓은 그림의 넓이를 출력하여라. 단, 그림이 하나도 없는 경우에는 가장 넓은 그림의 넓이는 0이다.

## 1. 아이디어

- 1이 나오면 주변에 있는 1을 찾아나가면 된다. → BFS
- 이중 for문으로 map을 돌면서 1이 나오면 BFS를 하면 된다.
- 중요한 점: 이미 BFS로 체크한 1은 BFS를 하면 안 된다.
- 따라서 이중 for문에서의 조건: 1이어야 하고, 방문하지 않은 곳이어야 한다.
- 결론: 방문하지 않은 1을 발견하면 그림의 개수를 늘리고, BFS를 돌리고, 최댓값을 갱신하고, 방문처리를 해야 한다.

## 2. 시간복잡도

- V = map의 최대 크기 = 500 \* 500
- E = 약 2 \* 500 \* 500
- **O(V+E)** = 약 3 \* 500 \* 500 = 3 \* 250000 < 2억

## 3. 자료구조

- 그래프 지도 → int[][]
- 방문 여부 → boolean[][]
- BFS → Queue

```java
import java.io.*;
import java.util.*;

class Main {

    static int N, M, cnt = 0, max = 0;
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

        for (int i = 0; i < N; i++) {
            for (int j = 0; j < M; j++) {
                if (map[i][j] == 1 && !visited[i][j]) {
                    cnt++;
                    visited[i][j] = true;
                    max = Math.max(max, bfs(i, j));
                }
            }
        }
        System.out.println(cnt + "\n" + max);
    }

    static int bfs(int r, int c) {
        int size = 1;
        Queue<int[]> q = new LinkedList<>();
        q.add(new int[]{r, c}); // 처음 위치

        while (!q.isEmpty()) {
            int[] cur = q.poll(); // 현재 위치
            int cr = cur[0];
            int cc = cur[1];

            for (int i = 0; i < 4; i++) {
                int nr = cr + dr[i]; // 다음 위치
                int nc = cc + dc[i];
                if (nr < 0 || nc < 0 || nr >= N || nc >= M) continue;
                if (map[nr][nc] == 1 && !visited[nr][nc]) {
                    size++;
                    q.add(new int[]{nr, nc});
                    visited[nr][nc] = true;
                }
            }
        }
        return size;
    }

}
```

---

## DFS

- 스택으로 풀 수도 있지만, 재귀로 푼다.
- 사실 그래프 탐색은 BFS만으로도 충분히 풀 수 있다.
- 그런데 DFS를 쓰겠다는 것은 **재귀 함수**를 쓰기 위해서다.
- 재귀는 **백트래킹**에서 아주 중요한 개념이다.
- 재귀 함수는 자기 자신을 다시 호출하는 함수
- 주의점: **종료 조건**을 반드시 명시해야 하고, depth가 너무 깊어지면 **스택 오버플로우**가 발생할 수 있다.

## DFS - 아이디어

- 한 Vertex에 연결된 Vertex를 찾는다.
- 해당 Vertex에 연결된 Vertex를 찾는다.
- 또 해당 Vertex에 연결된 Vertex를 찾는다.
- 이 과정을 더 이상 연결된 Vertex가 없을 때까지 반복하고, 없다면 다음 연결된 Vertex로 넘어간다.

## DFS - 시간복잡도

- **O(V+E)**

## DFS - 자료구조

- 검색할 그래프 → 2차원 배열
- 방문여부 확인(재방문 금지) → 2차원 배열
- BFS를 실행할 큐

---

## 연습문제 - 백준 2667번

```java
7
0110100
0110101
1110101
0000111
0100000
0111110
0111000
```

첫 번째 줄에는 지도의 크기 N(정사각형이므로 가로와 세로의 크기는 같으며 5≤N≤25)이 입력되고, 그 다음 N줄에는 각각 N개의 자료(0혹은 1)가 입력된다.

```
3
7
8
9
```

첫 번째 줄에는 총 단지(연결된 1의 무리)수를, 그리고 각 단지내 집(1)의 수를 오름차순으로 정렬하여 한 줄에 하나씩 출력하시오.

## 1. 아이디어

- 이중 for문으로 map을 돌면서 값이 1이고, 방문하지 않은 곳에서 DFS
- DFS 통해서 얻은 값을 저장 후 정렬

## 2. 시간복잡도

- V = map의 최대 크기 = 25 ^ 2
- E = 약 2 \* 25 ^ 2
- **O(V+E)** = 약 3 \* 25 ^ 2 < 2억)

## 3. 자료구조

- 그래프 → int[][]
- 방문 여부 → boolean[][]
- 결괏값 → ArrayList&lt;Integer> or PriorityQueue&lt;Integer>

```java
import java.io.*;
import java.util.*;

class Main {

    static int N;
    static int[][] map;
    static boolean[][] visited;

    static int[] dr = {0, 1, 0, -1};
    static int[] dc = {1, 0, -1, 0};

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        N = Integer.parseInt(br.readLine());
        map = new int[N][N];
        visited = new boolean[N][N];

        List<Integer> counts = new ArrayList<>();

        for (int i = 0; i < N; i++) {
            String str = br.readLine();
            for (int j = 0; j < N; j++) {
                map[i][j] = str.charAt(j) == '0' ? 0 : 1;
            }
        }

        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                if (map[i][j] == 1 && !visited[i][j]) {
                    visited[i][j] = true;
                    counts.add(dfs(i, j));
                }
            }
        }

        Collections.sort(counts);

        StringBuilder sb = new StringBuilder();
        sb.append(counts.size()).append("\n");
        counts.forEach(c -> sb.append(c).append("\n"));

        System.out.println(sb);
    }

    static int dfs(int r, int c) {
        int cnt = 1;

        for (int i = 0; i < 4; i++) {
            int nr = r + dr[i];
            int nc = c + dc[i];

            if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
            if (map[nr][nc] == 1 && !visited[nr][nc]) {
                visited[nr][nc] = true;
                cnt += dfs(nr, nc);
            }
        }
        return cnt;
    }

}
```

참고로 3가지의 꿀팁이 있다.

- 이미 방문한 곳을 1에서 0으로 바꿈으로써 visited를 생략할 수 있다.
- map은 0, 1로만 이루어져 있다. → int[][]를 boolean[][]으로 바꿀 수 있다.
- **PriorityQueue**를 이용하면 ArrayList와 정렬이 필요 없다. → PriorityQueue는 들어온 순서와 상관없이 낮은 값부터 나온다.

```java
import java.io.*;
import java.util.*;

class Main {

    static int N;
    static boolean[][] map;

    static int[] dr = {0, 1, 0, -1};
    static int[] dc = {1, 0, -1, 0};

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        N = Integer.parseInt(br.readLine());
        map = new boolean[N][N];

        for (int i = 0; i < N; i++) {
            String s = br.readLine();
            for (int j = 0; j < N; j++) {
                map[i][j] = s.charAt(j) == '1';
            }
        }

        int cnt = 0;
        PriorityQueue<Integer> pq = new PriorityQueue<>(); // 낮은 값부터 나옴
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                if (map[i][j]) {
                    cnt++;
                    pq.add(dfs(i, j));
                }
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append(cnt).append('\n');
        while (!pq.isEmpty()) {
            sb.append(pq.poll()).append('\n');
        }
        System.out.print(sb);
    }

    static int dfs(int r, int c) {
        map[r][c] = false;
        int size = 1;

        for (int i = 0; i < 4; i++) {
            int nr = r + dr[i];
            int nc = c + dc[i];

            if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
            if (map[nr][nc]) {
                size += dfs(nr, nc);
            }
        }
        return size;
    }

}
```
