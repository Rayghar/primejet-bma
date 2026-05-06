import React from 'react';
import AdminUtilityPage from './AdminUtilityPage';
import { ADMIN_MODULE_HELP } from '../../utils/helpCatalog';

export default function NotificationTemplatesAdmin() {
  return <AdminUtilityPage
    title="Notification Templates"
    subtitle="Manage customer, staff and escalation message templates for operational communication."
    icon="Bell"
    guide={[
      { key: 'purpose', label: 'Purpose', help: ADMIN_MODULE_HELP.notifications },
      { key: 'whatsapp', label: 'WhatsApp Templates', help: 'WhatsApp approved template names are configured under WhatsApp settings; this page governs business message wording.' },
      { key: 'tone', label: 'Tone', help: 'Templates should be short, clear and operationally safe. Avoid promises that operations cannot consistently meet.' },
    ]}
    sections={[
      { title: 'Customer Templates', status: 'Core', tone: 'green', description: 'Order confirmation, dispatch update, payment reminder, complaint acknowledgement and refill reminder.', items: ['Order received', 'Order assigned', 'Delivery completed', 'Complaint received'] },
      { title: 'Staff Alerts', status: 'Recommended', tone: 'blue', description: 'Internal alerts for low stock, open close days, failed posting and urgent customer issues.', items: ['Low stock warning', 'Overdue daily close', 'Failed GL posting'] },
      { title: 'Escalations', status: 'Recommended', tone: 'amber', description: 'Messages for overdue actions and exception escalation to supervisors or finance.', items: ['Cash variance escalation', 'Stock loss escalation', 'Pending approval reminder'] },
    ]}
    actions={['Review message tone', 'Align WhatsApp template names', 'Define escalation recipients']}
  />;
}
