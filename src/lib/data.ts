import { db } from '../supabase';
import type { Collection, Risk, Mitigation, Comment, LogEntry } from '../types';

// ─── team / members ──────────────────────────────────────────────

export interface Member {
  membershipId: string;
  userId: string;
  role: string;
  name: string;
  email: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
}

export async function loadMembers(orgId: string): Promise<Member[]> {
  const { data: mems } = await db
    .from('memberships').select('id, user_id, role').eq('org_id', orgId);
  if (!mems || mems.length === 0) return [];

  const userIds = mems.map((m: any) => m.user_id);
  const { data: profs } = await db
    .from('profiles').select('id, full_name, email').in('id', userIds);
  const profMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));

  return mems.map((m: any) => ({
    membershipId: m.id,
    userId: m.user_id,
    role: m.role,
    name: profMap[m.user_id]?.full_name || profMap[m.user_id]?.email || 'Ukjent',
    email: profMap[m.user_id]?.email || '',
  }));
}

export async function loadInvitations(orgId: string): Promise<Invitation[]> {
  const { data } = await db
    .from('invitations').select('id, email, role').eq('org_id', orgId).order('created_at');
  return (data || []).map((r: any) => ({ id: r.id, email: r.email, role: r.role }));
}

export async function dbInviteMember(
  orgId: string, email: string, role: string, invitedBy: string,
): Promise<'added' | 'invited' | 'already_member'> {
  // Check if already member
  const { data: existingMem } = await db
    .from('memberships').select('id')
    .eq('org_id', orgId)
    .eq('user_id', (await db.from('profiles').select('id').eq('email', email).maybeSingle()).data?.id || '')
    .maybeSingle();
  if (existingMem) return 'already_member';

  // Check if profile exists with this email
  const { data: profile } = await db
    .from('profiles').select('id').eq('email', email).maybeSingle();

  if (profile) {
    await db.from('memberships').insert({ org_id: orgId, user_id: profile.id, role, invited_by: invitedBy });
    return 'added';
  }

  // Not registered yet — store pending invitation
  await db.from('invitations').upsert(
    { org_id: orgId, email, role, invited_by: invitedBy },
    { onConflict: 'org_id,email' },
  );
  return 'invited';
}

export async function dbRemoveMember(membershipId: string): Promise<void> {
  await db.from('memberships').delete().eq('id', membershipId);
}

export async function dbChangeRole(membershipId: string, role: string): Promise<void> {
  await db.from('memberships').update({ role }).eq('id', membershipId);
}

export async function dbRemoveInvitation(id: string): Promise<void> {
  await db.from('invitations').delete().eq('id', id);
}

export async function dbAcceptInvitations(): Promise<void> {
  await db.rpc('accept_pending_invitations');
}

export async function loadOrgProfiles(orgId: string): Promise<{ id: string; full_name: string; email: string }[]> {
  const { data } = await db
    .from('memberships')
    .select('profiles(id, full_name, email)')
    .eq('org_id', orgId);
  return (data || []).map((m: any) => m.profiles).filter(Boolean);
}

// ─── profile ────────────────────────────────────────────────────

export async function dbUpdateProfile(userId: string, fullName: string): Promise<void> {
  await Promise.all([
    db.auth.updateUser({ data: { full_name: fullName } }),
    db.from('profiles').update({ full_name: fullName }).eq('id', userId),
  ]);
}

// ─── org setup ──────────────────────────────────────────────────

export interface OrgInfo {
  id: string;
  name: string;
  role: string;
  isPersonal: boolean;
}

export async function loadMyOrgs(userId: string): Promise<OrgInfo[]> {
  const { data } = await db
    .from('memberships')
    .select('org_id, role, organizations(name, is_personal)')
    .eq('user_id', userId);
  return (data || []).map((m: any) => ({
    id: m.org_id,
    name: m.organizations?.name || 'Workspace',
    role: m.role,
    isPersonal: !!m.organizations?.is_personal,
  }));
}

export async function createPersonalOrg(displayName: string): Promise<string> {
  const slug =
    displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36) +
    '-' + Math.random().toString(36).slice(2, 6);
  const { data, error } = await db.rpc('create_my_org', {
    org_name: displayName + 's workspace',
    org_slug: slug,
  });
  if (error) throw new Error('Kunne ikke opprette org: ' + error.message);
  return data as string;
}

// ─── helpers ────────────────────────────────────────────────────

