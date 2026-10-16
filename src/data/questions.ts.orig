/**
 * CompTIA Security+ SY0-701 Master Question Bank
 * 300+ questions: 200 MCQ single, 50 select-two, 50+ PBQ scenarios
 * Tagged by official SY0-701 domains:
 *   D1: General Security Concepts (12%)
 *   D2: Threats, Vulnerabilities and Mitigations (22%)
 *   D3: Security Architecture (18%)
 *   D4: Security Operations (28%)
 *   D5: Security Program Management and Oversight (20%)
 */

export type Domain = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

export const DOMAIN_LABELS: Record<Domain, string> = {
  D1: '1.0 General Security Concepts',
  D2: '2.0 Threats, Vulnerabilities & Mitigations',
  D3: '3.0 Security Architecture',
  D4: '4.0 Security Operations',
  D5: '5.0 Security Program Management & Oversight',
};

export const DOMAIN_WEIGHTS: Record<Domain, number> = {
  D1: 0.12, D2: 0.22, D3: 0.18, D4: 0.28, D5: 0.20,
};

export interface MCQuestion {
  id: string;
  domain: Domain;
  type: 'single' | 'select-two';
  difficulty: 1 | 2 | 3;
  question: string;
  options: string[];
  answer: number | number[];
  explanation: string;
  whyWrong?: Record<number, string>;
  objective?: string;
  reference?: string;
}

/* =================================================================
   PBQ TYPES
   ================================================================= */

export interface FirewallRule {
  ruleId: number;
  sourceIP: string;
  destIP: string;
  port: string;
  protocol: string;
  action: string; // user fills this
}

export interface PBQFirewall {
  id: string; domain: Domain; difficulty: 1|2|3; type: 'firewall';
  title: string; scenario: string;
  rules: FirewallRule[];
  correctActions: string[];
  explanation: string;
  objective?: string;
}

export interface PBQOrdering {
  id: string; domain: Domain; difficulty: 1|2|3; type: 'ordering';
  title: string; scenario: string;
  steps: { label: string; correctPosition: number }[];
  explanation: string;
  objective?: string;
}

export interface LogEntry {
  line: string;
  type?: 'info' | 'warning' | 'error';
}

export interface PBQLogAnalysis {
  id: string; domain: Domain; difficulty: 1|2|3; type: 'log-analysis';
  title: string; scenario: string;
  logEntries: LogEntry[];
  attackTypeOptions: string[];
  correctAttackType: string;
  sourceIPOptions: string[];
  correctSourceIP: string;
  responseOptions: string[];
  correctResponse: number;
  explanation: string;
  objective?: string;
}

export interface PBQMatching {
  id: string; domain: Domain; difficulty: 1|2|3; type: 'matching';
  title: string; scenario: string;
  items: { left: string; correctRight: string }[];
  rightOptions: string[];
  explanation: string;
  objective?: string;
}

export interface PBQPlacement {
  id: string; domain: Domain; difficulty: 1|2|3; type: 'placement';
  title: string; scenario: string;
  zones: string[];
  items: { label: string; correctZone: string }[];
  explanation: string;
  objective?: string;
}

export type PBQuestion = PBQFirewall | PBQOrdering | PBQLogAnalysis | PBQMatching | PBQPlacement;

/* =================================================================
   MCQ BANK — 200 Single-Answer Questions
   ================================================================= */

