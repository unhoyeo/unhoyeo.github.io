---
title: "5430번 AC - 구현, Deque(덱)"
pubDate: 2025-03-20T18:28:32+09:00
category: "알고리즘/백준"
tags: []
draft: true
---

<https://www.acmicpc.net/problem/5430>

선영이는 주말에 할 일이 없어서 새로운 언어 AC를 만들었다. AC는 정수 배열에 연산을 하기 위해 만든 언어이다. 이 언어에는 두 가지 함수 R(뒤집기)과 D(버리기)가 있다.

함수 R은 배열에 있는 수의 순서를 뒤집는 함수이고, D는 첫 번째 수를 버리는 함수이다. 배열이 비어있는데 D를 사용한 경우에는 에러가 발생한다.

함수는 조합해서 한 번에 사용할 수 있다. 예를 들어, "AB"는 A를 수행한 다음에 바로 이어서 B를 수행하는 함수이다. 예를 들어, "RDD"는 배열을 뒤집은 다음 처음 두 수를 버리는 함수이다.

배열의 초기값과 수행할 함수가 주어졌을 때, 최종 결과를 구하는 프로그램을 작성하시오.

```java
4
RDD
4
[1,2,3,4]
DD
1
[42]
RRD
6
[1,1,2,3,5,8]
D
0
[]
```

첫째 줄에 테스트 케이스의 개수 T가 주어진다. T는 최대 100이다.

각 테스트 케이스의 첫째 줄에는 수행할 함수 p가 주어진다. p의 길이는 1보다 크거나 같고, 100,000보다 작거나 같다.

다음 줄에는 배열에 들어있는 수의 개수 n이 주어진다. (0 ≤ n ≤ 100,000)

다음 줄에는 [x1,...,xn]과 같은 형태로 배열에 들어있는 정수가 주어진다. (1 ≤ xi ≤ 100)

전체 테스트 케이스에 주어지는 p의 길이의 합과 n의 합은 70만을 넘지 않는다.

```java
[2,1]
error
[1,2,3,5,8]
error
```

각 테스트 케이스에 대해서, 입력으로 주어진 정수 배열에 함수를 수행한 결과를 출력한다. 만약, 에러가 발생한 경우에는 error를 출력한다.

---

## 아이디어

- **R(뒤집기)** 연산을 할 때 실제로 배열(리스트)을 뒤집으면 **시간이 오래 걸림 → O(N)**
- 대신 <strong>“뒤집힘 여부”</strong>를 체크하여 <strong>D(버리기)</strong> 연산 시 <strong>앞에서 제거할지, 뒤에서 제거할지</strong> 결정
- <strong>Deque&lt;Integer></strong>를 사용하여 <strong>앞/뒤에서 빠르게 원소를 제거 가능 (O(1))</strong>
- **R 연산 시 실제로 뒤집지 않고 boolean reverse 플래그 사용**
- **D 연산 시 reverse 값에 따라 pollFirst() 또는 pollLast() 실행**
- 최종 결과 출력 시 reverse 값에 따라 순서 출력

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        int T = Integer.parseInt(br.readLine()); // 테스트 케이스 개수

        while (T-- > 0) {
            String p = br.readLine(); // 수행할 함수
            int n = Integer.parseInt(br.readLine()); // 배열 크기

            // 배열 파싱 ([], [1,2,3] 같은 형태에서 숫자만 추출)
            Deque<Integer> deque = new ArrayDeque<>();
            StringTokenizer st = new StringTokenizer(br.readLine(), "[],");
            while (n-- > 0) {
                deque.add(Integer.parseInt(st.nextToken()));
            }

/*
            // 또는 이렇게 할 수도 있음
            if (n > 0) {
                String[] numbers = input.substring(1, input.length() - 1).split(",");
                for (String num : numbers) {
                    deque.add(Integer.parseInt(num));
                }
            }
*/

            boolean reverse = false; // 뒤집힘 여부 플래그
            boolean error = false;   // 에러 발생 여부

            for (char command : p.toCharArray()) {
                if (command == 'R') {
                    reverse = !reverse; // 뒤집기 플래그 토글
                } else { // 'D' 연산
                    if (deque.isEmpty()) {
                        error = true;
                        break;
                    }
                    if (reverse) {
                        deque.pollLast(); // 뒤에서 제거
                    } else {
                        deque.pollFirst(); // 앞에서 제거
                    }
                }
            }

            if (error) {
                sb.append("error\n");
            } else {
                sb.append("[");
                while (!deque.isEmpty()) {
                    sb.append(reverse ? deque.pollLast() : deque.pollFirst());
                    if (!deque.isEmpty()) sb.append(",");
                }
                sb.append("]\n");
            }
        }
        System.out.print(sb);
    }
}
```

---

## 시간 초과한 코드

```java
import java.io.*;
import java.util.*;

class Main {

    static int T, n;
    static String p;
    static ArrayList<Integer> list;
    static StringBuilder result = new StringBuilder();

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        T = Integer.parseInt(br.readLine()); // 테스트 케이스의 개수

        StringBuilder sb = new StringBuilder();
        while (T-- > 0) {
            p = br.readLine(); // 수행할 함수 ex) RDD
            n = Integer.parseInt(br.readLine());

            list = new ArrayList<>();
            StringTokenizer st = new StringTokenizer(br.readLine(), "[,]");
            for (int i = 0; i < n; i++) {
                list.add(Integer.parseInt(st.nextToken()));
            }

            result.append(AC()).append("\n");
        }

        System.out.println(result);
    }

    static String AC() {
        StringBuilder sb = new StringBuilder();

        for (char c : p.toCharArray()) {
            if (c == 'R') { // 배열에 있는 수의 순서를 뒤집는 함수
                Collections.reverse(list);
            } else { // 첫 번째 수를 버리는 함수
                if (list.isEmpty()) {
                    return "error";
                }
                list.remove(0);
            }
        }

        sb.append("[");
        for (Integer i : list) {
            sb.append(i).append(",");
        }
        sb.deleteCharAt(sb.length() - 1);
        sb.append("]");

        return sb.toString();
    }

}
```

## 시간 초과 발생 원인

**1. ArrayList.remove(0)** 연산의 시간 복잡도가 **O(N)**

- ArrayList에서 remove(0)을 하면 **첫 번째 원소가 삭제된 후, 남은 원소들을 전부 한 칸씩 앞으로 이동**해야 한다.
- 이 연산은 <strong>O(N)</strong>의 시간이 걸린다.
- 즉, D 명령이 여러 번 실행되면 최악의 경우 <strong>O(N²)</strong>이 된다.

**2. Collections.reverse(list)** 연산도 **O(N)**

- R 연산을 할 때마다 Collections.reverse(list)를 실행하는데, 이 연산은 <strong>O(N)</strong>의 시간이 걸린다.
- R 명령이 여러 번 나오면 전체 수행 시간이 **O(N²)** 에 가까워질 수 있다.
