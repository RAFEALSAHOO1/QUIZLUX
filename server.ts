import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper to manage JSON DB files
function readJSON(file: string, defaultData: any) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return defaultData;
  }
}

function writeJSON(file: string, data: any) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Interfaces representation matching schemas in PRD
interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string; // e.g. Programming, Aptitude, General Knowledge, Science, Mathematics
  difficulty: "Easy" | "Medium" | "Hard";
  duration: number; // in minutes
  totalMarks: number;
  questions: Question[];
  createdBy: string; // User ID
  createdAt: string;
}

interface Attempt {
  id: string;
  userId: string;
  userFullName: string;
  quizId: string;
  quizTitle: string;
  category: string;
  answers: { questionId: string; selectedOption: string }[];
  score: number;
  accuracy: number; // Percentage
  totalQuestions: number;
  correctAnswersCount: number;
  completedAt: string;
}

// Initial Seeding data
const initialQuizzes: Quiz[] = [
  {
    id: "quiz-1",
    title: "Skeuomorphic & Modern Design UX",
    description: "Explore the golden age of realistic user interfaces! Test your understanding of gradients, drop-shadows, glossy reflections, bevel offsets, and tactile visual affordances.",
    category: "Design",
    difficulty: "Medium",
    duration: 10,
    totalMarks: 30,
    createdBy: "admin-system",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q1-1",
        question: "What is the primary aesthetic purpose of skeuomorphism in user interface design?",
        options: [
          "To reduce memory usage and rendering times in standard web servers",
          "To assist users in transition by mimicking the textures, shadows, and cues of physical real-world objects",
          "To enforce flat neon color grids designed exclusively for dark mode high contrast consoles",
          "To eliminate any drop shadows, highlights, and borders in favor of raw text links"
        ],
        correctAnswer: "To assist users in transition by mimicking the textures, shadows, and cues of physical real-world objects",
        marks: 10
      },
      {
        id: "q1-2",
        question: "In CSS styling, which property combination is commonly used to craft a realistic pressed skeuomorphic button?",
        options: [
          "margin: 0; padding: 0; background-color: transparent;",
          "box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.1); transform: translateY(1px);",
          "filter: grayscale(100%); display: inline-block;",
          "position: absolute; width: 100vw; height: 100vh;"
        ],
        correctAnswer: "box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.1); transform: translateY(1px);",
        marks: 10
      },
      {
        id: "q1-3",
        question: "What visual effect defining glassmorphic components utilizes physical optical backdrop physics?",
        options: [
          "backdrop-filter: blur(20px)",
          "opacity: 0",
          "mix-blend-mode: screen",
          "transform: rotate(45deg)"
        ],
        correctAnswer: "backdrop-filter: blur(20px)",
        marks: 10
      }
    ]
  },
  {
    id: "quiz-2",
    title: "Web Development React & Vite Mastery",
    description: "Are you a seasoned full-stack engineer? Challenge your understanding of React 19 concurrent features, Vite bundling mechanics, virtual DOM, and client-side execution lifecycle.",
    category: "Programming",
    difficulty: "Hard",
    duration: 15,
    totalMarks: 30,
    createdBy: "admin-system",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q2-1",
        question: "Why does the platform recommend disabling Hot Module Replacement (HMR) during automatic AI edits?",
        options: [
          "To prevent browser flickering and compile freezes while intermediate chunks of code are typed",
          "Because React 19 does not support component rendering inside the browser DOM",
          "Because Vite requires a pre-built static bundle inside an Express engine at all times",
          "HMR is forbidden to save database queries and session token lifetimes"
        ],
        correctAnswer: "To prevent browser flickering and compile freezes while intermediate chunks of code are typed",
        marks: 10
      },
      {
        id: "q2-2",
        question: "Which hook should be preferred to prevent infinite re-renders when managing transient objects inside useEffect dependency arrays?",
        options: [
          "useImperativeHandle with standard state parameters",
          "useMemo, or declaring primitive dependency keys rather than passing complex object references directly",
          "useActionState nested within custom standard callback modules",
          "useSyncExternalStore connected to MongoDB Atlas servers"
        ],
        correctAnswer: "useMemo, or declaring primitive dependency keys rather than passing complex object references directly",
        marks: 10
      },
      {
        id: "q2-3",
        question: "How does Vite handle production builds under Node.js environments?",
        options: [
          "By serving TypeScript files natively using real-time slow translation layers",
          "By compiling assets into standard optimized chunks in the public dist/ output directory",
          "By compiling Express backends into single-threaded C++ binaries",
          "Vite handles builds by outsourcing HTML rendering to global WebSockets"
        ],
        correctAnswer: "By compiling assets into standard optimized chunks in the public dist/ output directory",
        marks: 10
      }
    ]
  },
  {
    id: "quiz-3",
    title: "Space Science & Cosmic Exploration",
    description: "Launch into orbit and journey through deep space! Crack tough multi-choice questions on astronomical horizons, gravitational physics, and futuristic rocket propulsions.",
    category: "Science",
    difficulty: "Easy",
    duration: 8,
    totalMarks: 20,
    createdBy: "admin-system",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q3-1",
        question: "What is the physical boundary surrounding a black hole from which nothing, not even light, can escape?",
        options: [
          "The Schwarzschild Radius Event Horizon",
          "The Nebula Accretion Buffer Zone",
          "The Heliopause Quantum Core",
          "The Kepler Planet Transit Horizon"
        ],
        correctAnswer: "The Schwarzschild Radius Event Horizon",
        marks: 10
      },
      {
        id: "q3-2",
        question: "Which of these is the primary power generation process fueling our stellar solar engine?",
        options: [
          "Fossilized Carbon Combustion",
          "Nuclear Fusion converting Hydrogen isotopes into Helium",
          "Fission of Heavy transuranic radioactive elements",
          "Endothermic Magnetic Gravitational Induction"
        ],
        correctAnswer: "Nuclear Fusion converting Hydrogen isotopes into Helium",
        marks: 10
      }
    ]
  }
];

