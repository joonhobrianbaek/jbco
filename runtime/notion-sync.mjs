/** @typedef {{id:string, source:string, taskType:string, status:string, validationStatus:string, inputVersion:string, ruleVersion:string, lastCheckedAt?:string, lastSuccessAt?:string, errorSummary?:string}} Job */
const SOURCES = new Set(['demo-complete', 'demo-missing', 'demo-mismatch']);
const STATUS = {awaiting_approval:'대표 결정 대기', waiting_input:'자료 대기', failed:'실패'};
const VALIDATION = {passed:'통과', failed:'실패', unrun:'미검증'};
const NEXT = {awaiting_approval:'가상 계산 검증 통과. 해당 입력 버전의 결과를 확인한 뒤 명시적 결정 기록 검토', waiting_input:'가상 원본의 누락 단가와 대조 합계를 보완해 새 입력 버전으로 접수', failed:'가상 원본 대조 합계와 계산 합계의 불일치를 확인해 새 입력 버전으로 접수'};

/** Normalize Notion's numeric unique ID without changing the native property.
 * @param {string|number} value @returns {string}
 */
export function taskId(value) {
 const match = /^(?:BB-)?([1-9]\d*)$/.exec(String(value));
 if (!match) throw new Error('유효한 BB 작업 ID가 필요합니다.');
 return match[1];
}

/** Build an update-only, synthetic-only plan. Never creates pages or reads decisions.
 * IDs are explicit bindings, never inferred from row order or mutable titles.
 * @param {Job[]} jobs @param {Record<string,unknown>[]} rows
 * @param {{taskId:string,jobId:string}[]} bindings
 * @returns {{page_id:string,taskId:string,jobId:string,properties:Record<string,string|number>}[]}
 */
export function planNotionSync(jobs, rows, bindings) {
 const byId = new Map(), jobById = new Map();
 for (const row of rows) {
  const id = taskId(row['작업 ID']);
  if (byId.has(id)) throw new Error('중복 Notion 작업 ID');
  byId.set(id, row);
 }
 for (const job of jobs) {
  if (jobById.has(job.id)) throw new Error('중복 실행기 ID');
  jobById.set(job.id, job);
 }
 const seenTasks = new Set(), seenJobs = new Set();
 return bindings.map(binding => {
  const id = taskId(binding.taskId), row = byId.get(id), job = jobById.get(binding.jobId);
  if (seenTasks.has(id) || seenJobs.has(binding.jobId)) throw new Error('중복 연동 매핑');
  seenTasks.add(id); seenJobs.add(binding.jobId);
  if (!row || !job) throw new Error('작업 ID 또는 실행기 ID를 찾을 수 없습니다. 새 항목을 자동 생성하지 않습니다.');
  if (row['프로젝트'] !== '가상 업무 데모' || !String(row['업무명']).includes('가상 업무')) throw new Error('가상 업무만 동기화할 수 있습니다.');
  if (job.taskType !== 'synthetic-invoice' || !SOURCES.has(job.source) || !/^[a-f0-9]{64}$/.test(job.id) || !/^[a-f0-9]{64}$/.test(job.inputVersion) || job.ruleVersion !== 'synthetic-invoice-v1') throw new Error('허용되지 않은 실행기 업무');
  if (!STATUS[job.status] || !VALIDATION[job.validationStatus]) throw new Error('지원하지 않는 상태. 승인·완료는 이 연결에서 처리하지 않습니다.');
  if ((job.status === 'awaiting_approval') !== (job.validationStatus === 'passed')) throw new Error('상태와 검증 결과가 일치하지 않습니다.');
  if (!/^https:\/\/app\.notion\.com\/p\/[a-f0-9]{32}(?:\?.*)?$/.test(String(row.url))) throw new Error('Notion 페이지 주소를 확인하세요.');
  const properties = {'상태':STATUS[job.status], '검증 상태':VALIDATION[job.validationStatus], '다음 행동':NEXT[job.status]};
  for (const [field, value] of [['마지막 점검 시각',job.lastCheckedAt],['마지막 성공 시각',job.lastSuccessAt]]) {
   if (value != null) {
    if (!Number.isFinite(Date.parse(value))) throw new Error('잘못된 실행 시각');
    properties[`date:${field}:start`] = value;
    properties[`date:${field}:is_datetime`] = 1;
   } else if (row[`date:${field}:start`]) throw new Error('기존 시각을 지울 수 없는 계획입니다. 수동 검토가 필요합니다.');
  }
  return {page_id:String(row.url), taskId:`BB-${id}`, jobId:job.id, properties};
 });
}
