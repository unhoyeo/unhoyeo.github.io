---
title: "9019번 DSLR - BFS, 역추적"
pubDate: 2025-05-13T16:33:29+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/9019>

네 개의 명령어 D, S, L, R을 이용하는 간단한 계산기가 있다. 이 계산기에는 레지스터가 하나 있는데, 이 레지스터에는 0 이상 10,000 미만의 십진수를 저장할 수 있다. 각 명령어는 이 레지스터에 저장된 n을 다음과 같이 변환한다. n의 네 자릿수를 d1, d2, d3, d4라고 하자. (즉 n = ((d1 × 10 + d2) × 10 + d3) × 10 + d4라고 하자.)

- D: D는 n을 두 배로 바꾼다. 결과 값이 9999 보다 큰 경우에는 10000으로 나눈 나머지를 취한다. 그 결과 값(2n mod 10000)을 레지스터에 저장한다.
- S: S는 n에서 1을 뺀 결과 n-1을 레지스터에 저장한다. n이 0이라면 9999 가 대신 레지스터에 저장된다.
- L: L 은 n의 각 자릿수를 왼편으로 회전시켜 그 결과를 레지스터에 저장한다. 이 연산이 끝나면 레지스터에 저장된 네 자릿수는 왼편부터 d2, d3, d4, d1이 된다.
- R: R 은 n의 각 자릿수를 오른편으로 회전시켜 그 결과를 레지스터에 저장한다. 이 연산이 끝나면 레지스터에 저장된 네 자릿수는 왼편부터 d4, d1, d2, d3이 된다.

위에서 언급한 것처럼, L과 R 명령어는 십진 자릿수를 가정하고 연산을 수행한다. 예를 들어서 n = 1234 라면 여기에 L을 적용하면 2341 이 되고 R을 적용하면 4123 이 된다.

여러분이 작성할 프로그램은 주어진 서로 다른 두 정수 A와 B(A ≠ B)에 대하여 A를 B로 바꾸는 최소한의 명령어를 생성하는 프로그램이다. 예를 들어서 A = 1234, B = 3412 라면 다음과 같이 두 개의 명령어를 적용하면 A를 B로 변환할 수 있다.

1234 → L 2341 → L 3412
1234 → R 4123 → R 3412

따라서 여러분의 프로그램은 이 경우에 LL이나 RR을 출력해야 한다.

n의 자릿수로 0 이 포함된 경우에 주의해야 한다. 예를 들어서 1000에 L을 적용하면 0001 이 되므로 결과는 1 이 된다. 그러나 R을 적용하면 0100 이 되므로 결과는 100이 된다.

```java
3
1234 3412
1000 1
1 16
```

프로그램 입력은 T 개의 테스트 케이스로 구성된다. 테스트 케이스 개수 T 는 입력의 첫 줄에 주어진다. 각 테스트 케이스로는 두 개의 정수 A와 B(A ≠ B)가 공백으로 분리되어 차례로 주어지는데 A는 레지스터의 초기 값을 나타내고 B는 최종 값을 나타낸다. A 와 B는 모두 0 이상 10,000 미만이다.

```java
LL
L
DDDD
```

A에서 B로 변환하기 위해 필요한 최소한의 명령어 나열을 출력한다. 가능한 명령어 나열이 여러가지면, 아무거나 출력한다.

---

## 핵심 아이디어

- 이 문제는 **최소 연산 횟수로 A를 B로 만드는 명령어 시퀀스를 찾는 문제**로, **최단 경로 문제**와 같으므로 **BFS**로 해결할 수 있다.
- **가능한 상태**는 0부터 9999까지 **총 10000개** → 각 상태를 정점으로 보는 **그래프 탐색 문제**
- 한 상태에서 명령어 D, S, L, R를 통해 **다른 정점으로 이동** 가능
- A에서 시작해서 BFS로 B에 도달하는 최소 명령어 시퀀스를 찾으면 된다.

---

## 명령어 동작 정리

|  |  |
| --- | --- |
| D | (n \* 2) % 10000 |
| S | n == 0 ? 9999 : n - 1 |
| L | **(n % 1000) \* 10 + n / 1000** |
| R | **(n % 10) \* 1000 + n / 10** |

