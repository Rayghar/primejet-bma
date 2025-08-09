// functions/index.js (Refactored and Corrected)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Use functions.config() for environment-specific variables
const config = functions.config();
const APP_ID = config.app.id;

/**
 * Cloud Function that is triggered when a 'daily_summary' is approved or rejected.
 * It updates all associated 'data_entries' with the new status.
 */
exports.updateEntriesOnSummaryApproval = functions.firestore
    .document(`artifacts/${APP_ID}/daily_summaries/{summaryId}`)
    .onUpdate(async (change, context) => {
      const after = change.after.data();
      const before = change.before.data();

      // Only proceed if status has changed and is now 'approved' or 'rejected'
      if (before.status === "pending" &&
          (after.status === "approved" || after.status === "rejected")) {
        const dataEntryCollection = db.collection("artifacts")
            .doc(APP_ID).collection("data_entries");

        // Get all entries associated with this summary
        const entriesQuery = dataEntryCollection
            .where("dailySummaryId", "==", context.params.summaryId);
        const entriesSnapshot = await entriesQuery.get();

        if (!entriesSnapshot.empty) {
          const batch = db.batch();
          entriesSnapshot.forEach((doc) => {
            batch.update(doc.ref, {
              status: after.status,
              reviewedBy: after.reviewedBy,
              reviewedAt: after.reviewedAt,
            });
          });
          await batch.commit();
          console.log(`Updated ${entriesSnapshot.size} entries for summary ` +
                `${context.params.summaryId} to status: ${after.status}.`);
        }
      }
      return null;
    });


/**
 * Cloud Function that is triggered when a 'data_entry' is created or updated.
 * It correctly handles changes in 'approved' status to update monthly reports.
 */
exports.aggregateApprovedTransactions = functions.firestore
    .document(`artifacts/${APP_ID}/data_entries/{entryId}`)
    .onWrite(async (change, context) => {
      const after = change.after.data();
      const before = change.before.data();

      // Only run if the status is related to 'approved'
      const isBeforeApproved = before && before.status === "approved";
      const isAfterApproved = after && after.status === "approved";

      if (isBeforeApproved === isAfterApproved) {
        return null; // No change in approved status, no update needed
      }

      const data = isAfterApproved ? after : before;
      const entryDate = data.date.toDate();
      const year = entryDate.getFullYear();
      const month = entryDate.getMonth() + 1;
      const monthKey = `${year}-${month}`;

      let revenueDelta = 0;
      let expensesDelta = 0;
      let kgSoldDelta = 0;

      if (isAfterApproved) {
        // Document became approved
        revenueDelta = data.type === "sale" ? (data.revenue || 0) : 0;
        expensesDelta = data.type === "expense" ? (data.amount || 0) : 0;
        kgSoldDelta = data.type === "sale" ? (data.kgSold || 0) : 0;
      } else {
        // Document was approved and is no longer
        revenueDelta = data.type === "sale" ? -(data.revenue || 0) : 0;
        expensesDelta = data.type === "expense" ? -(data.amount || 0) : 0;
        kgSoldDelta = data.type === "sale" ? -(data.kgSold || 0) : 0;
      }

      const monthlyReportRef = db.collection("artifacts").doc(APP_ID)
          .collection("monthly_reports").doc(monthKey);

      return db.runTransaction(async (transaction) => {
        const monthlyReportDoc = await transaction.get(monthlyReportRef);
        let totalRevenue = revenueDelta;
        let totalExpenses = expensesDelta;
        let totalKgSold = kgSoldDelta;

        if (monthlyReportDoc.exists) {
          const existingData = monthlyReportDoc.data();
          totalRevenue += existingData.totalRevenue || 0;
          totalExpenses += existingData.totalExpenses || 0;
          totalKgSold += existingData.totalKgSold || 0;
        }

        transaction.set(monthlyReportRef, {
          month,
          year,
          totalRevenue,
          totalExpenses,
          totalKgSold,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});

        console.log(`Monthly report for ${monthKey} updated.`);
        return Promise.resolve();
      });
    });

/**
 * Cloud Function that updates the live bulk inventory stock.
 * Triggered by changes to stock-in records or approved sales entries.
 */
exports.updateBulkInventory = functions.firestore
    .document(`artifacts/${APP_ID}/{collectionName}/{docId}`)
    .onWrite(async (change, context) => {
      const after = change.after.data();
      const before = change.before.data();
      const {collectionName} = context.params;

      // FIX: The trigger needs to be more specific. Let's filter here.
      if (collectionName !== "stock_ins" && collectionName !== "data_entries") {
        return null;
      }

      let quantityDelta = 0;
      const isSale = collectionName === "data_entries" && after &&
            after.type === "sale";
      const isApprovedNow = isSale && after.status === "approved";
      const wasApprovedBefore = isSale && before && before.status === "approved";
      const isStockIn = collectionName === "stock_ins";

      // Case 1: A stock-in is created, updated, or deleted
      if (isStockIn) {
        const afterKg = after ? (after.quantityKg || 0) : 0;
        const beforeKg = before ? (before.quantityKg || 0) : 0;
        quantityDelta = afterKg - beforeKg;
      } else if (isSale && isApprovedNow && !wasApprovedBefore) {
        // Case 2: A sale's status changes to 'approved'
        quantityDelta = -(after.kgSold || 0);
      } else if (isSale && !isApprovedNow && wasApprovedBefore) {
        // Case 3: A sale's status changes from 'approved'
        quantityDelta = before.kgSold || 0;
      } else if (isSale && isApprovedNow && wasApprovedBefore) {
        // Case 4: A sale's approved quantity is updated
        const afterKg = after.kgSold || 0;
        const beforeKg = before.kgSold || 0;
        quantityDelta = beforeKg - afterKg;
      }

      if (quantityDelta === 0) {
        return null; // No change in inventory, no update needed
      }

      const inventoryRef = db.collection("artifacts").doc(APP_ID)
          .collection("live_inventory").doc("bulk_stock");

      return db.runTransaction(async (transaction) => {
        const inventoryDoc = await transaction.get(inventoryRef);
        let currentStock = quantityDelta;

        if (inventoryDoc.exists) {
          const existingData = inventoryDoc.data();
          currentStock += existingData.currentStock || 0;
        }

        transaction.set(inventoryRef, {
          currentStock,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});

        console.log(`Live bulk inventory updated by ${quantityDelta} kg.`);
        return Promise.resolve();
      });
    });