function groupBy<T extends Record<string, any>>(arr: T[], key: string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function mapComment(c: any, profileMap: Record<string, string>): Comment {
  return {
    id: c.id,
    ts: new Date(c.created_at).getTime(),
    user: profileMap[c.user_id] || 'Bruker',
    text: c.text,
  };
}

function mapLog(l: any): LogEntry {
  return {
    id: l.id,
    ts: new Date(l.created_at).getTime(),
    user: l.user_name,
    text: l.entry_text,
    prevP: l.prev_p ?? undefined,
    prevC: l.prev_c ?? undefined,
    newP: l.new_p ?? undefined,
    newC: l.new_c ?? undefined,
  };
}

// ─── load workspace ─────────────────────────────────────────────

export interface WorkspaceData {
  collections: Collection[];
  tagRows: { id: string; name: string }[];
}

export async function loadWorkspace(orgId: string): Promise<WorkspaceData> {
  const { data: tagRows } = await db.from('tags').select('id, name').eq('org_id', orgId);
  const tags = tagRows || [];
  const tagIdToName = Object.fromEntries(tags.map(t => [t.id, t.name]));

  const { data: cols } = await db
    .from('collections').select('*').eq('org_id', orgId).order('sort_order');
  if (!cols || cols.length === 0) return { collections: [], tagRows: tags };

  const colIds = cols.map(c => c.id);
  const { data: risks } = await db
    .from('risks').select('*').in('collection_id', colIds).order('sort_order');
  const allRisks = risks || [];
  const riskIds = allRisks.map(r => r.id);

  const [riskTagRows, mits, riskComments, logRows] = await Promise.all([
    riskIds.length ? db.from('risk_tags').select('risk_id, tag_id').in('risk_id', riskIds) : { data: [] },
    riskIds.length ? db.from('mitigations').select('*').in('risk_id', riskIds).order('sort_order') : { data: [] },
    riskIds.length ? db.from('comments').select('*').in('risk_id', riskIds).order('created_at') : { data: [] },
    riskIds.length ? db.from('risk_log').select('*').in('risk_id', riskIds).order('created_at') : { data: [] },
  ]);

  const mitIds = (mits.data || []).map((m: any) => m.id);
  const { data: mitComments } = mitIds.length
    ? await db.from('comments').select('*').in('mitigation_id', mitIds).order('created_at')
    : { data: [] };

  // Load profiles for comment user names
  const allComments = [...(riskComments.data || []), ...(mitComments || [])];
  const userIds = [...new Set(allComments.map((c: any) => c.user_id))];
  const { data: commentProfiles } = userIds.length
    ? await db.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((commentProfiles || []).map((p: any) => [p.id, p.full_name || 'Bruker']));

  // Group data by parent id
  const mitsByRisk      = groupBy(mits.data || [], 'risk_id');
  const rCmtsByRisk     = groupBy(riskComments.data || [], 'risk_id');
  const mCmtsByMit      = groupBy(mitComments || [], 'mitigation_id');
  const logByRisk       = groupBy(logRows.data || [], 'risk_id');
  const tagsByRisk: Record<string, string[]> = {};
  (riskTagRows.data || []).forEach((rt: any) => {
    if (!tagsByRisk[rt.risk_id]) tagsByRisk[rt.risk_id] = [];
    const name = tagIdToName[rt.tag_id];
    if (name) tagsByRisk[rt.risk_id].push(name);
  });

  // Assemble risks
  const risksByCol: Record<string, Risk[]> = {};
  for (const r of allRisks) {
    const assembledMits: Mitigation[] = (mitsByRisk[r.id] || []).map((m: any) => ({
      id: m.id,
      label: m.label,
      owner: m.owner_name || '',
      due: m.due_date || '',
      done: m.done,
      deltaP: m.delta_p,
      deltaC: m.delta_c,
      comments: (mCmtsByMit[m.id] || []).map((c: any) => mapComment(c, profileMap)),
    }));
    const risk: Risk = {
      id: r.id,
      title: r.title,
      description: r.description || '',
      owner: r.owner_name || '',
      tags: tagsByRisk[r.id] || [],
      p: r.probability,
      c: r.consequence,
      mitigations: assembledMits,
      comments: (rCmtsByRisk[r.id] || []).map((c: any) => mapComment(c, profileMap)),
      log: (logByRisk[r.id] || []).map(mapLog),
    };
    if (!risksByCol[r.collection_id]) risksByCol[r.collection_id] = [];
    risksByCol[r.collection_id].push(risk);
  }

  const collections: Collection[] = cols.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    owner: c.owner_name || '',
    period: c.period || '',
    scale: c.scale,
    risks: risksByCol[c.id] || [],
  }));

  return { collections, tagRows: tags };
}

