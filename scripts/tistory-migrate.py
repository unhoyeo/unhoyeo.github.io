"""티스토리 백업 HTML -> Astro 마크다운. (2026-08-16 이관에 쓴 스크립트)

    pip install markdownify beautifulsoup4 lxml
    python scripts/tistory-migrate.py --write

SRC는 백업 zip을 푼 경로다. 같은 slug로 다시 쓰므로 재실행하면 덮어쓴다.
알고리즘 글을 공개로 돌리려면 CAT_MAP의 draft 값을 False로 바꾼다.

티스토리(카카오) 에디터가 뱉은 마크업은 인라인 스타일과 의미 없는 <span>이
잔뜩 붙어 있다. 색상 지정을 그대로 두면 새 블로그의 다크 모드에서 글자가
배경에 묻히므로, 표현용 속성은 전부 걷어내고 구조만 남긴다.
"""
import glob
import html
import os
import re
import shutil
import sys
from collections import Counter, defaultdict

from bs4 import BeautifulSoup, NavigableString
from markdownify import MarkdownConverter

SRC = 'tistory/uh1205-1-1'
DEST = '/Users/unhoyeo/unhoyeo.github.io'

# 티스토리 평면 카테고리 -> 새 계층 카테고리. draft=True면 빌드에서 제외한다
# (알고리즘 글은 나중에 알맹이만 뽑아 새로 쓰기로 했으므로 일단 전부 감춘다).
CAT_MAP = {
    'Spring Basic': ('스프링/기본', False),
    'Spring MVC': ('스프링/MVC', False),
    'Spring DB': ('스프링/DB', False),
    'Java': ('자바', False),
    'DB': ('데이터베이스', False),
    'HTTP': ('HTTP', False),
    'Algorithm': ('알고리즘/개념', True),
    '오늘의 백준 문제': ('알고리즘/백준', True),
    '카카오 기출문제': ('알고리즘/카카오', True),
    '오답노트': ('알고리즘/오답노트', True),
    'SWEA 문제': ('알고리즘/기타', True),
    '코딜리티 문제': ('알고리즘/기타', True),
    'else': ('기타', False),
}

# 카테고리가 비어 있는 4편은 제목을 보고 손으로 배치한다
BY_TITLE = {
    'URI의 구성요소, 설계 원칙': ('HTTP', False),
    '[HTTP] IP, TCP, UDP, PORT, DNS': ('HTTP', False),
    'MySQL의 데이터 형식': ('데이터베이스', False),
    '동시성 제어 – synchronized, 비관적 락, 원자적 UPDATE 패턴': ('자바', False),
}

# 티스토리가 자동 감지한 코드 언어는 오탐이 많다. 확실히 틀린 것만 다시 판별한다
SUSPECT = {'angelscript', 'routeros', 'reasonml', 'less', 'dust', 'nginx', 'gradle',
           'crmsh', 'livecodeserver', 'stylus', 'coffeescript', 'scss', 'q', 'vim',
           'awk', 'delphi', 'basic', 'pf', 'ini', 'apache', 'axapta', 'processing'}
ALIAS = {'html xml': 'html', 'xml html': 'html', 'js': 'javascript', 'jsp': 'html'}


def detect_lang(code: str) -> str:
    """내용을 보고 언어를 정한다. 애매하면 빈 문자열(언어 없는 코드블록)."""
    t = code.strip()
    if not t:
        return ''
    # 자바: 이 블로그 코드의 대부분이다
    if re.search(r'\b(public|private|protected)\s+(static\s+)?(class|interface|enum|void|final)\b', t) \
            or re.search(r'@(Override|Test|Controller|Service|Repository|Component|Autowired|'
                         r'RequestMapping|GetMapping|PostMapping|Transactional|Entity|Bean|'
                         r'Configuration|WebServlet|SpringBootApplication)\b', t) \
            or re.search(r'\bSystem\.out\.print|\bimport java\.|\bnew\s+[A-Z]\w*\s*\(', t):
        return 'java'
    # 여는 태그로 시작하거나(닫는 태그가 없는 <input> 포함),
    # JSP 스크립틀릿/주석/닫는 태그로 시작하면서 어딘가 닫는 태그가 있으면 HTML로 본다
    if re.match(r'^\s*<[a-zA-Z][\w-]*[\s/>]', t) \
            or (re.match(r'^\s*<[!/%]', t) and re.search(r'</\w+>|%>', t)):
        return 'html'
    if re.search(r'^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b', t, re.I | re.M) \
            and re.search(r'\b(FROM|INTO|SET|TABLE|VALUES)\b', t, re.I):
        return 'sql'
    if re.match(r'^\s*[{\[]', t) and re.search(r'"\w+"\s*:', t):
        return 'json'
    if re.search(r'^(GET|POST|PUT|DELETE|PATCH|HEAD)\s+\S+|^HTTP/1\.[01]\s+\d{3}', t, re.M):
        return 'http'
    if re.search(r'^\s*[\w.-]+\s*=\s*\S', t, re.M) and not re.search(r'[;{}]', t):
        return 'properties'
    return ''


