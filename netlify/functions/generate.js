/**
 * Netlify Function to proxy Claude API requests
 * This replaces the Flask server for Netlify deployments
 */

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // Get API key from environment variable
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: { message: 'API key not configured' } })
        };
    }

    try {
        // Parse request body
        const requestData = JSON.parse(event.body);

        console.log('Generating quiz questions...');
        console.log('Request model:', requestData.model);
        console.log('Max tokens:', requestData.max_tokens);

        // Make request to Claude API with timeout
        // Note: Netlify free tier has 10s function timeout
        // Pro tier has 26s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            // Return Claude's response
            if (response.ok) {
                console.log('Quiz generation successful');
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(data)
                };
            } else {
                console.error('Claude API Error:', data);
                return {
                    statusCode: response.status,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        error: { message: data.error?.message || 'API request failed' }
                    })
                };
            }

        } catch (fetchError) {
            clearTimeout(timeoutId);

            // Handle timeout specifically
            if (fetchError.name === 'AbortError') {
                console.error('Request timeout - Claude API took too long');
                return {
                    statusCode: 504,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        error: { message: 'Request timeout. Try generating fewer questions or upgrade to Netlify Pro for longer timeouts.' }
                    })
                };
            }
            throw fetchError; // Re-throw other errors to outer catch
        }

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: { message: error.message || 'Internal server error' }
            })
        };
    }
};