## 예시: 1234 → L → 2341

- 1234 % 1000 = 234
- 1234 / 1000 = 1
- 234 \* 10 + 1 = 2341

## 예시: 1234 → R → 4123

- 1234 % 10 = 4
- 1234 / 10 = 123
- 4 \* 1000 + 123 = 4123

---

## Java 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static String[] commands = {"D", "S", "L", "R"};

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int T = Integer.parseInt(br.readLine());

        while (T-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int A = Integer.parseInt(st.nextToken());
            int B = Integer.parseInt(st.nextToken());

            System.out.println(bfs(A, B));
        }
    }

    static String bfs(int start, int target) {
        Queue<Node> queue = new LinkedList<>();
        boolean[] visited = new boolean[10000];

        queue.add(new Node(start, ""));
        visited[start] = true;

        while (!queue.isEmpty()) {
            Node current = queue.poll();

            if (current.value == target) {
                return current.commands;
            }

            // D
            int D = (current.value * 2) % 10000;
            if (!visited[D]) {
                visited[D] = true;
                queue.add(new Node(D, current.commands + "D"));
            }

            // S
            int S = current.value == 0 ? 9999 : current.value - 1;
            if (!visited[S]) {
                visited[S] = true;
                queue.add(new Node(S, current.commands + "S"));
            }

            // L
            int L = (current.value % 1000) * 10 + current.value / 1000;
            if (!visited[L]) {
                visited[L] = true;
                queue.add(new Node(L, current.commands + "L"));
            }

            // R
            int R = (current.value % 10) * 1000 + current.value / 10;
            if (!visited[R]) {
                visited[R] = true;
                queue.add(new Node(R, current.commands + "R"));
            }
        }

        return "";
    }

    static class Node {
        int value;
        String commands;

        Node(int value, String commands) {
            this.value = value;
            this.commands = commands;
        }
    }
}
```

---

## 시간 복잡도

- 정점: 0~9999 → 10000개
- BFS는 정점당 최대 4개의 간선을 탐색 → O(V) = **O(10000)**

---

## 좀 더 개선한 코드

```java
import java.io.*;
import java.util.*;

public class Main {
    static final int MAX = 10000;
    static int[] from = new int[MAX];   // 이전 노드
    static char[] how = new char[MAX];  // 어떤 명령어로 왔는지

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int T = Integer.parseInt(br.readLine());

        StringBuilder sb = new StringBuilder();
        while (T-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int A = Integer.parseInt(st.nextToken());
            int B = Integer.parseInt(st.nextToken());

            sb.append(bfs(A, B)).append("\n");
        }

        System.out.print(sb);
    }

    static String bfs(int start, int target) {
        Queue<Integer> q = new LinkedList<>();
        q.add(start);

        boolean[] visited = new boolean[MAX];
        visited[start] = true;

        from[start] = -1;

        while (!q.isEmpty()) {
            int now = q.poll();

            if (now == target) break;

            // D
            int next = (now * 2) % 10000;
            if (!visited[next]) {
                visited[next] = true;
                q.add(next);
                from[next] = now;
                how[next] = 'D';
            }

            // S
            next = (now == 0) ? 9999 : now - 1;
            if (!visited[next]) {
                visited[next] = true;
                q.add(next);
                from[next] = now;
                how[next] = 'S';
            }

            // L
            next = (now % 1000) * 10 + now / 1000;
            if (!visited[next]) {
                visited[next] = true;
                q.add(next);
                from[next] = now;
                how[next] = 'L';
            }

            // R
            next = (now % 10) * 1000 + now / 10;
            if (!visited[next]) {
                visited[next] = true;
                q.add(next);
                from[next] = now;
                how[next] = 'R';
            }
        }

        // 명령어 경로 추적
        StringBuilder sb = new StringBuilder();
        int cur = target;
        while (from[cur] != -1) {
            sb.append(how[cur]);
            cur = from[cur];
        }

        return sb.reverse().toString();
    }
}
```
