# JEJA-FE (제자교회 청년부 관리 시스템)

제자교회 청년부의 효율적인 운영과 관리를 위한 웹 애플리케이션입니다.
멤버 관리, 출석 체크, 새신자 관리, 재정(식권) 관리, 조편성 등 다양한 사역 활동을 지원합니다.

## 🚀 주요 기능

### 1. 멤버 및 조직 관리
- **멤버 관리**: 청년부 전체 멤버 등록, 조회, 수정 및 엑셀 일괄 등록
- **순(Cell) 관리**: 순 구성, 순장 배정 및 순원 배치
- **출석 관리**: 주차별 예배 및 모임 출석 체크
- **장기 결석자 관리**: 장기 미출석 인원 별도 관리 및 케어

### 2. 새신자 관리 (Newcomer Team)
- **새신자 등록**: 새신자 정보 입력 및 담당 MD 배정
- **등반 관리**: 기초 양육 과정 이수 및 등반 현황 추적
- **식권 관리**: 새신자 및 리더십을 위한 식권 발급 및 사용 내역 관리

### 3. 사역 지원
- **조편성 (Content Team)**: 수련회, 행사 등을 위한 자동/수동 조편성 기능
- **일정 관리**: 청년부 주요 행사 및 일정 캘린더 관리
- **재정 관리**: 회비, 후원금 등 재정 입출력 및 보고서 생성 (엑셀 내보내기 지원)
- **롤링페이퍼**: 멤버 간 응원 메시지 및 스티커 부착 기능

### 4. 커뮤니티
- **게시판**: 공지사항, 기도제목, 자유게시판 등
- **알림 발송**: 전체 또는 그룹별 알림 메시지 발송

## 🛠 기술 스택

### Frontend
- **Framework**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Styled Components
- **State/Routing**: React Router v7, Context API
- **HTTP Client**: Axios

### Libraries & Tools
- **Editor**: Toast UI Editor (WYSIWYG)
- **Data Processing**: ExcelJS, SheetJS (xlsx), JSZip (엑셀/파일 처리)
- **Visualization**: Recharts (통계 차트), html2canvas/jspdf (PDF 변환)
- **UI Components**: React Icons, Lucide React, React Hot Toast
- **Backend Integration**: Firebase (일부 기능), RESTful API 호환

## 📦 설치 및 실행 방법

### 1. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 API 서버 주소를 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
# VITE_FIREBASE_MEASUREMENT_ID=... (필요 시 설정)
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173`으로 접속하여 확인합니다.

### 4. 빌드 (배포용)
```bash
npm run build
```

## 📂 프로젝트 구조
```
src/
├── components/     # 재사용 가능한 UI 컴포넌트
├── pages/          # 페이지 단위 컴포넌트 (기능별 구분)
├── services/       # API 통신 및 비즈니스 로직
├── types/          # TypeScript 인터페이스 및 타입 정의
├── utils/          # 공통 유틸리티 함수 (포맷팅, 인증 등)
└── assets/         # 이미지, 폰트 등 정적 리소스
```

---
© 2024 JEJA-FE Project. All rights reserved.
