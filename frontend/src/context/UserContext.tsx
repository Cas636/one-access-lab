import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from "react";

import { useFusionAuth } from "@fusionauth/react-sdk";

export interface User {
    email?: string;
    given_name?: string;
    family_name?: string;
    birthDate?: string;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {

    const { isLoggedIn, isFetchingUserInfo } = useFusionAuth();

    const [user, setUser] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);

    async function refreshUser() {

        if (!isLoggedIn) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {

            setLoading(true);

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/account/profile`,
                {
                    credentials: "include",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error();
            }

            const data = await response.json();

            setUser(data);

        } catch (e) {

            console.error(e);

            setUser(null);

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {

        if (isFetchingUserInfo) return;

        refreshUser();

    }, [isLoggedIn, isFetchingUserInfo]);

    function clearUser() {

        setUser(null);

    }

    return (
        <UserContext.Provider
            value={{
                user,
                loading,
                refreshUser,
                clearUser
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {

    const context = useContext(UserContext);

    if (!context) {
        throw new Error("useUser debe usarse dentro del UserProvider");
    }

    return context;
}