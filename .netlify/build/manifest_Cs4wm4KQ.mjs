import '@astrojs/internal-helpers/path';
import '@astrojs/internal-helpers/remote';
import { N as NOOP_MIDDLEWARE_HEADER, k as decodeKey } from './chunks/astro/server_pYpHvcJZ.mjs';
import 'clsx';
import 'cookie';
import 'es-module-lexer';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///D:/Tuan/phogotarot/","cacheDir":"file:///D:/Tuan/phogotarot/node_modules/.astro/","outDir":"file:///D:/Tuan/phogotarot/dist/","srcDir":"file:///D:/Tuan/phogotarot/src/","publicDir":"file:///D:/Tuan/phogotarot/public/","buildClientDir":"file:///D:/Tuan/phogotarot/dist/","buildServerDir":"file:///D:/Tuan/phogotarot/.netlify/build/","adapterName":"@astrojs/netlify","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"admin/new-post/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/admin/new-post","isIndex":false,"type":"page","pattern":"^\\/admin\\/new-post\\/?$","segments":[[{"content":"admin","dynamic":false,"spread":false}],[{"content":"new-post","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/admin/new-post.astro","pathname":"/admin/new-post","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"api/check-env","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/check-env","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/check-env\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"check-env","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/check-env.ts","pathname":"/api/check-env","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"blog/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/blog","isIndex":false,"type":"page","pattern":"^\\/blog\\/?$","segments":[[{"content":"blog","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/blog.astro","pathname":"/blog","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"tarot/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/tarot","isIndex":false,"type":"page","pattern":"^\\/tarot\\/?$","segments":[[{"content":"tarot","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/tarot.astro","pathname":"/tarot","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"yes-no-reading/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/yes-no-reading","isIndex":false,"type":"page","pattern":"^\\/yes-no-reading\\/?$","segments":[[{"content":"yes-no-reading","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/yes-no-reading.astro","pathname":"/yes-no-reading","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"zodiac-daily/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/zodiac-daily","isIndex":false,"type":"page","pattern":"^\\/zodiac-daily\\/?$","segments":[[{"content":"zodiac-daily","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/zodiac-daily.astro","pathname":"/zodiac-daily","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/create-post","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/create-post\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"create-post","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/create-post.ts","pathname":"/api/create-post","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"site":"https://phogotarot.com","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["D:/Tuan/phogotarot/src/pages/admin/new-post.astro",{"propagation":"none","containsHead":true}],["D:/Tuan/phogotarot/src/pages/tarot.astro",{"propagation":"none","containsHead":true}],["D:/Tuan/phogotarot/src/pages/yes-no-reading.astro",{"propagation":"none","containsHead":true}],["D:/Tuan/phogotarot/src/pages/zodiac-daily.astro",{"propagation":"none","containsHead":true}],["D:/Tuan/phogotarot/src/pages/index.astro",{"propagation":"none","containsHead":true}],["D:/Tuan/phogotarot/src/pages/blog.astro",{"propagation":"in-tree","containsHead":true}],["D:/Tuan/phogotarot/src/pages/blog/[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/blog@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/blog/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/admin/new-post@_@astro":"pages/admin/new-post.astro.mjs","\u0000@astro-page:src/pages/api/check-env@_@ts":"pages/api/check-env.astro.mjs","\u0000@astro-page:src/pages/api/create-post@_@ts":"pages/api/create-post.astro.mjs","\u0000@astro-page:src/pages/blog/[slug]@_@astro":"pages/blog/_slug_.astro.mjs","\u0000@astro-page:src/pages/blog@_@astro":"pages/blog.astro.mjs","\u0000@astro-page:src/pages/tarot@_@astro":"pages/tarot.astro.mjs","\u0000@astro-page:src/pages/yes-no-reading@_@astro":"pages/yes-no-reading.astro.mjs","\u0000@astro-page:src/pages/zodiac-daily@_@astro":"pages/zodiac-daily.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_Cs4wm4KQ.mjs","D:/Tuan/phogotarot/node_modules/unstorage/drivers/netlify-blobs.mjs":"chunks/netlify-blobs_DM36vZAS.mjs","D:\\Tuan\\phogotarot\\.astro\\content-assets.mjs":"chunks/content-assets_DleWbedO.mjs","\u0000astro:assets":"chunks/_astro_assets_lFm50mbL.mjs","D:\\Tuan\\phogotarot\\.astro\\content-modules.mjs":"chunks/content-modules_Dz-S_Wwv.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_ndvMzrMl.mjs","D:/Tuan/phogotarot/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.l0sNRNKZ.js","D:/Tuan/phogotarot/src/pages/tarot.astro?astro&type=script&index=1&lang.ts":"_astro/tarot.astro_astro_type_script_index_1_lang.DUKBlpUs.js","D:/Tuan/phogotarot/src/pages/admin/new-post.astro?astro&type=script&index=0&lang.ts":"_astro/new-post.astro_astro_type_script_index_0_lang.BQCoZ7z2.js","D:/Tuan/phogotarot/src/pages/tarot.astro?astro&type=script&index=0&lang.ts":"_astro/tarot.astro_astro_type_script_index_0_lang.BSI-4fDG.js","D:/Tuan/phogotarot/src/pages/yes-no-reading.astro?astro&type=script&index=0&lang.ts":"_astro/yes-no-reading.astro_astro_type_script_index_0_lang.Rjol083k.js","D:/Tuan/phogotarot/src/pages/zodiac-daily.astro?astro&type=script&index=0&lang.ts":"_astro/zodiac-daily.astro_astro_type_script_index_0_lang.B-Jm7TbA.js","D:/Tuan/phogotarot/src/pages/yes-no-reading.astro?astro&type=script&index=1&lang.ts":"_astro/yes-no-reading.astro_astro_type_script_index_1_lang.DUKBlpUs.js","D:/Tuan/phogotarot/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts":"_astro/BaseLayout.astro_astro_type_script_index_0_lang.DUKBlpUs.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["D:/Tuan/phogotarot/src/pages/index.astro?astro&type=script&index=0&lang.ts",""],["D:/Tuan/phogotarot/src/pages/admin/new-post.astro?astro&type=script&index=0&lang.ts","document.getElementById(\"submit\").addEventListener(\"click\",async()=>{const n=document.getElementById(\"title\").value.trim(),i=document.getElementById(\"image\").value.trim(),r=document.getElementById(\"excerpt\").value.trim(),o=document.getElementById(\"content\").value.trim(),t=document.getElementById(\"msg\");if(!n||!o){t.style.color=\"red\",t.textContent=\"❌ Vui lòng nhập tiêu đề và nội dung!\";return}const c=prompt(\"Nhập ADMIN_KEY (giống trong .env):\");if(!c){t.style.color=\"red\",t.textContent=\"⚠️ Bạn chưa nhập ADMIN_KEY!\";return}try{const e=await fetch(`${window.location.origin}/api/create-post`,{method:\"POST\",headers:{Accept:\"application/json\",\"Content-Type\":\"application/json\"},body:JSON.stringify({title:n,image:i,excerpt:r,content:o,adminKey:c})}),l=await e.text();t.textContent=l,t.style.color=e.ok?\"green\":\"red\"}catch(e){t.textContent=\"❌ Lỗi gửi request: \"+e,t.style.color=\"red\"}});"]],"assets":["/_astro/index.BYoraU_b.css","/_astro/zodiac-daily.BGhkmceP.css","/card-back.jpg","/common.js","/favicon.svg","/img-1.jpg","/img-2.jpg","/introduce.png","/planet.png","/style.css","/wheel.png","/_redirects","/images/icon.jpg","/images/performer.jpg","/images/traveler.jpg","/images/visionary.jpg","/_astro/BaseLayout.astro_astro_type_script_index_0_lang.DUKBlpUs.js","/_astro/tarot.astro_astro_type_script_index_0_lang.BSI-4fDG.js","/_astro/tarot.astro_astro_type_script_index_1_lang.DUKBlpUs.js","/_astro/yes-no-reading.astro_astro_type_script_index_0_lang.Rjol083k.js","/_astro/yes-no-reading.astro_astro_type_script_index_1_lang.DUKBlpUs.js","/_astro/zodiac-daily.astro_astro_type_script_index_0_lang.B-Jm7TbA.js","/admin/new-post/index.html","/api/check-env","/blog/index.html","/tarot/index.html","/yes-no-reading/index.html","/zodiac-daily/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"rCH7RHvSNFFovvHYx8SykovBPjWPvHYK50zkJaXZGn4=","sessionConfig":{"driver":"netlify-blobs","options":{"name":"astro-sessions","consistency":"strong"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/netlify-blobs_DM36vZAS.mjs');

export { manifest };
