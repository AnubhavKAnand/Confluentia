// simple template-based BPMN generator producing basic process with start -> tasks -> end
export function generateBpmnXml(processName, steps) {
  const idBase = sanitizeId(processName || 'proc');
  const nodes = [];
  const flows = [];
  let prev = 'start';
  nodes.push(`<startEvent id="start" name="Start"/>`);
  for (let i = 0; i < steps.length; i++) {
    const tid = `task_${i}`;
    const label = escapeXml(steps[i] || `Task ${i+1}`);
    nodes.push(`<task id="${tid}" name="${label}"/>`);
    flows.push(`<sequenceFlow id="flow_${i}" sourceRef="${prev}" targetRef="${tid}"/>`);
    prev = tid;
  }
  nodes.push(`<endEvent id="end" name="End"/>`);
  flows.push(`<sequenceFlow id="flow_end" sourceRef="${prev}" targetRef="end"/>`);

  const bpmn =
`<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
  id="${idBase}_definitions" targetNamespace="http://example.com/bpmn">
  <bpmn2:process id="${idBase}_process" isExecutable="false" name="${escapeXml(processName)}">
    ${nodes.join('\n    ')}
    ${flows.join('\n    ')}
  </bpmn2:process>
  <!-- Note: This minimal BPMN has no diagram shapes (viewer will auto-layout) -->
</bpmn2:definitions>`;
  return bpmn;
}

function sanitizeId(s) { return (s||'p').replace(/[^\w]/g,'_').slice(0,50); }
function escapeXml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
