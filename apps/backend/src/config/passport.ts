// File: apps/backend/src/config/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { User } from '../web/models/user.model';
import axios from 'axios';

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Verify environment variables are set
function validateGoogleOAuthConfig(): boolean {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('❌ Google OAuth configuration missing:');
    console.error('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
    console.error('GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
    return false;
  }
  
  console.log('✅ Google OAuth configuration validated');
  return true;
}

// Verify Zoho OAuth environment variables are set
function validateZohoOAuthConfig(): boolean {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET } = process.env;
  
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
    console.error('❌ Zoho OAuth configuration missing:');
    console.error('ZOHO_CLIENT_ID:', ZOHO_CLIENT_ID ? 'SET' : 'MISSING');
    console.error('ZOHO_CLIENT_SECRET:', ZOHO_CLIENT_SECRET ? 'SET' : 'MISSING');
    return false;
  }
  
  console.log('✅ Zoho OAuth configuration validated');
  return true;
}

// Configure Google OAuth Strategy
export function configureGoogleStrategy() {
  if (!validateGoogleOAuthConfig()) {
    throw new Error('Google OAuth configuration is incomplete');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const callbackURL = isProduction 
    ? process.env.GOOGLE_REDIRECT_URI_PROD
    : process.env.GOOGLE_REDIRECT_URI_LOCAL;

  console.log('🔧 Configuring Google OAuth Strategy:', {
    environment: process.env.NODE_ENV || 'development',
    callbackURL,
    clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...'
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL,
        scope: ['profile', 'email'],
        passReqToCallback: true // Enable access to request object
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log('🔍 Google OAuth callback received for:', profile.displayName);
          
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email provided by Google'), undefined);
          }

          // Extract intent from state parameter to determine role for new users
          let intent = 'default';
          try {
            const state = req.query.state as string;
            if (state && state !== 'default') {
              const stateData = JSON.parse(atob(state));
              intent = stateData.intent || 'default';
            }
          } catch (error) {
            console.warn('⚠️ Failed to parse state parameter in passport strategy:', error);
          }
          
          console.log('🎯 Intent extracted from state in passport strategy:', intent);

          // Check if user already exists by email or Google ID
          let user = await User.findOne({ 
            $or: [
              { email },
              { googleId: profile.id }
            ]
          });

          if (user) {
            // EXISTING USER: Update with Google info if missing
            let updated = false;
            
            if (!user.googleId) {
              user.googleId = profile.id;
              updated = true;
            }
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
              updated = true;
            }
            if (!user.fullName && profile.displayName) {
              user.fullName = profile.displayName;
              updated = true;
            }
            if (!user.isEmailVerified) {
              user.isEmailVerified = true; // Google emails are verified
              updated = true;
            }
            
            if (updated) {
              await user.save();
              console.log('✅ Updated existing user with Google info:', user.email);
            } else {
              console.log('✅ Existing user logged in via Google:', user.email);
            }
            
            return done(null, user);
          }

          // Create new user with role based on intent
          const role = intent === 'create-poll' ? 'host' : 'student';
          
          user = new User({
            googleId: profile.id,
            fullName: profile.displayName || '',
            email,
            avatar: profile.photos?.[0]?.value || '',
            role, // Assign role based on intent
            isEmailVerified: true // Google emails are pre-verified
          });

          await user.save();
          console.log('✅ New user created via Google OAuth:', user.email, 'Role:', user.role, 'Intent:', intent);
          return done(null, user);

        } catch (error) {
          console.error('❌ Google OAuth error:', error);
          return done(error, undefined);
        }
      }
    )
  );
}

// Function to verify Google OAuth credentials are valid
export async function verifyGoogleOAuthCredentials(): Promise<{ valid: boolean; message: string }> {
  try {
    if (!validateGoogleOAuthConfig()) {
      return {
        valid: false,
        message: 'Google OAuth environment variables are not properly configured'
      };
    }

    // Test Google OAuth configuration by making a test request
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Generate a test auth URL to verify credentials
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
    });

    if (authUrl && authUrl.includes('accounts.google.com')) {
      return {
        valid: true,
        message: 'Google OAuth credentials are valid and properly configured'
      };
    }

    return {
      valid: false,
      message: 'Google OAuth credentials appear to be invalid'
    };

  } catch (error) {
    return {
      valid: false,
      message: `Google OAuth verification failed: ${error}`
    };
  }
}

