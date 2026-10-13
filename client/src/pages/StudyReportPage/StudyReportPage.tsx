import { useState, useCallback, useEffect } from 'react';
import * as studyReportApi from '@client/src/api/study-report';
import { logger } from '@client/src/api/study-report';
import type {
  StudyReportItem,
  ReportType,
  ReportListResponse,
} from '@shared/api.interface';
import ReportHeader from './components/ReportHeader';
import OverviewCards from './components/OverviewCards';
import TrendCharts from './components/TrendCharts';
import DistributionCharts from './components/DistributionCharts';
import HeatmapCalendar from './components/HeatmapCalendar';
import AIAnalysis from './components/AIAnalysis';
import ReportHistory from './components/ReportHistory';
import SubjectStatsCard from './components/SubjectStatsCard';
import ModeStatsCard from './components/ModeStatsCard';
import ProgressCard from './components/ProgressCard';
import AchievementCard from './components/AchievementCard';
import ImprovementCard from './components/ImprovementCard';

function StudyReportPage() {
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentReport, setCurrentReport] = useState<StudyReportItem | null>(null);
  const [historyList, setHistoryList] = useState<ReportListResponse | null>(null);

  const [loading, setLoading] = useState<Record<string, boolean>>({
    report: true,
    history: true,
    generating: false,
    preview: false,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchLatestReport = useCallback(async (type: ReportType) => {
    try {
      setLoading((l) => ({ ...l, report: true }));
      const data = await studyReportApi.getLatestReport(type);
      setCurrentReport(data);
      setError(null);
    } catch (err) {
      logger.error('获取最新报告失败', err as Error);
      setError('获取报告数据失败，请稍后重试');
    } finally {
      setLoading((l) => ({ ...l, report: false }));
    }
  }, []);

  const fetchHistory = useCallback(async (type?: ReportType) => {
    try {
      setLoading((l) => ({ ...l, history: true }));
      const data = await studyReportApi.getReports({
        reportType: type,
        page: 1,
        pageSize: 10,
      });
      setHistoryList(data);
    } catch (err) {
      logger.error('获取历史报告失败', err as Error);
    } finally {
      setLoading((l) => ({ ...l, history: false }));
    }
  }, []);

  useEffect(() => {
    fetchLatestReport(reportType);
    fetchHistory(reportType);
  }, [reportType, fetchLatestReport, fetchHistory]);

  const getDateRange = (type: string): { start: string; end: string } => {
    const now = new Date();
    const fmt = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    if (type === 'weekly') {
      const day = now.getDay() || 7;
      const start = new Date(now);
      start.setDate(now.getDate() - (day - 1));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: fmt(start), end: fmt(end) };
    }
    if (type === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    return { start: startDate || '', end: endDate || '' };
  };

  const handleGenerate = async () => {
    if (reportType === 'custom') {
      if (!startDate || !endDate) {
        setError('请选择开始和结束日期');
        return;
      }
    }
    try {
      setLoading((l) => ({ ...l, generating: true }));
      setError(null);
      const { start, end } = getDateRange(reportType);
      const report = await studyReportApi.generateReport({
        reportType,
        startDate: start,
        endDate: end,
      });
      setCurrentReport(report);
      fetchHistory(reportType);
    } catch (err) {
      logger.error('生成报告失败', err as Error);
      setError('生成报告失败，请稍后重试');
    } finally {
      setLoading((l) => ({ ...l, generating: false }));
    }
  };

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      setError('请选择开始和结束日期');
      return;
    }
    try {
      setLoading((l) => ({ ...l, preview: true, report: true }));
      const data = await studyReportApi.previewReport(startDate, endDate);
      setCurrentReport(data);
      setError(null);
    } catch (err) {
      logger.error('预览报告失败', err as Error);
      setError('预览报告失败，请稍后重试');
    } finally {
      setLoading((l) => ({ ...l, preview: false, report: false }));
    }
  };

  const handleViewReport = async (id: string) => {
    try {
      setLoading((l) => ({ ...l, report: true }));
      const data = await studyReportApi.getReport(id);
      setCurrentReport(data);
      setError(null);
    } catch (err) {
      logger.error('获取报告详情失败', err as Error);
    } finally {
      setLoading((l) => ({ ...l, report: false }));
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await studyReportApi.deleteReport(id);
      fetchHistory(reportType);
      if (currentReport?.id === id) {
        setCurrentReport(null);
      }
    } catch (err) {
      logger.error('删除报告失败', err as Error);
    }
  };

  const handleTabChange = (type: ReportType) => {
    setReportType(type);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full text-white">
       <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6 pb-20 sm:pb-6">
         {/* Page Title */}
         <div className="mb-4 sm:mb-6">
           <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">
             学习报告
           </h1>
             <p className="text-sm text-slate-400 mt-1">
               洞察学习数据，发现成长轨迹
             </p>
         </div>

        {/* Header: tabs + date range + generate */}
        <ReportHeader
          reportType={reportType}
          startDate={startDate}
          endDate={endDate}
          generating={loading.generating}
          onTabChange={handleTabChange}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onGenerate={handleGenerate}
          onPreview={handlePreview}
          previewLoading={loading.preview}
        />

         {error && (
           <div
             className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl text-sm glass-card"
             style={{
               borderColor: 'rgba(236, 72, 153, 0.4)',
               color: '#F472B6',
               background: 'rgba(236, 72, 153, 0.1)',
             }}
           >
             {error}
           </div>
         )}

        {/* Overview Cards */}
        <OverviewCards loading={loading.report} report={currentReport} />

        {/* Charts Grid */}
        {currentReport && (
           <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
               <SubjectStatsCard report={currentReport} />
               <ModeStatsCard report={currentReport} />
             </div>
             <ProgressCard report={currentReport} />
             <ImprovementCard report={currentReport} />
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
               <TrendCharts report={currentReport} />
               <DistributionCharts report={currentReport} />
             </div>
             <HeatmapCalendar report={currentReport} />
             <AchievementCard report={currentReport} />
             <AIAnalysis report={currentReport} />
           </div>
        )}

        {/* Loading skeleton when no report */}
        {loading.report && !currentReport && (
          <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
               {[1, 2, 3, 4].map((i) => (
                 <div
                   key={i}
                   className="h-24 rounded-xl animate-pulse bg-white/5 border border-white/10"
                 />
               ))}
             </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div
                  className="h-56 sm:h-72 rounded-xl animate-pulse bg-white/5 border border-white/10"
                />
                <div
                  className="h-56 sm:h-72 rounded-xl animate-pulse bg-white/5 border border-white/10"
                />
              </div>
          </div>
        )}

        {/* No data state */}
        {!loading.report && !currentReport && (
           <div
             className="mt-6 p-10 rounded-xl text-center glass-card"
           >
              <p className="text-slate-400">暂无报告数据，点击「生成报告」创建</p>
           </div>
        )}

        {/* History List */}
        <ReportHistory
          loading={loading.history}
          list={historyList}
          onView={handleViewReport}
          onDelete={handleDeleteReport}
        />
      </div>
    </div>
  );
}

export default StudyReportPage;
