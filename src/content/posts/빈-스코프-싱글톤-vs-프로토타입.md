---
title: "빈 스코프 - 싱글톤 vs 프로토타입"
description: "스코프는 빈이 존재할 수 있는 범위를 뜻한다. 예를 들어 싱글톤은 스프링 컨테이너의 시작과 함께 생성되어서 스프링 컨테이너가 종료될 때까지 유지되는 스코프다. 스프링은 다음과 같이 다양한 스코프를 지원한다."
pubDate: 2025-02-13T19:53:14+09:00
category: "스프링/기본"
tags: []
---

스코프는 빈이 존재할 수 있는 범위를 뜻한다.

예를 들어 싱글톤은 스프링 컨테이너의 시작과 함께 생성되어서 스프링 컨테이너가 종료될 때까지 유지되는 스코프다.

스프링은 다음과 같이 다양한 스코프를 지원한다.

- **singleton** : 기본 스코프, 스프링 컨테이너의 시작부터 종료까지 유지되는 가장 넓은 범위의 스코프
- **prototype** : 스프링 컨테이너는 빈의 생성과 의존관계 주입까지만 관여하고 더는 관리하지 않는 매우 짧은 범위의 스코프
- **request** : 웹 요청이 들어오고 나갈 때까지 유지되는 스코프
- **session** : 웹 세션이 생성되고 종료될 때까지 유지되는 스코프이다.
- **application** : 웹의 서블릿 컨텍스트와 같은 범위로 유지되는 스코프이다.

빈 스코프는 다음과 같이 지정할 수 있다.

```java
// 자동 등록
@Scope("prototype")
@Component
public class ExampleBean { ... }

// 수동 등록
@Scope("prototype")
@Bean
PrototypeBean ExampleBean() {
    return new ExampleBean();
}
```

> **싱글톤 vs 프로토타입**

## 싱글톤 빈을 조회하는 경우

1. 싱글톤 스코프의 빈을 스프링 컨테이너에 요청한다.
2. 스프링 컨테이너는 본인이 관리하는 스프링 빈을 반환한다.
3. 이후에 스프링 컨테이너에 같은 요청이 와도 항상 같은 객체 인스턴스의 스프링 빈을 반환한다.

## 프로토타입 빈을 조회하는 경우

1. 프로토타입 스코프의 빈을 스프링 컨테이너에 요청한다.
2. 스프링 컨테이너는 이 시점에 프로토타입 빈을 생성하고, 필요한 의존관계를 주입하고, 초기화 메서드를 호출한다.
3. 스프링 컨테이너는 생성한 프로토타입 빈을 클라이언트에 반환한다.
4. 이후에 스프링 컨테이너에 같은 요청이 오면 항상 새로운 프로토타입 빈을 생성해서 반환한다.

여기서의 핵심은 스프링 컨테이너는 프로토타입 빈의 생성, 의존관계 주입, 초기화까지만 처리한다는 것이다!

- 스프링 컨테이너는 클라이언트에게 빈을 반환한 이후에는 생성된 프로토타입 빈을 관리하지 않는다.
- 프로토타입 빈을 관리할 책임은 프로토타입 빈을 받은 클라이언트에게 있다.
- 따라서 **@PreDestroy 같은 종료 메서드가 호출되지 않는다.**

테스트로 두 스코프의 차이를 느껴보자.

