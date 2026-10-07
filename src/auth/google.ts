import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// TODO: replace with Google Cloud OAuth client IDs
// (https://console.cloud.google.com/apis/credentials)
const CLIENT_IDS = {
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri({ scheme: 'tindahan' });
  const [request, response, promptAsync] = Google.useAuthRequest({
    ...CLIENT_IDS,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      // TODO: exchange response.authentication.accessToken with the backend,
      // create/find the store account, then navigate to Main.
    }
  }, [response]);

  return {
    loading: !request,
    signIn: () => promptAsync(),
    response,
  };
}
