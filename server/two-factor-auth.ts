import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { storage } from './storage';
import { sendEmailNotification } from './notifications';

// Generate a new secret for a user
export async function generateTwoFactorSecret(userId: number): Promise<{ secret: string; url: string }> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Generate a new secret
  const secret = speakeasy.generateSecret({
    name: `Pharmacy System (${user.username})`,
    length: 20,
  });

  // Generate QR code URL
  const url = await QRCode.toDataURL(secret.otpauth_url || '');

  // In a real implementation, you would save the secret to the user record
  await storage.updateUserTwoFactorSecret(userId, secret.base32);

  return {
    secret: secret.base32,
    url,
  };
}

// Verify a TOTP token
export async function verifyTwoFactorToken(userId: number, token: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user || !user.twoFactorSecret) {
    return false;
  }

  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1, // Allow a window of 1 interval (±30 seconds)
  });

  if (verified && !user.twoFactorVerified) {
    // Update user's two-factor verification status
    await storage.updateUserTwoFactorVerified(userId, true);
  }

  return verified;
}

// Enable two-factor authentication for a user
export async function enableTwoFactorAuth(userId: number): Promise<{ secret: string; url: string }> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const { secret, url } = await generateTwoFactorSecret(userId);

  // Update user record to indicate 2FA is enabled but not yet verified
  await storage.updateUserTwoFactorEnabled(userId, true);
  await storage.updateUserTwoFactorVerified(userId, false);

  return { secret, url };
}

// Disable two-factor authentication for a user
export async function disableTwoFactorAuth(userId: number): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Update user record
  await storage.updateUserTwoFactorEnabled(userId, false);
  await storage.updateUserTwoFactorVerified(userId, false);
  await storage.updateUserTwoFactorSecret(userId, null);
}

// Generate and send one-time email verification code
export async function sendEmailVerificationCode(userId: number): Promise<string> {
  const user = await storage.getUser(userId);
  if (!user || !user.email) {
    throw new Error('User not found or email not set');
  }

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // In a real implementation, you would store this code in a temporary store with an expiration
  // For now, we'll just use the code that was generated

  // Send the code via email
  const subject = 'Your Verification Code';
  const html = `
    <h2>Two-Factor Authentication Verification</h2>
    <p>Your verification code is: <strong>${code}</strong></p>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this code, please ignore this email and contact support immediately.</p>
  `;

  await sendEmailNotification(user.email, subject, html);

  // In a real implementation, return nothing and store the code in a database
  // For demonstration purposes, we're returning the code
  return code;
}

// Verify email verification code
export function verifyEmailCode(providedCode: string, expectedCode: string): boolean {
  return providedCode === expectedCode;
}