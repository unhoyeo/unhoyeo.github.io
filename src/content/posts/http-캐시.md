---
title: "HTTP 캐시"
description: "HTTP 캐시는 서버의 응답을 클라이언트(브라우저)나 중간 프록시 서버에 저장하여, 같은 요청이 반복될 때 재사용할 수 있도록 함으로써 불필요한 데이터 전송을 줄이고, 응답 속도를 높이는 기술이다."
pubDate: 2025-04-08T21:14:40+09:00
category: "HTTP"
tags: ["검증", "캐시"]
---

HTTP 캐시는 서버의 응답을 <strong>클라이언트(브라우저)</strong>나 <strong>중간 프록시 서버</strong>에 저장하여, 같은 요청이 반복될 때 재사용할 수 있도록 함으로써 불필요한 데이터 전송을 줄이고, 응답 속도를 높이는 기술이다.

---

## HTTP 캐시의 기본 개념

웹 페이지를 요청할 때, 브라우저는 동일한 리소스를 여러 번 다운로드할 필요 없이 캐시된 데이터를 재사용할 수 있다.

이를 통해 다음과 같은 이점을 얻을 수 있다.

- **서버 부하 감소**: 서버가 동일한 요청을 반복적으로 처리하지 않아도 된다.
- **네트워크 트래픽 절감**: 불필요한 데이터 전송을 방지할 수 있다.
- **페이지 로딩 속도 개선**: 클라이언트에서 캐시된 데이터를 빠르게 제공할 수 있다.

---

## HTTP 캐시의 저장 위치

|  |  |  |  |
| --- | --- | --- | --- |
| **분류** | **저장 주체** | **저장 위치** | **예시** |
| 브라우저 캐시 (Private Cache) | 클라이언트 측 (브라우저) | 디스크 or 메모리 | Chrome, Firefox 등 |
| 중간 캐시 (Shared Cache) | 프록시 서버, CDN | 중간 서버 | Cloudflare, Akamai, ISP 프록시 등 |
| 게이트웨이 캐시 | 리버스 프록시, API 게이트웨이 등 | 내부 서버 앞단 | NGINX, Varnish, Spring Gateway 등 |

## 1. 브라우저 캐시 (Private Cache)

- 사용자 본인만 사용하는 캐시
- 브라우저 안에 저장됨 (디스크 또는 메모리)
- 예: 내가 로그인하고 새로고침했을 때, 다시 서버에 요청 안 하고 캐시로 빠르게 뜨는 화면

## 제어 예시

```java
Cache-Control: private, max-age=3600
```

---

## 2. 중간 캐시 (Shared Cache, Proxy Cache)

- 기업 네트워크, ISP(인터넷 서비스 제공업체), CDN(Content Delivery Network)이 여러 사람을 위해 저장하는 캐시
- 중간 서버(프록시, ISP 프록시, CDN 등)에 저장됨
- 여러 사용자에게 같은 응답을 재사용함
- 예: Cloudflare, Akamai, AWS CloudFront, Fastly

## 제어 예시

```http
Cache-Control: public, s-maxage=600
```

> CDN: 프록시 캐시를 활용하여 콘텐츠를 글로벌 네트워크에 배포하는 기술

---

## 3. 게이트웨이 캐시 (Gateway Cache, Reverse Proxy Cache)

- 서버 앞단에서 요청을 받아 처리하는 리버스 프록시나 API 게이트웨이에 저장
- 서버 부하 줄이기 위해 캐시 사용
- CDN 없이도 원(Origin) 서버 부하 감소
- 예: NGINX, Spring Cloud Gateway, Varnish

> 서버 앞단에서 직접 응답 주고 서버는 쉬게 함

---

## HTTP 캐시 제어를 위한 주요 헤더

HTTP 캐시 제어를 위한 주요 헤더에는 크게 캐시 제어 헤더와 검증 헤더, 조건부 요청 헤더가 있다.

## 캐시 제어 헤더

## 1. Cache-Control (HTTP/1.1 이후 핵심)

|  |  |
| --- | --- |
| **디렉티브(directives)** | **의미** |
| max-age=<초> | 캐시 유효 시간 (캐시된 응답을 지정된 시간(초) 동안 재사용 가능) |
| no-cache | 반드시 Origin 서버에 재검증 필요 |
| no-store | 저장 자체를 금지 (민감정보에 사용) |
| must-revalidate | 캐시 만료 후, 반드시 Origin 서버에 재검증 필요 |
| public | 인증된 응답도 공유 캐시에 저장 가능 |
| private | 오직 개인 캐시에만 저장 허용 |
| s-maxage=<초> | 공유 캐시(프록시, CDN)에서만 적용되는 max-age |

```java
Cache-Control: public, max-age=600
```

---

## 2. Expires (구버전 호환용)

