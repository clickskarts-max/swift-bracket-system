import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/advertising/campaign/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/advertising/campaign/"!</div>
}
