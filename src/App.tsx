import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MemberListPage from "./pages/MemberListPage";
import SignupPage from "./pages/SignupPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import YouthNoticePage from "./pages/YouthNoticePage";
import YouthAlbumPage from "./pages/YouthAlbumPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import MyInfoPage from "./pages/MyInfoPage";
import ClubPage from "./pages/ClubPage";
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
import ScheduleListPage from "./pages/ScheduleListPage";
import ScheduleDetailPage from "./pages/ScheduleDetailPage";
import GuestAttendancePage from "./pages/GuestAttendancePage";
import BoardListPage from "./pages/BoardListPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import BoardWritePage from "./pages/BoardWritePage";
import BoardEditPage from "./pages/BoardEditPage";
import TeamManagePage from "./pages/TeamManagePage";
import GroupFormationPage from "./pages/GroupFormationPage";

function App() {
  return (
    <Routes>
      {/* 공용/일반 사용자 라우트 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/attendance/guest" element={<GuestAttendancePage />} />
      <Route path="/user-dashboard" element={<UserDashboardPage />} />
      <Route path="/youth-notices" element={<YouthNoticePage />} />
      <Route path="/youth-notices/:noticeId" element={<BoardDetailPage />} />
      <Route path="/youth-album" element={<YouthAlbumPage />} />
      <Route path="/youth-album/:albumId" element={<AlbumDetailPage />} />
      <Route path="/my-info" element={<MyInfoPage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="/club/:teamId" element={<TeamDetailPage />} />
      <Route path="/homepage-manage" element={<HomepageManagePage />} />
      <Route path="/schedules" element={<ScheduleListPage />} />
      <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
      <Route path="/boards/:boardType" element={<BoardListPage />} />
      <Route path="/boards/:boardType/write" element={<BoardWritePage />} />
      <Route path="/boards/:boardType/:postId" element={<BoardDetailPage />} />
      <Route path="/boards/:boardType/:postId/edit" element={<BoardEditPage />} />
      <Route path="/youth-notices/write" element={<BoardWritePage />} />

      {/* 관리자 전용 라우트 (관리 패널 레이아웃 사용) */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MemberListPage />} />
        <Route path="/manage/schedule" element={<ScheduleManagePage />} />
        <Route path="/manage/attendance" element={<AttendanceManagePage />} />
        <Route path="/manage/newcomers" element={<NewcomerManagePage />} />
        <Route path="/manage/birthdays" element={<BirthdayManagePage />} />
        <Route path="/manage/absentees" element={<AbsenteeManagePage />} />
        <Route path="/manage/soon" element={<SoonManagePage />} />
        <Route path="/manage/members" element={<MemberManagePage />} />
        <Route path="/manage/reports" element={<ReportManagePage />} />
        <Route path="/manage/finance" element={<FinanceManagePage />} />
        <Route path="/manage/teams" element={<TeamManagePage />} />
        <Route
          path="/manage/group-formation"
          element={<GroupFormationPage />}
        />
      </Route>

      {/* 기본 진입 시 일반 사용자 대시보드로 이동 */}
      <Route path="*" element={<Navigate to="/user-dashboard" replace />} />
    </Routes>
  );
}

export default App;
