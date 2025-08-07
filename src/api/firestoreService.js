// src/api/firestoreService.js
import {
    collection, query, where, doc, addDoc, updateDoc, serverTimestamp, setDoc, getDoc, orderBy, getDocs, Timestamp
} from 'firebase/firestore';
import { db, appId } from './firebase';

export const getUserProfile = async (uid) => {
    const userDocRef = doc(db, `artifacts/${appId}/users`, uid);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : null;
};

export const createUserProfile = async (uid, email) => {
    const userDocRef = doc(db, `artifacts/${appId}/users`, uid);
    const newUserProfile = { email, role: 'Cashier', status: 'active', createdAt: serverTimestamp() };
    await setDoc(userDocRef, newUserProfile);
    return newUserProfile;
};

export const addUserInvitation = (email, role) => {
    const usersColRef = collection(db, `artifacts/${appId}/users`);
    return addDoc(usersColRef, { email: email.toLowerCase(), role, status: 'invited', createdAt: serverTimestamp() });
};

export const updateUserRole = (uid, role) => {
    const userDocRef = doc(db, `artifacts/${appId}/users`, uid);
    return updateDoc(userDocRef, { role });
};

export const addDataEntry = (logData, user, type) => {
    const dataEntryRef = collection(db, `artifacts/${appId}/data_entries`);
    const commonData = {
        type,
        ...logData,
        date: new Date(logData.date),
        status: 'pending',
        submittedBy: { uid: user.uid, email: user.email },
        submittedAt: serverTimestamp(),
    };
    if (type === 'sale') {
        commonData.revenue = parseFloat(logData.revenue);
        commonData.kgSold = parseFloat(logData.kgSold);
    }
    if (type === 'expense') commonData.amount = parseFloat(logData.amount);
    return addDoc(dataEntryRef, commonData);
};

export const updateLogStatus = (logId, newStatus, user) => {
    const logDocRef = doc(db, `artifacts/${appId}/data_entries`, logId);
    return updateDoc(logDocRef, { status: newStatus, reviewedBy: { uid: user.uid, email: user.email }, reviewedAt: serverTimestamp() });
};

export const getAssetsQuery = () => query(collection(db, `artifacts/${appId}/assets`));

export const addAsset = (assetData) => {
    const assetsRef = collection(db, `artifacts/${appId}/assets`);
    return addDoc(assetsRef, { ...assetData, cost: parseFloat(assetData.cost), purchaseDate: new Date(assetData.purchaseDate), createdAt: serverTimestamp() });
};

export const getApprovedEntriesQuery = (branchId = 'all') => {
    const queryConstraints = [
        collection(db, `artifacts/${appId}/data_entries`),
        where("status", "==", "approved")
    ];
    if (branchId && branchId !== 'all') {
        queryConstraints.push(where("branchId", "==", branchId));
    }
    return query(...queryConstraints);
};

/**
 * Creates a query to get all plants.
 * @returns {Query} A Firestore query object.
 */
export const getPlantsQuery = () => {
    return query(collection(db, `artifacts/${appId}/plants`), orderBy('name'));
};


/**
 * Creates a query to get all cylinders.
 * @returns {Query} A Firestore query object.
 */
export const getCylindersQuery = () => {
    return query(collection(db, `artifacts/${appId}/cylinders`));
};

/**
 * Leases a cylinder to a customer.
 * @param {string} cylinderId - The ID of the cylinder document.
 * @param {object} leaseData - Information about the lease.
 * @returns {Promise} A promise that resolves when the update is complete.
 */
export const leaseCylinder = (cylinderId, leaseData) => {
    const cylinderRef = doc(db, `artifacts/${appId}/cylinders`, cylinderId);
    return updateDoc(cylinderRef, {
        status: 'Leased',
        leaseInfo: {
            ...leaseData,
            deposit: parseFloat(leaseData.deposit),
            monthlyFee: parseFloat(leaseData.monthlyFee),
            leaseStartDate: new Date(),
        }
    });
};

/**
 * Adds a batch of new cylinders to the database.
 * @param {number} count - The number of cylinders to add.
 * @param {string} size - The size of the cylinders (e.g., '12.5 kg').
 * @returns {Promise} A promise that resolves when the batch write is complete.
 */
export const addCylinderBatch = async (count, size) => {
    const batch = writeBatch(db);
    const cylindersRef = collection(db, `artifacts/${appId}/cylinders`);

    for (let i = 0; i < count; i++) {
        const newCylinderRef = doc(cylindersRef);
        batch.set(newCylinderRef, {
            size,
            status: 'Empty', // All new cylinders start as empty in the warehouse
            createdAt: serverTimestamp(),
            leaseInfo: null,
        });
    }

    return batch.commit();
};

/**
 * Creates a query to get all approved sales logs (stock out).
 * @returns {Query} A Firestore query object.
 */
export const getApprovedSalesQuery = () => {
    return query(
        collection(db, `artifacts/${appId}/data_entries`),
        where("status", "==", "approved"),
        where("type", "==", "sale")
    );
};

/**
 * Creates a query to get all bulk stock-in records.
 * @returns {Query} A Firestore query object.
 */
export const getStockInsQuery = () => {
    return query(collection(db, `artifacts/${appId}/stock_ins`));
};

/**
 * Adds a new bulk LPG purchase record to the database.
 * @param {object} stockInData - Data about the stock purchase.
 * @param {object} user - The user logging the entry.
 * @returns {Promise} A promise that resolves when the record is added.
 */
