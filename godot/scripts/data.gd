class_name GameData
extends RefCounted
## Copy from src/data.js and the day cards in src/main.js.

const CUSTOMERS: Array[Dictionary] = [
	{name = "Wren, the courier", skin = "#e8b892", cloak = "#3f7a6a", hat = "cap", hatc = "#7a4a2a"},
	{name = "Old Marrow", skin = "#c99272", cloak = "#5a4a7a", hat = "hood"},
	{name = "Sister Pell", skin = "#f0cfb0", cloak = "#2f3d66", hat = "pointed", hatc = "#1f2a4a"},
	{name = "Tobble", skin = "#a8d08a", cloak = "#8a5a2a", hat = "hair", hatc = "#3a5a2a"},
	{name = "Captain Isolde", skin = "#8a5a3c", cloak = "#9a2f2f", hat = "cap", hatc = "#c9a24a"},
	{name = "Fennick", skin = "#e0a888", cloak = "#6a7a3a", hat = "hair", hatc = "#d06a2a"},
	{name = "Mags of the mill", skin = "#d9a07c", cloak = "#b89a5a", hat = "hood"},
	{name = "A nervous knight", skin = "#f2c9a8", cloak = "#7a8a9a", hat = "cap", hatc = "#a9b4c0"},
	{name = "Grandmother Hask", skin = "#e6c2a2", cloak = "#4a2f4a", hat = "pointed", hatc = "#2a1a2a"},
	{name = "Pim, age nine and a half", skin = "#f5d0b0", cloak = "#d07a9a", hat = "hair", hatc = "#5a3a2a"},
]

## Order lines; {n} is the target and {n1} is target + 1 (line 3 in data.js).
const LINES: Array[String] = [
	"Something to keep my lantern lit all night. Strength {n}, please.",
	"My goat has the hiccups again. I need a {n}.",
	"A strength {n} tonic. Don’t ask what it’s for.",
	"The last shop gave me a {n1} and my eyebrows fell off. Exactly {n} this time.",
	"Courage draught, strength {n}. Quickly, I’m fighting a dragon at four.",
	"Grandmother swears by a {n}. She is never wrong.",
	"I’ll need a {n} before the moon is up.",
	"One sleeping draught. Strength {n}, nothing stronger.",
	"Something for my bad knee. A {n} usually does it.",
]

const THANKS: Array[String] = ["Perfect. I can smell it working already.", "Ah, just right. Keep the change.", "That’s the stuff.", "Lovely colour. Thank you!"]

const WALKOUT := "Hmph. I’ll try the shop across the bridge."

const FLAVOR: Array[String] = ["The queue is longer than yesterday.", "A travelling bard has been singing about your potions.", "The night market is busy.", "Someone left a five-star review on the tavern door.", "A storm rolls in. Everyone wants something warming.", "The rival shop across the bridge has closed for repairs.", "The royal court has heard of you.", "Pilgrims are passing through on their way north.", "A festival is in town and nobody is sleeping.", "The guild inspector is watching from the corner."]


static func line(template: String, n: int) -> String:
	return template.format({n = n, n1 = n + 1})


static func day_note(d: int) -> Dictionary:
	match d:
		2: return {title = "A delivery of cold things", text = "Shadow salt and Frost leaf take strength away. Sometimes it’s quicker to overshoot and pull back."}
		3: return {title = "The clock starts", text = "Word is out, and customers won’t wait forever. Today they’ll give you %d seconds each, and %d seconds less every day after, down to %d." % [Logic.patience_for(Logic.TIMER_DAY), Logic.TIMER_STEP, Logic.TIMER_FLOOR]}
		5: return {title = "Moonwater season", text = "Moonwater doubles whatever is already in the cauldron, so the order matters. Bone dust before Moonwater counts twice."}
		7: return {title = "The spice merchant visits", text = "Dragon pepper triples the brew. Add it early and everything after it counts for less."}
		9: return {title = "Fog off the marsh", text = "Mist moss halves the brew, but only when the strength is even."}
		11: return {title = "A troll pays in sweat", text = "Troll sweat takes away 12 in one go. Handy for big brews that overshoot."}
		13: return {title = "Starflower blooms", text = "Starflower divides the brew by three, but only when it splits evenly. 27 works. 28 doesn’t."}
		26: return {title = "A goblin settles his tab", text = "Goblin gold adds 25 in one go. Big orders get a lot shorter."}
		30: return {title = "A wyrm sheds its skin", text = "Wyrm scale multiplies the brew by four. Small numbers early can become huge ones."}
		34: return {title = "The hag next door is crying again", text = "Hag’s tear takes away 20. Useful for trimming a big multiplied brew down to size."}
		38: return {title = "Ashes from the old phoenix", text = "Phoenix ash divides the brew by five, but only when it ends in 0 or 5."}
		42: return {title = "Quicksilver from the mines", text = "Quicksilver divides the brew by four, but only when it splits evenly."}
		46: return {title = "The labels have faded", text = "Years of steam have worn the numbers off your jars. From now on you’ll have to remember what each ingredient does."}
	return {}