class TistoryConverter(MarkdownConverter):
    """코드블록만 직접 처리하고 나머지는 markdownify 기본 동작에 맡긴다."""

    def convert_pre(self, el, text, parent_tags=None):
        code = el.get_text()
        code = code.rstrip()
        lang = el.get('_lang', '')
        fence = '```'
        while fence in code:
            fence += '`'
        return f'\n\n{fence}{lang}\n{code}\n{fence}\n\n'


def normalize_inline(body) -> None:
    """의미 없는 인라인 껍데기를 먼저 벗긴다.

    <b>A</b><span>&nbsp;</span><b>B</b> 처럼 span이 끼어 있으면 강조 병합이
    막히므로, 굵은 글씨를 손대기 전에 반드시 여기를 통과시켜야 한다.
    """
    for node in body.find_all(string=True):
        if '\xa0' in node and node.parent.name != 'pre':
            node.replace_with(node.replace('\xa0', ' '))
    for tag in body.find_all(['span', 'font']):
        tag.unwrap()
    body.smooth()


def flatten_bold(body) -> None:
    """<b> 안의 <b>를 벗긴다.

    중첩된 채로 두면 ****일반**메서드 주입** 처럼 별표가 겹쳐 마크다운이 깨진다.
    """
    for tag in body.find_all(['b', 'strong']):
        for inner in tag.find_all(['b', 'strong']):
            inner.unwrap()
    body.smooth()
    # 내용이 빈 강조는 별표만 남으므로 지운다
    for tag in body.find_all(['b', 'strong', 'i', 'em']):
        if not tag.get_text().strip():
            tag.decompose()
    # 나란히 붙은 <b>는 하나로 합친다. 그대로 두면 **A****B** 가 되어 강조가 풀린다
    for tag in body.find_all(['b', 'strong']):
        if getattr(tag, 'decomposed', False):
            continue
        while True:
            skipped, sib = [], tag.next_sibling
            while isinstance(sib, NavigableString) and not sib.strip():
                skipped.append(sib)
                sib = sib.next_sibling
            if getattr(sib, 'name', None) not in ('b', 'strong'):
                break
            for s in skipped:
                tag.append(s.extract())
            for child in list(sib.children):
                tag.append(child.extract())
            sib.decompose()
    body.smooth()


def strip_noise(body: BeautifulSoup) -> None:
    """표현용 속성 제거. 구조(목록, 표, 인용, 코드)는 건드리지 않는다."""
    for tag in body.find_all(True):
        for attr in list(tag.attrs):
            if attr == 'href' or attr == 'src' or attr == 'alt' or attr == '_lang':
                continue
            if attr == 'class' and tag.name == 'pre':
                continue
            del tag[attr]
    body.smooth()


def unwrap_opengraph(body) -> None:
    """링크 미리보기 카드 -> 평범한 마크다운 링크.

    카드 이미지는 카카오 CDN에 있어서 티스토리를 닫으면 깨진다.
    원본 주소가 속성에 남아 있으므로 링크만 살린다.
    """
    for fig in body.select('figure[data-ke-type="opengraph"]'):
        url = fig.get('data-og-source-url') or fig.get('data-og-url') or ''
        title = (fig.get('data-og-title') or url).strip()
        p = body.new_tag('p')
        a = body.new_tag('a', href=url)
        a.string = title or url
        p.append(a)
        fig.replace_with(p)


def mark_code_langs(body) -> Counter:
    """<pre class="언어"> 의 언어를 검증/교정해 _lang 속성에 심는다."""
    stats = Counter()
    for pre in body.find_all('pre'):
        raw = ' '.join(pre.get('class') or []).strip().lower()
        raw = ALIAS.get(raw, raw)
        code = pre.get_text()
        if not raw or raw in SUSPECT:
            lang = detect_lang(code)
            stats[f'{raw or "(없음)"} -> {lang or "(없음)"}'] += 1
        else:
            lang = raw
            stats[f'{raw} (유지)'] += 1
        pre['_lang'] = lang
    return stats


