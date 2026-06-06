import { EnvelopeEditorProvider } from '@documenso/lib/client-only/providers/envelope-editor-provider';
import { DO_NOT_INVALIDATE_QUERY_ON_MUTATION } from '@documenso/lib/constants/trpc';
import { formatDocumentsPath, formatTemplatesPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { Spinner } from '@documenso/ui/primitives/spinner';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { EnvelopeType } from '@prisma/client';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

import { EnvelopeEditor } from '~/components/general/envelope-editor/envelope-editor';
import { EnvelopeEditorRenderProviderWrapper } from '~/components/general/envelope-editor/envelope-editor-renderer-provider-wrapper';
import { GenericErrorLayout } from '~/components/general/generic-error-layout';
import { useCurrentTeam } from '~/providers/team';

import type { Route } from './+types/documents.$id.edit';

export default function EnvelopeEditorPage({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const team = useCurrentTeam();

  const {
    data: envelope,
    isLoading: isLoadingEnvelope,
    isError: isErrorEnvelope,
  } = trpc.envelope.editor.get.useQuery(
    {
      envelopeId: params.id,
    },
    {
      retry: false,
      gcTime: 0,
      ...DO_NOT_INVALIDATE_QUERY_ON_MUTATION,
    },
  );

  /**
   * Redirect users away from envelopes that belong to another team.
   */
  useEffect(() => {
    if (!envelope) {
      return;
    }

    const pathPrefix =
      envelope.type === EnvelopeType.DOCUMENT ? formatDocumentsPath(team.url) : formatTemplatesPath(team.url);

    if (envelope.teamId !== team.id) {
      void navigate(pathPrefix, { replace: true });
    }
  }, [envelope, team, navigate]);

  if (envelope && envelope.teamId !== team.id) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 text-foreground">
        <Spinner />
        <Trans>Redirecting</Trans>
      </div>
    );
  }

  if (isLoadingEnvelope) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 text-foreground">
        <Spinner />
        <Trans>Loading</Trans>
      </div>
    );
  }

  if (isErrorEnvelope || !envelope) {
    return (
      <GenericErrorLayout
        errorCode={404}
        errorCodeMap={{
          404: {
            heading: msg`Not found`,
            subHeading: msg`404 Not found`,
            message: msg`The document you are looking for may have been removed, renamed or may have never existed.`,
          },
        }}
        primaryButton={
          <Button asChild>
            <Link to={`/t/${team.url}/documents`}>
              <Trans>Go home</Trans>
            </Link>
          </Button>
        }
      />
    );
  }

  if (envelope.internalVersion !== 2) {
    const pathPrefix =
      envelope.type === EnvelopeType.DOCUMENT ? formatDocumentsPath(team.url) : formatTemplatesPath(team.url);

    return (
      <GenericErrorLayout
        errorCode={410}
        errorCodeMap={{
          410: {
            heading: msg`Legacy editor unavailable`,
            subHeading: msg`410 Gone`,
            message: msg`The legacy document and template builder has been removed from this fork. Create or edit documents with the V2 envelope editor instead.`,
          },
        }}
        primaryButton={
          <Button asChild>
            <Link to={`${pathPrefix}/${envelope.id}`}>
              <Trans>View document</Trans>
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <EnvelopeEditorProvider initialEnvelope={envelope}>
      <EnvelopeEditorRenderProviderWrapper>
        <EnvelopeEditor />
      </EnvelopeEditorRenderProviderWrapper>
    </EnvelopeEditorProvider>
  );
}
