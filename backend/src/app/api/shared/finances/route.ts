import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

interface Account {
  id: string;
  parcelasTotal?: number | null;
  year?: number;
  month?: number;
}

export async function POST(req: NextRequest) {
  try {
    await initFirestore();

    // ✅ Middleware já validou; aqui só extraímos o payload
    const authToken = req.cookies.get('auth_token')?.value!;
    const user = verifyToken(authToken);

    const { year, month } = await req.json();

    // Shared accounts
    const sharedSnap = await firestore
      .collection('shared_accounts')
      .where('sharedWithUserId', '==', user.id)
      .get();

    // Build map of ownerId -> allowedCollabIds (per link)
    const links = sharedSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as any
    );
    const ownerIds = links.map((l) => l.userId);
    const allUserIds = Array.from(new Set([...ownerIds, user.id]));

    // Colaboradores
    const collabsSnap = await firestore
      .collection('collaborators')
      .where('userId', 'in', allUserIds)
      .get();

    let collabs = collabsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply per-link filtering: if a link has allowedCollabIds, restrict collabs of that owner
    // If allowedCollabIds is an empty array, it means "no restriction" explicitly for this link.
    const perOwnerAllowed = new Map<string, Set<string>>();
    const ownersNoRestriction = new Set<string>();
    for (const link of links) {
      const ownerId = String(link.userId);
      if (Array.isArray(link.allowedCollabIds)) {
        if (link.allowedCollabIds.length > 0) {
          perOwnerAllowed.set(
            ownerId,
            new Set(link.allowedCollabIds.map(String))
          );
        } else {
          ownersNoRestriction.add(ownerId);
        }
      }
    }
    // Fallback to token-level config if link hasn't got a specific list and didn't explicitly set "no restriction"
    if (perOwnerAllowed.size < ownerIds.length) {
      const uniqueOwnerIds = Array.from(new Set(ownerIds.map(String)));
      // Fetch token configs in batches of 10 to respect Firestore 'in' limits
      const batches: string[][] = [];
      for (let i = 0; i < uniqueOwnerIds.length; i += 10)
        batches.push(uniqueOwnerIds.slice(i, i + 10));
      for (const batch of batches) {
        const tokensSnap = await firestore
          .collection('shared_accounts_tokens')
          .where('userId', 'in', batch)
          .get();
        tokensSnap.docs.forEach((doc) => {
          const data: any = doc.data();
          if (
            !perOwnerAllowed.has(String(data.userId)) &&
            !ownersNoRestriction.has(String(data.userId)) &&
            Array.isArray(data.allowedCollabIds) &&
            data.allowedCollabIds.length
          ) {
            perOwnerAllowed.set(
              String(data.userId),
              new Set(data.allowedCollabIds.map(String))
            );
          }
        });
      }
    }
    if (perOwnerAllowed.size) {
      collabs = collabs.filter((c: any) => {
        const ownerId = String(c.userId);
        const allowedSet = perOwnerAllowed.get(ownerId);
        if (!allowedSet) return true; // no restriction for this owner
        return allowedSet.has(String(c.id));
      });
    }
    const collabIds = collabs.map((c) => c.id);

    // Contas relacionadas
    let accounts: Account[] = [];
    if (collabIds.length > 0) {
      const accountsSnap = await firestore
        .collection('accounts')
        .where('collaboratorId', 'in', collabIds)
        .get();

      accounts = accountsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Account
      );
    }

    return NextResponse.json({ accounts, collabs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
