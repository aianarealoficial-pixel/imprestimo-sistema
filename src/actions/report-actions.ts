"use server";

import { auth } from "@/lib/auth";
import { ReportService } from "@/services/report-service";

export async function getReportData(startDate: Date, endDate: Date) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return await ReportService.getDashboardMetrics(session.user.id, startDate, endDate);
}