const quizElite30: Quiz = {
  id: "quiz-elite-30",
  title: "Ultimate Full-Stack General Knowledge Exam",
  description: "A comprehensive core syllabus trial containing 30 meticulously constructed questions covering HTML, CSS, JavaScript, TypeScript, React runtime scheduling, Docker containment, and distributed database strategies.",
  category: "Programming",
  difficulty: "Hard",
  duration: 45,
  totalMarks: 300,
  createdBy: "admin-system",
  createdAt: new Date().toISOString(),
  questions: [
    {
      id: "q-e30-1",
      question: "What is the primary visual difference between placing HTML elements in a 'block' representation versus 'inline'?",
      options: [
        "Block elements start on a new line and take up the full horizontal width; inline elements do not start on a new line and only take up as much width as necessary.",
        "Block elements bypass the box model entirely; inline elements enforce strict margins and border thicknesses.",
        "Block elements can only store interactive anchor hyperlinks; inline elements store any list layout.",
        "Block elements prevent custom scroll handlers; inline elements are exclusively rendered in real-time server trees."
      ],
      correctAnswer: "Block elements start on a new line and take up the full horizontal width; inline elements do not start on a new line and only take up as much width as necessary.",
      marks: 10
    },
    {
      id: "q-e30-2",
      question: "In CSS, how does relative positioning differ from absolute positioning?",
      options: [
        "Relative offsets components with respect to its static default flow position; absolute positions relative to its nearest positioned ancestor.",
        "Relative disables any hover or focus state; absolute retains standard tactile micro-interaction styles.",
        "Relative converts elements into table grid columns; absolute aligns items in circular vector orbits.",
        "Relative handles only desktop view orientations; absolute handles mobile screens natively."
      ],
      correctAnswer: "Relative offsets components with respect to its static default flow position; absolute positions relative to its nearest positioned ancestor.",
      marks: 10
    },
    {
      id: "q-e30-3",
      question: "Which CSS Grid property lets you define custom named template regions explicitly by string layout?",
      options: [
        "grid-template-areas",
        "grid-template-regions",
        "grid-auto-flow-strings",
        "grid-flex-matrix"
      ],
      correctAnswer: "grid-template-areas",
      marks: 10
    },
    {
      id: "q-e30-4",
      question: "What is a JavaScript closure?",
      options: [
        "A function nested inside another that retains access to its outer lexical environment variables even after the outer function has returned.",
        "The process of closing WebSockets manually to release background worker threads.",
        "An internal V8 engine compile freeze triggered by mismatched semicolon formatting.",
        "A security standard that blocks client-side API headers in HTTPS requests."
      ],
      correctAnswer: "A function nested inside another that retains access to its outer lexical environment variables even after the outer function has returned.",
      marks: 10
    },
    {
      id: "q-e30-5",
      question: "In the JavaScript Event Loop, which queue takes operational precedence: the microtask queue or the macrotask (callback) queue?",
      options: [
        "The microtask queue executes completely before the next macrotask is processed from the event queue.",
        "The macrotask queue processes completely before outstanding promise resolutions undergo execution.",
        "They run in parallel on separate background engine CPU cores.",
        "Operational precedence is purely determined by physical CPU frequency stats."
      ],
      correctAnswer: "The microtask queue executes completely before the next macrotask is processed from the event queue.",
      marks: 10
    },
    {
      id: "q-e30-6",
      question: "In JavaScript, what is the precise operational difference between using the triple equals comparison operator (===) versus double equals (==)?",
      options: [
        "Triple equals compares both value and type without performing implicit type coercion; double equals permits type coercion.",
        "Triple equals handles only floating-point integers; double equals compares string patterns exclusively.",
        "Triple equals allocates temporary V8 heap memory blocks; double equals performs operations directly on registers.",
        "Triple equals checks for absolute file existences; double equals checks transient local variables."
      ],
      correctAnswer: "Triple equals compares both value and type without performing implicit type coercion; double equals permits type coercion.",
      marks: 10
    },
    {
      id: "q-e30-7",
      question: "In TypeScript, what does the keyof operator dynamically resolve to?",
      options: [
        "A union type representing the public keys of an object interface",
        "An array list containing actual runtime properties",
        "The cryptographic validation hash of the TS compiler",
        "The private memory address of the defined construct"
      ],
      correctAnswer: "A union type representing the public keys of an object interface",
      marks: 10
    },
    {
      id: "q-e30-8",
      question: "Which TypeScript statement can be extended dynamically at runtime using declaration merging?",
      options: [
        "An interface declaration",
        "A type alias",
        "An enum block",
        "A sealed class structure"
      ],
      correctAnswer: "An interface declaration",
      marks: 10
    },
    {
      id: "q-e30-9",
      question: "How does the React Fiber engine improve rendering performance during complex visual updates?",
      options: [
        "By splitting work into incremental units and enabling pause-and-resume concurrent scheduling loops",
        "By caching fully rendered browser frames inside client canvas storage buffers",
        "By running component lifecycle hooks nested inside Express REST nodes",
        "By converting standard CSS styling definitions into high-speed absolute machine assembly instructions"
      ],
      correctAnswer: "By splitting work into incremental units and enabling pause-and-resume concurrent scheduling loops",
      marks: 10
    },
    {
      id: "q-e30-10",
      question: "In React class components, which lifecycle phase corresponds directly to the functional React.useEffect dependency-free (empty array) mounting step?",
      options: [
        "componentDidMount",
        "componentWillReceiveProps",
        "shouldComponentUpdate",
        "componentWillUnmount"
      ],
      correctAnswer: "componentDidMount",
      marks: 10
    },
    {
      id: "q-e30-11",
      question: "Why should you avoid using an unstable inline array or object as a dependency key directly inside a React.useEffect Hook?",
      options: [
        "Because reference changes cause component comparison failures and trigger infinite re-renders",
        "Because the Vite bundling script fails to compile nested hook matrices in production",
        "Because strict browser security certificates trigger cookie leaks on object changes",
        "Because inline arrays bypass the standard virtual DOM validation pipeline"
      ],
      correctAnswer: "Because reference changes cause component comparison failures and trigger infinite re-renders",
      marks: 10
    },
    {
      id: "q-e30-12",
      question: "What is the primary role of the React key prop when rendering lists of elements dynamically?",
      options: [
        "To help React identify which items have changed, been added, or been removed, optimizing DOM transformations",
        "To establish high-speed inline cryptographic tokens for database rows",
        "To register elements explicitly to global browser navigation indices",
        "To dictate the absolute flex grid ordering scale on desktop monitors"
      ],
      correctAnswer: "To help React identify which items have changed, been added, or been removed, optimizing DOM transformations",
      marks: 10
    },
    {
      id: "q-e30-13",
      question: "In a Node.js runtime, what primary architectural benefit do Streams offer over standard file system read/write utilities?",
      options: [
        "They read and transmit data in minor chunks, preventing immense memory allocation peaks",
        "They encrypt files with AES security handshakes synchronously",
        "They force Vite bundle servers to reload without triggering frame interruptions",
        "They bypass memory registers to execute directly on SSD chips"
      ],
      correctAnswer: "They read and transmit data in minor chunks, preventing immense memory allocation peaks",
      marks: 10
    },
    {
      id: "q-e30-14",
      question: "What design pattern powers Node.js non-blocking, asynchronous I/O execution loop?",
      options: [
        "Reactor pattern implementing single-threaded event demultiplexing",
        "Relational master-slave multi-database replication model",
        "Synchronous thread pooling locking memory zones sequentially",
        "Bidirectional pipeline layout utilizing virtual class components"
      ],
      correctAnswer: "Reactor pattern implementing single-threaded event demultiplexing",
      marks: 10
    },
    {
      id: "q-e30-15",
      question: "Which status code should an API return when the user is logged in, but lacks permissions to access the requested admin resources?",
      options: [
        "403 Forbidden",
        "401 Unauthorized",
        "404 Not Found",
        "400 Bad Request"
      ],
      correctAnswer: "403 Forbidden",
      marks: 10
    },
    {
      id: "q-e30-16",
      question: "Which of these HTTP request methods is classified as strictly idempotent by REST API standards?",
      options: [
        "GET, PUT, and DELETE",
        "POST, PATCH, and OPTIONS",
        "POST only",
        "All HTTP methods are idempotent by default"
      ],
      correctAnswer: "GET, PUT, and DELETE",
      marks: 10
    },
    {
      id: "q-e30-17",
      question: "In SQL query execution, what is the core operational difference between an INNER JOIN and a LEFT JOIN?",
      options: [
        "INNER JOIN yields records matching in both tables; LEFT JOIN yields all matching elements plus unmatched rows from the left table.",
        "INNER JOIN yields only even-numbered database rows; LEFT JOIN queries rows containing string characters.",
        "INNER JOIN requires relational foreign indexes; LEFT JOIN executes on temporary workspace logs.",
        "INNER JOIN locks full database tables; LEFT JOIN permits parallel admin writes."
      ],
      correctAnswer: "INNER JOIN yields records matching in both tables; LEFT JOIN yields all matching elements plus unmatched rows from the left table.",
      marks: 10
    },
    {
      id: "q-e30-18",
      question: "Which underlying data structure is most commonly utilized by relational SQL engines to index table columns for high-speed lookups?",
      options: [
        "B-Tree (Balanced Tree) or its B+ Tree derivations",
        "Singly Linked List with bubble sort pointers",
        "Unordered Hash Map with standard collision arrays",
        "Depth-First Directed Acyclic Graphs"
      ],
      correctAnswer: "B-Tree (Balanced Tree) or its B+ Tree derivations",
      marks: 10
    },
    {
      id: "q-e30-19",
      question: "Which database choice is best characterized as a document-based NoSQL store?",
      options: [
        "MongoDB",
        "PostgreSQL",
        "Redis",
        "SQLite"
      ],
      correctAnswer: "MongoDB",
      marks: 10
    },
    {
      id: "q-e30-20",
      question: "In Docker container virtualization, how does build caching speed up successive deployments?",
      options: [
        "By storing unmodified layer results from previous builds and reusing them sequentially if prior instructions match",
        "By compressing the local file workspace into background ZIP folders on high-speed servers",
        "By bypassing Dockerfile instructions entirely if the user accepts the terms in AI Studio",
        "By running pre-installed dependencies from global cloud-hosted Docker repositories"
      ],
      correctAnswer: "By storing unmodified layer results from previous builds and reusing them sequentially if prior instructions match",
      marks: 10
    },
    {
      id: "q-e30-21",
      question: "What is the primary role of a CI/CD automation pipeline in modern DevOps environments?",
      options: [
        "To enforce rigorous quality gates, run tests, lint scripts, verify builds, and deploy code automatically on commits",
        "To generate custom vector logos using Gemini AI models on background servers",
        "To monitor container port numbers and block unauthenticated terminal commands",
        "To manage localStorage persistence and database user accounts dynamically"
      ],
      correctAnswer: "To enforce rigorous quality gates, run tests, lint scripts, verify builds, and deploy code automatically on commits",
      marks: 10
    },
    {
      id: "q-e30-22",
      question: "In Git, what is the key difference between merging a branch versus rebasing it?",
      options: [
        "Merge joins branches with a dedicated integration commit; rebase reapplies commits on top of another base tip for linear history.",
        "Merge destroys historical commit signatures; rebase duplicates full branch files into gitignore blocks.",
        "Merge handles only local workspaces; rebase pushes directories directly to remote Cloud Run instances.",
        "Merge bypasses unresolved conflicts automatically; rebase triggers compile errors in the terminal."
      ],
      correctAnswer: "Merge joins branches with a dedicated integration commit; rebase reapplies commits on top of another base tip for linear history.",
      marks: 10
    },
    {
      id: "q-e30-23",
      question: "Which security vulnerability is defined by injecting malicious client-side scripting code into a victim's web browser?",
      options: [
        "Cross-Site Scripting (XSS)",
        "Cross-Site Request Forgery (CSRF)",
        "SQL Injection",
        "Distributed Denial of Service (DDoS)"
      ],
      correctAnswer: "Cross-Site Scripting (XSS)",
      marks: 10
    },
    {
      id: "q-e30-24",
      question: "How do anti-CSRF (Cross-Site Request Forgery) tokens prevent unauthorized request executions?",
      options: [
        "By validating a secret, user-specific, one-time token matched on the server before executing mutating requests",
        "By checking matching camera and location permissions inside the browser metadata configuration",
        "By hashing static password entries utilizing specialized crypto algorithms",
        "By disabling the external reverse proxy on port 3000"
      ],
      correctAnswer: "By validating a secret, user-specific, one-time token matched on the server before executing mutating requests",
      marks: 10
    },
    {
      id: "q-e30-25",
      question: "What are the three core sections forming a JSON Web Token (JWT) string separation?",
      options: [
        "Header.Payload.Signature",
        "User.Email.Authorization",
        "Algorithm.Secret.Key",
        "Client.Server.Session"
      ],
      correctAnswer: "Header.Payload.Signature",
      marks: 10
    },
    {
      id: "q-e30-26",
      question: "What is the key purpose of the SSL/TLS asymmetric handshake performed during HTTPS session initializations?",
      options: [
        "To securely negotiate symmetric session keys for encrypted communication between client and server",
        "To audit standard database users and roles in the relational engine",
        "To compress standard Vite js chunks for low bandwidth performance",
        "To request frame permissions from the top-level parent host frame"
      ],
      correctAnswer: "To securely negotiate symmetric session keys for encrypted communication between client and server",
      marks: 10
    },
    {
      id: "q-e30-27",
      question: "How does the browser technique of lazy-loading visual assets improve performance metrics?",
      options: [
        "By deferring the network loading of off-screen elements until they enter or approach the active viewport",
        "By converting JPG/PNG visuals into inline CSS gradients dynamically",
        "By storing images directly on Node.js RAM memory buffers on start",
        "By filtering options in real-time inside key-value state parameters"
      ],
      correctAnswer: "By deferring the network loading of off-screen elements until they enter or approach the active viewport",
      marks: 10
    },
    {
      id: "q-e30-28",
      question: "In DNS resolution, which server is contacted first to resolve the IP address corresponding to a requested domain name like google.com?",
      options: [
        "A recursive DNS resolver",
        "A Root Nameserver",
        "A TLD Nameserver",
        "An Authoritative Nameserver"
      ],
      correctAnswer: "A recursive DNS resolver",
      marks: 10
    },
    {
      id: "q-e30-29",
      question: "In a Balanced Binary Search Tree (BST) like an AVL or Red-Black Tree, what is the worst-case time complexity of lookup, insertion, and deletion operations?",
      options: [
        "O(log n)",
        "O(1)",
        "O(n)",
        "O(n log n)"
      ],
      correctAnswer: "O(log n)",
      marks: 10
    },
    {
      id: "q-e30-30",
      question: "What is the core target objective of Dijkstra's graph algorithm?",
      options: [
        "Finding the shortest path between a designated starting node and other nodes in a weighted network",
        "Identifying cyclic dependencies in code bundles recursively",
        "Detecting collision coordinates of floating graphical card containers",
        "Generating realistic random questions for scholastic surveys with Gemini"
      ],
      correctAnswer: "Finding the shortest path between a designated starting node and other nodes in a weighted network",
      marks: 10
    }
  ]
};

