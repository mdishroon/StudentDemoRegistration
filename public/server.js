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
router.get("/students", async (req, res) => {
  try {
    const students = await sql`SELECT * FROM students`;
    res.json(students); // Send the students back to the client as JSON
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Error fetching students" });
  }
});

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
router.post("/students", async (req, res) => {
  const form = formidable({ multiples: true });

  // Parse the incoming form
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Form parsing error" });
    }

    try {
      const { fullName, email, studentId, number, projectDescription, demo_slot } = fields;

      // Check if all required fields are present
      if (!fullName || !email || !studentId || !number || !projectDescription || !demo_slot) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Regex checks
      const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/; // First and last name only, letters, separated by space
      const idRegex = /^\d{8}$/;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

      if (!nameRegex.test(fullName)) {
        return res.status(400).json({ error: "Name must include first and last name using letters only" });
      }
      if (!idRegex.test(studentId)) {
        return res.status(400).json({ error: "Student ID must be exactly 8 digits" });
      }
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (!phoneRegex.test(number)) {
        return res.status(400).json({ error: "Phone number must be in the format 999-999-9999" });
      }

     // const demo_slot = `${demoDate} ${demoTime}`;

      // Insert the student into the database
      await sql`
        INSERT INTO students (student_id, name, email, phone_number, project_name, demo_slot)
        VALUES (${studentId}, ${fullName}, ${email}, ${number}, ${projectDescription}, ${demo_slot})
      `;

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
