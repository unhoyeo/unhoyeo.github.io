---
title: "HTTP 메시지"
description: "HTTP 메시지는 클라이언트와 서버 간의 데이터 교환 형식으로, 크게 요청(Request) 메시지와 응답(Response) 메시지로 구분된다."
pubDate: 2025-04-06T22:42:51+09:00
category: "HTTP"
tags: []
---

HTTP 메시지는 클라이언트와 서버 간의 데이터 교환 형식으로, 크게 **요청(Request) 메시지**와 **응답(Response) 메시지**로 구분된다.

또한, 각 메시지는 시작 라인(Start Line), 헤더(Header), 본문(Body)으로 구성된다.

> 요청 메시지의 시작 라인은 <strong>요청 라인(Request Line)</strong>, 응답 메시지의 시작 라인은 <strong>상태 라인(Status Line)</strong>이라 한다.

---

## 1. HTTP 요청 메시지

```
<요청 라인>
<헤더>
<빈 줄>
<본문 (필요한 경우)>
```

## 1.1. 요청 라인 (Request Line)

요청의 첫 번째 줄로, 다음과 같은 형식으로 구성된다.

```
<메서드> <URI> <HTTP 버전>
```

- **메서드**: 수행할 작업 (예: GET, POST, PUT, PATCH, DELETE)
- **URI**: 요청하는 리소스의 경로 → 보통은 절대 경로("/" 로 시작하는 경로)로 지정
- **HTTP 버전**: 사용되는 HTTP 프로토콜 버전 (예: HTTP/1.1, HTTP/2, HTTP/3)

## 요청 라인 예시

```http
GET /products?category=shoes HTTP/1.1
```

---

## 1.2. 요청 헤더 (Request Headers)

요청에 대한 추가 정보를 제공하는 **Key: Value** 형태의 데이터로, 여러 줄로 구성된다.

## 요청 헤더 예시

```java
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html
Content-Type: application/json
Authorization: Bearer <토큰>
```

---

## 1.3. 요청 본문 (Request Body)

GET 요청에는 보통 본문이 포함되지 않으며, POST, PUT, PATCH 요청에서는 본문을 통해 데이터를 전달한다.

## 요청 본문 예시 (application/json)

```http
POST /users HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "username": "kim",
  "password": "securepassword123"
}
```

## 요청 본문 예시 (x-www-form-urlencoded)

```http
POST /users HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded

username=kim&password=securepassword123
```

---

## 2. HTTP 응답 메시지

```
<상태 라인>
<헤더>
<빈 줄>
<본문>
```

## 2.1. 상태 라인 (Status Line)

응답의 첫 번째 줄로, 다음과 같은 형식으로 구성된다.

```html
<HTTP 버전> <상태 코드> <상태 메시지>
```

- **HTTP 버전**: 사용되는 HTTP 프로토콜 버전
- **상태 코드(Status Code)**: 요청의 처리 결과를 나타내는 3자리 숫자 (200, 404, 500 등)
- **상태 메시지**: 상태 코드를 설명하는 짧은 메시지 (OK, Not Found 등)

## 상태 라인 예시

```http
HTTP/1.1 200 OK
```

---

## 2.2. 응답 헤더 (Response Headers)

응답에 대한 추가 정보를 제공하는 Key: Value 형태의 데이터로, 여러 줄로 구성된다.

## 응답 헤더 예시

```pgsql
Content-Type: application/json
Content-Length: 1234
Cache-Control: max-age=3600
Set-Cookie: sessionId=abc123; HttpOnly
```

---

## 2.3. 응답 본문(Response Body)

서버가 클라이언트에게 전달하는 실제 데이터다.

## 응답 본문 예시 (application/json)

```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "name": "kim"
  }
}
```

---

## 3. HTTP 메시지의 성능 최적화

HTTP 메시지는 효율적인 데이터 전송을 위해 다양한 최적화 기술을 활용한다.

## 압축

**Content-Encoding**을 사용하여 응답 본문을 압축해 트래픽을 줄일 수 있다.

## 캐싱

**Cache-Control**을 설정하여 동일한 요청을 반복할 필요 없이 클라이언트가 캐싱된 데이터를 사용하도록 할 수 있다.

## HTTP/2의 헤더 압축 (HPACK)

중복되는 헤더를 압축하여 전송 비용을 줄일 수 있다.

## HTTP/3의 QUIC 프로토콜

TCP 대신 **UDP**를 활용하여 빠른 연결 설정과 데이터 전송을 가능하도록 한다.
