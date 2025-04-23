import { neon } from "@neondatabase/serverless";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false
  }
};

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT 
          s.student_id,
          s.name,
          s.project_name,
          s.email,
          s.phone_number,
          ds.time AS demo_time
        FROM students s
        LEFT JOIN demo_slots ds ON s.demo_slot_id = ds.id
        ORDER BY ds.time ASC;
      `;
      res.status(200).json(result);
    } catch (err) {
      console.error("Error fetching students:", err.message);
      res.status(500).json({ error: "Error fetching students" });
    }
  } else if (req.method === "POST") {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields) => {
      if (err) return res.status(400).json({ error: "Form parsing error" });

      console.log("Received fields:", fields);

      try {
        const { fullName, email, studentId, number, projectDescription, demoTime } = fields;

        // Clean ALL the things ✨
        const cleanStudentId = Array.isArray(studentId) ? studentId[0].trim() : studentId.trim();
        const cleanFullName = Array.isArray(fullName) ? fullName[0].trim() : fullName.trim();
        const cleanEmail = Array.isArray(email) ? email[0].trim() : email.trim();
        const cleanNumber = Array.isArray(number) ? number[0].trim() : number.trim();
        const cleanProjectName = Array.isArray(projectDescription) ? projectDescription[0].trim() : projectDescription.trim();
        const cleanDemoTime = Array.isArray(demoTime) ? demoTime[0].trim() : demoTime.trim();

        if (!cleanFullName || !cleanEmail || !cleanStudentId || !cleanNumber || !cleanProjectName || !cleanDemoTime) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)+$/;
        const idRegex = /^\d{8}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
        const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

        if (!nameRegex.test(cleanFullName)) return res.status(400).json({ error: "Name must include first and last name using letters only" });
        if (!idRegex.test(cleanStudentId)) return res.status(400).json({ error: "Student ID must be exactly 8 digits" });
        if (!emailRegex.test(cleanEmail)) return res.status(400).json({ error: "Invalid email format" });
        if (!phoneRegex.test(cleanNumber)) return res.status(400).json({ error: "Phone number must be in the format 999-999-9999" });

        const existing = await sql`SELECT * FROM students WHERE student_id = ${cleanStudentId}`;
        const slotCount = await sql`SELECT COUNT(*) FROM students WHERE demo_slot_id = ${cleanDemoTime}`;
        const slotLimit = await sql`SELECT capacity FROM demo_slots WHERE id = ${cleanDemoTime}`;

        const current = parseInt(slotCount[0].count, 10);
        const limit = parseInt(slotLimit[0]?.capacity || 6, 10);
        const slotFilled = current >= limit;

        if (!existing.length && slotFilled) {
          return res.status(400).json({ error: "This time slot is already full. Please choose another." });
        }

        if (existing.length > 0) {
          await sql`
            UPDATE students SET
              name = ${cleanFullName},
              email = ${cleanEmail},
              phone_number = ${cleanNumber},
              project_name = ${cleanProjectName},
              demo_slot_id = ${cleanDemoTime}
            WHERE student_id = ${cleanStudentId}
          `;
          return res.status(200).json({ message: "Registration updated." });
        }

        await sql`
          INSERT INTO students (student_id, name, email, phone_number, project_name, demo_slot_id)
          VALUES (${cleanStudentId}, ${cleanFullName}, ${cleanEmail}, ${cleanNumber}, ${cleanProjectName}, ${cleanDemoTime})
        `;

        res.status(201).json({ message: "Student registered successfully" });
      } catch (err) {
        console.error("🔥 FULL POST ERROR:", err.message, err.stack);
        res.status(500).json({ error: "Server error" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}