/**
 * Marketplace demo seed — 12 verified teacher profiles with LISTED courses/packages.
 * Safe to re-run (upserts by email).
 */
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: false });

const prisma = new PrismaClient();

const TEACHERS = [
  {
    name: "Ankit Sharma",
    email: "ankit.sharma@demo.test",
    phone: "9810000001",
    profile: {
      bio: "IIT Delhi alumnus with 8 years of JEE coaching. Specialises in problem-solving shortcuts for Mechanics and Electrostatics.",
      qualifications: "B.Tech, IIT Delhi (2014). Cleared JEE Advanced with AIR 312.",
      subjects: ["Physics"],
      targetExams: ["JEE Main", "JEE Advanced"],
      teachingExperienceYears: 8,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@ankitsharmaJEE" },
    },
    groupCourse: {
      title: "JEE Physics Crash Course — Mechanics & Waves",
      subject: "Physics",
      targetExam: "JEE Advanced",
      totalSessions: 20,
      sessionDurationMinutes: 90,
      priceINR: 4999,
      maxStudents: 30,
    },
    oneOnOnePackage: {
      title: "1-on-1 Physics Doubt Clearing",
      subject: "Physics",
      targetExam: "JEE Main",
      totalSessions: 8,
      sessionDurationMinutes: 60,
      priceINR: 6400,
    },
  },
  {
    name: "Priya Nair",
    email: "priya.nair@demo.test",
    phone: "9810000002",
    profile: {
      bio: "NEET AIR 28. 6 years teaching Biology for NEET. Known for making complex topics like genetics and cell biology visual and memorable.",
      qualifications: "MBBS, AIIMS Delhi (2017). NEET 2013 AIR 28.",
      subjects: ["Biology"],
      targetExams: ["NEET"],
      teachingExperienceYears: 6,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { instagram: "https://instagram.com/priya_neet_bio" },
    },
    groupCourse: {
      title: "NEET Biology — Complete Syllabus Batch",
      subject: "Biology",
      targetExam: "NEET",
      totalSessions: 40,
      sessionDurationMinutes: 60,
      priceINR: 7999,
      maxStudents: 25,
    },
    oneOnOnePackage: {
      title: "NEET Biology Intensive — 1-on-1",
      subject: "Biology",
      targetExam: "NEET",
      totalSessions: 12,
      sessionDurationMinutes: 60,
      priceINR: 9600,
    },
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@demo.test",
    phone: "9810000003",
    profile: {
      bio: "IIT Bombay Maths topper. 10 years coaching JEE Maths. Calculus, Coordinate Geometry and Probability expert.",
      qualifications: "B.Tech + M.Tech, IIT Bombay (2012). Dept rank 1 in Mathematics.",
      subjects: ["Mathematics"],
      targetExams: ["JEE Main", "JEE Advanced"],
      teachingExperienceYears: 10,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@rahulJEEmaths" },
    },
    groupCourse: {
      title: "JEE Maths — Calculus & Coordinate Geometry",
      subject: "Mathematics",
      targetExam: "JEE Advanced",
      totalSessions: 24,
      sessionDurationMinutes: 90,
      priceINR: 5499,
      maxStudents: 35,
    },
    oneOnOnePackage: {
      title: "JEE Maths 1-on-1 Mentorship",
      subject: "Mathematics",
      targetExam: "JEE Advanced",
      totalSessions: 10,
      sessionDurationMinutes: 75,
      priceINR: 8500,
    },
  },
  {
    name: "Sneha Kulkarni",
    email: "sneha.kulkarni@demo.test",
    phone: "9810000004",
    profile: {
      bio: "Organic Chemistry specialist. 7 years of NEET and JEE Chemistry coaching. Students consistently score 90%+ in Chemistry.",
      qualifications: "M.Sc Chemistry, Pune University (2015). CSIR-NET qualified.",
      subjects: ["Chemistry"],
      targetExams: ["NEET", "JEE Main"],
      teachingExperienceYears: 7,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { instagram: "https://instagram.com/sneha_chem_neet" },
    },
    groupCourse: {
      title: "Organic Chemistry for NEET & JEE",
      subject: "Chemistry",
      targetExam: "NEET",
      totalSessions: 18,
      sessionDurationMinutes: 75,
      priceINR: 3999,
      maxStudents: 30,
    },
    oneOnOnePackage: {
      title: "Chemistry 1-on-1 — Reactions & Mechanisms",
      subject: "Chemistry",
      targetExam: "NEET",
      totalSessions: 8,
      sessionDurationMinutes: 60,
      priceINR: 5600,
    },
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@demo.test",
    phone: "9810000005",
    profile: {
      bio: "Former FIITJEE faculty. Specialises in JEE Advanced Physics — Electrodynamics, Optics, and Modern Physics.",
      qualifications: "M.Sc Physics, Delhi University (2013). 5 years at FIITJEE Delhi.",
      subjects: ["Physics"],
      targetExams: ["JEE Advanced"],
      teachingExperienceYears: 9,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@vikramphysicsJEE" },
    },
    groupCourse: {
      title: "JEE Advanced Physics — Electrodynamics & Optics",
      subject: "Physics",
      targetExam: "JEE Advanced",
      totalSessions: 16,
      sessionDurationMinutes: 90,
      priceINR: 5999,
      maxStudents: 20,
    },
    oneOnOnePackage: {
      title: "Advanced Physics 1-on-1 Sessions",
      subject: "Physics",
      targetExam: "JEE Advanced",
      totalSessions: 6,
      sessionDurationMinutes: 90,
      priceINR: 7200,
    },
  },
  {
    name: "Meera Iyer",
    email: "meera.iyer@demo.test",
    phone: "9810000006",
    profile: {
      bio: "Zoology and Botany expert for NEET. Made over 200 mnemonic charts used by thousands of students.",
      qualifications: "M.Sc Zoology, Madras University (2016). NEET faculty at Allen Kota for 4 years.",
      subjects: ["Biology"],
      targetExams: ["NEET"],
      teachingExperienceYears: 5,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { instagram: "https://instagram.com/meera_neet_bio" },
    },
    groupCourse: {
      title: "NEET Botany & Zoology — Full Syllabus",
      subject: "Biology",
      targetExam: "NEET",
      totalSessions: 36,
      sessionDurationMinutes: 60,
      priceINR: 6999,
      maxStudents: 40,
    },
  },
  {
    name: "Karan Mehta",
    email: "karan.mehta@demo.test",
    phone: "9810000007",
    profile: {
      bio: "Physical Chemistry specialist. Electrochemistry, Thermodynamics, and Chemical Kinetics made easy.",
      qualifications: "B.Tech Chemical Engineering, IIT Kharagpur (2016). JEE Advanced 2012 AIR 189.",
      subjects: ["Chemistry"],
      targetExams: ["JEE Main", "JEE Advanced"],
      teachingExperienceYears: 6,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@karanchemistry" },
    },
    oneOnOnePackage: {
      title: "JEE Physical Chemistry — 1-on-1",
      subject: "Chemistry",
      targetExam: "JEE Main",
      totalSessions: 10,
      sessionDurationMinutes: 60,
      priceINR: 7000,
    },
  },
  {
    name: "Divya Reddy",
    email: "divya.reddy@demo.test",
    phone: "9810000008",
    profile: {
      bio: "JEE Maths faculty with focus on Algebra and Trigonometry. Students improve 30-40 marks in 3 months.",
      qualifications: "M.Sc Mathematics, Hyderabad University (2018). 4 years JEE faculty.",
      subjects: ["Mathematics"],
      targetExams: ["JEE Main"],
      teachingExperienceYears: 4,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { instagram: "https://instagram.com/divya_jee_maths" },
    },
    groupCourse: {
      title: "JEE Maths — Algebra & Trigonometry Batch",
      subject: "Mathematics",
      targetExam: "JEE Main",
      totalSessions: 15,
      sessionDurationMinutes: 75,
      priceINR: 2999,
      maxStudents: 45,
    },
  },
  {
    name: "Arjun Pillai",
    email: "arjun.pillai@demo.test",
    phone: "9810000009",
    profile: {
      bio: "IIT Madras alumnus. Fluid Mechanics, Thermodynamics, and Heat Transfer for JEE. 9 years experience.",
      qualifications: "B.Tech Mechanical, IIT Madras (2013). JEE Advanced AIR 412.",
      subjects: ["Physics"],
      targetExams: ["JEE Main", "JEE Advanced"],
      teachingExperienceYears: 9,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@arjunJEEphysics" },
    },
    oneOnOnePackage: {
      title: "JEE Physics 1-on-1 — Thermodynamics & Fluids",
      subject: "Physics",
      targetExam: "JEE Main",
      totalSessions: 8,
      sessionDurationMinutes: 60,
      priceINR: 5600,
    },
  },
  {
    name: "Kavitha Subramaniam",
    email: "kavitha.sub@demo.test",
    phone: "9810000010",
    profile: {
      bio: "Human Physiology and Genetics for NEET. AIIMS-focused coaching with 95%+ student success rate.",
      qualifications: "MBBS, Madras Medical College (2019). NEET 2015 AIR 62.",
      subjects: ["Biology"],
      targetExams: ["NEET"],
      teachingExperienceYears: 4,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { instagram: "https://instagram.com/kavitha_aiims" },
    },
    groupCourse: {
      title: "NEET Human Physiology & Genetics",
      subject: "Biology",
      targetExam: "NEET",
      totalSessions: 22,
      sessionDurationMinutes: 60,
      priceINR: 4499,
      maxStudents: 30,
    },
    oneOnOnePackage: {
      title: "AIIMS/NEET Biology 1-on-1",
      subject: "Biology",
      targetExam: "NEET",
      totalSessions: 15,
      sessionDurationMinutes: 60,
      priceINR: 10500,
    },
  },
  {
    name: "Rohit Gupta",
    email: "rohit.gupta@demo.test",
    phone: "9810000011",
    profile: {
      bio: "Inorganic and Physical Chemistry for JEE. Former Resonance faculty. 11 years in JEE preparation.",
      qualifications: "M.Sc Chemistry, BHU Varanasi (2011). Resonance Kota faculty for 6 years.",
      subjects: ["Chemistry"],
      targetExams: ["JEE Main", "JEE Advanced"],
      teachingExperienceYears: 11,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@rohitJEEchem" },
    },
    groupCourse: {
      title: "JEE Chemistry — Inorganic & Physical Complete",
      subject: "Chemistry",
      targetExam: "JEE Advanced",
      totalSessions: 28,
      sessionDurationMinutes: 90,
      priceINR: 6499,
      maxStudents: 25,
    },
    oneOnOnePackage: {
      title: "JEE Chemistry 1-on-1 Mentorship",
      subject: "Chemistry",
      targetExam: "JEE Advanced",
      totalSessions: 12,
      sessionDurationMinutes: 75,
      priceINR: 10800,
    },
  },
  {
    name: "Sunita Joshi",
    email: "sunita.joshi@demo.test",
    phone: "9810000012",
    profile: {
      bio: "Statistics, Probability and Permutation-Combination specialist. JEE and KVPY Maths coaching.",
      qualifications: "M.Sc Statistics, Mumbai University (2017). IIT JAM qualified.",
      subjects: ["Mathematics"],
      targetExams: ["JEE Main", "KVPY"],
      teachingExperienceYears: 5,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@sunitaJEEmaths" },
    },
    groupCourse: {
      title: "JEE/KVPY Maths — Statistics & Combinatorics",
      subject: "Mathematics",
      targetExam: "JEE Main",
      totalSessions: 12,
      sessionDurationMinutes: 75,
      priceINR: 2499,
      maxStudents: 50,
    },
    oneOnOnePackage: {
      title: "Maths 1-on-1 — Probability & Statistics",
      subject: "Mathematics",
      targetExam: "JEE Main",
      totalSessions: 6,
      sessionDurationMinutes: 60,
      priceINR: 3600,
    },
  },
];

