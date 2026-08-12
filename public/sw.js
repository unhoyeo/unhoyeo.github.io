/*
 * 자폭용 서비스 워커.
 *
 * 이전 Jekyll(Chirpy) 블로그가 pwa.enabled: true 로 서비스 워커를 등록해뒀다.
 * 그 워커는 방문자 브라우저에 남아 옛 페이지를 오프라인 캐시에서 계속 서빙한다.
 * 파일을 그냥 지우면(404) 브라우저는 갱신에 실패한 채 옛 워커를 유지하므로,
 * 같은 경로에 '캐시를 비우고 스스로 등록을 해제하는' 워커를 올려서 정리한다.
 *
 * 옛 워커가 완전히 사라졌다고 판단되면 이 파일도 지워도 된다.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      await self.registration.unregister();

      // 이미 열려 있는 탭은 새로고침해 새 사이트를 받게 한다
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});

// 혹시 살아있는 동안 오는 요청은 캐시를 거치지 않고 네트워크로 넘긴다
self.addEventListener('fetch', () => {});
