// Splits parameters based on what you'd expect from a CLI
function parametrize(msgstring) {
	// const quotes = ["'", "\"", "`"];
	let enabled_quote = false;
	let output = [];
	let current_param = "";
	for (i = 0; i < msgstring.length; i++){
		let char = msgstring[i];
		let prev = msgstring[i-1] ? msgstring[i-1] : false;
		if (prev != "\\") { // Check if a quotation character was escaped
			let found_quote = false;
			if (char == "\"") found_quote = "double";
			if (char == "'") found_quote = "single";
			if (char == "`") found_quote = "slanted";
			if (found_quote) {
				if (!enabled_quote) {
					enabled_quote = found_quote; // new quote found - enable "quotation mode"
					continue; // omit found quote from string
				}
				else if (enabled_quote == found_quote) {
					enabled_quote = false; // Found end of quotated string - disable "quotation mode"
					continue; // omit found quote from string
				}
			}
		}
		if (char == " " && !enabled_quote) { // found a space and quotes are closed atm - param complete
			output.push(current_param);
			current_param = "";
			continue;
		}
		current_param += char;
	}
	if (current_param.length > 0) output.push(current_param); // push the last parameter to result
	if (enabled_quote) return false; // quotes wasn't closed properly - malformed string, return false.
	return output;
}


function test_parametrize() {
	console.log(parametrize(""));
	console.log(parametrize("hello world 1 2 3 2121473841 aqj hf"));
	console.log(parametrize("hello \"world this is a test\" 123"));
	console.log(parametrize("this \" is'nt good\" lmao"));
	console.log(parametrize("mismatched \"quotes"));
	console.log(parametrize("quotes in th\"e middle\""));
}

module.exports = parametrize;