// ─── tags ───────────────────────────────────────────────────────

export async function dbEnsureTag(orgId: string, name: string, tagRows: { id: string; name: string }[]): Promise<string> {
  const existing = tagRows.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  const { data } = await db
    .from('tags')
    .upsert({ org_id: orgId, name }, { onConflict: 'org_id,name' })
    .select('id')
    .single();
  return data!.id;
}

export async function dbDeleteTag(orgId: string, name: string): Promise<void> {
  await db.from('tags').delete().eq('org_id', orgId).eq('name', name);
}

async function syncRiskTags(riskId: string, orgId: string, tagNames: string[], tagRows: { id: string; name: string }[]): Promise<void> {
  await db.from('risk_tags').delete().eq('risk_id', riskId);
  if (tagNames.length === 0) return;
  const tagIds = await Promise.all(tagNames.map(n => dbEnsureTag(orgId, n, tagRows)));
  await db.from('risk_tags').insert(tagIds.map(tagId => ({ risk_id: riskId, tag_id: tagId })));
}

// ─── collections ────────────────────────────────────────────────

export async function dbMoveCollection(collectionId: string, targetOrgId: string): Promise<void> {
  // Get risks in this collection
  const { data: risks } = await db.from('risks').select('id').eq('collection_id', collectionId);
  const riskIds = (risks || []).map((r: any) => r.id);

  if (riskIds.length > 0) {
    // Get all tag names used by these risks
    const { data: rtRows } = await db
      .from('risk_tags')
      .select('risk_id, tag_id, tags(name)')
      .in('risk_id', riskIds);

    const allRt = rtRows || [];
    const tagNames = [...new Set(allRt.map((rt: any) => rt.tags?.name).filter(Boolean))] as string[];

    if (tagNames.length > 0) {
      // Ensure tags exist in target org and build old→new ID map
      const newIds = await Promise.all(tagNames.map(n => dbEnsureTag(targetOrgId, n, [])));
      const nameToNewId = Object.fromEntries(tagNames.map((n, i) => [n, newIds[i]]));

      // Re-point risk_tags to the new tag IDs
      for (const rt of allRt) {
        const newTagId = nameToNewId[(rt as any).tags?.name];
        if (newTagId && newTagId !== rt.tag_id) {
          await db.from('risk_tags')
            .update({ tag_id: newTagId })
            .eq('risk_id', rt.risk_id)
            .eq('tag_id', rt.tag_id);
        }
      }
    }
  }

  const { error } = await db.from('collections').update({ org_id: targetOrgId }).eq('id', collectionId);
  if (error) throw error;
}

