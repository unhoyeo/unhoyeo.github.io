---
title: "11054번 가장 긴 바이토닉 부분 수열 - DP (LIS + LDS)"
description: "수열 S가 어떤 수 Sk를 기준으로 S1 < S2 < ... Sk-1 < Sk Sk+1 ... SN-1 SN을 만족한다면, 그 수열을 바이토닉 수열이라고 한다."
pubDate: 2025-05-01T19:51:04+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/11054>

수열 S가 어떤 수 Sk를 기준으로 S1 < S2 < ... Sk-1 < Sk > Sk+1 > ... SN-1 > SN을 만족한다면, 그 수열을 바이토닉 수열이라고 한다.

예를 들어, {10, 20, **30**, 25, 20}과 {10, 20, 30, **40**}, {**50**, 40, 25, 10} 은 바이토닉 수열이지만, {1, 2, 3, 2, 1, 2, 3, 2, 1}과 {10, 20, 30, 40, 20, 30} 은 바이토닉 수열이 아니다.

수열 A가 주어졌을 때, 그 수열의 부분 수열 중 바이토닉 수열이면서 가장 긴 수열의 길이를 구하는 프로그램을 작성하시오.

```
10
1 5 2 1 4 3 4 5 2 1
```

첫째 줄에 수열 A의 크기 N이 주어지고, 둘째 줄에는 수열 A를 이루고 있는 Ai가 주어진다. (1 ≤ N ≤ 1,000, 1 ≤ Ai ≤ 1,000)

```
7
```

첫째 줄에 수열 A의 부분 수열 중에서 가장 긴 바이토닉 수열의 길이를 출력한다.

---

**아이디어**

- 바이토닉 수열은 <strong>"증가했다가 감소하는 수열"</strong>이다.
- 이를 위해 <strong>LIS(Longest Increasing Subsequence)</strong>와 <strong>LDS(Longest Decreasing Subsequence)</strong> 두 개를 구한다.
- i번째 원소를 기준으로
  - 왼쪽에서부터 i까지의 LIS (증가)
  - 오른쪽에서부터 i까지의 LDS (감소)
- 바이토닉 수열의 길이는 **LIS[i] + LDS[i] - 1** (중복되는 i번째 원소 한 개 빼기)
- 모든 i에 대해 계산한 후, 그 중 최대값을 반환하면 된다.

---

⏱️ **시간 복잡도**

- LIS와 LDS 각각 **O(N^2)**
- 따라서, 전체 시간복잡도는 **O(N^2)**
- N ≤ 1000이므로 가능

---

**자바 코드**

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());

        int[] A = new int[N];
        int[] LIS = new int[N];
        int[] LDS = new int[N];

        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 0; i < N; i++) {
            A[i] = Integer.parseInt(st.nextToken());
        }

        // LIS: 왼쪽에서 오른쪽으로 증가
        for (int i = 0; i < N; i++) {
            LIS[i] = 1;
            for (int j = 0; j < i; j++) {
                if (A[i] > A[j]) {
                    LIS[i] = Math.max(LIS[i], LIS[j] + 1);
                }
            }
        }

        // LDS: 왼쪽에서 오른쪽으로 감소 = 오른쪽에서 왼쪽으로 증가
        for (int i = N - 1; i >= 0; i--) {
            LDS[i] = 1;
            for (int j = N - 1; j > i; j--) {
                if (A[i] > A[j]) {
                    LDS[i] = Math.max(LDS[i], LDS[j] + 1);
                }
            }
        }

        // 가장 긴 바이토닉 수열 길이 계산
        int maxLen = 0;
        for (int i = 0; i < N; i++) {
            maxLen = Math.max(maxLen, LIS[i] + LDS[i] - 1); // i 부분 중복 제거
        }

        System.out.println(maxLen);
    }
}
```

---

✅ **정리**

- 문제는 **LIS + LDS 조합**으로 해결
- **중심 인덱스**를 기준으로 **양쪽 증가/감소 수열** 길이를 구하고 합산
- 핵심 포인트: **중복된 중심 원소는 한 번만 포함해야 하므로 -1** 처리 필요
