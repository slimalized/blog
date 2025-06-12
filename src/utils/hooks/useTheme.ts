import { useSyncExternalStore } from "react";

const themes = {
	dark: true,
	light: true,
	undefined: true,
} as const satisfies Record<string, true>;

type Theme = keyof typeof themes;

const isTheme = (value: string): value is Theme => {
	return value in themes;
};

const EVENT_THEME_STORAGE_CHANGE = "themeStorageChange";
const THEME_KEY = "site-theme";

// If a different subscribe function is passed on re-render, it will re-subscribe to the store, so declare subscribe outside the scope.
// See: https://react.dev/reference/react/useSyncExternalStore#caveats
const subscribe = (onChange: () => void) => {
	window.addEventListener(EVENT_THEME_STORAGE_CHANGE, onChange);
	return () => window.removeEventListener(EVENT_THEME_STORAGE_CHANGE, onChange);
};

/**
 * Custom React hook for managing and toggling the application's theme ("light" or "dark").
 * This hook provides methods to set, toggle, and retrieve the current theme, persisting the value in localStorage.
 *
 * @param initialTheme - The initial theme to use if none is found in localStorage. Default is "undefined".
 * @returns An object containing:
 *   - `theme`: The current theme value.
 *   - `setTheme`: Function to set the theme.
 *   - `toggleTheme`: Function to toggle between "light" and "dark" themes.
 */
export const useTheme = (initialTheme: Theme = "undefined") => {
	const setTheme = (theme: Theme) => {
		window.localStorage.setItem(THEME_KEY, theme);
		window.dispatchEvent(new Event(EVENT_THEME_STORAGE_CHANGE));
	};

	const toggleTheme = (theme: Theme) => {
		if (theme === "undefined") return;
		const toggledTheme: Theme = theme === "dark" ? "light" : "dark";
		setTheme(toggledTheme);
	};

	const getTheme = () => {
		try {
			const theme = window.localStorage.getItem(THEME_KEY);
			if (theme && isTheme(theme)) {
				return theme;
			}
		} catch (error) {
			console.error(
				"[useTheme] Failed to get theme from local storage: ",
				error,
			);
		}
	};

	const theme = useSyncExternalStore(
		subscribe,
		() => getTheme() ?? initialTheme,
		() => initialTheme,
	);

	return { theme, setTheme, toggleTheme };
};
