# 품질 표준 프로토콜 (Quality Standard)

품질 표준 (`skills/references/quality.md`)은 `tdd`, `review`, `ship`, `archive`, `onboard` 전반에서 강제 적용되는 품질 기준을 정의합니다.

## 3차원 품질 검증

모든 구현 및 리팩토링 사이클마다 다음 4가지 관점에서 엄격히 검증합니다:

### 1. 기계적 검사 (Mechanical Checks)
- Lint 규칙이 경고 없이 통과.
- 코드 포맷팅이 프로젝트 설정 준수.
- `any`를 통한 우회나 타입 오류 억제 없이 타입 검사(Typecheck) 통과.

### 2. 관례 준수 (Convention Adherence)
- 명세서(`convention:`)에 선언된 프로젝트 관례 및 스택 모범 사례 엄격 준수.
- 관용적 구조, 에러 처리 패턴 및 명명 규칙 평가.

### 3. 설계 평가 (Design Assessment)
- **고응집·저결합**: 함수와 클래스가 높은 응집도를 가지며 모듈 간 결합이 최소화됨.
- **적절한 추상화 수준**: 조기 추상화나 불필요한 추상화를 방지하며, 계약을 충족하는 최소한의 구현 유지.

### 4. 문서 커버리지 (Documentation Coverage)
- 모든 공개 함수, API 엔드포인트, 내보낸 인터페이스, 환경 변수 및 오류 모드가 정확히 문서화됨.
- `README.md`의 명령어 및 예제가 실행 가능하고 최신 상태로 유지됨.
- 문서 업데이트가 누락된 코드 변경은 Code Review를 통과할 수 없음.
