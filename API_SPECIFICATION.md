# 홈페이지 관리 페이지 API 명세서

## 1. 회원가입 신청 관리 API

### 1.1 승인 대기 사용자 목록 조회
- **엔드포인트**: `GET /api/admin/users/pending`
- **권한**: 관리자
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "승인 대기 사용자 목록 조회 성공",
  "data": [
    {
      "userId": 1,
      "loginId": "user123",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "createdAt": "2024-01-15T10:30:00"
    }
  ]
}
```

### 1.2 사용자 승인
- **엔드포인트**: `PATCH /api/admin/users/{userId}/approve`
- **권한**: 관리자
- **경로 파라미터**: `userId` (number)
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "사용자 승인 완료"
}
```

### 1.3 사용자 거절
- **엔드포인트**: `PATCH /api/admin/users/{userId}/reject`
- **권한**: 관리자
- **경로 파라미터**: `userId` (number)
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "사용자 거절 완료"
}
```

### 1.4 승인된 사용자 목록 조회
- **엔드포인트**: `GET /api/admin/users/approved`
- **권한**: 관리자
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "승인된 사용자 목록 조회 성공",
  "data": [
    {
      "userId": 1,
      "loginId": "user123",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "createdAt": "2024-01-15T10:30:00",
      "approvedAt": "2024-01-16T09:00:00"
    }
  ]
}
```

---

## 2. 홈페이지 슬라이드 관리 API

### 2.1 슬라이드 목록 조회
- **엔드포인트**: `GET /api/admin/homepage/slides`
- **권한**: 관리자
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "슬라이드 목록 조회 성공",
  "data": [
    {
      "id": 1,
      "type": "text",
      "backgroundColor": "#1e293b",
      "textElements": [
        {
          "id": "text-1234567890",
          "text": "Welcome to JEJA Youth",
          "fontSize": 32,
          "color": "#ffffff",
          "x": 50,
          "y": 40,
          "fontWeight": "bold",
          "fontFamily": "Arial"
        }
      ],
      "title": null,
      "subtitle": null,
      "url": null,
      "linkUrl": null
    },
    {
      "id": 2,
      "type": "image",
      "url": "https://example.com/image.jpg",
      "linkUrl": "https://example.com",
      "title": "슬라이드 제목",
      "subtitle": "슬라이드 부제목",
      "backgroundColor": null,
      "textElements": null
    }
  ]
}
```

### 2.2 슬라이드 추가
- **엔드포인트**: `POST /api/admin/homepage/slides`
- **권한**: 관리자
- **요청 본문** (텍스트 슬라이드):
```json
{
  "type": "text",
  "backgroundColor": "#1e293b",
  "textElements": [
    {
      "text": "Welcome to JEJA Youth",
      "fontSize": 32,
      "color": "#ffffff",
      "x": 50,
      "y": 40,
      "fontWeight": "bold",
      "fontFamily": "Arial"
    }
  ]
}
```

- **요청 본문** (이미지 슬라이드):
```json
{
  "type": "image",
  "url": "https://example.com/image.jpg",
  "linkUrl": "https://example.com",
  "title": "슬라이드 제목",
  "subtitle": "슬라이드 부제목"
}
```

- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "슬라이드 추가 완료",
  "data": {
    "id": 3
  }
}
```

### 2.3 슬라이드 수정
- **엔드포인트**: `PATCH /api/admin/homepage/slides/{slideId}`
- **권한**: 관리자
- **경로 파라미터**: `slideId` (number)
- **요청 본문**: 슬라이드 추가와 동일한 형식 (부분 업데이트 가능)
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "슬라이드 수정 완료"
}
```

### 2.4 슬라이드 삭제
- **엔드포인트**: `DELETE /api/admin/homepage/slides/{slideId}`
- **권한**: 관리자
- **경로 파라미터**: `slideId` (number)
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "슬라이드 삭제 완료"
}
```

