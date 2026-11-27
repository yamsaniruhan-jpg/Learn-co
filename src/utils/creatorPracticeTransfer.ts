import type { QuestionBankItem } from '../types/curriculum';

export interface CreatorPracticeTransfer {
  resourceId: string;
  resourceTitle: string;
  questions: QuestionBankItem[];
  subjectId?: string;
  timestamp: number;
}

const GUEST_PRACTICE_TRANSFER_KEY = 'learnco_guest_creator_practice_ephemeral_v1';

// The legacy unscoped key is intentionally neither read nor deleted: its
// ownership is unknown on a shared browser.
export function creatorPracticeTransferKey(accountId: string): string {
  return `learnco_creator_practice_v2:account:${encodeURIComponent(accountId)}`;
}

export function writeGuestCreatorPracticeTransfer(payload: CreatorPracticeTransfer): void {
  try {
    sessionStorage.setItem(GUEST_PRACTICE_TRANSFER_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage lock
  }
}

export function clearGuestCreatorPracticeTransfer(): void {
  try {
    sessionStorage.removeItem(GUEST_PRACTICE_TRANSFER_KEY);
  } catch {
    // Ignore
  }
}

export function readCreatorPracticeTransfer(accountId: string | null): CreatorPracticeTransfer | null {
  if (!accountId) {
    try {
      const guestData = JSON.parse(sessionStorage.getItem(GUEST_PRACTICE_TRANSFER_KEY) || 'null');
      return guestData && Array.isArray(guestData.questions) && guestData.questions.length > 0
        ? guestData
        : null;
    } catch {
      return null;
    }
  }
  try {
    const data = JSON.parse(localStorage.getItem(creatorPracticeTransferKey(accountId)) || 'null');
    return data && Array.isArray(data.questions) && data.questions.length > 0 ? data : null;
  } catch { return null; }
}
