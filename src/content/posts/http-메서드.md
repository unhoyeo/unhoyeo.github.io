---
title: "HTTP 메서드"
description: "HTTP 메서드는 클라이언트가 서버에 요청할 때 사용하는 메서드를 정의하는 요소이다. 서버에서 리소스를 조회할 때 사용한다."
pubDate: 2025-04-06T22:54:19+09:00
category: "HTTP"
tags: []
---

HTTP 메서드는 **클라이언트가 서버에 요청할 때 사용하는 메서드**를 정의하는 요소이다.

|  |  |
| --- | --- |
| **GET** | 리소스 조회 |
| **POST** | 요청 데이터 처리, 새로운 리소스 생성 |
| **PUT** | 기존 리소스 전체 교체(대체), 없을 시 새로 생성 → 파일 붙여넣기라고 생각 |
| **PATCH** | 리소스 일부 변경 |
| **DELETE** | 리소스 삭제 |
| HEAD | GET과 유사하지만, **응답 본문을 제외**하고 반환 |
| OPTIONS | 해당 리소스에 대해 서버가 지원하는 메서드 목록을 반환 (주로 CORS에서 사용) |
| CONNECT | 대상 리소스로 식별되는 서버에 대한 터널을 설정 |
| TRACE | 대상 리소스에 대한 경로를 따라 메시지 루프백 테스트를 수행 |

---

## 1. GET (조회)

- 서버에서 **리소스를 조회**할 때 사용한다.
- 서버에 전달하고 싶은 **데이터는 query(쿼리 문자열)를 통해 전달**
- 메시지 바디를 통해서도 데이터를 전달할 수 있지만, 지원하지 않는 곳이 많아서 권장되지 않는다.
- 요청의 결과로 **서버에서 데이터를 변경하지 않는다. (안전)**
- 동일한 요청을 여러 번 보내도 **같은 응답이 반환된다. (멱등)**

## GET 요청 예제

```http
GET /users HTTP/1.1
Host: api.example.com
Accept: application/json
```

## GET 응답 예제 (JSON)

```json
{
  "users": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
  ]
}
```

## GET 요청 시 주의사항

- 데이터를 **본문을 통해서 전달** ❌ → **query를 통해서 전달!**
- 단, URI에 **민감한 정보**(ID, 비밀번호) 포함 ❌
  - GET /login?username=admin&password=1234 ❌ (보안 취약)

---

## 2. POST (데이터 처리)

- **요청 데이터를 처리**할 때 사용한다. (주로 새로운 **리소스를 생성**하거나, **프로세스를 처리**해야 하는 경우)
- **요청 본문**을 통해 서버로 데이터를 전달한다.
- 요청의 결과로 **서버의 데이터가 변경된다. (안전 X)**
- 동일한 요청을 여러 번 보내면 **똑같은 데이터가 여러 개 생성될 수 있다. (멱등 X)**

## POST 요청 예제

```http
POST /users HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "name": "Charlie",
  "email": "charlie@example.com"
}
```

## POST 응답 예제 (201 Created)

```http
HTTP/1.1 201 Created
Location: /users/3

{
  "id": 3,
  "name": "Charlie",
  "email": "charlie@example.com"
}
```

## POST 요청 시 주의사항

- POST 요청 결과, **새로운 리소스가 생성되지 않을 수도 있다.**
  - 예: POST /orders/123/start-delivery **(컨트롤 URI)**
- **다른 메서드로 처리하기 애매한 경우**에 사용하면 된다.
  - 예: JSON으로 조회 데이터를 넘겨야 하는데, GET 메서드를 사용할 수 없는 경우
- **중복 요청을 방지**해야 한다! (**PRG 패턴** 등으로)

---

## 3. PUT (대체)

- **기존 리소스를 전체 교체** 할 때 사용한다. (기존 데이터가 **있으면 덮어쓰고, 없으면 새로 생성**)
- **클라이언트가 리소스를 식별**한다. (리소스의 위치를 알고 URI를 지정한다.) → ✅ **POST와의 차이점!**
- 요청의 결과로 **서버의 데이터가 변경된다. (안전 X)**
- 동일한 요청을 여러 번 보내도 **같은 응답이 반환된다. (멱등)**

## PUT 요청 예제

```http
PUT /users/3 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "name": "Charlie Updated",
  "email": "charlie.new@example.com"
}
```

## PUT 응답 예제 (200 OK)

