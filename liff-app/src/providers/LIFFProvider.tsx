import React, { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";
import { setAuthToken, api } from "../lib/api";

interface LIFFContextType {
    isReady: boolean;
    profile: any | null;
    error: string | null;
    logout: () => void;
}

const LIFFContext = createContext<LIFFContextType>({
    isReady: false,
    profile: null,
    error: null,
    logout: () => { },
});

export const useLIFF = () => useContext(LIFFContext);

export const LIFFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isReady, setIsReady] = useState(false);
    const [profile, setProfile] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const liffId = window.__ENV__?.VITE_LIFF_ID || import.meta.env.VITE_LIFF_ID || "2008272520-YekBxV2k";

    useEffect(() => {
        const initLiff = async () => {
            // Local Development Mock
            if (window.location.hostname === "localhost") {
                console.log("Localhost detected. Mocking LIFF.");
                setProfile({
                    userId: "local-user",
                    displayName: "Local Tester",
                    pictureUrl: "https://placehold.co/150",
                    statusMessage: "Dev Mode"
                });
                setIsReady(true);
                return;
            }

            try {
                if (!liffId) {
                    throw new Error("VITE_LIFF_ID is not defined");
                }

                await liff.init({ liffId });

                if (!liff.isLoggedIn()) {
                    liff.login();
                    return;
                }

                const idToken = liff.getIDToken();
                if (!idToken) throw new Error("No ID Token");

                // Authenticate with backend
                const { data } = await api.post("/api/auth/liff", { idToken });
                setAuthToken(data.token);

                const userProfile = await liff.getProfile();
                setProfile({
                    ...userProfile,
                    backendProfile: data.profile
                });

                setIsReady(true);
            } catch (err: any) {
                console.error("LIFF Init Error:", err);
                setError(err.message || "Initialization failed");
            }
        };

        initLiff();
    }, [liffId]);

    const logout = () => {
        liff.logout();
        window.location.reload();
    };

    return (
        <LIFFContext.Provider value={{ isReady, profile, error, logout }}>
            {children}
        </LIFFContext.Provider>
    );
};
