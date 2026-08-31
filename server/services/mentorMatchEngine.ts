import { MentorProfile, MentorMatchRecommendation } from '../../src/types/mentorship';
import { UserProfile, SubjectId, ConceptMastery } from '../../src/types';
import { MistakeRecord } from '../../src/types/auth';

export interface MatchEngineInput {
  learnerProfile: any;
  masteries?: ConceptMastery[];
  mistakes?: MistakeRecord[] | any[];
  allMentors: MentorProfile[];
  subjectFilter?: SubjectId;
}

export class MentorMatchEngine {
  /**
   * Computes modular multi-factor recommendations for a given learner.
   */
  static computeRecommendations(input: MatchEngineInput): MentorMatchRecommendation[] {
    const { learnerProfile, masteries = [], mistakes = [], allMentors, subjectFilter } = input;

    const learnerSubjects = learnerProfile.subjects || ['math', 'cs'];
    const targetExam = (learnerProfile.targetExam || '').toLowerCase();
    const learningGoals = (learnerProfile.learningGoals || []).map((g) => g.toLowerCase());

    // Extract weak concepts and recent mistake topics
    const weakConceptTitles = masteries
      .filter((m) => m.retentionStrength < 75 || m.isWeakArea)
      .map((m) => m.conceptId.toLowerCase());

    const mistakeTopics = mistakes
      .filter((m) => !m.resolved)
      .map((m) => (m.topicId || '').toLowerCase());

    const results: MentorMatchRecommendation[] = [];

    for (const mentor of allMentors) {
      if (subjectFilter && !mentor.subjects.includes(subjectFilter)) {
        continue;
      }

      // Check capacity
      if (!mentor.acceptingNewMentees || mentor.activeMenteesCount >= mentor.maxMentees) {
        continue;
      }

      let score = 30; // baseline for all verified mentors
      const reasons: string[] = [];

      // 1. Subject Alignment (+25 max)
      const sharedSubjects = mentor.subjects.filter((s) => learnerSubjects.includes(s));
      if (sharedSubjects.length > 0) {
        const subjectBoost = Math.min(25, sharedSubjects.length * 15);
        score += subjectBoost;
        const subjectNames = sharedSubjects
          .map((s) => (s === 'cs' ? 'Computer Science & AI' : s.charAt(0).toUpperCase() + s.slice(1)))
          .join(' & ');
        reasons.push(`Shared focus in ${subjectNames}`);
      }

      // 2. Target Exam / Track Alignment (+20 max)
      let matchingTrack = false;
      if (targetExam) {
        const hasTrackMatch = mentor.supportedTracks.some(
          (t) =>
            t.toLowerCase().includes(targetExam) ||
            targetExam.includes(t.toLowerCase()) ||
            (targetExam.includes('jee') && t.toLowerCase().includes('jee')) ||
            (targetExam.includes('ap') && t.toLowerCase().includes('ap')) ||
            (targetExam.includes('gre') && t.toLowerCase().includes('gre')) ||
            (targetExam.includes('stem') && t.toLowerCase().includes('stem'))
        );

        if (hasTrackMatch) {
          score += 20;
          matchingTrack = true;
          reasons.push(`Direct alignment with your target track: ${learnerProfile.targetExam}`);
        }
      }

      // 3. Diagnostic Weak Area / Goal Expertise Match (+15 max)
      let hasExpertiseMatch = false;
      const expertiseText = mentor.areasOfExpertise.join(' ').toLowerCase();

      for (const weak of [...weakConceptTitles, ...mistakeTopics]) {
        if (expertiseText.includes(weak) || (weak.includes('sn2') && expertiseText.includes('sn2')) || (weak.includes('calc') && expertiseText.includes('calculus'))) {
          score += 15;
          hasExpertiseMatch = true;
          reasons.push(`Specializes in diagnostic focus area: ${mentor.areasOfExpertise[0]}`);
          break;
        }
      }

      if (!hasExpertiseMatch && learningGoals.length > 0) {
        for (const goal of learningGoals) {
          if (mentor.areasOfExpertise.some((e) => goal.includes(e.toLowerCase()) || e.toLowerCase().includes(goal.slice(0, 10)))) {
            score += 10;
            reasons.push(`Aligns with your goal: "${learnerProfile.learningGoals[0]}"`);
            break;
          }
        }
      }

      // 4. Quality & Experience Signals (+10 max)
      if (mentor.rating >= 4.9) {
        score += 5;
      }
      if (mentor.sessionsCompleted >= 50) {
        score += 3;
      }
      if (mentor.responseRatePercent >= 95) {
        score += 2;
      }

      // Clamp score between 40 and 98 (no 100% "perfect match" claims)
      const finalScore = Math.min(98, Math.max(40, Math.round(score)));

      let availabilityAlignment = 'Flexible weekly sessions';
      if (mentor.availability.days.length > 0) {
        availabilityAlignment = `Available ${mentor.availability.days.slice(0, 3).join(', ')}`;
      }

      results.push({
        mentor,
        matchScore: finalScore,
        matchReasons: reasons.length > 0 ? reasons : ['Verified STEM domain educator with active availability'],
        sharedSubjects,
        matchingTargetTrack: matchingTrack,
        availabilityAlignment,
      });
    }

    // Sort by matchScore descending
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}
