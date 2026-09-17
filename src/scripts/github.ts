/*
 * 브라우저에서 저장소를 직접 읽고 쓴다.
 *
 * GitHub Pages에는 서버가 없으므로 중간에 둘 곳이 없다. api.github.com이 CORS를
 * 허용하니 브라우저가 직접 부르면 된다. 토큰은 이 브라우저에만 남고
 * 어디로도 새어 나가지 않는다 — 보내는 곳은 GitHub 한 곳뿐이다.
 */
const API = 'https://api.github.com';

/** 파일 하나를 쓰는 지시. content(텍스트)나 base64(바이너리) 중 하나를 준다 */
export interface FileChange {
  path: string;
  content?: string;
  base64?: string;
}

export interface RepoRef {
  owner: string;
  repo: string;
  branch: string;
}

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    let message = `${res.status} ${res.statusText}`;
    try {
      const parsed = JSON.parse(detail);
      if (parsed.message) message = parsed.message;
    } catch {
      /* 본문이 JSON이 아니면 상태 줄만 쓴다 */
    }
    throw new GitHubError(res.status, message);
  }

  return res.json() as Promise<T>;
}

/*
 * 한글이 섞인 문자열을 base64로. btoa는 바이트 하나가 문자 하나라고 보기 때문에
 * UTF-8로 먼저 인코딩하지 않으면 한글에서 던진다.
 */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface RepoFile {
  name: string;
  path: string;
}

/** 디렉터리 안의 파일 목록. 1000개까지는 한 번에 온다 */
export async function listFiles(
  token: string,
  { owner, repo, branch }: RepoRef,
  dir: string
): Promise<RepoFile[]> {
  const entries = await call<Array<{ name: string; path: string; type: string }>>(
    token,
    `/repos/${owner}/${repo}/contents/${encodeURI(dir)}?ref=${encodeURIComponent(branch)}`
  );
  return entries.filter((e) => e.type === 'file').map(({ name, path }) => ({ name, path }));
}

/** 파일 본문을 텍스트로. 없으면 null */
export async function readFile(
  token: string,
  { owner, repo, branch }: RepoRef,
  path: string
): Promise<string | null> {
  try {
    const file = await call<{ content: string; encoding: string }>(
      token,
      `/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`
    );
    return file.encoding === 'base64' ? fromBase64(file.content) : file.content;
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) return null;
    throw error;
  }
}

/*
 * 여러 파일을 커밋 하나로 묶어 올린다.
 *
 * Contents API로 파일마다 PUT을 날리면 파일 수만큼 커밋이 생기고, 커밋 수만큼
 * 배포가 돈다. 글과 거기 붙은 이미지는 한 번에 올라가야 하므로 Git Data API로
 * blob → tree → commit → ref 순서를 직접 밟는다.
 */
export async function commitFiles(
  token: string,
  { owner, repo, branch }: RepoRef,
  files: FileChange[],
  message: string
): Promise<{ sha: string; url: string }> {
  const base = `/repos/${owner}/${repo}/git`;

  const ref = await call<{ object: { sha: string } }>(
    token,
    `${base}/ref/heads/${encodeURIComponent(branch)}`
  );
  const parent = ref.object.sha;

  const parentCommit = await call<{ tree: { sha: string } }>(token, `${base}/commits/${parent}`);

  const blobs = await Promise.all(
    files.map((file) =>
      call<{ sha: string }>(token, `${base}/blobs`, {
        method: 'POST',
        body: JSON.stringify(
          file.base64 !== undefined
            ? { content: file.base64, encoding: 'base64' }
            : { content: file.content ?? '', encoding: 'utf-8' }
        ),
      })
    )
  );

  const tree = await call<{ sha: string }>(token, `${base}/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: parentCommit.tree.sha,
      tree: files.map((file, i) => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobs[i].sha,
      })),
    }),
  });

  const commit = await call<{ sha: string; html_url: string }>(token, `${base}/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }),
  });

  await call(token, `${base}/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { sha: commit.sha, url: commit.html_url };
}

export interface WorkflowRun {
  status: 'queued' | 'in_progress' | 'completed' | string;
  conclusion: string | null;
  html_url: string;
  head_sha: string;
}

/** 방금 올린 커밋을 빌드하고 있는 배포. 아직 큐에 안 잡혔으면 null */
export async function findRun(
  token: string,
  { owner, repo, branch }: RepoRef,
  sha: string
): Promise<WorkflowRun | null> {
  const result = await call<{ workflow_runs: WorkflowRun[] }>(
    token,
    `/repos/${owner}/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=10`
  );
  return result.workflow_runs.find((run) => run.head_sha === sha) ?? null;
}

/** 토큰이 이 저장소에 쓸 수 있는지 확인한다. 실패하면 이유를 그대로 던진다 */
export async function checkAccess(token: string, { owner, repo }: RepoRef): Promise<string> {
  const info = await call<{ full_name: string; permissions?: { push?: boolean } }>(
    token,
    `/repos/${owner}/${repo}`
  );
  if (info.permissions && !info.permissions.push) {
    throw new GitHubError(403, '이 토큰에는 쓰기 권한이 없습니다 (Contents: Read and write 필요)');
  }
  return info.full_name;
}
