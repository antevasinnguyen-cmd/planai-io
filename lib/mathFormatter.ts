/**
 * Format LaTeX math expressions to human-readable text
 * Used for chat responses where LaTeX rendering isn't available
 */

/**
 * Convert LaTeX math expressions to readable text
 */
export function formatMathExpression(text: string): string {
  if (!text) return text;
  
  // Replace LaTeX math blocks with human-readable text
  let formatted = text;
  
  // Replace LaTeX math delimiters
  formatted = formatted.replace(/\\\[|\\\]/g, '');
  
  // Replace \text{...} with the content inside
  formatted = formatted.replace(/\\text\{([^}]+)\}/g, '$1');
  
  // Replace \frac{a}{b} with a/b
  formatted = formatted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  
  // Replace \approx with ≈
  formatted = formatted.replace(/\\approx/g, '≈');
  
  // Replace other common LaTeX symbols
  formatted = formatted.replace(/\\times/g, '×');
  formatted = formatted.replace(/\\div/g, '÷');
  formatted = formatted.replace(/\\leq/g, '≤');
  formatted = formatted.replace(/\\geq/g, '≥');
  formatted = formatted.replace(/\\neq/g, '≠');
  
  return formatted;
}

/**
 * Process chat message to format any math expressions and clean markdown
 */
export function processChatMessage(message: string): string {
  if (!message) return message;
  
  let processed = message;
  
  // 1. Find and format LaTeX math blocks \[...\]
  const mathBlockRegex = /(\\\[[\s\S]*?\\\])/g;
  processed = processed.replace(mathBlockRegex, (match) => {
    return formatMathExpression(match);
  });
  
  // 2. Find and format inline LaTeX math \(...\)
  const inlineMathRegex = /\\\(([^)]+)\\\)/g;
  processed = processed.replace(inlineMathRegex, (match, content) => {
    return formatMathExpression(content);
  });
  
  // 3. Clean remaining LaTeX commands
  processed = processed.replace(/\\text\{([^}]+)\}/g, '$1');
  processed = processed.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  
  // 4. Remove excessive markdown bold markers **
  // Replace **text:** ** with just "text:" (remove redundant **)
  processed = processed.replace(/\*\*([^*]+):\*\*\s*\*\*/g, '$1:');
  
  // 5. Convert markdown bold **text** to plain text (no bold in plain text UI)
  // Keep the text but remove the ** markers
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  return processed;
}