```java
public class ScopeTest {

    @Test
    void singletonTest() {
        // given
        AnnotationConfigApplicationContext ac =
                new AnnotationConfigApplicationContext(SingletonBean.class);

        // when
        SingletonBean bean1 = ac.getBean(SingletonBean.class);
        System.out.println("bean1 = " + bean1);
        SingletonBean bean2 = ac.getBean(SingletonBean.class);
        System.out.println("bean2 = " + bean2);
        ac.close();

        // then
        Assertions.assertThat(bean1).isSameAs(bean2);
    }

    @Test
    void prototypeTest() {
        // given
        AnnotationConfigApplicationContext ac =
                new AnnotationConfigApplicationContext(PrototypeBean.class);

        // when
        PrototypeBean bean1 = ac.getBean(PrototypeBean.class);
        System.out.println("bean1 = " + bean1);
        PrototypeBean bean2 = ac.getBean(PrototypeBean.class);
        System.out.println("bean2 = " + bean2);
        ac.close();

        // then
        Assertions.assertThat(bean1).isNotSameAs(bean2);
    }

//    @Scope("singleton") // 기본값이 싱글톤 스코프이므로 지정하지 않아도 된다.
//    @Component // 이미 설정 클래스에 지정했으므로 자동으로 컴포넌트 스캔 대상에 들어간다.
    static class SingletonBean {

        @PostConstruct
        public void init() {
            System.out.println("SingletonBean.init");
        }

        @PreDestroy
        public void destroy() {
            System.out.println("SingletonBean.destroy");
        }
    }

    @Scope("prototype")
    static class PrototypeBean {

        @PostConstruct
        public void init() {
            System.out.println("PrototypeBean.init");
        }

        @PreDestroy
        public void destroy() {
            System.out.println("PrototypeBean.destroy");
        }
    }
}
```

싱글톤 테스트를 실행해보면 다음과 같은 결과가 나온다.

> SingletonBean.init
> bean1 = com.spring.study.ScopeTest$SingletonBean@7862f56
> bean2 = com.spring.study.ScopeTest$SingletonBean@7862f56
> SingletonBean.destroy

- 컴포넌트 스캔에 의해 스프링 컨테이너에 자동 등록될 때 빈의 초기화 메서드가 호출되었다.
- 조회할 때마다 **같은 인스턴스의 빈**이 조회되었다.
- 스프링 컨테이너가 관리하기 때문에 스프링 컨테이너가 종료될 때 빈의 종료 메서드가 호출되었다.

반면에 프로토타입 테스트를 실행해 보면 결과가 다르다.

> PrototypeBean.init
> bean1 = com.spring.study.ScopeTest$PrototypeBean@765f05af
> PrototypeBean.init
> bean2 = com.spring.study.ScopeTest$PrototypeBean@62f68dff

- 스프링 컨테이너에서 **조회할 때마다 새로 생성**되고 초기화 메서드가 호출되었다.
- 조회할 때마다 완전히 새로운 스프링 빈이 생성되기 때문에 초기화 메서드도 2번 호출되었다.
- 스프링 컨테이너가 프로토타입 빈 생성, 의존관계 주입, 초기화까지만 관여하기 때문에 스프링 컨테이너가 종료될 때 @PreDestroy 같은 종료 메서드가 호출되지 않았다.

그래서 프로토타입 빈은 프로토타입 빈을 조회한 클라이언트가 관리해야 하고, 종료 메서드에 대한 호출도 클라이언트가 직접 해야 한다.

> **프로토타입 빈 - 싱글톤 빈과 함께 사용 시 문제점**

예를 들어 clientBean이라는 싱글톤 빈이 의존관계 주입을 통해서 프로토타입 빈을 주입받아서 사용한다고 가정하자.

```java
public class SingletonWithPrototypeBeanTest {

    @Test
    void test() {
        // given
        AnnotationConfigApplicationContext ac =
                new AnnotationConfigApplicationContext(ClientBean.class, PrototypeBean.class);

        // when
        ClientBean clientBean1 = ac.getBean(ClientBean.class);
        int count1 = clientBean1.logic();

        ClientBean clientBean2 = ac.getBean(ClientBean.class);
        int count2 = clientBean2.logic();

        // then
        assertThat(count1).isEqualTo(1);
        assertThat(count2).isEqualTo(2);
    }

    @Scope("singleton")
    @RequiredArgsConstructor // 의존관계 자동 주입(생성자 주입)
    static class ClientBean {

        private final PrototypeBean prototypeBean; // 생성 시점에 주입

        public int logic() {
            prototypeBean.addCount();
            return prototypeBean.getCount();
        }
    }

    @Scope("prototype")
    @Getter
    static class PrototypeBean {

        private int count = 0;

        public void addCount() {
            count++;
        }
    }
}
```

