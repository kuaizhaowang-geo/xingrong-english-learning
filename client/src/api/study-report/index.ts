import { axiosForBackend, logger } from '@client/src/api';
import type {
  StudyReportItem,
  ReportListResponse,
  GenerateReportDto,
  ReportType,
} from '@shared/api.interface';

export async function getLatestReport(
  reportType: ReportType = 'weekly',
): Promise<StudyReportItem | null> {
  const { data } = await axiosForBackend.get('/api/study-report/latest', {
    params: { reportType },
  });
  return data;
}

export async function getReports(params: {
  reportType?: ReportType;
  page?: number;
  pageSize?: number;
}): Promise<ReportListResponse> {
  const { data } = await axiosForBackend.get('/api/study-report/reports', {
    params,
  });
  return data;
}

export async function getReport(id: string): Promise<StudyReportItem> {
  const { data } = await axiosForBackend.get(
    `/api/study-report/reports/${id}`,
  );
  return data;
}

export async function generateReport(
  dto: GenerateReportDto,
): Promise<StudyReportItem> {
  const { data } = await axiosForBackend.post(
    '/api/study-report/generate',
    dto,
  );
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/study-report/reports/${id}`);
}

export async function previewReport(
  startDate: string,
  endDate: string,
): Promise<StudyReportItem> {
  const { data } = await axiosForBackend.get('/api/study-report/preview', {
    params: { startDate, endDate },
  });
  return data;
}

export { logger };