def promote_headings(body) -> int:
    """문단 전체가 굵은 글씨면 제목으로 승격한다.

    이 블로그는 274/279편에 heading 태그가 없고 <b>로 제목을 대신했다.
    그대로 두면 우측 목차가 아무 글에서도 뜨지 않는다.
    """
    n = 0
    for p in body.find_all('p'):
        text = p.get_text().strip()
        if not text or len(text) > 60:
            continue
        bolds = p.find_all(['b', 'strong'])
        if len(bolds) != 1:
            continue
        if bolds[0].get_text().strip() != text:
            continue
        # 마침표로 끝나면 문장으로 본다. '~란 무엇인가?' 같은 의문형은 제목으로 흔하다
        if text.endswith(('.', ',')):
            continue
        h = body.new_tag('h2')
        h.string = text
        p.replace_with(h)
        n += 1
    return n


def _escape_angles(seg: str) -> str:
    """본문의 <T>, <input> 같은 꺾쇠를 실체 참조로 바꾼다.

    마크다운은 날 HTML을 그대로 통과시키므로, Collection<V> 를 두면
    <V>가 태그로 해석되어 화면에서 사라진다.

    단 <https://...> 는 마크다운 자동 링크라 건드리면 안 된다.
    """
    return re.sub(r'<(?=[A-Za-z/!?])(?!(?:https?|ftp|mailto)[:/])', '&lt;', seg)


def clean_text(md: str) -> str:
    md = md.replace('\xa0', ' ')
    # 코드(펜스/인라인)는 건드리지 않고 본문의 꺾쇠만 이스케이프한다
    out, fence = [], None
    for line in md.split('\n'):
        m = re.match(r'^\s*(`{3,})', line)
        if m:
            if fence is None:
                fence = m.group(1)
            elif len(m.group(1)) >= len(fence):
                fence = None
            out.append(line)
            continue
        if fence is not None:
            out.append(line)
            continue
        out.append(''.join(
            part if i % 2 else _escape_angles(part)
            for i, part in enumerate(re.split(r'(`[^`\n]*`)', line))
        ))
    md = '\n'.join(out)
    # 저장 과정에서 이모지가 뭉개져 남은 '?' 접두사 정리 (제목과 굵은 글씨 줄 모두)
    md = re.sub(r'^(#{1,6} )\?[ \t]*', r'\1', md, flags=re.M)
    md = re.sub(r'^(\*\*)\?[ \t]*', r'\1', md, flags=re.M)
    # 글자가 없는 제목은 지운다
    md = re.sub(r'^#{1,6}[ \t]*$\n?', '', md, flags=re.M)
    md = re.sub(r'[ \t]+$', '', md, flags=re.M)
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip() + '\n'


def summarize(md: str, limit: int = 130) -> str:
    """목록에 뜨는 한 줄 요약. 본문 산문만 쓴다.

    코드블록을 남기면 '...제어할 수 있다. java public' 처럼 코드가 새어 나온다.
    """
    body = re.sub(r'(?ms)^```.*?^```\s*', '', md)          # 코드블록 통째로
    body = re.sub(r'(?m)^\s{0,3}#{1,6}\s.*$', '', body)     # 제목 줄
    body = re.sub(r'(?m)^\s*(-{3,}|\|.*\|)\s*$', '', body)  # 구분선, 표
    body = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', body)        # 이미지
    body = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', body)    # 링크는 글자만
    body = re.sub(r'<?\b(?:https?|ftp)://\S*', '', body)    # 주소는 요약에 도움이 안 된다
    body = re.sub(r'&lt;', '<', body)
    body = re.sub(r'[`*>]', '', body)
    body = re.sub(r'(?m)^\s*[-+]\s+', '', body)             # 목록 기호
    body = re.sub(r'\s+', ' ', body).strip()
    if len(body) <= limit:
        return body
    cut = body[:limit]
    # 문장 끝에서 자를 수 있으면 그렇게 한다
    end = max(cut.rfind('. '), cut.rfind('다. '), cut.rfind('! '), cut.rfind('? '))
    if end > limit * 0.5:
        return cut[:end + 1].strip()
    return cut.rsplit(' ', 1)[0].strip() + '…'


def slugify(title: str, category: str) -> str:
    # 제목 앞의 [카테고리] 표기는 카테고리와 중복이므로 뺀다
    t = re.sub(r'^\[[^\]]*\]\s*', '', title).strip()
    t = t.replace('–', '-').replace('—', '-')
    t = re.sub(r'[^\w가-힣]+', '-', t, flags=re.UNICODE)
    t = re.sub(r'_+', '-', t)
    t = re.sub(r'-{2,}', '-', t).strip('-').lower()
    if len(t) > 50:
        cut = t[:50].rsplit('-', 1)[0]
        t = cut or t[:50]
    return t or 'post'