export async function dbInsertCollection(orgId: string, input: Omit<Collection, 'id' | 'risks'>): Promise<string> {
  const { data, error } = await db.from('collections').insert({
    org_id: orgId,
    name: input.name,
    description: input.description,
    owner_name: input.owner,
    period: input.period,
    scale: input.scale,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function dbUpdateCollection(id: string, input: Omit<Collection, 'id' | 'risks'>): Promise<void> {
  await db.from('collections').update({
    name: input.name,
    description: input.description,
    owner_name: input.owner,
    period: input.period,
    scale: input.scale,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
}

export async function dbDeleteCollection(id: string): Promise<void> {
  await db.from('collections').delete().eq('id', id);
}

// ─── risks ──────────────────────────────────────────────────────

export async function dbInsertRisk(
  collectionId: string,
  orgId: string,
  input: { title: string; description: string; owner: string; tags: string[]; p: number; c: number },
  tagRows: { id: string; name: string }[],
): Promise<string> {
  const { data, error } = await db.from('risks').insert({
    collection_id: collectionId,
    title: input.title,
    description: input.description,
    owner_name: input.owner,
    probability: input.p,
    consequence: input.c,
  }).select('id').single();
  if (error) throw error;

  if (input.tags.length > 0) {
    const tagIds = await Promise.all(input.tags.map(n => dbEnsureTag(orgId, n, tagRows)));
    await db.from('risk_tags').insert(tagIds.map(tagId => ({ risk_id: data.id, tag_id: tagId })));
  }
  return data.id;
}

export async function dbDeleteRisk(id: string): Promise<void> {
  await db.from('risks').delete().eq('id', id);
}

// ─── risk sync (diff-based) ──────────────────────────────────────

export async function dbSyncRisk(
  oldRisk: Risk,
  newRisk: Risk,
  orgId: string,
  userId: string,
  userDisplayName: string,
  tagRows: { id: string; name: string }[],
  idMap: Map<string, string>,
): Promise<void> {
  const resolve = (id: string) => idMap.get(id) || id;
  const riskDbId = resolve(newRisk.id);

  // 1. Core fields
  if (
    oldRisk.title !== newRisk.title ||
    oldRisk.description !== newRisk.description ||
    oldRisk.owner !== newRisk.owner ||
    oldRisk.p !== newRisk.p ||
    oldRisk.c !== newRisk.c
  ) {
    await db.from('risks').update({
      title: newRisk.title,
      description: newRisk.description,
      owner_name: newRisk.owner,
      probability: newRisk.p,
      consequence: newRisk.c,
      updated_at: new Date().toISOString(),
    }).eq('id', riskDbId);
  }

  // 2. Tags
  const oldTags = [...(oldRisk.tags || [])].sort().join(',');
  const newTags = [...(newRisk.tags || [])].sort().join(',');
  if (oldTags !== newTags) {
    await syncRiskTags(riskDbId, orgId, newRisk.tags || [], tagRows);
  }

  // 3. Mitigations
  const oldMitMap = Object.fromEntries((oldRisk.mitigations || []).map(m => [m.id, m]));
  const newMitMap = Object.fromEntries((newRisk.mitigations || []).map(m => [m.id, m]));

  for (const m of (newRisk.mitigations || [])) {
    if (!oldMitMap[m.id]) {
      // New mitigation
      const { data } = await db.from('mitigations').insert({
        risk_id: riskDbId,
        label: m.label,
        owner_name: m.owner,
        due_date: m.due || null,
        done: m.done,
        delta_p: m.deltaP || 0,
        delta_c: m.deltaC || 0,
      }).select('id').single();
      if (data) idMap.set(m.id, data.id);
    } else {
      // Possibly updated
      const old = oldMitMap[m.id];
      if (old.label !== m.label || old.owner !== m.owner || old.due !== m.due ||
          old.done !== m.done || old.deltaP !== m.deltaP || old.deltaC !== m.deltaC) {
        await db.from('mitigations').update({
          label: m.label, owner_name: m.owner, due_date: m.due || null,
          done: m.done, delta_p: m.deltaP || 0, delta_c: m.deltaC || 0,
          updated_at: new Date().toISOString(),
        }).eq('id', resolve(m.id));
      }
      // Mit comments
      await syncComments(old.comments || [], m.comments || [], null, resolve(m.id), userId, idMap);
    }
  }
  for (const m of (oldRisk.mitigations || [])) {
    if (!newMitMap[m.id]) {
      await db.from('mitigations').delete().eq('id', resolve(m.id));
    }
  }

  // 4. Risk comments
  await syncComments(oldRisk.comments || [], newRisk.comments || [], riskDbId, null, userId, idMap);

  // 5. New log entries
  const oldLogIds = new Set((oldRisk.log || []).map(l => l.id));
  for (const l of (newRisk.log || [])) {
    if (!oldLogIds.has(l.id)) {
      const { data } = await db.from('risk_log').insert({
        risk_id: riskDbId,
        user_id: userId,
        user_name: userDisplayName,
        prev_p: l.prevP ?? null,
        prev_c: l.prevC ?? null,
        new_p: l.newP ?? null,
        new_c: l.newC ?? null,
        entry_text: l.text,
      }).select('id').single();
      if (data) idMap.set(l.id, data.id);
    }
  }
}

async function syncComments(
  oldCmts: Comment[],
  newCmts: Comment[],
  riskId: string | null,
  mitId: string | null,
  userId: string,
  idMap: Map<string, string>,
): Promise<void> {
  const resolve = (id: string) => idMap.get(id) || id;
  const oldIds = new Set(oldCmts.map(c => c.id));
  const newIds = new Set(newCmts.map(c => c.id));

  for (const c of newCmts) {
    if (!oldIds.has(c.id)) {
      const { data } = await db.from('comments').insert({
        risk_id: riskId,
        mitigation_id: mitId,
        user_id: userId,
        text: c.text,
      }).select('id').single();
      if (data) idMap.set(c.id, data.id);
    }
  }
  for (const c of oldCmts) {
    if (!newIds.has(c.id)) {
      await db.from('comments').delete().eq('id', resolve(c.id));
    }
  }
}
