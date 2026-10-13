import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/HomePage/HomePage';
import CoursePlazaPage from './pages/CoursePlazaPage/CoursePlazaPage';
import MyCoursesPage from './pages/MyCoursesPage/MyCoursesPage';
import CourseDetailPage from './pages/CourseDetailPage/CourseDetailPage';
import CoursesLearnPage from './pages/CoursesLearnPage/CoursesLearnPage';
import TextbookPage from './pages/TextbookPage/TextbookPage';
import AIQuizPage from './pages/AIQuizPage/AIQuizPage';
import SentencePracticePage from './pages/SentencePracticePage/SentencePracticePage';
import DictationPracticePage from './pages/DictationPracticePage/DictationPracticePage';
import RankingPage from './pages/RankingPage/RankingPage';
import StudyJournalPage from './pages/StudyJournalPage/StudyJournalPage';
import AICreatorPage from './pages/AICreatorPage/AICreatorPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import MembershipPage from './pages/MembershipPage/MembershipPage';
import PromotionPage from './pages/PromotionPage/PromotionPage';
import PartnerPage from './pages/PartnerPage/PartnerPage';
import CheckInPage from './pages/CheckInPage/CheckInPage';
import PhoneticsPage from './pages/PhoneticsPage/PhoneticsPage';
import AIChatPage from './pages/AIChatPage/AIChatPage';
import LearningPlanPage from './pages/LearningPlanPage/LearningPlanPage';
import PKArenaPage from './pages/PKArenaPage/PKArenaPage';
import WordLibraryPage from './pages/WordLibraryPage/WordLibraryPage';
import MathPracticePage from './pages/MathPractice/MathPracticePage';
import ChinesePracticePage from './pages/ChinesePracticePage/ChinesePracticePage';
import StatsDashboardPage from './pages/StatsDashboardPage/StatsDashboardPage';
import GameParkPage from './pages/GameParkPage/GameParkPage';
import PreschoolPage from './pages/PreschoolPage/PreschoolPage';
import AdminLoginPage from './pages/AdminLoginPage/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage/AdminDashboardPage';
import AdminContentPage from './pages/AdminContentPage/AdminContentPage';
import AdminWordsPage from './pages/AdminWordsPage/AdminWordsPage';
import AdminSentencesPage from './pages/AdminSentencesPage/AdminSentencesPage';
import AdminUsersPage from './pages/AdminUsersPage/AdminUsersPage';
import AdminAuditPage from './pages/AdminAuditPage/AdminAuditPage';
import AdminUgcAuditPage from './pages/AdminUgcAuditPage/AdminUgcAuditPage';
import ContentAuditPage from './pages/ContentAuditPage/ContentAuditPage';
import AdminAccountsPage from './pages/AdminAccountsPage/AdminAccountsPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ParentDashboardPage from './pages/ParentDashboardPage/ParentDashboardPage';
import KeyboardDemoPage from './pages/KeyboardDemoPage/KeyboardDemoPage';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import ClubOwnerPage from './pages/ClubOwnerPage/ClubOwnerPage';
import DictationPage from './pages/DictationPage';
import ChineseDictationPracticePage from './pages/DictationPage/DictationPracticePage';
import DictationWrongBookPage from './pages/DictationPage/DictationWrongBookPage';
import PrivacyPage from './pages/PrivacyPage/PrivacyPage';
import TermsPage from './pages/TermsPage/TermsPage';
import ParentControlsPage from './pages/ParentControlsPage/ParentControlsPage';
import ChineseDictationHome from './pages/ChineseDictation/ChineseDictationHome';
import DictationPractice from './pages/ChineseDictation/DictationPractice';
import WrongBook from './pages/ChineseDictation/WrongBook';
import AchievementsPage from './pages/AchievementsPage/AchievementsPage';
import StudyPlanPage from './pages/StudyPlanPage/StudyPlanPage';
import StudyReportPage from './pages/StudyReportPage/StudyReportPage';
import MyWordbookPage from './pages/MyWordbookPage/MyWordbookPage';
import WordbookStudyPage from './pages/WordbookStudyPage/WordbookStudyPage';
import ContentMarketPage from './pages/ContentMarketPage/ContentMarketPage';
import ContentDetailPage from './pages/ContentDetailPage/ContentDetailPage';
import CreatorCenterPage from './pages/CreatorCenterPage/CreatorCenterPage';
import TypingPracticePage from './pages/TypingPracticePage/TypingPracticePage';
import { AchievementProvider } from './components/achievement-notification/AchievementNotification';
import ReviewPage from './pages/ReviewPage/ReviewPage';
import WordTrainingPage from './pages/WordTrainingPage/WordTrainingPage';
import TextbookSyncPage from './pages/TextbookSyncPage/TextbookSyncPage';
import CoursePlazaPageNew from './pages/CoursePlazaPageNew/CoursePlazaPageNew';
import LearningHandbookPage from './pages/LearningHandbookPage/LearningHandbookPage';
import AIStudioPage from './pages/AIStudioPage/AIStudioPage';
import DictionaryPage from './pages/DictionaryPage/DictionaryPage';
import MyTextbooksPage from './pages/MyTextbooksPage/MyTextbooksPage';
import TextbookEditorPage from './pages/MyTextbooksPage/TextbookEditorPage';
import CourseEditorPage from './pages/MyCoursesPage/CourseEditorPage';
import AssetsCenterPage from './pages/AssetsCenterPage/AssetsCenterPage';
import AdminIllustrationPage from './pages/AdminIllustrationPage/AdminIllustrationPage';
import AdminIllustrationGeneratePage from './pages/AdminIllustrationPage/AdminIllustrationGeneratePage';
import AdminCourseLessonsPage from './pages/AdminCourseLessonsPage/AdminCourseLessonsPage';
import AdminLessonWordsPage from './pages/AdminLessonWordsPage/AdminLessonWordsPage';
import AdminChineseCharsPage from './pages/AdminChineseCharsPage/AdminChineseCharsPage';
import AdminMathTopicsPage from './pages/AdminMathTopicsPage/AdminMathTopicsPage';
import AdminMathPracticePage from './pages/AdminMathPracticePage/AdminMathPracticePage';
import ChineseLearningPage from './pages/ChineseLearningPage/ChineseLearningPage';
import MathLearningPage from './pages/MathLearningPage/MathLearningPage';
import EnglishLearningPage from './pages/EnglishLearningPage/EnglishLearningPage';

