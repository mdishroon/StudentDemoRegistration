// This file handles all of the server-side logic for the application.

import fs from "node:fs/promises";

// Server (https://expressjs.com/)
import express from "express";

// Parsing forms sent from the client
import formidable from "formidable";

// Seamless integration for Express with Vite during development
import ViteExpress from "vite-express";

// Interacting with our database
import { neon } from "@neondatabase/serverless";

// Uploading and storing images
import { put } from "@vercel/blob";

const app = express();
const router = express.Router();

// Connect to the database
const sql = neon(process.env.DATABASE_URL);

// Prefix all routes with "/api"
app.use("/api", router);
app.use(express.json()); 

// Corresponds to: GET /api/students
// Returns a list of all students in the database to be displayed on the homepage
//router.get("/students", async (req, res) => {
//  try {
//    const students = await sql`SELECT * FROM students`;
//    res.json(students.rows); // Send the students back to the client as JSON
//  } catch (err) {
//    console.error("Error fetching students:", err);
//    res.status(500).json({ error: "Error fetching students" });
//  }
//});

//DEBUGGING DB CONNECTION
router.get("/students", async (req, res) => {
  try {
    console.log("➡️ GET /api/students hit");

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL is not set!");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    console.log("🧪 Connecting to DB:", process.env.DATABASE_URL.slice(0, 30) + "...");

    const result = await sql`SELECT * FROM students`;

    console.log("✅ DB query successful. Result:", result);

    // If result has a rows property, return that
    if (result && Array.isArray(result.rows)) {
      return res.json(result.rows);
    }

    // If result is already the array
    if (Array.isArray(result)) {
      return res.json(result);
    }

    // If result is something else
    console.warn("⚠️ Unexpected DB result format:", result);
    return res.status(500).json({ error: "Unexpected data format from database" });

  } catch (err) {
    console.error("🔥 Error fetching students:", err);
    res.status(500).json({ error: "Error fetching students" });
  }
});

router.get("/test-db", async (req, res) => {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    res.json(result);
  } catch (err) {
    console.error("🔥 Error in test-db:", err);
    res.status(500).json({ error: err.message });
  }
});

// debugging ends here

router.get("/demo-slots", async (req, res) => {
  try {
    const demoSlots = await sql`SELECT * FROM demo_slots`; // Replace 'demo_slots' with your actual table name
    res.json(demoSlots);
  } catch (err) {
    console.error("Error fetching demo slots:", err);
    res.status(500).json({ error: "Error fetching demo slots" });
  }
});

// Corresponds to: POST /api/students
// Creates a new student in the db and gives a confirmation message
// 🧠 server.js (Updates to enforce seat limits + allow re-registration)

// ... all previous imports and setup remain unchanged

// POST /students route — updated to enforce max 6 per time slot
router.post("/students", async (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Form parsing error" });
    }

    try {
      const { fullName, email, studentId, number, projectDescription, demo_slot } = fields;

      if (!fullName || !email || !studentId || !number || !projectDescription || !demo_slot) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/;
      const idRegex = /^\d{8}$/;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

      if (!nameRegex.test(fullName)) return res.status(400).json({ error: "Name must include first and last name using letters only" });
      if (!idRegex.test(studentId)) return res.status(400).json({ error: "Student ID must be exactly 8 digits" });
      if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format" });
      if (!phoneRegex.test(number)) return res.status(400).json({ error: "Phone number must be in the format 999-999-9999" });

      // Check if student already registered
      const existing = await sql`SELECT * FROM students WHERE student_id = ${studentId}`;

      // Count how many are registered for the selected demo slot
      const slotCount = await sql`SELECT COUNT(*) FROM students WHERE demo_slot = ${demo_slot}`;
      const slotLimit = await sql`SELECT max_capacity FROM demo_slots WHERE slot_id = ${demo_slot}`;

      const current = parseInt(slotCount[0].count, 10);
      const limit = parseInt(slotLimit[0]?.max_capacity || 6, 10); // fallback to 6 if null

      const slotFilled = current >= limit;

      if (!existing.length && slotFilled) {
        return res.status(400).json({ error: "This time slot is already full. Please choose another." });
      }

      if (existing.length > 0) {
        // Update registration instead of insert
        await sql`
          UPDATE students SET 
            name = ${fullName}, 
            email = ${email}, 
            phone_number = ${number}, 
            project_name = ${projectDescription}, 
            demo_slot = ${demo_slot} 
          WHERE student_id = ${studentId}`;

        return res.status(200).json({ message: "Registration updated." });
      }

      await sql`
        INSERT INTO students (student_id, name, email, phone_number, project_name, demo_slot)
        VALUES (${studentId}, ${fullName}, ${email}, ${number}, ${projectDescription}, ${demo_slot})`;

      res.status(201).json({ message: "Student registered successfully" });
    } catch (err) {
      console.error("Error in POST /students:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
});

// Starts the server and listens on port 5173
ViteExpress.listen(app, 5173, () => {
  console.log("Server is listening on port 5173.");
});

// We're exporting so Vercel can reuse it
export default app;
