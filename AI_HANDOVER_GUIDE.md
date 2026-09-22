# 🤖 [AI 인수인계 지침서] 스마트 차계부 Pro (Smart Fuel Pro)

> **이 문서는 다른 컴퓨터에서 이 프로젝트를 인계받아 작업할 AI 어시스턴트(Cursor, Claude, ChatGPT, Antigravity, Copilot 등)를 위한 기술 인수인계 및 아키텍처 가이드입니다.**

---

## 1. 프로젝트 개요 & 비즈니스 목적

- **프로젝트명**: 스마트 차계부 Pro (Smart Fuel Pro)
- **앱 성격**: 스마트폰 모바일 화면에 최적화된 **차량 연비 계산, 주유 기록, 계기판/영수증 AI OCR, 차량 정비 및 소모품 관리 PWA(Progressive Web App)**
- **사용자 기기 환경**:
  - 사용자 메인 디바이스는 **삼성 갤럭시(Android One UI)**입니다.
  - PC와 스마트폰이 서로 다른 네트워크(LTE/5G 등)에 있어도 실행될 수 있도록 **공인 HTTPS 클라우드(GitHub Pages)**에 배포되어 있습니다.
  - 갤럭시에서 브라우저(Chrome/삼성 인터넷)로 접속 후 **[앱 설치]**를 누르면 Android OS의 **WebAPK 엔진**에 의해 구글 플레이스토어 앱과 똑같이 앱 서랍에 정식 설치되어 주소창 없는 100% 전체화면 네이티브 앱으로 구동됩니다.
- **실제 라이브 배포 주소**: `https://jaehyeong123.github.io/smart-fuel-pro/`
- **GitHub 원격 저장소**: `https://github.com/jaehyeong123/smart-fuel-pro`

---

## 2. 기술 스택 & 개발 환경

| 계층 | 기술 스택 | 설명 |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 / 19, TypeScript | Strict Mode, 번들 최적화 |
| **Build Tool** | Vite 6 | 초고속 HMR, `base: './'` 설정 (GitHub Pages 호환) |
| **Styling** | Tailwind CSS 3 | 모바일 Safe Area Inset(노치/홈바) 대응, Pretendard 웹폰트, 다크모드 지원 |
| **Icons** | Lucide React | 모바일 네이티브 감성의 아이콘셋 |
| **Charts** | Chart.js 4 + react-chartjs-2 | 연비 변화 추이 스플라인 꺾은선 차트 (레티나 고해상도) |
| **Vision / OCR** | Tesseract.js v5 + HTML5 Canvas | 브라우저 내장 클라이언트 사이드 OCR (백엔드 서버 불필요) |
| **Data Storage** | Browser LocalStorage | 완전 오프라인 영구 보관 (서버 비용 0원, JSON/CSV 백업 지원) |
| **PWA** | Web App Manifest + Service Worker | Standalone 모바일 설치 및 오프라인 캐싱 지원 |
| **Deployment** | GitHub Pages (`gh-pages`) | 원클릭 배포 파이프라인 (`npm run ship`) |

---

## 3. 디렉토리 구조 & 파일별 역할