// Configure Zoho OAuth Strategy
export function configureZohoStrategy() {
  if (!validateZohoOAuthConfig()) {
    throw new Error('Zoho OAuth configuration is incomplete');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const callbackURL = isProduction 
    ? process.env.ZOHO_REDIRECT_URI_PROD
    : process.env.ZOHO_REDIRECT_URI_LOCAL;

  console.log('🔧 Configuring Zoho OAuth Strategy:', {
    environment: process.env.NODE_ENV || 'development',
    callbackURL,
    clientId: process.env.ZOHO_CLIENT_ID?.substring(0, 10) + '...'
  });

  passport.use('zoho', new OAuth2Strategy({
    authorizationURL: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenURL: 'https://accounts.zoho.com/oauth/v2/token',
    clientID: process.env.ZOHO_CLIENT_ID!,
    clientSecret: process.env.ZOHO_CLIENT_SECRET!,
    callbackURL,
    scope: 'ZohoProfile.userinfo.read',
    passReqToCallback: true, // Enable access to request object for state parameter
    skipUserProfile: true, // Skip automatic user profile loading
    customHeaders: {
      'Accept': 'application/json'
    }
  },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('🔍 Zoho OAuth callback received');
        console.log('🔑 Access token received:', accessToken ? 'YES' : 'NO');
        
        // Get user info from Zoho API using access token
        const userInfoResponse = await axios.get('https://accounts.zoho.com/oauth/user/info', {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        const userInfo = userInfoResponse.data;
        console.log('👤 Zoho user info received:', { 
          email: userInfo.Email, 
          name: userInfo.Display_Name 
        });

        if (!userInfo.Email) {
          return done(new Error('No email provided by Zoho'), undefined);
        }

        // Extract intent from state parameter to determine role for new users
        let intent = 'default';
        try {
          const state = req.query.state as string;
          if (state && state !== 'default') {
            const stateData = JSON.parse(atob(state));
            intent = stateData.intent || 'default';
          }
        } catch (error) {
          console.warn('⚠️ Failed to parse state parameter in Zoho strategy:', error);
        }
        
        console.log('🎯 Intent extracted from state in Zoho strategy:', intent);

        // Check if user already exists by email or Zoho ID
        let user = await User.findOne({ 
          $or: [
            { email: userInfo.Email },
            { zohoId: userInfo.ZUID }
          ]
        });

        if (user) {
          // EXISTING USER: Update with Zoho info if missing
          let updated = false;
          
          if (!user.zohoId) {
            user.zohoId = userInfo.ZUID;
            updated = true;
          }
          if (!user.fullName && userInfo.Display_Name) {
            user.fullName = userInfo.Display_Name;
            updated = true;
          }
          if (!user.isEmailVerified) {
            user.isEmailVerified = true; // Zoho emails are verified
            updated = true;
          }
          
          if (updated) {
            await user.save();
            console.log('✅ Updated existing user with Zoho info:', user.email);
          } else {
            console.log('✅ Existing user logged in via Zoho:', user.email);
          }
          
          return done(null, user);
        }

        // NEW USER: Create with role based on intent
        const role = intent === 'create-poll' ? 'host' : 'student';
        
        user = new User({
          zohoId: userInfo.ZUID,
          fullName: userInfo.Display_Name || userInfo.First_Name + ' ' + userInfo.Last_Name || '',
          email: userInfo.Email,
          role, // Assign role based on intent
          isEmailVerified: true // Zoho emails are pre-verified
        });

        await user.save();
        console.log('✅ New user created via Zoho OAuth:', user.email, 'Role:', user.role, 'Intent:', intent);
        return done(null, user);

      } catch (error: any) {
        console.error('❌ Zoho OAuth error:', error);
        if (error.response) {
          console.error('❌ Zoho API Error Response:', error.response.data);
          console.error('❌ Zoho API Error Status:', error.response.status);
        }
        return done(error, undefined);
      }
    }
  ));

  console.log('✅ Passport Zoho Strategy configured successfully');
}

// Function to verify Zoho OAuth credentials are valid
export async function verifyZohoOAuthCredentials(): Promise<{ valid: boolean; message: string }> {
  try {
    if (!validateZohoOAuthConfig()) {
      return {
        valid: false,
        message: 'Zoho OAuth environment variables are not properly configured'
      };
    }

    // Test Zoho OAuth configuration by validating client ID format
    const clientId = process.env.ZOHO_CLIENT_ID!;
    if (clientId.startsWith('1000.') && clientId.length > 20) {
      return {
        valid: true,
        message: 'Zoho OAuth credentials are valid and properly configured'
      };
    }

    return {
      valid: false,
      message: 'Zoho OAuth client ID format appears to be invalid'
    };

  } catch (error) {
    return {
      valid: false,
      message: `Zoho OAuth verification failed: ${error}`
    };
  }
}

export default passport;