import { describe, it, expect } from 'vitest';
import { isMCQCorrect, calculateScore, getPBQCredit } from '@/lib/examEngine';
import { buildExam, shuffleOptions, type MCQuestion, type PBQuestion, type PBQTerminal, type PBQPacketAnalysis, type PBQTopology } from '@/data/questions';
import { advancedPBQs } from '@/data/advancedQuestions';

const single: MCQuestion = {
  id: 'm1', domain: 'D1', type: 'single', difficulty: 1,
  question: 'q', options: ['a','b','c','d'], answer: 2, explanation: '',
};
const multi: MCQuestion = {
  id: 'm2', domain: 'D2', type: 'select-two', difficulty: 1,
  question: 'q', options: ['a','b','c','d'], answer: [0, 3], explanation: '',
};

const firewall: PBQuestion = {
  id: 'p1',
  domain: 'D4',
  difficulty: 2,
  type: 'firewall',
  title: 'Firewall rules',
  scenario: 'Apply the correct action to each rule.',
  rules: [
    { ruleId: 1, sourceIP: '10.0.0.1', destIP: '10.0.0.2', port: '443', protocol: 'TCP', action: '' },
    { ruleId: 2, sourceIP: '10.0.0.3', destIP: '10.0.0.4', port: '22', protocol: 'TCP', action: '' },
  ],
  correctActions: ['ALLOW', 'DENY'],
  explanation: 'One rule should be allowed and one denied.',
};

describe('examEngine', () => {
  it('scores single correctly', () => {
    expect(isMCQCorrect(single, 2)).toBe(true);
    expect(isMCQCorrect(single, 1)).toBe(false);
    expect(isMCQCorrect(single, undefined)).toBe(false);
  });

  it('scores select-two regardless of order', () => {
    expect(isMCQCorrect(multi, [3, 0])).toBe(true);
    expect(isMCQCorrect(multi, [0, 1])).toBe(false);
  });

  it('calculates equal-weight PBQ practice partial credit', () => {
    expect(getPBQCredit(firewall, ['ALLOW', 'ALLOW'])).toEqual({ earned: 1, total: 2, ratio: 0.5 });
    expect(getPBQCredit(firewall, ['ALLOW', 'DENY'])).toEqual({ earned: 2, total: 2, ratio: 1 });
  });

  it('scores terminal, packet-analysis and topology PBQs', () => {
    const terminal = advancedPBQs.find(q => q.type === 'terminal') as PBQTerminal;
    const packet = advancedPBQs.find(q => q.type === 'packet-analysis') as PBQPacketAnalysis;
    const topology = advancedPBQs.find(q => q.type === 'topology') as PBQTopology;

    const terminalAnswers = terminal.tasks.map(task => task.correctIndex);
    expect(getPBQCredit(terminal, terminalAnswers).ratio).toBe(1);

    expect(getPBQCredit(packet, {
      packetIds: [...packet.suspiciousPacketIds],
      attackType: packet.correctAttackType,
      response: packet.correctResponse,
    }).ratio).toBe(1);

    expect(getPBQCredit(packet, {
      packetIds: [packet.suspiciousPacketIds[0]],
      attackType: packet.correctAttackType,
      response: packet.correctResponse,
    }).ratio).toBeCloseTo(2 / 3);

    const topologyAnswers = Object.fromEntries(topology.nodes.map(node => [node.id, node.correctZone]));
    expect(getPBQCredit(topology, topologyAnswers).ratio).toBe(1);
  });


  it('keeps distractor rationale attached when options are shuffled', () => {
    const source: MCQuestion = {
      id: 'shuffle-rationale',
      domain: 'D2',
      type: 'single',
      difficulty: 3,
      question: 'Scenario question',
      options: ['alpha', 'bravo', 'charlie', 'delta'],
      answer: 1,
      explanation: 'Bravo is correct.',
      whyWrong: {
        0: 'alpha rationale',
        2: 'charlie rationale',
        3: 'delta rationale',
      },
    };

    const shuffled = shuffleOptions(source);
    shuffled.options.forEach((option, newIndex) => {
      const oldIndex = source.options.indexOf(option);
      expect(shuffled.whyWrong?.[newIndex]).toBe(source.whyWrong?.[oldIndex]);
    });
    expect(shuffled.options[shuffled.answer as number]).toBe('bravo');
  });

  it('builds five strict 90-item forms with weighted domains and variable PBQs', () => {
    const expected = { D1: 11, D2: 20, D3: 16, D4: 25, D5: 18 };

    ([1, 2, 3, 4, 5] as const).forEach(form => {
      const exam = buildExam(form);
      expect(exam.totalQuestions).toBe(90);
      expect(exam.pbqs.length).toBeGreaterThanOrEqual(4);
      expect(exam.pbqs.length).toBeLessThanOrEqual(6);

      const all = [...exam.pbqs, ...exam.mcqs];
      expect(new Set(all.map(q => q.id)).size).toBe(90);

      const domains = all.reduce<Record<string, number>>((acc, q) => {
        acc[q.domain] = (acc[q.domain] || 0) + 1;
        return acc;
      }, {});
      expect(domains).toEqual(expected);

      const applied = exam.mcqs.filter(q => q.difficulty >= 2 || Boolean(q.evidence?.length)).length;
      expect(applied / exam.mcqs.length).toBeGreaterThanOrEqual(0.7);
    });
  });

  it('calculates scaled score on 100-900 scale', () => {
    const r = calculateScore(
      [] as PBQuestion[],
      [single, multi],
      {},
      { m1: 2, m2: [0, 3] },
      Date.now(),
    );
    expect(r.rawCorrect).toBe(2);
    expect(r.rawTotal).toBe(2);
    expect(r.scaledScore).toBe(900);
    expect(r.passed).toBe(true);
  });

  it('fails when below scaled 750', () => {
    const r = calculateScore([] as PBQuestion[], [single, multi], {}, { m1: 2 }, Date.now());
    expect(r.scaledScore).toBeLessThan(750);
    expect(r.passed).toBe(false);
  });
});
