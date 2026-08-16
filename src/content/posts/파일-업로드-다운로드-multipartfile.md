---
title: "파일 업로드, 다운로드 – MultipartFile"
description: "웹 애플리케이션에서 파일 업로드를 구현하는 것은 매우 일반적인 요구사항이다. 파일 업로드를 이해하려면 먼저 HTML 폼(Form)이 데이터를 서버로 전송하는 두 가지 주요 방식의 차이를 알아야 한다."
pubDate: 2025-09-07T15:32:16+09:00
category: "스프링/MVC"
tags: []
---

웹 애플리케이션에서 파일 업로드를 구현하는 것은 매우 일반적인 요구사항이다.

파일 업로드를 이해하려면 먼저 <strong>HTML 폼(Form)</strong>이 데이터를 서버로 전송하는 <strong>두 가지 주요 방식</strong>의 차이를 알아야 한다.

---

## HTML &lt;form> 태그의 enctype 속성

&lt;form> 태그의 enctype 속성은 **폼 데이터를 서버로 전송할 때 어떤 방식(인코딩 타입)으로 전송할지**를 지정하는 속성이다.

즉, 해당 속성의 값에 따라 다른 방식으로 폼 데이터를 전송할 수 있다.

enctype 속성은 다음과 같은 속성값을 가질 수 있다.

- **application/x-www-form-urlencoded (기본값)**
  - 모든 문자(키와 값)를 **URL 인코딩**하여 전송 (공백은 +로, 특수문자는 %로 시작하는 16진수 형태로 인코딩)
- **multipart/form-data**
  - 폼 데이터를 **여러 개의 파트(multipart)로 나누어** 전송 (각 파트에 개별 Content-Type과 Content-Disposition 포함)
  - **파일 업로드 시 필수** (&lt;input type="file"> 사용 시)
  - 텍스트, 바이너리(이미지, 동영상 등) 모두 전송 가능
  - **URL 인코딩을 하지 않아** 파일 손상 방지
- **text/plain**
  - 단순 텍스트 형태로 전송 (공백은 +로 변환하지만, 특수문자는 인코딩하지 않음)
  - 거의 사용되지 않음 (보안 문제, 인코딩 호환성 낮음)

> 참고로 이 속성은 &lt;form> 요소의 method 속성값이 "post"인 경우에만 사용할 수 있다.

---

## application/x-www-form-urlencoded

- HTML 폼의 **기본 전송 방식**
- 모든 폼 데이터를 **key=value&key2=value2** 형태의 **하나의 긴 문자열**로 만들어 HTTP Body에 담아 전송함
- 이미지나 동영상 같은 **바이너리(binary) 데이터**는 전송할 수 없음

```html
<!-- enctype 속성 미지정 시 application/x-www-form-urlencoded -->
<form action="/upload" method="post">
  <input type="text" name="username"/>
  <input type="text" name="age"/>
  <button type="submit">저장</button>
</form>
```

```java
// 웹 브라우저가 생성한 HTTP 요청 메시지
POST /upload HTTP/1.1
Host: localhost:8080
Content-Type: application/x-www-form-urlencoded

username=kim&age=25
```

---

## multipart/form-data

- **파일 업로드**를 위해 반드시 사용해야 하는 전송 방식
- 이름에서 알 수 있듯이, 전송 데이터를 <strong>여러 부분(Part)</strong>으로 나눔
- 각 Part는 **자신만의 헤더**(Content-Disposition, Content-Type 등)와 **데이터**를 가지며, **boundary**라는 고유한 문자열로 구분됨
- 이를 통해 **문자 데이터**와 **바이너리 데이터**를 하나의 HTTP 요청에 담아 **동시에 전송 가능**

```html
<form action="/upload" method="post" enctype="multipart/form-data">
  <input type="text" name="username"/>
  <input type="text" name="age"/>
  <input type="file" name="attachFile"/>
  <button type="submit">저장</button>
</form>
```