const WordTrainingRedirect: React.FC = () => {
  return <WordTrainingPage />;
};

const DictationRedirect: React.FC = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const target = `/practice/sentence?mode=dictation${search ? `&${search.slice(1)}` : ''}`;
  return <Navigate to={target} replace />;
};

const TypingPracticeRedirect: React.FC = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const target = `/practice/sentence?mode=typing${search ? `&${search.slice(1)}` : ''}`;
  return <Navigate to={target} replace />;
};

const PreschoolRedirect: React.FC = () => {
  return <Navigate to="/courses?category=preschool" replace />;
};

const RoutesComponent = () => {
  return (
    <AdminAuthProvider>
      <AchievementProvider>
        <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="courses" element={<CoursePlazaPage />} />
          <Route path="course-plaza" element={<CoursePlazaPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="courses/:id/learn" element={<CoursesLearnPage />} />
          <Route path="textbooks" element={<Navigate to="/textbook-sync" replace />} />
          <Route path="ai-quiz" element={<AIQuizPage />} />
          <Route path="practice/sentence" element={<SentencePracticePage />} />
          <Route path="practice/dictation" element={<DictationRedirect />} />
          <Route path="words" element={<WordTrainingRedirect />} />
          <Route path="ranking" element={<RankingPage />} />
          <Route path="journal" element={<StudyJournalPage />} />
          <Route path="ai-creator" element={<AICreatorPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="partner" element={<PartnerPage />} />
          <Route path="check-in" element={<CheckInPage />} />
          <Route path="phonetics" element={<PhoneticsPage />} />
          <Route path="ai-chat" element={<AIChatPage />} />
          <Route path="learning-plan" element={<LearningPlanPage />} />
          <Route path="pk-arena" element={<PKArenaPage />} />
          <Route path="word-library" element={<WordLibraryPage />} />
          <Route path="math-practice" element={<MathPracticePage />} />
          <Route path="chinese-practice" element={<ChinesePracticePage />} />
          <Route path="parent-dashboard" element={<ParentDashboardPage />} />
          <Route path="stats" element={<StatsDashboardPage />} />
          <Route path="game-park" element={<GameParkPage />} />
          <Route path="preschool" element={<PreschoolPage />} />
          <Route path="preschool/alphabet" element={<PreschoolRedirect />} />
          <Route path="preschool/phonics" element={<PreschoolRedirect />} />
          <Route path="preschool/words" element={<PreschoolRedirect />} />
          <Route path="preschool/sentences" element={<PreschoolRedirect />} />
          <Route path="preschool/songs" element={<PreschoolRedirect />} />
          <Route path="preschool/games" element={<PreschoolRedirect />} />
          <Route path="keyboard-demo" element={<KeyboardDemoPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="club-owner" element={<ClubOwnerPage />} />
          <Route path="dictation" element={<DictationPage />} />
          <Route path="dictation/wrong-book" element={<DictationWrongBookPage />} />
          <Route path="dictation/:id" element={<ChineseDictationPracticePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="parent-controls" element={<ParentControlsPage />} />
          <Route path="chinese-dictation" element={<ChineseDictationHome />} />
          <Route path="chinese-dictation/practice" element={<DictationPractice />} />
          <Route path="chinese-dictation/wrong-book" element={<WrongBook />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="study-plan" element={<StudyPlanPage />} />
          <Route path="study-report" element={<StudyReportPage />} />
          <Route path="my-wordbook" element={<MyWordbookPage />} />
          <Route path="my-wordbook/study/:id" element={<WordbookStudyPage />} />
          <Route path="my-textbooks" element={<MyTextbooksPage />} />
          <Route path="my-textbooks/:id" element={<TextbookEditorPage />} />
          <Route path="my-courses" element={<MyCoursesPage />} />
          <Route path="my-courses/:id" element={<CourseEditorPage />} />
          <Route path="assets-center" element={<AssetsCenterPage />} />
          <Route path="content-market" element={<ContentMarketPage />} />
          <Route path="content-market/:id" element={<ContentDetailPage />} />
          <Route path="creator-center" element={<CreatorCenterPage />} />
          <Route path="typing-practice" element={<TypingPracticePage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="word-training" element={<WordTrainingRedirect />} />
          <Route path="practice/word" element={<WordTrainingRedirect />} />
          <Route path="textbook-sync" element={<TextbookSyncPage />} />
          <Route path="textbook-sync/chinese/:textbookId/:unitId" element={<ChineseLearningPage />} />
          <Route path="textbook-sync/math/:textbookId/:unitId" element={<MathLearningPage />} />
          <Route path="textbook-sync/english/:textbookId/:unitId" element={<EnglishLearningPage />} />
          <Route path="course-plaza-new" element={<CoursePlazaPageNew />} />
          <Route path="learning-handbook" element={<LearningHandbookPage />} />
          <Route path="ai-studio" element={<AIStudioPage />} />
          <Route path="dictionary" element={<DictionaryPage />} />
        </Route>
        {/* ===== Admin Routes ===== */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="words" element={<AdminWordsPage />} />
          <Route path="sentences" element={<AdminSentencesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="ugc-audit" element={<AdminUgcAuditPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="content-audit" element={<ContentAuditPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
          <Route path="illustrations" element={<AdminIllustrationPage />} />
          <Route path="illustrations/generate" element={<AdminIllustrationGeneratePage />} />
          <Route path="content/courses/:courseId/lessons" element={<AdminCourseLessonsPage />} />
          <Route path="content/courses/:courseId/lessons/:lessonId/words" element={<AdminLessonWordsPage />} />
          <Route path="chinese-chars" element={<AdminChineseCharsPage />} />
          <Route path="math/topics" element={<AdminMathTopicsPage />} />
          <Route path="math/practice-items" element={<AdminMathPracticePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AchievementProvider>
    </AdminAuthProvider>
  );
};

export default RoutesComponent;
