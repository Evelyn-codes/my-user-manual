type EventName='landing_view'|'test_start'|'question_answered'|'test_completed'|'result_viewed'|'poster_generated'|'result_link_copied'|'restart_clicked';
// Explicit allowlist. Do not add answers, run IDs or user identifiers here.
type Payload={questionNumber?:number;resultKey?:string};
export function track(eventName:EventName,payload:Payload={}) {
 const safe:Payload={};
 if(Number.isInteger(payload.questionNumber)&&payload.questionNumber!>=1&&payload.questionNumber!<=18)safe.questionNumber=payload.questionNumber;
 if(payload.resultKey&&/^A[123]-B[123]-C[12]$/.test(payload.resultKey))safe.resultKey=payload.resultKey;
 if(import.meta.env.DEV)console.debug('[manual]',eventName,safe);
}