```java
// 웹 브라우저가 생성한 HTTP 요청 메시지
POST /upload HTTP/1.1
Host: localhost:8080
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary4TE9MyZNwg9G4bcI
Content-Length: 12547

------WebKitFormBoundary4TE9MyZNwg9G4bcI
Content-Disposition: form-data; name="username"

kim
------WebKitFormBoundary4TE9MyZNwg9G4bcI
Content-Disposition: form-data; name="age"

25
------WebKitFormBoundary4TE9MyZNwg9G4bcI
Content-Disposition: form-data; name="file"; filename="test.jpg"
Content-Type: image/jpeg

2g34dt2f46ib2nmc45j3cd4g5gl23h45vfgh4f...
------WebKitFormBoundary4TE9MyZNwg9G4bcI--
```

> 마지막 boundary에는 끝에 --가 추가된다.

---

## ✅ 서블릿의 파일 업로드 – Part

HttpServletRequest의 **getParts()** 메서드를 통해 multipart/form-data 요청의 각 Part를 **Part 객체의 컬렉션**으로 받을 수 있다.

```java
@Slf4j
@Controller
public class ServletFileController {

    // application.properties에 설정한 값을 주입
    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping("/upload")
    public String uploadForm() {
        return "upload-form";
    }

    @PostMapping("/upload")
    public String upload(HttpServletRequest request) throws ServletException, IOException {
        // multipart/form-data 요청의 HttpServletRequest 구현체는
        // StandardMultipartHttpServletRequest
        log.info("request = {}", request);

        // 일반 String 파라미터 가져오기
        String username = request.getParameter("username");
        log.info("username = {}", username);

        // multipart/form-data 요청의 각 Part를 컬렉션으로 받을 수 있음
        Collection<Part> parts = request.getParts();
        for (Part part : parts) {
            // 이 파트에 해당하는 멀티파트 폼의 필드 이름
            String partName = part.getName();
            log.info("partName = {}", partName);

            // 이 파트에 제공된 모든 헤더 이름
            for (String headerName : part.getHeaderNames()) {
                String header = part.getHeader(headerName);
                log.info("header = {}: {}", headerName, header);
            }

            // 브라우저에서 전달한 Content-Type (정의되지 않은 경우 null)
            String contentType = part.getContentType();
            log.info("contentType = {}", contentType);

            // 이 파트의 크기
            long partSize = part.getSize();
            log.info("partSize = {}", partSize);

            // 파일 내용(body)에 대한 InputStream → String으로 변환
            InputStream inputStream = part.getInputStream();
            String body = StreamUtils.copyToString(
                    inputStream,
                    StandardCharsets.UTF_8
            );
            log.info("body = {}", body);

            // 업로드 시 제출된 파일 이름 (파일 업로드가 아닌 경우 null)
            String fileName = part.getSubmittedFileName();
            if (StringUtils.hasText(fileName)) {
                log.info("fileName = {}", fileName);
                // 파일을 저장할 경로
                String fullPath = uploadDir + fileName;
                log.info("fullPath = {}", fullPath);
                // 업로드된 파트를 디스크에 쓰기
                part.write(fullPath);
            }
        }

        return "upload-form";
    }
}
```

```java
request = org.springframework.web.multipart.support.StandardMultipartHttpServletRequest@47f3ad0e

username = yeo

partName = username
header = content-disposition: form-data; name="username"
contentType = null
partSize = 3
body = yeo

partName = file
header = content-disposition: form-data; name="file"; filename="test.jpg"
header = content-type: image/jpeg
contentType = image/jpeg
partSize = 12175
body = daf675f65s7j3k7fg7......
fileName = test.jpg
fullPath = /Users/yeounho/Documents/test.jpg
```

서블릿의 **Part 인터페이스**는 다음과 같은 주요 메서드를 제공한다.

- **getSubmittedFileName()**: 사용자가 업로드한 **원본 파일명**을 가져옴
- **getInputStream()**: 파일 데이터를 읽을 수 있는 스트림을 반환
- **write(...)**: 파일 데이터를 서버의 특정 경로에 저장

이 방식은 동작 원리를 이해하는 데는 좋지만,