// Load DB stores
let users = readJSON("users.json", []);
let quizzes = readJSON("quizzes.json", initialQuizzes);

// Ensure our Ultimate 30-questions trial is seeded in active DB store
if (!quizzes.some((q: any) => q.id === "quiz-elite-30")) {
  quizzes.push(quizElite30);
  writeJSON("quizzes.json", quizzes);
}

let attempts: Attempt[] = readJSON("attempts.json", []);

// Add default super admin to users on boot if missing
if (!users.some((u: any) => u.email === "admin@quizlux.com")) {
  users.push({
    id: "admin-default",
    fullName: "Bawya Prabhu (Admin)",
    email: "admin@quizlux.com",
    password: crypto.pbkdf2Sync("admin123", "quizlux-salt", 1000, 64, "sha512").toString("hex"),
    role: "admin",
    isVerified: true,
    createdAt: new Date().toISOString()
  });
  writeJSON("users.json", users);
}

// Cryptography & JWT Simulation Core Setup
const JWT_SECRET = process.env.JWT_SECRET || "quizlux-luxury-super-secret-key-2026";

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, "quizlux-salt", 1000, 64, "sha512").toString("hex");
}

function generateToken(payload: { userId: string; email: string; role: string; fullName: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days expiration
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const decodedBody = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (decodedBody.exp && decodedBody.exp < Math.floor(Date.now() / 1000)) return null;
    return decodedBody;
  } catch (err) {
    return null;
  }
}