- 캐시 만료 시간(UTC) 지정
- RFC 7234에서 Cache-Control: max-age로 대체됨
- 여전히 지원되지만 Cache-Control: max-age와 함께 사용할 경우 무시됨
- 클라이언트와 서버 간 시간 동기화 문제 발생 가능

```http
Expires: Wed, 09 Jun 2025 10:18:14 GMT
```

---

## 3. Pragma (구버전 호환용)

- RFC 9111에서 Cache-Control로 대체됨
- 일부 레거시(HTTP/1.0) 시스템에서 사용됨
- Pragma: no-cache → Cache-Control: no-cache와 동일 기능

```java
Pragma: no-cache
```

---

## 검증 헤더 (Validator)

클라이언트가 서버에 **리소스의 변경 여부**만 확인하여 캐시된 응답이 여전히 유효한지 확인하는 역할을 한다.

이 검증 정보를 기반으로 클라이언트가 **조건부 요청**을 수행할 수 있다.

검증 헤더에는 **ETag, Last-Modified**가 있다.

---

## 1. ETag (엔티티 태그)

- 리소스에 대한 **고유 식별자**
- 일반적으로 파일의 해시 값(SHA-1, MD5) 또는 버전 번호를 기반으로 생성됨
- 가장 정밀한 검증 방식
- 클라이언트가 조건부 요청 시 **If-None-Match** 헤더로 검증 (리소스 변경 시 ETag 값도 변경되므로)

```java
HTTP/1.1 200 OK
ETag: "v1.2345"
Cache-Control: max-age=3600
```

---

## 2. Last-Modified

- 리소스의 **마지막 수정 시간**
- 클라이언트가 조건부 요청 시 **If-Modified-Since** 헤더로 검증 (이때 이후로 변경되었다면 리소스도 변경되었으므로)

```http
HTTP/1.1 200 OK
Last-Modified: Wed, 08 Jun 2025 10:18:14 GMT
Cache-Control: max-age=3600
```

## 단점

- 초 단위까지만 비교 가능하여, ETag보다 덜 정밀함
- 동일한 데이터로 수정한 경우에도 Last-Modified 값은 변경됨
- 서버에서 별도의 캐시 관리 로직을 사용할 수 없음 (예: 스페이스나 주석같은 일부 변경에는 캐시 유지)

---

## 조건부 요청 헤더

조건부 요청은 클라이언트가 특정 조건을 만족할 경우에만 서버로부터 데이터를 가져오도록 요청하는 방식이다.

이를 통해 불필요한 데이터 전송을 방지하고, 네트워크 트래픽을 줄일 수 있다.

조건부 요청 헤더에는 If-None-Match, If-Modified-Since 등이 있다.

---

## 1. If-None-Match

클라이언트가 보유한 ETag 값을 서버에 전달하여 변경 여부를 확인한다.

```http
GET /image.jpg HTTP/1.1
If-None-Match: "abc123"
```

변경되지 않았다면 <strong>"304 Not Modified"</strong>로 응답하고 본문은 생략

```http
HTTP/1.1 304 Not Modified
```

변경되었다면 <strong>"200 OK"</strong>로 응답하고 새로운 ETag를 부여하고, 새로운 데이터를 반환

```java
HTTP/1.1 200 OK
ETag: "def456"
Content-Length: 10234

...
```

---

## 2. If-Modified-Since

캐시된 리소스의 Last-Modified 시간과 비교하여 변경 여부를 확인한다.

```http
GET /image.jpg HTTP/1.1
If-Modified-Since: Wed, 08 Jun 2025 10:18:14 GMT
```

변경되지 않았다면 "304 Not Modified"로 응답하고 본문은 생략

```http
HTTP/1.1 304 Not Modified
```

변경되었다면 "200 OK"로 응답하고 새로운 Last-Modified를 부여하고, 새로운 데이터를 반환

```java
HTTP/1.1 200 OK
Last-Modified: Thu, 09 Jun 2025 12:00:00 GMT
Content-Length: 10234

...
```

---

## 확실한 캐시 무효화 전략

HTTP 캐시를 완전히 무효화하고 항상 최신 데이터를 가져오도록 강제하는 방법

```java
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
```

1️⃣ no-cache: 캐시에 저장되더라도, 반드시 서버 검증 후 사용

2️⃣ no-store: 캐시에 저장 자체를 금지

3️⃣ must-revalidate: 만료된 캐시는 반드시 서버 검증 후 사용

4️⃣ Pragma: no-cache: HTTP/1.0 호환성 유지

## no-cache vs must-revalidate

- **no-cache**는 검증 시 Origin 서버에 접근할 수 없는 경우, 서버 설정에 따라 캐시 데이터를 반환할 수 있다.
- **must-revalidate**는 검증 시 Origin 서버에 접근할 수 없는 경우, **반드시 오류(504 응답)가 발생한다!**
