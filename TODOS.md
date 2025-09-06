# Todos

simple task list file what to implement next for short term goals.

- [ ] identify potential issues of beak from the glean project since this
      type of project should uncover lots of rendering edgecases
- [ ] implement an MCP server as glean subcommand to make agents use raven packages (or everything using JS + JSDoc) seamlessly
- [ ] flesh out SPA capabilities until [TodoMVC](https://github.com/tastejs/todomvc/blob/master/app-spec.md) can be implemented nicely as an example app
- [ ] design and build the RavenJS website with raven itself, deploy in SSG mode
- [ ] reflex ssr: refa to use request data (domain, cookies, ...) automatically and/or a local resolver for performance
- [ ] wings browser router (path + hash)
- [ ] wings automatic secondary trie registers (head, options, ...)
- [ ] hatch incremental project creation with different template choices
- [ ] make the wings/server boot in http2 mode when certificate provided

- initial set of soar targets:

      - [ ] DO droplets (ssh/scp)
      - [ ] DO functions
      - [ ] DO spaces+CDN (static)
      - [x] CF workers (static)
      - [ ] CF workers (serverless backend)
      - [ ] AWS S3+CF (static)
      - [ ] AWS Lambda+CF (serverless backend)
      - [ ] AWS EC2 (ssh/scp)
