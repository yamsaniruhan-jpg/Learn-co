// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { creatorPracticeTransferKey, readCreatorPracticeTransfer } from '../src/utils/creatorPracticeTransfer';

beforeEach(()=>localStorage.clear());
describe('creator practice transfer privacy',()=>{
  it('only reads the named account and preserves unowned legacy data',()=>{
    localStorage.setItem('learnco_creator_practice_session',JSON.stringify({resourceTitle:'Legacy',questions:[{id:'old'}]}));
    localStorage.setItem(creatorPracticeTransferKey('alice'),JSON.stringify({resourceTitle:'Alice private',questions:[{id:'a'}]}));
    localStorage.setItem(creatorPracticeTransferKey('bob'),JSON.stringify({resourceTitle:'Bob private',questions:[{id:'b'}]}));
    expect(readCreatorPracticeTransfer('alice')?.resourceTitle).toBe('Alice private');
    expect(readCreatorPracticeTransfer('bob')?.resourceTitle).toBe('Bob private');
    expect(readCreatorPracticeTransfer('other')).toBeNull();
    expect(readCreatorPracticeTransfer(null)).toBeNull();
    expect(localStorage.getItem('learnco_creator_practice_session')).toContain('Legacy');
  });
  it('tolerates corrupt or empty data',()=>{
    localStorage.setItem(creatorPracticeTransferKey('alice'),'{');expect(readCreatorPracticeTransfer('alice')).toBeNull();
    localStorage.setItem(creatorPracticeTransferKey('alice'),JSON.stringify({questions:[]}));expect(readCreatorPracticeTransfer('alice')).toBeNull();
  });
});
