import type { Domain } from '@/data/questions';

export const SY0701_OBJECTIVE_LABELS: Record<string, string> = {
  '1.1': 'Compare and contrast various types of security controls',
  '1.2': 'Summarize fundamental security concepts',
  '1.3': 'Explain the importance of change management processes and the impact to security',
  '1.4': 'Explain the importance of using appropriate cryptographic solutions',
  '2.1': 'Compare and contrast common threat actors and motivations',
  '2.2': 'Explain common threat vectors and attack surfaces',
  '2.3': 'Explain various types of vulnerabilities',
  '2.4': 'Given a scenario, analyze indicators of malicious activity',
  '2.5': 'Explain the purpose of mitigation techniques used to secure the enterprise',
  '3.1': 'Compare and contrast security implications of different architecture models',
  '3.2': 'Given a scenario, apply security principles to secure enterprise infrastructure',
  '3.3': 'Compare and contrast concepts and strategies to protect data',
  '3.4': 'Explain the importance of resilience and recovery in security architecture',
  '4.1': 'Given a scenario, apply common security techniques to computing resources',
  '4.2': 'Explain the security implications of proper hardware, software, and data asset management',
  '4.3': 'Explain various activities associated with vulnerability management',
  '4.4': 'Explain security alerting and monitoring concepts and tools',
  '4.5': 'Given a scenario, modify enterprise capabilities to enhance security',
  '4.6': 'Given a scenario, implement and maintain identity and access management',
  '4.7': 'Explain the importance of automation and orchestration related to secure operations',
  '4.8': 'Explain appropriate incident response activities',
  '4.9': 'Given a scenario, use data sources to support an investigation',
  '5.1': 'Summarize elements of effective security governance',
  '5.2': 'Explain elements of the risk management process',
  '5.3': 'Explain processes associated with third-party risk assessment and management',
  '5.4': 'Summarize elements of effective security compliance',
  '5.5': 'Explain types and purposes of audits and assessments',
  '5.6': 'Given a scenario, implement security awareness practices',
};

export const SY0701_DOMAIN_SHORT: Record<Domain, string> = {
  D1: 'General Security Concepts',
  D2: 'Threats, Vulnerabilities & Mitigations',
  D3: 'Security Architecture',
  D4: 'Security Operations',
  D5: 'Security Program Management & Oversight',
};

export function objectiveLabel(objective?: string) {
  if (!objective) return 'Objective not tagged';
  return SY0701_OBJECTIVE_LABELS[objective] || 'SY0-701 objective';
}
