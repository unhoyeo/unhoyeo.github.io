/*
 * /admin — 브라우저에서 글을 쓰고 바로 올린다.
 *
 * 프리뷰는 Astro가 빌드 때 쓰는 마크다운 프로세서를 그대로 브라우저에서 돌린다.
 * marked 같은 다른 렌더러를 쓰면 미묘하게 다른 화면을 보게 되고, 그러면 미리 보는
 * 의미가 없다. 같은 remark/rehype 플러그인, 같은 shiki 설정, 같은 CSS를 쓴다.
 *
 * 저장은 GitHub API로 커밋까지만 한다. 그 뒤 Actions가 빌드해서 배포할 때까지는
 * 1분 남짓 걸리므로, 기다리는 동안 상태를 보여준다.
 */
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { shikiConfig } from '../markdown.config.mjs';
import { POSTS_DIR, REPO_BRANCH, REPO_NAME, REPO_OWNER, SITE_URL, UPLOADS_DIR } from '../consts';
import { decorateCodeBlocks } from './codeBlocks';
import { slugify } from './slugify';
import {
  nowInSeoul,
  parsePost,
  parseTagInput,
  serializePost,
  type PostMeta,
} from './frontmatter';
import {
  GitHubError,
  checkAccess,
  commitFiles,
  findRun,
  listFiles,
  readFile,
  type FileChange,
  type RepoRef,
} from './github';

const repo: RepoRef = { owner: REPO_OWNER, repo: REPO_NAME, branch: REPO_BRANCH };

const TOKEN_KEY = 'admin:token';
const LOCAL_DRAFT_KEY = 'admin:local-draft';

/* ------------------------------------------------------------------ 상태 */

interface Editing {
  /** 저장소 안의 경로. null이면 아직 한 번도 저장하지 않은 새 글 */
  path: string | null;
  meta: PostMeta;
  body: string;
}

function blankPost(): Editing {
  return {
    path: null,
    meta: { title: '', pubDate: nowInSeoul(), tags: [], draft: true },
    body: '',
  };
}

let editing = blankPost();
let dirty = false;
/** 커밋 메시지를 사람이 직접 고쳤는지. 고쳤다면 제목이 바뀌어도 건드리지 않는다 */
let messageEdited = false;

/*
 * 붙여넣었지만 아직 커밋되지 않은 이미지. 글과 같은 커밋에 실려 올라간다.
 * 그때까지는 프리뷰에서 objectUrl로 바꿔 끼워 보여준다 — 저장소에 없는 경로라
 * 그냥 두면 깨진 이미지로 나온다.
 */
const pendingImages = new Map<string, { base64: string; objectUrl: string }>();

/* -------------------------------------------------------------------- DOM */

