export interface SampleDocData {
  id: string;
  name: string;
  pageCount: number;
  pages: { pageNumber: number; text: string }[];
}

export const SAMPLE_DOCUMENTS: SampleDocData[] = [
  {
    id: "sample-techcorp-q3-2025",
    name: "TechCorp_Q3_2025_Financial_and_AI_Strategy_Report.pdf",
    pageCount: 4,
    pages: [
      {
        pageNumber: 1,
        text: `TechCorp International - Q3 2025 Executive Financial & Strategic Summary

Section 1: Financial Overview & Key Metrics
TechCorp International announced record-breaking quarterly revenue of $4.85 billion for Q3 2025, representing a 22% year-over-year increase compared to Q3 2024 ($3.98 billion). Operating income reached $1.32 billion, up 28% YoY, yielding an operating margin of 27.2%.

Gross profit margin expanded by 180 basis points to 64.5%, driven primarily by higher margin enterprise SaaS subscriptions and AI infrastructure cloud services. Free cash flow for the quarter stood at $980 million, bringing year-to-date cash reserves to $5.4 billion.

Revenue Breakdown by Business Segment:
- Cloud Services & Infrastructure: $2.15 billion (44.3% of total revenue, +31% YoY)
- Enterprise AI & Data Solutions: $1.45 billion (29.9% of total revenue, +45% YoY)
- Legacy Software & Developer Licensing: $850 million (17.5% of total revenue, -4% YoY)
- Consumer Hardware & IoT: $400 million (8.3% of total revenue, +8% YoY)

Capital expenditure (CapEx) for Q3 was $720 million, allocated heavily toward acquiring 12,000 next-generation GPU compute clusters and expanding datacenters in Frankfurt, Tokyo, and Virginia.`
      },
      {
        pageNumber: 2,
        text: `TechCorp International - Q3 2025 Executive Financial & Strategic Summary

Section 2: AI Strategy & Agentic R&D Roadmap
In Q3 2025, TechCorp accelerated its transformation into an AI-first enterprise platform. Key R&D investments reached $610 million (12.6% of revenue), focusing on three strategic pillars:

1. Autonomous Enterprise Agents ("Project Sentinel"):
TechCorp deployed version 3.0 of Project Sentinel across 450 enterprise client pilots. Sentinel agents handle automated workflow orchestration, IT incident remediation, and supply chain re-routing. Early metrics indicate a 64% reduction in mean time to resolution (MTTR) for enterprise IT incidents and a 38% reduction in manual procurement processing costs.

2. On-Premise Secure Vector & Retrieval Engine (RAG Core):
To address strict data privacy mandates in financial services and healthcare, TechCorp launched "IntraMind Vault" - a zero-leakage, hardware-isolated vector database that operates entirely within client VPCs. It supports high-density semantic embeddings and sub-50ms vector search across multi-terabyte document corpuses.

3. Proprietary Foundation Model ("Aether-3"):
Training was completed on Aether-3, a 120-billion parameter multimodal model specialized in financial forecasting and code synthesis. Aether-3 achieved a 91.2% score on the FinQA benchmark, outperforming generalist models by 14 percentage points while requiring 40% less inference energy.`
      },
      {
        pageNumber: 3,
        text: `TechCorp International - Q3 2025 Executive Financial & Strategic Summary

Section 3: Risk Factors, Regulatory Compliance & Environmental Impact

Risk Factors:
1. Supply Chain Constraints for Advanced Silicon: Semiconductor fabrication lead times remain stretched at 26 weeks for high-density HBM3e memory modules. Any escalation in geopolitical trade restrictions could delay datacenter commissioning in Asia-Pacific.
2. AI Regulatory Governance: The EU AI Act and US Executive Order guidelines require continuous third-party algorithmic auditing. Compliance costs increased by $18 million in Q3, though TechCorp maintains full adherence across all deployed model endpoints.
3. Cybersecurity Threats: Nation-state targeted phishing and prompt-injection attacks against enterprise RAG pipelines increased by 110% in 2025. In response, TechCorp deployed real-time prompt-sanitization firewalls.

Sustainability & ESG Metrics:
- Datacenter Power Usage Effectiveness (PUE) averaged 1.14 across global sites, compared to the industry average of 1.58.
- 78% of energy consumed by TechCorp datacenters in Q3 was sourced from renewable power purchase agreements (PPAs), targeting 100% net-zero emissions by 2028.
- Water cooling efficiency improved by 22% following the implementation of closed-loop liquid cooling technology in the Virginia datacenter hub.`
      },
      {
        pageNumber: 4,
        text: `TechCorp International - Q3 2025 Executive Financial & Strategic Summary

Section 4: Executive Outlook & Q4 Guidance

Management maintains a bullish outlook for Q4 2025 and full-year fiscal 2026. 

Guidance for Q4 2025:
- Total Expected Revenue: $5.10 billion to $5.25 billion (implying ~24% YoY growth)
- Projected Operating Margin: 27.5% - 28.5%
- Full Year CapEx Target: $2.6 billion - $2.8 billion

Chief Executive Statement:
"Our Q3 results reflect market validation of our enterprise AI strategy. Customers are no longer merely experimenting with generative AI; they are embedding TechCorp's agentic workflows into core operational loops. With the commercial rollout of Aether-3 and IntraMind Vault, we are positioned to capture dominant market share in private enterprise intelligence."`
      }
    ]
  },
  {
    id: "sample-quantum-os-spec",
    name: "Quantum_OS_Security_Architecture_Spec_v4.2.pdf",
    pageCount: 3,
    pages: [
      {
        pageNumber: 1,
        text: `Quantum OS Architecture Specification v4.2
Document ID: SEC-SPEC-2025-089 | Classification: CONFIDENTIAL

1. Architecture Overview & Microkernel Isolation
Quantum OS is a deterministic, secure real-time operating system (RTOS) designed for high-consequence edge computing, aerospace, and medical telemetry. Unlike monolithic kernels, Quantum OS uses the Nova Microkernel Architecture where device drivers, network stacks, and user applications run in strictly isolated user-space memory partitions (Capability-Based Sandboxes).

Key System Characteristics:
- Kernel Codebase: 14,200 lines of formal-verification certified Rust code.
- Zero Global Mutable State: All shared resources are accessed via non-transferable Capability Descriptors (CapDesc).
- Context Switch Overhead: Sub-1.2 microseconds on ARM64 and x86_64 architectures.
- Hard Real-Time Guarantee: Interrupt latency bounded strictly under 500 nanoseconds.`
      },
      {
        pageNumber: 2,
        text: `Quantum OS Architecture Specification v4.2
Document ID: SEC-SPEC-2025-089 | Classification: CONFIDENTIAL

2. Zero-Trust Cryptographic Identity & Memory Protection

Memory Encryption Engine (MEE):
Quantum OS enforces hardware-accelerated memory encryption on all DRAM pages using AES-256-XTS with dynamic IV randomization. Key rotation occurs automatically every 10^6 page accesses or every 10 minutes of active execution.

Thread Isolation & Memory Compartmentalization:
- WebAssembly Capability Guard: All third-party plugins execute inside WebAssembly sandboxes enriched with explicit system call access control lists (Syscall ACLs).
- Return-Oriented Programming (ROP) Shield: Enforces shadow stack validation at hardware control flow integrity (CFI) level.
- Buffer Overflow Protection: Stack canary values generated via hardware Random Number Generators (TRNG) on every function frame allocation.

Authentication & Attestation:
On system boot, the Quantum OS secure loader validates system firmware against a hardware Root of Trust (TPM 2.0 / Apple T2 / Google Titan). Remote hardware attestation generates a cryptographic signature proving kernel integrity to remote control servers before network sockets can be opened.`
      },
      {
        pageNumber: 3,
        text: `Quantum OS Architecture Specification v4.2
Document ID: SEC-SPEC-2025-089 | Classification: CONFIDENTIAL

3. Rate Limits, API Security Controls & Fault Recovery

API Rate Limiting & Resource Quotas:
System services are bounded by token-bucket rate limiters configured per API domain:
- File I/O Descriptor Calls: Maximum 5,000 operations/sec per process thread.
- Inter-Process Communication (IPC): Maximum 20,000 messages/sec with a 64KB maximum buffer size per mailbox.
- Cryptographic Signing Service: Rate limited to 100 signatures/sec to mitigate timing-side-channel extraction attacks.

Fault Recovery & Self-Healing:
If a driver or process breaches memory bounds, the Nova Microkernel revokes its capability key, captures a compressed crash dump, and restarts the subsystem in user-space within 8.5 milliseconds without interrupting adjacent services or the primary control kernel.`
      }
    ]
  }
];
