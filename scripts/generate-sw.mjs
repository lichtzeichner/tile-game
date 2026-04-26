import { promises as fs } from "node:fs"
import path from "node:path"

const outDir = path.join(process.cwd(), "out")
const serviceWorkerPath = path.join(outDir, "sw.js")
const appShellPath = "/exponentile.html"
const cacheName = `exponentile-${Date.now()}`

const files = await collectFiles(outDir)

const precacheUrls = [...new Set(files.flatMap(toPrecacheUrls))]
  .filter((filePath) => filePath !== "/sw.js")
  .sort()

const serviceWorkerSource = `const CACHE_NAME = ${JSON.stringify(cacheName)}
const APP_SHELL_URL = ${JSON.stringify(appShellPath)}
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => {
      return self.skipWaiting()
    }),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      )
    }).then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, url))
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
        }

        return response
      })
    }),
  )
})

async function handleNavigation(request, url) {
  try {
    const response = await fetch(request)

    if (response.ok) {
      const responseCopy = response.clone()
      void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
    }

    return response
  } catch {
    const htmlPath = url.pathname.endsWith("/")
      ? url.pathname + "index.html"
      : url.pathname + ".html"

    return (
      (await caches.match(request)) ||
      (await caches.match(url.pathname)) ||
      (await caches.match(htmlPath)) ||
      (await caches.match(APP_SHELL_URL))
    )
  }
}
`

await fs.writeFile(serviceWorkerPath, serviceWorkerSource)

async function collectFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return collectFiles(entryPath)
      }

      return [entryPath]
    }),
  )

  return files.flat()
}

function toPrecacheUrls(filePath) {
  const relativePath = path.relative(outDir, filePath).split(path.sep).join("/")
  const urlPath = `/${relativePath}`

  if (!relativePath.endsWith(".html")) {
    return [urlPath]
  }

  if (relativePath === "index.html") {
    return ["/", "/index.html"]
  }

  const routePath = `/${relativePath.slice(0, -".html".length)}`

  return [routePath, urlPath]
}