```
smart-fuel-pro/
├── public/
│   ├── icon.svg               # 고해상도 PWA 벡터 앱 아이콘
│   ├── manifest.json          # PWA Standalone 매니페스트 (상대경로 ./)
│   ├── mobile-qr.png / .svg   # 스마트폰 즉시 접속용 QR 코드 이미지
│   ├── sw.js                  # PWA 오프라인 캐시 서비스 워커
│   └── .nojekyll              # GitHub Pages 언더스코어 에셋 무시 방지
├── scripts/
│   └── generate-qr.cjs        # 배포 URL 기준 터미널 및 이미지 QR 생성 스크립트
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx      # 하단 모바일 탭 네비게이션 (대시보드, 주유등록, 정비관리, 주유내역)
│   │   ├── DashboardView.tsx  # 상단 KPI 카드(평균연비, 1km비용, 누적비용 등) 및 Chart.js 연비 그래프
│   │   ├── FuelInputForm.tsx  # 계기판/영수증 OCR 업로드, 숫자 후보 칩, 터치 확대 모달, 주유 입력 폼
│   │   ├── Header.tsx         # 차량 프로필, 다크모드 토글, PWA 설치 유도 버튼
│   │   ├── HistoryView.tsx    # 주유 내역 타임라인 피드, 명세서 사진 확대, CSV/JSON 백업/복원
│   │   ├── InstallModal.tsx   # PWA 홈 화면 설치 안내 & 차량 정보(차종, 번호, 공인연비) 설정 모달
│   │   └── MaintenanceView.tsx # [신규] 차량 정비 및 소모품 관리 (엔진오일 잔여km, 영수증, 명세서)
│   ├── types/
│   │   └── index.ts           # FuelRecord, MaintenanceRecord, VehicleProfile 등 핵심 인터페이스
│   ├── utils/
│   │   ├── fuelCalculator.ts  # 구간 연비 산출 및 과거 데이터 소급 타임라인 체인 재계산 알고리즘
│   │   ├── imagePreprocess.ts # 캔버스 기반 어두운 계기판 LCD 자동 반전(Invert) & 대비 증폭 필터
│   │   ├── ocrParser.ts       # 한국 주유 영수증 및 계기판 맞춤형 OCR 정규식 파서 & 폰트 에러 복원
│   │   └── storage.ts         # LocalStorage CRUD, 초기 샘플 데이터, CSV/JSON 내보내기/가져오기
│   ├── App.tsx                # 최상위 뷰 라우팅, 상태 관리, 토스트 알림, PWA 이벤트 리스너
│   ├── index.css              # Tailwind 유틸리티 및 Safe Area Inset 모바일 터치 스타일
│   └── main.tsx               # React 렌더링 진입점
├── index.html                 # 모바일 뷰포트 메타 태그, PWA 설정, Pretendard 폰트 링크
├── package.json               # 의존성 및 스크립트 (build, deploy, ship 등)
├── standalone.html            # 추가 빌드 도구 없이 단독 더블클릭으로 바로 실행되는 올인원 파일
├── tsconfig.json              # TypeScript Strict 컴파일 설정
└── vite.config.ts             # Vite 번들러 설정 (base: './' 상대경로 필수)
```

---

## 4. 핵심 비즈니스 로직 & 알고리즘

### ① 구간 연비 및 소급 체인 재계산 (`src/utils/fuelCalculator.ts`)
- **구간 연비 공식**:
  $$\text{구간 연비(km/L)} = \frac{\text{현재 누적 주행거리} - \text{직전 누적 주행거리}}{\text{주유량(L)}}$$
- **소급 체인 관리 (`recalculateRecordsChain`)**:
  - 사용자가 과거 날짜의 기록을 뒤늦게 입력하거나, 중간 기록을 수정/삭제하더라도 전체 기록을 일자순/주행거리순으로 자동 정렬합니다.
  - 연관된 이후 모든 기록들의 `tripDistance(구간거리)`, `fuelEfficiency(연비)`, `costPerKm(1km당 비용)`을 즉시 재계산하여 데이터 무결성을 유지합니다.
  - 최초 1회차 기록은 기준점이 되며 `fuelEfficiency: null` (최초 기준 주유)로 표시됩니다.

### ② 지능형 모바일 OCR 비전 엔진 (`src/utils/imagePreprocess.ts`, `ocrParser.ts`)
1. **디지털 클러스터(LCD) 어두운 배경 자동 반전 (Invert)**:
   - 현대/기아/제네시스 등 대다수 최신 차량은 검은 배경에 밝은 숫자가 표시됩니다.
   - Tesseract OCR은 흰 배경에 검은 글씨를 가장 잘 인식하므로, 이미지 평균 밝기(Luminance < 125)를 감지하여 **자동으로 색상을 반전(Invert) 및 대비 증폭(Contrast Boost)**하여 숫자를 읽어냅니다.
