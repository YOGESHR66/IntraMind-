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

2. Post-Quantum Cryptographic Protocol (PQ-TLS 1.4)
To defend against "Harvest Now, Decrypt Later" quantum adversary tactics, Quantum OS mandates the Kyber-1024 lattice-based key encapsulation mechanism (KEM) combined with Dilithium-5 digital signatures for all inter-node remote procedure calls.

Key Cryptographic Implementations:
- Hybrid Key Exchange: Classical X25519 elliptic-curve Diffie-Hellman combined with ML-KEM-1024 to ensure backward compatibility and quantum resistance.
- Zero-Knowledge Attestation: Hardware Secure Elements (TPM 2.0 / Apple T2 equivalents) verify the cryptographic integrity of kernel binaries before granting network socket capabilities.
- Hardware Enclave Integration: Sensitive cryptographic state is permanently locked in hardware memory rings with physical side-channel and differential power analysis (DPA) countermeasures.`
      },
      {
        pageNumber: 3,
        text: `Quantum OS Architecture Specification v4.2

3. Memory Safety Model & Formal Verification
Quantum OS eliminates 100% of spatial and temporal memory safety vulnerabilities (use-after-free, double free, buffer overflow) through three combined defensive layers:

- Type-Safe System Runtime: Entirely compiled in '#![no_std]' Rust with strict prohibitions on 'unsafe' blocks outside verified low-level context-switching primitives.
- Linear Type Capabilities: Memory regions are transferred via affine types; once a handle is passed across an IPC boundary, the originating process loses all read/write references at compile-time.
- Verified Proof Engine: Mathematical proofs of correctness verified using the Kani Rust model checker and Coq theorem prover.

Fault Recovery & Self-Healing:
If a driver or process breaches memory bounds, the Nova Microkernel revokes its capability key, captures a compressed crash dump, and restarts the subsystem in user-space within 8.5 milliseconds without interrupting adjacent services or the primary control kernel.`
      }
    ]
  },
  {
    id: "sample-agi-10-page-report",
    name: "AGI_10_Page_Report.pdf",
    pageCount: 10,
    pages: [
      {
        pageNumber: 1,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 1 of 10)
Document ID: AGI-SPEC-2025-01 | Classification: PUBLIC RESEARCH

Section 1: Foundational Definition & Taxonomy
Artificial General Intelligence (AGI) refers to autonomous synthetic systems possessing human-level or superhuman cognitive flexibility across virtually all economically and scientifically valuable domains. Unlike Artificial Narrow Intelligence (ANI)—which excels exclusively within constrained objective spaces such as chess playing, medical image classification, or localized speech recognition—AGI demonstrates cross-domain transfer learning, autonomous hypothesis generation, common-sense reasoning, and rapid adaptation to novel, out-of-distribution environments without task-specific retraining.

Core Cognitive Attributes of AGI:
1. Generalization: Ability to transfer knowledge acquired in one domain (e.g. theoretical physics) to solve unencountered problems in another (e.g. molecular biology).
2. Autonomous Goal Formulation: Translating ambiguous high-level objectives ("develop an energy-efficient desalinization process") into rigorous decomposing sub-plans.
3. Continual Online Learning: Updating internal epistemic world models in real-time from environmental feedback without catastrophic forgetting.
4. Epistemic Humility & Self-Critique: Calibrating subjective uncertainty, validating empirical assumptions, and executing verification before asserting conclusions.`
      },
      {
        pageNumber: 2,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 2 of 10)

Section 2: Cognitive Architectures & Multi-Modal Foundation Models
Contemporary consensus indicates that transformer-based dense and mixture-of-experts (MoE) architectures constitute the dominant substrate on the path toward AGI. However, standard next-token prediction on internet text alone is recognized as insufficient for general intelligence.

