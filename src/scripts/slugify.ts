/*
 * 제목에서 파일명(= 글 주소)을 만든다.
 *
 * scripts/tistory-migrate.py의 slugify와 같은 규칙이어야 한다. 이미 있는 글 300여 편이
 * 그 규칙으로 만들어졌고, 여기서 만든 파일이 그 옆에 나란히 놓이기 때문이다.
 * 파이썬의 `\w`(re.UNICODE)는 글자·숫자·밑줄이고 한글도 거기 포함되므로
 * 자바스크립트에서는 \p{L}\p{N}_ 로 옮긴다.
 */
export function slugify(title: string): string {
  // 제목 앞의 [카테고리] 표기는 카테고리와 중복이므로 뺀다
  let t = title.replace(/^\[[^\]]*\]\s*/, '').trim();
  t = t.replace(/[–—]/g, '-');
  t = t.replace(/[^\p{L}\p{N}_]+/gu, '-');
  t = t.replace(/_+/g, '-');
  t = t
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  // 너무 길면 자르되 단어 중간에서 끊지 않는다
  if (t.length > 50) {
    const cut = t.slice(0, 50).replace(/-[^-]*$/, '');
    t = cut || t.slice(0, 50);
  }

  return t || 'post';
}
