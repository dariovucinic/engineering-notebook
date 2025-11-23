const fs = require('fs');
const https = require('https');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);

    if (!match) {
        console.error('Could not find GEMINI_API_KEY in .env.local');
        process.exit(1);
    }

    const apiKey = match[1].trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.error('API Error:', json.error);
                } else {
                    console.log('Available Models:');
                    json.models.forEach(m => {
                        if (m.supportedGenerationMethods.includes('generateContent')) {
                            console.log(`- ${m.name}`);
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to parse response:', e);
                console.log('Raw response:', data);
            }
        });
    }).on('error', (err) => {
        console.error('Request failed:', err);
    });

} catch (err) {
    console.error('Error reading .env.local:', err);
}