export const mcqSingle: MCQuestion[] = [
  // ── DOMAIN 1: General Security Concepts ──
  { id:'s1', domain:'D1', type:'single', difficulty:1, question:'Which element of the CIA triad ensures data has not been tampered with?', options:['Confidentiality','Integrity','Availability','Non-repudiation'], answer:1, explanation:'Integrity ensures data has not been altered during storage or transmission.', objective:'1.2' },
  { id:'s2', domain:'D1', type:'single', difficulty:1, question:'Using git is most frequently associated with which change management process?', options:['Backout plan','Stakeholder analysis','Version control','Standard operating procedures'], answer:2, explanation:'Git is the most widely used version control system for tracking code changes.', objective:'1.3' },
  { id:'s3', domain:'D1', type:'single', difficulty:2, question:'Sally wants a procedure for what to do if a change fails. What should she create?', options:['Impact analysis','Backout plan','Regression test','Maintenance window'], answer:1, explanation:'A backout plan documents steps to reverse a change if it fails.', objective:'1.3' },
  { id:'s4', domain:'D1', type:'single', difficulty:1, question:'Log monitoring is an example of what control category?', options:['Technical','Managerial','Operational','Physical'], answer:0, explanation:'Log monitoring is implemented using automated systems, making it a technical control.', objective:'1.1' },
  { id:'s5', domain:'D1', type:'single', difficulty:2, question:'Ben deployed a DLP tool that flags data before emails are sent. What control type?', options:['Managerial','Detective','Corrective','Preventive'], answer:3, explanation:'DLP that blocks or flags emails before sending is a preventive control.', objective:'1.1' },
  { id:'s6', domain:'D1', type:'single', difficulty:2, question:'Charles wants to reduce scope of compromised credentials. Which control is best?', options:['Single sign-on','Federation','Zero trust','Multifactor authentication'], answer:2, explanation:'Zero trust reduces scope by requiring continuous verification regardless of location.', objective:'1.2' },
  { id:'s7', domain:'D1', type:'single', difficulty:2, question:'Carol wants to obfuscate database data while maintaining referential integrity. What technique?', options:['Tokenization','Encryption','Data masking','Data randomization'], answer:0, explanation:'Tokenization replaces sensitive data with non-sensitive tokens maintaining referential integrity.', objective:'1.4' },
  { id:'s8', domain:'D1', type:'single', difficulty:1, question:'Which principle requires that no single person can complete a critical task alone?', options:['Least privilege','Separation of duties','Need to know','Job rotation'], answer:1, explanation:'Separation of duties prevents fraud by requiring multiple people for critical tasks.', objective:'1.2' },
  { id:'s9', domain:'D1', type:'single', difficulty:2, question:'Jacob wants to make weak passwords harder to crack by slowing down testing. What technique?', options:['Master keying','Key stretching','Key rotation','Passphrase armoring'], answer:1, explanation:'Key stretching (PBKDF2, bcrypt) makes brute-force slower by applying computationally intensive functions.', objective:'1.4' },
  { id:'s10', domain:'D1', type:'single', difficulty:2, question:"A logistics firm is choosing a ledger for tamper-evident shipment records that all partners can read but none can quietly alter. Which two properties make blockchain the BEST fit for this scenario?", options:['Immutable and nontransferable','Shared and modifiable by majority vote','Unique to each participant','Shared and immutable'], answer:3, explanation:'A shared, immutable ledger lets every partner read the same history while preventing silent edits.', whyWrong:{0:'Nontransferable would block partners from receiving records.',1:'Vote-based mutability defeats the tamper-evidence requirement.',2:'Unique-per-participant breaks the shared-truth requirement.'}, objective:'1.4' },
  { id:'s11', domain:'D1', type:'single', difficulty:2, question:'What hardware component generates, stores, and manages cryptographic keys?', options:['CPU','NSA','TPM','CCA'], answer:2, explanation:'A Trusted Platform Module (TPM) is dedicated hardware for key management and crypto operations.', objective:'1.4' },
  { id:'s12', domain:'D1', type:'single', difficulty:1, question:'Defense in depth is BEST described as:', options:['Using the strongest single control','Layering multiple security controls','Focusing on perimeter security','Security through obscurity'], answer:1, explanation:'Defense in depth layers multiple controls so if one fails, others still protect.', objective:'1.2' },
  { id:'s13', domain:'D1', type:'single', difficulty:2, question:'What security model assumes breach and verifies every access request regardless of location?', options:['Defense in depth','Zero trust','Implicit trust','Need to know'], answer:1, explanation:'Zero trust assumes breach and requires verification for every access request.', objective:'1.2' },
  { id:'s14', domain:'D1', type:'single', difficulty:2, question:'What does configuration management help prevent?', options:['Physical theft','Configuration drift and unauthorized changes','Social engineering','Natural disasters'], answer:1, explanation:'Configuration management maintains consistent settings and prevents unauthorized changes.', objective:'1.3' },
  { id:'s15', domain:'D1', type:'single', difficulty:3, question:'What key is used to decrypt information in public key encryption?', options:["Recipient's private key","Recipient's public key","Sender's private key","Sender's public key"], answer:0, explanation:"The recipient's private key decrypts data encrypted with the recipient's public key.", objective:'1.4' },
  { id:'s16', domain:'D1', type:'single', difficulty:2, question:'What type of control is a policy or procedure?', options:['Directive','Corrective','Detective','Preventive'], answer:0, explanation:'Policies and procedures are directive controls — they guide behavior through rules.', objective:'1.1' },
  { id:'s17', domain:'D1', type:'single', difficulty:2, question:'A vulnerability scan shows a device has a vulnerability but the vendor is out of business. Alice places a firewall in front of it. What control type?', options:['Directive','Compensating','Detective','Procedural'], answer:1, explanation:'A compensating control is an alternative measure when the primary control cannot be implemented.', objective:'1.1' },
  { id:'s18', domain:'D1', type:'single', difficulty:1, question:'An encryption method where all participants have the same key is which type?', options:['Shared hashing','Asymmetric encryption','Symmetric encryption','Universal encryption'], answer:2, explanation:'Symmetric encryption uses the same key for both encryption and decryption.', objective:'1.4' },
  { id:'s19', domain:'D1', type:'single', difficulty:2, question:'Which obfuscation technique hides data within an image file?', options:['Steganography','Image hashing','PNG warping','Image blocking'], answer:0, explanation:'Steganography hides data within other files like images without visible changes.', objective:'1.4' },
  { id:'s20', domain:'D1', type:'single', difficulty:2, question:"After a wave of vishing calls tricked help-desk staff into resetting executive passwords, leadership wants the MOST effective long-term mitigation. Which control should the CISO prioritize?", options:['Add another perimeter firewall','Targeted security awareness training with simulated calls','Roll out a corporate VPN','Increase password length to 16 characters'], answer:1, explanation:'Recurring, scenario-driven awareness training is the only control that directly hardens the human decision attackers exploited.', whyWrong:{0:'Firewalls do not see voice/social interactions.',2:'A VPN protects transit, not the help-desk decision being abused.',3:'Longer passwords do not stop a staffer who voluntarily resets one.'}, objective:'5.6' },

  // ── DOMAIN 2: Threats, Vulnerabilities and Mitigations ──
  { id:'s21', domain:'D2', type:'single', difficulty:1, question:'What type of attack involves an attacker inserting themselves between two communicating parties?', options:['Phishing','On-path (Man-in-the-Middle)','SQL Injection','Cross-Site Scripting'], answer:1, explanation:'An on-path attack positions the attacker between two parties to intercept communications.', objective:'2.4' },
  { id:'s22', domain:'D2', type:'single', difficulty:1, question:'Which threat actor is MOST likely motivated by direct financial gain?', options:['Organized crime','Hacktivist','Nation state','Shadow IT'], answer:0, explanation:'Organized crime groups are primarily motivated by financial gain through ransomware, fraud, etc.', objective:'2.1' },
  { id:'s23', domain:'D2', type:'single', difficulty:2, question:'An attacker calls help desk pretending to be a director. What type of attack?', options:['Social engineering','Supply chain','Watering hole','On-path'], answer:0, explanation:'Social engineering manipulates people into performing actions or divulging information.', objective:'2.2' },
  { id:'s24', domain:'D2', type:'single', difficulty:1, question:'Which malware type operates entirely in memory without writing to disk?', options:['Ransomware','Fileless malware','Logic bomb','Adware'], answer:1, explanation:'Fileless malware operates in memory using legitimate tools, making it harder to detect.', objective:'2.4' },
  { id:'s25', domain:'D2', type:'single', difficulty:2, question:'445+ failed password attempts for root from one IP. What describes this?', options:['Password spraying','Downgrade attack','Brute force','DDoS'], answer:2, explanation:'Brute force attacks systematically try many passwords against a single account.', objective:'2.4' },
  { id:'s26', domain:'D2', type:'single', difficulty:1, question:'A remote user receives a text message with a link to login. What attack?', options:['Brute force','Watering hole','Typosquatting','Smishing'], answer:3, explanation:'Smishing is phishing via SMS text messages with malicious links.', objective:'2.2' },
  { id:'s27', domain:'D2', type:'single', difficulty:2, question:'A user typed USER77\' OR \'1\'=\'1 in a search field. What attack?', options:['Cross-site scripting','Buffer overflow','SQL injection','SSL stripping'], answer:2, explanation:"The ' OR '1'='1 syntax is a classic SQL injection attack attempting to bypass authentication.", objective:'2.4' },
  { id:'s28', domain:'D2', type:'single', difficulty:2, question:'Which attack targets the software supply chain to compromise end users?', options:['Watering hole','Supply chain attack','Phishing','Brute force'], answer:1, explanation:'Supply chain attacks compromise software during development or distribution.', objective:'2.2' },
  { id:'s29', domain:'D2', type:'single', difficulty:2, question:'What technique do "living off the land" attacks use?', options:['Custom malware binaries','Legitimate system tools (PowerShell, WMI)','Physical access','Zero-day exploits only'], answer:1, explanation:'Living off the land attacks use built-in OS tools to avoid antimalware detection.', objective:'2.4' },
  { id:'s30', domain:'D2', type:'single', difficulty:2, question:"A SaaS provider sees thousands of successful logins from new IPs using valid email/password pairs leaked in an unrelated breach. Which attack BEST describes this activity?", options:['Brute force','Credential stuffing','Password spraying','Pass-the-hash'], answer:1, explanation:'Reusing known-good credential pairs from another breach against a different service is the textbook definition of credential stuffing.', whyWrong:{0:'Brute force tries every combination, not known-good pairs.',2:'Spraying tries one common password across many accounts.',3:'Pass-the-hash uses captured hashes, not plaintext pairs.'}, objective:'2.4' },
  { id:'s31', domain:'D2', type:'single', difficulty:2, question:'An API call sends more data than expected, allowing code execution. What attack?', options:['Buffer overflow','Replay attack','Cross-site scripting','DDoS'], answer:0, explanation:'Buffer overflow occurs when input exceeds allocated memory, potentially allowing code execution.', objective:'2.4' },
  { id:'s32', domain:'D2', type:'single', difficulty:1, question:'Which is the MOST effective defense against injection attacks?', options:['Input validation and parameterized queries','SSL/TLS encryption','Rate limiting','Session timeouts'], answer:0, explanation:'Input validation and parameterized queries prevent malicious input from being executed as code.', objective:'2.5' },
  { id:'s33', domain:'D2', type:'single', difficulty:2, question:'Users are directed to a different IP than the bank\'s server. Which attack?', options:['Deauthentication','DDoS','Buffer overflow','DNS poisoning'], answer:3, explanation:'DNS poisoning modifies DNS records to redirect users to a malicious IP address.', objective:'2.4' },
  { id:'s34', domain:'D2', type:'single', difficulty:2, question:'A user connects to a website and sees NET::ERR_CERT_INVALID. Most likely attack?', options:['Brute force','DoS','On-path','Deauthentication'], answer:2, explanation:'Certificate errors often indicate an on-path attack intercepting and replacing the certificate.', objective:'2.4' },
  { id:'s35', domain:'D2', type:'single', difficulty:3, question:'An attacker discovers a way to disable a server by sending crafted packets from many remote devices. What attack?', options:['Privilege escalation','SQL injection','Replay attack','DDoS'], answer:3, explanation:'DDoS uses multiple remote devices to overwhelm a server with traffic.', objective:'2.4' },
  { id:'s36', domain:'D2', type:'single', difficulty:2, question:'Which characteristic best describes an Advanced Persistent Threat (APT)?', options:['Automated scanning tools','Long-term, targeted, well-funded attacks','Opportunistic script kiddie attacks','DoS campaigns'], answer:1, explanation:'APTs are sophisticated, long-term, targeted attacks typically backed by nation states.', objective:'2.1' },
  { id:'s37', domain:'D2', type:'single', difficulty:2, question:'A network team installed new APs. Within 24 hours the wireless network was attacked. Most likely reason?', options:['Race condition','Jailbreaking','Impersonation','Misconfiguration'], answer:3, explanation:'Rapid compromise after deployment usually indicates misconfiguration of security settings.', objective:'2.3' },
  { id:'s38', domain:'D2', type:'single', difficulty:3, question:'An organization identified a significant vulnerability in an Internet-facing firewall. The vendor says it is end-of-life. What describes this?', options:['End-of-life','Improper input handling','Insufficient logging','Default credentials'], answer:0, explanation:'End-of-life means the vendor no longer provides patches or support.', objective:'2.3' },
  { id:'s39', domain:'D2', type:'single', difficulty:2, question:'Which testing method reviews source code without executing the program?', options:['Dynamic analysis','Fuzzing','Static analysis','Penetration testing'], answer:2, explanation:'Static analysis (SAST) reviews source code without executing it to find vulnerabilities.', objective:'2.5' },
  { id:'s40', domain:'D2', type:'single', difficulty:2, question:'Which OWASP Top 10 category includes SQL injection and XSS?', options:['Broken access control','Injection','Security misconfiguration','Cryptographic failures'], answer:1, explanation:'Injection vulnerabilities (SQLi, XSS) are a major OWASP Top 10 category.', objective:'2.4' },
  { id:'s41', domain:'D2', type:'single', difficulty:1, question:'A security admin copied suspected malware and runs it in a sandbox. Which IR process?', options:['Eradication','Preparation','Recovery','Containment'], answer:3, explanation:'Running malware in a sandbox for analysis is part of the containment phase.', objective:'2.5' },
  { id:'s42', domain:'D2', type:'single', difficulty:3, question:"A government agency is planning a 10-year data retention policy and is worried about \"harvest now, decrypt later\" attacks. Which threat should drive their move to post-quantum algorithms?", options:['Slower SHA-2 hashing on quantum hardware','Quantum computers breaking RSA and ECC via Shor\'s algorithm','Quantum systems eliminating the need for encryption','Quantum hardware making AES brute force trivial'], answer:1, explanation:'Shor\'s algorithm threatens today\'s asymmetric primitives, exposing data encrypted now once large quantum systems exist.', whyWrong:{0:'Hash speed is not the strategic risk.',2:'Encryption need does not disappear under quantum.',3:'Symmetric ciphers like AES need only key-size doubling, not replacement.'}, objective:'2.2' },

  // ── DOMAIN 3: Security Architecture ──
  { id:'s43', domain:'D3', type:'single', difficulty:2, question:"A SOC manager wants a deception system in the DMZ that records attacker tools and TTPs without exposing real assets. Which deployment BEST meets this goal?", options:['A reverse proxy load balancer','A high-interaction honeypot','A WAF in detection mode','A SIEM correlation rule'], answer:1, explanation:'A high-interaction honeypot is purpose-built to lure and instrument attacker behavior in isolation from production.', whyWrong:{0:'Load balancers distribute traffic, not collect TTPs.',2:'A WAF protects an app but does not act as a decoy.',3:'A SIEM rule alerts on existing telemetry; it is not a decoy.'}, objective:'3.1' },
  { id:'s44', domain:'D3', type:'single', difficulty:2, question:'An ambulance dispatch network should prioritize which attribute?', options:['Integration costs','Patch availability','System availability','Power usage'], answer:2, explanation:'For emergency services, system availability is the highest priority.', objective:'3.4' },
  { id:'s45', domain:'D3', type:'single', difficulty:1, question:'What facilitates examining credentials of each person entering a data center?', options:['Access control vestibule','Video surveillance','Pressure sensors','Bollards'], answer:0, explanation:'An access control vestibule forces individuals to authenticate before proceeding.', objective:'3.1' },
  { id:'s46', domain:'D3', type:'single', difficulty:2, question:'Alaina is concerned about vehicles hitting her backup generator. What to install?', options:['Speed bump','Access control vestibule','Bollards','Chain-link fence'], answer:2, explanation:'Bollards are sturdy vertical posts designed to prevent vehicle access.', objective:'3.1' },
  { id:'s47', domain:'D3', type:'single', difficulty:1, question:'Which security concept ensures a user has only the minimum permissions needed?', options:['Separation of duties','Least privilege','Defense in depth','Zero trust'], answer:1, explanation:'Least privilege limits access rights to the bare minimum for the job function.', objective:'3.1' },
  { id:'s48', domain:'D3', type:'single', difficulty:2, question:'A load balancer can provide which security benefit?', options:['Encryption at rest','DDoS mitigation through traffic distribution','Antivirus scanning','Certificate revocation'], answer:1, explanation:'Load balancers distribute traffic across servers, helping mitigate DDoS attacks.', objective:'3.1' },
  { id:'s49', domain:'D3', type:'single', difficulty:2, question:'What type of network isolation completely disconnects a system from all other networks?', options:['DMZ','VLAN','Air gap','VPN'], answer:2, explanation:'An air gap physically isolates a system from all other networks including the internet.', objective:'3.1' },
  { id:'s50', domain:'D3', type:'single', difficulty:2, question:'What does Secure Boot prevent?', options:['Network attacks','Unauthorized OS and bootloader modifications','SQL injection','Physical tampering'], answer:1, explanation:'Secure Boot verifies digital signatures of bootloader and OS to prevent tampering.', objective:'3.2' },
  { id:'s51', domain:'D3', type:'single', difficulty:2, question:'What hardware technology provides an isolated execution environment for sensitive operations?', options:['GPU','Secure enclave / TPM','RAID controller','NIC'], answer:1, explanation:'Secure enclaves and TPMs provide hardware-isolated environments for crypto operations.', objective:'3.2' },
  { id:'s52', domain:'D3', type:'single', difficulty:2, question:"An engineer needs to keep finance and guest Wi-Fi traffic on the same physical switches but in separate broadcast domains with no inter-domain traffic by default. Which control BEST achieves this?", options:['Apply 802.1X port authentication','Configure separate VLANs with no inter-VLAN routing','Enable WPA3-Enterprise on the SSID','Add a host-based firewall on each laptop'], answer:1, explanation:'VLANs logically split a switched network into isolated broadcast domains without new cabling.', whyWrong:{0:'802.1X authenticates devices but does not segment traffic.',2:'WPA3 secures wireless transport, not LAN segmentation.',3:'Host firewalls do not change broadcast-domain boundaries.'}, objective:'3.2' },
  { id:'s53', domain:'D3', type:'single', difficulty:2, question:'In an IaaS shared responsibility model, who is responsible for OS patching?', options:['Cloud provider','Customer','Both equally','Neither'], answer:1, explanation:'In IaaS, the customer is responsible for OS patching on their virtual machines.', objective:'3.1' },
  { id:'s54', domain:'D3', type:'single', difficulty:3, question:"A dev team is moving microservices to Kubernetes and asks security to flag the MOST container-specific risk to address first. Which should top the list?", options:['Cable-management hygiene in the rack','Vulnerable base images and container-escape exploits','UPS battery runtime','Generator fuel reserves'], answer:1, explanation:'Compromised base images and kernel-level escapes are the dominant attack surface unique to containerized workloads.', whyWrong:{0:'Cabling is irrelevant to container security.',2:'Battery runtime is a physical/availability concern, not container-specific.',3:'Fuel reserves do not affect container isolation.'}, objective:'3.1' },
  { id:'s55', domain:'D3', type:'single', difficulty:2, question:'In a serverless computing model, what is the customer responsible for securing?', options:['Physical servers','OS patches','Application code and data','Network infrastructure'], answer:2, explanation:'In serverless (FaaS), the customer only manages application code and data.', objective:'3.1' },
  { id:'s56', domain:'D3', type:'single', difficulty:3, question:'Which technique divides a network into smaller segments to limit lateral movement?', options:['Network segmentation','Port mirroring','Load balancing','QoS'], answer:0, explanation:'Network segmentation limits lateral movement by isolating network segments.', objective:'3.2' },
  { id:'s57', domain:'D3', type:'single', difficulty:2, question:'A company stores some employee info encrypted, other public details as plaintext. What encryption strategy?', options:['Full-disk','Record','Asymmetric','Key escrow'], answer:1, explanation:'Record-level encryption encrypts specific records while leaving others in plaintext.', objective:'3.3' },
  { id:'s58', domain:'D3', type:'single', difficulty:2, question:'A company wants to minimize database corruption during power loss. Best strategy?', options:['Encryption','Off-site backups','Journaling','Replication'], answer:2, explanation:'Journaling maintains a log of changes that can be replayed to recover from unexpected shutdowns.', objective:'3.4' },
  { id:'s59', domain:'D3', type:'single', difficulty:1, question:'Lisa wants to protect data on a locked/powered-off stolen device. What encryption?', options:['Volume-level','Full-disk encryption','File-level','Partition-level'], answer:1, explanation:'Full-disk encryption protects all data when the device is off or locked.', objective:'3.3' },
  { id:'s60', domain:'D3', type:'single', difficulty:2, question:'What provides centralized, programmable control of network infrastructure?', options:['SDN','MPLS','ATM','Token Ring'], answer:0, explanation:'SDN separates control plane from data plane, enabling centralized programmable management.', objective:'3.2' },

  // ── DOMAIN 4: Security Operations ──
  { id:'s61', domain:'D4', type:'single', difficulty:2, question:"A new SOC is building its incident response capability from scratch. According to NIST SP 800-61, which phase MUST be completed before any incident occurs?", options:['Containment of the first incident','Eradication of detected malware','Preparation (policies, tools, training)','Identification of indicators'], answer:2, explanation:'Preparation establishes the people, process, and tooling on which every later IR phase depends.', whyWrong:{0:'Containment is reactive and follows detection.',1:'Eradication only happens after analysis.',3:'Identification requires preparation tooling already in place.'}, objective:'4.8' },
  { id:'s62', domain:'D4', type:'single', difficulty:1, question:'Which log source is MOST useful for detecting unauthorized login attempts?', options:['Firewall logs','Authentication server logs','DNS logs','DHCP logs'], answer:1, explanation:'Authentication server logs record all login attempts for brute force detection.', objective:'4.9' },
  { id:'s63', domain:'D4', type:'single', difficulty:2, question:'A third-party gathers info without direct network access. Which describes this?', options:['Vulnerability scanning','Passive reconnaissance','Supply chain analysis','Regulatory audit'], answer:1, explanation:'Passive reconnaissance gathers info from public sources without interacting with targets.', objective:'4.4' },
  { id:'s64', domain:'D4', type:'single', difficulty:2, question:'Which metric measures how often hardware is expected to fail?', options:['MTBF','RTO','MTTR','RPO'], answer:0, explanation:'MTBF (Mean Time Between Failures) measures expected time between hardware failures.', objective:'4.3' },
  { id:'s65', domain:'D4', type:'single', difficulty:2, question:'A scan shows no issues but a vulnerability was announced last week. What is this?', options:['Exploit','Compensating controls','Zero-day attack','False negative'], answer:3, explanation:'A false negative occurs when a scanner fails to detect a known vulnerability.', objective:'4.3' },
  { id:'s66', domain:'D4', type:'single', difficulty:1, question:'Which protocol is used to securely access a remote command line?', options:['Telnet','FTP','SSH','SNMP'], answer:2, explanation:'SSH encrypts the session for remote CLI access. Telnet transmits in cleartext.', objective:'4.1' },
  { id:'s67', domain:'D4', type:'single', difficulty:2, question:'Which should be done FIRST when a compromised system is discovered?', options:['Wipe and reimage','Isolate from network','Notify law enforcement','Update antivirus'], answer:1, explanation:'Isolating prevents further damage while preserving evidence for investigation.', objective:'4.8' },
  { id:'s68', domain:'D4', type:'single', difficulty:1, question:'What does SOAR stand for in security operations?', options:['Security Orchestration, Automation, and Response','System Operations and Risk Analysis','Security Operations and Auditing Report','Standard Operating Automated Response'], answer:0, explanation:'SOAR platforms orchestrate security tools, automate tasks, and streamline IR.', objective:'4.7' },
  { id:'s69', domain:'D4', type:'single', difficulty:2, question:'What distinguishes threat hunting from automated monitoring?', options:['Only signature-based','Proactively searches for threats evading automated tools','Replaces SIEM','No human intervention needed'], answer:1, explanation:'Threat hunting proactively searches for threats that automated tools may miss.', objective:'4.4' },
  { id:'s70', domain:'D4', type:'single', difficulty:1, question:'Which type of penetration test gives the tester no prior knowledge?', options:['White box','Gray box','Black box','Blue box'], answer:2, explanation:'Black box testing simulates a real attack with no prior knowledge of the target.', objective:'4.3' },
  { id:'s71', domain:'D4', type:'single', difficulty:2, question:'A security admin imaged an infected OS to a known-good version. Which IR step?', options:['Lessons learned','Recovery','Detection','Containment'], answer:1, explanation:'Re-imaging to restore a known-good state is part of the Recovery phase.', objective:'4.8' },
  { id:'s72', domain:'D4', type:'single', difficulty:2, question:'A Linux admin downloads an ISO and sees a SHA256 hash. What does it verify?', options:['File integrity during transfer','Provides decryption key','Authenticates the site','Confirms no malware'], answer:0, explanation:'Comparing the SHA256 hash verifies the file was not corrupted during download.', objective:'4.1' },
  { id:'s73', domain:'D4', type:'single', difficulty:2, question:"A researcher discovers a critical flaw in a vendor product. Which approach to disclosure is considered responsible disclosure?", options:['Post full PoC to social media immediately','Privately notify the vendor and wait an agreed window before publishing','Sell the exploit to the highest bidder','Ignore the finding to avoid liability'], answer:1, explanation:'Responsible disclosure gives the vendor a defined window to patch before public release.', whyWrong:{0:'Immediate public PoC endangers users.',2:'Selling the exploit is brokering, not disclosure.',3:'Ignoring leaves the flaw unpatched.'}, objective:'4.3' },
  { id:'s74', domain:'D4', type:'single', difficulty:2, question:"After containing a ransomware incident, leadership asks the IR lead what root cause analysis should accomplish. Which BEST states the goal?", options:['Identify which staff to discipline','Determine the underlying cause so the same incident cannot recur','Calculate financial losses for insurance','Restore systems faster next time'], answer:1, explanation:'RCA exists to eliminate the originating weakness, not assign blame or measure cost.', whyWrong:{0:'Discipline is HR, not RCA.',2:'Loss calculation is part of impact analysis.',3:'Restoration is recovery, not RCA.'}, objective:'4.8' },
  { id:'s75', domain:'D4', type:'single', difficulty:2, question:'An IT help desk uses automation to improve security event response time. Use case?', options:['Escalation','Guard rails','Continuous integration','Resource provisioning'], answer:0, explanation:'Automated escalation improves response time by routing events to appropriate teams.', objective:'4.7' },
  { id:'s76', domain:'D4', type:'single', difficulty:2, question:'Which MFA method provides the strongest resistance to phishing?', options:['SMS OTP','Email OTP','Hardware FIDO2 security key','Push notification'], answer:2, explanation:'FIDO2 hardware keys use cryptographic challenge-response bound to the origin, immune to phishing.', objective:'4.6' },
  { id:'s77', domain:'D4', type:'single', difficulty:1, question:'Which access control model uses labels such as "Top Secret" and "Confidential"?', options:['RBAC','MAC','DAC','ABAC'], answer:1, explanation:'MAC uses classification labels assigned by administrators. Users cannot change permissions.', objective:'4.6' },
  { id:'s78', domain:'D4', type:'single', difficulty:2, question:'Which protocol encrypts the entire authentication conversation, unlike RADIUS?', options:['LDAP','TACACS+','OAuth','Kerberos'], answer:1, explanation:'TACACS+ encrypts the entire authentication session; RADIUS only encrypts the password.', objective:'4.6' },
  { id:'s79', domain:'D4', type:'single', difficulty:2, question:'What does just-in-time (JIT) access provide?', options:['Permanent admin access','Temporary elevated privileges only when needed','Read-only access','Shared admin credentials'], answer:1, explanation:'JIT access grants temporary elevated privileges for a limited time, reducing attack surface.', objective:'4.6' },
  { id:'s80', domain:'D4', type:'single', difficulty:2, question:'What does PAM (Privileged Access Management) primarily control?', options:['Email encryption','Access to admin and high-privilege accounts','Physical badge access','Wireless auth'], answer:1, explanation:'PAM manages and monitors access to privileged accounts to prevent misuse.', objective:'4.6' },
  { id:'s81', domain:'D4', type:'single', difficulty:2, question:'Which authentication method eliminates passwords entirely?', options:['SSO','TOTP','Passwordless (FIDO2/passkeys)','RADIUS'], answer:2, explanation:'Passwordless auth using FIDO2/passkeys replaces passwords with cryptographic keys.', objective:'4.6' },
  { id:'s82', domain:'D4', type:'single', difficulty:2, question:'A data breach has occurred. Admin is building new servers for financial systems. Which IR phase?', options:['Lessons learned','Containment','Recovery','Analysis'], answer:2, explanation:'Building new servers to restore financial systems is part of Recovery.', objective:'4.8' },
  { id:'s83', domain:'D4', type:'single', difficulty:2, question:'A company needs auto-lock, GPS tracking, and data separation on mobile devices. What implements this?', options:['Network segmentation','Biometrics','COPE deployment','MDM solution'], answer:3, explanation:'MDM provides centralized control including auto-lock, location tracking, and containerization.', objective:'4.1' },
  { id:'s84', domain:'D4', type:'single', difficulty:3, question:'A technician patches the first of fifty servers. Web service fails with critical error. What NEXT?', options:['Contact stakeholders','Follow backout plan','Test in lab','Evaluate impact analysis'], answer:1, explanation:'When a change fails in production, immediately follow the backout plan to restore service.', objective:'4.1' },
  { id:'s85', domain:'D4', type:'single', difficulty:2, question:'What ensures evidence integrity throughout an investigation?', options:['Chain of custody','Legal hold','Data classification','Incident timeline'], answer:0, explanation:'Chain of custody documents who handled evidence, when, and how, ensuring integrity.', objective:'4.9' },
  { id:'s86', domain:'D4', type:'single', difficulty:2, question:'Which feature prevents unauthorized devices from connecting to switch ports?', options:['VLAN trunking','Port security','Spanning tree','Link aggregation'], answer:1, explanation:'Port security restricts switch port access based on MAC addresses.', objective:'4.5' },
  { id:'s87', domain:'D4', type:'single', difficulty:2, question:'What technology allows users to log in once across organizations?', options:['MFA','SSO','Federation','RBAC'], answer:2, explanation:'Federation extends SSO across organizational boundaries using trust relationships.', objective:'4.6' },
  { id:'s88', domain:'D4', type:'single', difficulty:2, question:"A user installs a custom ROM that roots their corporate-managed Android phone. Which security risk MOST concerns the mobile administrator?", options:['Slightly improved performance','Bypass of vendor security controls and MDM enforcement','Marginally better battery life','Faster OS update cadence'], answer:1, explanation:'Rooting removes the controls MDM relies on to enforce policy and protect data.', whyWrong:{0:'Performance is not a security concern.',2:'Battery life is unrelated to control posture.',3:'Update speed does not offset lost protections.'}, objective:'4.1' },
  { id:'s89', domain:'D4', type:'single', difficulty:2, question:'An email server received mail from an unauthorized server. Which determines disposition?', options:['SPF','NAC','DMARC','DKIM'], answer:2, explanation:'DMARC determines disposition of messages failing SPF and/or DKIM checks.', objective:'4.5' },
  { id:'s90', domain:'D4', type:'single', difficulty:2, question:'A VPN performs posture assessment during login. What mitigation technique?', options:['Encryption','Decommissioning','Least privilege','Configuration enforcement'], answer:3, explanation:'Posture assessment during VPN login is configuration enforcement.', objective:'4.5' },
  { id:'s91', domain:'D4', type:'single', difficulty:2, question:'A security admin wants to prevent data exfiltration via USB drives. BEST method?', options:['OS policy to block removable media','Monitor usage in firewall logs','Only allow apps without removable media','Block in UTM'], answer:0, explanation:'An OS-level security policy to block removable media prevents USB-based data exfiltration.', objective:'4.1' },
  { id:'s92', domain:'D4', type:'single', difficulty:2, question:'An internal audit discovers four unpatched servers. It takes two weeks to patch. Best interim response?', options:['Buy cyber insurance','Implement exception','Move to protected segment','Hire third-party audit'], answer:2, explanation:'Moving unpatched servers to a protected network segment limits exposure while patches are tested.', objective:'4.5' },

  // ── DOMAIN 5: Security Program Management and Oversight ──
  { id:'s93', domain:'D5', type:'single', difficulty:1, question:'Which regulation protects the privacy of health information in the US?', options:['GDPR','PCI-DSS','HIPAA','SOX'], answer:2, explanation:'HIPAA establishes standards for protecting sensitive patient health information.', objective:'5.4' },
  { id:'s94', domain:'D5', type:'single', difficulty:1, question:'Which data classification level typically contains trade secrets?', options:['Public','Internal','Confidential','Restricted/Top Secret'], answer:3, explanation:'Restricted/Top Secret is reserved for the most sensitive data.', objective:'5.1' },
  { id:'s95', domain:'D5', type:'single', difficulty:2, question:'Two companies want a broad formal partnership agreement. Which document?', options:['SLA','SOW','MOA','NDA'], answer:2, explanation:'A Memorandum of Agreement (MOA) is a broad formal agreement between organizations.', objective:'5.3' },
  { id:'s96', domain:'D5', type:'single', difficulty:2, question:'A company performs DR exercise during annual meeting. What is this?', options:['Capacity planning','Business impact analysis','Continuity of operations','Tabletop exercise'], answer:3, explanation:'A tabletop exercise is discussion-based, walking through a simulated scenario.', objective:'5.2' },
  { id:'s97', domain:'D5', type:'single', difficulty:2, question:'What document tracks identified risks, likelihood, impact, and mitigation status?', options:['Incident report','Risk register','Audit log','Change management form'], answer:1, explanation:'A risk register tracks risks, their assessments, and mitigation plans.', objective:'5.2' },
  { id:'s98', domain:'D5', type:'single', difficulty:2, question:'What role ensures an organization complies with data privacy regulations?', options:['CISO','Data Privacy Officer (DPO)','Network Admin','Help Desk Manager'], answer:1, explanation:'The DPO oversees data protection strategy and compliance with regulations like GDPR.', objective:'5.1' },
  { id:'s99', domain:'D5', type:'single', difficulty:1, question:'Which describes how cautious an organization is to taking a specific risk?', options:['Risk appetite','Risk register','Risk transfer','Risk reporting'], answer:0, explanation:'Risk appetite describes how willing an organization is to accept risk.', objective:'5.2' },
  { id:'s100', domain:'D5', type:'single', difficulty:2, question:'A company hires seasonal employees. Best way to verify they can\'t access after leaving?', options:['Confirm no unauthorized admin access','Validate lockout policy','Validate offboarding processes','Create 24h auth report'], answer:2, explanation:'Validating offboarding procedures ensures former employees lose all system access.', objective:'5.1' },
  { id:'s101', domain:'D5', type:'single', difficulty:2, question:'What should an incident communication plan include?', options:['Only SOC technical details','Stakeholder notification and escalation paths','Marketing materials','Source code access'], answer:1, explanation:'Incident communication plans define who to notify, when, and escalation paths.', objective:'5.1' },
  { id:'s102', domain:'D5', type:'single', difficulty:2, question:'A company formalizes the design and deployment process for programmers. Which policy?', options:['Business continuity','Acceptable use','Incident response','Development lifecycle'], answer:3, explanation:'SDLC policies formalize how software is designed, developed, and deployed.', objective:'5.1' },
  { id:'s103', domain:'D5', type:'single', difficulty:1, question:'A company creates quarterly government reports. What type of data?', options:['Data in use','Obfuscated','Trade secrets','Regulated'], answer:3, explanation:'Data required for government reporting is regulated data.', objective:'5.4' },
  { id:'s104', domain:'D5', type:'single', difficulty:2, question:'Which is a key security concern for REST APIs?', options:['Physical port security','Broken authentication and excessive data exposure','Cable length','Disk encryption'], answer:1, explanation:'REST APIs are vulnerable to broken auth, excessive data exposure, and injection.', objective:'5.3' },
  { id:'s105', domain:'D5', type:'single', difficulty:2, question:"An organization is drafting a BYOD policy. Which risk should the policy address as the GREATEST?", options:['Higher hardware procurement costs','Commingling of personal and corporate data on devices the org cannot fully control','Slower OS update adoption','Lower employee satisfaction'], answer:1, explanation:'Mixing data on uncontrolled devices is the defining BYOD risk because it directly threatens corporate data confidentiality.', whyWrong:{0:'Costs are typically lower under BYOD, not higher.',2:'Updates are usually faster on personal devices.',3:'Satisfaction generally rises with BYOD.'}, objective:'5.1' },
  // Additional D4/D5 questions
  { id:'s106', domain:'D4', type:'single', difficulty:2, question:'What does DNSSEC provide?', options:['Encrypted DNS queries','Authentication of DNS responses','DNS load balancing','DNS over HTTPS'], answer:1, explanation:'DNSSEC adds digital signatures to DNS data to authenticate responses.', objective:'4.5' },
  { id:'s107', domain:'D4', type:'single', difficulty:2, question:'Which technology encrypts DNS queries to prevent eavesdropping?', options:['DNSSEC','DNS over HTTPS (DoH)','DNS amplification','Split DNS'], answer:1, explanation:'DNS over HTTPS encrypts DNS queries inside HTTPS connections.', objective:'4.5' },
  { id:'s108', domain:'D3', type:'single', difficulty:2, question:"A privacy officer wants to stop the local ISP from logging which sites employees resolve from a remote office. Which control BEST addresses this?", options:['Switch the office to faster recursive resolvers','Enable DNS over HTTPS so resolution is encrypted in TLS','Increase DNS cache TTLs','Use round-robin DNS load balancing'], answer:1, explanation:'DoH wraps DNS in HTTPS, hiding queries from on-path observers like the ISP.', whyWrong:{0:'Speed does not provide confidentiality.',2:'Caching does not prevent observation of new lookups.',3:'Load-balanced DNS is still cleartext.'}, objective:'3.2' },
  { id:'s109', domain:'D4', type:'single', difficulty:2, question:'A network admin wants users to authenticate with corporate credentials for Wi-Fi. What to configure?', options:['WPA3','802.1X','PSK','MFA'], answer:1, explanation:'802.1X provides port-based network access control using corporate credentials via RADIUS.', objective:'4.6' },
  { id:'s110', domain:'D3', type:'single', difficulty:2, question:'A CASB operates between cloud users and providers. What does it enforce?', options:['Physical security','Security policies for cloud access','Cable management','Power distribution'], answer:1, explanation:'CASBs enforce security policies including DLP, access control, and threat protection.', objective:'3.1' },
  { id:'s111', domain:'D5', type:'single', difficulty:2, question:'In the shared responsibility model, which is ALWAYS the customer\'s responsibility?', options:['Physical facility','Data classification and access control','Hypervisor patching','Network backbone'], answer:1, explanation:'Data classification and access control are always the customer\'s responsibility.', objective:'5.1' },
  { id:'s112', domain:'D1', type:'single', difficulty:2, question:'Valerie wants to handle multiple subdomains with one certificate. What type?', options:['Self-signed','Root of trust','CRL certificate','Wildcard certificate'], answer:3, explanation:'A wildcard certificate covers all subdomains of a domain.', objective:'1.4' },
  { id:'s113', domain:'D1', type:'single', difficulty:2, question:"A relying party needs to know whether a presented X.509 certificate has been invalidated before its expiration date. Which artifact provides this information?", options:['The certificate trust anchor list','A Certificate Revocation List (CRL) or OCSP response','The certificate signing request','The certificate template'], answer:1, explanation:'CRLs (and OCSP) are the published mechanism for distributing pre-expiry revocation status.', whyWrong:{0:'Trust anchors define trusted CAs, not revocation status.',2:'CSRs are issuance artifacts, not revocation data.',3:'Templates govern issuance attributes only.'}, objective:'1.4' },
  { id:'s114', domain:'D1', type:'single', difficulty:2, question:'What does certificate pinning protect against?', options:['Brute force','Rogue CA issuing fraudulent certs','SQL injection','DoS'], answer:1, explanation:'Certificate pinning ensures only specific trusted certificates are accepted.', objective:'1.4' },
  { id:'s115', domain:'D1', type:'single', difficulty:2, question:'What does Perfect Forward Secrecy (PFS) provide?', options:['Faster encryption','Session keys safe even if long-term key compromised','Backward compatibility','Certificate chain validation'], answer:1, explanation:'PFS ensures compromise of long-term keys does not compromise past session keys.', objective:'1.4' },
  { id:'s116', domain:'D3', type:'single', difficulty:2, question:'Which property of blockchain ensures data integrity?', options:['Centralized authority','Cryptographic hash chaining','Secret key sharing','Data compression'], answer:1, explanation:'Each block contains a hash of the previous block, creating a tamper-evident chain.', objective:'3.3' },
  { id:'s117', domain:'D3', type:'single', difficulty:2, question:'Which is a security concern unique to IPv6?', options:['No encryption','Dual-stack creating bypass paths','Cannot use firewalls','Shorter addresses'], answer:1, explanation:'Dual-stack (IPv4+IPv6) can create unmonitored IPv6 paths bypassing IPv4 controls.', objective:'3.2' },
  { id:'s118', domain:'D4', type:'single', difficulty:2, question:'Deploying a company app to field employees with various devices. Which model?', options:['CYOD','SSO','COPE','BYOD'], answer:2, explanation:'COPE (Corporate-Owned, Personally Enabled) gives company control while allowing personal use.', objective:'4.2' },
  { id:'s119', domain:'D4', type:'single', difficulty:2, question:'Which cloud tool provides visibility into sanctioned and unsanctioned app usage?', options:['WAF','CASB','IDS','NAC'], answer:1, explanation:'A CASB monitors and controls cloud application usage.', objective:'4.4' },
  { id:'s120', domain:'D5', type:'single', difficulty:2, question:'A company wants to provide website login using existing credentials from a third-party. Best approach?', options:['Federation','802.1X','EAP','SSO'], answer:0, explanation:'Federation allows using credentials from another organization through trust relationships.', objective:'5.3' },
  // More D2 questions
  { id:'s121', domain:'D2', type:'single', difficulty:2, question:'A firewall log shows a Trojan blocked from external IP to internal host on port 80. What can be observed?', options:['Victim IP is the external address','A download was blocked from a web server','A DDoS was blocked','Trojan blocked but file got through'], answer:1, explanation:'The AV gateway blocked a trojan download from an external web server (port 80).', objective:'2.4' },
  { id:'s122', domain:'D2', type:'single', difficulty:2, question:'An embedded OS resets filesystem on error, causing constant reboot. What issue?', options:['Memory injection','Resource consumption','Race condition','Malicious update'], answer:2, explanation:'A race condition between the error and reset process causes a boot loop.', objective:'2.3' },
  { id:'s123', domain:'D2', type:'single', difficulty:2, question:'A user assigns individual read-only permissions to a file for three users. What access model?', options:['Discretionary','Mandatory','Attribute-based','Role-based'], answer:0, explanation:'DAC allows the owner to set individual permissions on their own files.', objective:'2.5' },
  // More D3 questions
  { id:'s124', domain:'D3', type:'single', difficulty:2, question:'A company would like to add digital signatures to each outgoing email. Why?', options:['Confidentiality','Integrity','Authentication','Availability'], answer:1, explanation:'Digital signatures on emails verify the message has not been altered (integrity).', objective:'3.3' },
  { id:'s125', domain:'D3', type:'single', difficulty:3, question:'Which is NOT a common transport encryption protocol?', options:['TLS','IPSec','SAML','SSH'], answer:2, explanation:'SAML is an authentication/authorization protocol, not a transport encryption protocol.', objective:'3.3' },
  // More D4
  { id:'s126', domain:'D4', type:'single', difficulty:2, question:'A system admin receives a text alert when access rights change on a database. What describes this alert?', options:['Maintenance window','Attestation and acknowledgment','Automation','External audit'], answer:2, explanation:'Automated alerts triggered by access changes are a form of security automation.', objective:'4.7' },
  { id:'s127', domain:'D4', type:'single', difficulty:2, question:'A security engineer runs monthly vulnerability scans. What type of activity?', options:['Threat hunting','Vulnerability management','Penetration testing','Incident response'], answer:1, explanation:'Regular vulnerability scanning is a core vulnerability management activity.', objective:'4.3' },
  // More D5
  { id:'s128', domain:'D5', type:'single', difficulty:2, question:'An insurance company requires: access records archived, after-hours alerts, geo-restrictions, centralized logs. Which THREE should be implemented?', options:['IP/GPS login restrictions','Require government ID during onboarding','Add password complexity','Monthly permission auditing','Consolidate logs on SIEM','Archive disabled account keys','Time-of-day restrictions'], answer:0, explanation:'IP/GPS restrictions, SIEM log consolidation, and time-of-day restrictions meet all requirements.', objective:'5.4' },
  { id:'s129', domain:'D5', type:'single', difficulty:2, question:'A security admin examined a compromised server and found it was exploited due to a known OS vulnerability. What describes this finding?', options:['Root cause analysis','E-discovery','Risk appetite','Data subject'], answer:0, explanation:'Identifying the known vulnerability as the cause is root cause analysis.', objective:'5.2' },
  // Fill to 200
  { id:'s130', domain:'D2', type:'single', difficulty:2, question:'What kind of security control is a login banner?', options:['Preventive','Deterrent','Corrective','Detective'], answer:1, explanation:'Login banners deter unauthorized use by warning about legal consequences.', objective:'2.5' },
  { id:'s131', domain:'D4', type:'single', difficulty:2, question:'A file integrity monitoring tool alerts on file modifications. What control type?', options:['Preventive','Deterrent','Directive','Detective'], answer:3, explanation:'FIM detects unauthorized changes to files — a detective control.', objective:'4.4' },
  { id:'s132', domain:'D1', type:'single', difficulty:2, question:'Selah\'s organization experienced a breach and private keys were exposed. What should she do?', options:['Reissue with changed hostnames','Replace with self-signed certs','Revoke and place on CRL','Replace with wildcard certs'], answer:2, explanation:'Exposed private keys require immediate certificate revocation and CRL listing.', objective:'1.4' },
  { id:'s133', domain:'D3', type:'single', difficulty:2, question:'Which detective control helps with physical security?', options:['Fencing','Lighting','Video surveillance','Bollards'], answer:2, explanation:'Video surveillance detects and records security incidents — a detective control.', objective:'3.1' },
  { id:'s134', domain:'D1', type:'single', difficulty:2, question:'Damian runs: openssl req -new -newkey rsa:2048 -nodes -keyout server.key -out server.csr. What has he done?', options:['Created a CSR','Created a revocation request','Signed a CSR','Updated OCSP record'], answer:0, explanation:'This OpenSSL command generates a new key pair and certificate signing request.', objective:'1.4' },
  { id:'s135', domain:'D4', type:'single', difficulty:2, question:'Chris wants to check if a certificate has been revoked. What protocol?', options:['TLS','OCRS','SSL','OCSP'], answer:3, explanation:'OCSP (Online Certificate Status Protocol) validates the current status of a certificate.', objective:'4.1' },
  { id:'s136', domain:'D3', type:'single', difficulty:2, question:'Brian\'s organization uses a secure module that validates each signed boot stage. What is it called?', options:['Secure initiation manager','Root of trust','Boot hash','Cryptographic boot manager'], answer:1, explanation:'A root of trust is the foundation of the secure boot chain of verification.', objective:'3.2' },
  { id:'s137', domain:'D1', type:'single', difficulty:2, question:'What change management term describes the consistent process used for each change?', options:['Standard operating procedures','Change plan','Fixed operating procedures','Backout plan'], answer:0, explanation:'SOPs ensure a consistent process is followed for every change.', objective:'1.3' },
  { id:'s138', domain:'D5', type:'single', difficulty:2, question:'Gap analysis examines what?', options:['Misconfigured services','Unpatched systems','Security program vs best practices','Legal requirements vs program'], answer:2, explanation:'Gap analysis compares the current security program against best practices or standards.', objective:'5.5' },
  { id:'s139', domain:'D1', type:'single', difficulty:2, question:'Renee wants logs to support nonrepudiation. What should she do?', options:['Encrypt then hash','Hash then digitally sign','Digitally sign then encrypt','Hash then encrypt'], answer:1, explanation:'Hashing then digitally signing provides integrity and nonrepudiation.', objective:'1.4' },
  { id:'s140', domain:'D3', type:'single', difficulty:2, question:'Christina wants a physical control with greatest flexibility for exceptions. Which?', options:['Video surveillance','Security guards','Access badges','Access control vestibules'], answer:1, explanation:'Security guards provide the most flexibility as they can make judgment calls.', objective:'3.1' },
  { id:'s141', domain:'D4', type:'single', difficulty:2, question:"In a NIST zero-trust architecture, which component evaluates contextual signals against policy to grant or deny each request?", options:['Policy Administrator','Policy Engine','Policy Enforcement Point','Trust Algorithm'], answer:1, explanation:'The Policy Engine renders the access decision; the Administrator and PEP execute it.', whyWrong:{0:'The Administrator implements decisions, it does not make them.',2:'The PEP enforces the decision at the connection point.',3:'The trust algorithm is the logic the engine uses, not the component itself.'}, objective:'4.6' },
  { id:'s142', domain:'D1', type:'single', difficulty:2, question:'What role does asymmetric encryption play in solving key management?', options:['Evil twin prevention','Collision resistance','Key length management','Key exchange'], answer:3, explanation:'Asymmetric encryption solves the key exchange problem using public/private key pairs.', objective:'1.4' },
  { id:'s143', domain:'D3', type:'single', difficulty:2, question:'Rick\'s cloud provider offers a dedicated HSM. Which capability is it UNLIKELY to offer?', options:['Validating secure boot','Key generation','Encrypting/decrypting data','Creating digital signatures'], answer:0, explanation:'HSMs are for key management and crypto operations, not boot validation (that\'s TPM).', objective:'3.2' },
  { id:'s144', domain:'D1', type:'single', difficulty:2, question:"During change planning, a team lists \"database link, SSO connector, and NTP\" alongside the change. Which change-management element are these?", options:['Allowed services','Standard operating procedures','Denied services','Dependencies'], answer:3, explanation:'Other systems the change relies on are dependencies that must be evaluated for impact.', whyWrong:{0:'Allowed services lists are firewall constructs.',1:'SOPs are procedural documents.',2:'Denied services are blocked, not relied upon.'}, objective:'1.3' },
  { id:'s145', domain:'D5', type:'single', difficulty:2, question:'Which change management process does NOT commonly involve stakeholders outside IT?', options:['Impact analysis','Building backout plan','Change approval process','Determining maintenance window'], answer:1, explanation:'Building the backout plan is typically an internal IT technical activity.', objective:'5.1' },
  { id:'s146', domain:'D2', type:'single', difficulty:2, question:'Jack deployed a system that appears vulnerable to attract attackers for analysis. What tool?', options:['Tarpit','Honeypot','Beehive','IDS'], answer:1, explanation:'A honeypot is specifically designed to attract and capture attacker activity.', objective:'2.5' },
  { id:'s147', domain:'D4', type:'single', difficulty:2, question:'Nick\'s org reserves Saturday 2-4 AM for maintenance. What is this called?', options:['Allocated downtime','Maintenance window','Unscheduled outage','Allowed outage'], answer:1, explanation:'A maintenance window is a scheduled period reserved for system changes.', objective:'4.1' },
  { id:'s148', domain:'D5', type:'single', difficulty:2, question:'Megan wants to assess impact of a change. What helps MOST?', options:['Backout plan','Estimated downtime','Stakeholder list','List of dependencies'], answer:3, explanation:'Understanding dependencies helps assess the full impact of changes.', objective:'5.2' },
  { id:'s149', domain:'D4', type:'single', difficulty:3, question:'Jared wants to estimate downtime from a planned change. Best method?', options:['Average from recent changes','Contact vendor','Perform change in test environment','Use fixed maintenance window'], answer:2, explanation:'Testing in a test environment provides the most accurate downtime estimate.', objective:'4.1' },
  { id:'s150', domain:'D1', type:'single', difficulty:2, question:'Alaina should NOT restrict which activity during a change window?', options:['Patching','Scaling clustered systems','Changing hostnames','Modifying DB configs'], answer:1, explanation:'Scaling clustered systems up/down should remain available for operational flexibility during changes.', objective:'1.3' },
  // Extra D2
  { id:'s151', domain:'D2', type:'single', difficulty:2, question:'What type of malware encrypts files and demands payment?', options:['Worm','Ransomware','Adware','Spyware'], answer:1, explanation:'Ransomware encrypts victim files and demands cryptocurrency payment for decryption.', objective:'2.4' },
  { id:'s152', domain:'D2', type:'single', difficulty:2, question:'Which attack involves inserting a rogue access point that mimics a legitimate SSID?', options:['Evil twin','Deauthentication','War driving','Bluesnarfing'], answer:0, explanation:'Evil twin attacks create a fake AP with the same SSID to intercept traffic.', objective:'2.4' },
  { id:'s153', domain:'D4', type:'single', difficulty:2, question:"A security team needs a single platform that ingests logs from firewalls, endpoints, and cloud and alerts on cross-source correlations. Which tool BEST fits?", options:['Endpoint antivirus','SIEM with correlation rules','WSUS patch manager','VLAN-aware switch'], answer:1, explanation:'A SIEM is purpose-built to centralize multi-source telemetry and correlate it into actionable alerts.', whyWrong:{0:'AV is endpoint-only and does not correlate across sources.',2:'WSUS handles patching, not correlation.',3:'A switch segments traffic but does not analyze logs.'}, objective:'4.4' },
  { id:'s154', domain:'D3', type:'single', difficulty:2, question:'What does a WAF protect against?', options:['Physical intrusion','Web application attacks (SQLi, XSS)','Network layer DDoS','Email spam'], answer:1, explanation:'A Web Application Firewall filters and monitors HTTP traffic against web attacks.', objective:'3.2' },
  { id:'s155', domain:'D4', type:'single', difficulty:2, question:'Which backup type copies only files changed since the last full backup?', options:['Full','Incremental','Differential','Snapshot'], answer:2, explanation:'Differential backup copies all changes since the last full backup.', objective:'4.1' },
  { id:'s156', domain:'D5', type:'single', difficulty:2, question:'What framework provides five functions: Identify, Protect, Detect, Respond, Recover?', options:['ISO 27001','NIST CSF','CIS Controls','COBIT'], answer:1, explanation:'NIST Cybersecurity Framework organizes around these five core functions.', objective:'5.1' },
  { id:'s157', domain:'D3', type:'single', difficulty:2, question:"An architect wants to drop malicious traffic in real time at the network edge rather than just be alerted to it. Which deployment BEST satisfies this requirement?", options:['IDS on a SPAN port','IPS placed inline with traffic','Host-based AV','A jump server'], answer:1, explanation:'Only an inline IPS can block packets as they pass; an IDS on a SPAN port can only observe.', whyWrong:{0:'A SPAN-port IDS sees a copy and cannot drop the original.',2:'AV protects endpoints, not network transit.',3:'A jump server controls admin access, not malicious traffic.'}, objective:'3.2' },
  { id:'s158', domain:'D4', type:'single', difficulty:2, question:'What type of scan identifies open ports and running services on a network?', options:['Vulnerability scan','Port scan','Compliance scan','Credential scan'], answer:1, explanation:'Port scanning identifies open ports and running services on target systems.', objective:'4.3' },
  { id:'s159', domain:'D2', type:'single', difficulty:3, question:"Researchers see a niche industry forum quietly serving exploit code only to visitors from a few defense contractors. Which attack pattern BEST describes this?", options:['Watering hole attack','Volumetric DDoS','Tailgating','USB drop'], answer:0, explanation:'Compromising a site that the target population frequents and serving payloads selectively is a watering hole.', whyWrong:{1:'DDoS overwhelms with traffic; it does not selectively serve exploits.',2:'Tailgating is physical entry.',3:'A USB drop relies on dropped media, not a website.'}, objective:'2.2' },
  { id:'s160', domain:'D5', type:'single', difficulty:2, question:'Which agreement specifies the expected level of service between provider and client?', options:['MOA','NDA','SLA','BPA'], answer:2, explanation:'An SLA (Service Level Agreement) defines expected service levels and metrics.', objective:'5.3' },
  // Final batch to reach 200
  { id:'s161', domain:'D2', type:'single', difficulty:2, question:"A vendor receives an exploit for a flaw they had no prior knowledge of and for which no patch exists. Which term BEST classifies this flaw?", options:['Legacy vulnerability','Zero-day vulnerability','Misconfiguration','End-of-life defect'], answer:1, explanation:'A zero-day is a flaw unknown to the vendor with no available fix at the time of exploitation.', whyWrong:{0:'Legacy issues are old and usually documented.',2:'Misconfiguration is operator error, not an unknown flaw.',3:'EOL defects exist in unsupported software but are typically known.'}, objective:'2.3' },
  { id:'s162', domain:'D3', type:'single', difficulty:2, question:'What does a reverse proxy do?', options:['Hides internal servers from external clients','Caches client requests only','Encrypts all DNS traffic','Blocks all inbound traffic'], answer:0, explanation:'A reverse proxy sits in front of servers, hiding internal infrastructure from clients.', objective:'3.2' },
  { id:'s163', domain:'D4', type:'single', difficulty:2, question:"A SOC wants every analyst to follow the same step-by-step actions when a phishing alert fires. Which artifact BEST captures this?", options:['A risk register entry','A documented playbook for the phishing scenario','A network diagram','A vendor SLA'], answer:1, explanation:'Playbooks codify the consistent procedure analysts follow for a specific incident type.', whyWrong:{0:'Risk registers track risk, not response steps.',2:'Diagrams show topology, not procedure.',3:'SLAs govern vendor obligations.'}, objective:'4.8' },
  { id:'s164', domain:'D5', type:'single', difficulty:2, question:'Which assessment evaluates a third party\'s security controls and practices?', options:['Penetration test','Vendor risk assessment','Gap analysis','Tabletop exercise'], answer:1, explanation:'Vendor risk assessments evaluate third-party security practices before engagement.', objective:'5.3' },
  { id:'s165', domain:'D2', type:'single', difficulty:3, question:"A user is logged into their bank in one tab and visits a malicious site in another that auto-submits a hidden funds-transfer form to the bank. Which attack is being attempted?", options:['SQL injection','Cross-site request forgery (CSRF)','Port scanning','SYN flood'], answer:1, explanation:'CSRF abuses the victim\'s authenticated session to submit attacker-chosen requests.', whyWrong:{0:'SQLi targets database queries, not session abuse.',2:'Port scanning is reconnaissance.',3:'SYN floods consume connection state, not user sessions.'}, objective:'2.4' },
  { id:'s166', domain:'D3', type:'single', difficulty:2, question:"A web tier is overwhelmed by traffic and one server keeps melting down while others sit idle. Which control BEST resolves this?", options:['Add a load balancer to distribute requests across the pool','Enable full-disk encryption on the busy server','Move the database to a faster disk','Block ICMP at the firewall'], answer:1, explanation:'Load balancers spread requests so no single backend becomes the hotspot.', whyWrong:{1:'FDE protects data at rest, not throughput.',2:'Database disk speed is downstream of the web tier issue.',3:'Blocking ICMP does not change request distribution.'}, objective:'3.4' },
  { id:'s167', domain:'D4', type:'single', difficulty:2, question:'What does EDR stand for?', options:['External Data Repository','Endpoint Detection and Response','Enterprise Digital Rights','Encrypted Data Recovery'], answer:1, explanation:'EDR monitors endpoints for threats and provides investigation and response capabilities.', objective:'4.4' },
  { id:'s168', domain:'D5', type:'single', difficulty:2, question:"Before designing a continuity plan, an analyst must identify which business processes are critical and what an outage costs per hour. Which assessment delivers this?", options:['Business Impact Analysis (BIA)','Penetration test','Vendor risk questionnaire','Tabletop exercise'], answer:0, explanation:'A BIA quantifies criticality and impact, feeding RTO/RPO targets in the BCP.', whyWrong:{1:'Pen tests assess technical exposure, not process criticality.',2:'Vendor risk reviews evaluate suppliers.',3:'Tabletops validate plans that already exist.'}, objective:'5.2' },
  { id:'s169', domain:'D2', type:'single', difficulty:2, question:'What type of attack exploits the trust between a web application and its user\'s browser?', options:['SQL injection','XSS (Cross-Site Scripting)','Brute force','ARP poisoning'], answer:1, explanation:'XSS exploits the trust a user has for a website by injecting malicious scripts.', objective:'2.4' },
  { id:'s170', domain:'D3', type:'single', difficulty:2, question:"A firm requires the lowest possible RTO for its trading platform after a regional outage. Which DR site type BEST meets this?", options:['Cold site with shipped tapes','Warm site with weekly syncs','Hot site with continuous replication','Mobile site with prebuilt trailer'], answer:2, explanation:'A hot site is fully operational and continuously synchronized for near-instant failover.', whyWrong:{0:'Cold sites take days to bring online.',1:'Warm sites still need data hydration and configuration.',3:'Mobile sites prioritize portability, not RTO.'}, objective:'3.4' },
  { id:'s171', domain:'D4', type:'single', difficulty:2, question:'What does DLP stand for?', options:['Data Loss Prevention','Digital License Protection','Dynamic Link Protocol','Distributed Layer Processing'], answer:0, explanation:'DLP monitors and prevents unauthorized data transfers or leaks.', objective:'4.4' },
  { id:'s172', domain:'D5', type:'single', difficulty:2, question:"Leadership wants risk reported in dollars to support insurance decisions. Which analysis approach should the risk team use?", options:['Qualitative analysis with high/medium/low ratings','Quantitative analysis using SLE, ARO, and ALE','Heat-map ranking only','Maturity-model scoring'], answer:1, explanation:'Quantitative analysis produces monetary loss estimates needed for insurance and ROI decisions.', whyWrong:{0:'Qualitative ratings are not monetary.',2:'Heat maps are visual qualitative outputs.',3:'Maturity scores measure capability, not loss.'}, objective:'5.2' },
  { id:'s173', domain:'D2', type:'single', difficulty:2, question:"Users report being redirected to \"bnak0famerica.com\" after mistyping their bank URL. Which attack are they experiencing?", options:['Pharming via DNS cache poisoning','Typosquatting on look-alike domains','Session hijacking','MAC spoofing'], answer:1, explanation:'Typosquatters register misspelled domains to capture mistyped traffic.', whyWrong:{0:'Pharming would redirect even correctly typed names.',2:'Session hijacking targets active sessions, not URL typos.',3:'MAC spoofing is layer-2 and unrelated to URLs.'}, objective:'2.2' },
  { id:'s174', domain:'D3', type:'single', difficulty:2, question:"An organization can tolerate a 48-hour RTO and wants to minimize standby costs. Which alternate site BEST balances cost and recovery time?", options:['Cold site (power and space only)','Warm site (some equipment and connectivity preinstalled)','Hot site (continuously replicated)','No site; rely on cloud failover only'], answer:1, explanation:'A warm site provides preinstalled equipment that can be brought up within the 48-hour window without paying for full hot-site readiness.', whyWrong:{0:'A cold site likely cannot meet 48 hours.',2:'A hot site exceeds the requirement at higher cost.',3:'No-site assumes a cloud plan that was not stated.'}, objective:'3.4' },
  { id:'s175', domain:'D4', type:'single', difficulty:2, question:"Visitor laptops keep connecting to the corporate LAN with outdated antivirus. Which control BEST enforces a posture check before granting access?", options:['MAC address allow-list on the switch','Network Access Control (NAC) with health assessment','A VPN with split tunneling','SNMPv3 on the access switches'], answer:1, explanation:'NAC interrogates endpoints and admits only those meeting policy, blocking out-of-compliance devices.', whyWrong:{0:'MAC lists do not check posture and are spoofable.',2:'A VPN authenticates remote users but does not posture-check guests on LAN.',3:'SNMPv3 is for management, not admission control.'}, objective:'4.5' },
  { id:'s176', domain:'D5', type:'single', difficulty:2, question:"Before sharing source code with a contractor, legal asks for an agreement that obligates the contractor to keep the code confidential. Which document is appropriate?", options:['Service Level Agreement (SLA)','Non-Disclosure Agreement (NDA)','Memorandum of Understanding (MOU)','Master Service Agreement (MSA)'], answer:1, explanation:'An NDA legally binds the receiving party to protect disclosed confidential information.', whyWrong:{0:'SLAs define service performance, not confidentiality.',2:'MOUs express intent and are not strict confidentiality contracts.',3:'MSAs frame commercial terms broadly.'}, objective:'5.3' },
  { id:'s177', domain:'D2', type:'single', difficulty:2, question:"An attacker exploits a kernel flaw to move from a standard user shell to root on a Linux host. Which technique are they performing?", options:['Lateral movement','Privilege escalation','Reconnaissance','Data exfiltration'], answer:1, explanation:'Gaining higher-than-authorized rights on the same host is privilege escalation.', whyWrong:{0:'Lateral movement is host-to-host, not within one host.',2:'Recon collects information; it does not gain rights.',3:'Exfiltration moves data out and is a later objective.'}, objective:'2.4' },
  { id:'s178', domain:'D3', type:'single', difficulty:2, question:"A company must publish a customer portal but keep its ERP isolated from the internet. Which design BEST meets this?", options:['Place both in the internal LAN','Place the portal in a screened subnet (DMZ) and keep ERP internal','Expose the ERP through port forwarding','Run both on the firewall appliance'], answer:1, explanation:'A DMZ isolates internet-facing services from the internal network, exactly the requirement.', whyWrong:{0:'Internal placement exposes ERP indirectly.',2:'Port forwarding exposes ERP to the internet.',3:'Running services on the firewall violates segregation.'}, objective:'3.2' },
  { id:'s179', domain:'D4', type:'single', difficulty:2, question:"A SOC wants to study attacker tooling without risking production. Which deployment BEST meets this need?", options:['Production database mirror','A monitored honeypot in an isolated segment','A hot standby web server','An additional load balancer'], answer:1, explanation:'A honeypot in an isolated segment captures attacker behavior with no production exposure.', whyWrong:{0:'A production mirror still holds real data.',2:'A standby server is for availability, not deception.',3:'Load balancers do not collect attacker telemetry.'}, objective:'4.4' },
  { id:'s180', domain:'D5', type:'single', difficulty:2, question:"A risk register lists SLE = $20,000 and ARO = 0.5 for a specific threat. What is the ALE the analyst should record?", options:['$10,000','$20,000','$40,000','$100,000'], answer:0, explanation:'ALE = SLE × ARO, so 20,000 × 0.5 = $10,000.', whyWrong:{1:'$20,000 ignores the annual rate of occurrence.',2:'$40,000 doubles instead of halving.',3:'$100,000 has no basis in the inputs.'}, objective:'5.2' },
  { id:'s181', domain:'D2', type:'single', difficulty:3, question:"After a breach, IR finds a kernel module that hides specific PIDs and network sockets from standard tools. Which malware family BEST matches this behavior?", options:['Adware','Rootkit','Spyware','Worm'], answer:1, explanation:'Kernel-level concealment of processes and connections is the signature behavior of a rootkit.', whyWrong:{0:'Adware injects ads; it does not hide kernel state.',2:'Spyware exfiltrates data but rarely modifies kernels.',3:'Worms self-propagate; concealment is not their defining trait.'}, objective:'2.4' },
  { id:'s182', domain:'D3', type:'single', difficulty:2, question:"A platform team wants infrastructure changes to be peer-reviewed in pull requests and reproducible across environments. Which approach BEST supports this?", options:['Manual configuration through the cloud console','Infrastructure as Code (IaC) with templates in version control','Ad-hoc SSH scripts run by admins','Documenting steps in a wiki'], answer:1, explanation:'IaC files in version control enable review, reproducibility, and rollback.', whyWrong:{0:'Console clicks are not reviewable or reproducible.',2:'Ad-hoc SSH lacks audit trail and review.',3:'Wikis document but do not enforce reproducibility.'}, objective:'3.1' },
  { id:'s183', domain:'D4', type:'single', difficulty:2, question:"A network engineer must deploy a sensor that can BLOCK malicious packets, not merely log them. Where should the sensor be placed?", options:['Off a SPAN port for passive capture','Inline in the traffic path','On the management VLAN only','On a remote analyst workstation'], answer:1, explanation:'Only an inline placement allows the sensor (IPS) to drop offending packets in real time.', whyWrong:{0:'SPAN-port placement is passive; the original packet has already passed.',2:'Management VLAN placement misses production traffic.',3:'Analyst workstations cannot enforce inline.'}, objective:'4.5' },
  { id:'s184', domain:'D5', type:'single', difficulty:2, question:"After repeated phishing-driven incidents, leadership funds an awareness program. Which outcome BEST justifies the spend?", options:['Eliminating the need for email filtering','Measurable reduction in user click rates on simulated phishing','Replacing MFA enrollment','Removing endpoint antivirus'], answer:1, explanation:'Tracking simulated-phish click-rate reductions ties training to a quantifiable risk metric.', whyWrong:{0:'Awareness complements, not replaces, email filtering.',2:'MFA addresses credential abuse, not user judgement.',3:'AV addresses malware execution, not human click decisions.'}, objective:'5.6' },
  { id:'s185', domain:'D2', type:'single', difficulty:3, question:"A web app checks if a file exists, then opens it as root moments later. An attacker swaps the file in the gap and reads /etc/shadow. Which class of vulnerability is this?", options:['SQL injection','Race condition (TOCTOU)','Buffer overflow','Cross-site scripting'], answer:1, explanation:'A time-of-check to time-of-use race lets the attacker change state between the check and the action.', whyWrong:{0:'SQLi targets queries, not file handles.',2:'Buffer overflows corrupt memory layout.',3:'XSS injects script into pages.'}, objective:'2.3' },
  { id:'s186', domain:'D3', type:'single', difficulty:2, question:"A QA team needs realistic-looking customer records to test reporting but must not expose real PII. Which control BEST satisfies this?", options:['Full-disk encryption on the QA hosts','Data masking that replaces PII with realistic synthetic values','TLS between app and database','Hashing of all customer fields'], answer:1, explanation:'Masking provides realistic but non-sensitive data so testing is meaningful without PII exposure.', whyWrong:{0:'FDE protects data at rest but does not de-identify it.',2:'TLS protects transit, not the dataset values.',3:'Hashing destroys the realism QA needs.'}, objective:'3.3' },
  { id:'s187', domain:'D4', type:'single', difficulty:2, question:'What type of backup captures the current state of an entire system?', options:['Incremental','Differential','Snapshot','Archive'], answer:2, explanation:'Snapshots capture the complete state of a system at a point in time.', objective:'4.1' },
  { id:'s188', domain:'D5', type:'single', difficulty:2, question:"To reduce internal fraud, a CFO asks that no single employee can both initiate and approve a wire transfer. Which control BEST enforces this?", options:['Mandatory vacation','Separation of duties','Job rotation','Least privilege'], answer:1, explanation:'Separation of duties splits a sensitive transaction so collusion is required to abuse it.', whyWrong:{0:'Mandatory vacation detects fraud; it does not split duties.',2:'Job rotation reduces single-person knowledge but does not split a single transaction.',3:'Least privilege limits scope but allows one person to do both steps if both are within scope.'}, objective:'5.1' },
  { id:'s189', domain:'D2', type:'single', difficulty:2, question:"A disgruntled developer plants code that wipes a database if their HR record is ever marked terminated. Which malware type BEST describes this?", options:['Worm','Logic bomb','Adware','Rootkit'], answer:1, explanation:'Code that detonates only when specific conditions are met is a logic bomb.', whyWrong:{0:'Worms self-propagate; condition-triggered payloads are different.',2:'Adware shows ads; it is not condition-triggered destruction.',3:'Rootkits hide presence; the trigger here is the defining feature.'}, objective:'2.4' },
  { id:'s190', domain:'D3', type:'single', difficulty:2, question:'What does RAID 5 provide?', options:['Mirroring only','Striping with distributed parity for fault tolerance','No redundancy','Full backup'], answer:1, explanation:'RAID 5 stripes data with distributed parity, tolerating a single drive failure.', objective:'3.4' },
  { id:'s191', domain:'D4', type:'single', difficulty:2, question:"An auditor asks the difference between the recent vulnerability scan and the upcoming penetration test. Which statement is correct?", options:['Both produce the same evidence','The scan identifies potential weaknesses; the pen test attempts to exploit them','The scan exploits flaws; the pen test only enumerates them','Neither requires authorization'], answer:1, explanation:'Scanning enumerates exposure; pen testing validates impact through controlled exploitation.', whyWrong:{0:'They produce different evidence and assurance levels.',2:'It reverses the actual roles.',3:'Both require explicit authorization.'}, objective:'4.3' },
  { id:'s192', domain:'D5', type:'single', difficulty:2, question:'What regulation governs payment card data security?', options:['HIPAA','GDPR','PCI-DSS','SOX'], answer:2, explanation:'PCI-DSS sets security standards for organizations handling payment card data.', objective:'5.4' },
  { id:'s193', domain:'D2', type:'single', difficulty:2, question:"Customers report that even when typing the bank URL correctly they land on a fake site. Investigation finds altered DNS responses on the recursive resolver. Which attack is in progress?", options:['Pharming via DNS poisoning','Typosquatting','Session fixation','ARP spoofing on the customer LAN'], answer:0, explanation:'Redirecting correctly-typed lookups via DNS manipulation is pharming.', whyWrong:{1:'Typosquatting requires the user to mistype the URL.',2:'Session fixation reuses a known session ID.',3:'ARP spoofing is local-segment, not remote DNS-based.'}, objective:'2.4' },
  { id:'s194', domain:'D3', type:'single', difficulty:2, question:"A company terminates thousands of remote-worker IPsec tunnels at one HQ device. Which appliance BEST fits this role?", options:['Layer-2 access switch','VPN concentrator','Wireless access point','SAN controller'], answer:1, explanation:'VPN concentrators are purpose-built to scale tunnel termination, encryption, and authentication.', whyWrong:{0:'Access switches do not terminate tunnels.',2:'APs serve wireless clients, not VPN tunnels.',3:'SAN controllers serve storage traffic.'}, objective:'3.2' },
  { id:'s195', domain:'D4', type:'single', difficulty:2, question:"An MDM admin must wipe corporate data automatically when a phone leaves the campus. Which control BEST enables this?", options:['Containerization only','A geofence that triggers an MDM action when the device exits the boundary','Disabling Bluetooth','A screen lock timeout'], answer:1, explanation:'Geofencing fires policy actions (like wipe) when devices cross a defined geographic boundary.', whyWrong:{0:'Containerization separates data but does not detect location.',2:'Disabling Bluetooth is unrelated to location.',3:'Screen locks address idle state, not location.'}, objective:'4.1' },
  { id:'s196', domain:'D5', type:'single', difficulty:2, question:"During an audit, the assessor distinguishes between policy and procedure documents. Which statement BEST captures the difference?", options:['They are interchangeable','Policy states what must be done; procedure states how to do it','Policy is technical; procedure is managerial','Policy is optional guidance'], answer:1, explanation:'Policies set required outcomes; procedures define the executable steps to meet them.', whyWrong:{0:'They serve different governance roles.',2:'Both can apply across technical and managerial domains.',3:'Policies are mandatory by definition.'}, objective:'5.1' },
  { id:'s197', domain:'D2', type:'single', difficulty:2, question:"A user installs a free PDF reader from an unofficial site and later notices it secretly opens a remote shell on their PC. Which malware BEST describes this software?", options:['Worm','Trojan horse','Ransomware','Rootkit'], answer:1, explanation:'Malware delivered as apparently legitimate software with hidden malicious payload is a Trojan.', whyWrong:{0:'Worms self-propagate without user installation.',2:'Ransomware encrypts data for extortion; not described here.',3:'Rootkits focus on persistence/concealment, not bait.'}, objective:'2.4' },
  { id:'s198', domain:'D3', type:'single', difficulty:2, question:"A school must enforce content filtering and cache popular sites for outbound web traffic. Which appliance BEST meets both needs?", options:['Reverse proxy at the data center','Forward proxy server with URL filtering and caching','Email gateway','Load balancer'], answer:1, explanation:'A forward proxy intermediates client web traffic, enabling URL filtering and content caching.', whyWrong:{0:'Reverse proxies front servers, not clients.',2:'Email gateways handle SMTP, not web traffic.',3:'Load balancers distribute server load, not filter content.'}, objective:'3.2' },
  { id:'s199', domain:'D4', type:'single', difficulty:2, question:'What does SCAP stand for?', options:['Security Content Automation Protocol','Secure Communications Access Point','Standard Compliance Assessment Program','System Configuration Analysis Platform'], answer:0, explanation:'SCAP is a suite of specifications for automating vulnerability management and compliance.', objective:'4.3' },
  { id:'s200', domain:'D5', type:'single', difficulty:2, question:"During an M&A review, counsel says the firm performed due diligence and is now performing due care. Which statement BEST distinguishes the two?", options:['They are interchangeable','Due diligence is the investigation; due care is acting reasonably on what was learned','Due care is the investigation; due diligence is action','Both are post-incident only'], answer:1, explanation:'Due diligence gathers facts; due care is the ongoing reasonable action that follows.', whyWrong:{0:'They describe different obligations.',2:'It reverses the correct definitions.',3:'Both are continuous, not post-incident only.'}, objective:'5.1' },
];

