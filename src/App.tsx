import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { useEffect } from "react";
import { requestForToken, onMessageListener } from "./services/notificationService";
import { Toaster, toast } from 'react-hot-toast';
import { ConfirmProvider } from "./contexts/ConfirmContext";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MemberListPage from "./pages/MemberListPage";
import SignupPage from "./pages/SignupPage";
import FindPasswordPage from "./pages/FindPasswordPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import YouthNoticePage from "./pages/YouthNoticePage";
import YouthAlbumPage from "./pages/YouthAlbumPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import MyInfoPage from "./pages/MyInfoPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import HomepageManagePage from "./pages/HomepageManagePage";
import ScheduleManagePage from "./pages/ScheduleManagePage";
import AttendanceManagePage from "./pages/AttendanceManagePage";
import NewcomerManagePage from "./pages/NewcomerManagePage";
import BirthdayManagePage from "./pages/BirthdayManagePage";
import AbsenteeManagePage from "./pages/AbsenteeManagePage";
import SoonManagePage from "./pages/SoonManagePage";
import MemberManagePage from "./pages/MemberManagePage";
import ReportManagePage from "./pages/ReportManagePage";
import FinanceManagePage from "./pages/FinanceManagePage";
import MealManagePage from "./pages/MealManagePage";
import ScheduleListPage from "./pages/ScheduleListPage";
import ScheduleDetailPage from "./pages/ScheduleDetailPage";
import GuestAttendancePage from "./pages/GuestAttendancePage";
import NewcomerRegistrationPage from "./pages/NewcomerRegistrationPage";
import BoardListPage from "./pages/BoardListPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import BoardWritePage from "./pages/BoardWritePage";
import BoardEditPage from "./pages/BoardEditPage";
import TeamManagePage from "./pages/TeamManagePage";
import GroupFormationPage from "./pages/GroupFormationPage";
import FormManagerPage from "./pages/FormManagerPage";
import NotificationSendPage from "./pages/NotificationSendPage";
import ReportWritePage from "./pages/ReportWritePage";
import ReportViewPage from "./pages/ReportViewPage";
import UserReportListPage from "./pages/UserReportListPage";
import RollingPaperManagePage from "./pages/RollingPaperManagePage";
import RollingPaperDetailPage from "./pages/RollingPaperDetailPage";
import ThemeEditorPage from "./pages/ThemeEditorPage";
import FormPreviewPage from "./pages/FormPreviewPage";

function App() {
  useEffect(() => {
    // Request FCM token
    requestForToken();

    // Listen for foreground messages
    onMessageListener()
      .then((payload: unknown) => {
        console.log('Received foreground message: ', payload);
        const { title, body } = (payload as { notification?: { title?: string; body?: string } }).notification || {};
        if (title && body) {
          toast(`${title}: ${body}`, {
            duration: 5000,
            position: 'top-right',
          });
        }
      })
      .catch((err) => console.log('failed: ', err));
  }, []);

  return (
    <ConfirmProvider>
      <Toaster />
      <Routes>
        {/* 공용/일반 사용자 라우트 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/manage/forms/preview" element={<FormPreviewPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      <Route path="/attendance/guest" element={<GuestAttendancePage />} />
      <Route path="/newcomer/register" element={<NewcomerRegistrationPage />} />
      <Route path="/user-dashboard" element={<UserDashboardPage />} />
      <Route path="/youth-notices" element={<YouthNoticePage />} />
      <Route path="/youth-notices/write" element={<BoardWritePage />} />
      <Route path="/youth-notices/:noticeId/edit" element={<BoardEditPage />} />
      <Route path="/youth-notices/:noticeId" element={<BoardDetailPage />} />
      <Route path="/youth-album" element={<YouthAlbumPage />} />
      <Route path="/youth-album/:albumId" element={<AlbumDetailPage />} />
      <Route path="/my-info" element={<MyInfoPage />} />
      <Route path="/my-reports" element={<UserReportListPage />} />
      <Route path="/reports/write/:templateId" element={<ReportWritePage />} />
      <Route path="/reports/view/:submissionId" element={<ReportViewPage />} />
      <Route path="/club/:teamId" element={<TeamDetailPage />} />
      <Route path="/homepage-manage" element={<HomepageManagePage />} />
      <Route path="/schedules" element={<ScheduleListPage />} />
      <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
      <Route path="/boards/:boardType" element={<BoardListPage />} />
      <Route path="/boards/:boardType/write" element={<BoardWritePage />} />
      <Route path="/boards/:boardType/:postId/edit" element={<BoardEditPage />} />
      <Route path="/boards/:boardType/:postId" element={<BoardDetailPage />} />
      <Route path="/rolling-papers/:id" element={<RollingPaperDetailPage />} />

      {/* 관리자 전용 라우트 (관리 패널 레이아웃 사용) */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MemberListPage />} />
        <Route path="/manage/schedule" element={<ScheduleManagePage />} />
        <Route path="/manage/rolling-papers" element={<RollingPaperManagePage />} />
        <Route path="/manage/rolling-papers/theme-editor" element={<ThemeEditorPage />} />
        <Route path="/manage/attendance" element={<AttendanceManagePage />} />
        <Route path="/manage/newcomers" element={<NewcomerManagePage />} />
        <Route path="/manage/birthdays" element={<BirthdayManagePage />} />
        <Route path="/manage/absentees" element={<AbsenteeManagePage />} />
        <Route path="/manage/soon" element={<SoonManagePage />} />
        <Route path="/manage/members" element={<MemberManagePage />} />
        <Route path="/manage/reports" element={<ReportManagePage />} />
        <Route path="/manage/finance" element={<FinanceManagePage />} />
        <Route path="/manage/meal-tickets" element={<MealManagePage />} />
        <Route path="/manage/teams" element={<TeamManagePage />} />
        <Route path="/manage/group-formation" element={<GroupFormationPage />} />
        <Route path="/manage/notifications" element={<NotificationSendPage />} />
        
        {/* 새로운 폼 관리 시스템 라우트 */}
        <Route path="/manage/forms/:templateId" element={<FormManagerPage />} />
      </Route>

      {/* 기본 진입 시 일반 사용자 대시보드로 이동 */}
      <Route path="*" element={<Navigate to="/user-dashboard" replace />} />
      </Routes>
    </ConfirmProvider>
  );
}

export default App;
