---
source_url: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
fetched_at: 2026-11-08
title: "Docker and Node.js Best Practices (nodejs/docker-node)"
---

# Docker and Node.js Best Practices

## Environment Variables

Run with `NODE_ENV` set to `production`. This is the way you would pass in secrets and other runtime configurations to your application as well.

```
-e "NODE_ENV=production"
```

## Upgrading npm

Each `node` Docker image includes npm, bundled with Node.js. If you need to upgrade (or downgrade) the version of npm:

```Dockerfile
RUN npm install --global npm@<version>
```

## Global npm dependencies

Place global npm dependencies in the non-root user directory:

```Dockerfile
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
```

## Handling Kernel Signals

Node.js was not designed to run as PID 1 which leads to unexpected behaviour when running inside of Docker. For example, a Node.js process running as PID 1 will not respond to `SIGINT` (`CTRL-C`) and similar signals. As of Docker 1.13, you can use the `--init` flag to wrap your Node.js process with a lightweight init system that properly handles running as PID 1.

```
docker run -it --init node
```

You can also include Tini directly in your Dockerfile.

## Non-root User

By default, Docker runs commands inside the container as root which violates the Principle of Least Privilege when superuser permissions are not strictly required. The node images provide the `node` user with uid 1000:

```
-u "node"
```

Or in Dockerfile:

```Dockerfile
USER 1000  # node
```

## Memory

If you are running multiple containers on the same host, you should limit how much memory they can consume.

```
-m "300M" --memory-swap "1G"
```

## CMD

Bypass `package.json`'s `start` command and bake Node invocation into the image. This reduces processes and causes exit signals such as `SIGTERM` and `SIGINT` to be received by the Node.js process instead of npm swallowing them.

```Dockerfile
CMD ["node","index.js"]
```

## Docker Run

```
$ docker run   --init   -e "NODE_ENV=production"   -u "node"   -m "300M" --memory-swap "1G"   -w "/home/node/app"   --name "my-nodejs-app"   node [script]
```

## Security

The Docker team provides docker-bench-security for analyzing running containers: https://github.com/docker/docker-bench-security

## node-gyp alpine

```Dockerfile
FROM node:alpine
RUN apk add --no-cache --virtual .gyp python3 py-setuptools make g++     && npm install [ your npm dependencies here ]     && apk del .gyp
```

## Smaller images without npm/yarn

Use multi-stage builds: build with package manager in stage 1; copy node binary + app into slim runtime without npm/yarn; run with dumb-init so Node is not PID 1.

Alpine / Debian examples in the upstream document show `CMD ["dumb-init", "node", "dist/index.js"]`.
