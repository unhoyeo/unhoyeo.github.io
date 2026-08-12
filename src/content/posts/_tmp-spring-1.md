---
title: 스프링 시큐리티 필터 체인
description: 시안 확인용 임시 글입니다.
pubDate: 2026-08-11
category: 스프링/시큐리티
tags: ['security']
draft: true
---

필터 체인이 어떤 순서로 도는지 정리한다.

```java
http.securityMatcher("/api/**").authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
```
