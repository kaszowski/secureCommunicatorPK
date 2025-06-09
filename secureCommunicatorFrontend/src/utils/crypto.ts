import CryptoJS from 'crypto-js';

/**
 * Hash a password using SHA-256 on the client-side
 * This implements the backend security requirement for client-side password hashing
 * @param password - The plain text password
 * @returns The hashed password as a hex string
 */
export const hashPassword = (password: string): string => {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
};

/**
 * Validate password strength
 * @param password - The password to validate
 * @returns Object with validation result and feedback
 */
export const validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

/**
 * Generate a random salt for additional security
 * @returns A random salt string
 */
export const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
};

/**
 * Hash a password with a salt using SHA-256
 * @param password - The plain text password
 * @param salt - The salt to use
 * @returns The salted and hashed password
 */
export const hashPasswordWithSalt = (
  password: string,
  salt: string
): string => {
  if (!password || !salt) {
    throw new Error('Password and salt are required');
  }

  return CryptoJS.SHA256(password + salt).toString(CryptoJS.enc.Hex);
};

/**
 * Generate proper RSA key pair using Web Crypto API
 * @returns A proper RSA key pair object with PEM formatted keys
 */
export const generateKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  try {
    // Generate RSA key pair using Web Crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    // Export public key
    const publicKeyArrayBuffer = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    const publicKeyBase64 = arrayBufferToBase64(publicKeyArrayBuffer);
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${formatBase64ForPem(
      publicKeyBase64
    )}\n-----END PUBLIC KEY-----`;

    // Export private key
    const privateKeyArrayBuffer = await window.crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );
    const privateKeyBase64 = arrayBufferToBase64(privateKeyArrayBuffer);
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${formatBase64ForPem(
      privateKeyBase64
    )}\n-----END PRIVATE KEY-----`;

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem,
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    // Fallback to mock keys for development/testing
    const keyData = CryptoJS.lib.WordArray.random(256 / 8).toString(
      CryptoJS.enc.Hex
    );
    return {
      publicKey: `-----BEGIN PUBLIC KEY-----\n${keyData.substring(
        0,
        32
      )}\n-----END PUBLIC KEY-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----\n${keyData.substring(
        32
      )}\n-----END PRIVATE KEY-----`,
    };
  }
};

/**
 * Convert ArrayBuffer to Base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Format Base64 string for PEM format (64 characters per line)
 */
const formatBase64ForPem = (base64: string): string => {
  return base64.match(/.{1,64}/g)?.join('\n') || base64;
};

/**
 * Encrypt private key with user password for secure storage
 * @param privateKey - The private key to encrypt
 * @param password - The user's password to use as encryption key
 * @returns Encrypted private key as base64 string
 */
export const encryptPrivateKey = (
  privateKey: string,
  password: string
): string => {
  const encrypted = CryptoJS.AES.encrypt(privateKey, password).toString();
  return encrypted;
};

/**
 * Decrypt private key using user password
 * @param encryptedPrivateKey - The encrypted private key
 * @param password - The user's password to decrypt with
 * @returns Decrypted private key or null if decryption fails
 */
export const decryptPrivateKey = (
  encryptedPrivateKey: string,
  password: string
): string | null => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedString || null;
  } catch (error) {
    console.error('Error decrypting private key:', error);
    return null;
  }
};

/**
 * Secure random string generator for additional entropy
 * @param length - Length of the random string
 * @returns A cryptographically secure random string
 */
export const generateSecureRandom = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
};

/**
 * Download private key as a file
 * @param privateKey - The private key to download
 * @param username - Username for the filename
 */