// Authentication Middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }
  const token = authHeader.split(" ")[1];
  const verifiedUser = verifyToken(token);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
  (req as any).user = verifiedUser;
  next();
}

function adminMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden! Admin role required." });
  }
  next();
}

// --- REST API ENDPOINTS ---

// Auth Register
app.post("/api/auth/register", (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Full Name, Email, and Password are all required." });
  }
  const emailLower = email.toLowerCase();
  
  // Reload fresh data
  users = readJSON("users.json", []);
  if (users.some((u: any) => u.email === emailLower)) {
    return res.status(400).json({ error: "An account with this email address already exists." });
  }

  const selectedRole = role === "admin" || emailLower.endsWith("@quizlux.com") ? "admin" : "student";
  const newUser = {
    id: `user-${crypto.randomUUID()}`,
    fullName,
    email: emailLower,
    password: hashPassword(password),
    role: selectedRole,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJSON("users.json", users);

  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    fullName: newUser.fullName
  });

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// Auth Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  
  users = readJSON("users.json", []);
  const emailLower = email.toLowerCase();
  const user = users.find((u: any) => u.email === emailLower);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  });

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
});

// Auth Verify Session (me)
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ user: (req as any).user });
});

// Auth Refresh Token
app.post("/api/auth/refresh", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const token = generateToken({
    userId: user.userId || user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  });
  res.json({
    token,
    user: {
      id: user.userId || user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    }
  });
});

