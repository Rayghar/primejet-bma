// functions/index.js

const admin = require('firebase-admin');
const { onDocumentUpdated, onDocumentWritten } = require('firebase-functions/v2/firestore');

admin.initializeApp();
const db = admin.firestore();

/**
 * When a daily summary moves from "pending" to "approved" or "rejected",
 * update all associated data_entries with the same status & review metadata.
 */
exports.updateEntriesOnSummaryApproval = onDocumentUpdated(
  'artifacts/{appId}/daily_summaries/{summaryId}',
  async (event) => {
    const after = event.data.after.data();
    const before = event.data.before.data();
    const { appId, summaryId } = event.params;

    const statusChangedFromPending =
      before.status === 'pending' &&
      (after.status === 'approved' || after.status === 'rejected');

    if (!statusChangedFromPending) {
      return null;
    }

    const entriesSnapshot = await db
      .collection('artifacts')
      .doc(appId)
      .collection('data_entries')
      .where('dailySummaryId', '==', summaryId)
      .get();

    if (entriesSnapshot.empty) {
      return null;
    }

    const batch = db.batch();
    entriesSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        status: after.status,
        reviewedBy: after.reviewedBy,
        reviewedAt: after.reviewedAt,
      });
    });
    await batch.commit();
    // eslint-disable-next-line no-console
    console.log(`Updated ${entriesSnapshot.size} entries for summary ${summaryId} to ${after.status}.`);
    return null;
  }
);

/**
 * Maintain a per-month aggregate when entries flip in/out of "approved".
 * Affects totals for revenue, expenses, and kgSold.
 */
exports.aggregateApprovedTransactions = onDocumentWritten(
  'artifacts/{appId}/data_entries/{entryId}',
  async (event) => {
    const after = event.data.after.exists ? event.data.after.data() : null;
    const before = event.data.before.exists ? event.data.before.data() : null;
    const { appId } = event.params;

    const wasApproved = Boolean(before && before.status === 'approved');
    const isApproved = Boolean(after && after.status === 'approved');

    if (wasApproved === isApproved) {
      return null;
    }

    const data = isApproved ? after : before;

    const rawDate = data.date;
    const entryDate =
      rawDate && typeof rawDate.toDate === 'function' ? rawDate.toDate() : new Date(rawDate);

    const year = entryDate.getFullYear();
    const month = entryDate.getMonth() + 1;
    const monthKey = `${year}-${month}`;

    let revenueDelta = 0;
    let expensesDelta = 0;
    let kgSoldDelta = 0;

    if (isApproved) {
      revenueDelta = data.type === 'sale' ? data.revenue || 0 : 0;
      expensesDelta = data.type === 'expense' ? data.amount || 0 : 0;
      kgSoldDelta = data.type === 'sale' ? data.kgSold || 0 : 0;
    } else {
      revenueDelta = data.type === 'sale' ? -(data.revenue || 0) : 0;
      expensesDelta = data.type === 'expense' ? -(data.amount || 0) : 0;
      kgSoldDelta = data.type === 'sale' ? -(data.kgSold || 0) : 0;
    }

    const monthlyReportRef = db
      .collection('artifacts')
      .doc(appId)
      .collection('monthly_reports')
      .doc(monthKey);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(monthlyReportRef);
      let totalRevenue = revenueDelta;
      let totalExpenses = expensesDelta;
      let totalKgSold = kgSoldDelta;

      if (snap.exists) {
        const existing = snap.data();
        totalRevenue += existing.totalRevenue || 0;
        totalExpenses += existing.totalExpenses || 0;
        totalKgSold += existing.totalKgSold || 0;
      }

      tx.set(
        monthlyReportRef,
        {
          month,
          year,
          totalRevenue,
          totalExpenses,
          totalKgSold,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // eslint-disable-next-line no-console
    console.log(`Monthly report for ${monthKey} updated.`);
    return null;
  }
);

/**
 * Keep live bulk inventory up to date.
 * Trigger: writes in `stock_ins` (quantityKg) and `data_entries` (approved sales).
 */
exports.updateBulkInventory = onDocumentWritten(
  'artifacts/{appId}/{collectionName}/{docId}',
  async (event) => {
    const after = event.data.after.exists ? event.data.after.data() : null;
    const before = event.data.before.exists ? event.data.before.data() : null;
    const { appId, collectionName } = event.params;

    if (collectionName !== 'stock_ins' && collectionName !== 'data_entries') {
      return null;
    }

    let quantityDelta = 0;

    const isSale = collectionName === 'data_entries' && after && after.type === 'sale';
    const isApprovedNow = isSale && after.status === 'approved';
    const wasApprovedBefore = isSale && before && before.status === 'approved';
    const isStockIn = collectionName === 'stock_ins';

    if (isStockIn) {
      const afterKg = after ? after.quantityKg || 0 : 0;
      const beforeKg = before ? before.quantityKg || 0 : 0;
      quantityDelta = afterKg - beforeKg;
    } else if (isSale && isApprovedNow && !wasApprovedBefore) {
      quantityDelta = -(after.kgSold || 0);
    } else if (isSale && !isApprovedNow && wasApprovedBefore) {
      quantityDelta = before.kgSold || 0;
    } else if (isSale && isApprovedNow && wasApprovedBefore) {
      const afterKg = after.kgSold || 0;
      const beforeKg = before.kgSold || 0;
      quantityDelta = beforeKg - afterKg;
    }

    if (quantityDelta === 0) {
      return null;
    }

    const inventoryRef = db
      .collection('artifacts')
      .doc(appId)
      .collection('live_inventory')
      .doc('bulk_stock');

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(inventoryRef);
      let currentStock = quantityDelta;

      if (snap.exists) {
        const existing = snap.data();
        currentStock += existing.currentStock || 0;
      }

      tx.set(
        inventoryRef,
        {
          currentStock,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // eslint-disable-next-line no-console
    console.log(`Live bulk inventory updated by ${quantityDelta} kg for app ${appId}.`);
    return null;
  }
);
