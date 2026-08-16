---
title: "URI의 구성요소, 설계 원칙"
description: "URI(Uniform Resource Identifier, 통합 자원 식별자)는 인터넷에서 특정 자원을 식별하기 위한 문자열이다. 웹 페이지, 이미지, 동영상, API 등 '모든 인터넷 자원'을 식별하는 역할을 한다."
pubDate: 2025-04-01T20:14:19+09:00
category: "HTTP"
tags: []
---

## URI란?

URI(Uniform Resource Identifier, 통합 자원 식별자)는 인터넷에서 특정 자원을 식별하기 위한 문자열이다.

웹 페이지, 이미지, 동영상, API 등 '모든 인터넷 자원'을 식별하는 역할을 한다.

✔ 쉽게 말하면, 웹에서 특정 자원을 가리키는 "주소" 역할!

---

## URI의 구성 요소

URI는 기본적으로 다음과 같은 구조를 가진다.

```html
scheme://authority/path?query#fragment
```

좀 더 자세히 보자면 다음과 같다.

```html
scheme://[userinfo@]host[:port][/path][?query][#fragment]
```

각 요소는 인터넷 자원의 위치를 명확하게 식별하는 역할을 한다. 이제 각 요소를 하나씩 자세히 살펴보자.

---

## scheme (스킴)

- <strong>자원의 접근 방식(프로토콜)</strong>을 정의한다.
- 예시: http, https, ftp, mailto, file

**즉, 스킴은 URI가 어떻게 해석될지를 결정하는 핵심 요소!**

---

## authority (권한 정보)

```html
authority = [userinfo@]host[:port]
```

- 리소스를 제공하는 서버의 정보(호스트, 포트 등)를 포함한다.
  - **[userinfo@]** → 사용자 정보, 거의 사용 안함
  - **host** → 도메인명 또는 IP 주소
  - **[:port]** → 포트번호, 생략 가능
- 예시: ftp://**user:pass@ftp.example.com:21**/file.txt
  - user:pass@ → 사용자 인증 정보
  - ftp.example.com → 호스트 (도메인)
  - :21 → 포트 번호 (FTP 기본 포트)

**포트 번호 생략 시 기본값 사용!**

---

## path (경로)

- 서버 내 특정 리소스의 위치를 지정한다.
- 파일 디렉토리 경로처럼 **계층 구조**를 가진다.
  - https://www.example.com<strong>/products/item.html</strong> → 서버 내 파일 위치
- RESTful API에서는 자원(Resource)을 나타낸다.
  - https://api.example.com<strong>/users/123</strong> → users 목록 중 ID 123의 사용자 정보

**URI의 경로는 자원의 구조를 직관적으로 표현해야 한다!**

---

## query (쿼리 문자열)

- <strong>추가적인 데이터(매개변수)</strong>를 포함한다.
- **key=value** 형태로 구성된다.
- 여러 개의 파라미터는 &로 구분한다.
  - https://www.example.com/search<strong>?q=laptop&sort=price</strong>
  - https://api.example.com/users<strong>?age=20&gender=male</strong>

**쿼리 문자열은 동적 데이터를 전달할 때 유용!**

---

## fragment (프래그먼트, 앵커)

- **문서 내부 특정 위치**를 지정한다.
- 서버로 전달되지 않고, **클라이언트(브라우저)에서만 사용**한다.
- 웹 페이지 내 특정 섹션으로 이동할 때 사용한다.
  - https://www.example.com/docs<strong>#chapter3</strong> → 문서에서 chapter3 위치로 이동

**페이지 내 특정 위치로 이동할 때 사용! (예: 목차 링크)**

정리하면 다음과 같다.

|  |  |  |
| --- | --- | --- |
| **scheme** | 자원 접근 방식 (프로토콜) | http, https, ftp, mailto, file |
| **authority** | 사용자 정보 + 호스트(도메인) + 포트 | www.example.com:8080 |
| **path** | 서버 내의 특정 자원 위치 | /products/item.html |
| **query** | 추가 정보 전달 (Key-Value) | ?id=123&category=shoes |
| **fragment** | 페이지 내부 특정 위치 지정 | #section2 |

---

## URI vs URL vs URN

URI는 크게 URL과 URN을 포함하는 개념이다.

|  |  |  |
| --- | --- | --- |
| **URI** (Uniform Resource Identifier) | 인터넷 자원을 식별하는 문자열 자원을 식별하는 모든 문자열 | <https://example.com> mailto:user@example.com, ISBN:978-3-16-148410-0 |
| **URL** (Uniform Resource Locator) | 특정 자원의 위치를 포함한 URI 자원의 위치를 지정하는 URI | https://example.com/index.html |
| **URN** (Uniform Resource Name) | 위치와 관계없이 자원의 고유 이름을 식별 자원의 고유한 이름을 지정 (위치 무관) | urn:isbn:0451450523 |

✔ 즉, 모든 URL은 URI이지만, 모든 URI가 URL은 아님!

---

## URI의 주요 특성

1️⃣ **고유성** → 인터넷상의 특정 자원을 고유하게 식별

2️⃣ **확장성** → 다양한 프로토콜(http, ftp, mailto 등)에 적용 가능

3️⃣ **표준화** → W3C(World Wide Web Consortium)와 IETF(Internet Engineering Task Force)에서 정의

✔ 인터넷이 동작하는 기본 개념이므로, 웹 개발과 API 설계에서 필수적으로 사용됨!

---

## URI의 인코딩(Encoding)

URI는 **특수 문자(공백, 한글, 특수 기호)를 포함할 수 없다.**

따라서, **퍼센트 인코딩(Percent-Encoding)** 방식을 사용하여 변환한다.

|  |  |
| --- | --- |
| 공백(Space) | %20 |
| # | %23 |
| ? | %3F |
| 한글 (예: 안녕) | %EC%95%88%EB%85%95 |

✔ URL에서 한글을 안전하게 전달하려면 반드시 인코딩 필요!

---

## 7. URI와 RESTful API

RESTful API에서는 URI를 이용해 리소스를 식별합니다.

**RESTful API URI 예시**

```http
GET https://api.example.com/users/123
```

- https → **스킴**

- api.example.com → **도메인**

- /users/123 → **자원(users)과 ID(123) 지정**

✔ RESTful API는 의미 있는 URI 설계를 중요하게 여김!

---

## 8. URI 설계 원칙 (REST API Best Practices)

✅ 명확하고 직관적인 구조 사용

- ❌ <https://api.example.com/getUser?id=123> (비추천)

- ✅ <https://api.example.com/users/123> (추천)

✅ **소문자 사용** (/Users 대신 /users)

✅ **하이픈(-) 사용** (new-user vs newuser)

✅ **파일 확장자 제거** (.html, .php 등 생략)

✅ **버전 정보 포함** (/v1/users vs /users)

✔ 좋은 URI 설계는 API 가독성과 유지보수성을 높임!

---

## 9. 결론

- URI는 인터넷 자원을 식별하는 문자열이며, URL과 URN을 포함하는 개념.

- URL은 자원의 “위치”를, URN은 자원의 “이름”을 식별.

- HTTP, FTP, MAILTO 등 다양한 프로토콜에서 사용.

- RESTful API에서는 의미 있는 URI 설계가 중요.

- 퍼센트 인코딩을 사용하여 특수 문자와 한글을 안전하게 처리.

**URI는 인터넷의 핵심 개념이며, 웹 개발과 API 설계에서 필수적인 요소!** ?
