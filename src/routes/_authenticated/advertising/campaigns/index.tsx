import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/advertising/campaigns/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/advertising/campaigns/"!</div>
}
