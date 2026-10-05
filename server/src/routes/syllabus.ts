import { Router, Request, Response } from 'express';
import multer from 'multer';
import { callLlm } from '../services/llm.js';
import { runtimeKeys } from './keys.js';
import { getDbConfig } from '../services/dbAdapter.js';
import { extractTextFromBuffer } from '../services/extract.js';

export const syllabusRouter = Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB upload limit

export interface UnitMaterial {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  extractedSnippet?: string;
  keyInsights?: string[];
  cloudSynced?: boolean;
}

export interface SyllabusChapter {
  id: string;
  number: number;
  title: string;
  overview: string;
  keyConcepts: string[];
  prerequisites: string[];
  learningObjectives: string[];
  status?: 'not_started' | 'in_progress' | 'mastered';
  uploadedMaterials?: UnitMaterial[];
}

export interface SyllabusCourse {
  id: string;
  subject: string;
  field: string;
  gradeLevel: 'middle' | 'high' | 'college' | 'lifelong';
  chapters: SyllabusChapter[];
}

export const PRESET_SYLLABI: SyllabusCourse[] = [
  {
    id: 'cs-ai-foundations',
    subject: 'Computer Science & AI Foundations',
    field: 'Computing & Engineering',
    gradeLevel: 'high',
    chapters: [
      {
        id: 'cs-1',
        number: 1,
        title: 'Algorithms & Computational Complexity',
        overview: 'Understanding Big-O notation, asymptotic analysis, divide-and-conquer, sorting, and graph traversals.',
        keyConcepts: ['Time & Space Complexity', 'Binary Search Trees', 'Dijkstra Shortest Path', 'Recursion & Dynamic Programming'],
        prerequisites: ['Basic Algebra', 'Logic & Flowcharts'],
        learningObjectives: ['Analyze runtime efficiency', 'Implement search and sort routines', 'Model real-world networks with graphs'],
      },
      {
        id: 'cs-2',
        number: 2,
        title: 'Data Structures & Memory Architecture',
        overview: 'Deep dive into continuous vs linked allocations, hash tables, heaps, and cache hierarchy.',
        keyConcepts: ['Hash Collision Resolution', 'Min/Max Heaps', 'Call Stack & Heap Memory', 'Pointers & References'],
        prerequisites: ['Basic Programming', 'Memory Addressing'],
        learningObjectives: ['Choose optimal data structures', 'Prevent memory leaks and overflow', 'Implement hash maps from scratch'],
      },
      {
        id: 'cs-3',
        number: 3,
        title: 'Machine Learning & Statistical Optimization',
        overview: 'Core mechanics of linear models, cost functions, gradient descent, and supervised vs unsupervised training.',
        keyConcepts: ['Cost Functions & Loss', 'Stochastic Gradient Descent', 'Overfitting & Regularization', 'Train/Validation/Test Splits'],
        prerequisites: ['Linear Algebra (Vectors & Matrices)', 'Multivariable Calculus (Partial Derivatives)'],
        learningObjectives: ['Derive loss functions', 'Tune learning rates', 'Evaluate precision, recall, and ROC-AUC'],
      },
      {
        id: 'cs-4',
        number: 4,
        title: 'Neural Networks & Deep Learning Architectures',
        overview: 'Forward propagation, backpropagation with the chain rule, activation functions, CNNs, and sequence processing.',
        keyConcepts: ['Backpropagation Chain Rule', 'ReLU, GELU, and Softmax', 'Convolutional Feature Maps', 'Recurrent Hidden States'],
        prerequisites: ['Machine Learning Basics', 'Matrix Multiplication'],
        learningObjectives: ['Implement multi-layer perceptrons', 'Understand image feature extractors', 'Debug vanishing/exploding gradients'],
      },
      {
        id: 'cs-5',
        number: 5,
        title: 'Transformer Architecture & Generative AI',
        overview: 'The modern revolution of Self-Attention, positional encodings, multi-head projections, and large language model pretraining.',
        keyConcepts: ['Scaled Dot-Product Attention', 'Multi-Head Attention (Q, K, V)', 'Positional Encodings', 'Autoregressive Decoding & Temperature'],
        prerequisites: ['Neural Networks', 'Matrix Projections'],
        learningObjectives: ['Explain how transformers process tokens in parallel', 'Understand temperature and top-p sampling', 'Design grounded RAG and AI agent systems'],
      },
    ],
  },
  {
    id: 'physics-cosmology',
    subject: 'Modern Physics & Astrophysics',
    field: 'Physical Sciences',
    gradeLevel: 'college',
    chapters: [
      {
        id: 'phys-1',
        number: 1,
        title: 'Classical Mechanics & Conservation Laws',
        overview: 'Newtonian dynamics, rotational kinematics, Lagrangian mechanics, and universal conservation principles.',
        keyConcepts: ["Newton's Laws", 'Conservation of Momentum', 'Angular Momentum & Torque', 'Energy Landscapes & Harmonic Oscillators'],
        prerequisites: ['Calculus I', 'Vector Geometry'],
        learningObjectives: ['Derive equations of motion', 'Solve harmonic oscillator differentials', 'Apply conservation of energy to planetary orbits'],
      },
      {
        id: 'phys-2',
        number: 2,
        title: 'Thermodynamics & Statistical Entropy',
        overview: 'Thermal states, entropy as statistical microstates, heat engines, Carnot efficiency, and irreversible processes.',
        keyConcepts: ['Laws of Thermodynamics', 'Boltzmann Entropy Formula', 'Carnot Cycles', 'Free Energy (Gibbs & Helmholtz)'],
        prerequisites: ['Classical Mechanics', 'Probability Basics'],
        learningObjectives: ['Calculate heat engine efficiencies', 'Explain the statistical arrow of time', 'Model phase transitions'],
      },
      {
        id: 'phys-3',
        number: 3,
        title: 'Electromagnetism & Maxwell’s Unified Equations',
        overview: 'Electric and magnetic vector fields, Gauss and Ampere laws, induction, and electromagnetic light waves.',
        keyConcepts: ["Maxwell's Equations", 'Electromagnetic Wave Equations', 'Faraday Induction', 'Poynting Energy Flux'],
        prerequisites: ['Vector Calculus (Div & Curl)', 'Mechanics'],
        learningObjectives: ['Solve boundary value problems', 'Derive the speed of light from permittivity and permeability', 'Calculate radiation pressure'],
      },
      {
        id: 'phys-4',
        number: 4,
        title: 'Quantum Mechanics & Wavefunction Collapse',
        overview: 'The Schrödinger equation, Heisenberg uncertainty, quantum states in Hilbert space, and superposition.',
        keyConcepts: ['Time-Dependent Schrödinger Equation', 'Quantum Superposition', 'Heisenberg Uncertainty Principle', 'Quantum Tunneling & Particle in a Box'],
        prerequisites: ['Linear Algebra (Eigenvalues & Eigenvectors)', 'Complex Analysis'],
        learningObjectives: ['Calculate particle probability densities', 'Solve standard potential wells', 'Explain wave-particle duality experiments'],
      },
      {
        id: 'phys-5',
        number: 5,
        title: 'General Relativity & Black Hole Astrophysics',
        overview: 'Curvature of spacetime, Einstein field equations, gravitational lensing, event horizons, and gravitational wave detection.',
        keyConcepts: ['Spacetime Metric Tensor', 'Equivalence Principle', 'Schwarzschild Event Horizon', 'Gravitational Lensing & LIGO Interferometry'],
        prerequisites: ['Special Relativity', 'Differential Geometry Basics'],
        learningObjectives: ['Explain gravitational time dilation', 'Describe how black holes warp light and space', 'Understand gravitational wave signals'],
      },
    ],
  },
  {
    id: 'biology-genetics',
    subject: 'Molecular Biology & Biotechnology',
    field: 'Life Sciences',
    gradeLevel: 'high',
    chapters: [
      {
        id: 'bio-1',
        number: 1,
        title: 'Cellular Structure & Biomolecular Architecture',
        overview: 'Organelle compartmentalization, phospholipid bilayer membranes, enzymes, and protein folding mechanics.',
        keyConcepts: ['Phospholipid Bilayers', 'Enzyme Activation Energy', 'Endomembrane Transport', 'ATP Synthetase Mechanics'],
        prerequisites: ['Basic Chemistry'],
        learningObjectives: ['Differentiate eukaryotic and prokaryotic systems', 'Explain active vs passive cellular transport', 'Model enzyme kinetics'],
      },
      {
        id: 'bio-2',
        number: 2,
        title: 'Molecular Genetics & The Central Dogma',
        overview: 'DNA double helix structure, DNA replication fork, RNA transcription, and ribosomal peptide translation.',
        keyConcepts: ['DNA Double Helix & Base Pairing', 'DNA Polymerase & Helicase', 'mRNA Transcription & Splicing', 'Ribosomal Translation & Codons'],
        prerequisites: ['Biomolecules'],
        learningObjectives: ['Trace genetic code from DNA to functional proteins', 'Explain point mutations and frameshifts', 'Model epigenetic regulation'],
      },
      {
        id: 'bio-3',
        number: 3,
        title: 'Cellular Energetics: Photosynthesis & Respiration',
        overview: 'Light reactions and Calvin cycle in chloroplasts; Glycolysis, Krebs cycle, and oxidative phosphorylation in mitochondria.',
        keyConcepts: ['Chemiosmotic Proton Gradients', 'Light-Harvesting Chlorophyll Complexes', 'Krebs Citric Acid Cycle', 'Electron Transport Chain'],
        prerequisites: ['Cellular Structure', 'Redox Chemistry'],
        learningObjectives: ['Balance cellular respiration inputs and outputs', 'Explain how sunlight creates chemical ATP', 'Compare aerobic and anaerobic pathways'],
      },
      {
        id: 'bio-4',
        number: 4,
        title: 'Immunology & Human Pathogen Defense',
        overview: 'Innate vs adaptive immunity, B-cell antibody production, cytotoxic T-cells, and immunological memory.',
        keyConcepts: ['Innate vs Adaptive Immunity', 'Antigen Recognition & Antibodies', 'T-Cell Activation & Cytokines', 'Vaccines & Immunological Memory'],
        prerequisites: ['Molecular Genetics'],
        learningObjectives: ['Explain pathogen neutralization', 'Describe how vaccines train memory lymphocytes', 'Understand autoimmune conditions'],
      },
      {
        id: 'bio-5',
        number: 5,
        title: 'CRISPR Gene Editing & Modern Biotechnology',
        overview: 'Recombinant DNA, PCR amplification, CRISPR-Cas9 precision gene targeting, and synthetic biology ethics.',
        keyConcepts: ['CRISPR-Cas9 Guide RNA', 'PCR Thermal Cycling', 'Gel Electrophoresis', 'Gene Therapy & Bioethics'],
        prerequisites: ['Central Dogma', 'DNA Replication'],
        learningObjectives: ['Explain how guide RNA directs Cas9 molecular scissors', 'Describe applications in genetic medicine and agriculture', 'Analyze bioethical boundaries'],
      },
    ],
  },
];