// --- Quiz APIs ---

// Create Quiz (Admin Only)
app.post("/api/quiz", authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, category, difficulty, duration, questions } = req.body;
  if (!title || !description || !category || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "Missing required quiz creation fields." });
  }

  quizzes = readJSON("quizzes.json", []);
  
  // Calculate total marks as sum of questions marks
  let totalMarks = 0;
  const formattedQuestions: Question[] = questions.map((q: any, idx: number) => {
    const marks = q.marks ? Number(q.marks) : 10;
    totalMarks += marks;
    return {
      id: q.id || `q-${crypto.randomUUID()}-${idx}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      marks
    };
  });

  const newQuiz: Quiz = {
    id: `quiz-${crypto.randomUUID()}`,
    title,
    description,
    category,
    difficulty: difficulty || "Medium",
    duration: Number(duration) || 10,
    totalMarks,
    questions: formattedQuestions,
    createdBy: (req as any).user.userId,
    createdAt: new Date().toISOString()
  };

  quizzes.push(newQuiz);
  writeJSON("quizzes.json", quizzes);

  res.status(201).json(newQuiz);
});

// Get All Quizzes
app.get("/api/quiz", (req, res) => {
  quizzes = readJSON("quizzes.json", initialQuizzes);
  // Hide answers if not admin to prevent cheating! (Though client can see, let's keep it safe!)
  const safeQuizzes = quizzes.map(q => {
    return {
      ...q,
      questions: q.questions.map(quest => ({
        id: quest.id,
        question: quest.question,
        options: quest.options,
        marks: quest.marks
        // correctAnswer omitted in full index response to prevent client-side cheat inspections
      }))
    };
  });
  res.json(safeQuizzes);
});

// Get Single Quiz (Full with answers when authenticated and about to start)
app.get("/api/quiz/:id", authMiddleware, (req, res) => {
  quizzes = readJSON("quizzes.json", initialQuizzes);
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: "Requested Quiz not found." });
  }
  res.json(quiz);
});

// Update Quiz (Admin Only)
app.put("/api/quiz/:id", authMiddleware, adminMiddleware, (req, res) => {
  quizzes = readJSON("quizzes.json", initialQuizzes);
  const quizIdx = quizzes.findIndex(q => q.id === req.params.id);
  if (quizIdx === -1) {
    return res.status(404).json({ error: "Quiz not found to update." });
  }

  const { title, description, category, difficulty, duration, questions } = req.body;
  
  let totalMarks = 0;
  const formattedQuestions: Question[] = questions.map((q: any, idx: number) => {
    const marks = q.marks ? Number(q.marks) : 10;
    totalMarks += marks;
    return {
      id: q.id || `q-${crypto.randomUUID()}-${idx}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      marks
    };
  });

  quizzes[quizIdx] = {
    ...quizzes[quizIdx],
    title: title || quizzes[quizIdx].title,
    description: description || quizzes[quizIdx].description,
    category: category || quizzes[quizIdx].category,
    difficulty: difficulty || quizzes[quizIdx].difficulty,
    duration: duration ? Number(duration) : quizzes[quizIdx].duration,
    questions: formattedQuestions.length > 0 ? formattedQuestions : quizzes[quizIdx].questions,
    totalMarks: formattedQuestions.length > 0 ? totalMarks : quizzes[quizIdx].totalMarks
  };

  writeJSON("quizzes.json", quizzes);
  res.json(quizzes[quizIdx]);
});

