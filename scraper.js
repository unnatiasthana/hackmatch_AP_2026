const axios = require('axios');
const cheerio = require('cheerio');
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL se connect kar rahe hain
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function scrapeDevpost() {
  try {
    console.log('Fetching hackathon data from Devpost...');
    
    // Target URL (Jahan se data nikalna hai)
    const targetURL = 'https://devpost.com/hackathons';
    
    // 1. axios website ka pura HTML code download karega
    const response = await axios.get(targetURL);
    
    // 2. cheerio us HTML ko padhne laayak (parse) banayega
    const $ = cheerio.load(response.data);
    
    // 3. Website par har ek hackathon card ko dhoondhna
    // (Devpost par card ki class generally 'hackathon-tile' hoti hai)
    $('.hackathon-tile').each(async (index, element) => {
      
      // Card ke andar se specific details nikalna
      const title = $(element).find('h3').text().trim();
      const eventUrl = $(element).attr('href');
      const eventDate = $(element).find('.submission-period').text().trim();
      
      // Abhi ke liye hum generic tags daal rahe hain. 
      const tags = ['JavaScript', 'Web Dev', 'Gen AI']; 

      // Agar title aur URL mil gaya, toh Database mein save karenge
      if (title && eventUrl) {
        const query = `
          INSERT INTO hackathons (title, url, event_date, tags) 
          VALUES ($1, $2, $3, $4) 
          ON CONFLICT (url) DO NOTHING; 
        `;
        // 'ON CONFLICT DO NOTHING' ka matlab hai ki agar ye hackathon pehle se database mein hai, toh error mat dena.
        
        const values = [title, eventUrl, eventDate, tags];
        
        try {
            await pool.query(query, values);
            console.log(`Successfully saved: ${title}`);
        } catch (dbError) {
            console.log(`Database insertion error for ${title}:`, dbError.message);
        }
      }
    });

  } catch (error) {
    console.error('Scraping mein error aaya:', error.message);
  }
}

scrapeDevpost();