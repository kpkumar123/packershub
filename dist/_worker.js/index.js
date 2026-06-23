globalThis.process ??= {}; globalThis.process.env ??= {};
import 'cloudflare:workers';
import require$$0$3 from 'node:util';
import require$$1$1 from 'node:stream';
import require$$0$1 from 'child_process';
import require$$0 from 'fs';
import require$$0$2 from 'node:child_process';
import require$$1 from 'node:crypto';
import require$$0$4 from 'node:path';
import require$$0$5 from 'node:events';
import require$$7 from 'node:os';

function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== 'string' && !Array.isArray(e)) { for (const k in e) {
      if (k !== 'default' && !(k in n)) {
        const d = Object.getOwnPropertyDescriptor(e, k);
        if (d) {
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: () => e[k]
          });
        }
      }
    } }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: 'Module' }));
}

const args = undefined;

function appendForwardSlash(path) {
  return path.endsWith("/") ? path : path + "/";
}
function prependForwardSlash(path) {
  return path[0] === "/" ? path : "/" + path;
}
const MANY_LEADING_SLASHES = /^\/{2,}/;
function collapseDuplicateLeadingSlashes(path) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_LEADING_SLASHES, "/");
}
const MANY_SLASHES = /\/{2,}/g;
function collapseDuplicateSlashes(path) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_SLASHES, "/");
}
const MANY_TRAILING_SLASHES = /\/{2,}$/g;
function collapseDuplicateTrailingSlashes(path, trailingSlash) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_TRAILING_SLASHES, trailingSlash ? "/" : "") || "/";
}
function removeTrailingForwardSlash(path) {
  return path.endsWith("/") ? path.slice(0, path.length - 1) : path;
}
function removeLeadingForwardSlash(path) {
  return path.startsWith("/") ? path.substring(1) : path;
}
function trimSlashes(path) {
  return path.replace(/^\/|\/$/g, "");
}
function isString(path) {
  return typeof path === "string" || path instanceof String;
}
const INTERNAL_PREFIXES = /* @__PURE__ */ new Set(["/_", "/@", "/.", "//"]);
const JUST_SLASHES = /^\/{2,}$/;
function isInternalPath(path) {
  return INTERNAL_PREFIXES.has(path.slice(0, 2)) && !JUST_SLASHES.test(path);
}
function joinPaths(...paths) {
  return paths.filter(isString).map((path, i) => {
    if (i === 0) {
      return removeTrailingForwardSlash(path);
    } else if (i === paths.length - 1) {
      return removeLeadingForwardSlash(path);
    } else {
      return trimSlashes(path);
    }
  }).join("/");
}
function removeQueryString(path) {
  const index = path.lastIndexOf("?");
  return index > 0 ? path.substring(0, index) : path;
}
function isRemotePath$1(src) {
  if (!src) return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  let decoded = trimmed;
  let previousDecoded = "";
  let maxIterations = 10;
  while (decoded !== previousDecoded && maxIterations > 0) {
    previousDecoded = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
    maxIterations--;
  }
  if (/^[a-zA-Z]:/.test(decoded)) {
    return false;
  }
  if (decoded[0] === "/" && /^\/[\w.@-]/.test(decoded)) {
    return false;
  }
  if (decoded[0] === "\\") {
    return true;
  }
  if (decoded.startsWith("//")) {
    return true;
  }
  try {
    const url = new URL(decoded, "http://n");
    if (url.username || url.password) {
      return true;
    }
    if (decoded.includes("@") && !url.pathname.includes("@") && !url.search.includes("@")) {
      return true;
    }
    if (url.origin !== "http://n") {
      const protocol = url.protocol.toLowerCase();
      if (protocol === "file:") {
        return false;
      }
      return true;
    }
    if (URL.canParse(decoded)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}
function slash(path) {
  return path.replace(/\\/g, "/");
}
function fileExtension(path) {
  const ext = path.split(".").pop();
  return ext !== path ? `.${ext}` : "";
}
const WITH_FILE_EXT = /\/[^/]+\.\w+$/;
function hasFileExtension(path) {
  return WITH_FILE_EXT.test(path);
}

function matchPattern$1(url, remotePattern) {
  return matchProtocol$1(url, remotePattern.protocol) && matchHostname$1(url, remotePattern.hostname, true) && matchPort$1(url, remotePattern.port) && matchPathname$1(url, remotePattern.pathname, true);
}
function matchPort$1(url, port) {
  return !port || port === url.port;
}
function matchProtocol$1(url, protocol) {
  return !protocol || protocol === url.protocol.slice(0, -1);
}
function matchHostname$1(url, hostname, allowWildcard = false) {
  if (!hostname) {
    return true;
  } else if (!allowWildcard || !hostname.startsWith("*")) {
    return hostname === url.hostname;
  } else if (hostname.startsWith("**.")) {
    const slicedHostname = hostname.slice(2);
    return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
  } else if (hostname.startsWith("*.")) {
    const slicedHostname = hostname.slice(1);
    if (!url.hostname.endsWith(slicedHostname)) {
      return false;
    }
    const subdomainWithDot = url.hostname.slice(0, -(slicedHostname.length - 1));
    return subdomainWithDot.endsWith(".") && !subdomainWithDot.slice(0, -1).includes(".");
  }
  return false;
}
function matchPathname$1(url, pathname, allowWildcard = false) {
  if (!pathname) {
    return true;
  } else if (!allowWildcard || !pathname.endsWith("*")) {
    return pathname === url.pathname;
  } else if (pathname.endsWith("/**")) {
    const slicedPathname = pathname.slice(0, -2);
    return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
  } else if (pathname.endsWith("/*")) {
    const slicedPathname = pathname.slice(0, -1);
    if (!url.pathname.startsWith(slicedPathname)) {
      return false;
    }
    const additionalPathChunks = url.pathname.slice(slicedPathname.length).split("/").filter(Boolean);
    return additionalPathChunks.length === 1;
  }
  return false;
}
function isRemoteAllowed$1(src, {
  domains,
  remotePatterns
}) {
  if (!URL.canParse(src)) {
    return false;
  }
  const url = new URL(src);
  if (!["http:", "https:", "data:"].includes(url.protocol)) {
    return false;
  }
  return domains.some((domain) => matchHostname$1(url, domain)) || remotePatterns.some((remotePattern) => matchPattern$1(url, remotePattern));
}

function shouldAppendForwardSlash(trailingSlash, buildFormat) {
  switch (trailingSlash) {
    case "always":
      return true;
    case "never":
      return false;
    case "ignore": {
      switch (buildFormat) {
        case "directory":
          return true;
        case "preserve":
        case "file":
          return false;
      }
    }
  }
}

const ASTRO_VERSION = "6.4.8";
const ASTRO_GENERATOR = `Astro v${ASTRO_VERSION}`;
const REROUTE_DIRECTIVE_HEADER = "X-Astro-Reroute";
const REWRITE_DIRECTIVE_HEADER_KEY = "X-Astro-Rewrite";
const REWRITE_DIRECTIVE_HEADER_VALUE = "yes";
const NOOP_MIDDLEWARE_HEADER = "X-Astro-Noop";
const ROUTE_TYPE_HEADER = "X-Astro-Route-Type";
const INTERNAL_RESPONSE_HEADERS = [
  REROUTE_DIRECTIVE_HEADER,
  REWRITE_DIRECTIVE_HEADER_KEY,
  NOOP_MIDDLEWARE_HEADER,
  ROUTE_TYPE_HEADER
];
const ASTRO_ERROR_HEADER = "X-Astro-Error";
const DEFAULT_404_COMPONENT = "astro-default-404.astro";
const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308, 300, 304];
const REROUTABLE_STATUS_CODES = [404, 500];
const clientAddressSymbol = /* @__PURE__ */ Symbol.for("astro.clientAddress");
const originPathnameSymbol = /* @__PURE__ */ Symbol.for("astro.originPathname");
const pipelineSymbol = /* @__PURE__ */ Symbol.for("astro.pipeline");
const fetchStateSymbol = /* @__PURE__ */ Symbol.for("astro.fetchState");
const appSymbol = /* @__PURE__ */ Symbol.for("astro.app");
const responseSentSymbol$1 = /* @__PURE__ */ Symbol.for("astro.responseSent");

const ClientAddressNotAvailable = {
  name: "ClientAddressNotAvailable",
  title: "`Astro.clientAddress` is not available in current adapter.",
  message: (adapterName) => `\`Astro.clientAddress\` is not available in the \`${adapterName}\` adapter. File an issue with the adapter to add support.`
};
const PrerenderClientAddressNotAvailable = {
  name: "PrerenderClientAddressNotAvailable",
  title: "`Astro.clientAddress` cannot be used inside prerendered routes.",
  message: (name) => `\`Astro.clientAddress\` cannot be used inside prerendered route ${name}.`
};
const StaticClientAddressNotAvailable = {
  name: "StaticClientAddressNotAvailable",
  title: "`Astro.clientAddress` is not available in prerendered pages.",
  message: "`Astro.clientAddress` is only available on pages that are server-rendered.",
  hint: "See https://docs.astro.build/en/guides/on-demand-rendering/ for more information on how to enable SSR."
};
const NoMatchingStaticPathFound = {
  name: "NoMatchingStaticPathFound",
  title: "No static path found for requested path.",
  message: (pathName) => `A \`getStaticPaths()\` route pattern was matched, but no matching static path was found for requested path \`${pathName}\`.`,
  hint: (possibleRoutes) => `Possible dynamic routes being matched: ${possibleRoutes.join(", ")}.`
};
const OnlyResponseCanBeReturned = {
  name: "OnlyResponseCanBeReturned",
  title: "Invalid type returned by Astro page.",
  message: (route, returnedValue) => `Route \`${route ? route : ""}\` returned a \`${returnedValue}\`. Only a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) can be returned from Astro files.`,
  hint: "See https://docs.astro.build/en/guides/on-demand-rendering/#response for more information."
};
const MissingMediaQueryDirective = {
  name: "MissingMediaQueryDirective",
  title: "Missing value for `client:media` directive.",
  message: 'Media query not provided for `client:media` directive. A media query similar to `client:media="(max-width: 600px)"` must be provided.'
};
const NoMatchingRenderer = {
  name: "NoMatchingRenderer",
  title: "No matching renderer found.",
  message: (componentName, componentExtension, plural, validRenderersCount) => `Unable to render \`${componentName}\`.

${validRenderersCount > 0 ? `There ${plural ? "are" : "is"} ${validRenderersCount} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render \`${componentName}\`.` : `No valid renderer was found ${componentExtension ? `for the \`.${componentExtension}\` file extension.` : `for this file extension.`}`}`,
  hint: (probableRenderers) => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/guides/framework-components/ for more information on how to install and configure integrations.`
};
const NoClientOnlyHint = {
  name: "NoClientOnlyHint",
  title: "Missing hint on client:only directive.",
  message: (componentName) => `Unable to render \`${componentName}\`. When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
  hint: (probableRenderers) => `Did you mean to pass \`client:only="${probableRenderers}"\`? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on \`client:only\`.`
};
const InvalidGetStaticPathsEntry = {
  name: "InvalidGetStaticPathsEntry",
  title: "Invalid entry inside `getStaticPaths()`'s return value.",
  message: (entryType) => `Invalid entry returned by \`getStaticPaths()\`. Expected an object, got \`${entryType}\`.`,
  hint: "If you're using a `.map` call, you might be looking for `.flatMap()` instead. See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on `getStaticPaths()`."
};
const InvalidGetStaticPathsReturn = {
  name: "InvalidGetStaticPathsReturn",
  title: "Invalid value returned by `getStaticPaths()`.",
  message: (returnType) => `Invalid type returned by \`getStaticPaths()\`. Expected an \`array\`, got \`${returnType}\`.`,
  hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on `getStaticPaths()`."
};
const GetStaticPathsExpectedParams = {
  name: "GetStaticPathsExpectedParams",
  title: "Missing params property on `getStaticPaths()` route.",
  message: "Missing or empty required `params` property on `getStaticPaths()` route.",
  hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on `getStaticPaths()`."
};
const GetStaticPathsInvalidRouteParam = {
  name: "GetStaticPathsInvalidRouteParam",
  title: "Invalid route parameter returned by `getStaticPaths()`.",
  message: (key, value, valueType) => `Invalid \`getStaticPaths()\` route parameter for \`${key}\`. Expected a string or undefined, received \`${valueType}\` (\`${value}\`).`,
  hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on `getStaticPaths()`."
};
const GetStaticPathsRequired = {
  name: "GetStaticPathsRequired",
  title: "`getStaticPaths()` function required for dynamic routes.",
  message: "`getStaticPaths()` function is required for dynamic routes. Make sure that you `export` a `getStaticPaths()` function from your dynamic route.",
  hint: `See https://docs.astro.build/en/guides/routing/#dynamic-routes for more information on dynamic routes.

	If you meant for this route to be server-rendered, set \`export const prerender = false;\` in the page.`
};
const ReservedSlotName = {
  name: "ReservedSlotName",
  title: "Invalid slot name.",
  message: (slotName) => `Unable to create a slot named \`${slotName}\`. \`${slotName}\` is a reserved slot name. Please update the name of this slot.`
};
const NoMatchingImport = {
  name: "NoMatchingImport",
  title: "No import found for component.",
  message: (componentName) => `Could not render \`${componentName}\`. No matching import has been found for \`${componentName}\`.`,
  hint: "Please make sure the component is properly imported."
};
const InvalidComponentArgs = {
  name: "InvalidComponentArgs",
  title: "Invalid component arguments.",
  message: (name) => `Invalid arguments passed to${name ? ` <${name}>` : ""} component.`,
  hint: "Astro components cannot be rendered directly via function call, such as `Component()` or `{items.map(Component)}`."
};
const PageNumberParamNotFound = {
  name: "PageNumberParamNotFound",
  title: "Page number param not found.",
  message: (paramName) => `[paginate()] page number param \`${paramName}\` not found in your filepath.`,
  hint: "Rename your file to `[page].astro` or `[...page].astro`."
};
const ImageMissingAlt = {
  name: "ImageMissingAlt",
  title: 'Image missing required "alt" property.',
  message: 'Image missing "alt" property. "alt" text is required to describe important images on the page.',
  hint: 'Use an empty string ("") for decorative images.'
};
const InvalidImageService = {
  name: "InvalidImageService",
  title: "Error while loading image service.",
  message: "There was an error loading the configured image service. Please see the stack trace for more information."
};
const MissingImageDimension = {
  name: "MissingImageDimension",
  title: "Missing image dimensions.",
  message: (missingDimension, imageURL) => `Missing ${missingDimension === "both" ? "width and height attributes" : `${missingDimension} attribute`} for ${imageURL}. When using remote images, both dimensions are required in order to avoid CLS.`,
  hint: "If your image is inside your `src` folder, you probably meant to import it instead. See [the Imports guide for more information](https://docs.astro.build/en/guides/imports/#other-assets). You can also use `inferSize={true}` for remote images to get the original dimensions."
};
const FailedToFetchRemoteImageDimensions = {
  name: "FailedToFetchRemoteImageDimensions",
  title: "Failed to retrieve remote image dimensions.",
  message: (imageURL) => `Failed to get the dimensions for ${imageURL}.`,
  hint: "Verify your remote image URL is accurate, and that you are not using `inferSize` with a file located in your `public/` folder."
};
const RemoteImageNotAllowed = {
  name: "RemoteImageNotAllowed",
  title: "Remote image is not allowed.",
  message: (imageURL) => `Remote image ${imageURL} is not allowed by your image configuration.`,
  hint: "Update `image.domains` or `image.remotePatterns`, or remove `inferSize` for this image."
};
const UnsupportedImageFormat = {
  name: "UnsupportedImageFormat",
  title: "Unsupported image format.",
  message: (format, imagePath, supportedFormats) => `Received unsupported format \`${format}\` from \`${imagePath}\`. Currently only ${supportedFormats.join(
    ", "
  )} are supported by our image services.`,
  hint: "Using an `img` tag directly instead of the `Image` component might be what you're looking for."
};
const UnsupportedImageConversion = {
  name: "UnsupportedImageConversion",
  title: "Unsupported image conversion.",
  message: "Converting between vector (such as SVGs) and raster (such as PNGs and JPEGs) images is not currently supported."
};
const PrerenderDynamicEndpointPathCollide = {
  name: "PrerenderDynamicEndpointPathCollide",
  title: "Prerendered dynamic endpoint has path collision.",
  message: (pathname) => `Could not render \`${pathname}\` with an \`undefined\` param as the generated path will collide during prerendering. Prevent passing \`undefined\` as \`params\` for the endpoint's \`getStaticPaths()\` function, or add an additional extension to the endpoint's filename.`,
  hint: (filename) => `Rename \`${filename}\` to \`${filename.replace(/\.(?:js|ts)/, (m) => `.json` + m)}\``
};
const ExpectedImage = {
  name: "ExpectedImage",
  title: "Expected src to be an image.",
  message: (src, typeofOptions, fullOptions) => `Expected \`src\` property for \`getImage\` or \`<Image />\` to be either an ESM imported image or a string with the path of a remote image. Received \`${src}\` (type: \`${typeofOptions}\`).

Full serialized options received: \`${fullOptions}\`.`,
  hint: "This error can often happen because of a wrong path. Make sure the path to your image is correct. If you're passing an async function, make sure to call and await it."
};
const ExpectedImageOptions = {
  name: "ExpectedImageOptions",
  title: "Expected image options.",
  message: (options) => `Expected \`getImage()\` parameter to be an object. Received \`${options}\`.`
};
const ExpectedNotESMImage = {
  name: "ExpectedNotESMImage",
  title: "Expected image options, not an ESM-imported image.",
  message: "An ESM-imported image cannot be passed directly to `getImage()`. Instead, pass an object with the image in the `src` property.",
  hint: "Try changing `getImage(myImage)` to `getImage({ src: myImage })`"
};
const IncompatibleDescriptorOptions = {
  name: "IncompatibleDescriptorOptions",
  title: "Cannot set both `densities` and `widths`.",
  message: "Only one of `densities` or `widths` can be specified. In most cases, you'll probably want to use only `widths` if you require specific widths.",
  hint: "Those attributes are used to construct a `srcset` attribute, which cannot have both `x` and `w` descriptors."
};
const NoImageMetadata = {
  name: "NoImageMetadata",
  title: "Could not process image metadata.",
  message: (imagePath) => `Could not process image metadata${imagePath ? ` for \`${imagePath}\`` : ""}.`,
  hint: "This is often caused by a corrupted or malformed image. Re-exporting the image from your image editor may fix this issue."
};
const ResponseSentError = {
  name: "ResponseSentError",
  title: "Unable to set response.",
  message: "The response has already been sent to the browser and cannot be altered."
};
const MiddlewareNoDataOrNextCalled = {
  name: "MiddlewareNoDataOrNextCalled",
  title: "The middleware didn't return a `Response`.",
  message: "Make sure your middleware returns a `Response` object, either directly or by returning the `Response` from calling the `next` function."
};
const MiddlewareNotAResponse = {
  name: "MiddlewareNotAResponse",
  title: "The middleware returned something that is not a `Response` object.",
  message: "Any data returned from middleware must be a valid `Response` object."
};
const EndpointDidNotReturnAResponse = {
  name: "EndpointDidNotReturnAResponse",
  title: "The endpoint did not return a `Response`.",
  message: "An endpoint must return either a `Response`, or a `Promise` that resolves with a `Response`."
};
const LocalsNotAnObject = {
  name: "LocalsNotAnObject",
  title: "Value assigned to `locals` is not accepted.",
  message: "`locals` can only be assigned to an object. Other values like numbers, strings, etc. are not accepted.",
  hint: "If you tried to remove some information from the `locals` object, try to use `delete` or set the property to `undefined`."
};
const LocalsReassigned = {
  name: "LocalsReassigned",
  title: "`locals` must not be reassigned.",
  message: "`locals` cannot be assigned directly.",
  hint: "Set a `locals` property instead."
};
const AstroResponseHeadersReassigned = {
  name: "AstroResponseHeadersReassigned",
  title: "`Astro.response.headers` must not be reassigned.",
  message: "Individual headers can be added to and removed from `Astro.response.headers`, but it must not be replaced with another instance of `Headers` altogether.",
  hint: "Consider using `Astro.response.headers.add()`, and `Astro.response.headers.delete()`."
};
const LocalImageUsedWrongly = {
  name: "LocalImageUsedWrongly",
  title: "Local images must be imported.",
  message: (imageFilePath) => `\`Image\`'s and \`getImage\`'s \`src\` parameter must be an imported image or a URL, it cannot be a string filepath. Received \`${imageFilePath}\`.`,
  hint: "If you want to use an image from your `src` folder, you need to either import it or if the image is coming from a content collection, use the [image() schema helper](https://docs.astro.build/en/guides/images/#images-in-content-collections). See https://docs.astro.build/en/reference/modules/astro-assets/#src-required for more information on the `src` property."
};
const MissingSharp = {
  name: "MissingSharp",
  title: "Could not find Sharp.",
  message: "Could not find Sharp. Please install Sharp (`sharp`) manually into your project or migrate to another image service.",
  hint: "See Sharp's installation instructions for more information: https://sharp.pixelplumbing.com/install. If you are not relying on `astro:assets` to optimize, transform, or process any images, you can configure a passthrough image service instead of installing Sharp. See https://docs.astro.build/en/reference/errors/missing-sharp for more information.\n\nSee https://docs.astro.build/en/guides/images/#default-image-service for more information on how to migrate to another image service."
};
const i18nNoLocaleFoundInPath = {
  name: "i18nNoLocaleFoundInPath",
  title: "The path doesn't contain any locale.",
  message: "You tried to use an i18n utility on a path that doesn't contain any locale. You can use `pathHasLocale` first to determine if the path has a locale."
};
const RewriteWithBodyUsed = {
  name: "RewriteWithBodyUsed",
  title: "Cannot use `Astro.rewrite()` after the request body has been read.",
  message: "`Astro.rewrite()` cannot be used if the request body has already been read. If you need to read the body, first clone the request."
};
const ForbiddenRewrite = {
  name: "ForbiddenRewrite",
  title: "Forbidden rewrite to a static route.",
  message: (from, to, component) => `You tried to rewrite the on-demand route '${from}' with the static route '${to}', when using the 'server' output. 

The static route '${to}' is rendered by the component
'${component}', which is marked as prerendered. This is a forbidden operation because during the build, the component '${component}' is compiled to an
HTML file, which can't be retrieved at runtime by Astro.`,
  hint: (component) => `Add \`export const prerender = false\` to the component '${component}', or use \`Astro.redirect()\`.`
};
const FontFamilyNotFound = {
  name: "FontFamilyNotFound",
  title: "Font family not found.",
  message: (family) => `No data was found for the \`"${family}"\` family passed to the \`<Font>\` component.`,
  hint: "This is often caused by a typo. Check that the `<Font />` component is using a `cssVariable` specified in your config."
};
const MissingGetFontFileRequestUrl = {
  name: "MissingGetFontFileRequestUrl",
  title: "`experimental_getFontFileURL()` requires the request URL with on-demand rendering.",
  hint: "Pass the request URL as the 2nd argument, for example `Astro.url`."
};
const UnableToLoadLogger = {
  name: "UnableToLoadLogger",
  title: "Unable to load the logger.",
  message: (path) => `Couldn't load the logger at given path "${path}".`
};
const ActionsReturnedInvalidDataError = {
  name: "ActionsReturnedInvalidDataError",
  title: "Action handler returned invalid data.",
  message: (error) => `Action handler returned invalid data. Handlers should return serializable data types like objects, arrays, strings, and numbers. Parse error: ${error}`,
  hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
};
const ActionNotFoundError = {
  name: "ActionNotFoundError",
  title: "Action not found.",
  message: (actionName) => `The server received a request for an action named \`${actionName}\` but could not find a match. If you renamed an action, check that you've updated your \`actions/index\` file and your calling code to match.`,
  hint: "You can run `astro check` to detect type errors caused by mismatched action names."
};
const SessionStorageInitError = {
  name: "SessionStorageInitError",
  title: "Session storage could not be initialized.",
  message: (error, driver) => `Error when initializing session storage${driver ? ` with driver \`${driver}\`` : ""}. \`${error ?? ""}\``,
  hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
};
const SessionStorageSaveError = {
  name: "SessionStorageSaveError",
  title: "Session data could not be saved.",
  message: (error, driver) => `Error when saving session data${driver ? ` with driver \`${driver}\`` : ""}. \`${error ?? ""}\``,
  hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
};
const CacheNotEnabled = {
  name: "CacheNotEnabled",
  title: "Cache is not enabled.",
  message: "`Astro.cache` is not available because the cache feature is not enabled. To use caching, configure a cache provider in your Astro config under `experimental.cache`.",
  hint: 'Use an adapter that provides a default cache provider, or set one explicitly: `experimental: { cache: { provider: "..." } }`. See https://docs.astro.build/en/reference/experimental-flags/route-caching/.'
};

function normalizeLF(code) {
  return code.replace(/\r\n|\r(?!\n)|\n/g, "\n");
}

function codeFrame(src, loc) {
  if (!loc || loc.line === void 0 || loc.column === void 0) {
    return "";
  }
  const lines = normalizeLF(src).split("\n").map((ln) => ln.replace(/\t/g, "  "));
  const visibleLines = [];
  for (let n = -2; n <= 2; n++) {
    if (lines[loc.line + n]) visibleLines.push(loc.line + n);
  }
  let gutterWidth = 0;
  for (const lineNo of visibleLines) {
    let w = `> ${lineNo}`;
    if (w.length > gutterWidth) gutterWidth = w.length;
  }
  let output = "";
  for (const lineNo of visibleLines) {
    const isFocusedLine = lineNo === loc.line - 1;
    output += isFocusedLine ? "> " : "  ";
    output += `${lineNo + 1} | ${lines[lineNo]}
`;
    if (isFocusedLine)
      output += `${Array.from({ length: gutterWidth }).join(" ")}  | ${Array.from({
        length: loc.column
      }).join(" ")}^
`;
  }
  return output;
}

class AstroError extends Error {
  loc;
  title;
  hint;
  frame;
  type = "AstroError";
  constructor(props, options) {
    const { name, title, message, stack, location, hint, frame } = props;
    super(message, options);
    this.title = title;
    this.name = name;
    if (message) this.message = message;
    this.stack = stack ? stack : this.stack;
    this.loc = location;
    this.hint = hint;
    this.frame = frame;
  }
  setLocation(location) {
    this.loc = location;
  }
  setName(name) {
    this.name = name;
  }
  setMessage(message) {
    this.message = message;
  }
  setHint(hint) {
    this.hint = hint;
  }
  setFrame(source, location) {
    this.frame = codeFrame(source, location);
  }
  static is(err) {
    return err?.type === "AstroError";
  }
}

let e=globalThis.process||{},t=e.argv||[],n=e.env||{},r$1=!(n.NO_COLOR||t.includes(`--no-color`))&&(!!n.FORCE_COLOR||t.includes(`--color`)||e.platform===`win32`||(e.stdout||{}).isTTY&&n.TERM!==`dumb`||!!n.CI),i=(e,t,n=e)=>r=>{let i=``+r,o=i.indexOf(t,e.length);return ~o?e+a(i,t,n,o)+t:e+i+t},a=(e,t,n,r)=>{let i=``,a=0;do i+=e.substring(a,r)+n,a=r+t.length,r=e.indexOf(t,a);while(~r);return i+e.substring(a)},o=(e=r$1)=>{let t=e?i:()=>String;return {isColorSupported:e,reset:t(`\x1B[0m`,`\x1B[0m`),bold:t(`\x1B[1m`,`\x1B[22m`,`\x1B[22m\x1B[1m`),dim:t(`\x1B[2m`,`\x1B[22m`,`\x1B[22m\x1B[2m`),italic:t(`\x1B[3m`,`\x1B[23m`),underline:t(`\x1B[4m`,`\x1B[24m`),inverse:t(`\x1B[7m`,`\x1B[27m`),hidden:t(`\x1B[8m`,`\x1B[28m`),strikethrough:t(`\x1B[9m`,`\x1B[29m`),black:t(`\x1B[30m`,`\x1B[39m`),red:t(`\x1B[31m`,`\x1B[39m`),green:t(`\x1B[32m`,`\x1B[39m`),yellow:t(`\x1B[33m`,`\x1B[39m`),blue:t(`\x1B[34m`,`\x1B[39m`),magenta:t(`\x1B[35m`,`\x1B[39m`),cyan:t(`\x1B[36m`,`\x1B[39m`),white:t(`\x1B[37m`,`\x1B[39m`),gray:t(`\x1B[90m`,`\x1B[39m`),bgBlack:t(`\x1B[40m`,`\x1B[49m`),bgRed:t(`\x1B[41m`,`\x1B[49m`),bgGreen:t(`\x1B[42m`,`\x1B[49m`),bgYellow:t(`\x1B[43m`,`\x1B[49m`),bgBlue:t(`\x1B[44m`,`\x1B[49m`),bgMagenta:t(`\x1B[45m`,`\x1B[49m`),bgCyan:t(`\x1B[46m`,`\x1B[49m`),bgWhite:t(`\x1B[47m`,`\x1B[49m`),blackBright:t(`\x1B[90m`,`\x1B[39m`),redBright:t(`\x1B[91m`,`\x1B[39m`),greenBright:t(`\x1B[92m`,`\x1B[39m`),yellowBright:t(`\x1B[93m`,`\x1B[39m`),blueBright:t(`\x1B[94m`,`\x1B[39m`),magentaBright:t(`\x1B[95m`,`\x1B[39m`),cyanBright:t(`\x1B[96m`,`\x1B[39m`),whiteBright:t(`\x1B[97m`,`\x1B[39m`),bgBlackBright:t(`\x1B[100m`,`\x1B[49m`),bgRedBright:t(`\x1B[101m`,`\x1B[49m`),bgGreenBright:t(`\x1B[102m`,`\x1B[49m`),bgYellowBright:t(`\x1B[103m`,`\x1B[49m`),bgBlueBright:t(`\x1B[104m`,`\x1B[49m`),bgMagentaBright:t(`\x1B[105m`,`\x1B[49m`),bgCyanBright:t(`\x1B[106m`,`\x1B[49m`),bgWhiteBright:t(`\x1B[107m`,`\x1B[49m`)}};var s=o();

const UNDEFINED = -1;
const HOLE = -2;
const NAN = -3;
const POSITIVE_INFINITY = -4;
const NEGATIVE_INFINITY = -5;
const NEGATIVE_ZERO = -6;
const SPARSE = -7;

// The largest valid value for a JavaScript array's `length` property,
// and the largest valid array index (one less than the max length).
const MAX_ARRAY_LEN = 2 ** 32 - 1;
const MAX_ARRAY_INDEX = MAX_ARRAY_LEN - 1;

class DevalueError extends Error {
	/**
	 * @param {string} message
	 * @param {string[]} keys
	 * @param {any} [value] - The value that failed to be serialized
	 * @param {any} [root] - The root value being serialized
	 */
	constructor(message, keys, value, root) {
		super(message);
		this.name = 'DevalueError';
		this.path = keys.join('');
		this.value = value;
		this.root = root;
	}
}

/** @param {any} thing */
function is_primitive(thing) {
	return thing === null || (typeof thing !== 'object' && typeof thing !== 'function');
}

const object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(Object.prototype)
	.sort()
	.join('\0');

/** @param {any} thing */
function is_plain_object(thing) {
	const proto = Object.getPrototypeOf(thing);

	return (
		proto === Object.prototype ||
		proto === null ||
		Object.getPrototypeOf(proto) === null ||
		Object.getOwnPropertyNames(proto).sort().join('\0') === object_proto_names
	);
}

/** @param {any} thing */
function get_type(thing) {
	return Object.prototype.toString.call(thing).slice(8, -1);
}

/** @param {string} char */
function get_escaped_char(char) {
	switch (char) {
		case '"':
			return '\\"';
		case '<':
			return '\\u003C';
		case '\\':
			return '\\\\';
		case '\n':
			return '\\n';
		case '\r':
			return '\\r';
		case '\t':
			return '\\t';
		case '\b':
			return '\\b';
		case '\f':
			return '\\f';
		case '\u2028':
			return '\\u2028';
		case '\u2029':
			return '\\u2029';
		default:
			return char < ' ' ? `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}` : '';
	}
}

/** @param {string} str */
function stringify_string(str) {
	let result = '';
	let last_pos = 0;
	const len = str.length;

	for (let i = 0; i < len; i += 1) {
		const char = str[i];
		const replacement = get_escaped_char(char);
		if (replacement) {
			result += str.slice(last_pos, i) + replacement;
			last_pos = i + 1;
		}
	}

	return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}

/** @param {Record<string | symbol, any>} object */
function enumerable_symbols(object) {
	return Object.getOwnPropertySymbols(object).filter(
		(symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable
	);
}

const is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

/** @param {string} key */
function stringify_key(key) {
	return is_identifier.test(key) ? '.' + key : '[' + JSON.stringify(key) + ']';
}

/** @param {number} n */
function is_valid_array_index(n) {
	if (!Number.isInteger(n)) return false;
	if (n < 0) return false;
	if (n > MAX_ARRAY_INDEX) return false;
	return true;
}

/** @param {number} n */
function is_valid_array_len(n) {
	if (!Number.isInteger(n)) return false;
	if (n < 0) return false;
	if (n > MAX_ARRAY_LEN) return false;
	return true;
}

/** @param {string} s */
function is_valid_array_index_string(s) {
	if (s.length === 0) return false;
	if (s.length > 1 && s.charCodeAt(0) === 48) return false; // leading zero
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		if (c < 48 || c > 57) return false;
	}
	// by this point we know it's a string of digits, but it has to be within
	// the range of valid array indices
	return is_valid_array_index(+s);
}

/**
 * Finds the populated indices of an array.
 * @param {unknown[]} array
 */
function valid_array_indices(array) {
	const keys = Object.keys(array);
	for (var i = keys.length - 1; i >= 0; i--) {
		if (is_valid_array_index_string(keys[i])) {
			break;
		}
	}
	keys.length = i + 1;
	return keys;
}

/* Baseline 2025 runtimes */

/**	@type {(array_buffer: ArrayBuffer) => string} */
function encode_native(array_buffer) {
	return new Uint8Array(array_buffer).toBase64();
}

/**	@type {(base64: string) => ArrayBuffer} */
function decode_native(base64) {
	return Uint8Array.fromBase64(base64).buffer;
}

/* Node-compatible runtimes */

/** @type {(array_buffer: ArrayBuffer) => string} */
function encode_buffer(array_buffer) {
	return Buffer.from(array_buffer).toString('base64');
}

/**	@type {(base64: string) => ArrayBuffer} */
function decode_buffer(base64) {
	return Uint8Array.from(Buffer.from(base64, 'base64')).buffer;
}

/* Legacy runtimes */

/** @type {(array_buffer: ArrayBuffer) => string} */
function encode_legacy(array_buffer) {
	const array = new Uint8Array(array_buffer);
	let binary = '';

	// the maximum number of arguments to String.fromCharCode.apply
	// should be around 0xFFFF in modern engines
	const chunk_size = 0x8000;
	for (let i = 0; i < array.length; i += chunk_size) {
		const chunk = array.subarray(i, i + chunk_size);
		binary += String.fromCharCode.apply(null, chunk);
	}

	return btoa(binary);
}

/**	@type {(base64: string) => ArrayBuffer} */
function decode_legacy(base64) {
	const binary_string = atob(base64);
	const len = binary_string.length;
	const array = new Uint8Array(len);

	for (let i = 0; i < len; i++) {
		array[i] = binary_string.charCodeAt(i);
	}

	return array.buffer;
}

const native = typeof Uint8Array.fromBase64 === 'function';
const buffer = typeof process === 'object' && process.versions?.node !== undefined;

const encode64 = native ? encode_native : buffer ? encode_buffer : encode_legacy;
const decode64 = native ? decode_native : buffer ? decode_buffer : decode_legacy;

/**
 * Revive a value serialized with `devalue.stringify`
 * @param {string} serialized
 * @param {Record<string, (value: any) => any>} [revivers]
 */
function parse$1(serialized, revivers) {
	return unflatten$1(JSON.parse(serialized), revivers);
}

/**
 * Revive a value flattened with `devalue.stringify`
 * @param {number | any[]} parsed
 * @param {Record<string, (value: any) => any>} [revivers]
 */
function unflatten$1(parsed, revivers) {
	if (typeof parsed === 'number') return hydrate(parsed, true);

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error('Invalid input');
	}

	const values = /** @type {any[]} */ (parsed);

	const hydrated = Array(values.length);

	/**
	 * A set of values currently being hydrated with custom revivers,
	 * used to detect invalid cyclical dependencies
	 * @type {Set<number> | null}
	 */
	let hydrating = null;

	/**
	 * @param {number} index
	 * @returns {any}
	 */
	function hydrate(index, standalone = false) {
		if (index === UNDEFINED) return undefined;
		if (index === NAN) return NaN;
		if (index === POSITIVE_INFINITY) return Infinity;
		if (index === NEGATIVE_INFINITY) return -Infinity;
		if (index === NEGATIVE_ZERO) return -0;

		if (standalone || typeof index !== 'number') {
			throw new Error(`Invalid input`);
		}

		if (index in hydrated) return hydrated[index];

		const value = values[index];

		if (!value || typeof value !== 'object') {
			hydrated[index] = value;
		} else if (Array.isArray(value)) {
			if (typeof value[0] === 'string') {
				const type = value[0];

				const reviver = revivers && Object.hasOwn(revivers, type) ? revivers[type] : undefined;

				if (reviver) {
					let i = value[1];
					if (typeof i !== 'number') {
						// if it's not a number, it was serialized by a builtin reviver
						// so we need to munge it into the format expected by a custom reviver
						i = values.push(value[1]) - 1;
					}

					hydrating ??= new Set();

					if (hydrating.has(i)) {
						throw new Error('Invalid circular reference');
					}

					hydrating.add(i);
					hydrated[index] = reviver(hydrate(i));
					hydrating.delete(i);

					return hydrated[index];
				}

				switch (type) {
					case 'Date':
						hydrated[index] = new Date(value[1]);
						break;

					case 'Set':
						const set = new Set();
						hydrated[index] = set;
						for (let i = 1; i < value.length; i += 1) {
							set.add(hydrate(value[i]));
						}
						break;

					case 'Map':
						const map = new Map();
						hydrated[index] = map;
						for (let i = 1; i < value.length; i += 2) {
							map.set(hydrate(value[i]), hydrate(value[i + 1]));
						}
						break;

					case 'RegExp':
						hydrated[index] = new RegExp(value[1], value[2]);
						break;

					case 'Object': {
						const wrapped_index = value[1];

						if (
							typeof values[wrapped_index] === 'object' &&
							values[wrapped_index][0] !== 'BigInt'
						) {
							// avoid infinite recusion in case of malformed input
							throw new Error('Invalid input');
						}

						hydrated[index] = Object(hydrate(wrapped_index));
						break;
					}

					case 'BigInt':
						hydrated[index] = BigInt(value[1]);
						break;

					case 'null':
						const obj = Object.create(null);
						hydrated[index] = obj;
						for (let i = 1; i < value.length; i += 2) {
							if (value[i] === '__proto__') {
								throw new Error('Cannot parse an object with a `__proto__` property');
							}

							obj[value[i]] = hydrate(value[i + 1]);
						}
						break;

					case 'Int8Array':
					case 'Uint8Array':
					case 'Uint8ClampedArray':
					case 'Int16Array':
					case 'Uint16Array':
					case 'Float16Array':
					case 'Int32Array':
					case 'Uint32Array':
					case 'Float32Array':
					case 'Float64Array':
					case 'BigInt64Array':
					case 'BigUint64Array':
					case 'DataView': {
						if (values[value[1]][0] !== 'ArrayBuffer') {
							// without this, if we receive malformed input we could
							// end up trying to hydrate in a circle or allocate
							// huge amounts of memory when we call `new TypedArrayConstructor(buffer)`
							throw new Error('Invalid data');
						}

						const TypedArrayConstructor = globalThis[type];
						const buffer = hydrate(value[1]);

						hydrated[index] =
							value[2] !== undefined
								? new TypedArrayConstructor(buffer, value[2], value[3])
								: new TypedArrayConstructor(buffer);

						break;
					}

					case 'ArrayBuffer': {
						const base64 = value[1];
						if (typeof base64 !== 'string') {
							throw new Error('Invalid ArrayBuffer encoding');
						}
						const arraybuffer = decode64(base64);
						hydrated[index] = arraybuffer;
						break;
					}

					case 'Temporal.Duration':
					case 'Temporal.Instant':
					case 'Temporal.PlainDate':
					case 'Temporal.PlainTime':
					case 'Temporal.PlainDateTime':
					case 'Temporal.PlainMonthDay':
					case 'Temporal.PlainYearMonth':
					case 'Temporal.ZonedDateTime': {
						const temporalName = type.slice(9);
						// @ts-expect-error TS doesn't know about Temporal yet
						hydrated[index] = Temporal[temporalName].from(value[1]);
						break;
					}

					case 'URL': {
						const url = new URL(value[1]);
						hydrated[index] = url;
						break;
					}

					case 'URLSearchParams': {
						const url = new URLSearchParams(value[1]);
						hydrated[index] = url;
						break;
					}

					default:
						throw new Error(`Unknown type ${type}`);
				}
			} else if (value[0] === SPARSE) {
				// Sparse array encoding: [SPARSE, length, idx, val, idx, val, ...]
				const len = value[1];

				if (!is_valid_array_len(len)) {
					throw new Error('Invalid input');
				}

				/** @type {any[]} */
				const array = [];
				hydrated[index] = array;

				// Setting `array.length = len` (or equivalently calling `new Array(len)`)
				// on an untrusted `len` is a DoS vector: V8 eagerly allocates a
				// contiguous backing store for array lengths below ~10^8, so a
				// small payload with a huge declared length can force arbitrary
				// memory allocation. Touching the largest-possible index first
				// forces V8 into dictionary-elements mode, where `length` is
				// just a number and no contiguous allocation occurs.
				array[MAX_ARRAY_INDEX] = undefined;
				delete array[MAX_ARRAY_INDEX];

				for (let i = 2; i < value.length; i += 2) {
					const idx = value[i];

					if (!is_valid_array_index(idx) || idx >= len) {
						throw new Error('Invalid input');
					}

					array[idx] = hydrate(value[i + 1]);
				}

				array.length = len;
			} else {
				const array = new Array(value.length);
				hydrated[index] = array;

				for (let i = 0; i < value.length; i += 1) {
					const n = value[i];
					if (n === HOLE) continue;

					array[i] = hydrate(n);
				}
			}
		} else {
			/** @type {Record<string, any>} */
			const object = {};
			hydrated[index] = object;

			for (const key of Object.keys(value)) {
				if (key === '__proto__') {
					throw new Error('Cannot parse an object with a `__proto__` property');
				}

				const n = value[key];
				object[key] = hydrate(n);
			}
		}

		return hydrated[index];
	}

	return hydrate(0);
}

/**
 * Turn a value into a JSON string that can be parsed with `devalue.parse`
 * @param {any} value
 * @param {Record<string, (value: any) => any>} [reducers]
 */
function stringify$2(value, reducers) {
	const stringified = run(false, value, reducers);
	return typeof stringified === 'string' ? stringified : `[${stringified.join(',')}]`;
}

/**
 * @param {boolean} async
 * @param {any} value
 * @param {Record<string, (value: any) => any>} [reducers]
 */
function run(async, value, reducers) {
	/** @type {any[]} */
	const stringified = [];

	/** @type {Map<any, number>} */
	const indexes = new Map();

	/** @type {Array<{ key: string, fn: (value: any) => any }>} */
	const custom = [];
	if (reducers) {
		for (const key of Object.getOwnPropertyNames(reducers)) {
			custom.push({ key, fn: reducers[key] });
		}
	}

	/** @type {string[]} */
	const keys = [];

	let p = 0;

	/**
	 * @param {any} thing
	 * @param {number} [index]
	 */
	function flatten(thing, index) {
		if (thing === undefined) return UNDEFINED;
		if (Number.isNaN(thing)) return NAN;
		if (thing === Infinity) return POSITIVE_INFINITY;
		if (thing === -Infinity) return NEGATIVE_INFINITY;
		if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO;

		if (indexes.has(thing)) return /** @type {number} */ (indexes.get(thing));

		index ??= p++;
		indexes.set(thing, index);

		for (const { key, fn } of custom) {
			const value = fn(thing);
			if (value) {
				stringified[index] = `["${key}",${flatten(value)}]`;
				return index;
			}
		}

		if (typeof thing === 'function') {
			throw new DevalueError(`Cannot stringify a function`, keys, thing, value);
		} else if (typeof thing === 'symbol') {
			throw new DevalueError(`Cannot stringify a Symbol primitive`, keys, thing, value);
		}

		/** @type {string | Promise<any>} */
		let str = '';

		if (is_primitive(thing)) {
			str = stringify_primitive(thing);
		} else if (typeof thing.then === 'function') {
			{
				throw new DevalueError(
					`Cannot stringify a Promise or thenable — use stringifyAsync instead`,
					keys,
					thing,
					value
				);
			}
		} else {
			const type = get_type(thing);

			switch (type) {
				case 'Number':
				case 'String':
				case 'Boolean':
				case 'BigInt':
					str = `["Object",${flatten(thing.valueOf())}]`;
					break;

				case 'Date':
					const valid = !isNaN(thing.getDate());
					str = `["Date","${valid ? thing.toISOString() : ''}"]`;
					break;

				case 'URL':
					str = `["URL",${stringify_string(thing.toString())}]`;
					break;

				case 'URLSearchParams':
					str = `["URLSearchParams",${stringify_string(thing.toString())}]`;
					break;

				case 'RegExp':
					const { source, flags } = thing;
					str = flags
						? `["RegExp",${stringify_string(source)},"${flags}"]`
						: `["RegExp",${stringify_string(source)}]`;
					break;

				case 'Array': {
					// For dense arrays (no holes), we iterate normally.
					// When we encounter the first hole, we call Object.keys
					// to determine the sparseness, then decide between:
					//   - HOLE encoding: [-2, val, -2, ...] (default)
					//   - Sparse encoding: [-7, length, idx, val, ...] (for very sparse arrays)
					// Only the sparse path avoids iterating every slot, which
					// is what protects against the DoS of e.g. `arr[1000000] = 1`.
					let mostly_dense = false;

					str = '[';

					for (let i = 0; i < thing.length; i += 1) {
						if (i > 0) str += ',';

						if (Object.hasOwn(thing, i)) {
							keys.push(`[${i}]`);
							str += flatten(thing[i]);
							keys.pop();
						} else if (mostly_dense) {
							// Use dense encoding. The heuristic guarantees the
							// array is only mildly sparse, so iterating over every
							// slot is fine.
							str += HOLE;
						} else {
							// Decide between HOLE encoding and sparse encoding.
							//
							// HOLE encoding: each hole is serialized as the HOLE
							// sentinel (-2). For example, [, "a", ,] becomes
							// [-2, 0, -2]. Each hole costs 3 chars ("-2" + comma).
							//
							// Sparse encoding: lists only populated indices.
							// For example, [, "a", ,] becomes [-7, 3, 1, 0] — the
							// -7 sentinel, the array length (3), then index-value
							// pairs. This avoids paying per-hole, but each element
							// costs extra chars to write its index.
							//
							// The values are the same size either way, so the
							// choice comes down to structural overhead:
							//
							//   HOLE overhead:
							//     3 chars per hole ("-2" + comma)
							//     = (L - P) * 3
							//
							//   Sparse overhead:
							//     "-7,"          — 3 chars (sparse sentinel + comma)
							//     + length + "," — (d + 1) chars (array length + comma)
							//     + per element: index + "," — (d + 1) chars
							//     = (4 + d) + P * (d + 1)
							//
							// where L is the array length, P is the number of
							// populated elements, and d is the number of digits
							// in L (an upper bound on the digits in any index).
							//
							// Sparse encoding is cheaper when:
							//   (4 + d) + P * (d + 1) < (L - P) * 3
							const populated_keys = valid_array_indices(/** @type {any[]} */ (thing));
							const population = populated_keys.length;
							const d = String(thing.length).length;

							const hole_cost = (thing.length - population) * 3;
							const sparse_cost = 4 + d + population * (d + 1);

							if (hole_cost > sparse_cost) {
								str = '[' + SPARSE + ',' + thing.length;
								for (let j = 0; j < populated_keys.length; j++) {
									const key = populated_keys[j];
									keys.push(`[${key}]`);
									str += ',' + key + ',' + flatten(thing[key]);
									keys.pop();
								}
								break;
							} else {
								mostly_dense = true;
								str += HOLE;
							}
						}
					}

					str += ']';

					break;
				}

				case 'Set':
					str = '["Set"';

					for (const value of thing) {
						str += `,${flatten(value)}`;
					}

					str += ']';
					break;

				case 'Map':
					str = '["Map"';

					for (const [key, value] of thing) {
						keys.push(`.get(${is_primitive(key) ? stringify_primitive(key) : '...'})`);
						str += `,${flatten(key)},${flatten(value)}`;
						keys.pop();
					}

					str += ']';
					break;

				case 'Int8Array':
				case 'Uint8Array':
				case 'Uint8ClampedArray':
				case 'Int16Array':
				case 'Uint16Array':
				case 'Float16Array':
				case 'Int32Array':
				case 'Uint32Array':
				case 'Float32Array':
				case 'Float64Array':
				case 'BigInt64Array':
				case 'BigUint64Array':
				case 'DataView': {
					/** @type {import("./types.js").TypedArray} */
					const typedArray = thing;
					str = '["' + type + '",' + flatten(typedArray.buffer);

					// handle subarrays
					if (typedArray.byteLength !== typedArray.buffer.byteLength) {
						// to be used with `new TypedArray(buffer, byteOffset, length)`
						str += `,${typedArray.byteOffset},${typedArray.length}`;
					}

					str += ']';
					break;
				}

				case 'ArrayBuffer': {
					/** @type {ArrayBuffer} */
					const arraybuffer = thing;
					const base64 = encode64(arraybuffer);

					str = `["ArrayBuffer","${base64}"]`;
					break;
				}

				case 'Temporal.Duration':
				case 'Temporal.Instant':
				case 'Temporal.PlainDate':
				case 'Temporal.PlainTime':
				case 'Temporal.PlainDateTime':
				case 'Temporal.PlainMonthDay':
				case 'Temporal.PlainYearMonth':
				case 'Temporal.ZonedDateTime':
					str = `["${type}",${stringify_string(thing.toString())}]`;
					break;

				default:
					if (!is_plain_object(thing)) {
						throw new DevalueError(`Cannot stringify arbitrary non-POJOs`, keys, thing, value);
					}

					if (enumerable_symbols(thing).length > 0) {
						throw new DevalueError(`Cannot stringify POJOs with symbolic keys`, keys, thing, value);
					}

					if (Object.getPrototypeOf(thing) === null) {
						str = '["null"';
						for (const key of Object.keys(thing)) {
							if (key === '__proto__') {
								throw new DevalueError(
									`Cannot stringify objects with __proto__ keys`,
									keys,
									thing,
									value
								);
							}

							keys.push(stringify_key(key));
							str += `,${stringify_string(key)},${flatten(thing[key])}`;
							keys.pop();
						}
						str += ']';
					} else {
						str = '{';
						let started = false;
						for (const key of Object.keys(thing)) {
							if (key === '__proto__') {
								throw new DevalueError(
									`Cannot stringify objects with __proto__ keys`,
									keys,
									thing,
									value
								);
							}

							if (started) str += ',';
							started = true;
							keys.push(stringify_key(key));
							str += `${stringify_string(key)}:${flatten(thing[key])}`;
							keys.pop();
						}
						str += '}';
					}
			}
		}

		stringified[index] = str;
		return index;
	}

	const index = flatten(value);

	// special case — value is represented as a negative index
	if (index < 0) return `${index}`;

	return stringified;
}

/**
 * @param {any} thing
 * @returns {string}
 */
function stringify_primitive(thing) {
	const type = typeof thing;
	if (type === 'string') return stringify_string(thing);
	if (thing === void 0) return UNDEFINED.toString();
	if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO.toString();
	if (type === 'bigint') return `["BigInt","${thing}"]`;
	return String(thing);
}

const ACTION_QUERY_PARAMS = {
  actionName: "_action"};
const ACTION_RPC_ROUTE_PATTERN = "/_actions/[...path]";

const __vite_import_meta_env__$1 = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "https://www.packershub.in", "SSR": true};
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
const statusToCodeMap = Object.fromEntries(
  Object.entries(codeToStatusMap).map(([key, value]) => [value, key])
);
class ActionError extends Error {
  type = "AstroActionError";
  code = "INTERNAL_SERVER_ERROR";
  status = 500;
  constructor(params) {
    super(params.message);
    this.code = params.code;
    this.status = ActionError.codeToStatus(params.code);
    if (params.stack) {
      this.stack = params.stack;
    }
  }
  static codeToStatus(code) {
    return codeToStatusMap[code];
  }
  static statusToCode(status) {
    return statusToCodeMap[status] ?? "INTERNAL_SERVER_ERROR";
  }
  static fromJson(body) {
    if (isInputError(body)) {
      return new ActionInputError(body.issues);
    }
    if (isActionError(body)) {
      return new ActionError(body);
    }
    return new ActionError({
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}
function isActionError(error) {
  return typeof error === "object" && error != null && "type" in error && error.type === "AstroActionError";
}
function isInputError(error) {
  return typeof error === "object" && error != null && "type" in error && error.type === "AstroActionInputError" && "issues" in error && Array.isArray(error.issues);
}
class ActionInputError extends ActionError {
  type = "AstroActionInputError";
  // We don't expose all ZodError properties.
  // Not all properties will serialize from server to client,
  // and we don't want to import the full ZodError object into the client.
  issues;
  fields;
  constructor(issues) {
    super({
      message: `Failed to validate: ${JSON.stringify(issues, null, 2)}`,
      code: "BAD_REQUEST"
    });
    this.issues = issues;
    this.fields = {};
    for (const issue of issues) {
      if (issue.path.length > 0) {
        const key = issue.path[0].toString();
        this.fields[key] ??= [];
        this.fields[key]?.push(issue.message);
      }
    }
  }
}
function deserializeActionResult(res) {
  if (res.type === "error") {
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      return {
        data: void 0,
        error: new ActionError({
          message: res.body,
          code: "INTERNAL_SERVER_ERROR"
        })
      };
    }
    if (Object.assign(__vite_import_meta_env__$1, { OS: "Windows_NT", Path: "D:\\User\\Downloads\\packershub_v2\\node_modules\\.bin;D:\\User\\Downloads\\node_modules\\.bin;D:\\User\\node_modules\\.bin;D:\\node_modules\\.bin;C:\\Users\\sneha suresh\\AppData\\Roaming\\npm\\node_modules\\npm\\node_modules\\@npmcli\\run-script\\lib\\node-gyp-bin;C:\\Program Files\\Microsoft\\jdk-17.0.14.7-hotspot\\bin;C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\;C:\\Windows\\System32\\OpenSSH\\;C:\\Program Files (x86)\\NVIDIA Corporation\\PhysX\\Common;C:\\Program Files\\NVIDIA Corporation\\NVIDIA NvDLISR;C:\\Program Files\\Git\\cmd;C:\\mingw64\\bin;C:\\Program Files\\Microsoft SQL Server\\110\\Tools\\Binn\\;C:\\Program Files (x86)\\Microsoft SQL Server\\110\\Tools\\Binn\\;C:\\Program Files\\Microsoft SQL Server\\110\\DTS\\Binn\\;C:\\Program Files (x86)\\Microsoft SQL Server\\110\\Tools\\Binn\\ManagementStudio\\;C:\\Program Files (x86)\\Microsoft SQL Server\\110\\DTS\\Binn\\;C:\\Users\\sneha suresh\\AppData\\Local\\nvm;C:\\nvm4w\\nodejs;C:\\Program Files\\nodejs\\;C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem;C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\;C:\\WINDOWS\\System32\\OpenSSH\\;C:\\ProgramData\\chocolatey\\bin;C:\\Program Files\\Microsoft\\jdk-17.0.14.7-hotspot\\\\bin;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\emulator;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\platform-tools;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\tools;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\tools\\bin;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\cmdline-tools\\latest\\bin;C:\\Users\\sneha suresh\\AppData\\Local\\Programs\\Python\\Python310\\Scripts\\;C:\\Users\\sneha suresh\\AppData\\Local\\Programs\\Python\\Python310\\;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\tools;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\tools;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\tools;C:\\Users\\sneha suresh\\AppData\\Local\\Microsoft\\WindowsApps;C:\\Users\\sneha suresh\\AppData\\Local\\Programs\\Microsoft VS Code\\bin;C:\\Users\\sneha suresh\\AppData\\Local\\GitHubDesktop\\bin;C:\\Users\\sneha suresh\\AppData\\Local\\nvm;C:\\Program Files\\nodejs;C:\\Users\\sneha suresh\\AppData\\Roaming\\npm;C:\\Users\\sneha suresh\\AppData\\Local\\Android\\Sdk\\platform-tools;C:\\Users\\sneha suresh\\AppData\\Local\\Programs\\cursor\\resources\\app\\bin" })?.PROD) {
      return { error: ActionError.fromJson(json), data: void 0 };
    } else {
      const error = ActionError.fromJson(json);
      error.stack = actionResultErrorStack.get();
      return {
        error,
        data: void 0
      };
    }
  }
  if (res.type === "empty") {
    return { data: void 0, error: void 0 };
  }
  return {
    data: parse$1(res.body, {
      URL: (href) => new URL(href)
    }),
    error: void 0
  };
}
const actionResultErrorStack = /* @__PURE__ */ (function actionResultErrorStackFn() {
  let errorStack;
  return {
    set(stack) {
      errorStack = stack;
    },
    get() {
      return errorStack;
    }
  };
})();
function getActionQueryString(name) {
  const searchParams = new URLSearchParams({ [ACTION_QUERY_PARAMS.actionName]: name });
  return `?${searchParams.toString()}`;
}

/* es-module-lexer 2.1.0 */
var ImportType;!function(A){A[A.Static=1]="Static",A[A.Dynamic=2]="Dynamic",A[A.ImportMeta=3]="ImportMeta",A[A.StaticSourcePhase=4]="StaticSourcePhase",A[A.DynamicSourcePhase=5]="DynamicSourcePhase",A[A.StaticDeferPhase=6]="StaticDeferPhase",A[A.DynamicDeferPhase=7]="DynamicDeferPhase";}(ImportType||(ImportType={}));1===new Uint8Array(new Uint16Array([1]).buffer)[0];const E=()=>{return A="AGFzbQEAAAABKwhgAX8Bf2AEf39/fwBgAAF/YAAAYAF/AGADf39/AX9gAn9/AX9gA39/fwADODcAAQECAgICAgICAgICAgICAgICAgICAgICAwIAAwMDBAAEAAAABQAAAAAAAwMDAAAGAAcABgIFBAUBcAEBAQUDAQABBg8CfwFBsPIAC38AQbDyAAsHnQEbBm1lbW9yeQIAAnNhAAABZQADAmlzAAQCaWUABQJzcwAGAnNlAAcCaXQACAJhaQAJAmlkAAoCaXAACwJlcwAMAmVlAA0DZWxzAA4DZWxlAA8CcmkAEAJyZQARAWYAEgJtcwATAnJhABQDYWtzABUDYWtlABYDYXZzABcDYXZlABgDcnNhABkFcGFyc2UAGgtfX2hlYXBfYmFzZQMBCrxJN2gBAX9BACAANgL0CUEAKALQCSIBIABBAXRqIgBBADsBAEEAIABBAmoiADYC+AlBACAANgL8CUEAQQA2AtQJQQBBADYC5AlBAEEANgLcCUEAQQA2AtgJQQBBADYC7AlBAEEANgLgCSABC9MBAQN/QQAoAuQJIQRBAEEAKAL8CSIFNgLkCUEAIAQ2AugJQQAgBUEoajYC/AkgBEEkakHUCSAEGyAFNgIAQQAoAsgJIQRBACgCxAkhBiAFIAE2AgAgBSAANgIIIAUgAiACQQJqQQAgBiADRiIAGyAEIANGIgQbNgIMIAUgAzYCFCAFQQA2AhAgBSACNgIEIAVCADcCICAFQQNBAUECIAAbIAQbNgIcIAVBACgCxAkgA0YiAjoAGAJAAkAgAg0AQQAoAsgJIANHDQELQQBBAToAgAoLC14BAX9BACgC7AkiBEEQakHYCSAEG0EAKAL8CSIENgIAQQAgBDYC7AlBACAEQRRqNgL8CUEAQQE6AIAKIARBADYCECAEIAM2AgwgBCACNgIIIAQgATYCBCAEIAA2AgALCABBACgChAoLFQBBACgC3AkoAgBBACgC0AlrQQF1Cx4BAX9BACgC3AkoAgQiAEEAKALQCWtBAXVBfyAAGwsVAEEAKALcCSgCCEEAKALQCWtBAXULHgEBf0EAKALcCSgCDCIAQQAoAtAJa0EBdUF/IAAbCwsAQQAoAtwJKAIcCx4BAX9BACgC3AkoAhAiAEEAKALQCWtBAXVBfyAAGws7AQF/AkBBACgC3AkoAhQiAEEAKALECUcNAEF/DwsCQCAAQQAoAsgJRw0AQX4PCyAAQQAoAtAJa0EBdQsLAEEAKALcCS0AGAsVAEEAKALgCSgCAEEAKALQCWtBAXULFQBBACgC4AkoAgRBACgC0AlrQQF1Cx4BAX9BACgC4AkoAggiAEEAKALQCWtBAXVBfyAAGwseAQF/QQAoAuAJKAIMIgBBACgC0AlrQQF1QX8gABsLJQEBf0EAQQAoAtwJIgBBJGpB1AkgABsoAgAiADYC3AkgAEEARwslAQF/QQBBACgC4AkiAEEQakHYCSAAGygCACIANgLgCSAAQQBHCwgAQQAtAIgKCwgAQQAtAIAKCysBAX9BAEEAKAKMCiIAQRBqQQAoAtwJQSBqIAAbKAIAIgA2AowKIABBAEcLFQBBACgCjAooAgBBACgC0AlrQQF1CxUAQQAoAowKKAIEQQAoAtAJa0EBdQsVAEEAKAKMCigCCEEAKALQCWtBAXULFQBBACgCjAooAgxBACgC0AlrQQF1CwoAQQBBADYCjAoLuw8BBX8jAEGA0ABrIgAkAEEAQQE6AIgKQQBBACgCzAk2ApQKQQBBACgC0AlBfmoiATYCqApBACABQQAoAvQJQQF0aiICNgKsCkEAQQA6AIAKQQBBADsBkApBAEEAOwGSCkEAQQA6AJgKQQBBADYChApBAEEAOgDwCUEAIABBgBBqNgKcCkEAIAA2AqAKQQBBADoApAoCQAJAAkACQANAQQAgAUECaiIDNgKoCiABIAJPDQECQCADLwEAIgJBd2pBBUkNAAJAAkACQAJAAkAgAkGbf2oOBQEICAgCAAsgAkEgRg0EIAJBL0YNAyACQTtGDQIMBwtBAC8BkgoNASADEBtFDQEgAUEEakGCCEEKEDYNARAcQQAtAIgKDQFBAEEAKAKoCiIBNgKUCgwHCyADEBtFDQAgAUEEakGMCEEKEDYNABAdC0EAQQAoAqgKNgKUCgwBCwJAIAEvAQQiA0EqRg0AIANBL0cNBBAeDAELQQEQHwtBACgCrAohAkEAKAKoCiEBDAALC0EAIQIgAyEBQQAtAPAJDQIMAQtBACABNgKoCkEAQQA6AIgKCwNAQQAgAUECaiIDNgKoCgJAAkACQAJAAkACQAJAIAFBACgCrApPDQACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCADLwEAIgJBYGoOEBMSCRISEhIIAQUSEgQSEgoACwJAAkACQAJAIAJBpX9qDg8FFQYVFQ4VFQMVARUVFQIACyACQXdqQQVJDRUgAkGFf2oOAwgUCRQLQQAvAZIKDRMgAxAbRQ0TIAFBBGpBgghBChA2DRMQHAwTCyADEBtFDRIgAUEEakGMCEEKEDYNEhAdDBILIAMQG0UNESABKQAEQuyAhIOwjsA5Ug0RIAEvAQwiA0F3aiIBQRdLDQ9BASABdEGfgIAEcUUNDwwQC0EAQQAvAZIKIgFBAWo7AZIKQQAoApwKIAFBA3RqIgFBATYCACABQQAoApQKNgIEDBALQQBBAC8BkgoiAUEBajsBkgpBACgCnAogAUEDdGoiAUEINgIAIAFBACgClAo2AgQMDwtBAC8BkgoiAUUNC0EAIAFBf2o7AZIKDA4LQQAvAZAKIgNFDQ1BAC8BkgoiAkUNDSACQQN0QQAoApwKakF4aigCAEEFRw0NIANBAnRBACgCoApqQXxqKAIAIgMoAgQNDUEAIAFBBGo2AqgKIANBACgClApBAmo2AgRBARAgGiADQQAoAqgKIgE2AhBBACABQX5qNgKoCgwNC0EALwGSCiIDRQ0JQQAgA0F/aiIDOwGSCkEALwGQCiICRQ0MQQAoApwKIANB//8DcUEDdGooAgBBBUcNDAJAIAJBAnRBACgCoApqQXxqKAIAIgMoAgQNACADQQAoApQKQQJqNgIEC0EAIAJBf2o7AZAKIAMgAUEEajYCDAwMCwJAQQAoApQKIgEvAQBBKUcNAEEAKALkCSIDRQ0AIAMoAgQgAUcNAEEAQQAoAugJIgM2AuQJAkAgA0UNACADQQA2AiQMAQtBAEEANgLUCQtBAEEALwGSCiIDQQFqOwGSCkEAKAKcCiADQQN0aiIDQQZBAkEALQCkChs2AgAgAyABNgIEQQBBADoApAoMCwtBAC8BkgoiAUUNB0EAIAFBf2oiATsBkgpBACgCnAogAUH//wNxQQN0aigCAEEERg0EDAoLQScQIQwJC0EiECEMCAsCQAJAIAEvAQQiAUEqRg0AIAFBL0cNARAeDAoLQQEQHwwJCwJAAkACQAJAQQAoApQKIgEvAQAiAxAiRQ0AAkACQCADQVVqDgQACQEDCQsgAUF+ai8BAEErRg0DDAgLIAFBfmovAQBBLUYNAgwHCyADQSlHDQFBACgCnApBAC8BkgoiAkEDdGooAgQQI0UNAgwGCyABQX5qLwEAQVBqQf//A3FBCk8NBQtBAC8BkgohAgsCQAJAIAJB//8DcSICRQ0AIANB5gBHDQBBACgCnAogAkF/akEDdGoiBCgCAEEBRw0AIAFBfmovAQBB7wBHDQEgAUF8ahAkRQ0BIAQoAgRBlghBAxAlRQ0BDAULIANB/QBHDQBBACgCnAogAkEDdGoiAigCBBAmDQQgAigCAEEGRg0ECyABECcNAyADRQ0DIANBL0ZBAC0AmApBAEdxDQMCQEEAKALsCSICRQ0AIAEgAigCAEkNACABIAIoAgRNDQQLIAFBfmohAUEAKALQCSECAkADQCABQQJqIgQgAk0NAUEAIAE2ApQKIAEvAQAhAyABQX5qIgQhASADEChFDQALIARBAmohBAsCQCADQf//A3EQKUUNACAEQX5qIQECQANAIAFBAmoiAyACTQ0BQQAgATYClAogAS8BACEDIAFBfmoiBCEBIAMQKQ0ACyAEQQJqIQMLIAMQKg0EC0EAQQE6AJgKDAcLQQAoApwKQQAvAZIKIgFBA3QiA2pBACgClAo2AgRBACABQQFqOwGSCkEAKAKcCiADakEDNgIACxArDAULQQAtAPAJQQAvAZAKQQAvAZIKcnJFIQIMBwsQLEEAQQA6AJgKDAMLEC1BACECDAULIANBoAFHDQELQQBBAToApAoLQQBBACgCqAo2ApQKC0EAKAKoCiEBDAALCyAAQYDQAGokACACCxoAAkBBACgC0AkgAEcNAEEBDwsgAEF+ahAuC/4KAQZ/QQBBACgCqAoiAEEMaiIBNgKoCkEAKALsCSECQQEQICEDAkACQAJAAkACQAJAAkACQAJAQQAoAqgKIgQgAUcNACADEC9FDQELAkACQAJAAkACQAJAAkAgA0EqRg0AIANB+wBHDQFBACAEQQJqNgKoCkEBECAhA0EAKAKoCiEEA0ACQAJAIANB//8DcSIDQSJGDQAgA0EnRg0AIAMQMxpBACgCqAohAwwBCyADECFBAEEAKAKoCkECaiIDNgKoCgtBARAgGgJAIAQgAxA0IgNBLEcNAEEAQQAoAqgKQQJqNgKoCkEBECAhAwsgA0H9AEYNA0EAKAKoCiIFIARGDQ8gBSEEIAVBACgCrApNDQAMDwsLQQAgBEECajYCqApBARAgGkEAKAKoCiIDIAMQNBoMAgtBAEEAOgCICgJAAkACQAJAAkACQCADQZ9/ag4MAgsEAQsDCwsLCwsFAAsgA0H2AEYNBAwKC0EAIARBDmoiAzYCqAoCQAJAAkBBARAgQZ9/ag4GABICEhIBEgtBACgCqAoiBSkAAkLzgOSD4I3AMVINESAFLwEKEClFDRFBACAFQQpqNgKoCkEAECAaC0EAKAKoCiIFQQJqQbIIQQ4QNg0QIAUvARAiAkF3aiIBQRdLDQ1BASABdEGfgIAEcUUNDQwOC0EAKAKoCiIFKQACQuyAhIOwjsA5Ug0PIAUvAQoiAkF3aiIBQRdNDQYMCgtBACAEQQpqNgKoCkEAECAaQQAoAqgKIQQLQQAgBEEQajYCqAoCQEEBECAiBEEqRw0AQQBBACgCqApBAmo2AqgKQQEQICEEC0EAKAKoCiEDIAQQMxogA0EAKAKoCiIEIAMgBBACQQBBACgCqApBfmo2AqgKDwsCQCAEKQACQuyAhIOwjsA5Ug0AIAQvAQoQKEUNAEEAIARBCmo2AqgKQQEQICEEQQAoAqgKIQMgBBAzGiADQQAoAqgKIgQgAyAEEAJBAEEAKAKoCkF+ajYCqAoPC0EAIARBBGoiBDYCqAoLQQAgBEEGajYCqApBAEEAOgCICkEBECAhBEEAKAKoCiEDIAQQMyEEQQAoAqgKIQIgBEHf/wNxIgFB2wBHDQNBACACQQJqNgKoCkEBECAhBUEAKAKoCiEDQQAhBAwEC0EAQQE6AIAKQQBBACgCqApBAmo2AqgKC0EBECAhBEEAKAKoCiEDAkAgBEHmAEcNACADQQJqQawIQQYQNg0AQQAgA0EIajYCqAogAEEBECBBABAyIAJBEGpB2AkgAhshAwNAIAMoAgAiA0UNBSADQgA3AgggA0EQaiEDDAALC0EAIANBfmo2AqgKDAMLQQEgAXRBn4CABHFFDQMMBAtBASEECwNAAkACQCAEDgIAAQELIAVB//8DcRAzGkEBIQQMAQsCQAJAQQAoAqgKIgQgA0YNACADIAQgAyAEEAJBARAgIQQCQCABQdsARw0AIARBIHJB/QBGDQQLQQAoAqgKIQMCQCAEQSxHDQBBACADQQJqNgKoCkEBECAhBUEAKAKoCiEDIAVBIHJB+wBHDQILQQAgA0F+ajYCqAoLIAFB2wBHDQJBACACQX5qNgKoCg8LQQAhBAwACwsPCyACQaABRg0AIAJB+wBHDQQLQQAgBUEKajYCqApBARAgIgVB+wBGDQMMAgsCQCACQVhqDgMBAwEACyACQaABRw0CC0EAIAVBEGo2AqgKAkBBARAgIgVBKkcNAEEAQQAoAqgKQQJqNgKoCkEBECAhBQsgBUEoRg0BC0EAKAKoCiEBIAUQMxpBACgCqAoiBSABTQ0AIAQgAyABIAUQAkEAQQAoAqgKQX5qNgKoCg8LIAQgA0EAQQAQAkEAIARBDGo2AqgKDwsQLQuFDAEKf0EAQQAoAqgKIgBBDGoiATYCqApBARAgIQJBACgCqAohAwJAAkACQAJAAkACQAJAAkAgAkEuRw0AQQAgA0ECajYCqAoCQEEBECAiAkHkAEYNAAJAIAJB8wBGDQAgAkHtAEcNB0EAKAKoCiICQQJqQZwIQQYQNg0HAkBBACgClAoiAxAxDQAgAy8BAEEuRg0ICyAAIAAgAkEIakEAKALICRABDwtBACgCqAoiAkECakGiCEEKEDYNBgJAQQAoApQKIgMQMQ0AIAMvAQBBLkYNBwtBACEEQQAgAkEMajYCqApBASEFQQUhBkEBECAhAkEAIQdBASEIDAILQQAoAqgKIgIpAAJC5YCYg9CMgDlSDQUCQEEAKAKUCiIDEDENACADLwEAQS5GDQYLQQAhBEEAIAJBCmo2AqgKQQIhCEEHIQZBASEHQQEQICECQQEhBQwBCwJAAkACQAJAIAJB8wBHDQAgAyABTQ0AIANBAmpBoghBChA2DQACQCADLwEMIgRBd2oiB0EXSw0AQQEgB3RBn4CABHENAgsgBEGgAUYNAQtBACEHQQchBkEBIQQgAkHkAEYNAQwCC0EAIQRBACADQQxqIgI2AqgKQQEhBUEBECAhCQJAQQAoAqgKIgYgAkYNAEHmACECAkAgCUHmAEYNAEEFIQZBACEHQQEhCCAJIQIMBAtBACEHQQEhCCAGQQJqQawIQQYQNg0EIAYvAQgQKEUNBAtBACEHQQAgAzYCqApBByEGQQEhBEEAIQVBACEIIAkhAgwCCyADIABBCmpNDQBBACEIQeQAIQICQCADKQACQuWAmIPQjIA5Ug0AAkACQCADLwEKIgRBd2oiB0EXSw0AQQEgB3RBn4CABHENAQtBACEIIARBoAFHDQELQQAhBUEAIANBCmo2AqgKQSohAkEBIQdBAiEIQQEQICIJQSpGDQRBACADNgKoCkEBIQRBACEHQQAhCCAJIQIMAgsgAyEGQQAhBwwCC0EAIQVBACEICwJAIAJBKEcNAEEAKAKcCkEALwGSCiICQQN0aiIDQQAoAqgKNgIEQQAgAkEBajsBkgogA0EFNgIAQQAoApQKLwEAQS5GDQRBAEEAKAKoCiIDQQJqNgKoCkEBECAhAiAAQQAoAqgKQQAgAxABAkACQCAFDQBBACgC5AkhAQwBC0EAKALkCSIBIAY2AhwLQQBBAC8BkAoiA0EBajsBkApBACgCoAogA0ECdGogATYCAAJAIAJBIkYNACACQSdGDQBBAEEAKAKoCkF+ajYCqAoPCyACECFBAEEAKAKoCkECaiICNgKoCgJAAkACQEEBECBBV2oOBAECAgACC0EAQQAoAqgKQQJqNgKoCkEBECAaQQAoAuQJIgMgAjYCBCADQQE6ABggA0EAKAKoCiICNgIQQQAgAkF+ajYCqAoPC0EAKALkCSIDIAI2AgQgA0EBOgAYQQBBAC8BkgpBf2o7AZIKIANBACgCqApBAmo2AgxBAEEALwGQCkF/ajsBkAoPC0EAQQAoAqgKQX5qNgKoCg8LAkAgBEEBcyACQfsAR3INAEEAKAKoCiECQQAvAZIKDQUDQAJAAkACQCACQQAoAqwKTw0AQQEQICICQSJGDQEgAkEnRg0BIAJB/QBHDQJBAEEAKAKoCkECajYCqAoLQQEQICEDQQAoAqgKIQICQCADQeYARw0AIAJBAmpBrAhBBhA2DQcLQQAgAkEIajYCqAoCQEEBECAiAkEiRg0AIAJBJ0cNBwsgACACQQAQMg8LIAIQIQtBAEEAKAKoCkECaiICNgKoCgwACwsCQAJAIAJBWWoOBAMBAQMACyACQSJGDQILQQAoAqgKIQYLIAYgAUcNAEEAIABBCmo2AqgKDwsgAkEqRyAHcQ0DQQAvAZIKQf//A3ENA0EAKAKoCiECQQAoAqwKIQEDQCACIAFPDQECQAJAIAIvAQAiA0EnRg0AIANBIkcNAQsgACADIAgQMg8LQQAgAkECaiICNgKoCgwACwsQLQsPC0EAIAJBfmo2AqgKDwtBAEEAKAKoCkF+ajYCqAoLRwEDf0EAKAKoCkECaiEAQQAoAqwKIQECQANAIAAiAkF+aiABTw0BIAJBAmohACACLwEAQXZqDgQBAAABAAsLQQAgAjYCqAoLmAEBA39BAEEAKAKoCiIBQQJqNgKoCiABQQZqIQFBACgCrAohAgNAAkACQAJAIAFBfGogAk8NACABQX5qLwEAIQMCQAJAIAANACADQSpGDQEgA0F2ag4EAgQEAgQLIANBKkcNAwsgAS8BAEEvRw0CQQAgAUF+ajYCqAoMAQsgAUF+aiEBC0EAIAE2AqgKDwsgAUECaiEBDAALC5wBAQN/QQAoAqgKIQECQANAAkACQCABLwEAIgJBL0cNAAJAIAEvAQIiAUEqRg0AIAFBL0cNBBAeDAILIAAQHwwBCwJAAkAgAEUNACACQXdqIgFBF0sNAUEBIAF0QZ+AgARxRQ0BDAILIAIQKUUNAwwBCyACQaABRw0CC0EAQQAoAqgKIgNBAmoiATYCqAogA0EAKAKsCkkNAAsLIAILiAEBBH9BACgCqAohAUEAKAKsCiECAkACQANAIAEiA0ECaiEBIAMgAk8NASABLwEAIgQgAEYNAgJAIARB3ABGDQAgBEF2ag4EAgEBAgELIANBBGohASADLwEEQQ1HDQAgA0EGaiABIAMvAQZBCkYbIQEMAAsLQQAgATYCqAoQLQ8LQQAgATYCqAoLbAEBfwJAAkAgAEFfaiIBQQVLDQBBASABdEExcQ0BCyAAQUZqQf//A3FBBkkNACAAQSlHIABBWGpB//8DcUEHSXENAAJAIABBpX9qDgQBAAABAAsgAEH9AEcgAEGFf2pB//8DcUEESXEPC0EBCy4BAX9BASEBAkAgAEGcCUEFECUNACAAQZYIQQMQJQ0AIABBpglBAhAlIQELIAELygEBAn8CQAJAIAAvAQAiAUF3akEFSQ0AIAFBIEYNACABQSlGDQAgAUHdAEYNACABQaABRg0AQQAhAiABQf0ARw0BC0EAKALQCSECAkACQANAIAAvAQAhASAAIAJNDQECQCABQXdqQQVJDQAgAUEgRg0AIAFBoAFGDQACQCABQSlGDQAgAUHdAEYNACABQf0ARw0EC0EBDwsgAEF+aiEADAALC0EBIQIgAUEpRg0BIAFB3QBGDQEgAUH9AEYNAQsgARAvQQFzIQILIAILRgEDf0EAIQMCQCAAIAJBAXQiAmsiBEECaiIAQQAoAtAJIgVJDQAgACABIAIQNg0AAkAgACAFRw0AQQEPCyAEEC4hAwsgAwuDAQECf0EBIQECQAJAAkACQAJAAkAgAC8BACICQUVqDgQFBAQBAAsCQCACQZt/ag4EAwQEAgALIAJBKUYNBCACQfkARw0DIABBfmpBsglBBhAlDwsgAEF+ai8BAEE9Rg8LIABBfmpBqglBBBAlDwsgAEF+akG+CUEDECUPC0EAIQELIAELtAMBAn9BACEBAkACQAJAAkACQAJAAkACQAJAAkAgAC8BAEGcf2oOFAABAgkJCQkDCQkEBQkJBgkHCQkICQsCQAJAIABBfmovAQBBl39qDgQACgoBCgsgAEF8akHACEECECUPCyAAQXxqQcQIQQMQJQ8LAkACQAJAIABBfmovAQBBjX9qDgMAAQIKCwJAIABBfGovAQAiAkHhAEYNACACQewARw0KIABBempB5QAQMA8LIABBempB4wAQMA8LIABBfGpByghBBBAlDwsgAEF8akHSCEEGECUPCyAAQX5qLwEAQe8ARw0GIABBfGovAQBB5QBHDQYCQCAAQXpqLwEAIgJB8ABGDQAgAkHjAEcNByAAQXhqQd4IQQYQJQ8LIABBeGpB6ghBAhAlDwsgAEF+akHuCEEEECUPC0EBIQEgAEF+aiIAQekAEDANBCAAQfYIQQUQJQ8LIABBfmpB5AAQMA8LIABBfmpBgAlBBxAlDwsgAEF+akGOCUEEECUPCwJAIABBfmovAQAiAkHvAEYNACACQeUARw0BIABBfGpB7gAQMA8LIABBfGpBlglBAxAlIQELIAELNAEBf0EBIQECQCAAQXdqQf//A3FBBUkNACAAQYABckGgAUYNACAAQS5HIAAQL3EhAQsgAQswAQF/AkACQCAAQXdqIgFBF0sNAEEBIAF0QY2AgARxDQELIABBoAFGDQBBAA8LQQELTgECf0EAIQECQAJAIAAvAQAiAkHlAEYNACACQesARw0BIABBfmpB7ghBBBAlDwsgAEF+ai8BAEH1AEcNACAAQXxqQdIIQQYQJSEBCyABC94BAQR/QQAoAqgKIQBBACgCrAohAQJAAkACQANAIAAiAkECaiEAIAIgAU8NAQJAAkACQCAALwEAIgNBpH9qDgUCAwMDAQALIANBJEcNAiACLwEEQfsARw0CQQAgAkEEaiIANgKoCkEAQQAvAZIKIgJBAWo7AZIKQQAoApwKIAJBA3RqIgJBBDYCACACIAA2AgQPC0EAIAA2AqgKQQBBAC8BkgpBf2oiADsBkgpBACgCnAogAEH//wNxQQN0aigCAEEDRw0DDAQLIAJBBGohAAwACwtBACAANgKoCgsQLQsLcAECfwJAAkADQEEAQQAoAqgKIgBBAmoiATYCqAogAEEAKAKsCk8NAQJAAkACQCABLwEAIgFBpX9qDgIBAgALAkAgAUF2ag4EBAMDBAALIAFBL0cNAgwECxA1GgwBC0EAIABBBGo2AqgKDAALCxAtCws1AQF/QQBBAToA8AlBACgCqAohAEEAQQAoAqwKQQJqNgKoCkEAIABBACgC0AlrQQF1NgKECgtDAQJ/QQEhAQJAIAAvAQAiAkF3akH//wNxQQVJDQAgAkGAAXJBoAFGDQBBACEBIAIQL0UNACACQS5HIAAQMXIPCyABC2gBAn9BASEBAkACQCAAQV9qIgJBBUsNAEEBIAJ0QTFxDQELIABB+P8DcUEoRg0AIABBRmpB//8DcUEGSQ0AAkAgAEGlf2oiAkEDSw0AIAJBAUcNAQsgAEGFf2pB//8DcUEESSEBCyABCz0BAn9BACECAkBBACgC0AkiAyAASw0AIAAvAQAgAUcNAAJAIAMgAEcNAEEBDwsgAEF+ai8BABAoIQILIAILMQEBf0EAIQECQCAALwEAQS5HDQAgAEF+ai8BAEEuRw0AIABBfGovAQBBLkYhAQsgAQvbBAEFfwJAIAFBIkYNACABQSdGDQAQLQ8LQQAoAqgKIQMgARAhIAAgA0ECakEAKAKoCkEAKALECRABAkAgAkEBSA0AQQAoAuQJQQRBBiACQQFGGzYCHAtBAEEAKAKoCkECajYCqApBABAgIQJBACgCqAohAQJAAkAgAkH3AEcNACABLwECQekARw0AIAEvAQRB9ABHDQAgAS8BBkHoAEYNAQtBACABQX5qNgKoCg8LQQAgAUEIajYCqAoCQEEBECBB+wBGDQBBACABNgKoCg8LQQAoAqgKIgQhA0EAIQADQEEAIANBAmo2AqgKAkACQAJAAkBBARAgIgJBJ0cNAEEAKAKoCiEFQScQIUEAKAKoCkECaiEDDAELQQAoAqgKIQUgAkEiRw0BQSIQIUEAKAKoCkECaiEDC0EAIAM2AqgKQQEQICECDAELIAIQMyECQQAoAqgKIQMLAkAgAkE6Rg0AQQAgATYCqAoPC0EAQQAoAqgKQQJqNgKoCgJAQQEQICICQSJGDQAgAkEnRg0AQQAgATYCqAoPC0EAKAKoCiEGIAIQIUEAQQAoAvwJIgJBFGo2AvwJQQAoAqgKIQcgAiAFNgIAIAJBADYCECACIAY2AgggAiADNgIEIAIgB0ECajYCDEEAQQAoAqgKQQJqNgKoCiAAQRBqQQAoAuQJQSBqIAAbIAI2AgACQAJAQQEQICIAQSxGDQAgAEH9AEYNAUEAIAE2AqgKDwtBAEEAKAKoCkECaiIDNgKoCiACIQAMAQsLQQAoAuQJIgEgBDYCECABQQAoAqgKQQJqNgIMC20BAn8CQAJAA0ACQCAAQf//A3EiAUF3aiICQRdLDQBBASACdEGfgIAEcQ0CCyABQaABRg0BIAAhAiABEC8NAkEAIQJBAEEAKAKoCiIAQQJqNgKoCiAALwECIgANAAwCCwsgACECCyACQf//A3ELqwEBBH8CQAJAQQAoAqgKIgIvAQAiA0HhAEYNACABIQQgACEFDAELQQAgAkEEajYCqApBARAgIQJBACgCqAohBQJAAkAgAkEiRg0AIAJBJ0YNACACEDMaQQAoAqgKIQQMAQsgAhAhQQBBACgCqApBAmoiBDYCqAoLQQEQICEDQQAoAqgKIQILAkAgAiAFRg0AIAUgBEEAIAAgACABRiICG0EAIAEgAhsQAgsgAwtyAQR/QQAoAqgKIQBBACgCrAohAQJAAkADQCAAQQJqIQIgACABTw0BAkACQCACLwEAIgNBpH9qDgIBBAALIAIhACADQXZqDgQCAQECAQsgAEEEaiEADAALC0EAIAI2AqgKEC1BAA8LQQAgAjYCqApB3QALSQEDf0EAIQMCQCACRQ0AAkADQCAALQAAIgQgAS0AACIFRw0BIAFBAWohASAAQQFqIQAgAkF/aiICDQAMAgsLIAQgBWshAwsgAwsL4gECAEGACAvEAQAAeABwAG8AcgB0AG0AcABvAHIAdABmAG8AcgBlAHQAYQBvAHUAcgBjAGUAcgBvAG0AdQBuAGMAdABpAG8AbgB2AG8AeQBpAGUAZABlAGwAZQBjAG8AbgB0AGkAbgBpAG4AcwB0AGEAbgB0AHkAYgByAGUAYQByAGUAdAB1AHIAZABlAGIAdQBnAGcAZQBhAHcAYQBpAHQAaAByAHcAaABpAGwAZQBpAGYAYwBhAHQAYwBmAGkAbgBhAGwAbABlAGwAcwAAQcQJCxABAAAAAgAAAAAEAAAwOQAA","undefined"!=typeof Buffer?Buffer.from(A,"base64"):Uint8Array.from(atob(A),(A=>A.charCodeAt(0)));var A;};WebAssembly.compile(E()).then(WebAssembly.instantiate).then((({exports:A})=>{}));

var _a$1;
function $constructor(name, initializer, params) {
    function init(inst, def) {
        if (!inst._zod) {
            Object.defineProperty(inst, "_zod", {
                value: {
                    def,
                    constr: _,
                    traits: new Set(),
                },
                enumerable: false,
            });
        }
        if (inst._zod.traits.has(name)) {
            return;
        }
        inst._zod.traits.add(name);
        initializer(inst, def);
        // support prototype modifications
        const proto = _.prototype;
        const keys = Object.keys(proto);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (!(k in inst)) {
                inst[k] = proto[k].bind(inst);
            }
        }
    }
    // doesn't work if Parent has a constructor with arguments
    const Parent = params?.Parent ?? Object;
    class Definition extends Parent {
    }
    Object.defineProperty(Definition, "name", { value: name });
    function _(def) {
        var _a;
        const inst = params?.Parent ? new Definition() : this;
        init(inst, def);
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        for (const fn of inst._zod.deferred) {
            fn();
        }
        return inst;
    }
    Object.defineProperty(_, "init", { value: init });
    Object.defineProperty(_, Symbol.hasInstance, {
        value: (inst) => {
            if (params?.Parent && inst instanceof params.Parent)
                return true;
            return inst?._zod?.traits?.has(name);
        },
    });
    Object.defineProperty(_, "name", { value: name });
    return _;
}
class $ZodAsyncError extends Error {
    constructor() {
        super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
    }
}
class $ZodEncodeError extends Error {
    constructor(name) {
        super(`Encountered unidirectional transform during encode: ${name}`);
        this.name = "ZodEncodeError";
    }
}
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config$1(newConfig) {
    return globalConfig;
}

function getEnumValues(entries) {
    const numericValues = Object.values(entries).filter((v) => typeof v === "number");
    const values = Object.entries(entries)
        .filter(([k, _]) => numericValues.indexOf(+k) === -1)
        .map(([_, v]) => v);
    return values;
}
function jsonStringifyReplacer(_, value) {
    if (typeof value === "bigint")
        return value.toString();
    return value;
}
function nullish(input) {
    return input === null || input === undefined;
}
function cleanRegex(source) {
    const start = source.startsWith("^") ? 1 : 0;
    const end = source.endsWith("$") ? source.length - 1 : source.length;
    return source.slice(start, end);
}
const EVALUATING = /* @__PURE__*/ Symbol("evaluating");
function defineLazy(object, key, getter) {
    let value = undefined;
    Object.defineProperty(object, key, {
        get() {
            if (value === EVALUATING) {
                // Circular reference detected, return undefined to break the cycle
                return undefined;
            }
            if (value === undefined) {
                value = EVALUATING;
                value = getter();
            }
            return value;
        },
        set(v) {
            Object.defineProperty(object, key, {
                value: v,
                // configurable: true,
            });
            // object[key] = v;
        },
        configurable: true,
    });
}
function mergeDefs(...defs) {
    const mergedDescriptors = {};
    for (const def of defs) {
        const descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
    }
    return Object.defineProperties({}, mergedDescriptors);
}
const captureStackTrace = ("captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => { });
function isObject(data) {
    return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
    if (isObject(o) === false)
        return false;
    // modified constructor
    const ctor = o.constructor;
    if (ctor === undefined)
        return true;
    if (typeof ctor !== "function")
        return true;
    // modified prototype
    const prot = ctor.prototype;
    if (isObject(prot) === false)
        return false;
    // ctor doesn't have static `isPrototypeOf`
    if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
        return false;
    }
    return true;
}
function shallowClone(o) {
    if (isPlainObject(o))
        return { ...o };
    if (Array.isArray(o))
        return [...o];
    if (o instanceof Map)
        return new Map(o);
    if (o instanceof Set)
        return new Set(o);
    return o;
}
const propertyKeyTypes = /* @__PURE__*/ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// zod-specific utils
function clone(inst, def, params) {
    const cl = new inst._zod.constr(def ?? inst._zod.def);
    if (!def || params?.parent)
        cl._zod.parent = inst;
    return cl;
}
function normalizeParams(_params) {
    const params = _params;
    if (!params)
        return {};
    if (typeof params === "string")
        return { error: () => params };
    if (params?.message !== undefined) {
        if (params?.error !== undefined)
            throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
    }
    delete params.message;
    if (typeof params.error === "string")
        return { ...params, error: () => params.error };
    return params;
}
// invalid_type | too_big | too_small | invalid_format | not_multiple_of | unrecognized_keys | invalid_union | invalid_key | invalid_element | invalid_value | custom
function aborted(x, startIndex = 0) {
    if (x.aborted === true)
        return true;
    for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue !== true) {
            return true;
        }
    }
    return false;
}
// Checks for explicit abort (continue === false), as opposed to implicit abort (continue === undefined).
// Used to respect `abort: true` in .refine() even for checks that have a `when` function.
function explicitlyAborted(x, startIndex = 0) {
    if (x.aborted === true)
        return true;
    for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue === false) {
            return true;
        }
    }
    return false;
}
function prefixIssues(path, issues) {
    return issues.map((iss) => {
        var _a;
        (_a = iss).path ?? (_a.path = []);
        iss.path.unshift(path);
        return iss;
    });
}
function unwrapMessage(message) {
    return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
    const message = iss.message
        ? iss.message
        : (unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ??
            unwrapMessage(ctx?.error?.(iss)) ??
            unwrapMessage(config.customError?.(iss)) ??
            unwrapMessage(config.localeError?.(iss)) ??
            "Invalid input");
    const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
    rest.path ?? (rest.path = []);
    rest.message = message;
    if (ctx?.reportInput) {
        rest.input = _input;
    }
    return rest;
}
function getLengthableOrigin(input) {
    if (Array.isArray(input))
        return "array";
    if (typeof input === "string")
        return "string";
    return "unknown";
}
function issue(...args) {
    const [iss, input, inst] = args;
    if (typeof iss === "string") {
        return {
            message: iss,
            code: "custom",
            input,
            inst,
        };
    }
    return { ...iss };
}

const initializer$1 = (inst, def) => {
    inst.name = "$ZodError";
    Object.defineProperty(inst, "_zod", {
        value: inst._zod,
        enumerable: false,
    });
    Object.defineProperty(inst, "issues", {
        value: def,
        enumerable: false,
    });
    inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
    Object.defineProperty(inst, "toString", {
        value: () => inst.message,
        enumerable: false,
    });
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of error.issues) {
        if (sub.path.length > 0) {
            fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
            fieldErrors[sub.path[0]].push(mapper(sub));
        }
        else {
            formErrors.push(mapper(sub));
        }
    }
    return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
    const fieldErrors = { _errors: [] };
    const processError = (error, path = []) => {
        for (const issue of error.issues) {
            if (issue.code === "invalid_union" && issue.errors.length) {
                issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
            }
            else if (issue.code === "invalid_key") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else if (issue.code === "invalid_element") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else {
                const fullpath = [...path, ...issue.path];
                if (fullpath.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < fullpath.length) {
                        const el = fullpath[i];
                        const terminal = i === fullpath.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        }
    };
    processError(error);
    return fieldErrors;
}

const _parse = (_Err) => (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
        throw new $ZodAsyncError();
    }
    if (result.issues.length) {
        const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config$1())));
        captureStackTrace(e, _params?.callee);
        throw e;
    }
    return result.value;
};
const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    if (result.issues.length) {
        const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config$1())));
        captureStackTrace(e, params?.callee);
        throw e;
    }
    return result.value;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
        throw new $ZodAsyncError();
    }
    return result.issues.length
        ? {
            success: false,
            error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config$1()))),
        }
        : { success: true, data: result.value };
};
const safeParse$1 = /* @__PURE__*/ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    return result.issues.length
        ? {
            success: false,
            error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config$1()))),
        }
        : { success: true, data: result.value };
};
const safeParseAsync$1 = /* @__PURE__*/ _safeParseAsync($ZodRealError);
const _encode = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _parse(_Err)(schema, value, ctx);
};
const _decode = (_Err) => (schema, value, _ctx) => {
    return _parse(_Err)(schema, value, _ctx);
};
const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _parseAsync(_Err)(schema, value, ctx);
};
const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
    return _parseAsync(_Err)(schema, value, _ctx);
};
const _safeEncode = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _safeParse(_Err)(schema, value, ctx);
};
const _safeDecode = (_Err) => (schema, value, _ctx) => {
    return _safeParse(_Err)(schema, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _safeParseAsync(_Err)(schema, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
    return _safeParseAsync(_Err)(schema, value, _ctx);
};

// import { $ZodType } from "./schemas.js";
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
    var _a;
    inst._zod ?? (inst._zod = {});
    inst._zod.def = def;
    (_a = inst._zod).onattach ?? (_a.onattach = []);
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY);
        if (def.maximum < curr)
            inst._zod.bag.maximum = def.maximum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length <= def.maximum)
            return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY);
        if (def.minimum > curr)
            inst._zod.bag.minimum = def.minimum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length >= def.minimum)
            return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.minimum = def.length;
        bag.maximum = def.length;
        bag.length = def.length;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length === def.length)
            return;
        const origin = getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
            origin,
            ...(tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length }),
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
    };
});

const version$1 = {
    major: 4,
    minor: 4,
    patch: 3,
};

const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
    var _a;
    inst ?? (inst = {});
    inst._zod.def = def; // set _def property
    inst._zod.bag = inst._zod.bag || {}; // initialize _bag object
    inst._zod.version = version$1;
    const checks = [...(inst._zod.def.checks ?? [])];
    // if inst is itself a checks.$ZodCheck, run it as a check
    if (inst._zod.traits.has("$ZodCheck")) {
        checks.unshift(inst);
    }
    for (const ch of checks) {
        for (const fn of ch._zod.onattach) {
            fn(inst);
        }
    }
    if (checks.length === 0) {
        // deferred initializer
        // inst._zod.parse is not yet defined
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(() => {
            inst._zod.run = inst._zod.parse;
        });
    }
    else {
        const runChecks = (payload, checks, ctx) => {
            let isAborted = aborted(payload);
            let asyncResult;
            for (const ch of checks) {
                if (ch._zod.def.when) {
                    if (explicitlyAborted(payload))
                        continue;
                    const shouldRun = ch._zod.def.when(payload);
                    if (!shouldRun)
                        continue;
                }
                else if (isAborted) {
                    continue;
                }
                const currLen = payload.issues.length;
                const _ = ch._zod.check(payload);
                if (_ instanceof Promise && ctx?.async === false) {
                    throw new $ZodAsyncError();
                }
                if (asyncResult || _ instanceof Promise) {
                    asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                        await _;
                        const nextLen = payload.issues.length;
                        if (nextLen === currLen)
                            return;
                        if (!isAborted)
                            isAborted = aborted(payload, currLen);
                    });
                }
                else {
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen)
                        continue;
                    if (!isAborted)
                        isAborted = aborted(payload, currLen);
                }
            }
            if (asyncResult) {
                return asyncResult.then(() => {
                    return payload;
                });
            }
            return payload;
        };
        const handleCanaryResult = (canary, payload, ctx) => {
            // abort if the canary is aborted
            if (aborted(canary)) {
                canary.aborted = true;
                return canary;
            }
            // run checks first, then
            const checkResult = runChecks(payload, checks, ctx);
            if (checkResult instanceof Promise) {
                if (ctx.async === false)
                    throw new $ZodAsyncError();
                return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
            }
            return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx) => {
            if (ctx.skipChecks) {
                return inst._zod.parse(payload, ctx);
            }
            if (ctx.direction === "backward") {
                // run canary
                // initial pass (no checks)
                const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
                if (canary instanceof Promise) {
                    return canary.then((canary) => {
                        return handleCanaryResult(canary, payload, ctx);
                    });
                }
                return handleCanaryResult(canary, payload, ctx);
            }
            // forward
            const result = inst._zod.parse(payload, ctx);
            if (result instanceof Promise) {
                if (ctx.async === false)
                    throw new $ZodAsyncError();
                return result.then((result) => runChecks(result, checks, ctx));
            }
            return runChecks(result, checks, ctx);
        };
    }
    // Lazy initialize ~standard to avoid creating objects for every schema
    defineLazy(inst, "~standard", () => ({
        validate: (value) => {
            try {
                const r = safeParse$1(inst, value);
                return r.success ? { value: r.data } : { issues: r.error?.issues };
            }
            catch (_) {
                return safeParseAsync$1(inst, value).then((r) => (r.success ? { value: r.data } : { issues: r.error?.issues }));
            }
        },
        vendor: "zod",
        version: 1,
    }));
});
function handleArrayResult(result, final, index) {
    if (result.issues.length) {
        final.issues.push(...prefixIssues(index, result.issues));
    }
    final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                expected: "array",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        payload.value = Array(input.length);
        const proms = [];
        for (let i = 0; i < input.length; i++) {
            const item = input[i];
            const result = def.element._zod.run({
                value: item,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                proms.push(result.then((result) => handleArrayResult(result, payload, i)));
            }
            else {
                handleArrayResult(result, payload, i);
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => payload);
        }
        return payload; //handleArrayResultsAsync(parseResults, final);
    };
});
function handleUnionResults(results, final, inst, ctx) {
    for (const result of results) {
        if (result.issues.length === 0) {
            final.value = result.value;
            return final;
        }
    }
    const nonaborted = results.filter((r) => !aborted(r));
    if (nonaborted.length === 1) {
        final.value = nonaborted[0].value;
        return nonaborted[0];
    }
    final.issues.push({
        code: "invalid_union",
        input: final.value,
        inst,
        errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config$1()))),
    });
    return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : undefined);
    defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
    defineLazy(inst._zod, "values", () => {
        if (def.options.every((o) => o._zod.values)) {
            return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
        }
        return undefined;
    });
    defineLazy(inst._zod, "pattern", () => {
        if (def.options.every((o) => o._zod.pattern)) {
            const patterns = def.options.map((o) => o._zod.pattern);
            return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
        }
        return undefined;
    });
    const first = def.options.length === 1 ? def.options[0]._zod.run : null;
    inst._zod.parse = (payload, ctx) => {
        if (first) {
            return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
            const result = option._zod.run({
                value: payload.value,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            }
            else {
                if (result.issues.length === 0)
                    return result;
                results.push(result);
            }
        }
        if (!async)
            return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results) => {
            return handleUnionResults(results, payload, inst, ctx);
        });
    };
});
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        const left = def.left._zod.run({ value: input, issues: [] }, ctx);
        const right = def.right._zod.run({ value: input, issues: [] }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) {
            return Promise.all([left, right]).then(([left, right]) => {
                return handleIntersectionResults(payload, left, right);
            });
        }
        return handleIntersectionResults(payload, left, right);
    };
});
function mergeValues(a, b) {
    // const aType = parse.t(a);
    // const bType = parse.t(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    if (a instanceof Date && b instanceof Date && +a === +b) {
        return { valid: true, data: a };
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const bKeys = Object.keys(b);
        const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [key, ...sharedValue.mergeErrorPath],
                };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return { valid: false, mergeErrorPath: [] };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [index, ...sharedValue.mergeErrorPath],
                };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
    // Track which side(s) report each key as unrecognized
    const unrecKeys = new Map();
    let unrecIssue;
    for (const iss of left.issues) {
        if (iss.code === "unrecognized_keys") {
            unrecIssue ?? (unrecIssue = iss);
            for (const k of iss.keys) {
                if (!unrecKeys.has(k))
                    unrecKeys.set(k, {});
                unrecKeys.get(k).l = true;
            }
        }
        else {
            result.issues.push(iss);
        }
    }
    for (const iss of right.issues) {
        if (iss.code === "unrecognized_keys") {
            for (const k of iss.keys) {
                if (!unrecKeys.has(k))
                    unrecKeys.set(k, {});
                unrecKeys.get(k).r = true;
            }
        }
        else {
            result.issues.push(iss);
        }
    }
    // Report only keys unrecognized by BOTH sides
    const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
    if (bothKeys.length && unrecIssue) {
        result.issues.push({ ...unrecIssue, keys: bothKeys });
    }
    if (aborted(result))
        return result;
    const merged = mergeValues(left.value, right.value);
    if (!merged.valid) {
        throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
    }
    result.value = merged.data;
    return result;
}
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
    $ZodType.init(inst, def);
    const values = getEnumValues(def.entries);
    const valuesSet = new Set(values);
    inst._zod.values = valuesSet;
    inst._zod.pattern = new RegExp(`^(${values
        .filter((k) => propertyKeyTypes.has(typeof k))
        .map((o) => (typeof o === "string" ? escapeRegex(o) : o.toString()))
        .join("|")})$`);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (valuesSet.has(input)) {
            return payload;
        }
        payload.issues.push({
            code: "invalid_value",
            values,
            input,
            inst,
        });
        return payload;
    };
});
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
        }
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
            const output = _out instanceof Promise ? _out : Promise.resolve(_out);
            return output.then((output) => {
                payload.value = output;
                payload.fallback = true;
                return payload;
            });
        }
        if (_out instanceof Promise) {
            throw new $ZodAsyncError();
        }
        payload.value = _out;
        payload.fallback = true;
        return payload;
    };
});
function handleOptionalResult(result, input) {
    if (input === undefined && (result.issues.length || result.fallback)) {
        return { issues: [], value: undefined };
    }
    return result;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    inst._zod.optout = "optional";
    defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? new Set([...def.innerType._zod.values, undefined]) : undefined;
    });
    defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        if (def.innerType._zod.optin === "optional") {
            const input = payload.value;
            const result = def.innerType._zod.run(payload, ctx);
            if (result instanceof Promise)
                return result.then((r) => handleOptionalResult(r, input));
            return handleOptionalResult(result, input);
        }
        if (payload.value === undefined) {
            return payload;
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
    // Call parent init - inherits optin/optout = "optional"
    $ZodOptional.init(inst, def);
    // Override values/pattern to NOT add undefined
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
    // Override parse to just delegate (no undefined handling)
    inst._zod.parse = (payload, ctx) => {
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
    defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
    defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
    });
    defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        // Forward direction (decode): allow null to pass through
        if (payload.value === null)
            return payload;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
    $ZodType.init(inst, def);
    // inst._zod.qin = "true";
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply defaults for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
            /**
             * $ZodDefault returns the default value immediately in forward direction.
             * It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
            return payload;
        }
        // Forward direction: continue with default handling
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleDefaultResult(result, def));
        }
        return handleDefaultResult(result, def);
    };
});
function handleDefaultResult(payload, def) {
    if (payload.value === undefined) {
        payload.value = def.defaultValue;
    }
    return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply prefault for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "values", () => {
        const v = def.innerType._zod.values;
        return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleNonOptionalResult(result, inst));
        }
        return handleNonOptionalResult(result, inst);
    };
});
function handleNonOptionalResult(payload, inst) {
    if (!payload.issues.length && payload.value === undefined) {
        payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: payload.value,
            inst,
        });
    }
    return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply catch logic
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => {
                payload.value = result.value;
                if (result.issues.length) {
                    payload.value = def.catchValue({
                        ...payload,
                        error: {
                            issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config$1())),
                        },
                        input: payload.value,
                    });
                    payload.issues = [];
                    payload.fallback = true;
                }
                return payload;
            });
        }
        payload.value = result.value;
        if (result.issues.length) {
            payload.value = def.catchValue({
                ...payload,
                error: {
                    issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config$1())),
                },
                input: payload.value,
            });
            payload.issues = [];
            payload.fallback = true;
        }
        return payload;
    };
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "values", () => def.in._zod.values);
    defineLazy(inst._zod, "optin", () => def.in._zod.optin);
    defineLazy(inst._zod, "optout", () => def.out._zod.optout);
    defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) {
                return right.then((right) => handlePipeResult(right, def.in, ctx));
            }
            return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) {
            return left.then((left) => handlePipeResult(left, def.out, ctx));
        }
        return handlePipeResult(left, def.out, ctx);
    };
});
function handlePipeResult(left, next, ctx) {
    if (left.issues.length) {
        // prevent further checks
        left.aborted = true;
        return left;
    }
    return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
    defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then(handleReadonlyResult);
        }
        return handleReadonlyResult(result);
    };
});
function handleReadonlyResult(payload) {
    payload.value = Object.freeze(payload.value);
    return payload;
}
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
    $ZodCheck.init(inst, def);
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _) => {
        return payload;
    };
    inst._zod.check = (payload) => {
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) {
            return r.then((r) => handleRefineResult(r, payload, input, inst));
        }
        handleRefineResult(r, payload, input, inst);
        return;
    };
});
function handleRefineResult(result, payload, input, inst) {
    if (!result) {
        const _iss = {
            code: "custom",
            input,
            inst, // incorporates params.error into issue reporting
            path: [...(inst._zod.def.path ?? [])], // incorporates params.error into issue reporting
            continue: !inst._zod.def.abort,
            // params: inst._zod.def.params,
        };
        if (inst._zod.def.params)
            _iss.params = inst._zod.def.params;
        payload.issues.push(issue(_iss));
    }
}

var _a;
class $ZodRegistry {
    constructor() {
        this._map = new WeakMap();
        this._idmap = new Map();
    }
    add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.set(meta.id, schema);
        }
        return this;
    }
    clear() {
        this._map = new WeakMap();
        this._idmap = new Map();
        return this;
    }
    remove(schema) {
        const meta = this._map.get(schema);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.delete(meta.id);
        }
        this._map.delete(schema);
        return this;
    }
    get(schema) {
        // return this._map.get(schema) as any;
        // inherit metadata
        const p = schema._zod.parent;
        if (p) {
            const pm = { ...(this.get(p) ?? {}) };
            delete pm.id; // do not inherit id
            const f = { ...pm, ...this._map.get(schema) };
            return Object.keys(f).length ? f : undefined;
        }
        return this._map.get(schema);
    }
    has(schema) {
        return this._map.has(schema);
    }
}
// registries
function registry() {
    return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;

// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
    const ch = new $ZodCheckMaxLength({
        check: "max_length",
        ...normalizeParams(params),
        maximum,
    });
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
    return new $ZodCheckMinLength({
        check: "min_length",
        ...normalizeParams(params),
        minimum,
    });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
    return new $ZodCheckLengthEquals({
        check: "length_equals",
        ...normalizeParams(params),
        length,
    });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
    return new $ZodCheckOverwrite({
        check: "overwrite",
        tx,
    });
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
    return new Class({
        type: "array",
        element,
        // get element() {
        //   return element;
        // },
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class, fn, _params) {
    const norm = normalizeParams(_params);
    norm.abort ?? (norm.abort = true); // default to abort:false
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...norm,
    });
    return schema;
}
// same as _custom but defaults to abort:false
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...normalizeParams(_params),
    });
    return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
    const ch = _check((payload) => {
        payload.addIssue = (issue$1) => {
            if (typeof issue$1 === "string") {
                payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue$1;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                _issue.input ?? (_issue.input = payload.value);
                _issue.inst ?? (_issue.inst = ch);
                _issue.continue ?? (_issue.continue = !ch._zod.def.abort); // abort is always undefined, so this is always true...
                payload.issues.push(issue(_issue));
            }
        };
        return fn(payload.value, payload);
    }, params);
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
    const ch = new $ZodCheck({
        check: "custom",
        ...normalizeParams(params),
    });
    ch._zod.check = fn;
    return ch;
}

// function initializeContext<T extends schemas.$ZodType>(inputs: JSONSchemaGeneratorParams<T>): ToJSONSchemaContext<T> {
//   return {
//     processor: inputs.processor,
//     metadataRegistry: inputs.metadata ?? globalRegistry,
//     target: inputs.target ?? "draft-2020-12",
//     unrepresentable: inputs.unrepresentable ?? "throw",
//   };
// }
function initializeContext(params) {
    // Normalize target: convert old non-hyphenated versions to hyphenated versions
    let target = params?.target ?? "draft-2020-12";
    if (target === "draft-4")
        target = "draft-04";
    if (target === "draft-7")
        target = "draft-07";
    return {
        processors: params.processors ?? {},
        metadataRegistry: params?.metadata ?? globalRegistry,
        target,
        unrepresentable: params?.unrepresentable ?? "throw",
        override: params?.override ?? (() => { }),
        io: params?.io ?? "output",
        counter: 0,
        seen: new Map(),
        cycles: params?.cycles ?? "ref",
        reused: params?.reused ?? "inline",
        external: params?.external ?? undefined,
    };
}
function process$1(schema, ctx, _params = { path: [], schemaPath: [] }) {
    var _a;
    const def = schema._zod.def;
    // check for schema in seens
    const seen = ctx.seen.get(schema);
    if (seen) {
        seen.count++;
        // check if cycle
        const isCycle = _params.schemaPath.includes(schema);
        if (isCycle) {
            seen.cycle = _params.path;
        }
        return seen.schema;
    }
    // initialize
    const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
    ctx.seen.set(schema, result);
    // custom method overrides default behavior
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) {
        result.schema = overrideSchema;
    }
    else {
        const params = {
            ..._params,
            schemaPath: [..._params.schemaPath, schema],
            path: _params.path,
        };
        if (schema._zod.processJSONSchema) {
            schema._zod.processJSONSchema(ctx, result.schema, params);
        }
        else {
            const _json = result.schema;
            const processor = ctx.processors[def.type];
            if (!processor) {
                throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
            }
            processor(schema, ctx, _json, params);
        }
        const parent = schema._zod.parent;
        if (parent) {
            // Also set ref if processor didn't (for inheritance)
            if (!result.ref)
                result.ref = parent;
            process$1(parent, ctx, params);
            ctx.seen.get(parent).isParent = true;
        }
    }
    // metadata
    const meta = ctx.metadataRegistry.get(schema);
    if (meta)
        Object.assign(result.schema, meta);
    if (ctx.io === "input" && isTransforming(schema)) {
        // examples/defaults only apply to output type of pipe
        delete result.schema.examples;
        delete result.schema.default;
    }
    // set prefault as default
    if (ctx.io === "input" && "_prefault" in result.schema)
        (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    // pulling fresh from ctx.seen in case it was overwritten
    const _result = ctx.seen.get(schema);
    return _result.schema;
}
function extractDefs(ctx, schema
// params: EmitParams
) {
    // iterate over seen map;
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // Track ids to detect duplicates across different schemas
    const idToSchema = new Map();
    for (const entry of ctx.seen.entries()) {
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            const existing = idToSchema.get(id);
            if (existing && existing !== entry[0]) {
                throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            }
            idToSchema.set(id, entry[0]);
        }
    }
    // returns a ref to the schema
    // defId will be empty if the ref points to an external schema (or #)
    const makeURI = (entry) => {
        // comparing the seen objects because sometimes
        // multiple schemas map to the same seen object.
        // e.g. lazy
        // external is configured
        const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
        if (ctx.external) {
            const externalId = ctx.external.registry.get(entry[0])?.id; // ?? "__shared";// `__schema${ctx.counter++}`;
            // check if schema is in the external registry
            const uriGenerator = ctx.external.uri ?? ((id) => id);
            if (externalId) {
                return { ref: uriGenerator(externalId) };
            }
            // otherwise, add to __shared
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
            entry[1].defId = id; // set defId so it will be reused if needed
            return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
        }
        if (entry[1] === root) {
            return { ref: "#" };
        }
        // self-contained schema
        const uriPrefix = `#`;
        const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return { defId, ref: defUriPrefix + defId };
    };
    // stored cached version in `def` property
    // remove all properties, set $ref
    const extractToDef = (entry) => {
        // if the schema is already a reference, do not extract it
        if (entry[1].schema.$ref) {
            return;
        }
        const seen = entry[1];
        const { ref, defId } = makeURI(entry);
        seen.def = { ...seen.schema };
        // defId won't be set if the schema is a reference to an external schema
        // or if the schema is the root schema
        if (defId)
            seen.defId = defId;
        // wipe away all properties except $ref
        const schema = seen.schema;
        for (const key in schema) {
            delete schema[key];
        }
        schema.$ref = ref;
    };
    // throw on cycles
    // break cycles
    if (ctx.cycles === "throw") {
        for (const entry of ctx.seen.entries()) {
            const seen = entry[1];
            if (seen.cycle) {
                throw new Error("Cycle detected: " +
                    `#/${seen.cycle?.join("/")}/<root>` +
                    '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
            }
        }
    }
    // extract schemas into $defs
    for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        // convert root schema to # $ref
        if (schema === entry[0]) {
            extractToDef(entry); // this has special handling for the root schema
            continue;
        }
        // extract schemas that are in the external registry
        if (ctx.external) {
            const ext = ctx.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
                extractToDef(entry);
                continue;
            }
        }
        // extract schemas with `id` meta
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            extractToDef(entry);
            continue;
        }
        // break cycles
        if (seen.cycle) {
            // any
            extractToDef(entry);
            continue;
        }
        // extract reused schemas
        if (seen.count > 1) {
            if (ctx.reused === "ref") {
                extractToDef(entry);
                // biome-ignore lint:
                continue;
            }
        }
    }
}
function finalize(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // flatten refs - inherit properties from parent schemas
    const flattenRef = (zodSchema) => {
        const seen = ctx.seen.get(zodSchema);
        // already processed
        if (seen.ref === null)
            return;
        const schema = seen.def ?? seen.schema;
        const _cached = { ...schema };
        const ref = seen.ref;
        seen.ref = null; // prevent infinite recursion
        if (ref) {
            flattenRef(ref);
            const refSeen = ctx.seen.get(ref);
            const refSchema = refSeen.schema;
            // merge referenced schema into current
            if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
                // older drafts can't combine $ref with other properties
                schema.allOf = schema.allOf ?? [];
                schema.allOf.push(refSchema);
            }
            else {
                Object.assign(schema, refSchema);
            }
            // restore child's own properties (child wins)
            Object.assign(schema, _cached);
            const isParentRef = zodSchema._zod.parent === ref;
            // For parent chain, child is a refinement - remove parent-only properties
            if (isParentRef) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (!(key in _cached)) {
                        delete schema[key];
                    }
                }
            }
            // When ref was extracted to $defs, remove properties that match the definition
            if (refSchema.$ref && refSeen.def) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
                        delete schema[key];
                    }
                }
            }
        }
        // If parent was extracted (has $ref), propagate $ref to this schema
        // This handles cases like: readonly().meta({id}).describe()
        // where processor sets ref to innerType but parent should be referenced
        const parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
            // Ensure parent is processed first so its def has inherited properties
            flattenRef(parent);
            const parentSeen = ctx.seen.get(parent);
            if (parentSeen?.schema.$ref) {
                schema.$ref = parentSeen.schema.$ref;
                // De-duplicate with parent's definition
                if (parentSeen.def) {
                    for (const key in schema) {
                        if (key === "$ref" || key === "allOf")
                            continue;
                        if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
                            delete schema[key];
                        }
                    }
                }
            }
        }
        // execute overrides
        ctx.override({
            zodSchema: zodSchema,
            jsonSchema: schema,
            path: seen.path ?? [],
        });
    };
    for (const entry of [...ctx.seen.entries()].reverse()) {
        flattenRef(entry[0]);
    }
    const result = {};
    if (ctx.target === "draft-2020-12") {
        result.$schema = "https://json-schema.org/draft/2020-12/schema";
    }
    else if (ctx.target === "draft-07") {
        result.$schema = "http://json-schema.org/draft-07/schema#";
    }
    else if (ctx.target === "draft-04") {
        result.$schema = "http://json-schema.org/draft-04/schema#";
    }
    else if (ctx.target === "openapi-3.0") ;
    else ;
    if (ctx.external?.uri) {
        const id = ctx.external.registry.get(schema)?.id;
        if (!id)
            throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
    }
    Object.assign(result, root.def ?? root.schema);
    // The `id` in `.meta()` is a Zod-specific registration tag used to extract
    // schemas into $defs — it is not user-facing JSON Schema metadata. Strip it
    // from the output body where it would otherwise leak. The id is preserved
    // implicitly via the $defs key (and via $ref paths).
    const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
    if (rootMetaId !== undefined && result.id === rootMetaId)
        delete result.id;
    // build defs object
    const defs = ctx.external?.defs ?? {};
    for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        if (seen.def && seen.defId) {
            if (seen.def.id === seen.defId)
                delete seen.def.id;
            defs[seen.defId] = seen.def;
        }
    }
    // set definitions in result
    if (ctx.external) ;
    else {
        if (Object.keys(defs).length > 0) {
            if (ctx.target === "draft-2020-12") {
                result.$defs = defs;
            }
            else {
                result.definitions = defs;
            }
        }
    }
    try {
        // this "finalizes" this schema and ensures all cycles are removed
        // each call to finalize() is functionally independent
        // though the seen map is shared
        const finalized = JSON.parse(JSON.stringify(result));
        Object.defineProperty(finalized, "~standard", {
            value: {
                ...schema["~standard"],
                jsonSchema: {
                    input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
                    output: createStandardJSONSchemaMethod(schema, "output", ctx.processors),
                },
            },
            enumerable: false,
            writable: false,
        });
        return finalized;
    }
    catch (_err) {
        throw new Error("Error converting schema to JSON.");
    }
}
function isTransforming(_schema, _ctx) {
    const ctx = _ctx ?? { seen: new Set() };
    if (ctx.seen.has(_schema))
        return false;
    ctx.seen.add(_schema);
    const def = _schema._zod.def;
    if (def.type === "transform")
        return true;
    if (def.type === "array")
        return isTransforming(def.element, ctx);
    if (def.type === "set")
        return isTransforming(def.valueType, ctx);
    if (def.type === "lazy")
        return isTransforming(def.getter(), ctx);
    if (def.type === "promise" ||
        def.type === "optional" ||
        def.type === "nonoptional" ||
        def.type === "nullable" ||
        def.type === "readonly" ||
        def.type === "default" ||
        def.type === "prefault") {
        return isTransforming(def.innerType, ctx);
    }
    if (def.type === "intersection") {
        return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    if (def.type === "record" || def.type === "map") {
        return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    if (def.type === "pipe") {
        if (_schema._zod.traits.has("$ZodCodec"))
            return true;
        return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    if (def.type === "object") {
        for (const key in def.shape) {
            if (isTransforming(def.shape[key], ctx))
                return true;
        }
        return false;
    }
    if (def.type === "union") {
        for (const option of def.options) {
            if (isTransforming(option, ctx))
                return true;
        }
        return false;
    }
    if (def.type === "tuple") {
        for (const item of def.items) {
            if (isTransforming(item, ctx))
                return true;
        }
        if (def.rest && isTransforming(def.rest, ctx))
            return true;
        return false;
    }
    return false;
}
/**
 * Creates a toJSONSchema method for a schema instance.
 * This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
 */
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
    const ctx = initializeContext({ ...params, processors });
    process$1(schema, ctx);
    extractDefs(ctx, schema);
    return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
    const { libraryOptions, target } = params ?? {};
    const ctx = initializeContext({ ...(libraryOptions ?? {}), target, io, processors });
    process$1(schema, ctx);
    extractDefs(ctx, schema);
    return finalize(ctx, schema);
};

const enumProcessor = (schema, _ctx, json, _params) => {
    const def = schema._zod.def;
    const values = getEnumValues(def.entries);
    // Number enums can have both string and number values
    if (values.every((v) => typeof v === "number"))
        json.type = "number";
    if (values.every((v) => typeof v === "string"))
        json.type = "string";
    json.enum = values;
};
const customProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Custom types cannot be represented in JSON Schema");
    }
};
const transformProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Transforms cannot be represented in JSON Schema");
    }
};
// ==================== COMPOSITE TYPE PROCESSORS ====================
const arrayProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    const { minimum, maximum } = schema._zod.bag;
    if (typeof minimum === "number")
        json.minItems = minimum;
    if (typeof maximum === "number")
        json.maxItems = maximum;
    json.type = "array";
    json.items = process$1(def.element, ctx, {
        ...params,
        path: [...params.path, "items"],
    });
};
const unionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    // Exclusive unions (inclusive === false) use oneOf (exactly one match) instead of anyOf (one or more matches)
    // This includes both z.xor() and discriminated unions
    const isExclusive = def.inclusive === false;
    const options = def.options.map((x, i) => process$1(x, ctx, {
        ...params,
        path: [...params.path, isExclusive ? "oneOf" : "anyOf", i],
    }));
    if (isExclusive) {
        json.oneOf = options;
    }
    else {
        json.anyOf = options;
    }
};
const intersectionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const a = process$1(def.left, ctx, {
        ...params,
        path: [...params.path, "allOf", 0],
    });
    const b = process$1(def.right, ctx, {
        ...params,
        path: [...params.path, "allOf", 1],
    });
    const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
    const allOf = [
        ...(isSimpleIntersection(a) ? a.allOf : [a]),
        ...(isSimpleIntersection(b) ? b.allOf : [b]),
    ];
    json.allOf = allOf;
};
const nullableProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const inner = process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    if (ctx.target === "openapi-3.0") {
        seen.ref = def.innerType;
        json.nullable = true;
    }
    else {
        json.anyOf = [inner, { type: "null" }];
    }
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const defaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
const prefaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    if (ctx.io === "input")
        json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
const catchProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    let catchValue;
    try {
        catchValue = def.catchValue(undefined);
    }
    catch {
        throw new Error("Dynamic catch values are not supported in JSON Schema");
    }
    json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    const inIsTransform = def.in._zod.traits.has("$ZodTransform");
    const innerType = ctx.io === "input" ? (inIsTransform ? def.out : def.in) : def.out;
    process$1(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    process$1(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};

async function readBodyWithLimit(request, limit) {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > limit) {
      throw new BodySizeLimitError(limit);
    }
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      if (received > limit) {
        throw new BodySizeLimitError(limit);
      }
      chunks.push(value);
    }
  }
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}
class BodySizeLimitError extends Error {
  limit;
  constructor(limit) {
    super(`Request body exceeds the configured limit of ${limit} bytes`);
    this.name = "BodySizeLimitError";
    this.limit = limit;
  }
}

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "https://www.packershub.in", "SSR": true};
function getActionContext(context) {
  const callerInfo = getCallerInfo(context);
  const actionResultAlreadySet = Boolean(context.locals._actionPayload);
  let action = void 0;
  if (callerInfo && context.request.method === "POST" && !actionResultAlreadySet) {
    action = {
      calledFrom: callerInfo.from,
      name: callerInfo.name,
      handler: async () => {
        const pipeline = Reflect.get(context, pipelineSymbol);
        const callerInfoName = shouldAppendForwardSlash(
          pipeline.manifest.trailingSlash,
          pipeline.manifest.buildFormat
        ) ? removeTrailingForwardSlash(callerInfo.name) : callerInfo.name;
        let baseAction;
        try {
          baseAction = await pipeline.getAction(callerInfoName);
        } catch (error) {
          if (error instanceof Error && "name" in error && typeof error.name === "string" && error.name === ActionNotFoundError.name) {
            return { data: void 0, error: new ActionError({ code: "NOT_FOUND" }) };
          }
          throw error;
        }
        const bodySizeLimit = pipeline.manifest.actionBodySizeLimit;
        let input;
        try {
          input = await parseRequestBody(context.request, bodySizeLimit);
        } catch (e) {
          if (e instanceof ActionError) {
            return { data: void 0, error: e };
          }
          if (e instanceof TypeError) {
            return { data: void 0, error: new ActionError({ code: "UNSUPPORTED_MEDIA_TYPE" }) };
          }
          throw e;
        }
        const omitKeys = ["props", "getActionResult", "callAction", "redirect"];
        const actionAPIContext = Object.create(
          Object.getPrototypeOf(context),
          Object.fromEntries(
            Object.entries(Object.getOwnPropertyDescriptors(context)).filter(
              ([key]) => !omitKeys.includes(key)
            )
          )
        );
        Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
        const handler = baseAction.bind(actionAPIContext);
        return handler(input);
      }
    };
  }
  function setActionResult(actionName, actionResult) {
    context.locals._actionPayload = {
      actionResult,
      actionName
    };
  }
  return {
    action,
    setActionResult,
    serializeActionResult,
    deserializeActionResult
  };
}
function getCallerInfo(ctx) {
  if (ctx.routePattern === ACTION_RPC_ROUTE_PATTERN) {
    return { from: "rpc", name: ctx.url.pathname.replace(/^.*\/_actions\//, "") };
  }
  const queryParam = ctx.url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
  if (queryParam) {
    return { from: "form", name: queryParam };
  }
  return void 0;
}
async function parseRequestBody(request, bodySizeLimit) {
  const contentType = request.headers.get("content-type");
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : void 0;
  const hasContentLength = typeof contentLength === "number" && Number.isFinite(contentLength);
  if (!contentType) return void 0;
  if (hasContentLength && contentLength > bodySizeLimit) {
    throw new ActionError({
      code: "CONTENT_TOO_LARGE",
      message: `Request body exceeds ${bodySizeLimit} bytes`
    });
  }
  try {
    if (hasContentType(contentType, formContentTypes)) {
      if (!hasContentLength) {
        const body = await readBodyWithLimit(request.clone(), bodySizeLimit);
        const formRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: toArrayBuffer(body)
        });
        return await formRequest.formData();
      }
      return await request.clone().formData();
    }
    if (hasContentType(contentType, ["application/json"])) {
      if (contentLength === 0) return void 0;
      if (!hasContentLength) {
        const body = await readBodyWithLimit(request.clone(), bodySizeLimit);
        if (body.byteLength === 0) return void 0;
        return JSON.parse(new TextDecoder().decode(body));
      }
      return await request.clone().json();
    }
  } catch (e) {
    if (e instanceof BodySizeLimitError) {
      throw new ActionError({
        code: "CONTENT_TOO_LARGE",
        message: `Request body exceeds ${bodySizeLimit} bytes`
      });
    }
    throw e;
  }
  throw new TypeError("Unsupported content type");
}
const ACTION_API_CONTEXT_SYMBOL = /* @__PURE__ */ Symbol.for("astro.actionAPIContext");
const formContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];
function hasContentType(contentType, expected) {
  const type = contentType.split(";")[0].toLowerCase();
  return expected.some((t) => type === t);
}
function serializeActionResult(res) {
  if (res.error) {
    if (Object.assign(__vite_import_meta_env__, { OS: "Windows_NT" })?.DEV) {
      actionResultErrorStack.set(res.error.stack);
    }
    let body2;
    if (res.error instanceof ActionInputError) {
      body2 = {
        type: res.error.type,
        issues: res.error.issues,
        fields: res.error.fields
      };
    } else {
      body2 = {
        ...res.error,
        message: res.error.message
      };
    }
    return {
      type: "error",
      status: res.error.status,
      contentType: "application/json",
      body: JSON.stringify(body2)
    };
  }
  if (res.data === void 0) {
    return {
      type: "empty",
      status: 204
    };
  }
  let body;
  try {
    body = stringify$2(res.data, {
      // Add support for URL objects
      URL: (value) => value instanceof URL && value.href
    });
  } catch (e) {
    let hint = ActionsReturnedInvalidDataError.hint;
    if (res.data instanceof Response) {
      hint = REDIRECT_STATUS_CODES.includes(res.data.status) ? "If you need to redirect when the action succeeds, trigger a redirect where the action is called. See the Actions guide for server and client redirect examples: https://docs.astro.build/en/guides/actions." : "If you need to return a Response object, try using a server endpoint instead. See https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes";
    }
    throw new AstroError({
      ...ActionsReturnedInvalidDataError,
      message: ActionsReturnedInvalidDataError.message(String(e)),
      hint
    });
  }
  return {
    type: "data",
    status: 200,
    contentType: "application/json+devalue",
    body
  };
}
function toArrayBuffer(buffer) {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

function hasActionPayload(locals) {
  return "_actionPayload" in locals;
}
function createGetActionResult(locals) {
  return (actionFn) => {
    if (!hasActionPayload(locals) || actionFn.toString() !== getActionQueryString(locals._actionPayload.actionName)) {
      return void 0;
    }
    return deserializeActionResult(locals._actionPayload.actionResult);
  };
}
function createCallAction(context) {
  return (baseAction, input) => {
    Reflect.set(context, ACTION_API_CONTEXT_SYMBOL, true);
    const action = baseAction.bind(context);
    return action(input);
  };
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var dist = {};

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist;
	hasRequiredDist = 1;
	Object.defineProperty(dist, "__esModule", { value: true });
	dist.parseCookie = parseCookie;
	dist.parse = parseCookie;
	dist.stringifyCookie = stringifyCookie;
	dist.stringifySetCookie = stringifySetCookie;
	dist.serialize = stringifySetCookie;
	dist.parseSetCookie = parseSetCookie;
	dist.stringifySetCookie = stringifySetCookie;
	dist.serialize = stringifySetCookie;
	/**
	 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
	 * This refers out to the obsoleted definition of token in RFC 2616 sec 2.2
	 * which has been replaced by the token definition in RFC 7230 appendix B.
	 *
	 * cookie-name       = token
	 * token             = 1*tchar
	 * tchar             = "!" / "#" / "$" / "%" / "&" / "'" /
	 *                     "*" / "+" / "-" / "." / "^" / "_" /
	 *                     "`" / "|" / "~" / DIGIT / ALPHA
	 *
	 * Note: Allowing more characters - https://github.com/jshttp/cookie/issues/191
	 * Allow same range as cookie value, except `=`, which delimits end of name.
	 */
	const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
	/**
	 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
	 *
	 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
	 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
	 *                     ; US-ASCII characters excluding CTLs,
	 *                     ; whitespace DQUOTE, comma, semicolon,
	 *                     ; and backslash
	 *
	 * Allowing more characters: https://github.com/jshttp/cookie/issues/191
	 * Comma, backslash, and DQUOTE are not part of the parsing algorithm.
	 */
	const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
	/**
	 * RegExp to match domain-value in RFC 6265 sec 4.1.1
	 *
	 * domain-value      = <subdomain>
	 *                     ; defined in [RFC1034], Section 3.5, as
	 *                     ; enhanced by [RFC1123], Section 2.1
	 * <subdomain>       = <label> | <subdomain> "." <label>
	 * <label>           = <let-dig> [ [ <ldh-str> ] <let-dig> ]
	 *                     Labels must be 63 characters or less.
	 *                     'let-dig' not 'letter' in the first char, per RFC1123
	 * <ldh-str>         = <let-dig-hyp> | <let-dig-hyp> <ldh-str>
	 * <let-dig-hyp>     = <let-dig> | "-"
	 * <let-dig>         = <letter> | <digit>
	 * <letter>          = any one of the 52 alphabetic characters A through Z in
	 *                     upper case and a through z in lower case
	 * <digit>           = any one of the ten digits 0 through 9
	 *
	 * Keep support for leading dot: https://github.com/jshttp/cookie/issues/173
	 *
	 * > (Note that a leading %x2E ("."), if present, is ignored even though that
	 * character is not permitted, but a trailing %x2E ("."), if present, will
	 * cause the user agent to ignore the attribute.)
	 */
	const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
	/**
	 * RegExp to match path-value in RFC 6265 sec 4.1.1
	 *
	 * path-value        = <any CHAR except CTLs or ";">
	 * CHAR              = %x01-7F
	 *                     ; defined in RFC 5234 appendix B.1
	 */
	const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
	/**
	 * RegExp to match max-age-value in RFC 6265 sec 5.6.2
	 */
	const maxAgeRegExp = /^-?\d+$/;
	const __toString = Object.prototype.toString;
	const NullObject = /* @__PURE__ */ (() => {
	    const C = function () { };
	    C.prototype = Object.create(null);
	    return C;
	})();
	/**
	 * Parse a `Cookie` header.
	 *
	 * Parse the given cookie header string into an object
	 * The object has the various cookies as keys(names) => values
	 */
	function parseCookie(str, options) {
	    const obj = new NullObject();
	    const len = str.length;
	    // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
	    if (len < 2)
	        return obj;
	    const dec = options?.decode || decode;
	    let index = 0;
	    do {
	        const eqIdx = eqIndex(str, index, len);
	        if (eqIdx === -1)
	            break; // No more cookie pairs.
	        const endIdx = endIndex(str, index, len);
	        if (eqIdx > endIdx) {
	            // backtrack on prior semicolon
	            index = str.lastIndexOf(";", eqIdx - 1) + 1;
	            continue;
	        }
	        const key = valueSlice(str, index, eqIdx);
	        // only assign once
	        if (obj[key] === undefined) {
	            obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
	        }
	        index = endIdx + 1;
	    } while (index < len);
	    return obj;
	}
	/**
	 * Stringifies an object into an HTTP `Cookie` header.
	 */
	function stringifyCookie(cookie, options) {
	    const enc = options?.encode || encodeURIComponent;
	    const cookieStrings = [];
	    for (const name of Object.keys(cookie)) {
	        const val = cookie[name];
	        if (val === undefined)
	            continue;
	        if (!cookieNameRegExp.test(name)) {
	            throw new TypeError(`cookie name is invalid: ${name}`);
	        }
	        const value = enc(val);
	        if (!cookieValueRegExp.test(value)) {
	            throw new TypeError(`cookie val is invalid: ${val}`);
	        }
	        cookieStrings.push(`${name}=${value}`);
	    }
	    return cookieStrings.join("; ");
	}
	function stringifySetCookie(_name, _val, _opts) {
	    const cookie = typeof _name === "object"
	        ? _name
	        : { ..._opts, name: _name, value: String(_val) };
	    const options = typeof _val === "object" ? _val : _opts;
	    const enc = options?.encode || encodeURIComponent;
	    if (!cookieNameRegExp.test(cookie.name)) {
	        throw new TypeError(`argument name is invalid: ${cookie.name}`);
	    }
	    const value = cookie.value ? enc(cookie.value) : "";
	    if (!cookieValueRegExp.test(value)) {
	        throw new TypeError(`argument val is invalid: ${cookie.value}`);
	    }
	    let str = cookie.name + "=" + value;
	    if (cookie.maxAge !== undefined) {
	        if (!Number.isInteger(cookie.maxAge)) {
	            throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
	        }
	        str += "; Max-Age=" + cookie.maxAge;
	    }
	    if (cookie.domain) {
	        if (!domainValueRegExp.test(cookie.domain)) {
	            throw new TypeError(`option domain is invalid: ${cookie.domain}`);
	        }
	        str += "; Domain=" + cookie.domain;
	    }
	    if (cookie.path) {
	        if (!pathValueRegExp.test(cookie.path)) {
	            throw new TypeError(`option path is invalid: ${cookie.path}`);
	        }
	        str += "; Path=" + cookie.path;
	    }
	    if (cookie.expires) {
	        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
	            throw new TypeError(`option expires is invalid: ${cookie.expires}`);
	        }
	        str += "; Expires=" + cookie.expires.toUTCString();
	    }
	    if (cookie.httpOnly) {
	        str += "; HttpOnly";
	    }
	    if (cookie.secure) {
	        str += "; Secure";
	    }
	    if (cookie.partitioned) {
	        str += "; Partitioned";
	    }
	    if (cookie.priority) {
	        const priority = typeof cookie.priority === "string"
	            ? cookie.priority.toLowerCase()
	            : undefined;
	        switch (priority) {
	            case "low":
	                str += "; Priority=Low";
	                break;
	            case "medium":
	                str += "; Priority=Medium";
	                break;
	            case "high":
	                str += "; Priority=High";
	                break;
	            default:
	                throw new TypeError(`option priority is invalid: ${cookie.priority}`);
	        }
	    }
	    if (cookie.sameSite) {
	        const sameSite = typeof cookie.sameSite === "string"
	            ? cookie.sameSite.toLowerCase()
	            : cookie.sameSite;
	        switch (sameSite) {
	            case true:
	            case "strict":
	                str += "; SameSite=Strict";
	                break;
	            case "lax":
	                str += "; SameSite=Lax";
	                break;
	            case "none":
	                str += "; SameSite=None";
	                break;
	            default:
	                throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
	        }
	    }
	    return str;
	}
	/**
	 * Deserialize a `Set-Cookie` header into an object.
	 *
	 * deserialize('foo=bar; httpOnly')
	 *   => { name: 'foo', value: 'bar', httpOnly: true }
	 */
	function parseSetCookie(str, options) {
	    const dec = options?.decode || decode;
	    const len = str.length;
	    const endIdx = endIndex(str, 0, len);
	    const eqIdx = eqIndex(str, 0, endIdx);
	    const setCookie = eqIdx === -1
	        ? { name: "", value: dec(valueSlice(str, 0, endIdx)) }
	        : {
	            name: valueSlice(str, 0, eqIdx),
	            value: dec(valueSlice(str, eqIdx + 1, endIdx)),
	        };
	    let index = endIdx + 1;
	    while (index < len) {
	        const endIdx = endIndex(str, index, len);
	        const eqIdx = eqIndex(str, index, endIdx);
	        const attr = eqIdx === -1
	            ? valueSlice(str, index, endIdx)
	            : valueSlice(str, index, eqIdx);
	        const val = eqIdx === -1 ? undefined : valueSlice(str, eqIdx + 1, endIdx);
	        switch (attr.toLowerCase()) {
	            case "httponly":
	                setCookie.httpOnly = true;
	                break;
	            case "secure":
	                setCookie.secure = true;
	                break;
	            case "partitioned":
	                setCookie.partitioned = true;
	                break;
	            case "domain":
	                setCookie.domain = val;
	                break;
	            case "path":
	                setCookie.path = val;
	                break;
	            case "max-age":
	                if (val && maxAgeRegExp.test(val))
	                    setCookie.maxAge = Number(val);
	                break;
	            case "expires":
	                if (!val)
	                    break;
	                const date = new Date(val);
	                if (Number.isFinite(date.valueOf()))
	                    setCookie.expires = date;
	                break;
	            case "priority":
	                if (!val)
	                    break;
	                const priority = val.toLowerCase();
	                if (priority === "low" ||
	                    priority === "medium" ||
	                    priority === "high") {
	                    setCookie.priority = priority;
	                }
	                break;
	            case "samesite":
	                if (!val)
	                    break;
	                const sameSite = val.toLowerCase();
	                if (sameSite === "lax" ||
	                    sameSite === "strict" ||
	                    sameSite === "none") {
	                    setCookie.sameSite = sameSite;
	                }
	                break;
	        }
	        index = endIdx + 1;
	    }
	    return setCookie;
	}
	/**
	 * Find the `;` character between `min` and `len` in str.
	 */
	function endIndex(str, min, len) {
	    const index = str.indexOf(";", min);
	    return index === -1 ? len : index;
	}
	/**
	 * Find the `=` character between `min` and `max` in str.
	 */
	function eqIndex(str, min, max) {
	    const index = str.indexOf("=", min);
	    return index < max ? index : -1;
	}
	/**
	 * Slice out a value between startPod to max.
	 */
	function valueSlice(str, min, max) {
	    let start = min;
	    let end = max;
	    do {
	        const code = str.charCodeAt(start);
	        if (code !== 0x20 /*   */ && code !== 0x09 /* \t */)
	            break;
	    } while (++start < end);
	    while (end > start) {
	        const code = str.charCodeAt(end - 1);
	        if (code !== 0x20 /*   */ && code !== 0x09 /* \t */)
	            break;
	        end--;
	    }
	    return str.slice(start, end);
	}
	/**
	 * URL-decode string value. Optimized to skip native call when no %.
	 */
	function decode(str) {
	    if (str.indexOf("%") === -1)
	        return str;
	    try {
	        return decodeURIComponent(str);
	    }
	    catch (e) {
	        return str;
	    }
	}
	/**
	 * Determine if value is a Date.
	 */
	function isDate(val) {
	    return __toString.call(val) === "[object Date]";
	}
	
	return dist;
}

var distExports = /*@__PURE__*/ requireDist();

const DELETED_EXPIRATION = /* @__PURE__ */ new Date(0);
const DELETED_VALUE = "deleted";
const responseSentSymbol = /* @__PURE__ */ Symbol.for("astro.responseSent");
const identity = (value) => value;
class AstroCookie {
  value;
  constructor(value) {
    this.value = value;
  }
  json() {
    if (this.value === void 0) {
      throw new Error(`Cannot convert undefined to an object.`);
    }
    return JSON.parse(this.value);
  }
  number() {
    return Number(this.value);
  }
  boolean() {
    if (this.value === "false") return false;
    if (this.value === "0") return false;
    return Boolean(this.value);
  }
}
class AstroCookies {
  #request;
  #requestValues;
  #outgoing;
  #consumed;
  constructor(request) {
    this.#request = request;
    this.#requestValues = null;
    this.#outgoing = null;
    this.#consumed = false;
  }
  /**
   * Astro.cookies.delete(key) is used to delete a cookie. Using this method will result
   * in a Set-Cookie header added to the response.
   * @param key The cookie to delete
   * @param options Options related to this deletion, such as the path of the cookie.
   */
  delete(key, options) {
    const {
      // @ts-expect-error
      maxAge: _ignoredMaxAge,
      // @ts-expect-error
      expires: _ignoredExpires,
      ...sanitizedOptions
    } = options || {};
    const serializeOptions = {
      expires: DELETED_EXPIRATION,
      ...sanitizedOptions
    };
    this.#ensureOutgoingMap().set(key, [
      DELETED_VALUE,
      distExports.serialize(key, DELETED_VALUE, serializeOptions),
      false
    ]);
  }
  /**
   * Astro.cookies.get(key) is used to get a cookie value. The cookie value is read from the
   * request. If you have set a cookie via Astro.cookies.set(key, value), the value will be taken
   * from that set call, overriding any values already part of the request.
   * @param key The cookie to get.
   * @returns An object containing the cookie value as well as convenience methods for converting its value.
   */
  get(key, options = void 0) {
    if (this.#outgoing?.has(key)) {
      let [serializedValue, , isSetValue] = this.#outgoing.get(key);
      if (isSetValue) {
        return new AstroCookie(serializedValue);
      } else {
        return void 0;
      }
    }
    const decode = options?.decode ?? decodeURIComponent;
    const values = this.#ensureParsed();
    if (key in values) {
      const value = values[key];
      if (value) {
        let decodedValue;
        try {
          decodedValue = decode(value);
        } catch (_error) {
          decodedValue = value;
        }
        return new AstroCookie(decodedValue);
      }
    }
  }
  /**
   * Astro.cookies.has(key) returns a boolean indicating whether this cookie is either
   * part of the initial request or set via Astro.cookies.set(key)
   * @param key The cookie to check for.
   * @param _options This parameter is no longer used.
   * @returns
   */
  has(key, _options) {
    if (this.#outgoing?.has(key)) {
      let [, , isSetValue] = this.#outgoing.get(key);
      return isSetValue;
    }
    const values = this.#ensureParsed();
    return values[key] !== void 0;
  }
  /**
   * Astro.cookies.set(key, value) is used to set a cookie's value. If provided
   * an object it will be stringified via JSON.stringify(value). Additionally you
   * can provide options customizing how this cookie will be set, such as setting httpOnly
   * in order to prevent the cookie from being read in client-side JavaScript.
   * @param key The name of the cookie to set.
   * @param value A value, either a string or other primitive or an object.
   * @param options Options for the cookie, such as the path and security settings.
   */
  set(key, value, options) {
    if (this.#consumed) {
      const warning = new Error(
        "Astro.cookies.set() was called after the cookies had already been sent to the browser.\nThis may have happened if this method was called in an imported component.\nPlease make sure that Astro.cookies.set() is only called in the frontmatter of the main page."
      );
      warning.name = "Warning";
      console.warn(warning);
    }
    let serializedValue;
    if (typeof value === "string") {
      serializedValue = value;
    } else {
      let toStringValue = value.toString();
      if (toStringValue === Object.prototype.toString.call(value)) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = toStringValue;
      }
    }
    const serializeOptions = {};
    if (options) {
      Object.assign(serializeOptions, options);
    }
    this.#ensureOutgoingMap().set(key, [
      serializedValue,
      distExports.serialize(key, serializedValue, serializeOptions),
      true
    ]);
    if (this.#request[responseSentSymbol]) {
      throw new AstroError({
        ...ResponseSentError
      });
    }
  }
  /**
   * Merges a new AstroCookies instance into the current instance. Any new cookies
   * will be added to the current instance, overwriting any existing cookies with the same name.
   */
  merge(cookies) {
    const outgoing = cookies.#outgoing;
    if (outgoing) {
      for (const [key, value] of outgoing) {
        this.#ensureOutgoingMap().set(key, value);
      }
    }
  }
  /**
   * Astro.cookies.header() returns an iterator for the cookies that have previously
   * been set by either Astro.cookies.set() or Astro.cookies.delete().
   * This method is primarily used by adapters to set the header on outgoing responses.
   * @returns
   */
  *headers() {
    if (this.#outgoing == null) return;
    for (const [, value] of this.#outgoing) {
      yield value[1];
    }
  }
  /**
   * Marks the cookies as consumed and returns the header values.
   * After consumption, any subsequent `set()` calls will warn.
   */
  consume() {
    this.#consumed = true;
    return this.headers();
  }
  /**
   * @deprecated Use the instance method `cookies.consume()` instead.
   * Kept for backward compatibility with adapters.
   */
  static consume(cookies) {
    return cookies.consume();
  }
  #ensureParsed() {
    if (!this.#requestValues) {
      this.#parse();
    }
    if (!this.#requestValues) {
      this.#requestValues = /* @__PURE__ */ Object.create(null);
    }
    return this.#requestValues;
  }
  #ensureOutgoingMap() {
    if (!this.#outgoing) {
      this.#outgoing = /* @__PURE__ */ new Map();
    }
    return this.#outgoing;
  }
  #parse() {
    const raw = this.#request.headers.get("cookie");
    if (!raw) {
      return;
    }
    this.#requestValues = distExports.parse(raw, { decode: identity });
  }
}

const astroCookiesSymbol = /* @__PURE__ */ Symbol.for("astro.cookies");
function attachCookiesToResponse(response, cookies) {
  Reflect.set(response, astroCookiesSymbol, cookies);
}
function getCookiesFromResponse(response) {
  let cookies = Reflect.get(response, astroCookiesSymbol);
  if (cookies != null) {
    return cookies;
  } else {
    return void 0;
  }
}
function* getSetCookiesFromResponse(response) {
  const cookies = getCookiesFromResponse(response);
  if (!cookies) {
    return [];
  }
  for (const headerValue of cookies.consume()) {
    yield headerValue;
  }
  return [];
}

const NOOP_ACTIONS_MOD = {
  server: {}
};

function defineMiddleware(fn) {
  return fn;
}

const FORM_CONTENT_TYPES = [
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
];
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
function createOriginCheckMiddleware() {
  return defineMiddleware((context, next) => {
    const { request, url, isPrerendered } = context;
    if (isPrerendered) {
      return next();
    }
    if (SAFE_METHODS.includes(request.method)) {
      return next();
    }
    const isSameOrigin = request.headers.get("origin") === url.origin;
    const hasContentType = request.headers.has("content-type");
    if (hasContentType) {
      const formLikeHeader = hasFormLikeHeader(request.headers.get("content-type"));
      if (formLikeHeader && !isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    } else {
      if (!isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    }
    return next();
  });
}
function hasFormLikeHeader(contentType) {
  if (contentType) {
    for (const FORM_CONTENT_TYPE of FORM_CONTENT_TYPES) {
      if (contentType.toLowerCase().includes(FORM_CONTENT_TYPE)) {
        return true;
      }
    }
  }
  return false;
}

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

function createRequest({
  url,
  headers,
  method = "GET",
  body = void 0,
  logger,
  isPrerendered = false,
  routePattern,
  init
}) {
  const headersObj = isPrerendered ? void 0 : headers instanceof Headers ? headers : new Headers(
    // Filter out HTTP/2 pseudo-headers. These are internally-generated headers added to all HTTP/2 requests with trusted metadata about the request.
    // Examples include `:method`, `:scheme`, `:authority`, and `:path`.
    // They are always prefixed with a colon to distinguish them from other headers, and it is an error to add the to a Headers object manually.
    // See https://httpwg.org/specs/rfc7540.html#HttpRequest
    Object.entries(headers).filter(([name]) => !name.startsWith(":"))
  );
  if (typeof url === "string") url = new URL(url);
  if (isPrerendered) {
    url.search = "";
  }
  const request = new Request(url, {
    method,
    headers: headersObj,
    // body is made available only if the request is for a page that will be on-demand rendered
    body: isPrerendered ? null : body,
    ...init
  });
  if (isPrerendered) {
    let _headers = request.headers;
    const { value, writable, ...headersDesc } = Object.getOwnPropertyDescriptor(request, "headers") || {};
    Object.defineProperty(request, "headers", {
      ...headersDesc,
      get() {
        logger.warn(
          null,
          `\`Astro.request.headers\` was used when rendering the route \`${routePattern}'\`. \`Astro.request.headers\` is not available on prerendered pages. If you need access to request headers, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default.`
        );
        return _headers;
      },
      set(newHeaders) {
        _headers = newHeaders;
      }
    });
  }
  return request;
}

class MultiLevelEncodingError extends Error {
  constructor() {
    super("URL encoding depth exceeded the maximum number of decode iterations");
    this.name = "MultiLevelEncodingError";
  }
}
const MAX_DECODE_ITERATIONS = 10;
function validateAndDecodePathname(pathname) {
  let decoded;
  try {
    decoded = decodeURI(pathname);
  } catch (_e) {
    throw new Error("Invalid URL encoding");
  }
  let iterations = 0;
  while (decoded !== pathname) {
    if (iterations >= MAX_DECODE_ITERATIONS) {
      throw new MultiLevelEncodingError();
    }
    pathname = decoded;
    try {
      decoded = decodeURI(pathname);
    } catch {
      break;
    }
    iterations++;
  }
  return decoded;
}

/**
 * Copyright (C) 2017-present by Andrea Giammarchi - @WebReflection
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const {replace} = '';
const ca = /[&<>'"]/g;

const esca = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
};
const pe = m => esca[m];

/**
 * Safely escape HTML entities such as `&`, `<`, `>`, `"`, and `'`.
 * @param {string} es the input to safely escape
 * @returns {string} the escaped input, and it **throws** an error if
 *  the input type is unexpected, except for boolean and numbers,
 *  converted as string.
 */
const escape = es => replace.call(es, ca, pe);

function template({
  title,
  pathname,
  statusCode = 404,
  tabTitle,
  body
}) {
  return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>${tabTitle}</title>
		<style>
			:root {
				--gray-10: hsl(258, 7%, 10%);
				--gray-20: hsl(258, 7%, 20%);
				--gray-30: hsl(258, 7%, 30%);
				--gray-40: hsl(258, 7%, 40%);
				--gray-50: hsl(258, 7%, 50%);
				--gray-60: hsl(258, 7%, 60%);
				--gray-70: hsl(258, 7%, 70%);
				--gray-80: hsl(258, 7%, 80%);
				--gray-90: hsl(258, 7%, 90%);
				--black: #13151A;
				--accent-light: #E0CCFA;
			}

			* {
				box-sizing: border-box;
			}

			html {
				background: var(--black);
				color-scheme: dark;
				accent-color: var(--accent-light);
			}

			body {
				background-color: var(--gray-10);
				color: var(--gray-80);
				font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
				line-height: 1.5;
				margin: 0;
			}

			a {
				color: var(--accent-light);
			}

			.center {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100vh;
				width: 100vw;
			}

			h1 {
				margin-bottom: 8px;
				color: white;
				font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
				font-weight: 700;
				margin-top: 1rem;
				margin-bottom: 0;
			}

			.statusCode {
				color: var(--accent-light);
			}

			.astro-icon {
				height: 124px;
				width: 124px;
			}

			pre, code {
				padding: 2px 8px;
				background: rgba(0,0,0, 0.25);
				border: 1px solid rgba(255,255,255, 0.25);
				border-radius: 4px;
				font-size: 1.2em;
				margin-top: 0;
				max-width: 60em;
			}
		</style>
	</head>
	<body>
		<main class="center">
			<svg class="astro-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 64 80" fill="none"> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="white"/> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="url(#paint0_linear_738_686)"/> <path d="M0 51.6401C0 51.6401 10.6488 46.4654 21.3274 46.4654L29.3786 21.6102C29.6801 20.4082 30.5602 19.5913 31.5538 19.5913C32.5474 19.5913 33.4275 20.4082 33.7289 21.6102L41.7802 46.4654C54.4274 46.4654 63.1076 51.6401 63.1076 51.6401C63.1076 51.6401 45.0197 2.48776 44.9843 2.38914C44.4652 0.935933 43.5888 0 42.4073 0H20.7022C19.5206 0 18.6796 0.935933 18.1251 2.38914C18.086 2.4859 0 51.6401 0 51.6401Z" fill="white"/> <defs> <linearGradient id="paint0_linear_738_686" x1="31.554" y1="75.4423" x2="39.7462" y2="48.376" gradientUnits="userSpaceOnUse"> <stop stop-color="#D83333"/> <stop offset="1" stop-color="#F041FF"/> </linearGradient> </defs> </svg>
			<h1>${statusCode ? `<span class="statusCode">${statusCode}: </span> ` : ""}<span class="statusMessage">${title}</span></h1>
			${body || `
				<pre>Path: ${escape(pathname)}</pre>
			`}
			</main>
	</body>
</html>`;
}

const DEFAULT_404_ROUTE = {
  component: DEFAULT_404_COMPONENT,
  params: [],
  pattern: /^\/404\/?$/,
  prerender: false,
  pathname: "/404",
  segments: [[{ content: "404", dynamic: false, spread: false }]],
  type: "page",
  route: "/404",
  fallbackRoutes: [],
  isIndex: false,
  origin: "internal",
  distURL: []
};
async function default404Page({ pathname }) {
  return new Response(
    template({
      statusCode: 404,
      title: "Not found",
      tabTitle: "404: Not Found",
      pathname
    }),
    { status: 404, headers: { "Content-Type": "text/html" } }
  );
}
default404Page.isAstroComponentFactory = true;
const default404Instance = {
  default: default404Page
};

const ROUTE404_RE = /^\/404\/?$/;
const ROUTE500_RE = /^\/500\/?$/;
function isRoute404(route) {
  return ROUTE404_RE.test(route);
}
function isRoute500(route) {
  return ROUTE500_RE.test(route);
}

function findRouteToRewrite({
  payload,
  routes,
  request,
  trailingSlash,
  buildFormat,
  base,
  outDir
}) {
  let newUrl = void 0;
  if (payload instanceof URL) {
    newUrl = payload;
  } else if (payload instanceof Request) {
    newUrl = new URL(payload.url);
  } else {
    newUrl = new URL(collapseDuplicateSlashes(payload), new URL(request.url).origin);
  }
  const { pathname, resolvedUrlPathname } = normalizeRewritePathname(
    newUrl.pathname,
    base,
    trailingSlash,
    buildFormat
  );
  newUrl.pathname = resolvedUrlPathname;
  const decodedPathname = validateAndDecodePathname(pathname);
  if (isRoute404(decodedPathname)) {
    const errorRoute = routes.find((route) => route.route === "/404");
    if (errorRoute) {
      return { routeData: errorRoute, newUrl, pathname: decodedPathname };
    }
  }
  if (isRoute500(decodedPathname)) {
    const errorRoute = routes.find((route) => route.route === "/500");
    if (errorRoute) {
      return { routeData: errorRoute, newUrl, pathname: decodedPathname };
    }
  }
  let foundRoute;
  for (const route of routes) {
    if (route.pattern.test(decodedPathname)) {
      if (route.params && route.params.length !== 0 && route.distURL && route.distURL.length !== 0) {
        if (!route.distURL.find(
          (url) => url.href.replace(outDir.toString(), "").replace(/(?:\/index\.html|\.html)$/, "") === trimSlashes(pathname)
        )) {
          continue;
        }
      }
      foundRoute = route;
      break;
    }
  }
  if (foundRoute) {
    return {
      routeData: foundRoute,
      newUrl,
      pathname: decodedPathname
    };
  } else {
    const custom404 = routes.find((route) => route.route === "/404");
    if (custom404) {
      return { routeData: custom404, newUrl, pathname };
    } else {
      return { routeData: DEFAULT_404_ROUTE, newUrl, pathname };
    }
  }
}
function copyRequest(newUrl, oldRequest, isPrerendered, logger, routePattern) {
  if (oldRequest.bodyUsed) {
    throw new AstroError(RewriteWithBodyUsed);
  }
  return createRequest({
    url: newUrl,
    method: oldRequest.method,
    body: oldRequest.body,
    isPrerendered,
    logger,
    headers: isPrerendered ? {} : oldRequest.headers,
    routePattern,
    init: {
      referrer: oldRequest.referrer,
      referrerPolicy: oldRequest.referrerPolicy,
      mode: oldRequest.mode,
      credentials: oldRequest.credentials,
      cache: oldRequest.cache,
      redirect: oldRequest.redirect,
      integrity: oldRequest.integrity,
      signal: oldRequest.signal,
      keepalive: oldRequest.keepalive,
      // https://fetch.spec.whatwg.org/#dom-request-duplex
      // @ts-expect-error It isn't part of the types, but undici accepts it and it allows carrying over the body to a new request
      duplex: "half"
    }
  });
}
function setOriginPathname(request, pathname, trailingSlash, buildFormat) {
  if (!pathname) {
    pathname = "/";
  }
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  let finalPathname;
  if (pathname === "/") {
    finalPathname = "/";
  } else if (shouldAppendSlash) {
    finalPathname = appendForwardSlash(pathname);
  } else {
    finalPathname = removeTrailingForwardSlash(pathname);
  }
  Reflect.set(request, originPathnameSymbol, encodeURIComponent(finalPathname));
}
function getOriginPathname(request) {
  const origin = Reflect.get(request, originPathnameSymbol);
  if (origin) {
    return decodeURIComponent(origin);
  }
  return new URL(request.url).pathname;
}
function normalizeRewritePathname(urlPathname, base, trailingSlash, buildFormat) {
  let pathname = collapseDuplicateSlashes(urlPathname);
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  if (base !== "/") {
    const isBasePathRequest = urlPathname === base || urlPathname === removeTrailingForwardSlash(base);
    if (isBasePathRequest) {
      pathname = "/";
    } else if (urlPathname.startsWith(base)) {
      pathname = shouldAppendSlash ? appendForwardSlash(urlPathname) : removeTrailingForwardSlash(urlPathname);
      pathname = pathname.slice(base.length);
    }
  }
  if (!pathname.startsWith("/") && shouldAppendSlash && urlPathname.endsWith("/")) {
    pathname = prependForwardSlash(pathname);
  }
  if (buildFormat === "file") {
    pathname = pathname.replace(/\.html$/, "");
  }
  let resolvedUrlPathname;
  if (base !== "/" && (pathname === "" || pathname === "/") && !shouldAppendSlash) {
    resolvedUrlPathname = removeTrailingForwardSlash(base);
  } else {
    resolvedUrlPathname = joinPaths(...[base, pathname].filter(Boolean));
  }
  return { pathname, resolvedUrlPathname };
}

function sequence(...handlers) {
  const filtered = handlers.filter((h) => !!h);
  const length = filtered.length;
  if (!length) {
    return defineMiddleware((_context, next) => {
      return next();
    });
  }
  return defineMiddleware((context, next) => {
    let carriedPayload = void 0;
    return applyHandle(0, context);
    function applyHandle(i, handleContext) {
      const handle = filtered[i];
      const result = handle(handleContext, async (payload) => {
        if (i < length - 1) {
          if (payload) {
            let newRequest;
            if (payload instanceof Request) {
              newRequest = payload;
            } else if (payload instanceof URL) {
              newRequest = new Request(payload, handleContext.request.clone());
            } else {
              newRequest = new Request(
                new URL(payload, handleContext.url.origin),
                handleContext.request.clone()
              );
            }
            const oldPathname = handleContext.url.pathname;
            const pipeline = Reflect.get(handleContext, pipelineSymbol);
            const { routeData, pathname } = await pipeline.tryRewrite(
              payload,
              handleContext.request
            );
            if (pipeline.manifest.serverLike === true && handleContext.isPrerendered === false && routeData.prerender === true) {
              throw new AstroError({
                ...ForbiddenRewrite,
                message: ForbiddenRewrite.message(
                  handleContext.url.pathname,
                  pathname,
                  routeData.component
                ),
                hint: ForbiddenRewrite.hint(routeData.component)
              });
            }
            carriedPayload = payload;
            handleContext.request = newRequest;
            handleContext.url = new URL(newRequest.url);
            handleContext.params = getParams(routeData, pathname);
            handleContext.routePattern = routeData.route;
            setOriginPathname(
              handleContext.request,
              oldPathname,
              pipeline.manifest.trailingSlash,
              pipeline.manifest.buildFormat
            );
          }
          return applyHandle(i + 1, handleContext);
        } else {
          return next(payload ?? carriedPayload);
        }
      });
      return result;
    }
  });
}

const RedirectComponentInstance = {
  default() {
    return new Response(null, {
      status: 301
    });
  }
};
const RedirectSinglePageBuiltModule = {
  page: () => Promise.resolve(RedirectComponentInstance),
  onRequest: (_, next) => next()
};

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
  return segmentPath ? collapseDuplicateLeadingSlashes("/" + segmentPath) : "";
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

const VALID_PARAM_TYPES = ["string", "undefined"];
function validateGetStaticPathsParameter([key, value], route) {
  if (!VALID_PARAM_TYPES.includes(typeof value)) {
    throw new AstroError({
      ...GetStaticPathsInvalidRouteParam,
      message: GetStaticPathsInvalidRouteParam.message(key, value, typeof value),
      location: {
        file: route
      }
    });
  }
}

function stringifyParams(params, route, trailingSlash) {
  const validatedParams = {};
  for (const [key, value] of Object.entries(params)) {
    validateGetStaticPathsParameter([key, value], route.component);
    if (value !== void 0) {
      validatedParams[key] = trimSlashes(value);
    }
  }
  return getRouteGenerator(route.segments, trailingSlash)(validatedParams);
}

function validateDynamicRouteModule(mod, {
  ssr,
  route
}) {
  if ((!ssr || route.prerender) && route.origin !== "internal" && !mod.getStaticPaths) {
    throw new AstroError({
      ...GetStaticPathsRequired,
      location: { file: route.component }
    });
  }
}
function validateGetStaticPathsResult(result, route) {
  if (!Array.isArray(result)) {
    throw new AstroError({
      ...InvalidGetStaticPathsReturn,
      message: InvalidGetStaticPathsReturn.message(typeof result),
      location: {
        file: route.component
      }
    });
  }
  result.forEach((pathObject) => {
    if (typeof pathObject === "object" && Array.isArray(pathObject) || pathObject === null) {
      throw new AstroError({
        ...InvalidGetStaticPathsEntry,
        message: InvalidGetStaticPathsEntry.message(
          Array.isArray(pathObject) ? "array" : typeof pathObject
        )
      });
    }
    if (pathObject.params === void 0 || pathObject.params === null || pathObject.params && Object.keys(pathObject.params).length === 0) {
      throw new AstroError({
        ...GetStaticPathsExpectedParams,
        location: {
          file: route.component
        }
      });
    }
  });
}

function generatePaginateFunction(routeMatch, base, trailingSlash) {
  return function paginateUtility(data, args = {}) {
    const generate = getRouteGenerator(routeMatch.segments, trailingSlash);
    let { pageSize: _pageSize, params: _params, props: _props } = args;
    const pageSize = _pageSize || 10;
    const paramName = "page";
    const additionalParams = _params || {};
    const additionalProps = _props || {};
    let includesFirstPageNumber;
    if (routeMatch.params.includes(`...${paramName}`)) {
      includesFirstPageNumber = false;
    } else if (routeMatch.params.includes(`${paramName}`)) {
      includesFirstPageNumber = true;
    } else {
      throw new AstroError({
        ...PageNumberParamNotFound,
        message: PageNumberParamNotFound.message(paramName)
      });
    }
    const lastPage = Math.max(1, Math.ceil(data.length / pageSize));
    const result = [...Array(lastPage).keys()].map((num) => {
      const pageNum = num + 1;
      const start = pageSize === Number.POSITIVE_INFINITY ? 0 : (pageNum - 1) * pageSize;
      const end = Math.min(start + pageSize, data.length);
      const params = {
        ...additionalParams,
        [paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : void 0
      };
      const current = addRouteBase(generate({ ...params }), base);
      const next = pageNum === lastPage ? void 0 : addRouteBase(generate({ ...params, page: String(pageNum + 1) }), base);
      const prev = pageNum === 1 ? void 0 : addRouteBase(
        generate({
          ...params,
          page: !includesFirstPageNumber && pageNum - 1 === 1 ? void 0 : String(pageNum - 1)
        }),
        base
      );
      const first = pageNum === 1 ? void 0 : addRouteBase(
        generate({
          ...params,
          page: includesFirstPageNumber ? "1" : void 0
        }),
        base
      );
      const last = pageNum === lastPage ? void 0 : addRouteBase(generate({ ...params, page: String(lastPage) }), base);
      return {
        params,
        props: {
          ...additionalProps,
          page: {
            data: data.slice(start, end),
            start,
            end: end - 1,
            size: pageSize,
            total: data.length,
            currentPage: pageNum,
            lastPage,
            url: { current, next, prev, first, last }
          }
        }
      };
    });
    return result;
  };
}
function addRouteBase(route, base) {
  let routeWithBase = joinPaths(base, route);
  if (routeWithBase === "") routeWithBase = "/";
  return routeWithBase;
}

async function callGetStaticPaths({
  mod,
  route,
  routeCache,
  ssr,
  base,
  trailingSlash
}) {
  const cached = routeCache.get(route);
  if (!mod) {
    throw new Error("This is an error caused by Astro and not your code. Please file an issue.");
  }
  if (cached?.staticPaths && cached.mod === mod) {
    return cached.staticPaths;
  }
  validateDynamicRouteModule(mod, { ssr, route });
  if (ssr && !route.prerender || route.origin === "internal") {
    const entry = Object.assign([], { keyed: /* @__PURE__ */ new Map() });
    routeCache.set(route, { ...cached, mod, staticPaths: entry });
    return entry;
  }
  let staticPaths = [];
  if (!mod.getStaticPaths) {
    throw new Error("Unexpected Error.");
  }
  staticPaths = await mod.getStaticPaths({
    // Q: Why the cast?
    // A: So users downstream can have nicer typings, we have to make some sacrifice in our internal typings, which necessitate a cast here
    paginate: generatePaginateFunction(route, base, trailingSlash),
    routePattern: route.route
  });
  validateGetStaticPathsResult(staticPaths, route);
  const keyedStaticPaths = staticPaths;
  keyedStaticPaths.keyed = /* @__PURE__ */ new Map();
  for (const sp of keyedStaticPaths) {
    const paramsKey = stringifyParams(sp.params, route, trailingSlash);
    keyedStaticPaths.keyed.set(paramsKey, sp);
  }
  routeCache.set(route, { ...cached, mod, staticPaths: keyedStaticPaths });
  return keyedStaticPaths;
}
class RouteCache {
  logger;
  cache = {};
  runtimeMode;
  constructor(logger, runtimeMode = "production") {
    this.logger = logger;
    this.runtimeMode = runtimeMode;
  }
  /** Clear the cache. */
  clearAll() {
    this.cache = {};
  }
  set(route, entry) {
    const key = this.key(route);
    if (this.runtimeMode === "production" && this.cache[key]?.staticPaths) {
      this.logger.warn(null, `Internal Warning: route cache overwritten. (${key})`);
    }
    this.cache[key] = entry;
  }
  get(route) {
    return this.cache[this.key(route)];
  }
  key(route) {
    return `${route.route}_${route.component}`;
  }
}
function findPathItemByKey(staticPaths, params, route, logger, trailingSlash) {
  const paramsKey = stringifyParams(params, route, trailingSlash);
  const matchedStaticPath = staticPaths.keyed.get(paramsKey);
  if (matchedStaticPath) {
    return matchedStaticPath;
  }
  logger.debug("router", `findPathItemByKey() - Unexpected cache miss looking for ${paramsKey}`);
}

function validateArgs(args) {
  if (args.length !== 3) return false;
  if (!args[0] || typeof args[0] !== "object") return false;
  return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
  const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
  const fn = (...args) => {
    if (!validateArgs(args)) {
      throw new AstroError({
        ...InvalidComponentArgs,
        message: InvalidComponentArgs.message(name)
      });
    }
    return cb(...args);
  };
  Object.defineProperty(fn, "name", { value: name, writable: false });
  fn.isAstroComponentFactory = true;
  fn.moduleId = moduleId;
  fn.propagation = propagation;
  return fn;
}
function createComponentWithOptions(opts) {
  const cb = baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
  return cb;
}
function createComponent(arg1, moduleId, propagation) {
  if (typeof arg1 === "function") {
    return baseCreateComponent(arg1, moduleId, propagation);
  } else {
    return createComponentWithOptions(arg1);
  }
}

async function renderEndpoint(mod, context, isPrerendered, logger) {
  const { request, url } = context;
  const method = request.method.toUpperCase();
  let handler = mod[method] ?? mod["ALL"];
  if (!handler && method === "HEAD" && mod["GET"]) {
    handler = mod["GET"];
  }
  if (isPrerendered && !["GET", "HEAD"].includes(method)) {
    logger.warn(
      "router",
      `${url.pathname} ${s.bold(
        method
      )} requests are not available in static endpoints. Mark this page as server-rendered (\`export const prerender = false;\`) or update your config to \`output: 'server'\` to make all your pages server-rendered by default.`
    );
  }
  if (handler === void 0) {
    logger.warn(
      "router",
      `No API Route handler exists for the method "${method}" for the route "${url.pathname}".
Found handlers: ${Object.keys(mod).map((exp) => JSON.stringify(exp)).join(", ")}
` + ("all" in mod ? `One of the exported handlers is "all" (lowercase), did you mean to export 'ALL'?
` : "")
    );
    return new Response(null, { status: 404 });
  }
  if (typeof handler !== "function") {
    logger.error(
      "router",
      `The route "${url.pathname}" exports a value for the method "${method}", but it is of the type ${typeof handler} instead of a function.`
    );
    return new Response(null, { status: 500 });
  }
  let response = await handler.call(mod, context);
  if (!response || response instanceof Response === false) {
    throw new AstroError(EndpointDidNotReturnAResponse);
  }
  if (REROUTABLE_STATUS_CODES.includes(response.status)) {
    try {
      response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
    } catch (err) {
      if (err.message?.includes("immutable")) {
        response = new Response(response.body, response);
        response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
      } else {
        throw err;
      }
    }
  }
  if (method === "HEAD") {
    return new Response(null, response);
  }
  return response;
}

function isPromise(value) {
  return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
async function* streamAsyncIterator(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

const escapeHTML = escape;
function stringifyForScript(value) {
  return JSON.stringify(value)?.replace(/</g, "\\u003c");
}
class HTMLBytes extends Uint8Array {
}
Object.defineProperty(HTMLBytes.prototype, Symbol.toStringTag, {
  get() {
    return "HTMLBytes";
  }
});
const htmlStringSymbol = /* @__PURE__ */ Symbol.for("astro:html-string");
class HTMLString extends String {
  [htmlStringSymbol] = true;
}
const markHTMLString = (value) => {
  if (isHTMLString(value)) {
    return value;
  }
  if (typeof value === "string") {
    return new HTMLString(value);
  }
  return value;
};
function isHTMLString(value) {
  return !!value?.[htmlStringSymbol];
}
function markHTMLBytes(bytes) {
  return new HTMLBytes(bytes);
}
function hasGetReader(obj) {
  return typeof obj.getReader === "function";
}
async function* unescapeChunksAsync(iterable) {
  if (hasGetReader(iterable)) {
    for await (const chunk of streamAsyncIterator(iterable)) {
      yield unescapeHTML(chunk);
    }
  } else {
    for await (const chunk of iterable) {
      yield unescapeHTML(chunk);
    }
  }
}
function* unescapeChunks(iterable) {
  for (const chunk of iterable) {
    yield unescapeHTML(chunk);
  }
}
function unescapeHTML(str) {
  if (!!str && typeof str === "object") {
    if (str instanceof Uint8Array) {
      return markHTMLBytes(str);
    } else if (str instanceof Response && str.body) {
      const body = str.body;
      return unescapeChunksAsync(body);
    } else if (typeof str.then === "function") {
      return Promise.resolve(str).then((value) => {
        return unescapeHTML(value);
      });
    } else if (str[/* @__PURE__ */ Symbol.for("astro:slot-string")]) {
      return str;
    } else if (Symbol.iterator in str) {
      return unescapeChunks(str);
    } else if (Symbol.asyncIterator in str || hasGetReader(str)) {
      return unescapeChunksAsync(str);
    }
  }
  return markHTMLString(str);
}

const AstroJSX = "astro:jsx";
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}

function resolvePropagationHint(input) {
  const explicitHint = input.factoryHint ?? "none";
  if (explicitHint !== "none") {
    return explicitHint;
  }
  if (!input.moduleId) {
    return "none";
  }
  return input.metadataLookup(input.moduleId) ?? "none";
}
function isPropagatingHint(hint) {
  return hint === "self" || hint === "in-tree";
}
function getPropagationHint$1(result, factory) {
  return resolvePropagationHint({
    factoryHint: factory.propagation,
    moduleId: factory.moduleId,
    metadataLookup: (moduleId) => result.componentMetadata.get(moduleId)?.propagation
  });
}

function isAstroComponentFactory(obj) {
  return obj == null ? false : obj.isAstroComponentFactory === true;
}
function isAPropagatingComponent(result, factory) {
  return isPropagatingHint(getPropagationHint(result, factory));
}
function getPropagationHint(result, factory) {
  return getPropagationHint$1(result, factory);
}

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

const PROP_TYPE = {
  Value: 0,
  JSON: 1,
  // Actually means Array
  RegExp: 2,
  Date: 3,
  Map: 4,
  Set: 5,
  BigInt: 6,
  URL: 7,
  Uint8Array: 8,
  Uint16Array: 9,
  Uint32Array: 10,
  Infinity: 11
};
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = value.map((v) => {
    return convertToSerializedForm(v, metadata, parents);
  });
  parents.delete(value);
  return serialized;
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      return [k, convertToSerializedForm(v, metadata, parents)];
    })
  );
  parents.delete(value);
  return serialized;
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [PROP_TYPE.Map, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object Set]": {
      return [PROP_TYPE.Set, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, serializeArray(value, metadata, parents)];
    }
    case "[object Uint8Array]": {
      return [PROP_TYPE.Uint8Array, Array.from(value)];
    }
    case "[object Uint16Array]": {
      return [PROP_TYPE.Uint16Array, Array.from(value)];
    }
    case "[object Uint32Array]": {
      return [PROP_TYPE.Uint32Array, Array.from(value)];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value, metadata, parents)];
      }
      if (value === Number.POSITIVE_INFINITY) {
        return [PROP_TYPE.Infinity, 1];
      }
      if (value === Number.NEGATIVE_INFINITY) {
        return [PROP_TYPE.Infinity, -1];
      }
      if (value === void 0) {
        return [PROP_TYPE.Value];
      }
      return [PROP_TYPE.Value, value];
    }
  }
}
function serializeProps(props, metadata) {
  const serialized = JSON.stringify(serializeObject(props, metadata));
  return serialized;
}

const transitionDirectivesToCopyOnIsland = Object.freeze([
  "data-astro-transition-scope",
  "data-astro-transition-persist",
  "data-astro-transition-persist-props"
]);
function extractDirectives(inputProps, clientDirectives) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {},
    propsWithoutTransitionAttributes: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        // This is a special prop added to prove that the client hydration method
        // was added statically.
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!clientDirectives.has(extracted.hydration.directive)) {
            const hydrationMethods = Array.from(clientDirectives.keys()).map((d) => `client:${d}`).join(", ");
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${hydrationMethods}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new AstroError(MissingMediaQueryDirective);
          }
          break;
        }
      }
    } else {
      extracted.props[key] = value;
      if (!transitionDirectivesToCopyOnIsland.includes(key)) {
        extracted.propsWithoutTransitionAttributes[key] = value;
      }
    }
  }
  for (const sym of Object.getOwnPropertySymbols(inputProps)) {
    extracted.props[sym] = inputProps[sym];
    extracted.propsWithoutTransitionAttributes[sym] = inputProps[sym];
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new AstroError({
      ...NoMatchingImport,
      message: NoMatchingImport.message(metadata.displayName)
    });
  }
  const island = {
    children: "",
    props: {
      // This is for HMR, probably can avoid it in prod
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = escapeHTML(value);
    }
  }
  island.props["component-url"] = await result.resolve(decodeURI(componentUrl));
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(
      decodeURI(renderer.clientEntrypoint.toString())
    );
    island.props["props"] = escapeHTML(serializeProps(props, metadata));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  let beforeHydrationUrl = await result.resolve("astro:scripts/before-hydration.js");
  if (beforeHydrationUrl.length) {
    island.props["before-hydration-url"] = beforeHydrationUrl;
  }
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  transitionDirectivesToCopyOnIsland.forEach((name) => {
    if (typeof props[name] !== "undefined") {
      island.props[name] = props[name];
    }
  });
  return island;
}

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary = dictionary.length;
function bitwise(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}

const headAndContentSym = /* @__PURE__ */ Symbol.for("astro.headAndContent");
function isHeadAndContent(obj) {
  return typeof obj === "object" && obj !== null && !!obj[headAndContentSym];
}
function createThinHead() {
  return {
    [headAndContentSym]: true
  };
}

var astro_island_prebuilt_default = `(()=>{var g=Object.defineProperty;var w=(c,s,d)=>s in c?g(c,s,{enumerable:!0,configurable:!0,writable:!0,value:d}):c[s]=d;var l=(c,s,d)=>w(c,typeof s!="symbol"?s+"":s,d);var E=new Set(["__proto__","constructor","prototype"]);{let c={0:t=>y(t),1:t=>d(t),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(d(t)),5:t=>new Set(d(t)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(t),9:t=>new Uint16Array(t),10:t=>new Uint32Array(t),11:t=>Number.POSITIVE_INFINITY*t},s=t=>{let[p,e]=t;return p in c?c[p](e):void 0},d=t=>t.map(s),y=t=>typeof t!="object"||t===null?t:Object.fromEntries(Object.entries(t).map(([p,e])=>[p,s(e)]));class f extends HTMLElement{constructor(){super(...arguments);l(this,"Component");l(this,"hydrator");l(this,"hydrate",async()=>{var b;if(!this.hydrator||!this.isConnected)return;let e=(b=this.parentElement)==null?void 0:b.closest("astro-island[ssr]");if(e){e.addEventListener("astro:hydrate",this.hydrate,{once:!0});return}let n=this.querySelectorAll("astro-slot"),r={},i=this.querySelectorAll("template[data-astro-template]");for(let o of i){let a=o.closest(this.tagName);a!=null&&a.isSameNode(this)&&(r[o.getAttribute("data-astro-template")||"default"]=o.innerHTML,o.remove())}for(let o of n){let a=o.closest(this.tagName);a!=null&&a.isSameNode(this)&&(r[o.getAttribute("name")||"default"]=o.innerHTML)}let u;try{u=this.hasAttribute("props")?y(JSON.parse(this.getAttribute("props"))):{}}catch(o){let a=this.getAttribute("component-url")||"<unknown>",v=this.getAttribute("component-export");throw v&&(a+=\` (export \${v})\`),console.error(\`[hydrate] Error parsing props for component \${a}\`,this.getAttribute("props"),o),o}let h;await this.hydrator(this)(this.Component,u,r,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),this.dispatchEvent(new CustomEvent("astro:hydrate"))});l(this,"unmount",()=>{this.isConnected||this.dispatchEvent(new CustomEvent("astro:unmount"))})}disconnectedCallback(){document.removeEventListener("astro:after-swap",this.unmount),document.addEventListener("astro:after-swap",this.unmount,{once:!0})}connectedCallback(){if(!this.hasAttribute("await-children")||document.readyState==="interactive"||document.readyState==="complete")this.childrenConnectedCallback();else{let e=()=>{document.removeEventListener("DOMContentLoaded",e),n.disconnect(),this.childrenConnectedCallback()},n=new MutationObserver(()=>{var r;((r=this.lastChild)==null?void 0:r.nodeType)===Node.COMMENT_NODE&&this.lastChild.nodeValue==="astro:end"&&(this.lastChild.remove(),e())});n.observe(this,{childList:!0}),document.addEventListener("DOMContentLoaded",e)}}async childrenConnectedCallback(){let e=this.getAttribute("before-hydration-url");e&&await import(e),this.start()}getRetryImportUrl(e){let n=new URL(e,document.baseURI),r=\`astro-retry=\${Date.now()}\`,i=n.hash.replace(/^#/,"");return n.hash=i?\`\${i}&\${r}\`:r,n.toString()}async importWithRetry(e){try{return await import(e)}catch(n){return await new Promise(r=>setTimeout(r,1e3)),import(this.getRetryImportUrl(e))}}handleHydrationError(e){let n=this.getAttribute("component-url"),r=new CustomEvent("astro:hydration-error",{cancelable:!0,bubbles:!0,composed:!0,detail:{error:e,componentUrl:n}});this.dispatchEvent(r)&&console.error(\`[astro-island] Error hydrating \${n}\`,e)}async start(){let e=JSON.parse(this.getAttribute("opts")),n=this.getAttribute("client");if(Astro[n]===void 0){window.addEventListener(\`astro:\${n}\`,()=>this.start(),{once:!0});return}try{await Astro[n](async()=>{let r=this.getAttribute("renderer-url");try{let[i,{default:u}]=await Promise.all([this.importWithRetry(this.getAttribute("component-url")),r?this.importWithRetry(r):Promise.resolve({default:()=>()=>{}})]),h=this.getAttribute("component-export")||"default";if(h.includes(".")){this.Component=i;for(let m of h.split(".")){if(E.has(m)||!this.Component||typeof this.Component!="object"&&typeof this.Component!="function"||!Object.hasOwn(this.Component,m))throw new Error(\`Invalid component export path: \${h}\`);this.Component=this.Component[m]}}else{if(E.has(h))throw new Error(\`Invalid component export path: \${h}\`);this.Component=i[h]}return this.hydrator=u,this.hydrate}catch(i){return this.handleHydrationError(i),()=>{}}},e,this)}catch(r){this.handleHydrationError(r)}}attributeChangedCallback(){this.hydrate()}}l(f,"observedAttributes",["props"]),customElements.get("astro-island")||customElements.define("astro-island",f)}})();`;

const ISLAND_STYLES = "astro-island,astro-slot,astro-static-slot{display:contents}";

function determineIfNeedsHydrationScript(result) {
  if (result._metadata.templateDepth > 0) {
    return !result._metadata.hasHydrationScript;
  }
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.templateDepth > 0) {
    return !result._metadata.hasDirectives.has(directive);
  }
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(result, directive) {
  const clientDirectives = result.clientDirectives;
  const clientDirective = clientDirectives.get(directive);
  if (!clientDirective) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  return clientDirective;
}
function getPrescripts(result, type, directive) {
  switch (type) {
    case "both":
      return `<style>${ISLAND_STYLES}</style><script>${getDirectiveScriptText(result, directive)}</script><script>${astro_island_prebuilt_default}</script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(result, directive)}</script>`;
  }
}

async function collectPropagatedHeadParts(input) {
  const collectedHeadParts = [];
  const iterator = input.propagators.values();
  while (true) {
    const { value, done } = iterator.next();
    if (done) {
      break;
    }
    const returnValue = await value.init(input.result);
    if (input.isHeadAndContent(returnValue) && returnValue.head) {
      collectedHeadParts.push(returnValue.head);
    }
  }
  return collectedHeadParts;
}

function shouldRenderHeadInstruction(state) {
  return !state.hasRenderedHead && !state.partial;
}
function shouldRenderMaybeHeadInstruction(state) {
  return !state.hasRenderedHead && !state.headInTree && !state.partial;
}
function shouldRenderInstruction$1(type, state) {
  return type === "head" ? shouldRenderHeadInstruction(state) : shouldRenderMaybeHeadInstruction(state);
}

function registerIfPropagating(result, factory, instance) {
  if (factory.propagation === "self" || factory.propagation === "in-tree") {
    result._metadata.propagators.add(
      instance
    );
    return;
  }
  if (factory.moduleId) {
    const hint = result.componentMetadata.get(factory.moduleId)?.propagation;
    if (isPropagatingHint(hint ?? "none")) {
      result._metadata.propagators.add(
        instance
      );
    }
  }
}
async function bufferPropagatedHead(result) {
  const collected = await collectPropagatedHeadParts({
    propagators: result._metadata.propagators,
    result,
    isHeadAndContent
  });
  result._metadata.extraHead.push(...collected);
}
function shouldRenderInstruction(type, state) {
  return shouldRenderInstruction$1(type, state);
}
function getInstructionRenderState(result) {
  return {
    hasRenderedHead: result._metadata.hasRenderedHead,
    headInTree: result._metadata.headInTree,
    partial: result.partial
  };
}

function renderCspContent(result) {
  const finalScriptHashes = /* @__PURE__ */ new Set();
  const finalStyleHashes = /* @__PURE__ */ new Set();
  for (const scriptHash of result.scriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  for (const styleHash of result.styleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const styleHash of result._metadata.extraStyleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const scriptHash of result._metadata.extraScriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  let directives;
  if (result.directives.length > 0) {
    directives = result.directives.join(";") + ";";
  }
  let scriptResources = "'self'";
  if (result.scriptResources.length > 0) {
    scriptResources = result.scriptResources.map((r) => `${r}`).join(" ");
  }
  let styleResources = "'self'";
  if (result.styleResources.length > 0) {
    styleResources = result.styleResources.map((r) => `${r}`).join(" ");
  }
  const strictDynamic = result.isStrictDynamic ? ` 'strict-dynamic'` : "";
  const scriptSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(" ")}${strictDynamic};`;
  const styleSrc = `style-src ${styleResources} ${Array.from(finalStyleHashes).join(" ")};`;
  return [directives, scriptSrc, styleSrc].filter(Boolean).join(" ");
}

const RenderInstructionSymbol = /* @__PURE__ */ Symbol.for("astro:render");
function createRenderInstruction(instruction) {
  return Object.defineProperty(instruction, RenderInstructionSymbol, {
    value: true
  });
}
function isRenderInstruction(chunk) {
  return chunk && typeof chunk === "object" && chunk[RenderInstructionSymbol];
}

const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes = /^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|inert|loop|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected|itemscope)$/i;
const AMPERSAND_REGEX = /&/g;
const DOUBLE_QUOTE_REGEX = /"/g;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
const INVALID_ATTR_NAME_CHAR = /[\s"'>/=]/;
const toIdent = (k) => k.trim().replace(/(?!^)\b\w|\s+|\W+/g, (match, index) => {
  if (/\W/.test(match)) return "";
  return index === 0 ? match : match.toUpperCase();
});
const toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(AMPERSAND_REGEX, "&amp;").replace(DOUBLE_QUOTE_REGEX, "&quot;") : value;
const kebab = (k) => k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj) => Object.entries(obj).filter(([_, v]) => typeof v === "string" && v.trim() || typeof v === "number").map(([k, v]) => {
  if (k[0] !== "-" && k[1] !== "-") return `${kebab(k)}:${v}`;
  return `${k}:${v}`;
}).join(";");
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `const ${toIdent(key)} = ${stringifyForScript(value)};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function isCustomElement(tagName) {
  return tagName.includes("-");
}
function handleBooleanAttribute(key, value, shouldEscape, tagName) {
  if (tagName && isCustomElement(tagName)) {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
  return markHTMLString(value ? ` ${key}` : "");
}
function addAttribute(value, key, shouldEscape = true, tagName = "") {
  if (value == null) {
    return "";
  }
  if (INVALID_ATTR_NAME_CHAR.test(key)) {
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(clsx(value), shouldEscape);
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString)) {
    if (Array.isArray(value) && value.length === 2) {
      return markHTMLString(
        ` ${key}="${toAttributeString(`${toStyleString(value[0])};${value[1]}`, shouldEscape)}"`
      );
    }
    if (typeof value === "object") {
      return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
    }
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (htmlBooleanAttributes.test(key)) {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (value === "") {
    return markHTMLString(` ${key}`);
  }
  if (key === "popover" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (key === "download" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (key === "hidden" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
}
function internalSpreadAttributes(values, shouldEscape = true, tagName) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape, tagName);
  }
  return markHTMLString(output);
}
function renderElement$1(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children === "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>${children}</${name}>`;
}
const noop = () => {
};
class BufferedRenderer {
  chunks = [];
  renderPromise;
  destination;
  /**
   * Determines whether buffer has been flushed
   * to the final destination.
   */
  flushed = false;
  constructor(destination, renderFunction) {
    this.destination = destination;
    this.renderPromise = renderFunction(this);
    if (isPromise(this.renderPromise)) {
      Promise.resolve(this.renderPromise).catch(noop);
    }
  }
  write(chunk) {
    if (this.flushed) {
      this.destination.write(chunk);
    } else {
      this.chunks.push(chunk);
    }
  }
  flush() {
    if (this.flushed) {
      throw new Error("The render buffer has already been flushed.");
    }
    this.flushed = true;
    for (const chunk of this.chunks) {
      this.destination.write(chunk);
    }
    return this.renderPromise;
  }
}
function createBufferedRenderer(destination, renderFunction) {
  return new BufferedRenderer(destination, renderFunction);
}
const isNode = typeof process !== "undefined" && Object.prototype.toString.call(process) === "[object process]";
const isDeno = typeof Deno !== "undefined";
function promiseWithResolvers() {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
}

function stablePropsKey(props) {
  const keys = Object.keys(props).sort();
  let result = "{";
  for (let i = 0; i < keys.length; i++) {
    if (i > 0) result += ",";
    result += JSON.stringify(keys[i]) + ":" + JSON.stringify(props[keys[i]]);
  }
  result += "}";
  return result;
}
function deduplicateElements(elements) {
  if (elements.length <= 1) return elements;
  const seen = /* @__PURE__ */ new Set();
  return elements.filter((item) => {
    const key = stablePropsKey(item.props) + item.children;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function renderAllHeadContent(result) {
  result._metadata.hasRenderedHead = true;
  let content = "";
  if (result.shouldInjectCspMetaTags && result.cspDestination === "meta") {
    content += renderElement$1(
      "meta",
      {
        props: {
          "http-equiv": "content-security-policy",
          content: renderCspContent(result)
        },
        children: ""
      },
      false
    );
  }
  const styles = deduplicateElements(Array.from(result.styles)).map(
    (style) => style.props.rel === "stylesheet" ? renderElement$1("link", style) : renderElement$1("style", style)
  );
  result.styles.clear();
  const scripts = deduplicateElements(Array.from(result.scripts)).map((script) => {
    if (result.userAssetsBase) {
      script.props.src = (result.base === "/" ? "" : result.base) + result.userAssetsBase + script.props.src;
    }
    return renderElement$1("script", script, false);
  });
  const links = deduplicateElements(Array.from(result.links)).map(
    (link) => renderElement$1("link", link, false)
  );
  const sep = result.compressHTML === true || result.compressHTML === "jsx" ? "" : "\n";
  content += styles.join(sep) + links.join(sep) + scripts.join(sep);
  content += result._metadata.extraHead.join("");
  return markHTMLString(content);
}
function maybeRenderHead() {
  return createRenderInstruction({ type: "maybe-head" });
}

function encodeHexUpperCase(data) {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result += alphabetUpperCase[data[i] >> 4];
        result += alphabetUpperCase[data[i] & 0x0f];
    }
    return result;
}
function decodeHex(data) {
    if (data.length % 2 !== 0) {
        throw new Error("Invalid hex string");
    }
    const result = new Uint8Array(data.length / 2);
    for (let i = 0; i < data.length; i += 2) {
        if (!(data[i] in decodeMap)) {
            throw new Error("Invalid character");
        }
        if (!(data[i + 1] in decodeMap)) {
            throw new Error("Invalid character");
        }
        result[i / 2] |= decodeMap[data[i]] << 4;
        result[i / 2] |= decodeMap[data[i + 1]];
    }
    return result;
}
const alphabetUpperCase = "0123456789ABCDEF";
const decodeMap = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
};

var EncodingPadding$1;
(function (EncodingPadding) {
    EncodingPadding[EncodingPadding["Include"] = 0] = "Include";
    EncodingPadding[EncodingPadding["None"] = 1] = "None";
})(EncodingPadding$1 || (EncodingPadding$1 = {}));
var DecodingPadding$1;
(function (DecodingPadding) {
    DecodingPadding[DecodingPadding["Required"] = 0] = "Required";
    DecodingPadding[DecodingPadding["Ignore"] = 1] = "Ignore";
})(DecodingPadding$1 || (DecodingPadding$1 = {}));

function encodeBase64(bytes) {
    return encodeBase64_internal(bytes, base64Alphabet, EncodingPadding.Include);
}
function encodeBase64_internal(bytes, alphabet, padding) {
    let result = "";
    for (let i = 0; i < bytes.byteLength; i += 3) {
        let buffer = 0;
        let bufferBitSize = 0;
        for (let j = 0; j < 3 && i + j < bytes.byteLength; j++) {
            buffer = (buffer << 8) | bytes[i + j];
            bufferBitSize += 8;
        }
        for (let j = 0; j < 4; j++) {
            if (bufferBitSize >= 6) {
                result += alphabet[(buffer >> (bufferBitSize - 6)) & 0x3f];
                bufferBitSize -= 6;
            }
            else if (bufferBitSize > 0) {
                result += alphabet[(buffer << (6 - bufferBitSize)) & 0x3f];
                bufferBitSize = 0;
            }
            else if (padding === EncodingPadding.Include) {
                result += "=";
            }
        }
    }
    return result;
}
const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function decodeBase64(encoded) {
    return decodeBase64_internal(encoded, base64DecodeMap, DecodingPadding.Required);
}
function decodeBase64_internal(encoded, decodeMap, padding) {
    const result = new Uint8Array(Math.ceil(encoded.length / 4) * 3);
    let totalBytes = 0;
    for (let i = 0; i < encoded.length; i += 4) {
        let chunk = 0;
        let bitsRead = 0;
        for (let j = 0; j < 4; j++) {
            if (padding === DecodingPadding.Required && encoded[i + j] === "=") {
                continue;
            }
            if (padding === DecodingPadding.Ignore &&
                (i + j >= encoded.length || encoded[i + j] === "=")) {
                continue;
            }
            if (j > 0 && encoded[i + j - 1] === "=") {
                throw new Error("Invalid padding");
            }
            if (!(encoded[i + j] in decodeMap)) {
                throw new Error("Invalid character");
            }
            chunk |= decodeMap[encoded[i + j]] << ((3 - j) * 6);
            bitsRead += 6;
        }
        if (bitsRead < 24) {
            let unused;
            if (bitsRead === 12) {
                unused = chunk & 0xffff;
            }
            else if (bitsRead === 18) {
                unused = chunk & 0xff;
            }
            else {
                throw new Error("Invalid padding");
            }
            if (unused !== 0) {
                throw new Error("Invalid padding");
            }
        }
        const byteLength = Math.floor(bitsRead / 8);
        for (let i = 0; i < byteLength; i++) {
            result[totalBytes] = (chunk >> (16 - i * 8)) & 0xff;
            totalBytes++;
        }
    }
    return result.slice(0, totalBytes);
}
var EncodingPadding;
(function (EncodingPadding) {
    EncodingPadding[EncodingPadding["Include"] = 0] = "Include";
    EncodingPadding[EncodingPadding["None"] = 1] = "None";
})(EncodingPadding || (EncodingPadding = {}));
var DecodingPadding;
(function (DecodingPadding) {
    DecodingPadding[DecodingPadding["Required"] = 0] = "Required";
    DecodingPadding[DecodingPadding["Ignore"] = 1] = "Ignore";
})(DecodingPadding || (DecodingPadding = {}));
const base64DecodeMap = {
    "0": 52,
    "1": 53,
    "2": 54,
    "3": 55,
    "4": 56,
    "5": 57,
    "6": 58,
    "7": 59,
    "8": 60,
    "9": 61,
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 14,
    P: 15,
    Q: 16,
    R: 17,
    S: 18,
    T: 19,
    U: 20,
    V: 21,
    W: 22,
    X: 23,
    Y: 24,
    Z: 25,
    a: 26,
    b: 27,
    c: 28,
    d: 29,
    e: 30,
    f: 31,
    g: 32,
    h: 33,
    i: 34,
    j: 35,
    k: 36,
    l: 37,
    m: 38,
    n: 39,
    o: 40,
    p: 41,
    q: 42,
    r: 43,
    s: 44,
    t: 45,
    u: 46,
    v: 47,
    w: 48,
    x: 49,
    y: 50,
    z: 51,
    "+": 62,
    "/": 63
};

const initializer = (inst, issues) => {
    $ZodError.init(inst, issues);
    inst.name = "ZodError";
    Object.defineProperties(inst, {
        format: {
            value: (mapper) => formatError(inst, mapper),
            // enumerable: false,
        },
        flatten: {
            value: (mapper) => flattenError(inst, mapper),
            // enumerable: false,
        },
        addIssue: {
            value: (issue) => {
                inst.issues.push(issue);
                inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
            },
            // enumerable: false,
        },
        addIssues: {
            value: (issues) => {
                inst.issues.push(...issues);
                inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
            },
            // enumerable: false,
        },
        isEmpty: {
            get() {
                return inst.issues.length === 0;
            },
            // enumerable: false,
        },
    });
    // Object.defineProperty(inst, "isEmpty", {
    //   get() {
    //     return inst.issues.length === 0;
    //   },
    // });
};
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, {
    Parent: Error,
});
// /** @deprecated Use `z.core.$ZodErrorMapCtx` instead. */
// export type ErrorMapCtx = core.$ZodErrorMapCtx;

const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
// Codec functions
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// Lazy-bind builder methods.
//
// Builder methods (`.optional`, `.array`, `.refine`, ...) live as
// non-enumerable getters on each concrete schema constructor's
// prototype. On first access from an instance the getter allocates
// `fn.bind(this)` and caches it as an own property on that instance,
// so detached usage (`const m = schema.optional; m()`) still works
// and the per-instance allocation only happens for methods actually
// touched.
//
// One install per (prototype, group), memoized by `_installedGroups`.
const _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
    const proto = Object.getPrototypeOf(inst);
    let installed = _installedGroups.get(proto);
    if (!installed) {
        installed = new Set();
        _installedGroups.set(proto, installed);
    }
    if (installed.has(group))
        return;
    installed.add(group);
    for (const key in methods) {
        const fn = methods[key];
        Object.defineProperty(proto, key, {
            configurable: true,
            enumerable: false,
            get() {
                const bound = fn.bind(this);
                Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    enumerable: true,
                    value: bound,
                });
                return bound;
            },
            set(v) {
                Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    enumerable: true,
                    value: v,
                });
            },
        });
    }
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
    $ZodType.init(inst, def);
    Object.assign(inst["~standard"], {
        jsonSchema: {
            input: createStandardJSONSchemaMethod(inst, "input"),
            output: createStandardJSONSchemaMethod(inst, "output"),
        },
    });
    inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
    inst.def = def;
    inst.type = def.type;
    Object.defineProperty(inst, "_def", { value: def });
    // Parse-family is intentionally kept as per-instance closures: these are
    // the hot path AND the most-detached methods (`arr.map(schema.parse)`,
    // `const { parse } = schema`, etc.). Eager closures here mean callers pay
    // ~12 closure allocations per schema but get monomorphic call sites and
    // detached usage that "just works".
    inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
    inst.safeParse = (data, params) => safeParse(inst, data, params);
    inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
    inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
    inst.spa = inst.safeParseAsync;
    inst.encode = (data, params) => encode(inst, data, params);
    inst.decode = (data, params) => decode(inst, data, params);
    inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
    inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
    inst.safeEncode = (data, params) => safeEncode(inst, data, params);
    inst.safeDecode = (data, params) => safeDecode(inst, data, params);
    inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
    inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
    // All builder methods are placed on the internal prototype as lazy-bind
    // getters. On first access per-instance, a bound thunk is allocated and
    // cached as an own property; subsequent accesses skip the getter. This
    // means: no per-instance allocation for unused methods, full
    // detachability preserved (`const m = schema.optional; m()` works), and
    // shared underlying function references across all instances.
    _installLazyMethods(inst, "ZodType", {
        check(...chks) {
            const def = this.def;
            return this.clone(mergeDefs(def, {
                checks: [
                    ...(def.checks ?? []),
                    ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch),
                ],
            }), { parent: true });
        },
        with(...chks) {
            return this.check(...chks);
        },
        clone(def, params) {
            return clone(this, def, params);
        },
        brand() {
            return this;
        },
        register(reg, meta) {
            reg.add(this, meta);
            return this;
        },
        refine(check, params) {
            return this.check(refine(check, params));
        },
        superRefine(refinement, params) {
            return this.check(superRefine(refinement, params));
        },
        overwrite(fn) {
            return this.check(_overwrite(fn));
        },
        optional() {
            return optional(this);
        },
        exactOptional() {
            return exactOptional(this);
        },
        nullable() {
            return nullable(this);
        },
        nullish() {
            return optional(nullable(this));
        },
        nonoptional(params) {
            return nonoptional(this, params);
        },
        array() {
            return array(this);
        },
        or(arg) {
            return union([this, arg]);
        },
        and(arg) {
            return intersection(this, arg);
        },
        transform(tx) {
            return pipe(this, transform(tx));
        },
        default(d) {
            return _default$1(this, d);
        },
        prefault(d) {
            return prefault(this, d);
        },
        catch(params) {
            return _catch(this, params);
        },
        pipe(target) {
            return pipe(this, target);
        },
        readonly() {
            return readonly(this);
        },
        describe(description) {
            const cl = this.clone();
            globalRegistry.add(cl, { description });
            return cl;
        },
        meta(...args) {
            // overloaded: meta() returns the registered metadata, meta(data)
            // returns a clone with `data` registered. The mapped type picks
            // up the second overload, so we accept variadic any-args and
            // return `any` to satisfy both at runtime.
            if (args.length === 0)
                return globalRegistry.get(this);
            const cl = this.clone();
            globalRegistry.add(cl, args[0]);
            return cl;
        },
        isOptional() {
            return this.safeParse(undefined).success;
        },
        isNullable() {
            return this.safeParse(null).success;
        },
        apply(fn) {
            return fn(this);
        },
    });
    Object.defineProperty(inst, "description", {
        get() {
            return globalRegistry.get(inst)?.description;
        },
        configurable: true,
    });
    return inst;
});
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
    $ZodArray.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
    inst.element = def.element;
    _installLazyMethods(inst, "ZodArray", {
        min(n, params) {
            return this.check(_minLength(n, params));
        },
        nonempty(params) {
            return this.check(_minLength(1, params));
        },
        max(n, params) {
            return this.check(_maxLength(n, params));
        },
        length(n, params) {
            return this.check(_length(n, params));
        },
        unwrap() {
            return this.element;
        },
    });
});
function array(element, params) {
    return _array(ZodArray, element, params);
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
    $ZodUnion.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
    inst.options = def.options;
});
function union(options, params) {
    return new ZodUnion({
        type: "union",
        options: options,
        ...normalizeParams(params),
    });
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
    $ZodIntersection.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
    return new ZodIntersection({
        type: "intersection",
        left: left,
        right: right,
    });
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
    $ZodEnum.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json);
    inst.enum = def.entries;
    inst.options = Object.values(def.entries);
    const keys = new Set(Object.keys(def.entries));
    inst.extract = (values, params) => {
        const newEntries = {};
        for (const value of values) {
            if (keys.has(value)) {
                newEntries[value] = def.entries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries,
        });
    };
    inst.exclude = (values, params) => {
        const newEntries = { ...def.entries };
        for (const value of values) {
            if (keys.has(value)) {
                delete newEntries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries,
        });
    };
});
function _enum(values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
    return new ZodEnum({
        type: "enum",
        entries,
        ...normalizeParams(params),
    });
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
    $ZodTransform.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx);
    inst._zod.parse = (payload, _ctx) => {
        if (_ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
        }
        payload.addIssue = (issue$1) => {
            if (typeof issue$1 === "string") {
                payload.issues.push(issue(issue$1, payload.value, def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue$1;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                _issue.input ?? (_issue.input = payload.value);
                _issue.inst ?? (_issue.inst = inst);
                // _issue.continue ??= true;
                payload.issues.push(issue(_issue));
            }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) {
            return output.then((output) => {
                payload.value = output;
                payload.fallback = true;
                return payload;
            });
        }
        payload.value = output;
        payload.fallback = true;
        return payload;
    };
});
function transform(fn) {
    return new ZodTransform({
        type: "transform",
        transform: fn,
    });
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
    $ZodOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
    return new ZodOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
    $ZodExactOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
    return new ZodExactOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
    $ZodNullable.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
    return new ZodNullable({
        type: "nullable",
        innerType: innerType,
    });
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
    $ZodDefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeDefault = inst.unwrap;
});
function _default$1(innerType, defaultValue) {
    return new ZodDefault({
        type: "default",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
        },
    });
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
    $ZodPrefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
    return new ZodPrefault({
        type: "prefault",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
        },
    });
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
    $ZodNonOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
    return new ZodNonOptional({
        type: "nonoptional",
        innerType: innerType,
        ...normalizeParams(params),
    });
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
    $ZodCatch.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
    return new ZodCatch({
        type: "catch",
        innerType: innerType,
        catchValue: (typeof catchValue === "function" ? catchValue : () => catchValue),
    });
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
    $ZodPipe.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
    inst.in = def.in;
    inst.out = def.out;
});
function pipe(in_, out) {
    return new ZodPipe({
        type: "pipe",
        in: in_,
        out: out,
        // ...util.normalizeParams(params),
    });
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
    $ZodReadonly.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
    return new ZodReadonly({
        type: "readonly",
        innerType: innerType,
    });
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
    $ZodCustom.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx);
});
function custom(fn, _params) {
    return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
    return _refine(ZodCustom, fn, _params);
}
// superRefine
function superRefine(fn, params) {
    return _superRefine(fn, params);
}

// Zod 3 compat layer
/** @deprecated Use the raw string literal codes instead, e.g. "invalid_type". */
const ZodIssueCode = {
    custom: "custom",
};

const ALGORITHMS = {
  "SHA-256": "sha256-",
  "SHA-384": "sha384-",
  "SHA-512": "sha512-"
};
_enum(Object.keys(ALGORITHMS)).optional().default("SHA-256");
const ALLOWED_DIRECTIVES = [
  "base-uri",
  "child-src",
  "connect-src",
  "default-src",
  "fenced-frame-src",
  "font-src",
  "form-action",
  "frame-ancestors",
  "frame-src",
  "img-src",
  "manifest-src",
  "media-src",
  "object-src",
  "referrer",
  "report-to",
  "report-uri",
  "require-trusted-types-for",
  "sandbox",
  "trusted-types",
  "upgrade-insecure-requests",
  "worker-src"
];
custom((v) => typeof v === "string").superRefine((value, ctx) => {
  const isAllowed = ALLOWED_DIRECTIVES.some((allowedValue) => {
    return value.startsWith(allowedValue);
  });
  if (!isAllowed) {
    if (value.startsWith("script-src") || value.startsWith("style-src")) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: `Directives \`script-src\` and \`style-src\` are not allowed in \`security.csp.directives\`. Please use \`security.csp.scriptDirective\` and \`security.csp.styleDirective\` instead.`,
        fatal: true
      });
    } else {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: `Invalid directive: "${value}". Allowed directives are: ${ALLOWED_DIRECTIVES.join(", ")}`,
        fatal: true
      });
    }
  }
});

const ALGORITHM = "AES-GCM";
async function decodeKey(encoded) {
  const bytes = decodeBase64(encoded);
  return crypto.subtle.importKey("raw", bytes.buffer, ALGORITHM, true, [
    "encrypt",
    "decrypt"
  ]);
}
const encoder$1 = new TextEncoder();
const decoder$2 = new TextDecoder();
const IV_LENGTH = 24;
async function encryptString(key, raw, additionalData) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
  const data = encoder$1.encode(raw);
  const params = { name: ALGORITHM, iv };
  if (additionalData) {
    params.additionalData = encoder$1.encode(additionalData);
  }
  const buffer = await crypto.subtle.encrypt(params, key, data);
  return encodeHexUpperCase(iv) + encodeBase64(new Uint8Array(buffer));
}
async function decryptString(key, encoded, additionalData) {
  const iv = decodeHex(encoded.slice(0, IV_LENGTH));
  const dataArray = decodeBase64(encoded.slice(IV_LENGTH));
  const params = { name: ALGORITHM, iv };
  if (additionalData) {
    params.additionalData = encoder$1.encode(additionalData);
  }
  const decryptedBuffer = await crypto.subtle.decrypt(params, key, dataArray);
  const decryptedString = decoder$2.decode(decryptedBuffer);
  return decryptedString;
}
async function generateCspDigest(data, algorithm) {
  const hashBuffer = await crypto.subtle.digest(algorithm, encoder$1.encode(data));
  const hash = encodeBase64(new Uint8Array(hashBuffer));
  return `${ALGORITHMS[algorithm]}${hash}`;
}

const renderTemplateResultSym = /* @__PURE__ */ Symbol.for("astro.renderTemplateResult");
class RenderTemplateResult {
  [renderTemplateResultSym] = true;
  htmlParts;
  expressions;
  error;
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.error = void 0;
    this.expressions = expressions.map((expression) => {
      if (isPromise(expression)) {
        return Promise.resolve(expression).catch((err) => {
          if (!this.error) {
            this.error = err;
            throw err;
          }
        });
      }
      return expression;
    });
  }
  render(destination) {
    const { htmlParts, expressions } = this;
    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      if (html) {
        destination.write(markHTMLString(html));
      }
      if (i >= expressions.length) break;
      const exp = expressions[i];
      if (!(exp || exp === 0)) continue;
      const result = renderChild(destination, exp);
      if (isPromise(result)) {
        const startIdx = i + 1;
        const remaining = expressions.length - startIdx;
        const flushers = new Array(remaining);
        for (let j = 0; j < remaining; j++) {
          const rExp = expressions[startIdx + j];
          flushers[j] = createBufferedRenderer(destination, (bufferDestination) => {
            if (rExp || rExp === 0) {
              return renderChild(bufferDestination, rExp);
            }
          });
        }
        return result.then(() => {
          let k = 0;
          const iterate = () => {
            while (k < flushers.length) {
              const rHtml = htmlParts[startIdx + k];
              if (rHtml) {
                destination.write(markHTMLString(rHtml));
              }
              const flushResult = flushers[k++].flush();
              if (isPromise(flushResult)) {
                return flushResult.then(iterate);
              }
            }
            const lastHtml = htmlParts[htmlParts.length - 1];
            if (lastHtml) {
              destination.write(markHTMLString(lastHtml));
            }
          };
          return iterate();
        });
      }
    }
  }
}
function isRenderTemplateResult(obj) {
  return typeof obj === "object" && obj !== null && !!obj[renderTemplateResultSym];
}
function renderTemplate(htmlParts, ...expressions) {
  return new RenderTemplateResult(htmlParts, expressions);
}

const slotString = /* @__PURE__ */ Symbol.for("astro:slot-string");
class SlotString extends HTMLString {
  instructions;
  [slotString];
  constructor(content, instructions) {
    super(content);
    this.instructions = instructions;
    this[slotString] = true;
  }
}
function isSlotString(str) {
  return !!str[slotString];
}
function mergeSlotInstructions(target, source) {
  if (source.instructions?.length) {
    target ??= [];
    target.push(...source.instructions);
  }
  return target;
}
function renderSlot(result, slotted, fallback) {
  return {
    async render(destination) {
      await renderChild(destination, typeof slotted === "function" ? slotted(result) : slotted);
    }
  };
}
async function renderSlotToString(result, slotted, fallback) {
  let content = "";
  let instructions = null;
  const temporaryDestination = {
    write(chunk) {
      if (chunk instanceof SlotString) {
        content += chunk;
        instructions = mergeSlotInstructions(instructions, chunk);
      } else if (chunk instanceof Response) return;
      else if (typeof chunk === "object" && "type" in chunk && typeof chunk.type === "string") {
        if (instructions === null) {
          instructions = [];
        }
        instructions.push(chunk);
      } else {
        content += chunkToString(result, chunk);
      }
    }
  };
  const renderInstance = renderSlot(result, slotted);
  await renderInstance.render(temporaryDestination);
  return markHTMLString(new SlotString(content, instructions));
}
async function renderSlots(result, slots = {}) {
  let slotInstructions = null;
  let children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlotToString(result, value).then((output) => {
          if (output.instructions) {
            if (slotInstructions === null) {
              slotInstructions = [];
            }
            slotInstructions.push(...output.instructions);
          }
          children[key] = output;
        })
      )
    );
  }
  return { slotInstructions, children };
}
function createSlotValueFromString(content) {
  return function() {
    return renderTemplate`${unescapeHTML(content)}`;
  };
}

const internalProps = /* @__PURE__ */ new Set([
  "server:component-path",
  "server:component-export",
  "server:component-directive",
  "server:defer"
]);
function containsServerDirective(props) {
  return "server:component-directive" in props;
}
function createSearchParams(encryptedComponentExport, encryptedProps, slots) {
  const params = new URLSearchParams();
  params.set("e", encryptedComponentExport);
  params.set("p", encryptedProps);
  params.set("s", slots);
  return params;
}
function isWithinURLLimit(pathname, params) {
  const url = pathname + "?" + params.toString();
  const chars = url.length;
  return chars < 2048;
}
class ServerIslandComponent {
  result;
  props;
  slots;
  displayName;
  hostId;
  islandContent;
  componentPath;
  componentExport;
  componentId;
  constructor(result, props, slots, displayName) {
    this.result = result;
    this.props = props;
    this.slots = slots;
    this.displayName = displayName;
  }
  async init() {
    const content = await this.getIslandContent();
    if (this.result.cspDestination) {
      this.result._metadata.extraScriptHashes.push(
        await generateCspDigest(SERVER_ISLAND_REPLACER, this.result.cspAlgorithm)
      );
      const contentDigest = await generateCspDigest(content, this.result.cspAlgorithm);
      this.result._metadata.extraScriptHashes.push(contentDigest);
    }
    return createThinHead();
  }
  async render(destination) {
    const hostId = await this.getHostId();
    const islandContent = await this.getIslandContent();
    destination.write(createRenderInstruction({ type: "server-island-runtime" }));
    destination.write("<!--[if astro]>server-island-start<![endif]-->");
    for (const name in this.slots) {
      if (name === "fallback") {
        await renderChild(destination, this.slots.fallback(this.result));
      }
    }
    destination.write(
      `<script type="module" data-astro-rerun data-island-id="${hostId}">${islandContent}</script>`
    );
  }
  getComponentPath() {
    if (this.componentPath) {
      return this.componentPath;
    }
    const componentPath = this.props["server:component-path"];
    if (!componentPath) {
      throw new Error(`Could not find server component path`);
    }
    this.componentPath = componentPath;
    return componentPath;
  }
  getComponentExport() {
    if (this.componentExport) {
      return this.componentExport;
    }
    const componentExport = this.props["server:component-export"];
    if (!componentExport) {
      throw new Error(`Could not find server component export`);
    }
    this.componentExport = componentExport;
    return componentExport;
  }
  async getHostId() {
    if (!this.hostId) {
      this.hostId = await crypto.randomUUID();
    }
    return this.hostId;
  }
  async getIslandContent() {
    if (this.islandContent) {
      return this.islandContent;
    }
    const componentPath = this.getComponentPath();
    const componentExport = this.getComponentExport();
    const serverIslandNameMap = await this.result.getServerIslandNameMap();
    let componentId = serverIslandNameMap.get(componentPath);
    if (!componentId) {
      throw new Error(`Could not find server component name ${componentPath}`);
    }
    for (const key2 of Object.keys(this.props)) {
      if (internalProps.has(key2)) {
        delete this.props[key2];
      }
    }
    const renderedSlots = {};
    for (const name in this.slots) {
      if (name !== "fallback") {
        const content = await renderSlotToString(this.result, this.slots[name]);
        let slotHtml = content.toString();
        const slotContent = content;
        if (Array.isArray(slotContent.instructions)) {
          for (const instruction of slotContent.instructions) {
            if (instruction.type === "script") {
              slotHtml += instruction.content;
            }
          }
        }
        renderedSlots[name] = slotHtml;
      }
    }
    const key = await this.result.key;
    const componentExportEncrypted = await encryptString(
      key,
      componentExport,
      `export:${componentId}`
    );
    const propsEncrypted = Object.keys(this.props).length === 0 ? "" : await encryptString(key, JSON.stringify(this.props), `props:${componentId}`);
    const slotsEncrypted = Object.keys(renderedSlots).length === 0 ? "" : await encryptString(key, JSON.stringify(renderedSlots), `slots:${componentId}`);
    const hostId = await this.getHostId();
    const slash = this.result.base.endsWith("/") ? "" : "/";
    let serverIslandUrl = `${this.result.base}${slash}_server-islands/${componentId}${this.result.trailingSlash === "always" ? "/" : ""}`;
    const potentialSearchParams = createSearchParams(
      componentExportEncrypted,
      propsEncrypted,
      slotsEncrypted
    );
    const useGETRequest = isWithinURLLimit(serverIslandUrl, potentialSearchParams);
    if (useGETRequest) {
      serverIslandUrl += "?" + potentialSearchParams.toString();
      this.result._metadata.extraHead.push(
        markHTMLString(
          `<link rel="preload" as="fetch" href="${serverIslandUrl}" crossorigin="anonymous">`
        )
      );
    }
    const adapterHeaders = this.result.internalFetchHeaders || {};
    const headersJson = stringifyForScript(adapterHeaders);
    const method = useGETRequest ? (
      // GET request
      `const headers = new Headers(${headersJson});
let response = await fetch('${serverIslandUrl}', { headers });`
    ) : (
      // POST request
      `let data = {
	encryptedComponentExport: ${stringifyForScript(componentExportEncrypted)},
	encryptedProps: ${stringifyForScript(propsEncrypted)},
	encryptedSlots: ${stringifyForScript(slotsEncrypted)},
};
const headers = new Headers({ 'Content-Type': 'application/json', ...${headersJson} });
let response = await fetch('${serverIslandUrl}', {
	method: 'POST',
	body: JSON.stringify(data),
	headers,
});`
    );
    this.islandContent = `${method}replaceServerIsland('${hostId}', response);`;
    return this.islandContent;
  }
}
const renderServerIslandRuntime = () => {
  return `<script>${SERVER_ISLAND_REPLACER}</script>`;
};
const SERVER_ISLAND_REPLACER = markHTMLString(
  `async function replaceServerIsland(id, r) {
	let s = document.querySelector(\`script[data-island-id="\${id}"]\`);
	// If there's no matching script, or the request fails then return
	if (!s || r.status !== 200 || r.headers.get('content-type')?.split(';')[0].trim() !== 'text/html') return;
	// Load the HTML before modifying the DOM in case of errors
	let html = await r.text();
	// Remove any placeholder content before the island script
	while (s.previousSibling && s.previousSibling.nodeType !== 8 && s.previousSibling.data !== '[if astro]>server-island-start<![endif]')
		s.previousSibling.remove();
	s.previousSibling?.remove();
	// Insert the new HTML
	s.before(document.createRange().createContextualFragment(html));
	// Remove the script. Prior to v5.4.2, this was the trick to force rerun of scripts.  Keeping it to minimize change to the existing behavior.
	s.remove();
}`.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("//")).join(" ")
);

const Fragment = /* @__PURE__ */ Symbol.for("astro:fragment");
const Renderer = /* @__PURE__ */ Symbol.for("astro:renderer");
const encoder = new TextEncoder();
const decoder$1 = new TextDecoder();
function stringifyChunk(result, chunk) {
  if (isRenderInstruction(chunk)) {
    const instruction = chunk;
    switch (instruction.type) {
      case "directive": {
        const { hydration } = instruction;
        const needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
        const needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
        if (needsHydrationScript) {
          const prescripts = getPrescripts(result, "both", hydration.directive);
          return markHTMLString(prescripts);
        } else if (needsDirectiveScript) {
          const prescripts = getPrescripts(result, "directive", hydration.directive);
          return markHTMLString(prescripts);
        } else {
          return "";
        }
      }
      case "head": {
        if (!shouldRenderInstruction("head", getInstructionRenderState(result))) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "maybe-head": {
        if (!shouldRenderInstruction("maybe-head", getInstructionRenderState(result))) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "renderer-hydration-script": {
        const { rendererSpecificHydrationScripts } = result._metadata;
        const { rendererName } = instruction;
        if (result._metadata.templateDepth > 0) {
          return instruction.render();
        }
        if (!rendererSpecificHydrationScripts.has(rendererName)) {
          rendererSpecificHydrationScripts.add(rendererName);
          return instruction.render();
        }
        return "";
      }
      case "server-island-runtime": {
        if (result._metadata.templateDepth > 0) {
          return renderServerIslandRuntime();
        }
        if (result._metadata.hasRenderedServerIslandRuntime) {
          return "";
        }
        result._metadata.hasRenderedServerIslandRuntime = true;
        return renderServerIslandRuntime();
      }
      case "script": {
        const { id, content } = instruction;
        if (result._metadata.templateDepth > 0) {
          return content;
        }
        if (result._metadata.renderedScripts.has(id)) {
          return "";
        }
        result._metadata.renderedScripts.add(id);
        return content;
      }
      case "template-enter": {
        result._metadata.templateDepth++;
        return "";
      }
      case "template-exit": {
        if (result._metadata.templateDepth <= 0) {
          throw new Error(
            "Unexpected template-exit instruction without a matching template-enter. This may indicate that the compiler emitted unbalanced template boundaries, or that a component manually injected a template-exit render instruction."
          );
        }
        result._metadata.templateDepth--;
        return "";
      }
      default: {
        throw new Error(`Unknown chunk type: ${chunk.type}`);
      }
    }
  } else if (chunk instanceof Response) {
    return "";
  } else if (isSlotString(chunk)) {
    let out = "";
    const c = chunk;
    if (c.instructions) {
      for (const instr of c.instructions) {
        out += stringifyChunk(result, instr);
      }
    }
    out += chunk.toString();
    return out;
  }
  return chunk.toString();
}
function chunkToString(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return decoder$1.decode(chunk);
  } else {
    return stringifyChunk(result, chunk);
  }
}
function chunkToByteArray(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return chunk;
  } else {
    const stringified = stringifyChunk(result, chunk);
    return encoder.encode(stringified.toString());
  }
}
function chunkToByteArrayOrString(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return chunk;
  } else {
    return stringifyChunk(result, chunk).toString();
  }
}
function isRenderInstance(obj) {
  return !!obj && typeof obj === "object" && "render" in obj && typeof obj.render === "function";
}

function renderChild(destination, child) {
  if (typeof child === "string") {
    destination.write(markHTMLString(escapeHTML(child)));
    return;
  }
  if (isPromise(child)) {
    return child.then((x) => renderChild(destination, x));
  }
  if (child instanceof SlotString) {
    destination.write(child);
    return;
  }
  if (isHTMLString(child)) {
    destination.write(child);
    return;
  }
  if (!child && child !== 0) {
    return;
  }
  if (Array.isArray(child)) {
    return renderArray(destination, child);
  }
  if (typeof child === "function") {
    return renderChild(destination, child());
  }
  if (isRenderInstance(child)) {
    return child.render(destination);
  }
  if (isRenderTemplateResult(child)) {
    return child.render(destination);
  }
  if (isAstroComponentInstance(child)) {
    return child.render(destination);
  }
  if (ArrayBuffer.isView(child)) {
    destination.write(child);
    return;
  }
  if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    if (Symbol.asyncIterator in child) {
      return renderAsyncIterable(destination, child);
    }
    return renderIterable(destination, child);
  }
  destination.write(child);
}
function renderArray(destination, children) {
  for (let i = 0; i < children.length; i++) {
    const result = renderChild(destination, children[i]);
    if (isPromise(result)) {
      if (i + 1 >= children.length) {
        return result;
      }
      const remaining = children.length - i - 1;
      const flushers = new Array(remaining);
      for (let j = 0; j < remaining; j++) {
        flushers[j] = createBufferedRenderer(destination, (bufferDestination) => {
          return renderChild(bufferDestination, children[i + 1 + j]);
        });
      }
      return result.then(() => {
        let k = 0;
        const iterate = () => {
          while (k < flushers.length) {
            const flushResult = flushers[k++].flush();
            if (isPromise(flushResult)) {
              return flushResult.then(iterate);
            }
          }
        };
        return iterate();
      });
    }
  }
}
function renderIterable(destination, children) {
  const iterator = children[Symbol.iterator]();
  const iterate = () => {
    for (; ; ) {
      const { value, done } = iterator.next();
      if (done) {
        break;
      }
      const result = renderChild(destination, value);
      if (isPromise(result)) {
        return result.then(iterate);
      }
    }
  };
  return iterate();
}
async function renderAsyncIterable(destination, children) {
  for await (const value of children) {
    await renderChild(destination, value);
  }
}

const astroComponentInstanceSym = /* @__PURE__ */ Symbol.for("astro.componentInstance");
class AstroComponentInstance {
  [astroComponentInstanceSym] = true;
  result;
  props;
  slotValues;
  factory;
  returnValue;
  constructor(result, props, slots, factory) {
    this.result = result;
    this.props = props;
    this.factory = factory;
    this.slotValues = {};
    for (const name in slots) {
      let didRender = false;
      let value = slots[name](result);
      this.slotValues[name] = () => {
        if (!didRender) {
          didRender = true;
          return value;
        }
        return slots[name](result);
      };
    }
  }
  init(result) {
    if (this.returnValue !== void 0) {
      return this.returnValue;
    }
    this.returnValue = this.factory(result, this.props, this.slotValues);
    if (isPromise(this.returnValue)) {
      this.returnValue.then((resolved) => {
        this.returnValue = resolved;
      }).catch(() => {
      });
    }
    return this.returnValue;
  }
  render(destination) {
    const returnValue = this.init(this.result);
    if (isPromise(returnValue)) {
      return returnValue.then((x) => this.renderImpl(destination, x));
    }
    return this.renderImpl(destination, returnValue);
  }
  renderImpl(destination, returnValue) {
    if (isHeadAndContent(returnValue)) {
      return returnValue.content.render(destination);
    } else {
      return renderChild(destination, returnValue);
    }
  }
}
function validateComponentProps(props, clientDirectives, displayName) {
  if (props != null) {
    const directives = [...clientDirectives.keys()].map((directive) => `client:${directive}`);
    for (const prop of Object.keys(props)) {
      if (directives.includes(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
function createAstroComponentInstance(result, displayName, factory, props, slots = {}) {
  validateComponentProps(props, result.clientDirectives, displayName);
  const instance = new AstroComponentInstance(result, props, slots, factory);
  registerIfPropagating(result, factory, instance);
  return instance;
}
function isAstroComponentInstance(obj) {
  return typeof obj === "object" && obj !== null && !!obj[astroComponentInstanceSym];
}

const DOCTYPE_EXP = /<!doctype html/i;
async function renderToString(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let str = "";
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          str += doctype;
        }
      }
      if (chunk instanceof Response) return;
      str += chunkToString(result, chunk);
    }
  };
  await templateResult.render(destination);
  return str;
}
async function renderToReadableStream(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  return new ReadableStream({
    start(controller) {
      const destination = {
        write(chunk) {
          if (isPage && !renderedFirstPageChunk) {
            renderedFirstPageChunk = true;
            if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
              const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
              controller.enqueue(encoder.encode(doctype));
            }
          }
          if (chunk instanceof Response) {
            throw new AstroError({
              ...ResponseSentError
            });
          }
          const bytes = chunkToByteArray(result, chunk);
          controller.enqueue(bytes);
        }
      };
      (async () => {
        try {
          await templateResult.render(destination);
          controller.close();
        } catch (e) {
          if (AstroError.is(e) && !e.loc) {
            e.setLocation({
              file: route?.component
            });
          }
          setTimeout(() => controller.error(e), 0);
        }
      })();
    },
    cancel() {
      result.cancelled = true;
    }
  });
}
async function callComponentAsTemplateResultOrResponse(result, componentFactory, props, children, route) {
  const factoryResult = await componentFactory(result, props, children);
  if (factoryResult instanceof Response) {
    return factoryResult;
  } else if (isHeadAndContent(factoryResult)) {
    if (!isRenderTemplateResult(factoryResult.content)) {
      throw new AstroError({
        ...OnlyResponseCanBeReturned,
        message: OnlyResponseCanBeReturned.message(
          route?.route,
          typeof factoryResult
        ),
        location: {
          file: route?.component
        }
      });
    }
    return factoryResult.content;
  } else if (!isRenderTemplateResult(factoryResult)) {
    throw new AstroError({
      ...OnlyResponseCanBeReturned,
      message: OnlyResponseCanBeReturned.message(route?.route, typeof factoryResult),
      location: {
        file: route?.component
      }
    });
  }
  return factoryResult;
}
async function bufferHeadContent(result) {
  await bufferPropagatedHead(result);
}
async function renderToAsyncIterable(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  let error = null;
  let next = null;
  const buffer = [];
  let renderingComplete = false;
  const iterator = {
    async next() {
      if (result.cancelled) return { done: true, value: void 0 };
      if (next !== null) {
        await next.promise;
      } else if (!renderingComplete && !buffer.length) {
        next = promiseWithResolvers();
        await next.promise;
      }
      if (!renderingComplete) {
        next = promiseWithResolvers();
      }
      if (error) {
        throw error;
      }
      let length = 0;
      let stringToEncode = "";
      for (let i = 0, len = buffer.length; i < len; i++) {
        const bufferEntry = buffer[i];
        if (typeof bufferEntry === "string") {
          const nextIsString = i + 1 < len && typeof buffer[i + 1] === "string";
          stringToEncode += bufferEntry;
          if (!nextIsString) {
            const encoded = encoder.encode(stringToEncode);
            length += encoded.length;
            stringToEncode = "";
            buffer[i] = encoded;
          } else {
            buffer[i] = "";
          }
        } else {
          length += bufferEntry.length;
        }
      }
      let mergedArray = new Uint8Array(length);
      let offset = 0;
      for (let i = 0, len = buffer.length; i < len; i++) {
        const item = buffer[i];
        if (item === "") {
          continue;
        }
        mergedArray.set(item, offset);
        offset += item.length;
      }
      buffer.length = 0;
      const returnValue = {
        // The iterator is done when rendering has finished
        // and there are no more chunks to return.
        done: length === 0 && renderingComplete,
        value: mergedArray
      };
      return returnValue;
    },
    async return() {
      result.cancelled = true;
      return { done: true, value: void 0 };
    }
  };
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          buffer.push(encoder.encode(doctype));
        }
      }
      if (chunk instanceof Response) {
        throw new AstroError(ResponseSentError);
      }
      const bytes = chunkToByteArrayOrString(result, chunk);
      if (bytes.length > 0) {
        buffer.push(bytes);
        next?.resolve();
      } else if (buffer.length > 0) {
        next?.resolve();
      }
    }
  };
  const renderResult = toPromise(() => templateResult.render(destination));
  renderResult.catch((err) => {
    error = err;
  }).finally(() => {
    renderingComplete = true;
    next?.resolve();
  });
  return {
    [Symbol.asyncIterator]() {
      return iterator;
    }
  };
}
function toPromise(fn) {
  try {
    const result = fn();
    return isPromise(result) ? result : Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement$1(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlotToString(result, slots?.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName) return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}

const needsHeadRenderingSymbol = /* @__PURE__ */ Symbol.for("astro.needsHeadRendering");
const rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
const clientOnlyValues = /* @__PURE__ */ new Set(["solid-js", "react", "preact", "vue", "svelte"]);
function guessRenderers(componentUrl) {
  const extname = componentUrl?.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/solid-js", "@astrojs/vue (jsx)"];
    case void 0:
    default:
      return [
        "@astrojs/react",
        "@astrojs/preact",
        "@astrojs/solid-js",
        "@astrojs/vue",
        "@astrojs/svelte"
      ];
  }
}
function isFragmentComponent(Component) {
  return Component === Fragment;
}
function isHTMLComponent(Component) {
  return Component && Component["astro:html"] === true;
}
const ASTRO_SLOT_EXP = /<\/?astro-slot\b[^>]*>/g;
const ASTRO_STATIC_SLOT_EXP = /<\/?astro-static-slot\b[^>]*>/g;
function removeStaticAstroSlot(html, supportsAstroStaticSlot = true) {
  const exp = supportsAstroStaticSlot ? ASTRO_STATIC_SLOT_EXP : ASTRO_SLOT_EXP;
  return html.replace(exp, "");
}
async function renderFrameworkComponent(result, displayName, Component, _props, slots = {}) {
  if (!Component && "client:only" in _props === false) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers, clientDirectives } = result;
  const metadata = {
    astroStaticSlot: true,
    displayName
  };
  const { hydration, isPage, props, propsWithoutTransitionAttributes } = extractDirectives(
    _props,
    clientDirectives
  );
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  const validRenderers = renderers.filter((r) => r.name !== "astro:jsx");
  const { children, slotInstructions } = await renderSlots(result, slots);
  let renderer;
  if (metadata.hydrate !== "only") {
    let isTagged = false;
    try {
      isTagged = Component && Component[Renderer];
    } catch {
    }
    if (isTagged) {
      const rendererName = Component[Renderer];
      renderer = renderers.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error;
      for (const r of renderers) {
        try {
          if (await r.ssr.check.call({ result }, Component, props, children, metadata)) {
            renderer = r;
            break;
          }
        } catch (e) {
          error ??= e;
        }
      }
      if (!renderer && error) {
        throw error;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = await renderHTMLElement$1(
        result,
        Component,
        _props,
        slots
      );
      return {
        render(destination) {
          destination.write(output);
        }
      };
    }
  } else {
    if (metadata.hydrateArgs) {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        renderer = renderers.find(
          ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
        );
      }
    }
    if (!renderer && validRenderers.length === 1) {
      renderer = validRenderers[0];
    }
    if (!renderer) {
      const extname = metadata.componentUrl?.split(".").pop();
      renderer = renderers.find(({ name }) => name === `@astrojs/${extname}` || name === extname);
    }
    if (!renderer && metadata.hydrateArgs) {
      const rendererName = metadata.hydrateArgs;
      if (typeof rendererName === "string") {
        renderer = renderers.find(({ name }) => name === rendererName);
      }
    }
  }
  if (!renderer) {
    if (metadata.hydrate === "only") {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        const plural = validRenderers.length > 1;
        throw new AstroError({
          ...NoMatchingRenderer,
          message: NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r) => "`" + r + "`"))
          )
        });
      } else {
        throw new AstroError({
          ...NoClientOnlyHint,
          message: NoClientOnlyHint.message(metadata.displayName),
          hint: NoClientOnlyHint.hint(
            probableRendererNames.map((r) => r.replace("@astrojs/", "")).join("|")
          )
        });
      }
    } else if (typeof Component !== "string") {
      const matchingRenderers = validRenderers.filter(
        (r) => probableRendererNames.includes(r.name)
      );
      const plural = validRenderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new AstroError({
          ...NoMatchingRenderer,
          message: NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r) => "`" + r + "`"))
          )
        });
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          propsWithoutTransitionAttributes,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.
3. If using multiple JSX frameworks at the same time (e.g. React + Preact), pass the correct \`include\`/\`exclude\` options to integrations.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlotToString(result, slots?.fallback);
    } else {
      performance.now();
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        propsWithoutTransitionAttributes,
        children,
        metadata
      ));
    }
  }
  if (!html && typeof Component === "string") {
    const Tag = sanitizeElementName(Component);
    const childSlots = Object.values(children).join("");
    const renderTemplateResult = renderTemplate`<${Tag}${internalSpreadAttributes(
      props,
      true,
      Tag
    )}${markHTMLString(
      childSlots === "" && voidElementNames.test(Tag) ? `/>` : `>${childSlots}</${Tag}>`
    )}`;
    html = "";
    const destination = {
      write(chunk) {
        if (chunk instanceof Response) return;
        html += chunkToString(result, chunk);
      }
    };
    await renderTemplateResult.render(destination);
  }
  if (!hydration) {
    return {
      render(destination) {
        if (slotInstructions) {
          for (const instruction of slotInstructions) {
            destination.write(instruction);
          }
        }
        if (isPage || renderer?.name === "astro:jsx") {
          destination.write(html);
        } else if (html && html.length > 0) {
          destination.write(
            markHTMLString(removeStaticAstroSlot(html, renderer?.ssr?.supportsAstroStaticSlot))
          );
        }
      }
    };
  }
  const astroId = shorthash(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props,
      metadata
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        let tagName = renderer?.ssr?.supportsAstroStaticSlot ? !!metadata.hydrate ? "astro-slot" : "astro-static-slot" : "astro-slot";
        let expectedHTML = key === "default" ? `<${tagName}>` : `<${tagName} name="${escapeHTML(key)}">`;
        if (!html.includes(expectedHTML)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${escapeHTML(key)}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template}`;
  if (island.children) {
    island.props["await-children"] = "";
    island.children += `<!--astro:end-->`;
  }
  return {
    render(destination) {
      if (slotInstructions) {
        for (const instruction of slotInstructions) {
          destination.write(instruction);
        }
      }
      destination.write(createRenderInstruction({ type: "directive", hydration }));
      if (hydration.directive !== "only" && renderer?.ssr.renderHydrationScript) {
        destination.write(
          createRenderInstruction({
            type: "renderer-hydration-script",
            rendererName: renderer.name,
            render: renderer.ssr.renderHydrationScript
          })
        );
      }
      const renderedElement = renderElement$1("astro-island", island, false);
      destination.write(markHTMLString(renderedElement));
    }
  };
}
function sanitizeElementName(tag) {
  const unsafe = /[&<>'"\s]+/;
  if (!unsafe.test(tag)) return tag;
  return tag.trim().split(unsafe)[0].trim();
}
function renderFragmentComponent(result, slots = {}) {
  const slot = slots?.default;
  const preRendered = slot?.(result);
  return {
    render(destination) {
      if (preRendered == null) return;
      return renderChild(destination, preRendered);
    }
  };
}
async function renderHTMLComponent(result, Component, _props, slots = {}) {
  const { slotInstructions, children } = await renderSlots(result, slots);
  const html = Component({ slots: children });
  const hydrationHtml = slotInstructions ? slotInstructions.map((instr) => chunkToString(result, instr)).join("") : "";
  return {
    render(destination) {
      destination.write(markHTMLString(hydrationHtml + html));
    }
  };
}
function renderAstroComponent(result, displayName, Component, props, slots = {}) {
  if (containsServerDirective(props)) {
    const serverIslandComponent = new ServerIslandComponent(result, props, slots, displayName);
    result._metadata.propagators.add(serverIslandComponent);
    return serverIslandComponent;
  }
  const instance = createAstroComponentInstance(result, displayName, Component, props, slots);
  return {
    render(destination) {
      return instance.render(destination);
    }
  };
}
function renderComponent(result, displayName, Component, props, slots = {}) {
  if (isPromise(Component)) {
    return Component.catch(handleCancellation).then((x) => {
      return renderComponent(result, displayName, x, props, slots);
    });
  }
  if (isFragmentComponent(Component)) {
    return renderFragmentComponent(result, slots);
  }
  props = normalizeProps(props);
  if (isHTMLComponent(Component)) {
    return renderHTMLComponent(result, Component, props, slots).catch(handleCancellation);
  }
  if (isAstroComponentFactory(Component)) {
    return renderAstroComponent(result, displayName, Component, props, slots);
  }
  return renderFrameworkComponent(result, displayName, Component, props, slots).catch(
    handleCancellation
  );
  function handleCancellation(e) {
    if (result.cancelled)
      return {
        render() {
        }
      };
    throw e;
  }
}
function normalizeProps(props) {
  if (props["class:list"] !== void 0) {
    const value = props["class:list"];
    delete props["class:list"];
    props["class"] = clsx(props["class"], value);
    if (props["class"] === "") {
      delete props["class"];
    }
  }
  return props;
}
async function renderComponentToString(result, displayName, Component, props, slots = {}, isPage = false, route) {
  let str = "";
  let renderedFirstPageChunk = false;
  let head = "";
  if (isPage && !result.partial && nonAstroPageNeedsHeadInjection(Component)) {
    head += chunkToString(result, maybeRenderHead());
  }
  try {
    const destination = {
      write(chunk) {
        if (isPage && !result.partial && !renderedFirstPageChunk) {
          renderedFirstPageChunk = true;
          if (!/<!doctype html/i.test(String(chunk))) {
            const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
            str += doctype + head;
          }
        }
        if (chunk instanceof Response) return;
        str += chunkToString(result, chunk);
      }
    };
    const renderInstance = await renderComponent(result, displayName, Component, props, slots);
    if (containsServerDirective(props)) {
      await bufferHeadContent(result);
    }
    await renderInstance.render(destination);
  } catch (e) {
    if (AstroError.is(e) && !e.loc) {
      e.setLocation({
        file: route?.component
      });
    }
    throw e;
  }
  return str;
}
function nonAstroPageNeedsHeadInjection(pageComponent) {
  return !!pageComponent?.[needsHeadRenderingSymbol];
}

const ClientOnlyPlaceholder$1 = "astro-client-only";
const hasTriedRenderComponentSymbol = /* @__PURE__ */ Symbol("hasTriedRenderComponent");
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case typeof vnode === "function":
      return vnode;
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode): {
      const renderedItems = await Promise.all(vnode.map((v) => renderJSX(result, v)));
      let instructions = null;
      let content = "";
      for (const item of renderedItems) {
        if (item instanceof SlotString) {
          content += item;
          instructions = mergeSlotInstructions(instructions, item);
        } else {
          content += item;
        }
      }
      if (instructions) {
        return markHTMLString(new SlotString(content, instructions));
      }
      return markHTMLString(content);
    }
  }
  return renderJSXVNode(result, vnode);
}
async function renderJSXVNode(result, vnode) {
  if (isVNode(vnode)) {
    switch (true) {
      case !vnode.type: {
        throw new Error(`Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
      }
      case vnode.type === /* @__PURE__ */ Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case isAstroComponentFactory(vnode.type): {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        const str = await renderComponentToString(
          result,
          vnode.type.name,
          vnode.type,
          props,
          slots
        );
        const html = markHTMLString(str);
        return html;
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder$1 && !vnode.type.includes("-")):
        return markHTMLString(await renderElement(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = function(child) {
        if (Array.isArray(child)) {
          return child.map((c) => extractSlots2(c));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props && !isCustomElement) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      };
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function") {
        if (vnode.props[hasTriedRenderComponentSymbol]) {
          delete vnode.props[hasTriedRenderComponentSymbol];
          const output2 = await vnode.type(vnode.props ?? {});
          if (output2?.[AstroJSX] || !output2) {
            return await renderJSXVNode(result, output2);
          } else {
            return;
          }
        } else {
          vnode.props[hasTriedRenderComponentSymbol] = true;
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      const isCustomElement = typeof vnode.type === "string" && vnode.type.includes("-");
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value?.["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0) return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      let output;
      if (vnode.type === ClientOnlyPlaceholder$1 && vnode.props["client:only"]) {
        output = await renderComponentToString(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponentToString(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      return markHTMLString(output);
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children === "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, prerenderElementChildren$1(tag, children))}</${tag}>`
    )}`
  );
}
function prerenderElementChildren$1(tag, children) {
  if (typeof children === "string" && (tag === "style" || tag === "script")) {
    return markHTMLString(children);
  } else {
    return children;
  }
}

const ClientOnlyPlaceholder = "astro-client-only";
function renderJSXToQueue(vnode, result, queue, pool, stack, parent, metadata) {
  if (vnode instanceof HTMLString) {
    const html = vnode.toString();
    if (html.trim() === "") return;
    const node = pool.acquire("html-string", html);
    node.html = html;
    queue.nodes.push(node);
    return;
  }
  if (typeof vnode === "string") {
    const node = pool.acquire("text", vnode);
    node.content = vnode;
    queue.nodes.push(node);
    return;
  }
  if (typeof vnode === "number" || typeof vnode === "boolean") {
    const str = String(vnode);
    const node = pool.acquire("text", str);
    node.content = str;
    queue.nodes.push(node);
    return;
  }
  if (vnode == null || vnode === false) {
    return;
  }
  if (Array.isArray(vnode)) {
    for (let i = vnode.length - 1; i >= 0; i = i - 1) {
      stack.push({ node: vnode[i], parent, metadata });
    }
    return;
  }
  if (!isVNode(vnode)) {
    const str = String(vnode);
    const node = pool.acquire("text", str);
    node.content = str;
    queue.nodes.push(node);
    return;
  }
  handleVNode(vnode, result, queue, pool, stack, parent, metadata);
}
function handleVNode(vnode, result, queue, pool, stack, parent, metadata) {
  if (!vnode.type) {
    throw new Error(
      `Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  if (vnode.type === /* @__PURE__ */ Symbol.for("astro:fragment")) {
    stack.push({ node: vnode.props?.children, parent, metadata });
    return;
  }
  if (isAstroComponentFactory(vnode.type)) {
    const factory = vnode.type;
    let props = {};
    let slots = {};
    for (const [key, value] of Object.entries(vnode.props ?? {})) {
      if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
        slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
      } else {
        props[key] = value;
      }
    }
    const displayName = metadata?.displayName || factory.name || "Anonymous";
    const instance = createAstroComponentInstance(result, displayName, factory, props, slots);
    const queueNode = pool.acquire("component");
    queueNode.instance = instance;
    queue.nodes.push(queueNode);
    return;
  }
  if (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder) {
    renderHTMLElement(vnode, result, queue, pool, stack, parent, metadata);
    return;
  }
  if (typeof vnode.type === "function") {
    if (vnode.props?.["server:root"]) {
      const output3 = vnode.type(vnode.props ?? {});
      stack.push({ node: output3, parent, metadata });
      return;
    }
    const output2 = vnode.type(vnode.props ?? {});
    stack.push({ node: output2, parent, metadata });
    return;
  }
  const output = renderJSX(result, vnode);
  stack.push({ node: output, parent, metadata });
}
function renderHTMLElement(vnode, _result, queue, pool, stack, parent, metadata) {
  const tag = vnode.type;
  const { children, ...props } = vnode.props ?? {};
  const attrs = spreadAttributes(props);
  const isVoidElement = (children == null || children === "") && voidElementNames.test(tag);
  if (isVoidElement) {
    const html = `<${tag}${attrs}/>`;
    const node = pool.acquire("html-string", html);
    node.html = html;
    queue.nodes.push(node);
    return;
  }
  const openTag = `<${tag}${attrs}>`;
  const openTagHtml = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(openTag) : markHTMLString(openTag);
  stack.push({ node: openTagHtml, parent, metadata });
  if (children != null && children !== "") {
    const processedChildren = prerenderElementChildren(tag, children, queue.htmlStringCache);
    stack.push({ node: processedChildren, parent, metadata });
  }
  const closeTag = `</${tag}>`;
  const closeTagHtml = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(closeTag) : markHTMLString(closeTag);
  stack.push({ node: closeTagHtml, parent, metadata });
}
function prerenderElementChildren(tag, children, htmlStringCache) {
  if (typeof children === "string" && (tag === "style" || tag === "script")) {
    return htmlStringCache ? htmlStringCache.getOrCreate(children) : markHTMLString(children);
  }
  return children;
}

async function buildRenderQueue(root, result, pool) {
  const queue = {
    nodes: [],
    result,
    pool,
    htmlStringCache: result._experimentalQueuedRendering?.htmlStringCache
  };
  const stack = [{ node: root, parent: null }];
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) {
      continue;
    }
    let { node, parent } = item;
    if (isPromise(node)) {
      try {
        const resolved = await node;
        stack.push({ node: resolved, parent, metadata: item.metadata });
      } catch (error) {
        throw error;
      }
      continue;
    }
    if (node == null || node === false) {
      continue;
    }
    if (typeof node === "string") {
      const queueNode = pool.acquire("text", node);
      queueNode.content = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (typeof node === "number" || typeof node === "boolean") {
      const str = String(node);
      const queueNode = pool.acquire("text", str);
      queueNode.content = str;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isHTMLString(node)) {
      const html = node.toString();
      const queueNode = pool.acquire("html-string", html);
      queueNode.html = html;
      queue.nodes.push(queueNode);
      continue;
    }
    if (node instanceof SlotString) {
      const html = node.toString();
      const queueNode = pool.acquire("html-string", html);
      queueNode.html = html;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isVNode(node)) {
      renderJSXToQueue(node, result, queue, pool, stack, parent, item.metadata);
      continue;
    }
    if (Array.isArray(node)) {
      for (const n of node) {
        stack.push({ node: n, parent, metadata: item.metadata });
      }
      continue;
    }
    if (isRenderInstruction(node)) {
      const queueNode = pool.acquire("instruction");
      queueNode.instruction = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isRenderTemplateResult(node)) {
      const htmlParts = node["htmlParts"];
      const expressions = node["expressions"];
      if (htmlParts[0]) {
        const htmlString = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(htmlParts[0]) : markHTMLString(htmlParts[0]);
        stack.push({
          node: htmlString,
          parent,
          metadata: item.metadata
        });
      }
      for (let i = 0; i < expressions.length; i = i + 1) {
        stack.push({ node: expressions[i], parent, metadata: item.metadata });
        if (htmlParts[i + 1]) {
          const htmlString = queue.htmlStringCache ? queue.htmlStringCache.getOrCreate(htmlParts[i + 1]) : markHTMLString(htmlParts[i + 1]);
          stack.push({
            node: htmlString,
            parent,
            metadata: item.metadata
          });
        }
      }
      continue;
    }
    if (isAstroComponentInstance(node)) {
      const queueNode = pool.acquire("component");
      queueNode.instance = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (isAstroComponentFactory(node)) {
      const factory = node;
      const props = item.metadata?.props || {};
      const slots = item.metadata?.slots || {};
      const displayName = item.metadata?.displayName || factory.name || "Anonymous";
      const instance = createAstroComponentInstance(result, displayName, factory, props, slots);
      const queueNode = pool.acquire("component");
      queueNode.instance = instance;
      if (isAPropagatingComponent(result, factory)) {
        try {
          const returnValue = await instance.init(result);
          if (isHeadAndContent(returnValue) && returnValue.head) {
            result._metadata.extraHead.push(returnValue.head);
          }
        } catch (error) {
          throw error;
        }
      }
      queue.nodes.push(queueNode);
      continue;
    }
    if (isRenderInstance(node)) {
      const queueNode = pool.acquire("component");
      queueNode.instance = node;
      queue.nodes.push(queueNode);
      continue;
    }
    if (typeof node === "object" && Symbol.iterator in node) {
      const items = Array.from(node);
      for (const iterItem of items) {
        stack.push({ node: iterItem, parent, metadata: item.metadata });
      }
      continue;
    }
    if (typeof node === "object" && Symbol.asyncIterator in node) {
      try {
        const items = [];
        for await (const asyncItem of node) {
          items.push(asyncItem);
        }
        for (const iterItem of items) {
          stack.push({ node: iterItem, parent, metadata: item.metadata });
        }
      } catch (error) {
        throw error;
      }
      continue;
    }
    if (node instanceof Response) {
      const queueNode = pool.acquire("html-string", "");
      queueNode.html = "";
      queue.nodes.push(queueNode);
      continue;
    }
    if (isHTMLString(node)) {
      const html = String(node);
      const queueNode = pool.acquire("html-string", html);
      queueNode.html = html;
      queue.nodes.push(queueNode);
    } else {
      const str = String(node);
      const queueNode = pool.acquire("text", str);
      queueNode.content = str;
      queue.nodes.push(queueNode);
    }
  }
  queue.nodes.reverse();
  return queue;
}

async function renderQueue(queue, destination) {
  const result = queue.result;
  const pool = queue.pool;
  const cache = queue.htmlStringCache;
  let batchBuffer = "";
  let i = 0;
  while (i < queue.nodes.length) {
    const node = queue.nodes[i];
    try {
      if (canBatch(node)) {
        const batchStart = i;
        while (i < queue.nodes.length && canBatch(queue.nodes[i])) {
          batchBuffer += renderNodeToString(queue.nodes[i]);
          i = i + 1;
        }
        if (batchBuffer) {
          const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
          destination.write(htmlString);
          batchBuffer = "";
        }
        if (pool) {
          for (let j = batchStart; j < i; j++) {
            pool.release(queue.nodes[j]);
          }
        }
      } else {
        await renderNode(node, destination, result);
        if (pool) {
          pool.release(node);
        }
        i = i + 1;
      }
    } catch (error) {
      throw error;
    }
  }
  if (batchBuffer) {
    const htmlString = cache ? cache.getOrCreate(batchBuffer) : markHTMLString(batchBuffer);
    destination.write(htmlString);
  }
}
function canBatch(node) {
  return node.type === "text" || node.type === "html-string";
}
function renderNodeToString(node) {
  switch (node.type) {
    case "text":
      return node.content ? escapeHTML(node.content) : "";
    case "html-string":
      return node.html || "";
    case "component":
    case "instruction": {
      return "";
    }
  }
}
async function renderNode(node, destination, result) {
  const cache = result._experimentalQueuedRendering?.htmlStringCache;
  switch (node.type) {
    case "text": {
      if (node.content) {
        const escaped = escapeHTML(node.content);
        const htmlString = cache ? cache.getOrCreate(escaped) : markHTMLString(escaped);
        destination.write(htmlString);
      }
      break;
    }
    case "html-string": {
      if (node.html) {
        const htmlString = cache ? cache.getOrCreate(node.html) : markHTMLString(node.html);
        destination.write(htmlString);
      }
      break;
    }
    case "instruction": {
      if (node.instruction) {
        destination.write(node.instruction);
      }
      break;
    }
    case "component": {
      if (node.instance) {
        let componentHtml = "";
        const componentDestination = {
          write(chunk) {
            if (chunk instanceof Response) return;
            componentHtml += chunkToString(result, chunk);
          }
        };
        await node.instance.render(componentDestination);
        if (componentHtml) {
          destination.write(componentHtml);
        }
      }
      break;
    }
  }
}

async function renderPage(result, componentFactory, props, children, streaming, route) {
  if (!isAstroComponentFactory(componentFactory)) {
    result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
    const pageProps = { ...props ?? {}, "server:root": true };
    let str;
    if (result._experimentalQueuedRendering && result._experimentalQueuedRendering.enabled) {
      let vnode = await componentFactory(pageProps);
      if (componentFactory["astro:html"] && typeof vnode === "string") {
        vnode = markHTMLString(vnode);
      }
      const queue = await buildRenderQueue(
        vnode,
        result,
        result._experimentalQueuedRendering.pool
      );
      let html = "";
      let renderedFirst = false;
      const destination = {
        write(chunk) {
          if (chunk instanceof Response) return;
          if (!renderedFirst && !result.partial) {
            renderedFirst = true;
            const chunkStr = String(chunk);
            if (!/<!doctype html/i.test(chunkStr)) {
              const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
              html += doctype;
            }
          }
          html += chunkToString(result, chunk);
        }
      };
      await renderQueue(queue, destination);
      str = html;
    } else {
      str = await renderComponentToString(
        result,
        componentFactory.name,
        componentFactory,
        pageProps,
        {},
        true,
        route
      );
    }
    const bytes = encoder.encode(str);
    const headers2 = new Headers([
      ["Content-Type", "text/html"],
      ["Content-Length", bytes.byteLength.toString()]
    ]);
    if (result.shouldInjectCspMetaTags && (result.cspDestination === "header" || result.cspDestination === "adapter")) {
      headers2.set("content-security-policy", renderCspContent(result));
    }
    return new Response(bytes, {
      headers: headers2,
      status: result.response.status
    });
  }
  result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
  let body;
  if (streaming) {
    if (isNode && !isDeno) {
      const nodeBody = await renderToAsyncIterable(
        result,
        componentFactory,
        props,
        children,
        true,
        route
      );
      body = nodeBody;
    } else {
      body = await renderToReadableStream(result, componentFactory, props, children, true, route);
    }
  } else {
    body = await renderToString(result, componentFactory, props, children, true, route);
  }
  if (body instanceof Response) return body;
  const init = result.response;
  const headers = new Headers(init.headers);
  if (result.shouldInjectCspMetaTags && result.cspDestination === "header" || result.cspDestination === "adapter") {
    headers.set("content-security-policy", renderCspContent(result));
  }
  if (!streaming && typeof body === "string") {
    body = encoder.encode(body);
    headers.set("Content-Length", body.byteLength.toString());
  }
  let status = init.status;
  let statusText = init.statusText;
  if (route?.route === "/404") {
    status = 404;
    if (statusText === "OK") {
      statusText = "Not Found";
    }
  } else if (route?.route === "/500") {
    status = 500;
    if (statusText === "OK") {
      statusText = "Internal Server Error";
    }
  }
  if (status) {
    return new Response(body, { ...init, headers, status, statusText });
  } else {
    return new Response(body, { ...init, headers });
  }
}

"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_".split("").reduce((v, c) => (v[c.charCodeAt(0)] = c, v), []);
"-0123456789_".split("").reduce((v, c) => (v[c.charCodeAt(0)] = c, v), []);

function spreadAttributes(values = {}, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true, _name);
  }
  return markHTMLString(output);
}

function getPattern(segments, base, addTrailingSlash) {
  const pathname = segments.map((segment) => {
    if (segment.length === 1 && segment[0].spread) {
      return "(?:\\/(.*?))?";
    } else {
      return "\\/" + segment.map((part) => {
        if (part.spread) {
          return "(.*?)";
        } else if (part.dynamic) {
          return "([^/]+?)";
        } else {
          return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
      }).join("");
    }
  }).join("");
  const trailing = addTrailingSlash && segments.length ? getTrailingSlashPattern(addTrailingSlash) : "$";
  let initial = "\\/";
  if (addTrailingSlash === "never" && base !== "/" && pathname !== "") {
    initial = "";
  }
  return new RegExp(`^${pathname || initial}${trailing}`);
}
function getTrailingSlashPattern(addTrailingSlash) {
  if (addTrailingSlash === "always") {
    return "\\/$";
  }
  if (addTrailingSlash === "never") {
    return "$";
  }
  return "\\/?$";
}

const SERVER_ISLAND_ROUTE = "/_server-islands/[name]";
const SERVER_ISLAND_COMPONENT = "_server-islands.astro";
function badRequest(reason) {
  return new Response(null, {
    status: 400,
    statusText: "Bad request: " + reason
  });
}
const DEFAULT_BODY_SIZE_LIMIT = 1024 * 1024;
async function getRequestData(request, bodySizeLimit = DEFAULT_BODY_SIZE_LIMIT) {
  switch (request.method) {
    case "GET": {
      const url = new URL(request.url);
      const params = url.searchParams;
      if (!params.has("s") || !params.has("e") || !params.has("p")) {
        return badRequest("Missing required query parameters.");
      }
      const encryptedSlots = params.get("s");
      return {
        encryptedComponentExport: params.get("e"),
        encryptedProps: params.get("p"),
        encryptedSlots
      };
    }
    case "POST": {
      try {
        const body = await readBodyWithLimit(request, bodySizeLimit);
        const raw = new TextDecoder().decode(body);
        const data = JSON.parse(raw);
        if (Object.hasOwn(data, "slots") && typeof data.slots === "object") {
          return badRequest("Plaintext slots are not allowed. Slots must be encrypted.");
        }
        if (Object.hasOwn(data, "componentExport") && typeof data.componentExport === "string") {
          return badRequest(
            "Plaintext componentExport is not allowed. componentExport must be encrypted."
          );
        }
        return data;
      } catch (e) {
        if (e instanceof BodySizeLimitError) {
          return new Response(null, {
            status: 413,
            statusText: e.message
          });
        }
        if (e instanceof SyntaxError) {
          return badRequest("Request format is invalid.");
        }
        throw e;
      }
    }
    default: {
      return new Response(null, { status: 405 });
    }
  }
}
function createEndpoint(manifest) {
  const page = async (result) => {
    const params = result.params;
    if (!params.name) {
      return new Response(null, {
        status: 400,
        statusText: "Bad request"
      });
    }
    const componentId = params.name;
    const data = await getRequestData(result.request, manifest.serverIslandBodySizeLimit);
    if (data instanceof Response) {
      return data;
    }
    const serverIslandMappings = await manifest.serverIslandMappings?.();
    const serverIslandMap = await serverIslandMappings?.serverIslandMap;
    let imp = serverIslandMap?.get(componentId);
    if (!imp) {
      return new Response(null, {
        status: 404,
        statusText: "Not found"
      });
    }
    const key = await manifest.key;
    let componentExport;
    try {
      componentExport = await decryptString(
        key,
        data.encryptedComponentExport,
        `export:${componentId}`
      );
    } catch (_e) {
      return badRequest("Encrypted componentExport value is invalid.");
    }
    const encryptedProps = data.encryptedProps;
    let props = {};
    if (encryptedProps !== "") {
      try {
        const propString = await decryptString(key, encryptedProps, `props:${componentId}`);
        props = JSON.parse(propString);
      } catch (_e) {
        return badRequest("Encrypted props value is invalid.");
      }
    }
    let decryptedSlots = {};
    const encryptedSlots = data.encryptedSlots;
    if (encryptedSlots !== "") {
      try {
        const slotsString = await decryptString(key, encryptedSlots, `slots:${componentId}`);
        decryptedSlots = JSON.parse(slotsString);
      } catch (_e) {
        return badRequest("Encrypted slots value is invalid.");
      }
    }
    const componentModule = await imp();
    let Component = componentModule[componentExport];
    const slots = {};
    for (const prop in decryptedSlots) {
      slots[prop] = createSlotValueFromString(decryptedSlots[prop]);
    }
    result.response.headers.set("X-Robots-Tag", "noindex");
    if (isAstroComponentFactory(Component)) {
      const ServerIsland = Component;
      Component = function(...args) {
        return ServerIsland.apply(this, args);
      };
      Object.assign(Component, ServerIsland);
      Component.propagation = "self";
    }
    return renderTemplate`${renderComponent(result, "Component", Component, props, slots)}`;
  };
  page.isAstroComponentFactory = true;
  const instance = {
    default: page,
    partial: true
  };
  return instance;
}

function createDefaultRoutes(manifest) {
  const root = new URL(manifest.rootDir);
  return [
    {
      instance: default404Instance,
      matchesComponent: (filePath) => filePath.href === new URL(DEFAULT_404_COMPONENT, root).href,
      route: DEFAULT_404_ROUTE.route,
      component: DEFAULT_404_COMPONENT
    },
    {
      instance: createEndpoint(manifest),
      matchesComponent: (filePath) => filePath.href === new URL(SERVER_ISLAND_COMPONENT, root).href,
      route: SERVER_ISLAND_ROUTE,
      component: SERVER_ISLAND_COMPONENT
    }
  ];
}

function ensure404Route(manifest) {
  if (!manifest.routes.some((route) => route.route === "/404")) {
    manifest.routes.push(DEFAULT_404_ROUTE);
  }
  return manifest;
}

function routeIsRedirect(route) {
  return route?.type === "redirect";
}
function routeIsFallback(route) {
  return route?.type === "fallback";
}
function getFallbackRoute(route, routeList) {
  const fallbackRoute = routeList.find((r) => {
    if (route.route === "/" && r.routeData.route === "/") {
      return true;
    }
    return r.routeData.fallbackRoutes.find((f) => {
      return f.route === route.route;
    });
  });
  if (!fallbackRoute) {
    throw new Error(`No fallback route found for route ${route.route}`);
  }
  return fallbackRoute.routeData;
}
function getCustom404Route(manifestData) {
  return manifestData.routes.find((r) => isRoute404(r.route));
}
function routeHasHtmlExtension(route) {
  return route.segments.some(
    (segment) => segment.some((part) => !part.dynamic && part.content.includes(".html"))
  );
}

async function getProps(opts) {
  const {
    logger,
    mod,
    routeData: route,
    routeCache,
    pathname,
    serverLike,
    base,
    trailingSlash
  } = opts;
  if (!route || route.pathname) {
    return {};
  }
  if (routeIsRedirect(route) || routeIsFallback(route) || route.component === DEFAULT_404_COMPONENT) {
    return {};
  }
  const staticPaths = await callGetStaticPaths({
    mod,
    route,
    routeCache,
    ssr: serverLike,
    base,
    trailingSlash
  });
  const params = getParams(route, pathname);
  const matchedStaticPath = findPathItemByKey(staticPaths, params, route, logger, trailingSlash);
  if (!matchedStaticPath && route.origin !== "internal" && (serverLike ? route.prerender : true)) {
    throw new AstroError({
      ...NoMatchingStaticPathFound,
      message: NoMatchingStaticPathFound.message(pathname),
      hint: NoMatchingStaticPathFound.hint([route.component])
    });
  }
  if (mod) {
    validatePrerenderEndpointCollision(route, mod, params);
  }
  const props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
  return props;
}
function getParams(route, pathname) {
  if (!route.params.length) return {};
  const path = pathname.endsWith(".html") && route.type === "page" && !routeHasHtmlExtension(route) ? pathname.slice(0, -5) : pathname;
  const allPatterns = [route, ...route.fallbackRoutes].map((r) => r.pattern);
  const paramsMatch = allPatterns.map((pattern) => pattern.exec(path)).find((x) => x);
  if (!paramsMatch) return {};
  const params = {};
  route.params.forEach((key, i) => {
    if (key.startsWith("...")) {
      params[key.slice(3)] = paramsMatch[i + 1] ? paramsMatch[i + 1] : void 0;
    } else {
      params[key] = paramsMatch[i + 1];
    }
  });
  return params;
}
function validatePrerenderEndpointCollision(route, mod, params) {
  if (route.type === "endpoint" && mod.getStaticPaths) {
    const lastSegment = route.segments[route.segments.length - 1];
    const paramValues = Object.values(params);
    const lastParam = paramValues[paramValues.length - 1];
    if (lastSegment.length === 1 && lastSegment[0].dynamic && lastParam === void 0) {
      throw new AstroError({
        ...PrerenderDynamicEndpointPathCollide,
        message: PrerenderDynamicEndpointPathCollide.message(route.route),
        hint: PrerenderDynamicEndpointPathCollide.hint(route.component),
        location: {
          file: route.component
        }
      });
    }
  }
}

function routeComparator(a, b) {
  const commonLength = Math.min(a.segments.length, b.segments.length);
  for (let index = 0; index < commonLength; index++) {
    const aSegment = a.segments[index];
    const bSegment = b.segments[index];
    const aIsStatic = aSegment.every((part) => !part.dynamic && !part.spread);
    const bIsStatic = bSegment.every((part) => !part.dynamic && !part.spread);
    if (aIsStatic && bIsStatic) {
      const aContent = aSegment.map((part) => part.content).join("");
      const bContent = bSegment.map((part) => part.content).join("");
      if (aContent !== bContent) {
        return aContent.localeCompare(bContent);
      }
    }
    if (aIsStatic !== bIsStatic) {
      return aIsStatic ? -1 : 1;
    }
    const aAllDynamic = aSegment.every((part) => part.dynamic);
    const bAllDynamic = bSegment.every((part) => part.dynamic);
    if (aAllDynamic !== bAllDynamic) {
      return aAllDynamic ? 1 : -1;
    }
    const aHasSpread = aSegment.some((part) => part.spread);
    const bHasSpread = bSegment.some((part) => part.spread);
    if (aHasSpread !== bHasSpread) {
      return aHasSpread ? 1 : -1;
    }
  }
  const aLength = a.segments.length;
  const bLength = b.segments.length;
  if (aLength !== bLength) {
    const aEndsInRest = a.segments.at(-1)?.some((part) => part.spread);
    const bEndsInRest = b.segments.at(-1)?.some((part) => part.spread);
    if (aEndsInRest !== bEndsInRest && Math.abs(aLength - bLength) === 1) {
      if (aLength > bLength && aEndsInRest) {
        return 1;
      }
      if (bLength > aLength && bEndsInRest) {
        return -1;
      }
    }
    return aLength > bLength ? -1 : 1;
  }
  if (a.type === "endpoint" !== (b.type === "endpoint")) {
    return a.type === "endpoint" ? -1 : 1;
  }
  return a.route.localeCompare(b.route);
}

class Router {
  #routes;
  #base;
  #baseWithoutTrailingSlash;
  #buildFormat;
  #trailingSlash;
  constructor(routes, options) {
    this.#routes = [...routes].sort(routeComparator);
    this.#base = normalizeBase(options.base);
    this.#baseWithoutTrailingSlash = removeTrailingForwardSlash(this.#base);
    this.#buildFormat = options.buildFormat;
    this.#trailingSlash = options.trailingSlash;
  }
  /**
   * Match an input pathname against the route list.
   * If allowWithoutBase is true, a non-base-prefixed path is still considered.
   */
  match(inputPathname, { allowWithoutBase = false } = {}) {
    const normalized = getRedirectForPathname(inputPathname);
    if (normalized.redirect) {
      return { type: "redirect", location: normalized.redirect, status: 301 };
    }
    if (this.#base !== "/") {
      const baseWithSlash = `${this.#baseWithoutTrailingSlash}/`;
      if (this.#trailingSlash === "always" && (normalized.pathname === this.#baseWithoutTrailingSlash || normalized.pathname === this.#base)) {
        return { type: "redirect", location: baseWithSlash, status: 301 };
      }
      if (this.#trailingSlash === "never" && normalized.pathname === baseWithSlash) {
        return { type: "redirect", location: this.#baseWithoutTrailingSlash, status: 301 };
      }
    }
    const baseResult = stripBase(
      normalized.pathname,
      this.#base,
      this.#baseWithoutTrailingSlash,
      this.#trailingSlash
    );
    if (!baseResult) {
      if (!allowWithoutBase) {
        return { type: "none", reason: "outside-base" };
      }
    }
    let pathname = baseResult ?? normalized.pathname;
    if (this.#buildFormat === "file") {
      pathname = normalizeFileFormatPathname(pathname);
    }
    const route = this.#routes.find((candidate) => {
      if (candidate.pattern.test(pathname)) return true;
      return candidate.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
    });
    if (!route) {
      return { type: "none", reason: "no-match" };
    }
    const params = getParams(route, pathname);
    return { type: "match", route, params, pathname };
  }
  /**
   * Returns all routes that match the given pathname, in priority order.
   * Used when the first match (e.g. a prerendered route) cannot serve
   * the request and subsequent matches need to be tried.
   */
  matchAll(inputPathname, { allowWithoutBase = false } = {}) {
    const normalized = getRedirectForPathname(inputPathname);
    if (normalized.redirect) {
      return [];
    }
    const baseResult = stripBase(
      normalized.pathname,
      this.#base,
      this.#baseWithoutTrailingSlash,
      this.#trailingSlash
    );
    if (!baseResult && !allowWithoutBase) {
      return [];
    }
    let pathname = baseResult ?? normalized.pathname;
    if (this.#buildFormat === "file") {
      pathname = normalizeFileFormatPathname(pathname);
    }
    return this.#routes.filter((candidate) => {
      if (candidate.pattern.test(pathname)) return true;
      return candidate.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
    });
  }
}
function normalizeBase(base) {
  if (!base) return "/";
  if (base === "/") return base;
  return prependForwardSlash(base);
}
function getRedirectForPathname(pathname) {
  let value = prependForwardSlash(pathname);
  if (value.startsWith("//")) {
    const collapsed = `/${value.replace(/^\/+/, "")}`;
    return { pathname: value, redirect: collapsed };
  }
  return { pathname: value };
}
function stripBase(pathname, base, baseWithoutTrailingSlash, trailingSlash) {
  if (base === "/") return pathname;
  const baseWithSlash = `${baseWithoutTrailingSlash}/`;
  if (pathname === baseWithoutTrailingSlash || pathname === base) {
    return trailingSlash === "always" ? null : "/";
  }
  if (pathname === baseWithSlash) {
    return trailingSlash === "never" ? null : "/";
  }
  if (pathname.startsWith(baseWithSlash)) {
    return pathname.slice(baseWithoutTrailingSlash.length);
  }
  return null;
}
function normalizeFileFormatPathname(pathname) {
  if (pathname.endsWith("/index.html")) {
    const trimmed = pathname.slice(0, -"/index.html".length);
    return trimmed === "" ? "/" : trimmed;
  }
  if (pathname.endsWith(".html")) {
    const trimmed = pathname.slice(0, -".html".length);
    return trimmed === "" ? "/" : trimmed;
  }
  return pathname;
}

function deserializeManifest(serializedManifest, routesList) {
  const routes = [];
  if (serializedManifest.routes) {
    for (const serializedRoute of serializedManifest.routes) {
      routes.push({
        ...serializedRoute,
        routeData: deserializeRouteData(serializedRoute.routeData)
      });
      const route = serializedRoute;
      route.routeData = deserializeRouteData(serializedRoute.routeData);
    }
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    rootDir: new URL(serializedManifest.rootDir),
    srcDir: new URL(serializedManifest.srcDir),
    publicDir: new URL(serializedManifest.publicDir),
    outDir: new URL(serializedManifest.outDir),
    cacheDir: new URL(serializedManifest.cacheDir),
    buildClientDir: new URL(serializedManifest.buildClientDir),
    buildServerDir: new URL(serializedManifest.buildServerDir),
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    key
  };
}
function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    // This pattern is serialized from Astro's own route manifest.
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin,
    distURL: rawRouteData.distURL
  };
}
function deserializeRouteInfo(rawRouteInfo) {
  return {
    styles: rawRouteInfo.styles,
    file: rawRouteInfo.file,
    links: rawRouteInfo.links,
    scripts: rawRouteInfo.scripts,
    routeData: deserializeRouteData(rawRouteInfo.routeData)
  };
}

class NodePool {
  textPool = [];
  htmlStringPool = [];
  componentPool = [];
  instructionPool = [];
  maxSize;
  enableStats;
  stats = {
    acquireFromPool: 0,
    acquireNew: 0,
    released: 0,
    releasedDropped: 0
  };
  /**
   * Creates a new object pool for queue nodes.
   *
   * @param maxSize - Maximum number of nodes to keep in the pool (default: 1000).
   *   The cap is shared across all typed sub-pools.
   * @param enableStats - Enable statistics tracking (default: false for performance)
   */
  constructor(maxSize = 1e3, enableStats = false) {
    this.maxSize = maxSize;
    this.enableStats = enableStats;
  }
  /**
   * Acquires a queue node from the pool or creates a new one if the pool is empty.
   * Pops from the type-specific sub-pool to reuse an existing object when available.
   *
   * @param type - The type of queue node to acquire
   * @param content - Optional content to set on the node (for text or html-string types)
   * @returns A queue node ready to be populated with data
   */
  acquire(type, content) {
    const pooledNode = this.popFromTypedPool(type);
    if (pooledNode) {
      if (this.enableStats) {
        this.stats.acquireFromPool = this.stats.acquireFromPool + 1;
      }
      this.resetNodeContent(pooledNode, type, content);
      return pooledNode;
    }
    if (this.enableStats) {
      this.stats.acquireNew = this.stats.acquireNew + 1;
    }
    return this.createNode(type, content);
  }
  /**
   * Creates a new node of the specified type with the given content.
   * Helper method to reduce branching in acquire().
   */
  createNode(type, content = "") {
    switch (type) {
      case "text":
        return { type: "text", content };
      case "html-string":
        return { type: "html-string", html: content };
      case "component":
        return { type: "component", instance: void 0 };
      case "instruction":
        return { type: "instruction", instruction: void 0 };
    }
  }
  /**
   * Pops a node from the type-specific sub-pool.
   * Returns undefined if the sub-pool for the requested type is empty.
   */
  popFromTypedPool(type) {
    switch (type) {
      case "text":
        return this.textPool.pop();
      case "html-string":
        return this.htmlStringPool.pop();
      case "component":
        return this.componentPool.pop();
      case "instruction":
        return this.instructionPool.pop();
    }
  }
  /**
   * Resets the content/value field on a reused pooled node.
   * The type discriminant is already correct since we pop from the matching sub-pool.
   */
  resetNodeContent(node, type, content) {
    switch (type) {
      case "text":
        node.content = content ?? "";
        break;
      case "html-string":
        node.html = content ?? "";
        break;
      case "component":
        node.instance = void 0;
        break;
      case "instruction":
        node.instruction = void 0;
        break;
    }
  }
  /**
   * Returns the total number of nodes across all typed sub-pools.
   */
  totalPoolSize() {
    return this.textPool.length + this.htmlStringPool.length + this.componentPool.length + this.instructionPool.length;
  }
  /**
   * Releases a queue node back to the pool for reuse.
   * If the pool is at max capacity, the node is discarded (will be GC'd).
   *
   * @param node - The node to release back to the pool
   */
  release(node) {
    if (this.totalPoolSize() >= this.maxSize) {
      if (this.enableStats) {
        this.stats.releasedDropped = this.stats.releasedDropped + 1;
      }
      return;
    }
    switch (node.type) {
      case "text":
        node.content = "";
        this.textPool.push(node);
        break;
      case "html-string":
        node.html = "";
        this.htmlStringPool.push(node);
        break;
      case "component":
        node.instance = void 0;
        this.componentPool.push(node);
        break;
      case "instruction":
        node.instruction = void 0;
        this.instructionPool.push(node);
        break;
    }
    if (this.enableStats) {
      this.stats.released = this.stats.released + 1;
    }
  }
  /**
   * Releases all nodes in an array back to the pool.
   * This is a convenience method for releasing multiple nodes at once.
   *
   * @param nodes - Array of nodes to release
   */
  releaseAll(nodes) {
    for (const node of nodes) {
      this.release(node);
    }
  }
  /**
   * Clears all typed sub-pools, discarding all cached nodes.
   * This can be useful if you want to free memory after a large render.
   */
  clear() {
    this.textPool.length = 0;
    this.htmlStringPool.length = 0;
    this.componentPool.length = 0;
    this.instructionPool.length = 0;
  }
  /**
   * Gets the current total number of nodes across all typed sub-pools.
   * Useful for monitoring pool usage and tuning maxSize.
   *
   * @returns Number of nodes currently available in the pool
   */
  size() {
    return this.totalPoolSize();
  }
  /**
   * Gets pool statistics for debugging.
   *
   * @returns Pool usage statistics including computed metrics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.totalPoolSize(),
      maxSize: this.maxSize,
      hitRate: this.stats.acquireFromPool + this.stats.acquireNew > 0 ? this.stats.acquireFromPool / (this.stats.acquireFromPool + this.stats.acquireNew) * 100 : 0
    };
  }
  /**
   * Resets pool statistics.
   */
  resetStats() {
    this.stats = {
      acquireFromPool: 0,
      acquireNew: 0,
      released: 0,
      releasedDropped: 0
    };
  }
}

class HTMLStringCache {
  cache = /* @__PURE__ */ new Map();
  maxSize;
  constructor(maxSize = 1e3) {
    this.maxSize = maxSize;
    this.warm(COMMON_HTML_PATTERNS);
  }
  /**
   * Get or create an HTMLString for the given content.
   * If cached, the existing object is returned and moved to end (most recently used).
   * If not cached, a new HTMLString is created, cached, and returned.
   *
   * @param content - The HTML string content
   * @returns HTMLString object (cached or newly created)
   */
  getOrCreate(content) {
    const cached = this.cache.get(content);
    if (cached) {
      this.cache.delete(content);
      this.cache.set(content, cached);
      return cached;
    }
    const htmlString = new HTMLString(content);
    this.cache.set(content, htmlString);
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        this.cache.delete(firstKey);
      }
    }
    return htmlString;
  }
  /**
   * Get current cache size
   */
  size() {
    return this.cache.size;
  }
  /**
   * Pre-warms the cache with common HTML patterns.
   * This ensures first-render cache hits for frequently used tags.
   *
   * @param patterns - Array of HTML strings to pre-cache
   */
  warm(patterns) {
    for (const pattern of patterns) {
      if (!this.cache.has(pattern)) {
        this.cache.set(pattern, new HTMLString(pattern));
      }
    }
  }
  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }
}
const COMMON_HTML_PATTERNS = [
  // Structural elements
  "<div>",
  "</div>",
  "<span>",
  "</span>",
  "<p>",
  "</p>",
  "<section>",
  "</section>",
  "<article>",
  "</article>",
  "<header>",
  "</header>",
  "<footer>",
  "</footer>",
  "<nav>",
  "</nav>",
  "<main>",
  "</main>",
  "<aside>",
  "</aside>",
  // List elements
  "<ul>",
  "</ul>",
  "<ol>",
  "</ol>",
  "<li>",
  "</li>",
  // Void/self-closing elements
  "<br>",
  "<hr>",
  "<br/>",
  "<hr/>",
  // Heading elements
  "<h1>",
  "</h1>",
  "<h2>",
  "</h2>",
  "<h3>",
  "</h3>",
  "<h4>",
  "</h4>",
  // Inline elements
  "<a>",
  "</a>",
  "<strong>",
  "</strong>",
  "<em>",
  "</em>",
  "<code>",
  "</code>",
  // Common whitespace
  " ",
  "\n"
];

const FORBIDDEN_PATH_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
const levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.destination;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
  return log(opts, "info", label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
  return log(opts, "warn", label, message, newLine);
}
function error(opts, label, message, newLine = true) {
  return log(opts, "error", label, message, newLine);
}
function debug(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(s.bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return s.red(prefix.join(" "));
  }
  if (level === "warn") {
    return s.yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return s.dim(prefix[0]);
  }
  return s.dim(prefix[0]) + " " + s.blue(prefix.splice(1).join(" "));
}
class AstroLogger {
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
  setDestination(destination) {
    this.options.destination = destination;
  }
  /**
   * It calls the `close` function of the provided destination, if it exists.
   */
  close() {
    if (this.options.destination.close) {
      this.options.destination.close();
    }
  }
  /**
   * It calls the `flush` function of the provided destination, if it exists.
   */
  flush() {
    if (this.options.destination.flush) {
      this.options.destination.flush();
    }
  }
}
class AstroIntegrationLogger {
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info(this.options, this.label, message);
  }
  warn(message) {
    warn(this.options, this.label, message);
  }
  error(message) {
    error(this.options, this.label, message);
  }
  debug(message) {
    debug(this.label, message);
  }
  /**
   * It calls the `flush` function of the provided destination, if it exists.
   */
  flush() {
    if (this.options.destination.flush) {
      this.options.destination.flush();
    }
  }
  /**
   * It calls the `close` function of the provided destination, if it exists.
   */
  close() {
    if (this.options.destination.close) {
      this.options.destination.close();
    }
  }
}

function matchesLevel(messageLevel, configuredLevel) {
  return levels[messageLevel] >= levels[configuredLevel];
}

function nodeLogDestination(config = {}) {
  const { level = "info" } = config;
  return {
    write(event) {
      let dest = process.stderr;
      if (levels[event.level] < levels["error"]) {
        dest = process.stdout;
      }
      if (!matchesLevel(event.level, level)) {
        return;
      }
      let trailingLine = event.newLine ? "\n" : "";
      if (event.label === "SKIP_FORMAT") {
        dest.write(event.message + trailingLine);
      } else {
        dest.write(getEventPrefix(event) + " " + event.message + trailingLine);
      }
    }
  };
}
function node_default(options) {
  return nodeLogDestination(options);
}

function consoleLogDestination(config = {}) {
  const { level = "info" } = config;
  return {
    write(event) {
      let dest = console.error;
      if (levels[event.level] < levels["error"]) {
        dest = console.info;
      }
      if (!matchesLevel(event.level, level)) {
        return;
      }
      if (event.label === "SKIP_FORMAT") {
        dest(event.message);
      } else {
        dest(getEventPrefix(event) + " " + event.message);
      }
    }
  };
}
function createConsoleLogger({ level }) {
  return new AstroLogger({
    level,
    destination: consoleLogDestination()
  });
}
function console_default(options) {
  return consoleLogDestination(options);
}

const SGR_REGEX = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
function jsonLoggerDestination(config = {}) {
  const { pretty = false, level = "info" } = config;
  return {
    write(event) {
      let dest = process.stderr;
      if (levels[event.level] < levels["error"]) {
        dest = process.stdout;
      }
      if (!matchesLevel(event.level, level)) {
        return;
      }
      let trailingLine = event.newLine ? "\n" : "";
      const message = event.message.replace(SGR_REGEX, "");
      if (pretty) {
        dest.write(
          JSON.stringify({ message, label: event.label, level: event.level }, null, 2) + trailingLine
        );
      } else {
        dest.write(
          JSON.stringify({ message, label: event.label, level: event.level }) + trailingLine
        );
      }
    }
  };
}

function compose(destinations) {
  return {
    write(chunk) {
      for (const logger of destinations) {
        logger.write(chunk);
      }
    },
    flush() {
      for (const logger of destinations) {
        if (logger.flush) {
          logger.flush();
        }
      }
    },
    close() {
      for (const logger of destinations) {
        if (logger.close) {
          logger.close();
        }
      }
    }
  };
}

async function loadLogger(config, level = "info") {
  let cause = void 0;
  try {
    switch (config.entrypoint) {
      case "astro/logger/node": {
        return new AstroLogger({
          destination: node_default(config.config),
          level
        });
      }
      case "astro/logger/console": {
        return new AstroLogger({
          destination: console_default(config.config),
          level
        });
      }
      case "astro/logger/json": {
        return new AstroLogger({
          destination: jsonLoggerDestination(config.config),
          level
        });
      }
      case "astro/logger/compose": {
        let destinations = [];
        if (config.config?.loggers) {
          const loggers = config.config?.loggers;
          destinations = await Promise.all(
            loggers.map(async (loggerConfig) => {
              const logger = await import(
                /* @vite-ignore */
                loggerConfig.entrypoint
              );
              return logger.default(loggerConfig.config);
            })
          );
        }
        return new AstroLogger({
          destination: compose(destinations),
          level
        });
      }
      default: {
        const nodeLogger = await import(
          /* @vite-ignore */
          config.entrypoint
        );
        return new AstroLogger({
          destination: nodeLogger.default(config.config),
          level
        });
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      cause = e;
    }
  }
  const error = new AstroError({
    ...UnableToLoadLogger,
    message: UnableToLoadLogger.message(config.entrypoint)
  });
  if (cause) {
    error.cause = cause;
  }
  throw error;
}

const PipelineFeatures = {
  redirects: 1 << 0,
  sessions: 1 << 1,
  actions: 1 << 2,
  middleware: 1 << 3,
  i18n: 1 << 4,
  cache: 1 << 5
};
const ALL_PIPELINE_FEATURES = PipelineFeatures.redirects | PipelineFeatures.sessions | PipelineFeatures.actions | PipelineFeatures.middleware | PipelineFeatures.i18n | PipelineFeatures.cache;
class Pipeline {
  internalMiddleware;
  resolvedMiddleware = void 0;
  resolvedLogger = false;
  resolvedActions = void 0;
  resolvedSessionDriver = void 0;
  resolvedCacheProvider = void 0;
  compiledCacheRoutes = void 0;
  nodePool;
  htmlStringCache;
  /**
   * Bit mask of pipeline features activated by handler classes.
   * Each handler sets its bit via `|=`. Only meaningful when a
   * custom `src/app.ts` fetch handler is in use.
   */
  usedFeatures = 0;
  logger;
  manifest;
  /**
   * "development" or "production" only
   */
  runtimeMode;
  renderers;
  resolve;
  streaming;
  /**
   * Used to provide better error messages for `Astro.clientAddress`
   */
  adapterName;
  clientDirectives;
  inlinedScripts;
  compressHTML;
  i18n;
  middleware;
  routeCache;
  /**
   * Used for `Astro.site`.
   */
  site;
  /**
   * Array of built-in, internal, routes.
   * Used to find the route module
   */
  defaultRoutes;
  actions;
  sessionDriver;
  cacheProvider;
  cacheConfig;
  serverIslands;
  /** Route data derived from the manifest, used for route matching. */
  manifestData;
  /** Pattern-matching router built from manifestData. */
  #router;
  constructor(logger, manifest, runtimeMode, renderers, resolve, streaming, adapterName = manifest.adapterName, clientDirectives = manifest.clientDirectives, inlinedScripts = manifest.inlinedScripts, compressHTML = manifest.compressHTML, i18n = manifest.i18n, middleware = manifest.middleware, routeCache = new RouteCache(logger, runtimeMode), site = manifest.site ? new URL(manifest.site) : void 0, defaultRoutes = createDefaultRoutes(manifest), actions = manifest.actions, sessionDriver = manifest.sessionDriver, cacheProvider = manifest.cacheProvider, cacheConfig = manifest.cacheConfig, serverIslands = manifest.serverIslandMappings) {
    this.logger = logger;
    this.manifest = manifest;
    this.runtimeMode = runtimeMode;
    this.renderers = renderers;
    this.resolve = resolve;
    this.streaming = streaming;
    this.adapterName = adapterName;
    this.clientDirectives = clientDirectives;
    this.inlinedScripts = inlinedScripts;
    this.compressHTML = compressHTML;
    this.i18n = i18n;
    this.middleware = middleware;
    this.routeCache = routeCache;
    this.site = site;
    this.defaultRoutes = defaultRoutes;
    this.actions = actions;
    this.sessionDriver = sessionDriver;
    this.cacheProvider = cacheProvider;
    this.cacheConfig = cacheConfig;
    this.serverIslands = serverIslands;
    this.manifestData = { routes: (manifest.routes ?? []).map((route) => route.routeData) };
    ensure404Route(this.manifestData);
    this.#router = new Router(this.manifestData.routes, {
      base: manifest.base,
      trailingSlash: manifest.trailingSlash,
      buildFormat: manifest.buildFormat
    });
    this.internalMiddleware = [];
    if (manifest.experimentalQueuedRendering.enabled) {
      this.nodePool = this.createNodePool(
        manifest.experimentalQueuedRendering.poolSize ?? 1e3,
        false
      );
      if (manifest.experimentalQueuedRendering.contentCache) {
        this.htmlStringCache = this.createStringCache();
      }
    }
  }
  /**
   * Low-level route matching against the manifest routes. Returns the
   * matched `RouteData` or `undefined`. Does not filter prerendered
   * routes or check public assets — use `BaseApp.match()` for that.
   */
  matchRoute(pathname) {
    const match = this.#router.match(pathname, { allowWithoutBase: true });
    if (match.type !== "match") return void 0;
    return match.route;
  }
  /**
   * Returns all routes matching the given pathname, in priority order.
   * Used when the first match cannot serve the request (e.g. a
   * prerendered dynamic route that doesn't cover this specific path)
   * and the caller needs to try subsequent matches.
   */
  matchAllRoutes(pathname) {
    return this.#router.matchAll(pathname, { allowWithoutBase: true });
  }
  /**
   * Rebuilds the internal router after routes have been added or
   * removed (e.g. by the dev server on HMR).
   */
  rebuildRouter() {
    this.#router = new Router(this.manifestData.routes, {
      base: this.manifest.base,
      trailingSlash: this.manifest.trailingSlash,
      buildFormat: this.manifest.buildFormat
    });
  }
  /**
   * Resolves the middleware from the manifest, and returns the `onRequest` function. If `onRequest` isn't there,
   * it returns a no-op function
   */
  async getMiddleware() {
    if (this.resolvedMiddleware) {
      return this.resolvedMiddleware;
    }
    if (this.middleware) {
      const middlewareInstance = await this.middleware();
      const onRequest = middlewareInstance.onRequest ?? NOOP_MIDDLEWARE_FN;
      const internalMiddlewares = [onRequest];
      if (this.manifest.checkOrigin) {
        internalMiddlewares.unshift(createOriginCheckMiddleware());
      }
      this.resolvedMiddleware = sequence(...internalMiddlewares);
      return this.resolvedMiddleware;
    } else {
      this.resolvedMiddleware = NOOP_MIDDLEWARE_FN;
      return this.resolvedMiddleware;
    }
  }
  /**
   * Clears the cached middleware so it is re-resolved on the next request.
   * Called via HMR when middleware files change during development.
   */
  clearMiddleware() {
    this.resolvedMiddleware = void 0;
  }
  /**
   * Resolves the logger destination from the manifest and updates the pipeline logger.
   * If the user configured `experimental.logger`, the bundled logger factory is loaded
   * and replaces the default console destination. This is lazy and only resolves once.
   */
  async getLogger() {
    if (this.resolvedLogger) {
      return this.logger;
    }
    this.resolvedLogger = true;
    if (this.manifest.experimentalLogger) {
      this.logger = await loadLogger(this.manifest.experimentalLogger);
    }
    return this.logger;
  }
  async getActions() {
    if (this.resolvedActions) {
      return this.resolvedActions;
    } else if (this.actions) {
      this.resolvedActions = await this.actions();
      return this.resolvedActions;
    }
    return NOOP_ACTIONS_MOD;
  }
  async getSessionDriver() {
    if (this.resolvedSessionDriver !== void 0) {
      return this.resolvedSessionDriver;
    }
    if (this.sessionDriver) {
      const driverModule = await this.sessionDriver();
      this.resolvedSessionDriver = driverModule?.default || null;
      return this.resolvedSessionDriver;
    }
    this.resolvedSessionDriver = null;
    return null;
  }
  async getCacheProvider() {
    if (this.resolvedCacheProvider !== void 0) {
      return this.resolvedCacheProvider;
    }
    if (this.cacheProvider) {
      const mod = await this.cacheProvider();
      const factory = mod?.default || null;
      this.resolvedCacheProvider = factory ? factory(this.cacheConfig?.options) : null;
      return this.resolvedCacheProvider;
    }
    this.resolvedCacheProvider = null;
    return null;
  }
  async getServerIslands() {
    if (this.serverIslands) {
      return this.serverIslands();
    }
    return {
      serverIslandMap: /* @__PURE__ */ new Map(),
      serverIslandNameMap: /* @__PURE__ */ new Map()
    };
  }
  async getAction(path) {
    const pathKeys = path.split(".").map((key) => decodeURIComponent(key));
    let { server } = await this.getActions();
    if (!server || !(typeof server === "object")) {
      throw new TypeError(
        `Expected \`server\` export in actions file to be an object. Received ${typeof server}.`
      );
    }
    for (const key of pathKeys) {
      if (FORBIDDEN_PATH_KEYS.has(key)) {
        throw new AstroError({
          ...ActionNotFoundError,
          message: ActionNotFoundError.message(pathKeys.join("."))
        });
      }
      if (!Object.hasOwn(server, key)) {
        throw new AstroError({
          ...ActionNotFoundError,
          message: ActionNotFoundError.message(pathKeys.join("."))
        });
      }
      server = server[key];
    }
    if (typeof server !== "function") {
      throw new TypeError(
        `Expected handler for action ${pathKeys.join(".")} to be a function. Received ${typeof server}.`
      );
    }
    return server;
  }
  async getModuleForRoute(route) {
    for (const defaultRoute of this.defaultRoutes) {
      if (route.component === defaultRoute.component) {
        return {
          page: () => Promise.resolve(defaultRoute.instance)
        };
      }
    }
    if (route.type === "redirect") {
      return RedirectSinglePageBuiltModule;
    } else {
      if (this.manifest.pageMap) {
        const importComponentInstance = this.manifest.pageMap.get(route.component);
        if (!importComponentInstance) {
          throw new Error(
            `Unexpectedly unable to find a component instance for route ${route.route}`
          );
        }
        return await importComponentInstance();
      } else if (this.manifest.pageModule) {
        return this.manifest.pageModule;
      }
      throw new Error(
        "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
      );
    }
  }
  createNodePool(poolSize, stats) {
    return new NodePool(poolSize, stats);
  }
  createStringCache() {
    return new HTMLStringCache(1e3);
  }
}

function getFunctionExpression(slot) {
  if (!slot) return;
  const expressions = slot?.expressions?.filter(
    (e) => isRenderInstruction(e) === false || isRenderTemplateResult(e)
  );
  if (expressions?.length !== 1) return;
  const expression = expressions[0];
  if (isRenderTemplateResult(expression)) {
    return getFunctionExpression(expression);
  }
  return expression;
}
class Slots {
  #result;
  #slots;
  #logger;
  constructor(result, slots, logger) {
    this.#result = result;
    this.#slots = slots;
    this.#logger = logger;
    if (slots) {
      for (const key of Object.keys(slots)) {
        if (this[key] !== void 0) {
          throw new AstroError({
            ...ReservedSlotName,
            message: ReservedSlotName.message(key)
          });
        }
        Object.defineProperty(this, key, {
          get() {
            return true;
          },
          enumerable: true
        });
      }
    }
  }
  has(name) {
    if (!this.#slots) return false;
    return Boolean(this.#slots[name]);
  }
  async render(name, args = []) {
    if (!this.#slots || !this.has(name)) return;
    const result = this.#result;
    if (!Array.isArray(args)) {
      this.#logger.warn(
        null,
        `Expected second parameter to be an array, received a ${typeof args}. If you're trying to pass an array as a single argument and getting unexpected results, make sure you're passing your array as an item of an array. Ex: Astro.slots.render('default', [["Hello", "World"]])`
      );
    } else if (args.length > 0) {
      const slotValue = this.#slots[name];
      const component = typeof slotValue === "function" ? await slotValue(result) : await slotValue;
      const expression = getFunctionExpression(component);
      if (expression) {
        const slot = async () => typeof expression === "function" ? expression(...args) : expression;
        return await renderSlotToString(result, slot).then((res) => {
          return res;
        });
      }
      if (typeof component === "function") {
        return await renderJSX(result, component(...args)).then(
          (res) => res != null ? String(res) : res
        );
      }
    }
    const content = await renderSlotToString(result, this.#slots[name]);
    const outHTML = chunkToString(result, content);
    return outHTML;
  }
}

function deduplicateDirectiveValues(existingDirective, newDirective) {
  const [directiveName, ...existingValues] = existingDirective.split(/\s+/).filter(Boolean);
  const [newDirectiveName, ...newValues] = newDirective.split(/\s+/).filter(Boolean);
  if (directiveName !== newDirectiveName) {
    return void 0;
  }
  const finalDirectives = Array.from(/* @__PURE__ */ new Set([...existingValues, ...newValues]));
  return `${directiveName} ${finalDirectives.join(" ")}`;
}
function pushDirective(directives, newDirective) {
  if (directives.length === 0) {
    return [newDirective];
  }
  const finalDirectives = [];
  let matched = false;
  for (const directive of directives) {
    if (matched) {
      finalDirectives.push(directive);
      continue;
    }
    const result = deduplicateDirectiveValues(directive, newDirective);
    if (result) {
      finalDirectives.push(result);
      matched = true;
    } else {
      finalDirectives.push(directive);
    }
  }
  if (!matched) {
    finalDirectives.push(newDirective);
  }
  return finalDirectives;
}

function parseLocale(header) {
  if (header === "*") {
    return [{ locale: header, qualityValue: void 0 }];
  }
  const result = [];
  const localeValues = header.split(",").map((str) => str.trim());
  for (const localeValue of localeValues) {
    const split = localeValue.split(";").map((str) => str.trim());
    const localeName = split[0];
    const qualityValue = split[1];
    if (!split) {
      continue;
    }
    if (qualityValue && qualityValue.startsWith("q=")) {
      const qualityValueAsFloat = Number.parseFloat(qualityValue.slice("q=".length));
      if (Number.isNaN(qualityValueAsFloat) || qualityValueAsFloat > 1) {
        result.push({
          locale: localeName,
          qualityValue: void 0
        });
      } else {
        result.push({
          locale: localeName,
          qualityValue: qualityValueAsFloat
        });
      }
    } else {
      result.push({
        locale: localeName,
        qualityValue: void 0
      });
    }
  }
  return result;
}
function sortAndFilterLocales(browserLocaleList, locales) {
  const normalizedLocales = getAllCodes(locales).map(normalizeTheLocale);
  return browserLocaleList.filter((browserLocale) => {
    if (browserLocale.locale !== "*") {
      return normalizedLocales.includes(normalizeTheLocale(browserLocale.locale));
    }
    return true;
  }).sort((a, b) => {
    if (a.qualityValue && b.qualityValue) {
      return Math.sign(b.qualityValue - a.qualityValue);
    }
    return 0;
  });
}
function computePreferredLocale(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = void 0;
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    const firstResult = browserLocaleList.at(0);
    if (firstResult && firstResult.locale !== "*") {
      outer: for (const currentLocale of locales) {
        if (typeof currentLocale === "string") {
          if (normalizeTheLocale(currentLocale) === normalizeTheLocale(firstResult.locale)) {
            result = currentLocale;
            break;
          }
        } else {
          for (const currentCode of currentLocale.codes) {
            if (normalizeTheLocale(currentCode) === normalizeTheLocale(firstResult.locale)) {
              result = currentCode;
              break outer;
            }
          }
        }
      }
    }
  }
  return result;
}
function computePreferredLocaleList(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = [];
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    if (browserLocaleList.length === 1 && browserLocaleList.at(0).locale === "*") {
      return getAllCodes(locales);
    } else if (browserLocaleList.length > 0) {
      for (const browserLocale of browserLocaleList) {
        for (const loopLocale of locales) {
          if (typeof loopLocale === "string") {
            if (normalizeTheLocale(loopLocale) === normalizeTheLocale(browserLocale.locale)) {
              result.push(loopLocale);
            }
          } else {
            for (const code of loopLocale.codes) {
              if (code === browserLocale.locale) {
                result.push(code);
              }
            }
          }
        }
      }
    }
  }
  return result;
}
function computeCurrentLocale(pathname, locales, defaultLocale) {
  for (const segment of pathname.split("/").map(normalizeThePath)) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (!segment.includes(locale)) continue;
        if (normalizeTheLocale(locale) === normalizeTheLocale(segment)) {
          return locale;
        }
      } else {
        if (locale.path === segment) {
          return locale.codes.at(0);
        } else {
          for (const code of locale.codes) {
            if (normalizeTheLocale(code) === normalizeTheLocale(segment)) {
              return code;
            }
          }
        }
      }
    }
  }
  for (const locale of locales) {
    if (typeof locale === "string") {
      if (locale === defaultLocale) {
        return locale;
      }
    } else {
      if (locale.path === defaultLocale) {
        return locale.codes.at(0);
      }
    }
  }
}
function computeCurrentLocaleFromParams(params, locales) {
  const byNormalizedCode = /* @__PURE__ */ new Map();
  const byPath = /* @__PURE__ */ new Map();
  for (const locale of locales) {
    if (typeof locale === "string") {
      byNormalizedCode.set(normalizeTheLocale(locale), locale);
    } else {
      byPath.set(locale.path, locale.codes[0]);
      for (const code of locale.codes) {
        byNormalizedCode.set(normalizeTheLocale(code), code);
      }
    }
  }
  for (const value of Object.values(params)) {
    if (!value) continue;
    const pathMatch = byPath.get(value);
    if (pathMatch) return pathMatch;
    const codeMatch = byNormalizedCode.get(normalizeTheLocale(value));
    if (codeMatch) return codeMatch;
  }
}

async function callMiddleware(onRequest, apiContext, responseFunction) {
  let nextCalled = false;
  let responseFunctionPromise = void 0;
  const next = async (payload) => {
    nextCalled = true;
    responseFunctionPromise = responseFunction(apiContext, payload);
    return responseFunctionPromise;
  };
  const middlewarePromise = onRequest(apiContext, next);
  return await Promise.resolve(middlewarePromise).then(async (value) => {
    if (nextCalled) {
      if (typeof value !== "undefined") {
        if (value instanceof Response === false) {
          throw new AstroError(MiddlewareNotAResponse);
        }
        return value;
      } else {
        if (responseFunctionPromise) {
          return responseFunctionPromise;
        } else {
          throw new AstroError(MiddlewareNotAResponse);
        }
      }
    } else if (typeof value === "undefined") {
      throw new AstroError(MiddlewareNoDataOrNextCalled);
    } else if (value instanceof Response === false) {
      throw new AstroError(MiddlewareNotAResponse);
    } else {
      return value;
    }
  });
}

const EMPTY_OPTIONS = Object.freeze({ tags: [] });
class NoopAstroCache {
  enabled = false;
  set() {
  }
  get tags() {
    return [];
  }
  get options() {
    return EMPTY_OPTIONS;
  }
  async invalidate() {
  }
}
let hasWarned = false;
class DisabledAstroCache {
  enabled = false;
  #logger;
  constructor(logger) {
    this.#logger = logger;
  }
  #warn() {
    if (!hasWarned) {
      hasWarned = true;
      this.#logger?.warn(
        "cache",
        "`cache.set()` was called but caching is not enabled. Configure a cache provider in your Astro config under `experimental.cache` to enable caching."
      );
    }
  }
  set() {
    this.#warn();
  }
  get tags() {
    return [];
  }
  get options() {
    return EMPTY_OPTIONS;
  }
  async invalidate() {
    throw new AstroError(CacheNotEnabled);
  }
}

class AstroMiddleware {
  #pipeline;
  constructor(pipeline) {
    this.#pipeline = pipeline;
  }
  async handle(state, renderRouteCallback) {
    state.pipeline.usedFeatures |= PipelineFeatures.middleware;
    const pipeline = this.#pipeline;
    await state.getProps();
    const apiContext = state.getAPIContext();
    state.counter++;
    if (state.counter === 4) {
      return new Response("Loop Detected", {
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
        status: 508,
        statusText: "Astro detected a loop where you tried to call the rewriting logic more than four times."
      });
    }
    const next = async (ctx, payload) => {
      if (payload) {
        pipeline.logger.debug("router", "Called rewriting to:", payload);
        const result = await pipeline.tryRewrite(payload, state.request);
        applyRewriteToState(state, payload, result);
      }
      return renderRouteCallback(state, ctx);
    };
    let response;
    if (state.skipMiddleware) {
      response = await next(apiContext);
    } else {
      const pipelineMiddleware = await pipeline.getMiddleware();
      const composed = sequence(...pipeline.internalMiddleware, pipelineMiddleware);
      response = await callMiddleware(composed, apiContext, next);
    }
    response = this.#finalize(state, response);
    state.response = response;
    return response;
  }
  #finalize(state, response) {
    attachCookiesToResponse(response, state.cookies);
    return response;
  }
}

const EMPTY_SLOTS = Object.freeze({});
class PagesHandler {
  #pipeline;
  constructor(pipeline) {
    this.#pipeline = pipeline;
  }
  async handle(state, ctx) {
    const pipeline = this.#pipeline;
    const { logger, streaming } = pipeline;
    let response;
    const componentInstance = await state.loadComponentInstance();
    switch (state.routeData.type) {
      case "endpoint": {
        response = await renderEndpoint(
          componentInstance,
          ctx,
          state.routeData.prerender,
          logger
        );
        break;
      }
      case "page": {
        const props = await state.getProps();
        const actionApiContext = state.getActionAPIContext();
        const result = await state.createResult(componentInstance, actionApiContext);
        try {
          response = await renderPage(
            result,
            componentInstance?.default,
            props,
            state.slots ?? EMPTY_SLOTS,
            streaming,
            state.routeData
          );
        } catch (e) {
          result.cancelled = true;
          throw e;
        }
        response.headers.set(ROUTE_TYPE_HEADER, "page");
        if (state.routeData.route === "/404" || state.routeData.route === "/500") {
          response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
        }
        if (state.isRewriting) {
          response.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
        }
        break;
      }
      case "redirect": {
        return new Response(null, { status: 404, headers: { [ASTRO_ERROR_HEADER]: "true" } });
      }
      case "fallback": {
        return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: "fallback" } });
      }
    }
    const responseCookies = getCookiesFromResponse(response);
    if (responseCookies) {
      state.cookies.merge(responseCookies);
    }
    state.response = response;
    return response;
  }
}

function createNormalizedUrl(requestUrl) {
  return normalizeUrl(new URL(requestUrl));
}
function normalizeUrl(url) {
  try {
    url.pathname = validateAndDecodePathname(url.pathname);
  } catch {
    try {
      url.pathname = decodeURI(url.pathname);
    } catch {
    }
  }
  url.pathname = collapseDuplicateSlashes(url.pathname);
  return url;
}

function applyRewriteToState(state, payload, { routeData, componentInstance, newUrl, pathname }, { mergeCookies = false } = {}) {
  const pipeline = state.pipeline;
  const oldPathname = state.pathname;
  const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
  if (pipeline.manifest.serverLike && !state.routeData.prerender && routeData.prerender && !isI18nFallback) {
    throw new AstroError({
      ...ForbiddenRewrite,
      message: ForbiddenRewrite.message(state.pathname, pathname, routeData.component),
      hint: ForbiddenRewrite.hint(routeData.component)
    });
  }
  state.routeData = routeData;
  state.componentInstance = componentInstance;
  if (payload instanceof Request) {
    state.request = payload;
  } else {
    state.request = copyRequest(
      newUrl,
      state.request,
      routeData.prerender,
      pipeline.logger,
      state.routeData.route
    );
  }
  state.url = createNormalizedUrl(state.request.url);
  if (mergeCookies) {
    const newCookies = new AstroCookies(state.request);
    if (state.cookies) {
      newCookies.merge(state.cookies);
    }
    state.cookies = newCookies;
  }
  state.params = getParams(routeData, pathname);
  state.pathname = pathname;
  state.isRewriting = true;
  state.status = 200;
  setOriginPathname(
    state.request,
    oldPathname,
    pipeline.manifest.trailingSlash,
    pipeline.manifest.buildFormat
  );
  state.invalidateContexts();
}
class Rewrites {
  async execute(state, payload) {
    const pipeline = state.pipeline;
    pipeline.logger.debug("router", "Calling rewrite: ", payload);
    const result = await pipeline.tryRewrite(payload, state.request);
    applyRewriteToState(state, payload, result, { mergeCookies: true });
    const middleware = new AstroMiddleware(pipeline);
    const pagesHandler = new PagesHandler(pipeline);
    return middleware.handle(state, pagesHandler.handle.bind(pagesHandler));
  }
}

function matchRoute(pathname, manifest) {
  if (isRoute404(pathname)) {
    const errorRoute = manifest.routes.find((route) => isRoute404(route.route));
    if (errorRoute) return errorRoute;
  }
  if (isRoute500(pathname)) {
    const errorRoute = manifest.routes.find((route) => isRoute500(route.route));
    if (errorRoute) return errorRoute;
  }
  return manifest.routes.find((route) => {
    return route.pattern.test(pathname) || route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
  });
}
function isRoute404or500(route) {
  return isRoute404(route.route) || isRoute500(route.route);
}
function isRouteServerIsland(route) {
  return route.component === SERVER_ISLAND_COMPONENT;
}

const renderOptionsSymbol = /* @__PURE__ */ Symbol.for("astro.renderOptions");
function getRenderOptions(request) {
  return Reflect.get(request, renderOptionsSymbol);
}
function setRenderOptions(request, options) {
  Reflect.set(request, renderOptionsSymbol, options);
}

function getFirstForwardedValue(multiValueHeader) {
  return multiValueHeader?.toString().split(",").map((e) => e.trim())[0];
}
function sanitizeHost(hostname) {
  if (!hostname) return void 0;
  if (/[/\\]/.test(hostname)) return void 0;
  return hostname;
}
function parseHost(host) {
  const parts = host.split(":");
  return {
    hostname: parts[0],
    port: parts[1]
  };
}
function matchesAllowedDomains(hostname, protocol, port, allowedDomains) {
  const hostWithPort = port ? `${hostname}:${port}` : hostname;
  const urlString = `${protocol}://${hostWithPort}`;
  if (!URL.canParse(urlString)) {
    return false;
  }
  const testUrl = new URL(urlString);
  return allowedDomains.some((pattern) => matchPattern$1(testUrl, pattern));
}
function validateHost(host, protocol, allowedDomains) {
  if (!host || host.length === 0) return void 0;
  if (!allowedDomains || allowedDomains.length === 0) return void 0;
  const sanitized = sanitizeHost(host);
  if (!sanitized) return void 0;
  const { hostname, port } = parseHost(sanitized);
  if (matchesAllowedDomains(hostname, protocol, port, allowedDomains)) {
    return sanitized;
  }
  return void 0;
}
function validateForwardedHeaders(forwardedProtocol, forwardedHost, forwardedPort, allowedDomains) {
  const result = {};
  if (forwardedProtocol) {
    if (allowedDomains && allowedDomains.length > 0) {
      const hasProtocolPatterns = allowedDomains.some((pattern) => pattern.protocol !== void 0);
      if (hasProtocolPatterns) {
        try {
          const testUrl = new URL(`${forwardedProtocol}://example.com`);
          const isAllowed = allowedDomains.some(
            (pattern) => matchPattern$1(testUrl, { protocol: pattern.protocol })
          );
          if (isAllowed) {
            result.protocol = forwardedProtocol;
          }
        } catch {
        }
      } else if (/^https?$/.test(forwardedProtocol)) {
        result.protocol = forwardedProtocol;
      }
    }
  }
  if (forwardedPort && allowedDomains && allowedDomains.length > 0) {
    const hasPortPatterns = allowedDomains.some((pattern) => pattern.port !== void 0);
    if (hasPortPatterns) {
      const isAllowed = allowedDomains.some((pattern) => pattern.port === forwardedPort);
      if (isAllowed) {
        result.port = forwardedPort;
      }
    }
  }
  if (forwardedHost && forwardedHost.length > 0 && allowedDomains && allowedDomains.length > 0) {
    const protoForValidation = result.protocol || "https";
    const sanitized = sanitizeHost(forwardedHost);
    if (sanitized) {
      const { hostname, port: portFromHost } = parseHost(sanitized);
      const portForValidation = result.port || portFromHost;
      if (matchesAllowedDomains(hostname, protoForValidation, portForValidation, allowedDomains)) {
        result.host = sanitized;
      }
    }
  }
  return result;
}

class FetchState {
  pipeline;
  /**
   * The request to render. Mutated during rewrites so subsequent renders
   * see the rewritten URL.
   */
  request;
  routeData;
  /**
   * The pathname to use for routing and rendering. Starts out as the raw,
   * base-stripped, decoded pathname from the request. May be further
   * normalized by `AstroHandler` after routeData is known (in dev, when
   * the matched route has no `.html` extension, `.html` / `/index.html`
   * suffixes are stripped).
   */
  pathname;
  /** Resolved render options (addCookieHeader, clientAddress, locals, etc.). */
  renderOptions;
  /** When the request started, used to log duration. */
  timeStart;
  /**
   * The route's loaded component module. Set before middleware runs; may
   * be swapped during in-flight rewrites from inside the middleware chain.
   */
  componentInstance;
  /**
   * Slot overrides supplied by the container API. `undefined` for HTTP
   * requests — `PagesHandler` coalesces to `{}` on read so we don't
   * allocate an empty object per request.
   */
  slots;
  /**
   * The `Response` produced by handlers, if any. Set after page
   * rendering or middleware completes.
   */
  response;
  /**
   * Default HTTP status for the rendered response. Callers override
   * before rendering runs (e.g. `AstroHandler` sets this from
   * `BaseApp.getDefaultStatusCode`; error handlers set `404` / `500`).
   */
  status = 200;
  /** Whether user middleware should be skipped for this request. */
  skipMiddleware = false;
  /**
   * Set to `true` when the request path was encoded too many times to fully
   * decode (see {@link validateAndDecodePathname}). These requests are
   * rejected with a `400` before middleware or routing run.
   */
  invalidEncoding = false;
  /** A flag that tells the render content if the rewriting was triggered. */
  isRewriting = false;
  /** A safety net in case of loops (rewrite counter). */
  counter = 0;
  /** Cookies for this request. Created lazily on first access. */
  cookies;
  /** Route params derived from routeData + pathname. Computed lazily. */
  #params;
  get params() {
    if (!this.#params && this.routeData) {
      this.#params = getParams(this.routeData, this.pathname);
    }
    return this.#params;
  }
  set params(value) {
    this.#params = value;
  }
  /** Normalized URL for this request. */
  url;
  /** Client address for this request. */
  clientAddress;
  /** Whether this is a partial render (container API). */
  partial;
  /** Whether to inject CSP meta tags. */
  shouldInjectCspMetaTags;
  /** Request-scoped locals object, shared with user middleware. */
  locals = {};
  /**
   * Memoized `props` (see `getProps`). `null` means "not yet computed"
   * — using `null` (rather than `undefined`) keeps the hidden class
   * stable and distinct from a valid-but-empty result.
   */
  props = null;
  /** Memoized `ActionAPIContext` (see `getActionAPIContext`). */
  actionApiContext = null;
  /** Memoized `APIContext` (see `getAPIContext`). */
  apiContext = null;
  /** Registered context providers keyed by name. Lazy-initialized on first provide(). */
  #providers;
  /** Cached values from resolved providers. Lazy-initialized on first resolve(). */
  #providersResolvedValues;
  /** Cached promise for lazy component instance loading. */
  #componentInstancePromise;
  /** SSR result for the current page render. */
  result;
  /** Initial props (from container/error handler). */
  initialProps = {};
  /** Rewrites handler instance. Lazy-initialized on first rewrite(). */
  #rewrites;
  /** Memoized Astro page partial. */
  #astroPagePartial;
  /**
   * Locale-prefixed pathname derived from the Host header for domain-based
   * i18n routing (e.g. `/en/boats/1/foo`), or `undefined` when the request
   * isn't served from a locale-mapped domain. When set, `this.pathname` is
   * derived from it so locale/param resolution match the route pattern.
   */
  #domainPathname;
  /** Memoized current locale. */
  #currentLocale;
  /** Memoized preferred locale. */
  #preferredLocale;
  /** Memoized preferred locale list. */
  #preferredLocaleList;
  constructor(pipeline, request, options) {
    this.pipeline = pipeline;
    this.request = request;
    options ??= getRenderOptions(request);
    this.routeData = options?.routeData;
    this.renderOptions = options ?? {
      addCookieHeader: false,
      clientAddress: void 0,
      locals: void 0,
      prerenderedErrorPageFetch: fetch,
      routeData: void 0,
      waitUntil: void 0
    };
    this.componentInstance = void 0;
    this.slots = void 0;
    const url = new URL(request.url);
    const domainPathname = computePathnameFromDomain(
      request,
      url,
      pipeline.manifest.i18n,
      pipeline.manifest.base,
      pipeline.manifest.trailingSlash,
      pipeline.logger
    );
    if (domainPathname) {
      this.#domainPathname = domainPathname;
      try {
        this.pathname = decodeURI(domainPathname);
      } catch {
        this.pathname = domainPathname;
      }
    } else {
      this.pathname = this.#computePathname(url);
    }
    this.timeStart = performance.now();
    this.clientAddress = options?.clientAddress;
    this.locals = options?.locals ?? {};
    this.url = normalizeUrl(url);
    this.cookies = new AstroCookies(request);
    if (pipeline.manifest.allowedDomains && pipeline.manifest.allowedDomains.length > 0) {
      this.#applyForwardedHeaders();
    }
    if (!Reflect.get(this.request, originPathnameSymbol)) {
      setOriginPathname(
        this.request,
        this.pathname,
        pipeline.manifest.trailingSlash,
        pipeline.manifest.buildFormat
      );
    }
    this.#resolveRouteData();
  }
  /**
   * Triggers a rewrite. Delegates to the Rewrites handler.
   */
  rewrite(payload) {
    return (this.#rewrites ??= new Rewrites()).execute(this, payload);
  }
  /**
   * Creates the SSR result for the current page render.
   */
  async createResult(mod, ctx) {
    const pipeline = this.pipeline;
    const { clientDirectives, inlinedScripts, compressHTML, manifest, renderers, resolve } = pipeline;
    const routeData = this.routeData;
    const { links, scripts, styles } = await pipeline.headElements(routeData);
    const extraStyleHashes = [];
    const extraScriptHashes = [];
    const shouldInjectCspMetaTags = this.shouldInjectCspMetaTags ?? manifest.shouldInjectCspMetaTags;
    const cspAlgorithm = manifest.csp?.algorithm ?? "SHA-256";
    if (shouldInjectCspMetaTags) {
      for (const style of styles) {
        extraStyleHashes.push(await generateCspDigest(style.children, cspAlgorithm));
      }
      for (const script of scripts) {
        extraScriptHashes.push(await generateCspDigest(script.children, cspAlgorithm));
      }
    }
    const componentMetadata = await pipeline.componentMetadata(routeData) ?? manifest.componentMetadata;
    const headers = new Headers({ "Content-Type": "text/html" });
    const partial = typeof this.partial === "boolean" ? this.partial : Boolean(mod.partial);
    const actionResult = hasActionPayload(this.locals) ? deserializeActionResult(this.locals._actionPayload.actionResult) : void 0;
    const status = this.status;
    const response = {
      status: actionResult?.error ? actionResult?.error.status : status,
      statusText: actionResult?.error ? actionResult?.error.type : "OK",
      get headers() {
        return headers;
      },
      set headers(_) {
        throw new AstroError(AstroResponseHeadersReassigned);
      }
    };
    const state = this;
    const result = {
      base: manifest.base,
      userAssetsBase: manifest.userAssetsBase,
      cancelled: false,
      clientDirectives,
      inlinedScripts,
      componentMetadata,
      compressHTML,
      cookies: this.cookies,
      createAstro: (props, slots) => state.createAstro(result, props, slots, ctx),
      links,
      // SAFETY: createResult is only called after route resolution, so routeData
      // is always set and the params getter always returns a value.
      params: this.params,
      partial,
      pathname: this.pathname,
      renderers,
      resolve,
      response,
      request: this.request,
      scripts,
      styles,
      actionResult,
      async getServerIslandNameMap() {
        const serverIslands = await pipeline.getServerIslands();
        return serverIslands.serverIslandNameMap ?? /* @__PURE__ */ new Map();
      },
      key: manifest.key,
      trailingSlash: manifest.trailingSlash,
      _experimentalQueuedRendering: {
        pool: pipeline.nodePool,
        htmlStringCache: pipeline.htmlStringCache,
        enabled: manifest.experimentalQueuedRendering?.enabled,
        poolSize: manifest.experimentalQueuedRendering?.poolSize,
        contentCache: manifest.experimentalQueuedRendering?.contentCache
      },
      _metadata: {
        hasHydrationScript: false,
        rendererSpecificHydrationScripts: /* @__PURE__ */ new Set(),
        hasRenderedHead: false,
        renderedScripts: /* @__PURE__ */ new Set(),
        hasDirectives: /* @__PURE__ */ new Set(),
        hasRenderedServerIslandRuntime: false,
        headInTree: false,
        extraHead: [],
        extraStyleHashes,
        extraScriptHashes,
        propagators: /* @__PURE__ */ new Set(),
        templateDepth: 0
      },
      cspDestination: manifest.csp?.cspDestination ?? (routeData.prerender ? "meta" : "header"),
      shouldInjectCspMetaTags,
      cspAlgorithm,
      scriptHashes: manifest.csp?.scriptHashes ? [...manifest.csp.scriptHashes] : [],
      scriptResources: manifest.csp?.scriptResources ? [...manifest.csp.scriptResources] : [],
      styleHashes: manifest.csp?.styleHashes ? [...manifest.csp.styleHashes] : [],
      styleResources: manifest.csp?.styleResources ? [...manifest.csp.styleResources] : [],
      directives: manifest.csp?.directives ? [...manifest.csp.directives] : [],
      isStrictDynamic: manifest.csp?.isStrictDynamic ?? false,
      internalFetchHeaders: manifest.internalFetchHeaders
    };
    this.result = result;
    return result;
  }
  /**
   * Creates the Astro global object for a component render.
   */
  createAstro(result, props, slotValues, apiContext) {
    let astroPagePartial;
    if (this.isRewriting) {
      this.#astroPagePartial = this.createAstroPagePartial(result, apiContext);
    }
    this.#astroPagePartial ??= this.createAstroPagePartial(result, apiContext);
    astroPagePartial = this.#astroPagePartial;
    const astroComponentPartial = { props, self: null };
    const Astro = Object.assign(
      Object.create(astroPagePartial),
      astroComponentPartial
    );
    let _slots;
    Object.defineProperty(Astro, "slots", {
      get: () => {
        if (!_slots) {
          _slots = new Slots(
            result,
            slotValues,
            this.pipeline.logger
          );
        }
        return _slots;
      }
    });
    return Astro;
  }
  /**
   * Creates the Astro page-level partial (prototype for Astro global).
   */
  createAstroPagePartial(result, apiContext) {
    const state = this;
    const { cookies, locals, params, pipeline, url } = this;
    const { response } = result;
    const redirect = (path, status = 302) => {
      if (state.request[responseSentSymbol$1]) {
        throw new AstroError({
          ...ResponseSentError
        });
      }
      return new Response(null, { status, headers: { Location: path } });
    };
    const rewrite = async (reroutePayload) => {
      return await state.rewrite(reroutePayload);
    };
    const callAction = createCallAction(apiContext);
    const partial = {
      generator: ASTRO_GENERATOR,
      routePattern: this.routeData.route,
      isPrerendered: this.routeData.prerender,
      cookies,
      get clientAddress() {
        return state.getClientAddress();
      },
      get currentLocale() {
        return state.computeCurrentLocale();
      },
      params,
      get preferredLocale() {
        return state.computePreferredLocale();
      },
      get preferredLocaleList() {
        return state.computePreferredLocaleList();
      },
      locals,
      redirect,
      rewrite,
      request: this.request,
      response,
      site: pipeline.site,
      getActionResult: createGetActionResult(locals),
      get callAction() {
        return callAction;
      },
      url,
      get originPathname() {
        return getOriginPathname(state.request);
      },
      get csp() {
        return state.getCsp();
      },
      get logger() {
        return {
          info(msg) {
            pipeline.logger.info(null, msg);
          },
          warn(msg) {
            pipeline.logger.warn(null, msg);
          },
          error(msg) {
            pipeline.logger.error(null, msg);
          }
        };
      }
    };
    this.defineProviderGetters(partial);
    return partial;
  }
  getClientAddress() {
    const { pipeline, clientAddress } = this;
    const routeData = this.routeData;
    if (routeData.prerender) {
      throw new AstroError({
        ...PrerenderClientAddressNotAvailable,
        message: PrerenderClientAddressNotAvailable.message(routeData.component)
      });
    }
    if (clientAddress) {
      return clientAddress;
    }
    if (pipeline.adapterName) {
      throw new AstroError({
        ...ClientAddressNotAvailable,
        message: ClientAddressNotAvailable.message(pipeline.adapterName)
      });
    }
    throw new AstroError(StaticClientAddressNotAvailable);
  }
  getCookies() {
    return this.cookies;
  }
  getCsp() {
    const state = this;
    const { pipeline } = this;
    if (!pipeline.manifest.csp) {
      if (pipeline.runtimeMode === "production") {
        pipeline.logger.warn(
          "csp",
          `context.csp was used when rendering the route ${s.green(state.routeData.route)}, but CSP was not configured. For more information, see https://docs.astro.build/en/reference/configuration-reference/#securitycsp`
        );
      }
      return void 0;
    }
    return {
      insertDirective(payload) {
        if (state.result) {
          state.result.directives = pushDirective(state.result.directives, payload);
        }
      },
      insertScriptResource(resource) {
        state.result?.scriptResources.push(resource);
      },
      insertStyleResource(resource) {
        state.result?.styleResources.push(resource);
      },
      insertStyleHash(hash) {
        state.result?.styleHashes.push(hash);
      },
      insertScriptHash(hash) {
        state.result?.scriptHashes.push(hash);
      }
    };
  }
  computeCurrentLocale() {
    const {
      url,
      pipeline: { i18n },
      routeData
    } = this;
    if (!i18n || !routeData) return;
    const { defaultLocale, locales, strategy } = i18n;
    const fallbackTo = strategy === "pathname-prefix-other-locales" || strategy === "domains-prefix-other-locales" ? defaultLocale : void 0;
    if (this.#currentLocale) {
      return this.#currentLocale;
    }
    let computedLocale;
    if (isRouteServerIsland(routeData)) {
      let referer = this.request.headers.get("referer");
      if (referer) {
        if (URL.canParse(referer)) {
          referer = new URL(referer).pathname;
        }
        computedLocale = computeCurrentLocale(referer, locales, defaultLocale);
      }
    } else {
      let pathname = routeData.pathname;
      if (this.#domainPathname) {
        pathname = this.pathname;
      } else if (url && !routeData.pattern.test(url.pathname)) {
        for (const fallbackRoute of routeData.fallbackRoutes) {
          if (fallbackRoute.pattern.test(url.pathname)) {
            pathname = fallbackRoute.pathname;
            break;
          }
        }
      }
      pathname = pathname && !isRoute404or500(routeData) ? pathname : url.pathname ?? this.pathname;
      computedLocale = computeCurrentLocale(pathname, locales, defaultLocale);
      if (routeData.params.length > 0) {
        const localeFromParams = computeCurrentLocaleFromParams(this.params, locales);
        if (localeFromParams) {
          computedLocale = localeFromParams;
        }
      }
    }
    this.#currentLocale = computedLocale ?? fallbackTo;
    return this.#currentLocale;
  }
  computePreferredLocale() {
    const {
      pipeline: { i18n },
      request
    } = this;
    if (!i18n) return;
    return this.#preferredLocale ??= computePreferredLocale(request, i18n.locales);
  }
  computePreferredLocaleList() {
    const {
      pipeline: { i18n },
      request
    } = this;
    if (!i18n) return;
    return this.#preferredLocaleList ??= computePreferredLocaleList(request, i18n.locales);
  }
  /**
   * Lazily loads the route's component module. Returns the cached
   * instance if already loaded. The promise is cached so concurrent
   * callers share the same load.
   */
  async loadComponentInstance() {
    if (this.componentInstance) return this.componentInstance;
    if (this.#componentInstancePromise) return this.#componentInstancePromise;
    this.#componentInstancePromise = this.pipeline.getComponentByRoute(this.routeData).then((mod) => {
      this.componentInstance = mod;
      return mod;
    });
    return this.#componentInstancePromise;
  }
  /**
   * Registers a context provider under the given key. Handlers call
   * this to contribute values to the request context (e.g. sessions).
   * The `create` factory is called lazily on the first `resolve(key)`.
   */
  provide(key, provider) {
    (this.#providers ??= /* @__PURE__ */ new Map()).set(key, provider);
  }
  /**
   * Lazily resolves a provider registered under `key`. Calls
   * `provider.create()` on first access and caches the result.
   * Returns `undefined` if no provider was registered for the key.
   */
  resolve(key) {
    if (this.#providersResolvedValues?.has(key)) {
      return this.#providersResolvedValues.get(key);
    }
    const provider = this.#providers?.get(key);
    if (!provider) return void 0;
    const value = provider.create();
    (this.#providersResolvedValues ??= /* @__PURE__ */ new Map()).set(key, value);
    return value;
  }
  /**
   * Runs all registered `finalize` callbacks. Should be called after
   * the response is produced, typically in a `finally` block.
   *
   * Returns synchronously (no promise allocation) when nothing needs
   * finalizing — important for the hot path where sessions are not used.
   */
  finalizeAll() {
    if (!this.#providersResolvedValues || this.#providersResolvedValues.size === 0) return;
    let chain;
    for (const [key, provider] of this.#providers) {
      if (provider.finalize && this.#providersResolvedValues.has(key)) {
        const result = provider.finalize(this.#providersResolvedValues.get(key));
        if (result) {
          chain = chain ? chain.then(() => result) : result;
        }
      }
    }
    return chain;
  }
  /**
   * Adds lazy getters to `target` for each registered provider key.
   * Used by context creation (APIContext, Astro global) so that
   * provider values like `session` and `cache` appear as properties
   * without hard-coding the keys.
   */
  defineProviderGetters(target) {
    if (!this.#providers) return;
    const state = this;
    for (const key of this.#providers.keys()) {
      Object.defineProperty(target, key, {
        get: () => state.resolve(key),
        enumerable: true,
        configurable: true
      });
    }
  }
  /**
   * Resolves the route to use for this request and stores it on
   * `this.routeData`. If the adapter (or the dev server) provided a
   * `routeData` via render options it's already set and this is a
   * no-op. Otherwise we use the app's synchronous route matcher and
   * fall back to a `404.astro` route so middleware can still run.
   *
   * Called eagerly from the constructor so individual handlers
   * (actions, pages, middleware, etc.) always see a resolved route
   * without the caller needing an extra setup step.
   *
   * Once routeData is known, finalizes `this.pathname`: in dev, if the
   * matched route has no `.html` extension, strip `.html` / `/index.html`
   * suffixes so the rendering pipeline sees the canonical pathname.
   */
  /**
   * Strip `.html` / `/index.html` suffixes from the pathname so the
   * rendering pipeline sees the canonical route path. Only applies to
   * page routes where `.html` is framework-injected. Endpoint routes
   * preserve `.html` because any such suffix is user-provided (e.g.
   * from `getStaticPaths` params). Skipped when the matched route
   * itself has an `.html` extension in its definition.
   */
  #stripHtmlExtension() {
    if (this.routeData && this.routeData.type === "page" && !routeHasHtmlExtension(this.routeData)) {
      this.pathname = this.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    }
  }
  #resolveRouteData() {
    const pipeline = this.pipeline;
    if (this.routeData) {
      this.#stripHtmlExtension();
      return;
    }
    const matched = pipeline.matchRoute(this.pathname);
    if (matched && matched.prerender && pipeline.manifest.serverLike) {
      if (matched.params.length > 0) {
        const allMatches = pipeline.matchAllRoutes(this.pathname);
        this.routeData = allMatches.find((r) => !r.prerender);
      } else {
        this.routeData = void 0;
      }
    } else {
      this.routeData = matched;
    }
    pipeline.logger.debug("router", "Astro matched the following route for " + this.request.url);
    pipeline.logger.debug("router", "RouteData:\n" + this.routeData);
    if (!this.routeData) {
      const custom404 = getCustom404Route(pipeline.manifestData);
      if (custom404 && !custom404.prerender) {
        this.routeData = custom404;
      }
    }
    if (!this.routeData) {
      pipeline.logger.debug("router", "Astro hasn't found routes that match " + this.request.url);
      pipeline.logger.debug("router", "Here's the available routes:\n", pipeline.manifestData);
      return;
    }
    this.#stripHtmlExtension();
  }
  /**
   * Strips the pipeline's base from the request URL, prepends a forward
   * slash, and decodes the pathname. Falls back to the raw (not decoded)
   * pathname if `decodeURI` throws.
   *
   * Mirrors `BaseApp.removeBase`, including the
   * `collapseDuplicateLeadingSlashes` fix that prevents middleware
   * authorization bypass when the URL starts with `//`.
   */
  #computePathname(url) {
    let pathname = collapseDuplicateLeadingSlashes(url.pathname);
    const base = this.pipeline.manifest.base;
    if (pathname.startsWith(base)) {
      const baseWithoutTrailingSlash = removeTrailingForwardSlash(base);
      pathname = pathname.slice(baseWithoutTrailingSlash.length + 1);
    }
    pathname = prependForwardSlash(pathname);
    try {
      return validateAndDecodePathname(pathname);
    } catch (e) {
      if (e instanceof MultiLevelEncodingError) {
        this.invalidEncoding = true;
        return pathname;
      }
      this.pipeline.logger.error(null, e.toString());
      return pathname;
    }
  }
  /**
   * Reads X-Forwarded-Proto, X-Forwarded-Host, and X-Forwarded-Port
   * from the request headers, validates them against the manifest's
   * `allowedDomains`, and updates `this.url` accordingly. Also resolves
   * `clientAddress` from X-Forwarded-For when the host is trusted.
   *
   * Only called when `allowedDomains` is configured — without it,
   * forwarded headers are never trusted.
   */
  #applyForwardedHeaders() {
    const headers = this.request.headers;
    const allowedDomains = this.pipeline.manifest.allowedDomains;
    const validated = validateForwardedHeaders(
      getFirstForwardedValue(headers.get("x-forwarded-proto") ?? void 0),
      getFirstForwardedValue(headers.get("x-forwarded-host") ?? void 0),
      getFirstForwardedValue(headers.get("x-forwarded-port") ?? void 0),
      allowedDomains
    );
    if (!validated.protocol && !validated.host && !validated.port) return;
    if (validated.protocol) {
      this.url.protocol = validated.protocol + ":";
    }
    if (validated.host) {
      const colonIdx = validated.host.indexOf(":");
      if (colonIdx !== -1) {
        this.url.hostname = validated.host.slice(0, colonIdx);
        this.url.port = validated.host.slice(colonIdx + 1);
      } else {
        this.url.hostname = validated.host;
        this.url.port = "";
      }
    }
    if (validated.port) {
      this.url.port = validated.port;
    }
    const hostTrusted = validated.host !== void 0;
    if (hostTrusted && !this.clientAddress) {
      const forwardedFor = getFirstForwardedValue(
        this.request.headers.get("x-forwarded-for") ?? void 0
      );
      if (forwardedFor) {
        this.clientAddress = forwardedFor;
      }
    }
    const oldRequest = this.request;
    this.request = new Request(this.url, oldRequest);
    const app = Reflect.get(oldRequest, appSymbol);
    if (app !== void 0) {
      Reflect.set(this.request, appSymbol, app);
    }
  }
  /**
   * Returns the resolved `props` for this render, computing them lazily
   * from the route + component module on first access. If the
   * `initialProps` already carries user-supplied props (e.g. the
   * container API) those are used verbatim.
   */
  async getProps() {
    if (this.props !== null) return this.props;
    if (Object.keys(this.initialProps).length > 0) {
      this.props = this.initialProps;
      return this.props;
    }
    const pipeline = this.pipeline;
    const mod = await this.loadComponentInstance();
    this.props = await getProps({
      mod,
      routeData: this.routeData,
      routeCache: pipeline.routeCache,
      pathname: this.pathname,
      logger: pipeline.logger,
      serverLike: pipeline.manifest.serverLike,
      base: pipeline.manifest.base,
      trailingSlash: pipeline.manifest.trailingSlash
    });
    return this.props;
  }
  /**
   * Returns the `ActionAPIContext` for this render, creating it lazily.
   * Used by middleware, actions, and page dispatch.
   */
  getActionAPIContext() {
    if (this.actionApiContext !== null) return this.actionApiContext;
    const state = this;
    const ctx = {
      get cookies() {
        return state.cookies;
      },
      routePattern: this.routeData.route,
      isPrerendered: this.routeData.prerender,
      get clientAddress() {
        return state.getClientAddress();
      },
      get currentLocale() {
        return state.computeCurrentLocale();
      },
      generator: ASTRO_GENERATOR,
      get locals() {
        return state.locals;
      },
      set locals(_) {
        throw new AstroError(LocalsReassigned);
      },
      // SAFETY: getActionAPIContext is only called after route resolution,
      // so routeData is always set and the params getter always returns a value.
      params: this.params,
      get preferredLocale() {
        return state.computePreferredLocale();
      },
      get preferredLocaleList() {
        return state.computePreferredLocaleList();
      },
      request: this.request,
      site: this.pipeline.site,
      url: this.url,
      get originPathname() {
        return getOriginPathname(state.request);
      },
      get csp() {
        return state.getCsp();
      },
      get logger() {
        if (!state.pipeline.manifest.experimentalLogger) {
          state.pipeline.logger.warn(
            null,
            "The Astro.logger is available only when experimental.logger is defined."
          );
          return void 0;
        }
        return {
          info(msg) {
            state.pipeline.logger.info(null, msg);
          },
          warn(msg) {
            state.pipeline.logger.warn(null, msg);
          },
          error(msg) {
            state.pipeline.logger.error(null, msg);
          }
        };
      }
    };
    this.defineProviderGetters(ctx);
    this.actionApiContext = ctx;
    return this.actionApiContext;
  }
  /**
   * Returns the `APIContext` for this render, creating it lazily from
   * the memoized props + action context.
   *
   * Callers must ensure `getProps()` has resolved at least once before
   * calling this.
   */
  getAPIContext() {
    if (this.apiContext !== null) return this.apiContext;
    const actionApiContext = this.getActionAPIContext();
    const state = this;
    const redirect = (path, status = 302) => new Response(null, { status, headers: { Location: path } });
    const rewrite = async (reroutePayload) => {
      return await state.rewrite(reroutePayload);
    };
    Reflect.set(actionApiContext, pipelineSymbol, this.pipeline);
    actionApiContext[fetchStateSymbol] = this;
    this.apiContext = Object.assign(actionApiContext, {
      props: this.props,
      redirect,
      rewrite,
      getActionResult: createGetActionResult(actionApiContext.locals),
      callAction: createCallAction(actionApiContext)
    });
    return this.apiContext;
  }
  /**
   * Invalidates the cached `APIContext` so the next `getAPIContext()`
   * call re-derives it from the (possibly mutated) state. Used
   * after an in-flight rewrite swaps the route / request / params.
   */
  invalidateContexts() {
    this.props = null;
    this.actionApiContext = null;
    this.apiContext = null;
  }
}

function computeFallbackRoute(options) {
  const {
    pathname,
    responseStatus,
    fallback,
    fallbackType,
    locales,
    defaultLocale,
    strategy,
    base
  } = options;
  if (responseStatus !== 404) {
    return { type: "none" };
  }
  if (!fallback || Object.keys(fallback).length === 0) {
    return { type: "none" };
  }
  const segments = pathname.split("/");
  const urlLocale = segments.find((segment) => {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (locale === segment) {
          return true;
        }
      } else if (locale.path === segment) {
        return true;
      }
    }
    return false;
  });
  if (!urlLocale) {
    return { type: "none" };
  }
  const fallbackKeys = Object.keys(fallback);
  if (!fallbackKeys.includes(urlLocale)) {
    return { type: "none" };
  }
  const fallbackLocale = fallback[urlLocale];
  const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);
  let newPathname;
  if (pathFallbackLocale === defaultLocale && strategy === "pathname-prefix-other-locales") {
    if (pathname.includes(`${base}`)) {
      newPathname = pathname.replace(`/${urlLocale}`, ``);
    } else {
      newPathname = pathname.replace(`/${urlLocale}`, `/`);
    }
  } else {
    newPathname = pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
  }
  return {
    type: fallbackType,
    pathname: newPathname
  };
}

class I18nRouter {
  #strategy;
  #defaultLocale;
  #locales;
  #base;
  #domains;
  constructor(options) {
    this.#strategy = options.strategy;
    this.#defaultLocale = options.defaultLocale;
    this.#locales = options.locales;
    this.#base = options.base === "/" ? "/" : removeTrailingForwardSlash(options.base || "");
    this.#domains = options.domains;
  }
  /**
   * Evaluate routing strategy for a pathname.
   * Returns decision object (not HTTP Response).
   */
  match(pathname, context) {
    if (this.shouldSkipProcessing(pathname, context)) {
      return { type: "continue" };
    }
    switch (this.#strategy) {
      case "manual":
        return { type: "continue" };
      case "pathname-prefix-always":
        return this.matchPrefixAlways(pathname, context);
      case "domains-prefix-always":
        if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
          return { type: "continue" };
        }
        return this.matchPrefixAlways(pathname, context);
      case "pathname-prefix-other-locales":
        return this.matchPrefixOtherLocales(pathname, context);
      case "domains-prefix-other-locales":
        if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
          return { type: "continue" };
        }
        return this.matchPrefixOtherLocales(pathname, context);
      case "pathname-prefix-always-no-redirect":
        return this.matchPrefixAlwaysNoRedirect(pathname, context);
      case "domains-prefix-always-no-redirect":
        if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
          return { type: "continue" };
        }
        return this.matchPrefixAlwaysNoRedirect(pathname, context);
      default:
        return { type: "continue" };
    }
  }
  /**
   * Check if i18n processing should be skipped for this request
   */
  shouldSkipProcessing(pathname, context) {
    if (pathname.includes("/404") || pathname.includes("/500")) {
      return true;
    }
    if (pathname.includes("/_server-islands/")) {
      return true;
    }
    if (context.isReroute) {
      return true;
    }
    if (context.routeType && context.routeType !== "page" && context.routeType !== "fallback") {
      return true;
    }
    return false;
  }
  /**
   * Strategy: pathname-prefix-always
   * All locales must have a prefix, including the default locale.
   */
  matchPrefixAlways(pathname, _context) {
    const isRoot = pathname === this.#base + "/" || pathname === this.#base;
    if (isRoot) {
      const basePrefix = this.#base === "/" ? "" : this.#base;
      return {
        type: "redirect",
        location: `${basePrefix}/${this.#defaultLocale}`
      };
    }
    if (!pathHasLocale(pathname, this.#locales)) {
      return { type: "notFound" };
    }
    return { type: "continue" };
  }
  /**
   * Strategy: pathname-prefix-other-locales
   * Default locale has no prefix, other locales must have a prefix.
   */
  matchPrefixOtherLocales(pathname, _context) {
    let pathnameContainsDefaultLocale = false;
    for (const segment of pathname.split("/")) {
      if (normalizeTheLocale(segment) === normalizeTheLocale(this.#defaultLocale)) {
        pathnameContainsDefaultLocale = true;
        break;
      }
    }
    if (pathnameContainsDefaultLocale) {
      const newLocation = pathname.replace(`/${this.#defaultLocale}`, "");
      return {
        type: "notFound",
        location: newLocation
      };
    }
    return { type: "continue" };
  }
  /**
   * Strategy: pathname-prefix-always-no-redirect
   * Like prefix-always but allows root to serve instead of redirecting
   */
  matchPrefixAlwaysNoRedirect(pathname, _context) {
    const isRoot = pathname === this.#base + "/" || pathname === this.#base;
    if (isRoot) {
      return { type: "continue" };
    }
    if (!pathHasLocale(pathname, this.#locales)) {
      return { type: "notFound" };
    }
    return { type: "continue" };
  }
  /**
   * Check if the current locale doesn't belong to the configured domain.
   * Used for domain-based routing strategies.
   */
  localeHasntDomain(currentLocale, currentDomain) {
    if (!this.#domains || !currentDomain) {
      return false;
    }
    if (!currentLocale) {
      return false;
    }
    const localesForDomain = this.#domains[currentDomain];
    if (!localesForDomain) {
      return true;
    }
    return !localesForDomain.includes(currentLocale);
  }
}

class I18n {
  #i18n;
  #base;
  #trailingSlash;
  #format;
  #router;
  constructor(i18n, base, trailingSlash, format) {
    this.#i18n = i18n;
    this.#base = base;
    this.#trailingSlash = trailingSlash;
    this.#format = format;
    this.#router = new I18nRouter({
      strategy: i18n.strategy,
      defaultLocale: i18n.defaultLocale,
      locales: i18n.locales,
      base,
      domains: i18n.domainLookupTable ? Object.keys(i18n.domainLookupTable).reduce(
        (acc, domain) => {
          const locale = i18n.domainLookupTable[domain];
          if (!acc[domain]) {
            acc[domain] = [];
          }
          acc[domain].push(locale);
          return acc;
        },
        {}
      ) : void 0
    });
  }
  async finalize(state, response) {
    state.pipeline.usedFeatures |= PipelineFeatures.i18n;
    const i18n = this.#i18n;
    const typeHeader = response.headers.get(ROUTE_TYPE_HEADER);
    if (typeHeader) {
      response.headers.delete(ROUTE_TYPE_HEADER);
    }
    const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
    if (isReroute === "no" && typeof i18n.fallback === "undefined") {
      return response;
    }
    if (typeHeader !== "page" && typeHeader !== "fallback") {
      return response;
    }
    const url = state.url;
    const currentLocale = state.computeCurrentLocale();
    const isPrerendered = state.routeData.prerender;
    const routerContext = {
      currentLocale,
      currentDomain: url.hostname,
      routeType: typeHeader,
      isReroute: isReroute === "yes"
    };
    const routeDecision = this.#router.match(url.pathname, routerContext);
    switch (routeDecision.type) {
      case "redirect": {
        let location = routeDecision.location;
        if (shouldAppendForwardSlash(this.#trailingSlash, this.#format)) {
          location = appendForwardSlash(location);
        }
        return new Response(null, {
          status: routeDecision.status ?? 302,
          headers: { Location: location }
        });
      }
      case "notFound": {
        if (isPrerendered) {
          const prerenderedRes = new Response(response.body, {
            status: 404,
            headers: response.headers
          });
          prerenderedRes.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
          if (routeDecision.location) {
            prerenderedRes.headers.set("Location", routeDecision.location);
          }
          return prerenderedRes;
        }
        const headers = new Headers();
        if (routeDecision.location) {
          headers.set("Location", routeDecision.location);
        }
        return new Response(null, { status: 404, headers });
      }
    }
    if (i18n.fallback && i18n.fallbackType) {
      const effectiveStatus = typeHeader === "fallback" ? 404 : response.status;
      const fallbackDecision = computeFallbackRoute({
        pathname: url.pathname,
        responseStatus: effectiveStatus,
        fallback: i18n.fallback,
        fallbackType: i18n.fallbackType,
        locales: i18n.locales,
        defaultLocale: i18n.defaultLocale,
        strategy: i18n.strategy,
        base: this.#base
      });
      switch (fallbackDecision.type) {
        case "redirect":
          return new Response(null, {
            status: 302,
            headers: { Location: fallbackDecision.pathname + url.search }
          });
        case "rewrite":
          return await state.rewrite(fallbackDecision.pathname + url.search);
      }
    }
    return response;
  }
}

function pathHasLocale(path, locales) {
  const segments = path.split("/").map(normalizeThePath);
  for (const segment of segments) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (normalizeTheLocale(segment) === normalizeTheLocale(locale)) {
          return true;
        }
      } else if (segment === locale.path) {
        return true;
      }
    }
  }
  return false;
}
function getPathByLocale(locale, locales) {
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      if (loopLocale === locale) {
        return loopLocale;
      }
    } else {
      for (const code of loopLocale.codes) {
        if (code === locale) {
          return loopLocale.path;
        }
      }
    }
  }
  throw new AstroError(i18nNoLocaleFoundInPath);
}
function normalizeTheLocale(locale) {
  return locale.replaceAll("_", "-").toLowerCase();
}
function normalizeThePath(path) {
  return path.endsWith(".html") ? path.slice(0, -5) : path;
}
function getAllCodes(locales) {
  const result = [];
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      result.push(loopLocale);
    } else {
      result.push(...loopLocale.codes);
    }
  }
  return result;
}

function computePathnameFromDomain(request, url, i18n, base, trailingSlash, logger) {
  let pathname = void 0;
  if (i18n && (i18n.strategy === "domains-prefix-always" || i18n.strategy === "domains-prefix-other-locales" || i18n.strategy === "domains-prefix-always-no-redirect")) {
    let host = request.headers.get("X-Forwarded-Host");
    let protocol = request.headers.get("X-Forwarded-Proto");
    if (protocol) {
      protocol = protocol + ":";
    } else {
      protocol = url.protocol;
    }
    if (!host) {
      host = request.headers.get("Host");
    }
    if (host && protocol) {
      host = host.split(":")[0];
      try {
        let locale;
        const hostAsUrl = new URL(`${protocol}//${host}`);
        for (const [domainKey, localeValue] of Object.entries(i18n.domainLookupTable)) {
          const domainKeyAsUrl = new URL(domainKey);
          if (hostAsUrl.host === domainKeyAsUrl.host && hostAsUrl.protocol === domainKeyAsUrl.protocol) {
            locale = localeValue;
            break;
          }
        }
        if (locale) {
          pathname = prependForwardSlash(
            joinPaths(normalizeTheLocale(locale), removeBase(url.pathname, base))
          );
          if (trailingSlash === "always") {
            pathname = appendForwardSlash(pathname);
          } else if (trailingSlash === "never") {
            pathname = removeTrailingForwardSlash(pathname);
          } else if (url.pathname.endsWith("/")) {
            pathname = appendForwardSlash(pathname);
          }
        }
      } catch (e) {
        logger.error(
          "router",
          `Astro tried to parse ${protocol}//${host} as an URL, but it threw a parsing error. Check the X-Forwarded-Host and X-Forwarded-Proto headers.`
        );
        logger.error("router", `Error: ${e}`);
      }
    }
  }
  return pathname;
}
function removeBase(pathname, base) {
  pathname = collapseDuplicateLeadingSlashes(pathname);
  if (pathname.startsWith(base)) {
    return pathname.slice(removeTrailingForwardSlash(base).length + 1);
  }
  return pathname;
}

class ActionHandler {
  /**
   * Run action handling for the current request. Expects the APIContext
   * that is already being used by the render pipeline.
   *
   * Returns a `Response` when the action fully handles the request (RPC),
   * or `undefined` when the caller should continue processing the
   * request (form actions or non-action requests).
   */
  handle(apiContext, state) {
    state.pipeline.usedFeatures |= PipelineFeatures.actions;
    if (apiContext.isPrerendered) {
      return void 0;
    }
    const { action, setActionResult } = getActionContext(apiContext);
    if (!action) {
      return void 0;
    }
    return this.#executeAction(action, setActionResult);
  }
  async #executeAction(action, setActionResult) {
    const actionResult = await action.handler();
    const serialized = serializeActionResult(actionResult);
    if (action.calledFrom === "rpc") {
      if (serialized.type === "empty") {
        return new Response(null, {
          status: serialized.status
        });
      }
      return new Response(serialized.body, {
        status: serialized.status,
        headers: {
          "Content-Type": serialized.contentType
        }
      });
    }
    setActionResult(action.name, serialized);
    return void 0;
  }
}

function prepareResponse(response, { addCookieHeader }) {
  for (const headerName of INTERNAL_RESPONSE_HEADERS) {
    if (response.headers.has(headerName)) {
      response.headers.delete(headerName);
    }
  }
  if (addCookieHeader) {
    for (const setCookieHeaderValue of getSetCookiesFromResponse(response)) {
      response.headers.append("set-cookie", setCookieHeaderValue);
    }
  }
  Reflect.set(response, responseSentSymbol$1, true);
}

function redirectTemplate({
  status,
  absoluteLocation,
  relativeLocation,
  from
}) {
  const delay = status === 302 ? 2 : 0;
  const rel = escape(String(relativeLocation));
  const abs = escape(String(absoluteLocation));
  const fromHtml = from ? `from <code>${escape(from)}</code> ` : "";
  return `<!doctype html>
<title>Redirecting to: ${rel}</title>
<meta http-equiv="refresh" content="${delay};url=${rel}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${abs}">
<body>
	<a href="${rel}">Redirecting ${fromHtml}to <code>${rel}</code></a>
</body>`;
}

class TrailingSlashHandler {
  #app;
  constructor(app) {
    this.#app = app;
  }
  /**
   * Returns a redirect `Response` if the request pathname needs
   * normalization, or `undefined` if no redirect is required.
   */
  handle(state) {
    const url = new URL(state.request.url);
    const redirect = this.#redirectTrailingSlash(url.pathname);
    if (redirect === url.pathname) {
      return void 0;
    }
    const addCookieHeader = state.renderOptions.addCookieHeader;
    const status = state.request.method === "GET" ? 301 : 308;
    const response = new Response(
      redirectTemplate({
        status,
        relativeLocation: url.pathname,
        absoluteLocation: redirect,
        from: state.request.url
      }),
      {
        status,
        headers: {
          location: redirect + url.search
        }
      }
    );
    prepareResponse(response, { addCookieHeader });
    return response;
  }
  #redirectTrailingSlash(pathname) {
    const { trailingSlash } = this.#app.manifest;
    if (pathname === "/" || isInternalPath(pathname)) {
      return pathname;
    }
    const path = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== "never");
    if (path !== pathname) {
      return path;
    }
    if (trailingSlash === "ignore") {
      return pathname;
    }
    if (trailingSlash === "always" && !hasFileExtension(pathname)) {
      return appendForwardSlash(pathname);
    }
    if (trailingSlash === "never") {
      return removeTrailingForwardSlash(pathname);
    }
    return pathname;
  }
}

function defaultSetHeaders(options) {
  const headers = new Headers();
  const directives = [];
  if (options.maxAge !== void 0) {
    directives.push(`max-age=${options.maxAge}`);
  }
  if (options.swr !== void 0) {
    directives.push(`stale-while-revalidate=${options.swr}`);
  }
  if (directives.length > 0) {
    headers.set("CDN-Cache-Control", directives.join(", "));
  }
  if (options.tags && options.tags.length > 0) {
    headers.set("Cache-Tag", options.tags.join(", "));
  }
  if (options.lastModified) {
    headers.set("Last-Modified", options.lastModified.toUTCString());
  }
  if (options.etag) {
    headers.set("ETag", options.etag);
  }
  return headers;
}
function isLiveDataEntry(value) {
  return value != null && typeof value === "object" && "id" in value && "data" in value && "cacheHint" in value;
}

const APPLY_HEADERS = /* @__PURE__ */ Symbol.for("astro:cache:apply");
const IS_ACTIVE = /* @__PURE__ */ Symbol.for("astro:cache:active");
class AstroCache {
  #options = {};
  #tags = /* @__PURE__ */ new Set();
  #disabled = false;
  #provider;
  enabled = true;
  constructor(provider) {
    this.#provider = provider;
  }
  set(input) {
    if (input === false) {
      this.#disabled = true;
      this.#tags.clear();
      this.#options = {};
      return;
    }
    this.#disabled = false;
    let options;
    if (isLiveDataEntry(input)) {
      if (!input.cacheHint) return;
      options = input.cacheHint;
    } else {
      options = input;
    }
    if ("maxAge" in options && options.maxAge !== void 0) this.#options.maxAge = options.maxAge;
    if ("swr" in options && options.swr !== void 0)
      this.#options.swr = options.swr;
    if ("etag" in options && options.etag !== void 0)
      this.#options.etag = options.etag;
    if (options.lastModified !== void 0) {
      if (!this.#options.lastModified || options.lastModified > this.#options.lastModified) {
        this.#options.lastModified = options.lastModified;
      }
    }
    if (options.tags) {
      for (const tag of options.tags) this.#tags.add(tag);
    }
  }
  get tags() {
    return [...this.#tags];
  }
  /**
   * Get the current cache options (read-only snapshot).
   * Includes all accumulated options: maxAge, swr, tags, etag, lastModified.
   */
  get options() {
    return {
      ...this.#options,
      tags: this.tags
    };
  }
  async invalidate(input) {
    if (!this.#provider) {
      throw new AstroError(CacheNotEnabled);
    }
    let options;
    if (isLiveDataEntry(input)) {
      options = { tags: input.cacheHint?.tags ?? [] };
    } else {
      options = input;
    }
    return this.#provider.invalidate(options);
  }
  /** @internal */
  [APPLY_HEADERS](response) {
    if (this.#disabled) return;
    const finalOptions = { ...this.#options, tags: this.tags };
    if (finalOptions.maxAge === void 0 && !finalOptions.tags?.length) return;
    const headers = this.#provider?.setHeaders?.(finalOptions) ?? defaultSetHeaders(finalOptions);
    for (const [key, value] of headers) {
      response.headers.set(key, value);
    }
  }
  /** @internal */
  get [IS_ACTIVE]() {
    return !this.#disabled && (this.#options.maxAge !== void 0 || this.#tags.size > 0);
  }
}
function applyCacheHeaders(cache, response) {
  if (APPLY_HEADERS in cache) {
    cache[APPLY_HEADERS](response);
  }
}

const ROUTE_DYNAMIC_SPLIT = /\[(.+?\(.+?\)|.+?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;
function getParts(part, file) {
  const result = [];
  part.split(ROUTE_DYNAMIC_SPLIT).map((str, i) => {
    if (!str) return;
    const dynamic = i % 2 === 1;
    const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];
    if (!content || dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content)) {
      throw new Error(`Invalid route ${file} \u2014 parameter name must match /^[a-zA-Z0-9_$]+$/`);
    }
    result.push({
      content,
      dynamic,
      spread: dynamic && ROUTE_SPREAD.test(content)
    });
  });
  return result;
}

function compileCacheRoutes(routes, base, trailingSlash) {
  const compiled = Object.entries(routes).map(([path, options]) => {
    const segments = removeLeadingForwardSlash(path).split("/").filter(Boolean).map((s) => getParts(s, path));
    const pattern = getPattern(segments, base, trailingSlash);
    return { pattern, options, segments, route: path };
  });
  compiled.sort(
    (a, b) => routeComparator(
      { segments: a.segments, route: a.route, type: "page" },
      { segments: b.segments, route: b.route, type: "page" }
    )
  );
  return compiled;
}
function matchCacheRoute(pathname, compiledRoutes) {
  for (const route of compiledRoutes) {
    if (route.pattern.test(pathname)) return route.options;
  }
  return null;
}

const CACHE_KEY = "cache";
function provideCache(state) {
  const pipeline = state.pipeline;
  if (!pipeline.cacheConfig) {
    state.provide(CACHE_KEY, {
      create: () => new DisabledAstroCache(pipeline.logger)
    });
    return;
  }
  if (pipeline.runtimeMode === "development") {
    state.provide(CACHE_KEY, {
      create: () => new NoopAstroCache()
    });
    return;
  }
  return provideCacheAsync(state, pipeline);
}
async function provideCacheAsync(state, pipeline) {
  const cacheProvider = await pipeline.getCacheProvider();
  state.provide(CACHE_KEY, {
    create() {
      const cache = new AstroCache(cacheProvider);
      if (pipeline.cacheConfig?.routes) {
        if (!pipeline.compiledCacheRoutes) {
          pipeline.compiledCacheRoutes = compileCacheRoutes(
            pipeline.cacheConfig.routes,
            pipeline.manifest.base,
            pipeline.manifest.trailingSlash
          );
        }
        const matched = matchCacheRoute(state.pathname, pipeline.compiledCacheRoutes);
        if (matched) {
          cache.set(matched);
        }
      }
      return cache;
    }
  });
}
class CacheHandler {
  #app;
  constructor(app) {
    this.#app = app;
  }
  async handle(state, next) {
    this.#app.pipeline.usedFeatures |= PipelineFeatures.cache;
    if (!this.#app.pipeline.cacheProvider) {
      return next();
    }
    const cache = state.resolve(CACHE_KEY);
    const cacheProvider = await this.#app.pipeline.getCacheProvider();
    if (cacheProvider?.onRequest) {
      const response2 = await cacheProvider.onRequest(
        {
          request: state.request,
          url: new URL(state.request.url),
          waitUntil: state.renderOptions.waitUntil
        },
        async () => {
          const res = await next();
          applyCacheHeaders(cache, res);
          return res;
        }
      );
      response2.headers.delete("CDN-Cache-Control");
      response2.headers.delete("Cache-Tag");
      return response2;
    }
    const response = await next();
    applyCacheHeaders(cache, response);
    return response;
  }
}

function isExternalURL(url) {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//");
}
function redirectIsExternal(redirect) {
  if (typeof redirect === "string") {
    return isExternalURL(redirect);
  } else {
    return isExternalURL(redirect.destination);
  }
}
function computeRedirectStatus(method, redirect, redirectRoute) {
  return redirectRoute && typeof redirect === "object" ? redirect.status : method === "GET" ? 301 : 308;
}
function resolveRedirectTarget(params, redirect, redirectRoute, trailingSlash) {
  if (typeof redirectRoute !== "undefined") {
    const generate = getRouteGenerator(redirectRoute.segments, trailingSlash);
    return generate(params);
  } else if (typeof redirect === "string") {
    if (redirectIsExternal(redirect)) {
      return redirect;
    } else {
      let target = redirect;
      for (const param of Object.keys(params)) {
        const paramValue = params[param];
        target = target.replace(`[${param}]`, paramValue).replace(`[...${param}]`, paramValue);
      }
      return target;
    }
  } else if (typeof redirect === "undefined") {
    return "/";
  }
  return redirect.destination;
}
async function renderRedirect(state) {
  state.pipeline.usedFeatures |= PipelineFeatures.redirects;
  const routeData = state.routeData;
  const { redirect, redirectRoute } = routeData;
  const status = computeRedirectStatus(state.request.method, redirect, redirectRoute);
  const headers = {
    location: encodeURI(
      resolveRedirectTarget(
        state.params,
        redirect,
        redirectRoute,
        state.pipeline.manifest.trailingSlash
      )
    )
  };
  if (redirect && redirectIsExternal(redirect)) {
    if (typeof redirect === "string") {
      return Response.redirect(redirect, status);
    } else {
      return Response.redirect(redirect.destination, status);
    }
  }
  return new Response(null, { status, headers });
}

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify$1(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify$1(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys$1(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys$1(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify$1(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify$1(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify$1(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const PERSIST_SYMBOL = /* @__PURE__ */ Symbol();
const DEFAULT_COOKIE_NAME = "astro-session";
const VALID_COOKIE_REGEX = /^[\w-]+$/;
const unflatten = (parsed, _) => {
  return unflatten$1(parsed, {
    URL: (href) => new URL(href)
  });
};
const stringify = (data, _) => {
  return stringify$2(data, {
    // Support URL objects
    URL: (val) => val instanceof URL && val.href
  });
};
class AstroSession {
  // The cookies object.
  #cookies;
  // The session configuration.
  #config;
  // The cookie config
  #cookieConfig;
  // The cookie name
  #cookieName;
  // The unstorage object for the session driver.
  #storage;
  #data;
  // The session ID. A v4 UUID.
  #sessionID;
  // Sessions to destroy. Needed because we won't have the old session ID after it's destroyed locally.
  #toDestroy = /* @__PURE__ */ new Set();
  // Session keys to delete. Used for partial data sets to avoid overwriting the deleted value.
  #toDelete = /* @__PURE__ */ new Set();
  // Whether the session is dirty and needs to be saved.
  #dirty = false;
  // Whether the session cookie has been set.
  #cookieSet = false;
  // Whether the session ID was sourced from a client cookie rather than freshly generated.
  #sessionIDFromCookie = false;
  // The local data is "partial" if it has not been loaded from storage yet and only
  // contains values that have been set or deleted in-memory locally.
  // We do this to avoid the need to block on loading data when it is only being set.
  // When we load the data from storage, we need to merge it with the local partial data,
  // preserving in-memory changes and deletions.
  #partial = true;
  // The driver factory function provided by the pipeline
  #driverFactory;
  static #sharedStorage = /* @__PURE__ */ new Map();
  constructor({
    cookies,
    config,
    runtimeMode,
    driverFactory,
    mockStorage
  }) {
    if (!config) {
      throw new AstroError({
        ...SessionStorageInitError,
        message: SessionStorageInitError.message(
          "No driver was defined in the session configuration and the adapter did not provide a default driver."
        )
      });
    }
    this.#cookies = cookies;
    this.#driverFactory = driverFactory;
    const { cookie: cookieConfig = DEFAULT_COOKIE_NAME, ...configRest } = config;
    let cookieConfigObject;
    if (typeof cookieConfig === "object") {
      const { name = DEFAULT_COOKIE_NAME, ...rest } = cookieConfig;
      this.#cookieName = name;
      cookieConfigObject = rest;
    } else {
      this.#cookieName = cookieConfig || DEFAULT_COOKIE_NAME;
    }
    this.#cookieConfig = {
      sameSite: "lax",
      secure: runtimeMode === "production",
      path: "/",
      ...cookieConfigObject,
      httpOnly: true
    };
    this.#config = configRest;
    if (mockStorage) {
      this.#storage = mockStorage;
    }
  }
  /**
   * Gets a session value. Returns `undefined` if the session or value does not exist.
   */
  async get(key) {
    return (await this.#ensureData()).get(key)?.data;
  }
  /**
   * Checks if a session value exists.
   */
  async has(key) {
    return (await this.#ensureData()).has(key);
  }
  /**
   * Gets all session values.
   */
  async keys() {
    return (await this.#ensureData()).keys();
  }
  /**
   * Gets all session values.
   */
  async values() {
    return [...(await this.#ensureData()).values()].map((entry) => entry.data);
  }
  /**
   * Gets all session entries.
   */
  async entries() {
    return [...(await this.#ensureData()).entries()].map(([key, entry]) => [key, entry.data]);
  }
  /**
   * Deletes a session value.
   */
  delete(key) {
    this.#data ??= /* @__PURE__ */ new Map();
    this.#data.delete(key);
    if (this.#partial) {
      this.#toDelete.add(key);
    }
    this.#dirty = true;
  }
  /**
   * Sets a session value. The session is created if it does not exist.
   */
  set(key, value, { ttl } = {}) {
    if (!key) {
      throw new AstroError({
        ...SessionStorageSaveError,
        message: "The session key was not provided."
      });
    }
    let cloned;
    try {
      cloned = unflatten(JSON.parse(stringify(value)));
    } catch (err) {
      throw new AstroError(
        {
          ...SessionStorageSaveError,
          message: `The session data for ${key} could not be serialized.`,
          hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
        },
        { cause: err }
      );
    }
    if (!this.#cookieSet) {
      this.#setCookie();
      this.#cookieSet = true;
    }
    this.#data ??= /* @__PURE__ */ new Map();
    const lifetime = ttl ?? this.#config.ttl;
    const expires = typeof lifetime === "number" ? Date.now() + lifetime * 1e3 : lifetime;
    this.#data.set(key, {
      data: cloned,
      expires
    });
    this.#dirty = true;
  }
  /**
   * Destroys the session, clearing the cookie and storage if it exists.
   */
  destroy() {
    const sessionId = this.#sessionID ?? this.#cookies.get(this.#cookieName)?.value;
    if (sessionId) {
      this.#toDestroy.add(sessionId);
    }
    this.#cookies.delete(this.#cookieName, this.#cookieConfig);
    this.#sessionID = void 0;
    this.#data = void 0;
    this.#dirty = true;
  }
  /**
   * Regenerates the session, creating a new session ID. The existing session data is preserved.
   */
  async regenerate() {
    let data = /* @__PURE__ */ new Map();
    try {
      data = await this.#ensureData();
    } catch (err) {
      console.error("Failed to load session data during regeneration:", err);
    }
    const oldSessionId = this.#sessionID;
    this.#sessionID = crypto.randomUUID();
    this.#sessionIDFromCookie = false;
    this.#data = data;
    this.#dirty = true;
    await this.#setCookie();
    if (oldSessionId && this.#storage) {
      this.#storage.removeItem(oldSessionId).catch((err) => {
        console.error("Failed to remove old session data:", err);
      });
    }
  }
  // Persists the session data to storage.
  // This is called automatically at the end of the request.
  // Uses a symbol to prevent users from calling it directly.
  async [PERSIST_SYMBOL]() {
    if (!this.#dirty && !this.#toDestroy.size) {
      return;
    }
    const storage = await this.#ensureStorage();
    if (this.#dirty && this.#data) {
      const data = await this.#ensureData();
      this.#toDelete.forEach((key2) => data.delete(key2));
      const key = this.#ensureSessionID();
      let serialized;
      try {
        serialized = stringify(data);
      } catch (err) {
        throw new AstroError(
          {
            ...SessionStorageSaveError,
            message: SessionStorageSaveError.message(
              "The session data could not be serialized.",
              this.#config.driver
            )
          },
          { cause: err }
        );
      }
      await storage.setItem(key, serialized);
      this.#dirty = false;
    }
    if (this.#toDestroy.size > 0) {
      const cleanupPromises = [...this.#toDestroy].map(
        (sessionId) => storage.removeItem(sessionId).catch((err) => {
          console.error("Failed to clean up session %s:", sessionId, err);
        })
      );
      await Promise.all(cleanupPromises);
      this.#toDestroy.clear();
    }
  }
  get sessionID() {
    return this.#sessionID;
  }
  /**
   * Loads a session from storage with the given ID, and replaces the current session.
   * Any changes made to the current session will be lost.
   * This is not normally needed, as the session is automatically loaded using the cookie.
   * However it can be used to restore a session where the ID has been recorded somewhere
   * else (e.g. in a database).
   */
  async load(sessionID) {
    this.#sessionID = sessionID;
    this.#data = void 0;
    await this.#setCookie();
    await this.#ensureData();
  }
  /**
   * Sets the session cookie.
   */
  async #setCookie() {
    if (!VALID_COOKIE_REGEX.test(this.#cookieName)) {
      throw new AstroError({
        ...SessionStorageSaveError,
        message: "Invalid cookie name. Cookie names can only contain letters, numbers, and dashes."
      });
    }
    const value = this.#ensureSessionID();
    this.#cookies.set(this.#cookieName, value, this.#cookieConfig);
  }
  /**
   * Attempts to load the session data from storage, or creates a new data object if none exists.
   * If there is existing partial data, it will be merged into the new data object.
   */
  async #ensureData() {
    if (this.#data && !this.#partial) {
      return this.#data;
    }
    this.#data ??= /* @__PURE__ */ new Map();
    if (!this.#sessionID && !this.#cookies.get(this.#cookieName)?.value) {
      this.#partial = false;
      return this.#data;
    }
    const storage = await this.#ensureStorage();
    const raw = await storage.get(this.#ensureSessionID());
    if (!raw) {
      if (this.#sessionIDFromCookie) {
        this.#sessionID = crypto.randomUUID();
        this.#sessionIDFromCookie = false;
        if (this.#cookieSet) {
          await this.#setCookie();
        }
      }
      return this.#data;
    }
    try {
      const storedMap = unflatten(raw);
      if (!(storedMap instanceof Map)) {
        await this.destroy();
        throw new AstroError({
          ...SessionStorageInitError,
          message: SessionStorageInitError.message(
            "The session data was an invalid type.",
            this.#config.driver
          )
        });
      }
      const now = Date.now();
      for (const [key, value] of storedMap) {
        const expired = typeof value.expires === "number" && value.expires < now;
        if (!this.#data.has(key) && !this.#toDelete.has(key) && !expired) {
          this.#data.set(key, value);
        }
      }
      this.#partial = false;
      return this.#data;
    } catch (err) {
      await this.destroy();
      if (err instanceof AstroError) {
        throw err;
      }
      throw new AstroError(
        {
          ...SessionStorageInitError,
          message: SessionStorageInitError.message(
            "The session data could not be parsed.",
            this.#config.driver
          )
        },
        { cause: err }
      );
    }
  }
  /**
   * Returns the session ID, generating a new one if it does not exist.
   */
  #ensureSessionID() {
    if (!this.#sessionID) {
      const cookieValue = this.#cookies.get(this.#cookieName)?.value;
      if (cookieValue) {
        this.#sessionID = cookieValue;
        this.#sessionIDFromCookie = true;
      } else {
        this.#sessionID = crypto.randomUUID();
      }
    }
    return this.#sessionID;
  }
  /**
   * Ensures the storage is initialized.
   * This is called automatically when a storage operation is needed.
   */
  async #ensureStorage() {
    if (this.#storage) {
      return this.#storage;
    }
    if (AstroSession.#sharedStorage.has(this.#config.driver)) {
      this.#storage = AstroSession.#sharedStorage.get(this.#config.driver);
      return this.#storage;
    }
    if (!this.#driverFactory) {
      throw new AstroError({
        ...SessionStorageInitError,
        message: SessionStorageInitError.message(
          "Astro could not load the driver correctly. Does it exist?",
          this.#config.driver
        )
      });
    }
    const driver = this.#driverFactory;
    try {
      this.#storage = createStorage({
        driver: {
          ...driver(this.#config.options),
          // Unused methods
          hasItem() {
            return false;
          },
          getKeys() {
            return [];
          }
        }
      });
      AstroSession.#sharedStorage.set(this.#config.driver, this.#storage);
      return this.#storage;
    } catch (err) {
      throw new AstroError(
        {
          ...SessionStorageInitError,
          message: SessionStorageInitError.message("Unknown error", this.#config.driver)
        },
        { cause: err }
      );
    }
  }
}

const SESSION_KEY = "session";
function provideSession(state) {
  state.pipeline.usedFeatures |= PipelineFeatures.sessions;
  const pipeline = state.pipeline;
  const config = pipeline.manifest.sessionConfig;
  if (!config) return;
  return provideSessionAsync(state, config);
}
async function provideSessionAsync(state, config) {
  const pipeline = state.pipeline;
  const driverFactory = await pipeline.getSessionDriver();
  if (!driverFactory) return;
  state.provide(SESSION_KEY, {
    create() {
      const cookies = state.cookies;
      return new AstroSession({
        cookies,
        config,
        runtimeMode: pipeline.runtimeMode,
        driverFactory,
        mockStorage: null
      });
    },
    finalize(session) {
      return session[PERSIST_SYMBOL]();
    }
  });
}

class AstroHandler {
  #app;
  #trailingSlashHandler;
  #actionHandler;
  #astroMiddleware;
  #pagesHandler;
  #cacheHandler;
  /** Bound callback for the middleware chain — created once, reused per request. */
  #renderRouteCallback;
  /**
   * i18n post-processor. Only set when the app has i18n configured and
   * the strategy is not `manual` — for the manual strategy users wire
   * `astro:i18n.middleware(...)` into their own `onRequest`.
   */
  #i18n;
  /** Whether sessions are configured on the manifest. */
  #hasSession;
  constructor(app) {
    this.#app = app;
    this.#trailingSlashHandler = new TrailingSlashHandler(app);
    this.#actionHandler = new ActionHandler();
    this.#astroMiddleware = new AstroMiddleware(app.pipeline);
    this.#pagesHandler = new PagesHandler(app.pipeline);
    this.#cacheHandler = new CacheHandler(app);
    this.#renderRouteCallback = this.#actionsAndPages.bind(this);
    this.#hasSession = !!app.manifest.sessionConfig;
    const i18n = app.manifest.i18n;
    if (i18n && i18n.strategy !== "manual") {
      this.#i18n = new I18n(
        i18n,
        app.manifest.base,
        app.manifest.trailingSlash,
        app.manifest.buildFormat
      );
    }
  }
  /**
   * Runs actions then pages — the callback at the bottom of the
   * middleware chain. Bound once in the constructor to avoid
   * per-request closure allocation.
   */
  #actionsAndPages(state, ctx) {
    if (!state.skipMiddleware) {
      const actionResult = this.#actionHandler.handle(ctx, state);
      if (actionResult) {
        return actionResult.then((response) => response ?? this.#pagesHandler.handle(state, ctx));
      }
    }
    return this.#pagesHandler.handle(state, ctx);
  }
  async handle(state) {
    state.pipeline.usedFeatures |= ALL_PIPELINE_FEATURES;
    if (state.invalidEncoding) {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }
    const trailingSlashRedirect = this.#trailingSlashHandler.handle(state);
    if (trailingSlashRedirect) {
      return trailingSlashRedirect;
    }
    if (!state.routeData) {
      return this.#app.renderError(state.request, {
        ...state.renderOptions,
        status: 404,
        pathname: state.pathname
      });
    }
    return this.render(state);
  }
  /**
   * Renders a response for the given `FetchState`. Assumes
   * trailing-slash redirects and routeData resolution have already run.
   *
   * User-triggered rewrites (`Astro.rewrite` / `ctx.rewrite`) go through
   * `Rewrites.execute` on the current `FetchState` — they mutate the
   * existing state in place and re-run middleware + page dispatch.
   */
  async render(state) {
    const routeData = state.routeData;
    const pathname = state.pathname;
    const request = state.request;
    const { addCookieHeader } = state.renderOptions;
    const defaultStatus = this.#app.getDefaultStatusCode(routeData, pathname);
    state.status = defaultStatus;
    let response;
    try {
      const sessionP = this.#hasSession ? provideSession(state) : void 0;
      const cacheP = provideCache(state);
      if (sessionP || cacheP) await Promise.all([sessionP, cacheP]);
      state.pipeline.usedFeatures |= PipelineFeatures.sessions;
      if (routeData.type === "redirect") {
        const redirectResponse = await renderRedirect(state);
        this.#app.logThisRequest({
          pathname,
          method: request.method,
          statusCode: redirectResponse.status,
          isRewrite: false,
          timeStart: state.timeStart
        });
        prepareResponse(redirectResponse, { addCookieHeader });
        this.#app.pipeline.logger.flush();
        return redirectResponse;
      }
      if (!this.#app.pipeline.cacheProvider) {
        this.#app.pipeline.usedFeatures |= PipelineFeatures.cache;
        response = await this.#astroMiddleware.handle(state, this.#renderRouteCallback);
        if (this.#i18n) {
          response = await this.#i18n.finalize(state, response);
        }
      } else {
        const runPipeline = async () => {
          let res = await this.#astroMiddleware.handle(state, this.#renderRouteCallback);
          if (this.#i18n) {
            res = await this.#i18n.finalize(state, res);
          }
          return res;
        };
        response = await this.#cacheHandler.handle(state, runPipeline);
      }
      const isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);
      this.#app.logThisRequest({
        pathname,
        method: request.method,
        statusCode: response.status,
        isRewrite,
        timeStart: state.timeStart
      });
    } catch (err) {
      this.#app.logger.error(null, err.stack || err.message || String(err));
      return this.#app.renderError(request, {
        ...state.renderOptions,
        status: 500,
        error: err,
        pathname: state.pathname
      });
    } finally {
      const finalize = state.finalizeAll();
      if (finalize) await finalize;
    }
    if (REROUTABLE_STATUS_CODES.includes(response.status) && // If the body isn't null, that means the user sets the 404 status
    // but uses the current route to handle the 404
    response.body === null && response.headers.get(REROUTE_DIRECTIVE_HEADER) !== "no") {
      return this.#app.renderError(request, {
        ...state.renderOptions,
        response,
        status: response.status,
        // We don't have an error to report here. Passing null means we pass nothing intentionally
        // while undefined means there's no error
        error: response.status === 500 ? null : void 0,
        pathname: state.pathname
      });
    }
    prepareResponse(response, { addCookieHeader });
    this.#app.pipeline.logger.flush();
    return response;
  }
}

class DefaultFetchHandler {
  #app;
  #handler;
  constructor(app) {
    this.#app = app ?? null;
    this.#handler = app ? new AstroHandler(app) : null;
  }
  /**
   * Fast path: called directly by `BaseApp.render()` with pre-resolved
   * options, avoiding the `Reflect.set/get` round-trip through the request.
   */
  renderWithOptions(request, options) {
    if (!this.#app) {
      const app = Reflect.get(request, appSymbol);
      if (!app) {
        throw new Error("No fetch handler provided.");
      }
      this.#app = app;
      this.#handler = new AstroHandler(app);
    }
    const state = new FetchState(this.#app.pipeline, request, options);
    return this.#handler.handle(state);
  }
  fetch = (request) => {
    if (!this.#app) {
      const app = Reflect.get(request, appSymbol);
      if (!app) {
        throw new Error("No fetch handler provided.");
      }
      this.#app = app;
      this.#handler = new AstroHandler(app);
    }
    const state = new FetchState(this.#app.pipeline, request);
    if (!this.#handler) {
      throw new Error("No fetch handler provided.");
    }
    return this.#handler.handle(state);
  };
}

class DefaultErrorHandler {
  #app;
  #astroMiddleware;
  #pagesHandler;
  constructor(app) {
    this.#app = app;
    this.#astroMiddleware = new AstroMiddleware(app.pipeline);
    this.#pagesHandler = new PagesHandler(app.pipeline);
  }
  async renderError(request, {
    status,
    response: originalResponse,
    skipMiddleware = false,
    error,
    pathname,
    ...resolvedRenderOptions
  }) {
    const app = this.#app;
    const resolvedPathname = pathname ?? new FetchState(app.pipeline, request).pathname;
    const errorRoutePath = `/${status}${app.manifest.trailingSlash === "always" ? "/" : ""}`;
    const errorRouteData = matchRoute(errorRoutePath, app.manifestData);
    const url = new URL(request.url);
    if (errorRouteData) {
      if (errorRouteData.prerender) {
        const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? ".html" : "";
        const allowedDomains = app.manifest.allowedDomains;
        const validatedHost = validateHost(url.host, url.protocol.replace(":", ""), allowedDomains);
        const safeOrigin = validatedHost ? url.origin : `${url.protocol}//localhost`;
        const statusURL = new URL(
          `${app.baseWithoutTrailingSlash}/${status}${maybeDotHtml}`,
          safeOrigin
        );
        if (statusURL.toString() !== request.url && resolvedRenderOptions.prerenderedErrorPageFetch) {
          try {
            const response2 = await resolvedRenderOptions.prerenderedErrorPageFetch(
              statusURL.toString()
            );
            const override = { status, removeContentEncodingHeaders: true };
            const newResponse = mergeResponses(response2, originalResponse, override);
            prepareResponse(newResponse, resolvedRenderOptions);
            return newResponse;
          } catch {
            const response2 = mergeResponses(new Response(null, { status }), originalResponse);
            prepareResponse(response2, resolvedRenderOptions);
            return response2;
          }
        }
      }
      const mod = await app.pipeline.getComponentByRoute(errorRouteData);
      const errorState = new FetchState(app.pipeline, request);
      errorState.skipMiddleware = skipMiddleware;
      errorState.clientAddress = resolvedRenderOptions.clientAddress;
      errorState.routeData = errorRouteData;
      errorState.pathname = resolvedPathname;
      errorState.status = status;
      errorState.componentInstance = mod;
      errorState.locals = resolvedRenderOptions.locals ?? {};
      errorState.initialProps = { error };
      try {
        await provideSession(errorState);
        const response2 = await this.#astroMiddleware.handle(
          errorState,
          this.#pagesHandler.handle.bind(this.#pagesHandler)
        );
        const newResponse = mergeResponses(response2, originalResponse);
        prepareResponse(newResponse, resolvedRenderOptions);
        return newResponse;
      } catch {
        if (skipMiddleware === false) {
          return this.renderError(request, {
            ...resolvedRenderOptions,
            status,
            response: originalResponse,
            skipMiddleware: true,
            pathname: resolvedPathname
          });
        }
      } finally {
        await errorState.finalizeAll();
      }
    }
    const response = mergeResponses(new Response(null, { status }), originalResponse);
    prepareResponse(response, resolvedRenderOptions);
    return response;
  }
}
function mergeResponses(newResponse, originalResponse, override) {
  let newResponseHeaders = newResponse.headers;
  if (override?.removeContentEncodingHeaders) {
    newResponseHeaders = new Headers(newResponseHeaders);
    newResponseHeaders.delete("Content-Encoding");
    newResponseHeaders.delete("Content-Length");
  }
  if (!originalResponse) {
    if (override !== void 0) {
      return new Response(newResponse.body, {
        status: override.status,
        statusText: newResponse.statusText,
        headers: newResponseHeaders
      });
    }
    return newResponse;
  }
  const status = override?.status ? override.status : originalResponse.status === 200 ? newResponse.status : originalResponse.status;
  try {
    originalResponse.headers.delete("Content-type");
    originalResponse.headers.delete("Content-Length");
    originalResponse.headers.delete("Transfer-Encoding");
  } catch {
  }
  const newHeaders = new Headers();
  const seen = /* @__PURE__ */ new Set();
  for (const [name, value] of originalResponse.headers) {
    newHeaders.append(name, value);
    seen.add(name.toLowerCase());
  }
  for (const [name, value] of newResponseHeaders) {
    if (!seen.has(name.toLowerCase())) {
      newHeaders.append(name, value);
    }
  }
  const mergedResponse = new Response(newResponse.body, {
    status,
    statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
    // If you're looking at here for possible bugs, it means that it's not a bug.
    // With the middleware, users can meddle with headers, and we should pass to the 404/500.
    // If users see something weird, it's because they are setting some headers they should not.
    //
    // Although, we don't want it to replace the content-type, because the error page must return `text/html`
    headers: newHeaders
  });
  const originalCookies = getCookiesFromResponse(originalResponse);
  const newCookies = getCookiesFromResponse(newResponse);
  if (originalCookies) {
    if (newCookies) {
      for (const cookieValue of newCookies.consume()) {
        originalResponse.headers.append("set-cookie", cookieValue);
      }
    }
    attachCookiesToResponse(mergedResponse, originalCookies);
  } else if (newCookies) {
    attachCookiesToResponse(mergedResponse, newCookies);
  }
  return mergedResponse;
}

class BaseApp {
  manifest;
  manifestData;
  pipeline;
  #adapterLogger;
  baseWithoutTrailingSlash;
  /**
   * The handler that turns incoming `Request` objects into `Response`s.
   * Defaults to a `DefaultFetchHandler` pinned to this app and can be
   * overridden via `setFetchHandler` — typically by the bundled
   * entrypoint after importing `virtual:astro:fetchable`.
   */
  #fetchHandler;
  #errorHandler;
  /**
   * Whether a custom fetch handler (from `src/app.ts`) has been set
   * via `setFetchHandler`. When false, the `DefaultFetchHandler` is
   * in use and all features are implicitly active.
   */
  #hasCustomFetchHandler = false;
  /**
   * Whether the missing-feature check has already run. We only want
   * to warn once — after the first request in dev, or at build end.
   */
  #featureCheckDone = false;
  get logger() {
    return this.pipeline.logger;
  }
  get adapterLogger() {
    const currentOptions = this.logger.options;
    if (!this.#adapterLogger || this.#adapterLogger.options !== currentOptions) {
      this.#adapterLogger = new AstroIntegrationLogger(currentOptions, this.manifest.adapterName);
    }
    return this.#adapterLogger;
  }
  constructor(manifest, streaming = true, ...args) {
    this.manifest = manifest;
    this.baseWithoutTrailingSlash = removeTrailingForwardSlash(manifest.base);
    this.pipeline = this.createPipeline(streaming, manifest, ...args);
    this.manifestData = this.pipeline.manifestData;
    this.#fetchHandler = new DefaultFetchHandler(this);
    this.#errorHandler = this.createErrorHandler();
  }
  /**
   * Override the fetch handler used to dispatch requests. Entrypoints
   * call this with the default export of `virtual:astro:fetchable` to
   * plug in a user-authored handler from `src/app.ts`.
   */
  setFetchHandler(handler) {
    this.#fetchHandler = handler;
    this.#hasCustomFetchHandler = !(handler instanceof DefaultFetchHandler);
  }
  /**
   * Returns the error handler strategy used by this app. Override to
   * provide environment-specific behavior (dev overlay, build-time throws, etc.).
   */
  createErrorHandler() {
    return new DefaultErrorHandler(this);
  }
  /**
   * Resets the cached adapter logger so it picks up a new logger instance.
   * Used by BuildApp when the logger is replaced via setOptions().
   */
  resetAdapterLogger() {
    this.#adapterLogger = void 0;
  }
  getAllowedDomains() {
    return this.manifest.allowedDomains;
  }
  matchesAllowedDomains(forwardedHost, protocol) {
    return BaseApp.validateForwardedHost(forwardedHost, this.manifest.allowedDomains, protocol);
  }
  static validateForwardedHost(forwardedHost, allowedDomains, protocol) {
    if (!allowedDomains || allowedDomains.length === 0) {
      return false;
    }
    try {
      const testUrl = new URL(`${protocol || "https"}://${forwardedHost}`);
      return allowedDomains.some((pattern) => {
        return matchPattern$1(testUrl, pattern);
      });
    } catch {
      return false;
    }
  }
  set setManifestData(newManifestData) {
    this.manifestData = newManifestData;
    this.pipeline.manifestData = newManifestData;
    this.pipeline.rebuildRouter();
  }
  removeBase(pathname) {
    pathname = collapseDuplicateLeadingSlashes(pathname);
    if (pathname.startsWith(this.manifest.base)) {
      return pathname.slice(this.baseWithoutTrailingSlash.length + 1);
    }
    return pathname;
  }
  /**
   * Decodes a pathname with `decodeURI`, falling back to the raw pathname when it
   * contains an invalid percent-sequence (e.g. `%C0%AF`, an overlong-UTF-8 encoding of
   * `/` commonly sent by path-traversal scanners). A raw `decodeURI()` would throw
   * `URIError: URI malformed`, and because `match()` runs before `render()` that error
   * escapes the adapter's request handler as an uncaught exception (HTTP 500) that user
   * middleware can't catch.
   */
  safeDecodeURI(pathname) {
    try {
      return decodeURI(pathname);
    } catch (e) {
      this.adapterLogger.debug(e.toString());
      return pathname;
    }
  }
  /**
   * Extracts the base-stripped, decoded pathname from a request.
   * Used by adapters to compute the pathname for dev-mode route matching.
   */
  getPathnameFromRequest(request) {
    const url = new URL(request.url);
    const pathname = prependForwardSlash(this.removeBase(url.pathname));
    return this.safeDecodeURI(pathname);
  }
  /**
   * Given a `Request`, it returns the `RouteData` that matches its `pathname`. By default, prerendered
   * routes aren't returned, even if they are matched.
   *
   * When `allowPrerenderedRoutes` is `true`, the function returns matched prerendered routes too.
   * @param request
   * @param allowPrerenderedRoutes
   */
  match(request, allowPrerenderedRoutes = false) {
    const url = new URL(request.url);
    if (this.manifest.assets.has(url.pathname)) return void 0;
    let pathname = this.computePathnameFromDomain(request);
    if (!pathname) {
      pathname = prependForwardSlash(this.removeBase(url.pathname));
    }
    const routeData = this.pipeline.matchRoute(this.safeDecodeURI(pathname));
    if (!routeData) return void 0;
    if (allowPrerenderedRoutes) {
      return routeData;
    }
    if (routeData.prerender) {
      if (routeData.params.length > 0) {
        const allMatches = this.pipeline.matchAllRoutes(this.safeDecodeURI(pathname));
        return allMatches.find((r) => !r.prerender);
      }
      return void 0;
    }
    return routeData;
  }
  /**
   * A matching route function to use in the development server.
   * Contrary to the `.match` function, this function resolves props and params, returning the correct
   * route based on the priority, segments. It also returns the correct, resolved pathname.
   * @param pathname
   */
  devMatch(pathname) {
    return void 0;
  }
  computePathnameFromDomain(request) {
    return computePathnameFromDomain(
      request,
      new URL(request.url),
      this.manifest.i18n,
      this.manifest.base,
      this.manifest.trailingSlash,
      this.logger
    );
  }
  async render(request, {
    addCookieHeader = false,
    clientAddress = Reflect.get(request, clientAddressSymbol),
    locals,
    prerenderedErrorPageFetch = fetch,
    routeData,
    waitUntil
  } = {}) {
    await this.pipeline.getLogger();
    if (routeData) {
      this.logger.debug(
        "router",
        "The adapter " + this.manifest.adapterName + " provided a custom RouteData for ",
        request.url
      );
      this.logger.debug("router", "RouteData");
      this.logger.debug("router", routeData);
    }
    if (locals) {
      if (typeof locals !== "object") {
        const error = new AstroError(LocalsNotAnObject);
        this.logger.error(null, error.stack);
        return this.renderError(request, {
          addCookieHeader,
          clientAddress,
          prerenderedErrorPageFetch,
          // If locals are invalid, we don't want to include them when
          // rendering the error page
          locals: void 0,
          routeData,
          waitUntil,
          status: 500,
          error
        });
      }
    }
    if (!routeData) {
      const domainPathname = this.computePathnameFromDomain(request);
      if (domainPathname) {
        routeData = this.pipeline.matchRoute(this.safeDecodeURI(domainPathname));
      }
    }
    const resolvedOptions = {
      addCookieHeader,
      clientAddress,
      prerenderedErrorPageFetch,
      locals,
      routeData,
      waitUntil
    };
    let response;
    if (this.#fetchHandler instanceof DefaultFetchHandler) {
      Reflect.set(request, appSymbol, this);
      response = await this.#fetchHandler.renderWithOptions(request, resolvedOptions);
    } else {
      setRenderOptions(request, resolvedOptions);
      Reflect.set(request, appSymbol, this);
      response = await this.#fetchHandler.fetch(request);
    }
    this.#warnMissingFeatures();
    if (response.headers.get(ASTRO_ERROR_HEADER)) {
      response.headers.delete(ASTRO_ERROR_HEADER);
      return this.renderError(request, {
        addCookieHeader,
        clientAddress,
        prerenderedErrorPageFetch,
        locals,
        routeData,
        waitUntil,
        response,
        status: response.status,
        error: response.status === 500 ? null : void 0
      });
    }
    return response;
  }
  setCookieHeaders(response) {
    return getSetCookiesFromResponse(response);
  }
  /**
   * Reads all the cookies written by `Astro.cookie.set()` onto the passed response.
   * For example,
   * ```ts
   * for (const cookie_ of App.getSetCookieFromResponse(response)) {
   *     const cookie: string = cookie_
   * }
   * ```
   * @param response The response to read cookies from.
   * @returns An iterator that yields key-value pairs as equal-sign-separated strings.
   */
  static getSetCookieFromResponse = getSetCookiesFromResponse;
  /**
   * If it is a known error code, try sending the according page (e.g. 404.astro / 500.astro).
   * This also handles pre-rendered /404 or /500 routes.
   *
   * Delegates to the app's configured `ErrorHandler`. To customize behavior
   * for a specific environment, override `createErrorHandler()` rather than
   * this method.
   */
  async renderError(request, options) {
    return this.#errorHandler.renderError(request, options);
  }
  /**
   * One-shot check: after the first request with a custom `src/app.ts`,
   * compare `usedFeatures` against the manifest and warn about any
   * configured features the user's pipeline doesn't call.
   */
  #warnMissingFeatures() {
    if (this.#featureCheckDone || !this.#hasCustomFetchHandler) return;
    this.#featureCheckDone = true;
    const manifest = this.manifest;
    const missing = [];
    const used = this.pipeline.usedFeatures;
    if (manifest.routes.some((r) => r.routeData.type === "redirect") && !(used & PipelineFeatures.redirects)) {
      missing.push("redirects");
    }
    if (manifest.sessionConfig && !(used & PipelineFeatures.sessions)) {
      missing.push("sessions");
    }
    if (manifest.actions && !(used & PipelineFeatures.actions)) {
      missing.push("actions");
    }
    if (manifest.middleware && !(used & PipelineFeatures.middleware)) {
      missing.push("middleware");
    }
    if (manifest.i18n && manifest.i18n.strategy !== "manual" && !(used & PipelineFeatures.i18n)) {
      missing.push("i18n");
    }
    if (manifest.cacheConfig && !(used & PipelineFeatures.cache)) {
      missing.push("cache");
    }
    for (const feature of missing) {
      this.logger.warn(
        "router",
        `Your project uses ${feature}, but your custom src/app.ts does not call the ${feature}() handler. This feature will not work unless you add it to your app.ts pipeline.`
      );
    }
  }
  getDefaultStatusCode(routeData, pathname) {
    if (!routeData.pattern.test(pathname)) {
      for (const fallbackRoute of routeData.fallbackRoutes) {
        if (fallbackRoute.pattern.test(pathname)) {
          return 302;
        }
      }
    }
    const route = removeTrailingForwardSlash(routeData.route);
    if (route.endsWith("/404")) return 404;
    if (route.endsWith("/500")) return 500;
    return 200;
  }
  getManifest() {
    return this.pipeline.manifest;
  }
  logThisRequest({
    pathname,
    method,
    statusCode,
    isRewrite,
    timeStart
  }) {
    const timeEnd = performance.now();
    this.logRequest({
      pathname,
      method,
      statusCode,
      isRewrite,
      reqTime: timeEnd - timeStart
    });
  }
}

function getAssetsPrefix(fileExtension, assetsPrefix) {
  let prefix = "";
  if (!assetsPrefix) {
    prefix = "";
  } else if (typeof assetsPrefix === "string") {
    prefix = assetsPrefix;
  } else {
    const dotLessFileExtension = fileExtension.slice(1);
    prefix = assetsPrefix[dotLessFileExtension] || assetsPrefix.fallback;
  }
  return prefix;
}

const URL_PARSE_BASE = "https://astro.build";
function splitAssetPath(path) {
  const parsed = new URL(path, URL_PARSE_BASE);
  const isAbsolute = URL.canParse(path);
  const pathname = !isAbsolute && !path.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
  return {
    pathname,
    suffix: `${parsed.search}${parsed.hash}`
  };
}
function createAssetLink(href, base, assetsPrefix, queryParams) {
  const { pathname, suffix } = splitAssetPath(href);
  let url = "";
  if (assetsPrefix) {
    const pf = getAssetsPrefix(fileExtension(pathname), assetsPrefix);
    url = joinPaths(pf, slash(pathname)) + suffix;
  } else if (base) {
    url = prependForwardSlash(joinPaths(base, slash(pathname))) + suffix;
  } else {
    url = href;
  }
  return url;
}
function createStylesheetElement(stylesheet, base, assetsPrefix, queryParams) {
  if (stylesheet.type === "inline") {
    return {
      props: {},
      children: stylesheet.content
    };
  } else {
    return {
      props: {
        rel: "stylesheet",
        href: createAssetLink(stylesheet.src, base, assetsPrefix)
      },
      children: ""
    };
  }
}
function createStylesheetElementSet(stylesheets, base, assetsPrefix, queryParams) {
  return new Set(
    stylesheets.map((s) => createStylesheetElement(s, base, assetsPrefix))
  );
}
function createModuleScriptElement(script, base, assetsPrefix, queryParams) {
  if (script.type === "external") {
    return createModuleScriptElementWithSrc(script.value, base, assetsPrefix);
  } else {
    return {
      props: {
        type: "module"
      },
      children: script.value
    };
  }
}
function createModuleScriptElementWithSrc(src, base, assetsPrefix, queryParams) {
  return {
    props: {
      type: "module",
      src: createAssetLink(src, base, assetsPrefix)
    },
    children: ""
  };
}

class AppPipeline extends Pipeline {
  getName() {
    return "AppPipeline";
  }
  static create({ manifest, streaming }) {
    const resolve = async function resolve2(specifier) {
      if (!(specifier in manifest.entryModules)) {
        throw new Error(`Unable to resolve [${specifier}]`);
      }
      const bundlePath = manifest.entryModules[specifier];
      if (bundlePath.startsWith("data:") || bundlePath.length === 0) {
        return bundlePath;
      } else {
        return createAssetLink(bundlePath, manifest.base, manifest.assetsPrefix);
      }
    };
    const logger = createConsoleLogger({ level: manifest.logLevel });
    const pipeline = new AppPipeline(
      logger,
      manifest,
      "production",
      manifest.renderers,
      resolve,
      streaming,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0
    );
    return pipeline;
  }
  async headElements(routeData) {
    const { assetsPrefix, base } = this.manifest;
    const routeInfo = this.manifest.routes.find(
      (route) => route.routeData.route === routeData.route
    );
    const links = /* @__PURE__ */ new Set();
    const scripts = /* @__PURE__ */ new Set();
    const styles = createStylesheetElementSet(routeInfo?.styles ?? [], base, assetsPrefix);
    for (const script of routeInfo?.scripts ?? []) {
      if ("stage" in script) {
        if (script.stage === "head-inline") {
          scripts.add({
            props: {},
            children: script.children
          });
        }
      } else {
        scripts.add(createModuleScriptElement(script, base, assetsPrefix));
      }
    }
    return { links, styles, scripts };
  }
  componentMetadata() {
  }
  async getComponentByRoute(routeData) {
    const module = await this.getModuleForRoute(routeData);
    return module.page();
  }
  async getModuleForRoute(route) {
    for (const defaultRoute of this.defaultRoutes) {
      if (route.component === defaultRoute.component) {
        return {
          page: () => Promise.resolve(defaultRoute.instance)
        };
      }
    }
    let routeToProcess = route;
    if (routeIsRedirect(route)) {
      if (route.redirectRoute) {
        routeToProcess = route.redirectRoute;
      } else {
        return RedirectSinglePageBuiltModule;
      }
    } else if (routeIsFallback(route)) {
      routeToProcess = getFallbackRoute(route, this.manifest.routes);
    }
    if (this.manifest.pageMap) {
      const importComponentInstance = this.manifest.pageMap.get(routeToProcess.component);
      if (!importComponentInstance) {
        throw new Error(
          `Unexpectedly unable to find a component instance for route ${route.route}`
        );
      }
      return await importComponentInstance();
    } else if (this.manifest.pageModule) {
      return this.manifest.pageModule;
    }
    throw new Error(
      "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
    );
  }
  async tryRewrite(payload, request) {
    const { newUrl, pathname, routeData } = findRouteToRewrite({
      payload,
      request,
      routes: this.manifest?.routes.map((r) => r.routeData),
      trailingSlash: this.manifest.trailingSlash,
      buildFormat: this.manifest.buildFormat,
      base: this.manifest.base,
      outDir: this.manifest?.serverLike ? this.manifest.buildClientDir : this.manifest.outDir
    });
    const componentInstance = await this.getComponentByRoute(routeData);
    return { newUrl, pathname, componentInstance, routeData };
  }
}

class App extends BaseApp {
  createPipeline(streaming) {
    return AppPipeline.create({
      manifest: this.manifest,
      streaming
    });
  }
  isDev() {
    return false;
  }
  // Should we log something for our users?
  logRequest(_options) {
  }
}

async function handle(manifest, app, request, env, context) {
  const { pathname } = new URL(request.url);
  const bindingName = "SESSION";
  globalThis.__env__ ??= {};
  globalThis.__env__[bindingName] = env[bindingName];
  if (manifest.assets.has(pathname)) {
    return env.ASSETS.fetch(request.url.replace(/\.html$/, ""));
  }
  const routeData = app.match(request);
  if (!routeData) {
    const asset = await env.ASSETS.fetch(
      request.url.replace(/index.html$/, "").replace(/\.html$/, "")
    );
    if (asset.status !== 404) {
      return asset;
    }
  }
  Reflect.set(request, /* @__PURE__ */ Symbol.for("astro.clientAddress"), request.headers.get("cf-connecting-ip"));
  const locals = {
    runtime: {
      env,
      cf: request.cf,
      caches,
      ctx: {
        waitUntil: (promise) => context.waitUntil(promise),
        // Currently not available: https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions
        passThroughOnException: () => {
          throw new Error(
            "`passThroughOnException` is currently not available in Cloudflare Pages. See https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions."
          );
        },
        props: {}
      }
    }
  };
  const response = await app.render(
    request,
    {
      routeData,
      locals,
      prerenderedErrorPageFetch: async (url) => {
        return env.ASSETS.fetch(url.replace(/\.html$/, ""));
      }
    }
  );
  if (app.setCookieHeaders) {
    for (const setCookieHeader of app.setCookieHeaders(response)) {
      response.headers.append("Set-Cookie", setCookieHeader);
    }
  }
  return response;
}

function createExports(manifest) {
  const app = new App(manifest);
  const fetch = async (request, env, context) => {
    return await handle(manifest, app, request, env, context);
  };
  return { default: { fetch } };
}

const _virtual_astro_adapterEntrypoint = undefined;

const serverEntrypointModule = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  createExports,
  default: _virtual_astro_adapterEntrypoint
}, Symbol.toStringTag, { value: 'Module' }));

const renderers = [];

const serializedData = [{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","distURL":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/_image","component":"node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js","params":[],"pathname":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"type":"endpoint","prerender":false,"fallbackRoutes":[],"distURL":[],"isIndex":false,"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/admin/order","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/admin\\/order\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"admin","dynamic":false,"spread":false}],[{"content":"order","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/admin/order.ts","pathname":"/api/admin/order","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/chat","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/chat\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"chat","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/chat.ts","pathname":"/api/chat","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/lead","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/lead\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"lead","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/lead.ts","pathname":"/api/lead","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/track","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/track\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"track","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/track.ts","pathname":"/api/track","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}];
				serializedData.map(deserializeRouteInfo);

const _page0 = () => Promise.resolve().then(() => imageEndpoint___js);
const _page1 = () => Promise.resolve().then(() => order___ts);
const _page2 = () => Promise.resolve().then(() => chat___ts);
const _page3 = () => Promise.resolve().then(() => lead___ts);
const _page4 = () => Promise.resolve().then(() => track___ts);
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/api/admin/order.ts", _page1],
    ["src/pages/api/chat.ts", _page2],
    ["src/pages/api/lead.ts", _page3],
    ["src/pages/api/track.ts", _page4]
]);

const _manifest = deserializeManifest(({"rootDir":"file:///D:/User/Downloads/packershub_v2/","cacheDir":"file:///D:/User/Downloads/packershub_v2/node_modules/.astro/","outDir":"file:///D:/User/Downloads/packershub_v2/dist/","srcDir":"file:///D:/User/Downloads/packershub_v2/src/","publicDir":"file:///D:/User/Downloads/packershub_v2/public/","buildClientDir":"file:///D:/User/Downloads/packershub_v2/dist/","buildServerDir":"file:///D:/User/Downloads/packershub_v2/dist/_worker.js/","adapterName":"@astrojs/cloudflare","assetsDir":"_assets","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","distURL":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/_image","component":"node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js","params":[],"pathname":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"type":"endpoint","prerender":false,"fallbackRoutes":[],"distURL":[],"isIndex":false,"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/admin/orders","isIndex":false,"type":"page","pattern":"^\\/admin\\/orders\\/?$","segments":[[{"content":"admin","dynamic":false,"spread":false}],[{"content":"orders","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/admin/orders.astro","pathname":"/admin/orders","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/api/admin/order","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/admin\\/order\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"admin","dynamic":false,"spread":false}],[{"content":"order","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/admin/order.ts","pathname":"/api/admin/order","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/api/chat","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/chat\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"chat","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/chat.ts","pathname":"/api/chat","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/api/lead","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/lead\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"lead","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/lead.ts","pathname":"/api/lead","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/api/track","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/track\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"track","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/track.ts","pathname":"/api/track","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/blog/[slug]","isIndex":false,"type":"page","pattern":"^\\/blog\\/([^/]+?)\\/?$","segments":[[{"content":"blog","dynamic":false,"spread":false}],[{"content":"slug","dynamic":true,"spread":false}]],"params":["slug"],"component":"src/pages/blog/[slug].astro","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/blog","isIndex":true,"type":"page","pattern":"^\\/blog\\/?$","segments":[[{"content":"blog","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/blog/index.astro","pathname":"/blog","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/booking","isIndex":false,"type":"page","pattern":"^\\/booking\\/?$","segments":[[{"content":"booking","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/booking.astro","pathname":"/booking","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/contact","isIndex":false,"type":"page","pattern":"^\\/contact\\/?$","segments":[[{"content":"contact","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/contact.astro","pathname":"/contact","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/franchise","isIndex":false,"type":"page","pattern":"^\\/franchise\\/?$","segments":[[{"content":"franchise","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/franchise.astro","pathname":"/franchise","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/privacy","isIndex":false,"type":"page","pattern":"^\\/privacy\\/?$","segments":[[{"content":"privacy","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/privacy.astro","pathname":"/privacy","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/services","isIndex":false,"type":"page","pattern":"^\\/services\\/?$","segments":[[{"content":"services","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/services.astro","pathname":"/services","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/terms","isIndex":false,"type":"page","pattern":"^\\/terms\\/?$","segments":[[{"content":"terms","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/terms.astro","pathname":"/terms","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/track","isIndex":true,"type":"page","pattern":"^\\/track\\/?$","segments":[[{"content":"track","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/track/index.astro","pathname":"/track","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/[state]/[city]","isIndex":false,"type":"page","pattern":"^\\/([^/]+?)\\/([^/]+?)\\/?$","segments":[[{"content":"state","dynamic":true,"spread":false}],[{"content":"city","dynamic":true,"spread":false}]],"params":["state","city"],"component":"src/pages/[state]/[city].astro","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/[state]","isIndex":true,"type":"page","pattern":"^\\/([^/]+?)\\/?$","segments":[[{"content":"state","dynamic":true,"spread":false}]],"params":["state"],"component":"src/pages/[state]/index.astro","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"_assets/page.C3zhh8Lx.js"}],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"serverLike":true,"middlewareMode":"classic","site":"https://www.packershub.in","base":"/","trailingSlash":"ignore","compressHTML":true,"experimentalQueuedRendering":{"enabled":false,"poolSize":0,"contentCache":false},"componentMetadata":[["D:/User/Downloads/packershub_v2/src/pages/404.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/[state]/[city].astro",{"propagation":"in-tree","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/[state]/index.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/about.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/admin/orders.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/blog/[slug].astro",{"propagation":"in-tree","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/blog/index.astro",{"propagation":"in-tree","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/booking.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/contact.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/franchise.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/index.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/privacy.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/services.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/terms.astro",{"propagation":"none","containsHead":true}],["D:/User/Downloads/packershub_v2/src/pages/track/index.astro",{"propagation":"none","containsHead":true}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["\u0000virtual:astro:page:src/pages/[state]/[city]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000virtual:astro:pages",{"propagation":"in-tree","containsHead":false}],["\u0000virtual:astro:manifest",{"propagation":"in-tree","containsHead":false}],["D:/User/Downloads/packershub_v2/node_modules/astro/dist/entrypoints/prerender.js",{"propagation":"in-tree","containsHead":false}],["\u0000virtual:astro:page:src/pages/blog/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000virtual:astro:page:src/pages/blog/index@_@astro",{"propagation":"in-tree","containsHead":false}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000virtual:astro:actions/noop-entrypoint":"chunks/noop-entrypoint_ntO3dYp_.mjs","\u0000virtual:astro:middleware":"chunks/_virtual_astro_middleware_Cuwz0iNQ.mjs","\u0000virtual:astro:session-driver":"chunks/_virtual_astro_session-driver_x9Ra2-EZ.mjs","\u0000virtual:astro:server-island-manifest":"chunks/_virtual_astro_server-island-manifest_DBxKN41v.mjs","\u0000virtual:astro:page:src/pages/404@_@astro":"chunks/404_Bay0i371.mjs","\u0000virtual:astro:page:src/pages/about@_@astro":"chunks/about_6BqYQwN4.mjs","\u0000virtual:astro:page:src/pages/admin/orders@_@astro":"chunks/orders_Be1qgLvG.mjs","\u0000virtual:astro:page:src/pages/blog/[slug]@_@astro":"chunks/_slug__BffkHExu.mjs","\u0000virtual:astro:page:src/pages/blog/index@_@astro":"chunks/index_CsiVdoIn.mjs","\u0000virtual:astro:page:src/pages/booking@_@astro":"chunks/booking_DdHJO8yZ.mjs","\u0000virtual:astro:page:src/pages/contact@_@astro":"chunks/contact_CyWry66W.mjs","\u0000virtual:astro:page:src/pages/franchise@_@astro":"chunks/franchise_CZy_fvvR.mjs","\u0000virtual:astro:page:src/pages/privacy@_@astro":"chunks/privacy_ons7g5Qd.mjs","\u0000virtual:astro:page:src/pages/services@_@astro":"chunks/services_X7azpXAn.mjs","\u0000virtual:astro:page:src/pages/terms@_@astro":"chunks/terms_CfPTMHPT.mjs","\u0000virtual:astro:page:src/pages/track/index@_@astro":"chunks/index_BMO1Ii6v.mjs","\u0000virtual:astro:page:src/pages/[state]/[city]@_@astro":"chunks/_city__DgKkh4gZ.mjs","\u0000virtual:astro:page:src/pages/[state]/index@_@astro":"chunks/index_DNW9y5ZC.mjs","\u0000virtual:astro:page:src/pages/index@_@astro":"chunks/index_BJsAHz7v.mjs","D:\\User\\Downloads\\packershub_v2\\.astro\\content-assets.mjs":"chunks/content-assets_XqCgPAV2.mjs","\u0000virtual:astro:get-image":"chunks/_virtual_astro_get-image_D6tO-Kqk.mjs","D:\\User\\Downloads\\packershub_v2\\.astro\\content-modules.mjs":"chunks/content-modules_Bvq7llv8.mjs","D:/User/Downloads/packershub_v2/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_DAIcrpYY.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_2UnnYAge.mjs","astro/entrypoints/prerender":"prerender-entry.Dzgh7i2E.mjs","virtual:astro:legacy-ssr-entry":"index.js","D:/User/Downloads/packershub_v2/src/components/Analytics.astro?astro&type=script&index=0&lang.ts":"_assets/Analytics.astro_astro_type_script_index_0_lang.paFksblh.js","D:/User/Downloads/packershub_v2/src/components/ChatBot.astro?astro&type=script&index=0&lang.ts":"_assets/ChatBot.astro_astro_type_script_index_0_lang.BR2rDztc.js","D:/User/Downloads/packershub_v2/src/components/FloatingCTA.astro?astro&type=script&index=0&lang.ts":"_assets/FloatingCTA.astro_astro_type_script_index_0_lang.DfEGS7e7.js","D:/User/Downloads/packershub_v2/src/components/Header.astro?astro&type=script&index=0&lang.ts":"_assets/Header.astro_astro_type_script_index_0_lang.CB8iO1Zd.js","D:/User/Downloads/packershub_v2/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts":"_assets/BaseLayout.astro_astro_type_script_index_0_lang.CUGHJuQI.js","D:/User/Downloads/packershub_v2/src/pages/[state]/[city].astro?astro&type=script&index=0&lang.ts":"_assets/_city_.astro_astro_type_script_index_0_lang.DNcEoiqe.js","D:/User/Downloads/packershub_v2/src/pages/admin/orders.astro?astro&type=script&index=0&lang.ts":"_assets/orders.astro_astro_type_script_index_0_lang.JZ65Icg_.js","D:/User/Downloads/packershub_v2/src/pages/contact.astro?astro&type=script&index=0&lang.ts":"_assets/contact.astro_astro_type_script_index_0_lang.CWqLlLEb.js","D:/User/Downloads/packershub_v2/src/pages/franchise.astro?astro&type=script&index=0&lang.ts":"_assets/franchise.astro_astro_type_script_index_0_lang.DOdcPO0s.js","D:/User/Downloads/packershub_v2/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_assets/index.astro_astro_type_script_index_0_lang.BKb4GlYA.js","astro:scripts/page.js":"_assets/page.C3zhh8Lx.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["D:/User/Downloads/packershub_v2/src/components/Analytics.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};window.phTrack=function(){};"],["D:/User/Downloads/packershub_v2/src/components/ChatBot.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};const b=`You are the AI customer support assistant for PackersHub, a professional packers and movers company in South India.\n\nKEY FACTS:\n- Company: PackersHub | Website: www.packershub.in\n- Phone/WhatsApp: +91 77310 74075\n- Address: BV Nagar, Nellore, Andhra Pradesh, India - 524004\n- Service Cities: 100 cities across Andhra Pradesh, Telangana, Tamil Nadu, Karnataka, Kerala\n- Services: House Shifting, Office Relocation, Bike Transport, Car Carrier, Warehouse Storage, Intercity Moves\n- Hours: 24/7 service\n- Payment: UPI, NEFT, Credit/Debit Card, Cash accepted\n- Key Feature: All-inclusive transparent pricing, no hidden charges\n- Guarantee: 100% Safe Delivery Guarantee, goods-in-transit insurance included\n\nRESPONSE STYLE:\n- Be warm, helpful, professional, and concise\n- Keep responses under 100 words\n- Always offer to connect them to human support via WhatsApp or call\n- For pricing, always say to call/WhatsApp for a free quote (pricing depends on volume, distance, type of goods)\n- End with a call-to-action when relevant`,i=[];let l=!1;const d=document.getElementById(\"chatbot-toggle\"),p=document.getElementById(\"chatbot-window\"),y=document.getElementById(\"chat-open-icon\"),v=document.getElementById(\"chat-close-icon\"),w=document.getElementById(\"chat-close-btn\"),n=document.getElementById(\"chat-messages\"),a=document.getElementById(\"chat-input\"),I=document.getElementById(\"chat-send\"),h=document.getElementById(\"chat-dot\"),m=document.getElementById(\"quick-replies\");function T(){p?.classList.replace(\"closed\",\"open\"),d?.setAttribute(\"aria-expanded\",\"true\"),y?.classList.add(\"hidden\"),v?.classList.remove(\"hidden\"),h&&(h.style.display=\"none\"),setTimeout(()=>a?.focus(),300)}function f(){p?.classList.replace(\"open\",\"closed\"),d?.setAttribute(\"aria-expanded\",\"false\"),y?.classList.remove(\"hidden\"),v?.classList.add(\"hidden\")}d?.addEventListener(\"click\",()=>{p?.classList.contains(\"open\")?f():T()});w?.addEventListener(\"click\",f);function c(e,t){const s=document.createElement(\"div\");return s.className=e===\"user\"?\"msg-user\":\"msg-bot\",s.textContent=t,n?.appendChild(s),n.scrollTop=n.scrollHeight,s}function A(){const e=document.createElement(\"div\");e.className=\"typing-indicator\",e.id=\"typing\",e.innerHTML=\"<span></span><span></span><span></span>\",n?.appendChild(e),n.scrollTop=n.scrollHeight}function g(){document.getElementById(\"typing\")?.remove()}async function u(e){if(!(!e.trim()||l)){l=!0,i.length===0&&m&&(m.style.display=\"none\"),c(\"user\",e),i.push({role:\"user\",content:e}),a&&(a.value=\"\"),A();try{const t=await fetch(\"/api/chat\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({messages:i,system:b})});if(g(),t.ok){const o=(await t.json()).reply||\"I'm having trouble right now. Please call us at +91 77310 74075 or WhatsApp for immediate help!\";c(\"assistant\",o),i.push({role:\"assistant\",content:o})}else c(\"assistant\",\"Sorry, I'm having trouble right now. Please call +91 77310 74075 or WhatsApp us for instant help!\")}catch{g(),c(\"assistant\",\"Connection issue. Please call +91 77310 74075 or WhatsApp us directly — we're available 24/7!\")}l=!1}}I?.addEventListener(\"click\",()=>u(a?.value||\"\"));a?.addEventListener(\"keydown\",e=>{e.key===\"Enter\"&&!e.shiftKey&&(e.preventDefault(),u(a.value))});document.querySelectorAll(\".quick-reply\").forEach(e=>{e.addEventListener(\"click\",()=>u(e.textContent||\"\"))});const r=document.createElement(\"div\");r.className=\"reading-progress\";r.id=\"reading-progress\";document.body.prepend(r);window.addEventListener(\"scroll\",()=>{const{scrollTop:e,scrollHeight:t,clientHeight:s}=document.documentElement,o=e/(t-s)*100;r.style.width=`${Math.min(o,100)}%`},{passive:!0});const E=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&(t.target.classList.add(\"visible\"),E.unobserve(t.target))})},{threshold:.1,rootMargin:\"0px 0px -50px 0px\"});document.querySelectorAll(\".reveal\").forEach(e=>E.observe(e));"],["D:/User/Downloads/packershub_v2/src/components/FloatingCTA.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};document.getElementById(\"wa-fab\")?.addEventListener(\"click\",()=>window.phTrack?.(\"floating_whatsapp_click\"));document.getElementById(\"call-fab\")?.addEventListener(\"click\",()=>window.phTrack?.(\"floating_call_click\"));"],["D:/User/Downloads/packershub_v2/src/components/Header.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};const d=document.getElementById(\"mobile-menu-btn\"),e=document.getElementById(\"mobile-menu\"),o=document.getElementById(\"mobile-menu-close\"),c=document.getElementById(\"menu-icon\"),s=document.getElementById(\"close-icon\");function i(){e?.classList.add(\"open\"),d?.setAttribute(\"aria-expanded\",\"true\"),e?.setAttribute(\"aria-hidden\",\"false\"),c?.classList.add(\"hidden\"),s?.classList.remove(\"hidden\"),document.body.style.overflow=\"hidden\"}function t(){e?.classList.remove(\"open\"),d?.setAttribute(\"aria-expanded\",\"false\"),e?.setAttribute(\"aria-hidden\",\"true\"),c?.classList.remove(\"hidden\"),s?.classList.add(\"hidden\"),document.body.style.overflow=\"\"}d?.addEventListener(\"click\",()=>{e?.classList.contains(\"open\")?t():i()});o?.addEventListener(\"click\",t);document.addEventListener(\"keydown\",n=>{n.key===\"Escape\"&&t()});e?.querySelectorAll(\"a\").forEach(n=>n.addEventListener(\"click\",t));document.getElementById(\"header-call-link\")?.addEventListener(\"click\",()=>window.phTrack?.(\"header_call_click\"));document.getElementById(\"header-whatsapp-link\")?.addEventListener(\"click\",()=>window.phTrack?.(\"header_whatsapp_click\"));"],["D:/User/Downloads/packershub_v2/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};const n=document.getElementById(\"site-header\"),l=new IntersectionObserver(([e])=>n?.classList.toggle(\"scrolled\",!e.isIntersecting),{threshold:0,rootMargin:\"-64px 0px 0px 0px\"}),r=document.createElement(\"div\");r.style.height=\"1px\";document.body.insertAdjacentElement(\"afterbegin\",r);l.observe(r);const o=document.querySelectorAll(\".reveal\");if(o.length>0){const e=new IntersectionObserver(t=>{t.forEach(s=>{s.isIntersecting&&(s.target.classList.add(\"visible\"),e.unobserve(s.target))})},{threshold:.08,rootMargin:\"0px 0px -40px 0px\"});o.forEach(t=>e.observe(t))}"],["D:/User/Downloads/packershub_v2/src/pages/[state]/[city].astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};document.querySelectorAll(\"[data-faq]\").forEach(a=>{const o=a.querySelector(\"[data-faq-q]\"),s=a.querySelector(\"[data-faq-a]\");o?.addEventListener(\"click\",()=>{const c=s?.classList.contains(\"open\");document.querySelectorAll(\"[data-faq-a]\").forEach(e=>e.classList.remove(\"open\")),document.querySelectorAll(\"[data-faq]\").forEach(e=>e.classList.remove(\"open\")),c||(s?.classList.add(\"open\"),a.classList.add(\"open\"))})});"],["D:/User/Downloads/packershub_v2/src/pages/admin/orders.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};const s=document.getElementById(\"admin-token\"),c=document.getElementById(\"token-status\"),i=\"ph_admin_token\";function a(){return localStorage.getItem(i)||\"\"}(function(){const t=a();t&&(s.value=t,c.textContent=\"Token loaded from this device.\")})();document.getElementById(\"save-token\").addEventListener(\"click\",()=>{localStorage.setItem(i,s.value.trim()),c.textContent=\"Saved on this device.\"});let d=null;document.getElementById(\"lookup-btn\").addEventListener(\"click\",async()=>{const n=document.getElementById(\"lookup-id\").value.trim().toUpperCase(),t=document.getElementById(\"lookup-error\"),o=document.getElementById(\"record-card\");if(t.style.display=\"none\",o.style.display=\"none\",!n){t.textContent=\"Enter a Tracking ID.\",t.style.display=\"block\";return}try{const e=await(await fetch(`/api/admin/order?id=${encodeURIComponent(n)}`,{headers:{\"x-admin-token\":a()}})).json();if(!e.ok){t.textContent=e.error||\"Lookup failed.\",t.style.display=\"block\";return}d=e.record.trackingId,document.getElementById(\"record-name\").textContent=`${e.record.name||\"Unknown\"} — ${e.record.trackingId}`,document.getElementById(\"record-details\").innerHTML=[`Phone: ${e.record.phone}`,e.record.email?`Email: ${e.record.email}`:\"\",e.record.fromCity||e.record.toCity?`Route: ${e.record.fromCity||\"-\"} → ${e.record.toCity||\"-\"}`:\"\",e.record.moveDate?`Move date: ${e.record.moveDate}`:\"\",e.record.message?`Message: ${e.record.message}`:\"\",`Current status: <strong>${e.record.status}</strong>`].filter(Boolean).map(r=>`<div>${r}</div>`).join(\"\");const m=document.getElementById(\"status-select\");m.innerHTML=e.stages.map(r=>`<option value=\"${r}\" ${r===e.record.status?\"selected\":\"\"}>${r}</option>`).join(\"\"),o.style.display=\"block\"}catch{t.textContent=\"Network error. Please try again.\",t.style.display=\"block\"}});document.getElementById(\"update-btn\").addEventListener(\"click\",async()=>{if(!d)return;const n=document.getElementById(\"status-select\").value,t=document.getElementById(\"status-note\").value.trim(),o=document.getElementById(\"update-result\");try{const e=await(await fetch(\"/api/admin/order\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\",\"x-admin-token\":a()},body:JSON.stringify({id:d,status:n,note:t})})).json();o.textContent=e.ok?`Updated to \"${n}\".`:e.error||\"Update failed.\"}catch{o.textContent=\"Network error. Please try again.\"}});"],["D:/User/Downloads/packershub_v2/src/pages/contact.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};function l(){const t=\"ABCDEFGHJKLMNPQRSTUVWXYZ23456789\";let e=\"PH-\";for(let n=0;n<6;n++)e+=t[Math.floor(Math.random()*t.length)];return e}document.getElementById(\"contact-form\")?.addEventListener(\"submit\",t=>{t.preventDefault();const e=t.target,n=e.querySelector(\"[name=name]\").value,a=e.querySelector(\"[name=phone]\").value,o=e.querySelector(\"[name=email]\").value,c=e.querySelector(\"[name=message]\").value,s=l(),r=encodeURIComponent(`Hi PackersHub!\n\nName: ${n}\nPhone: ${a}${o?`\nEmail: `+o:\"\"}\n\nMessage: ${c}\n\n(Ref: ${s})`);window.open(`https://wa.me/917731074075?text=${r}`,\"_blank\"),window.phTrack?.(\"contact_form_submitted\"),fetch(\"/api/lead\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({type:\"contact\",trackingId:s,name:n,phone:a,email:o,message:c,source:\"contact_page\"})}).catch(()=>{}),document.getElementById(\"contact-sent-note\").style.display=\"block\",e.reset()});"],["D:/User/Downloads/packershub_v2/src/pages/franchise.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};function i(){const t=\"ABCDEFGHJKLMNPQRSTUVWXYZ23456789\";let e=\"PH-\";for(let o=0;o<6;o++)e+=t[Math.floor(Math.random()*t.length)];return e}document.getElementById(\"franchise-form-el\")?.addEventListener(\"submit\",t=>{t.preventDefault();const e=t.target,o=e.querySelector(\"[name=name]\").value,r=e.querySelector(\"[name=phone]\").value,a=e.querySelector(\"[name=email]\").value,n=e.querySelector(\"[name=city]\").value,s=e.querySelector(\"[name=message]\").value,c=i(),l=encodeURIComponent(`🤝 *Franchise/Partnership Enquiry — PackersHub*\n\n👤 *Name:* ${o}\n📞 *Phone:* ${r}${a?`\n📧 *Email:* `+a:\"\"}\n📍 *Interested City:* ${n}\n\n${s?\"📝 *Background:* \"+s+`\n\n`:\"\"}(Ref: ${c})`);window.open(`https://wa.me/917731074075?text=${l}`,\"_blank\"),window.phTrack?.(\"franchise_inquiry_submitted\",{city:n}),fetch(\"/api/lead\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({type:\"franchise\",trackingId:c,name:o,phone:r,email:a,message:s,fromCity:n,source:\"franchise_page\"})}).catch(()=>{}),document.getElementById(\"franchise-sent-note\").style.display=\"block\",e.reset()});document.querySelectorAll(\"[data-faq]\").forEach(t=>{const e=t.querySelector(\"[data-faq-q]\"),o=t.querySelector(\"[data-faq-a]\");e?.setAttribute(\"role\",\"button\"),e?.setAttribute(\"tabindex\",\"0\");const r=()=>{const a=o?.classList.contains(\"open\");document.querySelectorAll(\"[data-faq-a]\").forEach(n=>n.classList.remove(\"open\")),document.querySelectorAll(\"[data-faq]\").forEach(n=>n.classList.remove(\"open\")),document.querySelectorAll(\"[data-faq-q]\").forEach(n=>n.setAttribute(\"aria-expanded\",\"false\")),a||(o?.classList.add(\"open\"),t.classList.add(\"open\"),e?.setAttribute(\"aria-expanded\",\"true\"))};e?.addEventListener(\"click\",r),e?.addEventListener(\"keydown\",a=>{(a.key===\"Enter\"||a.key===\" \")&&(a.preventDefault(),r())})});"],["D:/User/Downloads/packershub_v2/src/pages/index.astro?astro&type=script&index=0&lang.ts","globalThis.process??={};globalThis.process.env??={};document.querySelectorAll(\"[data-faq]\").forEach(o=>{const e=o.querySelector(\"[data-faq-q]\"),s=o.querySelector(\"[data-faq-a]\");e?.setAttribute(\"role\",\"button\"),e?.setAttribute(\"tabindex\",\"0\");const r=()=>{const t=s?.classList.contains(\"open\");document.querySelectorAll(\"[data-faq-a]\").forEach(a=>a.classList.remove(\"open\")),document.querySelectorAll(\"[data-faq]\").forEach(a=>a.classList.remove(\"open\")),document.querySelectorAll(\"[data-faq-q]\").forEach(a=>a.setAttribute(\"aria-expanded\",\"false\")),t||(s?.classList.add(\"open\"),o.classList.add(\"open\"),e?.setAttribute(\"aria-expanded\",\"true\"))};e?.addEventListener(\"click\",r),e?.addEventListener(\"keydown\",t=>{(t.key===\"Enter\"||t.key===\" \")&&(t.preventDefault(),r())})});"]],"assets":["/favicon.svg","/icon-192.png","/icon-32.png","/icon-512.png","/llms.txt","/manifest.webmanifest","/og-image.jpg","/robots.txt","/_headers","/_redirects","/blog/how-to-pack-for-a-move.jpg","/blog/interstate-moving-guide-south-india.jpg","/blog/moving-checklist-complete-guide.jpg","/blog/office-relocation-planning-guide.jpg","/blog/packers-movers-hyderabad-guide.jpg","/_assets/page.C3zhh8Lx.js","/_worker.js/index.js","/_assets/interstate-moving-guide-south-india.BeKj3cSB.jpg","/_assets/moving-checklist-complete-guide.tf_PtFBx.jpg","/_assets/office-relocation-planning-guide.DFC-z6Uz.jpg","/_assets/packers-movers-hyderabad-guide.CR-nU6pG.jpg","/_assets/how-to-pack-for-a-move.D-1zEK2i.jpg","/_assets/BaseLayout.DupJfphF.css","/_assets/BookingEngine.3pTOT2kM.css","/_assets/page.C3zhh8Lx.js","/404.html","/about/index.html","/admin/orders/index.html","/blog/index.html","/booking/index.html","/contact/index.html","/franchise/index.html","/privacy/index.html","/services/index.html","/terms/index.html","/track/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"actionBodySizeLimit":1048576,"serverIslandBodySizeLimit":1048576,"allowedDomains":[],"key":"LCJdWTAVn1xJBCDZsNjvKiK8Bu+qgwHNT1hXh1H9YmA=","sessionConfig":{"driver":"unstorage/drivers/cloudflare-kv-binding"},"image":{},"devToolbar":{"enabled":false,"debugInfoOutput":""},"logLevel":"info","shouldInjectCspMetaTags":false}));
					const manifestRoutes = _manifest.routes;
					
					const manifest = Object.assign(_manifest, {
					  renderers,
					  actions: () => Promise.resolve().then(() => noopEntrypoint),
					  middleware: () => Promise.resolve().then(() => _virtual_astro_middleware),
					  sessionDriver: () => Promise.resolve().then(() => _virtual_astro_sessionDriver),
					  
					  serverIslandMappings: () => Promise.resolve().then(() => _virtual_astro_serverIslandManifest),
					  routes: manifestRoutes,
					  pageMap,
					});

const _exports = createExports?.(manifest) || serverEntrypointModule;
const _start = "start";
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
  serverEntrypointModule[_start](manifest, args);
}
var legacy_default = _exports;

const _virtual_astro_legacySsrEntry = legacy_default.default;

const VALID_SUPPORTED_FORMATS = [
  "jpeg",
  "jpg",
  "png",
  "tiff",
  "webp",
  "gif",
  "svg",
  "avif"
];
const DEFAULT_OUTPUT_FORMAT = "webp";
const DEFAULT_HASH_PROPS = [
  "src",
  "width",
  "height",
  "format",
  "quality",
  "fit",
  "position",
  "background"
];

const DEFAULT_RESOLUTIONS = [
  640,
  // older and lower-end phones
  750,
  // iPhone 6-8
  828,
  // iPhone XR/11
  960,
  // older horizontal phones
  1080,
  // iPhone 6-8 Plus
  1280,
  // 720p
  1668,
  // Various iPads
  1920,
  // 1080p
  2048,
  // QXGA
  2560,
  // WQXGA
  3200,
  // QHD+
  3840,
  // 4K
  4480,
  // 4.5K
  5120,
  // 5K
  6016
  // 6K
];
const LIMITED_RESOLUTIONS = [
  640,
  // older and lower-end phones
  750,
  // iPhone 6-8
  828,
  // iPhone XR/11
  1080,
  // iPhone 6-8 Plus
  1280,
  // 720p
  1668,
  // Various iPads
  2048,
  // QXGA
  2560
  // WQXGA
];
const getWidths = ({
  width,
  layout,
  breakpoints = DEFAULT_RESOLUTIONS,
  originalWidth
}) => {
  const smallerThanOriginal = (w) => !originalWidth || w <= originalWidth;
  if (layout === "full-width") {
    return breakpoints.filter(smallerThanOriginal);
  }
  if (!width) {
    return [];
  }
  const doubleWidth = width * 2;
  const maxSize = originalWidth ? Math.min(doubleWidth, originalWidth) : doubleWidth;
  if (layout === "fixed") {
    return originalWidth && width > originalWidth ? [originalWidth] : [width, maxSize];
  }
  if (layout === "constrained") {
    return [
      // Always include the image at 1x and 2x the specified width
      width,
      doubleWidth,
      ...breakpoints
    ].filter((w) => w <= maxSize).sort((a, b) => a - b);
  }
  return [];
};
const getSizesAttribute = ({
  width,
  layout
}) => {
  if (!width || !layout) {
    return void 0;
  }
  switch (layout) {
    // If screen is wider than the max size then image width is the max size,
    // otherwise it's the width of the screen
    case "constrained":
      return `(min-width: ${width}px) ${width}px, 100vw`;
    // Image is always the same width, whatever the size of the screen
    case "fixed":
      return `${width}px`;
    // Image is always the width of the screen
    case "full-width":
      return `100vw`;
    case "none":
    default:
      return void 0;
  }
};

function isESMImportedImage(src) {
  return typeof src === "object" || typeof src === "function" && "src" in src;
}
function isRemoteImage(src) {
  return typeof src === "string";
}
async function resolveSrc(src) {
  if (typeof src === "object" && "then" in src) {
    const resource = await src;
    return resource.default ?? resource;
  }
  return src;
}

const DATA_PREFIX = "data:";
function inferSourceFormat(src) {
  if (src.startsWith(DATA_PREFIX)) {
    const sepIndex = src.indexOf(";");
    const commaIndex = src.indexOf(",");
    const mimeEnd = sepIndex === -1 ? commaIndex : commaIndex === -1 ? sepIndex : Math.min(sepIndex, commaIndex);
    if (mimeEnd === -1) return void 0;
    const mime = src.slice(DATA_PREFIX.length, mimeEnd);
    if (mime === "image/svg+xml") return "svg";
    const sub = mime.split("/")[1];
    return sub || void 0;
  }
  try {
    const cleanSrc = removeQueryString(src).split("#")[0];
    const lastSlash = cleanSrc.lastIndexOf("/");
    const basename = lastSlash === -1 ? cleanSrc : cleanSrc.slice(lastSlash + 1);
    const lastDot = basename.lastIndexOf(".");
    if (lastDot === -1) return void 0;
    return basename.slice(lastDot + 1).toLowerCase();
  } catch {
    return void 0;
  }
}
function resolveDefaultOutputFormat(sourceFormat) {
  return sourceFormat === "svg" ? "svg" : DEFAULT_OUTPUT_FORMAT;
}

const decoder = new TextDecoder();
const toUTF8String = (input, start = 0, end = input.length) => decoder.decode(input.slice(start, end));
const toHexString = (input, start = 0, end = input.length) => input.slice(start, end).reduce((memo, i) => memo + `0${i.toString(16)}`.slice(-2), "");
const getView = (input, offset) => new DataView(input.buffer, input.byteOffset + offset);
const readInt16LE = (input, offset = 0) => getView(input, offset).getInt16(0, true);
const readUInt16BE = (input, offset = 0) => getView(input, offset).getUint16(0, false);
const readUInt16LE = (input, offset = 0) => getView(input, offset).getUint16(0, true);
const readUInt24LE = (input, offset = 0) => {
  const view = getView(input, offset);
  return view.getUint16(0, true) + (view.getUint8(2) << 16);
};
const readInt32LE = (input, offset = 0) => getView(input, offset).getInt32(0, true);
const readUInt32BE = (input, offset = 0) => getView(input, offset).getUint32(0, false);
const readUInt32LE = (input, offset = 0) => getView(input, offset).getUint32(0, true);
const readUInt64 = (input, offset, isBigEndian) => getView(input, offset).getBigUint64(0, !isBigEndian);
const methods = {
  readUInt16BE,
  readUInt16LE,
  readUInt32BE,
  readUInt32LE
};
function readUInt(input, bits, offset = 0, isBigEndian = false) {
  const endian = isBigEndian ? "BE" : "LE";
  const methodName = `readUInt${bits}${endian}`;
  return methods[methodName](input, offset);
}
function readBox(input, offset) {
  if (input.length - offset < 4) return;
  const boxSize = readUInt32BE(input, offset);
  if (input.length - offset < boxSize) return;
  return {
    name: toUTF8String(input, 4 + offset, 8 + offset),
    offset,
    size: boxSize
  };
}
function findBox(input, boxName, currentOffset) {
  while (currentOffset < input.length) {
    const box = readBox(input, currentOffset);
    if (!box) break;
    if (box.name === boxName) return box;
    currentOffset += box.size > 0 ? box.size : 8;
  }
}

const BMP = {
  validate: (input) => toUTF8String(input, 0, 2) === "BM",
  calculate: (input) => ({
    height: Math.abs(readInt32LE(input, 22)),
    width: readUInt32LE(input, 18)
  })
};

const TYPE_ICON = 1;
const SIZE_HEADER$1 = 2 + 2 + 2;
const SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4;
function getSizeFromOffset(input, offset) {
  const value = input[offset];
  return value === 0 ? 256 : value;
}
function getImageSize$1(input, imageIndex) {
  const offset = SIZE_HEADER$1 + imageIndex * SIZE_IMAGE_ENTRY;
  return {
    height: getSizeFromOffset(input, offset + 1),
    width: getSizeFromOffset(input, offset)
  };
}
const ICO = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0) return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_ICON;
  },
  calculate(input) {
    const nbImages = readUInt16LE(input, 4);
    const imageSize = getImageSize$1(input, 0);
    if (nbImages === 1) return imageSize;
    const images = [];
    for (let imageIndex = 0; imageIndex < nbImages; imageIndex += 1) {
      images.push(getImageSize$1(input, imageIndex));
    }
    return {
      width: imageSize.width,
      height: imageSize.height,
      images
    };
  }
};

const TYPE_CURSOR = 2;
const CUR = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0) return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_CURSOR;
  },
  calculate: (input) => ICO.calculate(input)
};

const DDS = {
  validate: (input) => readUInt32LE(input, 0) === 542327876,
  calculate: (input) => ({
    height: readUInt32LE(input, 12),
    width: readUInt32LE(input, 16)
  })
};

const gifRegexp = /^GIF8[79]a/;
const GIF = {
  validate: (input) => gifRegexp.test(toUTF8String(input, 0, 6)),
  calculate: (input) => ({
    height: readUInt16LE(input, 8),
    width: readUInt16LE(input, 6)
  })
};

const brandMap = {
  avif: "avif",
  avis: "avif",
  // avif-sequence
  mif1: "heif",
  msf1: "heif",
  // heif-sequence
  heic: "heic",
  heix: "heic",
  hevc: "heic",
  // heic-sequence
  hevx: "heic"
  // heic-sequence
};
function detectType(input, start, end) {
  let hasAvif = false;
  let hasHeic = false;
  let hasHeif = false;
  for (let i = start; i <= end; i += 4) {
    const brand = toUTF8String(input, i, i + 4);
    if (brand === "avif" || brand === "avis") hasAvif = true;
    else if (brand === "heic" || brand === "heix" || brand === "hevc" || brand === "hevx") hasHeic = true;
    else if (brand === "mif1" || brand === "msf1") hasHeif = true;
  }
  if (hasAvif) return "avif";
  if (hasHeic) return "heic";
  if (hasHeif) return "heif";
}
const HEIF = {
  validate(input) {
    const boxType = toUTF8String(input, 4, 8);
    if (boxType !== "ftyp") return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox) return false;
    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
    return brand in brandMap;
  },
  calculate(input) {
    const metaBox = findBox(input, "meta", 0);
    const iprpBox = metaBox && findBox(input, "iprp", metaBox.offset + 12);
    const ipcoBox = iprpBox && findBox(input, "ipco", iprpBox.offset + 8);
    if (!ipcoBox) {
      throw new TypeError("Invalid HEIF, no ipco box found");
    }
    const type = detectType(input, 8, metaBox.offset);
    const images = [];
    let currentOffset = ipcoBox.offset + 8;
    while (currentOffset < ipcoBox.offset + ipcoBox.size) {
      const ispeBox = findBox(input, "ispe", currentOffset);
      if (!ispeBox) break;
      const rawWidth = readUInt32BE(input, ispeBox.offset + 12);
      const rawHeight = readUInt32BE(input, ispeBox.offset + 16);
      const clapBox = findBox(input, "clap", currentOffset);
      let width = rawWidth;
      let height = rawHeight;
      if (clapBox && clapBox.offset < ipcoBox.offset + ipcoBox.size) {
        const cropRight = readUInt32BE(input, clapBox.offset + 12);
        width = rawWidth - cropRight;
      }
      images.push({ height, width });
      currentOffset = ispeBox.offset + ispeBox.size;
    }
    if (images.length === 0) {
      throw new TypeError("Invalid HEIF, no sizes found");
    }
    return {
      width: images[0].width,
      height: images[0].height,
      type,
      ...images.length > 1 ? { images } : {}
    };
  }
};

const SIZE_HEADER = 4 + 4;
const FILE_LENGTH_OFFSET = 4;
const ENTRY_LENGTH_OFFSET = 4;
const ICON_TYPE_SIZE = {
  ICON: 32,
  "ICN#": 32,
  // m => 16 x 16
  "icm#": 16,
  icm4: 16,
  icm8: 16,
  // s => 16 x 16
  "ics#": 16,
  ics4: 16,
  ics8: 16,
  is32: 16,
  s8mk: 16,
  icp4: 16,
  // l => 32 x 32
  icl4: 32,
  icl8: 32,
  il32: 32,
  l8mk: 32,
  icp5: 32,
  ic11: 32,
  // h => 48 x 48
  ich4: 48,
  ich8: 48,
  ih32: 48,
  h8mk: 48,
  // . => 64 x 64
  icp6: 64,
  ic12: 32,
  // t => 128 x 128
  it32: 128,
  t8mk: 128,
  ic07: 128,
  // . => 256 x 256
  ic08: 256,
  ic13: 256,
  // . => 512 x 512
  ic09: 512,
  ic14: 512,
  // . => 1024 x 1024
  ic10: 1024
};
function readImageHeader(input, imageOffset) {
  const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET;
  return [
    toUTF8String(input, imageOffset, imageLengthOffset),
    readUInt32BE(input, imageLengthOffset)
  ];
}
function getImageSize(type) {
  const size = ICON_TYPE_SIZE[type];
  return { width: size, height: size, type };
}
const ICNS = {
  validate: (input) => toUTF8String(input, 0, 4) === "icns",
  calculate(input) {
    const inputLength = input.length;
    const fileLength = readUInt32BE(input, FILE_LENGTH_OFFSET);
    let imageOffset = SIZE_HEADER;
    const images = [];
    while (imageOffset < fileLength && imageOffset < inputLength) {
      const imageHeader = readImageHeader(input, imageOffset);
      const imageSize = getImageSize(imageHeader[0]);
      images.push(imageSize);
      imageOffset += imageHeader[1];
    }
    if (images.length === 0) {
      throw new TypeError("Invalid ICNS, no sizes found");
    }
    return {
      width: images[0].width,
      height: images[0].height,
      ...images.length > 1 ? { images } : {}
    };
  }
};

const J2C = {
  // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
  validate: (input) => readUInt32BE(input, 0) === 4283432785,
  calculate: (input) => ({
    height: readUInt32BE(input, 12),
    width: readUInt32BE(input, 8)
  })
};

const JP2 = {
  validate(input) {
    const boxType = toUTF8String(input, 4, 8);
    if (boxType !== "jP  ") return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox) return false;
    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
    return brand === "jp2 ";
  },
  calculate(input) {
    const jp2hBox = findBox(input, "jp2h", 0);
    const ihdrBox = jp2hBox && findBox(input, "ihdr", jp2hBox.offset + 8);
    if (ihdrBox) {
      return {
        height: readUInt32BE(input, ihdrBox.offset + 8),
        width: readUInt32BE(input, ihdrBox.offset + 12)
      };
    }
    throw new TypeError("Unsupported JPEG 2000 format");
  }
};

const EXIF_MARKER = "45786966";
const APP1_DATA_SIZE_BYTES = 2;
const EXIF_HEADER_BYTES = 6;
const TIFF_BYTE_ALIGN_BYTES = 2;
const BIG_ENDIAN_BYTE_ALIGN = "4d4d";
const LITTLE_ENDIAN_BYTE_ALIGN = "4949";
const IDF_ENTRY_BYTES = 12;
const NUM_DIRECTORY_ENTRIES_BYTES = 2;
function isEXIF(input) {
  return toHexString(input, 2, 6) === EXIF_MARKER;
}
function extractSize(input, index) {
  return {
    height: readUInt16BE(input, index),
    width: readUInt16BE(input, index + 2)
  };
}
function extractOrientation(exifBlock, isBigEndian) {
  const idfOffset = 8;
  const offset = EXIF_HEADER_BYTES + idfOffset;
  const idfDirectoryEntries = readUInt(exifBlock, 16, offset, isBigEndian);
  for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
    const start = offset + NUM_DIRECTORY_ENTRIES_BYTES + directoryEntryNumber * IDF_ENTRY_BYTES;
    const end = start + IDF_ENTRY_BYTES;
    if (start > exifBlock.length) {
      return;
    }
    const block = exifBlock.slice(start, end);
    const tagNumber = readUInt(block, 16, 0, isBigEndian);
    if (tagNumber === 274) {
      const dataFormat = readUInt(block, 16, 2, isBigEndian);
      if (dataFormat !== 3) {
        return;
      }
      const numberOfComponents = readUInt(block, 32, 4, isBigEndian);
      if (numberOfComponents !== 1) {
        return;
      }
      return readUInt(block, 16, 8, isBigEndian);
    }
  }
}
function validateExifBlock(input, index) {
  const exifBlock = input.slice(APP1_DATA_SIZE_BYTES, index);
  const byteAlign = toHexString(
    exifBlock,
    EXIF_HEADER_BYTES,
    EXIF_HEADER_BYTES + TIFF_BYTE_ALIGN_BYTES
  );
  const isBigEndian = byteAlign === BIG_ENDIAN_BYTE_ALIGN;
  const isLittleEndian = byteAlign === LITTLE_ENDIAN_BYTE_ALIGN;
  if (isBigEndian || isLittleEndian) {
    return extractOrientation(exifBlock, isBigEndian);
  }
}
function validateInput(input, index) {
  if (index > input.length) {
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  }
}
const JPG = {
  validate: (input) => toHexString(input, 0, 2) === "ffd8",
  calculate(_input) {
    let input = _input.slice(4);
    let orientation;
    let next;
    while (input.length) {
      const i = readUInt16BE(input, 0);
      validateInput(input, i);
      if (input[i] !== 255) {
        input = input.slice(1);
        continue;
      }
      if (isEXIF(input)) {
        orientation = validateExifBlock(input, i);
      }
      next = input[i + 1];
      if (next === 192 || next === 193 || next === 194) {
        const size = extractSize(input, i + 5);
        if (!orientation) {
          return size;
        }
        return {
          height: size.height,
          orientation,
          width: size.width
        };
      }
      input = input.slice(i + 2);
    }
    throw new TypeError("Invalid JPG, no size found");
  }
};

class BitReader {
  // Skip the first 16 bits (2 bytes) of signature
  byteOffset = 2;
  bitOffset = 0;
  input;
  endianness;
  constructor(input, endianness) {
    this.input = input;
    this.endianness = endianness;
  }
  /** Reads a specified number of bits, and move the offset */
  getBits(length = 1) {
    let result = 0;
    let bitsRead = 0;
    while (bitsRead < length) {
      if (this.byteOffset >= this.input.length) {
        throw new Error("Reached end of input");
      }
      const currentByte = this.input[this.byteOffset];
      const bitsLeft = 8 - this.bitOffset;
      const bitsToRead = Math.min(length - bitsRead, bitsLeft);
      if (this.endianness === "little-endian") {
        const mask = (1 << bitsToRead) - 1;
        const bits = currentByte >> this.bitOffset & mask;
        result |= bits << bitsRead;
      } else {
        const mask = (1 << bitsToRead) - 1 << 8 - this.bitOffset - bitsToRead;
        const bits = (currentByte & mask) >> 8 - this.bitOffset - bitsToRead;
        result = result << bitsToRead | bits;
      }
      bitsRead += bitsToRead;
      this.bitOffset += bitsToRead;
      if (this.bitOffset === 8) {
        this.byteOffset++;
        this.bitOffset = 0;
      }
    }
    return result;
  }
}

function calculateImageDimension(reader, isSmallImage) {
  if (isSmallImage) {
    return 8 * (1 + reader.getBits(5));
  }
  const sizeClass = reader.getBits(2);
  const extraBits = [9, 13, 18, 30][sizeClass];
  return 1 + reader.getBits(extraBits);
}
function calculateImageWidth(reader, isSmallImage, widthMode, height) {
  if (isSmallImage && widthMode === 0) {
    return 8 * (1 + reader.getBits(5));
  }
  if (widthMode === 0) {
    return calculateImageDimension(reader, false);
  }
  const aspectRatios = [1, 1.2, 4 / 3, 1.5, 16 / 9, 5 / 4, 2];
  return Math.floor(height * aspectRatios[widthMode - 1]);
}
const JXLStream = {
  validate: (input) => {
    return toHexString(input, 0, 2) === "ff0a";
  },
  calculate(input) {
    const reader = new BitReader(input, "little-endian");
    const isSmallImage = reader.getBits(1) === 1;
    const height = calculateImageDimension(reader, isSmallImage);
    const widthMode = reader.getBits(3);
    const width = calculateImageWidth(reader, isSmallImage, widthMode, height);
    return { width, height };
  }
};

function extractCodestream(input) {
  const jxlcBox = findBox(input, "jxlc", 0);
  if (jxlcBox) {
    return input.slice(jxlcBox.offset + 8, jxlcBox.offset + jxlcBox.size);
  }
  const partialStreams = extractPartialStreams(input);
  if (partialStreams.length > 0) {
    return concatenateCodestreams(partialStreams);
  }
  return void 0;
}
function extractPartialStreams(input) {
  const partialStreams = [];
  let offset = 0;
  while (offset < input.length) {
    const jxlpBox = findBox(input, "jxlp", offset);
    if (!jxlpBox) break;
    partialStreams.push(
      input.slice(jxlpBox.offset + 12, jxlpBox.offset + jxlpBox.size)
    );
    offset = jxlpBox.offset + jxlpBox.size;
  }
  return partialStreams;
}
function concatenateCodestreams(partialCodestreams) {
  const totalLength = partialCodestreams.reduce(
    (acc, curr) => acc + curr.length,
    0
  );
  const codestream = new Uint8Array(totalLength);
  let position = 0;
  for (const partial of partialCodestreams) {
    codestream.set(partial, position);
    position += partial.length;
  }
  return codestream;
}
const JXL = {
  validate: (input) => {
    const boxType = toUTF8String(input, 4, 8);
    if (boxType !== "JXL ") return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox) return false;
    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
    return brand === "jxl ";
  },
  calculate(input) {
    const codestream = extractCodestream(input);
    if (codestream) return JXLStream.calculate(codestream);
    throw new Error("No codestream found in JXL container");
  }
};

const KTX = {
  validate: (input) => {
    const signature = toUTF8String(input, 1, 7);
    return ["KTX 11", "KTX 20"].includes(signature);
  },
  calculate: (input) => {
    const type = input[5] === 49 ? "ktx" : "ktx2";
    const offset = type === "ktx" ? 36 : 20;
    return {
      height: readUInt32LE(input, offset + 4),
      width: readUInt32LE(input, offset),
      type
    };
  }
};

const pngSignature = "PNG\r\n\n";
const pngImageHeaderChunkName = "IHDR";
const pngFriedChunkName = "CgBI";
const PNG = {
  validate(input) {
    if (pngSignature === toUTF8String(input, 1, 8)) {
      let chunkName = toUTF8String(input, 12, 16);
      if (chunkName === pngFriedChunkName) {
        chunkName = toUTF8String(input, 28, 32);
      }
      if (chunkName !== pngImageHeaderChunkName) {
        throw new TypeError("Invalid PNG");
      }
      return true;
    }
    return false;
  },
  calculate(input) {
    if (toUTF8String(input, 12, 16) === pngFriedChunkName) {
      return {
        height: readUInt32BE(input, 36),
        width: readUInt32BE(input, 32)
      };
    }
    return {
      height: readUInt32BE(input, 20),
      width: readUInt32BE(input, 16)
    };
  }
};

const PNMTypes = {
  P1: "pbm/ascii",
  P2: "pgm/ascii",
  P3: "ppm/ascii",
  P4: "pbm",
  P5: "pgm",
  P6: "ppm",
  P7: "pam",
  PF: "pfm"
};
const handlers = {
  default: (lines) => {
    let dimensions = [];
    while (lines.length > 0) {
      const line = lines.shift();
      if (line[0] === "#") {
        continue;
      }
      dimensions = line.split(" ");
      break;
    }
    if (dimensions.length === 2) {
      return {
        height: Number.parseInt(dimensions[1], 10),
        width: Number.parseInt(dimensions[0], 10)
      };
    }
    throw new TypeError("Invalid PNM");
  },
  pam: (lines) => {
    const size = {};
    while (lines.length > 0) {
      const line = lines.shift();
      if (line.length > 16 || line.charCodeAt(0) > 128) {
        continue;
      }
      const [key, value] = line.split(" ");
      if (key && value) {
        size[key.toLowerCase()] = Number.parseInt(value, 10);
      }
      if (size.height && size.width) {
        break;
      }
    }
    if (size.height && size.width) {
      return {
        height: size.height,
        width: size.width
      };
    }
    throw new TypeError("Invalid PAM");
  }
};
const PNM = {
  validate: (input) => toUTF8String(input, 0, 2) in PNMTypes,
  calculate(input) {
    const signature = toUTF8String(input, 0, 2);
    const type = PNMTypes[signature];
    const lines = toUTF8String(input, 3).split(/[\r\n]+/);
    const handler = handlers[type] || handlers.default;
    return handler(lines);
  }
};

const PSD = {
  validate: (input) => toUTF8String(input, 0, 4) === "8BPS",
  calculate: (input) => ({
    height: readUInt32BE(input, 14),
    width: readUInt32BE(input, 18)
  })
};

const svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/;
const extractorRegExps = {
  height: /\sheight=(['"])([^%]+?)\1/,
  root: svgReg,
  viewbox: /\sviewBox=(['"])(.+?)\1/i,
  width: /\swidth=(['"])([^%]+?)\1/
};
const INCH_CM = 2.54;
const units = {
  in: 96,
  cm: 96 / INCH_CM,
  em: 16,
  ex: 8,
  m: 96 / INCH_CM * 100,
  mm: 96 / INCH_CM / 10,
  pc: 96 / 72 / 12,
  pt: 96 / 72,
  px: 1
};
const unitsReg = new RegExp(
  `^([0-9.]+(?:e\\d+)?)(${Object.keys(units).join("|")})?$`
);
function parseLength(len) {
  const m = unitsReg.exec(len);
  if (!m) {
    return void 0;
  }
  return Math.round(Number(m[1]) * (units[m[2]] || 1));
}
function parseViewbox(viewbox) {
  const bounds = viewbox.split(" ");
  return {
    height: parseLength(bounds[3]),
    width: parseLength(bounds[2])
  };
}
function parseAttributes(root) {
  const width = extractorRegExps.width.exec(root);
  const height = extractorRegExps.height.exec(root);
  const viewbox = extractorRegExps.viewbox.exec(root);
  return {
    height: height && parseLength(height[2]),
    viewbox: viewbox && parseViewbox(viewbox[2]),
    width: width && parseLength(width[2])
  };
}
function calculateByDimensions(attrs) {
  return {
    height: attrs.height,
    width: attrs.width
  };
}
function calculateByViewbox(attrs, viewbox) {
  const ratio = viewbox.width / viewbox.height;
  if (attrs.width) {
    return {
      height: Math.floor(attrs.width / ratio),
      width: attrs.width
    };
  }
  if (attrs.height) {
    return {
      height: attrs.height,
      width: Math.floor(attrs.height * ratio)
    };
  }
  return {
    height: viewbox.height,
    width: viewbox.width
  };
}
const SVG = {
  // Scan only the first kilo-byte to speed up the check on larger files
  validate: (input) => svgReg.test(toUTF8String(input, 0, 1e3)),
  calculate(input) {
    const root = extractorRegExps.root.exec(toUTF8String(input));
    if (root) {
      const attrs = parseAttributes(root[0]);
      if (attrs.width != null && attrs.height != null) {
        return calculateByDimensions(attrs);
      }
      if (attrs.viewbox) {
        return calculateByViewbox(attrs, attrs.viewbox);
      }
    }
    throw new TypeError("Invalid SVG");
  }
};

const TGA = {
  validate(input) {
    return readUInt16LE(input, 0) === 0 && readUInt16LE(input, 4) === 0;
  },
  calculate(input) {
    return {
      height: readUInt16LE(input, 14),
      width: readUInt16LE(input, 12)
    };
  }
};

const CONSTANTS = {
  TAG: {
    WIDTH: 256,
    HEIGHT: 257,
    COMPRESSION: 259
  },
  TYPE: {
    SHORT: 3,
    LONG: 4,
    LONG8: 16
  },
  ENTRY_SIZE: {
    STANDARD: 12,
    BIG: 20
  },
  COUNT_SIZE: {
    STANDARD: 2,
    BIG: 8
  }
};
function readIFD(input, { isBigEndian, isBigTiff }) {
  const ifdOffset = isBigTiff ? Number(readUInt64(input, 8, isBigEndian)) : readUInt(input, 32, 4, isBigEndian);
  const entryCountSize = isBigTiff ? CONSTANTS.COUNT_SIZE.BIG : CONSTANTS.COUNT_SIZE.STANDARD;
  return input.slice(ifdOffset + entryCountSize);
}
function readTagValue(input, type, offset, isBigEndian) {
  switch (type) {
    case CONSTANTS.TYPE.SHORT:
      return readUInt(input, 16, offset, isBigEndian);
    case CONSTANTS.TYPE.LONG:
      return readUInt(input, 32, offset, isBigEndian);
    case CONSTANTS.TYPE.LONG8: {
      const value = Number(readUInt64(input, offset, isBigEndian));
      if (value > Number.MAX_SAFE_INTEGER) {
        throw new TypeError("Value too large");
      }
      return value;
    }
    default:
      return 0;
  }
}
function nextTag(input, isBigTiff) {
  const entrySize = isBigTiff ? CONSTANTS.ENTRY_SIZE.BIG : CONSTANTS.ENTRY_SIZE.STANDARD;
  if (input.length > entrySize) {
    return input.slice(entrySize);
  }
}
function extractTags(input, { isBigEndian, isBigTiff }) {
  const tags = {};
  let temp = input;
  while (temp?.length) {
    const code = readUInt(temp, 16, 0, isBigEndian);
    const type = readUInt(temp, 16, 2, isBigEndian);
    const length = isBigTiff ? Number(readUInt64(temp, 4, isBigEndian)) : readUInt(temp, 32, 4, isBigEndian);
    if (code === 0) break;
    if (length === 1 && (type === CONSTANTS.TYPE.SHORT || type === CONSTANTS.TYPE.LONG || isBigTiff && type === CONSTANTS.TYPE.LONG8)) {
      const valueOffset = isBigTiff ? 12 : 8;
      tags[code] = readTagValue(temp, type, valueOffset, isBigEndian);
    }
    temp = nextTag(temp, isBigTiff);
  }
  return tags;
}
function determineFormat(input) {
  const signature = toUTF8String(input, 0, 2);
  const version = readUInt(input, 16, 2, signature === "MM");
  return {
    isBigEndian: signature === "MM",
    isBigTiff: version === 43
  };
}
function validateBigTIFFHeader(input, isBigEndian) {
  const byteSize = readUInt(input, 16, 4, isBigEndian);
  const reserved = readUInt(input, 16, 6, isBigEndian);
  if (byteSize !== 8 || reserved !== 0) {
    throw new TypeError("Invalid BigTIFF header");
  }
}
const signatures = /* @__PURE__ */ new Set([
  "49492a00",
  // Little Endian
  "4d4d002a",
  // Big Endian
  "49492b00",
  // BigTIFF Little Endian
  "4d4d002b"
  // BigTIFF Big Endian
]);
const TIFF = {
  validate: (input) => {
    const signature = toHexString(input, 0, 4);
    return signatures.has(signature);
  },
  calculate(input) {
    const format = determineFormat(input);
    if (format.isBigTiff) {
      validateBigTIFFHeader(input, format.isBigEndian);
    }
    const ifdBuffer = readIFD(input, format);
    const tags = extractTags(ifdBuffer, format);
    const info = {
      height: tags[CONSTANTS.TAG.HEIGHT],
      width: tags[CONSTANTS.TAG.WIDTH],
      type: format.isBigTiff ? "bigtiff" : "tiff"
    };
    if (tags[CONSTANTS.TAG.COMPRESSION]) {
      info.compression = tags[CONSTANTS.TAG.COMPRESSION];
    }
    if (!info.width || !info.height) {
      throw new TypeError("Invalid Tiff. Missing tags");
    }
    return info;
  }
};

function calculateExtended(input) {
  return {
    height: 1 + readUInt24LE(input, 7),
    width: 1 + readUInt24LE(input, 4)
  };
}
function calculateLossless(input) {
  return {
    height: 1 + ((input[4] & 15) << 10 | input[3] << 2 | (input[2] & 192) >> 6),
    width: 1 + ((input[2] & 63) << 8 | input[1])
  };
}
function calculateLossy(input) {
  return {
    height: readInt16LE(input, 8) & 16383,
    width: readInt16LE(input, 6) & 16383
  };
}
const WEBP = {
  validate(input) {
    const riffHeader = "RIFF" === toUTF8String(input, 0, 4);
    const webpHeader = "WEBP" === toUTF8String(input, 8, 12);
    const vp8Header = "VP8" === toUTF8String(input, 12, 15);
    return riffHeader && webpHeader && vp8Header;
  },
  calculate(_input) {
    const chunkHeader = toUTF8String(_input, 12, 16);
    const input = _input.slice(20, 30);
    if (chunkHeader === "VP8X") {
      const extendedHeader = input[0];
      const validStart = (extendedHeader & 192) === 0;
      const validEnd = (extendedHeader & 1) === 0;
      if (validStart && validEnd) {
        return calculateExtended(input);
      }
      throw new TypeError("Invalid WebP");
    }
    if (chunkHeader === "VP8 " && input[0] !== 47) {
      return calculateLossy(input);
    }
    const signature = toHexString(input, 3, 6);
    if (chunkHeader === "VP8L" && signature !== "9d012a") {
      return calculateLossless(input);
    }
    throw new TypeError("Invalid WebP");
  }
};

const typeHandlers = /* @__PURE__ */ new Map([
  ["bmp", BMP],
  ["cur", CUR],
  ["dds", DDS],
  ["gif", GIF],
  ["heif", HEIF],
  ["icns", ICNS],
  ["ico", ICO],
  ["j2c", J2C],
  ["jp2", JP2],
  ["jpg", JPG],
  ["jxl", JXL],
  ["jxl-stream", JXLStream],
  ["ktx", KTX],
  ["png", PNG],
  ["pnm", PNM],
  ["psd", PSD],
  ["svg", SVG],
  ["tga", TGA],
  ["tiff", TIFF],
  ["webp", WEBP]
]);
const types = Array.from(typeHandlers.keys());

const firstBytes = /* @__PURE__ */ new Map([
  [0, "heif"],
  [56, "psd"],
  [66, "bmp"],
  [68, "dds"],
  [71, "gif"],
  [73, "tiff"],
  [77, "tiff"],
  [82, "webp"],
  [105, "icns"],
  [137, "png"],
  [255, "jpg"]
]);
function detector(input) {
  const byte = input[0];
  const type = firstBytes.get(byte);
  if (type && typeHandlers.get(type).validate(input)) {
    return type;
  }
  return types.find((imageType) => typeHandlers.get(imageType).validate(input));
}

function lookup$1(input) {
  const type = detector(input);
  if (typeof type !== "undefined") {
    const size = typeHandlers.get(type).calculate(input);
    if (size !== void 0) {
      size.type = size.type ?? type;
      return size;
    }
  }
  throw new TypeError("unsupported file type: " + type);
}

async function imageMetadata(data, src) {
  let result;
  try {
    result = lookup$1(data);
  } catch {
    throw new AstroError({
      ...NoImageMetadata,
      message: NoImageMetadata.message(src)
    });
  }
  if (result.height == null || result.width == null || !result.type) {
    throw new AstroError({
      ...NoImageMetadata,
      message: NoImageMetadata.message(src)
    });
  }
  const { width, height, type, orientation } = result;
  const isPortrait = (orientation || 0) >= 5;
  return {
    width: isPortrait ? height : width,
    height: isPortrait ? width : height,
    format: type,
    orientation
  };
}

async function fetchWithRedirects(options) {
  const {
    url,
    headers,
    imageConfig,
    fetchFn = globalThis.fetch,
    redirectLimit = 10,
    onMaxRedirectsExceeded = (_u) => new Error("Maximum redirect depth exceeded"),
    onMissingLocationHeader = (_s, _u) => new Error(`Redirect response ${_s} missing Location header`),
    onDisallowedRedirect = (_current, _target) => new Error(
      `The image at ${_current} redirected to ${_target}, which is not an allowed remote location.`
    )
  } = options;
  if (redirectLimit <= 0) {
    throw onMaxRedirectsExceeded(typeof url === "string" ? url : url.toString());
  }
  const urlString = typeof url === "string" ? url : url.toString();
  const req = new Request(url, { headers });
  const res = await fetchFn(req, { redirect: "manual" });
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const location = res.headers.get("Location");
    if (!location) {
      throw onMissingLocationHeader(res.status, urlString);
    }
    const redirectUrl = new URL(location, urlString).toString();
    if (!isRemoteAllowed$1(redirectUrl, {
      domains: imageConfig.domains ?? [],
      remotePatterns: imageConfig.remotePatterns ?? []
    })) {
      throw onDisallowedRedirect(urlString, redirectUrl);
    }
    return fetchWithRedirects({
      url: redirectUrl,
      headers,
      imageConfig,
      fetchFn,
      redirectLimit: redirectLimit - 1,
      onMaxRedirectsExceeded,
      onMissingLocationHeader,
      onDisallowedRedirect
    });
  }
  return res;
}

async function inferRemoteSize(url, imageConfig) {
  if (!URL.canParse(url)) {
    throw new AstroError({
      ...FailedToFetchRemoteImageDimensions,
      message: FailedToFetchRemoteImageDimensions.message(url)
    });
  }
  const allowlistConfig = imageConfig ? {
    domains: imageConfig.domains ?? [],
    remotePatterns: imageConfig.remotePatterns ?? []
  } : void 0;
  if (!allowlistConfig) {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new AstroError({
        ...FailedToFetchRemoteImageDimensions,
        message: FailedToFetchRemoteImageDimensions.message(url)
      });
    }
  }
  if (allowlistConfig && !isRemoteAllowed$1(url, allowlistConfig)) {
    throw new AstroError({
      ...RemoteImageNotAllowed,
      message: RemoteImageNotAllowed.message(url)
    });
  }
  let response;
  try {
    response = await fetchWithRedirects({
      url,
      onMaxRedirectsExceeded: (u) => new AstroError({
        ...FailedToFetchRemoteImageDimensions,
        message: FailedToFetchRemoteImageDimensions.message(u)
      }),
      onMissingLocationHeader: (_status, u) => new AstroError({
        ...FailedToFetchRemoteImageDimensions,
        message: FailedToFetchRemoteImageDimensions.message(u)
      }),
      imageConfig: imageConfig ?? {
        remotePatterns: [],
        domains: []
      }
    });
  } catch (_err) {
    throw new AstroError({
      ...FailedToFetchRemoteImageDimensions,
      message: FailedToFetchRemoteImageDimensions.message(url)
    });
  }
  if (allowlistConfig && !isRemoteAllowed$1(response.url, allowlistConfig)) {
    throw new AstroError({
      ...RemoteImageNotAllowed,
      message: RemoteImageNotAllowed.message(url)
    });
  }
  if (!response.body || !response.ok) {
    throw new AstroError({
      ...FailedToFetchRemoteImageDimensions,
      message: FailedToFetchRemoteImageDimensions.message(url)
    });
  }
  const reader = response.body.getReader();
  let done, value;
  let accumulatedChunks = new Uint8Array();
  while (!done) {
    const readResult = await reader.read();
    done = readResult.done;
    if (done) break;
    if (readResult.value) {
      value = readResult.value;
      let tmp = new Uint8Array(accumulatedChunks.length + value.length);
      tmp.set(accumulatedChunks, 0);
      tmp.set(value, accumulatedChunks.length);
      accumulatedChunks = tmp;
      try {
        const dimensions = await imageMetadata(accumulatedChunks, url);
        if (dimensions) {
          await reader.cancel();
          return dimensions;
        }
      } catch {
      }
    }
  }
  throw new AstroError({
    ...NoImageMetadata,
    message: NoImageMetadata.message(url)
  });
}

function isLocalService(service) {
  if (!service) {
    return false;
  }
  return "transform" in service;
}
function parseQuality(quality) {
  let result = Number.parseInt(quality);
  if (Number.isNaN(result)) {
    return quality;
  }
  return result;
}
const sortNumeric = (a, b) => a - b;
function verifyOptions(options) {
  if (!options.src || !isRemoteImage(options.src) && !isESMImportedImage(options.src)) {
    throw new AstroError({
      ...ExpectedImage,
      message: ExpectedImage.message(
        JSON.stringify(options.src),
        typeof options.src,
        JSON.stringify(options, (_, v) => v === void 0 ? null : v)
      )
    });
  }
  if (!isESMImportedImage(options.src)) {
    if (options.src.startsWith("/@fs/") || !isRemotePath$1(options.src) && !options.src.startsWith("/")) {
      throw new AstroError({
        ...LocalImageUsedWrongly,
        message: LocalImageUsedWrongly.message(options.src)
      });
    }
    let missingDimension;
    if (!options.width && !options.height) {
      missingDimension = "both";
    } else if (!options.width && options.height) {
      missingDimension = "width";
    } else if (options.width && !options.height) {
      missingDimension = "height";
    }
    if (missingDimension) {
      throw new AstroError({
        ...MissingImageDimension,
        message: MissingImageDimension.message(missingDimension, options.src)
      });
    }
  } else {
    if (!VALID_SUPPORTED_FORMATS.includes(options.src.format)) {
      throw new AstroError({
        ...UnsupportedImageFormat,
        message: UnsupportedImageFormat.message(
          options.src.format,
          options.src.src,
          VALID_SUPPORTED_FORMATS
        )
      });
    }
    if (options.widths && options.densities) {
      throw new AstroError(IncompatibleDescriptorOptions);
    }
    if (options.src.format !== "svg" && options.format === "svg") {
      throw new AstroError(UnsupportedImageConversion);
    }
  }
}
const baseService = {
  validateOptions(options) {
    verifyOptions(options);
    if (!options.format) {
      if (isESMImportedImage(options.src)) {
        options.format = resolveDefaultOutputFormat(options.src.format);
      } else {
        const inferred = inferSourceFormat(options.src);
        if (inferred) options.format = resolveDefaultOutputFormat(inferred);
      }
    }
    if (options.width) options.width = Math.round(options.width);
    if (options.height) options.height = Math.round(options.height);
    if (options.layout) {
      delete options.layout;
    }
    if (options.fit === "none") {
      delete options.fit;
    }
    return options;
  },
  getHTMLAttributes(options) {
    const { targetWidth, targetHeight } = getTargetDimensions(options);
    const {
      src,
      width,
      height,
      format,
      quality,
      densities,
      widths,
      formats,
      layout,
      priority,
      fit,
      position,
      background,
      ...attributes
    } = options;
    return {
      ...attributes,
      width: targetWidth,
      height: targetHeight,
      loading: attributes.loading ?? "lazy",
      decoding: attributes.decoding ?? "async"
    };
  },
  getSrcSet(options) {
    const { targetWidth, targetHeight } = getTargetDimensions(options);
    const aspectRatio = targetWidth / targetHeight;
    const { widths, densities } = options;
    const targetFormat = options.format;
    let transformedWidths = (widths ?? []).sort(sortNumeric);
    let imageWidth = options.width;
    let maxWidth = Number.POSITIVE_INFINITY;
    if (isESMImportedImage(options.src)) {
      imageWidth = options.src.width;
      maxWidth = imageWidth;
      if (transformedWidths.length > 0 && transformedWidths.at(-1) > maxWidth) {
        transformedWidths = transformedWidths.filter((width) => width <= maxWidth);
        transformedWidths.push(maxWidth);
      }
    }
    transformedWidths = Array.from(new Set(transformedWidths));
    const {
      width: transformWidth,
      height: transformHeight,
      ...transformWithoutDimensions
    } = options;
    let allWidths = [];
    if (densities) {
      const densityValues = densities.map((density) => {
        if (typeof density === "number") {
          return density;
        } else {
          return Number.parseFloat(density);
        }
      });
      const densityWidths = densityValues.sort(sortNumeric).map((density) => Math.round(targetWidth * density));
      allWidths = densityWidths.map((width, index) => ({
        width,
        descriptor: `${densityValues[index]}x`
      }));
    } else if (transformedWidths.length > 0) {
      allWidths = transformedWidths.map((width) => ({
        width,
        descriptor: `${width}w`
      }));
    }
    return allWidths.map(({ width, descriptor }) => {
      const height = Math.round(width / aspectRatio);
      const transform = { ...transformWithoutDimensions, width, height };
      return {
        transform,
        descriptor,
        attributes: targetFormat ? { type: `image/${targetFormat}` } : {}
      };
    });
  },
  getURL(options, imageConfig) {
    const searchParams = new URLSearchParams();
    if (isESMImportedImage(options.src)) {
      searchParams.append("href", options.src.src);
    } else if (isRemoteAllowed$1(options.src, imageConfig)) {
      searchParams.append("href", options.src);
    } else {
      return options.src;
    }
    const params = {
      w: "width",
      h: "height",
      q: "quality",
      f: "format",
      fit: "fit",
      position: "position",
      background: "background"
    };
    Object.entries(params).forEach(([param, key]) => {
      options[key] && searchParams.append(param, options[key].toString());
    });
    const imageEndpoint = joinPaths("/", imageConfig.endpoint.route);
    let url = `${imageEndpoint}?${searchParams}`;
    if (imageConfig.assetQueryParams) {
      const assetQueryString = imageConfig.assetQueryParams.toString();
      if (assetQueryString) {
        url += "&" + assetQueryString;
      }
    }
    return url;
  },
  parseURL(url) {
    const params = url.searchParams;
    if (!params.has("href")) {
      return void 0;
    }
    const transform = {
      src: params.get("href"),
      width: params.has("w") ? Number.parseInt(params.get("w")) : void 0,
      height: params.has("h") ? Number.parseInt(params.get("h")) : void 0,
      format: params.has("f") ? params.get("f") : void 0,
      quality: params.get("q"),
      fit: params.get("fit"),
      position: params.get("position") ?? void 0,
      background: params.get("background") ?? void 0
    };
    return transform;
  },
  getRemoteSize(url, imageConfig) {
    return inferRemoteSize(url, imageConfig);
  }
};
function getTargetDimensions(options) {
  let targetWidth = options.width;
  let targetHeight = options.height;
  if (isESMImportedImage(options.src)) {
    const aspectRatio = options.src.width / options.src.height;
    if (targetHeight && !targetWidth) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else if (targetWidth && !targetHeight) {
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else if (!targetWidth && !targetHeight) {
      targetWidth = options.src.width;
      targetHeight = options.src.height;
    }
  }
  return {
    targetWidth,
    targetHeight
  };
}

function isImageMetadata(src) {
  return src.fsPath && !("fsPath" in src);
}

const PLACEHOLDER_BASE = "astro://placeholder";
function createPlaceholderURL(pathOrUrl) {
  return new URL(pathOrUrl, PLACEHOLDER_BASE);
}
function stringifyPlaceholderURL(url) {
  return url.href.replace(PLACEHOLDER_BASE, "");
}

const cssFitValues = ["fill", "contain", "cover", "scale-down"];
async function getConfiguredImageService() {
  if (!globalThis?.astroAsset?.imageService) {
    const { default: service } = await Promise.resolve().then(() => sharp$2).catch((e) => {
      const error = new AstroError(InvalidImageService);
      error.cause = e;
      throw error;
    });
    if (!globalThis.astroAsset) globalThis.astroAsset = {};
    globalThis.astroAsset.imageService = service;
    return service;
  }
  return globalThis.astroAsset.imageService;
}
async function getImage$1(options, imageConfig) {
  if (!options || typeof options !== "object") {
    throw new AstroError({
      ...ExpectedImageOptions,
      message: ExpectedImageOptions.message(JSON.stringify(options))
    });
  }
  if (typeof options.src === "undefined") {
    throw new AstroError({
      ...ExpectedImage,
      message: ExpectedImage.message(
        options.src,
        "undefined",
        JSON.stringify(options)
      )
    });
  }
  if (isImageMetadata(options)) {
    throw new AstroError(ExpectedNotESMImage);
  }
  const service = await getConfiguredImageService();
  const resolvedOptions = {
    ...options,
    src: await resolveSrc(options.src)
  };
  let originalWidth;
  let originalHeight;
  if (resolvedOptions.inferSize) {
    delete resolvedOptions.inferSize;
    if (isRemoteImage(resolvedOptions.src) && isRemotePath$1(resolvedOptions.src)) {
      if (!isRemoteAllowed$1(resolvedOptions.src, imageConfig)) {
        throw new AstroError({
          ...RemoteImageNotAllowed,
          message: RemoteImageNotAllowed.message(resolvedOptions.src)
        });
      }
      const getRemoteSize = (url) => service.getRemoteSize?.(url, imageConfig) ?? inferRemoteSize(url, imageConfig);
      const result = await getRemoteSize(resolvedOptions.src);
      resolvedOptions.width ??= result.width;
      resolvedOptions.height ??= result.height;
      if (result.format) {
        resolvedOptions.format ??= resolveDefaultOutputFormat(result.format);
      }
      originalWidth = result.width;
      originalHeight = result.height;
    }
  }
  const originalFilePath = isESMImportedImage(resolvedOptions.src) ? resolvedOptions.src.fsPath : void 0;
  const clonedSrc = isESMImportedImage(resolvedOptions.src) ? (
    // @ts-expect-error - clone is a private, hidden prop
    resolvedOptions.src.clone ?? resolvedOptions.src
  ) : resolvedOptions.src;
  if (isESMImportedImage(clonedSrc)) {
    originalWidth = clonedSrc.width;
    originalHeight = clonedSrc.height;
  }
  if (originalWidth && originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    if (resolvedOptions.height && !resolvedOptions.width) {
      resolvedOptions.width = Math.round(resolvedOptions.height * aspectRatio);
    } else if (resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.height = Math.round(resolvedOptions.width / aspectRatio);
    } else if (!resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.width = originalWidth;
      resolvedOptions.height = originalHeight;
    }
  }
  resolvedOptions.src = clonedSrc;
  const layout = options.layout ?? imageConfig.layout ?? "none";
  if (resolvedOptions.priority) {
    resolvedOptions.loading ??= "eager";
    resolvedOptions.decoding ??= "sync";
    resolvedOptions.fetchpriority ??= "high";
    delete resolvedOptions.priority;
  } else {
    resolvedOptions.loading ??= "lazy";
    resolvedOptions.decoding ??= "async";
    resolvedOptions.fetchpriority ??= void 0;
  }
  if (layout !== "none") {
    resolvedOptions.widths ||= getWidths({
      width: resolvedOptions.width,
      layout,
      originalWidth,
      breakpoints: imageConfig.breakpoints?.length ? imageConfig.breakpoints : isLocalService(service) ? LIMITED_RESOLUTIONS : DEFAULT_RESOLUTIONS
    });
    resolvedOptions.sizes ||= getSizesAttribute({ width: resolvedOptions.width, layout });
    delete resolvedOptions.densities;
    resolvedOptions["data-astro-image"] = layout;
    if (resolvedOptions.fit && cssFitValues.includes(resolvedOptions.fit)) {
      resolvedOptions["data-astro-image-fit"] = resolvedOptions.fit;
    }
    const currentPosition = resolvedOptions.position || "center";
    resolvedOptions["data-astro-image-pos"] = currentPosition.replace(/\s+/g, "-");
  }
  const validatedOptions = service.validateOptions ? await service.validateOptions(resolvedOptions, imageConfig) : resolvedOptions;
  validatedOptions.format ??= await peekRemoteFormatForStaticEmit(
    validatedOptions,
    imageConfig,
    service
  );
  const srcSetTransforms = service.getSrcSet ? await service.getSrcSet(validatedOptions, imageConfig) : [];
  const lazyImageURLFactory = (getValue) => {
    let cached = null;
    return () => cached ??= getValue();
  };
  const initialImageURL = await service.getURL(validatedOptions, imageConfig);
  let lazyImageURL = lazyImageURLFactory(() => initialImageURL);
  const matchesValidatedTransform = (transform) => transform.width === validatedOptions.width && transform.height === validatedOptions.height && transform.format === validatedOptions.format;
  let srcSets = await Promise.all(
    srcSetTransforms.map(async (srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesValidatedTransform(srcSet.transform) ? initialImageURL : await service.getURL(srcSet.transform, imageConfig),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    })
  );
  if (isLocalService(service) && globalThis.astroAsset.addStaticImage && !(isRemoteImage(validatedOptions.src) && initialImageURL === validatedOptions.src)) {
    const propsToHash = service.propertiesToHash ?? DEFAULT_HASH_PROPS;
    lazyImageURL = lazyImageURLFactory(
      () => globalThis.astroAsset.addStaticImage(validatedOptions, propsToHash, originalFilePath)
    );
    srcSets = srcSetTransforms.map((srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesValidatedTransform(srcSet.transform) ? lazyImageURL() : globalThis.astroAsset.addStaticImage(srcSet.transform, propsToHash, originalFilePath),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    });
  } else if (imageConfig.assetQueryParams) {
    const imageURLObj = createPlaceholderURL(initialImageURL);
    imageConfig.assetQueryParams.forEach((value, key) => {
      imageURLObj.searchParams.set(key, value);
    });
    lazyImageURL = lazyImageURLFactory(() => stringifyPlaceholderURL(imageURLObj));
    srcSets = srcSets.map((srcSet) => {
      const urlObj = createPlaceholderURL(srcSet.url);
      imageConfig.assetQueryParams.forEach((value, key) => {
        urlObj.searchParams.set(key, value);
      });
      return {
        ...srcSet,
        url: stringifyPlaceholderURL(urlObj)
      };
    });
  }
  return {
    rawOptions: resolvedOptions,
    options: validatedOptions,
    get src() {
      return lazyImageURL();
    },
    srcSet: {
      values: srcSets,
      attribute: srcSets.map((srcSet) => `${srcSet.url} ${srcSet.descriptor}`).join(", ")
    },
    attributes: service.getHTMLAttributes !== void 0 ? await service.getHTMLAttributes(validatedOptions, imageConfig) : {}
  };
}
async function peekRemoteFormatForStaticEmit(options, imageConfig, service) {
  if (!isRemoteImage(options.src) || !isRemoteAllowed$1(options.src, imageConfig) || !globalThis.astroAsset?.addStaticImage || !isLocalService(service) || !service.getRemoteSize) {
    return void 0;
  }
  try {
    const probed = await service.getRemoteSize(options.src, imageConfig);
    return resolveDefaultOutputFormat(probed.format);
  } catch {
    return void 0;
  }
}

Function.prototype.toString.call(Object);

const $$Image = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Image;
  const props = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  if (typeof props.width === "string") {
    props.width = Number.parseInt(props.width);
  }
  if (typeof props.height === "string") {
    props.height = Number.parseInt(props.height);
  }
  const layout = props.layout ?? imageConfig.layout ?? "none";
  if (layout !== "none") {
    props.layout ??= imageConfig.layout;
    props.fit ??= imageConfig.objectFit ?? "cover";
    props.position ??= imageConfig.objectPosition ?? "center";
  } else if (imageConfig.objectFit || imageConfig.objectPosition) {
    props.fit ??= imageConfig.objectFit;
    props.position ??= imageConfig.objectPosition;
  }
  const image = await getImage(props);
  const additionalAttributes = {};
  if (image.srcSet.values.length > 0) {
    additionalAttributes.srcset = image.srcSet.attribute;
  }
  const { class: className, ...attributes } = { ...additionalAttributes, ...image.attributes };
  return renderTemplate`${maybeRenderHead()}<img${addAttribute(image.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}>`;
}, "D:/User/Downloads/packershub_v2/node_modules/astro/components/Image.astro", void 0);

const mimes = {
  "3g2": "video/3gpp2",
  "3gp": "video/3gpp",
  "3gpp": "video/3gpp",
  "3mf": "model/3mf",
  "aac": "audio/aac",
  "ac": "application/pkix-attr-cert",
  "adp": "audio/adpcm",
  "adts": "audio/aac",
  "ai": "application/postscript",
  "aml": "application/automationml-aml+xml",
  "amlx": "application/automationml-amlx+zip",
  "amr": "audio/amr",
  "apng": "image/apng",
  "appcache": "text/cache-manifest",
  "appinstaller": "application/appinstaller",
  "appx": "application/appx",
  "appxbundle": "application/appxbundle",
  "asc": "application/pgp-keys",
  "atom": "application/atom+xml",
  "atomcat": "application/atomcat+xml",
  "atomdeleted": "application/atomdeleted+xml",
  "atomsvc": "application/atomsvc+xml",
  "au": "audio/basic",
  "avci": "image/avci",
  "avcs": "image/avcs",
  "avif": "image/avif",
  "aw": "application/applixware",
  "bdoc": "application/bdoc",
  "bin": "application/octet-stream",
  "bmp": "image/bmp",
  "bpk": "application/octet-stream",
  "btf": "image/prs.btif",
  "btif": "image/prs.btif",
  "buffer": "application/octet-stream",
  "ccxml": "application/ccxml+xml",
  "cdfx": "application/cdfx+xml",
  "cdmia": "application/cdmi-capability",
  "cdmic": "application/cdmi-container",
  "cdmid": "application/cdmi-domain",
  "cdmio": "application/cdmi-object",
  "cdmiq": "application/cdmi-queue",
  "cer": "application/pkix-cert",
  "cgm": "image/cgm",
  "cjs": "application/node",
  "class": "application/java-vm",
  "coffee": "text/coffeescript",
  "conf": "text/plain",
  "cpl": "application/cpl+xml",
  "cpt": "application/mac-compactpro",
  "crl": "application/pkix-crl",
  "css": "text/css",
  "csv": "text/csv",
  "cu": "application/cu-seeme",
  "cwl": "application/cwl",
  "cww": "application/prs.cww",
  "davmount": "application/davmount+xml",
  "dbk": "application/docbook+xml",
  "deb": "application/octet-stream",
  "def": "text/plain",
  "deploy": "application/octet-stream",
  "dib": "image/bmp",
  "disposition-notification": "message/disposition-notification",
  "dist": "application/octet-stream",
  "distz": "application/octet-stream",
  "dll": "application/octet-stream",
  "dmg": "application/octet-stream",
  "dms": "application/octet-stream",
  "doc": "application/msword",
  "dot": "application/msword",
  "dpx": "image/dpx",
  "drle": "image/dicom-rle",
  "dsc": "text/prs.lines.tag",
  "dssc": "application/dssc+der",
  "dtd": "application/xml-dtd",
  "dump": "application/octet-stream",
  "dwd": "application/atsc-dwd+xml",
  "ear": "application/java-archive",
  "ecma": "application/ecmascript",
  "elc": "application/octet-stream",
  "emf": "image/emf",
  "eml": "message/rfc822",
  "emma": "application/emma+xml",
  "emotionml": "application/emotionml+xml",
  "eps": "application/postscript",
  "epub": "application/epub+zip",
  "exe": "application/octet-stream",
  "exi": "application/exi",
  "exp": "application/express",
  "exr": "image/aces",
  "ez": "application/andrew-inset",
  "fdf": "application/fdf",
  "fdt": "application/fdt+xml",
  "fits": "image/fits",
  "g3": "image/g3fax",
  "gbr": "application/rpki-ghostbusters",
  "geojson": "application/geo+json",
  "gif": "image/gif",
  "glb": "model/gltf-binary",
  "gltf": "model/gltf+json",
  "gml": "application/gml+xml",
  "gpx": "application/gpx+xml",
  "gram": "application/srgs",
  "grxml": "application/srgs+xml",
  "gxf": "application/gxf",
  "gz": "application/gzip",
  "h261": "video/h261",
  "h263": "video/h263",
  "h264": "video/h264",
  "heic": "image/heic",
  "heics": "image/heic-sequence",
  "heif": "image/heif",
  "heifs": "image/heif-sequence",
  "hej2": "image/hej2k",
  "held": "application/atsc-held+xml",
  "hjson": "application/hjson",
  "hlp": "application/winhlp",
  "hqx": "application/mac-binhex40",
  "hsj2": "image/hsj2",
  "htm": "text/html",
  "html": "text/html",
  "ics": "text/calendar",
  "ief": "image/ief",
  "ifb": "text/calendar",
  "iges": "model/iges",
  "igs": "model/iges",
  "img": "application/octet-stream",
  "in": "text/plain",
  "ini": "text/plain",
  "ink": "application/inkml+xml",
  "inkml": "application/inkml+xml",
  "ipfix": "application/ipfix",
  "iso": "application/octet-stream",
  "its": "application/its+xml",
  "jade": "text/jade",
  "jar": "application/java-archive",
  "jhc": "image/jphc",
  "jls": "image/jls",
  "jp2": "image/jp2",
  "jpe": "image/jpeg",
  "jpeg": "image/jpeg",
  "jpf": "image/jpx",
  "jpg": "image/jpeg",
  "jpg2": "image/jp2",
  "jpgm": "image/jpm",
  "jpgv": "video/jpeg",
  "jph": "image/jph",
  "jpm": "image/jpm",
  "jpx": "image/jpx",
  "js": "text/javascript",
  "json": "application/json",
  "json5": "application/json5",
  "jsonld": "application/ld+json",
  "jsonml": "application/jsonml+json",
  "jsx": "text/jsx",
  "jt": "model/jt",
  "jxl": "image/jxl",
  "jxr": "image/jxr",
  "jxra": "image/jxra",
  "jxrs": "image/jxrs",
  "jxs": "image/jxs",
  "jxsc": "image/jxsc",
  "jxsi": "image/jxsi",
  "jxss": "image/jxss",
  "kar": "audio/midi",
  "ktx": "image/ktx",
  "ktx2": "image/ktx2",
  "less": "text/less",
  "lgr": "application/lgr+xml",
  "list": "text/plain",
  "litcoffee": "text/coffeescript",
  "log": "text/plain",
  "lostxml": "application/lost+xml",
  "lrf": "application/octet-stream",
  "m1v": "video/mpeg",
  "m21": "application/mp21",
  "m2a": "audio/mpeg",
  "m2t": "video/mp2t",
  "m2ts": "video/mp2t",
  "m2v": "video/mpeg",
  "m3a": "audio/mpeg",
  "m4a": "audio/mp4",
  "m4p": "application/mp4",
  "m4s": "video/iso.segment",
  "ma": "application/mathematica",
  "mads": "application/mads+xml",
  "maei": "application/mmt-aei+xml",
  "man": "text/troff",
  "manifest": "text/cache-manifest",
  "map": "application/json",
  "mar": "application/octet-stream",
  "markdown": "text/markdown",
  "mathml": "application/mathml+xml",
  "mb": "application/mathematica",
  "mbox": "application/mbox",
  "md": "text/markdown",
  "mdx": "text/mdx",
  "me": "text/troff",
  "mesh": "model/mesh",
  "meta4": "application/metalink4+xml",
  "metalink": "application/metalink+xml",
  "mets": "application/mets+xml",
  "mft": "application/rpki-manifest",
  "mid": "audio/midi",
  "midi": "audio/midi",
  "mime": "message/rfc822",
  "mj2": "video/mj2",
  "mjp2": "video/mj2",
  "mjs": "text/javascript",
  "mml": "text/mathml",
  "mods": "application/mods+xml",
  "mov": "video/quicktime",
  "mp2": "audio/mpeg",
  "mp21": "application/mp21",
  "mp2a": "audio/mpeg",
  "mp3": "audio/mpeg",
  "mp4": "video/mp4",
  "mp4a": "audio/mp4",
  "mp4s": "application/mp4",
  "mp4v": "video/mp4",
  "mpd": "application/dash+xml",
  "mpe": "video/mpeg",
  "mpeg": "video/mpeg",
  "mpf": "application/media-policy-dataset+xml",
  "mpg": "video/mpeg",
  "mpg4": "video/mp4",
  "mpga": "audio/mpeg",
  "mpp": "application/dash-patch+xml",
  "mrc": "application/marc",
  "mrcx": "application/marcxml+xml",
  "ms": "text/troff",
  "mscml": "application/mediaservercontrol+xml",
  "msh": "model/mesh",
  "msi": "application/octet-stream",
  "msix": "application/msix",
  "msixbundle": "application/msixbundle",
  "msm": "application/octet-stream",
  "msp": "application/octet-stream",
  "mtl": "model/mtl",
  "mts": "video/mp2t",
  "musd": "application/mmt-usd+xml",
  "mxf": "application/mxf",
  "mxmf": "audio/mobile-xmf",
  "mxml": "application/xv+xml",
  "n3": "text/n3",
  "nb": "application/mathematica",
  "nq": "application/n-quads",
  "nt": "application/n-triples",
  "obj": "model/obj",
  "oda": "application/oda",
  "oga": "audio/ogg",
  "ogg": "audio/ogg",
  "ogv": "video/ogg",
  "ogx": "application/ogg",
  "omdoc": "application/omdoc+xml",
  "onepkg": "application/onenote",
  "onetmp": "application/onenote",
  "onetoc": "application/onenote",
  "onetoc2": "application/onenote",
  "opf": "application/oebps-package+xml",
  "opus": "audio/ogg",
  "otf": "font/otf",
  "owl": "application/rdf+xml",
  "oxps": "application/oxps",
  "p10": "application/pkcs10",
  "p7c": "application/pkcs7-mime",
  "p7m": "application/pkcs7-mime",
  "p7s": "application/pkcs7-signature",
  "p8": "application/pkcs8",
  "pdf": "application/pdf",
  "pfr": "application/font-tdpfr",
  "pgp": "application/pgp-encrypted",
  "pkg": "application/octet-stream",
  "pki": "application/pkixcmp",
  "pkipath": "application/pkix-pkipath",
  "pls": "application/pls+xml",
  "png": "image/png",
  "prc": "model/prc",
  "prf": "application/pics-rules",
  "provx": "application/provenance+xml",
  "ps": "application/postscript",
  "pskcxml": "application/pskc+xml",
  "pti": "image/prs.pti",
  "qt": "video/quicktime",
  "raml": "application/raml+yaml",
  "rapd": "application/route-apd+xml",
  "rdf": "application/rdf+xml",
  "relo": "application/p2p-overlay+xml",
  "rif": "application/reginfo+xml",
  "rl": "application/resource-lists+xml",
  "rld": "application/resource-lists-diff+xml",
  "rmi": "audio/midi",
  "rnc": "application/relax-ng-compact-syntax",
  "rng": "application/xml",
  "roa": "application/rpki-roa",
  "roff": "text/troff",
  "rq": "application/sparql-query",
  "rs": "application/rls-services+xml",
  "rsat": "application/atsc-rsat+xml",
  "rsd": "application/rsd+xml",
  "rsheet": "application/urc-ressheet+xml",
  "rss": "application/rss+xml",
  "rtf": "text/rtf",
  "rtx": "text/richtext",
  "rusd": "application/route-usd+xml",
  "s3m": "audio/s3m",
  "sbml": "application/sbml+xml",
  "scq": "application/scvp-cv-request",
  "scs": "application/scvp-cv-response",
  "sdp": "application/sdp",
  "senmlx": "application/senml+xml",
  "sensmlx": "application/sensml+xml",
  "ser": "application/java-serialized-object",
  "setpay": "application/set-payment-initiation",
  "setreg": "application/set-registration-initiation",
  "sgi": "image/sgi",
  "sgm": "text/sgml",
  "sgml": "text/sgml",
  "shex": "text/shex",
  "shf": "application/shf+xml",
  "shtml": "text/html",
  "sieve": "application/sieve",
  "sig": "application/pgp-signature",
  "sil": "audio/silk",
  "silo": "model/mesh",
  "siv": "application/sieve",
  "slim": "text/slim",
  "slm": "text/slim",
  "sls": "application/route-s-tsid+xml",
  "smi": "application/smil+xml",
  "smil": "application/smil+xml",
  "snd": "audio/basic",
  "so": "application/octet-stream",
  "spdx": "text/spdx",
  "spp": "application/scvp-vp-response",
  "spq": "application/scvp-vp-request",
  "spx": "audio/ogg",
  "sql": "application/sql",
  "sru": "application/sru+xml",
  "srx": "application/sparql-results+xml",
  "ssdl": "application/ssdl+xml",
  "ssml": "application/ssml+xml",
  "stk": "application/hyperstudio",
  "stl": "model/stl",
  "stpx": "model/step+xml",
  "stpxz": "model/step-xml+zip",
  "stpz": "model/step+zip",
  "styl": "text/stylus",
  "stylus": "text/stylus",
  "svg": "image/svg+xml",
  "svgz": "image/svg+xml",
  "swidtag": "application/swid+xml",
  "t": "text/troff",
  "t38": "image/t38",
  "td": "application/urc-targetdesc+xml",
  "tei": "application/tei+xml",
  "teicorpus": "application/tei+xml",
  "text": "text/plain",
  "tfi": "application/thraud+xml",
  "tfx": "image/tiff-fx",
  "tif": "image/tiff",
  "tiff": "image/tiff",
  "toml": "application/toml",
  "tr": "text/troff",
  "trig": "application/trig",
  "ts": "video/mp2t",
  "tsd": "application/timestamped-data",
  "tsv": "text/tab-separated-values",
  "ttc": "font/collection",
  "ttf": "font/ttf",
  "ttl": "text/turtle",
  "ttml": "application/ttml+xml",
  "txt": "text/plain",
  "u3d": "model/u3d",
  "u8dsn": "message/global-delivery-status",
  "u8hdr": "message/global-headers",
  "u8mdn": "message/global-disposition-notification",
  "u8msg": "message/global",
  "ubj": "application/ubjson",
  "uri": "text/uri-list",
  "uris": "text/uri-list",
  "urls": "text/uri-list",
  "vcard": "text/vcard",
  "vrml": "model/vrml",
  "vtt": "text/vtt",
  "vxml": "application/voicexml+xml",
  "war": "application/java-archive",
  "wasm": "application/wasm",
  "wav": "audio/wav",
  "weba": "audio/webm",
  "webm": "video/webm",
  "webmanifest": "application/manifest+json",
  "webp": "image/webp",
  "wgsl": "text/wgsl",
  "wgt": "application/widget",
  "wif": "application/watcherinfo+xml",
  "wmf": "image/wmf",
  "woff": "font/woff",
  "woff2": "font/woff2",
  "wrl": "model/vrml",
  "wsdl": "application/wsdl+xml",
  "wspolicy": "application/wspolicy+xml",
  "x3d": "model/x3d+xml",
  "x3db": "model/x3d+fastinfoset",
  "x3dbz": "model/x3d+binary",
  "x3dv": "model/x3d-vrml",
  "x3dvz": "model/x3d+vrml",
  "x3dz": "model/x3d+xml",
  "xaml": "application/xaml+xml",
  "xav": "application/xcap-att+xml",
  "xca": "application/xcap-caps+xml",
  "xcs": "application/calendar+xml",
  "xdf": "application/xcap-diff+xml",
  "xdssc": "application/dssc+xml",
  "xel": "application/xcap-el+xml",
  "xenc": "application/xenc+xml",
  "xer": "application/patch-ops-error+xml",
  "xfdf": "application/xfdf",
  "xht": "application/xhtml+xml",
  "xhtml": "application/xhtml+xml",
  "xhvml": "application/xv+xml",
  "xlf": "application/xliff+xml",
  "xm": "audio/xm",
  "xml": "text/xml",
  "xns": "application/xcap-ns+xml",
  "xop": "application/xop+xml",
  "xpl": "application/xproc+xml",
  "xsd": "application/xml",
  "xsf": "application/prs.xsf+xml",
  "xsl": "application/xml",
  "xslt": "application/xml",
  "xspf": "application/xspf+xml",
  "xvm": "application/xv+xml",
  "xvml": "application/xv+xml",
  "yaml": "text/yaml",
  "yang": "application/yang",
  "yin": "application/yin+xml",
  "yml": "text/yaml",
  "zip": "application/zip"
};

function lookup(extn) {
	let tmp = ('' + extn).trim().toLowerCase();
	let idx = tmp.lastIndexOf('.');
	return mimes[!~idx ? tmp : tmp.substring(++idx)];
}

const $$Picture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Picture;
  const defaultFormats = ["webp"];
  const defaultFallbackFormat = "png";
  const specialFormatsFallback = ["gif", "svg", "jpg", "jpeg"];
  const { formats = defaultFormats, pictureAttributes = {}, fallbackFormat, ...props } = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  const scopedStyleClass = props.class?.match(/\bastro-\w{8}\b/)?.[0];
  if (scopedStyleClass) {
    if (pictureAttributes.class) {
      pictureAttributes.class = `${pictureAttributes.class} ${scopedStyleClass}`;
    } else {
      pictureAttributes.class = scopedStyleClass;
    }
  }
  const layout = props.layout ?? imageConfig.layout ?? "none";
  const useResponsive = layout !== "none";
  if (useResponsive) {
    props.layout ??= imageConfig.layout;
    props.fit ??= imageConfig.objectFit ?? "cover";
    props.position ??= imageConfig.objectPosition ?? "center";
  } else if (imageConfig.objectFit || imageConfig.objectPosition) {
    props.fit ??= imageConfig.objectFit;
    props.position ??= imageConfig.objectPosition;
  }
  for (const key in props) {
    if (key.startsWith("data-astro-cid")) {
      pictureAttributes[key] = props[key];
    }
  }
  const originalSrc = await resolveSrc(props.src);
  const optimizedImages = await Promise.all(
    formats.map(
      async (format) => await getImage({
        ...props,
        src: originalSrc,
        format,
        widths: props.widths,
        densities: props.densities
      })
    )
  );
  const clonedSrc = isESMImportedImage(originalSrc) ? (
    // @ts-expect-error - clone is a private, hidden prop
    originalSrc.clone ?? originalSrc
  ) : originalSrc;
  let resultFallbackFormat = fallbackFormat ?? defaultFallbackFormat;
  if (!fallbackFormat && isESMImportedImage(clonedSrc) && specialFormatsFallback.includes(clonedSrc.format)) {
    resultFallbackFormat = clonedSrc.format;
  }
  const fallbackImage = await getImage({
    ...props,
    format: resultFallbackFormat,
    widths: props.widths,
    densities: props.densities
  });
  const imgAdditionalAttributes = {};
  const sourceAdditionalAttributes = {};
  if (props.sizes) {
    sourceAdditionalAttributes.sizes = props.sizes;
  }
  if (fallbackImage.srcSet.values.length > 0) {
    imgAdditionalAttributes.srcset = fallbackImage.srcSet.attribute;
  }
  const { class: className, ...attributes } = {
    ...imgAdditionalAttributes,
    ...fallbackImage.attributes
  };
  return renderTemplate`${maybeRenderHead()}<picture${spreadAttributes(pictureAttributes)}> ${Object.entries(optimizedImages).map(([_, image]) => {
    const srcsetAttribute = props.densities || !props.densities && !props.widths && !useResponsive ? `${image.src}${image.srcSet.values.length > 0 ? ", " + image.srcSet.attribute : ""}` : image.srcSet.attribute;
    return renderTemplate`<source${addAttribute(srcsetAttribute, "srcset")}${addAttribute(lookup(image.options.format ?? image.src) ?? `image/${image.options.format}`, "type")}${spreadAttributes(sourceAdditionalAttributes)}>`;
  })}  <img${addAttribute(fallbackImage.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}> </picture>`;
}, "D:/User/Downloads/packershub_v2/node_modules/astro/components/Picture.astro", void 0);

const componentDataByCssVariable = new Map([]);

function filterPreloads(data, preload) {
  if (!preload) {
    return null;
  }
  if (preload === true) {
    return data;
  }
  return data.filter(
    ({ weight, style, subset }) => preload.some((p) => {
      if (p.weight !== void 0 && weight !== void 0 && !checkWeight(p.weight.toString(), weight)) {
        return false;
      }
      if (p.style !== void 0 && p.style !== style) {
        return false;
      }
      if (p.subset !== void 0 && p.subset !== subset) {
        return false;
      }
      return true;
    })
  );
}
function checkWeight(input, target) {
  const trimmedInput = input.trim();
  if (trimmedInput.includes(" ")) {
    return trimmedInput === target;
  }
  if (target.includes(" ")) {
    const [a, b] = target.split(" ");
    const parsedInput = Number.parseInt(input);
    return parsedInput >= Number.parseInt(a) && parsedInput <= Number.parseInt(b);
  }
  return input === target;
}

const $$Font = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Font;
  const { cssVariable, preload = false } = Astro2.props;
  const data = componentDataByCssVariable.get(cssVariable);
  if (!data) {
    throw new AstroError({
      ...FontFamilyNotFound,
      message: FontFamilyNotFound.message(cssVariable)
    });
  }
  const filteredPreloadData = filterPreloads(data.preloads, preload);
  return renderTemplate`<style>${unescapeHTML(data.css)}</style>${filteredPreloadData?.map(({ url, type }) => renderTemplate`<link rel="preload"${addAttribute(url, "href")} as="font"${addAttribute(`font/${type}`, "type")} crossorigin>`)}`;
}, "D:/User/Downloads/packershub_v2/node_modules/astro/components/Font.astro", void 0);

class SsrRuntimeFontFileUrlResolver {
  #urls;
  constructor({
    urls
  }) {
    this.#urls = urls;
  }
  resolve(url, requestUrl) {
    if (!this.#urls.has(url)) {
      return null;
    }
    if (!url.startsWith("/")) {
      return url;
    }
    if (!requestUrl) {
      throw new AstroError(MissingGetFontFileRequestUrl);
    }
    return `${requestUrl.origin}${url}`;
  }
}

new SsrRuntimeFontFileUrlResolver({
									urls: new Set([]),
								});

const assetQueryParams = undefined;
					const imageConfig = {"endpoint":{"entrypoint":"@astrojs/cloudflare/image-endpoint","route":"/_image"},"service":{"entrypoint":"astro/assets/services/sharp","config":{}},"dangerouslyProcessSVG":false,"domains":[],"remotePatterns":[],"responsiveStyles":false};
					Object.defineProperty(imageConfig, 'assetQueryParams', {
						value: assetQueryParams,
						enumerable: false,
						configurable: true,
					});
							const getImage = async (options) => await getImage$1(options, imageConfig);

function isRemotePath(src) {
  if (!src) return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  let decoded = trimmed;
  let previousDecoded = "";
  let maxIterations = 10;
  while (decoded !== previousDecoded && maxIterations > 0) {
    previousDecoded = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
    maxIterations--;
  }
  if (/^[a-zA-Z]:/.test(decoded)) {
    return false;
  }
  if (decoded[0] === "/" && decoded[1] !== "/" && decoded[1] !== "\\") {
    return false;
  }
  if (decoded[0] === "\\") {
    return true;
  }
  if (decoded.startsWith("//")) {
    return true;
  }
  try {
    const url = new URL(decoded, "http://n");
    if (url.username || url.password) {
      return true;
    }
    if (decoded.includes("@") && !url.pathname.includes("@") && !url.search.includes("@")) {
      return true;
    }
    if (url.origin !== "http://n") {
      const protocol = url.protocol.toLowerCase();
      if (protocol === "file:") {
        return false;
      }
      return true;
    }
    if (URL.canParse(decoded)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function matchPattern(url, remotePattern) {
  return matchProtocol(url, remotePattern.protocol) && matchHostname(url, remotePattern.hostname, true) && matchPort(url, remotePattern.port) && matchPathname(url, remotePattern.pathname, true);
}
function matchPort(url, port) {
  return !port || port === url.port;
}
function matchProtocol(url, protocol) {
  return !protocol || protocol === url.protocol.slice(0, -1);
}
function matchHostname(url, hostname, allowWildcard = false) {
  if (!hostname) {
    return true;
  } else if (!allowWildcard || !hostname.startsWith("*")) {
    return hostname === url.hostname;
  } else if (hostname.startsWith("**.")) {
    const slicedHostname = hostname.slice(2);
    return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
  } else if (hostname.startsWith("*.")) {
    const slicedHostname = hostname.slice(1);
    if (!url.hostname.endsWith(slicedHostname)) {
      return false;
    }
    const subdomainWithDot = url.hostname.slice(0, -(slicedHostname.length - 1));
    return subdomainWithDot.endsWith(".") && !subdomainWithDot.slice(0, -1).includes(".");
  }
  return false;
}
function matchPathname(url, pathname, allowWildcard = false) {
  if (!pathname) {
    return true;
  } else if (!allowWildcard || !pathname.endsWith("*")) {
    return pathname === url.pathname;
  } else if (pathname.endsWith("/**")) {
    const slicedPathname = pathname.slice(0, -2);
    return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
  } else if (pathname.endsWith("/*")) {
    const slicedPathname = pathname.slice(0, -1);
    if (!url.pathname.startsWith(slicedPathname)) {
      return false;
    }
    const additionalPathChunks = url.pathname.slice(slicedPathname.length).split("/").filter(Boolean);
    return additionalPathChunks.length === 1;
  }
  return false;
}
function isRemoteAllowed(src, {
  domains,
  remotePatterns
}) {
  if (!URL.canParse(src)) {
    return false;
  }
  const url = new URL(src);
  if (!["http:", "https:", "data:"].includes(url.protocol)) {
    return false;
  }
  return domains.some((domain) => matchHostname(url, domain)) || remotePatterns.some((remotePattern) => matchPattern(url, remotePattern));
}

const prerender$4 = false;
const GET$2 = (ctx) => {
  const href = ctx.url.searchParams.get("href");
  if (!href) {
    return new Response("Missing 'href' query parameter", {
      status: 400,
      statusText: "Missing 'href' query parameter"
    });
  }
  if (isRemotePath(href)) {
    if (isRemoteAllowed(href, imageConfig) === false) {
      return new Response("Forbidden", { status: 403 });
    } else {
      return Response.redirect(href, 302);
    }
  }
  const proxied = new URL(href, ctx.url.origin);
  if (proxied.origin !== ctx.url.origin) {
    return new Response("Forbidden", { status: 403 });
  }
  return fetch(proxied);
};

const _page$4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$2,
  prerender: prerender$4
}, Symbol.toStringTag, { value: 'Module' }));

const page$4 = () => _page$4;

const imageEndpoint___js = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  page: page$4
}, Symbol.toStringTag, { value: 'Module' }));

const prerender$3 = false;
const STAGES = [
  "Booking Received",
  "Survey Scheduled",
  "Packing Crew Assigned",
  "In Transit",
  "Delivered",
  "Cancelled"
];
function json$2(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function checkAuth(request, locals) {
  const expected = locals?.runtime?.env?.ADMIN_TOKEN ?? undefined                           ;
  if (!expected) return false;
  const provided = request.headers.get("x-admin-token");
  return !!provided && provided === expected;
}
async function GET$1({ request, url, locals }) {
  if (!checkAuth(request, locals)) return json$2({ ok: false, error: "Unauthorized" }, 401);
  const id = url.searchParams.get("id")?.trim().toUpperCase();
  if (!id) return json$2({ ok: false, error: "id is required" }, 400);
  const kv = locals?.runtime?.env?.TRACKING_KV;
  if (!kv) return json$2({ ok: false, error: "TRACKING_KV is not bound on this environment" }, 500);
  const raw = await kv.get(id);
  if (!raw) return json$2({ ok: false, error: "Not found" }, 404);
  return json$2({ ok: true, record: JSON.parse(raw), stages: STAGES });
}
async function POST$2({ request, locals }) {
  if (!checkAuth(request, locals)) return json$2({ ok: false, error: "Unauthorized" }, 401);
  const kv = locals?.runtime?.env?.TRACKING_KV;
  if (!kv) return json$2({ ok: false, error: "TRACKING_KV is not bound on this environment" }, 500);
  try {
    const { id, status, note } = await request.json();
    const cleanId = (id || "").trim().toUpperCase();
    if (!cleanId) return json$2({ ok: false, error: "id is required" }, 400);
    if (!status || !STAGES.includes(status)) {
      return json$2({ ok: false, error: `status must be one of: ${STAGES.join(", ")}` }, 400);
    }
    const raw = await kv.get(cleanId);
    if (!raw) return json$2({ ok: false, error: "Not found" }, 404);
    const record = JSON.parse(raw);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    record.status = status;
    record.updatedAt = now;
    record.timeline = record.timeline || [];
    record.timeline.push({ status, at: now, note: (note || "").trim() });
    await kv.put(cleanId, JSON.stringify(record));
    return json$2({ ok: true, record });
  } catch {
    return json$2({ ok: false, error: "Invalid request body" }, 400);
  }
}

const _page$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$1,
  POST: POST$2,
  STAGES,
  prerender: prerender$3
}, Symbol.toStringTag, { value: 'Module' }));

const page$3 = () => _page$3;

const order___ts = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  page: page$3
}, Symbol.toStringTag, { value: 'Module' }));

const prerender$2 = false;
async function POST$1({ request }) {
  try {
    const { messages, system } = await request.json();
    const apiKey = undefined                                 ;
    if (!apiKey) {
      return new Response(JSON.stringify({
        reply: "AI assistant not configured. Please call +91 77310 74075 or WhatsApp for support!"
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: system || "You are a helpful customer support assistant for PackersHub, a packers and movers company in South India. Keep responses concise and helpful.",
        messages: messages.slice(-6)
        // Last 6 messages for context
      })
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    const reply = data.content?.[0]?.text || "I'm here to help! Call +91 77310 74075 for immediate assistance.";
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      reply: "I'm having a moment. Please call +91 77310 74075 or WhatsApp us — we're available 24/7!"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}

const _page$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST: POST$1,
  prerender: prerender$2
}, Symbol.toStringTag, { value: 'Module' }));

const page$2 = () => _page$2;

const chat___ts = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  page: page$2
}, Symbol.toStringTag, { value: 'Module' }));

const prerender$1 = false;
function generateTrackingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "PH-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
const TRACKING_ID_RE = /^PH-[A-Z2-9]{6}$/;
function json$1(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function POST({ request, locals }) {
  try {
    const body = await request.json();
    const phone = (body.phone || "").toString().trim();
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      return json$1({ ok: false, error: "A valid phone number is required." }, 400);
    }
    const clientId = (body.trackingId || "").toString().trim().toUpperCase();
    const trackingId = TRACKING_ID_RE.test(clientId) ? clientId : generateTrackingId();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      trackingId,
      type: body.type || "general",
      name: (body.name || "").toString().trim(),
      phone,
      email: (body.email || "").toString().trim(),
      message: (body.message || "").toString().trim(),
      fromCity: (body.fromCity || "").toString().trim(),
      toCity: (body.toCity || "").toString().trim(),
      moveDate: (body.moveDate || "").toString().trim(),
      moveType: (body.moveType || "").toString().trim(),
      estimate: typeof body.estimate === "number" ? body.estimate : null,
      source: (body.source || "").toString().trim(),
      status: "Booking Received",
      timeline: [
        { status: "Booking Received", at: now, note: "Lead submitted via website" }
      ],
      createdAt: now,
      updatedAt: now
    };
    const env = locals?.runtime?.env;
    let kvStored = false;
    try {
      const kv = env?.TRACKING_KV;
      if (kv) {
        await kv.put(trackingId, JSON.stringify(record));
        kvStored = true;
      }
    } catch {
    }
    try {
      const resendKey = env?.RESEND_API_KEY ?? undefined                              ;
      const notifyTo = env?.LEAD_NOTIFY_EMAIL ?? undefined                                 ;
      if (resendKey && notifyTo) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "PackersHub Leads <leads@packershub.in>",
            to: [notifyTo],
            subject: `New ${record.type} lead — ${record.name || "Unknown"} (${trackingId})`,
            text: [
              `Tracking ID: ${trackingId}`,
              `Type: ${record.type}`,
              `Name: ${record.name || "-"}`,
              `Phone: ${record.phone}`,
              `Email: ${record.email || "-"}`,
              record.fromCity || record.toCity ? `Route: ${record.fromCity || "-"} -> ${record.toCity || "-"}` : "",
              record.moveDate ? `Move date: ${record.moveDate}` : "",
              record.moveType ? `Move type: ${record.moveType}` : "",
              record.estimate ? `Estimate shown: ₹${record.estimate}` : "",
              record.message ? `Message: ${record.message}` : "",
              `Submitted: ${now}`,
              `Saved to tracking system: ${kvStored ? "yes" : "no (KV not configured)"}`
            ].filter(Boolean).join("\n")
          })
        });
      }
    } catch {
    }
    return json$1({ ok: true, trackingId: kvStored ? trackingId : null });
  } catch {
    return json$1({ ok: false }, 200);
  }
}

const _page$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender: prerender$1
}, Symbol.toStringTag, { value: 'Module' }));

const page$1 = () => _page$1;

const lead___ts = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  page: page$1
}, Symbol.toStringTag, { value: 'Module' }));

const prerender = false;
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function GET({ url, locals }) {
  try {
    const id = url.searchParams.get("id")?.trim().toUpperCase();
    const phone = url.searchParams.get("phone")?.trim();
    if (!id) return json({ ok: false, error: "Please enter your Tracking ID." });
    if (!phone) return json({ ok: false, error: "Please enter the phone number used at booking." });
    const kv = locals?.runtime?.env?.TRACKING_KV;
    if (!kv) {
      return json({
        ok: false,
        error: "Online tracking isn’t set up yet on this deployment. Please call +91 77310 74075 with your Tracking ID."
      });
    }
    const raw = await kv.get(id);
    if (!raw) {
      return json({ ok: false, error: "No booking found with that Tracking ID. Please check and try again." });
    }
    const record = JSON.parse(raw);
    const last4Stored = (record.phone || "").replace(/\D/g, "").slice(-4);
    const last4Input = phone.replace(/\D/g, "").slice(-4);
    if (!last4Stored || last4Stored !== last4Input) {
      return json({ ok: false, error: "That phone number doesn’t match our records for this Tracking ID." });
    }
    return json({
      ok: true,
      trackingId: record.trackingId,
      status: record.status,
      timeline: record.timeline,
      fromCity: record.fromCity,
      toCity: record.toCity,
      moveDate: record.moveDate,
      moveType: record.moveType,
      createdAt: record.createdAt
    });
  } catch {
    return json({ ok: false, error: "Something went wrong. Please call +91 77310 74075." });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

const track___ts = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  page
}, Symbol.toStringTag, { value: 'Module' }));

const server = {};

const noopEntrypoint = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  server
}, Symbol.toStringTag, { value: 'Module' }));

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	
	
);

const _virtual_astro_middleware = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  onRequest
}, Symbol.toStringTag, { value: 'Module' }));

function defineDriver(factory) {
  return factory;
}
function normalizeKey(key, sep = ":") {
  if (!key) {
    return "";
  }
  return key.replace(/[:/\\]/g, sep).replace(/^[:/\\]|[:/\\]$/g, "");
}
function joinKeys(...keys) {
  return keys.map((key) => normalizeKey(key)).filter(Boolean).join(":");
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}

function getBinding(binding) {
  let bindingName = "[binding]";
  if (typeof binding === "string") {
    bindingName = binding;
    binding = globalThis[bindingName] || globalThis.__env__?.[bindingName];
  }
  if (!binding) {
    throw createError(
      "cloudflare",
      `Invalid binding \`${bindingName}\`: \`${binding}\``
    );
  }
  for (const key of ["get", "put", "delete"]) {
    if (!(key in binding)) {
      throw createError(
        "cloudflare",
        `Invalid binding \`${bindingName}\`: \`${key}\` key is missing`
      );
    }
  }
  return binding;
}
function getKVBinding(binding = "STORAGE") {
  return getBinding(binding);
}

const DRIVER_NAME = "cloudflare-kv-binding";
const _default = defineDriver((opts) => {
  const r = (key = "") => opts.base ? joinKeys(opts.base, key) : key;
  async function getKeys(base = "") {
    base = r(base);
    const binding = getKVBinding(opts.binding);
    const keys = [];
    let cursor = void 0;
    do {
      const kvList = await binding.list({ prefix: base || void 0, cursor });
      keys.push(...kvList.keys);
      cursor = kvList.list_complete ? void 0 : kvList.cursor;
    } while (cursor);
    return keys.map((key) => key.name);
  }
  return {
    name: DRIVER_NAME,
    options: opts,
    getInstance: () => getKVBinding(opts.binding),
    async hasItem(key) {
      key = r(key);
      const binding = getKVBinding(opts.binding);
      return await binding.get(key) !== null;
    },
    getItem(key) {
      key = r(key);
      const binding = getKVBinding(opts.binding);
      return binding.get(key);
    },
    setItem(key, value, topts) {
      key = r(key);
      const binding = getKVBinding(opts.binding);
      return binding.put(
        key,
        value,
        topts ? {
          expirationTtl: topts?.ttl ? Math.max(topts.ttl, opts.minTTL ?? 60) : void 0,
          ...topts
        } : void 0
      );
    },
    removeItem(key) {
      key = r(key);
      const binding = getKVBinding(opts.binding);
      return binding.delete(key);
    },
    getKeys(base) {
      return getKeys(base).then(
        (keys) => keys.map((key) => opts.base ? key.slice(opts.base.length) : key)
      );
    },
    async clear(base) {
      const binding = getKVBinding(opts.binding);
      const keys = await getKeys(base);
      await Promise.all(keys.map((key) => binding.delete(key)));
    }
  };
});

const _virtual_astro_sessionDriver = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _default
}, Symbol.toStringTag, { value: 'Module' }));

const serverIslandMap = new Map([

]);

const serverIslandNameMap = new Map([]);

const _virtual_astro_serverIslandManifest = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  serverIslandMap,
  serverIslandNameMap
}, Symbol.toStringTag, { value: 'Module' }));

let sharp$1;
const qualityTable = {
  low: 25,
  mid: 50,
  high: 80,
  max: 100
};
function resolveSharpQuality(quality) {
  if (!quality) return void 0;
  const parsedQuality = parseQuality(quality);
  if (typeof parsedQuality === "number") {
    return parsedQuality;
  }
  return quality in qualityTable ? qualityTable[quality] : void 0;
}
function resolveSharpEncoderOptions(transform, inputFormat, serviceConfig = {}) {
  const quality = resolveSharpQuality(transform.quality);
  if (transform.format === void 0) {
    return quality === void 0 ? void 0 : { quality };
  }
  switch (transform.format) {
    case "jpg":
    case "jpeg":
      return {
        ...serviceConfig.jpeg,
        ...quality === void 0 ? {} : { quality }
      };
    case "png":
      return {
        ...serviceConfig.png,
        ...quality === void 0 ? {} : { quality }
      };
    case "webp": {
      const webpOptions = {
        ...serviceConfig.webp,
        ...quality === void 0 ? {} : { quality }
      };
      if (inputFormat === "gif") {
        webpOptions.loop ??= 0;
      }
      return webpOptions;
    }
    case "avif":
      return {
        ...serviceConfig.avif,
        ...quality === void 0 ? {} : { quality }
      };
    default:
      return quality === void 0 ? void 0 : { quality };
  }
}
async function loadSharp() {
  let sharpImport;
  try {
    sharpImport = (await Promise.resolve().then(() => index$1)).default;
  } catch {
    throw new AstroError(MissingSharp);
  }
  sharpImport.cache(false);
  return sharpImport;
}
const fitMap = {
  fill: "fill",
  contain: "inside",
  cover: "cover",
  none: "outside",
  "scale-down": "inside",
  outside: "outside",
  inside: "inside"
};
const sharpService = {
  validateOptions: baseService.validateOptions,
  getURL: baseService.getURL,
  parseURL: baseService.parseURL,
  getHTMLAttributes: baseService.getHTMLAttributes,
  getSrcSet: baseService.getSrcSet,
  getRemoteSize: baseService.getRemoteSize,
  async transform(inputBuffer, transformOptions, config) {
    if (!sharp$1) sharp$1 = await loadSharp();
    const transform = transformOptions;
    const kernel = config.service.config.kernel;
    const bufferFormat = detector(inputBuffer);
    const outputFormat = transform.format ?? resolveDefaultOutputFormat(bufferFormat);
    if (outputFormat === "svg") {
      if (bufferFormat && bufferFormat !== "svg") {
        console.warn(
          `\u26A0\uFE0F  Astro expected an SVG for "${transform.src}" but the source is ${bufferFormat}. Passing it through as ${bufferFormat} instead.`
        );
        return { data: inputBuffer, format: bufferFormat };
      }
      return { data: inputBuffer, format: "svg" };
    }
    if (!bufferFormat) {
      throw new AstroError({
        ...NoImageMetadata,
        message: NoImageMetadata.message(transform.src)
      });
    }
    if (bufferFormat === "svg" && !config.dangerouslyProcessSVG) {
      throw new AstroError({
        ...UnsupportedImageFormat,
        message: `SVG image processing is disabled, but the source for "${transform.src}" is an SVG. Pass it through unchanged by setting \`format="svg"\` on the component, or set \`image.dangerouslyProcessSVG: true\` to rasterize SVG sources.`
      });
    }
    const result = sharp$1(inputBuffer, {
      failOnError: false,
      pages: -1,
      limitInputPixels: config.service.config.limitInputPixels
    });
    result.rotate();
    if (transform.width && transform.height) {
      const fit = transform.fit ? fitMap[transform.fit] ?? "inside" : void 0;
      result.resize({
        width: Math.round(transform.width),
        height: Math.round(transform.height),
        kernel,
        fit,
        position: transform.position,
        withoutEnlargement: true
      });
    } else if (transform.height && !transform.width) {
      result.resize({
        height: Math.round(transform.height),
        withoutEnlargement: true,
        kernel
      });
    } else if (transform.width) {
      result.resize({
        width: Math.round(transform.width),
        withoutEnlargement: true,
        kernel
      });
    }
    if (transform.background) {
      result.flatten({ background: transform.background });
    }
    const encoderOptions = resolveSharpEncoderOptions(
      { format: outputFormat, quality: transform.quality },
      bufferFormat,
      config.service.config
    );
    if (outputFormat === "webp") {
      result.webp(encoderOptions);
    } else if (outputFormat === "png") {
      result.png(encoderOptions);
    } else if (outputFormat === "avif") {
      result.avif(encoderOptions);
    } else if (outputFormat === "jpeg" || outputFormat === "jpg") {
      result.jpeg(encoderOptions);
    } else {
      result.toFormat(outputFormat, encoderOptions);
    }
    let data;
    let info;
    try {
      ({ data, info } = await result.toBuffer({ resolveWithObject: true }));
    } catch {
      console.warn(
        `\u26A0\uFE0F  Astro could not optimize image "${transform.src}". Sharp doesn't support this format. The image will be used unoptimized. Consider converting to WebP or placing in the public/ folder.`
      );
      return { data: inputBuffer, format: bufferFormat };
    }
    const needsCopy = "buffer" in data && data.buffer instanceof SharedArrayBuffer;
    return {
      data: needsCopy ? new Uint8Array(data) : data,
      format: info.format
    };
  }
};
var sharp_default = sharpService;

const sharp$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: sharp_default,
  resolveSharpEncoderOptions
}, Symbol.toStringTag, { value: 'Module' }));

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var is;
var hasRequiredIs;

function requireIs () {
	if (hasRequiredIs) return is;
	hasRequiredIs = 1;
	/**
	 * Is this value defined and not null?
	 * @private
	 */
	const defined = (val) => typeof val !== 'undefined' && val !== null;

	/**
	 * Is this value an object?
	 * @private
	 */
	const object = (val) => typeof val === 'object';

	/**
	 * Is this value a plain object?
	 * @private
	 */
	const plainObject = (val) => Object.prototype.toString.call(val) === '[object Object]';

	/**
	 * Is this value a function?
	 * @private
	 */
	const fn = (val) => typeof val === 'function';

	/**
	 * Is this value a boolean?
	 * @private
	 */
	const bool = (val) => typeof val === 'boolean';

	/**
	 * Is this value a Buffer object?
	 * @private
	 */
	const buffer = (val) => val instanceof Buffer;

	/**
	 * Is this value a typed array object?. E.g. Uint8Array or Uint8ClampedArray?
	 * @private
	 */
	const typedArray = (val) => {
	  if (defined(val)) {
	    switch (val.constructor) {
	      case Uint8Array:
	      case Uint8ClampedArray:
	      case Int8Array:
	      case Uint16Array:
	      case Int16Array:
	      case Uint32Array:
	      case Int32Array:
	      case Float32Array:
	      case Float64Array:
	        return true;
	    }
	  }

	  return false;
	};

	/**
	 * Is this value an ArrayBuffer object?
	 * @private
	 */
	const arrayBuffer = (val) => val instanceof ArrayBuffer;

	/**
	 * Is this value a non-empty string?
	 * @private
	 */
	const string = (val) => typeof val === 'string' && val.length > 0;

	/**
	 * Is this value a real number?
	 * @private
	 */
	const number = (val) => typeof val === 'number' && !Number.isNaN(val);

	/**
	 * Is this value an integer?
	 * @private
	 */
	const integer = (val) => Number.isInteger(val);

	/**
	 * Is this value within an inclusive given range?
	 * @private
	 */
	const inRange = (val, min, max) => val >= min && val <= max;

	/**
	 * Is this value within the elements of an array?
	 * @private
	 */
	const inArray = (val, list) => list.includes(val);

	/**
	 * Create an Error with a message relating to an invalid parameter.
	 *
	 * @param {string} name - parameter name.
	 * @param {string} expected - description of the type/value/range expected.
	 * @param {*} actual - the value received.
	 * @returns {Error} Containing the formatted message.
	 * @private
	 */
	const invalidParameterError = (name, expected, actual) => new Error(
	    `Expected ${expected} for ${name} but received ${actual} of type ${typeof actual}`
	  );

	/**
	 * Ensures an Error from C++ contains a JS stack.
	 *
	 * @param {Error} native - Error with message from C++.
	 * @param {Error} context - Error with stack from JS.
	 * @returns {Error} Error with message and stack.
	 * @private
	 */
	const nativeError = (native, context) => {
	  context.message = native.message;
	  return context;
	};

	is = {
	  defined,
	  object,
	  plainObject,
	  fn,
	  bool,
	  buffer,
	  typedArray,
	  arrayBuffer,
	  string,
	  number,
	  integer,
	  inRange,
	  inArray,
	  invalidParameterError,
	  nativeError
	};
	return is;
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var sharp = {exports: {}};

var process_1;
var hasRequiredProcess;

function requireProcess () {
	if (hasRequiredProcess) return process_1;
	hasRequiredProcess = 1;

	const isLinux = () => process.platform === 'linux';

	let report = null;
	const getReport = () => {
	  if (!report) {
	    /* istanbul ignore next */
	    if (isLinux() && process.report) {
	      const orig = process.report.excludeNetwork;
	      process.report.excludeNetwork = true;
	      report = process.report.getReport();
	      process.report.excludeNetwork = orig;
	    } else {
	      report = {};
	    }
	  }
	  return report;
	};

	process_1 = { isLinux, getReport };
	return process_1;
}

var filesystem;
var hasRequiredFilesystem;

function requireFilesystem () {
	if (hasRequiredFilesystem) return filesystem;
	hasRequiredFilesystem = 1;

	const fs = require$$0;

	const LDD_PATH = '/usr/bin/ldd';
	const SELF_PATH = '/proc/self/exe';
	const MAX_LENGTH = 2048;

	/**
	 * Read the content of a file synchronous
	 *
	 * @param {string} path
	 * @returns {Buffer}
	 */
	const readFileSync = (path) => {
	  const fd = fs.openSync(path, 'r');
	  const buffer = Buffer.alloc(MAX_LENGTH);
	  const bytesRead = fs.readSync(fd, buffer, 0, MAX_LENGTH, 0);
	  fs.close(fd, () => {});
	  return buffer.subarray(0, bytesRead);
	};

	/**
	 * Read the content of a file
	 *
	 * @param {string} path
	 * @returns {Promise<Buffer>}
	 */
	const readFile = (path) => new Promise((resolve, reject) => {
	  fs.open(path, 'r', (err, fd) => {
	    if (err) {
	      reject(err);
	    } else {
	      const buffer = Buffer.alloc(MAX_LENGTH);
	      fs.read(fd, buffer, 0, MAX_LENGTH, 0, (_, bytesRead) => {
	        resolve(buffer.subarray(0, bytesRead));
	        fs.close(fd, () => {});
	      });
	    }
	  });
	});

	filesystem = {
	  LDD_PATH,
	  SELF_PATH,
	  readFileSync,
	  readFile
	};
	return filesystem;
}

var elf;
var hasRequiredElf;

function requireElf () {
	if (hasRequiredElf) return elf;
	hasRequiredElf = 1;

	const interpreterPath = (elf) => {
	  if (elf.length < 64) {
	    return null;
	  }
	  if (elf.readUInt32BE(0) !== 0x7F454C46) {
	    // Unexpected magic bytes
	    return null;
	  }
	  if (elf.readUInt8(4) !== 2) {
	    // Not a 64-bit ELF
	    return null;
	  }
	  if (elf.readUInt8(5) !== 1) {
	    // Not little-endian
	    return null;
	  }
	  const offset = elf.readUInt32LE(32);
	  const size = elf.readUInt16LE(54);
	  const count = elf.readUInt16LE(56);
	  for (let i = 0; i < count; i++) {
	    const headerOffset = offset + (i * size);
	    const type = elf.readUInt32LE(headerOffset);
	    if (type === 3) {
	      const fileOffset = elf.readUInt32LE(headerOffset + 8);
	      const fileSize = elf.readUInt32LE(headerOffset + 32);
	      return elf.subarray(fileOffset, fileOffset + fileSize).toString().replace(/\0.*$/g, '');
	    }
	  }
	  return null;
	};

	elf = {
	  interpreterPath
	};
	return elf;
}

var detectLibc;
var hasRequiredDetectLibc;

function requireDetectLibc () {
	if (hasRequiredDetectLibc) return detectLibc;
	hasRequiredDetectLibc = 1;

	const childProcess = require$$0$1;
	const { isLinux, getReport } = requireProcess();
	const { LDD_PATH, SELF_PATH, readFile, readFileSync } = requireFilesystem();
	const { interpreterPath } = requireElf();

	let cachedFamilyInterpreter;
	let cachedFamilyFilesystem;
	let cachedVersionFilesystem;

	const command = 'getconf GNU_LIBC_VERSION 2>&1 || true; ldd --version 2>&1 || true';
	let commandOut = '';

	const safeCommand = () => {
	  if (!commandOut) {
	    return new Promise((resolve) => {
	      childProcess.exec(command, (err, out) => {
	        commandOut = err ? ' ' : out;
	        resolve(commandOut);
	      });
	    });
	  }
	  return commandOut;
	};

	const safeCommandSync = () => {
	  if (!commandOut) {
	    try {
	      commandOut = childProcess.execSync(command, { encoding: 'utf8' });
	    } catch (_err) {
	      commandOut = ' ';
	    }
	  }
	  return commandOut;
	};

	/**
	 * A String constant containing the value `glibc`.
	 * @type {string}
	 * @public
	 */
	const GLIBC = 'glibc';

	/**
	 * A Regexp constant to get the GLIBC Version.
	 * @type {string}
	 */
	const RE_GLIBC_VERSION = /LIBC[a-z0-9 \-).]*?(\d+\.\d+)/i;

	/**
	 * A String constant containing the value `musl`.
	 * @type {string}
	 * @public
	 */
	const MUSL = 'musl';

	const isFileMusl = (f) => f.includes('libc.musl-') || f.includes('ld-musl-');

	const familyFromReport = () => {
	  const report = getReport();
	  if (report.header && report.header.glibcVersionRuntime) {
	    return GLIBC;
	  }
	  if (Array.isArray(report.sharedObjects)) {
	    if (report.sharedObjects.some(isFileMusl)) {
	      return MUSL;
	    }
	  }
	  return null;
	};

	const familyFromCommand = (out) => {
	  const [getconf, ldd1] = out.split(/[\r\n]+/);
	  if (getconf && getconf.includes(GLIBC)) {
	    return GLIBC;
	  }
	  if (ldd1 && ldd1.includes(MUSL)) {
	    return MUSL;
	  }
	  return null;
	};

	const familyFromInterpreterPath = (path) => {
	  if (path) {
	    if (path.includes('/ld-musl-')) {
	      return MUSL;
	    } else if (path.includes('/ld-linux-')) {
	      return GLIBC;
	    }
	  }
	  return null;
	};

	const getFamilyFromLddContent = (content) => {
	  content = content.toString();
	  if (content.includes('musl')) {
	    return MUSL;
	  }
	  if (content.includes('GNU C Library')) {
	    return GLIBC;
	  }
	  return null;
	};

	const familyFromFilesystem = async () => {
	  if (cachedFamilyFilesystem !== undefined) {
	    return cachedFamilyFilesystem;
	  }
	  cachedFamilyFilesystem = null;
	  try {
	    const lddContent = await readFile(LDD_PATH);
	    cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
	  } catch (e) {}
	  return cachedFamilyFilesystem;
	};

	const familyFromFilesystemSync = () => {
	  if (cachedFamilyFilesystem !== undefined) {
	    return cachedFamilyFilesystem;
	  }
	  cachedFamilyFilesystem = null;
	  try {
	    const lddContent = readFileSync(LDD_PATH);
	    cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
	  } catch (e) {}
	  return cachedFamilyFilesystem;
	};

	const familyFromInterpreter = async () => {
	  if (cachedFamilyInterpreter !== undefined) {
	    return cachedFamilyInterpreter;
	  }
	  cachedFamilyInterpreter = null;
	  try {
	    const selfContent = await readFile(SELF_PATH);
	    const path = interpreterPath(selfContent);
	    cachedFamilyInterpreter = familyFromInterpreterPath(path);
	  } catch (e) {}
	  return cachedFamilyInterpreter;
	};

	const familyFromInterpreterSync = () => {
	  if (cachedFamilyInterpreter !== undefined) {
	    return cachedFamilyInterpreter;
	  }
	  cachedFamilyInterpreter = null;
	  try {
	    const selfContent = readFileSync(SELF_PATH);
	    const path = interpreterPath(selfContent);
	    cachedFamilyInterpreter = familyFromInterpreterPath(path);
	  } catch (e) {}
	  return cachedFamilyInterpreter;
	};

	/**
	 * Resolves with the libc family when it can be determined, `null` otherwise.
	 * @returns {Promise<?string>}
	 */
	const family = async () => {
	  let family = null;
	  if (isLinux()) {
	    family = await familyFromInterpreter();
	    if (!family) {
	      family = await familyFromFilesystem();
	      if (!family) {
	        family = familyFromReport();
	      }
	      if (!family) {
	        const out = await safeCommand();
	        family = familyFromCommand(out);
	      }
	    }
	  }
	  return family;
	};

	/**
	 * Returns the libc family when it can be determined, `null` otherwise.
	 * @returns {?string}
	 */
	const familySync = () => {
	  let family = null;
	  if (isLinux()) {
	    family = familyFromInterpreterSync();
	    if (!family) {
	      family = familyFromFilesystemSync();
	      if (!family) {
	        family = familyFromReport();
	      }
	      if (!family) {
	        const out = safeCommandSync();
	        family = familyFromCommand(out);
	      }
	    }
	  }
	  return family;
	};

	/**
	 * Resolves `true` only when the platform is Linux and the libc family is not `glibc`.
	 * @returns {Promise<boolean>}
	 */
	const isNonGlibcLinux = async () => isLinux() && await family() !== GLIBC;

	/**
	 * Returns `true` only when the platform is Linux and the libc family is not `glibc`.
	 * @returns {boolean}
	 */
	const isNonGlibcLinuxSync = () => isLinux() && familySync() !== GLIBC;

	const versionFromFilesystem = async () => {
	  if (cachedVersionFilesystem !== undefined) {
	    return cachedVersionFilesystem;
	  }
	  cachedVersionFilesystem = null;
	  try {
	    const lddContent = await readFile(LDD_PATH);
	    const versionMatch = lddContent.match(RE_GLIBC_VERSION);
	    if (versionMatch) {
	      cachedVersionFilesystem = versionMatch[1];
	    }
	  } catch (e) {}
	  return cachedVersionFilesystem;
	};

	const versionFromFilesystemSync = () => {
	  if (cachedVersionFilesystem !== undefined) {
	    return cachedVersionFilesystem;
	  }
	  cachedVersionFilesystem = null;
	  try {
	    const lddContent = readFileSync(LDD_PATH);
	    const versionMatch = lddContent.match(RE_GLIBC_VERSION);
	    if (versionMatch) {
	      cachedVersionFilesystem = versionMatch[1];
	    }
	  } catch (e) {}
	  return cachedVersionFilesystem;
	};

	const versionFromReport = () => {
	  const report = getReport();
	  if (report.header && report.header.glibcVersionRuntime) {
	    return report.header.glibcVersionRuntime;
	  }
	  return null;
	};

	const versionSuffix = (s) => s.trim().split(/\s+/)[1];

	const versionFromCommand = (out) => {
	  const [getconf, ldd1, ldd2] = out.split(/[\r\n]+/);
	  if (getconf && getconf.includes(GLIBC)) {
	    return versionSuffix(getconf);
	  }
	  if (ldd1 && ldd2 && ldd1.includes(MUSL)) {
	    return versionSuffix(ldd2);
	  }
	  return null;
	};

	/**
	 * Resolves with the libc version when it can be determined, `null` otherwise.
	 * @returns {Promise<?string>}
	 */
	const version = async () => {
	  let version = null;
	  if (isLinux()) {
	    version = await versionFromFilesystem();
	    if (!version) {
	      version = versionFromReport();
	    }
	    if (!version) {
	      const out = await safeCommand();
	      version = versionFromCommand(out);
	    }
	  }
	  return version;
	};

	/**
	 * Returns the libc version when it can be determined, `null` otherwise.
	 * @returns {?string}
	 */
	const versionSync = () => {
	  let version = null;
	  if (isLinux()) {
	    version = versionFromFilesystemSync();
	    if (!version) {
	      version = versionFromReport();
	    }
	    if (!version) {
	      const out = safeCommandSync();
	      version = versionFromCommand(out);
	    }
	  }
	  return version;
	};

	detectLibc = {
	  GLIBC,
	  MUSL,
	  family,
	  familySync,
	  isNonGlibcLinux,
	  isNonGlibcLinuxSync,
	  version,
	  versionSync
	};
	return detectLibc;
}

var debug_1;
var hasRequiredDebug;

function requireDebug () {
	if (hasRequiredDebug) return debug_1;
	hasRequiredDebug = 1;
	const debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
	};
	debug_1 = debug;
	return debug_1;
}

var constants;
var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;

	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	const SEMVER_SPEC_VERSION = '2.0.0';

	const MAX_LENGTH = 256;
	const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
	/* istanbul ignore next */ 9007199254740991;

	// Max safe segment length for coercion.
	const MAX_SAFE_COMPONENT_LENGTH = 16;

	// Max safe length for a build identifier. The max length minus 6 characters for
	// the shortest version with a build 0.0.0+BUILD.
	const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;

	const RELEASE_TYPES = [
	  'major',
	  'premajor',
	  'minor',
	  'preminor',
	  'patch',
	  'prepatch',
	  'prerelease',
	];

	constants = {
	  MAX_LENGTH,
	  MAX_SAFE_COMPONENT_LENGTH,
	  MAX_SAFE_BUILD_LENGTH,
	  MAX_SAFE_INTEGER,
	  RELEASE_TYPES,
	  SEMVER_SPEC_VERSION,
	  FLAG_INCLUDE_PRERELEASE: 0b001,
	  FLAG_LOOSE: 0b010,
	};
	return constants;
}

var re = {exports: {}};

var hasRequiredRe;

function requireRe () {
	if (hasRequiredRe) return re.exports;
	hasRequiredRe = 1;
	(function (module, exports) {

		const {
		  MAX_SAFE_COMPONENT_LENGTH,
		  MAX_SAFE_BUILD_LENGTH,
		  MAX_LENGTH,
		} = requireConstants();
		const debug = requireDebug();
		exports = module.exports = {};

		// The actual regexps go on exports.re
		const re = exports.re = [];
		const safeRe = exports.safeRe = [];
		const src = exports.src = [];
		const safeSrc = exports.safeSrc = [];
		const t = exports.t = {};
		let R = 0;

		const LETTERDASHNUMBER = '[a-zA-Z0-9-]';

		// Replace some greedy regex tokens to prevent regex dos issues. These regex are
		// used internally via the safeRe object since all inputs in this library get
		// normalized first to trim and collapse all extra whitespace. The original
		// regexes are exported for userland consumption and lower level usage. A
		// future breaking change could export the safer regex only with a note that
		// all input should have extra whitespace removed.
		const safeRegexReplacements = [
		  ['\\s', 1],
		  ['\\d', MAX_LENGTH],
		  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
		];

		const makeSafeRegex = (value) => {
		  for (const [token, max] of safeRegexReplacements) {
		    value = value
		      .split(`${token}*`).join(`${token}{0,${max}}`)
		      .split(`${token}+`).join(`${token}{1,${max}}`);
		  }
		  return value
		};

		const createToken = (name, value, isGlobal) => {
		  const safe = makeSafeRegex(value);
		  const index = R++;
		  debug(name, index, value);
		  t[name] = index;
		  src[index] = value;
		  safeSrc[index] = safe;
		  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
		  safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
		};

		// The following Regular Expressions can be used for tokenizing,
		// validating, and parsing SemVer version strings.

		// ## Numeric Identifier
		// A single `0`, or a non-zero digit followed by zero or more digits.

		createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
		createToken('NUMERICIDENTIFIERLOOSE', '\\d+');

		// ## Non-numeric Identifier
		// Zero or more digits, followed by a letter or hyphen, and then zero or
		// more letters, digits, or hyphens.

		createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);

		// ## Main Version
		// Three dot-separated numeric identifiers.

		createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
		                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
		                   `(${src[t.NUMERICIDENTIFIER]})`);

		createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
		                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
		                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

		// ## Pre-release Version Identifier
		// A numeric identifier, or a non-numeric identifier.
		// Non-numeric identifiers include numeric identifiers but can be longer.
		// Therefore non-numeric identifiers must go first.

		createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NONNUMERICIDENTIFIER]
		}|${src[t.NUMERICIDENTIFIER]})`);

		createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NONNUMERICIDENTIFIER]
		}|${src[t.NUMERICIDENTIFIERLOOSE]})`);

		// ## Pre-release Version
		// Hyphen, followed by one or more dot-separated pre-release version
		// identifiers.

		createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
		}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

		createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
		}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

		// ## Build Metadata Identifier
		// Any combination of digits, letters, or hyphens.

		createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);

		// ## Build Metadata
		// Plus sign, followed by one or more period-separated build metadata
		// identifiers.

		createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
		}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

		// ## Full Version String
		// A main version, followed optionally by a pre-release version and
		// build metadata.

		// Note that the only major, minor, patch, and pre-release sections of
		// the version string are capturing groups.  The build metadata is not a
		// capturing group, because it should not ever be used in version
		// comparison.

		createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
		}${src[t.PRERELEASE]}?${
		  src[t.BUILD]}?`);

		createToken('FULL', `^${src[t.FULLPLAIN]}$`);

		// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
		// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
		// common in the npm registry.
		createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
		}${src[t.PRERELEASELOOSE]}?${
		  src[t.BUILD]}?`);

		createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

		createToken('GTLT', '((?:<|>)?=?)');

		// Something like "2.*" or "1.2.x".
		// Note that "x.x" is a valid xRange identifier, meaning "any version"
		// Only the first item is strictly required.
		createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
		createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

		createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:${src[t.PRERELEASE]})?${
		                     src[t.BUILD]}?` +
		                   `)?)?`);

		createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:${src[t.PRERELEASELOOSE]})?${
		                          src[t.BUILD]}?` +
		                        `)?)?`);

		createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
		createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

		// Coercion.
		// Extract anything that could conceivably be a part of a valid semver
		createToken('COERCEPLAIN', `${'(^|[^\\d])' +
		              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
		              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
		              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
		createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
		createToken('COERCEFULL', src[t.COERCEPLAIN] +
		              `(?:${src[t.PRERELEASE]})?` +
		              `(?:${src[t.BUILD]})?` +
		              `(?:$|[^\\d])`);
		createToken('COERCERTL', src[t.COERCE], true);
		createToken('COERCERTLFULL', src[t.COERCEFULL], true);

		// Tilde ranges.
		// Meaning is "reasonably at or greater than"
		createToken('LONETILDE', '(?:~>?)');

		createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
		exports.tildeTrimReplace = '$1~';

		createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
		createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

		// Caret ranges.
		// Meaning is "at least and backwards compatible with"
		createToken('LONECARET', '(?:\\^)');

		createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
		exports.caretTrimReplace = '$1^';

		createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
		createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

		// A simple gt/lt/eq thing, or just "" to indicate "any version"
		createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
		createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

		// An expression to strip any whitespace between the gtlt and the thing
		// it modifies, so that `> 1.2.3` ==> `>1.2.3`
		createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
		}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
		exports.comparatorTrimReplace = '$1$2$3';

		// Something like `1.2.3 - 1.2.4`
		// Note that these all use the loose form, because they'll be
		// checked against either the strict or loose comparator form
		// later.
		createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
		                   `\\s+-\\s+` +
		                   `(${src[t.XRANGEPLAIN]})` +
		                   `\\s*$`);

		createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
		                        `\\s+-\\s+` +
		                        `(${src[t.XRANGEPLAINLOOSE]})` +
		                        `\\s*$`);

		// Star ranges basically just allow anything at all.
		createToken('STAR', '(<|>)?=?\\s*\\*');
		// >=0.0.0 is like a star
		createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
		createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$'); 
	} (re, re.exports));
	return re.exports;
}

var parseOptions_1;
var hasRequiredParseOptions;

function requireParseOptions () {
	if (hasRequiredParseOptions) return parseOptions_1;
	hasRequiredParseOptions = 1;

	// parse out just the options we care about
	const looseOption = Object.freeze({ loose: true });
	const emptyOpts = Object.freeze({ });
	const parseOptions = options => {
	  if (!options) {
	    return emptyOpts
	  }

	  if (typeof options !== 'object') {
	    return looseOption
	  }

	  return options
	};
	parseOptions_1 = parseOptions;
	return parseOptions_1;
}

var identifiers;
var hasRequiredIdentifiers;

function requireIdentifiers () {
	if (hasRequiredIdentifiers) return identifiers;
	hasRequiredIdentifiers = 1;

	const numeric = /^[0-9]+$/;
	const compareIdentifiers = (a, b) => {
	  if (typeof a === 'number' && typeof b === 'number') {
	    return a === b ? 0 : a < b ? -1 : 1
	  }

	  const anum = numeric.test(a);
	  const bnum = numeric.test(b);

	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }

	  return a === b ? 0
	    : (anum && !bnum) ? -1
	    : (bnum && !anum) ? 1
	    : a < b ? -1
	    : 1
	};

	const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);

	identifiers = {
	  compareIdentifiers,
	  rcompareIdentifiers,
	};
	return identifiers;
}

var semver;
var hasRequiredSemver;

function requireSemver () {
	if (hasRequiredSemver) return semver;
	hasRequiredSemver = 1;

	const debug = requireDebug();
	const { MAX_LENGTH, MAX_SAFE_INTEGER } = requireConstants();
	const { safeRe: re, t } = requireRe();

	const parseOptions = requireParseOptions();
	const { compareIdentifiers } = requireIdentifiers();

	const isPrereleaseIdentifier = (prerelease, identifier) => {
	  const identifiers = identifier.split('.');
	  if (identifiers.length > prerelease.length) {
	    return false
	  }

	  for (let i = 0; i < identifiers.length; i++) {
	    if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) {
	      return false
	    }
	  }

	  return true
	};

	class SemVer {
	  constructor (version, options) {
	    options = parseOptions(options);

	    if (version instanceof SemVer) {
	      if (version.loose === !!options.loose &&
	        version.includePrerelease === !!options.includePrerelease) {
	        return version
	      } else {
	        version = version.version;
	      }
	    } else if (typeof version !== 'string') {
	      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`)
	    }

	    if (version.length > MAX_LENGTH) {
	      throw new TypeError(
	        `version is longer than ${MAX_LENGTH} characters`
	      )
	    }

	    debug('SemVer', version, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    // this isn't actually relevant for versions, but keep it so that we
	    // don't run into trouble passing this.options around.
	    this.includePrerelease = !!options.includePrerelease;

	    const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);

	    if (!m) {
	      throw new TypeError(`Invalid Version: ${version}`)
	    }

	    this.raw = version;

	    // these are actually numbers
	    this.major = +m[1];
	    this.minor = +m[2];
	    this.patch = +m[3];

	    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
	      throw new TypeError('Invalid major version')
	    }

	    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
	      throw new TypeError('Invalid minor version')
	    }

	    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
	      throw new TypeError('Invalid patch version')
	    }

	    // numberify any prerelease numeric ids
	    if (!m[4]) {
	      this.prerelease = [];
	    } else {
	      this.prerelease = m[4].split('.').map((id) => {
	        if (/^[0-9]+$/.test(id)) {
	          const num = +id;
	          if (num >= 0 && num < MAX_SAFE_INTEGER) {
	            return num
	          }
	        }
	        return id
	      });
	    }

	    this.build = m[5] ? m[5].split('.') : [];
	    this.format();
	  }

	  format () {
	    this.version = `${this.major}.${this.minor}.${this.patch}`;
	    if (this.prerelease.length) {
	      this.version += `-${this.prerelease.join('.')}`;
	    }
	    return this.version
	  }

	  toString () {
	    return this.version
	  }

	  compare (other) {
	    debug('SemVer.compare', this.version, this.options, other);
	    if (!(other instanceof SemVer)) {
	      if (typeof other === 'string' && other === this.version) {
	        return 0
	      }
	      other = new SemVer(other, this.options);
	    }

	    if (other.version === this.version) {
	      return 0
	    }

	    return this.compareMain(other) || this.comparePre(other)
	  }

	  compareMain (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    if (this.major < other.major) {
	      return -1
	    }
	    if (this.major > other.major) {
	      return 1
	    }
	    if (this.minor < other.minor) {
	      return -1
	    }
	    if (this.minor > other.minor) {
	      return 1
	    }
	    if (this.patch < other.patch) {
	      return -1
	    }
	    if (this.patch > other.patch) {
	      return 1
	    }
	    return 0
	  }

	  comparePre (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    // NOT having a prerelease is > having one
	    if (this.prerelease.length && !other.prerelease.length) {
	      return -1
	    } else if (!this.prerelease.length && other.prerelease.length) {
	      return 1
	    } else if (!this.prerelease.length && !other.prerelease.length) {
	      return 0
	    }

	    let i = 0;
	    do {
	      const a = this.prerelease[i];
	      const b = other.prerelease[i];
	      debug('prerelease compare', i, a, b);
	      if (a === undefined && b === undefined) {
	        return 0
	      } else if (b === undefined) {
	        return 1
	      } else if (a === undefined) {
	        return -1
	      } else if (a === b) {
	        continue
	      } else {
	        return compareIdentifiers(a, b)
	      }
	    } while (++i)
	  }

	  compareBuild (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    let i = 0;
	    do {
	      const a = this.build[i];
	      const b = other.build[i];
	      debug('build compare', i, a, b);
	      if (a === undefined && b === undefined) {
	        return 0
	      } else if (b === undefined) {
	        return 1
	      } else if (a === undefined) {
	        return -1
	      } else if (a === b) {
	        continue
	      } else {
	        return compareIdentifiers(a, b)
	      }
	    } while (++i)
	  }

	  // preminor will bump the version up to the next minor release, and immediately
	  // down to pre-release. premajor and prepatch work the same way.
	  inc (release, identifier, identifierBase) {
	    if (release.startsWith('pre')) {
	      if (!identifier && identifierBase === false) {
	        throw new Error('invalid increment argument: identifier is empty')
	      }
	      // Avoid an invalid semver results
	      if (identifier) {
	        const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
	        if (!match || match[1] !== identifier) {
	          throw new Error(`invalid identifier: ${identifier}`)
	        }
	      }
	    }

	    switch (release) {
	      case 'premajor':
	        this.prerelease.length = 0;
	        this.patch = 0;
	        this.minor = 0;
	        this.major++;
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'preminor':
	        this.prerelease.length = 0;
	        this.patch = 0;
	        this.minor++;
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'prepatch':
	        // If this is already a prerelease, it will bump to the next version
	        // drop any prereleases that might already exist, since they are not
	        // relevant at this point.
	        this.prerelease.length = 0;
	        this.inc('patch', identifier, identifierBase);
	        this.inc('pre', identifier, identifierBase);
	        break
	      // If the input is a non-prerelease version, this acts the same as
	      // prepatch.
	      case 'prerelease':
	        if (this.prerelease.length === 0) {
	          this.inc('patch', identifier, identifierBase);
	        }
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'release':
	        if (this.prerelease.length === 0) {
	          throw new Error(`version ${this.raw} is not a prerelease`)
	        }
	        this.prerelease.length = 0;
	        break

	      case 'major':
	        // If this is a pre-major version, bump up to the same major version.
	        // Otherwise increment major.
	        // 1.0.0-5 bumps to 1.0.0
	        // 1.1.0 bumps to 2.0.0
	        if (
	          this.minor !== 0 ||
	          this.patch !== 0 ||
	          this.prerelease.length === 0
	        ) {
	          this.major++;
	        }
	        this.minor = 0;
	        this.patch = 0;
	        this.prerelease = [];
	        break
	      case 'minor':
	        // If this is a pre-minor version, bump up to the same minor version.
	        // Otherwise increment minor.
	        // 1.2.0-5 bumps to 1.2.0
	        // 1.2.1 bumps to 1.3.0
	        if (this.patch !== 0 || this.prerelease.length === 0) {
	          this.minor++;
	        }
	        this.patch = 0;
	        this.prerelease = [];
	        break
	      case 'patch':
	        // If this is not a pre-release version, it will increment the patch.
	        // If it is a pre-release it will bump up to the same patch version.
	        // 1.2.0-5 patches to 1.2.0
	        // 1.2.0 patches to 1.2.1
	        if (this.prerelease.length === 0) {
	          this.patch++;
	        }
	        this.prerelease = [];
	        break
	      // This probably shouldn't be used publicly.
	      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
	      case 'pre': {
	        const base = Number(identifierBase) ? 1 : 0;

	        if (this.prerelease.length === 0) {
	          this.prerelease = [base];
	        } else {
	          let i = this.prerelease.length;
	          while (--i >= 0) {
	            if (typeof this.prerelease[i] === 'number') {
	              this.prerelease[i]++;
	              i = -2;
	            }
	          }
	          if (i === -1) {
	            // didn't increment anything
	            if (identifier === this.prerelease.join('.') && identifierBase === false) {
	              throw new Error('invalid increment argument: identifier already exists')
	            }
	            this.prerelease.push(base);
	          }
	        }
	        if (identifier) {
	          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	          let prerelease = [identifier, base];
	          if (identifierBase === false) {
	            prerelease = [identifier];
	          }
	          if (isPrereleaseIdentifier(this.prerelease, identifier)) {
	            const prereleaseBase = this.prerelease[identifier.split('.').length];
	            if (isNaN(prereleaseBase)) {
	              this.prerelease = prerelease;
	            }
	          } else {
	            this.prerelease = prerelease;
	          }
	        }
	        break
	      }
	      default:
	        throw new Error(`invalid increment argument: ${release}`)
	    }
	    this.raw = this.format();
	    if (this.build.length) {
	      this.raw += `+${this.build.join('.')}`;
	    }
	    return this
	  }
	}

	semver = SemVer;
	return semver;
}

var parse_1;
var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse_1;
	hasRequiredParse = 1;

	const SemVer = requireSemver();
	const parse = (version, options, throwErrors = false) => {
	  if (version instanceof SemVer) {
	    return version
	  }
	  try {
	    return new SemVer(version, options)
	  } catch (er) {
	    if (!throwErrors) {
	      return null
	    }
	    throw er
	  }
	};

	parse_1 = parse;
	return parse_1;
}

var coerce_1;
var hasRequiredCoerce;

function requireCoerce () {
	if (hasRequiredCoerce) return coerce_1;
	hasRequiredCoerce = 1;

	const SemVer = requireSemver();
	const parse = requireParse();
	const { safeRe: re, t } = requireRe();

	const coerce = (version, options) => {
	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version === 'number') {
	    version = String(version);
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  options = options || {};

	  let match = null;
	  if (!options.rtl) {
	    match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
	  } else {
	    // Find the right-most coercible string that does not share
	    // a terminus with a more left-ward coercible string.
	    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
	    // With includePrerelease option set, '1.2.3.4-rc' wants to coerce '2.3.4-rc', not '2.3.4'
	    //
	    // Walk through the string checking with a /g regexp
	    // Manually set the index so as to pick up overlapping matches.
	    // Stop when we get a match that ends at the string end, since no
	    // coercible string can be more right-ward without the same terminus.
	    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
	    let next;
	    while ((next = coerceRtlRegex.exec(version)) &&
	        (!match || match.index + match[0].length !== version.length)
	    ) {
	      if (!match ||
	            next.index + next[0].length !== match.index + match[0].length) {
	        match = next;
	      }
	      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
	    }
	    // leave it in a clean state
	    coerceRtlRegex.lastIndex = -1;
	  }

	  if (match === null) {
	    return null
	  }

	  const major = match[2];
	  const minor = match[3] || '0';
	  const patch = match[4] || '0';
	  const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : '';
	  const build = options.includePrerelease && match[6] ? `+${match[6]}` : '';

	  return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options)
	};
	coerce_1 = coerce;
	return coerce_1;
}

var compare_1;
var hasRequiredCompare;

function requireCompare () {
	if (hasRequiredCompare) return compare_1;
	hasRequiredCompare = 1;

	const SemVer = requireSemver();
	const compare = (a, b, loose) =>
	  new SemVer(a, loose).compare(new SemVer(b, loose));

	compare_1 = compare;
	return compare_1;
}

var gte_1;
var hasRequiredGte;

function requireGte () {
	if (hasRequiredGte) return gte_1;
	hasRequiredGte = 1;

	const compare = requireCompare();
	const gte = (a, b, loose) => compare(a, b, loose) >= 0;
	gte_1 = gte;
	return gte_1;
}

var lrucache;
var hasRequiredLrucache;

function requireLrucache () {
	if (hasRequiredLrucache) return lrucache;
	hasRequiredLrucache = 1;

	class LRUCache {
	  constructor () {
	    this.max = 1000;
	    this.map = new Map();
	  }

	  get (key) {
	    const value = this.map.get(key);
	    if (value === undefined) {
	      return undefined
	    } else {
	      // Remove the key from the map and add it to the end
	      this.map.delete(key);
	      this.map.set(key, value);
	      return value
	    }
	  }

	  delete (key) {
	    return this.map.delete(key)
	  }

	  set (key, value) {
	    const deleted = this.delete(key);

	    if (!deleted && value !== undefined) {
	      // If cache is full, delete the least recently used item
	      if (this.map.size >= this.max) {
	        const firstKey = this.map.keys().next().value;
	        this.delete(firstKey);
	      }

	      this.map.set(key, value);
	    }

	    return this
	  }
	}

	lrucache = LRUCache;
	return lrucache;
}

var eq_1;
var hasRequiredEq;

function requireEq () {
	if (hasRequiredEq) return eq_1;
	hasRequiredEq = 1;

	const compare = requireCompare();
	const eq = (a, b, loose) => compare(a, b, loose) === 0;
	eq_1 = eq;
	return eq_1;
}

var neq_1;
var hasRequiredNeq;

function requireNeq () {
	if (hasRequiredNeq) return neq_1;
	hasRequiredNeq = 1;

	const compare = requireCompare();
	const neq = (a, b, loose) => compare(a, b, loose) !== 0;
	neq_1 = neq;
	return neq_1;
}

var gt_1;
var hasRequiredGt;

function requireGt () {
	if (hasRequiredGt) return gt_1;
	hasRequiredGt = 1;

	const compare = requireCompare();
	const gt = (a, b, loose) => compare(a, b, loose) > 0;
	gt_1 = gt;
	return gt_1;
}

var lt_1;
var hasRequiredLt;

function requireLt () {
	if (hasRequiredLt) return lt_1;
	hasRequiredLt = 1;

	const compare = requireCompare();
	const lt = (a, b, loose) => compare(a, b, loose) < 0;
	lt_1 = lt;
	return lt_1;
}

var lte_1;
var hasRequiredLte;

function requireLte () {
	if (hasRequiredLte) return lte_1;
	hasRequiredLte = 1;

	const compare = requireCompare();
	const lte = (a, b, loose) => compare(a, b, loose) <= 0;
	lte_1 = lte;
	return lte_1;
}

var cmp_1;
var hasRequiredCmp;

function requireCmp () {
	if (hasRequiredCmp) return cmp_1;
	hasRequiredCmp = 1;

	const eq = requireEq();
	const neq = requireNeq();
	const gt = requireGt();
	const gte = requireGte();
	const lt = requireLt();
	const lte = requireLte();

	const cmp = (a, op, b, loose) => {
	  switch (op) {
	    case '===':
	      if (typeof a === 'object') {
	        a = a.version;
	      }
	      if (typeof b === 'object') {
	        b = b.version;
	      }
	      return a === b

	    case '!==':
	      if (typeof a === 'object') {
	        a = a.version;
	      }
	      if (typeof b === 'object') {
	        b = b.version;
	      }
	      return a !== b

	    case '':
	    case '=':
	    case '==':
	      return eq(a, b, loose)

	    case '!=':
	      return neq(a, b, loose)

	    case '>':
	      return gt(a, b, loose)

	    case '>=':
	      return gte(a, b, loose)

	    case '<':
	      return lt(a, b, loose)

	    case '<=':
	      return lte(a, b, loose)

	    default:
	      throw new TypeError(`Invalid operator: ${op}`)
	  }
	};
	cmp_1 = cmp;
	return cmp_1;
}

var comparator;
var hasRequiredComparator;

function requireComparator () {
	if (hasRequiredComparator) return comparator;
	hasRequiredComparator = 1;

	const ANY = Symbol('SemVer ANY');
	// hoisted class for cyclic dependency
	class Comparator {
	  static get ANY () {
	    return ANY
	  }

	  constructor (comp, options) {
	    options = parseOptions(options);

	    if (comp instanceof Comparator) {
	      if (comp.loose === !!options.loose) {
	        return comp
	      } else {
	        comp = comp.value;
	      }
	    }

	    comp = comp.trim().split(/\s+/).join(' ');
	    debug('comparator', comp, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    this.parse(comp);

	    if (this.semver === ANY) {
	      this.value = '';
	    } else {
	      this.value = this.operator + this.semver.version;
	    }

	    debug('comp', this);
	  }

	  parse (comp) {
	    const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
	    const m = comp.match(r);

	    if (!m) {
	      throw new TypeError(`Invalid comparator: ${comp}`)
	    }

	    this.operator = m[1] !== undefined ? m[1] : '';
	    if (this.operator === '=') {
	      this.operator = '';
	    }

	    // if it literally is just '>' or '' then allow anything.
	    if (!m[2]) {
	      this.semver = ANY;
	    } else {
	      this.semver = new SemVer(m[2], this.options.loose);
	    }
	  }

	  toString () {
	    return this.value
	  }

	  test (version) {
	    debug('Comparator.test', version, this.options.loose);

	    if (this.semver === ANY || version === ANY) {
	      return true
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    return cmp(version, this.operator, this.semver, this.options)
	  }

	  intersects (comp, options) {
	    if (!(comp instanceof Comparator)) {
	      throw new TypeError('a Comparator is required')
	    }

	    if (this.operator === '') {
	      if (this.value === '') {
	        return true
	      }
	      return new Range(comp.value, options).test(this.value)
	    } else if (comp.operator === '') {
	      if (comp.value === '') {
	        return true
	      }
	      return new Range(this.value, options).test(comp.semver)
	    }

	    options = parseOptions(options);

	    // Special cases where nothing can possibly be lower
	    if (options.includePrerelease &&
	      (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
	      return false
	    }
	    if (!options.includePrerelease &&
	      (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
	      return false
	    }

	    // Same direction increasing (> or >=)
	    if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
	      return true
	    }
	    // Same direction decreasing (< or <=)
	    if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // same SemVer and both sides are inclusive (<= or >=)
	    if (
	      (this.semver.version === comp.semver.version) &&
	      this.operator.includes('=') && comp.operator.includes('=')) {
	      return true
	    }
	    // opposite directions less than
	    if (cmp(this.semver, '<', comp.semver, options) &&
	      this.operator.startsWith('>') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // opposite directions greater than
	    if (cmp(this.semver, '>', comp.semver, options) &&
	      this.operator.startsWith('<') && comp.operator.startsWith('>')) {
	      return true
	    }
	    return false
	  }
	}

	comparator = Comparator;

	const parseOptions = requireParseOptions();
	const { safeRe: re, t } = requireRe();
	const cmp = requireCmp();
	const debug = requireDebug();
	const SemVer = requireSemver();
	const Range = requireRange();
	return comparator;
}

var range;
var hasRequiredRange;

function requireRange () {
	if (hasRequiredRange) return range;
	hasRequiredRange = 1;

	const SPACE_CHARACTERS = /\s+/g;

	// hoisted class for cyclic dependency
	class Range {
	  constructor (range, options) {
	    options = parseOptions(options);

	    if (range instanceof Range) {
	      if (
	        range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease
	      ) {
	        return range
	      } else {
	        return new Range(range.raw, options)
	      }
	    }

	    if (range instanceof Comparator) {
	      // just put it in the set and return
	      this.raw = range.value;
	      this.set = [[range]];
	      this.formatted = undefined;
	      return this
	    }

	    this.options = options;
	    this.loose = !!options.loose;
	    this.includePrerelease = !!options.includePrerelease;

	    // First reduce all whitespace as much as possible so we do not have to rely
	    // on potentially slow regexes like \s*. This is then stored and used for
	    // future error messages as well.
	    this.raw = range.trim().replace(SPACE_CHARACTERS, ' ');

	    // First, split on ||
	    this.set = this.raw
	      .split('||')
	      // map the range to a 2d array of comparators
	      .map(r => this.parseRange(r.trim()))
	      // throw out any comparator lists that are empty
	      // this generally means that it was not a valid range, which is allowed
	      // in loose mode, but will still throw if the WHOLE range is invalid.
	      .filter(c => c.length);

	    if (!this.set.length) {
	      throw new TypeError(`Invalid SemVer Range: ${this.raw}`)
	    }

	    // if we have any that are not the null set, throw out null sets.
	    if (this.set.length > 1) {
	      // keep the first one, in case they're all null sets
	      const first = this.set[0];
	      this.set = this.set.filter(c => !isNullSet(c[0]));
	      if (this.set.length === 0) {
	        this.set = [first];
	      } else if (this.set.length > 1) {
	        // if we have any that are *, then the range is just *
	        for (const c of this.set) {
	          if (c.length === 1 && isAny(c[0])) {
	            this.set = [c];
	            break
	          }
	        }
	      }
	    }

	    this.formatted = undefined;
	  }

	  get range () {
	    if (this.formatted === undefined) {
	      this.formatted = '';
	      for (let i = 0; i < this.set.length; i++) {
	        if (i > 0) {
	          this.formatted += '||';
	        }
	        const comps = this.set[i];
	        for (let k = 0; k < comps.length; k++) {
	          if (k > 0) {
	            this.formatted += ' ';
	          }
	          this.formatted += comps[k].toString().trim();
	        }
	      }
	    }
	    return this.formatted
	  }

	  format () {
	    return this.range
	  }

	  toString () {
	    return this.range
	  }

	  parseRange (range) {
	    // strip build metadata so it can't bleed into the version
	    range = range.replace(BUILDSTRIPRE, '');

	    // memoize range parsing for performance.
	    // this is a very hot path, and fully deterministic.
	    const memoOpts =
	      (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) |
	      (this.options.loose && FLAG_LOOSE);
	    const memoKey = memoOpts + ':' + range;
	    const cached = cache.get(memoKey);
	    if (cached) {
	      return cached
	    }

	    const loose = this.options.loose;
	    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	    const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
	    range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
	    debug('hyphen replace', range);

	    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	    range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
	    debug('comparator trim', range);

	    // `~ 1.2.3` => `~1.2.3`
	    range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
	    debug('tilde trim', range);

	    // `^ 1.2.3` => `^1.2.3`
	    range = range.replace(re[t.CARETTRIM], caretTrimReplace);
	    debug('caret trim', range);

	    // At this point, the range is completely trimmed and
	    // ready to be split into comparators.

	    let rangeList = range
	      .split(' ')
	      .map(comp => parseComparator(comp, this.options))
	      .join(' ')
	      .split(/\s+/)
	      // >=0.0.0 is equivalent to *
	      .map(comp => replaceGTE0(comp, this.options));

	    if (loose) {
	      // in loose mode, throw out any that are not valid comparators
	      rangeList = rangeList.filter(comp => {
	        debug('loose invalid filter', comp, this.options);
	        return !!comp.match(re[t.COMPARATORLOOSE])
	      });
	    }
	    debug('range list', rangeList);

	    // if any comparators are the null set, then replace with JUST null set
	    // if more than one comparator, remove any * comparators
	    // also, don't include the same comparator more than once
	    const rangeMap = new Map();
	    const comparators = rangeList.map(comp => new Comparator(comp, this.options));
	    for (const comp of comparators) {
	      if (isNullSet(comp)) {
	        return [comp]
	      }
	      rangeMap.set(comp.value, comp);
	    }
	    if (rangeMap.size > 1 && rangeMap.has('')) {
	      rangeMap.delete('');
	    }

	    const result = [...rangeMap.values()];
	    cache.set(memoKey, result);
	    return result
	  }

	  intersects (range, options) {
	    if (!(range instanceof Range)) {
	      throw new TypeError('a Range is required')
	    }

	    return this.set.some((thisComparators) => {
	      return (
	        isSatisfiable(thisComparators, options) &&
	        range.set.some((rangeComparators) => {
	          return (
	            isSatisfiable(rangeComparators, options) &&
	            thisComparators.every((thisComparator) => {
	              return rangeComparators.every((rangeComparator) => {
	                return thisComparator.intersects(rangeComparator, options)
	              })
	            })
	          )
	        })
	      )
	    })
	  }

	  // if ANY of the sets match ALL of its comparators, then pass
	  test (version) {
	    if (!version) {
	      return false
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    for (let i = 0; i < this.set.length; i++) {
	      if (testSet(this.set[i], version, this.options)) {
	        return true
	      }
	    }
	    return false
	  }
	}

	range = Range;

	const LRU = requireLrucache();
	const cache = new LRU();

	const parseOptions = requireParseOptions();
	const Comparator = requireComparator();
	const debug = requireDebug();
	const SemVer = requireSemver();
	const {
	  safeRe: re,
	  src,
	  t,
	  comparatorTrimReplace,
	  tildeTrimReplace,
	  caretTrimReplace,
	} = requireRe();
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = requireConstants();

	// unbounded global build-metadata stripper used by parseRange
	const BUILDSTRIPRE = new RegExp(src[t.BUILD], 'g');

	const isNullSet = c => c.value === '<0.0.0-0';
	const isAny = c => c.value === '';

	// take a set of comparators and determine whether there
	// exists a version which can satisfy it
	const isSatisfiable = (comparators, options) => {
	  let result = true;
	  const remainingComparators = comparators.slice();
	  let testComparator = remainingComparators.pop();

	  while (result && remainingComparators.length) {
	    result = remainingComparators.every((otherComparator) => {
	      return testComparator.intersects(otherComparator, options)
	    });

	    testComparator = remainingComparators.pop();
	  }

	  return result
	};

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	const parseComparator = (comp, options) => {
	  comp = comp.replace(re[t.BUILD], '');
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	};

	const isX = id => !id || id.toLowerCase() === 'x' || id === '*';

	const invalidXRangeOrder = (M, m, p) => (
	  (isX(M) && !isX(m)) ||
	  (isX(m) && p && !isX(p))
	);

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
	// ~0.0.1 --> >=0.0.1 <0.1.0-0
	const replaceTildes = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceTilde(c, options))
	    .join(' ')
	};

	const replaceTilde = (comp, options) => {
	  const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
	  // if we're including prereleases in the match, then the lower bound is
	  // -0, the lowest possible prerelease value, just like x-ranges and carets.
	  // this keeps `~1.2` equivalent to the `1.2.x` x-range it's documented as.
	  const z = options.includePrerelease ? '-0' : '';
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('tilde', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0-0
	      ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = `>=${M}.${m}.${p}-${pr
	      } <${M}.${+m + 1}.0-0`;
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0-0
	      ret = `>=${M}.${m}.${p
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	};

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
	// ^1.2.3 --> >=1.2.3 <2.0.0-0
	// ^1.2.0 --> >=1.2.0 <2.0.0-0
	// ^0.0.1 --> >=0.0.1 <0.0.2-0
	// ^0.1.0 --> >=0.1.0 <0.2.0-0
	const replaceCarets = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceCaret(c, options))
	    .join(' ')
	};

	const replaceCaret = (comp, options) => {
	  debug('caret', comp, options);
	  const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
	  const z = options.includePrerelease ? '-0' : '';
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('caret', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
	      } else {
	        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p}-${pr
	        } <${+M + 1}.0.0-0`;
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p
	          } <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p
	          } <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p
	        } <${+M + 1}.0.0-0`;
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	};

	const replaceXRanges = (comp, options) => {
	  debug('replaceXRanges', comp, options);
	  return comp
	    .split(/\s+/)
	    .map((c) => replaceXRange(c, options))
	    .join(' ')
	};

	const replaceXRange = (comp, options) => {
	  comp = comp.trim();
	  const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
	  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    if (invalidXRangeOrder(M, m, p)) {
	      return comp
	    }

	    const xM = isX(M);
	    const xm = xM || isX(m);
	    const xp = xm || isX(p);
	    const anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    // if we're including prereleases in the match, then we need
	    // to fix this to -0, the lowest possible prerelease value
	    pr = options.includePrerelease ? '-0' : '';

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0-0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      if (gtlt === '<') {
	        pr = '-0';
	      }

	      ret = `${gtlt + M}.${m}.${p}${pr}`;
	    } else if (xm) {
	      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
	    } else if (xp) {
	      ret = `>=${M}.${m}.0${pr
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	};

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	const replaceStars = (comp, options) => {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp
	    .trim()
	    .replace(re[t.STAR], '')
	};

	const replaceGTE0 = (comp, options) => {
	  debug('replaceGTE0', comp, options);
	  return comp
	    .trim()
	    .replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '')
	};

	// This function is passed to string.replace(re[t.HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
	// TODO build?
	const hyphenReplace = incPr => ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr) => {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
	  } else if (isX(fp)) {
	    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
	  } else if (fpr) {
	    from = `>=${from}`;
	  } else {
	    from = `>=${from}${incPr ? '-0' : ''}`;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = `<${+tM + 1}.0.0-0`;
	  } else if (isX(tp)) {
	    to = `<${tM}.${+tm + 1}.0-0`;
	  } else if (tpr) {
	    to = `<=${tM}.${tm}.${tp}-${tpr}`;
	  } else if (incPr) {
	    to = `<${tM}.${tm}.${+tp + 1}-0`;
	  } else {
	    to = `<=${to}`;
	  }

	  return `${from} ${to}`.trim()
	};

	const testSet = (set, version, options) => {
	  for (let i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (let i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === Comparator.ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        const allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	};
	return range;
}

var satisfies_1;
var hasRequiredSatisfies;

function requireSatisfies () {
	if (hasRequiredSatisfies) return satisfies_1;
	hasRequiredSatisfies = 1;

	const Range = requireRange();
	const satisfies = (version, range, options) => {
	  try {
	    range = new Range(range, options);
	  } catch (er) {
	    return false
	  }
	  return range.test(version)
	};
	satisfies_1 = satisfies;
	return satisfies_1;
}

const version = "0.34.5";
const optionalDependencies = {"@img/sharp-darwin-arm64":"0.34.5","@img/sharp-darwin-x64":"0.34.5","@img/sharp-libvips-darwin-arm64":"1.2.4","@img/sharp-libvips-darwin-x64":"1.2.4","@img/sharp-libvips-linux-arm":"1.2.4","@img/sharp-libvips-linux-arm64":"1.2.4","@img/sharp-libvips-linux-ppc64":"1.2.4","@img/sharp-libvips-linux-riscv64":"1.2.4","@img/sharp-libvips-linux-s390x":"1.2.4","@img/sharp-libvips-linux-x64":"1.2.4","@img/sharp-libvips-linuxmusl-arm64":"1.2.4","@img/sharp-libvips-linuxmusl-x64":"1.2.4","@img/sharp-linux-arm":"0.34.5","@img/sharp-linux-arm64":"0.34.5","@img/sharp-linux-ppc64":"0.34.5","@img/sharp-linux-riscv64":"0.34.5","@img/sharp-linux-s390x":"0.34.5","@img/sharp-linux-x64":"0.34.5","@img/sharp-linuxmusl-arm64":"0.34.5","@img/sharp-linuxmusl-x64":"0.34.5","@img/sharp-wasm32":"0.34.5","@img/sharp-win32-arm64":"0.34.5","@img/sharp-win32-ia32":"0.34.5","@img/sharp-win32-x64":"0.34.5"};
const engines = {"node":"^18.17.0 || ^20.3.0 || >=21.0.0"};
const config = {"libvips":">=8.17.3"};
const require$$6 = {
  version,
  optionalDependencies,
  engines,
  config};

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var libvips;
var hasRequiredLibvips;

function requireLibvips () {
	if (hasRequiredLibvips) return libvips;
	hasRequiredLibvips = 1;
	const { spawnSync } = require$$0$2;
	const { createHash } = require$$1;
	const semverCoerce = requireCoerce();
	const semverGreaterThanOrEqualTo = requireGte();
	const semverSatisfies = requireSatisfies();
	const detectLibc = requireDetectLibc();
	const { config, engines, optionalDependencies } = require$$6;
	const minimumLibvipsVersionLabelled = process.env.npm_package_config_libvips || config.libvips;
	const minimumLibvipsVersion = semverCoerce(minimumLibvipsVersionLabelled).version;
	const prebuiltPlatforms = [
	  "darwin-arm64",
	  "darwin-x64",
	  "linux-arm",
	  "linux-arm64",
	  "linux-ppc64",
	  "linux-riscv64",
	  "linux-s390x",
	  "linux-x64",
	  "linuxmusl-arm64",
	  "linuxmusl-x64",
	  "win32-arm64",
	  "win32-ia32",
	  "win32-x64"
	];
	const spawnSyncOptions = {
	  encoding: "utf8",
	  shell: true
	};
	const log = (item) => {
	  if (item instanceof Error) {
	    console.error(`sharp: Installation error: ${item.message}`);
	  } else {
	    console.log(`sharp: ${item}`);
	  }
	};
	const runtimeLibc = () => detectLibc.isNonGlibcLinuxSync() ? detectLibc.familySync() : "";
	const runtimePlatformArch = () => `${process.platform}${runtimeLibc()}-${process.arch}`;
	const buildPlatformArch = () => {
	  if (isEmscripten()) {
	    return "wasm32";
	  }
	  const { npm_config_arch, npm_config_platform, npm_config_libc } = process.env;
	  const libc = typeof npm_config_libc === "string" ? npm_config_libc : runtimeLibc();
	  return `${npm_config_platform || process.platform}${libc}-${npm_config_arch || process.arch}`;
	};
	const buildSharpLibvipsIncludeDir = () => {
	  try {
	    return commonjsRequire(`@img/sharp-libvips-dev-${buildPlatformArch()}/include`);
	  } catch {
	    try {
	      return require("@img/sharp-libvips-dev/include");
	    } catch {
	    }
	  }
	  return "";
	};
	const buildSharpLibvipsCPlusPlusDir = () => {
	  try {
	    return require("@img/sharp-libvips-dev/cplusplus");
	  } catch {
	  }
	  return "";
	};
	const buildSharpLibvipsLibDir = () => {
	  try {
	    return commonjsRequire(`@img/sharp-libvips-dev-${buildPlatformArch()}/lib`);
	  } catch {
	    try {
	      return commonjsRequire(`@img/sharp-libvips-${buildPlatformArch()}/lib`);
	    } catch {
	    }
	  }
	  return "";
	};
	const isUnsupportedNodeRuntime = () => {
	  if (process.release?.name === "node" && process.versions) {
	    if (!semverSatisfies(process.versions.node, engines.node)) {
	      return { found: process.versions.node, expected: engines.node };
	    }
	  }
	};
	const isEmscripten = () => {
	  const { CC } = process.env;
	  return Boolean(CC?.endsWith("/emcc"));
	};
	const isRosetta = () => {
	  if (process.platform === "darwin" && process.arch === "x64") {
	    const translated = spawnSync("sysctl sysctl.proc_translated", spawnSyncOptions).stdout;
	    return (translated || "").trim() === "sysctl.proc_translated: 1";
	  }
	  return false;
	};
	const sha512 = (s) => createHash("sha512").update(s).digest("hex");
	const yarnLocator = () => {
	  try {
	    const identHash = sha512(`imgsharp-libvips-${buildPlatformArch()}`);
	    const npmVersion = semverCoerce(optionalDependencies[`@img/sharp-libvips-${buildPlatformArch()}`], {
	      includePrerelease: true
	    }).version;
	    return sha512(`${identHash}npm:${npmVersion}`).slice(0, 10);
	  } catch {
	  }
	  return "";
	};
	const spawnRebuild = () => spawnSync(`node-gyp rebuild --directory=src ${isEmscripten() ? "--nodedir=emscripten" : ""}`, {
	  ...spawnSyncOptions,
	  stdio: "inherit"
	}).status;
	const globalLibvipsVersion = () => {
	  if (process.platform !== "win32") {
	    const globalLibvipsVersion2 = spawnSync("pkg-config --modversion vips-cpp", {
	      ...spawnSyncOptions,
	      env: {
	        ...process.env,
	        PKG_CONFIG_PATH: pkgConfigPath()
	      }
	    }).stdout;
	    return (globalLibvipsVersion2 || "").trim();
	  } else {
	    return "";
	  }
	};
	const pkgConfigPath = () => {
	  if (process.platform !== "win32") {
	    const brewPkgConfigPath = spawnSync(
	      'which brew >/dev/null 2>&1 && brew environment --plain | grep PKG_CONFIG_LIBDIR | cut -d" " -f2',
	      spawnSyncOptions
	    ).stdout || "";
	    return [
	      brewPkgConfigPath.trim(),
	      process.env.PKG_CONFIG_PATH,
	      "/usr/local/lib/pkgconfig",
	      "/usr/lib/pkgconfig",
	      "/usr/local/libdata/pkgconfig",
	      "/usr/libdata/pkgconfig"
	    ].filter(Boolean).join(":");
	  } else {
	    return "";
	  }
	};
	const skipSearch = (status, reason, logger) => {
	  if (logger) {
	    logger(`Detected ${reason}, skipping search for globally-installed libvips`);
	  }
	  return status;
	};
	const useGlobalLibvips = (logger) => {
	  if (Boolean(process.env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
	    return skipSearch(false, "SHARP_IGNORE_GLOBAL_LIBVIPS", logger);
	  }
	  if (Boolean(process.env.SHARP_FORCE_GLOBAL_LIBVIPS) === true) {
	    return skipSearch(true, "SHARP_FORCE_GLOBAL_LIBVIPS", logger);
	  }
	  if (isRosetta()) {
	    return skipSearch(false, "Rosetta", logger);
	  }
	  const globalVipsVersion = globalLibvipsVersion();
	  return !!globalVipsVersion && semverGreaterThanOrEqualTo(globalVipsVersion, minimumLibvipsVersion);
	};
	libvips = {
	  minimumLibvipsVersion,
	  prebuiltPlatforms,
	  buildPlatformArch,
	  buildSharpLibvipsIncludeDir,
	  buildSharpLibvipsCPlusPlusDir,
	  buildSharpLibvipsLibDir,
	  isUnsupportedNodeRuntime,
	  runtimePlatformArch,
	  log,
	  yarnLocator,
	  spawnRebuild,
	  globalLibvipsVersion,
	  pkgConfigPath,
	  useGlobalLibvips
	};
	return libvips;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var hasRequiredSharp;

function requireSharp () {
	if (hasRequiredSharp) return sharp.exports;
	hasRequiredSharp = 1;
	// Inspects the runtime environment and exports the relevant sharp.node binary

	const { familySync, versionSync } = requireDetectLibc();

	const { runtimePlatformArch, isUnsupportedNodeRuntime, prebuiltPlatforms, minimumLibvipsVersion } = requireLibvips();
	const runtimePlatform = runtimePlatformArch();

	const paths = [
	  `../src/build/Release/sharp-${runtimePlatform}.node`,
	  '../src/build/Release/sharp-wasm32.node',
	  `@img/sharp-${runtimePlatform}/sharp.node`,
	  '@img/sharp-wasm32/sharp.node'
	];

	/* node:coverage disable */

	let path, sharp$1;
	const errors = [];
	for (path of paths) {
	  try {
	    sharp$1 = commonjsRequire(path);
	    break;
	  } catch (err) {
	    errors.push(err);
	  }
	}

	if (sharp$1 && path.startsWith('@img/sharp-linux-x64') && !sharp$1._isUsingX64V2()) {
	  const err = new Error('Prebuilt binaries for linux-x64 require v2 microarchitecture');
	  err.code = 'Unsupported CPU';
	  errors.push(err);
	  sharp$1 = null;
	}

	if (sharp$1) {
	  sharp.exports = sharp$1;
	} else {
	  const [isLinux, isMacOs, isWindows] = ['linux', 'darwin', 'win32'].map(os => runtimePlatform.startsWith(os));

	  const help = [`Could not load the "sharp" module using the ${runtimePlatform} runtime`];
	  errors.forEach(err => {
	    if (err.code !== 'MODULE_NOT_FOUND') {
	      help.push(`${err.code}: ${err.message}`);
	    }
	  });
	  const messages = errors.map(err => err.message).join(' ');
	  help.push('Possible solutions:');
	  // Common error messages
	  if (isUnsupportedNodeRuntime()) {
	    const { found, expected } = isUnsupportedNodeRuntime();
	    help.push(
	      '- Please upgrade Node.js:',
	      `    Found ${found}`,
	      `    Requires ${expected}`
	    );
	  } else if (prebuiltPlatforms.includes(runtimePlatform)) {
	    const [os, cpu] = runtimePlatform.split('-');
	    const libc = os.endsWith('musl') ? ' --libc=musl' : '';
	    help.push(
	      '- Ensure optional dependencies can be installed:',
	      '    npm install --include=optional sharp',
	      '- Ensure your package manager supports multi-platform installation:',
	      '    See https://sharp.pixelplumbing.com/install#cross-platform',
	      '- Add platform-specific dependencies:',
	      `    npm install --os=${os.replace('musl', '')}${libc} --cpu=${cpu} sharp`
	    );
	  } else {
	    help.push(
	      `- Manually install libvips >= ${minimumLibvipsVersion}`,
	      '- Add experimental WebAssembly-based dependencies:',
	      '    npm install --cpu=wasm32 sharp',
	      '    npm install @img/sharp-wasm32'
	    );
	  }
	  if (isLinux && /(symbol not found|CXXABI_)/i.test(messages)) {
	    try {
	      const { config } = commonjsRequire(`@img/sharp-libvips-${runtimePlatform}/package`);
	      const libcFound = `${familySync()} ${versionSync()}`;
	      const libcRequires = `${config.musl ? 'musl' : 'glibc'} ${config.musl || config.glibc}`;
	      help.push(
	        '- Update your OS:',
	        `    Found ${libcFound}`,
	        `    Requires ${libcRequires}`
	      );
	    } catch (_errEngines) {}
	  }
	  if (isLinux && /\/snap\/core[0-9]{2}/.test(messages)) {
	    help.push(
	      '- Remove the Node.js Snap, which does not support native modules',
	      '    snap remove node'
	    );
	  }
	  if (isMacOs && /Incompatible library version/.test(messages)) {
	    help.push(
	      '- Update Homebrew:',
	      '    brew update && brew upgrade vips'
	    );
	  }
	  if (errors.some(err => err.code === 'ERR_DLOPEN_DISABLED')) {
	    help.push('- Run Node.js without using the --no-addons flag');
	  }
	  // Link to installation docs
	  if (isWindows && /The specified procedure could not be found/.test(messages)) {
	    help.push(
	      '- Using the canvas package on Windows?',
	      '    See https://sharp.pixelplumbing.com/install#canvas-and-windows',
	      '- Check for outdated versions of sharp in the dependency tree:',
	      '    npm ls sharp'
	    );
	  }
	  help.push(
	    '- Consult the installation documentation:',
	    '    See https://sharp.pixelplumbing.com/install'
	  );
	  throw new Error(help.join('\n'));
	}
	return sharp.exports;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var constructor;
var hasRequiredConstructor;

function requireConstructor () {
	if (hasRequiredConstructor) return constructor;
	hasRequiredConstructor = 1;
	const util = require$$0$3;
	const stream = require$$1$1;
	const is = requireIs();

	requireSharp();

	// Use NODE_DEBUG=sharp to enable libvips warnings
	const debuglog = util.debuglog('sharp');

	const queueListener = (queueLength) => {
	  Sharp.queue.emit('change', queueLength);
	};

	/**
	 * Constructor factory to create an instance of `sharp`, to which further methods are chained.
	 *
	 * JPEG, PNG, WebP, GIF, AVIF or TIFF format image data can be streamed out from this object.
	 * When using Stream based output, derived attributes are available from the `info` event.
	 *
	 * Non-critical problems encountered during processing are emitted as `warning` events.
	 *
	 * Implements the [stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex) class.
	 *
	 * When loading more than one page/frame of an animated image,
	 * these are combined as a vertically-stacked "toilet roll" image
	 * where the overall height is the `pageHeight` multiplied by the number of `pages`.
	 *
	 * @constructs Sharp
	 *
	 * @emits Sharp#info
	 * @emits Sharp#warning
	 *
	 * @example
	 * sharp('input.jpg')
	 *   .resize(300, 200)
	 *   .toFile('output.jpg', function(err) {
	 *     // output.jpg is a 300 pixels wide and 200 pixels high image
	 *     // containing a scaled and cropped version of input.jpg
	 *   });
	 *
	 * @example
	 * // Read image data from remote URL,
	 * // resize to 300 pixels wide,
	 * // emit an 'info' event with calculated dimensions
	 * // and finally write image data to writableStream
	 * const { body } = fetch('https://...');
	 * const readableStream = Readable.fromWeb(body);
	 * const transformer = sharp()
	 *   .resize(300)
	 *   .on('info', ({ height }) => {
	 *     console.log(`Image height is ${height}`);
	 *   });
	 * readableStream.pipe(transformer).pipe(writableStream);
	 *
	 * @example
	 * // Create a blank 300x200 PNG image of semi-translucent red pixels
	 * sharp({
	 *   create: {
	 *     width: 300,
	 *     height: 200,
	 *     channels: 4,
	 *     background: { r: 255, g: 0, b: 0, alpha: 0.5 }
	 *   }
	 * })
	 * .png()
	 * .toBuffer()
	 * .then( ... );
	 *
	 * @example
	 * // Convert an animated GIF to an animated WebP
	 * await sharp('in.gif', { animated: true }).toFile('out.webp');
	 *
	 * @example
	 * // Read a raw array of pixels and save it to a png
	 * const input = Uint8Array.from([255, 255, 255, 0, 0, 0]); // or Uint8ClampedArray
	 * const image = sharp(input, {
	 *   // because the input does not contain its dimensions or how many channels it has
	 *   // we need to specify it in the constructor options
	 *   raw: {
	 *     width: 2,
	 *     height: 1,
	 *     channels: 3
	 *   }
	 * });
	 * await image.toFile('my-two-pixels.png');
	 *
	 * @example
	 * // Generate RGB Gaussian noise
	 * await sharp({
	 *   create: {
	 *     width: 300,
	 *     height: 200,
	 *     channels: 3,
	 *     noise: {
	 *       type: 'gaussian',
	 *       mean: 128,
	 *       sigma: 30
	 *     }
	 *  }
	 * }).toFile('noise.png');
	 *
	 * @example
	 * // Generate an image from text
	 * await sharp({
	 *   text: {
	 *     text: 'Hello, world!',
	 *     width: 400, // max width
	 *     height: 300 // max height
	 *   }
	 * }).toFile('text_bw.png');
	 *
	 * @example
	 * // Generate an rgba image from text using pango markup and font
	 * await sharp({
	 *   text: {
	 *     text: '<span foreground="red">Red!</span><span background="cyan">blue</span>',
	 *     font: 'sans',
	 *     rgba: true,
	 *     dpi: 300
	 *   }
	 * }).toFile('text_rgba.png');
	 *
	 * @example
	 * // Join four input images as a 2x2 grid with a 4 pixel gutter
	 * const data = await sharp(
	 *  [image1, image2, image3, image4],
	 *  { join: { across: 2, shim: 4 } }
	 * ).toBuffer();
	 *
	 * @example
	 * // Generate a two-frame animated image from emoji
	 * const images = ['😀', '😛'].map(text => ({
	 *   text: { text, width: 64, height: 64, channels: 4, rgba: true }
	 * }));
	 * await sharp(images, { join: { animated: true } }).toFile('out.gif');
	 *
	 * @param {(Buffer|ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|Uint16Array|Int16Array|Uint32Array|Int32Array|Float32Array|Float64Array|string|Array)} [input] - if present, can be
	 *  a Buffer / ArrayBuffer / Uint8Array / Uint8ClampedArray containing JPEG, PNG, WebP, AVIF, GIF, SVG or TIFF image data, or
	 *  a TypedArray containing raw pixel image data, or
	 *  a String containing the filesystem path to an JPEG, PNG, WebP, AVIF, GIF, SVG or TIFF image file.
	 *  An array of inputs can be provided, and these will be joined together.
	 *  JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF or raw pixel image data can be streamed into the object when not present.
	 * @param {Object} [options] - if present, is an Object with optional attributes.
	 * @param {string} [options.failOn='warning'] - When to abort processing of invalid pixel data, one of (in order of sensitivity, least to most): 'none', 'truncated', 'error', 'warning'. Higher levels imply lower levels. Invalid metadata will always abort.
	 * @param {number|boolean} [options.limitInputPixels=268402689] - Do not process input images where the number of pixels
	 *  (width x height) exceeds this limit. Assumes image dimensions contained in the input metadata can be trusted.
	 *  An integral Number of pixels, zero or false to remove limit, true to use default limit of 268402689 (0x3FFF x 0x3FFF).
	 * @param {boolean} [options.unlimited=false] - Set this to `true` to remove safety features that help prevent memory exhaustion (JPEG, PNG, SVG, HEIF).
	 * @param {boolean} [options.autoOrient=false] - Set this to `true` to rotate/flip the image to match EXIF `Orientation`, if any.
	 * @param {boolean} [options.sequentialRead=true] - Set this to `false` to use random access rather than sequential read. Some operations will do this automatically.
	 * @param {number} [options.density=72] - number representing the DPI for vector images in the range 1 to 100000.
	 * @param {number} [options.ignoreIcc=false] - should the embedded ICC profile, if any, be ignored.
	 * @param {number} [options.pages=1] - Number of pages to extract for multi-page input (GIF, WebP, TIFF), use -1 for all pages.
	 * @param {number} [options.page=0] - Page number to start extracting from for multi-page input (GIF, WebP, TIFF), zero based.
	 * @param {boolean} [options.animated=false] - Set to `true` to read all frames/pages of an animated image (GIF, WebP, TIFF), equivalent of setting `pages` to `-1`.
	 * @param {Object} [options.raw] - describes raw pixel input image data. See `raw()` for pixel ordering.
	 * @param {number} [options.raw.width] - integral number of pixels wide.
	 * @param {number} [options.raw.height] - integral number of pixels high.
	 * @param {number} [options.raw.channels] - integral number of channels, between 1 and 4.
	 * @param {boolean} [options.raw.premultiplied] - specifies that the raw input has already been premultiplied, set to `true`
	 *  to avoid sharp premultiplying the image. (optional, default `false`)
	 * @param {number} [options.raw.pageHeight] - The pixel height of each page/frame for animated images, must be an integral factor of `raw.height`.
	 * @param {Object} [options.create] - describes a new image to be created.
	 * @param {number} [options.create.width] - integral number of pixels wide.
	 * @param {number} [options.create.height] - integral number of pixels high.
	 * @param {number} [options.create.channels] - integral number of channels, either 3 (RGB) or 4 (RGBA).
	 * @param {string|Object} [options.create.background] - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
	 * @param {number} [options.create.pageHeight] - The pixel height of each page/frame for animated images, must be an integral factor of `create.height`.
	 * @param {Object} [options.create.noise] - describes a noise to be created.
	 * @param {string} [options.create.noise.type] - type of generated noise, currently only `gaussian` is supported.
	 * @param {number} [options.create.noise.mean=128] - Mean value of pixels in the generated noise.
	 * @param {number} [options.create.noise.sigma=30] - Standard deviation of pixel values in the generated noise.
	 * @param {Object} [options.text] - describes a new text image to be created.
	 * @param {string} [options.text.text] - text to render as a UTF-8 string. It can contain Pango markup, for example `<i>Le</i>Monde`.
	 * @param {string} [options.text.font] - font name to render with.
	 * @param {string} [options.text.fontfile] - absolute filesystem path to a font file that can be used by `font`.
	 * @param {number} [options.text.width=0] - Integral number of pixels to word-wrap at. Lines of text wider than this will be broken at word boundaries.
	 * @param {number} [options.text.height=0] - Maximum integral number of pixels high. When defined, `dpi` will be ignored and the text will automatically fit the pixel resolution defined by `width` and `height`. Will be ignored if `width` is not specified or set to 0.
	 * @param {string} [options.text.align='left'] - Alignment style for multi-line text (`'left'`, `'centre'`, `'center'`, `'right'`).
	 * @param {boolean} [options.text.justify=false] - set this to true to apply justification to the text.
	 * @param {number} [options.text.dpi=72] - the resolution (size) at which to render the text. Does not take effect if `height` is specified.
	 * @param {boolean} [options.text.rgba=false] - set this to true to enable RGBA output. This is useful for colour emoji rendering, or support for pango markup features like `<span foreground="red">Red!</span>`.
	 * @param {number} [options.text.spacing=0] - text line height in points. Will use the font line height if none is specified.
	 * @param {string} [options.text.wrap='word'] - word wrapping style when width is provided, one of: 'word', 'char', 'word-char' (prefer word, fallback to char) or 'none'.
	 * @param {Object} [options.join] - describes how an array of input images should be joined.
	 * @param {number} [options.join.across=1] - number of images to join horizontally.
	 * @param {boolean} [options.join.animated=false] - set this to `true` to join the images as an animated image.
	 * @param {number} [options.join.shim=0] - number of pixels to insert between joined images.
	 * @param {string|Object} [options.join.background] - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
	 * @param {string} [options.join.halign='left'] - horizontal alignment style for images joined horizontally (`'left'`, `'centre'`, `'center'`, `'right'`).
	 * @param {string} [options.join.valign='top'] - vertical alignment style for images joined vertically (`'top'`, `'centre'`, `'center'`, `'bottom'`).
	 * @param {Object} [options.tiff] - Describes TIFF specific options.
	 * @param {number} [options.tiff.subifd=-1] - Sub Image File Directory to extract for OME-TIFF, defaults to main image.
	 * @param {Object} [options.svg] - Describes SVG specific options.
	 * @param {string} [options.svg.stylesheet] - Custom CSS for SVG input, applied with a User Origin during the CSS cascade.
	 * @param {boolean} [options.svg.highBitdepth=false] - Set to `true` to render SVG input at 32-bits per channel (128-bit) instead of 8-bits per channel (32-bit) RGBA.
	 * @param {Object} [options.pdf] - Describes PDF specific options. Requires the use of a globally-installed libvips compiled with support for PDFium, Poppler, ImageMagick or GraphicsMagick.
	 * @param {string|Object} [options.pdf.background] - Background colour to use when PDF is partially transparent. Parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
	 * @param {Object} [options.openSlide] - Describes OpenSlide specific options. Requires the use of a globally-installed libvips compiled with support for OpenSlide.
	 * @param {number} [options.openSlide.level=0] - Level to extract from a multi-level input, zero based.
	 * @param {Object} [options.jp2] - Describes JPEG 2000 specific options. Requires the use of a globally-installed libvips compiled with support for OpenJPEG.
	 * @param {boolean} [options.jp2.oneshot=false] - Set to `true` to decode tiled JPEG 2000 images in a single operation, improving compatibility.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	const Sharp = function (input, options) {
	  // biome-ignore lint/complexity/noArguments: constructor factory
	  if (arguments.length === 1 && !is.defined(input)) {
	    throw new Error('Invalid input');
	  }
	  if (!(this instanceof Sharp)) {
	    return new Sharp(input, options);
	  }
	  stream.Duplex.call(this);
	  this.options = {
	    // resize options
	    topOffsetPre: -1,
	    leftOffsetPre: -1,
	    widthPre: -1,
	    heightPre: -1,
	    topOffsetPost: -1,
	    leftOffsetPost: -1,
	    widthPost: -1,
	    heightPost: -1,
	    width: -1,
	    height: -1,
	    canvas: 'crop',
	    position: 0,
	    resizeBackground: [0, 0, 0, 255],
	    angle: 0,
	    rotationAngle: 0,
	    rotationBackground: [0, 0, 0, 255],
	    rotateBefore: false,
	    orientBefore: false,
	    flip: false,
	    flop: false,
	    extendTop: 0,
	    extendBottom: 0,
	    extendLeft: 0,
	    extendRight: 0,
	    extendBackground: [0, 0, 0, 255],
	    extendWith: 'background',
	    withoutEnlargement: false,
	    withoutReduction: false,
	    affineMatrix: [],
	    affineBackground: [0, 0, 0, 255],
	    affineIdx: 0,
	    affineIdy: 0,
	    affineOdx: 0,
	    affineOdy: 0,
	    affineInterpolator: this.constructor.interpolators.bilinear,
	    kernel: 'lanczos3',
	    fastShrinkOnLoad: true,
	    // operations
	    tint: [-1, 0, 0, 0],
	    flatten: false,
	    flattenBackground: [0, 0, 0],
	    unflatten: false,
	    negate: false,
	    negateAlpha: true,
	    medianSize: 0,
	    blurSigma: 0,
	    precision: 'integer',
	    minAmpl: 0.2,
	    sharpenSigma: 0,
	    sharpenM1: 1,
	    sharpenM2: 2,
	    sharpenX1: 2,
	    sharpenY2: 10,
	    sharpenY3: 20,
	    threshold: 0,
	    thresholdGrayscale: true,
	    trimBackground: [],
	    trimThreshold: -1,
	    trimLineArt: false,
	    dilateWidth: 0,
	    erodeWidth: 0,
	    gamma: 0,
	    gammaOut: 0,
	    greyscale: false,
	    normalise: false,
	    normaliseLower: 1,
	    normaliseUpper: 99,
	    claheWidth: 0,
	    claheHeight: 0,
	    claheMaxSlope: 3,
	    brightness: 1,
	    saturation: 1,
	    hue: 0,
	    lightness: 0,
	    booleanBufferIn: null,
	    booleanFileIn: '',
	    joinChannelIn: [],
	    extractChannel: -1,
	    removeAlpha: false,
	    ensureAlpha: -1,
	    colourspace: 'srgb',
	    colourspacePipeline: 'last',
	    composite: [],
	    // output
	    fileOut: '',
	    formatOut: 'input',
	    streamOut: false,
	    keepMetadata: 0,
	    withMetadataOrientation: -1,
	    withMetadataDensity: 0,
	    withIccProfile: '',
	    withExif: {},
	    withExifMerge: true,
	    withXmp: '',
	    resolveWithObject: false,
	    loop: -1,
	    delay: [],
	    // output format
	    jpegQuality: 80,
	    jpegProgressive: false,
	    jpegChromaSubsampling: '4:2:0',
	    jpegTrellisQuantisation: false,
	    jpegOvershootDeringing: false,
	    jpegOptimiseScans: false,
	    jpegOptimiseCoding: true,
	    jpegQuantisationTable: 0,
	    pngProgressive: false,
	    pngCompressionLevel: 6,
	    pngAdaptiveFiltering: false,
	    pngPalette: false,
	    pngQuality: 100,
	    pngEffort: 7,
	    pngBitdepth: 8,
	    pngDither: 1,
	    jp2Quality: 80,
	    jp2TileHeight: 512,
	    jp2TileWidth: 512,
	    jp2Lossless: false,
	    jp2ChromaSubsampling: '4:4:4',
	    webpQuality: 80,
	    webpAlphaQuality: 100,
	    webpLossless: false,
	    webpNearLossless: false,
	    webpSmartSubsample: false,
	    webpSmartDeblock: false,
	    webpPreset: 'default',
	    webpEffort: 4,
	    webpMinSize: false,
	    webpMixed: false,
	    gifBitdepth: 8,
	    gifEffort: 7,
	    gifDither: 1,
	    gifInterFrameMaxError: 0,
	    gifInterPaletteMaxError: 3,
	    gifKeepDuplicateFrames: false,
	    gifReuse: true,
	    gifProgressive: false,
	    tiffQuality: 80,
	    tiffCompression: 'jpeg',
	    tiffBigtiff: false,
	    tiffPredictor: 'horizontal',
	    tiffPyramid: false,
	    tiffMiniswhite: false,
	    tiffBitdepth: 8,
	    tiffTile: false,
	    tiffTileHeight: 256,
	    tiffTileWidth: 256,
	    tiffXres: 1.0,
	    tiffYres: 1.0,
	    tiffResolutionUnit: 'inch',
	    heifQuality: 50,
	    heifLossless: false,
	    heifCompression: 'av1',
	    heifEffort: 4,
	    heifChromaSubsampling: '4:4:4',
	    heifBitdepth: 8,
	    jxlDistance: 1,
	    jxlDecodingTier: 0,
	    jxlEffort: 7,
	    jxlLossless: false,
	    rawDepth: 'uchar',
	    tileSize: 256,
	    tileOverlap: 0,
	    tileContainer: 'fs',
	    tileLayout: 'dz',
	    tileFormat: 'last',
	    tileDepth: 'last',
	    tileAngle: 0,
	    tileSkipBlanks: -1,
	    tileBackground: [255, 255, 255, 255],
	    tileCentre: false,
	    tileId: 'https://example.com/iiif',
	    tileBasename: '',
	    timeoutSeconds: 0,
	    linearA: [],
	    linearB: [],
	    pdfBackground: [255, 255, 255, 255],
	    // Function to notify of libvips warnings
	    debuglog: warning => {
	      this.emit('warning', warning);
	      debuglog(warning);
	    },
	    // Function to notify of queue length changes
	    queueListener
	  };
	  this.options.input = this._createInputDescriptor(input, options, { allowStream: true });
	  return this;
	};
	Object.setPrototypeOf(Sharp.prototype, stream.Duplex.prototype);
	Object.setPrototypeOf(Sharp, stream.Duplex);

	/**
	 * Take a "snapshot" of the Sharp instance, returning a new instance.
	 * Cloned instances inherit the input of their parent instance.
	 * This allows multiple output Streams and therefore multiple processing pipelines to share a single input Stream.
	 *
	 * @example
	 * const pipeline = sharp().rotate();
	 * pipeline.clone().resize(800, 600).pipe(firstWritableStream);
	 * pipeline.clone().extract({ left: 20, top: 20, width: 100, height: 100 }).pipe(secondWritableStream);
	 * readableStream.pipe(pipeline);
	 * // firstWritableStream receives auto-rotated, resized readableStream
	 * // secondWritableStream receives auto-rotated, extracted region of readableStream
	 *
	 * @example
	 * // Create a pipeline that will download an image, resize it and format it to different files
	 * // Using Promises to know when the pipeline is complete
	 * const fs = require("fs");
	 * const got = require("got");
	 * const sharpStream = sharp({ failOn: 'none' });
	 *
	 * const promises = [];
	 *
	 * promises.push(
	 *   sharpStream
	 *     .clone()
	 *     .jpeg({ quality: 100 })
	 *     .toFile("originalFile.jpg")
	 * );
	 *
	 * promises.push(
	 *   sharpStream
	 *     .clone()
	 *     .resize({ width: 500 })
	 *     .jpeg({ quality: 80 })
	 *     .toFile("optimized-500.jpg")
	 * );
	 *
	 * promises.push(
	 *   sharpStream
	 *     .clone()
	 *     .resize({ width: 500 })
	 *     .webp({ quality: 80 })
	 *     .toFile("optimized-500.webp")
	 * );
	 *
	 * // https://github.com/sindresorhus/got/blob/main/documentation/3-streams.md
	 * got.stream("https://www.example.com/some-file.jpg").pipe(sharpStream);
	 *
	 * Promise.all(promises)
	 *   .then(res => { console.log("Done!", res); })
	 *   .catch(err => {
	 *     console.error("Error processing files, let's clean it up", err);
	 *     try {
	 *       fs.unlinkSync("originalFile.jpg");
	 *       fs.unlinkSync("optimized-500.jpg");
	 *       fs.unlinkSync("optimized-500.webp");
	 *     } catch (e) {}
	 *   });
	 *
	 * @returns {Sharp}
	 */
	function clone () {
	  // Clone existing options
	  const clone = this.constructor.call();
	  const { debuglog, queueListener, ...options } = this.options;
	  clone.options = structuredClone(options);
	  clone.options.debuglog = debuglog;
	  clone.options.queueListener = queueListener;
	  // Pass 'finish' event to clone for Stream-based input
	  if (this._isStreamInput()) {
	    this.on('finish', () => {
	      // Clone inherits input data
	      this._flattenBufferIn();
	      clone.options.input.buffer = this.options.input.buffer;
	      clone.emit('finish');
	    });
	  }
	  return clone;
	}
	Object.assign(Sharp.prototype, { clone });

	/**
	 * Export constructor.
	 * @module Sharp
	 * @private
	 */
	constructor = Sharp;
	return constructor;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var input;
var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	const is = requireIs();
	const sharp = requireSharp();

	/**
	 * Justification alignment
	 * @member
	 * @private
	 */
	const align = {
	  left: 'low',
	  top: 'low',
	  low: 'low',
	  center: 'centre',
	  centre: 'centre',
	  right: 'high',
	  bottom: 'high',
	  high: 'high'
	};

	const inputStreamParameters = [
	  // Limits and error handling
	  'failOn', 'limitInputPixels', 'unlimited',
	  // Format-generic
	  'animated', 'autoOrient', 'density', 'ignoreIcc', 'page', 'pages', 'sequentialRead',
	  // Format-specific
	  'jp2', 'openSlide', 'pdf', 'raw', 'svg', 'tiff',
	  // Deprecated
	  'failOnError', 'openSlideLevel', 'pdfBackground', 'tiffSubifd'
	];

	/**
	 * Extract input options, if any, from an object.
	 * @private
	 */
	function _inputOptionsFromObject (obj) {
	  const params = inputStreamParameters
	    .filter(p => is.defined(obj[p]))
	    .map(p => ([p, obj[p]]));
	  return params.length
	    ? Object.fromEntries(params)
	    : undefined;
	}

	/**
	 * Create Object containing input and input-related options.
	 * @private
	 */
	function _createInputDescriptor (input, inputOptions, containerOptions) {
	  const inputDescriptor = {
	    autoOrient: false,
	    failOn: 'warning',
	    limitInputPixels: 0x3FFF ** 2,
	    ignoreIcc: false,
	    unlimited: false,
	    sequentialRead: true
	  };
	  if (is.string(input)) {
	    // filesystem
	    inputDescriptor.file = input;
	  } else if (is.buffer(input)) {
	    // Buffer
	    if (input.length === 0) {
	      throw Error('Input Buffer is empty');
	    }
	    inputDescriptor.buffer = input;
	  } else if (is.arrayBuffer(input)) {
	    if (input.byteLength === 0) {
	      throw Error('Input bit Array is empty');
	    }
	    inputDescriptor.buffer = Buffer.from(input, 0, input.byteLength);
	  } else if (is.typedArray(input)) {
	    if (input.length === 0) {
	      throw Error('Input Bit Array is empty');
	    }
	    inputDescriptor.buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
	  } else if (is.plainObject(input) && !is.defined(inputOptions)) {
	    // Plain Object descriptor, e.g. create
	    inputOptions = input;
	    if (_inputOptionsFromObject(inputOptions)) {
	      // Stream with options
	      inputDescriptor.buffer = [];
	    }
	  } else if (!is.defined(input) && !is.defined(inputOptions) && is.object(containerOptions) && containerOptions.allowStream) {
	    // Stream without options
	    inputDescriptor.buffer = [];
	  } else if (Array.isArray(input)) {
	    if (input.length > 1) {
	      // Join images together
	      if (!this.options.joining) {
	        this.options.joining = true;
	        this.options.join = input.map(i => this._createInputDescriptor(i));
	      } else {
	        throw new Error('Recursive join is unsupported');
	      }
	    } else {
	      throw new Error('Expected at least two images to join');
	    }
	  } else {
	    throw new Error(`Unsupported input '${input}' of type ${typeof input}${
	      is.defined(inputOptions) ? ` when also providing options of type ${typeof inputOptions}` : ''
	    }`);
	  }
	  if (is.object(inputOptions)) {
	    // Deprecated: failOnError
	    if (is.defined(inputOptions.failOnError)) {
	      if (is.bool(inputOptions.failOnError)) {
	        inputDescriptor.failOn = inputOptions.failOnError ? 'warning' : 'none';
	      } else {
	        throw is.invalidParameterError('failOnError', 'boolean', inputOptions.failOnError);
	      }
	    }
	    // failOn
	    if (is.defined(inputOptions.failOn)) {
	      if (is.string(inputOptions.failOn) && is.inArray(inputOptions.failOn, ['none', 'truncated', 'error', 'warning'])) {
	        inputDescriptor.failOn = inputOptions.failOn;
	      } else {
	        throw is.invalidParameterError('failOn', 'one of: none, truncated, error, warning', inputOptions.failOn);
	      }
	    }
	    // autoOrient
	    if (is.defined(inputOptions.autoOrient)) {
	      if (is.bool(inputOptions.autoOrient)) {
	        inputDescriptor.autoOrient = inputOptions.autoOrient;
	      } else {
	        throw is.invalidParameterError('autoOrient', 'boolean', inputOptions.autoOrient);
	      }
	    }
	    // Density
	    if (is.defined(inputOptions.density)) {
	      if (is.inRange(inputOptions.density, 1, 100000)) {
	        inputDescriptor.density = inputOptions.density;
	      } else {
	        throw is.invalidParameterError('density', 'number between 1 and 100000', inputOptions.density);
	      }
	    }
	    // Ignore embeddded ICC profile
	    if (is.defined(inputOptions.ignoreIcc)) {
	      if (is.bool(inputOptions.ignoreIcc)) {
	        inputDescriptor.ignoreIcc = inputOptions.ignoreIcc;
	      } else {
	        throw is.invalidParameterError('ignoreIcc', 'boolean', inputOptions.ignoreIcc);
	      }
	    }
	    // limitInputPixels
	    if (is.defined(inputOptions.limitInputPixels)) {
	      if (is.bool(inputOptions.limitInputPixels)) {
	        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels
	          ? 0x3FFF ** 2
	          : 0;
	      } else if (is.integer(inputOptions.limitInputPixels) && is.inRange(inputOptions.limitInputPixels, 0, Number.MAX_SAFE_INTEGER)) {
	        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels;
	      } else {
	        throw is.invalidParameterError('limitInputPixels', 'positive integer', inputOptions.limitInputPixels);
	      }
	    }
	    // unlimited
	    if (is.defined(inputOptions.unlimited)) {
	      if (is.bool(inputOptions.unlimited)) {
	        inputDescriptor.unlimited = inputOptions.unlimited;
	      } else {
	        throw is.invalidParameterError('unlimited', 'boolean', inputOptions.unlimited);
	      }
	    }
	    // sequentialRead
	    if (is.defined(inputOptions.sequentialRead)) {
	      if (is.bool(inputOptions.sequentialRead)) {
	        inputDescriptor.sequentialRead = inputOptions.sequentialRead;
	      } else {
	        throw is.invalidParameterError('sequentialRead', 'boolean', inputOptions.sequentialRead);
	      }
	    }
	    // Raw pixel input
	    if (is.defined(inputOptions.raw)) {
	      if (
	        is.object(inputOptions.raw) &&
	        is.integer(inputOptions.raw.width) && inputOptions.raw.width > 0 &&
	        is.integer(inputOptions.raw.height) && inputOptions.raw.height > 0 &&
	        is.integer(inputOptions.raw.channels) && is.inRange(inputOptions.raw.channels, 1, 4)
	      ) {
	        inputDescriptor.rawWidth = inputOptions.raw.width;
	        inputDescriptor.rawHeight = inputOptions.raw.height;
	        inputDescriptor.rawChannels = inputOptions.raw.channels;
	        switch (input.constructor) {
	          case Uint8Array:
	          case Uint8ClampedArray:
	            inputDescriptor.rawDepth = 'uchar';
	            break;
	          case Int8Array:
	            inputDescriptor.rawDepth = 'char';
	            break;
	          case Uint16Array:
	            inputDescriptor.rawDepth = 'ushort';
	            break;
	          case Int16Array:
	            inputDescriptor.rawDepth = 'short';
	            break;
	          case Uint32Array:
	            inputDescriptor.rawDepth = 'uint';
	            break;
	          case Int32Array:
	            inputDescriptor.rawDepth = 'int';
	            break;
	          case Float32Array:
	            inputDescriptor.rawDepth = 'float';
	            break;
	          case Float64Array:
	            inputDescriptor.rawDepth = 'double';
	            break;
	          default:
	            inputDescriptor.rawDepth = 'uchar';
	            break;
	        }
	      } else {
	        throw new Error('Expected width, height and channels for raw pixel input');
	      }
	      inputDescriptor.rawPremultiplied = false;
	      if (is.defined(inputOptions.raw.premultiplied)) {
	        if (is.bool(inputOptions.raw.premultiplied)) {
	          inputDescriptor.rawPremultiplied = inputOptions.raw.premultiplied;
	        } else {
	          throw is.invalidParameterError('raw.premultiplied', 'boolean', inputOptions.raw.premultiplied);
	        }
	      }
	      inputDescriptor.rawPageHeight = 0;
	      if (is.defined(inputOptions.raw.pageHeight)) {
	        if (is.integer(inputOptions.raw.pageHeight) && inputOptions.raw.pageHeight > 0 && inputOptions.raw.pageHeight <= inputOptions.raw.height) {
	          if (inputOptions.raw.height % inputOptions.raw.pageHeight !== 0) {
	            throw new Error(`Expected raw.height ${inputOptions.raw.height} to be a multiple of raw.pageHeight ${inputOptions.raw.pageHeight}`);
	          }
	          inputDescriptor.rawPageHeight = inputOptions.raw.pageHeight;
	        } else {
	          throw is.invalidParameterError('raw.pageHeight', 'positive integer', inputOptions.raw.pageHeight);
	        }
	      }
	    }
	    // Multi-page input (GIF, TIFF, PDF)
	    if (is.defined(inputOptions.animated)) {
	      if (is.bool(inputOptions.animated)) {
	        inputDescriptor.pages = inputOptions.animated ? -1 : 1;
	      } else {
	        throw is.invalidParameterError('animated', 'boolean', inputOptions.animated);
	      }
	    }
	    if (is.defined(inputOptions.pages)) {
	      if (is.integer(inputOptions.pages) && is.inRange(inputOptions.pages, -1, 100000)) {
	        inputDescriptor.pages = inputOptions.pages;
	      } else {
	        throw is.invalidParameterError('pages', 'integer between -1 and 100000', inputOptions.pages);
	      }
	    }
	    if (is.defined(inputOptions.page)) {
	      if (is.integer(inputOptions.page) && is.inRange(inputOptions.page, 0, 100000)) {
	        inputDescriptor.page = inputOptions.page;
	      } else {
	        throw is.invalidParameterError('page', 'integer between 0 and 100000', inputOptions.page);
	      }
	    }
	    // OpenSlide specific options
	    if (is.object(inputOptions.openSlide) && is.defined(inputOptions.openSlide.level)) {
	      if (is.integer(inputOptions.openSlide.level) && is.inRange(inputOptions.openSlide.level, 0, 256)) {
	        inputDescriptor.openSlideLevel = inputOptions.openSlide.level;
	      } else {
	        throw is.invalidParameterError('openSlide.level', 'integer between 0 and 256', inputOptions.openSlide.level);
	      }
	    } else if (is.defined(inputOptions.level)) {
	      // Deprecated
	      if (is.integer(inputOptions.level) && is.inRange(inputOptions.level, 0, 256)) {
	        inputDescriptor.openSlideLevel = inputOptions.level;
	      } else {
	        throw is.invalidParameterError('level', 'integer between 0 and 256', inputOptions.level);
	      }
	    }
	    // TIFF specific options
	    if (is.object(inputOptions.tiff) && is.defined(inputOptions.tiff.subifd)) {
	      if (is.integer(inputOptions.tiff.subifd) && is.inRange(inputOptions.tiff.subifd, -1, 100000)) {
	        inputDescriptor.tiffSubifd = inputOptions.tiff.subifd;
	      } else {
	        throw is.invalidParameterError('tiff.subifd', 'integer between -1 and 100000', inputOptions.tiff.subifd);
	      }
	    } else if (is.defined(inputOptions.subifd)) {
	      // Deprecated
	      if (is.integer(inputOptions.subifd) && is.inRange(inputOptions.subifd, -1, 100000)) {
	        inputDescriptor.tiffSubifd = inputOptions.subifd;
	      } else {
	        throw is.invalidParameterError('subifd', 'integer between -1 and 100000', inputOptions.subifd);
	      }
	    }
	    // SVG specific options
	    if (is.object(inputOptions.svg)) {
	      if (is.defined(inputOptions.svg.stylesheet)) {
	        if (is.string(inputOptions.svg.stylesheet)) {
	          inputDescriptor.svgStylesheet = inputOptions.svg.stylesheet;
	        } else {
	          throw is.invalidParameterError('svg.stylesheet', 'string', inputOptions.svg.stylesheet);
	        }
	      }
	      if (is.defined(inputOptions.svg.highBitdepth)) {
	        if (is.bool(inputOptions.svg.highBitdepth)) {
	          inputDescriptor.svgHighBitdepth = inputOptions.svg.highBitdepth;
	        } else {
	          throw is.invalidParameterError('svg.highBitdepth', 'boolean', inputOptions.svg.highBitdepth);
	        }
	      }
	    }
	    // PDF specific options
	    if (is.object(inputOptions.pdf) && is.defined(inputOptions.pdf.background)) {
	      inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdf.background);
	    } else if (is.defined(inputOptions.pdfBackground)) {
	      // Deprecated
	      inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdfBackground);
	    }
	    // JPEG 2000 specific options
	    if (is.object(inputOptions.jp2) && is.defined(inputOptions.jp2.oneshot)) {
	      if (is.bool(inputOptions.jp2.oneshot)) {
	        inputDescriptor.jp2Oneshot = inputOptions.jp2.oneshot;
	      } else {
	        throw is.invalidParameterError('jp2.oneshot', 'boolean', inputOptions.jp2.oneshot);
	      }
	    }
	    // Create new image
	    if (is.defined(inputOptions.create)) {
	      if (
	        is.object(inputOptions.create) &&
	        is.integer(inputOptions.create.width) && inputOptions.create.width > 0 &&
	        is.integer(inputOptions.create.height) && inputOptions.create.height > 0 &&
	        is.integer(inputOptions.create.channels)
	      ) {
	        inputDescriptor.createWidth = inputOptions.create.width;
	        inputDescriptor.createHeight = inputOptions.create.height;
	        inputDescriptor.createChannels = inputOptions.create.channels;
	        inputDescriptor.createPageHeight = 0;
	        if (is.defined(inputOptions.create.pageHeight)) {
	          if (is.integer(inputOptions.create.pageHeight) && inputOptions.create.pageHeight > 0 && inputOptions.create.pageHeight <= inputOptions.create.height) {
	            if (inputOptions.create.height % inputOptions.create.pageHeight !== 0) {
	              throw new Error(`Expected create.height ${inputOptions.create.height} to be a multiple of create.pageHeight ${inputOptions.create.pageHeight}`);
	            }
	            inputDescriptor.createPageHeight = inputOptions.create.pageHeight;
	          } else {
	            throw is.invalidParameterError('create.pageHeight', 'positive integer', inputOptions.create.pageHeight);
	          }
	        }
	        // Noise
	        if (is.defined(inputOptions.create.noise)) {
	          if (!is.object(inputOptions.create.noise)) {
	            throw new Error('Expected noise to be an object');
	          }
	          if (inputOptions.create.noise.type !== 'gaussian') {
	            throw new Error('Only gaussian noise is supported at the moment');
	          }
	          inputDescriptor.createNoiseType = inputOptions.create.noise.type;
	          if (!is.inRange(inputOptions.create.channels, 1, 4)) {
	            throw is.invalidParameterError('create.channels', 'number between 1 and 4', inputOptions.create.channels);
	          }
	          inputDescriptor.createNoiseMean = 128;
	          if (is.defined(inputOptions.create.noise.mean)) {
	            if (is.number(inputOptions.create.noise.mean) && is.inRange(inputOptions.create.noise.mean, 0, 10000)) {
	              inputDescriptor.createNoiseMean = inputOptions.create.noise.mean;
	            } else {
	              throw is.invalidParameterError('create.noise.mean', 'number between 0 and 10000', inputOptions.create.noise.mean);
	            }
	          }
	          inputDescriptor.createNoiseSigma = 30;
	          if (is.defined(inputOptions.create.noise.sigma)) {
	            if (is.number(inputOptions.create.noise.sigma) && is.inRange(inputOptions.create.noise.sigma, 0, 10000)) {
	              inputDescriptor.createNoiseSigma = inputOptions.create.noise.sigma;
	            } else {
	              throw is.invalidParameterError('create.noise.sigma', 'number between 0 and 10000', inputOptions.create.noise.sigma);
	            }
	          }
	        } else if (is.defined(inputOptions.create.background)) {
	          if (!is.inRange(inputOptions.create.channels, 3, 4)) {
	            throw is.invalidParameterError('create.channels', 'number between 3 and 4', inputOptions.create.channels);
	          }
	          inputDescriptor.createBackground = this._getBackgroundColourOption(inputOptions.create.background);
	        } else {
	          throw new Error('Expected valid noise or background to create a new input image');
	        }
	        delete inputDescriptor.buffer;
	      } else {
	        throw new Error('Expected valid width, height and channels to create a new input image');
	      }
	    }
	    // Create a new image with text
	    if (is.defined(inputOptions.text)) {
	      if (is.object(inputOptions.text) && is.string(inputOptions.text.text)) {
	        inputDescriptor.textValue = inputOptions.text.text;
	        if (is.defined(inputOptions.text.height) && is.defined(inputOptions.text.dpi)) {
	          throw new Error('Expected only one of dpi or height');
	        }
	        if (is.defined(inputOptions.text.font)) {
	          if (is.string(inputOptions.text.font)) {
	            inputDescriptor.textFont = inputOptions.text.font;
	          } else {
	            throw is.invalidParameterError('text.font', 'string', inputOptions.text.font);
	          }
	        }
	        if (is.defined(inputOptions.text.fontfile)) {
	          if (is.string(inputOptions.text.fontfile)) {
	            inputDescriptor.textFontfile = inputOptions.text.fontfile;
	          } else {
	            throw is.invalidParameterError('text.fontfile', 'string', inputOptions.text.fontfile);
	          }
	        }
	        if (is.defined(inputOptions.text.width)) {
	          if (is.integer(inputOptions.text.width) && inputOptions.text.width > 0) {
	            inputDescriptor.textWidth = inputOptions.text.width;
	          } else {
	            throw is.invalidParameterError('text.width', 'positive integer', inputOptions.text.width);
	          }
	        }
	        if (is.defined(inputOptions.text.height)) {
	          if (is.integer(inputOptions.text.height) && inputOptions.text.height > 0) {
	            inputDescriptor.textHeight = inputOptions.text.height;
	          } else {
	            throw is.invalidParameterError('text.height', 'positive integer', inputOptions.text.height);
	          }
	        }
	        if (is.defined(inputOptions.text.align)) {
	          if (is.string(inputOptions.text.align) && is.string(this.constructor.align[inputOptions.text.align])) {
	            inputDescriptor.textAlign = this.constructor.align[inputOptions.text.align];
	          } else {
	            throw is.invalidParameterError('text.align', 'valid alignment', inputOptions.text.align);
	          }
	        }
	        if (is.defined(inputOptions.text.justify)) {
	          if (is.bool(inputOptions.text.justify)) {
	            inputDescriptor.textJustify = inputOptions.text.justify;
	          } else {
	            throw is.invalidParameterError('text.justify', 'boolean', inputOptions.text.justify);
	          }
	        }
	        if (is.defined(inputOptions.text.dpi)) {
	          if (is.integer(inputOptions.text.dpi) && is.inRange(inputOptions.text.dpi, 1, 1000000)) {
	            inputDescriptor.textDpi = inputOptions.text.dpi;
	          } else {
	            throw is.invalidParameterError('text.dpi', 'integer between 1 and 1000000', inputOptions.text.dpi);
	          }
	        }
	        if (is.defined(inputOptions.text.rgba)) {
	          if (is.bool(inputOptions.text.rgba)) {
	            inputDescriptor.textRgba = inputOptions.text.rgba;
	          } else {
	            throw is.invalidParameterError('text.rgba', 'bool', inputOptions.text.rgba);
	          }
	        }
	        if (is.defined(inputOptions.text.spacing)) {
	          if (is.integer(inputOptions.text.spacing) && is.inRange(inputOptions.text.spacing, -1e6, 1000000)) {
	            inputDescriptor.textSpacing = inputOptions.text.spacing;
	          } else {
	            throw is.invalidParameterError('text.spacing', 'integer between -1000000 and 1000000', inputOptions.text.spacing);
	          }
	        }
	        if (is.defined(inputOptions.text.wrap)) {
	          if (is.string(inputOptions.text.wrap) && is.inArray(inputOptions.text.wrap, ['word', 'char', 'word-char', 'none'])) {
	            inputDescriptor.textWrap = inputOptions.text.wrap;
	          } else {
	            throw is.invalidParameterError('text.wrap', 'one of: word, char, word-char, none', inputOptions.text.wrap);
	          }
	        }
	        delete inputDescriptor.buffer;
	      } else {
	        throw new Error('Expected a valid string to create an image with text.');
	      }
	    }
	    // Join images together
	    if (is.defined(inputOptions.join)) {
	      if (is.defined(this.options.join)) {
	        if (is.defined(inputOptions.join.animated)) {
	          if (is.bool(inputOptions.join.animated)) {
	            inputDescriptor.joinAnimated = inputOptions.join.animated;
	          } else {
	            throw is.invalidParameterError('join.animated', 'boolean', inputOptions.join.animated);
	          }
	        }
	        if (is.defined(inputOptions.join.across)) {
	          if (is.integer(inputOptions.join.across) && is.inRange(inputOptions.join.across, 1, 1000000)) {
	            inputDescriptor.joinAcross = inputOptions.join.across;
	          } else {
	            throw is.invalidParameterError('join.across', 'integer between 1 and 100000', inputOptions.join.across);
	          }
	        }
	        if (is.defined(inputOptions.join.shim)) {
	          if (is.integer(inputOptions.join.shim) && is.inRange(inputOptions.join.shim, 0, 1000000)) {
	            inputDescriptor.joinShim = inputOptions.join.shim;
	          } else {
	            throw is.invalidParameterError('join.shim', 'integer between 0 and 100000', inputOptions.join.shim);
	          }
	        }
	        if (is.defined(inputOptions.join.background)) {
	          inputDescriptor.joinBackground = this._getBackgroundColourOption(inputOptions.join.background);
	        }
	        if (is.defined(inputOptions.join.halign)) {
	          if (is.string(inputOptions.join.halign) && is.string(this.constructor.align[inputOptions.join.halign])) {
	            inputDescriptor.joinHalign = this.constructor.align[inputOptions.join.halign];
	          } else {
	            throw is.invalidParameterError('join.halign', 'valid alignment', inputOptions.join.halign);
	          }
	        }
	        if (is.defined(inputOptions.join.valign)) {
	          if (is.string(inputOptions.join.valign) && is.string(this.constructor.align[inputOptions.join.valign])) {
	            inputDescriptor.joinValign = this.constructor.align[inputOptions.join.valign];
	          } else {
	            throw is.invalidParameterError('join.valign', 'valid alignment', inputOptions.join.valign);
	          }
	        }
	      } else {
	        throw new Error('Expected input to be an array of images to join');
	      }
	    }
	  } else if (is.defined(inputOptions)) {
	    throw new Error(`Invalid input options ${inputOptions}`);
	  }
	  return inputDescriptor;
	}

	/**
	 * Handle incoming Buffer chunk on Writable Stream.
	 * @private
	 * @param {Buffer} chunk
	 * @param {string} encoding - unused
	 * @param {Function} callback
	 */
	function _write (chunk, _encoding, callback) {
	  if (Array.isArray(this.options.input.buffer)) {
	    if (is.buffer(chunk)) {
	      if (this.options.input.buffer.length === 0) {
	        this.on('finish', () => {
	          this.streamInFinished = true;
	        });
	      }
	      this.options.input.buffer.push(chunk);
	      callback();
	    } else {
	      callback(new Error('Non-Buffer data on Writable Stream'));
	    }
	  } else {
	    callback(new Error('Unexpected data on Writable Stream'));
	  }
	}

	/**
	 * Flattens the array of chunks accumulated in input.buffer.
	 * @private
	 */
	function _flattenBufferIn () {
	  if (this._isStreamInput()) {
	    this.options.input.buffer = Buffer.concat(this.options.input.buffer);
	  }
	}

	/**
	 * Are we expecting Stream-based input?
	 * @private
	 * @returns {boolean}
	 */
	function _isStreamInput () {
	  return Array.isArray(this.options.input.buffer);
	}

	/**
	 * Fast access to (uncached) image metadata without decoding any compressed pixel data.
	 *
	 * This is read from the header of the input image.
	 * It does not take into consideration any operations to be applied to the output image,
	 * such as resize or rotate.
	 *
	 * Dimensions in the response will respect the `page` and `pages` properties of the
	 * {@link /api-constructor/ constructor parameters}.
	 *
	 * A `Promise` is returned when `callback` is not provided.
	 *
	 * - `format`: Name of decoder used to decompress image data e.g. `jpeg`, `png`, `webp`, `gif`, `svg`
	 * - `size`: Total size of image in bytes, for Stream and Buffer input only
	 * - `width`: Number of pixels wide (EXIF orientation is not taken into consideration, see example below)
	 * - `height`: Number of pixels high (EXIF orientation is not taken into consideration, see example below)
	 * - `space`: Name of colour space interpretation e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://www.libvips.org/API/current/enum.Interpretation.html)
	 * - `channels`: Number of bands e.g. `3` for sRGB, `4` for CMYK
	 * - `depth`: Name of pixel depth format e.g. `uchar`, `char`, `ushort`, `float` [...](https://www.libvips.org/API/current/enum.BandFormat.html)
	 * - `density`: Number of pixels per inch (DPI), if present
	 * - `chromaSubsampling`: String containing JPEG chroma subsampling, `4:2:0` or `4:4:4` for RGB, `4:2:0:4` or `4:4:4:4` for CMYK
	 * - `isProgressive`: Boolean indicating whether the image is interlaced using a progressive scan
	 * - `isPalette`: Boolean indicating whether the image is palette-based (GIF, PNG).
	 * - `bitsPerSample`: Number of bits per sample for each channel (GIF, PNG, HEIF).
	 * - `pages`: Number of pages/frames contained within the image, with support for TIFF, HEIF, PDF, animated GIF and animated WebP
	 * - `pageHeight`: Number of pixels high each page in a multi-page image will be.
	 * - `loop`: Number of times to loop an animated image, zero refers to a continuous loop.
	 * - `delay`: Delay in ms between each page in an animated image, provided as an array of integers.
	 * - `pagePrimary`: Number of the primary page in a HEIF image
	 * - `levels`: Details of each level in a multi-level image provided as an array of objects, requires libvips compiled with support for OpenSlide
	 * - `subifds`: Number of Sub Image File Directories in an OME-TIFF image
	 * - `background`: Default background colour, if present, for PNG (bKGD) and GIF images
	 * - `compression`: The encoder used to compress an HEIF file, `av1` (AVIF) or `hevc` (HEIC)
	 * - `resolutionUnit`: The unit of resolution (density), either `inch` or `cm`, if present
	 * - `hasProfile`: Boolean indicating the presence of an embedded ICC profile
	 * - `hasAlpha`: Boolean indicating the presence of an alpha transparency channel
	 * - `orientation`: Number value of the EXIF Orientation header, if present
	 * - `exif`: Buffer containing raw EXIF data, if present
	 * - `icc`: Buffer containing raw [ICC](https://www.npmjs.com/package/icc) profile data, if present
	 * - `iptc`: Buffer containing raw IPTC data, if present
	 * - `xmp`: Buffer containing raw XMP data, if present
	 * - `xmpAsString`: String containing XMP data, if valid UTF-8.
	 * - `tifftagPhotoshop`: Buffer containing raw TIFFTAG_PHOTOSHOP data, if present
	 * - `formatMagick`: String containing format for images loaded via *magick
	 * - `comments`: Array of keyword/text pairs representing PNG text blocks, if present.
	 *
	 * @example
	 * const metadata = await sharp(input).metadata();
	 *
	 * @example
	 * const image = sharp(inputJpg);
	 * image
	 *   .metadata()
	 *   .then(function(metadata) {
	 *     return image
	 *       .resize(Math.round(metadata.width / 2))
	 *       .webp()
	 *       .toBuffer();
	 *   })
	 *   .then(function(data) {
	 *     // data contains a WebP image half the width and height of the original JPEG
	 *   });
	 *
	 * @example
	 * // Get dimensions taking EXIF Orientation into account.
	 * const { autoOrient } = await sharp(input).metadata();
	 * const { width, height } = autoOrient;
	 *
	 * @param {Function} [callback] - called with the arguments `(err, metadata)`
	 * @returns {Promise<Object>|Sharp}
	 */
	function metadata (callback) {
	  const stack = Error();
	  if (is.fn(callback)) {
	    if (this._isStreamInput()) {
	      this.on('finish', () => {
	        this._flattenBufferIn();
	        sharp.metadata(this.options, (err, metadata) => {
	          if (err) {
	            callback(is.nativeError(err, stack));
	          } else {
	            callback(null, metadata);
	          }
	        });
	      });
	    } else {
	      sharp.metadata(this.options, (err, metadata) => {
	        if (err) {
	          callback(is.nativeError(err, stack));
	        } else {
	          callback(null, metadata);
	        }
	      });
	    }
	    return this;
	  } else {
	    if (this._isStreamInput()) {
	      return new Promise((resolve, reject) => {
	        const finished = () => {
	          this._flattenBufferIn();
	          sharp.metadata(this.options, (err, metadata) => {
	            if (err) {
	              reject(is.nativeError(err, stack));
	            } else {
	              resolve(metadata);
	            }
	          });
	        };
	        if (this.writableFinished) {
	          finished();
	        } else {
	          this.once('finish', finished);
	        }
	      });
	    } else {
	      return new Promise((resolve, reject) => {
	        sharp.metadata(this.options, (err, metadata) => {
	          if (err) {
	            reject(is.nativeError(err, stack));
	          } else {
	            resolve(metadata);
	          }
	        });
	      });
	    }
	  }
	}

	/**
	 * Access to pixel-derived image statistics for every channel in the image.
	 * A `Promise` is returned when `callback` is not provided.
	 *
	 * - `channels`: Array of channel statistics for each channel in the image. Each channel statistic contains
	 *     - `min` (minimum value in the channel)
	 *     - `max` (maximum value in the channel)
	 *     - `sum` (sum of all values in a channel)
	 *     - `squaresSum` (sum of squared values in a channel)
	 *     - `mean` (mean of the values in a channel)
	 *     - `stdev` (standard deviation for the values in a channel)
	 *     - `minX` (x-coordinate of one of the pixel where the minimum lies)
	 *     - `minY` (y-coordinate of one of the pixel where the minimum lies)
	 *     - `maxX` (x-coordinate of one of the pixel where the maximum lies)
	 *     - `maxY` (y-coordinate of one of the pixel where the maximum lies)
	 * - `isOpaque`: Is the image fully opaque? Will be `true` if the image has no alpha channel or if every pixel is fully opaque.
	 * - `entropy`: Histogram-based estimation of greyscale entropy, discarding alpha channel if any.
	 * - `sharpness`: Estimation of greyscale sharpness based on the standard deviation of a Laplacian convolution, discarding alpha channel if any.
	 * - `dominant`: Object containing most dominant sRGB colour based on a 4096-bin 3D histogram.
	 *
	 * **Note**: Statistics are derived from the original input image. Any operations performed on the image must first be
	 * written to a buffer in order to run `stats` on the result (see third example).
	 *
	 * @example
	 * const image = sharp(inputJpg);
	 * image
	 *   .stats()
	 *   .then(function(stats) {
	 *      // stats contains the channel-wise statistics array and the isOpaque value
	 *   });
	 *
	 * @example
	 * const { entropy, sharpness, dominant } = await sharp(input).stats();
	 * const { r, g, b } = dominant;
	 *
	 * @example
	 * const image = sharp(input);
	 * // store intermediate result
	 * const part = await image.extract(region).toBuffer();
	 * // create new instance to obtain statistics of extracted region
	 * const stats = await sharp(part).stats();
	 *
	 * @param {Function} [callback] - called with the arguments `(err, stats)`
	 * @returns {Promise<Object>}
	 */
	function stats (callback) {
	  const stack = Error();
	  if (is.fn(callback)) {
	    if (this._isStreamInput()) {
	      this.on('finish', () => {
	        this._flattenBufferIn();
	        sharp.stats(this.options, (err, stats) => {
	          if (err) {
	            callback(is.nativeError(err, stack));
	          } else {
	            callback(null, stats);
	          }
	        });
	      });
	    } else {
	      sharp.stats(this.options, (err, stats) => {
	        if (err) {
	          callback(is.nativeError(err, stack));
	        } else {
	          callback(null, stats);
	        }
	      });
	    }
	    return this;
	  } else {
	    if (this._isStreamInput()) {
	      return new Promise((resolve, reject) => {
	        this.on('finish', function () {
	          this._flattenBufferIn();
	          sharp.stats(this.options, (err, stats) => {
	            if (err) {
	              reject(is.nativeError(err, stack));
	            } else {
	              resolve(stats);
	            }
	          });
	        });
	      });
	    } else {
	      return new Promise((resolve, reject) => {
	        sharp.stats(this.options, (err, stats) => {
	          if (err) {
	            reject(is.nativeError(err, stack));
	          } else {
	            resolve(stats);
	          }
	        });
	      });
	    }
	  }
	}

	/**
	 * Decorate the Sharp prototype with input-related functions.
	 * @module Sharp
	 * @private
	 */
	input = (Sharp) => {
	  Object.assign(Sharp.prototype, {
	    // Private
	    _inputOptionsFromObject,
	    _createInputDescriptor,
	    _write,
	    _flattenBufferIn,
	    _isStreamInput,
	    // Public
	    metadata,
	    stats
	  });
	  // Class attributes
	  Sharp.align = align;
	};
	return input;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var resize_1;
var hasRequiredResize;

function requireResize () {
	if (hasRequiredResize) return resize_1;
	hasRequiredResize = 1;
	const is = requireIs();

	/**
	 * Weighting to apply when using contain/cover fit.
	 * @member
	 * @private
	 */
	const gravity = {
	  center: 0,
	  centre: 0,
	  north: 1,
	  east: 2,
	  south: 3,
	  west: 4,
	  northeast: 5,
	  southeast: 6,
	  southwest: 7,
	  northwest: 8
	};

	/**
	 * Position to apply when using contain/cover fit.
	 * @member
	 * @private
	 */
	const position = {
	  top: 1,
	  right: 2,
	  bottom: 3,
	  left: 4,
	  'right top': 5,
	  'right bottom': 6,
	  'left bottom': 7,
	  'left top': 8
	};

	/**
	 * How to extend the image.
	 * @member
	 * @private
	 */
	const extendWith = {
	  background: 'background',
	  copy: 'copy',
	  repeat: 'repeat',
	  mirror: 'mirror'
	};

	/**
	 * Strategies for automagic cover behaviour.
	 * @member
	 * @private
	 */
	const strategy = {
	  entropy: 16,
	  attention: 17
	};

	/**
	 * Reduction kernels.
	 * @member
	 * @private
	 */
	const kernel = {
	  nearest: 'nearest',
	  linear: 'linear',
	  cubic: 'cubic',
	  mitchell: 'mitchell',
	  lanczos2: 'lanczos2',
	  lanczos3: 'lanczos3',
	  mks2013: 'mks2013',
	  mks2021: 'mks2021'
	};

	/**
	 * Methods by which an image can be resized to fit the provided dimensions.
	 * @member
	 * @private
	 */
	const fit = {
	  contain: 'contain',
	  cover: 'cover',
	  fill: 'fill',
	  inside: 'inside',
	  outside: 'outside'
	};

	/**
	 * Map external fit property to internal canvas property.
	 * @member
	 * @private
	 */
	const mapFitToCanvas = {
	  contain: 'embed',
	  cover: 'crop',
	  fill: 'ignore_aspect',
	  inside: 'max',
	  outside: 'min'
	};

	/**
	 * @private
	 */
	function isRotationExpected (options) {
	  return (options.angle % 360) !== 0 || options.rotationAngle !== 0;
	}

	/**
	 * @private
	 */
	function isResizeExpected (options) {
	  return options.width !== -1 || options.height !== -1;
	}

	/**
	 * Resize image to `width`, `height` or `width x height`.
	 *
	 * When both a `width` and `height` are provided, the possible methods by which the image should **fit** these are:
	 * - `cover`: (default) Preserving aspect ratio, attempt to ensure the image covers both provided dimensions by cropping/clipping to fit.
	 * - `contain`: Preserving aspect ratio, contain within both provided dimensions using "letterboxing" where necessary.
	 * - `fill`: Ignore the aspect ratio of the input and stretch to both provided dimensions.
	 * - `inside`: Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified.
	 * - `outside`: Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified.
	 *
	 * Some of these values are based on the [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) CSS property.
	 *
	 * <img alt="Examples of various values for the fit property when resizing" width="100%" style="aspect-ratio: 998/243" src="/api-resize-fit.svg">
	 *
	 * When using a **fit** of `cover` or `contain`, the default **position** is `centre`. Other options are:
	 * - `sharp.position`: `top`, `right top`, `right`, `right bottom`, `bottom`, `left bottom`, `left`, `left top`.
	 * - `sharp.gravity`: `north`, `northeast`, `east`, `southeast`, `south`, `southwest`, `west`, `northwest`, `center` or `centre`.
	 * - `sharp.strategy`: `cover` only, dynamically crop using either the `entropy` or `attention` strategy.
	 *
	 * Some of these values are based on the [object-position](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) CSS property.
	 *
	 * The strategy-based approach initially resizes so one dimension is at its target length
	 * then repeatedly ranks edge regions, discarding the edge with the lowest score based on the selected strategy.
	 * - `entropy`: focus on the region with the highest [Shannon entropy](https://en.wikipedia.org/wiki/Entropy_%28information_theory%29).
	 * - `attention`: focus on the region with the highest luminance frequency, colour saturation and presence of skin tones.
	 *
	 * Possible downsizing kernels are:
	 * - `nearest`: Use [nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation).
	 * - `linear`: Use a [triangle filter](https://en.wikipedia.org/wiki/Triangular_function).
	 * - `cubic`: Use a [Catmull-Rom spline](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline).
	 * - `mitchell`: Use a [Mitchell-Netravali spline](https://www.cs.utexas.edu/~fussell/courses/cs384g-fall2013/lectures/mitchell/Mitchell.pdf).
	 * - `lanczos2`: Use a [Lanczos kernel](https://en.wikipedia.org/wiki/Lanczos_resampling#Lanczos_kernel) with `a=2`.
	 * - `lanczos3`: Use a Lanczos kernel with `a=3` (the default).
	 * - `mks2013`: Use a [Magic Kernel Sharp](https://johncostella.com/magic/mks.pdf) 2013 kernel, as adopted by Facebook.
	 * - `mks2021`: Use a Magic Kernel Sharp 2021 kernel, with more accurate (reduced) sharpening than the 2013 version.
	 *
	 * When upsampling, these kernels map to `nearest`, `linear` and `cubic` interpolators.
	 * Downsampling kernels without a matching upsampling interpolator map to `cubic`.
	 *
	 * Only one resize can occur per pipeline.
	 * Previous calls to `resize` in the same pipeline will be ignored.
	 *
	 * @example
	 * sharp(input)
	 *   .resize({ width: 100 })
	 *   .toBuffer()
	 *   .then(data => {
	 *     // 100 pixels wide, auto-scaled height
	 *   });
	 *
	 * @example
	 * sharp(input)
	 *   .resize({ height: 100 })
	 *   .toBuffer()
	 *   .then(data => {
	 *     // 100 pixels high, auto-scaled width
	 *   });
	 *
	 * @example
	 * sharp(input)
	 *   .resize(200, 300, {
	 *     kernel: sharp.kernel.nearest,
	 *     fit: 'contain',
	 *     position: 'right top',
	 *     background: { r: 255, g: 255, b: 255, alpha: 0.5 }
	 *   })
	 *   .toFile('output.png')
	 *   .then(() => {
	 *     // output.png is a 200 pixels wide and 300 pixels high image
	 *     // containing a nearest-neighbour scaled version
	 *     // contained within the north-east corner of a semi-transparent white canvas
	 *   });
	 *
	 * @example
	 * const transformer = sharp()
	 *   .resize({
	 *     width: 200,
	 *     height: 200,
	 *     fit: sharp.fit.cover,
	 *     position: sharp.strategy.entropy
	 *   });
	 * // Read image data from readableStream
	 * // Write 200px square auto-cropped image data to writableStream
	 * readableStream
	 *   .pipe(transformer)
	 *   .pipe(writableStream);
	 *
	 * @example
	 * sharp(input)
	 *   .resize(200, 200, {
	 *     fit: sharp.fit.inside,
	 *     withoutEnlargement: true
	 *   })
	 *   .toFormat('jpeg')
	 *   .toBuffer()
	 *   .then(function(outputBuffer) {
	 *     // outputBuffer contains JPEG image data
	 *     // no wider and no higher than 200 pixels
	 *     // and no larger than the input image
	 *   });
	 *
	 * @example
	 * sharp(input)
	 *   .resize(200, 200, {
	 *     fit: sharp.fit.outside,
	 *     withoutReduction: true
	 *   })
	 *   .toFormat('jpeg')
	 *   .toBuffer()
	 *   .then(function(outputBuffer) {
	 *     // outputBuffer contains JPEG image data
	 *     // of at least 200 pixels wide and 200 pixels high while maintaining aspect ratio
	 *     // and no smaller than the input image
	 *   });
	 *
	 * @example
	 * const scaleByHalf = await sharp(input)
	 *   .metadata()
	 *   .then(({ width }) => sharp(input)
	 *     .resize(Math.round(width * 0.5))
	 *     .toBuffer()
	 *   );
	 *
	 * @param {number} [width] - How many pixels wide the resultant image should be. Use `null` or `undefined` to auto-scale the width to match the height.
	 * @param {number} [height] - How many pixels high the resultant image should be. Use `null` or `undefined` to auto-scale the height to match the width.
	 * @param {Object} [options]
	 * @param {number} [options.width] - An alternative means of specifying `width`. If both are present this takes priority.
	 * @param {number} [options.height] - An alternative means of specifying `height`. If both are present this takes priority.
	 * @param {String} [options.fit='cover'] - How the image should be resized/cropped to fit the target dimension(s), one of `cover`, `contain`, `fill`, `inside` or `outside`.
	 * @param {String} [options.position='centre'] - A position, gravity or strategy to use when `fit` is `cover` or `contain`.
	 * @param {String|Object} [options.background={r: 0, g: 0, b: 0, alpha: 1}] - background colour when `fit` is `contain`, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to black without transparency.
	 * @param {String} [options.kernel='lanczos3'] - The kernel to use for image reduction and the inferred interpolator to use for upsampling. Use the `fastShrinkOnLoad` option to control kernel vs shrink-on-load.
	 * @param {Boolean} [options.withoutEnlargement=false] - Do not scale up if the width *or* height are already less than the target dimensions, equivalent to GraphicsMagick's `>` geometry option. This may result in output dimensions smaller than the target dimensions.
	 * @param {Boolean} [options.withoutReduction=false] - Do not scale down if the width *or* height are already greater than the target dimensions, equivalent to GraphicsMagick's `<` geometry option. This may still result in a crop to reach the target dimensions.
	 * @param {Boolean} [options.fastShrinkOnLoad=true] - Take greater advantage of the JPEG and WebP shrink-on-load feature, which can lead to a slight moiré pattern or round-down of an auto-scaled dimension.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function resize (widthOrOptions, height, options) {
	  if (isResizeExpected(this.options)) {
	    this.options.debuglog('ignoring previous resize options');
	  }
	  if (this.options.widthPost !== -1) {
	    this.options.debuglog('operation order will be: extract, resize, extract');
	  }
	  if (is.defined(widthOrOptions)) {
	    if (is.object(widthOrOptions) && !is.defined(options)) {
	      options = widthOrOptions;
	    } else if (is.integer(widthOrOptions) && widthOrOptions > 0) {
	      this.options.width = widthOrOptions;
	    } else {
	      throw is.invalidParameterError('width', 'positive integer', widthOrOptions);
	    }
	  } else {
	    this.options.width = -1;
	  }
	  if (is.defined(height)) {
	    if (is.integer(height) && height > 0) {
	      this.options.height = height;
	    } else {
	      throw is.invalidParameterError('height', 'positive integer', height);
	    }
	  } else {
	    this.options.height = -1;
	  }
	  if (is.object(options)) {
	    // Width
	    if (is.defined(options.width)) {
	      if (is.integer(options.width) && options.width > 0) {
	        this.options.width = options.width;
	      } else {
	        throw is.invalidParameterError('width', 'positive integer', options.width);
	      }
	    }
	    // Height
	    if (is.defined(options.height)) {
	      if (is.integer(options.height) && options.height > 0) {
	        this.options.height = options.height;
	      } else {
	        throw is.invalidParameterError('height', 'positive integer', options.height);
	      }
	    }
	    // Fit
	    if (is.defined(options.fit)) {
	      const canvas = mapFitToCanvas[options.fit];
	      if (is.string(canvas)) {
	        this.options.canvas = canvas;
	      } else {
	        throw is.invalidParameterError('fit', 'valid fit', options.fit);
	      }
	    }
	    // Position
	    if (is.defined(options.position)) {
	      const pos = is.integer(options.position)
	        ? options.position
	        : strategy[options.position] || position[options.position] || gravity[options.position];
	      if (is.integer(pos) && (is.inRange(pos, 0, 8) || is.inRange(pos, 16, 17))) {
	        this.options.position = pos;
	      } else {
	        throw is.invalidParameterError('position', 'valid position/gravity/strategy', options.position);
	      }
	    }
	    // Background
	    this._setBackgroundColourOption('resizeBackground', options.background);
	    // Kernel
	    if (is.defined(options.kernel)) {
	      if (is.string(kernel[options.kernel])) {
	        this.options.kernel = kernel[options.kernel];
	      } else {
	        throw is.invalidParameterError('kernel', 'valid kernel name', options.kernel);
	      }
	    }
	    // Without enlargement
	    if (is.defined(options.withoutEnlargement)) {
	      this._setBooleanOption('withoutEnlargement', options.withoutEnlargement);
	    }
	    // Without reduction
	    if (is.defined(options.withoutReduction)) {
	      this._setBooleanOption('withoutReduction', options.withoutReduction);
	    }
	    // Shrink on load
	    if (is.defined(options.fastShrinkOnLoad)) {
	      this._setBooleanOption('fastShrinkOnLoad', options.fastShrinkOnLoad);
	    }
	  }
	  if (isRotationExpected(this.options) && isResizeExpected(this.options)) {
	    this.options.rotateBefore = true;
	  }
	  return this;
	}

	/**
	 * Extend / pad / extrude one or more edges of the image with either
	 * the provided background colour or pixels derived from the image.
	 * This operation will always occur after resizing and extraction, if any.
	 *
	 * @example
	 * // Resize to 140 pixels wide, then add 10 transparent pixels
	 * // to the top, left and right edges and 20 to the bottom edge
	 * sharp(input)
	 *   .resize(140)
	 *   .extend({
	 *     top: 10,
	 *     bottom: 20,
	 *     left: 10,
	 *     right: 10,
	 *     background: { r: 0, g: 0, b: 0, alpha: 0 }
	 *   })
	 *   ...
	 *
	* @example
	 * // Add a row of 10 red pixels to the bottom
	 * sharp(input)
	 *   .extend({
	 *     bottom: 10,
	 *     background: 'red'
	 *   })
	 *   ...
	 *
	 * @example
	 * // Extrude image by 8 pixels to the right, mirroring existing right hand edge
	 * sharp(input)
	 *   .extend({
	 *     right: 8,
	 *     background: 'mirror'
	 *   })
	 *   ...
	 *
	 * @param {(number|Object)} extend - single pixel count to add to all edges or an Object with per-edge counts
	 * @param {number} [extend.top=0]
	 * @param {number} [extend.left=0]
	 * @param {number} [extend.bottom=0]
	 * @param {number} [extend.right=0]
	 * @param {String} [extend.extendWith='background'] - populate new pixels using this method, one of: background, copy, repeat, mirror.
	 * @param {String|Object} [extend.background={r: 0, g: 0, b: 0, alpha: 1}] - background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to black without transparency.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	*/
	function extend (extend) {
	  if (is.integer(extend) && extend > 0) {
	    this.options.extendTop = extend;
	    this.options.extendBottom = extend;
	    this.options.extendLeft = extend;
	    this.options.extendRight = extend;
	  } else if (is.object(extend)) {
	    if (is.defined(extend.top)) {
	      if (is.integer(extend.top) && extend.top >= 0) {
	        this.options.extendTop = extend.top;
	      } else {
	        throw is.invalidParameterError('top', 'positive integer', extend.top);
	      }
	    }
	    if (is.defined(extend.bottom)) {
	      if (is.integer(extend.bottom) && extend.bottom >= 0) {
	        this.options.extendBottom = extend.bottom;
	      } else {
	        throw is.invalidParameterError('bottom', 'positive integer', extend.bottom);
	      }
	    }
	    if (is.defined(extend.left)) {
	      if (is.integer(extend.left) && extend.left >= 0) {
	        this.options.extendLeft = extend.left;
	      } else {
	        throw is.invalidParameterError('left', 'positive integer', extend.left);
	      }
	    }
	    if (is.defined(extend.right)) {
	      if (is.integer(extend.right) && extend.right >= 0) {
	        this.options.extendRight = extend.right;
	      } else {
	        throw is.invalidParameterError('right', 'positive integer', extend.right);
	      }
	    }
	    this._setBackgroundColourOption('extendBackground', extend.background);
	    if (is.defined(extend.extendWith)) {
	      if (is.string(extendWith[extend.extendWith])) {
	        this.options.extendWith = extendWith[extend.extendWith];
	      } else {
	        throw is.invalidParameterError('extendWith', 'one of: background, copy, repeat, mirror', extend.extendWith);
	      }
	    }
	  } else {
	    throw is.invalidParameterError('extend', 'integer or object', extend);
	  }
	  return this;
	}

	/**
	 * Extract/crop a region of the image.
	 *
	 * - Use `extract` before `resize` for pre-resize extraction.
	 * - Use `extract` after `resize` for post-resize extraction.
	 * - Use `extract` twice and `resize` once for extract-then-resize-then-extract in a fixed operation order.
	 *
	 * @example
	 * sharp(input)
	 *   .extract({ left: left, top: top, width: width, height: height })
	 *   .toFile(output, function(err) {
	 *     // Extract a region of the input image, saving in the same format.
	 *   });
	 * @example
	 * sharp(input)
	 *   .extract({ left: leftOffsetPre, top: topOffsetPre, width: widthPre, height: heightPre })
	 *   .resize(width, height)
	 *   .extract({ left: leftOffsetPost, top: topOffsetPost, width: widthPost, height: heightPost })
	 *   .toFile(output, function(err) {
	 *     // Extract a region, resize, then extract from the resized image
	 *   });
	 *
	 * @param {Object} options - describes the region to extract using integral pixel values
	 * @param {number} options.left - zero-indexed offset from left edge
	 * @param {number} options.top - zero-indexed offset from top edge
	 * @param {number} options.width - width of region to extract
	 * @param {number} options.height - height of region to extract
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function extract (options) {
	  const suffix = isResizeExpected(this.options) || this.options.widthPre !== -1 ? 'Post' : 'Pre';
	  if (this.options[`width${suffix}`] !== -1) {
	    this.options.debuglog('ignoring previous extract options');
	  }
	  ['left', 'top', 'width', 'height'].forEach(function (name) {
	    const value = options[name];
	    if (is.integer(value) && value >= 0) {
	      this.options[name + (name === 'left' || name === 'top' ? 'Offset' : '') + suffix] = value;
	    } else {
	      throw is.invalidParameterError(name, 'integer', value);
	    }
	  }, this);
	  // Ensure existing rotation occurs before pre-resize extraction
	  if (isRotationExpected(this.options) && !isResizeExpected(this.options)) {
	    if (this.options.widthPre === -1 || this.options.widthPost === -1) {
	      this.options.rotateBefore = true;
	    }
	  }
	  if (this.options.input.autoOrient) {
	    this.options.orientBefore = true;
	  }
	  return this;
	}

	/**
	 * Trim pixels from all edges that contain values similar to the given background colour, which defaults to that of the top-left pixel.
	 *
	 * Images with an alpha channel will use the combined bounding box of alpha and non-alpha channels.
	 *
	 * If the result of this operation would trim an image to nothing then no change is made.
	 *
	 * The `info` response Object will contain `trimOffsetLeft` and `trimOffsetTop` properties.
	 *
	 * @example
	 * // Trim pixels with a colour similar to that of the top-left pixel.
	 * await sharp(input)
	 *   .trim()
	 *   .toFile(output);
	 *
	 * @example
	 * // Trim pixels with the exact same colour as that of the top-left pixel.
	 * await sharp(input)
	 *   .trim({
	 *     threshold: 0
	 *   })
	 *   .toFile(output);
	 *
	 * @example
	 * // Assume input is line art and trim only pixels with a similar colour to red.
	 * const output = await sharp(input)
	 *   .trim({
	 *     background: "#FF0000",
	 *     lineArt: true
	 *   })
	 *   .toBuffer();
	 *
	 * @example
	 * // Trim all "yellow-ish" pixels, being more lenient with the higher threshold.
	 * const output = await sharp(input)
	 *   .trim({
	 *     background: "yellow",
	 *     threshold: 42,
	 *   })
	 *   .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {string|Object} [options.background='top-left pixel'] - Background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to that of the top-left pixel.
	 * @param {number} [options.threshold=10] - Allowed difference from the above colour, a positive number.
	 * @param {boolean} [options.lineArt=false] - Does the input more closely resemble line art (e.g. vector) rather than being photographic?
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function trim (options) {
	  this.options.trimThreshold = 10;
	  if (is.defined(options)) {
	    if (is.object(options)) {
	      if (is.defined(options.background)) {
	        this._setBackgroundColourOption('trimBackground', options.background);
	      }
	      if (is.defined(options.threshold)) {
	        if (is.number(options.threshold) && options.threshold >= 0) {
	          this.options.trimThreshold = options.threshold;
	        } else {
	          throw is.invalidParameterError('threshold', 'positive number', options.threshold);
	        }
	      }
	      if (is.defined(options.lineArt)) {
	        this._setBooleanOption('trimLineArt', options.lineArt);
	      }
	    } else {
	      throw is.invalidParameterError('trim', 'object', options);
	    }
	  }
	  if (isRotationExpected(this.options)) {
	    this.options.rotateBefore = true;
	  }
	  return this;
	}

	/**
	 * Decorate the Sharp prototype with resize-related functions.
	 * @module Sharp
	 * @private
	 */
	resize_1 = (Sharp) => {
	  Object.assign(Sharp.prototype, {
	    resize,
	    extend,
	    extract,
	    trim
	  });
	  // Class attributes
	  Sharp.gravity = gravity;
	  Sharp.strategy = strategy;
	  Sharp.kernel = kernel;
	  Sharp.fit = fit;
	  Sharp.position = position;
	};
	return resize_1;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var composite_1;
var hasRequiredComposite;

function requireComposite () {
	if (hasRequiredComposite) return composite_1;
	hasRequiredComposite = 1;
	const is = requireIs();

	/**
	 * Blend modes.
	 * @member
	 * @private
	 */
	const blend = {
	  clear: 'clear',
	  source: 'source',
	  over: 'over',
	  in: 'in',
	  out: 'out',
	  atop: 'atop',
	  dest: 'dest',
	  'dest-over': 'dest-over',
	  'dest-in': 'dest-in',
	  'dest-out': 'dest-out',
	  'dest-atop': 'dest-atop',
	  xor: 'xor',
	  add: 'add',
	  saturate: 'saturate',
	  multiply: 'multiply',
	  screen: 'screen',
	  overlay: 'overlay',
	  darken: 'darken',
	  lighten: 'lighten',
	  'colour-dodge': 'colour-dodge',
	  'color-dodge': 'colour-dodge',
	  'colour-burn': 'colour-burn',
	  'color-burn': 'colour-burn',
	  'hard-light': 'hard-light',
	  'soft-light': 'soft-light',
	  difference: 'difference',
	  exclusion: 'exclusion'
	};

	/**
	 * Composite image(s) over the processed (resized, extracted etc.) image.
	 *
	 * The images to composite must be the same size or smaller than the processed image.
	 * If both `top` and `left` options are provided, they take precedence over `gravity`.
	 *
	 * Other operations in the same processing pipeline (e.g. resize, rotate, flip,
	 * flop, extract) will always be applied to the input image before composition.
	 *
	 * The `blend` option can be one of `clear`, `source`, `over`, `in`, `out`, `atop`,
	 * `dest`, `dest-over`, `dest-in`, `dest-out`, `dest-atop`,
	 * `xor`, `add`, `saturate`, `multiply`, `screen`, `overlay`, `darken`, `lighten`,
	 * `colour-dodge`, `color-dodge`, `colour-burn`,`color-burn`,
	 * `hard-light`, `soft-light`, `difference`, `exclusion`.
	 *
	 * More information about blend modes can be found at
	 * https://www.libvips.org/API/current/enum.BlendMode.html
	 * and https://www.cairographics.org/operators/
	 *
	 * @since 0.22.0
	 *
	 * @example
	 * await sharp(background)
	 *   .composite([
	 *     { input: layer1, gravity: 'northwest' },
	 *     { input: layer2, gravity: 'southeast' },
	 *   ])
	 *   .toFile('combined.png');
	 *
	 * @example
	 * const output = await sharp('input.gif', { animated: true })
	 *   .composite([
	 *     { input: 'overlay.png', tile: true, blend: 'saturate' }
	 *   ])
	 *   .toBuffer();
	 *
	 * @example
	 * sharp('input.png')
	 *   .rotate(180)
	 *   .resize(300)
	 *   .flatten( { background: '#ff6600' } )
	 *   .composite([{ input: 'overlay.png', gravity: 'southeast' }])
	 *   .sharpen()
	 *   .withMetadata()
	 *   .webp( { quality: 90 } )
	 *   .toBuffer()
	 *   .then(function(outputBuffer) {
	 *     // outputBuffer contains upside down, 300px wide, alpha channel flattened
	 *     // onto orange background, composited with overlay.png with SE gravity,
	 *     // sharpened, with metadata, 90% quality WebP image data. Phew!
	 *   });
	 *
	 * @param {Object[]} images - Ordered list of images to composite
	 * @param {Buffer|String} [images[].input] - Buffer containing image data, String containing the path to an image file, or Create object (see below)
	 * @param {Object} [images[].input.create] - describes a blank overlay to be created.
	 * @param {Number} [images[].input.create.width]
	 * @param {Number} [images[].input.create.height]
	 * @param {Number} [images[].input.create.channels] - 3-4
	 * @param {String|Object} [images[].input.create.background] - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
	 * @param {Object} [images[].input.text] - describes a new text image to be created.
	 * @param {string} [images[].input.text.text] - text to render as a UTF-8 string. It can contain Pango markup, for example `<i>Le</i>Monde`.
	 * @param {string} [images[].input.text.font] - font name to render with.
	 * @param {string} [images[].input.text.fontfile] - absolute filesystem path to a font file that can be used by `font`.
	 * @param {number} [images[].input.text.width=0] - integral number of pixels to word-wrap at. Lines of text wider than this will be broken at word boundaries.
	 * @param {number} [images[].input.text.height=0] - integral number of pixels high. When defined, `dpi` will be ignored and the text will automatically fit the pixel resolution defined by `width` and `height`. Will be ignored if `width` is not specified or set to 0.
	 * @param {string} [images[].input.text.align='left'] - text alignment (`'left'`, `'centre'`, `'center'`, `'right'`).
	 * @param {boolean} [images[].input.text.justify=false] - set this to true to apply justification to the text.
	 * @param {number} [images[].input.text.dpi=72] - the resolution (size) at which to render the text. Does not take effect if `height` is specified.
	 * @param {boolean} [images[].input.text.rgba=false] - set this to true to enable RGBA output. This is useful for colour emoji rendering, or support for Pango markup features like `<span foreground="red">Red!</span>`.
	 * @param {number} [images[].input.text.spacing=0] - text line height in points. Will use the font line height if none is specified.
	 * @param {Boolean} [images[].autoOrient=false] - set to true to use EXIF orientation data, if present, to orient the image.
	 * @param {String} [images[].blend='over'] - how to blend this image with the image below.
	 * @param {String} [images[].gravity='centre'] - gravity at which to place the overlay.
	 * @param {Number} [images[].top] - the pixel offset from the top edge.
	 * @param {Number} [images[].left] - the pixel offset from the left edge.
	 * @param {Boolean} [images[].tile=false] - set to true to repeat the overlay image across the entire image with the given `gravity`.
	 * @param {Boolean} [images[].premultiplied=false] - set to true to avoid premultiplying the image below. Equivalent to the `--premultiplied` vips option.
	 * @param {Number} [images[].density=72] - number representing the DPI for vector overlay image.
	 * @param {Object} [images[].raw] - describes overlay when using raw pixel data.
	 * @param {Number} [images[].raw.width]
	 * @param {Number} [images[].raw.height]
	 * @param {Number} [images[].raw.channels]
	 * @param {boolean} [images[].animated=false] - Set to `true` to read all frames/pages of an animated image.
	 * @param {string} [images[].failOn='warning'] - @see {@link /api-constructor/ constructor parameters}
	 * @param {number|boolean} [images[].limitInputPixels=268402689] - @see {@link /api-constructor/ constructor parameters}
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function composite (images) {
	  if (!Array.isArray(images)) {
	    throw is.invalidParameterError('images to composite', 'array', images);
	  }
	  this.options.composite = images.map(image => {
	    if (!is.object(image)) {
	      throw is.invalidParameterError('image to composite', 'object', image);
	    }
	    const inputOptions = this._inputOptionsFromObject(image);
	    const composite = {
	      input: this._createInputDescriptor(image.input, inputOptions, { allowStream: false }),
	      blend: 'over',
	      tile: false,
	      left: 0,
	      top: 0,
	      hasOffset: false,
	      gravity: 0,
	      premultiplied: false
	    };
	    if (is.defined(image.blend)) {
	      if (is.string(blend[image.blend])) {
	        composite.blend = blend[image.blend];
	      } else {
	        throw is.invalidParameterError('blend', 'valid blend name', image.blend);
	      }
	    }
	    if (is.defined(image.tile)) {
	      if (is.bool(image.tile)) {
	        composite.tile = image.tile;
	      } else {
	        throw is.invalidParameterError('tile', 'boolean', image.tile);
	      }
	    }
	    if (is.defined(image.left)) {
	      if (is.integer(image.left)) {
	        composite.left = image.left;
	      } else {
	        throw is.invalidParameterError('left', 'integer', image.left);
	      }
	    }
	    if (is.defined(image.top)) {
	      if (is.integer(image.top)) {
	        composite.top = image.top;
	      } else {
	        throw is.invalidParameterError('top', 'integer', image.top);
	      }
	    }
	    if (is.defined(image.top) !== is.defined(image.left)) {
	      throw new Error('Expected both left and top to be set');
	    } else {
	      composite.hasOffset = is.integer(image.top) && is.integer(image.left);
	    }
	    if (is.defined(image.gravity)) {
	      if (is.integer(image.gravity) && is.inRange(image.gravity, 0, 8)) {
	        composite.gravity = image.gravity;
	      } else if (is.string(image.gravity) && is.integer(this.constructor.gravity[image.gravity])) {
	        composite.gravity = this.constructor.gravity[image.gravity];
	      } else {
	        throw is.invalidParameterError('gravity', 'valid gravity', image.gravity);
	      }
	    }
	    if (is.defined(image.premultiplied)) {
	      if (is.bool(image.premultiplied)) {
	        composite.premultiplied = image.premultiplied;
	      } else {
	        throw is.invalidParameterError('premultiplied', 'boolean', image.premultiplied);
	      }
	    }
	    return composite;
	  });
	  return this;
	}

	/**
	 * Decorate the Sharp prototype with composite-related functions.
	 * @module Sharp
	 * @private
	 */
	composite_1 = (Sharp) => {
	  Sharp.prototype.composite = composite;
	  Sharp.blend = blend;
	};
	return composite_1;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var operation;
var hasRequiredOperation;

function requireOperation () {
	if (hasRequiredOperation) return operation;
	hasRequiredOperation = 1;
	const is = requireIs();

	/**
	 * How accurate an operation should be.
	 * @member
	 * @private
	 */
	const vipsPrecision = {
	  integer: 'integer',
	  float: 'float',
	  approximate: 'approximate'
	};

	/**
	 * Rotate the output image.
	 *
	 * The provided angle is converted to a valid positive degree rotation.
	 * For example, `-450` will produce a 270 degree rotation.
	 *
	 * When rotating by an angle other than a multiple of 90,
	 * the background colour can be provided with the `background` option.
	 *
	 * For backwards compatibility, if no angle is provided, `.autoOrient()` will be called.
	 *
	 * Only one rotation can occur per pipeline (aside from an initial call without
	 * arguments to orient via EXIF data). Previous calls to `rotate` in the same
	 * pipeline will be ignored.
	 *
	 * Multi-page images can only be rotated by 180 degrees.
	 *
	 * Method order is important when rotating, resizing and/or extracting regions,
	 * for example `.rotate(x).extract(y)` will produce a different result to `.extract(y).rotate(x)`.
	 *
	 * @example
	 * const rotateThenResize = await sharp(input)
	 *   .rotate(90)
	 *   .resize({ width: 16, height: 8, fit: 'fill' })
	 *   .toBuffer();
	 * const resizeThenRotate = await sharp(input)
	 *   .resize({ width: 16, height: 8, fit: 'fill' })
	 *   .rotate(90)
	 *   .toBuffer();
	 *
	 * @param {number} [angle=auto] angle of rotation.
	 * @param {Object} [options] - if present, is an Object with optional attributes.
	 * @param {string|Object} [options.background="#000000"] parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function rotate (angle, options) {
	  if (!is.defined(angle)) {
	    return this.autoOrient();
	  }
	  if (this.options.angle || this.options.rotationAngle) {
	    this.options.debuglog('ignoring previous rotate options');
	    this.options.angle = 0;
	    this.options.rotationAngle = 0;
	  }
	  if (is.integer(angle) && !(angle % 90)) {
	    this.options.angle = angle;
	  } else if (is.number(angle)) {
	    this.options.rotationAngle = angle;
	    if (is.object(options) && options.background) {
	      this._setBackgroundColourOption('rotationBackground', options.background);
	    }
	  } else {
	    throw is.invalidParameterError('angle', 'numeric', angle);
	  }
	  return this;
	}

	/**
	 * Auto-orient based on the EXIF `Orientation` tag, then remove the tag.
	 * Mirroring is supported and may infer the use of a flip operation.
	 *
	 * Previous or subsequent use of `rotate(angle)` and either `flip()` or `flop()`
	 * will logically occur after auto-orientation, regardless of call order.
	 *
	 * @example
	 * const output = await sharp(input).autoOrient().toBuffer();
	 *
	 * @example
	 * const pipeline = sharp()
	 *   .autoOrient()
	 *   .resize(null, 200)
	 *   .toBuffer(function (err, outputBuffer, info) {
	 *     // outputBuffer contains 200px high JPEG image data,
	 *     // auto-oriented using EXIF Orientation tag
	 *     // info.width and info.height contain the dimensions of the resized image
	 *   });
	 * readableStream.pipe(pipeline);
	 *
	 * @returns {Sharp}
	 */
	function autoOrient () {
	  this.options.input.autoOrient = true;
	  return this;
	}

	/**
	 * Mirror the image vertically (up-down) about the x-axis.
	 * This always occurs before rotation, if any.
	 *
	 * This operation does not work correctly with multi-page images.
	 *
	 * @example
	 * const output = await sharp(input).flip().toBuffer();
	 *
	 * @param {Boolean} [flip=true]
	 * @returns {Sharp}
	 */
	function flip (flip) {
	  this.options.flip = is.bool(flip) ? flip : true;
	  return this;
	}

	/**
	 * Mirror the image horizontally (left-right) about the y-axis.
	 * This always occurs before rotation, if any.
	 *
	 * @example
	 * const output = await sharp(input).flop().toBuffer();
	 *
	 * @param {Boolean} [flop=true]
	 * @returns {Sharp}
	 */
	function flop (flop) {
	  this.options.flop = is.bool(flop) ? flop : true;
	  return this;
	}

	/**
	 * Perform an affine transform on an image. This operation will always occur after resizing, extraction and rotation, if any.
	 *
	 * You must provide an array of length 4 or a 2x2 affine transformation matrix.
	 * By default, new pixels are filled with a black background. You can provide a background colour with the `background` option.
	 * A particular interpolator may also be specified. Set the `interpolator` option to an attribute of the `sharp.interpolators` Object e.g. `sharp.interpolators.nohalo`.
	 *
	 * In the case of a 2x2 matrix, the transform is:
	 * - X = `matrix[0, 0]` \* (x + `idx`) + `matrix[0, 1]` \* (y + `idy`) + `odx`
	 * - Y = `matrix[1, 0]` \* (x + `idx`) + `matrix[1, 1]` \* (y + `idy`) + `ody`
	 *
	 * where:
	 * - x and y are the coordinates in input image.
	 * - X and Y are the coordinates in output image.
	 * - (0,0) is the upper left corner.
	 *
	 * @since 0.27.0
	 *
	 * @example
	 * const pipeline = sharp()
	 *   .affine([[1, 0.3], [0.1, 0.7]], {
	 *      background: 'white',
	 *      interpolator: sharp.interpolators.nohalo
	 *   })
	 *   .toBuffer((err, outputBuffer, info) => {
	 *      // outputBuffer contains the transformed image
	 *      // info.width and info.height contain the new dimensions
	 *   });
	 *
	 * inputStream
	 *   .pipe(pipeline);
	 *
	 * @param {Array<Array<number>>|Array<number>} matrix - affine transformation matrix
	 * @param {Object} [options] - if present, is an Object with optional attributes.
	 * @param {String|Object} [options.background="#000000"] - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
	 * @param {Number} [options.idx=0] - input horizontal offset
	 * @param {Number} [options.idy=0] - input vertical offset
	 * @param {Number} [options.odx=0] - output horizontal offset
	 * @param {Number} [options.ody=0] - output vertical offset
	 * @param {String} [options.interpolator=sharp.interpolators.bicubic] - interpolator
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function affine (matrix, options) {
	  const flatMatrix = [].concat(...matrix);
	  if (flatMatrix.length === 4 && flatMatrix.every(is.number)) {
	    this.options.affineMatrix = flatMatrix;
	  } else {
	    throw is.invalidParameterError('matrix', '1x4 or 2x2 array', matrix);
	  }

	  if (is.defined(options)) {
	    if (is.object(options)) {
	      this._setBackgroundColourOption('affineBackground', options.background);
	      if (is.defined(options.idx)) {
	        if (is.number(options.idx)) {
	          this.options.affineIdx = options.idx;
	        } else {
	          throw is.invalidParameterError('options.idx', 'number', options.idx);
	        }
	      }
	      if (is.defined(options.idy)) {
	        if (is.number(options.idy)) {
	          this.options.affineIdy = options.idy;
	        } else {
	          throw is.invalidParameterError('options.idy', 'number', options.idy);
	        }
	      }
	      if (is.defined(options.odx)) {
	        if (is.number(options.odx)) {
	          this.options.affineOdx = options.odx;
	        } else {
	          throw is.invalidParameterError('options.odx', 'number', options.odx);
	        }
	      }
	      if (is.defined(options.ody)) {
	        if (is.number(options.ody)) {
	          this.options.affineOdy = options.ody;
	        } else {
	          throw is.invalidParameterError('options.ody', 'number', options.ody);
	        }
	      }
	      if (is.defined(options.interpolator)) {
	        if (is.inArray(options.interpolator, Object.values(this.constructor.interpolators))) {
	          this.options.affineInterpolator = options.interpolator;
	        } else {
	          throw is.invalidParameterError('options.interpolator', 'valid interpolator name', options.interpolator);
	        }
	      }
	    } else {
	      throw is.invalidParameterError('options', 'object', options);
	    }
	  }

	  return this;
	}

	/**
	 * Sharpen the image.
	 *
	 * When used without parameters, performs a fast, mild sharpen of the output image.
	 *
	 * When a `sigma` is provided, performs a slower, more accurate sharpen of the L channel in the LAB colour space.
	 * Fine-grained control over the level of sharpening in "flat" (m1) and "jagged" (m2) areas is available.
	 *
	 * See {@link https://www.libvips.org/API/current/method.Image.sharpen.html libvips sharpen} operation.
	 *
	 * @example
	 * const data = await sharp(input).sharpen().toBuffer();
	 *
	 * @example
	 * const data = await sharp(input).sharpen({ sigma: 2 }).toBuffer();
	 *
	 * @example
	 * const data = await sharp(input)
	 *   .sharpen({
	 *     sigma: 2,
	 *     m1: 0,
	 *     m2: 3,
	 *     x1: 3,
	 *     y2: 15,
	 *     y3: 15,
	 *   })
	 *   .toBuffer();
	 *
	 * @param {Object|number} [options] - if present, is an Object with attributes
	 * @param {number} [options.sigma] - the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`, between 0.000001 and 10
	 * @param {number} [options.m1=1.0] - the level of sharpening to apply to "flat" areas, between 0 and 1000000
	 * @param {number} [options.m2=2.0] - the level of sharpening to apply to "jagged" areas, between 0 and 1000000
	 * @param {number} [options.x1=2.0] - threshold between "flat" and "jagged", between 0 and 1000000
	 * @param {number} [options.y2=10.0] - maximum amount of brightening, between 0 and 1000000
	 * @param {number} [options.y3=20.0] - maximum amount of darkening, between 0 and 1000000
	 * @param {number} [flat] - (deprecated) see `options.m1`.
	 * @param {number} [jagged] - (deprecated) see `options.m2`.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function sharpen (options, flat, jagged) {
	  if (!is.defined(options)) {
	    // No arguments: default to mild sharpen
	    this.options.sharpenSigma = -1;
	  } else if (is.bool(options)) {
	    // Deprecated boolean argument: apply mild sharpen?
	    this.options.sharpenSigma = options ? -1 : 0;
	  } else if (is.number(options) && is.inRange(options, 0.01, 10000)) {
	    // Deprecated numeric argument: specific sigma
	    this.options.sharpenSigma = options;
	    // Deprecated control over flat areas
	    if (is.defined(flat)) {
	      if (is.number(flat) && is.inRange(flat, 0, 10000)) {
	        this.options.sharpenM1 = flat;
	      } else {
	        throw is.invalidParameterError('flat', 'number between 0 and 10000', flat);
	      }
	    }
	    // Deprecated control over jagged areas
	    if (is.defined(jagged)) {
	      if (is.number(jagged) && is.inRange(jagged, 0, 10000)) {
	        this.options.sharpenM2 = jagged;
	      } else {
	        throw is.invalidParameterError('jagged', 'number between 0 and 10000', jagged);
	      }
	    }
	  } else if (is.plainObject(options)) {
	    if (is.number(options.sigma) && is.inRange(options.sigma, 0.000001, 10)) {
	      this.options.sharpenSigma = options.sigma;
	    } else {
	      throw is.invalidParameterError('options.sigma', 'number between 0.000001 and 10', options.sigma);
	    }
	    if (is.defined(options.m1)) {
	      if (is.number(options.m1) && is.inRange(options.m1, 0, 1000000)) {
	        this.options.sharpenM1 = options.m1;
	      } else {
	        throw is.invalidParameterError('options.m1', 'number between 0 and 1000000', options.m1);
	      }
	    }
	    if (is.defined(options.m2)) {
	      if (is.number(options.m2) && is.inRange(options.m2, 0, 1000000)) {
	        this.options.sharpenM2 = options.m2;
	      } else {
	        throw is.invalidParameterError('options.m2', 'number between 0 and 1000000', options.m2);
	      }
	    }
	    if (is.defined(options.x1)) {
	      if (is.number(options.x1) && is.inRange(options.x1, 0, 1000000)) {
	        this.options.sharpenX1 = options.x1;
	      } else {
	        throw is.invalidParameterError('options.x1', 'number between 0 and 1000000', options.x1);
	      }
	    }
	    if (is.defined(options.y2)) {
	      if (is.number(options.y2) && is.inRange(options.y2, 0, 1000000)) {
	        this.options.sharpenY2 = options.y2;
	      } else {
	        throw is.invalidParameterError('options.y2', 'number between 0 and 1000000', options.y2);
	      }
	    }
	    if (is.defined(options.y3)) {
	      if (is.number(options.y3) && is.inRange(options.y3, 0, 1000000)) {
	        this.options.sharpenY3 = options.y3;
	      } else {
	        throw is.invalidParameterError('options.y3', 'number between 0 and 1000000', options.y3);
	      }
	    }
	  } else {
	    throw is.invalidParameterError('sigma', 'number between 0.01 and 10000', options);
	  }
	  return this;
	}

	/**
	 * Apply median filter.
	 * When used without parameters the default window is 3x3.
	 *
	 * @example
	 * const output = await sharp(input).median().toBuffer();
	 *
	 * @example
	 * const output = await sharp(input).median(5).toBuffer();
	 *
	 * @param {number} [size=3] square mask size: size x size
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function median (size) {
	  if (!is.defined(size)) {
	    // No arguments: default to 3x3
	    this.options.medianSize = 3;
	  } else if (is.integer(size) && is.inRange(size, 1, 1000)) {
	    // Numeric argument: specific sigma
	    this.options.medianSize = size;
	  } else {
	    throw is.invalidParameterError('size', 'integer between 1 and 1000', size);
	  }
	  return this;
	}

	/**
	 * Blur the image.
	 *
	 * When used without parameters, performs a fast 3x3 box blur (equivalent to a box linear filter).
	 *
	 * When a `sigma` is provided, performs a slower, more accurate Gaussian blur.
	 *
	 * @example
	 * const boxBlurred = await sharp(input)
	 *   .blur()
	 *   .toBuffer();
	 *
	 * @example
	 * const gaussianBlurred = await sharp(input)
	 *   .blur(5)
	 *   .toBuffer();
	 *
	 * @param {Object|number|Boolean} [options]
	 * @param {number} [options.sigma] a value between 0.3 and 1000 representing the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`.
	 * @param {string} [options.precision='integer'] How accurate the operation should be, one of: integer, float, approximate.
	 * @param {number} [options.minAmplitude=0.2] A value between 0.001 and 1. A smaller value will generate a larger, more accurate mask.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function blur (options) {
	  let sigma;
	  if (is.number(options)) {
	    sigma = options;
	  } else if (is.plainObject(options)) {
	    if (!is.number(options.sigma)) {
	      throw is.invalidParameterError('options.sigma', 'number between 0.3 and 1000', sigma);
	    }
	    sigma = options.sigma;
	    if ('precision' in options) {
	      if (is.string(vipsPrecision[options.precision])) {
	        this.options.precision = vipsPrecision[options.precision];
	      } else {
	        throw is.invalidParameterError('precision', 'one of: integer, float, approximate', options.precision);
	      }
	    }
	    if ('minAmplitude' in options) {
	      if (is.number(options.minAmplitude) && is.inRange(options.minAmplitude, 0.001, 1)) {
	        this.options.minAmpl = options.minAmplitude;
	      } else {
	        throw is.invalidParameterError('minAmplitude', 'number between 0.001 and 1', options.minAmplitude);
	      }
	    }
	  }

	  if (!is.defined(options)) {
	    // No arguments: default to mild blur
	    this.options.blurSigma = -1;
	  } else if (is.bool(options)) {
	    // Boolean argument: apply mild blur?
	    this.options.blurSigma = options ? -1 : 0;
	  } else if (is.number(sigma) && is.inRange(sigma, 0.3, 1000)) {
	    // Numeric argument: specific sigma
	    this.options.blurSigma = sigma;
	  } else {
	    throw is.invalidParameterError('sigma', 'number between 0.3 and 1000', sigma);
	  }

	  return this;
	}

	/**
	 * Expand foreground objects using the dilate morphological operator.
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .dilate()
	 *   .toBuffer();
	 *
	 * @param {Number} [width=1] dilation width in pixels.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function dilate (width) {
	  if (!is.defined(width)) {
	    this.options.dilateWidth = 1;
	  } else if (is.integer(width) && width > 0) {
	    this.options.dilateWidth = width;
	  } else {
	    throw is.invalidParameterError('dilate', 'positive integer', dilate);
	  }
	  return this;
	}

	/**
	 * Shrink foreground objects using the erode morphological operator.
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .erode()
	 *   .toBuffer();
	 *
	 * @param {Number} [width=1] erosion width in pixels.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function erode (width) {
	  if (!is.defined(width)) {
	    this.options.erodeWidth = 1;
	  } else if (is.integer(width) && width > 0) {
	    this.options.erodeWidth = width;
	  } else {
	    throw is.invalidParameterError('erode', 'positive integer', erode);
	  }
	  return this;
	}

	/**
	 * Merge alpha transparency channel, if any, with a background, then remove the alpha channel.
	 *
	 * See also {@link /api-channel#removealpha removeAlpha}.
	 *
	 * @example
	 * await sharp(rgbaInput)
	 *   .flatten({ background: '#F0A703' })
	 *   .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {string|Object} [options.background={r: 0, g: 0, b: 0}] - background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to black.
	 * @returns {Sharp}
	 */
	function flatten (options) {
	  this.options.flatten = is.bool(options) ? options : true;
	  if (is.object(options)) {
	    this._setBackgroundColourOption('flattenBackground', options.background);
	  }
	  return this;
	}

	/**
	 * Ensure the image has an alpha channel
	 * with all white pixel values made fully transparent.
	 *
	 * Existing alpha channel values for non-white pixels remain unchanged.
	 *
	 * This feature is experimental and the API may change.
	 *
	 * @since 0.32.1
	 *
	 * @example
	 * await sharp(rgbInput)
	 *   .unflatten()
	 *   .toBuffer();
	 *
	 * @example
	 * await sharp(rgbInput)
	 *   .threshold(128, { grayscale: false }) // converter bright pixels to white
	 *   .unflatten()
	 *   .toBuffer();
	 */
	function unflatten () {
	  this.options.unflatten = true;
	  return this;
	}

	/**
	 * Apply a gamma correction by reducing the encoding (darken) pre-resize at a factor of `1/gamma`
	 * then increasing the encoding (brighten) post-resize at a factor of `gamma`.
	 * This can improve the perceived brightness of a resized image in non-linear colour spaces.
	 * JPEG and WebP input images will not take advantage of the shrink-on-load performance optimisation
	 * when applying a gamma correction.
	 *
	 * Supply a second argument to use a different output gamma value, otherwise the first value is used in both cases.
	 *
	 * @param {number} [gamma=2.2] value between 1.0 and 3.0.
	 * @param {number} [gammaOut] value between 1.0 and 3.0. (optional, defaults to same as `gamma`)
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function gamma (gamma, gammaOut) {
	  if (!is.defined(gamma)) {
	    // Default gamma correction of 2.2 (sRGB)
	    this.options.gamma = 2.2;
	  } else if (is.number(gamma) && is.inRange(gamma, 1, 3)) {
	    this.options.gamma = gamma;
	  } else {
	    throw is.invalidParameterError('gamma', 'number between 1.0 and 3.0', gamma);
	  }
	  if (!is.defined(gammaOut)) {
	    // Default gamma correction for output is same as input
	    this.options.gammaOut = this.options.gamma;
	  } else if (is.number(gammaOut) && is.inRange(gammaOut, 1, 3)) {
	    this.options.gammaOut = gammaOut;
	  } else {
	    throw is.invalidParameterError('gammaOut', 'number between 1.0 and 3.0', gammaOut);
	  }
	  return this;
	}

	/**
	 * Produce the "negative" of the image.
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .negate()
	 *   .toBuffer();
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .negate({ alpha: false })
	 *   .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {Boolean} [options.alpha=true] Whether or not to negate any alpha channel
	 * @returns {Sharp}
	 */
	function negate (options) {
	  this.options.negate = is.bool(options) ? options : true;
	  if (is.plainObject(options) && 'alpha' in options) {
	    if (!is.bool(options.alpha)) {
	      throw is.invalidParameterError('alpha', 'should be boolean value', options.alpha);
	    } else {
	      this.options.negateAlpha = options.alpha;
	    }
	  }
	  return this;
	}

	/**
	 * Enhance output image contrast by stretching its luminance to cover a full dynamic range.
	 *
	 * Uses a histogram-based approach, taking a default range of 1% to 99% to reduce sensitivity to noise at the extremes.
	 *
	 * Luminance values below the `lower` percentile will be underexposed by clipping to zero.
	 * Luminance values above the `upper` percentile will be overexposed by clipping to the max pixel value.
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .normalise()
	 *   .toBuffer();
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .normalise({ lower: 0, upper: 100 })
	 *   .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {number} [options.lower=1] - Percentile below which luminance values will be underexposed.
	 * @param {number} [options.upper=99] - Percentile above which luminance values will be overexposed.
	 * @returns {Sharp}
	 */
	function normalise (options) {
	  if (is.plainObject(options)) {
	    if (is.defined(options.lower)) {
	      if (is.number(options.lower) && is.inRange(options.lower, 0, 99)) {
	        this.options.normaliseLower = options.lower;
	      } else {
	        throw is.invalidParameterError('lower', 'number between 0 and 99', options.lower);
	      }
	    }
	    if (is.defined(options.upper)) {
	      if (is.number(options.upper) && is.inRange(options.upper, 1, 100)) {
	        this.options.normaliseUpper = options.upper;
	      } else {
	        throw is.invalidParameterError('upper', 'number between 1 and 100', options.upper);
	      }
	    }
	  }
	  if (this.options.normaliseLower >= this.options.normaliseUpper) {
	    throw is.invalidParameterError('range', 'lower to be less than upper',
	      `${this.options.normaliseLower} >= ${this.options.normaliseUpper}`);
	  }
	  this.options.normalise = true;
	  return this;
	}

	/**
	 * Alternative spelling of normalise.
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .normalize()
	 *   .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {number} [options.lower=1] - Percentile below which luminance values will be underexposed.
	 * @param {number} [options.upper=99] - Percentile above which luminance values will be overexposed.
	 * @returns {Sharp}
	 */
	function normalize (options) {
	  return this.normalise(options);
	}

	/**
	 * Perform contrast limiting adaptive histogram equalization
	 * {@link https://en.wikipedia.org/wiki/Adaptive_histogram_equalization#Contrast_Limited_AHE CLAHE}.
	 *
	 * This will, in general, enhance the clarity of the image by bringing out darker details.
	 *
	 * @since 0.28.3
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .clahe({
	 *     width: 3,
	 *     height: 3,
	 *   })
	 *   .toBuffer();
	 *
	 * @param {Object} options
	 * @param {number} options.width - Integral width of the search window, in pixels.
	 * @param {number} options.height - Integral height of the search window, in pixels.
	 * @param {number} [options.maxSlope=3] - Integral level of brightening, between 0 and 100, where 0 disables contrast limiting.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function clahe (options) {
	  if (is.plainObject(options)) {
	    if (is.integer(options.width) && options.width > 0) {
	      this.options.claheWidth = options.width;
	    } else {
	      throw is.invalidParameterError('width', 'integer greater than zero', options.width);
	    }
	    if (is.integer(options.height) && options.height > 0) {
	      this.options.claheHeight = options.height;
	    } else {
	      throw is.invalidParameterError('height', 'integer greater than zero', options.height);
	    }
	    if (is.defined(options.maxSlope)) {
	      if (is.integer(options.maxSlope) && is.inRange(options.maxSlope, 0, 100)) {
	        this.options.claheMaxSlope = options.maxSlope;
	      } else {
	        throw is.invalidParameterError('maxSlope', 'integer between 0 and 100', options.maxSlope);
	      }
	    }
	  } else {
	    throw is.invalidParameterError('options', 'plain object', options);
	  }
	  return this;
	}

	/**
	 * Convolve the image with the specified kernel.
	 *
	 * @example
	 * sharp(input)
	 *   .convolve({
	 *     width: 3,
	 *     height: 3,
	 *     kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1]
	 *   })
	 *   .raw()
	 *   .toBuffer(function(err, data, info) {
	 *     // data contains the raw pixel data representing the convolution
	 *     // of the input image with the horizontal Sobel operator
	 *   });
	 *
	 * @param {Object} kernel
	 * @param {number} kernel.width - width of the kernel in pixels.
	 * @param {number} kernel.height - height of the kernel in pixels.
	 * @param {Array<number>} kernel.kernel - Array of length `width*height` containing the kernel values.
	 * @param {number} [kernel.scale=sum] - the scale of the kernel in pixels.
	 * @param {number} [kernel.offset=0] - the offset of the kernel in pixels.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function convolve (kernel) {
	  if (!is.object(kernel) || !Array.isArray(kernel.kernel) ||
	      !is.integer(kernel.width) || !is.integer(kernel.height) ||
	      !is.inRange(kernel.width, 3, 1001) || !is.inRange(kernel.height, 3, 1001) ||
	      kernel.height * kernel.width !== kernel.kernel.length
	  ) {
	    // must pass in a kernel
	    throw new Error('Invalid convolution kernel');
	  }
	  // Default scale is sum of kernel values
	  if (!is.integer(kernel.scale)) {
	    kernel.scale = kernel.kernel.reduce((a, b) => a + b, 0);
	  }
	  // Clip scale to a minimum value of 1
	  if (kernel.scale < 1) {
	    kernel.scale = 1;
	  }
	  if (!is.integer(kernel.offset)) {
	    kernel.offset = 0;
	  }
	  this.options.convKernel = kernel;
	  return this;
	}

	/**
	 * Any pixel value greater than or equal to the threshold value will be set to 255, otherwise it will be set to 0.
	 * @param {number} [threshold=128] - a value in the range 0-255 representing the level at which the threshold will be applied.
	 * @param {Object} [options]
	 * @param {Boolean} [options.greyscale=true] - convert to single channel greyscale.
	 * @param {Boolean} [options.grayscale=true] - alternative spelling for greyscale.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function threshold (threshold, options) {
	  if (!is.defined(threshold)) {
	    this.options.threshold = 128;
	  } else if (is.bool(threshold)) {
	    this.options.threshold = threshold ? 128 : 0;
	  } else if (is.integer(threshold) && is.inRange(threshold, 0, 255)) {
	    this.options.threshold = threshold;
	  } else {
	    throw is.invalidParameterError('threshold', 'integer between 0 and 255', threshold);
	  }
	  if (!is.object(options) || options.greyscale === true || options.grayscale === true) {
	    this.options.thresholdGrayscale = true;
	  } else {
	    this.options.thresholdGrayscale = false;
	  }
	  return this;
	}

	/**
	 * Perform a bitwise boolean operation with operand image.
	 *
	 * This operation creates an output image where each pixel is the result of
	 * the selected bitwise boolean `operation` between the corresponding pixels of the input images.
	 *
	 * @param {Buffer|string} operand - Buffer containing image data or string containing the path to an image file.
	 * @param {string} operator - one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively.
	 * @param {Object} [options]
	 * @param {Object} [options.raw] - describes operand when using raw pixel data.
	 * @param {number} [options.raw.width]
	 * @param {number} [options.raw.height]
	 * @param {number} [options.raw.channels]
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function boolean (operand, operator, options) {
	  this.options.boolean = this._createInputDescriptor(operand, options);
	  if (is.string(operator) && is.inArray(operator, ['and', 'or', 'eor'])) {
	    this.options.booleanOp = operator;
	  } else {
	    throw is.invalidParameterError('operator', 'one of: and, or, eor', operator);
	  }
	  return this;
	}

	/**
	 * Apply the linear formula `a` * input + `b` to the image to adjust image levels.
	 *
	 * When a single number is provided, it will be used for all image channels.
	 * When an array of numbers is provided, the array length must match the number of channels.
	 *
	 * @example
	 * await sharp(input)
	 *   .linear(0.5, 2)
	 *   .toBuffer();
	 *
	 * @example
	 * await sharp(rgbInput)
	 *   .linear(
	 *     [0.25, 0.5, 0.75],
	 *     [150, 100, 50]
	 *   )
	 *   .toBuffer();
	 *
	 * @param {(number|number[])} [a=[]] multiplier
	 * @param {(number|number[])} [b=[]] offset
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function linear (a, b) {
	  if (!is.defined(a) && is.number(b)) {
	    a = 1.0;
	  } else if (is.number(a) && !is.defined(b)) {
	    b = 0.0;
	  }
	  if (!is.defined(a)) {
	    this.options.linearA = [];
	  } else if (is.number(a)) {
	    this.options.linearA = [a];
	  } else if (Array.isArray(a) && a.length && a.every(is.number)) {
	    this.options.linearA = a;
	  } else {
	    throw is.invalidParameterError('a', 'number or array of numbers', a);
	  }
	  if (!is.defined(b)) {
	    this.options.linearB = [];
	  } else if (is.number(b)) {
	    this.options.linearB = [b];
	  } else if (Array.isArray(b) && b.length && b.every(is.number)) {
	    this.options.linearB = b;
	  } else {
	    throw is.invalidParameterError('b', 'number or array of numbers', b);
	  }
	  if (this.options.linearA.length !== this.options.linearB.length) {
	    throw new Error('Expected a and b to be arrays of the same length');
	  }
	  return this;
	}

	/**
	 * Recombine the image with the specified matrix.
	 *
	 * @since 0.21.1
	 *
	 * @example
	 * sharp(input)
	 *   .recomb([
	 *    [0.3588, 0.7044, 0.1368],
	 *    [0.2990, 0.5870, 0.1140],
	 *    [0.2392, 0.4696, 0.0912],
	 *   ])
	 *   .raw()
	 *   .toBuffer(function(err, data, info) {
	 *     // data contains the raw pixel data after applying the matrix
	 *     // With this example input, a sepia filter has been applied
	 *   });
	 *
	 * @param {Array<Array<number>>} inputMatrix - 3x3 or 4x4 Recombination matrix
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function recomb (inputMatrix) {
	  if (!Array.isArray(inputMatrix)) {
	    throw is.invalidParameterError('inputMatrix', 'array', inputMatrix);
	  }
	  if (inputMatrix.length !== 3 && inputMatrix.length !== 4) {
	    throw is.invalidParameterError('inputMatrix', '3x3 or 4x4 array', inputMatrix.length);
	  }
	  const recombMatrix = inputMatrix.flat().map(Number);
	  if (recombMatrix.length !== 9 && recombMatrix.length !== 16) {
	    throw is.invalidParameterError('inputMatrix', 'cardinality of 9 or 16', recombMatrix.length);
	  }
	  this.options.recombMatrix = recombMatrix;
	  return this;
	}

	/**
	 * Transforms the image using brightness, saturation, hue rotation, and lightness.
	 * Brightness and lightness both operate on luminance, with the difference being that
	 * brightness is multiplicative whereas lightness is additive.
	 *
	 * @since 0.22.1
	 *
	 * @example
	 * // increase brightness by a factor of 2
	 * const output = await sharp(input)
	 *   .modulate({
	 *     brightness: 2
	 *   })
	 *   .toBuffer();
	 *
	 * @example
	 * // hue-rotate by 180 degrees
	 * const output = await sharp(input)
	 *   .modulate({
	 *     hue: 180
	 *   })
	 *   .toBuffer();
	 *
	 * @example
	 * // increase lightness by +50
	 * const output = await sharp(input)
	 *   .modulate({
	 *     lightness: 50
	 *   })
	 *   .toBuffer();
	 *
	 * @example
	 * // decrease brightness and saturation while also hue-rotating by 90 degrees
	 * const output = await sharp(input)
	 *   .modulate({
	 *     brightness: 0.5,
	 *     saturation: 0.5,
	 *     hue: 90,
	 *   })
	 *   .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {number} [options.brightness] Brightness multiplier
	 * @param {number} [options.saturation] Saturation multiplier
	 * @param {number} [options.hue] Degrees for hue rotation
	 * @param {number} [options.lightness] Lightness addend
	 * @returns {Sharp}
	 */
	function modulate (options) {
	  if (!is.plainObject(options)) {
	    throw is.invalidParameterError('options', 'plain object', options);
	  }
	  if ('brightness' in options) {
	    if (is.number(options.brightness) && options.brightness >= 0) {
	      this.options.brightness = options.brightness;
	    } else {
	      throw is.invalidParameterError('brightness', 'number above zero', options.brightness);
	    }
	  }
	  if ('saturation' in options) {
	    if (is.number(options.saturation) && options.saturation >= 0) {
	      this.options.saturation = options.saturation;
	    } else {
	      throw is.invalidParameterError('saturation', 'number above zero', options.saturation);
	    }
	  }
	  if ('hue' in options) {
	    if (is.integer(options.hue)) {
	      this.options.hue = options.hue % 360;
	    } else {
	      throw is.invalidParameterError('hue', 'number', options.hue);
	    }
	  }
	  if ('lightness' in options) {
	    if (is.number(options.lightness)) {
	      this.options.lightness = options.lightness;
	    } else {
	      throw is.invalidParameterError('lightness', 'number', options.lightness);
	    }
	  }
	  return this;
	}

	/**
	 * Decorate the Sharp prototype with operation-related functions.
	 * @module Sharp
	 * @private
	 */
	operation = (Sharp) => {
	  Object.assign(Sharp.prototype, {
	    autoOrient,
	    rotate,
	    flip,
	    flop,
	    affine,
	    sharpen,
	    erode,
	    dilate,
	    median,
	    blur,
	    flatten,
	    unflatten,
	    gamma,
	    negate,
	    normalise,
	    normalize,
	    clahe,
	    convolve,
	    threshold,
	    boolean,
	    linear,
	    recomb,
	    modulate
	  });
	};
	return operation;
}

var color;
var hasRequiredColor;

function requireColor () {
	if (hasRequiredColor) return color;
	hasRequiredColor = 1;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __export = (target, all) => {
	  for (var name in all)
	    __defProp(target, name, { get: all[name], enumerable: true });
	};
	var __copyProps = (to, from, except, desc) => {
	  if (from && typeof from === "object" || typeof from === "function") {
	    for (let key of __getOwnPropNames(from))
	      if (!__hasOwnProp.call(to, key) && key !== except)
	        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
	  }
	  return to;
	};
	var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

	// node_modules/color/index.js
	var index_exports = {};
	__export(index_exports, {
	  default: () => index_default
	});
	color = __toCommonJS(index_exports);

	// node_modules/color-name/index.js
	var colors = {
	  aliceblue: [240, 248, 255],
	  antiquewhite: [250, 235, 215],
	  aqua: [0, 255, 255],
	  aquamarine: [127, 255, 212],
	  azure: [240, 255, 255],
	  beige: [245, 245, 220],
	  bisque: [255, 228, 196],
	  black: [0, 0, 0],
	  blanchedalmond: [255, 235, 205],
	  blue: [0, 0, 255],
	  blueviolet: [138, 43, 226],
	  brown: [165, 42, 42],
	  burlywood: [222, 184, 135],
	  cadetblue: [95, 158, 160],
	  chartreuse: [127, 255, 0],
	  chocolate: [210, 105, 30],
	  coral: [255, 127, 80],
	  cornflowerblue: [100, 149, 237],
	  cornsilk: [255, 248, 220],
	  crimson: [220, 20, 60],
	  cyan: [0, 255, 255],
	  darkblue: [0, 0, 139],
	  darkcyan: [0, 139, 139],
	  darkgoldenrod: [184, 134, 11],
	  darkgray: [169, 169, 169],
	  darkgreen: [0, 100, 0],
	  darkgrey: [169, 169, 169],
	  darkkhaki: [189, 183, 107],
	  darkmagenta: [139, 0, 139],
	  darkolivegreen: [85, 107, 47],
	  darkorange: [255, 140, 0],
	  darkorchid: [153, 50, 204],
	  darkred: [139, 0, 0],
	  darksalmon: [233, 150, 122],
	  darkseagreen: [143, 188, 143],
	  darkslateblue: [72, 61, 139],
	  darkslategray: [47, 79, 79],
	  darkslategrey: [47, 79, 79],
	  darkturquoise: [0, 206, 209],
	  darkviolet: [148, 0, 211],
	  deeppink: [255, 20, 147],
	  deepskyblue: [0, 191, 255],
	  dimgray: [105, 105, 105],
	  dimgrey: [105, 105, 105],
	  dodgerblue: [30, 144, 255],
	  firebrick: [178, 34, 34],
	  floralwhite: [255, 250, 240],
	  forestgreen: [34, 139, 34],
	  fuchsia: [255, 0, 255],
	  gainsboro: [220, 220, 220],
	  ghostwhite: [248, 248, 255],
	  gold: [255, 215, 0],
	  goldenrod: [218, 165, 32],
	  gray: [128, 128, 128],
	  green: [0, 128, 0],
	  greenyellow: [173, 255, 47],
	  grey: [128, 128, 128],
	  honeydew: [240, 255, 240],
	  hotpink: [255, 105, 180],
	  indianred: [205, 92, 92],
	  indigo: [75, 0, 130],
	  ivory: [255, 255, 240],
	  khaki: [240, 230, 140],
	  lavender: [230, 230, 250],
	  lavenderblush: [255, 240, 245],
	  lawngreen: [124, 252, 0],
	  lemonchiffon: [255, 250, 205],
	  lightblue: [173, 216, 230],
	  lightcoral: [240, 128, 128],
	  lightcyan: [224, 255, 255],
	  lightgoldenrodyellow: [250, 250, 210],
	  lightgray: [211, 211, 211],
	  lightgreen: [144, 238, 144],
	  lightgrey: [211, 211, 211],
	  lightpink: [255, 182, 193],
	  lightsalmon: [255, 160, 122],
	  lightseagreen: [32, 178, 170],
	  lightskyblue: [135, 206, 250],
	  lightslategray: [119, 136, 153],
	  lightslategrey: [119, 136, 153],
	  lightsteelblue: [176, 196, 222],
	  lightyellow: [255, 255, 224],
	  lime: [0, 255, 0],
	  limegreen: [50, 205, 50],
	  linen: [250, 240, 230],
	  magenta: [255, 0, 255],
	  maroon: [128, 0, 0],
	  mediumaquamarine: [102, 205, 170],
	  mediumblue: [0, 0, 205],
	  mediumorchid: [186, 85, 211],
	  mediumpurple: [147, 112, 219],
	  mediumseagreen: [60, 179, 113],
	  mediumslateblue: [123, 104, 238],
	  mediumspringgreen: [0, 250, 154],
	  mediumturquoise: [72, 209, 204],
	  mediumvioletred: [199, 21, 133],
	  midnightblue: [25, 25, 112],
	  mintcream: [245, 255, 250],
	  mistyrose: [255, 228, 225],
	  moccasin: [255, 228, 181],
	  navajowhite: [255, 222, 173],
	  navy: [0, 0, 128],
	  oldlace: [253, 245, 230],
	  olive: [128, 128, 0],
	  olivedrab: [107, 142, 35],
	  orange: [255, 165, 0],
	  orangered: [255, 69, 0],
	  orchid: [218, 112, 214],
	  palegoldenrod: [238, 232, 170],
	  palegreen: [152, 251, 152],
	  paleturquoise: [175, 238, 238],
	  palevioletred: [219, 112, 147],
	  papayawhip: [255, 239, 213],
	  peachpuff: [255, 218, 185],
	  peru: [205, 133, 63],
	  pink: [255, 192, 203],
	  plum: [221, 160, 221],
	  powderblue: [176, 224, 230],
	  purple: [128, 0, 128],
	  rebeccapurple: [102, 51, 153],
	  red: [255, 0, 0],
	  rosybrown: [188, 143, 143],
	  royalblue: [65, 105, 225],
	  saddlebrown: [139, 69, 19],
	  salmon: [250, 128, 114],
	  sandybrown: [244, 164, 96],
	  seagreen: [46, 139, 87],
	  seashell: [255, 245, 238],
	  sienna: [160, 82, 45],
	  silver: [192, 192, 192],
	  skyblue: [135, 206, 235],
	  slateblue: [106, 90, 205],
	  slategray: [112, 128, 144],
	  slategrey: [112, 128, 144],
	  snow: [255, 250, 250],
	  springgreen: [0, 255, 127],
	  steelblue: [70, 130, 180],
	  tan: [210, 180, 140],
	  teal: [0, 128, 128],
	  thistle: [216, 191, 216],
	  tomato: [255, 99, 71],
	  turquoise: [64, 224, 208],
	  violet: [238, 130, 238],
	  wheat: [245, 222, 179],
	  white: [255, 255, 255],
	  whitesmoke: [245, 245, 245],
	  yellow: [255, 255, 0],
	  yellowgreen: [154, 205, 50]
	};
	for (const key in colors) Object.freeze(colors[key]);
	var color_name_default = Object.freeze(colors);

	// node_modules/color-string/index.js
	var reverseNames = /* @__PURE__ */ Object.create(null);
	for (const name in color_name_default) {
	  if (Object.hasOwn(color_name_default, name)) {
	    reverseNames[color_name_default[name]] = name;
	  }
	}
	var cs = {
	  to: {},
	  get: {}
	};
	cs.get = function(string) {
	  const prefix = string.slice(0, 3).toLowerCase();
	  let value;
	  let model;
	  switch (prefix) {
	    case "hsl": {
	      value = cs.get.hsl(string);
	      model = "hsl";
	      break;
	    }
	    case "hwb": {
	      value = cs.get.hwb(string);
	      model = "hwb";
	      break;
	    }
	    default: {
	      value = cs.get.rgb(string);
	      model = "rgb";
	      break;
	    }
	  }
	  if (!value) {
	    return null;
	  }
	  return { model, value };
	};
	cs.get.rgb = function(string) {
	  if (!string) {
	    return null;
	  }
	  const abbr = /^#([a-f\d]{3,4})$/i;
	  const hex = /^#([a-f\d]{6})([a-f\d]{2})?$/i;
	  const rgba = /^rgba?\(\s*([+-]?(?:\d*\.)?\d+(?:e\d+)?)(?=[\s,])\s*(?:,\s*)?([+-]?(?:\d*\.)?\d+(?:e\d+)?)(?=[\s,])\s*(?:,\s*)?([+-]?(?:\d*\.)?\d+(?:e\d+)?)\s*(?:[\s,|/]\s*([+-]?(?:\d*\.)?\d+(?:e\d+)?)(%?)\s*)?\)$/i;
	  const per = /^rgba?\(\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/i;
	  const keyword = /^(\w+)$/;
	  let rgb = [0, 0, 0, 1];
	  let match;
	  let i;
	  let hexAlpha;
	  if (match = string.match(hex)) {
	    hexAlpha = match[2];
	    match = match[1];
	    for (i = 0; i < 3; i++) {
	      const i2 = i * 2;
	      rgb[i] = Number.parseInt(match.slice(i2, i2 + 2), 16);
	    }
	    if (hexAlpha) {
	      rgb[3] = Number.parseInt(hexAlpha, 16) / 255;
	    }
	  } else if (match = string.match(abbr)) {
	    match = match[1];
	    hexAlpha = match[3];
	    for (i = 0; i < 3; i++) {
	      rgb[i] = Number.parseInt(match[i] + match[i], 16);
	    }
	    if (hexAlpha) {
	      rgb[3] = Number.parseInt(hexAlpha + hexAlpha, 16) / 255;
	    }
	  } else if (match = string.match(rgba)) {
	    for (i = 0; i < 3; i++) {
	      rgb[i] = Number.parseFloat(match[i + 1]);
	    }
	    if (match[4]) {
	      rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
	    }
	  } else if (match = string.match(per)) {
	    for (i = 0; i < 3; i++) {
	      rgb[i] = Math.round(Number.parseFloat(match[i + 1]) * 2.55);
	    }
	    if (match[4]) {
	      rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
	    }
	  } else if (match = string.toLowerCase().match(keyword)) {
	    if (match[1] === "transparent") {
	      return [0, 0, 0, 0];
	    }
	    if (!Object.hasOwn(color_name_default, match[1])) {
	      return null;
	    }
	    rgb = color_name_default[match[1]].slice();
	    rgb[3] = 1;
	    return rgb;
	  } else {
	    return null;
	  }
	  for (i = 0; i < 3; i++) {
	    rgb[i] = clamp(rgb[i], 0, 255);
	  }
	  rgb[3] = clamp(rgb[3], 0, 1);
	  return rgb;
	};
	cs.get.hsl = function(string) {
	  if (!string) {
	    return null;
	  }
	  const hsl = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[,|/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;
	  const match = string.match(hsl);
	  if (match) {
	    const alpha = Number.parseFloat(match[4]);
	    const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
	    const s = clamp(Number.parseFloat(match[2]), 0, 100);
	    const l = clamp(Number.parseFloat(match[3]), 0, 100);
	    const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
	    return [h, s, l, a];
	  }
	  return null;
	};
	cs.get.hwb = function(string) {
	  if (!string) {
	    return null;
	  }
	  const hwb = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*[\s,]\s*([+-]?[\d.]+)%\s*[\s,]\s*([+-]?[\d.]+)%\s*(?:[\s,]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:e[+-]?\d+)?)\s*)?\)$/i;
	  const match = string.match(hwb);
	  if (match) {
	    const alpha = Number.parseFloat(match[4]);
	    const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
	    const w = clamp(Number.parseFloat(match[2]), 0, 100);
	    const b = clamp(Number.parseFloat(match[3]), 0, 100);
	    const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
	    return [h, w, b, a];
	  }
	  return null;
	};
	cs.to.hex = function(...rgba) {
	  return "#" + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : "");
	};
	cs.to.rgb = function(...rgba) {
	  return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ")" : "rgba(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ", " + rgba[3] + ")";
	};
	cs.to.rgb.percent = function(...rgba) {
	  const r = Math.round(rgba[0] / 255 * 100);
	  const g = Math.round(rgba[1] / 255 * 100);
	  const b = Math.round(rgba[2] / 255 * 100);
	  return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + r + "%, " + g + "%, " + b + "%)" : "rgba(" + r + "%, " + g + "%, " + b + "%, " + rgba[3] + ")";
	};
	cs.to.hsl = function(...hsla) {
	  return hsla.length < 4 || hsla[3] === 1 ? "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)" : "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, " + hsla[3] + ")";
	};
	cs.to.hwb = function(...hwba) {
	  let a = "";
	  if (hwba.length >= 4 && hwba[3] !== 1) {
	    a = ", " + hwba[3];
	  }
	  return "hwb(" + hwba[0] + ", " + hwba[1] + "%, " + hwba[2] + "%" + a + ")";
	};
	cs.to.keyword = function(...rgb) {
	  return reverseNames[rgb.slice(0, 3)];
	};
	function clamp(number_, min, max) {
	  return Math.min(Math.max(min, number_), max);
	}
	function hexDouble(number_) {
	  const string_ = Math.round(number_).toString(16).toUpperCase();
	  return string_.length < 2 ? "0" + string_ : string_;
	}
	var color_string_default = cs;

	// node_modules/color-convert/conversions.js
	var reverseKeywords = {};
	for (const key of Object.keys(color_name_default)) {
	  reverseKeywords[color_name_default[key]] = key;
	}
	var convert = {
	  rgb: { channels: 3, labels: "rgb" },
	  hsl: { channels: 3, labels: "hsl" },
	  hsv: { channels: 3, labels: "hsv" },
	  hwb: { channels: 3, labels: "hwb" },
	  cmyk: { channels: 4, labels: "cmyk" },
	  xyz: { channels: 3, labels: "xyz" },
	  lab: { channels: 3, labels: "lab" },
	  oklab: { channels: 3, labels: ["okl", "oka", "okb"] },
	  lch: { channels: 3, labels: "lch" },
	  oklch: { channels: 3, labels: ["okl", "okc", "okh"] },
	  hex: { channels: 1, labels: ["hex"] },
	  keyword: { channels: 1, labels: ["keyword"] },
	  ansi16: { channels: 1, labels: ["ansi16"] },
	  ansi256: { channels: 1, labels: ["ansi256"] },
	  hcg: { channels: 3, labels: ["h", "c", "g"] },
	  apple: { channels: 3, labels: ["r16", "g16", "b16"] },
	  gray: { channels: 1, labels: ["gray"] }
	};
	var conversions_default = convert;
	var LAB_FT = (6 / 29) ** 3;
	function srgbNonlinearTransform(c) {
	  const cc = c > 31308e-7 ? 1.055 * c ** (1 / 2.4) - 0.055 : c * 12.92;
	  return Math.min(Math.max(0, cc), 1);
	}
	function srgbNonlinearTransformInv(c) {
	  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
	}
	for (const model of Object.keys(convert)) {
	  if (!("channels" in convert[model])) {
	    throw new Error("missing channels property: " + model);
	  }
	  if (!("labels" in convert[model])) {
	    throw new Error("missing channel labels property: " + model);
	  }
	  if (convert[model].labels.length !== convert[model].channels) {
	    throw new Error("channel and label counts mismatch: " + model);
	  }
	  const { channels, labels } = convert[model];
	  delete convert[model].channels;
	  delete convert[model].labels;
	  Object.defineProperty(convert[model], "channels", { value: channels });
	  Object.defineProperty(convert[model], "labels", { value: labels });
	}
	convert.rgb.hsl = function(rgb) {
	  const r = rgb[0] / 255;
	  const g = rgb[1] / 255;
	  const b = rgb[2] / 255;
	  const min = Math.min(r, g, b);
	  const max = Math.max(r, g, b);
	  const delta = max - min;
	  let h;
	  let s;
	  switch (max) {
	    case min: {
	      h = 0;
	      break;
	    }
	    case r: {
	      h = (g - b) / delta;
	      break;
	    }
	    case g: {
	      h = 2 + (b - r) / delta;
	      break;
	    }
	    case b: {
	      h = 4 + (r - g) / delta;
	      break;
	    }
	  }
	  h = Math.min(h * 60, 360);
	  if (h < 0) {
	    h += 360;
	  }
	  const l = (min + max) / 2;
	  if (max === min) {
	    s = 0;
	  } else if (l <= 0.5) {
	    s = delta / (max + min);
	  } else {
	    s = delta / (2 - max - min);
	  }
	  return [h, s * 100, l * 100];
	};
	convert.rgb.hsv = function(rgb) {
	  let rdif;
	  let gdif;
	  let bdif;
	  let h;
	  let s;
	  const r = rgb[0] / 255;
	  const g = rgb[1] / 255;
	  const b = rgb[2] / 255;
	  const v = Math.max(r, g, b);
	  const diff = v - Math.min(r, g, b);
	  const diffc = function(c) {
	    return (v - c) / 6 / diff + 1 / 2;
	  };
	  if (diff === 0) {
	    h = 0;
	    s = 0;
	  } else {
	    s = diff / v;
	    rdif = diffc(r);
	    gdif = diffc(g);
	    bdif = diffc(b);
	    switch (v) {
	      case r: {
	        h = bdif - gdif;
	        break;
	      }
	      case g: {
	        h = 1 / 3 + rdif - bdif;
	        break;
	      }
	      case b: {
	        h = 2 / 3 + gdif - rdif;
	        break;
	      }
	    }
	    if (h < 0) {
	      h += 1;
	    } else if (h > 1) {
	      h -= 1;
	    }
	  }
	  return [
	    h * 360,
	    s * 100,
	    v * 100
	  ];
	};
	convert.rgb.hwb = function(rgb) {
	  const r = rgb[0];
	  const g = rgb[1];
	  let b = rgb[2];
	  const h = convert.rgb.hsl(rgb)[0];
	  const w = 1 / 255 * Math.min(r, Math.min(g, b));
	  b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
	  return [h, w * 100, b * 100];
	};
	convert.rgb.oklab = function(rgb) {
	  const r = srgbNonlinearTransformInv(rgb[0] / 255);
	  const g = srgbNonlinearTransformInv(rgb[1] / 255);
	  const b = srgbNonlinearTransformInv(rgb[2] / 255);
	  const lp = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	  const mp = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	  const sp = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	  const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
	  const aa = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
	  const bb = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
	  return [l * 100, aa * 100, bb * 100];
	};
	convert.rgb.cmyk = function(rgb) {
	  const r = rgb[0] / 255;
	  const g = rgb[1] / 255;
	  const b = rgb[2] / 255;
	  const k = Math.min(1 - r, 1 - g, 1 - b);
	  const c = (1 - r - k) / (1 - k) || 0;
	  const m = (1 - g - k) / (1 - k) || 0;
	  const y = (1 - b - k) / (1 - k) || 0;
	  return [c * 100, m * 100, y * 100, k * 100];
	};
	function comparativeDistance(x, y) {
	  return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
	}
	convert.rgb.keyword = function(rgb) {
	  const reversed = reverseKeywords[rgb];
	  if (reversed) {
	    return reversed;
	  }
	  let currentClosestDistance = Number.POSITIVE_INFINITY;
	  let currentClosestKeyword;
	  for (const keyword of Object.keys(color_name_default)) {
	    const value = color_name_default[keyword];
	    const distance = comparativeDistance(rgb, value);
	    if (distance < currentClosestDistance) {
	      currentClosestDistance = distance;
	      currentClosestKeyword = keyword;
	    }
	  }
	  return currentClosestKeyword;
	};
	convert.keyword.rgb = function(keyword) {
	  return [...color_name_default[keyword]];
	};
	convert.rgb.xyz = function(rgb) {
	  const r = srgbNonlinearTransformInv(rgb[0] / 255);
	  const g = srgbNonlinearTransformInv(rgb[1] / 255);
	  const b = srgbNonlinearTransformInv(rgb[2] / 255);
	  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
	  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
	  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
	  return [x * 100, y * 100, z * 100];
	};
	convert.rgb.lab = function(rgb) {
	  const xyz = convert.rgb.xyz(rgb);
	  let x = xyz[0];
	  let y = xyz[1];
	  let z = xyz[2];
	  x /= 95.047;
	  y /= 100;
	  z /= 108.883;
	  x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
	  y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
	  z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
	  const l = 116 * y - 16;
	  const a = 500 * (x - y);
	  const b = 200 * (y - z);
	  return [l, a, b];
	};
	convert.hsl.rgb = function(hsl) {
	  const h = hsl[0] / 360;
	  const s = hsl[1] / 100;
	  const l = hsl[2] / 100;
	  let t3;
	  let value;
	  if (s === 0) {
	    value = l * 255;
	    return [value, value, value];
	  }
	  const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
	  const t1 = 2 * l - t2;
	  const rgb = [0, 0, 0];
	  for (let i = 0; i < 3; i++) {
	    t3 = h + 1 / 3 * -(i - 1);
	    if (t3 < 0) {
	      t3++;
	    }
	    if (t3 > 1) {
	      t3--;
	    }
	    if (6 * t3 < 1) {
	      value = t1 + (t2 - t1) * 6 * t3;
	    } else if (2 * t3 < 1) {
	      value = t2;
	    } else if (3 * t3 < 2) {
	      value = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
	    } else {
	      value = t1;
	    }
	    rgb[i] = value * 255;
	  }
	  return rgb;
	};
	convert.hsl.hsv = function(hsl) {
	  const h = hsl[0];
	  let s = hsl[1] / 100;
	  let l = hsl[2] / 100;
	  let smin = s;
	  const lmin = Math.max(l, 0.01);
	  l *= 2;
	  s *= l <= 1 ? l : 2 - l;
	  smin *= lmin <= 1 ? lmin : 2 - lmin;
	  const v = (l + s) / 2;
	  const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
	  return [h, sv * 100, v * 100];
	};
	convert.hsv.rgb = function(hsv) {
	  const h = hsv[0] / 60;
	  const s = hsv[1] / 100;
	  let v = hsv[2] / 100;
	  const hi = Math.floor(h) % 6;
	  const f = h - Math.floor(h);
	  const p = 255 * v * (1 - s);
	  const q = 255 * v * (1 - s * f);
	  const t = 255 * v * (1 - s * (1 - f));
	  v *= 255;
	  switch (hi) {
	    case 0: {
	      return [v, t, p];
	    }
	    case 1: {
	      return [q, v, p];
	    }
	    case 2: {
	      return [p, v, t];
	    }
	    case 3: {
	      return [p, q, v];
	    }
	    case 4: {
	      return [t, p, v];
	    }
	    case 5: {
	      return [v, p, q];
	    }
	  }
	};
	convert.hsv.hsl = function(hsv) {
	  const h = hsv[0];
	  const s = hsv[1] / 100;
	  const v = hsv[2] / 100;
	  const vmin = Math.max(v, 0.01);
	  let sl;
	  let l;
	  l = (2 - s) * v;
	  const lmin = (2 - s) * vmin;
	  sl = s * vmin;
	  sl /= lmin <= 1 ? lmin : 2 - lmin;
	  sl = sl || 0;
	  l /= 2;
	  return [h, sl * 100, l * 100];
	};
	convert.hwb.rgb = function(hwb) {
	  const h = hwb[0] / 360;
	  let wh = hwb[1] / 100;
	  let bl = hwb[2] / 100;
	  const ratio = wh + bl;
	  let f;
	  if (ratio > 1) {
	    wh /= ratio;
	    bl /= ratio;
	  }
	  const i = Math.floor(6 * h);
	  const v = 1 - bl;
	  f = 6 * h - i;
	  if ((i & 1) !== 0) {
	    f = 1 - f;
	  }
	  const n = wh + f * (v - wh);
	  let r;
	  let g;
	  let b;
	  switch (i) {
	    default:
	    case 6:
	    case 0: {
	      r = v;
	      g = n;
	      b = wh;
	      break;
	    }
	    case 1: {
	      r = n;
	      g = v;
	      b = wh;
	      break;
	    }
	    case 2: {
	      r = wh;
	      g = v;
	      b = n;
	      break;
	    }
	    case 3: {
	      r = wh;
	      g = n;
	      b = v;
	      break;
	    }
	    case 4: {
	      r = n;
	      g = wh;
	      b = v;
	      break;
	    }
	    case 5: {
	      r = v;
	      g = wh;
	      b = n;
	      break;
	    }
	  }
	  return [r * 255, g * 255, b * 255];
	};
	convert.cmyk.rgb = function(cmyk) {
	  const c = cmyk[0] / 100;
	  const m = cmyk[1] / 100;
	  const y = cmyk[2] / 100;
	  const k = cmyk[3] / 100;
	  const r = 1 - Math.min(1, c * (1 - k) + k);
	  const g = 1 - Math.min(1, m * (1 - k) + k);
	  const b = 1 - Math.min(1, y * (1 - k) + k);
	  return [r * 255, g * 255, b * 255];
	};
	convert.xyz.rgb = function(xyz) {
	  const x = xyz[0] / 100;
	  const y = xyz[1] / 100;
	  const z = xyz[2] / 100;
	  let r;
	  let g;
	  let b;
	  r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
	  g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
	  b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
	  r = srgbNonlinearTransform(r);
	  g = srgbNonlinearTransform(g);
	  b = srgbNonlinearTransform(b);
	  return [r * 255, g * 255, b * 255];
	};
	convert.xyz.lab = function(xyz) {
	  let x = xyz[0];
	  let y = xyz[1];
	  let z = xyz[2];
	  x /= 95.047;
	  y /= 100;
	  z /= 108.883;
	  x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
	  y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
	  z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
	  const l = 116 * y - 16;
	  const a = 500 * (x - y);
	  const b = 200 * (y - z);
	  return [l, a, b];
	};
	convert.xyz.oklab = function(xyz) {
	  const x = xyz[0] / 100;
	  const y = xyz[1] / 100;
	  const z = xyz[2] / 100;
	  const lp = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
	  const mp = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
	  const sp = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
	  const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
	  const a = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
	  const b = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
	  return [l * 100, a * 100, b * 100];
	};
	convert.oklab.oklch = function(oklab) {
	  return convert.lab.lch(oklab);
	};
	convert.oklab.xyz = function(oklab) {
	  const ll = oklab[0] / 100;
	  const a = oklab[1] / 100;
	  const b = oklab[2] / 100;
	  const l = (0.999999998 * ll + 0.396337792 * a + 0.215803758 * b) ** 3;
	  const m = (1.000000008 * ll - 0.105561342 * a - 0.063854175 * b) ** 3;
	  const s = (1.000000055 * ll - 0.089484182 * a - 1.291485538 * b) ** 3;
	  const x = 1.227013851 * l - 0.55779998 * m + 0.281256149 * s;
	  const y = -0.040580178 * l + 1.11225687 * m - 0.071676679 * s;
	  const z = -0.076381285 * l - 0.421481978 * m + 1.58616322 * s;
	  return [x * 100, y * 100, z * 100];
	};
	convert.oklab.rgb = function(oklab) {
	  const ll = oklab[0] / 100;
	  const aa = oklab[1] / 100;
	  const bb = oklab[2] / 100;
	  const l = (ll + 0.3963377774 * aa + 0.2158037573 * bb) ** 3;
	  const m = (ll - 0.1055613458 * aa - 0.0638541728 * bb) ** 3;
	  const s = (ll - 0.0894841775 * aa - 1.291485548 * bb) ** 3;
	  const r = srgbNonlinearTransform(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
	  const g = srgbNonlinearTransform(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
	  const b = srgbNonlinearTransform(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
	  return [r * 255, g * 255, b * 255];
	};
	convert.oklch.oklab = function(oklch) {
	  return convert.lch.lab(oklch);
	};
	convert.lab.xyz = function(lab) {
	  const l = lab[0];
	  const a = lab[1];
	  const b = lab[2];
	  let x;
	  let y;
	  let z;
	  y = (l + 16) / 116;
	  x = a / 500 + y;
	  z = y - b / 200;
	  const y2 = y ** 3;
	  const x2 = x ** 3;
	  const z2 = z ** 3;
	  y = y2 > LAB_FT ? y2 : (y - 16 / 116) / 7.787;
	  x = x2 > LAB_FT ? x2 : (x - 16 / 116) / 7.787;
	  z = z2 > LAB_FT ? z2 : (z - 16 / 116) / 7.787;
	  x *= 95.047;
	  y *= 100;
	  z *= 108.883;
	  return [x, y, z];
	};
	convert.lab.lch = function(lab) {
	  const l = lab[0];
	  const a = lab[1];
	  const b = lab[2];
	  let h;
	  const hr = Math.atan2(b, a);
	  h = hr * 360 / 2 / Math.PI;
	  if (h < 0) {
	    h += 360;
	  }
	  const c = Math.sqrt(a * a + b * b);
	  return [l, c, h];
	};
	convert.lch.lab = function(lch) {
	  const l = lch[0];
	  const c = lch[1];
	  const h = lch[2];
	  const hr = h / 360 * 2 * Math.PI;
	  const a = c * Math.cos(hr);
	  const b = c * Math.sin(hr);
	  return [l, a, b];
	};
	convert.rgb.ansi16 = function(args, saturation = null) {
	  const [r, g, b] = args;
	  let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
	  value = Math.round(value / 50);
	  if (value === 0) {
	    return 30;
	  }
	  let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
	  if (value === 2) {
	    ansi += 60;
	  }
	  return ansi;
	};
	convert.hsv.ansi16 = function(args) {
	  return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
	};
	convert.rgb.ansi256 = function(args) {
	  const r = args[0];
	  const g = args[1];
	  const b = args[2];
	  if (r >> 4 === g >> 4 && g >> 4 === b >> 4) {
	    if (r < 8) {
	      return 16;
	    }
	    if (r > 248) {
	      return 231;
	    }
	    return Math.round((r - 8) / 247 * 24) + 232;
	  }
	  const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
	  return ansi;
	};
	convert.ansi16.rgb = function(args) {
	  args = args[0];
	  let color = args % 10;
	  if (color === 0 || color === 7) {
	    if (args > 50) {
	      color += 3.5;
	    }
	    color = color / 10.5 * 255;
	    return [color, color, color];
	  }
	  const mult = (Math.trunc(args > 50) + 1) * 0.5;
	  const r = (color & 1) * mult * 255;
	  const g = (color >> 1 & 1) * mult * 255;
	  const b = (color >> 2 & 1) * mult * 255;
	  return [r, g, b];
	};
	convert.ansi256.rgb = function(args) {
	  args = args[0];
	  if (args >= 232) {
	    const c = (args - 232) * 10 + 8;
	    return [c, c, c];
	  }
	  args -= 16;
	  let rem;
	  const r = Math.floor(args / 36) / 5 * 255;
	  const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	  const b = rem % 6 / 5 * 255;
	  return [r, g, b];
	};
	convert.rgb.hex = function(args) {
	  const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
	  const string = integer.toString(16).toUpperCase();
	  return "000000".slice(string.length) + string;
	};
	convert.hex.rgb = function(args) {
	  const match = args.toString(16).match(/[a-f\d]{6}|[a-f\d]{3}/i);
	  if (!match) {
	    return [0, 0, 0];
	  }
	  let colorString = match[0];
	  if (match[0].length === 3) {
	    colorString = [...colorString].map((char) => char + char).join("");
	  }
	  const integer = Number.parseInt(colorString, 16);
	  const r = integer >> 16 & 255;
	  const g = integer >> 8 & 255;
	  const b = integer & 255;
	  return [r, g, b];
	};
	convert.rgb.hcg = function(rgb) {
	  const r = rgb[0] / 255;
	  const g = rgb[1] / 255;
	  const b = rgb[2] / 255;
	  const max = Math.max(Math.max(r, g), b);
	  const min = Math.min(Math.min(r, g), b);
	  const chroma = max - min;
	  let hue;
	  const grayscale = chroma < 1 ? min / (1 - chroma) : 0;
	  if (chroma <= 0) {
	    hue = 0;
	  } else if (max === r) {
	    hue = (g - b) / chroma % 6;
	  } else if (max === g) {
	    hue = 2 + (b - r) / chroma;
	  } else {
	    hue = 4 + (r - g) / chroma;
	  }
	  hue /= 6;
	  hue %= 1;
	  return [hue * 360, chroma * 100, grayscale * 100];
	};
	convert.hsl.hcg = function(hsl) {
	  const s = hsl[1] / 100;
	  const l = hsl[2] / 100;
	  const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
	  let f = 0;
	  if (c < 1) {
	    f = (l - 0.5 * c) / (1 - c);
	  }
	  return [hsl[0], c * 100, f * 100];
	};
	convert.hsv.hcg = function(hsv) {
	  const s = hsv[1] / 100;
	  const v = hsv[2] / 100;
	  const c = s * v;
	  let f = 0;
	  if (c < 1) {
	    f = (v - c) / (1 - c);
	  }
	  return [hsv[0], c * 100, f * 100];
	};
	convert.hcg.rgb = function(hcg) {
	  const h = hcg[0] / 360;
	  const c = hcg[1] / 100;
	  const g = hcg[2] / 100;
	  if (c === 0) {
	    return [g * 255, g * 255, g * 255];
	  }
	  const pure = [0, 0, 0];
	  const hi = h % 1 * 6;
	  const v = hi % 1;
	  const w = 1 - v;
	  let mg = 0;
	  switch (Math.floor(hi)) {
	    case 0: {
	      pure[0] = 1;
	      pure[1] = v;
	      pure[2] = 0;
	      break;
	    }
	    case 1: {
	      pure[0] = w;
	      pure[1] = 1;
	      pure[2] = 0;
	      break;
	    }
	    case 2: {
	      pure[0] = 0;
	      pure[1] = 1;
	      pure[2] = v;
	      break;
	    }
	    case 3: {
	      pure[0] = 0;
	      pure[1] = w;
	      pure[2] = 1;
	      break;
	    }
	    case 4: {
	      pure[0] = v;
	      pure[1] = 0;
	      pure[2] = 1;
	      break;
	    }
	    default: {
	      pure[0] = 1;
	      pure[1] = 0;
	      pure[2] = w;
	    }
	  }
	  mg = (1 - c) * g;
	  return [
	    (c * pure[0] + mg) * 255,
	    (c * pure[1] + mg) * 255,
	    (c * pure[2] + mg) * 255
	  ];
	};
	convert.hcg.hsv = function(hcg) {
	  const c = hcg[1] / 100;
	  const g = hcg[2] / 100;
	  const v = c + g * (1 - c);
	  let f = 0;
	  if (v > 0) {
	    f = c / v;
	  }
	  return [hcg[0], f * 100, v * 100];
	};
	convert.hcg.hsl = function(hcg) {
	  const c = hcg[1] / 100;
	  const g = hcg[2] / 100;
	  const l = g * (1 - c) + 0.5 * c;
	  let s = 0;
	  if (l > 0 && l < 0.5) {
	    s = c / (2 * l);
	  } else if (l >= 0.5 && l < 1) {
	    s = c / (2 * (1 - l));
	  }
	  return [hcg[0], s * 100, l * 100];
	};
	convert.hcg.hwb = function(hcg) {
	  const c = hcg[1] / 100;
	  const g = hcg[2] / 100;
	  const v = c + g * (1 - c);
	  return [hcg[0], (v - c) * 100, (1 - v) * 100];
	};
	convert.hwb.hcg = function(hwb) {
	  const w = hwb[1] / 100;
	  const b = hwb[2] / 100;
	  const v = 1 - b;
	  const c = v - w;
	  let g = 0;
	  if (c < 1) {
	    g = (v - c) / (1 - c);
	  }
	  return [hwb[0], c * 100, g * 100];
	};
	convert.apple.rgb = function(apple) {
	  return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
	};
	convert.rgb.apple = function(rgb) {
	  return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
	};
	convert.gray.rgb = function(args) {
	  return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
	};
	convert.gray.hsl = function(args) {
	  return [0, 0, args[0]];
	};
	convert.gray.hsv = convert.gray.hsl;
	convert.gray.hwb = function(gray) {
	  return [0, 100, gray[0]];
	};
	convert.gray.cmyk = function(gray) {
	  return [0, 0, 0, gray[0]];
	};
	convert.gray.lab = function(gray) {
	  return [gray[0], 0, 0];
	};
	convert.gray.hex = function(gray) {
	  const value = Math.round(gray[0] / 100 * 255) & 255;
	  const integer = (value << 16) + (value << 8) + value;
	  const string = integer.toString(16).toUpperCase();
	  return "000000".slice(string.length) + string;
	};
	convert.rgb.gray = function(rgb) {
	  const value = (rgb[0] + rgb[1] + rgb[2]) / 3;
	  return [value / 255 * 100];
	};

	// node_modules/color-convert/route.js
	function buildGraph() {
	  const graph = {};
	  const models2 = Object.keys(conversions_default);
	  for (let { length } = models2, i = 0; i < length; i++) {
	    graph[models2[i]] = {
	      // http://jsperf.com/1-vs-infinity
	      // micro-opt, but this is simple.
	      distance: -1,
	      parent: null
	    };
	  }
	  return graph;
	}
	function deriveBFS(fromModel) {
	  const graph = buildGraph();
	  const queue = [fromModel];
	  graph[fromModel].distance = 0;
	  while (queue.length > 0) {
	    const current = queue.pop();
	    const adjacents = Object.keys(conversions_default[current]);
	    for (let { length } = adjacents, i = 0; i < length; i++) {
	      const adjacent = adjacents[i];
	      const node = graph[adjacent];
	      if (node.distance === -1) {
	        node.distance = graph[current].distance + 1;
	        node.parent = current;
	        queue.unshift(adjacent);
	      }
	    }
	  }
	  return graph;
	}
	function link(from, to) {
	  return function(args) {
	    return to(from(args));
	  };
	}
	function wrapConversion(toModel, graph) {
	  const path = [graph[toModel].parent, toModel];
	  let fn = conversions_default[graph[toModel].parent][toModel];
	  let cur = graph[toModel].parent;
	  while (graph[cur].parent) {
	    path.unshift(graph[cur].parent);
	    fn = link(conversions_default[graph[cur].parent][cur], fn);
	    cur = graph[cur].parent;
	  }
	  fn.conversion = path;
	  return fn;
	}
	function route(fromModel) {
	  const graph = deriveBFS(fromModel);
	  const conversion = {};
	  const models2 = Object.keys(graph);
	  for (let { length } = models2, i = 0; i < length; i++) {
	    const toModel = models2[i];
	    const node = graph[toModel];
	    if (node.parent === null) {
	      continue;
	    }
	    conversion[toModel] = wrapConversion(toModel, graph);
	  }
	  return conversion;
	}
	var route_default = route;

	// node_modules/color-convert/index.js
	var convert2 = {};
	var models = Object.keys(conversions_default);
	function wrapRaw(fn) {
	  const wrappedFn = function(...args) {
	    const arg0 = args[0];
	    if (arg0 === void 0 || arg0 === null) {
	      return arg0;
	    }
	    if (arg0.length > 1) {
	      args = arg0;
	    }
	    return fn(args);
	  };
	  if ("conversion" in fn) {
	    wrappedFn.conversion = fn.conversion;
	  }
	  return wrappedFn;
	}
	function wrapRounded(fn) {
	  const wrappedFn = function(...args) {
	    const arg0 = args[0];
	    if (arg0 === void 0 || arg0 === null) {
	      return arg0;
	    }
	    if (arg0.length > 1) {
	      args = arg0;
	    }
	    const result = fn(args);
	    if (typeof result === "object") {
	      for (let { length } = result, i = 0; i < length; i++) {
	        result[i] = Math.round(result[i]);
	      }
	    }
	    return result;
	  };
	  if ("conversion" in fn) {
	    wrappedFn.conversion = fn.conversion;
	  }
	  return wrappedFn;
	}
	for (const fromModel of models) {
	  convert2[fromModel] = {};
	  Object.defineProperty(convert2[fromModel], "channels", { value: conversions_default[fromModel].channels });
	  Object.defineProperty(convert2[fromModel], "labels", { value: conversions_default[fromModel].labels });
	  const routes = route_default(fromModel);
	  const routeModels = Object.keys(routes);
	  for (const toModel of routeModels) {
	    const fn = routes[toModel];
	    convert2[fromModel][toModel] = wrapRounded(fn);
	    convert2[fromModel][toModel].raw = wrapRaw(fn);
	  }
	}
	var color_convert_default = convert2;

	// node_modules/color/index.js
	var skippedModels = [
	  // To be honest, I don't really feel like keyword belongs in color convert, but eh.
	  "keyword",
	  // Gray conflicts with some method names, and has its own method defined.
	  "gray",
	  // Shouldn't really be in color-convert either...
	  "hex"
	];
	var hashedModelKeys = {};
	for (const model of Object.keys(color_convert_default)) {
	  hashedModelKeys[[...color_convert_default[model].labels].sort().join("")] = model;
	}
	var limiters = {};
	function Color(object, model) {
	  if (!(this instanceof Color)) {
	    return new Color(object, model);
	  }
	  if (model && model in skippedModels) {
	    model = null;
	  }
	  if (model && !(model in color_convert_default)) {
	    throw new Error("Unknown model: " + model);
	  }
	  let i;
	  let channels;
	  if (object == null) {
	    this.model = "rgb";
	    this.color = [0, 0, 0];
	    this.valpha = 1;
	  } else if (object instanceof Color) {
	    this.model = object.model;
	    this.color = [...object.color];
	    this.valpha = object.valpha;
	  } else if (typeof object === "string") {
	    const result = color_string_default.get(object);
	    if (result === null) {
	      throw new Error("Unable to parse color from string: " + object);
	    }
	    this.model = result.model;
	    channels = color_convert_default[this.model].channels;
	    this.color = result.value.slice(0, channels);
	    this.valpha = typeof result.value[channels] === "number" ? result.value[channels] : 1;
	  } else if (object.length > 0) {
	    this.model = model || "rgb";
	    channels = color_convert_default[this.model].channels;
	    const newArray = Array.prototype.slice.call(object, 0, channels);
	    this.color = zeroArray(newArray, channels);
	    this.valpha = typeof object[channels] === "number" ? object[channels] : 1;
	  } else if (typeof object === "number") {
	    this.model = "rgb";
	    this.color = [
	      object >> 16 & 255,
	      object >> 8 & 255,
	      object & 255
	    ];
	    this.valpha = 1;
	  } else {
	    this.valpha = 1;
	    const keys = Object.keys(object);
	    if ("alpha" in object) {
	      keys.splice(keys.indexOf("alpha"), 1);
	      this.valpha = typeof object.alpha === "number" ? object.alpha : 0;
	    }
	    const hashedKeys = keys.sort().join("");
	    if (!(hashedKeys in hashedModelKeys)) {
	      throw new Error("Unable to parse color from object: " + JSON.stringify(object));
	    }
	    this.model = hashedModelKeys[hashedKeys];
	    const { labels } = color_convert_default[this.model];
	    const color = [];
	    for (i = 0; i < labels.length; i++) {
	      color.push(object[labels[i]]);
	    }
	    this.color = zeroArray(color);
	  }
	  if (limiters[this.model]) {
	    channels = color_convert_default[this.model].channels;
	    for (i = 0; i < channels; i++) {
	      const limit = limiters[this.model][i];
	      if (limit) {
	        this.color[i] = limit(this.color[i]);
	      }
	    }
	  }
	  this.valpha = Math.max(0, Math.min(1, this.valpha));
	  if (Object.freeze) {
	    Object.freeze(this);
	  }
	}
	Color.prototype = {
	  toString() {
	    return this.string();
	  },
	  toJSON() {
	    return this[this.model]();
	  },
	  string(places) {
	    let self = this.model in color_string_default.to ? this : this.rgb();
	    self = self.round(typeof places === "number" ? places : 1);
	    const arguments_ = self.valpha === 1 ? self.color : [...self.color, this.valpha];
	    return color_string_default.to[self.model](...arguments_);
	  },
	  percentString(places) {
	    const self = this.rgb().round(typeof places === "number" ? places : 1);
	    const arguments_ = self.valpha === 1 ? self.color : [...self.color, this.valpha];
	    return color_string_default.to.rgb.percent(...arguments_);
	  },
	  array() {
	    return this.valpha === 1 ? [...this.color] : [...this.color, this.valpha];
	  },
	  object() {
	    const result = {};
	    const { channels } = color_convert_default[this.model];
	    const { labels } = color_convert_default[this.model];
	    for (let i = 0; i < channels; i++) {
	      result[labels[i]] = this.color[i];
	    }
	    if (this.valpha !== 1) {
	      result.alpha = this.valpha;
	    }
	    return result;
	  },
	  unitArray() {
	    const rgb = this.rgb().color;
	    rgb[0] /= 255;
	    rgb[1] /= 255;
	    rgb[2] /= 255;
	    if (this.valpha !== 1) {
	      rgb.push(this.valpha);
	    }
	    return rgb;
	  },
	  unitObject() {
	    const rgb = this.rgb().object();
	    rgb.r /= 255;
	    rgb.g /= 255;
	    rgb.b /= 255;
	    if (this.valpha !== 1) {
	      rgb.alpha = this.valpha;
	    }
	    return rgb;
	  },
	  round(places) {
	    places = Math.max(places || 0, 0);
	    return new Color([...this.color.map(roundToPlace(places)), this.valpha], this.model);
	  },
	  alpha(value) {
	    if (value !== void 0) {
	      return new Color([...this.color, Math.max(0, Math.min(1, value))], this.model);
	    }
	    return this.valpha;
	  },
	  // Rgb
	  red: getset("rgb", 0, maxfn(255)),
	  green: getset("rgb", 1, maxfn(255)),
	  blue: getset("rgb", 2, maxfn(255)),
	  hue: getset(["hsl", "hsv", "hsl", "hwb", "hcg"], 0, (value) => (value % 360 + 360) % 360),
	  saturationl: getset("hsl", 1, maxfn(100)),
	  lightness: getset("hsl", 2, maxfn(100)),
	  saturationv: getset("hsv", 1, maxfn(100)),
	  value: getset("hsv", 2, maxfn(100)),
	  chroma: getset("hcg", 1, maxfn(100)),
	  gray: getset("hcg", 2, maxfn(100)),
	  white: getset("hwb", 1, maxfn(100)),
	  wblack: getset("hwb", 2, maxfn(100)),
	  cyan: getset("cmyk", 0, maxfn(100)),
	  magenta: getset("cmyk", 1, maxfn(100)),
	  yellow: getset("cmyk", 2, maxfn(100)),
	  black: getset("cmyk", 3, maxfn(100)),
	  x: getset("xyz", 0, maxfn(95.047)),
	  y: getset("xyz", 1, maxfn(100)),
	  z: getset("xyz", 2, maxfn(108.833)),
	  l: getset("lab", 0, maxfn(100)),
	  a: getset("lab", 1),
	  b: getset("lab", 2),
	  keyword(value) {
	    if (value !== void 0) {
	      return new Color(value);
	    }
	    return color_convert_default[this.model].keyword(this.color);
	  },
	  hex(value) {
	    if (value !== void 0) {
	      return new Color(value);
	    }
	    return color_string_default.to.hex(...this.rgb().round().color);
	  },
	  hexa(value) {
	    if (value !== void 0) {
	      return new Color(value);
	    }
	    const rgbArray = this.rgb().round().color;
	    let alphaHex = Math.round(this.valpha * 255).toString(16).toUpperCase();
	    if (alphaHex.length === 1) {
	      alphaHex = "0" + alphaHex;
	    }
	    return color_string_default.to.hex(...rgbArray) + alphaHex;
	  },
	  rgbNumber() {
	    const rgb = this.rgb().color;
	    return (rgb[0] & 255) << 16 | (rgb[1] & 255) << 8 | rgb[2] & 255;
	  },
	  luminosity() {
	    const rgb = this.rgb().color;
	    const lum = [];
	    for (const [i, element] of rgb.entries()) {
	      const chan = element / 255;
	      lum[i] = chan <= 0.04045 ? chan / 12.92 : ((chan + 0.055) / 1.055) ** 2.4;
	    }
	    return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
	  },
	  contrast(color2) {
	    const lum1 = this.luminosity();
	    const lum2 = color2.luminosity();
	    if (lum1 > lum2) {
	      return (lum1 + 0.05) / (lum2 + 0.05);
	    }
	    return (lum2 + 0.05) / (lum1 + 0.05);
	  },
	  level(color2) {
	    const contrastRatio = this.contrast(color2);
	    if (contrastRatio >= 7) {
	      return "AAA";
	    }
	    return contrastRatio >= 4.5 ? "AA" : "";
	  },
	  isDark() {
	    const rgb = this.rgb().color;
	    const yiq = (rgb[0] * 2126 + rgb[1] * 7152 + rgb[2] * 722) / 1e4;
	    return yiq < 128;
	  },
	  isLight() {
	    return !this.isDark();
	  },
	  negate() {
	    const rgb = this.rgb();
	    for (let i = 0; i < 3; i++) {
	      rgb.color[i] = 255 - rgb.color[i];
	    }
	    return rgb;
	  },
	  lighten(ratio) {
	    const hsl = this.hsl();
	    hsl.color[2] += hsl.color[2] * ratio;
	    return hsl;
	  },
	  darken(ratio) {
	    const hsl = this.hsl();
	    hsl.color[2] -= hsl.color[2] * ratio;
	    return hsl;
	  },
	  saturate(ratio) {
	    const hsl = this.hsl();
	    hsl.color[1] += hsl.color[1] * ratio;
	    return hsl;
	  },
	  desaturate(ratio) {
	    const hsl = this.hsl();
	    hsl.color[1] -= hsl.color[1] * ratio;
	    return hsl;
	  },
	  whiten(ratio) {
	    const hwb = this.hwb();
	    hwb.color[1] += hwb.color[1] * ratio;
	    return hwb;
	  },
	  blacken(ratio) {
	    const hwb = this.hwb();
	    hwb.color[2] += hwb.color[2] * ratio;
	    return hwb;
	  },
	  grayscale() {
	    const rgb = this.rgb().color;
	    const value = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
	    return Color.rgb(value, value, value);
	  },
	  fade(ratio) {
	    return this.alpha(this.valpha - this.valpha * ratio);
	  },
	  opaquer(ratio) {
	    return this.alpha(this.valpha + this.valpha * ratio);
	  },
	  rotate(degrees) {
	    const hsl = this.hsl();
	    let hue = hsl.color[0];
	    hue = (hue + degrees) % 360;
	    hue = hue < 0 ? 360 + hue : hue;
	    hsl.color[0] = hue;
	    return hsl;
	  },
	  mix(mixinColor, weight) {
	    if (!mixinColor || !mixinColor.rgb) {
	      throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof mixinColor);
	    }
	    const color1 = mixinColor.rgb();
	    const color2 = this.rgb();
	    const p = weight === void 0 ? 0.5 : weight;
	    const w = 2 * p - 1;
	    const a = color1.alpha() - color2.alpha();
	    const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2;
	    const w2 = 1 - w1;
	    return Color.rgb(
	      w1 * color1.red() + w2 * color2.red(),
	      w1 * color1.green() + w2 * color2.green(),
	      w1 * color1.blue() + w2 * color2.blue(),
	      color1.alpha() * p + color2.alpha() * (1 - p)
	    );
	  }
	};
	for (const model of Object.keys(color_convert_default)) {
	  if (skippedModels.includes(model)) {
	    continue;
	  }
	  const { channels } = color_convert_default[model];
	  Color.prototype[model] = function(...arguments_) {
	    if (this.model === model) {
	      return new Color(this);
	    }
	    if (arguments_.length > 0) {
	      return new Color(arguments_, model);
	    }
	    return new Color([...assertArray(color_convert_default[this.model][model].raw(this.color)), this.valpha], model);
	  };
	  Color[model] = function(...arguments_) {
	    let color = arguments_[0];
	    if (typeof color === "number") {
	      color = zeroArray(arguments_, channels);
	    }
	    return new Color(color, model);
	  };
	}
	function roundTo(number, places) {
	  return Number(number.toFixed(places));
	}
	function roundToPlace(places) {
	  return function(number) {
	    return roundTo(number, places);
	  };
	}
	function getset(model, channel, modifier) {
	  model = Array.isArray(model) ? model : [model];
	  for (const m of model) {
	    (limiters[m] ||= [])[channel] = modifier;
	  }
	  model = model[0];
	  return function(value) {
	    let result;
	    if (value !== void 0) {
	      if (modifier) {
	        value = modifier(value);
	      }
	      result = this[model]();
	      result.color[channel] = value;
	      return result;
	    }
	    result = this[model]().color[channel];
	    if (modifier) {
	      result = modifier(result);
	    }
	    return result;
	  };
	}
	function maxfn(max) {
	  return function(v) {
	    return Math.max(0, Math.min(max, v));
	  };
	}
	function assertArray(value) {
	  return Array.isArray(value) ? value : [value];
	}
	function zeroArray(array, length) {
	  for (let i = 0; i < length; i++) {
	    if (typeof array[i] !== "number") {
	      array[i] = 0;
	    }
	  }
	  return array;
	}
	var index_default = Color;
	return color;
}

var colour$1;
var hasRequiredColour$1;

function requireColour$1 () {
	if (hasRequiredColour$1) return colour$1;
	hasRequiredColour$1 = 1;
	colour$1 = requireColor().default;
	return colour$1;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var colour;
var hasRequiredColour;

function requireColour () {
	if (hasRequiredColour) return colour;
	hasRequiredColour = 1;
	const color = requireColour$1();
	const is = requireIs();

	/**
	 * Colourspaces.
	 * @private
	 */
	const colourspace = {
	  multiband: 'multiband',
	  'b-w': 'b-w',
	  bw: 'b-w',
	  cmyk: 'cmyk',
	  srgb: 'srgb'
	};

	/**
	 * Tint the image using the provided colour.
	 * An alpha channel may be present and will be unchanged by the operation.
	 *
	 * @example
	 * const output = await sharp(input)
	 *   .tint({ r: 255, g: 240, b: 16 })
	 *   .toBuffer();
	 *
	 * @param {string|Object} tint - Parsed by the [color](https://www.npmjs.org/package/color) module.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameter
	 */
	function tint (tint) {
	  this._setBackgroundColourOption('tint', tint);
	  return this;
	}

	/**
	 * Convert to 8-bit greyscale; 256 shades of grey.
	 * This is a linear operation. If the input image is in a non-linear colour space such as sRGB, use `gamma()` with `greyscale()` for the best results.
	 * By default the output image will be web-friendly sRGB and contain three (identical) colour channels.
	 * This may be overridden by other sharp operations such as `toColourspace('b-w')`,
	 * which will produce an output image containing one colour channel.
	 * An alpha channel may be present, and will be unchanged by the operation.
	 *
	 * @example
	 * const output = await sharp(input).greyscale().toBuffer();
	 *
	 * @param {Boolean} [greyscale=true]
	 * @returns {Sharp}
	 */
	function greyscale (greyscale) {
	  this.options.greyscale = is.bool(greyscale) ? greyscale : true;
	  return this;
	}

	/**
	 * Alternative spelling of `greyscale`.
	 * @param {Boolean} [grayscale=true]
	 * @returns {Sharp}
	 */
	function grayscale (grayscale) {
	  return this.greyscale(grayscale);
	}

	/**
	 * Set the pipeline colourspace.
	 *
	 * The input image will be converted to the provided colourspace at the start of the pipeline.
	 * All operations will use this colourspace before converting to the output colourspace,
	 * as defined by {@link #tocolourspace toColourspace}.
	 *
	 * @since 0.29.0
	 *
	 * @example
	 * // Run pipeline in 16 bits per channel RGB while converting final result to 8 bits per channel sRGB.
	 * await sharp(input)
	 *  .pipelineColourspace('rgb16')
	 *  .toColourspace('srgb')
	 *  .toFile('16bpc-pipeline-to-8bpc-output.png')
	 *
	 * @param {string} [colourspace] - pipeline colourspace e.g. `rgb16`, `scrgb`, `lab`, `grey16` [...](https://www.libvips.org/API/current/enum.Interpretation.html)
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function pipelineColourspace (colourspace) {
	  if (!is.string(colourspace)) {
	    throw is.invalidParameterError('colourspace', 'string', colourspace);
	  }
	  this.options.colourspacePipeline = colourspace;
	  return this;
	}

	/**
	 * Alternative spelling of `pipelineColourspace`.
	 * @param {string} [colorspace] - pipeline colorspace.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function pipelineColorspace (colorspace) {
	  return this.pipelineColourspace(colorspace);
	}

	/**
	 * Set the output colourspace.
	 * By default output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
	 *
	 * @example
	 * // Output 16 bits per pixel RGB
	 * await sharp(input)
	 *  .toColourspace('rgb16')
	 *  .toFile('16-bpp.png')
	 *
	 * @param {string} [colourspace] - output colourspace e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://www.libvips.org/API/current/enum.Interpretation.html)
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function toColourspace (colourspace) {
	  if (!is.string(colourspace)) {
	    throw is.invalidParameterError('colourspace', 'string', colourspace);
	  }
	  this.options.colourspace = colourspace;
	  return this;
	}

	/**
	 * Alternative spelling of `toColourspace`.
	 * @param {string} [colorspace] - output colorspace.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function toColorspace (colorspace) {
	  return this.toColourspace(colorspace);
	}

	/**
	 * Create a RGBA colour array from a given value.
	 * @private
	 * @param {string|Object} value
	 * @throws {Error} Invalid value
	 */
	function _getBackgroundColourOption (value) {
	  if (
	    is.object(value) ||
	    (is.string(value) && value.length >= 3 && value.length <= 200)
	  ) {
	    const colour = color(value);
	    return [
	      colour.red(),
	      colour.green(),
	      colour.blue(),
	      Math.round(colour.alpha() * 255)
	    ];
	  } else {
	    throw is.invalidParameterError('background', 'object or string', value);
	  }
	}

	/**
	 * Update a colour attribute of the this.options Object.
	 * @private
	 * @param {string} key
	 * @param {string|Object} value
	 * @throws {Error} Invalid value
	 */
	function _setBackgroundColourOption (key, value) {
	  if (is.defined(value)) {
	    this.options[key] = _getBackgroundColourOption(value);
	  }
	}

	/**
	 * Decorate the Sharp prototype with colour-related functions.
	 * @module Sharp
	 * @private
	 */
	colour = (Sharp) => {
	  Object.assign(Sharp.prototype, {
	    // Public
	    tint,
	    greyscale,
	    grayscale,
	    pipelineColourspace,
	    pipelineColorspace,
	    toColourspace,
	    toColorspace,
	    // Private
	    _getBackgroundColourOption,
	    _setBackgroundColourOption
	  });
	  // Class attributes
	  Sharp.colourspace = colourspace;
	  Sharp.colorspace = colourspace;
	};
	return colour;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var channel;
var hasRequiredChannel;

function requireChannel () {
	if (hasRequiredChannel) return channel;
	hasRequiredChannel = 1;
	const is = requireIs();

	/**
	 * Boolean operations for bandbool.
	 * @private
	 */
	const bool = {
	  and: 'and',
	  or: 'or',
	  eor: 'eor'
	};

	/**
	 * Remove alpha channels, if any. This is a no-op if the image does not have an alpha channel.
	 *
	 * See also {@link /api-operation/#flatten flatten}.
	 *
	 * @example
	 * sharp('rgba.png')
	 *   .removeAlpha()
	 *   .toFile('rgb.png', function(err, info) {
	 *     // rgb.png is a 3 channel image without an alpha channel
	 *   });
	 *
	 * @returns {Sharp}
	 */
	function removeAlpha () {
	  this.options.removeAlpha = true;
	  return this;
	}

	/**
	 * Ensure the output image has an alpha transparency channel.
	 * If missing, the added alpha channel will have the specified
	 * transparency level, defaulting to fully-opaque (1).
	 * This is a no-op if the image already has an alpha channel.
	 *
	 * @since 0.21.2
	 *
	 * @example
	 * // rgba.png will be a 4 channel image with a fully-opaque alpha channel
	 * await sharp('rgb.jpg')
	 *   .ensureAlpha()
	 *   .toFile('rgba.png')
	 *
	 * @example
	 * // rgba is a 4 channel image with a fully-transparent alpha channel
	 * const rgba = await sharp(rgb)
	 *   .ensureAlpha(0)
	 *   .toBuffer();
	 *
	 * @param {number} [alpha=1] - alpha transparency level (0=fully-transparent, 1=fully-opaque)
	 * @returns {Sharp}
	 * @throws {Error} Invalid alpha transparency level
	 */
	function ensureAlpha (alpha) {
	  if (is.defined(alpha)) {
	    if (is.number(alpha) && is.inRange(alpha, 0, 1)) {
	      this.options.ensureAlpha = alpha;
	    } else {
	      throw is.invalidParameterError('alpha', 'number between 0 and 1', alpha);
	    }
	  } else {
	    this.options.ensureAlpha = 1;
	  }
	  return this;
	}

	/**
	 * Extract a single channel from a multi-channel image.
	 *
	 * The output colourspace will be either `b-w` (8-bit) or `grey16` (16-bit).
	 *
	 * @example
	 * // green.jpg is a greyscale image containing the green channel of the input
	 * await sharp(input)
	 *   .extractChannel('green')
	 *   .toFile('green.jpg');
	 *
	 * @example
	 * // red1 is the red value of the first pixel, red2 the second pixel etc.
	 * const [red1, red2, ...] = await sharp(input)
	 *   .extractChannel(0)
	 *   .raw()
	 *   .toBuffer();
	 *
	 * @param {number|string} channel - zero-indexed channel/band number to extract, or `red`, `green`, `blue` or `alpha`.
	 * @returns {Sharp}
	 * @throws {Error} Invalid channel
	 */
	function extractChannel (channel) {
	  const channelMap = { red: 0, green: 1, blue: 2, alpha: 3 };
	  if (Object.keys(channelMap).includes(channel)) {
	    channel = channelMap[channel];
	  }
	  if (is.integer(channel) && is.inRange(channel, 0, 4)) {
	    this.options.extractChannel = channel;
	  } else {
	    throw is.invalidParameterError('channel', 'integer or one of: red, green, blue, alpha', channel);
	  }
	  return this;
	}

	/**
	 * Join one or more channels to the image.
	 * The meaning of the added channels depends on the output colourspace, set with `toColourspace()`.
	 * By default the output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
	 * Channel ordering follows vips convention:
	 * - sRGB: 0: Red, 1: Green, 2: Blue, 3: Alpha.
	 * - CMYK: 0: Magenta, 1: Cyan, 2: Yellow, 3: Black, 4: Alpha.
	 *
	 * Buffers may be any of the image formats supported by sharp.
	 * For raw pixel input, the `options` object should contain a `raw` attribute, which follows the format of the attribute of the same name in the `sharp()` constructor.
	 *
	 * @param {Array<string|Buffer>|string|Buffer} images - one or more images (file paths, Buffers).
	 * @param {Object} options - image options, see `sharp()` constructor.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function joinChannel (images, options) {
	  if (Array.isArray(images)) {
	    images.forEach(function (image) {
	      this.options.joinChannelIn.push(this._createInputDescriptor(image, options));
	    }, this);
	  } else {
	    this.options.joinChannelIn.push(this._createInputDescriptor(images, options));
	  }
	  return this;
	}

	/**
	 * Perform a bitwise boolean operation on all input image channels (bands) to produce a single channel output image.
	 *
	 * @example
	 * sharp('3-channel-rgb-input.png')
	 *   .bandbool(sharp.bool.and)
	 *   .toFile('1-channel-output.png', function (err, info) {
	 *     // The output will be a single channel image where each pixel `P = R & G & B`.
	 *     // If `I(1,1) = [247, 170, 14] = [0b11110111, 0b10101010, 0b00001111]`
	 *     // then `O(1,1) = 0b11110111 & 0b10101010 & 0b00001111 = 0b00000010 = 2`.
	 *   });
	 *
	 * @param {string} boolOp - one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function bandbool (boolOp) {
	  if (is.string(boolOp) && is.inArray(boolOp, ['and', 'or', 'eor'])) {
	    this.options.bandBoolOp = boolOp;
	  } else {
	    throw is.invalidParameterError('boolOp', 'one of: and, or, eor', boolOp);
	  }
	  return this;
	}

	/**
	 * Decorate the Sharp prototype with channel-related functions.
	 * @module Sharp
	 * @private
	 */
	channel = (Sharp) => {
	  Object.assign(Sharp.prototype, {
	    // Public instance functions
	    removeAlpha,
	    ensureAlpha,
	    extractChannel,
	    joinChannel,
	    bandbool
	  });
	  // Class attributes
	  Sharp.bool = bool;
	};
	return channel;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var output;
var hasRequiredOutput;

function requireOutput () {
	if (hasRequiredOutput) return output;
	hasRequiredOutput = 1;
	const path = require$$0$4;
	const is = requireIs();
	const sharp = requireSharp();

	const formats = new Map([
	  ['heic', 'heif'],
	  ['heif', 'heif'],
	  ['avif', 'avif'],
	  ['jpeg', 'jpeg'],
	  ['jpg', 'jpeg'],
	  ['jpe', 'jpeg'],
	  ['tile', 'tile'],
	  ['dz', 'tile'],
	  ['png', 'png'],
	  ['raw', 'raw'],
	  ['tiff', 'tiff'],
	  ['tif', 'tiff'],
	  ['webp', 'webp'],
	  ['gif', 'gif'],
	  ['jp2', 'jp2'],
	  ['jpx', 'jp2'],
	  ['j2k', 'jp2'],
	  ['j2c', 'jp2'],
	  ['jxl', 'jxl']
	]);

	const jp2Regex = /\.(jp[2x]|j2[kc])$/i;

	const errJp2Save = () => new Error('JP2 output requires libvips with support for OpenJPEG');

	const bitdepthFromColourCount = (colours) => 1 << 31 - Math.clz32(Math.ceil(Math.log2(colours)));

	/**
	 * Write output image data to a file.
	 *
	 * If an explicit output format is not selected, it will be inferred from the extension,
	 * with JPEG, PNG, WebP, AVIF, TIFF, GIF, DZI, and libvips' V format supported.
	 * Note that raw pixel data is only supported for buffer output.
	 *
	 * By default all metadata will be removed, which includes EXIF-based orientation.
	 * See {@link #withmetadata withMetadata} for control over this.
	 *
	 * The caller is responsible for ensuring directory structures and permissions exist.
	 *
	 * A `Promise` is returned when `callback` is not provided.
	 *
	 * @example
	 * sharp(input)
	 *   .toFile('output.png', (err, info) => { ... });
	 *
	 * @example
	 * sharp(input)
	 *   .toFile('output.png')
	 *   .then(info => { ... })
	 *   .catch(err => { ... });
	 *
	 * @param {string} fileOut - the path to write the image data to.
	 * @param {Function} [callback] - called on completion with two arguments `(err, info)`.
	 * `info` contains the output image `format`, `size` (bytes), `width`, `height`,
	 * `channels` and `premultiplied` (indicating if premultiplication was used).
	 * When using a crop strategy also contains `cropOffsetLeft` and `cropOffsetTop`.
	 * When using the attention crop strategy also contains `attentionX` and `attentionY`, the focal point of the cropped region.
	 * Animated output will also contain `pageHeight` and `pages`.
	 * May also contain `textAutofitDpi` (dpi the font was rendered at) if image was created from text.
	 * @returns {Promise<Object>} - when no callback is provided
	 * @throws {Error} Invalid parameters
	 */
	function toFile (fileOut, callback) {
	  let err;
	  if (!is.string(fileOut)) {
	    err = new Error('Missing output file path');
	  } else if (is.string(this.options.input.file) && path.resolve(this.options.input.file) === path.resolve(fileOut)) {
	    err = new Error('Cannot use same file for input and output');
	  } else if (jp2Regex.test(path.extname(fileOut)) && !this.constructor.format.jp2k.output.file) {
	    err = errJp2Save();
	  }
	  if (err) {
	    if (is.fn(callback)) {
	      callback(err);
	    } else {
	      return Promise.reject(err);
	    }
	  } else {
	    this.options.fileOut = fileOut;
	    const stack = Error();
	    return this._pipeline(callback, stack);
	  }
	  return this;
	}

	/**
	 * Write output to a Buffer.
	 * JPEG, PNG, WebP, AVIF, TIFF, GIF and raw pixel data output are supported.
	 *
	 * Use {@link #toformat toFormat} or one of the format-specific functions such as {@link #jpeg jpeg}, {@link #png png} etc. to set the output format.
	 *
	 * If no explicit format is set, the output format will match the input image, except SVG input which becomes PNG output.
	 *
	 * By default all metadata will be removed, which includes EXIF-based orientation.
	 * See {@link #withmetadata withMetadata} for control over this.
	 *
	 * `callback`, if present, gets three arguments `(err, data, info)` where:
	 * - `err` is an error, if any.
	 * - `data` is the output image data.
	 * - `info` contains the output image `format`, `size` (bytes), `width`, `height`,
	 * `channels` and `premultiplied` (indicating if premultiplication was used).
	 * When using a crop strategy also contains `cropOffsetLeft` and `cropOffsetTop`.
	 * Animated output will also contain `pageHeight` and `pages`.
	 * May also contain `textAutofitDpi` (dpi the font was rendered at) if image was created from text.
	 *
	 * A `Promise` is returned when `callback` is not provided.
	 *
	 * @example
	 * sharp(input)
	 *   .toBuffer((err, data, info) => { ... });
	 *
	 * @example
	 * sharp(input)
	 *   .toBuffer()
	 *   .then(data => { ... })
	 *   .catch(err => { ... });
	 *
	 * @example
	 * sharp(input)
	 *   .png()
	 *   .toBuffer({ resolveWithObject: true })
	 *   .then(({ data, info }) => { ... })
	 *   .catch(err => { ... });
	 *
	 * @example
	 * const { data, info } = await sharp('my-image.jpg')
	 *   // output the raw pixels
	 *   .raw()
	 *   .toBuffer({ resolveWithObject: true });
	 *
	 * // create a more type safe way to work with the raw pixel data
	 * // this will not copy the data, instead it will change `data`s underlying ArrayBuffer
	 * // so `data` and `pixelArray` point to the same memory location
	 * const pixelArray = new Uint8ClampedArray(data.buffer);
	 *
	 * // When you are done changing the pixelArray, sharp takes the `pixelArray` as an input
	 * const { width, height, channels } = info;
	 * await sharp(pixelArray, { raw: { width, height, channels } })
	 *   .toFile('my-changed-image.jpg');
	 *
	 * @param {Object} [options]
	 * @param {boolean} [options.resolveWithObject] Resolve the Promise with an Object containing `data` and `info` properties instead of resolving only with `data`.
	 * @param {Function} [callback]
	 * @returns {Promise<Buffer>} - when no callback is provided
	 */
	function toBuffer (options, callback) {
	  if (is.object(options)) {
	    this._setBooleanOption('resolveWithObject', options.resolveWithObject);
	  } else if (this.options.resolveWithObject) {
	    this.options.resolveWithObject = false;
	  }
	  this.options.fileOut = '';
	  const stack = Error();
	  return this._pipeline(is.fn(options) ? options : callback, stack);
	}

	/**
	 * Keep all EXIF metadata from the input image in the output image.
	 *
	 * EXIF metadata is unsupported for TIFF output.
	 *
	 * @since 0.33.0
	 *
	 * @example
	 * const outputWithExif = await sharp(inputWithExif)
	 *   .keepExif()
	 *   .toBuffer();
	 *
	 * @returns {Sharp}
	 */
	function keepExif () {
	  this.options.keepMetadata |= 0b00001;
	  return this;
	}

	/**
	 * Set EXIF metadata in the output image, ignoring any EXIF in the input image.
	 *
	 * @since 0.33.0
	 *
	 * @example
	 * const dataWithExif = await sharp(input)
	 *   .withExif({
	 *     IFD0: {
	 *       Copyright: 'The National Gallery'
	 *     },
	 *     IFD3: {
	 *       GPSLatitudeRef: 'N',
	 *       GPSLatitude: '51/1 30/1 3230/100',
	 *       GPSLongitudeRef: 'W',
	 *       GPSLongitude: '0/1 7/1 4366/100'
	 *     }
	 *   })
	 *   .toBuffer();
	 *
	 * @param {Object<string, Object<string, string>>} exif Object keyed by IFD0, IFD1 etc. of key/value string pairs to write as EXIF data.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function withExif (exif) {
	  if (is.object(exif)) {
	    for (const [ifd, entries] of Object.entries(exif)) {
	      if (is.object(entries)) {
	        for (const [k, v] of Object.entries(entries)) {
	          if (is.string(v)) {
	            this.options.withExif[`exif-${ifd.toLowerCase()}-${k}`] = v;
	          } else {
	            throw is.invalidParameterError(`${ifd}.${k}`, 'string', v);
	          }
	        }
	      } else {
	        throw is.invalidParameterError(ifd, 'object', entries);
	      }
	    }
	  } else {
	    throw is.invalidParameterError('exif', 'object', exif);
	  }
	  this.options.withExifMerge = false;
	  return this.keepExif();
	}

	/**
	 * Update EXIF metadata from the input image in the output image.
	 *
	 * @since 0.33.0
	 *
	 * @example
	 * const dataWithMergedExif = await sharp(inputWithExif)
	 *   .withExifMerge({
	 *     IFD0: {
	 *       Copyright: 'The National Gallery'
	 *     }
	 *   })
	 *   .toBuffer();
	 *
	 * @param {Object<string, Object<string, string>>} exif Object keyed by IFD0, IFD1 etc. of key/value string pairs to write as EXIF data.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function withExifMerge (exif) {
	  this.withExif(exif);
	  this.options.withExifMerge = true;
	  return this;
	}

	/**
	 * Keep ICC profile from the input image in the output image.
	 *
	 * When input and output colour spaces differ, use with {@link /api-colour/#tocolourspace toColourspace} and optionally {@link /api-colour/#pipelinecolourspace pipelineColourspace}.
	 *
	 * @since 0.33.0
	 *
	 * @example
	 * const outputWithIccProfile = await sharp(inputWithIccProfile)
	 *   .keepIccProfile()
	 *   .toBuffer();
	 *
	 * @example
	 * const cmykOutputWithIccProfile = await sharp(cmykInputWithIccProfile)
	 *   .pipelineColourspace('cmyk')
	 *   .toColourspace('cmyk')
	 *   .keepIccProfile()
	 *   .toBuffer();
	 *
	 * @returns {Sharp}
	 */
	function keepIccProfile () {
	  this.options.keepMetadata |= 0b01000;
	  return this;
	}

	/**
	 * Transform using an ICC profile and attach to the output image.
	 *
	 * This can either be an absolute filesystem path or
	 * built-in profile name (`srgb`, `p3`, `cmyk`).
	 *
	 * @since 0.33.0
	 *
	 * @example
	 * const outputWithP3 = await sharp(input)
	 *   .withIccProfile('p3')
	 *   .toBuffer();
	 *
	 * @param {string} icc - Absolute filesystem path to output ICC profile or built-in profile name (srgb, p3, cmyk).
	 * @param {Object} [options]
	 * @param {number} [options.attach=true] Should the ICC profile be included in the output image metadata?
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function withIccProfile (icc, options) {
	  if (is.string(icc)) {
	    this.options.withIccProfile = icc;
	  } else {
	    throw is.invalidParameterError('icc', 'string', icc);
	  }
	  this.keepIccProfile();
	  if (is.object(options)) {
	    if (is.defined(options.attach)) {
	      if (is.bool(options.attach)) {
	        if (!options.attach) {
	          this.options.keepMetadata &= -9;
	        }
	      } else {
	        throw is.invalidParameterError('attach', 'boolean', options.attach);
	      }
	    }
	  }
	  return this;
	}

	/**
	 * Keep XMP metadata from the input image in the output image.
	 *
	 * @since 0.34.3
	 *
	 * @example
	 * const outputWithXmp = await sharp(inputWithXmp)
	 *   .keepXmp()
	 *   .toBuffer();
	 *
	 * @returns {Sharp}
	 */
	function keepXmp () {
	  this.options.keepMetadata |= 0b00010;
	  return this;
	}

	/**
	 * Set XMP metadata in the output image.
	 *
	 * Supported by PNG, JPEG, WebP, and TIFF output.
	 *
	 * @since 0.34.3
	 *
	 * @example
	 * const xmpString = `
	 *   <?xml version="1.0"?>
	 *   <x:xmpmeta xmlns:x="adobe:ns:meta/">
	 *     <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
	 *       <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
	 *         <dc:creator><rdf:Seq><rdf:li>John Doe</rdf:li></rdf:Seq></dc:creator>
	 *       </rdf:Description>
	 *     </rdf:RDF>
	 *   </x:xmpmeta>`;
	 *
	 * const data = await sharp(input)
	 *   .withXmp(xmpString)
	 *   .toBuffer();
	 *
	 * @param {string} xmp String containing XMP metadata to be embedded in the output image.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function withXmp (xmp) {
	  if (is.string(xmp) && xmp.length > 0) {
	    this.options.withXmp = xmp;
	    this.options.keepMetadata |= 0b00010;
	  } else {
	    throw is.invalidParameterError('xmp', 'non-empty string', xmp);
	  }
	  return this;
	}

	/**
	 * Keep all metadata (EXIF, ICC, XMP, IPTC) from the input image in the output image.
	 *
	 * The default behaviour, when `keepMetadata` is not used, is to convert to the device-independent
	 * sRGB colour space and strip all metadata, including the removal of any ICC profile.
	 *
	 * @since 0.33.0
	 *
	 * @example
	 * const outputWithMetadata = await sharp(inputWithMetadata)
	 *   .keepMetadata()
	 *   .toBuffer();
	 *
	 * @returns {Sharp}
	 */
	function keepMetadata () {
	  this.options.keepMetadata = 0b11111;
	  return this;
	}

	/**
	 * Keep most metadata (EXIF, XMP, IPTC) from the input image in the output image.
	 *
	 * This will also convert to and add a web-friendly sRGB ICC profile if appropriate.
	 *
	 * Allows orientation and density to be set or updated.
	 *
	 * @example
	 * const outputSrgbWithMetadata = await sharp(inputRgbWithMetadata)
	 *   .withMetadata()
	 *   .toBuffer();
	 *
	 * @example
	 * // Set output metadata to 96 DPI
	 * const data = await sharp(input)
	 *   .withMetadata({ density: 96 })
	 *   .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {number} [options.orientation] Used to update the EXIF `Orientation` tag, integer between 1 and 8.
	 * @param {number} [options.density] Number of pixels per inch (DPI).
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function withMetadata (options) {
	  this.keepMetadata();
	  this.withIccProfile('srgb');
	  if (is.object(options)) {
	    if (is.defined(options.orientation)) {
	      if (is.integer(options.orientation) && is.inRange(options.orientation, 1, 8)) {
	        this.options.withMetadataOrientation = options.orientation;
	      } else {
	        throw is.invalidParameterError('orientation', 'integer between 1 and 8', options.orientation);
	      }
	    }
	    if (is.defined(options.density)) {
	      if (is.number(options.density) && options.density > 0) {
	        this.options.withMetadataDensity = options.density;
	      } else {
	        throw is.invalidParameterError('density', 'positive number', options.density);
	      }
	    }
	    if (is.defined(options.icc)) {
	      this.withIccProfile(options.icc);
	    }
	    if (is.defined(options.exif)) {
	      this.withExifMerge(options.exif);
	    }
	  }
	  return this;
	}

	/**
	 * Force output to a given format.
	 *
	 * @example
	 * // Convert any input to PNG output
	 * const data = await sharp(input)
	 *   .toFormat('png')
	 *   .toBuffer();
	 *
	 * @param {(string|Object)} format - as a string or an Object with an 'id' attribute
	 * @param {Object} options - output options
	 * @returns {Sharp}
	 * @throws {Error} unsupported format or options
	 */
	function toFormat (format, options) {
	  const actualFormat = formats.get((is.object(format) && is.string(format.id) ? format.id : format).toLowerCase());
	  if (!actualFormat) {
	    throw is.invalidParameterError('format', `one of: ${[...formats.keys()].join(', ')}`, format);
	  }
	  return this[actualFormat](options);
	}

	/**
	 * Use these JPEG options for output image.
	 *
	 * @example
	 * // Convert any input to very high quality JPEG output
	 * const data = await sharp(input)
	 *   .jpeg({
	 *     quality: 100,
	 *     chromaSubsampling: '4:4:4'
	 *   })
	 *   .toBuffer();
	 *
	 * @example
	 * // Use mozjpeg to reduce output JPEG file size (slower)
	 * const data = await sharp(input)
	 *   .jpeg({ mozjpeg: true })
	 *   .toBuffer();
	 *
	 * @param {Object} [options] - output options
	 * @param {number} [options.quality=80] - quality, integer 1-100
	 * @param {boolean} [options.progressive=false] - use progressive (interlace) scan
	 * @param {string} [options.chromaSubsampling='4:2:0'] - set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling
	 * @param {boolean} [options.optimiseCoding=true] - optimise Huffman coding tables
	 * @param {boolean} [options.optimizeCoding=true] - alternative spelling of optimiseCoding
	 * @param {boolean} [options.mozjpeg=false] - use mozjpeg defaults, equivalent to `{ trellisQuantisation: true, overshootDeringing: true, optimiseScans: true, quantisationTable: 3 }`
	 * @param {boolean} [options.trellisQuantisation=false] - apply trellis quantisation
	 * @param {boolean} [options.overshootDeringing=false] - apply overshoot deringing
	 * @param {boolean} [options.optimiseScans=false] - optimise progressive scans, forces progressive
	 * @param {boolean} [options.optimizeScans=false] - alternative spelling of optimiseScans
	 * @param {number} [options.quantisationTable=0] - quantization table to use, integer 0-8
	 * @param {number} [options.quantizationTable=0] - alternative spelling of quantisationTable
	 * @param {boolean} [options.force=true] - force JPEG output, otherwise attempt to use input format
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function jpeg (options) {
	  if (is.object(options)) {
	    if (is.defined(options.quality)) {
	      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
	        this.options.jpegQuality = options.quality;
	      } else {
	        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
	      }
	    }
	    if (is.defined(options.progressive)) {
	      this._setBooleanOption('jpegProgressive', options.progressive);
	    }
	    if (is.defined(options.chromaSubsampling)) {
	      if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ['4:2:0', '4:4:4'])) {
	        this.options.jpegChromaSubsampling = options.chromaSubsampling;
	      } else {
	        throw is.invalidParameterError('chromaSubsampling', 'one of: 4:2:0, 4:4:4', options.chromaSubsampling);
	      }
	    }
	    const optimiseCoding = is.bool(options.optimizeCoding) ? options.optimizeCoding : options.optimiseCoding;
	    if (is.defined(optimiseCoding)) {
	      this._setBooleanOption('jpegOptimiseCoding', optimiseCoding);
	    }
	    if (is.defined(options.mozjpeg)) {
	      if (is.bool(options.mozjpeg)) {
	        if (options.mozjpeg) {
	          this.options.jpegTrellisQuantisation = true;
	          this.options.jpegOvershootDeringing = true;
	          this.options.jpegOptimiseScans = true;
	          this.options.jpegProgressive = true;
	          this.options.jpegQuantisationTable = 3;
	        }
	      } else {
	        throw is.invalidParameterError('mozjpeg', 'boolean', options.mozjpeg);
	      }
	    }
	    const trellisQuantisation = is.bool(options.trellisQuantization) ? options.trellisQuantization : options.trellisQuantisation;
	    if (is.defined(trellisQuantisation)) {
	      this._setBooleanOption('jpegTrellisQuantisation', trellisQuantisation);
	    }
	    if (is.defined(options.overshootDeringing)) {
	      this._setBooleanOption('jpegOvershootDeringing', options.overshootDeringing);
	    }
	    const optimiseScans = is.bool(options.optimizeScans) ? options.optimizeScans : options.optimiseScans;
	    if (is.defined(optimiseScans)) {
	      this._setBooleanOption('jpegOptimiseScans', optimiseScans);
	      if (optimiseScans) {
	        this.options.jpegProgressive = true;
	      }
	    }
	    const quantisationTable = is.number(options.quantizationTable) ? options.quantizationTable : options.quantisationTable;
	    if (is.defined(quantisationTable)) {
	      if (is.integer(quantisationTable) && is.inRange(quantisationTable, 0, 8)) {
	        this.options.jpegQuantisationTable = quantisationTable;
	      } else {
	        throw is.invalidParameterError('quantisationTable', 'integer between 0 and 8', quantisationTable);
	      }
	    }
	  }
	  return this._updateFormatOut('jpeg', options);
	}

	/**
	 * Use these PNG options for output image.
	 *
	 * By default, PNG output is full colour at 8 bits per pixel.
	 *
	 * Indexed PNG input at 1, 2 or 4 bits per pixel is converted to 8 bits per pixel.
	 * Set `palette` to `true` for slower, indexed PNG output.
	 *
	 * For 16 bits per pixel output, convert to `rgb16` via
	 * {@link /api-colour/#tocolourspace toColourspace}.
	 *
	 * @example
	 * // Convert any input to full colour PNG output
	 * const data = await sharp(input)
	 *   .png()
	 *   .toBuffer();
	 *
	 * @example
	 * // Convert any input to indexed PNG output (slower)
	 * const data = await sharp(input)
	 *   .png({ palette: true })
	 *   .toBuffer();
	 *
	 * @example
	 * // Output 16 bits per pixel RGB(A)
	 * const data = await sharp(input)
	 *  .toColourspace('rgb16')
	 *  .png()
	 *  .toBuffer();
	 *
	 * @param {Object} [options]
	 * @param {boolean} [options.progressive=false] - use progressive (interlace) scan
	 * @param {number} [options.compressionLevel=6] - zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
	 * @param {boolean} [options.adaptiveFiltering=false] - use adaptive row filtering
	 * @param {boolean} [options.palette=false] - quantise to a palette-based image with alpha transparency support
	 * @param {number} [options.quality=100] - use the lowest number of colours needed to achieve given quality, sets `palette` to `true`
	 * @param {number} [options.effort=7] - CPU effort, between 1 (fastest) and 10 (slowest), sets `palette` to `true`
	 * @param {number} [options.colours=256] - maximum number of palette entries, sets `palette` to `true`
	 * @param {number} [options.colors=256] - alternative spelling of `options.colours`, sets `palette` to `true`
	 * @param {number} [options.dither=1.0] - level of Floyd-Steinberg error diffusion, sets `palette` to `true`
	 * @param {boolean} [options.force=true] - force PNG output, otherwise attempt to use input format
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function png (options) {
	  if (is.object(options)) {
	    if (is.defined(options.progressive)) {
	      this._setBooleanOption('pngProgressive', options.progressive);
	    }
	    if (is.defined(options.compressionLevel)) {
	      if (is.integer(options.compressionLevel) && is.inRange(options.compressionLevel, 0, 9)) {
	        this.options.pngCompressionLevel = options.compressionLevel;
	      } else {
	        throw is.invalidParameterError('compressionLevel', 'integer between 0 and 9', options.compressionLevel);
	      }
	    }
	    if (is.defined(options.adaptiveFiltering)) {
	      this._setBooleanOption('pngAdaptiveFiltering', options.adaptiveFiltering);
	    }
	    const colours = options.colours || options.colors;
	    if (is.defined(colours)) {
	      if (is.integer(colours) && is.inRange(colours, 2, 256)) {
	        this.options.pngBitdepth = bitdepthFromColourCount(colours);
	      } else {
	        throw is.invalidParameterError('colours', 'integer between 2 and 256', colours);
	      }
	    }
	    if (is.defined(options.palette)) {
	      this._setBooleanOption('pngPalette', options.palette);
	    } else if ([options.quality, options.effort, options.colours, options.colors, options.dither].some(is.defined)) {
	      this._setBooleanOption('pngPalette', true);
	    }
	    if (this.options.pngPalette) {
	      if (is.defined(options.quality)) {
	        if (is.integer(options.quality) && is.inRange(options.quality, 0, 100)) {
	          this.options.pngQuality = options.quality;
	        } else {
	          throw is.invalidParameterError('quality', 'integer between 0 and 100', options.quality);
	        }
	      }
	      if (is.defined(options.effort)) {
	        if (is.integer(options.effort) && is.inRange(options.effort, 1, 10)) {
	          this.options.pngEffort = options.effort;
	        } else {
	          throw is.invalidParameterError('effort', 'integer between 1 and 10', options.effort);
	        }
	      }
	      if (is.defined(options.dither)) {
	        if (is.number(options.dither) && is.inRange(options.dither, 0, 1)) {
	          this.options.pngDither = options.dither;
	        } else {
	          throw is.invalidParameterError('dither', 'number between 0.0 and 1.0', options.dither);
	        }
	      }
	    }
	  }
	  return this._updateFormatOut('png', options);
	}

	/**
	 * Use these WebP options for output image.
	 *
	 * @example
	 * // Convert any input to lossless WebP output
	 * const data = await sharp(input)
	 *   .webp({ lossless: true })
	 *   .toBuffer();
	 *
	 * @example
	 * // Optimise the file size of an animated WebP
	 * const outputWebp = await sharp(inputWebp, { animated: true })
	 *   .webp({ effort: 6 })
	 *   .toBuffer();
	 *
	 * @param {Object} [options] - output options
	 * @param {number} [options.quality=80] - quality, integer 1-100
	 * @param {number} [options.alphaQuality=100] - quality of alpha layer, integer 0-100
	 * @param {boolean} [options.lossless=false] - use lossless compression mode
	 * @param {boolean} [options.nearLossless=false] - use near_lossless compression mode
	 * @param {boolean} [options.smartSubsample=false] - use high quality chroma subsampling
	 * @param {boolean} [options.smartDeblock=false] - auto-adjust the deblocking filter, can improve low contrast edges (slow)
	 * @param {string} [options.preset='default'] - named preset for preprocessing/filtering, one of: default, photo, picture, drawing, icon, text
	 * @param {number} [options.effort=4] - CPU effort, between 0 (fastest) and 6 (slowest)
	 * @param {number} [options.loop=0] - number of animation iterations, use 0 for infinite animation
	 * @param {number|number[]} [options.delay] - delay(s) between animation frames (in milliseconds)
	 * @param {boolean} [options.minSize=false] - prevent use of animation key frames to minimise file size (slow)
	 * @param {boolean} [options.mixed=false] - allow mixture of lossy and lossless animation frames (slow)
	 * @param {boolean} [options.force=true] - force WebP output, otherwise attempt to use input format
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function webp (options) {
	  if (is.object(options)) {
	    if (is.defined(options.quality)) {
	      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
	        this.options.webpQuality = options.quality;
	      } else {
	        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
	      }
	    }
	    if (is.defined(options.alphaQuality)) {
	      if (is.integer(options.alphaQuality) && is.inRange(options.alphaQuality, 0, 100)) {
	        this.options.webpAlphaQuality = options.alphaQuality;
	      } else {
	        throw is.invalidParameterError('alphaQuality', 'integer between 0 and 100', options.alphaQuality);
	      }
	    }
	    if (is.defined(options.lossless)) {
	      this._setBooleanOption('webpLossless', options.lossless);
	    }
	    if (is.defined(options.nearLossless)) {
	      this._setBooleanOption('webpNearLossless', options.nearLossless);
	    }
	    if (is.defined(options.smartSubsample)) {
	      this._setBooleanOption('webpSmartSubsample', options.smartSubsample);
	    }
	    if (is.defined(options.smartDeblock)) {
	      this._setBooleanOption('webpSmartDeblock', options.smartDeblock);
	    }
	    if (is.defined(options.preset)) {
	      if (is.string(options.preset) && is.inArray(options.preset, ['default', 'photo', 'picture', 'drawing', 'icon', 'text'])) {
	        this.options.webpPreset = options.preset;
	      } else {
	        throw is.invalidParameterError('preset', 'one of: default, photo, picture, drawing, icon, text', options.preset);
	      }
	    }
	    if (is.defined(options.effort)) {
	      if (is.integer(options.effort) && is.inRange(options.effort, 0, 6)) {
	        this.options.webpEffort = options.effort;
	      } else {
	        throw is.invalidParameterError('effort', 'integer between 0 and 6', options.effort);
	      }
	    }
	    if (is.defined(options.minSize)) {
	      this._setBooleanOption('webpMinSize', options.minSize);
	    }
	    if (is.defined(options.mixed)) {
	      this._setBooleanOption('webpMixed', options.mixed);
	    }
	  }
	  trySetAnimationOptions(options, this.options);
	  return this._updateFormatOut('webp', options);
	}

	/**
	 * Use these GIF options for the output image.
	 *
	 * The first entry in the palette is reserved for transparency.
	 *
	 * The palette of the input image will be re-used if possible.
	 *
	 * @since 0.30.0
	 *
	 * @example
	 * // Convert PNG to GIF
	 * await sharp(pngBuffer)
	 *   .gif()
	 *   .toBuffer();
	 *
	 * @example
	 * // Convert animated WebP to animated GIF
	 * await sharp('animated.webp', { animated: true })
	 *   .toFile('animated.gif');
	 *
	 * @example
	 * // Create a 128x128, cropped, non-dithered, animated thumbnail of an animated GIF
	 * const out = await sharp('in.gif', { animated: true })
	 *   .resize({ width: 128, height: 128 })
	 *   .gif({ dither: 0 })
	 *   .toBuffer();
	 *
	 * @example
	 * // Lossy file size reduction of animated GIF
	 * await sharp('in.gif', { animated: true })
	 *   .gif({ interFrameMaxError: 8 })
	 *   .toFile('optim.gif');
	 *
	 * @param {Object} [options] - output options
	 * @param {boolean} [options.reuse=true] - re-use existing palette, otherwise generate new (slow)
	 * @param {boolean} [options.progressive=false] - use progressive (interlace) scan
	 * @param {number} [options.colours=256] - maximum number of palette entries, including transparency, between 2 and 256
	 * @param {number} [options.colors=256] - alternative spelling of `options.colours`
	 * @param {number} [options.effort=7] - CPU effort, between 1 (fastest) and 10 (slowest)
	 * @param {number} [options.dither=1.0] - level of Floyd-Steinberg error diffusion, between 0 (least) and 1 (most)
	 * @param {number} [options.interFrameMaxError=0] - maximum inter-frame error for transparency, between 0 (lossless) and 32
	 * @param {number} [options.interPaletteMaxError=3] - maximum inter-palette error for palette reuse, between 0 and 256
	 * @param {boolean} [options.keepDuplicateFrames=false] - keep duplicate frames in the output instead of combining them
	 * @param {number} [options.loop=0] - number of animation iterations, use 0 for infinite animation
	 * @param {number|number[]} [options.delay] - delay(s) between animation frames (in milliseconds)
	 * @param {boolean} [options.force=true] - force GIF output, otherwise attempt to use input format
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function gif (options) {
	  if (is.object(options)) {
	    if (is.defined(options.reuse)) {
	      this._setBooleanOption('gifReuse', options.reuse);
	    }
	    if (is.defined(options.progressive)) {
	      this._setBooleanOption('gifProgressive', options.progressive);
	    }
	    const colours = options.colours || options.colors;
	    if (is.defined(colours)) {
	      if (is.integer(colours) && is.inRange(colours, 2, 256)) {
	        this.options.gifBitdepth = bitdepthFromColourCount(colours);
	      } else {
	        throw is.invalidParameterError('colours', 'integer between 2 and 256', colours);
	      }
	    }
	    if (is.defined(options.effort)) {
	      if (is.number(options.effort) && is.inRange(options.effort, 1, 10)) {
	        this.options.gifEffort = options.effort;
	      } else {
	        throw is.invalidParameterError('effort', 'integer between 1 and 10', options.effort);
	      }
	    }
	    if (is.defined(options.dither)) {
	      if (is.number(options.dither) && is.inRange(options.dither, 0, 1)) {
	        this.options.gifDither = options.dither;
	      } else {
	        throw is.invalidParameterError('dither', 'number between 0.0 and 1.0', options.dither);
	      }
	    }
	    if (is.defined(options.interFrameMaxError)) {
	      if (is.number(options.interFrameMaxError) && is.inRange(options.interFrameMaxError, 0, 32)) {
	        this.options.gifInterFrameMaxError = options.interFrameMaxError;
	      } else {
	        throw is.invalidParameterError('interFrameMaxError', 'number between 0.0 and 32.0', options.interFrameMaxError);
	      }
	    }
	    if (is.defined(options.interPaletteMaxError)) {
	      if (is.number(options.interPaletteMaxError) && is.inRange(options.interPaletteMaxError, 0, 256)) {
	        this.options.gifInterPaletteMaxError = options.interPaletteMaxError;
	      } else {
	        throw is.invalidParameterError('interPaletteMaxError', 'number between 0.0 and 256.0', options.interPaletteMaxError);
	      }
	    }
	    if (is.defined(options.keepDuplicateFrames)) {
	      if (is.bool(options.keepDuplicateFrames)) {
	        this._setBooleanOption('gifKeepDuplicateFrames', options.keepDuplicateFrames);
	      } else {
	        throw is.invalidParameterError('keepDuplicateFrames', 'boolean', options.keepDuplicateFrames);
	      }
	    }
	  }
	  trySetAnimationOptions(options, this.options);
	  return this._updateFormatOut('gif', options);
	}

	/**
	 * Use these JP2 options for output image.
	 *
	 * Requires libvips compiled with support for OpenJPEG.
	 * The prebuilt binaries do not include this - see
	 * {@link /install#custom-libvips installing a custom libvips}.
	 *
	 * @example
	 * // Convert any input to lossless JP2 output
	 * const data = await sharp(input)
	 *   .jp2({ lossless: true })
	 *   .toBuffer();
	 *
	 * @example
	 * // Convert any input to very high quality JP2 output
	 * const data = await sharp(input)
	 *   .jp2({
	 *     quality: 100,
	 *     chromaSubsampling: '4:4:4'
	 *   })
	 *   .toBuffer();
	 *
	 * @since 0.29.1
	 *
	 * @param {Object} [options] - output options
	 * @param {number} [options.quality=80] - quality, integer 1-100
	 * @param {boolean} [options.lossless=false] - use lossless compression mode
	 * @param {number} [options.tileWidth=512] - horizontal tile size
	 * @param {number} [options.tileHeight=512] - vertical tile size
	 * @param {string} [options.chromaSubsampling='4:4:4'] - set to '4:2:0' to use chroma subsampling
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function jp2 (options) {
	  /* node:coverage ignore next 41 */
	  if (!this.constructor.format.jp2k.output.buffer) {
	    throw errJp2Save();
	  }
	  if (is.object(options)) {
	    if (is.defined(options.quality)) {
	      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
	        this.options.jp2Quality = options.quality;
	      } else {
	        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
	      }
	    }
	    if (is.defined(options.lossless)) {
	      if (is.bool(options.lossless)) {
	        this.options.jp2Lossless = options.lossless;
	      } else {
	        throw is.invalidParameterError('lossless', 'boolean', options.lossless);
	      }
	    }
	    if (is.defined(options.tileWidth)) {
	      if (is.integer(options.tileWidth) && is.inRange(options.tileWidth, 1, 32768)) {
	        this.options.jp2TileWidth = options.tileWidth;
	      } else {
	        throw is.invalidParameterError('tileWidth', 'integer between 1 and 32768', options.tileWidth);
	      }
	    }
	    if (is.defined(options.tileHeight)) {
	      if (is.integer(options.tileHeight) && is.inRange(options.tileHeight, 1, 32768)) {
	        this.options.jp2TileHeight = options.tileHeight;
	      } else {
	        throw is.invalidParameterError('tileHeight', 'integer between 1 and 32768', options.tileHeight);
	      }
	    }
	    if (is.defined(options.chromaSubsampling)) {
	      if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ['4:2:0', '4:4:4'])) {
	        this.options.jp2ChromaSubsampling = options.chromaSubsampling;
	      } else {
	        throw is.invalidParameterError('chromaSubsampling', 'one of: 4:2:0, 4:4:4', options.chromaSubsampling);
	      }
	    }
	  }
	  return this._updateFormatOut('jp2', options);
	}

	/**
	 * Set animation options if available.
	 * @private
	 *
	 * @param {Object} [source] - output options
	 * @param {number} [source.loop=0] - number of animation iterations, use 0 for infinite animation
	 * @param {number[]} [source.delay] - list of delays between animation frames (in milliseconds)
	 * @param {Object} [target] - target object for valid options
	 * @throws {Error} Invalid options
	 */
	function trySetAnimationOptions (source, target) {
	  if (is.object(source) && is.defined(source.loop)) {
	    if (is.integer(source.loop) && is.inRange(source.loop, 0, 65535)) {
	      target.loop = source.loop;
	    } else {
	      throw is.invalidParameterError('loop', 'integer between 0 and 65535', source.loop);
	    }
	  }
	  if (is.object(source) && is.defined(source.delay)) {
	    // We allow singular values as well
	    if (is.integer(source.delay) && is.inRange(source.delay, 0, 65535)) {
	      target.delay = [source.delay];
	    } else if (
	      Array.isArray(source.delay) &&
	      source.delay.every(is.integer) &&
	      source.delay.every(v => is.inRange(v, 0, 65535))) {
	      target.delay = source.delay;
	    } else {
	      throw is.invalidParameterError('delay', 'integer or an array of integers between 0 and 65535', source.delay);
	    }
	  }
	}

	/**
	 * Use these TIFF options for output image.
	 *
	 * The `density` can be set in pixels/inch via {@link #withmetadata withMetadata}
	 * instead of providing `xres` and `yres` in pixels/mm.
	 *
	 * @example
	 * // Convert SVG input to LZW-compressed, 1 bit per pixel TIFF output
	 * sharp('input.svg')
	 *   .tiff({
	 *     compression: 'lzw',
	 *     bitdepth: 1
	 *   })
	 *   .toFile('1-bpp-output.tiff')
	 *   .then(info => { ... });
	 *
	 * @param {Object} [options] - output options
	 * @param {number} [options.quality=80] - quality, integer 1-100
	 * @param {boolean} [options.force=true] - force TIFF output, otherwise attempt to use input format
	 * @param {string} [options.compression='jpeg'] - compression options: none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k
	 * @param {boolean} [options.bigtiff=false] - use BigTIFF variant (has no effect when compression is none)
	 * @param {string} [options.predictor='horizontal'] - compression predictor options: none, horizontal, float
	 * @param {boolean} [options.pyramid=false] - write an image pyramid
	 * @param {boolean} [options.tile=false] - write a tiled tiff
	 * @param {number} [options.tileWidth=256] - horizontal tile size
	 * @param {number} [options.tileHeight=256] - vertical tile size
	 * @param {number} [options.xres=1.0] - horizontal resolution in pixels/mm
	 * @param {number} [options.yres=1.0] - vertical resolution in pixels/mm
	 * @param {string} [options.resolutionUnit='inch'] - resolution unit options: inch, cm
	 * @param {number} [options.bitdepth=8] - reduce bitdepth to 1, 2 or 4 bit
	 * @param {boolean} [options.miniswhite=false] - write 1-bit images as miniswhite
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function tiff (options) {
	  if (is.object(options)) {
	    if (is.defined(options.quality)) {
	      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
	        this.options.tiffQuality = options.quality;
	      } else {
	        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
	      }
	    }
	    if (is.defined(options.bitdepth)) {
	      if (is.integer(options.bitdepth) && is.inArray(options.bitdepth, [1, 2, 4, 8])) {
	        this.options.tiffBitdepth = options.bitdepth;
	      } else {
	        throw is.invalidParameterError('bitdepth', '1, 2, 4 or 8', options.bitdepth);
	      }
	    }
	    // tiling
	    if (is.defined(options.tile)) {
	      this._setBooleanOption('tiffTile', options.tile);
	    }
	    if (is.defined(options.tileWidth)) {
	      if (is.integer(options.tileWidth) && options.tileWidth > 0) {
	        this.options.tiffTileWidth = options.tileWidth;
	      } else {
	        throw is.invalidParameterError('tileWidth', 'integer greater than zero', options.tileWidth);
	      }
	    }
	    if (is.defined(options.tileHeight)) {
	      if (is.integer(options.tileHeight) && options.tileHeight > 0) {
	        this.options.tiffTileHeight = options.tileHeight;
	      } else {
	        throw is.invalidParameterError('tileHeight', 'integer greater than zero', options.tileHeight);
	      }
	    }
	    // miniswhite
	    if (is.defined(options.miniswhite)) {
	      this._setBooleanOption('tiffMiniswhite', options.miniswhite);
	    }
	    // pyramid
	    if (is.defined(options.pyramid)) {
	      this._setBooleanOption('tiffPyramid', options.pyramid);
	    }
	    // resolution
	    if (is.defined(options.xres)) {
	      if (is.number(options.xres) && options.xres > 0) {
	        this.options.tiffXres = options.xres;
	      } else {
	        throw is.invalidParameterError('xres', 'number greater than zero', options.xres);
	      }
	    }
	    if (is.defined(options.yres)) {
	      if (is.number(options.yres) && options.yres > 0) {
	        this.options.tiffYres = options.yres;
	      } else {
	        throw is.invalidParameterError('yres', 'number greater than zero', options.yres);
	      }
	    }
	    // compression
	    if (is.defined(options.compression)) {
	      if (is.string(options.compression) && is.inArray(options.compression, ['none', 'jpeg', 'deflate', 'packbits', 'ccittfax4', 'lzw', 'webp', 'zstd', 'jp2k'])) {
	        this.options.tiffCompression = options.compression;
	      } else {
	        throw is.invalidParameterError('compression', 'one of: none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k', options.compression);
	      }
	    }
	    // bigtiff
	    if (is.defined(options.bigtiff)) {
	      this._setBooleanOption('tiffBigtiff', options.bigtiff);
	    }
	    // predictor
	    if (is.defined(options.predictor)) {
	      if (is.string(options.predictor) && is.inArray(options.predictor, ['none', 'horizontal', 'float'])) {
	        this.options.tiffPredictor = options.predictor;
	      } else {
	        throw is.invalidParameterError('predictor', 'one of: none, horizontal, float', options.predictor);
	      }
	    }
	    // resolutionUnit
	    if (is.defined(options.resolutionUnit)) {
	      if (is.string(options.resolutionUnit) && is.inArray(options.resolutionUnit, ['inch', 'cm'])) {
	        this.options.tiffResolutionUnit = options.resolutionUnit;
	      } else {
	        throw is.invalidParameterError('resolutionUnit', 'one of: inch, cm', options.resolutionUnit);
	      }
	    }
	  }
	  return this._updateFormatOut('tiff', options);
	}

	/**
	 * Use these AVIF options for output image.
	 *
	 * AVIF image sequences are not supported.
	 * Prebuilt binaries support a bitdepth of 8 only.
	 *
	 * This feature is experimental on the Windows ARM64 platform
	 * and requires a CPU with ARM64v8.4 or later.
	 *
	 * @example
	 * const data = await sharp(input)
	 *   .avif({ effort: 2 })
	 *   .toBuffer();
	 *
	 * @example
	 * const data = await sharp(input)
	 *   .avif({ lossless: true })
	 *   .toBuffer();
	 *
	 * @since 0.27.0
	 *
	 * @param {Object} [options] - output options
	 * @param {number} [options.quality=50] - quality, integer 1-100
	 * @param {boolean} [options.lossless=false] - use lossless compression
	 * @param {number} [options.effort=4] - CPU effort, between 0 (fastest) and 9 (slowest)
	 * @param {string} [options.chromaSubsampling='4:4:4'] - set to '4:2:0' to use chroma subsampling
	 * @param {number} [options.bitdepth=8] - set bitdepth to 8, 10 or 12 bit
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function avif (options) {
	  return this.heif({ ...options, compression: 'av1' });
	}

	/**
	 * Use these HEIF options for output image.
	 *
	 * Support for patent-encumbered HEIC images using `hevc` compression requires the use of a
	 * globally-installed libvips compiled with support for libheif, libde265 and x265.
	 *
	 * @example
	 * const data = await sharp(input)
	 *   .heif({ compression: 'hevc' })
	 *   .toBuffer();
	 *
	 * @since 0.23.0
	 *
	 * @param {Object} options - output options
	 * @param {string} options.compression - compression format: av1, hevc
	 * @param {number} [options.quality=50] - quality, integer 1-100
	 * @param {boolean} [options.lossless=false] - use lossless compression
	 * @param {number} [options.effort=4] - CPU effort, between 0 (fastest) and 9 (slowest)
	 * @param {string} [options.chromaSubsampling='4:4:4'] - set to '4:2:0' to use chroma subsampling
	 * @param {number} [options.bitdepth=8] - set bitdepth to 8, 10 or 12 bit
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function heif (options) {
	  if (is.object(options)) {
	    if (is.string(options.compression) && is.inArray(options.compression, ['av1', 'hevc'])) {
	      this.options.heifCompression = options.compression;
	    } else {
	      throw is.invalidParameterError('compression', 'one of: av1, hevc', options.compression);
	    }
	    if (is.defined(options.quality)) {
	      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
	        this.options.heifQuality = options.quality;
	      } else {
	        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
	      }
	    }
	    if (is.defined(options.lossless)) {
	      if (is.bool(options.lossless)) {
	        this.options.heifLossless = options.lossless;
	      } else {
	        throw is.invalidParameterError('lossless', 'boolean', options.lossless);
	      }
	    }
	    if (is.defined(options.effort)) {
	      if (is.integer(options.effort) && is.inRange(options.effort, 0, 9)) {
	        this.options.heifEffort = options.effort;
	      } else {
	        throw is.invalidParameterError('effort', 'integer between 0 and 9', options.effort);
	      }
	    }
	    if (is.defined(options.chromaSubsampling)) {
	      if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ['4:2:0', '4:4:4'])) {
	        this.options.heifChromaSubsampling = options.chromaSubsampling;
	      } else {
	        throw is.invalidParameterError('chromaSubsampling', 'one of: 4:2:0, 4:4:4', options.chromaSubsampling);
	      }
	    }
	    if (is.defined(options.bitdepth)) {
	      if (is.integer(options.bitdepth) && is.inArray(options.bitdepth, [8, 10, 12])) {
	        if (options.bitdepth !== 8 && this.constructor.versions.heif) {
	          throw is.invalidParameterError('bitdepth when using prebuilt binaries', 8, options.bitdepth);
	        }
	        this.options.heifBitdepth = options.bitdepth;
	      } else {
	        throw is.invalidParameterError('bitdepth', '8, 10 or 12', options.bitdepth);
	      }
	    }
	  } else {
	    throw is.invalidParameterError('options', 'Object', options);
	  }
	  return this._updateFormatOut('heif', options);
	}

	/**
	 * Use these JPEG-XL (JXL) options for output image.
	 *
	 * This feature is experimental, please do not use in production systems.
	 *
	 * Requires libvips compiled with support for libjxl.
	 * The prebuilt binaries do not include this - see
	 * {@link /install/#custom-libvips installing a custom libvips}.
	 *
	 * @since 0.31.3
	 *
	 * @param {Object} [options] - output options
	 * @param {number} [options.distance=1.0] - maximum encoding error, between 0 (highest quality) and 15 (lowest quality)
	 * @param {number} [options.quality] - calculate `distance` based on JPEG-like quality, between 1 and 100, overrides distance if specified
	 * @param {number} [options.decodingTier=0] - target decode speed tier, between 0 (highest quality) and 4 (lowest quality)
	 * @param {boolean} [options.lossless=false] - use lossless compression
	 * @param {number} [options.effort=7] - CPU effort, between 1 (fastest) and 9 (slowest)
	 * @param {number} [options.loop=0] - number of animation iterations, use 0 for infinite animation
	 * @param {number|number[]} [options.delay] - delay(s) between animation frames (in milliseconds)
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function jxl (options) {
	  if (is.object(options)) {
	    if (is.defined(options.quality)) {
	      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
	        // https://github.com/libjxl/libjxl/blob/0aeea7f180bafd6893c1db8072dcb67d2aa5b03d/tools/cjxl_main.cc#L640-L644
	        this.options.jxlDistance = options.quality >= 30
	          ? 0.1 + (100 - options.quality) * 0.09
	          : 53 / 3000 * options.quality * options.quality - 23 / 20 * options.quality + 25;
	      } else {
	        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
	      }
	    } else if (is.defined(options.distance)) {
	      if (is.number(options.distance) && is.inRange(options.distance, 0, 15)) {
	        this.options.jxlDistance = options.distance;
	      } else {
	        throw is.invalidParameterError('distance', 'number between 0.0 and 15.0', options.distance);
	      }
	    }
	    if (is.defined(options.decodingTier)) {
	      if (is.integer(options.decodingTier) && is.inRange(options.decodingTier, 0, 4)) {
	        this.options.jxlDecodingTier = options.decodingTier;
	      } else {
	        throw is.invalidParameterError('decodingTier', 'integer between 0 and 4', options.decodingTier);
	      }
	    }
	    if (is.defined(options.lossless)) {
	      if (is.bool(options.lossless)) {
	        this.options.jxlLossless = options.lossless;
	      } else {
	        throw is.invalidParameterError('lossless', 'boolean', options.lossless);
	      }
	    }
	    if (is.defined(options.effort)) {
	      if (is.integer(options.effort) && is.inRange(options.effort, 1, 9)) {
	        this.options.jxlEffort = options.effort;
	      } else {
	        throw is.invalidParameterError('effort', 'integer between 1 and 9', options.effort);
	      }
	    }
	  }
	  trySetAnimationOptions(options, this.options);
	  return this._updateFormatOut('jxl', options);
	}

	/**
	 * Force output to be raw, uncompressed pixel data.
	 * Pixel ordering is left-to-right, top-to-bottom, without padding.
	 * Channel ordering will be RGB or RGBA for non-greyscale colourspaces.
	 *
	 * @example
	 * // Extract raw, unsigned 8-bit RGB pixel data from JPEG input
	 * const { data, info } = await sharp('input.jpg')
	 *   .raw()
	 *   .toBuffer({ resolveWithObject: true });
	 *
	 * @example
	 * // Extract alpha channel as raw, unsigned 16-bit pixel data from PNG input
	 * const data = await sharp('input.png')
	 *   .ensureAlpha()
	 *   .extractChannel(3)
	 *   .toColourspace('b-w')
	 *   .raw({ depth: 'ushort' })
	 *   .toBuffer();
	 *
	 * @param {Object} [options] - output options
	 * @param {string} [options.depth='uchar'] - bit depth, one of: char, uchar (default), short, ushort, int, uint, float, complex, double, dpcomplex
	 * @returns {Sharp}
	 * @throws {Error} Invalid options
	 */
	function raw (options) {
	  if (is.object(options)) {
	    if (is.defined(options.depth)) {
	      if (is.string(options.depth) && is.inArray(options.depth,
	        ['char', 'uchar', 'short', 'ushort', 'int', 'uint', 'float', 'complex', 'double', 'dpcomplex']
	      )) {
	        this.options.rawDepth = options.depth;
	      } else {
	        throw is.invalidParameterError('depth', 'one of: char, uchar, short, ushort, int, uint, float, complex, double, dpcomplex', options.depth);
	      }
	    }
	  }
	  return this._updateFormatOut('raw');
	}

	/**
	 * Use tile-based deep zoom (image pyramid) output.
	 *
	 * Set the format and options for tile images via the `toFormat`, `jpeg`, `png` or `webp` functions.
	 * Use a `.zip` or `.szi` file extension with `toFile` to write to a compressed archive file format.
	 *
	 * The container will be set to `zip` when the output is a Buffer or Stream, otherwise it will default to `fs`.
	 *
	 * @example
	 *  sharp('input.tiff')
	 *   .png()
	 *   .tile({
	 *     size: 512
	 *   })
	 *   .toFile('output.dz', function(err, info) {
	 *     // output.dzi is the Deep Zoom XML definition
	 *     // output_files contains 512x512 tiles grouped by zoom level
	 *   });
	 *
	 * @example
	 * const zipFileWithTiles = await sharp(input)
	 *   .tile({ basename: "tiles" })
	 *   .toBuffer();
	 *
	 * @example
	 * const iiififier = sharp().tile({ layout: "iiif" });
	 * readableStream
	 *   .pipe(iiififier)
	 *   .pipe(writeableStream);
	 *
	 * @param {Object} [options]
	 * @param {number} [options.size=256] tile size in pixels, a value between 1 and 8192.
	 * @param {number} [options.overlap=0] tile overlap in pixels, a value between 0 and 8192.
	 * @param {number} [options.angle=0] tile angle of rotation, must be a multiple of 90.
	 * @param {string|Object} [options.background={r: 255, g: 255, b: 255, alpha: 1}] - background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to white without transparency.
	 * @param {string} [options.depth] how deep to make the pyramid, possible values are `onepixel`, `onetile` or `one`, default based on layout.
	 * @param {number} [options.skipBlanks=-1] Threshold to skip tile generation. Range is 0-255 for 8-bit images, 0-65535 for 16-bit images. Default is 5 for `google` layout, -1 (no skip) otherwise.
	 * @param {string} [options.container='fs'] tile container, with value `fs` (filesystem) or `zip` (compressed file).
	 * @param {string} [options.layout='dz'] filesystem layout, possible values are `dz`, `iiif`, `iiif3`, `zoomify` or `google`.
	 * @param {boolean} [options.centre=false] centre image in tile.
	 * @param {boolean} [options.center=false] alternative spelling of centre.
	 * @param {string} [options.id='https://example.com/iiif'] when `layout` is `iiif`/`iiif3`, sets the `@id`/`id` attribute of `info.json`
	 * @param {string} [options.basename] the name of the directory within the zip file when container is `zip`.
	 * @returns {Sharp}
	 * @throws {Error} Invalid parameters
	 */
	function tile (options) {
	  if (is.object(options)) {
	    // Size of square tiles, in pixels
	    if (is.defined(options.size)) {
	      if (is.integer(options.size) && is.inRange(options.size, 1, 8192)) {
	        this.options.tileSize = options.size;
	      } else {
	        throw is.invalidParameterError('size', 'integer between 1 and 8192', options.size);
	      }
	    }
	    // Overlap of tiles, in pixels
	    if (is.defined(options.overlap)) {
	      if (is.integer(options.overlap) && is.inRange(options.overlap, 0, 8192)) {
	        if (options.overlap > this.options.tileSize) {
	          throw is.invalidParameterError('overlap', `<= size (${this.options.tileSize})`, options.overlap);
	        }
	        this.options.tileOverlap = options.overlap;
	      } else {
	        throw is.invalidParameterError('overlap', 'integer between 0 and 8192', options.overlap);
	      }
	    }
	    // Container
	    if (is.defined(options.container)) {
	      if (is.string(options.container) && is.inArray(options.container, ['fs', 'zip'])) {
	        this.options.tileContainer = options.container;
	      } else {
	        throw is.invalidParameterError('container', 'one of: fs, zip', options.container);
	      }
	    }
	    // Layout
	    if (is.defined(options.layout)) {
	      if (is.string(options.layout) && is.inArray(options.layout, ['dz', 'google', 'iiif', 'iiif3', 'zoomify'])) {
	        this.options.tileLayout = options.layout;
	      } else {
	        throw is.invalidParameterError('layout', 'one of: dz, google, iiif, iiif3, zoomify', options.layout);
	      }
	    }
	    // Angle of rotation,
	    if (is.defined(options.angle)) {
	      if (is.integer(options.angle) && !(options.angle % 90)) {
	        this.options.tileAngle = options.angle;
	      } else {
	        throw is.invalidParameterError('angle', 'positive/negative multiple of 90', options.angle);
	      }
	    }
	    // Background colour
	    this._setBackgroundColourOption('tileBackground', options.background);
	    // Depth of tiles
	    if (is.defined(options.depth)) {
	      if (is.string(options.depth) && is.inArray(options.depth, ['onepixel', 'onetile', 'one'])) {
	        this.options.tileDepth = options.depth;
	      } else {
	        throw is.invalidParameterError('depth', 'one of: onepixel, onetile, one', options.depth);
	      }
	    }
	    // Threshold to skip blank tiles
	    if (is.defined(options.skipBlanks)) {
	      if (is.integer(options.skipBlanks) && is.inRange(options.skipBlanks, -1, 65535)) {
	        this.options.tileSkipBlanks = options.skipBlanks;
	      } else {
	        throw is.invalidParameterError('skipBlanks', 'integer between -1 and 255/65535', options.skipBlanks);
	      }
	    } else if (is.defined(options.layout) && options.layout === 'google') {
	      this.options.tileSkipBlanks = 5;
	    }
	    // Center image in tile
	    const centre = is.bool(options.center) ? options.center : options.centre;
	    if (is.defined(centre)) {
	      this._setBooleanOption('tileCentre', centre);
	    }
	    // @id attribute for IIIF layout
	    if (is.defined(options.id)) {
	      if (is.string(options.id)) {
	        this.options.tileId = options.id;
	      } else {
	        throw is.invalidParameterError('id', 'string', options.id);
	      }
	    }
	    // Basename for zip container
	    if (is.defined(options.basename)) {
	      if (is.string(options.basename)) {
	        this.options.tileBasename = options.basename;
	      } else {
	        throw is.invalidParameterError('basename', 'string', options.basename);
	      }
	    }
	  }
	  // Format
	  if (is.inArray(this.options.formatOut, ['jpeg', 'png', 'webp'])) {
	    this.options.tileFormat = this.options.formatOut;
	  } else if (this.options.formatOut !== 'input') {
	    throw is.invalidParameterError('format', 'one of: jpeg, png, webp', this.options.formatOut);
	  }
	  return this._updateFormatOut('dz');
	}

	/**
	 * Set a timeout for processing, in seconds.
	 * Use a value of zero to continue processing indefinitely, the default behaviour.
	 *
	 * The clock starts when libvips opens an input image for processing.
	 * Time spent waiting for a libuv thread to become available is not included.
	 *
	 * @example
	 * // Ensure processing takes no longer than 3 seconds
	 * try {
	 *   const data = await sharp(input)
	 *     .blur(1000)
	 *     .timeout({ seconds: 3 })
	 *     .toBuffer();
	 * } catch (err) {
	 *   if (err.message.includes('timeout')) { ... }
	 * }
	 *
	 * @since 0.29.2
	 *
	 * @param {Object} options
	 * @param {number} options.seconds - Number of seconds after which processing will be stopped
	 * @returns {Sharp}
	 */
	function timeout (options) {
	  if (!is.plainObject(options)) {
	    throw is.invalidParameterError('options', 'object', options);
	  }
	  if (is.integer(options.seconds) && is.inRange(options.seconds, 0, 3600)) {
	    this.options.timeoutSeconds = options.seconds;
	  } else {
	    throw is.invalidParameterError('seconds', 'integer between 0 and 3600', options.seconds);
	  }
	  return this;
	}

	/**
	 * Update the output format unless options.force is false,
	 * in which case revert to input format.
	 * @private
	 * @param {string} formatOut
	 * @param {Object} [options]
	 * @param {boolean} [options.force=true] - force output format, otherwise attempt to use input format
	 * @returns {Sharp}
	 */
	function _updateFormatOut (formatOut, options) {
	  if (!(is.object(options) && options.force === false)) {
	    this.options.formatOut = formatOut;
	  }
	  return this;
	}

	/**
	 * Update a boolean attribute of the this.options Object.
	 * @private
	 * @param {string} key
	 * @param {boolean} val
	 * @throws {Error} Invalid key
	 */
	function _setBooleanOption (key, val) {
	  if (is.bool(val)) {
	    this.options[key] = val;
	  } else {
	    throw is.invalidParameterError(key, 'boolean', val);
	  }
	}

	/**
	 * Called by a WriteableStream to notify us it is ready for data.
	 * @private
	 */
	function _read () {
	  if (!this.options.streamOut) {
	    this.options.streamOut = true;
	    const stack = Error();
	    this._pipeline(undefined, stack);
	  }
	}

	/**
	 * Invoke the C++ image processing pipeline
	 * Supports callback, stream and promise variants
	 * @private
	 */
	function _pipeline (callback, stack) {
	  if (typeof callback === 'function') {
	    // output=file/buffer
	    if (this._isStreamInput()) {
	      // output=file/buffer, input=stream
	      this.on('finish', () => {
	        this._flattenBufferIn();
	        sharp.pipeline(this.options, (err, data, info) => {
	          if (err) {
	            callback(is.nativeError(err, stack));
	          } else {
	            callback(null, data, info);
	          }
	        });
	      });
	    } else {
	      // output=file/buffer, input=file/buffer
	      sharp.pipeline(this.options, (err, data, info) => {
	        if (err) {
	          callback(is.nativeError(err, stack));
	        } else {
	          callback(null, data, info);
	        }
	      });
	    }
	    return this;
	  } else if (this.options.streamOut) {
	    // output=stream
	    if (this._isStreamInput()) {
	      // output=stream, input=stream
	      this.once('finish', () => {
	        this._flattenBufferIn();
	        sharp.pipeline(this.options, (err, data, info) => {
	          if (err) {
	            this.emit('error', is.nativeError(err, stack));
	          } else {
	            this.emit('info', info);
	            this.push(data);
	          }
	          this.push(null);
	          this.on('end', () => this.emit('close'));
	        });
	      });
	      if (this.streamInFinished) {
	        this.emit('finish');
	      }
	    } else {
	      // output=stream, input=file/buffer
	      sharp.pipeline(this.options, (err, data, info) => {
	        if (err) {
	          this.emit('error', is.nativeError(err, stack));
	        } else {
	          this.emit('info', info);
	          this.push(data);
	        }
	        this.push(null);
	        this.on('end', () => this.emit('close'));
	      });
	    }
	    return this;
	  } else {
	    // output=promise
	    if (this._isStreamInput()) {
	      // output=promise, input=stream
	      return new Promise((resolve, reject) => {
	        this.once('finish', () => {
	          this._flattenBufferIn();
	          sharp.pipeline(this.options, (err, data, info) => {
	            if (err) {
	              reject(is.nativeError(err, stack));
	            } else {
	              if (this.options.resolveWithObject) {
	                resolve({ data, info });
	              } else {
	                resolve(data);
	              }
	            }
	          });
	        });
	      });
	    } else {
	      // output=promise, input=file/buffer
	      return new Promise((resolve, reject) => {
	        sharp.pipeline(this.options, (err, data, info) => {
	          if (err) {
	            reject(is.nativeError(err, stack));
	          } else {
	            if (this.options.resolveWithObject) {
	              resolve({ data, info });
	            } else {
	              resolve(data);
	            }
	          }
	        });
	      });
	    }
	  }
	}

	/**
	 * Decorate the Sharp prototype with output-related functions.
	 * @module Sharp
	 * @private
	 */
	output = (Sharp) => {
	  Object.assign(Sharp.prototype, {
	    // Public
	    toFile,
	    toBuffer,
	    keepExif,
	    withExif,
	    withExifMerge,
	    keepIccProfile,
	    withIccProfile,
	    keepXmp,
	    withXmp,
	    keepMetadata,
	    withMetadata,
	    toFormat,
	    jpeg,
	    jp2,
	    png,
	    webp,
	    tiff,
	    avif,
	    heif,
	    jxl,
	    gif,
	    raw,
	    tile,
	    timeout,
	    // Private
	    _updateFormatOut,
	    _setBooleanOption,
	    _read,
	    _pipeline
	  });
	};
	return output;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var utility;
var hasRequiredUtility;

function requireUtility () {
	if (hasRequiredUtility) return utility;
	hasRequiredUtility = 1;
	const events = require$$0$5;
	const detectLibc = requireDetectLibc();

	const is = requireIs();
	const { runtimePlatformArch } = requireLibvips();
	const sharp = requireSharp();

	const runtimePlatform = runtimePlatformArch();
	const libvipsVersion = sharp.libvipsVersion();

	/**
	 * An Object containing nested boolean values representing the available input and output formats/methods.
	 * @member
	 * @example
	 * console.log(sharp.format);
	 * @returns {Object}
	 */
	const format = sharp.format();
	format.heif.output.alias = ['avif', 'heic'];
	format.jpeg.output.alias = ['jpe', 'jpg'];
	format.tiff.output.alias = ['tif'];
	format.jp2k.output.alias = ['j2c', 'j2k', 'jp2', 'jpx'];

	/**
	 * An Object containing the available interpolators and their proper values
	 * @readonly
	 * @enum {string}
	 */
	const interpolators = {
	  /** [Nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation). Suitable for image enlargement only. */
	  nearest: 'nearest',
	  /** [Bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation). Faster than bicubic but with less smooth results. */
	  bilinear: 'bilinear',
	  /** [Bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default). */
	  bicubic: 'bicubic',
	  /** [LBB interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/lbb.cpp#L100). Prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2. */
	  locallyBoundedBicubic: 'lbb',
	  /** [Nohalo interpolation](http://eprints.soton.ac.uk/268086/). Prevents acutance but typically reduces performance by a factor of 3. */
	  nohalo: 'nohalo',
	  /** [VSQBS interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/vsqbs.cpp#L48). Prevents "staircasing" when enlarging. */
	  vertexSplitQuadraticBasisSpline: 'vsqbs'
	};

	/**
	 * An Object containing the version numbers of sharp, libvips
	 * and (when using prebuilt binaries) its dependencies.
	 *
	 * @member
	 * @example
	 * console.log(sharp.versions);
	 */
	let versions = {
	  vips: libvipsVersion.semver
	};
	/* node:coverage ignore next 15 */
	if (!libvipsVersion.isGlobal) {
	  if (!libvipsVersion.isWasm) {
	    try {
	      versions = commonjsRequire(`@img/sharp-${runtimePlatform}/versions`);
	    } catch (_) {
	      try {
	        versions = commonjsRequire(`@img/sharp-libvips-${runtimePlatform}/versions`);
	      } catch (_) {}
	    }
	  } else {
	    try {
	      versions = require('@img/sharp-wasm32/versions');
	    } catch (_) {}
	  }
	}
	versions.sharp = require$$6.version;

	/* node:coverage ignore next 5 */
	if (versions.heif && format.heif) {
	  // Prebuilt binaries provide AV1
	  format.heif.input.fileSuffix = ['.avif'];
	  format.heif.output.alias = ['avif'];
	}

	/**
	 * Gets or, when options are provided, sets the limits of _libvips'_ operation cache.
	 * Existing entries in the cache will be trimmed after any change in limits.
	 * This method always returns cache statistics,
	 * useful for determining how much working memory is required for a particular task.
	 *
	 * @example
	 * const stats = sharp.cache();
	 * @example
	 * sharp.cache( { items: 200 } );
	 * sharp.cache( { files: 0 } );
	 * sharp.cache(false);
	 *
	 * @param {Object|boolean} [options=true] - Object with the following attributes, or boolean where true uses default cache settings and false removes all caching
	 * @param {number} [options.memory=50] - is the maximum memory in MB to use for this cache
	 * @param {number} [options.files=20] - is the maximum number of files to hold open
	 * @param {number} [options.items=100] - is the maximum number of operations to cache
	 * @returns {Object}
	 */
	function cache (options) {
	  if (is.bool(options)) {
	    if (options) {
	      // Default cache settings of 50MB, 20 files, 100 items
	      return sharp.cache(50, 20, 100);
	    } else {
	      return sharp.cache(0, 0, 0);
	    }
	  } else if (is.object(options)) {
	    return sharp.cache(options.memory, options.files, options.items);
	  } else {
	    return sharp.cache();
	  }
	}
	cache(true);

	/**
	 * Gets or, when a concurrency is provided, sets
	 * the maximum number of threads _libvips_ should use to process _each image_.
	 * These are from a thread pool managed by glib,
	 * which helps avoid the overhead of creating new threads.
	 *
	 * This method always returns the current concurrency.
	 *
	 * The default value is the number of CPU cores,
	 * except when using glibc-based Linux without jemalloc,
	 * where the default is `1` to help reduce memory fragmentation.
	 *
	 * A value of `0` will reset this to the number of CPU cores.
	 *
	 * Some image format libraries spawn additional threads,
	 * e.g. libaom manages its own 4 threads when encoding AVIF images,
	 * and these are independent of the value set here.
	 *
	 * :::note
	 * Further {@link /performance/ control over performance} is available.
	 * :::
	 *
	 * @example
	 * const threads = sharp.concurrency(); // 4
	 * sharp.concurrency(2); // 2
	 * sharp.concurrency(0); // 4
	 *
	 * @param {number} [concurrency]
	 * @returns {number} concurrency
	 */
	function concurrency (concurrency) {
	  return sharp.concurrency(is.integer(concurrency) ? concurrency : null);
	}
	/* node:coverage ignore next 7 */
	if (detectLibc.familySync() === detectLibc.GLIBC && !sharp._isUsingJemalloc()) {
	  // Reduce default concurrency to 1 when using glibc memory allocator
	  sharp.concurrency(1);
	} else if (detectLibc.familySync() === detectLibc.MUSL && sharp.concurrency() === 1024) {
	  // Reduce default concurrency when musl thread over-subscription detected
	  sharp.concurrency(require$$7.availableParallelism());
	}

	/**
	 * An EventEmitter that emits a `change` event when a task is either:
	 * - queued, waiting for _libuv_ to provide a worker thread
	 * - complete
	 * @member
	 * @example
	 * sharp.queue.on('change', function(queueLength) {
	 *   console.log('Queue contains ' + queueLength + ' task(s)');
	 * });
	 */
	const queue = new events.EventEmitter();

	/**
	 * Provides access to internal task counters.
	 * - queue is the number of tasks this module has queued waiting for _libuv_ to provide a worker thread from its pool.
	 * - process is the number of resize tasks currently being processed.
	 *
	 * @example
	 * const counters = sharp.counters(); // { queue: 2, process: 4 }
	 *
	 * @returns {Object}
	 */
	function counters () {
	  return sharp.counters();
	}

	/**
	 * Get and set use of SIMD vector unit instructions.
	 * Requires libvips to have been compiled with highway support.
	 *
	 * Improves the performance of `resize`, `blur` and `sharpen` operations
	 * by taking advantage of the SIMD vector unit of the CPU, e.g. Intel SSE and ARM NEON.
	 *
	 * @example
	 * const simd = sharp.simd();
	 * // simd is `true` if the runtime use of highway is currently enabled
	 * @example
	 * const simd = sharp.simd(false);
	 * // prevent libvips from using highway at runtime
	 *
	 * @param {boolean} [simd=true]
	 * @returns {boolean}
	 */
	function simd (simd) {
	  return sharp.simd(is.bool(simd) ? simd : null);
	}

	/**
	 * Block libvips operations at runtime.
	 *
	 * This is in addition to the `VIPS_BLOCK_UNTRUSTED` environment variable,
	 * which when set will block all "untrusted" operations.
	 *
	 * @since 0.32.4
	 *
	 * @example <caption>Block all TIFF input.</caption>
	 * sharp.block({
	 *   operation: ['VipsForeignLoadTiff']
	 * });
	 *
	 * @param {Object} options
	 * @param {Array<string>} options.operation - List of libvips low-level operation names to block.
	 */
	function block (options) {
	  if (is.object(options)) {
	    if (Array.isArray(options.operation) && options.operation.every(is.string)) {
	      sharp.block(options.operation, true);
	    } else {
	      throw is.invalidParameterError('operation', 'Array<string>', options.operation);
	    }
	  } else {
	    throw is.invalidParameterError('options', 'object', options);
	  }
	}

	/**
	 * Unblock libvips operations at runtime.
	 *
	 * This is useful for defining a list of allowed operations.
	 *
	 * @since 0.32.4
	 *
	 * @example <caption>Block all input except WebP from the filesystem.</caption>
	 * sharp.block({
	 *   operation: ['VipsForeignLoad']
	 * });
	 * sharp.unblock({
	 *   operation: ['VipsForeignLoadWebpFile']
	 * });
	 *
	 * @example <caption>Block all input except JPEG and PNG from a Buffer or Stream.</caption>
	 * sharp.block({
	 *   operation: ['VipsForeignLoad']
	 * });
	 * sharp.unblock({
	 *   operation: ['VipsForeignLoadJpegBuffer', 'VipsForeignLoadPngBuffer']
	 * });
	 *
	 * @param {Object} options
	 * @param {Array<string>} options.operation - List of libvips low-level operation names to unblock.
	 */
	function unblock (options) {
	  if (is.object(options)) {
	    if (Array.isArray(options.operation) && options.operation.every(is.string)) {
	      sharp.block(options.operation, false);
	    } else {
	      throw is.invalidParameterError('operation', 'Array<string>', options.operation);
	    }
	  } else {
	    throw is.invalidParameterError('options', 'object', options);
	  }
	}

	/**
	 * Decorate the Sharp class with utility-related functions.
	 * @module Sharp
	 * @private
	 */
	utility = (Sharp) => {
	  Sharp.cache = cache;
	  Sharp.concurrency = concurrency;
	  Sharp.counters = counters;
	  Sharp.simd = simd;
	  Sharp.format = format;
	  Sharp.interpolators = interpolators;
	  Sharp.versions = versions;
	  Sharp.queue = queue;
	  Sharp.block = block;
	  Sharp.unblock = unblock;
	};
	return utility;
}

/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

var lib;
var hasRequiredLib;

function requireLib () {
	if (hasRequiredLib) return lib;
	hasRequiredLib = 1;
	const Sharp = requireConstructor();
	requireInput()(Sharp);
	requireResize()(Sharp);
	requireComposite()(Sharp);
	requireOperation()(Sharp);
	requireColour()(Sharp);
	requireChannel()(Sharp);
	requireOutput()(Sharp);
	requireUtility()(Sharp);

	lib = Sharp;
	return lib;
}

var libExports = requireLib();
const index = /*@__PURE__*/getDefaultExportFromCjs(libExports);

const index$1 = /*#__PURE__*/_mergeNamespaces({
  __proto__: null,
  default: index
}, [libExports]);

export { _virtual_astro_legacySsrEntry as default };
