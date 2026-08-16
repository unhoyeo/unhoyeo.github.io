---
title: "주사위 고르기 – 조합, 완전 탐색, 이진 탐색 (lower bound)"
description: "프로그래머스 이 문제는 주어진 조건에 따라 A가 이길 확률을 최대로 만드는 주사위 조합을 찾는 문제다. 주사위의 총개수(n)가 최대 10개로 매우 작기 때문에, 가능한 모든 주사위 조합을 탐색하는 완전 탐색 방식으로 접근할 수…"
pubDate: 2025-10-11T01:37:34+09:00
category: "알고리즘/카카오"
tags: []
draft: true
---

<https://school.programmers.co.kr/learn/courses/30/lessons/258709>

[프로그래머스](https://school.programmers.co.kr/learn/courses/30/lessons/258709)

---

## ✅ 문제 해결 전략

이 문제는 주어진 조건에 따라 **A가 이길 확률을 최대로 만드는 주사위 조합**을 찾는 문제다.

주사위의 총개수(n)가 **최대 10개**로 매우 작기 때문에, 가능한 모든 주사위 조합을 탐색하는 **완전 탐색** 방식으로 접근할 수 있다.

1. **A의 주사위 조합 생성**
   - n개의 주사위 중 **A가 가져갈 n / 2개의 주사위**를 선택하는 조합을 구한다.
   - 재귀 함수를 이용한 **DFS** 방식으로 모든 조합을 효율적으로 생성할 수 있다.
2. **각 조합에 대한 모든 점수 합계 계산**
   - A의 주사위 조합이 하나 결정되면, **B가 가져갈 나머지 주사위 조합도 자동으로 결정**된다.
   - A와 B 각각에 대해, 선택된 주사위들을 모두 굴렸을 때 나올 수 있는 **모든 점수 합계의 경우의 수**를 구한다.
   - 이 또한 **재귀(DFS)**를 통해 계산할 수 있다.
3. **승리 횟수 계산 및 최적 조합 갱신**
   - A의 모든 점수 합계와 B의 모든 점수 합계를 비교하여 **A가 이기는 총 경우의 수**를 계산한다.
   - 단순히 **이중 반복문**으로 비교하면 시간 복잡도가 높아 비효율적이다.
   - 한쪽(예: B)의 점수 합계 리스트를 **정렬**한 뒤, 다른 쪽(A)의 각 점수에 대해 **이진 탐색(Binary Search)**을 사용하면 A가 이기는 경우의 수를 매우 빠르게 찾을 수 있다.
   - 계산된 승리 횟수가 이전에 기록된 최대 승리 횟수보다 높으면, **현재 주사위 조합을 최적의 조합으로 갱신**한다.

이 과정을 모든 조합에 대해 반복하면, 최종적으로 A의 승리 확률이 가장 높은 주사위 조합을 찾을 수 있다.

---

## Java 코드

```java
import java.util.*;

class Solution {
    int n;
    int[][] dices;
    int maxWins = -1;
    int[] answer;

    public int[] solution(int[][] dice) {
        n = dice.length;
        dices = dice;
        answer = new int[n / 2];

        // A의 주사위 조합 생성
        combination(0, new ArrayList<>());

        return answer;
    }

    void combination(int start, List<Integer> selected) {
        // 조합이 완성되면 승리 횟수 계산
        if (selected.size() == n / 2) {
            calculateWins(selected);
            return;
        }
        for (int i = start; i < n; i++) {
            selected.add(i);
            combination(i + 1, selected);
            selected.remove(selected.size() - 1); // 백트래킹
        }
    }

    void calculateWins(List<Integer> selectedA) {
        List<Integer> selectedB = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (!selectedA.contains(i)) {
                selectedB.add(i);
            }
        }

        // 각 조합에 대한 모든 점수 합계 계산
        List<Integer> sumsA = new ArrayList<>();
        generateSums(0, 0, selectedA, sumsA);

        List<Integer> sumsB = new ArrayList<>();
        generateSums(0, 0, selectedB, sumsB);

        // 승리 횟수 계산
        Collections.sort(sumsB);
        int wins = 0;
        for (int sumA : sumsA) {
            // 이진 탐색으로 sumA보다 작은 sumB의 개수를 찾음
            // 중복된 값이 존재할 수 있으므로, 직접 lowerBound 구현
            int left = 0;
            int right = sumsB.size();
            while (left < right) {
                int mid = (left + right) / 2;
                if (sumsB.get(mid) < sumA) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }
            wins += left;
        }

        // 최적의 조합 갱신
        if (wins > maxWins) {
            maxWins = wins;
            for (int i = 0; i < n / 2; i++) {
                answer[i] = selectedA.get(i) + 1;
            }
        }
    }

    void generateSums(int idx, int sum, List<Integer> selected, List<Integer> sums) {
        if (idx == selected.size()) {
            sums.add(sum);
            return;
        }
        for (int face : dices[selected.get(idx)]) {
            // sum + face를 통해 자동으로 백트래킹
            generateSums(idx + 1, sum + face, selected, sums);
        }
    }
}
```

- 하나의 조합이 완성되면 **백트래킹**을 통해 **마지막 원소를 제거**해야 한다.
  - selected.remove(selected.size() - 1)
- B의 주사위는 0 ~ n-1 주사위에서 A가 선택한 주사위(selectedA)가 아닌 주사위다.
  - if (**!selectedA.contains(i)**) selectedB.add(i)
- sumsB 리스트에 **중복된 값**이 존재할 수 있므르로, Collections.binarySearch() 메서드를 사용하면 안 된다.
  - Collections.binarySearch()는 중복된 값이 있을 경우 어떤 값의 인덱스를 반환할 지 모른다.
  - 따라서 직접 **lowerBound**를 구현하여 **첫 번째로 등장하는 값**의 인덱스를 찾도록 해야 한다.
