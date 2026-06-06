import type { Route } from './+types/documents.$id.edit';

export function loader(_: Route.LoaderArgs) {
  throw new Response('The legacy document builder has been removed. Use the V2 envelope editor instead.', {
    status: 410,
  });
}

export default function LegacyDocumentEditorRemovedPage() {
  return null;
}
