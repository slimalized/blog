import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { type ReactNode, useState } from "react";
import styles from "./DetailsContent.module.css";

interface DetailsContainerProps {
	children: ReactNode;
}

export const DetailsContent = ({ children }: DetailsContainerProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const handleDetailsToggle = (
		event: React.ToggleEvent<HTMLDetailsElement>,
	) => {
		if (event.target instanceof HTMLDetailsElement) {
			setIsOpen(event.target.open);
		}
	};

	const handleSummaryClick = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
	};

	const handleButtonClick = () => {
		setIsOpen(!isOpen);
	};

	return (
		<details
			className={styles.details}
			open={isOpen}
			onToggle={handleDetailsToggle}
		>
			{/** biome-ignore lint/a11y/noStaticElementInteractions: Assign the role of opening and closing the summary to toggle-button. */}
			<summary tabIndex={-1} onClick={handleSummaryClick} onKeyDown={() => {}}>
				<button
					className={styles["toggle-button"]}
					aria-label={isOpen ? "Hide detail content" : "Show detail content"}
					type="button"
					onClick={handleButtonClick}
				>
					<div data-is-open={isOpen} className={styles["icon-container"]}>
						<ChevronUp />
						<ChevronDown />
					</div>
					<div data-is-open={isOpen} className={styles["text-container"]}>
						<span>詳細を開く</span>
						<span>詳細を隠す</span>
					</div>
				</button>
			</summary>
			{children}
		</details>
	);
};
