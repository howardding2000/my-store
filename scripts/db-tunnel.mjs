#!/usr/bin/env node
/**
 * db-tunnel.cjs — Local TCP forwarders for Neon Postgres on THIS dev VM.
 *
 * Why: this VM's firewall blocks direct outbound TCP (e.g. port 5432);
 * all egress must go through the HTTP proxy via CONNECT. Prisma's engine
 * cannot do that itself, so we forward local ports through the proxy:
 *
 *   127.0.0.1:5433 -> <neon direct host>:5432   (migrations / DIRECT_URL)
 *   127.0.0.1:5434 -> <neon pooler host>:5432   (app runtime / DATABASE_URL)
 *
 * Security: the forwarder only shuffles bytes. The Postgres TLS handshake
 * and password auth happen end-to-end between the client and Neon, so the
 * tunnel (and the proxy) only ever see ciphertext — never credentials.
 *
 * Usage:  node scripts/db-tunnel.cjs   (keep running while doing DB work:
 *          migrate, seed, `npm run dev`, verification scripts)
 *
 * .env.local points DATABASE_URL/DIRECT_URL at these local ports.
 * On Vercel / normal machines this is unnecessary — use the real Neon URLs.
 */

import net from "node:net";

const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
if (!PROXY) {
  console.error("error: HTTPS_PROXY is not set; this script needs the egress proxy.");
  process.exit(1);
}
const proxyUrl = new URL(PROXY);
const proxyAuth = Buffer.from(
  `${decodeURIComponent(proxyUrl.username)}:${decodeURIComponent(proxyUrl.password)}`
).toString("base64");

const DIRECT_HOST =
  process.env.NEON_DIRECT_HOST || "ep-jolly-dawn-au4lo7e8.c-10.us-east-1.aws.neon.tech";
const POOLER_HOST =
  process.env.NEON_POOLER_HOST || "ep-jolly-dawn-au4lo7e8-pooler.c-10.us-east-1.aws.neon.tech";

function startForwarder(localPort, remoteHost) {
  const server = net.createServer((clientSock) => {
    const proxySock = net.connect(proxyUrl.port || 3128, proxyUrl.hostname);
    let header = Buffer.alloc(0);
    let established = false;

    const fail = (msg) => {
      console.error(`[${localPort}] ${msg}`);
      clientSock.destroy();
      proxySock.destroy();
    };

    proxySock.on("connect", () => {
      const target = `${remoteHost}:5432`;
      proxySock.write(
        `CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\nProxy-Authorization: Basic ${proxyAuth}\r\n\r\n`
      );
    });

    proxySock.on("data", (chunk) => {
      if (established) return;
      header = Buffer.concat([header, chunk]);
      const end = header.indexOf("\r\n\r\n");
      if (end === -1) return; // wait for full response headers
      const statusLine = header.slice(0, end).toString().split("\r\n")[0];
      if (!statusLine.includes("200")) {
        fail(`proxy refused CONNECT to ${remoteHost}:5432: ${statusLine}`);
        return;
      }
      established = true;
      const rest = header.subarray(end + 4);
      header = Buffer.alloc(0);
      proxySock.removeAllListeners("data");
      if (rest.length > 0) proxySock.unshift(rest);
      clientSock.pipe(proxySock);
      proxySock.pipe(clientSock);
    });

    proxySock.on("error", (e) => { if (!established) fail(`proxy error: ${e.message}`); });
    clientSock.on("error", () => proxySock.destroy());
    proxySock.on("close", () => clientSock.destroy());
    clientSock.on("close", () => proxySock.destroy());
  });

  server.on("error", (e) => {
    console.error(`[${localPort}] listen error: ${e.message}`);
    process.exit(1);
  });
  server.listen(localPort, "127.0.0.1", () => {
    console.log(`tunnel up: 127.0.0.1:${localPort} -> ${remoteHost}:5432 (via proxy)`);
  });
}

startForwarder(5433, DIRECT_HOST);
startForwarder(5434, POOLER_HOST);
