import { useEffect } from "react";
import { useTheme } from "../utils/hooks/useTheme";
import styles from "./ToggleThemeButton.module.css";

export const ToggleThemeButton = () => {
	const { theme, toggleTheme } = useTheme();

	useEffect(() => {
		if (theme !== "undefined") {
			window.document.documentElement.setAttribute("data-theme", theme);
		}

		return () => {
			if (theme !== "undefined") {
				window.document.documentElement.removeAttribute("data-theme");
			}
		};
	}, [theme]);

	return (
		<button
			type="button"
			id={styles["toggle-theme-button"]}
			aria-label={
				theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
			}
			data-theme={theme}
			onClick={() => toggleTheme(theme)}
		>
			{theme !== "undefined" && (
				<>
					<span>to Dark</span>
					<span>to Light</span>
				</>
			)}
		</button>
	);
};
