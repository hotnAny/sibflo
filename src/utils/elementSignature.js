// Element Signature Utility
// Generates a comprehensive signature for HTML elements based on their outerHTML content

/**
 * Generates a comprehensive signature for an HTML element
 * Captures as much of the element's outerHTML as possible for maximum uniqueness
 * @param {HTMLElement} element - The DOM element to generate a signature for
 * @returns {string} - A unique signature string
 */
export function generateElementSignature(element) {
  if (!element || !element.outerHTML) {
    return 'invalid_element';
  }
  
  try {
    const htmlString = element.outerHTML;
    
    // Use crypto API if available for better hash quality
    if (window.crypto && window.crypto.subtle) {
      // For now, use the simple hash but we can enhance this later
      return generateHashFromString(htmlString);
    } else {
      // Fallback to simple hash for older browsers
      return generateHashFromString(htmlString);
    }
  } catch (error) {
    console.warn('Failed to generate element signature:', error);
    return 'signature_error';
  }
}

/**
 * Generates a hash from a string using a robust hash function
 * @param {string} input - The string to hash
 * @returns {string} - A unique signature string
 */
function generateHashFromString(input) {
  let hash = 0;
  const prime = 31;
  const mod = 1e9 + 7;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash * prime + char) % mod;
  }
  
  // Convert to positive hex string and use more characters for uniqueness
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generates a comprehensive signature using crypto API if available
 * @param {HTMLElement} element - The DOM element to generate a signature for
 * @returns {Promise<string>} - A unique signature string
 */
export async function generateSecureElementSignature(element) {
  if (!element || !element.outerHTML) {
    return 'invalid_element';
  }
  
  try {
    // Check if crypto.subtle is available (modern browsers)
    if (window.crypto && window.crypto.subtle) {
      const htmlString = element.outerHTML;
      const encoder = new TextEncoder();
      const data = encoder.encode(htmlString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 20);
    } else {
      // Fallback to simple hash for older browsers
      return generateElementSignature(element);
    }
  } catch (error) {
    console.warn('Failed to generate secure element signature, falling back to simple hash:', error);
    return generateElementSignature(element);
  }
}

/**
 * Generates a comprehensive signature combining multiple approaches
 * @param {HTMLElement} element - The DOM element to generate a signature for
 * @returns {Promise<object>} - Object containing different signature types
 */
export async function generateComprehensiveSignature(element) {
  if (!element) {
    return {
      signature: 'invalid_element',
      secure: 'invalid_element'
    };
  }
  
  try {
    const [secure] = await Promise.all([
      generateSecureElementSignature(element),
    ]);
    
    return {
      signature: generateElementSignature(element),
      secure
    };
  } catch (error) {
    console.warn('Failed to generate comprehensive signature:', error);
    return {
      signature: generateElementSignature(element),
      secure: 'error'
    };
  }
}
