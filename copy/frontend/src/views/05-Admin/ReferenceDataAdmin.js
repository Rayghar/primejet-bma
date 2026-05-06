import React from 'react';
import AdminUtilityPage from './AdminUtilityPage';
import { ADMIN_MODULE_HELP } from '../../utils/helpCatalog';

export default function ReferenceDataAdmin() {
  return <AdminUtilityPage
    title="Reference Data"
    subtitle="Govern reusable business lists used across POS, operations, CRM, finance and reporting."
    icon="Database"
    guide={[
      { key: 'purpose', label: 'Purpose', help: ADMIN_MODULE_HELP.referenceData },
      { key: 'discipline', label: 'Data Discipline', help: 'Keep values standardized so reports do not split the same meaning across multiple spellings.' },
      { key: 'migration', label: 'Migration Alignment', help: 'Historical CSV values should match these lists to reduce exceptions during migration.' },
    ]}
    sections={[
      { title: 'POS Lists', status: 'Core', tone: 'blue', description: 'Payment methods, expense categories, reversal reasons and cashier close statuses.', items: ['Cash / POS / Transfer / Company Account', 'Fuel / Maintenance / Dispatch / Utilities', 'Void and reversal reason codes'] },
      { title: 'Operations Lists', status: 'Core', tone: 'green', description: 'Products, cylinder sizes, stock variance reasons and plant operating states.', items: ['LPG bulk KG', '3kg, 6kg, 12.5kg, 50kg', 'Shortage/loss, gain, adjustment'] },
      { title: 'CRM Lists', status: 'Recommended', tone: 'amber', description: 'Customer segments, complaint categories, channels and support disposition codes.', items: ['Residential / SME / Commercial', 'WhatsApp / App / Phone', 'Resolved / Escalated / Pending'] },
    ]}
    actions={['Clean duplicate values', 'Align CSV templates', 'Review report groupings']}
  />;
}