```json
{
  "id": 3,
  "name": "Charlie Updated",
  "email": "charlie.new@example.com"
}
```

## PUT 요청 시 주의사항

- **모든 속성을 포함**해야 하므로, 누락된 필드는 기본값이 적용될 수 있다!
- 일부 필드만 변경하려면 **PATCH**를 사용하는 것이 적절!

---

## 4. PATCH (부분 수정)

- 기존 리소스의 **일부만 수정**할 때 사용한다.
- 기존 데이터 중 **변경할 부분만 전송**하며, **나머지는 유지**된다.
- 요청의 결과로 **서버의 데이터가 변경된다. (안전 X)**
- PATCH는 리소스의 특정 부분을 변경하는데, 이 변경 방식이 **멱등이어도 되고, 멱등이 아니어도 된다.** ([참고](https://www.inflearn.com/community/questions/110644/patch-%EB%A9%94%EC%84%9C%EB%93%9C%EA%B0%80-%EB%A9%B1%EB%93%B1%EC%9D%B4-%EC%95%84%EB%8B%8C-%EC%9D%B4%EC%9C%A0?srsltid=AfmBOoou8RC2YCFgGsQfFIJj3jFiZIHwsOiJanWejHQaVB1999qrIrHG))

## PATCH 요청 예제

```http
PATCH /users/3 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "email": "charlie.updated@example.com"
}
```

## PATCH 응답 예제 (200 OK)

```json
{
  "id": 3,
  "name": "Charlie Updated",
  "email": "charlie.updated@example.com"
}
```

## PATCH 요청 시 주의사항

- 요청 데이터에서 변경할 필드만 포함해야 한다.
- <strong>JSON Patch 표준(application/json-patch+json)</strong>을 사용할 수도 있다. ([참고](https://ten1010.tistory.com/entry/JSON-Patch))

```json
[
  { "op": "add", "path": "/c", "value": "c" },
  { "op": "remove", "path": "/a" }
]
```

---

## 5. DELETE (리소스 삭제)

- 특정 리소스를 **삭제(Delete)** 할 때 사용한다.
- 요청의 결과로 **서버의 데이터가 변경된다. (안전 X)**
- 동일한 요청을 여러 번 보내도 **같은 응답이 반환된다. (멱등)**

## DELETE 요청 예제

```http
DELETE /users/3 HTTP/1.1
Host: api.example.com
```

## DELETE 응답 예제 (204 No Content)

```yaml
HTTP/1.1 204 No Content
```

## DELETE 요청 시 주의사항

- 일반적으로 본문을 포함하지 않지만, 일부 API에서는 application/json 형식으로 요청할 수도 있다.
- 완전히 삭제하는 대신 **소프트 삭제(Soft Delete, 상태 변경)** 방식(is\_deleted=true)을 고려할 수 있다.

---

**HTTP 메서드의 특성 비교** ([참고](https://ko.wikipedia.org/wiki/HTTP#%EC%9A%94%EC%95%BD%ED%91%9C))

|  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| **메서드** | **요청 바디** | **응답 바디** | **안전(Safe)** | **멱등(Idempotent)** | **캐시 가능(Cacheable)** |
| **GET** | ⚠️ 거의 없음 | ✅ 있음 | ✅ 안전 | ✅ 멱등 | ✅ 캐시 가능 |
| **POST** | ✅ 있음 | ✅ 있음 | ❌ 안전하지 않음 | ❌ 멱등하지 않음 | ✅ 쉽지는 않음 |
| **PUT** | ✅ 있음 | ✅ 있음 | ❌ 안전하지 않음 | ✅ 멱등 | ❌ 캐시 불가 |
| **PATCH** | ✅ 있음 | ✅ 있음 | ❌ 안전하지 않음 | ❌ 설계에 따라 다름 | ❌ 캐시 불가 |
| **DELETE** | ⚠️ 선택 사항 | ✅ 있음 | ❌ 안전하지 않음 | ✅ 멱등 | ❌ 캐시 불가 |
| HEAD | ⚠️ 거의 없음 | ❌ 없음 | ✅ 안전 | ✅ 멱등 | ✅ 캐시 가능 |

- 멱등: 서버 오류로 정상 처리가 안 되었을 때, 클라이언트가 동일한 요청을 재시도해도 되는지 여부 (자동 복구 매커니즘)
- 캐시: 응답 결과 리소스를 캐싱해서 사용해도 되는지 여부