### 2.5 슬라이드 순서 변경 (선택사항)
- **엔드포인트**: `PATCH /api/admin/homepage/slides/reorder`
- **권한**: 관리자
- **요청 본문**:
```json
{
  "slideIds": [3, 1, 2]
}
```
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "슬라이드 순서 변경 완료"
}
```

---

## 3. 유튜브 링크 관리 API

### 3.1 유튜브 링크 조회
- **엔드포인트**: `GET /api/admin/homepage/youtube`
- **권한**: 관리자
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "유튜브 링크 조회 성공",
  "data": {
    "liveUrl": "https://www.youtube.com/channel/UCJekqH69c4VTieaH4N6ErsA/live",
    "playlistUrl": "https://www.youtube.com/embed/videoseries?list=PL-wQhvG4IAQRsNULw0nwgHKb-FOe-nFAu"
  }
}
```

### 3.2 유튜브 링크 저장/수정
- **엔드포인트**: `PATCH /api/admin/homepage/youtube`
- **권한**: 관리자
- **요청 본문**:
```json
{
  "liveUrl": "https://www.youtube.com/channel/UCJekqH69c4VTieaH4N6ErsA/live",
  "playlistUrl": "https://www.youtube.com/embed/videoseries?list=PL-wQhvG4IAQRsNULw0nwgHKb-FOe-nFAu"
}
```
- **응답 형식**:
```json
{
  "status": "success",
  "code": "200",
  "message": "유튜브 링크 저장 완료"
}
```

---

## 4. 공통 사항

### 4.1 인증
- 모든 API는 JWT 토큰이 필요합니다.
- 헤더에 `Authorization: Bearer {token}` 형식으로 전달해야 합니다.

### 4.2 에러 응답 형식
```json
{
  "status": "error",
  "code": "400",
  "message": "에러 메시지",
  "data": null
}
```

### 4.3 권한 에러
- 관리자 권한이 없는 경우: `403 Forbidden`
- 인증 토큰이 없는 경우: `401 Unauthorized`

---

## 5. 데이터 타입 정의

### 5.1 SlideType
```typescript
type SlideType = 'text' | 'image'
```

### 5.2 TextElement
```typescript
interface TextElement {
  id: string
  text: string
  fontSize: number
  color: string
  x: number        // 0-100 (퍼센트)
  y: number        // 0-100 (퍼센트)
  fontWeight: 'normal' | 'bold' | 'semibold'
  fontFamily: string
}
```

### 5.3 Slide
```typescript
interface Slide {
  id: number
  type: SlideType
  title?: string
  subtitle?: string
  backgroundColor?: string      // 텍스트 슬라이드용
  textElements?: TextElement[]  // 텍스트 슬라이드용
  url?: string                  // 이미지 슬라이드용
  linkUrl?: string              // 이미지 슬라이드용 (클릭 시 이동할 링크)
}
```

### 5.4 YoutubeLinks
```typescript
interface YoutubeLinks {
  liveUrl: string
  playlistUrl: string
}
```

---

## 6. 구현 우선순위

### 필수 (Phase 1)
1. ✅ 사용자 승인/거절 API (이미 구현됨)
2. ✅ 승인된 사용자 목록 조회 API (이미 구현됨)
3. 슬라이드 목록 조회 API
4. 슬라이드 추가 API
5. 슬라이드 삭제 API
6. 유튜브 링크 조회/저장 API

### 선택 (Phase 2)
1. 슬라이드 수정 API
2. 슬라이드 순서 변경 API

---

## 7. 참고사항

- 현재 프론트엔드는 로컬 스토리지에 임시 저장하고 있습니다.
- 백엔드 API가 구현되면 `HomepageManagePage.tsx`의 TODO 주석 부분을 활성화하고 로컬 스토리지 저장을 제거해야 합니다.
- 슬라이드 순서는 배열의 인덱스 순서로 관리하거나 별도의 `order` 필드를 추가할 수 있습니다.