/* =================================================================
   MCQ BANK — 50 Select-Two Questions
   ================================================================= */

export const mcqSelectTwo: MCQuestion[] = [
  { id:'t1', domain:'D1', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which of the following are hashing algorithms?', options:['MD5','AES','SHA-256','RSA','3DES'], answer:[0,2], explanation:'MD5 and SHA-256 are hashing algorithms. AES/3DES are symmetric encryption; RSA is asymmetric.', objective:'1.4' },
  { id:'t2', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are social engineering techniques?', options:['Pretexting','Buffer overflow','Tailgating','SQL injection','ARP spoofing'], answer:[0,2], explanation:'Pretexting and tailgating are social engineering. Buffer overflow, SQLi, and ARP spoofing are technical.', objective:'2.2' },
  { id:'t3', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** A password policy lacks attempt restrictions and periodic changes. Which fix this?', options:['Password complexity','Password expiration','Password reuse','Account lockout','Password managers'], answer:[1,3], explanation:'Password expiration requires periodic changes; account lockout limits failed attempts.', objective:'4.6' },
  { id:'t4', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are commonly associated with hybrid cloud?', options:['Network protection mismatches','Simplified compliance','Data sovereignty concerns','Reduced cost','Simplified migration'], answer:[0,2], explanation:'Hybrid clouds face network security mismatches and data sovereignty concerns.', objective:'3.1' },
  { id:'t5', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Select ports that should be allowed inbound to a DMZ web server.', options:['22 (SSH)','80 (HTTP)','443 (HTTPS)','3306 (MySQL)','3389 (RDP)'], answer:[1,2], explanation:'Only HTTP (80) and HTTPS (443) should be exposed inbound to a DMZ web server.', objective:'4.5' },
  { id:'t6', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are indicators of a ransomware attack?', options:['Files renamed with unusual extensions','Increased CPU from cryptocurrency mining','Ransom note file on desktop','Deleted browser history','Slow network performance'], answer:[0,2], explanation:'Ransomware typically renames files with new extensions and drops ransom notes.', objective:'2.4' },
  { id:'t7', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which documents are used for third-party risk management?', options:['SLA','Incident report','SOC 2 report','Vulnerability scan','Right to audit clause'], answer:[2,4], explanation:'SOC 2 reports and right-to-audit clauses are key third-party risk management tools.', objective:'5.3' },
  { id:'t8', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are benefits of infrastructure as code (IaC)?', options:['Manual configuration control','Version-controlled infrastructure','Consistent and repeatable deployments','Reduced need for documentation','Physical hardware management'], answer:[1,2], explanation:'IaC provides version control and consistent, repeatable deployments.', objective:'3.1' },
  { id:'t9', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are components of a SIEM solution?', options:['Log aggregation','Physical access control','Event correlation','Cable management','Badge readers'], answer:[0,2], explanation:'SIEM systems aggregate logs and correlate events to detect threats.', objective:'4.4' },
  { id:'t10', domain:'D1', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are asymmetric encryption algorithms?', options:['AES','RSA','SHA-256','ECC','3DES'], answer:[1,3], explanation:'RSA and ECC are asymmetric algorithms using public/private key pairs.', objective:'1.4' },
  { id:'t11', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which attack types involve network traffic interception?', options:['SQL injection','ARP poisoning','On-path attack','Brute force','Logic bomb'], answer:[1,2], explanation:'ARP poisoning and on-path attacks involve intercepting network traffic.', objective:'2.4' },
  { id:'t12', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are characteristics of a zero trust architecture?', options:['Implicit trust inside the network','Continuous verification of every request','Micro-segmentation','Perimeter-only security','Trust but verify'], answer:[1,2], explanation:'Zero trust requires continuous verification and micro-segmentation.', objective:'3.1' },
  { id:'t13', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which belong to the containment phase of incident response?', options:['Isolating affected systems','Conducting lessons learned','Blocking malicious IPs at firewall','Updating security policies','Creating final report'], answer:[0,2], explanation:'Isolating systems and blocking malicious traffic are containment actions.', objective:'4.8' },
  { id:'t14', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are elements of security governance?', options:['Policies and standards','Hardware procurement','Roles and responsibilities','Cable management','Office layout'], answer:[0,2], explanation:'Security governance includes policies, standards, roles, and responsibilities.', objective:'5.1' },
  { id:'t15', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are wireless-specific attacks?', options:['Evil twin','SQL injection','Deauthentication','Buffer overflow','Phishing'], answer:[0,2], explanation:'Evil twin and deauthentication are wireless-specific attack types.', objective:'2.4' },
  { id:'t16', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which provide data encryption at rest?', options:['TLS','BitLocker','VPN','Database column encryption','SSH'], answer:[1,3], explanation:'BitLocker and database column encryption protect data at rest.', objective:'3.3' },
  { id:'t17', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are proactive security measures?', options:['Threat hunting','Incident response','Vulnerability scanning','Forensic analysis','Post-mortem review'], answer:[0,2], explanation:'Threat hunting and vulnerability scanning proactively identify threats.', objective:'4.3' },
  { id:'t18', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are quantitative risk analysis inputs?', options:['Single Loss Expectancy (SLE)','Subjective risk rating','Annual Rate of Occurrence (ARO)','Risk color coding','Gut feeling'], answer:[0,2], explanation:'SLE and ARO are quantitative inputs used to calculate ALE.', objective:'5.2' },
  { id:'t19', domain:'D1', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are symmetric encryption algorithms?', options:['RSA','AES','ECC','3DES','Diffie-Hellman'], answer:[1,3], explanation:'AES and 3DES use the same key for encryption and decryption.', objective:'1.4' },
  { id:'t20', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are indicators of a brute force attack?', options:['Multiple failed login attempts from one IP','Files renamed with .encrypted extension','Account lockout notifications','Ransom notes on desktop','DNS query anomalies'], answer:[0,2], explanation:'Repeated failed logins and account lockouts indicate brute force attempts.', objective:'2.4' },
  { id:'t21', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are benefits of network segmentation?', options:['Reduced lateral movement','Increased broadcast domain size','Improved compliance posture','Simplified network management','Fewer firewalls needed'], answer:[0,2], explanation:'Segmentation limits lateral movement and helps meet compliance requirements.', objective:'3.2' },
  { id:'t22', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are functions of a WAF?', options:['SQL injection prevention','Physical access control','XSS filtering','Cable management','Power distribution'], answer:[0,2], explanation:'WAFs prevent SQL injection and filter XSS attacks at the application layer.', objective:'4.5' },
  { id:'t23', domain:'D5', type:'select-two', difficulty:3, question:'**SELECT TWO.** Which are required for GDPR compliance?', options:['Appoint Data Protection Officer','Use only symmetric encryption','Provide data breach notification within 72 hours','Use RAID for all data','Maintain physical-only backups'], answer:[0,2], explanation:'GDPR requires a DPO and 72-hour breach notification.', objective:'5.4' },
  { id:'t24', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are examples of fileless malware techniques?', options:['PowerShell script execution in memory','Installing a .exe file on disk','WMI persistence mechanisms','Creating a new file on the desktop','Modifying the boot sector'], answer:[0,2], explanation:'Fileless malware uses PowerShell and WMI to operate entirely in memory.', objective:'2.4' },
  { id:'t25', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are components of identity management?', options:['Provisioning','Firewalling','Authentication','VLAN tagging','Cable management'], answer:[0,2], explanation:'Identity management includes provisioning accounts and authenticating users.', objective:'4.6' },
  { id:'t26', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which resilience strategies protect against site-level disasters?', options:['Geographic dispersal','RAID arrays','Hot site availability','UPS systems','Port security'], answer:[0,2], explanation:'Geographic dispersal and hot sites protect against entire site failures.', objective:'3.4' },
  { id:'t27', domain:'D1', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are purposes of digital signatures?', options:['Authentication of the sender','Encrypting the message body','Integrity verification','Key exchange','Data compression'], answer:[0,2], explanation:'Digital signatures provide authentication (proving sender identity) and integrity verification.', objective:'1.4' },
  { id:'t28', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are types of security audits?', options:['Internal audit','Vulnerability scan','External audit','Penetration test','Risk register'], answer:[0,2], explanation:'Internal and external audits are the two main types of security audits.', objective:'5.5' },
  { id:'t29', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which data sources support digital forensic investigations?', options:['Network traffic captures','Marketing materials','System memory dumps','Office supply inventory','Cafeteria menus'], answer:[0,2], explanation:'Network captures and memory dumps are critical forensic evidence sources.', objective:'4.9' },
  { id:'t30', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are indicators of a DDoS attack?', options:['Sudden spike in traffic from many IPs','Single failed login attempt','Server response times dramatically increase','Password policy change','New user account created'], answer:[0,2], explanation:'Traffic spikes from many sources and degraded performance indicate DDoS.', objective:'2.4' },
  // Additional select-two to reach 50
  { id:'t31', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are benefits of using a CDN?', options:['DDoS mitigation','Direct database access','Reduced latency through edge caching','Increased LAN bandwidth','Physical security improvement'], answer:[0,2], explanation:'CDNs provide DDoS mitigation and reduced latency through distributed edge caching.', objective:'3.4' },
  { id:'t32', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are key features of SOAR platforms?', options:['Automated incident response workflows','Physical access management','Playbook-driven orchestration','Cable management','Lighting control'], answer:[0,2], explanation:'SOAR provides automated workflows and playbook-driven orchestration for security operations.', objective:'4.7' },
  { id:'t33', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are purposes of a risk assessment?', options:['Identify threats and vulnerabilities','Replace security controls','Evaluate impact and likelihood','Eliminate all risks','Guarantee system uptime'], answer:[0,2], explanation:'Risk assessment identifies threats/vulnerabilities and evaluates their impact and likelihood.', objective:'5.2' },
  { id:'t34', domain:'D1', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are components of AAA?', options:['Authentication','Automation','Accounting','Acceleration','Aggregation'], answer:[0,2], explanation:'AAA = Authentication, Authorization, and Accounting.', objective:'1.2' },
  { id:'t35', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are physical security threats?', options:['Tailgating through secure doors','SQL injection','Shoulder surfing credentials','Buffer overflow','DNS poisoning'], answer:[0,2], explanation:'Tailgating and shoulder surfing are physical security threats.', objective:'2.2' },
  { id:'t36', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are considerations for cloud data sovereignty?', options:['Data stored in specific geographic regions','Type of encryption algorithm used','Laws of the country where data resides','Speed of internet connection','Color of server cabinets'], answer:[0,2], explanation:'Data sovereignty concerns where data is stored geographically and applicable local laws.', objective:'3.1' },
  { id:'t37', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are benefits of security automation?', options:['Faster incident response times','Elimination of all false positives','Consistent execution of repetitive tasks','No need for security staff','Physical security improvement'], answer:[0,2], explanation:'Automation speeds response and ensures consistent execution of repetitive tasks.', objective:'4.7' },
  { id:'t38', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are elements of an incident response plan?', options:['Communication procedures','Office renovation schedule','Escalation paths','Cafeteria menu','Parking policy'], answer:[0,2], explanation:'IR plans include communication procedures and escalation paths.', objective:'5.1' },
  { id:'t39', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are types of password attacks?', options:['Dictionary attack','DDoS','Rainbow table attack','ARP spoofing','DNS poisoning'], answer:[0,2], explanation:'Dictionary attacks and rainbow table attacks are password-specific attack types.', objective:'2.4' },
  { id:'t40', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are physical security controls for a data center?', options:['Biometric access controls','Software firewalls','Environmental monitoring (temp/humidity)','Antivirus software','VPN'], answer:[0,2], explanation:'Biometric access and environmental monitoring are physical data center controls.', objective:'3.1' },
  { id:'t41', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are digital forensic data sources?', options:['Volatile memory (RAM)','Annual budget reports','Hard drive forensic images','Office supply requisitions','Lunch menus'], answer:[0,2], explanation:'RAM contents and forensic disk images are critical digital forensic data sources.', objective:'4.9' },
  { id:'t42', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are key components of security compliance?', options:['Regulatory adherence','Marketing strategy','Policy enforcement','Product design','Sales targets'], answer:[0,2], explanation:'Compliance requires adhering to regulations and enforcing internal policies.', objective:'5.4' },
  { id:'t43', domain:'D1', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are examples of preventive controls?', options:['Firewall rules blocking traffic','IDS alerts','Encryption of data at rest','Log monitoring','Security cameras'], answer:[0,2], explanation:'Firewall rules and encryption are preventive — they stop threats before they occur.', objective:'1.1' },
  { id:'t44', domain:'D2', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are characteristics of worms?', options:['Self-replication without user interaction','Requires user to open email attachment','Can spread across network shares automatically','Only affects mobile devices','Requires physical access'], answer:[0,2], explanation:'Worms self-replicate and spread across networks without user interaction.', objective:'2.4' },
  { id:'t45', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are methods to protect data in transit?', options:['TLS encryption','Full disk encryption','VPN tunneling','Data masking at rest','File-level encryption on storage'], answer:[0,2], explanation:'TLS and VPN tunneling protect data while it moves across networks.', objective:'3.3' },
  { id:'t46', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are vulnerability management activities?', options:['Regular vulnerability scanning','Annual holiday party planning','Patch management','Office remodeling','Cafeteria operations'], answer:[0,2], explanation:'Vulnerability scanning and patch management are core vulnerability management activities.', objective:'4.3' },
  { id:'t47', domain:'D5', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which contribute to calculating ALE?', options:['Single Loss Expectancy (SLE)','Number of employees','Annual Rate of Occurrence (ARO)','Office square footage','Internet bandwidth'], answer:[0,2], explanation:'ALE = SLE × ARO. Both are required for the calculation.', objective:'5.2' },
  { id:'t48', domain:'D1', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are key exchange protocols?', options:['Diffie-Hellman','SHA-256','ECDHE','MD5','AES'], answer:[0,2], explanation:'Diffie-Hellman and ECDHE are key exchange protocols for establishing shared secrets.', objective:'1.4' },
  { id:'t49', domain:'D3', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which provide high availability?', options:['Active-active clustering','Single server deployment','Load balancing across multiple servers','Air-gapped network','Manual failover'], answer:[0,2], explanation:'Active-active clusters and load balancing provide high availability.', objective:'3.4' },
  { id:'t50', domain:'D4', type:'select-two', difficulty:2, question:'**SELECT TWO.** Which are MDM security features?', options:['Remote wipe capability','DNS resolution','Application allowlisting','VLAN management','QoS configuration'], answer:[0,2], explanation:'Remote wipe and application allowlisting are core MDM security features.', objective:'4.1' },
];

/* =================================================================
   PBQ BANK — 50+ Performance-Based Questions
   ================================================================= */

export const pbqBank: PBQuestion[] = [
  // ── TYPE 1: FIREWALL ACL ──
  {
    id:'pbq-fw1', domain:'D4', difficulty:2, type:'firewall',
    title:'Configure DMZ Firewall Rules',
    scenario:'A company hosts a public web server (10.0.1.50) in a DMZ. Configure firewall rules:\n• Allow HTTP and HTTPS from the internet\n• Allow SSH only from management network (192.168.1.0/24)\n• Deny MySQL (3306) and Telnet (23) from all sources',
    rules:[
      { ruleId:1, sourceIP:'Any', destIP:'10.0.1.50', port:'80', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'Any', destIP:'10.0.1.50', port:'443', protocol:'TCP', action:'' },
      { ruleId:3, sourceIP:'192.168.1.0/24', destIP:'10.0.1.50', port:'22', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'Any', destIP:'10.0.1.50', port:'3306', protocol:'TCP', action:'' },
      { ruleId:5, sourceIP:'Any', destIP:'10.0.1.50', port:'23', protocol:'TCP', action:'' },
    ],
    correctActions:['ALLOW','ALLOW','ALLOW','DENY','DENY'],
    explanation:'HTTP (80) and HTTPS (443) must be allowed for public web access. SSH (22) allowed only from management. MySQL (3306) and Telnet (23) should always be denied externally.',
    objective:'4.5',
  },
  {
    id:'pbq-fw2', domain:'D4', difficulty:2, type:'firewall',
    title:'Configure Stateful Firewall Rules',
    scenario:'DMZ: File Server (10.1.1.3), Video Server (10.1.1.7), Web Server (10.1.1.2)\nInternal: Storage (10.2.1.33), Management (10.2.1.47), Database (10.2.1.20)\n\n• Block HTTP between Web Server and Database\n• Allow HTTPS from Storage to Video Server\n• Allow SSH from Management to File Server',
    rules:[
      { ruleId:1, sourceIP:'10.1.1.2', destIP:'10.2.1.20', port:'80', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'10.2.1.33', destIP:'10.1.1.7', port:'443', protocol:'TCP', action:'' },
      { ruleId:3, sourceIP:'10.2.1.47', destIP:'10.1.1.3', port:'22', protocol:'TCP', action:'' },
    ],
    correctActions:['DENY','ALLOW','ALLOW'],
    explanation:'Block HTTP from Web→DB to prevent direct access. Allow HTTPS from Storage→Video for secure transfers. Allow SSH from Management→File for admin access.',
    objective:'4.5',
  },
  {
    id:'pbq-fw3', domain:'D3', difficulty:2, type:'firewall',
    title:'Segment Internal Network Traffic',
    scenario:'HR (10.10.0.0/24), Finance file server (10.20.0.10), Engineering (10.30.0.0/24), DNS (10.0.0.53)\n\n• HR needs Finance file server on port 445\n• Engineering must NOT access HR or Finance\n• All VLANs can access DNS (port 53)\n• Finance must not have blanket access to HR',
    rules:[
      { ruleId:1, sourceIP:'10.10.0.0/24', destIP:'10.20.0.10', port:'445', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'10.30.0.0/24', destIP:'10.10.0.0/24', port:'Any', protocol:'Any', action:'' },
      { ruleId:3, sourceIP:'10.30.0.0/24', destIP:'10.20.0.0/24', port:'Any', protocol:'Any', action:'' },
      { ruleId:4, sourceIP:'Any', destIP:'10.0.0.53', port:'53', protocol:'UDP', action:'' },
      { ruleId:5, sourceIP:'10.20.0.0/24', destIP:'10.10.0.0/24', port:'Any', protocol:'Any', action:'' },
    ],
    correctActions:['ALLOW','DENY','DENY','ALLOW','DENY'],
    explanation:'HR needs file sharing to Finance. Engineering must be isolated. DNS is shared. Finance should not have blanket access to HR.',
    objective:'3.2',
  },
  {
    id:'pbq-fw4', domain:'D4', difficulty:3, type:'firewall',
    title:'Secure IoT Network Traffic',
    scenario:'IoT VLAN (10.50.0.0/24), Cloud gateway (10.0.1.100), Corporate LAN (10.10.0.0/16), Management (10.10.1.50), NTP (10.0.0.123)\n\n• IoT → Cloud gateway on MQTT (1883/TCP): Allow\n• IoT → Corporate LAN: Deny\n• Management → IoT on SSH (22): Allow\n• IoT → IoT communication: Deny\n• IoT → NTP server on port 123/UDP: Allow',
    rules:[
      { ruleId:1, sourceIP:'10.50.0.0/24', destIP:'10.0.1.100', port:'1883', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'10.50.0.0/24', destIP:'10.10.0.0/16', port:'Any', protocol:'Any', action:'' },
      { ruleId:3, sourceIP:'10.10.1.50', destIP:'10.50.0.0/24', port:'22', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'10.50.0.0/24', destIP:'10.50.0.0/24', port:'Any', protocol:'Any', action:'' },
      { ruleId:5, sourceIP:'10.50.0.0/24', destIP:'10.0.0.123', port:'123', protocol:'UDP', action:'' },
    ],
    correctActions:['ALLOW','DENY','ALLOW','DENY','ALLOW'],
    explanation:'IoT needs MQTT to cloud. IoT isolated from corporate. Management can SSH. No IoT-to-IoT (prevents lateral movement). NTP for time sync.',
    objective:'4.5',
  },
  {
    id:'pbq-fw5', domain:'D3', difficulty:2, type:'firewall',
    title:'Secure E-Commerce Platform',
    scenario:'E-commerce server (10.0.2.100), Payment gateway (10.0.3.50), Database (10.0.4.20)\n\n• Allow HTTPS (443) from any to e-commerce\n• Allow HTTP (80) for redirect to HTTPS\n• Allow payment gateway (8443) from e-commerce only\n• Deny direct DB access (3306) from web tier\n• Deny SNMP (161) from internet',
    rules:[
      { ruleId:1, sourceIP:'Any', destIP:'10.0.2.100', port:'443', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'Any', destIP:'10.0.2.100', port:'80', protocol:'TCP', action:'' },
      { ruleId:3, sourceIP:'10.0.2.100', destIP:'10.0.3.50', port:'8443', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'10.0.2.100', destIP:'10.0.4.20', port:'3306', protocol:'TCP', action:'' },
      { ruleId:5, sourceIP:'Any', destIP:'10.0.2.100', port:'161', protocol:'UDP', action:'' },
    ],
    correctActions:['ALLOW','ALLOW','ALLOW','DENY','DENY'],
    explanation:'HTTPS required. HTTP allowed for redirect. Payment from e-commerce only. No direct DB from web. SNMP from internet exposes management.',
    objective:'3.2',
  },
  {
    id:'pbq-fw6', domain:'D5', difficulty:3, type:'firewall',
    title:'Secure Healthcare Network (HIPAA)',
    scenario:'EHR server (172.16.10.50), Clinical workstations (172.16.20.0/24), Integration engine (172.16.10.100), Backup (172.16.30.10)\n\n• Allow HTTPS (443) from clinical workstations\n• Deny HTTP (80) from all (HIPAA requires encryption)\n• Allow HL7 FHIR API (8443) from integration engine\n• Deny RDP (3389) from internet\n• Allow backup server on port 445',
    rules:[
      { ruleId:1, sourceIP:'172.16.20.0/24', destIP:'172.16.10.50', port:'443', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'Any', destIP:'172.16.10.50', port:'80', protocol:'TCP', action:'' },
      { ruleId:3, sourceIP:'172.16.10.100', destIP:'172.16.10.50', port:'8443', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'Any', destIP:'172.16.10.50', port:'3389', protocol:'TCP', action:'' },
      { ruleId:5, sourceIP:'172.16.30.10', destIP:'172.16.10.50', port:'445', protocol:'TCP', action:'' },
    ],
    correctActions:['ALLOW','DENY','ALLOW','DENY','ALLOW'],
    explanation:'HTTPS from clinical workstations. No HTTP (HIPAA). HL7 from integration engine. No RDP from internet. Backup needs file share.',
    objective:'5.4',
  },
  // More firewall PBQs
  {
    id:'pbq-fw7', domain:'D4', difficulty:2, type:'firewall',
    title:'Secure VPN Concentrator Rules',
    scenario:'VPN concentrator (10.0.0.1):\n• Accept OpenVPN (1194/UDP) from any\n• Accept SSL VPN (443/TCP) from any\n• Deny RDP (3389) from internet\n• Allow DNS (53/UDP) from VPN clients (10.8.0.0/24) only\n• Deny FTP (21) from all',
    rules:[
      { ruleId:1, sourceIP:'Any', destIP:'10.0.0.1', port:'1194', protocol:'UDP', action:'' },
      { ruleId:2, sourceIP:'Any', destIP:'10.0.0.1', port:'443', protocol:'TCP', action:'' },
      { ruleId:3, sourceIP:'Any', destIP:'Any', port:'3389', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'10.8.0.0/24', destIP:'10.0.0.53', port:'53', protocol:'UDP', action:'' },
      { ruleId:5, sourceIP:'Any', destIP:'Any', port:'21', protocol:'TCP', action:'' },
    ],
    correctActions:['ALLOW','ALLOW','DENY','ALLOW','DENY'],
    explanation:'VPN protocols must be allowed. RDP from internet is dangerous. DNS from VPN clients only. FTP transmits in cleartext.',
    objective:'4.5',
  },
  {
    id:'pbq-fw8', domain:'D4', difficulty:2, type:'firewall',
    title:'Protect DNS/DHCP Infrastructure',
    scenario:'DNS server (10.0.5.53), Internal hosts (192.168.0.0/16), Secondary DNS (10.0.5.54)\n\n• DNS queries (53/UDP) from internal only\n• DHCP (67-68/UDP) from internal only\n• Zone transfer (53/TCP) between DNS servers only\n• Deny Telnet (23) from all\n• Deny FTP (21) from all',
    rules:[
      { ruleId:1, sourceIP:'192.168.0.0/16', destIP:'10.0.5.53', port:'53', protocol:'UDP', action:'' },
      { ruleId:2, sourceIP:'192.168.0.0/16', destIP:'10.0.5.53', port:'67-68', protocol:'UDP', action:'' },
      { ruleId:3, sourceIP:'10.0.5.54', destIP:'10.0.5.53', port:'53', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'Any', destIP:'10.0.5.53', port:'23', protocol:'TCP', action:'' },
      { ruleId:5, sourceIP:'Any', destIP:'10.0.5.53', port:'21', protocol:'TCP', action:'' },
    ],
    correctActions:['ALLOW','ALLOW','ALLOW','DENY','DENY'],
    explanation:'DNS from internal only. DHCP from internal. Zone transfers between DNS servers via TCP. Telnet and FTP always denied.',
    objective:'4.5',
  },
  {
    id:'pbq-fw9', domain:'D3', difficulty:3, type:'firewall',
    title:'Container Security Groups',
    scenario:'API gateway (172.17.0.10), DB (172.17.0.20), Monitoring (172.17.0.30), LB (10.0.0.5), Mgmt (10.0.0.100)\n\n• API gateway accepts 8080/TCP from LB only\n• DB (5432) not accessible from internet\n• Inter-service traffic on 8443/TCP allowed\n• SSH to containers from internet denied\n• Monitoring (9090) from management only',
    rules:[
      { ruleId:1, sourceIP:'10.0.0.5', destIP:'172.17.0.10', port:'8080', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'Any', destIP:'172.17.0.20', port:'5432', protocol:'TCP', action:'' },
      { ruleId:3, sourceIP:'172.17.0.0/16', destIP:'172.17.0.0/16', port:'8443', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'Any', destIP:'172.17.0.0/16', port:'22', protocol:'TCP', action:'' },
      { ruleId:5, sourceIP:'10.0.0.100', destIP:'172.17.0.30', port:'9090', protocol:'TCP', action:'' },
    ],
    correctActions:['ALLOW','DENY','ALLOW','DENY','ALLOW'],
    explanation:'API from LB only. DB never from internet. Inter-service on secure port. No SSH from internet. Monitoring from management.',
    objective:'3.2',
  },
  {
    id:'pbq-fw10', domain:'D3', difficulty:2, type:'firewall',
    title:'Cloud Web Application Security Groups',
    scenario:'Web tier security group:\n• Allow HTTP/HTTPS from 0.0.0.0/0\n• Deny SSH from 0.0.0.0/0\n• Allow SSH from bastion host (10.0.1.5/32)\n• Deny MySQL (3306) from any\n• Allow health checks from LB subnet (10.0.2.0/24) on 8080',
    rules:[
      { ruleId:1, sourceIP:'0.0.0.0/0', destIP:'Web-SG', port:'80,443', protocol:'TCP', action:'' },
      { ruleId:2, sourceIP:'0.0.0.0/0', destIP:'Web-SG', port:'22', protocol:'TCP', action:'' },
      { ruleId:3, sourceIP:'10.0.1.5/32', destIP:'Web-SG', port:'22', protocol:'TCP', action:'' },
      { ruleId:4, sourceIP:'Any', destIP:'Web-SG', port:'3306', protocol:'TCP', action:'' },
      { ruleId:5, sourceIP:'10.0.2.0/24', destIP:'Web-SG', port:'8080', protocol:'TCP', action:'' },
    ],
    correctActions:['ALLOW','DENY','ALLOW','DENY','ALLOW'],
    explanation:'Web traffic from anywhere. SSH blocked from internet, allowed from bastion. No MySQL to web tier. Health checks from LB.',
    objective:'3.2',
  },

  // ── TYPE 2: INCIDENT RESPONSE ORDERING ──
  {
    id:'pbq-ir1', domain:'D4', difficulty:1, type:'ordering',
    title:'Order Incident Response Steps',
    scenario:'A security breach has been detected at your organization. Arrange the incident response steps in the correct order according to NIST SP 800-61.',
    steps:[
      { label:'Preparation', correctPosition:0 },
      { label:'Detection & Analysis', correctPosition:1 },
      { label:'Containment', correctPosition:2 },
      { label:'Eradication', correctPosition:3 },
      { label:'Recovery', correctPosition:4 },
      { label:'Post-Incident Activity (Lessons Learned)', correctPosition:5 },
    ],
    explanation:'NIST 800-61: Preparation establishes policies. Detection identifies incidents. Containment limits damage. Eradication removes threats. Recovery restores systems. Lessons learned documents improvements.',
    objective:'4.8',
  },
  {
    id:'pbq-ir2', domain:'D4', difficulty:2, type:'ordering',
    title:'Order Vulnerability Management Steps',
    scenario:'Your security team is establishing a vulnerability management program. Arrange the steps in the correct order.',
    steps:[
      { label:'Asset Discovery & Inventory', correctPosition:0 },
      { label:'Vulnerability Scanning', correctPosition:1 },
      { label:'Risk Assessment (CVSS Scoring)', correctPosition:2 },
      { label:'Prioritization & Remediation Planning', correctPosition:3 },
      { label:'Patch Deployment / Mitigation', correctPosition:4 },
      { label:'Validation & Rescanning', correctPosition:5 },
    ],
    explanation:'Discover assets → Scan → Assess risk → Prioritize → Deploy patches → Validate fixes.',
    objective:'4.3',
  },
  {
    id:'pbq-ir3', domain:'D4', difficulty:2, type:'ordering',
    title:'Order Digital Forensics Process',
    scenario:'Your organization needs to investigate a potential data breach. Arrange the digital forensics steps in order.',
    steps:[
      { label:'Identify and secure the scene', correctPosition:0 },
      { label:'Document all evidence and environment', correctPosition:1 },
      { label:'Collect and acquire forensic images', correctPosition:2 },
      { label:'Preserve chain of custody documentation', correctPosition:3 },
      { label:'Analyze evidence using forensic tools', correctPosition:4 },
      { label:'Report findings and conclusions', correctPosition:5 },
    ],
    explanation:'Secure scene → Document → Collect evidence → Maintain chain of custody → Analyze → Report.',
    objective:'4.9',
  },
  {
    id:'pbq-ir4', domain:'D1', difficulty:2, type:'ordering',
    title:'Order Change Management Process',
    scenario:'Your organization is implementing a formal change management process. Arrange the steps.',
    steps:[
      { label:'Submit change request with business justification', correctPosition:0 },
      { label:'Perform impact assessment and risk analysis', correctPosition:1 },
      { label:'Obtain approval from Change Advisory Board (CAB)', correctPosition:2 },
      { label:'Test changes in staging environment', correctPosition:3 },
      { label:'Implement change during maintenance window', correctPosition:4 },
      { label:'Conduct post-implementation review', correctPosition:5 },
    ],
    explanation:'Request → Assess impact → Get CAB approval → Test in staging → Implement in production → Review results.',
    objective:'1.3',
  },
  {
    id:'pbq-ir5', domain:'D4', difficulty:2, type:'ordering',
    title:'Order Secure SDLC Phases',
    scenario:'Arrange the secure software development lifecycle phases in the correct order.',
    steps:[
      { label:'Requirements gathering and security planning', correctPosition:0 },
      { label:'Threat modeling and secure design review', correctPosition:1 },
      { label:'Secure coding practices implementation', correctPosition:2 },
      { label:'Static and dynamic analysis testing (SAST/DAST)', correctPosition:3 },
      { label:'Security regression and penetration testing', correctPosition:4 },
      { label:'Deployment, monitoring, and patch management', correctPosition:5 },
    ],
    explanation:'Requirements → Threat model → Secure coding → SAST/DAST → Pen testing → Deploy with monitoring.',
    objective:'4.1',
  },
  {
    id:'pbq-ir6', domain:'D1', difficulty:2, type:'ordering',
    title:'Order PKI Certificate Lifecycle',
    scenario:'A security engineer needs to deploy a new SSL certificate. Arrange the PKI lifecycle steps.',
    steps:[
      { label:'Generate asymmetric key pair', correctPosition:0 },
      { label:'Submit Certificate Signing Request (CSR)', correctPosition:1 },
      { label:'Certificate Authority validates identity', correctPosition:2 },
      { label:'CA issues signed digital certificate', correctPosition:3 },
      { label:'Deploy certificate to server/service', correctPosition:4 },
      { label:'Monitor expiration and renew or revoke', correctPosition:5 },
    ],
    explanation:'Generate keys → Submit CSR → CA validates → CA issues cert → Deploy → Monitor and renew.',
    objective:'1.4',
  },
  {
    id:'pbq-ir7', domain:'D5', difficulty:2, type:'ordering',
    title:'Order Business Continuity Planning Steps',
    scenario:'The organization is developing a business continuity plan. Arrange the BCP steps.',
    steps:[
      { label:'Conduct business impact analysis (BIA)', correctPosition:0 },
      { label:'Identify critical business functions', correctPosition:1 },
      { label:'Determine RTO and RPO objectives', correctPosition:2 },
      { label:'Develop continuity strategies', correctPosition:3 },
      { label:'Create and document the BC plan', correctPosition:4 },
      { label:'Test, exercise, and maintain the plan', correctPosition:5 },
    ],
    explanation:'BIA → Identify critical functions → Set RTO/RPO → Develop strategies → Document plan → Test regularly.',
    objective:'5.2',
  },
  {
    id:'pbq-ir8', domain:'D4', difficulty:2, type:'ordering',
    title:'Order Evidence Collection by Volatility',
    scenario:'During a forensic investigation, evidence must be collected in order of volatility (most volatile first).',
    steps:[
      { label:'CPU registers and cache', correctPosition:0 },
      { label:'RAM (system memory)', correctPosition:1 },
      { label:'Network connections and routing tables', correctPosition:2 },
      { label:'Running processes and open files', correctPosition:3 },
      { label:'Hard drive contents', correctPosition:4 },
      { label:'Backup media and archived data', correctPosition:5 },
    ],
    explanation:'Most volatile first: CPU state → RAM → Network state → Processes → Disk → Backups. Volatile data disappears when power is lost.',
    objective:'4.9',
  },
  {
    id:'pbq-ir9', domain:'D5', difficulty:2, type:'ordering',
    title:'Order Risk Assessment Process',
    scenario:'Arrange the risk assessment steps in the correct order per NIST SP 800-30.',
    steps:[
      { label:'Identify and categorize assets', correctPosition:0 },
      { label:'Identify threats and vulnerabilities', correctPosition:1 },
      { label:'Determine likelihood and impact', correctPosition:2 },
      { label:'Calculate risk score (likelihood × impact)', correctPosition:3 },
      { label:'Select risk treatment (accept, mitigate, transfer, avoid)', correctPosition:4 },
      { label:'Document findings in risk register', correctPosition:5 },
    ],
    explanation:'Identify assets → Identify threats → Assess likelihood/impact → Calculate risk → Select treatment → Document.',
    objective:'5.2',
  },
  {
    id:'pbq-ir10', domain:'D4', difficulty:2, type:'ordering',
    title:'Order Incident Escalation Path',
    scenario:'An analyst detects a potential data breach. Arrange the correct escalation order.',
    steps:[
      { label:'Verify and validate the alert (rule out false positive)', correctPosition:0 },
      { label:'Document initial findings and gather evidence', correctPosition:1 },
      { label:'Escalate to Incident Response Team lead', correctPosition:2 },
      { label:'Notify CISO and legal counsel', correctPosition:3 },
      { label:'Engage external forensics if needed', correctPosition:4 },
      { label:'Notify affected parties and regulators per policy', correctPosition:5 },
    ],
    explanation:'Validate → Document → Escalate to IRT → Notify executives → Engage external help → Notify stakeholders.',
    objective:'4.8',
  },

  // ── TYPE 3: LOG ANALYSIS ──
  {
    id:'pbq-log1', domain:'D4', difficulty:2, type:'log-analysis',
    title:'Analyze Apache Web Server Logs',
    scenario:'Your SIEM has flagged suspicious activity in the Apache access logs. Analyze the following log entries to identify the attack.',
    logEntries:[
      { line:'192.168.1.105 - - [15/Mar/2024:14:23:01] "GET /login.php?user=admin\'%20OR%20\'1\'=\'1 HTTP/1.1" 200 4521' },
      { line:'192.168.1.105 - - [15/Mar/2024:14:23:03] "GET /login.php?user=admin\'%20UNION%20SELECT%20*%20FROM%20users HTTP/1.1" 200 8932' },
      { line:'192.168.1.105 - - [15/Mar/2024:14:23:05] "GET /login.php?user=admin\';DROP%20TABLE%20users;-- HTTP/1.1" 500 234' },
      { line:'192.168.1.105 - - [15/Mar/2024:14:23:07] "GET /admin/dashboard.php HTTP/1.1" 200 12044' },
    ],
    attackTypeOptions:['Brute Force','SQL Injection','DDoS','Reconnaissance/Port Scan','Cross-Site Scripting','Credential Stuffing'],
    correctAttackType:'SQL Injection',
    sourceIPOptions:['10.0.0.1','192.168.1.105','172.16.0.1','192.168.1.1'],
    correctSourceIP:'192.168.1.105',
    responseOptions:['Block the source IP at the firewall and implement input validation','Increase server RAM','Restart the web server','Change the admin password only'],
    correctResponse:0,
    explanation:'The log shows classic SQL injection: OR \'1\'=\'1, UNION SELECT, and DROP TABLE attempts from 192.168.1.105. Immediate response: block the IP and implement parameterized queries/input validation.',
    objective:'4.9',
  },
  {
    id:'pbq-log2', domain:'D4', difficulty:2, type:'log-analysis',
    title:'Analyze Authentication Logs',
    scenario:'The authentication server logs show unusual activity overnight. Review the following entries.',
    logEntries:[
      { line:'2024-03-15 02:14:01 FAIL user=root src=10.20.30.40 proto=SSH attempts=1' },
      { line:'2024-03-15 02:14:02 FAIL user=root src=10.20.30.40 proto=SSH attempts=2' },
      { line:'2024-03-15 02:14:03 FAIL user=root src=10.20.30.40 proto=SSH attempts=50' },
      { line:'2024-03-15 02:17:44 FAIL user=root src=10.20.30.40 proto=SSH attempts=445' },
      { line:'2024-03-15 02:17:45 SUCCESS user=root src=10.20.30.40 proto=SSH' },
    ],
    attackTypeOptions:['SQL Injection','Brute Force','DDoS','Reconnaissance','Credential Stuffing','C2 Callback'],
    correctAttackType:'Brute Force',
    sourceIPOptions:['192.168.1.1','10.20.30.40','172.16.0.5','10.0.0.1'],
    correctSourceIP:'10.20.30.40',
    responseOptions:['Disable the root account, block the IP, and require key-based SSH authentication','Install a new hard drive','Increase password length only','Restart the SSH service'],
    correctResponse:0,
    explanation:'445 failed attempts followed by success = brute force. Source: 10.20.30.40. Response: disable root SSH, block IP, implement key-based auth.',
    objective:'4.9',
  },
  {
    id:'pbq-log3', domain:'D4', difficulty:3, type:'log-analysis',
    title:'Analyze Firewall Denial Logs',
    scenario:'The perimeter firewall is showing a spike in denied connections. Review the log entries.',
    logEntries:[
      { line:'2024-03-15 08:00:01 DENY src=203.0.113.50 dst=10.0.1.100 proto=TCP dport=80 SYN' },
      { line:'2024-03-15 08:00:01 DENY src=198.51.100.22 dst=10.0.1.100 proto=TCP dport=80 SYN' },
      { line:'2024-03-15 08:00:01 DENY src=192.0.2.15 dst=10.0.1.100 proto=TCP dport=80 SYN' },
      { line:'2024-03-15 08:00:02 DENY src=203.0.113.51 dst=10.0.1.100 proto=TCP dport=80 SYN' },
      { line:'[...10,000+ SYN packets/sec from 200+ unique source IPs...]' },
    ],
    attackTypeOptions:['Brute Force','SQL Injection','DDoS/SYN Flood','Reconnaissance','Credential Stuffing','C2 Callback'],
    correctAttackType:'DDoS/SYN Flood',
    sourceIPOptions:['10.0.1.100','Multiple external IPs (200+)','192.168.1.1','127.0.0.1'],
    correctSourceIP:'Multiple external IPs (200+)',
    responseOptions:['Enable SYN cookies, rate-limit at firewall, and engage upstream DDoS mitigation','Restart the firewall','Add more RAM to the web server','Change the web server IP address'],
    correctResponse:0,
    explanation:'10,000+ SYN packets/sec from 200+ IPs = DDoS SYN flood. Enable SYN cookies, rate-limit, and use upstream DDoS protection.',
    objective:'4.9',
  },
  {
    id:'pbq-log4', domain:'D4', difficulty:2, type:'log-analysis',
    title:'Analyze IDS Alert Logs',
    scenario:'Your IDS has generated several alerts. Review the entries to identify the attack pattern.',
    logEntries:[
      { line:'[Priority:1] ET SCAN Nmap SYN Scan {TCP} 10.0.0.50:random -> 10.0.1.100:22' },
      { line:'[Priority:1] ET SCAN Nmap SYN Scan {TCP} 10.0.0.50:random -> 10.0.1.100:80' },
      { line:'[Priority:1] ET SCAN Nmap SYN Scan {TCP} 10.0.0.50:random -> 10.0.1.100:443' },
      { line:'[Priority:1] ET SCAN Nmap SYN Scan {TCP} 10.0.0.50:random -> 10.0.1.100:3389' },
      { line:'[Priority:2] ET SCAN Nmap OS Detection {TCP} 10.0.0.50 -> 10.0.1.100' },
    ],
    attackTypeOptions:['Brute Force','SQL Injection','DDoS','Reconnaissance/Port Scan','XSS','Credential Stuffing'],
    correctAttackType:'Reconnaissance/Port Scan',
    sourceIPOptions:['10.0.1.100','10.0.0.50','192.168.1.1','0.0.0.0'],
    correctSourceIP:'10.0.0.50',
    responseOptions:['Investigate the source host, block if unauthorized, and review for further intrusion attempts','Delete the IDS logs','Reboot the target server','Ignore — port scans are normal'],
    correctResponse:0,
    explanation:'Nmap SYN scans across multiple ports + OS detection = reconnaissance. Source: 10.0.0.50. Investigate and block if unauthorized.',
    objective:'4.9',
  },
  {
    id:'pbq-log5', domain:'D4', difficulty:3, type:'log-analysis',
    title:'Analyze Windows Event Logs',
    scenario:'The Windows Security Event Log shows suspicious activity on a domain controller.',
    logEntries:[
      { line:'Event 4625 - Logon Failure: User=svc_backup Src=10.10.10.99 Status=0xC000006A (bad password)' },
      { line:'Event 4625 - Logon Failure: User=svc_backup Src=10.10.10.99 Status=0xC000006A x47 times' },
      { line:'Event 4624 - Logon Success: User=svc_backup Src=10.10.10.99 Logon Type 10 (RemoteInteractive)' },
      { line:'Event 4732 - Member Added to Security-Enabled Group: User=svc_backup Group=Domain Admins' },
    ],
    attackTypeOptions:['Brute Force','SQL Injection','DDoS','Reconnaissance','Credential Stuffing','Privilege Escalation'],
    correctAttackType:'Privilege Escalation',
    sourceIPOptions:['10.10.10.99','192.168.1.1','10.0.0.1','172.16.0.1'],
    correctSourceIP:'10.10.10.99',
    responseOptions:['Remove svc_backup from Domain Admins, disable the account, block the source IP, and investigate for persistence mechanisms','Change the password only','Restart the domain controller','Increase audit log retention'],
    correctResponse:0,
    explanation:'Brute-forced svc_backup → RDP login → added to Domain Admins = privilege escalation. Immediate: remove from DA, disable, block IP, check for persistence.',
    objective:'4.9',
  },

  // ── TYPE 4: CRYPTOGRAPHY MATCHING ──
  {
    id:'pbq-match1', domain:'D1', difficulty:2, type:'matching',
    title:'Match Cryptographic Algorithms to Use Cases',
    scenario:'Match each use case on the left with the BEST cryptographic algorithm on the right. Each algorithm can only be used once.',
    items:[
      { left:'Encrypt bulk data at rest', correctRight:'AES' },
      { left:'Verify file integrity', correctRight:'SHA-256' },
      { left:'Securely exchange keys over insecure channel', correctRight:'Diffie-Hellman' },
      { left:'Digitally sign an email', correctRight:'RSA' },
      { left:'Encrypt small data for transmission', correctRight:'ECC' },
    ],
    rightOptions:['AES','RSA','SHA-256','HMAC','Diffie-Hellman','ECC','MD5','3DES'],
    explanation:'AES for bulk symmetric encryption. SHA-256 for hashing/integrity. DH for key exchange. RSA for digital signatures. ECC for efficient asymmetric encryption.',
    objective:'1.4',
  },
  {
    id:'pbq-match2', domain:'D2', difficulty:2, type:'matching',
    title:'Match Attack Descriptions to Types',
    scenario:'Match each description with the most accurate attack type. Not all attack types will be used.',
    items:[
      { left:'Attacker obtains bank details by calling the victim', correctRight:'Vishing' },
      { left:'Attacker accesses a database from a web browser', correctRight:'Injection' },
      { left:'Attacker intercepts client-server communication', correctRight:'On-path' },
      { left:'Multiple attackers overwhelm a web server', correctRight:'DDoS' },
      { left:'Attacker captures all login credentials typed in 24 hours', correctRight:'Keylogger' },
    ],
    rightOptions:['Vishing','Injection','On-path','DDoS','Keylogger','RFID Cloning','Rootkit','Supply Chain'],
    explanation:'Vishing = phone phishing. Injection = database exploitation via web. On-path = MitM interception. DDoS = distributed denial of service. Keylogger = credential capture.',
    objective:'2.4',
  },
  {
    id:'pbq-match3', domain:'D4', difficulty:2, type:'matching',
    title:'Match Authentication Factors',
    scenario:'Match each description with the correct authentication factor type.',
    items:[
      { left:'Phone receives a text with a one-time passcode', correctRight:'Something you have' },
      { left:'Enter your PIN to make a deposit at ATM', correctRight:'Something you know' },
      { left:'Fingerprint unlocks the data center door', correctRight:'Something you are' },
      { left:'Login only works when connected to VPN', correctRight:'Somewhere you are' },
    ],
    rightOptions:['Something you know','Something you have','Something you are','Somewhere you are'],
    explanation:'Phone = something you have. PIN = something you know. Fingerprint = something you are. VPN/location = somewhere you are.',
    objective:'4.6',
  },
  {
    id:'pbq-match4', domain:'D3', difficulty:2, type:'matching',
    title:'Match Wi-Fi Security Standards',
    scenario:'Match each Wi-Fi security standard to its correct description.',
    items:[
      { left:'WPA3-Enterprise', correctRight:'192-bit security with 802.1X authentication' },
      { left:'WPA2-PSK', correctRight:'Pre-shared key with AES-CCMP encryption' },
      { left:'WPA3-SAE', correctRight:'Simultaneous Authentication of Equals for personal use' },
      { left:'WEP', correctRight:'Deprecated protocol with RC4 stream cipher' },
      { left:'802.1X', correctRight:'Port-based network access control framework' },
    ],
    rightOptions:['192-bit security with 802.1X authentication','Pre-shared key with AES-CCMP encryption','Simultaneous Authentication of Equals for personal use','Deprecated protocol with RC4 stream cipher','Port-based network access control framework'],
    explanation:'WPA3-Enterprise = strongest. WPA2-PSK = shared passphrase. WPA3-SAE = improved personal. WEP = broken. 802.1X = auth framework.',
    objective:'3.2',
  },
  {
    id:'pbq-match5', domain:'D1', difficulty:2, type:'matching',
    title:'Match Encryption Modes & Applications',
    scenario:'Match each encryption mode to its correct description.',
    items:[
      { left:'AES-GCM', correctRight:'Authenticated encryption with associated data' },
      { left:'AES-CBC', correctRight:'Block cipher requiring initialization vector' },
      { left:'ChaCha20-Poly1305', correctRight:'Stream cipher used in TLS 1.3 and WireGuard' },
      { left:'RSA-OAEP', correctRight:'Asymmetric encryption with optimal padding' },
      { left:'AES-XTS', correctRight:'Encryption mode for full disk encryption' },
    ],
    rightOptions:['Authenticated encryption with associated data','Block cipher requiring initialization vector','Stream cipher used in TLS 1.3 and WireGuard','Asymmetric encryption with optimal padding','Encryption mode for full disk encryption'],
    explanation:'GCM = authenticated encryption. CBC = IV-based block cipher. ChaCha20 = TLS 1.3 stream cipher. RSA-OAEP = padded asymmetric. XTS = disk encryption.',
    objective:'1.4',
  },
  {
    id:'pbq-match6', domain:'D5', difficulty:2, type:'matching',
    title:'Match Compliance Frameworks to Scope',
    scenario:'Match each compliance framework to what it regulates.',
    items:[
      { left:'PCI-DSS', correctRight:'Payment card industry data security' },
      { left:'HIPAA', correctRight:'US healthcare data protection' },
      { left:'GDPR', correctRight:'European personal data regulation' },
      { left:'SOX', correctRight:'US financial reporting and accounting controls' },
      { left:'FERPA', correctRight:'US student education records privacy' },
    ],
    rightOptions:['Payment card industry data security','US healthcare data protection','European personal data regulation','US financial reporting and accounting controls','US student education records privacy'],
    explanation:'PCI-DSS = cards. HIPAA = health data. GDPR = EU personal data. SOX = financial reporting. FERPA = student records.',
    objective:'5.4',
  },
  {
    id:'pbq-match7', domain:'D1', difficulty:2, type:'matching',
    title:'Match Security Frameworks',
    scenario:'Match each security framework to its correct description.',
    items:[
      { left:'NIST CSF', correctRight:'Risk-based framework: Identify, Protect, Detect, Respond, Recover' },
      { left:'ISO 27001', correctRight:'International standard for information security management' },
      { left:'CIS Controls', correctRight:'Prioritized set of security best practices' },
      { left:'COBIT', correctRight:'IT governance framework for enterprise management' },
      { left:'SOC 2', correctRight:'Service organization audit based on trust principles' },
    ],
    rightOptions:['Risk-based framework: Identify, Protect, Detect, Respond, Recover','International standard for information security management','Prioritized set of security best practices','IT governance framework for enterprise management','Service organization audit based on trust principles'],
    explanation:'NIST CSF = 5 functions. ISO 27001 = ISMS standard. CIS = benchmarks. COBIT = governance. SOC 2 = trust criteria audits.',
    objective:'1.2',
  },
  {
    id:'pbq-match8', domain:'D4', difficulty:2, type:'matching',
    title:'Match Authentication Protocols',
    scenario:'Match each authentication protocol to its correct description.',
    items:[
      { left:'SAML', correctRight:'XML-based SSO for web browser applications' },
      { left:'OAuth 2.0', correctRight:'Authorization framework for delegated API access' },
      { left:'OpenID Connect', correctRight:'Identity layer built on top of OAuth 2.0' },
      { left:'Kerberos', correctRight:'Ticket-based authentication for Windows domains' },
      { left:'LDAP', correctRight:'Directory service protocol for user lookups' },
    ],
    rightOptions:['XML-based SSO for web browser applications','Authorization framework for delegated API access','Identity layer built on top of OAuth 2.0','Ticket-based authentication for Windows domains','Directory service protocol for user lookups'],
    explanation:'SAML = SSO via XML. OAuth = delegated auth. OIDC = identity on OAuth. Kerberos = AD tickets. LDAP = directory queries.',
    objective:'4.6',
  },
  {
    id:'pbq-match9', domain:'D2', difficulty:2, type:'matching',
    title:'Match Wireless Attack Types',
    scenario:'Match each wireless attack to its correct description.',
    items:[
      { left:'Evil Twin', correctRight:'Rogue AP mimicking legitimate SSID' },
      { left:'Deauthentication', correctRight:'Forcing clients to disconnect from AP' },
      { left:'War Driving', correctRight:'Searching for Wi-Fi networks from vehicle' },
      { left:'Bluesnarfing', correctRight:'Unauthorized data access via Bluetooth' },
      { left:'KRACK', correctRight:'Key reinstallation attack on WPA2 handshake' },
    ],
    rightOptions:['Rogue AP mimicking legitimate SSID','Forcing clients to disconnect from AP','Searching for Wi-Fi networks from vehicle','Unauthorized data access via Bluetooth','Key reinstallation attack on WPA2 handshake'],
    explanation:'Evil twin = fake AP. Deauth = disconnect flood. War driving = mobile scanning. Bluesnarfing = BT theft. KRACK = WPA2 handshake exploit.',
    objective:'2.4',
  },
  {
    id:'pbq-match10', domain:'D2', difficulty:2, type:'matching',
    title:'Match Endpoint Security Tools',
    scenario:'Match each endpoint security tool to its primary function.',
    items:[
      { left:'EDR', correctRight:'Real-time endpoint threat detection and response' },
      { left:'DLP', correctRight:'Prevents unauthorized data exfiltration' },
      { left:'HIPS', correctRight:'Host-based intrusion prevention system' },
      { left:'Application Allowlisting', correctRight:'Only approved executables can run' },
      { left:'FIM', correctRight:'Detects unauthorized changes to critical files' },
    ],
    rightOptions:['Real-time endpoint threat detection and response','Prevents unauthorized data exfiltration','Host-based intrusion prevention system','Only approved executables can run','Detects unauthorized changes to critical files'],
    explanation:'EDR = endpoint monitoring. DLP = prevent data leaks. HIPS = host-level blocking. Allowlisting = approved-only execution. FIM = file integrity.',
    objective:'2.5',
  },

  // ── TYPE 5: NETWORK DEVICE PLACEMENT ──
  {
    id:'pbq-place1', domain:'D3', difficulty:2, type:'placement',
    title:'Place Network Security Devices',
    scenario:'Place each network security device in the correct position within the network architecture:\n\nInternet → [?] → DMZ → [?] → Internal LAN → [?]\n\nDrag each device to its correct zone.',
    zones:['Internet Edge','DMZ','Between DMZ & LAN','Internal Network'],
    items:[
      { label:'Edge Firewall', correctZone:'Internet Edge' },
      { label:'WAF (Web Application Firewall)', correctZone:'DMZ' },
      { label:'IPS (Intrusion Prevention System)', correctZone:'Between DMZ & LAN' },
      { label:'SIEM Server', correctZone:'Internal Network' },
      { label:'Reverse Proxy', correctZone:'DMZ' },
      { label:'Internal Firewall', correctZone:'Between DMZ & LAN' },
    ],
    explanation:'Edge firewall at internet boundary. WAF and reverse proxy in DMZ protecting web services. IPS inline between DMZ and LAN. SIEM in internal network collecting from all zones.',
    objective:'3.2',
  },
  {
    id:'pbq-place2', domain:'D3', difficulty:2, type:'placement',
    title:'Place Physical Security Controls',
    scenario:'A manufacturing company is securing its facility. Select the BEST security control for each location.',
    zones:['Outside (Parking)','Reception (Lobby)','Data Center Door','Server Console'],
    items:[
      { label:'Fencing', correctZone:'Outside (Parking)' },
      { label:'Lighting', correctZone:'Outside (Parking)' },
      { label:'Security Guard', correctZone:'Reception (Lobby)' },
      { label:'Access Control Vestibule', correctZone:'Reception (Lobby)' },
      { label:'Access Badge + Biometrics', correctZone:'Data Center Door' },
      { label:'Authentication Token + Password', correctZone:'Server Console' },
    ],
    explanation:'Outside: fencing + lighting. Reception: guard + vestibule. Data center: badge + biometric MFA. Server: token + password MFA.',
    objective:'3.1',
  },
  {
    id:'pbq-place3', domain:'D3', difficulty:2, type:'placement',
    title:'Place Cloud Security Controls',
    scenario:'Drag each security control to its correct cloud deployment layer.',
    zones:['Identity & Access','Network','Data','Application'],
    items:[
      { label:'Multi-Factor Authentication (MFA)', correctZone:'Identity & Access' },
      { label:'Cloud Access Security Broker (CASB)', correctZone:'Network' },
      { label:'Encryption at Rest (AES-256)', correctZone:'Data' },
      { label:'Web Application Firewall (WAF)', correctZone:'Application' },
      { label:'Conditional Access Policies', correctZone:'Identity & Access' },
      { label:'TLS 1.3 for Data in Transit', correctZone:'Network' },
    ],
    explanation:'MFA and conditional access = identity layer. CASB and TLS = network layer. AES encryption = data layer. WAF = application layer.',
    objective:'3.1',
  },
  {
    id:'pbq-place4', domain:'D3', difficulty:2, type:'placement',
    title:'Map Zero Trust Architecture Components',
    scenario:'Drag each component to the correct zero trust pillar.',
    zones:['Identity Verification','Device Trust','Micro-segmentation','Continuous Monitoring'],
    items:[
      { label:'MFA at every access point', correctZone:'Identity Verification' },
      { label:'Device health attestation', correctZone:'Device Trust' },
      { label:'Software-defined perimeters', correctZone:'Micro-segmentation' },
      { label:'UEBA analytics engine', correctZone:'Continuous Monitoring' },
      { label:'Certificate-based authentication', correctZone:'Identity Verification' },
      { label:'Network flow analysis', correctZone:'Continuous Monitoring' },
    ],
    explanation:'Zero trust: identity verification (MFA, certs), device trust (health checks), micro-segmentation (SDP), continuous monitoring (UEBA, flow analysis).',
    objective:'3.1',
  },
  {
    id:'pbq-place5', domain:'D3', difficulty:2, type:'placement',
    title:'Assign Resources to Network Zones',
    scenario:'Drag each resource to the correct network security zone.',
    zones:['Internet (Public)','DMZ','Internal Network','Restricted Zone'],
    items:[
      { label:'Public-facing web server', correctZone:'DMZ' },
      { label:'Employee workstations', correctZone:'Internal Network' },
      { label:'Database with PII records', correctZone:'Restricted Zone' },
      { label:'CDN edge node', correctZone:'Internet (Public)' },
      { label:'Email relay server', correctZone:'DMZ' },
      { label:'Active Directory domain controller', correctZone:'Restricted Zone' },
    ],
    explanation:'DMZ for public services. Internal for employees. Restricted for sensitive data/infrastructure. CDN at internet edge.',
    objective:'3.2',
  },
  {
    id:'pbq-place6', domain:'D4', difficulty:2, type:'placement',
    title:'Map SIEM Components',
    scenario:'Drag each SIEM component to its correct functional area.',
    zones:['Data Collection','Normalization','Correlation','Response'],
    items:[
      { label:'Log forwarders and agents', correctZone:'Data Collection' },
      { label:'Parsing different log formats into common schema', correctZone:'Normalization' },
      { label:'Rule-based alert generation', correctZone:'Correlation' },
      { label:'Automated SOAR ticket creation', correctZone:'Response' },
      { label:'NetFlow and packet capture collection', correctZone:'Data Collection' },
      { label:'Threat intelligence feed integration', correctZone:'Correlation' },
    ],
    explanation:'Collection gathers data. Normalization standardizes formats. Correlation matches patterns. Response automates remediation.',
    objective:'4.4',
  },
  {
    id:'pbq-place7', domain:'D1', difficulty:2, type:'placement',
    title:'Classify Security Control Categories',
    scenario:'Classify each security measure into the correct control category.',
    zones:['Technical','Managerial','Operational','Physical'],
    items:[
      { label:'Firewall blocks unauthorized traffic', correctZone:'Technical' },
      { label:'All returns must be approved by a VP', correctZone:'Managerial' },
      { label:'Guard checks identification of all visitors', correctZone:'Operational' },
      { label:'Building doors unlocked with access card', correctZone:'Physical' },
      { label:'System logs transferred automatically to SIEM', correctZone:'Technical' },
      { label:'Generator used during power outage', correctZone:'Physical' },
    ],
    explanation:'Technical = automated systems (firewall, SIEM). Managerial = policies/procedures. Operational = people-performed. Physical = tangible controls.',
    objective:'1.1',
  },
  {
    id:'pbq-place8', domain:'D4', difficulty:2, type:'placement',
    title:'Map Backup Strategies to Frequency',
    scenario:'Drag each backup activity to its correct frequency.',
    zones:['Daily','Weekly','Monthly','Annual'],
    items:[
      { label:'Incremental backup of changed files', correctZone:'Daily' },
      { label:'Full backup of all systems', correctZone:'Weekly' },
      { label:'Offsite tape rotation', correctZone:'Monthly' },
      { label:'Full disaster recovery test', correctZone:'Annual' },
      { label:'Database transaction log backup', correctZone:'Daily' },
      { label:'Complete bare-metal system image', correctZone:'Monthly' },
    ],
    explanation:'Incremental and transaction logs daily. Full backups weekly. Offsite rotation monthly. DR tests annually.',
    objective:'4.1',
  },
  {
    id:'pbq-place9', domain:'D3', difficulty:2, type:'placement',
    title:'Map Physical Security by Function',
    scenario:'Drag each physical security control to its correct function.',
    zones:['Deterrent','Preventive','Detective','Recovery'],
    items:[
      { label:'Warning signs and banners', correctZone:'Deterrent' },
      { label:'Mantrap / access control vestibule', correctZone:'Preventive' },
      { label:'Motion sensors', correctZone:'Detective' },
      { label:'Fire suppression system', correctZone:'Recovery' },
      { label:'Security lighting', correctZone:'Deterrent' },
      { label:'CCTV surveillance cameras', correctZone:'Detective' },
    ],
    explanation:'Signs/lighting = deter. Mantraps = prevent. Sensors/CCTV = detect. Fire suppression = recover.',
    objective:'3.1',
  },
  {
    id:'pbq-place10', domain:'D1', difficulty:2, type:'placement',
    title:'Map PKI Components',
    scenario:'Drag each PKI component to its correct role.',
    zones:['Certificate Authority','Registration Authority','Certificate Store','Revocation Service'],
    items:[
      { label:'Root CA (offline)', correctZone:'Certificate Authority' },
      { label:'Validates identity of cert requestors', correctZone:'Registration Authority' },
      { label:'LDAP directory of issued certificates', correctZone:'Certificate Store' },
      { label:'OCSP responder', correctZone:'Revocation Service' },
      { label:'Intermediate/Issuing CA', correctZone:'Certificate Authority' },
      { label:'CRL distribution point', correctZone:'Revocation Service' },
    ],
    explanation:'Root and intermediate CAs issue certs. RA validates identities. LDAP stores certs. OCSP and CRL provide revocation status.',
    objective:'1.4',
  },

  // ── ADDITIONAL LOG-ANALYSIS PBQs (zero-trust, exfil, ransomware, MFA bypass, lateral movement) ──
  {
    id:'pbq-log6', domain:'D4', difficulty:3, type:'log-analysis',
    title:'Zero Trust Policy Decision Logs',
    scenario:'Your zero-trust broker logs the following decisions for a finance user. Identify the activity and the correct response.',
    logEntries:[
      { line:'2024-05-01 09:01 ALLOW user=jdoe device=corp-l42 posture=compliant geo=US app=ERP' },
      { line:'2024-05-01 23:14 DENY user=jdoe device=UNKNOWN posture=unknown geo=RU app=ERP reason=device_not_enrolled' },
      { line:'2024-05-01 23:14 DENY user=jdoe device=UNKNOWN posture=unknown geo=RU app=ERP reason=impossible_travel' },
      { line:'2024-05-01 23:15 DENY user=jdoe device=UNKNOWN posture=unknown geo=RU app=ERP reason=mfa_failed' },
    ],
    attackTypeOptions:['Brute Force','SQL Injection','Account Takeover Attempt','DDoS','Reconnaissance','Insider Threat'],
    correctAttackType:'Account Takeover Attempt',
    sourceIPOptions:['Corporate laptop in US','Unknown device in RU','Domain controller','Internal jump host'],
    correctSourceIP:'Unknown device in RU',
    responseOptions:['Force credential reset, revoke active sessions, and review device-trust telemetry for jdoe','Disable zero-trust enforcement to reduce false positives','Whitelist the RU geography','Increase the MFA timeout window'],
    correctResponse:0,
    explanation:'Repeated denials from an unenrolled device in another country with impossible-travel and MFA failure indicate an account takeover attempt; reset credentials and revoke sessions.',
    objective:'4.6',
  },
  {
    id:'pbq-log7', domain:'D4', difficulty:3, type:'log-analysis',
    title:'DNS Tunneling / Data Exfiltration',
    scenario:'A workstation is generating thousands of long DNS TXT lookups to an unfamiliar domain. Review the DNS logs.',
    logEntries:[
      { line:'10.10.5.22 -> dns: query TXT a8f3kd92...payload.exfil-c2.io (212 bytes)' },
      { line:'10.10.5.22 -> dns: query TXT 9e2lk39d...payload.exfil-c2.io (218 bytes)' },
      { line:'10.10.5.22 -> dns: query TXT 7f1xx02k...payload.exfil-c2.io (223 bytes)' },
      { line:'[~3,400 oversized TXT queries in 4 minutes to *.exfil-c2.io]' },
    ],
    attackTypeOptions:['SQL Injection','DNS Tunneling / Data Exfiltration','DDoS','Brute Force','Pharming','Port Scan'],
    correctAttackType:'DNS Tunneling / Data Exfiltration',
    sourceIPOptions:['10.10.5.22','8.8.8.8','127.0.0.1','Multiple external IPs'],
    correctSourceIP:'10.10.5.22',
    responseOptions:['Isolate the host, sinkhole the malicious domain, and hunt for the implant','Increase DNS cache size','Disable IPv6 globally','Reboot the DNS server'],
    correctResponse:0,
    explanation:'Massive oversized TXT queries to a single suspicious domain are classic DNS tunneling exfiltration; isolate the host and sinkhole the C2 domain.',
    objective:'4.9',
  },
  {
    id:'pbq-log8', domain:'D4', difficulty:3, type:'log-analysis',
    title:'Ransomware Pre-Encryption Indicators',
    scenario:'A file server logs an unusual pattern just before users report being unable to open documents. Review the entries.',
    logEntries:[
      { line:'10.0.4.77 RENAME \\\\fs01\\share\\report.docx -> report.docx.lockbit' },
      { line:'10.0.4.77 RENAME \\\\fs01\\share\\budget.xlsx -> budget.xlsx.lockbit' },
      { line:'10.0.4.77 DELETE shadow_copy_volume_C' },
      { line:'10.0.4.77 WRITE \\\\fs01\\share\\HOW_TO_DECRYPT.txt' },
    ],
    attackTypeOptions:['Worm','Ransomware','SQL Injection','Reconnaissance','Brute Force','DDoS'],
    correctAttackType:'Ransomware',
    sourceIPOptions:['10.0.4.77','192.168.1.1','127.0.0.1','Multiple external IPs'],
    correctSourceIP:'10.0.4.77',
    responseOptions:['Isolate 10.0.4.77 from the network, preserve volatile evidence, and initiate restoration from offline backups','Pay the ransom immediately','Reboot the file server','Delete the .lockbit files manually'],
    correctResponse:0,
    explanation:'Mass rename to a ransom extension, shadow-copy deletion, and a ransom note are textbook ransomware indicators; isolate, preserve evidence, then restore from offline backups.',
    objective:'4.9',
  },
  {
    id:'pbq-log9', domain:'D4', difficulty:3, type:'log-analysis',
    title:'MFA Push-Bombing Attempt',
    scenario:'Your IdP records an unusual burst of MFA prompts for a single executive account at 3 a.m.',
    logEntries:[
      { line:'03:14 MFA_PUSH user=ceo device=registered status=DENIED' },
      { line:'03:14 MFA_PUSH user=ceo device=registered status=DENIED' },
      { line:'03:15 MFA_PUSH user=ceo device=registered status=DENIED (x32 in 90s)' },
      { line:'03:17 MFA_PUSH user=ceo device=registered status=APPROVED src=185.220.x.x (TOR exit)' },
    ],
    attackTypeOptions:['Brute Force','MFA Fatigue / Push Bombing','SQL Injection','Pharming','Phishing','Insider Threat'],
    correctAttackType:'MFA Fatigue / Push Bombing',
    sourceIPOptions:['Tor exit node','Internal jump host','Corporate VPN','Domain controller'],
    correctSourceIP:'Tor exit node',
    responseOptions:['Revoke active sessions, reset credentials, switch the account to number-matching or FIDO2, and block the source','Increase the push-prompt limit','Disable MFA temporarily for the CEO','Lengthen the MFA token validity window'],
    correctResponse:0,
    explanation:'Repeated rejected pushes followed by an approval from a Tor exit indicate MFA push-bombing; revoke sessions, reset credentials, and move to phishing-resistant MFA.',
    objective:'4.6',
  },
  {
    id:'pbq-log10', domain:'D4', difficulty:3, type:'log-analysis',
    title:'Lateral Movement via Pass-the-Hash',
    scenario:'Your EDR shows a workstation suddenly authenticating to multiple servers using NTLM with the same hash.',
    logEntries:[
      { line:'WS-101 -> SRV-FILE01: NTLM auth user=DOMAIN\\admin (no interactive logon recorded)' },
      { line:'WS-101 -> SRV-DC01: NTLM auth user=DOMAIN\\admin (no Kerberos PAC)' },
      { line:'WS-101 -> SRV-APP02: NTLM auth user=DOMAIN\\admin (Logon Type 3)' },
      { line:'WS-101 -> SRV-DB01: NTLM auth user=DOMAIN\\admin (Logon Type 3)' },
    ],
    attackTypeOptions:['Pass-the-Hash / Lateral Movement','Phishing','DDoS','SQL Injection','Reconnaissance','Brute Force'],
    correctAttackType:'Pass-the-Hash / Lateral Movement',
    sourceIPOptions:['WS-101','SRV-DC01','External attacker IP','Domain controller'],
    correctSourceIP:'WS-101',
    responseOptions:['Isolate WS-101, force enterprise-wide credential rotation for the admin account, and disable NTLM where possible','Reboot the affected servers','Reset only the local admin password on WS-101','Add WS-101 to a new VLAN and continue monitoring'],
    correctResponse:0,
    explanation:'NTLM auth from one host to many servers without interactive logon is pass-the-hash lateral movement; isolate the host, rotate the credential everywhere, and reduce NTLM exposure.',
    objective:'4.9',
  },
];

/* =================================================================
   EXAM BUILDER — Constructs randomized 90-question exams
   ================================================================= */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export type ExamNumber = 1 | 2 | 3 | 4 | 5;

export interface ExamConfig {
  examNumber: ExamNumber;
  pbqs: PBQuestion[];
  mcqs: MCQuestion[];
  totalQuestions: number;
}

// ── Seeded shuffle (same seed = same order) ──────────────────────
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Shuffle answer options and remap answer index ────────────────
export function shuffleOptions(q: MCQuestion): MCQuestion {
  if (q.type === 'select-two') {
    // For select-two, shuffle options and remap both answer indices
    const original = q.options.map((opt, i) => ({ opt, i }));
    const shuffled = shuffle(original);
    const newOptions = shuffled.map(x => x.opt);
    const oldAnswers = (q.answer as number[]);
    const newAnswers = oldAnswers.map(oldIdx => shuffled.findIndex(x => x.i === oldIdx));
    return { ...q, options: newOptions, answer: newAnswers.sort((a, b) => a - b) };
  } else {
    // Single answer
    const original = q.options.map((opt, i) => ({ opt, i }));
    const shuffled = shuffle(original);
    const newOptions = shuffled.map(x => x.opt);
    const newAnswer = shuffled.findIndex(x => x.i === (q.answer as number));
    return { ...q, options: newOptions, answer: newAnswer };
  }
}

// ── Exam seeds — each number yields a distinct, reproducible pool ─
const EXAM_SEEDS: Record<ExamNumber, number> = {
  1: 42,
  2: 137,
  3: 999,
  4: 2024,
  5: 7331,
};

export function buildExam(examNumber: ExamNumber = 1): ExamConfig {
  const seed = EXAM_SEEDS[examNumber];

  // Pick 6 PBQs (mix of types) — seeded per exam number
  const fwPbqs  = seededShuffle(pbqBank.filter(p => p.type === 'firewall'),     seed).slice(0, 2);
  const irPbqs  = seededShuffle(pbqBank.filter(p => p.type === 'ordering'),     seed + 1).slice(0, 1);
  const logPbqs = seededShuffle(pbqBank.filter(p => p.type === 'log-analysis'), seed + 2).slice(0, 1);
  const matchPbqs = seededShuffle(pbqBank.filter(p => p.type === 'matching'),   seed + 3).slice(0, 1);
  const placePbqs = seededShuffle(pbqBank.filter(p => p.type === 'placement'),  seed + 4).slice(0, 1);
  const pbqs = shuffle([...fwPbqs, ...irPbqs, ...logPbqs, ...matchPbqs, ...placePbqs]);

  // Compute MCQ counts so PBQ+MCQ totals match official SY0-701 weights as closely as possible.
  // Official targets out of 90: D1≈11, D2≈20, D3≈16, D4≈25, D5≈18 (sum 90).
  const TOTAL = 90;
  const targetTotals: Record<Domain, number> = {
    D1: Math.round(DOMAIN_WEIGHTS.D1 * TOTAL), // 11
    D2: Math.round(DOMAIN_WEIGHTS.D2 * TOTAL), // 20
    D3: Math.round(DOMAIN_WEIGHTS.D3 * TOTAL), // 16
    D4: Math.round(DOMAIN_WEIGHTS.D4 * TOTAL), // 25
    D5: Math.round(DOMAIN_WEIGHTS.D5 * TOTAL), // 18
  };
  const pbqCounts: Record<Domain, number> = { D1:0, D2:0, D3:0, D4:0, D5:0 };
  pbqs.forEach(p => { pbqCounts[p.domain]++; });

  const mcqTarget = TOTAL - pbqs.length; // 84
  const domainCounts: Record<Domain, number> = { D1:0, D2:0, D3:0, D4:0, D5:0 };
  let assigned = 0;
  (['D1','D2','D3','D4','D5'] as Domain[]).forEach(d => {
    const need = Math.max(0, targetTotals[d] - pbqCounts[d]);
    domainCounts[d] = need;
    assigned += need;
  });
  // Fix any rounding drift so MCQ count == mcqTarget. Adjust D4 (largest pool) first.
  let drift = mcqTarget - assigned;
  const adjustOrder: Domain[] = ['D4','D2','D5','D3','D1'];
  for (const d of adjustOrder) {
    if (drift === 0) break;
    if (drift > 0) { domainCounts[d]++; drift--; }
    else if (domainCounts[d] > 0) { domainCounts[d]--; drift++; }
  }

  const selectedMCQ: MCQuestion[] = [];
  const usedIds = new Set<string>();

  const selectTwoByDomain: Record<Domain, MCQuestion[]> = { D1:[], D2:[], D3:[], D4:[], D5:[] };
  mcqSelectTwo.forEach(q => selectTwoByDomain[q.domain].push(q));

  for (const [domain, count] of Object.entries(domainCounts) as [Domain, number][]) {
    if (count <= 0) continue;
    const domainSingle    = seededShuffle(mcqSingle.filter(q => q.domain === domain), seed + domain.charCodeAt(1));
    const domainSelectTwo = seededShuffle(selectTwoByDomain[domain],                  seed + domain.charCodeAt(1) + 50);

    // Up to 2 select-two per domain (capped at the domain's MCQ count)
    const stPicked = domainSelectTwo.slice(0, Math.min(2, count, domainSelectTwo.length));
    stPicked.forEach(q => { selectedMCQ.push(shuffleOptions(q)); usedIds.add(q.id); });

    // Fill remaining with single-answer
    const remaining = count - stPicked.length;
    domainSingle
      .filter(q => !usedIds.has(q.id))
      .slice(0, remaining)
      .forEach(q => { selectedMCQ.push(shuffleOptions(q)); usedIds.add(q.id); });
  }


  return {
    examNumber,
    pbqs,
    mcqs: shuffle(selectedMCQ),
    totalQuestions: pbqs.length + selectedMCQ.length,
  };
}

export function buildStudyQuestions(domain?: Domain): MCQuestion[] {
  const all = [...mcqSingle, ...mcqSelectTwo];
  const filtered = domain ? all.filter(q => q.domain === domain) : all;
  return shuffle(filtered).map(shuffleOptions);
}
