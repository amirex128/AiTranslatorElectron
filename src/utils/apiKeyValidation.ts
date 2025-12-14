/**
 * Validates OpenRouter API key
 * @param apiKey - The API key to validate
 * @returns true if the API key is valid, false otherwise
 */
export function isValidApiKey(apiKey: string): boolean {
  // Check if API key is empty
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  // Check if API key is the default placeholder value
  if (apiKey === 'your-openrouter-api-key-1' || apiKey === 'your-openrouter-api-key-2') {
    return false;
  }

  // Check minimum length (OpenRouter API keys are typically longer)
  if (apiKey.trim().length < 10) {
    return false;
  }

  // Check if API key starts with OpenRouter format (sk-or-v1-)
  if (!apiKey.startsWith('sk-or-v1-')) {
    return false;
  }

  return true;
}

