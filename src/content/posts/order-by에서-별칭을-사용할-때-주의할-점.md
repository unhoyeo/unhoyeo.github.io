---
title: "ORDER BY에서 별칭을 사용할 때 주의할 점"
pubDate: 2026-02-25T14:49:10+09:00
category: "데이터베이스"
tags: ["SQL"]
---

쿼리를 작성할 때 **정렬(ORDER BY)** 단계에서 주의해야 할 점이 있다. 다음 문제를 보자.

<https://school.programmers.co.kr/learn/courses/30/lessons/284531>

이 문제는 데이터를 노선(ROUTE)별로 그룹화하여 합계와 평균을 구하는 집계 능력, 그리고 숫자 데이터에 반올림과 단위(km)를 붙이는 가공 능력을 동시에 요구한다.

이때 컬럼에 'km'라는 문자를 붙여버리면 컴퓨터는 이를 숫자가 아닌 **문자열**로 인식하여 정렬 결과가 꼬일 수 있다.

따라서 다음과 같이 쿼리를 작성하면 틀렸다는 결과를 얻는다.

```sql
SELECT
    ROUTE,
    CONCAT(ROUND(SUM(D_BETWEEN_DIST), 1), 'km') AS TOTAL_DISTANCE,
    CONCAT(ROUND(AVG(D_BETWEEN_DIST), 2), 'km') AS AVERAGE_DISTANCE
FROM
    SUBWAY_DISTANCE
GROUP BY
    ROUTE
ORDER BY
    TOTAL_DISTANCE DESC
```

이렇게 별칭을 기준으로 정렬을 하게 되면 데이터베이스는 문자열 정렬 기준에 따라 '10km'보다 '9km'가 크다고 판단할 수 있다.

따라서 문자가 붙기 전의 순수한 합계 수치인 SUM(D\_BETWEEN\_DIST)를 기준으로 정렬해야 정확한 결과를 얻을 수 있다.

```sql
SELECT
    ROUTE,
    CONCAT(ROUND(SUM(D_BETWEEN_DIST), 1), 'km') AS TOTAL_DISTANCE,
    CONCAT(ROUND(AVG(D_BETWEEN_DIST), 2), 'km') AS AVERAGE_DISTANCE
FROM
    SUBWAY_DISTANCE
GROUP BY
    ROUTE
ORDER BY
    SUM(D_BETWEEN_DIST) DESC
```
