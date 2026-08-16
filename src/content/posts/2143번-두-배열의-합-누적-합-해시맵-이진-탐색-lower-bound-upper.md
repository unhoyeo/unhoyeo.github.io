---
title: "2143번 두 배열의 합 - 누적 합, 해시맵, 이진 탐색 (Lower Bound / Upper Bound)"
description: "한 배열 A[1], A[2], …, A[n]에 대해서, 부 배열은 A[i], A[i+1], …, A[j-1], A[j] (단, 1 ≤ i ≤ j ≤ n)을 말한다. 이러한 부 배열의 합은 A[i]+…+A[j]를 의미한다."
pubDate: 2025-06-01T23:28:29+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/2143>

한 배열 A[1], A[2], …, A[n]에 대해서, 부 배열은 A[i], A[i+1], …, A[j-1], A[j] (단, 1 ≤ i ≤ j ≤ n)을 말한다. 이러한 부 배열의 합은 A[i]+…+A[j]를 의미한다. 각 원소가 정수인 두 배열 A[1], …, A[n]과 B[1], …, B[m]이 주어졌을 때, A의 부 배열의 합에 B의 부 배열의 합을 더해서 T가 되는 모든 부 배열 쌍의 개수를 구하는 프로그램을 작성하시오.

예를 들어 A = {1, 3, 1, 2}, B = {1, 3, 2}, T=5인 경우, 부 배열 쌍의 개수는 다음의 7가지 경우가 있다.

- A[1] + B[1] + B[2]
- A[1] + A[2] + B[1]
- A[2] + B[3]
- A[2] + A[3] + B[1]
- A[3] + B[1] + B[2]
- A[3] + A[4] + B[3]
- A[4] + B[2]

```java
5
4
1 3 1 2
3
1 3 2
```

첫째 줄에 T(-1,000,000,000 ≤ T ≤ 1,000,000,000)가 주어진다. 다음 줄에는 n(1 ≤ n ≤ 1,000)이 주어지고, 그 다음 줄에 n개의 정수로 A[1], …, A[n]이 주어진다. 다음 줄에는 m(1 ≤ m ≤ 1,000)이 주어지고, 그 다음 줄에 m개의 정수로 B[1], …, B[m]이 주어진다. 각각의 배열 원소는 절댓값이 1,000,000을 넘지 않는 정수이다.

```java
7
```

첫째 줄에 답을 출력한다. 가능한 경우가 한 가지도 없을 경우에는 0을 출력한다.

---

## 아이디어

- 부 배열 = **"연속된 원소의 부분 배열"**
  - [1, 2, 3]의 부 배열은 [1], [1,2], [1,2,3], [2], [2,3], [3]
- 먼저, **A의 모든 부 배열 합**과 **B의 모든 부 배열 합**을 구한다.
- 두 합이 T가 되려면 **"A의 부 배열 합 = T - B의 부 배열 합"** 이 되어야 한다.
- 따라서, **(T - B의 부 배열 합)이 A의 부 배열 합 리스트에 몇개 있는지** 전부 세면 된다.

---

## 시간 복잡도

- A의 부 배열 합 구하기: **O(n²)**
- B의 부 배열 합 구하기: **O(m²)**
- Map 조회: **O(1)**
- 전체 시간 복잡도: **O(n² + m²)** = 10^3 + 10^3 → 가능!

---