// Delete Quiz (Admin Only)
app.delete("/api/quiz/:id", authMiddleware, adminMiddleware, (req, res) => {
  quizzes = readJSON("quizzes.json", initialQuizzes);
  const initialLength = quizzes.length;
  quizzes = quizzes.filter(q => q.id !== req.params.id);
  
  if (quizzes.length === initialLength) {
    return res.status(404).json({ error: "Quiz not found to delete." });
  }

  writeJSON("quizzes.json", quizzes);
  res.json({ success: true, message: "Quiz permanently deleted." });
});

// --- AI Quiz Question Generator Endpoint ---
app.post("/api/quiz/generate", authMiddleware, adminMiddleware, async (req, res) => {
  const { topic, category, difficulty, questionCount } = req.body;
  if (!topic || !category) {
    return res.status(400).json({ error: "Topic and category are required to leverage generative AI." });
  }

  const count = Number(questionCount) || 5;
  const currentDiff = difficulty || "Medium";

  try {
    const prompt = `Create a matching Quiz object with exactly ${count} multiple choice questions about "${topic}" on the subject domain of "${category}" at difficulty level "${currentDiff}".
Return a strict raw JSON matching the following schema. Always output beautiful, high quality, accurate questions and plausible distractors.

Strict JSON format to output:
{
  "title": "A short elegant luxury title themed around ${topic}",
  "description": "An engaging, professional description (2-3 sentences) detailing the focus and scope of this quiz",
  "questions": [
    {
      "question": "The question query here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exactly match one of the direct strings listed in options",
      "marks": 10
    }
  ]
}

Answer with only valid JSON inside the response. Do not surround with backticks or markdown fences, or compile into notes. The Output must be parsed instantly by default JS JSON.parse.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "description", "questions"],
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["question", "options", "correctAnswer", "marks"],
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  marks: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini AI integration failed:", err);
    res.status(500).json({
      error: "Generative AI failed to generate premium questions. This can happen if the safety filters are bypassed or connection is throttled. Please try again with simple wording."
    });
  }
});

// --- Attempt & Results APIs ---

// Submit Quiz Attempt (Student Only)
app.post("/api/attempt", authMiddleware, (req, res) => {
  const { quizId, answers } = req.body; // answers: Array of { questionId, selectedOption }
  if (!quizId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Quiz ID and answers array are required." });
  }

  quizzes = readJSON("quizzes.json", initialQuizzes);
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ error: "Quiz does not exist." });
  }

  // Reload history
  attempts = readJSON("attempts.json", []);

  let score = 0;
  let correctAnswersCount = 0;
  
  quiz.questions.forEach(q => {
    const userAnswer = answers.find(ans => ans.questionId === q.id);
    if (userAnswer && userAnswer.selectedOption === q.correctAnswer) {
      score += q.marks;
      correctAnswersCount++;
    }
  });

  const accuracy = Math.round((correctAnswersCount / quiz.questions.length) * 100) || 0;

  const newAttempt: Attempt = {
    id: `attempt-${crypto.randomUUID()}`,
    userId: (req as any).user.userId,
    userFullName: (req as any).user.fullName,
    quizId: quiz.id,
    quizTitle: quiz.title,
    category: quiz.category,
    answers,
    score,
    accuracy,
    totalQuestions: quiz.questions.length,
    correctAnswersCount,
    completedAt: new Date().toISOString()
  };

  attempts.push(newAttempt);
  writeJSON("attempts.json", attempts);

  res.status(201).json(newAttempt);
});

// Get Single Result
app.get("/api/result/:id", authMiddleware, (req, res) => {
  attempts = readJSON("attempts.json", []);
  const attempt = attempts.find(a => a.id === req.params.id);
  if (!attempt) {
    return res.status(404).json({ error: "Score report / attempt not found." });
  }

  quizzes = readJSON("quizzes.json", initialQuizzes);
  const quiz = quizzes.find(q => q.id === attempt.quizId);

  res.json({
    attempt,
    quiz // Passing full explanation key or correct answers to display on the review page
  });
});

// Get All Attempts for current user (History)
app.get("/api/attempts/history", authMiddleware, (req, res) => {
  attempts = readJSON("attempts.json", []);
  const userAttempts = attempts.filter(a => a.userId === (req as any).user.userId);
  res.json(userAttempts);
});

// --- Leaderboard & Ranking ---
app.get("/api/leaderboard", (req, res) => {
  attempts = readJSON("attempts.json", []);
  
  // Calculate leader score per user
  const userScoresMap: { [userId: string]: { fullName: string; totalScore: number; attemptsCount: number; averageAccuracy: number } } = {};
  
  attempts.forEach(a => {
    if (!userScoresMap[a.userId]) {
      userScoresMap[a.userId] = {
        fullName: a.userFullName || "Anonymous Quizzer",
        totalScore: 0,
        attemptsCount: 0,
        averageAccuracy: 0
      };
    }
    userScoresMap[a.userId].totalScore += a.score;
    userScoresMap[a.userId].attemptsCount += 1;
    userScoresMap[a.userId].averageAccuracy += a.accuracy;
  });

  const structuredLeaderboard = Object.keys(userScoresMap).map(uId => {
    const item = userScoresMap[uId];
    return {
      userId: uId,
      fullName: item.fullName,
      totalScore: item.totalScore,
      attemptsCount: item.attemptsCount,
      averageAccuracy: Math.round(item.averageAccuracy / item.attemptsCount)
    };
  });

  // Sort by Total Score, then on higher Accuracy
  structuredLeaderboard.sort((a, b) => b.totalScore - a.totalScore || b.averageAccuracy - a.averageAccuracy);

  // Assign rankings
  const ranked = structuredLeaderboard.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));

  res.json(ranked);
});

// --- Analytics Endpoint ---
app.get("/api/analytics", authMiddleware, (req, res) => {
  const user = (req as any).user;
  attempts = readJSON("attempts.json", []);
  quizzes = readJSON("quizzes.json", initialQuizzes);
  users = readJSON("users.json", []);

  if (user.role === "admin") {
    // Admin Global Analytics
    const totalQuizzes = quizzes.length;
    const totalUsers = users.length;
    const totalAttemptsCount = attempts.length;
    
    let sumScores = 0;
    attempts.forEach(a => sumScores += a.score);
    const avgScore = totalAttemptsCount > 0 ? Math.round(sumScores / totalAttemptsCount) : 0;

    // Leader counts per category
    const categoryDistribution: { [cat: string]: number } = {};
    quizzes.forEach(q => {
      categoryDistribution[q.category] = (categoryDistribution[q.category] || 0) + 1;
    });

    res.json({
      role: "admin",
      stats: {
        totalQuizzes,
        totalUsers,
        totalAttempts: totalAttemptsCount,
        globalAverageScore: avgScore,
        categoryCounts: categoryDistribution
      }
    });
  } else {
    // Current Student Analytics
    const myAttempts = attempts.filter(a => a.userId === user.userId);
    const totalMyAttempts = myAttempts.length;
    
    let sumMyScores = 0;
    let sumMyAccuracy = 0;
    myAttempts.forEach(a => {
      sumMyScores += a.score;
      sumMyAccuracy += a.accuracy;
    });

    const averageScore = totalMyAttempts > 0 ? Math.round(sumMyScores / totalMyAttempts) : 0;
    const averageAccuracy = totalMyAttempts > 0 ? Math.round(sumMyAccuracy / totalMyAttempts) : 0;

    // Rank from leaderboard calculation
    const leaderboardData = readJSON("attempts.json", []);
    // calculate rank
    const userScores: { [uId: string]: number } = {};
    leaderboardData.forEach((a: any) => {
      userScores[a.userId] = (userScores[a.userId] || 0) + a.score;
    });
    const sortedUserIds = Object.keys(userScores).sort((a, b) => userScores[b] - userScores[a]);
    const currentRank = sortedUserIds.indexOf(user.userId) !== -1 ? sortedUserIds.indexOf(user.userId) + 1 : "-";

    res.json({
      role: "student",
      stats: {
        totalAttempts: totalMyAttempts,
        totalScore: sumMyScores,
        averageScore,
        averageAccuracy,
        currentRank
      }
    });
  }
});

// Configure Vite middleware in development or static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static assets under production environment...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuizLux Full-Stack dev server is running robustly on http://localhost:${PORT}`);
  });
}

startServer();
