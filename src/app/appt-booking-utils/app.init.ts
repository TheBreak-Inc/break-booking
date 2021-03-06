import { KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService): () => Promise<boolean> {
    return () =>
        keycloak.init({
            config: {
                // url: 'https://break-booking.online:8443/auth',
                url: 'http://localhost:8181/auth',
                realm: 'break-booking',
                clientId: 'break-booking-frontend-client',
            },
            initOptions: {
                checkLoginIframe: true,
                checkLoginIframeInterval: 25
            },
            loadUserProfileAtStartUp: true
        });
}
