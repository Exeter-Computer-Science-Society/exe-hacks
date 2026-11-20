/**
 * The boot intro: three terminal lines over the desktop, gone in about 0.8s.
 *
 * It never holds the page up. The desktop is already rendered underneath, the
 * typing and the fade are CSS animations (see .boot in exehacks.css), and the
 * inline script below runs before first paint, so nothing waits for React.
 *
 * The script turns the overlay on with <html data-boot="run"> only when all
 * of these hold: motion is allowed, and it has not already played in this tab
 * (sessionStorage). Any click or key ends it early. With no script, or with
 * prefers-reduced-motion, the overlay stays display: none.
 */

const LINES = ["booting exehacks.exe", "loading tracks...", "6-7 FEB 2027 // EXETER"]

const BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,k="exehacks-boot";
if(matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem(k))return;
sessionStorage.setItem(k,"1");
d.setAttribute("data-boot","run");
function end(e){
if(e&&e.type==="animationend"&&e.animationName!=="boot-out")return;
if(e&&e.key==="Escape")e.preventDefault();
d.setAttribute("data-boot","done");
removeEventListener("keydown",end,true);
removeEventListener("pointerdown",end,true);
removeEventListener("animationend",end,true);
}
addEventListener("keydown",end,true);
addEventListener("pointerdown",end,true);
addEventListener("animationend",end,true);
}catch(e){}})()`

export function BootScreen() {
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
			<div className="boot" aria-hidden="true">
				<div className="boot-lines">
					{LINES.map((line, index) => (
						<p key={line} className="boot-line" style={{ "--i": index, "--n": line.length + 2 }}>
							<span>&gt; {line}</span>
						</p>
					))}
				</div>
			</div>
		</>
	)
}
