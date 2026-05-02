import assert from 'node:assert/strict';

function evaluate(input){
  if(input.unconscious) return {riskLevel:'emergency'};
  if(input.severeDehydration || (input.highFever && input.childUnderFive)) return {riskLevel:'urgent'};
  if(input.cluster==='breathing' || input.highFever) return {riskLevel:'refer'};
  return {riskLevel:'monitor'};
}

assert.equal(evaluate({cluster:'fever',childUnderFive:true,unconscious:false,severeDehydration:false,highFever:true}).riskLevel,'urgent');
console.log('triage.test.mjs passed');
