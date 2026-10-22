# 가상 업무 Notion 연동

기준 구현: c7ae263. 기존 Notes와 수동 업무는 수정하지 않는다.

## 범위

실행기 가상 업무 3건을 기존 Notion 작업 ID와 명시적으로 1:1 연결한다.
Notion의 작업 ID는 자동 번호이므로 해시로 덮어쓰지 않는다. 매핑은 개인 실행 폴더와 각 Notion 항목 본문에 보관한다. 개인 데이터베이스·페이지 주소, 매핑 JSON, 인증정보는 git에 넣지 않는다.

연동 계획기는 네트워크를 호출하지 않는다. 대화용 Notion 연결로 상태를 한 차례 반영했으며, 지속 인증·무인 동기화·스케줄·Drive·회사 시스템은 연결하지 않았다.

## 수동 재현

```sh
node scripts/demo-local-jobs.mjs /private/BB_Office_Demo
node scripts/plan-notion-sync.mjs /private/BB_Office_Demo /private/rows.json /private/bindings.json /private/plan.json
```

- rows.json: Notion 데이터 소스의 현재 전체 rows 배열. `업무명`, `작업 ID`, `프로젝트`, `url`, 기존 점검·성공 시각 포함.
- bindings.json: `[{"taskId":"BB-1","jobId":"64자리 실행기 해시"}]` 형식. 행 순서나 제목으로 자동 추측하지 않는다.
- plan.json: 새 파일로만 저장한다. 쓰기 전에 Notion ID·프로젝트·해시·입력 버전·규칙 버전과 현재 실행기 상태를 다시 확인한다.
- 부분 반영 후에는 전체 생성 요청을 재시도하지 말고 현재 rows를 새로 읽어 계획을 재생성한다. 기존 ID만 업데이트하며 새 Notion 항목을 만들지 않는다.
- 점검·성공 시각은 실행기 기록을 그대로 사용한다. 현재 시간을 성공 시각으로 만들어 넣지 않는다. 삭제가 필요한 기존 시각은 자동으로 남기지 않고 검토 오류를 낸다.
- 링크는 로컬 경로를 URL로 위장하지 않는다. 결과가 게시되지 않았다면 링크 필드는 비워 둔다.

## 상태와 결정

| 실행기 상태 | Notion 상태 |
| --- | --- |
| awaiting_approval | 대표 결정 대기 |
| waiting_input | 자료 대기 |
| failed | 실패 |

완료·승인·실제 업무는 계획기에서 거부한다. Notion의 완료 변경을 로컬 승인으로 읽는 코드는 없다. 향후 결정 연결은 action/note/time뿐 아니라 jobId/inputVersion/ruleVersion을 검증해야 한다. 이번 단계에서는 결정 읽기·쓰기 자체를 활성화하지 않았다.

## 검증

구문 검사와 전체 Node 테스트 53개 통과. 추가 테스트는 ID 누락·중복, 실제 업무 거부, 상태/검증 불일치, 잘못된 시각, 성공 시각 부재, 반복 업데이트 및 Notion 완료가 승인이 되지 않는 동작을 검증한다.

경계: 계획 생성과 외부 반영 사이에는 원자적 CAS가 없다. 계획 적용 직전 상태 재확인이 필요하며 동시 수정은 완전히 방지하지 못한다. 공개 API 영구 인증, 브라우저 UI, 운영 일정, 회사 자료는 검증하거나 활성화하지 않았다.
