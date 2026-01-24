***

### 📄 `src/docs/backend-api.md` (최종 완성본)

```markdown
# JEJA-BE API Specification

이 문서는 Spring Boot 백엔드 API 명세서입니다. 프론트엔드 연동 시 이 명세를 엄격히 따라주세요.

## 1. 공통 응답 포맷 (Common Response)
모든 API 응답은 `ApiResponseForm`으로 감싸져 있습니다.
프론트엔드에서는 `response.data.data`를 실제 데이터로 사용해야 합니다.

```json
{
  "status": "success", // "success" | "error" | "fail"
  "code": "200",       // HTTP Status Code (String)
  "message": "성공 메시지",
  "data": { ... }      // 실제 DTO (null일 수 있음)
}
```

---

## 2. 인증 (Auth) - `AuthController`
- **로그인**: `POST /api/auth/login`
  - Req: `{ "loginId": "...", "password": "..." }`
  - Res: `{ "name": "이름", "role": "ROLE_USER" }`
  - **중요**: JWT 토큰은 Response Header의 `Authorization`에 `Bearer {token}` 형식으로 반환됨. 로컬 스토리지에 저장 필수.
- **회원가입**: `POST /api/auth/signup`
  - Req: `{ "loginId": "...", "password": "...", "name": "...", "phone": "010-0000-0000", "birthDate": "YYYY-MM-DD" }`

---

## 3. 사용자 (User) - `UserController`
- **내 정보 조회**: `GET /api/users/me`
  - Res:
    ```json
    {
      "userId": 1,
      "loginId": "user1",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "birthDate": "1999-01-01",
      "role": "ROLE_USER",
      "status": "ACTIVE",
      "soonName": "믿음순",
      "soonId": 10,
      "hasAccount": true
    }
    ```
- **내 출석 통계**: `GET /api/users/me/attendance-stats`
  - Res: `{ "thisMonthCount": 3, "thisYearCount": 40, "recentDates": ["2024-01-07", ...] }`
- **관리자용 유저 목록**: `GET /api/users?status={PENDING|ACTIVE}`
- **유저 승인/거절**: `PATCH /api/users/{userId}/status` (Body: `{ "status": "ACTIVE" }`)

---

## 4. 게시판 (Board & Post)
**공지사항**은 `boardKey="notice"`인 게시판입니다.

- **게시글 목록**: `GET /api/boards/{boardKey}/posts`
  - Params: `page`, `size`
  - Res: `Page<PostSimpleResponseDto>`
    - `content`: `[{ "postId": 1, "title": "...", "authorName": "...", "createdAt": "...", "viewCount": 0, "isNotice": boolean }]`
- **게시글 상세**: `GET /api/posts/{postId}`
  - Res:
    ```json
    {
      "postId": 1,
      "title": "제목",
      "content": "HTML 내용",
      "authorName": "작성자",
      "createdAt": "...",
      "isNotice": false,
      "comments": [
        { "commentId": 1, "content": "댓글", "authorName": "...", "children": [] }
      ]
    }
    ```
- **글 작성**: `POST /api/boards/{boardKey}/posts`
  - Req: `{ "title": "...", "content": "...", "isPrivate": false, "isNotice": false }`
- **글 수정**: `PATCH /api/posts/{postId}`
- **글 삭제**: `DELETE /api/posts/{postId}`
- **댓글 작성**: `POST /api/posts/{postId}/comments` (Req: `{ "content": "...", "parentId": null }`)

---

## 5. 일정 (Schedule) - `ScheduleController`
- **월별 일정**: `GET /api/schedules`
  - Params: `year` (int), `month` (int)
  - Res: `List<ScheduleResponseDto>`
    ```json
    [{
      "scheduleId": 1,
      "title": "주일예배",
      "startDate": "2024-01-01T11:00:00",
      "endDate": "2024-01-01T12:30:00",
      "type": "WORSHIP", // WORSHIP, EVENT, MEETING
      "location": "본당",
      "sharingScope": "PUBLIC" // PUBLIC, LOGGED_IN_USERS, PRIVATE
    }]
    ```
- **일정 등록**: `POST /api/schedules`
  - Req: `{ "title": "...", "startDate": "...", "endDate": "...", "type": "WORSHIP", "location": "...", "worshipCategoryId": 1 }`

---

## 6. 출석 (Attendance) - `AttendanceController`
- **출석 체크 (로그인 유저)**: `POST /api/schedule/{scheduleId}/check-in`
  - Req: `{ "latitude": 37.123, "longitude": 127.123 }`
- **출석 체크 (게스트)**: 위와 동일한 URL
  - Req: `{ "name": "...", "birthDate": "YYMMDD", "latitude": ..., "longitude": ... }`
- **오늘 내 출석 여부**: `GET /api/attendance/today`
  - Res: `{ "hasAttended": true, "attendanceTime": "..." }`
- **출석 가능한 일정**: `GET /api/schedule/checkable` (오늘 날짜 일정 리스트 반환)

---

## 7. 멤버 관리 (Member) - `MemberController`
- **전체 멤버 조회**: `GET /api/members`
  - Params: `keyword` (검색어)
  - Res: `Page<MemberDto>`
    - `MemberDto`: `{ "memberId": 1, "name": "...", "phone": "...", "memberStatus": "ACTIVE", "roles": ["MEMBER", "CELL_LEADER"] }`
- **멤버 등록**: `POST /api/members`
- **엑셀 업로드**: `POST /api/members/import` (MultipartFile)

---

## 8. 팀/소그룹 (Club) - `ClubController`
- **전체 팀 목록**: `GET /api/clubs`
- **내 팀 목록**: `GET /api/clubs/my`
- **팀 상세**: `GET /api/clubs/{clubId}` (멤버 리스트 포함)
- **팀 가입 신청서 조회**: `GET /api/clubs/{clubId}/applications` (팀장/관리자용)

---

## 9. 순(Cell) 관리 - `CellController`
- **내 순 정보**: `GET /api/cells/my`
  - Res: `{ "cellName": "믿음순", "leader": { "name": "..." }, "members": [...] }`
- **전체 순 조회 (관리자)**: `GET /api/admin/cells?year=2024`
- **순 편성 (관리자)**: `POST /api/admin/cells/{cellId}/members` (멤버 ID 리스트 전송)

---

## 10. 앨범 (Album) - `AlbumController`
- **앨범 목록**: `GET /api/albums`
  - Res: `Page<AlbumResponseDto>` (`coverImageUrl` 포함)
- **앨범 상세(사진)**: `GET /api/albums/{albumId}/photos`
- **사진 업로드 프로세스**:
  1. `POST /api/files/upload` (Form-data 'file') -> URL 반환
  2. `POST /api/albums/{albumId}/photos` -> Body: `["/files/img1.jpg", "/files/img2.jpg"]`

---

## 11. 홈페이지 관리 (Homepage)
- **슬라이드 조회**: `GET /api/homepage/slides` (메인 화면용)
- **유튜브 설정 조회**: `GET /api/homepage/youtube` (라이브/플레이리스트 URL)
- **관리자 수정**: `POST /api/admin/homepage/...`

---

## 12. 재정 (Finance) - `FinanceController`
- **목록 조회**: `GET /api/finances?startDate=...&endDate=...`
- **등록**: `POST /api/finances`
  - Req: `{ "date": "...", "type": "INCOME|EXPENSE", "categoryName": "...", "amount": 10000, "receiptUrl": "..." }`
- **엑셀 다운로드**: `GET /api/finances/export`

---

## 13. 새신자 및 케어 (Newcomer/Care) - `NewcomerController`
- **새신자 목록**: `GET /api/newcomers`
  - Query: `?status=MAIN_WORSHIP` (선택)
  - Res: `[{ "newcomerId": 1, "name": "...", "phone": "...", "status": "..." }]`
- **새신자 등록**: `POST /api/newcomers`
  - Req: `{ "name": "...", "phone": "...", "managerMemberId": 1, "status": "MAIN_WORSHIP" }`
- **장기 결석자 목록**: `GET /api/care/absentees`
  - Res: `[{ "memberId": 1, "name": "...", "absenceWeeks": 4, "status": "LONG_TERM_ABSENCE" }]`
- **케어 로그 등록**: `POST /api/care/absentees/{memberId}/logs`
  - Req: `{ "content": "전화 심방 완료", "careMethod": "CALL" }`

---

## 14. 보고서/설문 (Form) - `FormController`
- **작성 가능 양식 조회**: `GET /api/forms/templates/available`
  - Res: `[{ "templateId": 1, "title": "순 보고서", "isSubmitted": false }]`
  
- **내 제출 내역 조회**: `GET /api/forms/submissions/my`
  - Res: `[{ "submissionId": 1, "templateTitle": "...", "submitDate": "...", "status": "PENDING" }]`

- **보고서 제출**: `POST /api/forms/submissions`
  - Req:
    ```json
    {
      "templateId": 1,
      "date": "2024-01-01",
      "cellId": 10,
      "answers": [
        { "questionId": 1, "value": "네" },
        { "questionId": 2, "targetMemberId": 5, "value": "true" }
      ]
    }
    ```
- **제출 승인(관리자)**: `PATCH /api/forms/submissions/{id}/approve`

---

## 15. 파일 업로드 (File) - `FileUploadController`
- **파일 업로드**: `POST /api/files/upload`
  - Req: `multipart/form-data` (key: `file`)
  - Query: `?folder=album` (저장할 폴더명)
  - Res:
    ```json
    {
      "url": "/files/album/uuid_filename.jpg",
      "originalName": "photo.jpg"
    }
    ```
  - **중요**: 앨범이나 재정 영수증 등록 시, 이 API를 먼저 호출하여 이미지 URL을 받은 뒤, 해당 URL을 다른 API에 전송해야 함.