def main(dry: bool):
    files = sorted(glob.glob(f'{SRC}/*/*.html'))
    conv = TistoryConverter(bullets='-', heading_style='atx', code_language_callback=None)
    slugs, out, langstats = {}, [], Counter()
    head_total = 0

    for f in files:
        pid = f.split('/')[2]
        soup = BeautifulSoup(open(f, encoding='utf-8').read(), 'lxml')
        title = soup.select_one('h2.title-article').get_text().strip()
        cat_raw = soup.select_one('p.category').get_text().strip()
        date = soup.select_one('p.date').get_text().strip()
        body = soup.select_one('div.contents_style')

        category, draft = BY_TITLE.get(title) or CAT_MAP.get(cat_raw) or ('기타', False)
        # 제목 앞의 [Spring Basic] 같은 표기는 카테고리가 대신하므로 뗀다.
        # 두면 경로 표시가 "스프링 / 기본 / [Spring Basic] 의존관계 자동 주입"이 된다
        title = re.sub(r'^\[[^\]]*\]\s*', '', title).strip() or title

        unwrap_opengraph(soup)
        langstats += mark_code_langs(body)
        normalize_inline(body)
        flatten_bold(body)
        head_total += promote_headings(body)
        strip_noise(body)

        # 이미지 경로: public/images/tistory/<글번호>/ 로 옮긴다 (경로를 ASCII로 유지)
        imgs = []
        for img in body.find_all('img'):
            src = img.get('src') or ''
            if src.startswith('http'):
                continue
            name = os.path.basename(src)
            imgs.append((os.path.normpath(os.path.join(os.path.dirname(f), src)), name))
            img['src'] = f'/images/tistory/{pid}/{name}'
            if not img.get('alt'):
                img['alt'] = title

        md = clean_text(conv.convert_soup(body))

        slug = slugify(title, category)
        if slug in slugs:
            slug = f'{slug}-{pid}'
        slugs[slug] = (pid, title)

        desc = summarize(md)

        out.append(dict(pid=pid, slug=slug, title=title, category=category, draft=draft,
                        date=date, md=md, desc=desc, imgs=imgs))

    print(f'변환 대상 {len(out)}편 | 승격된 제목 {head_total}개 | 슬러그 {len(slugs)}개')
    print(f'공개 {sum(1 for o in out if not o["draft"])}편 / 비공개 {sum(1 for o in out if o["draft"])}편')
    print('\n=== 코드 언어 교정 ===')
    for k, v in langstats.most_common(20):
        print(f'  {v:5d}  {k}')
    bycat = Counter(o['category'] for o in out)
    print('\n=== 카테고리 ===')
    for k, v in sorted(bycat.items()):
        print(f'  {v:5d}  {k}')

    if not dry:
        write(out)
    return out


def yq(s: str) -> str:
    """YAML 큰따옴표 스칼라. 제목 대부분이 '['로 시작해 따옴표가 필수다."""
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


def write(out):
    posts_dir = os.path.join(DEST, 'src/content/posts')
    img_root = os.path.join(DEST, 'public/images/tistory')
    n_img = 0
    for o in out:
        for src, name in o['imgs']:
            dst_dir = os.path.join(img_root, o['pid'])
            os.makedirs(dst_dir, exist_ok=True)
            shutil.copy2(src, os.path.join(dst_dir, name))
            n_img += 1
        # 티스토리 작성 시각은 한국 시간이다. 오프셋을 붙여야 표시 날짜가 밀리지 않는다
        pub = o['date'].replace(' ', 'T') + '+09:00'
        fm = [
            '---',
            f'title: {yq(o["title"])}',
            f'description: {yq(o["desc"])}',
            f'pubDate: {pub}',
            f'category: {yq(o["category"])}',
            'tags: []',
        ]
        if o['draft']:
            fm.append('draft: true')
        fm += ['---', '']
        path = os.path.join(posts_dir, f'{o["slug"]}.md')
        with open(path, 'w', encoding='utf-8') as fp:
            fp.write('\n'.join(fm) + '\n' + o['md'])
    print(f'\n작성: {len(out)}개 마크다운, 이미지 {n_img}개 -> {posts_dir}')


if __name__ == '__main__':
    main(dry='--write' not in sys.argv)