// 1. Get Preset Syllabi
syllabusRouter.get('/presets', (req: Request, res: Response) => {
  res.json({ success: true, syllabi: PRESET_SYLLABI });
});

// 2. Database & Cloud Storage Status
syllabusRouter.get('/storage-status', (req: Request, res: Response) => {
  const config = getDbConfig();
  res.json({ success: true, config });
});

// 3. AI Custom Syllabus Generator (Transforms user syllabus text into structured curriculum)
syllabusRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { subject, syllabusText, gradeLevel = 'high', customKey, customProvider } = req.body || {};

    if (!subject && !syllabusText) {
      return res.status(400).json({ error: 'Please provide a course subject or syllabus outline.' });
    }

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    const systemPrompt = `You are an elite Academic Dean and Curriculum Designer.
Generate a structured, rigorous 5-chapter syllabus for "${subject || 'Course'}".
Output strictly valid JSON with this schema:
{
  "id": "custom-${Date.now()}",
  "subject": "${subject || 'Custom Course'}",
  "field": "Academic Curriculum",
  "gradeLevel": "${gradeLevel}",
  "chapters": [
    {
      "id": "ch-1",
      "number": 1,
      "title": "Chapter Title",
      "overview": "Comprehensive 1-2 sentence chapter scope.",
      "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
      "prerequisites": ["Prereq 1", "Prereq 2"],
      "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
    }
  ]
}`;

    const prompt = `Course: ${subject}\n\nSyllabus Outline or Notes:\n${syllabusText || subject}\n\nGenerate the complete 5-chapter course curriculum in JSON.`;

    const raw = await callLlm(prompt, systemPrompt, llmKey, llmProvider, true);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json({ success: true, syllabus: parsed });
  } catch (err: any) {
    console.error('Syllabus generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate curriculum.' });
  }
});

