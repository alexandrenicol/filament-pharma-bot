import { SessionsClient } from '@google-cloud/dialogflow';
import { v4 as uuidv4 } from 'uuid';

const PROJECT_ID = 'pharmaleave-aray';

interface NLPResponse {
  intent: string;
  slots?: {
    [k: string]: string;
  };
}

/**
 * Send a query to the dialogflow agent, and return the query result.
 */
export async function detectIntent(query: string): Promise<NLPResponse> {
  // A unique identifier for the given session
  const sessionId = uuidv4();

  // Create a new session
  const sessionClient = new SessionsClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
  const sessionPath = sessionClient.projectAgentSessionPath(
    PROJECT_ID,
    sessionId
  );

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: query,
        // The language used by the client (en-US)
        languageCode: 'en-GB',
      },
    },
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log('Detected intent', JSON.stringify(responses));
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log(`  No intent matched.`);
  }

  return {
    intent: result.intent.displayName,
    slots: (fields => {
      const result = {};
      for (let [key, value] of Object.entries(fields)) {
        console.log(key + ':' + value);
        result[key] = value.stringValue;
      }
      return result;
    })(result.parameters.fields),
  } as NLPResponse;
}
