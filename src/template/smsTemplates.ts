export const smsTemplates = {

  donationSuccess: (firstName: string, date: string, location: string) =>
    `Hi ${firstName}! Your blood donation appointment on ${date} at ${location} is confirmed. ` +
    `Thank you for saving lives! - BloodBankPH`,

  donationRescheduled: (
    firstName: string,
    oldDate: string,
    newDate: string,
    location: string,
    rescheduledBy: string
  ) =>
    `Hi ${firstName}, your donation on ${oldDate} has been moved to ${newDate} ` +
    `at ${location}. Changed by: ${rescheduledBy}. - Agapay`,

  donationRejected: (firstName: string, reason: string) =>
    `Hi ${firstName}, your donation appointment was not approved. ` +
    `Reason: ${reason}. Please contact us for assistance. - Agapay`,

  bloodRequestApproved: (
    firstName: string,
    reqId: string,
    bloodType: string,
    bloodComponent: string,
    units: number
  ) =>
    `Hi ${firstName}, your blood request (REQ #${reqId.slice(0, 8).toUpperCase()}) has been approved! ` +
    `Blood type: ${bloodType}, Component: ${bloodComponent}, Units: ${units} unit/s. ` +
    `Please coordinate with us for pickup. Bring a valid ID. - Agapay`,


  bloodRequestRejected: (
    firstName: string,
    bloodType: string,
    reason: string
  ) =>
    `Hi ${firstName}, your ${bloodType} blood request was not approved. ` +
    `Reason: ${reason}. Please visit us for assistance. - Agapay`,

  // ← ADD
  donationReminder: (name: string, date: string, time: string, location: string) =>
    `Hi ${name}! This is a reminder that your blood donation appointment is tomorrow, ${date} ` +
    `at ${time} at ${location}. Thank you for saving lives! - Agapay`,

    bloodRequestCancelled: (
    firstName: string,
    bloodType: string,
    reason?: string
  ) =>
    `Hi ${firstName}, your blood request has been cancelled` +
    `${reason ? `. Reason: ${reason}` : "."} Please contact us if you have questions. - Agapay`,
};