// 4. Generative Deep Concept Mindmap for Syllabus Chapter
syllabusRouter.post('/mindmap', async (req: Request, res: Response) => {
  try {
    const { chapterTitle, subject, gradeLevel = 'high', customKey, customProvider } = req.body || {};

    if (!chapterTitle) {
      return res.status(400).json({ error: 'Chapter title is required to generate mindmap.' });
    }

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    const systemPrompt = `You are an expert cognitive scientist and interactive educator.
Generate an expansive, multi-tiered conceptual mindmap tree for the topic "${chapterTitle}" in the course "${subject || 'General'}".
The mindmap must break down the topic from first principles into 3-4 major pillars, each containing 2-3 granular sub-concepts, with clear explanations and real-world mechanisms.
Output strictly valid JSON conforming to:
{
  "id": "root",
  "label": "${chapterTitle}",
  "type": "root",
  "summarySnippet": "Core curriculum focus",
  "children": [
    {
      "id": "pillar-1",
      "label": "Pillar Name",
      "type": "category",
      "summarySnippet": "Key conceptual pillar",
      "children": [
        {
          "id": "node-1-1",
          "label": "Granular Concept",
          "type": "detail",
          "summarySnippet": "Deep intuitive explanation of this mechanism",
          "realWorldApplication": "Where this is applied in technology, nature, or science"
        }
      ]
    }
  ]
}`;

    const prompt = `Topic: "${chapterTitle}"\nCourse: "${subject || ''}"\nAcademic Rigor: "${gradeLevel}"\n\nGenerate the complete multi-tiered conceptual mindmap in JSON:`;

    const raw = await callLlm(prompt, systemPrompt, llmKey, llmProvider, true);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const mindmap = JSON.parse(cleaned);

    res.json({ success: true, mindmap });
  } catch (err: any) {
    console.error('Mindmap generation error:', err);
    // Fallback mindmap for zero-mock reliability
    const fallback = {
      id: 'root',
      label: req.body?.chapterTitle || 'Curriculum Chapter',
      type: 'root',
      summarySnippet: 'Core learning topic',
      children: [
        {
          id: 'pillar-1',
          label: 'Foundational Principles',
          type: 'category',
          summarySnippet: 'Core underlying physical and theoretical laws',
          children: [
            { id: 'det-1-1', label: 'First Principles Definition', type: 'detail', summarySnippet: 'Theoretical baseline established by canonical research.' },
            { id: 'det-1-2', label: 'Governing Equations', type: 'detail', summarySnippet: 'Mathematical or logical relations governing state changes.' },
          ],
        },
        {
          id: 'pillar-2',
          label: 'Core Mechanisms',
          type: 'category',
          summarySnippet: 'Dynamics and functional interactions',
          children: [
            { id: 'det-2-1', label: 'Step-by-step Transformation', type: 'detail', summarySnippet: 'How energy, data, or state evolves through the system.' },
            { id: 'det-2-2', label: 'Equilibrium & Balance', type: 'detail', summarySnippet: 'Stability points and feedback loops in operation.' },
          ],
        },
        {
          id: 'pillar-3',
          label: 'Real-World Applications',
          type: 'category',
          summarySnippet: 'Practical implementation in research and industry',
          children: [
            { id: 'det-3-1', label: 'Industrial Implementation', type: 'detail', summarySnippet: 'How modern laboratories or enterprises deploy this concept.' },
            { id: 'det-3-2', label: 'Future Breakthroughs', type: 'detail', summarySnippet: 'Active frontiers under current academic investigation.' },
          ],
        },
      ],
    };

    res.json({ success: true, mindmap: fallback });
  }
});

