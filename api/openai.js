export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { userMessage } = req.body || {};

    if (!userMessage) {
      return res.status(400).json({
        error: "No userMessage was provided."
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in Vercel."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful review writing assistant."
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      }
    );

    const responseData = await response.json();

    /*
      IMPORTANT:
      If OpenAI returns an error, show the actual
      OpenAI error instead of crashing.
    */

    if (!response.ok) {
      console.error(
        "OpenAI API Error:",
        responseData
      );

      return res.status(response.status).json({
        error:
          responseData?.error?.message ||
          "OpenAI API returned an error."
      });
    }

    const result =
      responseData?.choices?.[0]?.message?.content;

    if (!result) {
      console.error(
        "Unexpected OpenAI response:",
        responseData
      );

      return res.status(500).json({
        error:
          "OpenAI returned a response, but no message was found."
      });
    }

    return res.status(200).json({
      result
    });

  } catch (error) {

    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Error communicating with OpenAI."
    });
  }
}
