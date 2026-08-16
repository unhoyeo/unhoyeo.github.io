---
title: "HTTP 헤더"
pubDate: 2025-04-07T21:33:41+09:00
category: "HTTP"
tags: ["캐시", "HTTP"]
---

HTTP 헤더는 클라이언트와 서버 간에 부가적인 정보를 전달하기 위한 **Key: Value 형식**의 데이터이다.

HTTP 요청과 응답에 포함되며, 인코딩, 인증, 보안, 캐싱, 쿠키, 콘텐츠 형식 등 다양한 정보를 제공한다.

---

## HTTP 헤더의 구조

```bash
header-field = field-name ":" OWS field-value OWS
```

> OWS: 띄어쓰기 허용 (띄어쓰기해도 되고 안 해도 된다.)

## OWS 예시

```java
Content-Type: text/html;charset=UTF-8 // : 뒤에 띄어쓰기 해도 됨
Content-Length:3423 // : 뒤에 띄어쓰기 안 해도 됨
Host :www.google.com // : 전에 띄어쓰기 하면 안 됨!
```

> **":" 는 반드시 헤더 뒤에 붙여 써야 한다!**

---

## HTTP 헤더의 종류

과거(RFC 2616)에는 다음과 같이 분류되었다.

|  |  |
| --- | --- |
| **일반 헤더 (General Headers)** | 요청과 응답 모두에 사용되는 일반적인 헤더 |
| **요청 헤더 (Request Headers)** | 클라이언트가 서버로 보내는 정보 |
| **응답 헤더 (Response Headers)** | 서버가 클라이언트에게 보내는 정보 |
| **엔터티 헤더 (Entity Headers)** | 본문(Content)에 대한 정보 |

그러나 2014년 RFC 723x 시리즈에서 <strong>엔티티(Entity)</strong>라는 개념이 <strong>표현(Representation)</strong>이라는 개념으로 변경되었다.

- '표현'은 요청이나 응답에서 전달되는 실제 데이터를 의미한다.
- 이는 서버가 클라이언트에게 리소스를 다양한 형태로 '표현'할 수 있다는 점을 강조한다.
- 표현은 **표현 메타데이터**(Representation Metadata)와 **표현 데이터**(Representation Data)로 구성된다.
  - 표현 데이터는 메시지 본문 즉, **페이로드**(Payload)를 의미하며, 실제 전달되는 데이터 자체
- 표현 헤더는 표현 데이터를 해석하는 데 필요한 정보를 제공한다.
- 예: Content-Type, Content-Encoding, Content-Language, Content-Length

---

## 1. 일반 헤더 (General Headers)

특정 메서드나 요청/응답 구분 없이 공통적으로 사용되며, 메시지 자체의 메타데이터를 정의

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| Cache-Control | 캐시 정책 제어 (프라이빗/퍼블릭, 만료 등) | Cache-Control: no-store, max-age=3600 |
| Connection | 현재 연결의 유지 여부 설정 (close 또는 keep-alive) | Connection: keep-alive |
| Date | 메시지 생성 시간 | Date: Wed, 02 Apr 2025 12:34:56 GMT |
| Pragma | HTTP/1.0 캐시 제어 (현재는 거의 no-cache만 의미 있음) | Pragma: no-cache |
| Trailer | Transfer-Encoding: chunked 사용 시, 트레일러 헤더 미리 선언 | Trailer: X-Custom-Meta |
| Transfer-Encoding | 메시지 전송 방식 정의 (chunked 등) | Transfer-Encoding: chunked |
| Via | 프록시/게이트웨이 경유 정보 기록 | Via: 1.1 proxy.example.com |
| Warning | 캐시된 응답의 신뢰성 관련 경고 | Warning: 110 - "Response is Stale" |
| Upgrade | HTTP 프로토콜 업그레이드 요청 | Upgrade: websocket |

## Connection: keep-alive (연결 유지)

HTTP/1.1부터 기본적으로 **연결을 유지하는 Keep-Alive가 활성화**되어 있으며, 여러 개의 요청을 하나의 TCP 연결에서 처리할 수 있다.

## 예시

```http
GET /index.html HTTP/1.1
Connection: keep-alive
```

```http
HTTP/1.1 200 OK
Connection: keep-alive
```

**장점**

- 여러 개의 요청을 한 번의 연결에서 처리하여 성능 최적화
- TCP 연결 비용 절감

**단점**

- 장시간 유지하면 서버 리소스가 증가할 수 있음
- 일부 네트워크 환경에서는 비효율적일 수 있음

---

## 2. 요청 헤더 (Request Headers)

클라이언트가 서버에 요청할 때 보내는 메타정보

## 클라이언트 정보

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| Host (필수) | 요청 대상 서버의 도메인 | Host: example.com |
| User-Agent | 클라이언트의 애플리케이션 정보 (브라우저 및 OS 정보) | User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS ... |
| Referer | 현재 요청을 유발한 이전 페이지 주소 | Referer: https://google.com |
| Origin | 요청의 출처 (CORS, CSRF 대응 시 중요) | Origin: https://example.com |
| From | 사용자 이메일 주소 (잘 쓰이지 않음) | From: user@example.com |

- **Host**: 서버에서 가상 호스팅을 통해 하나의 IP 주소에 여러 도메인을 지정할 수 있기 때문에, 이를 구분하기 위한 필수 헤더
- **User-Agent**: 서버가 어떤 종류의 브라우저/OS에서 장애가 발생하는지 파악 가능, 통계 정보에 활용 가능
- **Referer**: 사용자가 어떤 페이지에서 이동했는지 추적할 수 있음 (유입 경로 분석)