2. **숫자 폰트 왜곡 복원 & 정규식 리페어**:
   - `O/o` -> `0`, `l/I/|` -> `1`, `S/s` -> `5`, `B` -> `8` 인접 숫자 기반 치환.
   - 계기판 숫자 사이의 띄어쓰기(`4 8 2 5 0` -> `48250`) 자동 병합.
3. **감지된 숫자 후보군(Chip) 원터치 반영**:
   - 계기판 사진 속에 트립거리, 속도계, 시계 등 여러 숫자가 있어도 `rawCandidates` 상위 5개를 추출하여 사진 하단에 칩 버튼(`[ 48,250 km ]`)으로 제공. 터치 시 즉시 인풋에 반영.
4. **영수증 파서**:
   - `주유량(L)`, `결제금액(원)`, `단가(원/L)`, `주유소 상호(SK, GS, S-Oil, 현대 등)` 자동 추출.

### ③ 사진 업로드 & 원본 확대 UX (`src/components/FuelInputForm.tsx`)
- 모바일 브라우저의 강제 카메라 전환을 방지하기 위해 **[📷 카메라 촬영]**(`capture="environment"`)과 **[🖼️ 앨범에서 선택]**(기본 파일 선택) 버튼을 명시적으로 분리 제공합니다.
- 계기판/영수증 사진 썸네일을 터치하면 **고화질 원본 전체화면 팝업 뷰어**가 열려 사용자가 직접 사진을 확대해서 확인할 수 있습니다.

### ④ 차량 정비 & 소모품 관리 시스템 (`src/components/MaintenanceView.tsx`)
- 하단 3번째 **[정비관리]** 탭에서 엔진오일, 미션오일, 브레이크 패드, 타이어, 에어컨 필터, 배터리, 와이퍼 등 카테고리별 정비 내역을 기록합니다.
- 정비 시점 주행거리, 정비소명, 비용, 명세서 사진(촬영/앨범)을 보관합니다.
- **엔진오일 잔여 주행거리(km)**를 실시간 자동 산출하여 대시보드 카드로 안내합니다.

---

## 5. 다른 컴퓨터에서 개발 및 배포하는 방법

### ① 필수 사전 요구사항
- **Node.js**: v18+ (v20 권장)
- **Git**: 원격 저장소 푸시 권한

### ② 설치 및 로컬 실행
```bash
# 1. 의존성 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (모바일 접속 가능한 host 0.0.0.0 바인딩)
npm run dev
# -> http://localhost:5173/ 접속
```

### ③ ⚡ 원클릭 클라우드 빌드 & 배포 (가장 중요)
코드를 수정한 후 아래 단 한 줄만 실행하면 번들 빌드와 GitHub Pages 배포가 20초 만에 완료됩니다:
```bash
npm run ship
```
*(내부 동작: `tsc && vite build` 실행 후 생성된 `dist/` 폴더를 GitHub의 `gh-pages` 브랜치로 자동 푸시)*

배포 후 스마트폰에서 앱을 새로고침하거나 껐다 켜면 **자동으로 최신 코드가 반영(OTA)**됩니다.

---

## 6. AI 어시스턴트를 위한 작업 팁 (Tips for AI)

1. **상대경로 유지 필수**: GitHub Pages 서브패스 배포를 위해 `vite.config.ts`의 `base: './'` 및 `manifest.json`, `sw.js`의 상대경로 구조를 절대 깨뜨리지 마세요.
2. **TypeScript Strict 준수**: 미사용 import나 미사용 변수가 있으면 `npm run build` 단계에서 에러가 발생합니다(`noUnusedLocals: true`). 불필요한 import는 항상 정리하세요.
3. **PWA 오프라인 캐시**: 새로운 주요 자산을 추가할 경우 `public/sw.js`의 캐시 목록 및 캐시 버전을 갱신하세요.
4. **LocalStorage 키 네이밍**:
   - 주유 기록: `smart_fuel_pro_records_v1`
   - 정비 기록: `smart_fuel_pro_maintenance_v1`
   - 차량 프로필: `smart_fuel_pro_profile_v1`
