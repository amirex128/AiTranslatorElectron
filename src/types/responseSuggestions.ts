export interface ResponseSuggestion {
  tone: string; // Persian title/tone (e.g., "پاسخ‌های ساده و رایج")
  responseEn: string; // English response text
  responseFa: string; // Persian translation of the response
}

export interface ResponseSuggestionsResult {
  suggestions: ResponseSuggestion[]; // Exactly 5 suggestions
}