## Java 코드 (해시맵 이용)

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        long T = Long.parseLong(br.readLine());

        int n = Integer.parseInt(br.readLine());
        int[] A = new int[n];

        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) {
            A[i] = Integer.parseInt(st.nextToken());
        }

        int m = Integer.parseInt(br.readLine());
        int[] B = new int[m];

        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < m; i++) {
            B[i] = Integer.parseInt(st.nextToken());
        }

        // A의 모든 부배열 합을 구하고 Map에 저장 (key: 합, value: 해당 합이 등장한 횟수)
        Map<Long, Integer> sumCountA = new HashMap<>();
        for (int i = 0; i < n; i++) {
            long sum = 0;
            for (int j = i; j < n; j++) {
                sum += A[j];
                sumCountA.put(sum, sumCountA.getOrDefault(sum, 0) + 1);
            }
        }

        // B의 모든 부배열 합에 대해, T - B합이 A에서 몇 번 나오는지 카운트
        long result = 0;
        for (int i = 0; i < m; i++) {
            long sum = 0;
            for (int j = i; j < m; j++) {
                sum += B[j];
                result += sumCountA.getOrDefault(T - sum, 0);
            }
        }

        System.out.println(result);
    }
}
```

---

## 예제 시각화

```properties
T = 5
A = [1, 3, 1, 2]
B = [1, 3, 2]
```

A의 모든 부 배열 합 구하기:

|  |  |  |
| --- | --- | --- |
| **시작-끝 인덱스** | **A 부 배열** | **합** |
| 0~0 | [1] | 1 |
| 0~1 | [1,3] | 4 |
| 0~2 | [1,3,1] | 5 |
| 0~3 | [1,3,1,2] | 7 |
| 1~1 | [3] | 3 |
| 1~2 | [3,1] | 4 |
| 1~3 | [3,1,2] | 6 |
| 2~2 | [1] | 1 |
| 2~3 | [1,2] | 3 |
| 3~3 | [2] | 2 |

A의 모든 부 배열 합 리스트 = [1, 4, 5, 7, 3, 4, 6, 1, 3, 2]

→ 이를 **Map<합, 등장 횟수>** 형태로 저장

```java
1 → 2번
2 → 1번
3 → 2번
4 → 2번
5 → 1번
6 → 1번
7 → 1번
```

B의 모든 부 배열의 합을 구하고, 그에 대해 <strong>(T - B의 부 배열 합)</strong>이 A에서 몇 번 나오는지 세기

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **시작-끝 인덱스** | **B 부 배열** | **합** | **T(5) - B합** | **A에 있는 개수** |
| 0~0 | [1] | 1 | 4 | 2 |
| 0~1 | [1,3] | 4 | 1 | 2 |
| 0~2 | [1,3,2] | 6 | -1 | 0 |
| 1~1 | [3] | 3 | 2 | 1 |
| 1~2 | [3,2] | 5 | 0 | 0 |
| 2~2 | [2] | 2 | 3 | 2 |

→ 합산: 2 + 2 + 1 + 2 = **7**

> **다른 풀이**(이진 탐색 Lower Bound / Upper Bound 이용)

## 아이디어

- A의 모든 부 배열 합을 구하여 sumA 리스트에 저장
- B의 모든 부 배열 합을 구하여 sumB 리스트에 저장
- **sumB만 오름차순 정렬**
- sumA를 순회하며 각 값 a에 대해 **(T - a)가 sumB에 몇 개 있는지 이진 탐색으로 개수 계산**
  - 예: [1, 2, 4, 4, 4, 5, 7]
    - lowerBound(4) = 2 (첫 번째 4의 위치)
    - upperBound(4) = 5 (4보다 큰 값의 첫 위치)
    - 4의 개수 = upperBound(4) - lowerBound(4) = 5 - 2 = 3개

---

## lowerBound, upperBound 핵심 코드

```java
int lowerBound(int[] A, int target) {
    int left = 0;
    int right = A.length;

    while (left < right) {
        int mid = (left + right) / 2;

        if (A[mid] < target) { // upperBound는 A[mid] <= target
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return left;
}
```

> upperBound는 lowerBound에서 if 조건만 **< 에서 <=** 로 바꿔주면 된다.

---

## 시간 복잡도

- 부배열 합 구하기: **O(n²), O(m²)**
- sumB 정렬: **O(m² log m²) = O(m² log m)**
- sumA 순회 + 이진 탐색: **O(n² log m²) = O(n² log m)**
- 전체 시간 복잡도: **O(n² log m + m² log m)**
- n, m ≤ 1,000이므로 가능

---

## Java 코드 (이진 탐색 이용)

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        long T = Long.parseLong(br.readLine());

        int n = Integer.parseInt(br.readLine());
        int[] A = new int[n];
        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) {
            A[i] = Integer.parseInt(st.nextToken());
        }

        int m = Integer.parseInt(br.readLine());
        int[] B = new int[m];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < m; i++) {
            B[i] = Integer.parseInt(st.nextToken());
        }

        List<Long> sumA = getSubarraySums(A);
        List<Long> sumB = getSubarraySums(B);

        Collections.sort(sumB);

        long result = 0;

        // 이진 탐색으로 정답 계산
        for (long a : sumA) {
            long target = T - a;

            int lower = lowerBound(sumB, target);
            int upper = upperBound(sumB, target);

            result += upper - lower; // target 값의 등장 횟수
        }

        System.out.println(result);
    }

    static List<Long> getSubarraySums(int[] arr) {
        List<Long> subSums = new ArrayList<>();

        for (int i = 0; i < arr.length; i++) {
            long sum = 0;

            for (int j = i; j < arr.length; j++) {
                sum += arr[j];
                subSums.add(sum);
            }
        }

        return subSums;
    }

    // 처음으로 target 이상이 나오는 인덱스 반환
    static int lowerBound(List<Long> list, long target) {
        int left = 0;
        int right = list.size();

        while (left < right) {
            int mid = (left + right) / 2;

            if (list.get(mid) < target) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        return left;
    }

    // 처음으로 target 초과가 나오는 인덱스 반환
    static int upperBound(List<Long> list, long target) {
        int left = 0;
        int right = list.size();

        while (left < right) {
            int mid = (left + right) / 2;

            if (list.get(mid) <= target) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        return left;
    }
}
```

---

## Collections.binarySearch()를 사용하지 않은 이유?

> **중복된 값의 개수를 직접 계산할 수 없기 때문!**

- Collections.binarySearch(list, key)는 **key가 있는 임의의 인덱스 하나만 반환**한다.
  - 즉, 중복된 값이 여러 개 있어도 그 개수를 알 수 없다.
  - 해당 값의 개수를 세려면 **양 옆으로 2번 탐색**해야 하므로 비효율적이다.
- 따라서 lowerBound, upperBound를 직접 구현하는 편이 낫다.
  - **lowerBound**: 처음으로 **target 이상**이 나오는 위치
  - **upperBound**: 처음으로 **target 초과**가 나오는 위치
- 리스트에 target 값이 몇 개 존재하는지는 **리스트를 정렬한 후, upperBound - lowerBound**로 계산하면 알 수 있다.

---

## 예제 시각화

```properties
A = [1, 2, 4, 4, 4, 5, 7]
```

## lowerBound(A, 4)

- left = 0, right = 7, mid = 3
- A[3] < 4? → false → right = mid (3)
- left = 0, right = 3, mid = 1
- A[1] < 4? → true → left = mid + 1 (2)
- left = 2, right = 3, mid = 2
- A[2] < 4? → false → right = mid (2)
- left = 2, right = 2
- while (left < right) 탈출 → **return left (2)**

## upperBound(A, 4)

- left = 0, right = 7, mid = 3
- A[3] ≤ 4? → true → left = mid + 1 (4)
- left = 4, right = 7, mid = 5
- A[5] ≤ 4? → false → right = mid (5)
- left = 4, right = 5, mid = 4
- A[4] ≤ 4? → true → left = mid + 1 (5)
- left = 5, right = 5
- while (left < right) 탈출 → **return left (5)**

## 4의 개수 = upperBound(A, 4) - lowerBound(A, 4) = 5 - 2 = 3개

---

## 결론

- Collections.binarySearch()는 **단일 존재 여부 확인**에는 적합하지만, **중복 원소의 개수**를 정확히 세는 용도에는 적합하지 않다.
- 그래서 이 문제에서는 **lowerBound, upperBound**를 직접 구현하여, **upper - lower**로 개수를 구해야 한다.
- lowerBound, upperBound는 **if 조건만 다르고 나머지는 같다.**
  - lowerBound: **A[mid] < target**
  - upperBound: **A[mid] <= target**
