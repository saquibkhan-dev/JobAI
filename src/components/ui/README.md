# shadcn/ui primitives

Files referenced elsewhere in this codebase (`button.tsx`, `input.tsx`,
`textarea.tsx`, `dialog.tsx`, `form.tsx`, `skeleton.tsx`, `card.tsx`, etc.) are
generated verbatim by the shadcn CLI and intentionally not hand-copied here —
they're boilerplate, not business logic, and the CLI keeps them in sync with
upstream fixes:

```bash
npx shadcn@latest init
npx shadcn@latest add button input textarea dialog form skeleton card badge \
  select label toast dropdown-menu tabs avatar
```

`components.json` should point `aliases.ui` at `src/components/ui` and
`aliases.components` at `src/components` to match the import paths used
throughout (`@/components/ui/button`, etc.).