**HttpServletRequest에 직접 의존**해야 하고, **파일 Part만 골라내는** 등 번거로운 코드가 필요하다.

> 일반적인 요청의 경우 HttpServletRequest의 구현체는 **RequestFacade**이지만,
> multipart/form-data 요청이 들어오면, DispatcherServlet은 MultipartResolver를 실행하며,
> MultipartResolver는 서블릿 컨테이너가 전달하는 일반적인 HttpServletRequest를 MultipartHttpServletRequest로 변환한다.
> 스프링이 기본으로 제공하는 StandardServletMultipartResolver는 MultipartHttpServletRequest 인터페이스를 구현한 **StandardMultipartHttpServletRequest**를 반환한다.

---

## ✅ 스프링의 파일 업로드 – MultipartFile

스프링은 **MultipartFile 인터페이스**를 통해 파일 업로드를 매우 간단하게 처리할 수 있도록 추상화했다.

```java
@Slf4j
@Controller
public class SpringFileController {

    ...

    @PostMapping("/upload")
    public String upload(
            @RequestParam String username,
            @RequestParam("file") MultipartFile multipartFile) throws IOException {

        log.info("username = {}", username);
        log.info("multipartFile = {}", multipartFile);

        if (!multipartFile.isEmpty()) {
            // 사용자가 업로드한 원본 파일명
            String originalFilename = multipartFile.getOriginalFilename();

            String fullPath = uploadDir + originalFilename;
            log.info("fullPath = {}", fullPath);

            // 수신된 파일(multipartFile)을 지정된 대상 파일(new File)로 전송
            multipartFile.transferTo(new File(fullPath));
        }

        return "upload-form";
    }
}
```

- ⚠️ **@RequestParam 파라미터**는 HTML &lt;input> 태그의 **name** 속성값과 동일한 이름으로 지정해야 한다.
  - 예를 들어 &lt;input name="**file**" type="file"/>인 경우,
  - @RequestParam("**file**") MultipartFile multipartFile
  - 또는 @RequestParam MultipartFile **file**으로 선언하면,
  - 스프링이 자동으로 해당 Part를 MultipartFile 객체로 변환하여 주입해 준다.
- **@RequestParam**뿐만 아니라, **@ModelAttribute**를 통해서도 MultipartFile 객체를 받을 수 있다.

MultipartFile 인터페이스의 주요 메서드는 다음과 같다.

- **getOriginalFilename()**: 사용자가 업로드한 **원본 파일명**을 가져옴
- **transferTo(new File(path))**: 업로드된 파일을 지정된 대상 파일(new File)로 전송
  - 파일 시스템에서 파일을 **이동**하거나, **복사**하거나, 메모리에 저장된 내용을 대상 파일에 **저장**할 수 있음
  - 대상 파일이 이미 존재하는 경우 먼저 삭제됨

---

## 파일 업로드와 다운로드 구현 시 고려할 실무 전략

안전하고 효율적인 파일 관리를 위해 다음과 같은 실무 전략을 적용할 수 있다.

- **파일 저장 시 "업로드 파일명"과 "저장 파일명" 분리**
  - ⚠️ 서로 다른 사용자가 **같은 이름의 파일**을 업로드하면, 서버에서 파일이 **덮어씌워지는 충돌**이 발생할 수 있다.
    - 또한 악의적인 사용자가 **Directory traversal** 공격을 할 수도 있다. (특정 디렉토리에 접근하여 파일 읽기/쓰기 가능)
  - 따라서 서버에 파일을 저장할 때는 **UUID** 등을 이용하여 **절대 겹치지 않는 고유한 파일명을 생성**하여 사용해야 한다.
    - 사용자가 업로드한 원본 파일명은 **데이터베이스나 별도 객체**에 저장하여, 사용자에게 보여주는 용도로만 사용해야 한다.
    - 예: new FileData(originalFilename, storedFilename)
