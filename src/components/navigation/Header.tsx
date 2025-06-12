import { useCallback, useEffect, useState } from "react";
import { useThrottle } from "../../utils/hooks/useThrottle";
import { ToggleThemeButton } from "../ToggleThemeButton";
import styles from "./Header.module.css";

/**
 * The header hides when the user scrolls down and reappears when the user scrolls up.
 * The header is always shown when the navigation receives focus (e.g., via keyboard navigation).
 */
export const Header = () => {
	const [isHeaderShown, setIsHeaderShown] = useState(true);
	const [lastPosition, setLastPosition] = useState(0);

	const handleScroll = useCallback(() => {
		const currentPosition = window.scrollY;
		const offset = lastPosition - currentPosition;

		setLastPosition(currentPosition);
		setIsHeaderShown(offset >= 0);
	}, [lastPosition]);

	const throttledScroll = useThrottle(handleScroll, 100);

	useEffect(() => {
		window.addEventListener("scroll", throttledScroll);

		return () => {
			window.removeEventListener("scroll", throttledScroll);
		};
	}, [throttledScroll]);

	return (
		<header id={styles.header} onMouseEnter={() => setIsHeaderShown(true)}>
			<nav onFocus={() => setIsHeaderShown(true)} data-shown={isHeaderShown}>
				<a href="/" id={styles["home-link"]}>
					✦ slimalized
				</a>
				<ToggleThemeButton />
			</nav>
		</header>
	);
};