try {
  for (const t of TEACHERS) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, status: "ACTIVE" },
      create: { name: t.name, email: t.email, phone: t.phone, role: "TEACHER", status: "ACTIVE" },
    });

    await prisma.teacherProfile.upsert({
      where: { teacherId: user.id },
      update: { ...t.profile, verifyStatus: "VERIFIED" },
      create: { teacherId: user.id, ...t.profile, verifyStatus: "VERIFIED" },
    });

    await prisma.teacherToken.upsert({
      where: { teacherId: user.id },
      update: {},
      create: { teacherId: user.id },
    });

    if (t.groupCourse) {
      const existing = await prisma.groupCourse.findFirst({
        where: { teacherId: user.id, title: t.groupCourse.title },
      });
      if (!existing) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 14);
        await prisma.groupCourse.create({
          data: {
            teacherId: user.id,
            ...t.groupCourse,
            enrolledCount: Math.floor(Math.random() * Math.floor(t.groupCourse.maxStudents * 0.6)),
            status: "LISTED",
            startDate,
          },
        });
      }
    }

    if (t.oneOnOnePackage) {
      const existing = await prisma.oneOnOnePackage.findFirst({
        where: { teacherId: user.id, title: t.oneOnOnePackage.title },
      });
      if (!existing) {
        await prisma.oneOnOnePackage.create({
          data: { teacherId: user.id, ...t.oneOnOnePackage, status: "LISTED" },
        });
      }
    }

    console.log(`✓ ${t.name}`);
  }

  console.log(`\nDemo seed complete — ${TEACHERS.length} teacher profiles created.\nVisit /browse to see them.`);
} finally {
  await prisma.$disconnect();
}