- **파일 다운로드 시**
  - **이미지 표시 (&lt;img> 태그)**:
    - **UrlResource**를 사용하여 이미지 파일의 **바이너리 데이터를 직접 반환**하면, 웹 브라우저가 &lt;img> 태그를 통해 이미지를 표시할 수 있다.
  - **첨부 파일 다운로드**:
    - 사용자가 파일을 다운로드하게 하려면, HTTP 응답 헤더에 **Content-Disposition: attachment**를 설정해야 한다.
      - 예: Content-Disposition: **attachment**; filename="사용자파일명.jpg"
    - 이 헤더는 브라우저에게 응답 본문을 화면에 표시하지 말고, **지정된 filename으로 다운로드**하라는 신호를 보낸다.
    - ⚠️ 파일명에 한글이나 특수문자가 포함될 수 있으므로, **UriUtils.encode()** 등을 사용하여 안전하게 인코딩해야 한다.
- **다중 파일 업로드 시**
  - HTML 폼에서 &lt;input type="file" **multiple="multiple"**> 속성을 사용하면 **여러 파일을 한 번에 선택**할 수 있다.
  - 컨트롤러에서는 **@ModelAttribute**로 받는 폼 객체의 필드를 **List&lt;MultipartFile> files**와 같이 List 타입으로 선언하면,
    여러 개의 업로드된 파일을 한 번에 받을 수 있다.

위 전략을 적용한 예시 코드는 다음과 같다.

```java
@Data
@AllArgsConstructor
public class FileData {

    private String originalFilename; // 사용자가 업로드한 원본 파일명
    private String storedFilename; // 서버 내부에서 관리하는 파일명
}
```

```java
@Data
@AllArgsConstructor
public class Item {

    private Long id;
    private String itemName;
    private FileData attachFile; // 첨부 파일
    private List<FileData> imageFiles; // 첨부된 이미지들
}
```

```java
@Service
public class FileStoreService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String getFullPath(String storedFilename) {
        return uploadDir + storedFilename;
    }

    public FileData storeFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) return null;

        String originalFilename = file.getOriginalFilename();
        String storedFilename = createStoredFilename(originalFilename);

        // 파일 저장
        file.transferTo(new File(getFullPath(storedFilename)));

        // 파일 정보 반환
        return new FileData(originalFilename, storedFilename);
    }

    public List<FileData> storeAllFiles(List<MultipartFile> files) throws IOException {
        List<FileData> data = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                data.add(storeFile(file));
            }
        }
        return data;
    }

    // 서버 내부에서 관리하는 파일명 생성
    private String createStoredFilename(String originalFilename) {
        return UUID.randomUUID() + "." + extractExt(originalFilename);
    }

    // 원본 파일명에서 확장자 추출 (예: .jpg)
    private String extractExt(String originalFilename) {
        int pos = originalFilename.lastIndexOf(".");
        return (pos == -1) ? "" : originalFilename.substring(pos + 1);
    }
}
```

```java
@Data
public class ItemUploadForm {

    private String itemName;
    private MultipartFile attachFile;
    private List<MultipartFile> imageFiles;
}
```