function need<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} 를 찾을 수 없다`);
  return node as T;
}

const ui = {
  title: need<HTMLInputElement>('f-title'),
  category: need<HTMLInputElement>('f-category'),
  tags: need<HTMLInputElement>('f-tags'),
  pubDate: need<HTMLInputElement>('f-pubdate'),
  draft: need<HTMLInputElement>('f-draft'),
  message: need<HTMLInputElement>('f-message'),
  editor: need<HTMLTextAreaElement>('editor'),
  previewWrap: need<HTMLElement>('preview-wrap'),
  previewTitle: need<HTMLElement>('preview-title'),
  previewDate: need<HTMLElement>('preview-date'),
  previewDraft: need<HTMLElement>('preview-draft'),
  previewTags: need<HTMLUListElement>('preview-tags'),
  preview: need<HTMLElement>('preview'),
  status: need<HTMLElement>('status'),
  fileName: need<HTMLElement>('file-name'),
  saveBtn: need<HTMLButtonElement>('save-btn'),
  openBtn: need<HTMLButtonElement>('open-btn'),
  newBtn: need<HTMLButtonElement>('new-btn'),
  tokenBtn: need<HTMLButtonElement>('token-btn'),
  categories: need<HTMLDataListElement>('categories'),
  // 글 고르기
  picker: need<HTMLDialogElement>('picker'),
  pickerFilter: need<HTMLInputElement>('picker-filter'),
  pickerList: need<HTMLUListElement>('picker-list'),
  // 토큰
  tokenDialog: need<HTMLDialogElement>('token-dialog'),
  tokenInput: need<HTMLInputElement>('token-input'),
  tokenSave: need<HTMLButtonElement>('token-save'),
  tokenClear: need<HTMLButtonElement>('token-clear'),
  tokenStatus: need<HTMLElement>('token-status'),
};

type StatusKind = 'idle' | 'busy' | 'ok' | 'error';

function setStatus(text: string, kind: StatusKind = 'idle', href?: string): void {
  ui.status.dataset.kind = kind;
  ui.status.textContent = '';
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = text;
    ui.status.append(link);
  } else {
    ui.status.textContent = text;
  }
}

/* ---------------------------------------------------------------- 토큰 */

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function requireToken(): string {
  const token = getToken();
  if (!token) {
    openTokenDialog();
    throw new Error('먼저 GitHub 토큰을 등록해야 한다');
  }
  return token;
}

function openTokenDialog(): void {
  ui.tokenInput.value = getToken() ?? '';
  ui.tokenStatus.textContent = getToken() ? '등록되어 있습니다.' : '아직 등록되지 않았습니다.';
  ui.tokenDialog.showModal();
}

/* ------------------------------------------------------------ 프리뷰 */

// 무거운 초기화(테마·문법 로딩)는 한 번만. 첫 렌더에서 await 한다
const processorReady = createMarkdownProcessor({ shikiConfig });

let renderSeq = 0;
let renderTimer: number | undefined;

function schedulePreview(): void {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderPreview, 120);
}

async function renderPreview(): Promise<void> {
  const seq = ++renderSeq;
  const processor = await processorReady;
  const { code } = await processor.render(editing.body);

  // 기다리는 사이 더 친 글자가 있으면 이 결과는 이미 낡았다
  if (seq !== renderSeq) return;

  ui.preview.innerHTML = code;
  showPendingImages(ui.preview);
  decorateCodeBlocks(ui.previewWrap);
  renderPreviewHeader();
}

/*
 * 글 페이지(pages/posts/[...slug].astro)의 헤더와 같은 순서·같은 모양으로 채운다.
 * 제목·날짜·태그가 본문 위에 얹히는 모양까지 같아야 "미리 본" 것이 된다.
 *
 * 뼈대는 admin.astro의 마크업에 있다 — 스코프 CSS가 걸리려면 빌드 때 만들어진
 * 노드여야 하므로, 여기서는 글자와 표시 여부만 바꾼다.
 */
function renderPreviewHeader(): void {
  const { title, pubDate, tags, draft } = editing.meta;

  ui.previewTitle.textContent = title || '제목 없음';
  ui.previewTitle.classList.toggle('placeholder', !title);
  ui.previewDate.textContent = pubDate.slice(0, 10).replaceAll('-', '.');
  ui.previewDraft.hidden = !draft;

  ui.previewTags.replaceChildren(
    ...tags.map((tag) => {
      const item = document.createElement('li');
      item.textContent = `#${tag}`;
      return item;
    })
  );
}

/** 아직 안 올라간 이미지를 브라우저 안의 사본으로 바꿔 끼운다 */
function showPendingImages(root: ParentNode): void {
  for (const img of root.querySelectorAll('img')) {
    const path = repoPathForSrc(img.getAttribute('src'));
    const pending = path ? pendingImages.get(path) : undefined;
    if (pending) img.src = pending.objectUrl;
  }
}

/** 마크다운의 /images/... 를 저장소 경로 public/images/... 로 */
function repoPathForSrc(src: string | null): string | null {
  return src && src.startsWith('/images/') ? `public${src}` : null;
}

/* ------------------------------------------------------- 폼 ↔ 상태 */

function syncFormFromState(): void {
  const { meta } = editing;
  ui.title.value = meta.title;
  ui.category.value = meta.category ?? '';
  ui.tags.value = meta.tags.join(', ');
  ui.pubDate.value = meta.pubDate;
  ui.draft.checked = meta.draft;
  ui.editor.value = editing.body;
  ui.fileName.textContent = editing.path ?? '(새 글 — 저장할 때 제목으로 파일명을 만듭니다)';
  messageEdited = false;
  refreshCommitMessage();
}

function readFormIntoState(): void {
  const { meta } = editing;
  meta.title = ui.title.value.trim();
  meta.category = ui.category.value.trim() || undefined;
  meta.tags = parseTagInput(ui.tags.value);
  meta.pubDate = ui.pubDate.value.trim() || nowInSeoul();
  meta.draft = ui.draft.checked;
  editing.body = ui.editor.value;
}

