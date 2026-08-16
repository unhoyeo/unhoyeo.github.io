---
title: "9663번 N-Queen - 백트래킹"
description: "N-Queen 문제는 크기가 N × N인 체스판 위에 퀸 N개를 서로 공격할 수 없게 놓는 문제이다. N이 주어졌을 때, 퀸을 놓는 방법의 수를 구하는 프로그램을 작성하시오. 첫째 줄에 N이 주어진다."
pubDate: 2025-03-09T23:29:24+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/9663>

N-Queen 문제는 크기가 N × N인 체스판 위에 퀸 N개를 서로 공격할 수 없게 놓는 문제이다.

N이 주어졌을 때, 퀸을 놓는 방법의 수를 구하는 프로그램을 작성하시오.

```
8
```

첫째 줄에 N이 주어진다. (1 ≤ N < 15)

```
92
```

첫째 줄에 퀸 N개를 서로 공격할 수 없게 놓는 경우의 수를 출력한다.

## 1. 아이디어

- **모든 경우의 수를 구하는 문제 → 백트래킹!**
- 체스에서 퀸은 같은 행, 같은 열, 대각선으로 움직일 수 있다.
- row(행) 단위로 퀸을 배치하면서, **유효하지 않은 경우(같은 열, 대각선) 즉시 가지치기**
- N번째 행까지 모든 퀸을 놓으면 **유효한 경우의 수(카운트)++**

## 2. 시간복잡도

- **완전 탐색의 경우**: N! (모든 경우를 탐색하면 최악의 경우 O(N!))
- N! = 14! = 87,178,291,200 (8백억)
- 하지만 **백트래킹으로 불필요한 경우를 가지치기**하면 실제 수행 시간은 줄어듦
- 실제 시간 복잡도는 O(N!)보다 작지만, 최악의 경우 O(N!)에 가까움

## 3. 변수

- 배열 → int[]
- arr[i] = j : i번째 행에 j번째 열에 퀸이 놓였음을 의미

```java
import java.io.*;

class Main {

    static int N, cnt = 0;
    static int[] arr;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        N = Integer.parseInt(br.readLine());
        arr = new int[N];

        dfs(0);
        System.out.println(cnt);
    }

    static void dfs(int r) {
        if (r == N) { // 모든 퀸 배치 완료 시 카운트 증가
            cnt++;
            return;
        }

        for (int i = 0; i < N; i++) {
            if (isValid(r, i)) { // 유효한 위치인지 확인
                arr[r] = i; // 퀸 배치
                dfs(r + 1); // 다음 row로 이동
            }
        }
    }

    static boolean isValid(int r, int c) {
        for (int i = 0; i < r; i++) { // 이전 row들만 확인
            // 같은 column에 위치
            if (c == arr[i]) return false;

            // 같은 대각선에 위치
            if (Math.abs(c - arr[i]) == r - i) return false;
        }
        return true;
    }
}
```

## 팁

- 2차원 배열로 해도 되지만, 1차원 배열로 해도 된다.
- 1번째 row의 1번째 column부터 N번째 column까지 돌면서 퀸을 놓을 수 있다면 재귀 호출을 하면서 row를 1 늘린다.
- **같은 column**에 있다 → **column == arr[i]**
- **같은 대각선**에 있다 → **절댓값(column - arr[i]) == (row - i)**
- **i < row**에 대해서(**이전 row들**에 대해서)
