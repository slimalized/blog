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
			<summary tabIndex={-1} onClick={handleSummaryClick} onKeyDown={() => {}}>
				<button type="button" onClick={handleButtonClick}>
					{isOpen ? <ChevronUp /> : <ChevronDown />}
					{isOpen ? "詳細を閉じる" : "詳細を開く"}
				</button>
			</summary>
			{children}
		</details>
	);
};
