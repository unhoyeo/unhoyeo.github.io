---
title: "스프링은 어떻게 OCP, DIP를 지킬까? - DI(의존관계 주입)"
pubDate: 2025-01-05T19:40:15+09:00
category: "스프링/기본"
tags: ["DI"]
---

결론부터 말하자면, 스프링은 다음 기술로 다형성과 OCP, DIP를 가능하게 해 준다.

- **DI**(Dependency Injection): 의존관계 주입
- **DI 컨테이너**: 자바 객체들의 의존관계 연결, 주입

이 기술들을 통해 클라이언트 코드의 변경 없이 기능을 확장할 수 있는 것이다.

옛날 어떤 개발자가 좋은 객체지향 프로그래밍을 하려고 OCP, DIP를 지키면서 개발해 보니, 배보다 배꼽이 큰 상황인 것이다. 그래서 이를 프레임워크로 만들어버렸고, 그것이 지금의 스프링이 되었다. 순수하게 자바로 OCP, DIP를 지키면서 개발해 보면 결국 스프링 프레임워크를 만들게 된다. (정확히는 DI 컨테이너) 이제부터 이것이 어떻게 만들어졌는지 코드로 이해해 보자.

---

어떤 회원 서비스에 회원 저장소로 **메모리 회원 저장소**와 **JDBC 회원 저장소**가 있다고 가정해 보자. 다형성을 활용하여 역할과 구현을 분리(인터페이스와 구현 객체를 분리)해서 다음과 같이 개발할 수 있다.

```java
public class MemberServiceImpl implements MemberService {

    private MemberRepository memberRepository = new MemoryMemberRepository();
}
```

하지만 나중에 저장소를 변경하려면 다음과 같이 **클라이언트(MemberServiceImpl) 코드를 고쳐야 한다. (OCP 위반!)**

```java
public class MemberServiceImpl implements MemberService {

//    private MemberRepository memberRepository = new MemoryMemberRepository();
    private MemberRepository memberRepository = new JdbcMemberRepository();
}
```

또한 MemberServiceImpl은 MemberRepository 인터페이스(추상화) 뿐만 아니라 구현 클래스 MemoryMemberRepository와 JdbcMemberRepository(구체화)에도 함께 의존하고 있다. (<strong>DIP 위반!</strong>)

> 어떻게 해결할 수 있을까?

이 문제를 해결하려면 다음과 같이 클라이언트 코드가 인터페이스(추상화)에만 의존하도록 변경하면 된다.

```java
public class MemberServiceImpl implements MemberService {

    private MemberRepository memberRepository; // 인터페이스에만 의존
}
```

그런데 구현체가 없는데 어떻게 실행할 수 있을까? 실제로 실행을 해보면 **NPE가 발생**한다. 이 문제를 해결하려면 누군가가 클라이언트인 MemberServiceImpl에 MemberRepository를 구현한 객체를 대신 생성하고 주입해주어야 한다. (**DI**)

---

애플리케이션을 **공연**으로, 인터페이스를 **배역**이라고 생각해 보자. 배역은 누가 정할까? 배우가 직접 정할까? NO! 이전 코드는 마치 로미오 역할의 디카프리오가 줄리엣 역할의 여자 주인공을 직접 정하는 것과 같다. 다시 말해, 디카프리오는 공연도 해야 하고 여자 주인공도 직접 초빙해야 하는 다양한 책임을 가지고 있는 것이다.

배우는 본인의 역할인 배역을 수행하는 것에만 집중해야 한다. 디카프리오는 어떤 여자 주인공이 선택되더라도 똑같이 공연을 할 수 있어야 한다. 공연을 구성하고 역할에 맞는 배우를 지정하는 책임은 별도의 사람(감독)이 담당해야 한다. 지금의 MemberServiceImpl는 구현 객체를 생성, 연결, 실행하는 다양한 책임을 가지고 있다. <strong>(SRP 위반!</strong>)

> **책임을 분리하자!**

**AppConfig**라는 별도의 클래스를 만들어서 구현 객체를 생성, 연결하는 책임은 AppConfig가, 실행하는 책임은 담당 클라이언트 객체가 담당하도록 책임을 분리해 보자.

```java
public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
}
```

AppConfig는 다음과 같은 책임을 가진다.

1. **객체 생성**: 애플리케이션의 실제 동작에 필요한 구현 객체를 생성한다.

- MemberServiceImpl
- MemoryMemberRepository

2. <strong>객체 연결</strong>: 생성한 객체 인스턴스의 참조(레퍼런스)를 생성자를 통해서 주입(연결)해준다.