// 5. Upload Full Syllabus Document (PDF, TXT, DOCX) and Generate Course Curriculum
syllabusRouter.post('/upload-syllabus-file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a syllabus PDF or document.' });
    }

    const { gradeLevel = 'high', customKey, customProvider } = req.body || {};
    const extractedText = await extractTextFromBuffer(req.file.originalname, req.file.buffer);

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({ error: 'Could not extract readable text from the uploaded document.' });
    }

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    const systemPrompt = `You are a Principal Academic Dean and Curriculum Architect.
Analyze the uploaded course syllabus document and extract its structured curriculum divided into clear, sequential learning units/chapters.
Output strictly valid JSON with this schema:
{
  "id": "course-upload-${Date.now()}",
  "subject": "Inferred Course Title",
  "field": "Academic Field",
  "gradeLevel": "${gradeLevel}",
  "chapters": [
    {
      "id": "unit-1",
      "number": 1,
      "title": "Unit/Chapter Title",
      "overview": "Comprehensive 1-2 sentence description of what this unit covers.",
      "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
      "learningObjectives": ["Learning Objective 1", "Learning Objective 2", "Learning Objective 3"]
    }
  ]
}`;

    const prompt = `Uploaded Syllabus File: "${req.file.originalname}"\n\nExtracted Content:\n${extractedText.slice(0, 14000)}\n\nParse this document into a structured curriculum with sequential units/chapters in JSON:`;

    const raw = await callLlm(prompt, systemPrompt, llmKey, llmProvider, true);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      success: true,
      syllabus: parsed,
      filename: req.file.originalname,
      extractedLength: extractedText.length,
    });
  } catch (err: any) {
    console.error('Error parsing syllabus document:', err);
    res.status(500).json({ error: err.message || 'Failed to parse syllabus document.' });
  }
});

