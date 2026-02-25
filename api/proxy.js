// api/proxy.js
export default async function handler(req, res) {
    // 1. Cuma terima metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Tangkep data dari Frontend (Browser)
    const { token, channelId, content } = req.body;

    if (!token || !channelId || !content) {
        return res.status(400).json({ error: 'Missing parameters (token, channelId, or content)' });
    }

    try {
        // 3. Tembak ke API Resmi Discord (Proxying)
        const discordResponse = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': token, // Token User/Self-bot
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content
            })
        });

        const data = await discordResponse.json();

        // 4. Kalau Discord nolak (misal kena Slowmode / Rate Limit)
        if (!discordResponse.ok) {
            // Kalau kena Rate Limit, kasih tau Frontend buat delay (Humanize)
            if (data.retry_after) {
                return res.status(429).json({ 
                    error: 'Rate Limited by Discord (Slowmode/Spam)', 
                    retry_after: data.retry_after 
                });
            }
            return res.status(discordResponse.status).json({ error: data.message || 'Discord API Error' });
        }

        // 5. Berhasil terkirim!
        return res.status(200).json({ success: true, messageId: data.id });

    } catch (error) {
        // Error server/jaringan
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
