// import cron from "node-cron";
// import { Op } from "sequelize";
// import BloodTransfusionRequest from "../models/bloodRequest";
// import { restoreInventory } from "../controllers/inventory.form.controllers";

// export const startAutoExpireJob = () => {
//   // Runs every 30 minutes
//   cron.schedule("*/30 * * * *", async () => {
//     try {
//       const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

//       const expiredRequests: BloodTransfusionRequest[] =
//         await BloodTransfusionRequest.findAll({
//           where: {
//             status: "APPROVED",
//             reviewedAt: { [Op.lte]: sixHoursAgo },
//           },
//         });

//       if (expiredRequests.length === 0) return;

//       for (const request of expiredRequests) {
//         // ── Restore inventory before cancelling ──
//         if (request.bloodType && request.component && request.units) {
//           try {
//             await restoreInventory(
//               request.bloodType,
//               request.component,
//               Number(request.units),
//               "admin"
//             );
//             console.log(
//               `Inventory restored for request ${request.id}: ` +
//                 `${request.units} unit(s) of ${request.component} (${request.bloodType})`
//             );
//           } catch (err) {
//             console.error(
//               `Failed to restore inventory for request ${request.id}:`,
//               err
//             );
//           }
//         }

//         // ── Cancel the request ──
//         await request.update({
//           status: "CANCELLED",
//           rejectionReason:
//             "Auto-cancelled: no appearance or response within 6 hours of approval.",
//         });

//         console.log(`Auto-cancelled request ${request.id}`);
//       }

//       console.log(
//         `Auto-expired ${expiredRequests.length} approved blood request(s).`
//       );
//     } catch (err) {
//       console.error("Auto-expire job failed:", err);
//     }
//   });
// };