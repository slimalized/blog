import fs from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";

const getFont = async (
	fontFilePath = "src/assets/zen-kaku-gothic-new_medium_500.ttf",
) => {
	try {
		return await fs.readFile(path.resolve(process.cwd(), fontFilePath));
	} catch (error) {
		console.error("Error reading font file:", error);
		throw new Error("Failed to load font.");
	}
};

export const generateOgpImage = async (title: string, date: string) => {
	const bgPath = path.resolve(process.cwd(), "src/assets/og-image-bg.png");
	const bgBuffer = await fs.readFile(bgPath);
	const bgSrc = `data:image/png;base64,${bgBuffer.toString("base64")}`;

	const iconPath = path.resolve(process.cwd(), "src/assets/favicon.svg");
	const iconBuffer = await fs.readFile(iconPath);
	const iconSrc = `data:image/svg+xml;base64,${iconBuffer.toString("base64")}`;

	const svg = await satori(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#fff",
				color: "#413a2d",
				fontWeight: 500,
			}}
		>
			<img
				src={bgSrc}
				width={1200}
				height={630}
				alt=""
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
				}}
			/>
			<div
				style={{
					width: 260,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					marginTop: 40,
					marginLeft: 56,
				}}
			>
				<p
					style={{
						fontSize: 32,
						lineHeight: 1.5,
					}}
				>
					slimalized.dev
				</p>
				<img
					src={iconSrc}
					alt="slimalized.dev icon"
					width={48}
					height={48}
					style={{
						padding: 8,
						width: 48,
						height: 48,
						borderRadius: "50%",
						backgroundColor: "rgb(253, 247, 236, 0.6)",
					}}
				/>
			</div>
			<p
				style={{
					fontSize: 56,
					lineHeight: 1.2,
					width: 1088,
					marginLeft: 56,
				}}
			>
				{title}
			</p>
			<p
				style={{
					fontSize: 40,
					lineHeight: 1.5,
					color: "#827a6b",
					marginLeft: 56,
				}}
			>
				{date}
			</p>
		</div>,
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: "Zen Kaku Gothic New",
					data: await getFont(),
					style: "normal",
					weight: 500,
				},
			],
		},
	);

	return await sharp(Buffer.from(svg)).png().toBuffer();
};