Architectural Enhancements Powering Frontier Capabilities:
- Mixture-of-Experts (MoE) Routing: Activating specialized sub-networks dynamically per token (e.g. 16-of-128 experts), achieving parameter efficiencies exceeding 1 trillion parameters while maintaining sub-50ms inference latency.
- State-Space Model (SSM) & Attention Hybrids: Incorporating linear-recurrent memory mechanisms to achieve infinite context windows and persistent long-term associative memory.
- Multimodal Sensorimotor Grounding: Unifying symbolic text, continuous visual streams, spatial audio, and robotic proprioception within a single latent representation space. This grounding ensures the model possesses physical world common sense rather than purely syntactic text manipulation.`
      },
      {
        pageNumber: 3,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 3 of 10)

Section 3: Reasoning, System 2 Deliberation & Test-Time Search
The transition from reactive intuition (System 1) to deliberate logical reasoning (System 2) represents the pivotal milestone toward artificial general cognition.

Key Deliberation Mechanisms:
1. Test-Time Compute Scaling: Allocating additional inference compute dynamically when confronting complex mathematical or algorithmic dilemmas, rather than relying exclusively on fixed forward-pass latency.
2. Monte Carlo Tree Search (MCTS) & Tree-of-Thought: Exploring diverse reasoning paths, evaluating intermediate branch validity with trained process reward models (PRMs), and backtracking when encountering logical contradictions.
3. Formal Verification in the Loop: Verifying mathematical theorems using Lean 4 or Isabelle and validating executable code in sandboxed runtime environments before providing final answers.
4. Chain-of-Deliberation: Explicitly decomposing complex multi-step problems into self-auditing intermediate steps, reducing factual hallucinations by over 74% compared to direct generation.`
      },
      {
        pageNumber: 4,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 4 of 10)

Section 4: Compute Scaling Laws, Energy Demands & Hardware Infrastructure
The empirical trajectory of artificial intelligence has been governed by empirical scaling laws: compute (FLOPs), dataset token volume, and active parameter count.

Hardware & Infrastructure Benchmarks:
- Frontier Training Compute: Advanced training runs now exceed 10^26 FLOPs, with next-generation clusters targeting 10^28 FLOPs.
- Semiconductor Acceleration: Distributed clusters of 100,000+ accelerators connected via 800 Gbps optical interconnects with ultra-low latency InfiniBand fabrics.
- High-Bandwidth Memory (HBM3e/HBM4): Memory bandwidth exceeding 1.2 TB/sec per chip is essential to alleviate the memory-wall bottleneck during auto-regressive generation.
- Energy Constraints: Leading frontier datacenters require 1 to 5 Gigawatts of dedicated power by 2028. This demand has spurred long-term power purchase agreements (PPAs) with nuclear power stations and geothermal generation facilities.`
      },
      {
        pageNumber: 5,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 5 of 10)

Section 5: Evaluation Benchmarks: ARC-AGI, MMLU-Pro, SWE-bench & GAIA
Traditional standardized evaluation suites (such as MMLU or GSM8K) have largely suffered from benchmark saturation and training-set contamination. Frontier labs rely on rigorous modern benchmarks:

1. ARC-AGI (Abstraction and Reasoning Corpus): Designed by François Chollet to measure pure general intelligence—the efficiency of acquiring new skills outside prior training distributions. Tasks require visual grid induction with minimal few-shot demonstrations.
2. SWE-bench Verified: Evaluates autonomous software engineering capabilities on genuine GitHub pull requests and real-world repository debugging across multi-thousand-line codebases.
3. GAIA (General AI Assistants): Tests complex, multi-modal web browsing, tool orchestration, spreadsheet manipulation, and multimodal fact verification requiring up to 30 sequential actions.
4. Humanity's Last Exam (HLE): A 3,000-question multidisciplinary benchmark curated to probe university-graduate and specialist boundaries across mathematics, chemistry, law, and philosophy.`
      },
      {
        pageNumber: 6,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 6 of 10)

Section 6: AI Safety, Alignment, RLHF & Constitutional Governance
Ensuring AGI systems remain aligned with human intent, safety guidelines, and societal well-being requires multi-layered technical alignment protocols.