- MemberServiceImpl ← MemoryMemberRepository

이를 클라이언트인 MemberServiceImpl 입장에서 보면 의존관계를 마치 외부에서 주입해 주는 것 같다고 해서 **DI(Dependency Injection), 의존관계 주입** 또는 의존성 주입이라 한다.

```java
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```

이렇게 이전 코드에서 생성자만 추가해 주면 MemberServiceImpl은 더 이상 MemoryMemberRepository를 의존하지 않는다. 단지 **MemberRepository 인터페이스만 의존**한다. MemberServiceImpl 입장에서 생성자를 통해 어떤 구현 객체가 들어올지는 알 수 없다. 오직 외부인 AppConfig에 의해서만 결정된다. MemberServiceImpl은 이제부터 의존관계에 대한 고민은 외부에 맡기고, 실행에만 집중하면 된다.

---

AppConfig의 등장으로 애플리케이션이 크게 **사용 영역**과, 객체를 생성하고 구성하는 **구성 영역**으로 분리되었다. 다음과 같이 MemoryMemberRepository에서 JdbcMemberRepository로 변경해도 구성 영역만 영향을 받고, 사용 영역은 영향을 받지 않는다.

```java
public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    public MemberRepository memberRepository() {
//        return new MemoryMemberRepository();
        return new JdbcMemberRepository();
    }
}
```

이제 회원 저장소를 변경해도 애플리케이션의 구성 역할을 담당하는 AppConfig의 코드만 변경하면 된다. 클라이언트 코드인 MemberServiceImpl를 포함해서 **사용 영역의 어떤 코드도 변경할 필요가 없다.** (구성 영역은 당연히 변경된다. 구성 역할을 담당하는 AppConfig를 감독이라고 생각하자. 감독은 배우(구현 객체)들을 모두 알고 있어야 한다.)

---

우리는 이렇게 애플리케이션을 설계함으로써 <strong>SRP, OCP, DIP</strong>를 지킬 수 있게 되었다. 구현 객체를 생성, 연결하는 책임을 AppConfig가 담당함으로써 SRP를, 클라이언트 코드를 인터페이스에만 의존하도록 바꾸고 AppConfig가 의존관계 주입(DI)을 해줌으로써 OCP, DIP를 지켰다. 여기서 다음 개념들을 함께 가져가자.

> <strong>IoC (Inversion of Control)</strong>제어의 역전

기존에는 클라이언트 구현 객체가 스스로 필요한 서버 구현 객체를 생성하고, 연결하고, 실행했다. 한마디로 구현 객체가 프로그램의 제어 흐름을 스스로 조종했다.

반면에 AppConfig가 등장한 이후, 구현 객체는 자신의 로직을 실행하는 역할만 담당한다. **프로그램의 제어 흐름은 이제 AppConfig가 가져간다.** 예를 들어 MemberServiceImpl은 필요한 인터페이스를 호출하지만 어떤 구현 객체가 실행될지는 모른다. 프로그램의 제어 흐름에 대한 권한은 모두 AppConfig가 가지고 있다.

이렇게 프로그램의 제어 흐름을 직접 제어하는 것이 아니라, 외부에서 관리하는 것을 제어의 역전(IoC)이라 한다.

> <strong>클래스 의존관계, 객체 의존관계,
> DI (Dependency Injection)</strong>의존관계 주입

의존관계는 정적인 **클래스 의존관계**와, 실행 시점에 결정되는 동적인 **객체 의존관계**로 분리해서 생각해야 한다.

정적인 클래스 의존관계는 애플리케이션을 실행하지 않아도, 클래스가 사용하는 import 코드만 보고 의존관계를 쉽게 분석할 수 있다. 그런데 이러한 클래스 의존관계만으로는 **실제로 어떤 객체가 주입될지는 알 수 없다.**

동적인 객체 의존관계는 애플리케이션 실행 시점에 실제 생성된 객체 인스턴스의 참조가 연결된 의존관계다. 여기서 애플리케이션 실행 시점에 외부에서 실제 구현 객체를 생성하고, 그 참조값을 클라이언트에 전달해서 클라이언트와 서버의 실제 의존관계가 연결되는 것을 의존관계 주입이라 한다.

의존관계 주입을 사용하면 정적인 **클래스 의존관계를 변경하지 않고,** 동적인 **객체 인스턴스 의존관계를 쉽게 변경**할 수 있다.

> **DI 컨테이너**또는 IoC 컨테이너

AppConfig처럼 <strong>"객체 생성, 관리, 의존관계 연결"</strong>해 주는 것을 DI 컨테이너 또는 IoC 컨테이너라 한다.
