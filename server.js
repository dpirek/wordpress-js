import http from 'http';
import { respondJson, respondHtml, notFound, notAuthorizedJson, parseBody, redirect, serverStatic, isStaticRequest, isImageRequest, shouldBlockRequest } from './utils/response.js';
import { getUserFromRequest } from './utils/auth.js';
import { respondImage } from './utils/image.js';
import { router } from './routes.js';
import { env } from 'process';

const PORT = env.PORT || 8080;
const isDev = env.NODE_ENV === 'DEVELOPMENT';

async function onRequest (req, res) {
  const url = req.url.toLowerCase();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (shouldBlockRequest(req)) { console.log(`BLOCKED: ${url} - ${ip}`); return notFound(res); };
  if (isImageRequest(req)) return respondImage(req, res);
  if (isStaticRequest(req)) return serverStatic(req, res);

  const authUser = getUserFromRequest(req);
  const isLocal = req.headers.host && req.headers.host.startsWith('localhost');
  const isJsonRequest = url.startsWith('/api/');
  const route = router.match(url, req.method);
  
  console.log(`${req.method} ${url} - ${ip} - Auth: ${authUser ? authUser.userId : 'none'}`);

  // Auth and role check
  if(route?.auth === true && (!authUser || (route.roles.length > 0 && !route.roles.includes(authUser?.userRole)))) {
    if(route.type === 'json') {
      return notAuthorizedJson(res);
    } else {
      const returnTo = encodeURIComponent(req.url || '/');
      return redirect(res, `/user/login?returnTo=${returnTo}`);
    }
  }
  
  // Route handling
  if (route) {
    req.params = route.params;
    req.queryParams = route.queryParams;
    try {
      req.body = await parseBody(req);
    } catch (err) {
      if (route.type === 'json' || isJsonRequest) {
        return respondJson(res, { error: 'Invalid JSON payload' }, 400);
      }
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Invalid request payload');
    }
    req.authUser = authUser;

    if(route.type === 'html') {
      const response = await route.handler({
        url: req.url,
        method: req.method,
        params: req.params,
        queryParams: req.queryParams,
        body: req.body,
        isLocal: isLocal,
        authUser: req.authUser,
        req,
        res,
      });
      if (res.writableEnded) return;
      return await respondHtml(res, response);
    } else if (route.type === 'json') {
      const response = await route.handler({
        url: req.url,
        method: req.method,
        params: req.params,
        queryParams: req.queryParams,
        body: req.body,
        authUser: req.authUser,
        req,
        res,
      });
      if (res.writableEnded) return;
      return await respondJson(res, response);
    }
  }

  if(isJsonRequest) return respondJson(res, { error: 'route not found' }, 404);
  return notFound(res);
}

const server = http.createServer(onRequest);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
});
