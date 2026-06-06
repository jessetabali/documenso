import type { Route } from './+types/_layout';

export const loader = (_: Route.LoaderArgs) => {
  throw new Response('The legacy embedded authoring builder has been removed. Use /embed/v2/authoring instead.', {
    status: 410,
  });
};

export default function LegacyEmbedAuthoringRemovedLayout() {
  return null;
}