- clientBean은 싱글톤이므로 스프링 컨테이너 생성 시점에 함께 생성되고 의존관계 주입도 발생한다.
- 의존관계 주입 시점에 스프링 컨테이너에게 프로토타입 빈을 요청한다.
- 스프링 컨테이너는 프로토타입 빈을 새로 생성해서 반환한다. (이때 프로토타입 빈의 count 값은 0)
- 이제 clientBean은 프로토타입 빈(정확히는 참조값)을 내부 필드에 보관한다.

- 클라이언트 A가 clientBean을 스프링 컨테이너에 요청해서 받는다. (싱글톤이므로 항상 같은 clientBean이 반환된다.)
- clientBean.logic()을 호출하면, 프로토타입 빈의 addCount()를 호출해서 count 값이 1이 된다.

- 클라이언트 B도 clientBean을 스프링 컨테이너에 요청해서 받는다. (싱글톤이므로 항상 같은 clientBean이 반환된다.)
- 여기서 중요한 점은 clientBean이 내부에 가지고 있는 프로토타입 빈은 이미 과거에 주입이 끝난 빈이다.
- 주입 시점에 스프링 컨테이너에 요청해서 프로토타입 빈이 새로 생성된 것이지, **사용할 때마다 새로 생성되는 것이 아니다!**
- 클라이언트 B는 clientBean.logic()을 호출한다.
- clientBean.logic()을 호출하면, 프로토타입 빈의 addCount()를 호출해서 count 값이 2가 된다.

싱글톤 빈은 생성 시점에만 의존관계 주입을 받기 때문에 프로토타입 빈이 새로 생성되기는 하지만, 싱글톤 빈과 함께 계속 유지된다.

우리는 프로토타입 빈을 이러려고 사용하는 것이 아니다. 이럴 거면 그냥 싱글톤 빈을 사용하지 굳이 프로토타입 빈을 사용할 이유가 없다.

프로토타입 빈을 주입 시점에만 새로 생성하는 게 아니라, 사용할 때마다 새로 생성해서 사용하려면 어떻게 해야 할까?

좀 무식하지만 가장 간단한 방법은 프로토타입 빈을 사용할 때마다 스프링 컨테이너에 새로 요청하는 것이다.

스프링 컨테이너인 ApplicationContext 자체를 의존관계 주입받아서 사용하면 된다.

```java
@Scope("singleton")
@RequiredArgsConstructor
static class ClientBean {

    private final ApplicationContext ac;

    public int logic() {
        PrototypeBean prototypeBean = ac.getBean(PrototypeBean.class);
        prototypeBean.addCount();
        return prototypeBean.getCount();
    }
}
```

실행해보면 ac.getBean()을 통해 항상 새로운 프로토타입 빈이 생성되는 것을 확인할 수 있다. 이렇게 의존관계를 외부에서 주입(DI) 받는 것이 아니라, 필요한 의존관계를 직접 찾는 것을 <strong>Dependency Lookup(DL), 의존관계 조회(탐색)</strong>이라 한다.

그런데 이렇게 되면 스프링 컨테이너에 종속적인 코드가 되고, 단위 테스트도 어려워진다.

지금 필요한 기능은 특정 프로토타입 빈을 컨테이너에서 대신 찾아주는, 딱 DL 정도의 기능이다.

> **프로토타입 빈 - 싱글톤 빈과 함께 사용 시 ObjectProvider로 문제 해결**

지정한 빈을 컨테이너에서 대신 찾아주는 DL 서비스를 제공하는 것이 바로 **ObjectProvider**이다.