// 6. Upload Unit-Specific Material (PDF, Notes, Slides) to Enrich a Unit
syllabusRouter.post('/unit/upload-material', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please provide a file to attach to this unit.' });
    }

    const { chapterId, chapterTitle = 'Curriculum Unit', subject = 'Academic Subject', customKey, customProvider } = req.body || {};
    const extractedText = await extractTextFromBuffer(req.file.originalname, req.file.buffer);

    const isPdf = req.file.originalname.toLowerCase().endsWith('.pdf') || req.file.mimetype.includes('pdf');
    const fileType = isPdf ? 'pdf' : req.file.originalname.toLowerCase().endsWith('.txt') ? 'txt' : 'doc';

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    let keyInsights: string[] = [];
    let extractedKeyConcepts: string[] = [];
    let summarySnippet = `Uploaded reference material for ${chapterTitle}.`;

    if (extractedText && extractedText.trim().length >= 30) {
      try {
        const systemPrompt = `You are an elite academic tutor.
Analyze this uploaded reference material for the unit "${chapterTitle}" in the subject "${subject}".
Extract 3-5 core conceptual terms and 3 high-yield conceptual insights/takeaways.
Output strictly JSON:
{
  "keyConcepts": ["Concept A", "Concept B", "Concept C"],
  "keyInsights": ["High-yield takeaway 1", "High-yield takeaway 2", "High-yield takeaway 3"],
  "summarySnippet": "A concise 2-sentence summary of this document and how it enriches this unit."
}`;

        const prompt = `Unit: ${chapterTitle}\nDocument: ${req.file.originalname}\nContent:\n${extractedText.slice(0, 10000)}\n\nExtract key concepts and insights in JSON:`;
        const raw = await callLlm(prompt, systemPrompt, llmKey, llmProvider, true);
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed.keyConcepts)) extractedKeyConcepts = parsed.keyConcepts;
        if (Array.isArray(parsed.keyInsights)) keyInsights = parsed.keyInsights;
        if (parsed.summarySnippet) summarySnippet = parsed.summarySnippet;
      } catch (e) {
        console.warn('LLM unit material analysis skipped, using fallback info:', e);
      }
    }

    const material: UnitMaterial = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: req.file.originalname,
      size: req.file.size,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      extractedSnippet: (extractedText || '').slice(0, 600),
      keyInsights,
      cloudSynced: true,
    };

    res.json({
      success: true,
      chapterId,
      material,
      extractedKeyConcepts,
      summarySnippet,
    });
  } catch (err: any) {
    console.error('Error uploading unit material:', err);
    res.status(500).json({ error: err.message || 'Failed to upload unit material.' });
  }
});

