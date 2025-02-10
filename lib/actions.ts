"use server";

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

export async function logVisitor() {
  try {
    console.log("📌 logVisitor called!");
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    const ip = data.ip || "Unknown";
    const country = data.country_name || "Unknown";

    console.log("📌 IP:", ip, "| Country:", country);

    const timestamp = new Date();
    const userAgent = data.user_agent || "Unknown"; // ipapi does not provide user-agent, so it's set manually

    // Store visitor data in database

    await sql`
        INSERT INTO visitors (ip_address, user_agent, visit_count, last_visit, clicks, country) 
        VALUES (${ip}, ${userAgent}, 1, ${timestamp}, 0, ${country})
        ON CONFLICT (ip_address) 
        DO UPDATE SET visit_count = visitors.visit_count + 1, last_visit = ${timestamp}, country = ${country};
      `;

    console.log("✅ Visitor data saved!");
  } catch (error) {
    console.error("❌ Error in logVisitor:", error);
  }
}

// 🔹 Fetch total visits & unique visitors
export async function getVisitorStats() {
  try {
    console.log("📌 Fetching visitor stats...");

    const totalResult =
      await sql`SELECT COALESCE(total_count, 0) AS total_count FROM total_visits WHERE id = 1;`;
    const uniqueResult =
      await sql`SELECT COUNT(*) AS unique_visitors FROM visitors;`;

    console.log("✅ Stats fetched:", totalResult, uniqueResult);

    return {
      total_visits: totalResult[0]?.total_count || 0,
      unique_visitors: uniqueResult[0]?.unique_visitors || 0,
    };
  } catch (error) {
    console.error("❌ Error fetching visitor stats:", error);
    return { total_visits: 0, unique_visitors: 0 };
  }
}

// 🔹 Log a button click
export async function logClick() {
  try {
    console.log("📌 Logging click...");

    // Fetch IP
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    const ip = data.ip || "Unknown";

    // Update click count
    await sql`
      UPDATE visitors 
      SET clicks = COALESCE(clicks, 0) + 1
      WHERE ip_address = ${ip};
    `;

    console.log("✅ Click logged!");
  } catch (error) {
    console.error("❌ Error logging click:", error);
  }
}

export async function incrementPageView() {
  try {
    await sql`
      INSERT INTO total_visits (id, total_count) 
      VALUES (1, 1)
      ON CONFLICT (id) 
      DO UPDATE SET total_count = total_visits.total_count + 1;
    `;
    console.log("✅ Page view count updated!");
  } catch (error) {
    console.error("❌ Error updating page views:", error);
  }
}
