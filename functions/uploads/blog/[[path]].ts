type Env = {
  MEDIA_BUCKET?: R2Bucket;
};

export const onRequestGet = async ({ params, env }: { params: any; env: Env }) => {
  if (!env.MEDIA_BUCKET) {
    return new Response('Media bucket is not configured.', { status: 404 });
  }

  const pathParts = Array.isArray(params.path) ? params.path : String(params.path || '').split('/').filter(Boolean);
  const key = `uploads/blog/${pathParts.join('/')}`;
  if (!/^uploads\/blog\/[A-Za-z0-9._/-]+$/.test(key) || key.includes('..')) {
    return new Response('Invalid media path.', { status: 400 });
  }

  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) return new Response('Not found.', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
};

export const onRequest = async () => {
  return new Response('Method not allowed.', { status: 405 });
};
