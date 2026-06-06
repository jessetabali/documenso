import type { Route } from './+types/templates.$id.edit';

export function loader(_: Route.LoaderArgs) {
  throw new Response('The legacy template builder has been removed. Use the V2 envelope editor instead.', {
    status: 410,
  });
}

export default function LegacyTemplateEditorRemovedPage() {
  return null;
}
