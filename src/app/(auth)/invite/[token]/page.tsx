import type { Metadata } from 'next';
import { InviteForm, InviteInvalid } from '@/features/auth/InviteForm';
import { getAuth } from '@/lib/auth/dal';
import { findInvite, getDb } from '@/lib/auth/store';
import { durationText, maskPhoneIntl } from '@/lib/format';
import { ROLES, scopeRole } from '@/lib/roles';
import { toneColor } from '@/lib/tones';

export const metadata: Metadata = { title: 'دعوة انضمام' };

export default async function InvitePage(props: PageProps<'/invite/[token]'>) {
  const { token } = await props.params;
  const db = await getDb();
  const found = findInvite(db, token);
  if (!found) return <InviteInvalid />;

  const { invite, user, expiresIn } = found;
  const role = scopeRole(ROLES[user.role], user.branch);
  const auth = await getAuth();

  return (
    <InviteForm
      token={token}
      name={user.name}
      phone={maskPhoneIntl(user.phone)}
      inviter={db.users.get(invite.invitedBy)?.name ?? 'مدير النظام'}
      roleName={role.name}
      roleTone={toneColor(role.tone)}
      scope={role.scope}
      note={role.note}
      expires={durationText(expiresIn)}
      signedInAs={auth.status === 'signed-out' ? null : auth.user.name}
    />
  );
}
