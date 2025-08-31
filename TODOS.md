# Todos

simple task list file what to implement next for short term goals.

- [x] replace the typedoc tool with [glean](./packages/glean/README.md) once
      its working good enough. current state of JSDoc tools is unsatisfactory.
      **COMPLETED:** TypeDoc fully replaced with Glean across all packages with base path support.
- [ ] identify potential issues of beak from the glean project since this
      type of project should uncover lots of rendering edgecases
- [ ] implement an MCP server as glean subcommand to make agents use raven packages (or everything using JS + JSDoc) seamlessly
- [ ] flesh out SPA capabilities until [TodoMVC](https://github.com/tastejs/todomvc/blob/master/app-spec.md) can be implemented nicely as an example app
- [ ] design and build the RavenJS website with raven itself, deploy in SSG mode
