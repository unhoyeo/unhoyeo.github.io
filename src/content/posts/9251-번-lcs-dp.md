---
title: "9251번 LCS - DP"
description: "LCS(Longest Common Subsequence, 최장 공통 부분 수열)문제는 두 수열이 주어졌을 때, 모두의 부분 수열이 되는 수열 중 가장 긴 것을 찾는 문제이다."
pubDate: 2025-03-21T17:01:39+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/9251>

LCS(Longest Common Subsequence, 최장 공통 부분 수열)문제는 두 수열이 주어졌을 때, 모두의 부분 수열이 되는 수열 중 가장 긴 것을 찾는 문제이다.

예를 들어, ACAYKP와 CAPCAK의 LCS는 ACAK가 된다.

```java
ACAYKP
CAPCAK
```

첫째 줄과 둘째 줄에 두 문자열이 주어진다. 문자열은 알파벳 대문자로만 이루어져 있으며, 최대 1000글자로 이루어져 있다.

```java
4
```

첫째 줄에 입력으로 주어진 두 문자열의 LCS의 길이를 출력한다.

---

## 아이디어

- <strong>LCS(최장 공통 부분 수열)</strong>을 구하는 문제는 <strong>DP</strong>를 사용하여 해결할 수 있다.
- **2차원 DP 배열**을 사용하여, **문자열 A의 i번째 문자**와 **문자열 B의 j번째 문자**까지의 **LCS 길이**를 저장한다.
- **두 문자가 같다면,**
  - **이 문자를 포함하기 전의 LCS 길이에 +1**을 하면 된다.
  - **dp[i][j] = dp[i - 1][j - 1] + 1**
- **두 문자가 다르다면,**
  - A에서 문자 하나 빼고 B와 비교 (dp[i - 1][j])
  - B에서 문자 하나 빼고 A와 비교 (dp[i][j - 1])
  - 이 두 경우 중 **더 긴 값**을 선택해야 한다.
  - **dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])**

## 시간복잡도

- <strong>dp[i][j]</strong>를 모두 채우는 방식이므로, <strong>O(N × M)</strong>의 시간복잡도를 가진다.
- 최대 입력이 1000 x 1000이므로, 최대 연산량은 **10^6** 정도로 충분히 가능하다.

```java
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String A = br.readLine();
        String B = br.readLine();

        int N = A.length();
        int M = B.length();

        int[][] dp = new int[N + 1][M + 1]; // DP 테이블

        for (int i = 1; i <= N; i++) {
            for (int j = 1; j <= M; j++) {
                if (A.charAt(i - 1) == B.charAt(j - 1)) { // 같은 문자일 경우
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else { // 다른 문자일 경우
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        System.out.println(dp[N][M]); // 최장 공통 부분 수열의 길이 출력
    }
}
```