/** 커밋 메시지 기본값. 사람이 직접 고쳤으면 그대로 둔다 */
function refreshCommitMessage(): void {
  if (messageEdited) return;
  const title = editing.meta.title || '글';
  ui.message.value = editing.path
    ? `docs: ${title} 글을 고친다`
    : `feat: ${title} 글을 추가한다`;
}

function markDirty(): void {
  dirty = true;
  setStatus('저장 안 됨');
  saveLocalDraft();
}

function onFormChange(): void {
  readFormIntoState();
  refreshCommitMessage();
  markDirty();
  // 제목·태그는 본문 렌더를 기다릴 필요가 없다. 본문만 늦게 따라온다
  renderPreviewHeader();
  schedulePreview();
}

/* --------------------------------------------------- 브라우저 임시 저장 */

/*
 * 커밋 전 내용이 새로고침 한 번에 날아가면 안 된다. 타이핑할 때마다 브라우저에
 * 남겨 두고, 다음에 들어오면 이어서 쓴다. (사생활 모드 등에서 실패할 수 있으니 감싼다)
 */
function saveLocalDraft(): void {
  try {
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(editing));
  } catch {
    /* 저장 공간이 없으면 임시 저장만 포기한다 */
  }
}

function loadLocalDraft(): Editing | null {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Editing;
    if (!parsed?.meta || typeof parsed.body !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearLocalDraft(): void {
  try {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
  } catch {
    /* 지우지 못해도 다음 저장이 덮어쓴다 */
  }
}

/* ------------------------------------------------------------ 글 열기 */

let cachedFiles: Array<{ name: string; path: string }> | null = null;

async function openPicker(): Promise<void> {
  const token = requireToken();
  ui.pickerList.innerHTML = '<li class="picker__empty">불러오는 중…</li>';
  ui.picker.showModal();
  ui.pickerFilter.value = '';

  try {
    cachedFiles ??= (await listFiles(token, repo, POSTS_DIR))
      .filter((file) => /\.mdx?$/.test(file.name))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    renderPickerList('');
    ui.pickerFilter.focus();
  } catch (error) {
    ui.pickerList.innerHTML = `<li class="picker__empty">${describe(error)}</li>`;
  }
}

function renderPickerList(filter: string): void {
  const needle = filter.trim().toLowerCase();
  const matches = (cachedFiles ?? []).filter((file) =>
    file.name.toLowerCase().includes(needle)
  );

  ui.pickerList.innerHTML = '';
  if (matches.length === 0) {
    ui.pickerList.innerHTML = '<li class="picker__empty">찾는 글이 없습니다.</li>';
    return;
  }

  for (const file of matches.slice(0, 200)) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = file.name.replace(/\.mdx?$/, '');
    button.addEventListener('click', () => void loadPost(file.path));
    item.append(button);
    ui.pickerList.append(item);
  }
}

async function loadPost(path: string): Promise<void> {
  if (dirty && !confirm('저장하지 않은 변경이 있습니다. 버리고 다른 글을 열까요?')) return;

  const token = requireToken();
  ui.picker.close();
  setStatus('불러오는 중…', 'busy');

  try {
    const source = await readFile(token, repo, path);
    if (source === null) {
      setStatus('파일을 찾을 수 없습니다', 'error');
      return;
    }
    const { meta, body } = parsePost(source);
    editing = { path, meta, body };
    pendingImages.clear();
    dirty = false;
    clearLocalDraft();
    syncFormFromState();
    await renderPreview();
    setStatus('불러왔습니다', 'ok');
  } catch (error) {
    setStatus(describe(error), 'error');
  }
}

/* ------------------------------------------------------------ 저장 */

async function save(): Promise<void> {
  readFormIntoState();

  if (!editing.meta.title) {
    setStatus('제목을 먼저 입력하세요', 'error');
    ui.title.focus();
    return;
  }

  let token: string;
  try {
    token = requireToken();
  } catch {
    return;
  }

  /*
   * 이미 있는 글은 파일명을 바꾸지 않는다. 파일명이 곧 주소라서,
   * 제목을 다듬을 때마다 링크가 깨지면 곤란하다.
   */
  const path = editing.path ?? `${POSTS_DIR}/${slugify(editing.meta.title)}.md`;

  ui.saveBtn.disabled = true;
  setStatus('올리는 중…', 'busy');

  try {
    if (!editing.path) {
      const existing = await readFile(token, repo, path);
      if (existing !== null && !confirm(`${path} 가 이미 있습니다. 덮어쓸까요?`)) {
        setStatus('취소했습니다');
        return;
      }
    }

    const files: FileChange[] = [];
    for (const [imagePath, image] of pendingImages) {
      files.push({ path: imagePath, base64: image.base64 });
    }
    files.push({ path, content: serializePost(editing) });

    const commit = await commitFiles(token, repo, files, ui.message.value.trim() || '글 수정');

    editing.path = path;
    for (const image of pendingImages.values()) URL.revokeObjectURL(image.objectUrl);
    pendingImages.clear();
    dirty = false;
    messageEdited = false;
    clearLocalDraft();
    cachedFiles = null; // 새 글이 생겼을 수 있으니 목록을 다시 받는다
    syncFormFromState();

    void watchDeploy(token, commit.sha, path);
  } catch (error) {
    setStatus(describe(error), 'error');
  } finally {
    ui.saveBtn.disabled = false;
  }
}

/*
 * 커밋은 끝났고 이제 Actions가 빌드한다. 정적 사이트라 여기서 1분쯤 걸리는데,
 * 아무 표시가 없으면 "저장이 안 됐나" 싶어진다. 끝날 때까지 경과를 보여준다.
 */
async function watchDeploy(token: string, sha: string, path: string): Promise<void> {
  const startedAt = Date.now();
  const elapsed = () => Math.round((Date.now() - startedAt) / 1000);
  const deadline = startedAt + 10 * 60 * 1000;

  while (Date.now() < deadline) {
    let run;
    try {
      run = await findRun(token, repo, sha);
    } catch {
      // 조회가 한 번 실패해도 배포는 돌고 있다. 다음 차례에 다시 본다
      run = null;
    }

    if (run?.status === 'completed') {
      if (run.conclusion !== 'success') {
        setStatus(`배포 실패 — 로그 보기`, 'error', run.html_url);
        return;
      }
      if (editing.meta.draft) {
        setStatus(`반영 완료 (${elapsed()}초) · 초안이라 사이트에는 안 보입니다`, 'ok');
      } else {
        const slug = path.replace(`${POSTS_DIR}/`, '').replace(/\.mdx?$/, '');
        setStatus(`반영 완료 (${elapsed()}초) — 글 보기`, 'ok', `${SITE_URL}/posts/${slug}/`);
      }
      return;
    }

    setStatus(run ? `배포 중… ${elapsed()}초` : `배포 대기 중… ${elapsed()}초`, 'busy');
    await sleep(3000);
  }

  setStatus('배포가 오래 걸립니다 — Actions에서 확인하세요', 'error', `${repoUrl()}/actions`);
}

function repoUrl(): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------ 이미지 */

async function attachImage(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) return;

  const folder = editing.path
    ? editing.path.replace(`${POSTS_DIR}/`, '').replace(/\.mdx?$/, '')
    : slugify(editing.meta.title || ui.title.value || 'post');

  const safeName = file.name.replace(/[^\w.-]+/g, '-').toLowerCase();
  const repoPath = `${UPLOADS_DIR}/${folder}/${Date.now()}-${safeName}`;

  pendingImages.set(repoPath, {
    base64: await fileToBase64(file),
    objectUrl: URL.createObjectURL(file),
  });

  insertAtCursor(`![](${repoPath.replace(/^public/, '')})`);
  setStatus('이미지는 글을 저장할 때 함께 올라갑니다');
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // data URL의 "base64," 뒤쪽만 필요하다
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function insertAtCursor(text: string): void {
  const area = ui.editor;
  const { selectionStart: start, selectionEnd: end, value } = area;
  area.value = `${value.slice(0, start)}${text}${value.slice(end)}`;
  area.selectionStart = area.selectionEnd = start + text.length;
  onFormChange();
}

/* ------------------------------------------------------------ 잡동사니 */

function describe(error: unknown): string {
  if (error instanceof GitHubError) {
    if (error.status === 401) return '토큰이 잘못되었거나 만료되었습니다';
    if (error.status === 403) return `권한이 없습니다 — ${error.message}`;
    if (error.status === 409) return '저장소가 그사이 바뀌었습니다. 새로고침 후 다시 시도하세요';
    return `GitHub: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/** 이미 쓰인 카테고리를 자동완성에 채운다 */
function fillCategorySuggestions(values: string[]): void {
  ui.categories.innerHTML = '';
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    ui.categories.append(option);
  }
}

/*
 * 편집기를 스크롤하면 프리뷰도 같은 비율로 따라간다. 줄 단위로 맞추려면
 * 소스맵이 필요한데, 긴 글에서 대강 같은 위치만 보여도 충분하다.
 */
function syncScroll(): void {
  const area = ui.editor;
  const scrollable = area.scrollHeight - area.clientHeight;
  if (scrollable <= 0) return;
  const ratio = area.scrollTop / scrollable;
  const target = ui.previewWrap;
  target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
}

/* ------------------------------------------------------------ 시작 */

function wireEvents(): void {
  for (const field of [ui.title, ui.category, ui.tags, ui.pubDate]) {
    field.addEventListener('input', onFormChange);
  }
  ui.draft.addEventListener('change', onFormChange);
  ui.editor.addEventListener('input', onFormChange);
  ui.editor.addEventListener('scroll', syncScroll);
  ui.message.addEventListener('input', () => {
    messageEdited = true;
  });

  ui.saveBtn.addEventListener('click', () => void save());
  ui.openBtn.addEventListener('click', () => void openPicker());
  ui.newBtn.addEventListener('click', () => {
    if (dirty && !confirm('저장하지 않은 변경이 있습니다. 버리고 새 글을 쓸까요?')) return;
    editing = blankPost();
    pendingImages.clear();
    dirty = false;
    clearLocalDraft();
    syncFormFromState();
    void renderPreview();
    setStatus('새 글');
    ui.title.focus();
  });

  ui.tokenBtn.addEventListener('click', openTokenDialog);
  ui.pickerFilter.addEventListener('input', () => renderPickerList(ui.pickerFilter.value));

  ui.tokenSave.addEventListener('click', async () => {
    const token = ui.tokenInput.value.trim();
    if (!token) return;
    ui.tokenStatus.textContent = '확인 중…';
    try {
      const fullName = await checkAccess(token, repo);
      localStorage.setItem(TOKEN_KEY, token);
      ui.tokenStatus.textContent = `${fullName} 에 쓸 수 있습니다.`;
      cachedFiles = null;
      setTimeout(() => ui.tokenDialog.close(), 700);
    } catch (error) {
      ui.tokenStatus.textContent = describe(error);
    }
  });

  ui.tokenClear.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    ui.tokenInput.value = '';
    ui.tokenStatus.textContent = '지웠습니다.';
    cachedFiles = null;
  });

  // 붙여넣기 / 끌어다 놓기로 이미지 넣기
  ui.editor.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files ?? [])];
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) return;
    event.preventDefault();
    for (const image of images) void attachImage(image);
  });

  ui.editor.addEventListener('dragover', (event) => event.preventDefault());
  ui.editor.addEventListener('drop', (event) => {
    const files = [...(event.dataTransfer?.files ?? [])];
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) return;
    event.preventDefault();
    for (const image of images) void attachImage(image);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      void save();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault();
  });
}

async function start(): Promise<void> {
  wireEvents();

  /*
   * 주소에 ?edit=... 이 있으면 그 글을 연다 (글 페이지의 "수정" 링크가 이걸 준다).
   * 없으면 브라우저에 남아 있던 임시 저장본을 이어서 쓴다.
   */
  const wanted = new URLSearchParams(location.search).get('edit');
  const local = loadLocalDraft();

  if (wanted) {
    syncFormFromState();
    await loadPost(wanted.includes('/') ? wanted : `${POSTS_DIR}/${wanted}.md`);
  } else if (local) {
    editing = local;
    syncFormFromState();
    dirty = true;
    await renderPreview();
    setStatus('저장하지 않은 글을 이어서 씁니다');
  } else {
    syncFormFromState();
    await renderPreview();
    setStatus(getToken() ? '준비됨' : '저장하려면 GitHub 토큰을 등록하세요');
  }

  // 카테고리 자동완성은 페이지가 빌드 때 심어 둔 값을 쓴다
  const seeded = document.getElementById('category-seed')?.textContent;
  if (seeded) fillCategorySuggestions(JSON.parse(seeded) as string[]);
}

void start();
