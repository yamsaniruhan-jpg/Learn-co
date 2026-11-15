// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { ConfidenceSummary, summarizeConfidence } from '../src/components/practice/ConfidenceSummary';

describe('confidence check-in', () => {
  it('counts only explicitly bank-checked attempts with recorded confidence', () => {
    const data: any[] = [
      {confidence:'confident',verification:'bank',isCorrect:true},
      {confidence:'confident',verification:'bank',isCorrect:false},
      {confidence:'unsure',verification:'bank',isCorrect:true},
      {confidence:'confident',verification:'provisional',isCorrect:true},
      {confidence:'somewhat',verification:'unverified',isCorrect:true},
      {confidence:'somewhat',isCorrect:true},
      {verification:'bank',isCorrect:true},
      {confidence:'confident',verification:'bank',isCorrect:'true'},
    ];
    const result=summarizeConfidence(data);
    expect(result.rows).toEqual([
      {level:'unsure',label:'Unsure',total:1,correct:1},
      {level:'somewhat',label:'Somewhat sure',total:0,correct:0},
      {level:'confident',label:'Confident',total:2,correct:1},
    ]);
    expect(result.excluded).toBe(4);
  });
  it('shows the limitations and empty state accessibly', async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
    const el=document.createElement('div');document.body.appendChild(el);const root=createRoot(el);
    await act(async()=>root.render(<ConfidenceSummary attempts={[]} />));
    expect(el.querySelector('section')?.getAttribute('aria-labelledby')).toBe('confidence-title');
    expect(el.textContent).toContain('No bank-checked attempts');
    expect(el.textContent).toContain('not a measure of mastery');
    await act(async()=>root.unmount());el.remove();
  });
});