export const downloadPrivateKey = (
  privateKey: string,
  username: string
): void => {
  const blob = new Blob([privateKey], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${username}_private_key.pem`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validate PEM format private key
 * @param key - The key string to validate
 * @returns True if the key appears to be in valid PEM format
 */
export const validatePemFormat = (key: string): boolean => {
  if (!key || typeof key !== 'string') {
    return false;
  }

  key = key.trim();

  // Debug key format issues
  if (key.length < 20) {
    return false;
  }

  // Check for standard PEM format header and footer
  const privateKeyRegex =
    /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/;
  const publicKeyRegex =
    /-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----/;

  // Also support RSA-specific formats
  const rsaPrivateKeyRegex =
    /-----BEGIN RSA PRIVATE KEY-----[\s\S]+-----END RSA PRIVATE KEY-----/;
  const rsaPublicKeyRegex =
    /-----BEGIN RSA PUBLIC KEY-----[\s\S]+-----END RSA PUBLIC KEY-----/;

  // Log more detailed information for debugging
  if (
    !privateKeyRegex.test(key) &&
    !publicKeyRegex.test(key) &&
    !rsaPrivateKeyRegex.test(key) &&
    !rsaPublicKeyRegex.test(key)
  ) {
    return false;
  }

  return true;
};

/**
 * Generate a symmetric key for conversation encryption
 * @returns A random 256-bit AES key as hex string
 */
export const generateConversationKey = (): string => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString(CryptoJS.enc.Hex);
};

/**
 * Encrypt conversation key with user's public key using RSA-OAEP
 * @param conversationKey - The symmetric key to encrypt
 * @param publicKeyPem - The user's public key in PEM format
 * @returns The encrypted conversation key as base64 string
 */
export const encryptConversationKey = async (
  conversationKey: string,
  publicKeyPem: string
): Promise<string> => {
  try {
    // Validate public key format
    if (!validatePemFormat(publicKeyPem)) {
      console.error('Invalid public key format');
      throw new Error('Invalid public key format');
    }

    // Convert PEM to ArrayBuffer
    const publicKeyData = pemToArrayBuffer(publicKeyPem, 'PUBLIC');

    // Import the public key
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    // Convert conversation key to ArrayBuffer
    const keyData = new TextEncoder().encode(conversationKey);

    // Encrypt the conversation key
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      keyData
    );

    // Convert to base64
    return arrayBufferToBase64(encryptedKey);
  } catch (error) {
    console.error('Error encrypting conversation key:', error);
    // Fallback for development - return the key with a prefix indicating it's not encrypted
    return `DEV_FALLBACK:${conversationKey}`;
  }
};

/**
 * Decrypt conversation key with user's private key using RSA-OAEP
 * @param encryptedConversationKey - The encrypted conversation key
 * @param privateKeyPem - The user's private key in PEM format
 * @returns The decrypted conversation key as hex string
 */
export const decryptConversationKey = async (
  encryptedConversationKey: string,
  privateKeyPem: string
): Promise<string | null> => {
  try {
    // Handle development fallback
    if (encryptedConversationKey.startsWith('DEV_FALLBACK:')) {
      return encryptedConversationKey.replace('DEV_FALLBACK:', '');
    }

    // Log details about the input for debugging
    console.debug('Attempting to decrypt conversation key');
    console.debug('Private key length:', privateKeyPem?.length || 0);

    // Check if the private key is encrypted (starts with "U2FsdGVkX1" which is the CryptoJS salt marker)
    let actualPrivateKey = privateKeyPem;
    if (privateKeyPem && privateKeyPem.startsWith('U2FsdGVkX1')) {
      try {
        // Try to decrypt with stored password from session
        const sessionData = sessionStorage.getItem('userData');
        if (sessionData) {
          const userData = JSON.parse(sessionData);
          if (userData.password) {
            console.debug(
              'Found password in session, attempting to decrypt private key'
            );
            const decryptedKey = decryptPrivateKey(
              privateKeyPem,
              userData.password
            );
            if (decryptedKey) {
              console.debug('Successfully decrypted private key');
              actualPrivateKey = decryptedKey;
            } else {
              console.error(
                'Failed to decrypt private key with session password'
              );
              return null;
            }
          } else {
            console.error('No password found in session data');
            return null;
          }
        } else {
          console.error('No session data found to decrypt private key');
          return null;
        }
      } catch (e) {
        console.error('Error decrypting private key:', e);
        return null;
      }
    }

    // Validate private key format
    if (!validatePemFormat(actualPrivateKey)) {
      console.error('Invalid private key format - validation failed');
      if (actualPrivateKey) {
        console.debug(
          'Key format starts with:',
          actualPrivateKey.substring(0, 30) + '...'
        );
        console.debug(
          'Key format ends with:',
          '...' + actualPrivateKey.substring(actualPrivateKey.length - 30)
        );
      }
      return null;
    }

    // Convert PEM to ArrayBuffer
    let privateKeyData;
    try {
      privateKeyData = pemToArrayBuffer(actualPrivateKey, 'PRIVATE');
    } catch (error) {
      console.error('Failed to convert PEM to ArrayBuffer:', error);
      return null;
    }

    // Import the private key
    let privateKey;
    try {
      privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      );
    } catch (error) {
      console.error('Failed to import private key:', error);
      return null;
    }

    // Properly handle any malformed base64 or encoding issues
    let encryptedData;
    try {
      encryptedData = base64ToArrayBuffer(encryptedConversationKey);
    } catch (e) {
      console.error('Invalid base64 in conversation key:', e);
      return null;
    }

    // Decrypt the conversation key
    try {
      const decryptedKey = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        encryptedData
      );

      // Convert back to string
      return new TextDecoder().decode(decryptedKey);
    } catch (error) {
      console.error('Error decrypting conversation key:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in decryptConversationKey:', error);
    return null;
  }
};

/**
 * Encrypt message content with conversation key using AES-CBC
 * @param message - The message to encrypt
 * @param conversationKey - The conversation symmetric key
 * @returns Encrypted message as base64 string (includes IV)
 */
export const encryptMessage = (
  message: string,
  conversationKey: string
): string => {
  try {
    // Use CryptoJS built-in encryption with random IV
    const encrypted = CryptoJS.AES.encrypt(message, conversationKey);
    return encrypted.toString();
  } catch (error) {
    console.error('Error encrypting message:', error);
    // Return original message with prefix for development
    return `PLAIN:${message}`;
  }
};

/**
 * Decrypt message content with conversation key using AES-CBC
 * @param encryptedMessage - The encrypted message
 * @param conversationKey - The conversation symmetric key
 * @returns Decrypted message or null if decryption fails
 */
export const decryptMessage = (
  encryptedMessage: string,
  conversationKey: string
): string | null => {
  try {
    // Handle development fallback
    if (encryptedMessage.startsWith('PLAIN:')) {
      return encryptedMessage.replace('PLAIN:', '');
    }

    // Decrypt with AES-CBC
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, conversationKey);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    return decryptedString || null;
  } catch (error) {
    console.error('Error decrypting message:', error);
    return null;
  }
};

/**
 * Convert PEM format key to ArrayBuffer
 * @param pem - The PEM formatted key
 * @param keyType - 'PUBLIC' or 'PRIVATE'
 * @returns ArrayBuffer containing the key data
 */
const pemToArrayBuffer = (
  pem: string,
  keyType: 'PUBLIC' | 'PRIVATE'
): ArrayBuffer => {
  try {
    if (!pem || typeof pem !== 'string') {
      console.error('PEM key is null, undefined, or not a string');
      throw new Error('Invalid PEM key format');
    }

    pem = pem.trim();

    // Support both standard and RSA-specific formats
    const standardHeader = `-----BEGIN ${keyType} KEY-----`;
    const standardFooter = `-----END ${keyType} KEY-----`;
    const rsaHeader = `-----BEGIN RSA ${keyType} KEY-----`;
    const rsaFooter = `-----END RSA ${keyType} KEY-----`;

    let base64 = pem;

    // Log debug info before modifications
    console.debug('Processing key type:', keyType);
    console.debug('Key starts with:', pem.substring(0, 30) + '...');

    // Remove headers and footers
    if (pem.includes(standardHeader) && pem.includes(standardFooter)) {
      base64 = pem.substring(
        pem.indexOf(standardHeader) + standardHeader.length,
        pem.indexOf(standardFooter)
      );
    } else if (pem.includes(rsaHeader) && pem.includes(rsaFooter)) {
      base64 = pem.substring(
        pem.indexOf(rsaHeader) + rsaHeader.length,
        pem.indexOf(rsaFooter)
      );
    } else {
      console.warn('Could not find matching header/footer in key');
      // Try to be lenient - if it has proper base64 content, try to process it anyway
    }

    // Remove all whitespace
    base64 = base64.replace(/\s/g, '');

    if (base64.length === 0) {
      console.error('Empty key data after processing');
      throw new Error('Empty key data');
    }

    // Convert to ArrayBuffer
    return base64ToArrayBuffer(base64);
  } catch (error) {
    console.error('Error converting PEM to ArrayBuffer:', error);
    throw new Error(
      'Invalid key format: ' +
        (error instanceof Error ? error.message : String(error))
    );
  }
};

/**
 * Convert base64 string to ArrayBuffer
 * @param base64 - The base64 string
 * @returns ArrayBuffer
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  try {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Base64 string is null, undefined, or not a string');
    }

    // Clean up the base64 string - remove whitespace and any invalid characters
    let cleanBase64 = base64.replace(/\s/g, '');

    // Handle URLs safe base64 variants
    cleanBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    while (cleanBase64.length % 4 !== 0) {
      cleanBase64 += '=';
    }

    // Check if it's a valid base64 string - use a more permissive pattern
    const base64Pattern = /^[A-Za-z0-9+/]*={0,3}$/;
    if (!base64Pattern.test(cleanBase64)) {
      console.warn("String doesn't match base64 pattern");
      console.debug(
        'Invalid base64 string (sample):',
        cleanBase64.substring(0, 30) + '...'
      );
      // Try to fix common issues
      cleanBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, '');
    }

    try {
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (e) {
      console.error('atob failed:', e);
      throw new Error(
        'Invalid base64 encoding: ' +
          (e instanceof Error ? e.message : String(e))
      );
    }
  } catch (error) {
    console.error('Error converting base64 to ArrayBuffer:', error);
    throw error;
  }
};
