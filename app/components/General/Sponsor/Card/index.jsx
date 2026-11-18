import Image from "next/image"

export default function SponsorCard({ sName, sSite, sImage, sLevel }) {
	return (
		<a className="sponsor-card" href={sSite} target="_blank" rel="noopener noreferrer">
			{sLevel ? <span className="sponsor-card-tier">{sLevel}</span> : null}
			<Image src={sImage} alt="" width={240} height={120} className="sponsor-card-img" />
			<span className="sponsor-card-name">{sName}</span>
		</a>
	)
}