```java
@Scope("singleton")
@RequiredArgsConstructor
static class ClientBean {

    private final ObjectProvider<PrototypeBean> prototypeBeanProvider;

    public int logic() {
        PrototypeBean prototypeBean = prototypeBeanProvider.getObject();
        prototypeBean.addCount();
        return prototypeBean.getCount();
    }
}
```

실행해보면 prototypeBeanProvider.getObject()를 통해 항상 새로운 프로토타입 빈이 생성되는 것을 확인할 수 있다.

ObjectProvider의 <strong>getObject()</strong>를 호출하면 내부에서는 스프링 컨테이너를 통해 해당 빈을 찾아서 반환한다. (DL)

스프링이 제공하는 기능을 사용하지만, 기능이 단순하므로 단위 테스트를 만들거나 mock 코드를 만들기는 훨씬 쉬워진다.

ObjectProvider는 프로토타입 빈에서 사용한다는 것이 핵심이 아니다. 핵심은 스프링 컨테이너를 통해 특정 빈을 찾아주는 과정을 간단하게 도와주는 것이다. 즉, 내가 직접 조회하는 것보다는 대신 조회하는 것이다.

> 참고로 과거에는 ObjectFactory가 있었는데 여기에 편의 기능을 추가해서 ObjectProvider가 만들어졌다.

> **자바 표준 Provider로도 가능!**

**javax.inject.Provider**라는 JSR-330 자바 표준을 사용하는 방법이다. 스프링 부트 3.x은 **jakarta.inject.Provider**를 사용한다.

이 방법을 사용하려면 다음 라이브러리를 build.gradle 파일에 추가해야 한다.

```java
// 스프링부트 3.0 미만
implementation 'javax.inject:javax.inject:1'

// 스프링부트 3.0 이상
implementation 'jakarta.inject:jakarta.inject-api:2.0.1'
```

기존 코드에서 ObjectProvider 대신 <strong>Provider</strong>를, getObject() 대신 <strong>get()</strong>을 사용하면 된다.

```java
@Scope("singleton")
@RequiredArgsConstructor
static class ClientBean {

    private final Provider<PrototypeBean> prototypeBeanProvider;

    public int logic() {
        PrototypeBean prototypeBean = prototypeBeanProvider.get();
        prototypeBean.addCount();
        return prototypeBean.getCount();
    }
}
```

실행해보면 prototypeBeanProvider.get()을 통해 항상 새로운 프로토타입 빈이 생성되는 것을 확인할 수 있다.

Provider의 get()을 호출하면 내부에서는 스프링 컨테이너를 통해 해당 빈을 찾아서 반환한다. (DL)

- 기능이 단순하므로 단위테스트를 만들거나 mock 코드를 만들기는 훨씬 쉬워진다.
- 자바 표준이므로 스프링이 아닌 다른 컨테이너에서도 사용할 수 있다.
- 하지만 **별도의 라이브러리**가 필요하다는 단점이 존재한다.

> **프로토타입 빈은 언제 사용할까?**

매번 사용할 때마다 의존관계 주입이 완료된 새로운 객체가 필요하면 사용하면 된다.

(하지만 싱글톤 빈으로 대부분의 문제를 해결할 수 있기 때문에 프로토타입 빈을 직접적으로 사용하는 일은 매우 드물다.)

또한 ObjectProvider, Provider는 프로토타입 빈에서 뿐만 아니라 DL이 필요한 경우에 언제든지 사용할 수 있다.

추가적으로, Provider를 사용함으로써 얻는 이점은 다음과 같다.

- 여러 인스턴스를 찾을 수 있다.
- 인스턴스를 지연해서 찾거나 선택적으로 찾을 수 있다.
- 순환 의존관계를 해결할 수 있다. (A가 B를 의존하는 동시에 B가 A를 의존하는 경우)
- 범위를 추상화함으로써 포함하는 범위의 인스턴스에서 더 작은 범위의 인스턴스를 찾을 수 있다.