Key Alignment Methodologies:
- Reinforcement Learning from Human Feedback (RLHF): Steering raw model priors toward helpful, harmless, and honest behavioral objectives.
- Constitutional AI (RLAIF): Automating safety alignment by training models against a codified set of behavioral principles, enabling scalable oversight without human annotation bottlenecks.
- Mechanistic Interpretability: Peering inside transformer attention heads and polysemantic neurons using Sparse Autoencoders (SAEs) to identify deception, latent intent, or dangerous capabilities.
- Red-Teaming & Sandboxed Isolation: Subjecting candidate weights to automated adversarial jailbreak simulations prior to production deployment.`
      },
      {
        pageNumber: 7,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 7 of 10)

Section 7: Autonomous Agentic Workflows & Multi-Agent Swarms
AGI capabilities manifest commercially through autonomous agents capable of independent execution across digital and physical tool ecosystems.

Agentic Architecture Layers:
1. Perception & Environment Ingestion: Parsing browser DOM trees, terminal STDOUT, API schemas, and document formats.
2. Dynamic Task Planning: Formulating directed acyclic graphs (DAGs) of executable operations, adjusting trajectories dynamically when tools error.
3. Long-Term Retrieval-Augmented Generation (RAG): Indexing user context, organizational databases, and interaction history in vector databases to maintain persistent context.
4. Multi-Agent Collaboration: Orchestrating hierarchical teams consisting of Planner, Executor, Critic, and Quality Assurance agents to solve enterprise-scale software engineering or financial analysis tasks.`
      },
      {
        pageNumber: 8,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 8 of 10)

Section 8: Economic Impact, Labor Market Transformation & Growth Multipliers
The widespread diffusion of AGI is anticipated to trigger structural economic shifts comparable to the Industrial Revolution, but compressed into a multi-year horizon.

Economic Impacts & Projections:
- Cognitive Labor Acceleration: Routine analytical tasks (contract analysis, code generation, clinical documentation, regulatory reporting) face 80%+ productivity gains.
- Scientific Discovery Compression: Accelerated material science, quantum computing simulation, and de novo protein synthesis reduce drug discovery lifecycles from 10 years to under 18 months.
- GDP Growth Acceleration: Economic models project an addition of $15 trillion to $22 trillion to global GDP by 2035 driven by automated knowledge work.
- Workforce Reskilling Imperative: Labor transition programs must emphasize creative problem framing, domain synthesis, and human-in-the-loop validation rather than rote mechanical drafting.`
      },
      {
        pageNumber: 9,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 9 of 10)

Section 9: Global Governance, Regulatory Frameworks & International Treaties
Managing catastrophic and systemic risks associated with frontier synthetic intelligence requires harmonized international oversight.

Current Regulatory Landscapes:
- European Union AI Act: Establishes extraterritorial risk classification with stringent systemic risk audit requirements for general-purpose AI (GPAI) models trained above 10^25 FLOPs.
- United States NIST AI Safety Institute: Enforces pre-deployment safety assessments, watermarking standards, and dual-use capability reporting under national security executive directives.
- Compute Governance & Supply Chain Tracking: Proposals for international verification of advanced semiconductor wafer fabrication (lithography machines) to detect unauthorized covert frontier clusters.
- Open-Weight vs. Closed-Weight Debate: Balancing scientific democratization and academic reproducibility against the risk of unconstrained malicious fine-tuning for cyber-warfare or biological weapons.`
      },
      {
        pageNumber: 10,
        text: `Artificial General Intelligence (AGI) - Comprehensive Research & Strategic Assessment Report (Page 10 of 10)

Section 10: Consensus Timeline Projections (2026-2030) & Strategic Conclusion

Consensus Forecast Window:
- 2026: Autonomous multi-step software engineering agents capable of solving 60%+ of SWE-bench issues and passing graduate-level bar and medical licensing exams with zero-shot generalization.
- 2027: Widespread adoption of test-time search deliberation in commercial workflows; human-parity scientific literature synthesis and automated lab protocol formulation.
- 2028-2029: Early Artificial General Intelligence consensus achieved across frontier AI labs (OpenAI, Google DeepMind, Anthropic), defined as systems capable of performing 90%+ of economically valuable remote knowledge work.
- 2030+: Emergence of self-improving recursive AI development pipelines, necessitating robust international safety containment protocols.

Strategic Conclusion for Technical Leadership:
Organizations must architect their software ecosystems around composable, model-agnostic agent frameworks, zero-trust enterprise retrieval-augmented generation (RAG) pipelines, and continuous benchmark verification to maintain competitive differentiation in the era of artificial general cognition.`
      }
    ]
  }
];