## 콘텐츠 협상 (Content Negotiation)

- 클라이언트가 요청을 보낼 때, 서버가 클라이언트의 선호도에 맞춰 가장 적절한 콘텐츠를 선택하여 응답하는 HTTP 기능

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| Accept | 선호하는 미디어 타입 (MIME 타입) | Accept: application/json, text/html;q=0.8 |
| Accept-Charset | 선호하는 문자 인코딩 | Accept-Charset: utf-8 |
| Accept-Encoding | 선호하는 압축 방식 | Accept-Encoding: gzip, br |
| Accept-Language | 선호하는 언어 | Accept-Language: ko-KR, en-US;q=0.9 |

## q 값 (Quality Factor or Quality Values)

- 우선순위를 나타내는 가중치 (0~1 사이의 값)
- 값이 클수록 우선순위가 높다.
- **기본값 = 1**
- 전부 생략 시 **구체적인 것이 우선**

## 예시

```applescript
Accept: text/*, text/plain, text/plain;format=flowed, */*
```

1. text/plain;format=flowed
2. text/plain
3. text/\*
4. \*/\*

```http
Accept: text/html, application/json;q=0.8, text/plain;q=0.5
```

1. text/html → 우선순위 1.0 (기본값)
2. application/json → 우선순위 0.8
3. text/plain → 우선순위 0.5

## 조건부 요청

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| If-Modified-Since | 수정 이후에만 응답 | If-Modified-Since: Wed, 02 Apr 2025 12:00:00 GMT |
| If-None-Match | ETag와 불일치할 경우만 응답 | If-None-Match: "abc123" |
| If-Match, If-Unmodified-Since, If-Range | 더 정밀한 캐시 조건 제어용 |  |

## 인증/보안

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| Authorization | 인증 정보 (Bearer, Basic 등) | Authorization: Bearer eyJhbGciOiJI... |
| Cookie | 저장된 쿠키 전송 | Cookie: sessionid=abc123 |

---

## 3. 응답 헤더 (Response Headers)

서버가 응답할 때 클라이언트에게 전송하는 메타정보

## 서버 정보

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| Server | Origin 서버 소프트웨어 정보 | Server: Apache/2.4.41 (Ubuntu) |
| Location | 리다이렉션 대상 주소 (3xx 응답 시 사용) | Location: https://newsite.com |
| Retry-After | 서비스 불가 시 클라이언트 재시도 시간 (503 응답 시 사용) | Retry-After: 3600 (초 단위) |
| Age | 캐시된 응답의 나이 (초 단위) | Age: 123 |
| Allow | 허용 가능한 HTTP 메서드 종류 (405 응답 시 사용) | Allow: GET, HEAD, PUT |

> Origin 서버: 요청이 전달되는 동안 거치는 프록시 서버나 캐시 서버가 아닌, 실제 요청을 처리하는 서버

> Location: **3xx** 응답 시 리다이렉션할 URI를, **201** 응답 시 해당 요청으로 인해 생성된 리소스의 URI를 뜻한다.

## 인증/보안

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| Set-Cookie | 클라이언트에 쿠키 저장 요청 | Set-Cookie: sessionid=abc123; HttpOnly; Secure |
| WWW-Authenticate | 인증 방법 정의 (401 응답 시 사용) | WWW-Authenticate: Basic realm="User Area" |
| Content-Security-Policy | XSS 방지 등 보안정책 설정 | Content-Security-Policy: default-src 'self' |
| X-Content-Type-Options | MIME 타입 강제 설정 (nosniff) | X-Content-Type-Options: nosniff |
| X-Frame-Options | 클릭재킹 방지 (DENY, SAMEORIGIN) | X-Frame-Options: DENY |

---

## 4. 표현 헤더 (Representation Headers)

- 전송되는 콘텐츠 자체(표현)에 대한 메타데이터
- 요청/응답 구분 없이 공통적으로 사용

|  |  |  |
| --- | --- | --- |
| **헤더** | **설명** | **예시** |
| Content-Type | 표현 데이터의 미디어 타입 (MIME 타입) | Content-Type: application/json |
| Content-Length | 표현 데이터의 길이 (바이트 단위) | Content-Length: 349 |
| Content-Encoding | 표현 데이터의 압축 방식 (gzip, deflate, identity 등) | Content-Encoding: gzip |
| Content-Language | 표현 데이터의 자연 언어 (ko, en-US 등) | Content-Language: ko |
| ETag | 엔티티 태그 (캐시 무결성 검증용 식별자) | ETag:"v1.1234abcd" |
| Last-Modified | 표현 데이터의 마지막 수정일 | Last-Modified: Wed, 02 Apr 2025 11:00:00 GMT |

- **Content-Length**: Transfer-Encoding을 사용하면 Content-Length를 사용하면 안 된다.
- **ETag**: 클라이언트가 캐싱된 데이터가 최신인지 확인할 수 있도록 해준다.

---

## 캐시 제어 관련 헤더 요약

|  |  |  |
| --- | --- | --- |
| **헤더** | **용도** | **설명** |
| Cache-Control | 캐시 정책 제어 | no-cache, no-store, max-age, must-revalidate 등 |
| Expires | 절대 만료 시점 (HTTP/1.0 방식) | Expires: Wed, 02 Apr 2025 13:00:00 GMT |
| Pragma | 구형 클라이언트를 위한 no-cache | Pragma: no-cache |
| ETag, Last-Modified | 캐시 검증용 조건부 요청 기반 | - |