export const addStockIn = (stockInData, user) => {
    const stockInsRef = collection(db, `artifacts/${appId}/stock_ins`);
    return addDoc(stockInsRef, {
        quantityKg: parseFloat(stockInData.quantityKg),
        purchaseDate: new Date(stockInData.purchaseDate),
        supplier: stockInData.supplier,
        loggedBy: { uid: user.uid, email: user.email },
        createdAt: serverTimestamp(),
    });
};

/**
 * Creates a query to get all customers.
 * @returns {Query} A Firestore query object.
 */
export const getCustomersQuery = () => {
    return query(collection(db, `artifacts/${appId}/customers`), orderBy('name'));
};

/**
 * Adds a new customer to the Firestore database.
 * @param {object} customerData - The data for the new customer.
 * @returns {Promise} A promise that resolves when the customer is added.
 */
export const addCustomer = (customerData) => {
    const customersRef = collection(db, `artifacts/${appId}/customers`);
    return addDoc(customersRef, {
        ...customerData,
        createdAt: serverTimestamp(),
    });
};

/**
 * Creates a query to get all approved sales for a specific customer.
 * @param {string} customerId - The ID of the customer.
 * @returns {Query} A Firestore query object.
 */
export const getSalesForCustomerQuery = (customerId) => {
    // This assumes you will add a `customerId` field to your sales logs.
    // For now, we'll simulate by filtering by customer name on the client side.
    // A real implementation would require updating the sales log data structure.
    return query(
        collection(db, `artifacts/${appId}/data_entries`),
        where("status", "==", "approved"),
        where("type", "==", "sale")
        // where("customerId", "==", customerId) // Ideal future query
    );
};


/**
 * Creates a query to get all vans.
 * @returns {Query} A Firestore query object.
 */
export const getVansQuery = () => {
    return query(collection(db, `artifacts/${appId}/vans`), orderBy('id'));
};

/**
 * Creates a query to get all unassigned delivery orders.
 * @returns {Query} A Firestore query object.
 */
export const getUnassignedOrdersQuery = () => {
    return query(
        collection(db, `artifacts/${appId}/delivery_orders`),
        where('status', '==', 'unassigned')
    );
};

/**
 * Assigns an order to a van, updating both documents.
 * @param {string} vanId - The document ID of the van.
 * @param {string} orderId - The document ID of the order.
 * @param {object} orderDetails - Details from the order needed for the van doc.
 * @returns {Promise} A promise that resolves when the updates are complete.
 */
export const assignOrderToVan = (vanId, orderId, orderDetails) => {
    const vanRef = doc(db, `artifacts/${appId}/vans`, vanId);
    const orderRef = doc(db, `artifacts/${appId}/delivery_orders`, orderId);

    // Use a batch write to update both documents atomically
    const batch = writeBatch(db);

    batch.update(vanRef, {
        status: 'On Delivery',
        currentOrderId: orderId,
        destination: orderDetails.area,
    });

    batch.update(orderRef, {
        status: 'assigned',
        vanId: vanId,
    });

    return batch.commit();
};

/**
 * Fetches all approved sales and expense entries for a specific date.
 * @param {Date} date - The date for which to fetch entries.
 * @returns {Promise<Array>} A promise that resolves with an array of entries.
 */
export const getEntriesForDate = async (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, `artifacts/${appId}/data_entries`),
        where("status", "==", "approved"),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Adds a historical sales log directly to the database as 'approved'.
 * @param {object} logData - The data for the historical entry.
 * @param {object} user - The user performing the migration.
 * @returns {Promise} A promise that resolves when the entry is added.
 */
export const addHistoricalEntry = (logData, user) => {
    const dataEntryRef = collection(db, `artifacts/${appId}/data_entries`);
    return addDoc(dataEntryRef, {
        type: 'sale',
        branchId: logData.branchId,
        date: new Date(logData.date),
        kgSold: parseFloat(logData.kgSold),
        revenue: parseFloat(logData.amountPaid),
        paymentMethod: logData.paymentMethod,
        receiptNumber: logData.receiptNumber,
        transactionRef: logData.transactionRef,
        
        status: 'approved', // Bypasses the queue
        isHistorical: true, // Flag for historical data
        
        submittedBy: { uid: user.uid, email: user.email },
        submittedAt: serverTimestamp(),
        reviewedBy: { uid: user.uid, email: user.email }, // Self-approved
        reviewedAt: serverTimestamp(),
    });
};

/**
 * Fetches the main application configuration document.
 * @returns {Promise<object>} A promise that resolves with the configuration data.
 */
export const getConfiguration = async () => {
    const configRef = doc(db, `artifacts/${appId}/configuration`, 'main_settings');
    const docSnap = await getDoc(configRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        // If no config exists, create a default one
        const defaultConfig = { lowStockThreshold: 500, taxRateVAT: 7.5 };
        await setDoc(configRef, defaultConfig);
        return defaultConfig;
    }
};

/**
 * Updates the main application configuration.
 * @param {object} settingsData - The new settings to save.
 * @returns {Promise} A promise that resolves when the update is complete.
 */
export const updateConfiguration = (settingsData) => {
    const configRef = doc(db, `artifacts/${appId}/configuration`, 'main_settings');
    return updateDoc(configRef, settingsData);
};