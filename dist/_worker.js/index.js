globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BcRiqscO.mjs';
import { manifest } from './manifest_BGpEJXQk.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/admin/orders.astro.mjs');
const _page4 = () => import('./pages/api/admin/order.astro.mjs');
const _page5 = () => import('./pages/api/chat.astro.mjs');
const _page6 = () => import('./pages/api/lead.astro.mjs');
const _page7 = () => import('./pages/api/track.astro.mjs');
const _page8 = () => import('./pages/blog/_slug_.astro.mjs');
const _page9 = () => import('./pages/blog.astro.mjs');
const _page10 = () => import('./pages/booking.astro.mjs');
const _page11 = () => import('./pages/contact.astro.mjs');
const _page12 = () => import('./pages/franchise.astro.mjs');
const _page13 = () => import('./pages/privacy.astro.mjs');
const _page14 = () => import('./pages/services.astro.mjs');
const _page15 = () => import('./pages/terms.astro.mjs');
const _page16 = () => import('./pages/track.astro.mjs');
const _page17 = () => import('./pages/_state_/_city_.astro.mjs');
const _page18 = () => import('./pages/_state_.astro.mjs');
const _page19 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/admin/orders.astro", _page3],
    ["src/pages/api/admin/order.ts", _page4],
    ["src/pages/api/chat.ts", _page5],
    ["src/pages/api/lead.ts", _page6],
    ["src/pages/api/track.ts", _page7],
    ["src/pages/blog/[slug].astro", _page8],
    ["src/pages/blog/index.astro", _page9],
    ["src/pages/booking.astro", _page10],
    ["src/pages/contact.astro", _page11],
    ["src/pages/franchise.astro", _page12],
    ["src/pages/privacy.astro", _page13],
    ["src/pages/services.astro", _page14],
    ["src/pages/terms.astro", _page15],
    ["src/pages/track/index.astro", _page16],
    ["src/pages/[state]/[city].astro", _page17],
    ["src/pages/[state]/index.astro", _page18],
    ["src/pages/index.astro", _page19]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
