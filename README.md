# FrondJS Development Server
This is a simple node.js static file server. Frond apps uses this development server by default.

Install with:
```sh
npm i -g @frondjs/dev-server
```

Usage:
```sh
frond-dev-server --help
```
```sh
frond-dev-server <cmd> [args]

Commands:
  frond-dev-server start  Starts a server.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

The only command is start:
```sh
frond-dev-server start --help
```
```sh
frond-dev-server start

Starts a server.

Positionals:
  publicpath  The server will serve all of the files under this directory.
                                                     [string] [default: "build"]
  port        The server will be accessible through this port.
                                                        [number] [default: 8080]
  silent      Don\'t stdout.                           [boolean] [default: false]
  watch       The app will rebuild itself on codebase change if set.
                                                       [string] [default: false]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```
