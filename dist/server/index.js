export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404 || url.pathname.includes(".")) {
      return assetResponse;
    }

    const indexUrl = new URL("/index.html", url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
