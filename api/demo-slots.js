import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const slots = await sql\`
      SELECT ds.id, ds.time, ds.capacity, COUNT(s.student_id) AS current_count
      FROM demo_slots ds
      LEFT JOIN students s ON ds.id = s.demo_slot_id
      GROUP BY ds.id, ds.time, ds.capacity
      ORDER BY ds.time ASC;
    \`;

    const enriched = slots.map(slot => {
      const isFull = parseInt(slot.current_count, 10) >= parseInt(slot.capacity, 10);
      return {
        ...slot,
        available: !isFull,
      };
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error("Error fetching demo slots:", err.message);
    res.status(500).json({ error: "Error fetching demo slots" });
  }
}