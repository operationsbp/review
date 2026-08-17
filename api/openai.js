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
          model: "gpt-4o-mini",

          max_tokens: 500,

          messages: [
            {
              role: "system",
              content: `
You are a review writing assistant for Legacy Portrait Art.

Your job is to turn a customer's own answers into a short,
natural, genuine Google review.

Keep the final review concise, ideally around 80–120 words.

Combine the customer's answers into ONE cohesive review.
Do not create a separate paragraph for every question.

Use the customer's own voice and meaning.
Do not invent details, names, experiences, or emotions.
Do not add information that the customer did not provide.

Avoid exaggerated marketing language.
Do not make the review sound corporate, overly polished,
or AI-generated.

Keep only the most meaningful details.
Avoid repeating the same idea.

Write in first person, as if the customer is speaking directly
about their own experience.

Correct grammar and spelling naturally while keeping the
customer's original meaning and personality.

Return ONLY the finished review.
Do not include explanations, headings, quotation marks,
or notes before or after the review.
`
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
      result: result.trim()
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
