---
title: "@Configuration이 싱글톤을 보장하는 방법 - 바이트코드 조작"
description: "다음 AppConfig 코드를 보자. memberService 빈과 orderService 빈을 만드는 코드를 보면 둘 다 memberRepository() 메서드를 호출한다."
pubDate: 2025-01-14T16:11:15+09:00
category: "스프링/기본"
tags: ["빈", "싱글톤"]
---

다음 AppConfig 코드를 보자.

```java
@Configuration
public class AppConfig {

    @Bean
    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), discountPolicy());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
    ...
}
```

memberService 빈과 orderService 빈을 만드는 코드를 보면 둘 다 memberRepository() 메서드를 호출한다. 이 메서드를 호출하면 new MemoryMemberRepository()를 호출하는데, 이는 결과적으로 <strong>서로 다른 MemoryMemberRepository 2개가 생성</strong>되면서 싱글톤이 깨지는 것처럼 보인다. 스프링 컨테이너는 이 문제를 어떻게 해결할까?

일단 두 인스턴스가 서로 다른 인스턴스인지 테스트해 보자.

```java
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    ...

    public MemberRepository getMemberRepository() {
        return memberRepository;
    }
}
```

```java
public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository;

    ...

    public MemberRepository getMemberRepository() {
        return memberRepository;
    }
}
```

테스트 용도로 각각의 memberRepository 인스턴스를 반환하는 메서드를 추가했다.

```java
@Test
void configurationTest() {
    ApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);

    MemberServiceImpl memberService = ac.getBean("memberService", MemberServiceImpl.class);
    OrderServiceImpl orderService = ac.getBean("orderService", OrderServiceImpl.class);
    MemberRepository memberRepository = ac.getBean("memberRepository", MemberRepository.class);

    assertThat(memberService.getMemberRepository()).isSameAs(memberRepository);
    assertThat(orderService.getMemberRepository()).isSameAs(memberRepository);
}
```

실행해 보면 memberRepository 인스턴스는 모두 **같은 인스턴스가 공유**되어 사용된다는 것을 알 수 있다.

---

AppConfig 코드를 보면 분명 각각 2번 new MemoryMemberRepository를 호출해서 다른 인스턴스가 생성될 것 같은데 아니었다.

그렇다면 new MemoryMemberRepository 코드 자체가 호출되지 않았던 것일까? 테스트해 보자.

```java
public class AppConfig {

    @Bean
    public MemberService memberService() {
        System.out.println("AppConfig.memberService");
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public OrderService orderService() {
        System.out.println("AppConfig.orderService");
        return new OrderServiceImpl(memberRepository(), discountPolicy());
    }

    @Bean
    public MemberRepository memberRepository() {
        System.out.println("AppConfig.memberRepository");
        return new MemoryMemberRepository();
    }
    ...
}
```

스프링 컨테이너는 @Bean이 붙은 메서드를 각각 호출해서 스프링 빈을 생성하기 때문에 memberRepository() 메서드는 다음과 같이 **총 "3번"** 호출되지 않을까?

```java
AppConfig.memberService
AppConfig.memberRepository // memberService()에서 호출
AppConfig.orderService
AppConfig.memberRepository // orderService()에서 호출
AppConfig.memberRepository // memberRepository()에서 호출
```

그런데 실제로는 <strong>"1번"</strong>만 호출된다.

```java
AppConfig.memberService
AppConfig.memberRepository // 1번만 호출
AppConfig.orderService
```

어떻게 한 것일까?

> **마법의 바이트코드 조작 라이브러리 - CGLIB**

스프링 컨테이너는 싱글톤 레지스트리다. 따라서 스프링 빈이 싱글톤이 되도록 보장해주어야 한다. 그런데 스프링이 자바 코드까지 어떻게 하기는 어렵다. 저 코드만 보면 3번 호출되어야 하는 것이 맞다. 그래서 스프링은 <strong>클래스의 바이트코드를 조작하는 라이브러리</strong>를 사용한다. 모든 비밀은 <strong>"@Configuration"</strong>을 적용한 AppConfig에 있다.

AppConfig 스프링 빈을 조회해서 클래스 정보를 출력해 보자.

```java
@Test
void test() {
    ApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);
    // AnnotationConfigApplicationContext에 파라미터로 넘긴 값은 스프링 빈으로 등록된다.
    // 그래서 AppConfig도 스프링 빈으로 등록된다.
    AppConfig bean = ac.getBean(AppConfig.class);

    System.out.println(bean.getClass());
}
```

일반 클래스라면 "class com.spring.study.AppConfig" 여기 까지만 출력되어야 하지만, 실제 AppConfig 클래스는 여기에 추가로 <strong>"SpringCGLIB"</strong>이 붙으면서 복잡해진 것을 볼 수 있다.

```html
class com.spring.study.AppConfig$$SpringCGLIB$$0
```

이것은 스프링이 **CGLIB**라는 바이트코드 조작 라이브러리를 사용해서 AppConfig 클래스를 "상속"받은 임의의 프록시 클래스를 만들고,

그 프록시 클래스를 스프링 빈으로 등록한 것이다!

> 위에서 AppConfig.class 타입으로 조회가 되었던 이유도 AppConfig 클래스를 "상속"받은 자식 클래스이기 때문이다.

아마도 그 임의의 클래스는 다음과 같이 바이트코드를 조작해서 작성되어 있을 것이다.

```java
...

    @Bean
    public MemberRepository memberRepository() {
        if (memoryMemberRepository가 이미 스프링 컨테이너에 등록되어 있으면?) {
            return 스프링 컨테이너에서 찾아서 반환;
        } else { // 스프링 컨테이너에 없으면
            기존 로직을 호출해서 MemoryMemberRepository를 생성하고, 스프링 컨테이너에 등록
            return 반환
        }
    }

...
```

즉, @Bean이 붙은 메서드마다 이미 스프링 빈이 존재하면 해당 빈을 반환하고, 존재하지 않으면 새로 생성 후 스프링 빈으로 등록하고 반환하는 코드가 동적으로 만들어진다. 이렇게 바이트코드를 조작한 덕분에 **싱글톤이 보장**되는 것이다.

> **@Configuration을 빼면 어떻게 될까?**

AppConfig 클래스에 @Configuration을 붙이면 바이트코드 조작 라이브러리 CGLIB 기술을 사용해서 싱글톤을 보장하지만, 만약 **@Configuration 없이 @Bean만 적용**하면 어떻게 될까?

AppConfig 클래스의 @Configuration을 빼고 위의 테스트를 돌려보자.

```html
class com.spring.study.AppConfig
```

이 출력 결과를 통해서 @Configuration을 뺀 AppConfig는 CGLIB 기술 없이 **순수 클래스로 스프링 빈에 등록**된 것을 확인할 수 있다.

따라서 memberRepository()도 총 3번 호출되고, 각각의 memberRepository 인스턴스도 다르다. (싱글톤이 보장되지 않는다.)

---

## 결론

- @Configuration을 빼고 @Bean만 사용해도 스프링 빈으로 등록되지만, **싱글톤**은 보장하지 않는다.
- 싱글톤을 보장하려면 AppConfig에 **@Configuration**을 붙여야 한다!
- @Configuration은 바이트코드 조작 라이브러리 CGLIB 기술을 사용해서 싱글톤을 보장한다.
- CGLIB은 기존 클래스를 상속한 **프록시 클래스**를 생성하고, 해당 프록시 클래스를 스프링 빈으로 등록한다.
- 이미 빈이 존재하면 해당 빈을 반환하고, 존재하지 않으면 새로 빈을 생성, 등록하고 반환하는 동적인 코드
