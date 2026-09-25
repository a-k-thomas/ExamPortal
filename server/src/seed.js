/**
 * Apex Institute of Technology — Academic Demonstration Dataset Seed Script
 *
 * Populates a realistic, coherent fictional academic dataset:
 * - 1 System Administrator / Academic Dean
 * - 4 Faculty Members across CSE, IT, and ECE
 * - 16 Students across departments and study years
 * - 7 Examinations across past, active, upcoming, and draft states
 * - 29 Academic Questions spanning all 4 question types (SINGLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE, SHORT_ANSWER)
 * - 28 Natural Student Attempts evaluated through the canonical evaluationService
 *
 * Usage:
 *   npm run seed  (from server directory)
 *   or: node src/seed.js
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Exam from './models/Exam.js';
import Question from './models/Question.js';
import ExamAttempt from './models/ExamAttempt.js';
import { evaluateAttempt } from './services/evaluationService.js';

// ============================================================================
// 1. FICTIONAL USERS DATA
// ============================================================================

const seedAdmin = {
  name: 'Dr. Arthur Pendelton',
  email: 'admin@example.com',
  password: 'Admin@123',
  role: 'admin',
  phone: '+1 (555) 019-2831',
  department: 'Computer Science & Engineering',
  bio: 'Dean of Academic Affairs & Systems Administrator at Apex Institute of Technology.',
};

const seedTeachers = [
  {
    name: 'Dr. Evelyn Reed',
    email: 'teacher@example.com',
    password: 'Teacher@123',
    role: 'teacher',
    employeeId: 'FAC-CSE-012',
    designation: 'Professor',
    department: 'Computer Science & Engineering',
    phone: '+1 (555) 234-5678',
    bio: 'Professor of Computer Science specializing in Algorithms, Data Structures, and Distributed Systems.',
  },
  {
    name: 'Prof. Marcus Vance',
    email: 'teacher2@example.com',
    password: 'Teacher@123',
    role: 'teacher',
    employeeId: 'FAC-IT-045',
    designation: 'Associate Professor',
    department: 'Information Technology',
    phone: '+1 (555) 345-6789',
    bio: 'Associate Professor of IT focusing on Database Systems, Cloud Computing, and Web Engineering.',
  },
  {
    name: 'Dr. Alok Sharma',
    email: 'teacher.sharma@example.com',
    password: 'Teacher@123',
    role: 'teacher',
    employeeId: 'FAC-ECE-088',
    designation: 'Assistant Professor',
    department: 'Electronics & Communication Engineering',
    phone: '+1 (555) 456-7890',
    bio: 'Assistant Professor in ECE with research focus on Computer Networks, Embedded Systems, and IoT.',
  },
  {
    name: 'Dr. Sarah Chen',
    email: 'teacher.chen@example.com',
    password: 'Teacher@123',
    role: 'teacher',
    employeeId: 'FAC-CSE-091',
    designation: 'Associate Professor',
    department: 'Computer Science & Engineering',
    phone: '+1 (555) 567-8901',
    bio: 'Associate Professor specializing in Operating Systems, Concurrent Programming, and Systems Security.',
  },
];

const seedStudents = [
  // Primary Student Fixture (Required for automated tests & primary demo)
  {
    name: 'Alex Morgan',
    email: 'student@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'CSE-2023-001',
    department: 'Computer Science & Engineering',
    section: 'Section A',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 890-1234',
    bio: 'Junior CSE student passionate about competitive programming, data structures, and full-stack engineering.',
  },
  // CSE - Section A (3rd Year)
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'CSE-2023-014',
    department: 'Computer Science & Engineering',
    section: 'Section A',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 890-1235',
    bio: 'Undergraduate researcher in machine learning and algorithmic optimization.',
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'CSE-2023-022',
    department: 'Computer Science & Engineering',
    section: 'Section A',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 890-1236',
    bio: 'Full-stack developer, open-source contributor, and web architectures student.',
  },
  {
    name: 'Samantha Patel',
    email: 'samantha.patel@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'CSE-2023-035',
    department: 'Computer Science & Engineering',
    section: 'Section A',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 890-1237',
    bio: 'Focusing on distributed databases, concurrent systems, and low-level systems programming.',
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'CSE-2023-048',
    department: 'Computer Science & Engineering',
    section: 'Section A',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 890-1238',
    bio: 'Enthusiast in operating systems kernel development and hardware-software co-design.',
  },
  {
    name: 'Emily Zhang',
    email: 'emily.zhang@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'CSE-2023-059',
    department: 'Computer Science & Engineering',
    section: 'Section A',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 890-1239',
    bio: 'Interested in software architecture, cloud microservices, and user interface design.',
  },
  // IT - Section B (3rd Year)
  {
    name: 'Marcus Brody',
    email: 'marcus.brody@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'IT-2023-102',
    department: 'Information Technology',
    section: 'Section B',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 789-2001',
    bio: 'Database administration, transaction systems, and relational schema optimization.',
  },
  {
    name: 'Aisha Khan',
    email: 'aisha.khan@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'IT-2023-115',
    department: 'Information Technology',
    section: 'Section B',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 789-2002',
    bio: 'Specializing in enterprise networking, firewall administration, and protocol analysis.',
  },
  {
    name: 'Liam O\'Connor',
    email: 'liam.oconnor@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'IT-2023-128',
    department: 'Information Technology',
    section: 'Section B',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 789-2003',
    bio: 'System automation, containerization workflows, and Linux infrastructure management.',
  },
  {
    name: 'Sneha Rao',
    email: 'sneha.rao@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'IT-2023-142',
    department: 'Information Technology',
    section: 'Section B',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 789-2004',
    bio: 'Web engineering, secure authentication protocols, and RESTful microservice development.',
  },
  {
    name: 'Carlos Mendez',
    email: 'carlos.mendez@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'IT-2023-156',
    department: 'Information Technology',
    section: 'Section B',
    yearOfStudy: '3rd Year',
    phone: '+1 (555) 789-2005',
    bio: 'DevOps, CI/CD pipeline automation, and cloud infrastructure monitoring.',
  },
  // ECE - Section A (2nd Year & 4th Year)
  {
    name: 'Maya Lin',
    email: 'maya.lin@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'ECE-2024-007',
    department: 'Electronics & Communication Engineering',
    section: 'Section A',
    yearOfStudy: '2nd Year',
    phone: '+1 (555) 678-3001',
    bio: 'Sophomore ECE student exploring wireless transmission, microcontrollers, and digital logic.',
  },
  {
    name: 'Jordan Taylor',
    email: 'jordan.taylor@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'ECE-2024-019',
    department: 'Electronics & Communication Engineering',
    section: 'Section A',
    yearOfStudy: '2nd Year',
    phone: '+1 (555) 678-3002',
    bio: 'Signal processing, FPGA programming, and circuit simulation enthusiast.',
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'ECE-2024-031',
    department: 'Electronics & Communication Engineering',
    section: 'Section A',
    yearOfStudy: '2nd Year',
    phone: '+1 (555) 678-3003',
    bio: 'Internet of Things, sensor telemetry networks, and embedded firmware programming.',
  },
  {
    name: 'Tariq Al-Mansoor',
    email: 'tariq.almansoor@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'ECE-2022-004',
    department: 'Electronics & Communication Engineering',
    section: 'Section A',
    yearOfStudy: '4th Year',
    phone: '+1 (555) 678-3004',
    bio: 'Senior ECE student conducting capstone research on 5G millimeter wave transmission systems.',
  },
  {
    name: 'Chloe Bennett',
    email: 'chloe.bennett@example.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'ECE-2022-018',
    department: 'Electronics & Communication Engineering',
    section: 'Section A',
    yearOfStudy: '4th Year',
    phone: '+1 (555) 678-3005',
    bio: 'Senior ECE student preparing for graduate studies in communications engineering and radar signal analysis.',
  },
];

// ============================================================================
// 2. EXAM DEFINITIONS & DETAILED QUESTIONS
// ============================================================================

const getExamCatalog = (teacherMap) => {
  const now = Date.now();

  return [
    // ------------------------------------------------------------------------
    // Exam 1: CS301 (Past Completed)
    // ------------------------------------------------------------------------
    {
      key: 'exam1',
      exam: {
        title: 'CS301: Data Structures & Algorithms Midterm',
        description:
          'Mid-semester formal evaluation covering balanced binary search trees, asymptotic analysis, graph search algorithms, and dynamic programming paradigms.',
        instructions:
          'Read each question carefully. Select or enter the most accurate answer. Multiple-select questions require identifying all correct options.',
        duration: 60,
        startTime: new Date(now - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endTime: new Date(now - 2 * 24 * 60 * 60 * 1000),   // 2 days ago
        status: 'published',
        createdBy: teacherMap['teacher@example.com']._id,
      },
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'What is the worst-case time complexity of searching for an element in an AVL tree containing N keys?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
          correctAnswer: 'O(log N)',
          marks: 4,
          order: 1,
          explanation: 'In an AVL tree, the heights of two child subtrees of any node differ by at most one. Because the tree maintains strict logarithmic balance at all times, searching for an element requires at most O(log N) comparisons.',
        },
        {
          questionType: 'MULTIPLE_SELECT',
          questionText: 'Which of the following sorting algorithms have an average-case time complexity of O(N log N)? (Select all that apply)',
          options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort', 'Insertion Sort'],
          correctAnswers: ['Heap Sort', 'Merge Sort', 'Quick Sort'],
          marks: 4,
          order: 2,
          explanation: 'Merge Sort and Heap Sort guarantee O(N log N) time complexity in all cases. Quick Sort averages O(N log N), though its worst case is O(N^2). Bubble Sort and Insertion Sort have average complexities of O(N^2).',
        },
        {
          questionType: 'TRUE_FALSE',
          questionText: 'In a min-heap, the root node always contains the smallest key among all nodes in the heap.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 4,
          order: 3,
          explanation: 'By definition of the min-heap property, every parent node has a key less than or equal to its children, meaning the global minimum always resides at the root node.',
        },
        {
          questionType: 'SHORT_ANSWER',
          questionText: 'Which graph traversal strategy uses a FIFO queue data structure to visit vertices level by level?',
          acceptedAnswers: ['Breadth First Search', 'BFS', 'Breadth-First Search'],
          marks: 4,
          order: 4,
          explanation: 'Breadth-First Search (BFS) explores vertices neighbor-by-neighbor in concentric levels using a First-In, First-Out (FIFO) queue data structure.',
        },
        {
          questionType: 'SINGLE_CHOICE',
          questionText: "Which algorithmic design paradigm is primarily employed in Dijkstra's single-source shortest path algorithm?",
          options: ['Greedy Algorithm', 'Dynamic Programming', 'Divide and Conquer', 'Backtracking'],
          correctAnswer: 'Greedy Algorithm',
          marks: 4,
          order: 5,
          explanation: "Dijkstra's algorithm repeatedly selects the unvisited vertex with the minimum provisional distance, making the locally optimal choice at each step without backtracking.",
        },
      ],
    },

    // ------------------------------------------------------------------------
    // Exam 2: IT304 (Past Completed)
    // ------------------------------------------------------------------------
    {
      key: 'exam2',
      exam: {
        title: 'IT304: Database Management Systems Evaluation',
        description:
          'Assessment of relational model foundations, SQL query semantics, normalization theory (1NF through BCNF), and ACID transaction guarantees.',
        instructions:
          'Answer all questions. Ensure answers are submitted prior to window closure. Partial credit is not awarded for multiple select questions.',
        duration: 45,
        startTime: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endTime: new Date(now - 1 * 24 * 60 * 60 * 1000),   // 1 day ago
        status: 'published',
        createdBy: teacherMap['teacher2@example.com']._id,
      },
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'Which normal form strictly eliminates transitive functional dependencies on the primary key?',
          options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
          correctAnswer: 'Third Normal Form (3NF)',
          marks: 3,
          order: 1,
          explanation: '3NF requires that the relation is in 2NF and no non-prime attribute is transitively dependent on the primary key (every non-prime attribute must depend only on candidate keys).',
        },
        {
          questionType: 'MULTIPLE_SELECT',
          questionText: 'Which of the following constitute the four core ACID properties in database transaction management? (Select all that apply)',
          options: ['Atomicity', 'Consistency', 'Isolation', 'Durability', 'Availability', 'Partition Tolerance'],
          correctAnswers: ['Atomicity', 'Consistency', 'Durability', 'Isolation'],
          marks: 4,
          order: 2,
          explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability. Availability and Partition Tolerance are part of the CAP theorem, not the ACID transaction model.',
        },
        {
          questionType: 'TRUE_FALSE',
          questionText: 'A primary key column in a relational SQL database is permitted to contain NULL values.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          marks: 4,
          order: 3,
          explanation: 'By the entity integrity constraint in the relational model, primary keys must uniquely identify records and are strictly prohibited from storing NULL values.',
        },
        {
          questionType: 'SHORT_ANSWER',
          questionText: 'What is the standard balanced tree data structure predominantly used by relational DBMS engines (e.g., MySQL InnoDB, PostgreSQL) for indexing table columns?',
          acceptedAnswers: ['B+ Tree', 'B+Tree', 'B-Tree', 'B Tree'],
          marks: 4,
          order: 4,
          explanation: 'B+ Trees store all actual record pointers in leaf nodes linked sequentially, making them ideal for both point queries and sequential range scans on block storage.',
        },
      ],
    },

    // ------------------------------------------------------------------------
    // Exam 3: CS305 (Active / Open Now)
    // ------------------------------------------------------------------------
    {
      key: 'exam3',
      exam: {
        title: 'CS305: Operating Systems & Systems Programming',
        description:
          'Evaluation covering process synchronization primitives, CPU scheduling algorithms, virtual memory paging, and deadlock mitigation techniques.',
        instructions:
          'You may navigate between questions freely. Answers are saved as you proceed. The assessment auto-submits when the timer reaches zero.',
        duration: 50,
        startTime: new Date(now - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
        endTime: new Date(now + 3 * 24 * 60 * 60 * 1000),   // Closes in 3 days
        status: 'published',
        createdBy: teacherMap['teacher.chen@example.com']._id,
      },
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'Which CPU scheduling algorithm is non-preemptive and assigns the CPU to the process with the smallest predicted burst time?',
          options: ['Round Robin', 'Shortest Job First (SJF)', 'First-Come First-Served (FCFS)', 'Priority Scheduling (Preemptive)'],
          correctAnswer: 'Shortest Job First (SJF)',
          marks: 4,
          order: 1,
        },
        {
          questionType: 'MULTIPLE_SELECT',
          questionText: "Which of the following conditions are necessary and sufficient for an operating system deadlock to occur (Coffman's conditions)? (Select all that apply)",
          options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait', 'Aging', 'Demand Paging'],
          correctAnswers: ['Circular Wait', 'Hold and Wait', 'Mutual Exclusion', 'No Preemption'],
          marks: 4,
          order: 2,
        },
        {
          questionType: 'TRUE_FALSE',
          questionText: 'Thrashing occurs in an operating system when the processor spends more time swapping pages into and out of memory than executing actual instructions.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 4,
          order: 3,
        },
        {
          questionType: 'SHORT_ANSWER',
          questionText: 'What standard Unix POSIX system call creates a new child process that is an exact duplicate copy of the calling process?',
          acceptedAnswers: ['fork', 'fork()'],
          marks: 4,
          order: 4,
        },
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'In virtual memory architecture, what mapping does the Translation Lookaside Buffer (TLB) cache at hardware speeds?',
          options: ['Virtual page numbers to physical frame numbers', 'Hard disk sectors to RAM block addresses', 'Process IDs to kernel thread pointers', 'File descriptors to inode locations'],
          correctAnswer: 'Virtual page numbers to physical frame numbers',
          marks: 4,
          order: 5,
        },
      ],
    },

    // ------------------------------------------------------------------------
    // Exam 4: EC208 (Active / Open Now)
    // ------------------------------------------------------------------------
    {
      key: 'exam4',
      exam: {
        title: 'EC208: Computer Networks & Protocol Design',
        description:
          'Covers the OSI 7-layer reference model, TCP/IP congestion control mechanisms, IPv4 subnetting, and application-layer protocols.',
        instructions:
          'Answer all 4 questions. Ensure reliable internet connectivity before starting your session. Short answer inputs are case-insensitive.',
        duration: 40,
        startTime: new Date(now - 1 * 24 * 60 * 60 * 1000), // Started 1 day ago
        endTime: new Date(now + 4 * 24 * 60 * 60 * 1000),   // Closes in 4 days
        status: 'published',
        createdBy: teacherMap['teacher.sharma@example.com']._id,
      },
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'At which layer of the standard OSI 7-layer reference model does the Internet Protocol (IP) reside and route packets?',
          options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Session Layer'],
          correctAnswer: 'Network Layer',
          marks: 3,
          order: 1,
        },
        {
          questionType: 'MULTIPLE_SELECT',
          questionText: 'Which of the following transport layer protocols provide reliable, connection-oriented data transfer with sequence numbering? (Select all that apply)',
          options: ['TCP (Transmission Control Protocol)', 'UDP (User Datagram Protocol)', 'SCTP (Stream Control Transmission Protocol)', 'ICMP (Internet Control Message Protocol)'],
          correctAnswers: ['SCTP (Stream Control Transmission Protocol)', 'TCP (Transmission Control Protocol)'],
          marks: 4,
          order: 2,
        },
        {
          questionType: 'TRUE_FALSE',
          questionText: 'In IPv4 CIDR subnetting, a /24 network prefix allocates 256 total IP addresses, providing 254 usable host addresses.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 4,
          order: 3,
        },
        {
          questionType: 'SHORT_ANSWER',
          questionText: 'Which critical Internet protocol resolves human-friendly hostname strings into numeric IP addresses?',
          acceptedAnswers: ['DNS', 'Domain Name System'],
          marks: 4,
          order: 4,
        },
      ],
    },

    // ------------------------------------------------------------------------
    // Exam 5: CS402 (Active / Open Now — Brand New Today)
    // ------------------------------------------------------------------------
    {
      key: 'exam5',
      exam: {
        title: 'CS402: Advanced Web Technologies & Distributed Systems',
        description:
          'Modern web engineering assessment covering microservice architectures, asynchronous event queues, WebSocket protocols, and stateless token security.',
        instructions:
          'Examination is open for student submissions. Select or input the most appropriate answer for each question.',
        duration: 45,
        startTime: new Date(now - 3 * 60 * 60 * 1000),     // Opened 3 hours ago
        endTime: new Date(now + 5 * 24 * 60 * 60 * 1000),  // Closes in 5 days
        status: 'published',
        createdBy: teacherMap['teacher2@example.com']._id,
      },
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'Which HTTP status code is officially designated by RFC 9110 for successful POST requests that result in resource creation?',
          options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
          correctAnswer: '201 Created',
          marks: 3,
          order: 1,
        },
        {
          questionType: 'MULTIPLE_SELECT',
          questionText: 'Which of the following are primary advantages of employing asynchronous message queues (e.g., RabbitMQ, Apache Kafka) between distributed microservices? (Select all that apply)',
          options: ['Decoupling publisher and consumer services', 'Absorbing sudden bursts of network traffic (load leveling)', 'Enforcing synchronous lock contention across all nodes', 'Providing buffering resilience during temporary downstream service outages'],
          correctAnswers: [
            'Absorbing sudden bursts of network traffic (load leveling)',
            'Decoupling publisher and consumer services',
            'Providing buffering resilience during temporary downstream service outages',
          ],
          marks: 4,
          order: 2,
        },
        {
          questionType: 'TRUE_FALSE',
          questionText: 'The WebSocket protocol provides persistent, full-duplex, bidirectional communication channels established over a single TCP connection.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 4,
          order: 3,
        },
        {
          questionType: 'SHORT_ANSWER',
          questionText: 'What industry-standard acronym denotes a compact, URL-safe JSON container consisting of header, payload, and HMAC/RSA signature segments?',
          acceptedAnswers: ['JWT', 'JSON Web Token'],
          marks: 4,
          order: 4,
        },
      ],
    },

    // ------------------------------------------------------------------------
    // Exam 6: EC410 (Upcoming / Scheduled)
    // ------------------------------------------------------------------------
    {
      key: 'exam6',
      exam: {
        title: 'EC410: Wireless Sensor Networks & IoT Architectures',
        description:
          'Upcoming departmental assessment on IEEE 802.15.4 Zigbee, MQTT broker topologies, battery-constrained sensor duty cycling, and edge compute nodes.',
        instructions:
          'This examination is scheduled for the upcoming evaluation window. Review lecture modules on low-power sensor design.',
        duration: 60,
        startTime: new Date(now + 3 * 24 * 60 * 60 * 1000), // Starts in 3 days
        endTime: new Date(now + 7 * 24 * 60 * 60 * 1000),   // Ends in 7 days
        status: 'published',
        createdBy: teacherMap['teacher.sharma@example.com']._id,
      },
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'Which lightweight publish-subscribe messaging protocol is most widely used in resource-constrained IoT sensor deployments?',
          options: ['MQTT', 'SOAP', 'BGP', 'FTP'],
          correctAnswer: 'MQTT',
          marks: 5,
          order: 1,
        },
        {
          questionType: 'MULTIPLE_SELECT',
          questionText: 'Which of the following wireless communication technologies are specifically engineered for short-range, low-power mesh networking? (Select all that apply)',
          options: ['Zigbee (IEEE 802.15.4)', 'Bluetooth Low Energy (BLE)', '5G Cellular NR', 'Z-Wave'],
          correctAnswers: ['Bluetooth Low Energy (BLE)', 'Z-Wave', 'Zigbee (IEEE 802.15.4)'],
          marks: 5,
          order: 2,
        },
        {
          questionType: 'TRUE_FALSE',
          questionText: 'In edge computing architectures, sensor data is processed physically closer to the device origin to reduce network latency and bandwidth consumption.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 5,
          order: 3,
        },
        {
          questionType: 'SHORT_ANSWER',
          questionText: 'What term defines the ratio of time an IoT sensor node spends in an active operational state versus low-power sleep state?',
          acceptedAnswers: ['Duty Cycle', 'Duty-Cycle'],
          marks: 5,
          order: 4,
        },
      ],
    },

    // ------------------------------------------------------------------------
    // Exam 7: CS450 (Draft — Faculty Curriculum In Preparation)
    // ------------------------------------------------------------------------
    {
      key: 'exam7',
      exam: {
        title: 'CS450: Cloud Native Architecture & Microservices',
        description:
          'Faculty draft: Container orchestration with Kubernetes, ingress routing, service mesh traffic management, and serverless compute primitives.',
        instructions:
          'Draft state: Examination questions and rubric parameters are currently under departmental peer review.',
        duration: 60,
        startTime: new Date(now + 10 * 24 * 60 * 60 * 1000), // 10 days in future
        endTime: new Date(now + 15 * 24 * 60 * 60 * 1000),   // 15 days in future
        status: 'draft',
        createdBy: teacherMap['teacher@example.com']._id,
      },
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          questionText: 'In Kubernetes, what is the smallest deployable atomic computing unit that encapsulates one or more co-located containers?',
          options: ['Pod', 'ReplicaSet', 'Deployment', 'DaemonSet'],
          correctAnswer: 'Pod',
          marks: 5,
          order: 1,
        },
        {
          questionType: 'MULTIPLE_SELECT',
          questionText: 'Which of the following are capabilities provided by a service mesh proxy such as Envoy or Istio? (Select all that apply)',
          options: ['Mutual TLS (mTLS) service-to-service encryption', 'Distributed request tracing', 'Canary traffic splitting', 'Automatic relational database schema normalization'],
          correctAnswers: ['Canary traffic splitting', 'Distributed request tracing', 'Mutual TLS (mTLS) service-to-service encryption'],
          marks: 5,
          order: 2,
        },
        {
          questionType: 'TRUE_FALSE',
          questionText: 'Serverless functions automatically scale to zero compute instances when no incoming request traffic is present.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 5,
          order: 3,
        },
      ],
    },
  ];
};

// ============================================================================
// 3. MAIN SEED RUNNER
// ============================================================================

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-exam-portal';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to MongoDB at ${mongoUri}`);

    // ------------------------------------------------------------------------
    // Step A: Clean slate for reproducible demonstration dataset
    // ------------------------------------------------------------------------
    console.log('[Seed] Purging existing attempts, questions, exams, and users...');
    await ExamAttempt.deleteMany({});
    await Question.deleteMany({});
    await Exam.deleteMany({});
    await User.deleteMany({});
    console.log('[Seed] Database cleared cleanly.');

    // ------------------------------------------------------------------------
    // Step B: Seed Admin & Faculty Users
    // ------------------------------------------------------------------------
    console.log('[Seed] Creating Administrator and Faculty accounts...');
    const adminUser = await User.create(seedAdmin);
    console.log(`  ✓ Admin: ${adminUser.name} (${adminUser.email})`);

    const teacherMap = {};
    for (const tData of seedTeachers) {
      const tUser = await User.create(tData);
      teacherMap[tUser.email] = tUser;
      console.log(`  ✓ Faculty: ${tUser.name} [${tUser.designation}, ${tUser.department}] (${tUser.email})`);
    }

    // ------------------------------------------------------------------------
    // Step C: Seed Students
    // ------------------------------------------------------------------------
    console.log('[Seed] Creating Student accounts...');
    const studentMap = {};
    for (const sData of seedStudents) {
      const sUser = await User.create(sData);
      studentMap[sUser.email] = sUser;
      console.log(`  ✓ Student: ${sUser.name} [${sUser.studentId}, ${sUser.yearOfStudy}] (${sUser.email})`);
    }

    // ------------------------------------------------------------------------
    // Step D: Seed Exams & Questions
    // ------------------------------------------------------------------------
    console.log('[Seed] Seeding academic examination catalog...');
    const examCatalog = getExamCatalog(teacherMap);
    const createdExams = {};
    const createdQuestions = {};

    for (const entry of examCatalog) {
      const examDoc = await Exam.create(entry.exam);
      createdExams[entry.key] = examDoc;
      createdQuestions[entry.key] = [];

      for (const q of entry.questions) {
        const questionDoc = await Question.create({
          ...q,
          exam: examDoc._id,
        });
        createdQuestions[entry.key].push(questionDoc);
      }

      console.log(
        `  ✓ Exam [${examDoc.status.toUpperCase()}]: "${examDoc.title}" (${createdQuestions[entry.key].length} questions)`
      );
    }

    // ------------------------------------------------------------------------
    // Step E: Seed Natural Student Attempts & Results
    // ------------------------------------------------------------------------
    console.log('[Seed] Generating realistic student attempts and evaluating results...');

    // Helper: evaluate an attempt using canonical evaluationService
    const createAndEvaluateAttempt = async ({
      examDoc,
      studentUser,
      answersInput,
      startedAgoMinutes,
      durationMinutes,
      status = 'submitted',
    }) => {
      const totalMarks = createdQuestions[examDoc.key].reduce((sum, q) => sum + (q.marks || 0), 0);
      const startedAt = new Date(Date.now() - startedAgoMinutes * 60 * 1000);
      const submittedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

      // Create initial in-progress attempt
      const attempt = await ExamAttempt.create({
        exam: examDoc._id,
        student: studentUser._id,
        answers: [],
        score: 0,
        totalMarks,
        startedAt,
        status: 'in_progress',
      });

      // Prepare answer array for evaluation
      const questions = createdQuestions[examDoc.key];
      const finalAnswers = questions.map((q, idx) => ({
        questionId: q._id.toString(),
        selectedAnswer: answersInput[idx] !== undefined ? answersInput[idx] : null,
      }));

      // Evaluate through canonical server service
      await evaluateAttempt(attempt._id, {
        finalAnswers,
        status,
        submittedAt,
      });

      const updated = await ExamAttempt.findById(attempt._id);
      return updated;
    };

    // ------------------------------------------------------------------------
    // 1. Attempts for Exam 1 (CS301 DSA Midterm — 20 Marks Total)
    // Questions:
    // Q1 (4 marks): 'O(log N)'
    // Q2 (4 marks): ['Heap Sort', 'Merge Sort', 'Quick Sort']
    // Q3 (4 marks): 'True'
    // Q4 (4 marks): 'Breadth First Search'
    // Q5 (4 marks): 'Greedy Algorithm'
    // ------------------------------------------------------------------------
    const dsaAttempts = [
      // Primary Test Fixture (Alex Morgan / student@example.com) — 20/20 Perfect Score
      {
        email: 'student@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Merge Sort', 'Quick Sort'], 'True', 'Breadth First Search', 'Greedy Algorithm'],
        startedAgo: 4 * 24 * 60 + 50,
        duration: 42,
      },
      // Priya Sharma — 20/20 Perfect Score
      {
        email: 'priya.sharma@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Merge Sort', 'Quick Sort'], 'True', 'BFS', 'Greedy Algorithm'],
        startedAgo: 4 * 24 * 60 + 40,
        duration: 38,
      },
      // David Kim — 16/20 (Missed Q4 short answer)
      {
        email: 'david.kim@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Merge Sort', 'Quick Sort'], 'True', 'Depth First Search', 'Greedy Algorithm'],
        startedAgo: 4 * 24 * 60 + 30,
        duration: 45,
      },
      // Samantha Patel — 16/20 (Missed Q2 multiple select)
      {
        email: 'samantha.patel@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Merge Sort'], 'True', 'Breadth-First Search', 'Greedy Algorithm'],
        startedAgo: 4 * 24 * 60 + 20,
        duration: 48,
      },
      // Emily Zhang — 16/20 (Missed Q5)
      {
        email: 'emily.zhang@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Merge Sort', 'Quick Sort'], 'True', 'BFS', 'Dynamic Programming'],
        startedAgo: 3 * 24 * 60 + 50,
        duration: 44,
      },
      // Rohan Verma — 12/20 (Missed Q1 and Q4)
      {
        email: 'rohan.verma@example.com',
        answers: ['O(N)', ['Heap Sort', 'Merge Sort', 'Quick Sort'], 'True', 'Binary Search', 'Greedy Algorithm'],
        startedAgo: 3 * 24 * 60 + 35,
        duration: 52,
      },
      // Marcus Brody — 12/20 (Missed Q2 and Q3)
      {
        email: 'marcus.brody@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Bubble Sort'], 'False', 'BFS', 'Greedy Algorithm'],
        startedAgo: 3 * 24 * 60 + 20,
        duration: 50,
      },
      // Aisha Khan — 20/20 Perfect Score
      {
        email: 'aisha.khan@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Merge Sort', 'Quick Sort'], 'True', 'Breadth First Search', 'Greedy Algorithm'],
        startedAgo: 3 * 24 * 60 + 10,
        duration: 36,
      },
      // Liam O'Connor — 12/20 (Missed Q4 and Q5)
      {
        email: 'liam.oconnor@example.com',
        answers: ['O(log N)', ['Heap Sort', 'Merge Sort', 'Quick Sort'], 'True', 'Linear Scan', 'Divide and Conquer'],
        startedAgo: 2 * 24 * 60 + 60,
        duration: 54,
      },
      // Sneha Rao — 8/20 (Struggling: got Q1 and Q3 correct)
      {
        email: 'sneha.rao@example.com',
        answers: ['O(log N)', ['Merge Sort'], 'True', 'DFS', 'Backtracking'],
        startedAgo: 2 * 24 * 60 + 40,
        duration: 58,
      },
      // Carlos Mendez — 8/20 (Auto-submitted on timeout)
      {
        email: 'carlos.mendez@example.com',
        answers: ['O(log N)', ['Quick Sort', 'Bubble Sort'], 'True', null, null],
        startedAgo: 2 * 24 * 60 + 20,
        duration: 60,
        status: 'auto_submitted',
      },
      // Maya Lin — 4/20 (Sophomore attempting junior exam)
      {
        email: 'maya.lin@example.com',
        answers: ['O(N)', ['Bubble Sort'], 'True', 'Dijkstra', 'Backtracking'],
        startedAgo: 2 * 24 * 60 + 10,
        duration: 47,
      },
    ];

    for (const att of dsaAttempts) {
      const studentUser = studentMap[att.email];
      const examDoc = createdExams.exam1;
      examDoc.key = 'exam1';
      const evaluated = await createAndEvaluateAttempt({
        examDoc,
        studentUser,
        answersInput: att.answers,
        startedAgoMinutes: att.startedAgo,
        durationMinutes: att.duration,
        status: att.status || 'submitted',
      });
      console.log(`  ✓ Exam 1 Attempt: ${studentUser.name} -> ${evaluated.score}/${evaluated.totalMarks} [${evaluated.status}]`);
    }

    // ------------------------------------------------------------------------
    // 2. Attempts for Exam 2 (IT304 DBMS Evaluation — 15 Marks Total)
    // Questions:
    // Q1 (3 marks): 'Third Normal Form (3NF)'
    // Q2 (4 marks): ['Atomicity', 'Consistency', 'Durability', 'Isolation']
    // Q3 (4 marks): 'False'
    // Q4 (4 marks): 'B+ Tree'
    // ------------------------------------------------------------------------
    const dbmsAttempts = [
      // Alex Morgan (student@example.com) — 15/15
      {
        email: 'student@example.com',
        answers: ['Third Normal Form (3NF)', ['Atomicity', 'Consistency', 'Durability', 'Isolation'], 'False', 'B+ Tree'],
        startedAgo: 3 * 24 * 60 + 30,
        duration: 31,
      },
      // Marcus Brody — 15/15
      {
        email: 'marcus.brody@example.com',
        answers: ['Third Normal Form (3NF)', ['Atomicity', 'Consistency', 'Durability', 'Isolation'], 'False', 'B+Tree'],
        startedAgo: 3 * 24 * 60 + 15,
        duration: 29,
      },
      // Aisha Khan — 15/15
      {
        email: 'aisha.khan@example.com',
        answers: ['Third Normal Form (3NF)', ['Atomicity', 'Consistency', 'Durability', 'Isolation'], 'False', 'B+ Tree'],
        startedAgo: 2 * 24 * 60 + 50,
        duration: 33,
      },
      // David Kim — 15/15
      {
        email: 'david.kim@example.com',
        answers: ['Third Normal Form (3NF)', ['Atomicity', 'Consistency', 'Durability', 'Isolation'], 'False', 'B Tree'],
        startedAgo: 2 * 24 * 60 + 30,
        duration: 35,
      },
      // Sneha Rao — 11/15 (Missed Q3)
      {
        email: 'sneha.rao@example.com',
        answers: ['Third Normal Form (3NF)', ['Atomicity', 'Consistency', 'Durability', 'Isolation'], 'True', 'B+ Tree'],
        startedAgo: 2 * 24 * 60 + 15,
        duration: 39,
      },
      // Carlos Mendez — 7/15 (Missed Q1 and Q2)
      {
        email: 'carlos.mendez@example.com',
        answers: ['Second Normal Form (2NF)', ['Atomicity', 'Consistency'], 'False', 'B+ Tree'],
        startedAgo: 1 * 24 * 60 + 40,
        duration: 41,
      },
      // Liam O'Connor — 7/15 (Missed Q2 and Q4)
      {
        email: 'liam.oconnor@example.com',
        answers: ['Third Normal Form (3NF)', ['Atomicity', 'Availability'], 'False', 'Red-Black Tree'],
        startedAgo: 1 * 24 * 60 + 20,
        duration: 44,
      },
      // Jordan Taylor — 3/15 (Auto-submitted on timeout)
      {
        email: 'jordan.taylor@example.com',
        answers: ['Third Normal Form (3NF)', null, 'True', null],
        startedAgo: 1 * 24 * 60 + 10,
        duration: 45,
        status: 'auto_submitted',
      },
    ];

    for (const att of dbmsAttempts) {
      const studentUser = studentMap[att.email];
      const examDoc = createdExams.exam2;
      examDoc.key = 'exam2';
      const evaluated = await createAndEvaluateAttempt({
        examDoc,
        studentUser,
        answersInput: att.answers,
        startedAgoMinutes: att.startedAgo,
        durationMinutes: att.duration,
        status: att.status || 'submitted',
      });
      console.log(`  ✓ Exam 2 Attempt: ${studentUser.name} -> ${evaluated.score}/${evaluated.totalMarks} [${evaluated.status}]`);
    }

    // ------------------------------------------------------------------------
    // 3. Attempts for Exam 3 (CS305 OS — Active Exam — 20 Marks Total)
    // 4 students submitted, 1 student currently IN PROGRESS
    // ------------------------------------------------------------------------
    const osAttempts = [
      {
        email: 'priya.sharma@example.com',
        answers: ['Shortest Job First (SJF)', ['Circular Wait', 'Hold and Wait', 'Mutual Exclusion', 'No Preemption'], 'True', 'fork', 'Virtual page numbers to physical frame numbers'],
        startedAgo: 20 * 60, // 20 hours ago
        duration: 35,
      },
      {
        email: 'david.kim@example.com',
        answers: ['Shortest Job First (SJF)', ['Circular Wait', 'Hold and Wait', 'Mutual Exclusion', 'No Preemption'], 'True', 'clone', 'Virtual page numbers to physical frame numbers'],
        startedAgo: 16 * 60,
        duration: 42,
      },
      {
        email: 'samantha.patel@example.com',
        answers: ['Shortest Job First (SJF)', ['Circular Wait', 'Hold and Wait', 'Mutual Exclusion', 'No Preemption'], 'True', 'fork()', 'Hard disk sectors to RAM block addresses'],
        startedAgo: 12 * 60,
        duration: 40,
      },
      {
        email: 'rohan.verma@example.com',
        answers: ['Round Robin', ['Circular Wait', 'Hold and Wait', 'Mutual Exclusion', 'No Preemption'], 'True', 'exec', 'Virtual page numbers to physical frame numbers'],
        startedAgo: 6 * 60,
        duration: 46,
      },
    ];

    for (const att of osAttempts) {
      const studentUser = studentMap[att.email];
      const examDoc = createdExams.exam3;
      examDoc.key = 'exam3';
      const evaluated = await createAndEvaluateAttempt({
        examDoc,
        studentUser,
        answersInput: att.answers,
        startedAgoMinutes: att.startedAgo,
        durationMinutes: att.duration,
        status: 'submitted',
      });
      console.log(`  ✓ Exam 3 Attempt: ${studentUser.name} -> ${evaluated.score}/${evaluated.totalMarks} [${evaluated.status}]`);
    }

    // 1 Student Currently IN PROGRESS in Exam 3 (Emily Zhang)
    const emilyUser = studentMap['emily.zhang@example.com'];
    const exam3Questions = createdQuestions.exam3;
    const inProgressAttempt = await ExamAttempt.create({
      exam: createdExams.exam3._id,
      student: emilyUser._id,
      answers: [
        {
          question: exam3Questions[0]._id,
          selectedAnswer: 'Shortest Job First (SJF)',
          marksAwarded: 0, // not yet submitted
        },
        {
          question: exam3Questions[1]._id,
          selectedAnswer: ['Circular Wait', 'Hold and Wait'],
          marksAwarded: 0,
        },
      ],
      score: 0,
      totalMarks: 20,
      startedAt: new Date(Date.now() - 15 * 60 * 1000), // started 15 minutes ago
      status: 'in_progress',
    });
    console.log(`  ✓ Exam 3 Active Session: ${emilyUser.name} [IN_PROGRESS - Started 15m ago] (id: ${inProgressAttempt._id})`);

    // ------------------------------------------------------------------------
    // 4. Attempts for Exam 4 (EC208 Networks — Active Exam — 15 Marks Total)
    // 3 students submitted
    // ------------------------------------------------------------------------
    const networkAttempts = [
      {
        email: 'tariq.almansoor@example.com',
        answers: ['Network Layer', ['SCTP (Stream Control Transmission Protocol)', 'TCP (Transmission Control Protocol)'], 'True', 'DNS'],
        startedAgo: 14 * 60,
        duration: 28,
      },
      {
        email: 'chloe.bennett@example.com',
        answers: ['Network Layer', ['TCP (Transmission Control Protocol)'], 'True', 'DNS'],
        startedAgo: 10 * 60,
        duration: 32,
      },
      {
        email: 'ananya.iyer@example.com',
        answers: ['Network Layer', ['SCTP (Stream Control Transmission Protocol)', 'TCP (Transmission Control Protocol)'], 'False', 'Domain Name System'],
        startedAgo: 4 * 60,
        duration: 35,
      },
    ];

    for (const att of networkAttempts) {
      const studentUser = studentMap[att.email];
      const examDoc = createdExams.exam4;
      examDoc.key = 'exam4';
      const evaluated = await createAndEvaluateAttempt({
        examDoc,
        studentUser,
        answersInput: att.answers,
        startedAgoMinutes: att.startedAgo,
        durationMinutes: att.duration,
        status: 'submitted',
      });
      console.log(`  ✓ Exam 4 Attempt: ${studentUser.name} -> ${evaluated.score}/${evaluated.totalMarks} [${evaluated.status}]`);
    }

    // ------------------------------------------------------------------------
    // Step F: Verification Summary
    // ------------------------------------------------------------------------
    const totalUsers = await User.countDocuments();
    const totalExams = await Exam.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalAttempts = await ExamAttempt.countDocuments();
    const submittedAttempts = await ExamAttempt.countDocuments({ status: 'submitted' });
    const autoSubmittedAttempts = await ExamAttempt.countDocuments({ status: 'auto_submitted' });
    const inProgressAttempts = await ExamAttempt.countDocuments({ status: 'in_progress' });

    console.log('\n================================================================');
    console.log('APEX INSTITUTE OF TECHNOLOGY — ACADEMIC SEED COMPLETE');
    console.log('================================================================');
    console.log(`Users created:       ${totalUsers} (1 Admin, 4 Teachers, 16 Students)`);
    console.log(`Exams created:       ${totalExams} (2 Past, 3 Active, 1 Upcoming, 1 Draft)`);
    console.log(`Questions created:   ${totalQuestions} (All 4 types represented)`);
    console.log(`Attempts created:    ${totalAttempts} total`);
    console.log(`  - Submitted:       ${submittedAttempts}`);
    console.log(`  - Auto-Submitted:  ${autoSubmittedAttempts}`);
    console.log(`  - In-Progress:     ${inProgressAttempts}`);
    console.log('----------------------------------------------------------------');
    console.log('DEMONSTRATION LOGIN CREDENTIALS:');
    console.log('  Admin:');
    console.log('    Dr. Arthur Pendelton   : admin@example.com   / Admin@123');
    console.log('  Faculty:');
    console.log('    Dr. Evelyn Reed (CSE)  : teacher@example.com / Teacher@123');
    console.log('    Prof. Marcus Vance (IT): teacher2@example.com / Teacher@123');
    console.log('    Dr. Alok Sharma (ECE)  : teacher.sharma@example.com / Teacher@123');
    console.log('    Dr. Sarah Chen (CSE)   : teacher.chen@example.com / Teacher@123');
    console.log('  Students (Password for all: Student@123):');
    console.log('    Alex Morgan (Primary)  : student@example.com (3rd Year CSE)');
    console.log('    Priya Sharma           : priya.sharma@example.com (3rd Year CSE)');
    console.log('    Marcus Brody           : marcus.brody@example.com (3rd Year IT)');
    console.log('    Tariq Al-Mansoor       : tariq.almansoor@example.com (4th Year ECE)');
    console.log('    Maya Lin               : maya.lin@example.com (2nd Year ECE)');
    console.log('================================================================\n');
  } catch (error) {
    console.error('[Seed] Error during database population:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
    process.exit(0);
  }
};

// Execute if run directly via node
seedDatabase();
