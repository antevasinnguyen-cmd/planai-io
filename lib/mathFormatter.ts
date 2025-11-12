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
 * Process chat message to format any math expressions
 */
export function processChatMessage(message: string): string {
  if (!message) return message;
  
  // Find LaTeX math blocks and format them
  const mathBlockRegex = /(\\\[[\s\S]*?\\\])/g;
  return message.replace(mathBlockRegex, (match) => {
    return formatMathExpression(match);
  });
}
