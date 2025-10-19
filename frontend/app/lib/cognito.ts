import { CognitoUserPool } from "amazon-cognito-identity-js";

export const cognitoConfig = {
  userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? "",
  appClientId: process.env.EXPO_PUBLIC_COGNITO_APP_CLIENT_ID ?? "",
  region: process.env.EXPO_PUBLIC_COGNITO_REGION ?? "us-east-1",
};

export function isCognitoConfigured(): boolean {
  return Boolean(cognitoConfig.userPoolId && cognitoConfig.appClientId);
}

export function createUserPool(): CognitoUserPool | null {
  if (!isCognitoConfigured()) {
    return null;
  }
  return new CognitoUserPool({
    UserPoolId: cognitoConfig.userPoolId,
    ClientId: cognitoConfig.appClientId,
  });
}

type AuthResponse = {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
};

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const endpoint = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: cognitoConfig.appClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.message || payload.__type || "Login failed");
    (error as { code?: string }).code = payload.__type?.split("#").pop();
    throw error;
  }

  if (payload.ChallengeName) {
    const error = new Error(payload.ChallengeName);
    (error as { code?: string }).code = payload.ChallengeName;
    throw error;
  }

  return payload.AuthenticationResult as AuthResponse;
}
