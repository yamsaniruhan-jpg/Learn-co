import type { QuestionBankItem } from '../types/curriculum';

export interface CreatorPracticeTransfer {
  resourceId: string;
  resourceTitle: string;
  questions: QuestionBankItem[];
  subjectId?: string;
  timestamp: number;
}

// The legacy unscoped key is intentionally neither read nor deleted: its
// ownership is unknown on a shared browser.
export function creatorPracticeTransferKey(accountId: string): string {
  return `learnco_creator_practice_v2:account:${encodeURIComponent(accountId)}`;
}
export function readCreatorPracticeTransfer(accountId: string | null): CreatorPracticeTransfer | null {
  if (!accountId) return null;
  try {
    const data = JSON.parse(localStorage.getItem(creatorPracticeTransferKey(accountId)) || 'null');
    return data && Array.isArray(data.questions) && data.questions.length > 0 ? data : null;
  } catch { return null; }
}