```java
@Controller
@RequiredArgsConstructor
public class ItemController {

    private final ItemRepository itemRepository;
    private final FileStoreService fileStoreService;

    // 아이템 등록 폼 화면
    @GetMapping("/items/upload")
    public String uploadForm(@ModelAttribute ItemUploadForm form) {
        // 빈 폼 객체를 뷰로 전달 → th:object 바인딩 가능
        return "upload-form";
    }

    // 아이템 등록 처리 → 등록 후 상세 페이지로 리다이렉트
    @PostMapping("/items/upload")
    public String upload(@ModelAttribute ItemUploadForm form,
                         RedirectAttributes redirectAttributes) throws IOException {

        // 단일 첨부파일 저장 (반환값: 저장된 파일 메타데이터)
        FileData attachFile = fileStoreService.storeFile(form.getAttachFile());

        // 다중 이미지 파일 저장 (반환값: 저장된 파일 메타데이터 리스트)
        List<FileData> imageFiles = fileStoreService.storeAllFiles(form.getImageFiles());

        // Item 엔티티 생성 및 데이터 세팅
        Item item = new Item();
        item.setName(form.getItemName());
        item.setAttachFile(attachFile);
        item.setImageFiles(imageFiles);

        // DB에 저장
        itemRepository.save(item);

        // PRG(Post-Redirect-Get) 패턴: 등록 후 새로고침 시 중복 등록 방지
        redirectAttributes.addAttribute("itemId", item.getId());
        return "redirect:/items/{itemId}";
    }

    // 아이템 상세 조회
    @GetMapping("/items/{itemId}")
    public String findItem(@PathVariable Long itemId, Model model) {
        Item item = itemRepository.findById(itemId);
        model.addAttribute("item", item);
        return "item-view";
    }

    // 이미지 파일 다운로드 (브라우저에서 바로 렌더링)
    // 주로 <img src="/images/{filename}"> 방식으로 호출됨
    @GetMapping("/images/{filename}")
    @ResponseBody // 뷰 렌더링 대신 ResponseBody로 직접 응답
    public Resource download(@PathVariable String filename) throws MalformedURLException {
        return new UrlResource(getPath(filename)); // 로컬 파일 경로 → Resource 변환
    }

    // 첨부파일 다운로드 (파일 저장 다이얼로그 표시)
    @GetMapping("/attaches/{itemId}")
    public ResponseEntity<Resource> download(@PathVariable Long itemId) throws MalformedURLException {
        Item item = itemRepository.findById(itemId);
        FileData attachFile = item.getAttachFile();

        // 저장된 경로로 Resource 생성
        Resource resource = new UrlResource(getPath(attachFile));

        // 원본 파일명을 UTF-8로 인코딩하여 Content-Disposition 헤더에 설정
        String originalFilename = UriUtils.encode(
                attachFile.getOriginalFilename(),
                StandardCharsets.UTF_8
        );

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        getContentDisposition(originalFilename)
                )
                .body(resource);
    }

    // 저장된 파일명 기반으로 전체 파일 경로 생성
    private String getPath(String storedFilename) {
        return "file:" + fileStoreService.getFullPath(storedFilename);
    }

    // FileData 객체에서 저장 경로 생성
    private String getPath(FileData fileData) {
        return getPath(fileData.getStoredFilename());
    }

    // Content-Disposition 헤더 값 생성 (다운로드 시 파일명 지정)
    private String getContentDisposition(String originalFilename) {
        return "attachment; filename=\"" + originalFilename + "\"";
    }
}
```

```html
<!-- upload-form.html -->
<!DOCTYPE HTML>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <h2>아이템 등록</h2>

    <form enctype="multipart/form-data" method="post" th:action>
      <ul>
        <li>itemName: <input name="itemName" type="text"/></li>
        <li>attachFile: <input name="attachFile" type="file"/></li>
        <li>imageFiles: <input multiple="multiple" name="imageFiles" type="file"/></li>
        <button type="submit">저장</button>
      </ul>
    </form>

  </body>
</html>
```

```html
<!-- item-view.html -->
<!DOCTYPE HTML>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <div class="container">
      <h2>상품 조회</h2>

      상품명: <span th:text="${item.itemName}">상품명</span>
      <br/>

      첨부파일: <a th:href="|/attaches/${item.id}|"
               th:if="${item.attachFile}"
               th:text="${item.getAttachFile().getOriginalFilename()}"/>
      <br/>

      <img height="300"
           th:each="imageFile : ${item.imageFiles}"
           th:src="|/images/${imageFile.getStoredFilename()}|"
           width="300"
      />
    </div>
  </body>
</html>
```

---

## 참고 – application.properties 설정

```python
# 업로드된 파일에 허용되는 최대 크기를 지정 (기본값: 1MB)
spring.servlet.multipart.max-file-size=1MB

# multipart/form-data 요청에 허용되는 최대 크기를 지정 (기본값: 10MB)
spring.servlet.multipart.max-request-size=10MB

# multipart/form-data 요청 처리 여부 (기본값: true)
spring.servlet.multipart.enabled=true

# HTTP 요청 메시지 확인
logging.level.org.apache.coyote.http11=trace
```