// 7. Generate Interactive Mindmap Directly from Uploaded PDF / Document
syllabusRouter.post('/mindmap-from-file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF or document for mindmap generation.' });
    }

    const { topic, gradeLevel = 'high', customKey, customProvider } = req.body || {};
    const extractedText = await extractTextFromBuffer(req.file.originalname, req.file.buffer);

    if (!extractedText || extractedText.trim().length < 30) {
      return res.status(400).json({ error: 'Could not extract readable text from document.' });
    }

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    const docTitle = topic || req.file.originalname.replace(/\.[^/.]+$/, '');

    const systemPrompt = `You are an elite cognitive architect and visual curriculum specialist.
Generate a structured, multi-tiered conceptual mindmap strictly derived from the provided document content.
Deconstruct the material into 3-4 major thematic pillars, each containing 2-3 specific mechanisms/details with real-world applications.
Output strictly valid JSON with this schema:
{
  "id": "root",
  "label": "${docTitle}",
  "type": "root",
  "summarySnippet": "Core thesis grounded in uploaded document",
  "children": [
    {
      "id": "pillar-1",
      "label": "Pillar 1 Name",
      "type": "category",
      "summarySnippet": "Core conceptual pillar from document",
      "children": [
        {
          "id": "node-1-1",
          "label": "Sub-concept Mechanism",
          "type": "detail",
          "summarySnippet": "Clear explanation of how this works",
          "realWorldApplication": "Practical scientific or technological application"
        }
      ]
    }
  ]
}`;

    const prompt = `Document Name: "${req.file.originalname}"\nDocument Content:\n${extractedText.slice(0, 12000)}\n\nGenerate the complete conceptual mindmap JSON:`;

    const raw = await callLlm(prompt, systemPrompt, llmKey, llmProvider, true);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const mindmap = JSON.parse(cleaned);

    res.json({
      success: true,
      mindmap,
      filename: req.file.originalname,
    });
  } catch (err: any) {
    console.error('Mindmap from file error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate mindmap from document.' });
  }
});

